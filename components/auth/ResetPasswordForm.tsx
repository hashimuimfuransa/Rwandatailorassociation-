"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/ui/password-strength";
import { assessPasswordStrength } from "@/lib/auth/password.shared";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = assessPasswordStrength(password);
  const canSubmit =
    Boolean(token) &&
    strength.acceptable &&
    password === confirmPassword &&
    !submitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrors({});

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error?.details) setErrors(payload.error.details);
        setError(payload?.error?.message ?? "Could not reset your password.");
        setSubmitting(false);
        return;
      }

      setDone(true);
      // Give the confirmation a moment to be read before moving on.
      setTimeout(() => router.replace("/login"), 2500);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mt-8">
        <Alert variant="error" title="This link is not valid">
          The reset link is missing or incomplete. Request a new one from the{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            forgot password
          </Link>{" "}
          page.
        </Alert>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-8">
        <Alert variant="success" title="Password changed">
          <span className="flex items-center gap-2">
            Taking you to sign in…
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Field id="password" label="New password" error={errors.password} required>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 10 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        )}
      </Field>

      <PasswordStrength password={password} />

      <Field
        id="confirmPassword"
        label="Confirm new password"
        error={errors.confirmPassword}
        required
      >
        {(props) => (
          <Input
            {...props}
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <KeyRound className="size-4" aria-hidden="true" />
            Set new password
          </>
        )}
      </Button>
    </form>
  );
}
