"use client";

import { assessPasswordStrength } from "@/lib/auth/password.shared";
import { useLanguage } from "@/components/LanguageProvider";
import { fill } from "@/lib/i18n/fill";
import { cn } from "@/lib/utils";

/**
 * Live password strength meter.
 *
 * Runs the same `assessPasswordStrength` the server uses, so the browser can
 * never encourage a password the API will then reject. Advisory only — the
 * server re-assesses on submit.
 *
 * The wording comes from the dictionary rather than from the assessment, which
 * returns English: this is the one place a form tells someone their answer is
 * not good enough, and it is no use in a language they do not read. The
 * assessment's stable codes are what the two sides agree on.
 */
export function PasswordStrength({ password }: { password: string }) {
  const { d } = useLanguage();
  const copy = d.auth.password;

  if (!password) return null;

  const { score, codes } = assessPasswordStrength(password);

  const colours = [
    "bg-red-500",
    "bg-red-400",
    "bg-gold",
    "bg-success",
    "bg-emerald-600",
  ] as const;

  const textColours = [
    "text-red-600",
    "text-red-600",
    "text-amber-700",
    "text-emerald-700",
    "text-emerald-700",
  ] as const;

  const label = copy.strength[score];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="flex h-1.5 flex-1 gap-1"
          role="meter"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={fill(copy.strengthLabel, { label })}
        >
          {[0, 1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn(
                "flex-1 rounded-full transition-colors",
                index < score ? colours[score] : "bg-border"
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-semibold", textColours[score])}>
          {label}
        </span>
      </div>

      {codes.length > 0 && (
        <p className="text-xs leading-relaxed text-ink-muted">
          {codes
            .slice(0, 2)
            .map((code) => copy.issue[code])
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
