import "dotenv/config";
import nodemailer from "nodemailer";
import { getEnv } from "../lib/env";
import { getEmailProvider } from "../lib/notifications/providers";

/**
 * SMTP connectivity and delivery check.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/smtp-check.ts [recipient]
 *
 * Two stages, deliberately separate:
 *
 *   1. `verify()` — proves the host resolves, the port is reachable, TLS is
 *      negotiated and the credentials are accepted. A failure here is a
 *      configuration problem and says so precisely.
 *   2. A real send through the application's own provider, so what is exercised
 *      is the code that will actually deliver members' notifications — not a
 *      one-off transporter that happens to work.
 *
 * Never prints the password. Presence is reported, the value is not.
 */
async function main() {
  const env = getEnv();
  const recipient = process.argv[2] ?? env.SMTP_USER;

  console.log("=== configuration ===");
  console.log("provider :", env.EMAIL_PROVIDER);
  console.log("host     :", env.SMTP_HOST || "(not set)");
  console.log("port     :", env.SMTP_PORT, env.SMTP_SECURE ? "(implicit TLS)" : "(STARTTLS)");
  console.log("user     :", env.SMTP_USER || "(not set)");
  console.log("password :", env.SMTP_PASSWORD ? `set, ${env.SMTP_PASSWORD.length} chars` : "NOT SET");
  console.log("from     :", env.EMAIL_FROM);
  console.log("to       :", recipient);

  if (env.EMAIL_PROVIDER !== "smtp") {
    console.error(
      "\nEMAIL_PROVIDER is not 'smtp' — nothing would be delivered. Set it and re-run."
    );
    process.exit(1);
  }

  if (!recipient) {
    console.error("\nNo recipient. Pass one as an argument.");
    process.exit(1);
  }

  console.log("\n=== 1. verifying connection and credentials ===");
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });

  try {
    await transporter.verify();
    console.log("OK — the server accepted the credentials.");
  } catch (error) {
    console.error("FAILED:", error instanceof Error ? error.message : error);
    console.error(
      "\nFor Gmail this is almost always one of:\n" +
        "  • the account has no App Password (ordinary passwords are refused)\n" +
        "  • 2-Step Verification is off, so App Passwords cannot be created\n" +
        "  • the password was pasted with its display spaces still in it\n" +
        "  • outbound port 587 is blocked on this network"
    );
    process.exit(1);
  }

  console.log("\n=== 2. sending through the application's provider ===");
  const provider = getEmailProvider();
  console.log("provider in use:", provider.name);

  const result = await provider.send({
    to: recipient,
    subject: "RTA — email delivery test",
    text:
      "This is a test from the RTA savings platform.\n\n" +
      "If you are reading it, member notifications — payment received, loan " +
      "decisions, withdrawal updates — will reach members by email.\n\n" +
      "No action is needed.",
    html:
      "<p>This is a test from the <strong>RTA savings platform</strong>.</p>" +
      "<p>If you are reading it, member notifications — payment received, loan " +
      "decisions, withdrawal updates — will reach members by email.</p>" +
      "<p>No action is needed.</p>",
  });

  console.log("result:", result);

  if (!result.ok) {
    console.error("\nThe send failed. The message above is the server's reason.");
    process.exit(1);
  }

  console.log(`\nDelivered. Check the inbox of ${recipient}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
