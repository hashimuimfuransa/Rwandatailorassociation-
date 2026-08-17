import type { Metadata } from "next";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getAvailableLoanProducts } from "@/lib/services/member-queries";
import { getDashboardCopy } from "@/lib/i18n/server";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { LoanApplicationForm } from "@/components/dashboard/LoanApplicationForm";

export const metadata: Metadata = { title: "Apply for a loan | RTA" };
export const dynamic = "force-dynamic";

export default async function LoanApplyPage() {
  const context = await requireMember("/dashboard/loans/apply");
  const { d } = await getDashboardCopy();
  const copy = d.member.apply;

  const data = await getAvailableLoanProducts(
    context.member!.id,
    context.user.associationId!
  );

  if (data.products.length === 0) {
    return (
      <EmptyState
        icon={HandCoins}
        title={copy.noProductsTitle}
        description={copy.noProductsBody}
      />
    );
  }

  if (data.hasActiveLoan && data.products.every((p) => p.singleActiveLoan)) {
    return (
      <div>
        <PageHeader title={copy.title} />
        <EmptyState
          icon={HandCoins}
          title={copy.activeLoanTitle}
          description={copy.activeLoanBody}
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/loans">{copy.viewMyLoan}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={copy.title} description={copy.description} />

      <LoanApplicationForm
        products={data.products}
        savingsBalance={data.savingsBalance}
        membershipMonths={data.membershipMonths}
      />
    </div>
  );
}
