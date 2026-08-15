/**
 * Payment provider contract.
 *
 * Deliberately provider-agnostic. Nothing outside lib/jenga/ imports a Jenga
 * type — the reconciliation engine, the webhook handler and the admin screens
 * all speak this interface. Adding MTN MoMo, Airtel Money or a second bank
 * later means writing one more adapter, not touching the ledger.
 *
 * The shapes below are what the SYSTEM needs. Each adapter is responsible for
 * translating its provider's payload into them, and for keeping the raw
 * response so nothing is lost in translation.
 */

/** Normalised transaction status. Adapters map provider strings onto this. */
export type ProviderTransactionStatus =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "REVERSED"
  | "UNKNOWN";

/**
 * One inbound transaction as reported by a provider.
 *
 * `raw` is mandatory. When a payment is later disputed, the only defensible
 * answer is the provider's own words, not our interpretation of them.
 */
export interface ProviderTransaction {
  /// The provider's unique id for this transaction. The duplicate guard.
  externalTransactionId: string;
  /// The provider's secondary reference, if it issues one.
  transactionReference: string | null;
  /// Exact decimal string. Never a float.
  amount: string;
  currency: string;
  /// Provider's verbatim status text, kept unmapped for audit.
  providerStatus: string;
  status: ProviderTransactionStatus;

  payerName: string | null;
  payerPhone: string | null;
  payerAccount: string | null;
  payerBank: string | null;
  /// Free text the payer supplied. Where a member payment reference is found.
  narration: string | null;

  debitAccount: string | null;
  creditAccount: string | null;

  transactionDate: Date;
  valueDate: Date | null;

  raw: unknown;
}

export interface FetchTransactionsParams {
  accountNumber: string;
  fromDate: Date;
  toDate: Date;
  limit?: number;
}

/** Result of re-querying a single transaction to confirm it really happened. */
export interface VerificationResult {
  found: boolean;
  status: ProviderTransactionStatus;
  amount: string | null;
  currency: string | null;
  raw: unknown;
}

export interface AccountBalance {
  accountNumber: string;
  currency: string;
  available: string;
  actual: string;
  asOf: Date;
}

/**
 * What every payment provider adapter must implement.
 *
 * Read-only by design at this stage: the platform ingests and verifies
 * incoming payments but does not initiate outgoing ones. Disbursement and
 * payout are recorded as ledger entries against a manual bank transfer, so a
 * bug here can never move money out of the association's account.
 */
export interface PaymentProvider {
  readonly name: string;
  /// True when this adapter fabricates data and must never back real balances.
  readonly isSandbox: boolean;

  /** Recent inbound transactions on the collection account. */
  fetchTransactions(params: FetchTransactionsParams): Promise<ProviderTransaction[]>;

  /**
   * Re-queries one transaction directly with the provider.
   *
   * The reconciliation engine calls this before crediting anyone. A
   * transaction appearing in a statement listing is NOT proof it succeeded —
   * it may be pending, or later reversed.
   */
  verifyTransaction(externalTransactionId: string): Promise<VerificationResult>;

  /** Collection account balance, for the admin integrations screen. */
  getAccountBalance(accountNumber: string): Promise<AccountBalance>;

  /**
   * Validates a webhook callback's authenticity.
   * Returning false must cause the request to be rejected unprocessed.
   */
  verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean>;

  /** Parses a verified webhook body into the normalised shape. */
  parseWebhookPayload(body: unknown): ProviderTransaction | null;

  /** Cheap connectivity/credential check for the health screen. */
  healthCheck(): Promise<{ ok: boolean; message: string; latencyMs: number }>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly code:
      | "AUTH_FAILED"
      | "NETWORK"
      | "RATE_LIMITED"
      | "INVALID_RESPONSE"
      | "NOT_CONFIGURED"
      | "UNKNOWN",
    /// True when a retry might succeed. Drives the reconciliation retry queue.
    readonly retryable: boolean = false,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
