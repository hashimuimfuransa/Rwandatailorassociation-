import "server-only";
import { getEnv } from "@/lib/env";
import { jengaLogger } from "@/lib/logger";
import { JengaAdapter } from "@/lib/jenga/jenga-adapter";
import { SandboxPaymentAdapter } from "@/lib/jenga/sandbox-adapter";
import type { PaymentProvider } from "@/lib/jenga/types";

export * from "@/lib/jenga/types";

/**
 * Payment provider selection.
 *
 * ONE place decides whether the platform talks to a real bank or to a mock.
 * Everything downstream — reconciliation, the webhook handler, the admin
 * screens — receives a `PaymentProvider` and neither knows nor cares which.
 *
 * The choice is driven by JENGA_MODE, and lib/env.ts refuses to validate a
 * production environment set to `sandbox`, so the mock cannot reach production
 * by way of a forgotten variable.
 */

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const env = getEnv();

  if (env.JENGA_MODE === "sandbox") {
    jengaLogger.warn(
      "Payment provider: SANDBOX. Transactions are fabricated and must not back real balances."
    );
    cached = new SandboxPaymentAdapter();
  } else {
    jengaLogger.info(
      { baseUrl: env.JENGA_API_BASE_URL },
      "Payment provider: Jenga (live)"
    );
    cached = new JengaAdapter();
  }

  return cached;
}

/** Test hook — lets integration tests drive a specific adapter instance. */
export function setPaymentProvider(provider: PaymentProvider | null): void {
  cached = provider;
}

export { JengaAdapter, SandboxPaymentAdapter };
