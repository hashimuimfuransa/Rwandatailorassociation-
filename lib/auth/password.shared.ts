/**
 * Password rules shared between the browser and the server.
 *
 * Split out of lib/auth/password.ts because that module is `server-only` — it
 * holds the Argon2 hashing, which must never ship to a client bundle. The
 * policy constants and the strength meter, by contrast, need to run in both
 * places so the registration form and the API agree on what is acceptable.
 *
 * The server still re-validates everything here. Anything a browser checks is
 * advice, not enforcement.
 */

/** Below this, an attacker's dictionary does the work regardless of the hash. */
export const MIN_PASSWORD_LENGTH = 10;
/** Unbounded input is a cheap denial-of-service against a slow KDF. */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * A stable identifier for each piece of advice, so the browser can render it in
 * the reader's language. The English `issues` strings stay as they are — they
 * are what the API returns and what a log records — but a Kinyarwanda-speaking
 * applicant needs to be told what to fix in Kinyarwanda, and matching on
 * English prose to work that out would break the moment the wording changed.
 */
export type PasswordIssue =
  | "length"
  | "lowercase"
  | "uppercase"
  | "number"
  | "symbol"
  | "repeated"
  | "common";

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  issues: string[];
  /// The same advice as `issues`, in the same order, as translatable codes.
  codes: PasswordIssue[];
  acceptable: boolean;
}

const BANNED_SUBSTRINGS = [
  "password",
  "123456",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "rwanda",
  "tailors",
  "savings",
];

/**
 * Advisory strength assessment.
 *
 * Composition rules ("must contain a symbol") are weak security on their own
 * and mostly teach people to write Password1!. So the suggestions cover
 * composition, but the only things that actually *block* acceptance are length
 * and obvious dictionary content.
 */
export function assessPasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];
  const codes: PasswordIssue[] = [];

  /** Both forms of the same advice, kept in step by construction. */
  function advise(code: PasswordIssue, message: string) {
    codes.push(code);
    issues.push(message);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    advise("length", `Use at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!/[a-z]/.test(password)) advise("lowercase", "Add a lowercase letter");
  if (!/[A-Z]/.test(password)) advise("uppercase", "Add an uppercase letter");
  if (!/[0-9]/.test(password)) advise("number", "Add a number");
  if (!/[^A-Za-z0-9]/.test(password)) advise("symbol", "Add a symbol");
  if (/(.)\1{3,}/.test(password)) advise("repeated", "Avoid repeated characters");

  const lowered = password.toLowerCase();
  const containsBanned = BANNED_SUBSTRINGS.some((b) => lowered.includes(b));
  if (containsBanned) {
    advise("common", "Avoid common words and predictable patterns");
  }

  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (containsBanned) score = Math.min(score, 1);

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"] as const;

  return {
    score: clamped,
    label: labels[clamped],
    issues,
    codes,
    acceptable:
      password.length >= MIN_PASSWORD_LENGTH &&
      password.length <= MAX_PASSWORD_LENGTH &&
      !containsBanned,
  };
}
