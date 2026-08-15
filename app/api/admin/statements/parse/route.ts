import { type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { requireApiPermission, resolveAssociationScope } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { getEnv } from "@/lib/env";
import { paymentLogger, serialiseError } from "@/lib/logger";
import {
  extractStatementText,
  parseStatementRows,
} from "@/lib/services/statement-import";
import { buildImportPreview } from "@/lib/services/statement-commit";
import {
  apiBadRequest,
  apiSuccess,
  apiTooManyRequests,
  withErrorHandling,
} from "@/lib/api/response";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

/**
 * POST /api/admin/statements/parse
 *
 * Accepts a bank statement PDF and returns what the system WOULD do with it.
 * Writes nothing.
 *
 * The separation matters: parsing a PDF is fragile enough that an
 * administrator must see every row, and who it would be credited to, before
 * any of it becomes a ledger entry. This endpoint produces that proposal;
 * /import commits the rows they tick.
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const context = await requireApiPermission(PERMISSIONS.PAYMENTS_RECONCILE);
  const associationId = resolveAssociationScope(context);

  if (!associationId) {
    return apiBadRequest(
      "Select an association before importing a statement"
    );
  }

  const ip = await getClientIp();
  const limit = checkRateLimit(`stmt-parse:${context.user.id}:${ip}`, RATE_LIMITS.EXPORT);
  if (!limit.allowed) {
    return apiTooManyRequests("Too many uploads. Please wait.", limit.retryAfter);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return apiBadRequest("Attach a PDF bank statement");
  }

  const env = getEnv();
  const maxBytes = env.STORAGE_MAX_UPLOAD_MB * 1024 * 1024;

  if (file.size > maxBytes) {
    return apiBadRequest(
      `The file is ${(file.size / 1024 / 1024).toFixed(1)} MB, above the ${env.STORAGE_MAX_UPLOAD_MB} MB limit`
    );
  }
  if (file.size === 0) {
    return apiBadRequest("The file is empty");
  }

  const buffer = await file.arrayBuffer();

  // Check the magic bytes rather than trusting the declared MIME type or the
  // filename — both are client-supplied and neither tells us what the bytes
  // actually are.
  const header = new Uint8Array(buffer.slice(0, 5));
  const isPdf = String.fromCharCode(...header).startsWith("%PDF-");

  if (!isPdf) {
    return apiBadRequest("That file is not a PDF");
  }

  const fileHash = createHash("sha256")
    .update(Buffer.from(buffer))
    .digest("hex")
    .slice(0, 32);

  const association = await prisma.association.findUniqueOrThrow({
    where: { id: associationId },
    select: { id: true, code: true, bankAccountNumber: true },
  });

  try {
    const { text, pageCount, extractionMode, pagesWithoutText } =
      await extractStatementText(buffer);

    if (!text.trim()) {
      return apiBadRequest(
        "No text could be read from this PDF. It may be a scanned image rather than a digital statement — ask your bank for a text-based PDF."
      );
    }

    const parsed = parseStatementRows(text);

    if (parsed.rows.length === 0) {
      return apiBadRequest(
        "No transactions could be recognised in this statement. Check that it is an account statement rather than a summary or receipt."
      );
    }

    const preview = await buildImportPreview(
      parsed.rows,
      association,
      env.PAYMENT_AUTO_MATCH_MIN_CONFIDENCE
    );

    // Warn if the statement appears to be for a different account than the
    // association's configured collection account — a genuine and easy mistake
    // when someone manages several accounts.
    const accountMismatch =
      parsed.detectedAccount &&
      association.bankAccountNumber &&
      !association.bankAccountNumber.includes(parsed.detectedAccount) &&
      !parsed.detectedAccount.includes(association.bankAccountNumber);

    paymentLogger.info(
      {
        adminId: context.user.id,
        fileName: file.name,
        fileHash,
        pageCount,
        extractionMode,
        rows: parsed.rows.length,
        coverage: parsed.coverage,
        wouldCredit: preview.summary.wouldCredit,
      },
      "bank statement parsed for preview"
    );

    return apiSuccess({
      fileName: file.name,
      fileHash,
      pageCount,
      // Which engine produced these rows. Anything other than "pdfplumber"
      // means a weaker parser was used and the UI says so — presenting all
      // three with equal confidence would be misleading.
      extractionMode,
      pagesWithoutText,
      coverage: parsed.coverage,
      detectedAccount: parsed.detectedAccount,
      detectedPeriod: parsed.detectedPeriod,
      accountMismatch: Boolean(accountMismatch),
      expectedAccount: association.bankAccountNumber,
      unparsedLines: parsed.unparsedLines,
      ...preview,
    });
  } catch (error) {
    paymentLogger.error(
      { fileName: file.name, ...serialiseError(error) },
      "statement parse failed"
    );

    return apiBadRequest(
      error instanceof Error
        ? `Could not read this statement: ${error.message}`
        : "Could not read this statement"
    );
  }
});
