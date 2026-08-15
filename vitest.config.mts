import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Financial assertions should be read in full when they fail, not folded.
    reporters: ["verbose"],
    // Integration tests talk to a hosted database over the network, and the
    // concurrency test deliberately provokes serialisation retries.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Ledger tests assert exact balances, so files must not interleave against
    // the same database.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": root,
      // `server-only` throws when imported outside a React Server Component.
      // Service modules are exercised directly in Node here, so it is stubbed.
      "server-only": path.resolve(root, "tests/stubs/server-only.ts"),
    },
  },
});
