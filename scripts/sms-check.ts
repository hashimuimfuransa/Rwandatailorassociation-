import "dotenv/config";
import { getEnv } from "../lib/env";
import { getSmsProvider } from "../lib/notifications/providers";

/**
 * SMS connectivity and delivery check.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/sms-check.ts +250788123456
 *
 * Sends through the application's own provider, so what is exercised is the
 * code that will actually reach members — not a one-off request that happens
 * to work.
 *
 * Never prints the API key. Presence is reported, the value is not.
 */
async function main() {
  const env = getEnv();
  const recipient = process.argv[2];

  console.log("=== configuration ===");
  console.log("provider :", env.SMS_PROVIDER);
  console.log("sender id:", env.SMS_SENDER_ID);
  console.log("username :", env.AFRICASTALKING_USERNAME || "(not set)");
  console.log(
    "api key  :",
    env.AFRICASTALKING_API_KEY
      ? `set, ${env.AFRICASTALKING_API_KEY.length} chars`
      : "NOT SET"
  );

  if (!recipient) {
    console.error(
      "\nPass a recipient in international format, e.g.\n" +
        "  npx tsx --tsconfig tsconfig.scripts.json scripts/sms-check.ts +250788123456"
    );
    process.exit(1);
  }

  if (env.SMS_PROVIDER === "log") {
    console.error(
      "\nSMS_PROVIDER=log — the message would only be written to the log.\n" +
        "Set SMS_PROVIDER=africastalking to send for real."
    );
    process.exit(1);
  }

  console.log("to       :", recipient);

  const provider = getSmsProvider();
  console.log("\nprovider in use:", provider.name);

  const result = await provider.send({
    to: recipient,
    body:
      "RTA test: your savings platform can send SMS. " +
      "Members will receive payment and loan updates this way. No action needed.",
  });

  console.log("result:", result);

  if (!result.ok) {
    console.error(
      "\nThe send failed. Common causes with Africa's Talking:\n" +
        "  • the username is wrong — it is the API username from the dashboard,\n" +
        "    not your personal name, and it is 'sandbox' for the sandbox app\n" +
        "  • the API key belongs to a different app than the username\n" +
        "  • the sender ID (alphanumeric) has not been approved yet; until it is,\n" +
        "    leave SMS_SENDER_ID unset or use a shortcode you own\n" +
        "  • the account has no credit\n" +
        "  • the number is not in international format (+250…)"
    );
    process.exit(1);
  }

  console.log(`\nAccepted by the provider. Check the handset on ${recipient}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
