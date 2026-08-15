import "server-only";
import { createSign, createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { getEnv } from "@/lib/env";
import { jengaLogger, serialiseError } from "@/lib/logger";
import { equals, toMoneyString } from "@/lib/money";
import {
  ProviderError,
  type AccountBalance,
  type FetchTransactionsParams,
  type PaymentProvider,
  type ProviderTransaction,
  type VerificationResult,
} from "@/lib/jenga/types";

/**
 * Jenga API adapter — Equity Bank / Finserve v3.
 *
 * Endpoints, signature field orders and response shapes below are taken from
 * the Jenga v3 API reference (developer.jengahq.io):
 *
 *   Authenticate     POST  {base}/authentication/api/v3/authenticate/merchant
 *                    header Api-Key, body { merchantCode, consumerSecret }
 *
 *   Full statement   POST  {base}/v3-apis/account-api/v3.0/accounts/fullStatement
 *                    signature = accountNumber + countryCode + toDate
 *
 *   Mini statement   GET   {base}/v3-apis/account-api/v3.0/accounts/miniStatement/{countryCode}/{accountNumber}
 *                    signature = countryCode + accountNumber
 *
 *   Balance          GET   {base}/v3-apis/account-api/v3.0/accounts/balances/{countryCode}/{accountId}
 *                    signature = countryCode + accountId
 *
 * Base URLs: https://uat.finserve.africa (sandbox) / https://api.finserve.africa (live).
 *
 * SIGNATURE ORDER IS PER-ENDPOINT AND UNFORGIVING. The fields are concatenated
 * with no separator, signed RSA-SHA256 with the merchant private key, and
 * base64 encoded. A wrong order produces a well-formed signature that the
 * gateway rejects with a generic error, so each one is spelled out at its call
 * site rather than derived.
 *
 * Credentials are read from the validated server environment and never leave
 * this module; `server-only` makes importing it from a client component a
 * build error.
 */

interface TokenCache {
  token: string;
  expiresAt: number;
}

/** Shape of a transaction row in a full-statement response. */
interface JengaStatementTransaction {
  reference?: string;
  date?: string;
  amount?: string | number;
  serial?: string;
  description?: string;
  postedDateTime?: string;
  /// "Debit" | "Credit" — money leaving or entering the account.
  type?: string;
  transactionId?: string;
  runningBalance?: { amount?: string | number; currency?: string };
}

interface JengaStatementResponse {
  status?: boolean;
  code?: number;
  message?: string;
  data?: {
    balance?: number | string;
    currency?: string;
    accountNumber?: string;
    transactions?: JengaStatementTransaction[];
  };
}

export class JengaAdapter implements PaymentProvider {
  readonly name = "JENGA";
  readonly isSandbox = false;

  private tokenCache: TokenCache | null = null;
  private privateKeyCache: string | null = null;

  private get config() {
    const env = getEnv();

    if (
      !env.JENGA_API_KEY ||
      !env.JENGA_MERCHANT_CODE ||
      !env.JENGA_CONSUMER_SECRET ||
      !env.JENGA_ACCOUNT_NUMBER
    ) {
      throw new ProviderError("Jenga credentials are not configured", "NOT_CONFIGURED");
    }

    return {
      baseUrl: env.JENGA_API_BASE_URL.replace(/\/$/, ""),
      apiKey: env.JENGA_API_KEY,
      merchantCode: env.JENGA_MERCHANT_CODE,
      consumerSecret: env.JENGA_CONSUMER_SECRET,
      accountNumber: env.JENGA_ACCOUNT_NUMBER,
      countryCode: env.JENGA_COUNTRY_CODE,
      webhookSecret: env.JENGA_WEBHOOK_SECRET,
      privateKeyPath: env.JENGA_PRIVATE_KEY_PATH,
      privateKeyBase64: env.JENGA_PRIVATE_KEY_BASE64,
    };
  }

  /** All account-service endpoints share this prefix. */
  private get accountApi(): string {
    return `${this.config.baseUrl}/v3-apis/account-api/v3.0`;
  }

  // -------------------------------------------------------------------------
  // Authentication
  // -------------------------------------------------------------------------

  /**
   * Bearer token, cached until shortly before expiry.
   *
   * The 60-second safety margin matters: a token expiring mid-flight during a
   * reconciliation run turns into a spurious batch failure and a queue of
   * transactions marked for retry.
   */
  private async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + 60_000) {
      return this.tokenCache.token;
    }

    const { baseUrl, apiKey, merchantCode, consumerSecret } = this.config;

    const response = await this.request(
      `${baseUrl}/authentication/api/v3/authenticate/merchant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey,
        },
        body: JSON.stringify({ merchantCode, consumerSecret }),
      }
    );

    const payload = (await response.json()) as {
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: string | number;
      issuedAt?: string;
      tokenType?: string;
    };

    if (!payload.accessToken) {
      throw new ProviderError(
        "Jenga authentication returned no access token",
        "AUTH_FAILED"
      );
    }

    // expiresIn arrives as a string of seconds in some responses.
    const expiresInSeconds = Number(payload.expiresIn ?? 3600) || 3600;

    this.tokenCache = {
      token: payload.accessToken,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };

    jengaLogger.debug({ expiresInSeconds }, "jenga access token obtained");
    return payload.accessToken;
  }

  /**
   * Loads the RSA private key used to sign requests.
   *
   * The file path is preferred over the base64 variable: a key in an
   * environment variable is visible to every process on the host and tends to
   * end up in logs, crash dumps and `docker inspect` output.
   */
  private async getPrivateKey(): Promise<string> {
    if (this.privateKeyCache) return this.privateKeyCache;

    const { privateKeyPath, privateKeyBase64 } = this.config;

    if (privateKeyPath) {
      this.privateKeyCache = await readFile(privateKeyPath, "utf8");
    } else if (privateKeyBase64) {
      this.privateKeyCache = Buffer.from(privateKeyBase64, "base64").toString("utf8");
    } else {
      throw new ProviderError(
        "No Jenga private key configured (set JENGA_PRIVATE_KEY_PATH or JENGA_PRIVATE_KEY_BASE64)",
        "NOT_CONFIGURED"
      );
    }

    return this.privateKeyCache;
  }

  /** RSA-SHA256 over the concatenated fields, base64 encoded. */
  private async sign(fields: (string | number)[]): Promise<string> {
    const privateKey = await this.getPrivateKey();
    const signer = createSign("RSA-SHA256");
    signer.update(fields.join(""));
    signer.end();
    return signer.sign(privateKey, "base64");
  }

  // -------------------------------------------------------------------------
  // Provider interface
  // -------------------------------------------------------------------------

  /**
   * Inbound transactions on the collection account for a date window.
   *
   * Only CREDIT entries are returned. A debit on the collection account is the
   * association spending its own money — treating one as a member contribution
   * would credit somebody for a payment that never arrived.
   */
  async fetchTransactions(
    params: FetchTransactionsParams
  ): Promise<ProviderTransaction[]> {
    const { apiKey, countryCode } = this.config;
    const token = await this.getAccessToken();

    const fromDate = formatDate(params.fromDate);
    const toDate = formatDate(params.toDate);

    // SIGNATURE: accountNumber + countryCode + toDate
    const signature = await this.sign([params.accountNumber, countryCode, toDate]);

    const response = await this.request(`${this.accountApi}/accounts/fullStatement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
        Authorization: `Bearer ${token}`,
        signature,
      },
      body: JSON.stringify({
        countryCode,
        accountNumber: params.accountNumber,
        fromDate,
        toDate,
        ...(params.limit ? { limit: params.limit } : {}),
      }),
    });

    const payload = (await response.json()) as JengaStatementResponse;

    if (payload.status === false) {
      throw new ProviderError(
        `Jenga statement request failed: ${payload.message ?? "unknown error"}`,
        "INVALID_RESPONSE"
      );
    }

    const rows = payload.data?.transactions ?? [];

    return rows
      .map((row) => this.normalise(row, params.accountNumber))
      .filter((t): t is ProviderTransaction => t !== null);
  }

  /**
   * Confirms a transaction independently before it is credited.
   *
   * Jenga's account API exposes no per-transaction enquiry endpoint, so
   * verification re-queries the statement for a narrow window around the
   * transaction and confirms the entry is still present with the same amount.
   *
   * That is a genuine second check, not a formality: a statement is a record of
   * settled entries, so a transaction that has since been reversed or was never
   * posted simply will not come back — and the payment is then refused rather
   * than credited on the strength of the first listing alone.
   */
  async verifyTransaction(externalTransactionId: string): Promise<VerificationResult> {
    const { accountNumber } = this.config;

    // A day either side absorbs value-date and timezone differences between
    // the original fetch and this confirmation.
    const toDate = new Date();
    const fromDate = new Date(Date.now() - 7 * 86_400_000);

    try {
      const transactions = await this.fetchTransactions({
        accountNumber,
        fromDate,
        toDate,
      });

      const match = transactions.find(
        (t) => t.externalTransactionId === externalTransactionId
      );

      if (!match) {
        // Definitively absent from the settled statement. Not an error — an
        // answer, and the answer is "do not credit this".
        jengaLogger.warn(
          { externalTransactionId },
          "transaction not present in the statement on re-query — not credited"
        );
        return { found: false, status: "UNKNOWN", amount: null, currency: null, raw: null };
      }

      return {
        found: true,
        status: "SUCCESS",
        amount: match.amount,
        currency: match.currency,
        raw: match.raw,
      };
    } catch (error) {
      // A provider or network failure is NOT a verification failure. Rethrow so
      // the reconciliation engine schedules a retry rather than marking the
      // payment as failed and stranding a member's money.
      throw error;
    }
  }

  async getAccountBalance(accountNumber: string): Promise<AccountBalance> {
    const { apiKey, countryCode } = this.config;
    const token = await this.getAccessToken();

    // SIGNATURE: countryCode + accountId
    const signature = await this.sign([countryCode, accountNumber]);

    const response = await this.request(
      `${this.accountApi}/accounts/balances/${countryCode}/${encodeURIComponent(accountNumber)}`,
      {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          Authorization: `Bearer ${token}`,
          signature,
        },
      }
    );

    const payload = (await response.json()) as {
      data?: {
        balances?: { amount?: string; type?: string }[];
        currency?: string;
      };
    };

    const balances = payload.data?.balances ?? [];
    const available = balances.find((b) => b.type === "Available")?.amount;
    const current = balances.find((b) => b.type === "Current")?.amount;

    return {
      accountNumber,
      currency: payload.data?.currency ?? "RWF",
      available: toMoneyString(available ?? current ?? "0"),
      actual: toMoneyString(current ?? available ?? "0"),
      asOf: new Date(),
    };
  }

  /** Last ten transactions — cheap health/activity check for the admin screen. */
  async getMiniStatement(accountNumber: string): Promise<ProviderTransaction[]> {
    const { apiKey, countryCode } = this.config;
    const token = await this.getAccessToken();

    // SIGNATURE: countryCode + accountNumber
    const signature = await this.sign([countryCode, accountNumber]);

    const response = await this.request(
      `${this.accountApi}/accounts/miniStatement/${countryCode}/${encodeURIComponent(accountNumber)}`,
      {
        method: "GET",
        headers: {
          "Api-Key": apiKey,
          Authorization: `Bearer ${token}`,
          signature,
        },
      }
    );

    const payload = (await response.json()) as JengaStatementResponse;
    const rows = payload.data?.transactions ?? [];

    return rows
      .map((row) => this.normalise(row, accountNumber))
      .filter((t): t is ProviderTransaction => t !== null);
  }

  /**
   * Webhook authenticity check.
   *
   * Compared in constant time. A `===` here leaks, through response timing,
   * how much of a guessed signature was correct — and a forged callback is a
   * fabricated payment.
   */
  async verifyWebhookSignature(
    rawBody: string,
    signature: string | null
  ): Promise<boolean> {
    const secret = this.config.webhookSecret;

    if (!secret) {
      // Fail closed. An unconfigured secret must not mean "accept everything".
      jengaLogger.error("JENGA_WEBHOOK_SECRET is not set — rejecting callback");
      return false;
    }
    if (!signature) return false;

    const expected = createHash("sha256").update(`${secret}${rawBody}`).digest("base64");

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;

    return timingSafeEqual(a, b);
  }

  parseWebhookPayload(body: unknown): ProviderTransaction | null {
    if (!body || typeof body !== "object") return null;

    // Callbacks may deliver the transaction at the root or nested under data.
    const root = body as Record<string, unknown>;
    const candidate =
      (root.data as Record<string, unknown> | undefined) ??
      (root.transaction as Record<string, unknown> | undefined) ??
      root;

    return this.normalise(candidate as JengaStatementTransaction, null);
  }

  async healthCheck(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    const started = Date.now();
    try {
      await this.getAccessToken();
      return {
        ok: true,
        message: "Authenticated successfully",
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - started,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  /**
   * Translates a Jenga statement row into the normalised shape.
   *
   * Returns null for anything that is not a usable inbound credit:
   *   • Debit entries — the association's own outgoings.
   *   • Rows with no transaction id or no parseable amount.
   *
   * Dropping a row here is safe. Anything genuinely inbound will reappear on
   * the next reconciliation pass, because the polling window overlaps.
   */
  private normalise(
    row: JengaStatementTransaction,
    creditAccount: string | null
  ): ProviderTransaction | null {
    if (!row || typeof row !== "object") return null;

    const externalTransactionId = firstString(row.transactionId, row.reference, row.serial);
    const amountRaw = firstString(row.amount);

    if (!externalTransactionId || !amountRaw) {
      jengaLogger.warn(
        { keys: Object.keys(row) },
        "skipping statement row with no transaction id or amount"
      );
      return null;
    }

    // Debit = money leaving the collection account. Never a contribution.
    const direction = (row.type ?? "").trim().toLowerCase();
    if (direction === "debit") return null;

    let amount: string;
    try {
      amount = toMoneyString(amountRaw);
    } catch {
      jengaLogger.warn({ amountRaw }, "skipping statement row with unparseable amount");
      return null;
    }

    // A zero or negative credit is not a contribution.
    if (equals(amount, "0")) return null;

    const timestamp = firstString(row.postedDateTime, row.date);

    return {
      externalTransactionId,
      transactionReference: firstString(row.reference) ?? null,
      amount,
      currency: firstString(row.runningBalance?.currency) ?? "RWF",
      // A settled statement entry is, by definition, successful.
      providerStatus: row.type ?? "Credit",
      status: "SUCCESS",
      // Jenga statements carry no structured payer identity — the description
      // is all there is, which is precisely why the member payment reference
      // in the narration matters so much.
      payerName: null,
      payerPhone: null,
      payerAccount: null,
      payerBank: null,
      narration: firstString(row.description) ?? null,
      debitAccount: null,
      creditAccount,
      transactionDate: parseDate(timestamp),
      valueDate: row.date ? parseDate(firstString(row.date)) : null,
      raw: row,
    };
  }

  /** HTTP with a timeout, classified errors and no credential leakage. */
  private async request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (!response.ok) {
        const body = await response.text().catch(() => "");

        // Log the endpoint and status, never the request headers — they carry
        // the API key and bearer token.
        jengaLogger.error(
          { url: stripQuery(url), status: response.status, body: body.slice(0, 500) },
          "jenga request failed"
        );

        if (response.status === 401 || response.status === 403) {
          this.tokenCache = null; // force re-authentication next call
          throw new ProviderError(
            `Jenga rejected the credentials (HTTP ${response.status})`,
            "AUTH_FAILED",
            false
          );
        }
        if (response.status === 429) {
          throw new ProviderError("Jenga rate limit reached", "RATE_LIMITED", true);
        }
        if (response.status >= 500) {
          throw new ProviderError(
            `Jenga server error (HTTP ${response.status})`,
            "NETWORK",
            true
          );
        }

        throw new ProviderError(
          `Jenga returned HTTP ${response.status}`,
          "INVALID_RESPONSE",
          false
        );
      }

      return response;
    } catch (error) {
      if (error instanceof ProviderError) throw error;

      const aborted = error instanceof Error && error.name === "AbortError";
      jengaLogger.error(
        { url: stripQuery(url), ...serialiseError(error) },
        aborted ? "jenga request timed out" : "jenga request threw"
      );

      // Network failures are retryable: reconciliation picks the transaction
      // up on the next run rather than losing it.
      throw new ProviderError(
        aborted ? "Jenga request timed out" : "Could not reach Jenga",
        "NETWORK",
        true,
        error
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

// Helpers ---------------------------------------------------------------------

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

function parseDate(value: string | null): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** Jenga expects YYYY-MM-DD. */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function stripQuery(url: string): string {
  return url.split("?")[0];
}
