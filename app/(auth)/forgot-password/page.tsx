import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { getDashboardCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Reset your password | RTA Savings & Loans",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const { d } = await getDashboardCopy();
  const copy = d.auth.forgot;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-ink">{copy.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        {copy.subtitle}
      </p>

      <ForgotPasswordForm />

      <p className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {copy.backToSignIn}
        </Link>
      </p>
    </div>
  );
}
