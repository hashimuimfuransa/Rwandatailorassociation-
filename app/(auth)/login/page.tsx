import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { getDashboardCopy } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Sign in | RTA Savings & Loans",
  description: "Sign in to your Rwanda Tailors Association member account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const { d } = await getDashboardCopy();
  const copy = d.auth.login;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-ink">{copy.title}</h1>
      <p className="mt-2 text-[15px] text-ink-muted">{copy.subtitle}</p>

      {/* useSearchParams needs a Suspense boundary to keep the shell static. */}
      <Suspense fallback={<div className="mt-8 h-72" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-8 text-center text-sm text-ink-muted">
        {copy.notAMember}{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {copy.applyToJoin}
        </Link>
      </p>
    </div>
  );
}
