import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password | RTA Savings & Loans",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-ink">
        Forgot your password?
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        Enter the email address or phone number registered with the association
        and we will send you a link to set a new password.
      </p>

      <ForgotPasswordForm />

      <p className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
