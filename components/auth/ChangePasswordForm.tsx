"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/ui/password-strength";
import { assessPasswordStrength } from "@/lib/auth/password.shared";

export function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const strength = assessPasswordStrength(password);
  const canSubmit =
    currentPassword.length > 0 &&
    strength.acceptable &&
    password === confirmPassword &&
    password !== currentPassword &&
    !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password, confirmPassword }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error?.details) setErrors(payload.error.details);
        setError(payload?.error?.message ?? "Could not change your password");
        setSubmitting(false);
        return;
      }

      setDone(true);
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setSubmitting(false);
      // Refresh so the "must change password" banner clears.
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-surface p-5 shadow-card"
      noValidate
    >
      <h2 className="font-heading text-base font-semibold text-ink">
        Change your password
      </h2>

      {done && (
        <Alert variant="success" className="mt-4">
          Your password has been changed and other devices have been signed out.
        </Alert>
      )}

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-5 space-y-5">
        <Field
          id="current-password"
          label="Current password"
          error={errors.currentPassword}
          required
        >
          {(props) => (
            <Input
              {...props}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          )}
        </Field>

        <Field id="new-password" label="New password" error={errors.password} required>
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 10 characters"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide passwords" : "Show passwords"}
                className="absolute right-1.5 top-1.5 flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
              >
                {show ? (
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
          id="confirm-new-password"
          label="Confirm new password"
          error={
            confirmPassword && password !== confirmPassword
              ? "Passwords do not match"
              : errors.confirmPassword
          }
          required
        >
          {(props) => (
            <Input
              {...props}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          )}
        </Field>
      </div>

      <Button type="submit" className="mt-5" disabled={!canSubmit}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <KeyRound className="size-4" aria-hidden="true" />
            Change password
          </>
        )}
      </Button>
    </form>
  );
}
