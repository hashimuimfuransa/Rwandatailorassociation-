"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MailCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useLanguage } from "@/components/LanguageProvider";

export default function ForgotPasswordForm() {
  const { d } = useLanguage();
  const copy = d.auth.forgot;

  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      if (response.status === 429) {
        const payload = await response.json();
        setError(payload?.error?.message ?? copy.tooManyRequests);
        setSubmitting(false);
        return;
      }

      // Any other outcome shows the same confirmation. The server deliberately
      // does not reveal whether the account exists, and the UI must not undo
      // that by rendering a different state for a missing account.
      setSent(true);
    } catch {
      setError(d.common.serverUnreachable);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8">
        <Alert variant="success" title={copy.sentTitle}>
          {copy.sentBody}
        </Alert>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-ink-muted">
            {copy.notReceived}{" "}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {copy.tryAnother}
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Field id="identifier" label={copy.identifier}>
        {(props) => (
          <Input
            {...props}
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder={d.auth.login.identifierPlaceholder}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {copy.submitting}
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            {copy.submit}
          </>
        )}
      </Button>
    </form>
  );
}
