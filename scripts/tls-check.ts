import "dotenv/config";
import { Client } from "pg";
import { TLSSocket } from "node:tls";

/**
 * Confirms the application's database connection is actually TLS-encrypted.
 *
 * `pg_stat_ssl` is misleading on Neon: TLS terminates at their proxy, so the
 * server-side view reports the unencrypted proxy→Postgres hop and shows
 * ssl = false even when the client link is fully encrypted. The only honest
 * check is to look at the socket this process is holding.
 */
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const stream = (client as unknown as { connection: { stream: unknown } })
    .connection.stream;

  if (stream instanceof TLSSocket) {
    const cipher = stream.getCipher();
    const cert = stream.getPeerCertificate();
    console.log("TLS:         ENCRYPTED");
    console.log("protocol:   ", stream.getProtocol());
    console.log("cipher:     ", cipher?.name);
    console.log("authorized: ", stream.authorized ? "yes (certificate verified)" : `no — ${stream.authorizationError}`);
    console.log("subject:    ", cert?.subject?.CN ?? "(none)");
    console.log("issuer:     ", cert?.issuer?.O ?? "(none)");
    console.log("valid to:   ", cert?.valid_to ?? "(none)");
  } else {
    console.log("TLS:         *** PLAINTEXT — connection is NOT encrypted ***");
    process.exitCode = 1;
  }

  await client.end();
}

main().catch((error) => {
  console.error("TLS check failed:", error.message);
  process.exit(1);
});
