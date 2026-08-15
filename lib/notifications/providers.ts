import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getEnv } from "@/lib/env";
import { notificationLogger, serialiseError } from "@/lib/logger";
import type {
  EmailMessage,
  EmailProvider,
  SendResult,
  SmsMessage,
  SmsProvider,
} from "@/lib/notifications/types";

/**
 * Channel adapters.
 *
 * Every one of them returns a SendResult rather than throwing. A failed SMS
 * must not roll back the loan approval that triggered it — the notification is
 * recorded as FAILED, retried by the worker, and the financial action stands.
 */

// -- Email --------------------------------------------------------------------

/** Development default: writes the message to the log instead of sending. */
class LogEmailProvider implements EmailProvider {
  readonly name = "log";

  async send(message: EmailMessage): Promise<SendResult> {
    notificationLogger.info(
      { to: message.to, subject: message.subject, body: message.text.slice(0, 400) },
      "EMAIL (not sent — EMAIL_PROVIDER=log)"
    );
    return { ok: true, providerMessageId: `log-${Date.now()}` };
  }
}

class SmtpEmailProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const env = getEnv();
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    });

    return this.transporter;
  }

  async send(message: EmailMessage): Promise<SendResult> {
    try {
      const info = await this.getTransporter().sendMail({
        from: getEnv().EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      return { ok: true, providerMessageId: info.messageId };
    } catch (error) {
      notificationLogger.error(
        { to: message.to, ...serialiseError(error) },
        "email send failed"
      );
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown SMTP error",
        retryable: true,
      };
    }
  }
}

// -- SMS ----------------------------------------------------------------------

class LogSmsProvider implements SmsProvider {
  readonly name = "log";

  async send(message: SmsMessage): Promise<SendResult> {
    notificationLogger.info(
      { to: message.to, body: message.body },
      "SMS (not sent — SMS_PROVIDER=log)"
    );
    return { ok: true, providerMessageId: `log-${Date.now()}` };
  }
}

/**
 * Africa's Talking — the common choice for Rwandan deployments.
 * https://developers.africastalking.com/docs/sms/sending/bulk
 */
class AfricasTalkingSmsProvider implements SmsProvider {
  readonly name = "africastalking";

  async send(message: SmsMessage): Promise<SendResult> {
    const env = getEnv();

    if (!env.AFRICASTALKING_API_KEY || !env.AFRICASTALKING_USERNAME) {
      return { ok: false, error: "Africa's Talking credentials are not configured" };
    }

    // Africa's Talking splits sandbox and production across two hosts, keyed
    // off the reserved username "sandbox". Sending a sandbox key to the live
    // host returns a bare 401 that reads as "your credentials are wrong" when
    // in fact they are fine and merely pointed at the wrong environment.
    //
    // Sandbox does NOT reach real handsets: it accepts the message and shows
    // it in the simulator only. That is what makes it useful for testing the
    // wiring, and what makes it useless as evidence that a member was texted.
    const host =
      env.AFRICASTALKING_USERNAME === "sandbox"
        ? "https://api.sandbox.africastalking.com"
        : "https://api.africastalking.com";

    try {
      const response = await fetch(`${host}/version1/messaging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          apiKey: env.AFRICASTALKING_API_KEY,
        },
        // `from` is omitted when no sender ID is configured. An alphanumeric
        // sender ID has to be registered and approved by the operators first,
        // and sending an unapproved one is rejected outright with
        // InvalidSenderId — whereas omitting it lets the platform fall back to
        // its own shared number, which works immediately. Leave SMS_SENDER_ID
        // empty until "RTA" has been approved.
        body: new URLSearchParams({
          username: env.AFRICASTALKING_USERNAME,
          to: message.to,
          message: message.body,
          ...(env.SMS_SENDER_ID ? { from: env.SMS_SENDER_ID } : {}),
        }),
        signal: AbortSignal.timeout(20_000),
      });

      // Read as text first. Africa's Talking answers authentication and
      // validation failures with a PLAIN-TEXT body ("The supplied
      // authentication is invalid"), not JSON — so parsing eagerly throws a
      // syntax error and destroys the only useful diagnostic in the response.
      // Whoever is configuring this then sees "Unexpected token 'T'" instead
      // of being told their credentials are wrong.
      const raw = await response.text();

      let payload: {
        SMSMessageData?: {
          Message?: string;
          Recipients?: { status?: string; messageId?: string }[];
        };
      } | null = null;

      try {
        payload = JSON.parse(raw);
      } catch {
        return {
          ok: false,
          error: `${response.status} ${raw.slice(0, 200).trim() || response.statusText}`,
          // A rejected credential will be rejected again next time.
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      const recipient = payload?.SMSMessageData?.Recipients?.[0];

      if (!response.ok || recipient?.status !== "Success") {
        return {
          ok: false,
          // `Message` carries the account-level reason, e.g. insufficient
          // balance, when there is no per-recipient status at all.
          error:
            recipient?.status ??
            payload?.SMSMessageData?.Message ??
            `HTTP ${response.status}`,
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      return { ok: true, providerMessageId: recipient.messageId };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "SMS send failed",
        retryable: true,
      };
    }
  }
}

class TwilioSmsProvider implements SmsProvider {
  readonly name = "twilio";

  async send(message: SmsMessage): Promise<SendResult> {
    const env = getEnv();

    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
      return { ok: false, error: "Twilio credentials are not configured" };
    }

    try {
      const credentials = Buffer.from(
        `${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`
      ).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: message.to,
            From: env.TWILIO_FROM_NUMBER,
            Body: message.body,
          }),
          signal: AbortSignal.timeout(20_000),
        }
      );

      const payload = (await response.json()) as { sid?: string; message?: string };

      if (!response.ok) {
        return {
          ok: false,
          error: payload.message ?? `HTTP ${response.status}`,
          retryable: response.status >= 500 || response.status === 429,
        };
      }

      return { ok: true, providerMessageId: payload.sid };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "SMS send failed",
        retryable: true,
      };
    }
  }
}

// -- Selection ----------------------------------------------------------------

let emailProvider: EmailProvider | null = null;
let smsProvider: SmsProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (emailProvider) return emailProvider;

  const env = getEnv();
  emailProvider = env.EMAIL_PROVIDER === "smtp" ? new SmtpEmailProvider() : new LogEmailProvider();

  return emailProvider;
}

export function getSmsProvider(): SmsProvider {
  if (smsProvider) return smsProvider;

  const env = getEnv();

  switch (env.SMS_PROVIDER) {
    case "africastalking":
      smsProvider = new AfricasTalkingSmsProvider();
      break;
    case "twilio":
      smsProvider = new TwilioSmsProvider();
      break;
    default:
      smsProvider = new LogSmsProvider();
  }

  return smsProvider;
}

/** Test hooks. */
export function setEmailProvider(provider: EmailProvider | null): void {
  emailProvider = provider;
}
export function setSmsProvider(provider: SmsProvider | null): void {
  smsProvider = provider;
}
