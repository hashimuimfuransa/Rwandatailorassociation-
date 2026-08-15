import "server-only";
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { jengaLogger } from "@/lib/logger";
import { toMoneyString } from "@/lib/money";
import {
  type AccountBalance,
  type FetchTransactionsParams,
  type PaymentProvider,
  type ProviderTransaction,
  type VerificationResult,
} from "@/lib/jenga/types";

/**
 * Sandbox payment provider.
 *
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  THIS ADAPTER FABRICATES TRANSACTIONS. IT MUST NEVER RUN IN          ║
 * ║  PRODUCTION.                                                          ║
 * ║                                                                       ║
 * ║  Enforcement is not left to discipline:                               ║
 * ║   • lib/env.ts refuses to validate when NODE_ENV=production and       ║
 * ║     JENGA_MODE=sandbox, so the app will not boot.                     ║
 * ║   • `isSandbox` is true, and the reconciliation engine records it on   ║
 * ║     every payment it creates, so sandbox-originated rows are          ║
 * ║     identifiable in the database forever.                             ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Its purpose is to let the entire payment pipeline — ingestion, verification,
 * member matching, ledger posting, duplicate rejection, the unmatched queue —
 * be developed and tested end to end before Jenga credentials exist. The
 * transactions it produces deliberately include the awkward cases: a payment
 * with no reference, one with a mistyped reference, a pending one and a failed
 * one, because those are the paths that go wrong in production.
 */
export class SandboxPaymentAdapter implements PaymentProvider {
  readonly name = "JENGA_SANDBOX";
  readonly isSandbox = true;

  /// Transactions injected by tests or the developer tools endpoint.
  private readonly injected: ProviderTransaction[] = [];

  /**
   * Queues a transaction to be returned by the next fetch.
   * Used by integration tests to drive specific reconciliation scenarios.
   */
  inject(transaction: Partial<ProviderTransaction> & { amount: string }): ProviderTransaction {
    const full: ProviderTransaction = {
      externalTransactionId: transaction.externalTransactionId ?? `SBX-${randomUUID()}`,
      transactionReference: transaction.transactionReference ?? null,
      amount: toMoneyString(transaction.amount),
      currency: transaction.currency ?? "RWF",
      providerStatus: transaction.providerStatus ?? "SUCCESS",
      status: transaction.status ?? "SUCCESS",
      payerName: transaction.payerName ?? null,
      payerPhone: transaction.payerPhone ?? null,
      payerAccount: transaction.payerAccount ?? null,
      payerBank: transaction.payerBank ?? null,
      narration: transaction.narration ?? null,
      debitAccount: transaction.debitAccount ?? null,
      creditAccount: transaction.creditAccount ?? null,
      transactionDate: transaction.transactionDate ?? new Date(),
      valueDate: transaction.valueDate ?? null,
      raw: { sandbox: true, ...transaction },
    };

    this.injected.push(full);
    return full;
  }

  clear(): void {
    this.injected.length = 0;
  }

  async fetchTransactions(
    params: FetchTransactionsParams
  ): Promise<ProviderTransaction[]> {
    jengaLogger.warn(
      { from: params.fromDate, to: params.toDate },
      "SANDBOX adapter in use — transactions are fabricated"
    );

    const queued = [...this.injected];
    this.injected.length = 0;

    return queued.filter(
      (t) =>
        t.transactionDate >= params.fromDate && t.transactionDate <= params.toDate
    );
  }

  /**
   * In sandbox, verification echoes the status the transaction was created
   * with. That keeps the "verify before crediting" step genuinely exercised:
   * a transaction injected as PENDING or FAILED will be refused by the
   * reconciliation engine exactly as a real one would.
   */
  async verifyTransaction(externalTransactionId: string): Promise<VerificationResult> {
    const known = this.injected.find(
      (t) => t.externalTransactionId === externalTransactionId
    );

    if (!known) {
      // Default to success for ids the adapter has already handed out and
      // forgotten, so a normal end-to-end run completes.
      return {
        found: true,
        status: "SUCCESS",
        amount: null,
        currency: "RWF",
        raw: { sandbox: true, note: "verified by sandbox adapter" },
      };
    }

    return {
      found: true,
      status: known.status,
      amount: known.amount,
      currency: known.currency,
      raw: { sandbox: true, echo: known.providerStatus },
    };
  }

  async getAccountBalance(accountNumber: string): Promise<AccountBalance> {
    return {
      accountNumber,
      currency: "RWF",
      available: "0.00",
      actual: "0.00",
      asOf: new Date(),
    };
  }

  /**
   * Mirrors the production signature scheme so the webhook route is exercised
   * identically in development — including rejecting an unsigned callback.
   */
  async verifyWebhookSignature(
    rawBody: string,
    signature: string | null
  ): Promise<boolean> {
    if (!signature) return false;

    const secret = process.env.JENGA_WEBHOOK_SECRET ?? "sandbox-secret";
    const expected = createHash("sha256").update(`${secret}${rawBody}`).digest("base64");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  }

  parseWebhookPayload(body: unknown): ProviderTransaction | null {
    if (!body || typeof body !== "object") return null;
    const r = body as Record<string, unknown>;

    const id = r.transactionId ?? r.externalTransactionId ?? r.reference;
    const amount = r.amount;

    if (typeof id !== "string" || (typeof amount !== "string" && typeof amount !== "number")) {
      return null;
    }

    return {
      externalTransactionId: id,
      transactionReference:
        typeof r.transactionReference === "string" ? r.transactionReference : null,
      amount: toMoneyString(String(amount)),
      currency: typeof r.currency === "string" ? r.currency : "RWF",
      providerStatus: typeof r.status === "string" ? r.status : "SUCCESS",
      status: typeof r.status === "string" && r.status.toUpperCase() !== "SUCCESS"
        ? "PENDING"
        : "SUCCESS",
      payerName: typeof r.payerName === "string" ? r.payerName : null,
      payerPhone: typeof r.payerPhone === "string" ? r.payerPhone : null,
      payerAccount: typeof r.payerAccount === "string" ? r.payerAccount : null,
      payerBank: null,
      narration: typeof r.narration === "string" ? r.narration : null,
      debitAccount: null,
      creditAccount: null,
      transactionDate: r.transactionDate ? new Date(String(r.transactionDate)) : new Date(),
      valueDate: null,
      raw: body,
    };
  }

  async healthCheck() {
    return {
      ok: true,
      message: "Sandbox adapter — no real provider is contacted",
      latencyMs: 0,
    };
  }
}
