import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getPaymentProvider } from "@/lib/jenga";
import { ingestAndProcess } from "@/lib/services/reconciliation";
import { paymentLogger, serialiseError } from "@/lib/logger";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/api/rate-limit";

/**
 * POST /api/payments/webhook
 *
 * Inbound payment callback from the provider.
 *
 * PUBLIC BUT NOT UNAUTHENTICATED. There is no session here — the caller is a
 * bank, not a user — so the signature IS the authentication. An unsigned or
 * badly signed callback is rejected before a single field is read, because a
 * forged callback is a fabricated payment.
 *
 * Deliberate design choices:
 *
 *  • The raw body is read as text and the signature checked against those
 *    exact bytes. Parsing first and re-serialising would change whitespace and
 *    key order, and the signature would never match.
 *
 *  • A 200 is returned for anything that is not a transient failure, including
 *    payloads we cannot use. Providers retry non-2xx responses, sometimes
 *    aggressively, and a permanently malformed callback retried forever is a
 *    self-inflicted denial of service. What matters is that the transaction is
 *    recorded, and the reconciliation poller is the safety net for anything
 *    lost here.
 *
 *  • Processing is idempotent, so a provider retrying a callback it already
 *    delivered cannot double-credit anyone.
 */
export async function POST(request: NextRequest) {
  const ip = await getClientIp();

  const limit = checkRateLimit(`webhook:${ip}`, RATE_LIMITS.WEBHOOK);
  if (!limit.allowed) {
    paymentLogger.warn({ ip }, "webhook rate limit exceeded");
    return Response.json({ received: false }, { status: 429 });
  }

  const rawBody = await request.text();

  // Providers differ on the header name; check the ones Jenga has used.
  const signature =
    request.headers.get("signature") ??
    request.headers.get("x-signature") ??
    request.headers.get("x-jenga-signature");

  const provider = getPaymentProvider();

  const authentic = await provider.verifyWebhookSignature(rawBody, signature);
  if (!authentic) {
    paymentLogger.error(
      { ip, hasSignature: Boolean(signature), bodyLength: rawBody.length },
      "REJECTED webhook with invalid or missing signature"
    );
    // 401, not 200: this one the provider should notice and we should see.
    return Response.json({ received: false, error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    paymentLogger.error({ ip }, "webhook body was not valid JSON");
    return Response.json({ received: true, processed: false }, { status: 200 });
  }

  const transaction = provider.parseWebhookPayload(body);
  if (!transaction) {
    paymentLogger.error({ ip }, "webhook payload could not be interpreted");
    return Response.json({ received: true, processed: false }, { status: 200 });
  }

  try {
    // Which association owns the destination account. Single-tenant today;
    // when several associations each have their own collection account this
    // resolves by matching creditAccount against Association.bankAccountNumber.
    const association = await resolveAssociation(transaction.creditAccount);

    if (!association) {
      paymentLogger.error(
        {
          externalTransactionId: transaction.externalTransactionId,
          creditAccount: transaction.creditAccount,
        },
        "webhook for an unknown collection account — not processed"
      );
      return Response.json({ received: true, processed: false }, { status: 200 });
    }

    const outcome = await ingestAndProcess(
      transaction,
      association,
      provider.name,
      "WEBHOOK"
    );

    paymentLogger.info(
      { externalTransactionId: transaction.externalTransactionId, outcome },
      "webhook processed"
    );

    return Response.json({ received: true, processed: true, outcome }, { status: 200 });
  } catch (error) {
    paymentLogger.error(
      {
        externalTransactionId: transaction.externalTransactionId,
        ...serialiseError(error),
      },
      "webhook processing failed"
    );

    // 500 here IS appropriate: a genuine server-side failure is exactly the
    // case where a provider retry helps, and the transaction has not been
    // recorded.
    return Response.json({ received: true, processed: false }, { status: 500 });
  }
}

async function resolveAssociation(creditAccount: string | null) {
  if (creditAccount) {
    const byAccount = await prisma.association.findFirst({
      where: { bankAccountNumber: creditAccount, status: "ACTIVE" },
      select: { id: true, code: true, currency: true },
    });
    if (byAccount) return byAccount;
  }

  // Fallback for the single-tenant deployment, where every payment belongs to
  // the one active association.
  const associations = await prisma.association.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, code: true, currency: true },
    take: 2,
  });

  // With more than one active association and no way to tell them apart, the
  // safe answer is none — guessing would credit the wrong tenant's members.
  return associations.length === 1 ? associations[0] : null;
}

/** Providers commonly probe the endpoint before enabling callbacks. */
export async function GET() {
  return Response.json({ status: "ok", endpoint: "payment-webhook" }, { status: 200 });
}
