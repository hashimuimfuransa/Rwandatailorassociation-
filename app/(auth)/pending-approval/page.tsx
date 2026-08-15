import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/session";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROLE_HOME } from "@/lib/auth/permissions";

export const metadata: Metadata = {
  title: "Membership pending | RTA Savings & Loans",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Landing page for a member whose application has not yet been approved.
 *
 * Shown instead of the dashboard, which would otherwise be a wall of zeroes
 * with no explanation. Their payment reference is displayed here too, so they
 * can note it down while they wait.
 */
export default async function PendingApprovalPage() {
  const context = await getAuthContext();

  if (!context) redirect("/login");

  // Approved in the meantime — send them where they belong.
  if (context.member && context.member.status !== "PENDING_APPROVAL") {
    redirect(ROLE_HOME[context.user.role]);
  }
  if (!context.member) {
    redirect(ROLE_HOME[context.user.role]);
  }

  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-amber-700">
        <Clock className="size-7" aria-hidden="true" />
      </span>

      <h1 className="mt-6 font-heading text-3xl font-bold text-ink">
        Your membership is being reviewed
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        Thank you, {context.user.firstName}. An administrator is reviewing your
        application. You will be notified by SMS and email as soon as your
        account is active.
      </p>

      <dl className="mt-8 space-y-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Membership number
          </dt>
          <dd className="mt-1 font-heading text-lg font-bold text-ink">
            {context.member.memberNumber}
          </dd>
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary-50 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-primary-hover">
            Your payment reference
          </dt>
          <dd className="mt-1 font-heading text-lg font-bold text-primary-hover">
            {context.member.paymentReference}
          </dd>
        </div>
      </dl>

      <Alert variant="info" className="mt-6">
        Keep your payment reference safe. Once your membership is active, quote
        it on every contribution so it reaches your savings account.
      </Alert>

      <form action="/api/auth/logout" method="post" className="mt-8">
        <Button asChild variant="outline" className="w-full">
          <Link href="/">
            <LogOut className="size-4" aria-hidden="true" />
            Back to the website
          </Link>
        </Button>
      </form>
    </div>
  );
}
