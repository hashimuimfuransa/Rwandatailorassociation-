"use client";

import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

/**
 * The member's payment reference, given prominence on the dashboard.
 *
 * This is the single most operationally important string a member has. A
 * payment that arrives quoting it is matched to their savings account
 * automatically; one that arrives without it drops into an administrator's
 * unmatched queue and waits for someone to attribute it by hand. Making it
 * easy to find and copy directly reduces that queue.
 */
export function PaymentReferenceCard({ reference }: { reference: string }) {
  const { d } = useLanguage();
  const copyText = d.views.paymentCard;
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(reference).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover">
        {copyText.label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span className="font-heading text-2xl font-bold tracking-tight text-primary-hover">
          {reference}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label={copyText.copy}
          className="rounded-lg p-1.5 text-primary transition-colors hover:bg-primary/10"
        >
          {copied ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-primary-hover/80">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {copyText.note}
      </p>
    </div>
  );
}
