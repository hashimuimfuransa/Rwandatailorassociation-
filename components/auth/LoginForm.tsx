"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { safeRedirectPath } from "@/lib/safe-redirect";

interface LoginResponse {
  role: "MEMBER" | "ADMIN" | "SUPER_ADMIN";
  mustChangePassword: boolean;
  redirectTo: string;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to sign in. Please try again.");
        setSubmitting(false);
        return;
      }

      const data = payload as LoginResponse;

      // The `next` parameter is attacker-controllable, so it is validated to be
      // a same-site path before use. Without that check, a crafted login link
      // would bounce a freshly authenticated user to an external site.
      const requested = safeRedirectPath(searchParams.get("next"));
      const destination = data.mustChangePassword
        ? data.redirectTo
        : (requested ?? data.redirectTo);

      // refresh() so server components re-render with the new session cookie.
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Field
        id="identifier"
        label="Email or phone number"
        hint="Use the email or phone number registered with the association"
      >
        {(props) => (
          <Input
            {...props}
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com or 0788123456"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />
        )}
      </Field>

      <Field id="password" label="Password">
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
              required
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

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          <>
            <LogIn className="size-4" aria-hidden="true" />
            Sign in
          </>
        )}
      </Button>
    </form>
  );
}
