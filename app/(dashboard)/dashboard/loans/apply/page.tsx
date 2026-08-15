import type { Metadata } from "next";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import { requireMember } from "@/lib/auth/guards";
import { getAvailableLoanProducts } from "@/lib/services/member-queries";
import { PageHeader } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { LoanApplicationForm } from "@/components/dashboard/LoanApplicationForm";

export const metadata: Metadata = { title: "Apply for a loan | RTA" };
export const dynamic = "force-dynamic";

export default async function LoanApplyPage() {
  const context = await requireMember("/dashboard/loans/apply");

  const data = await getAvailableLoanProducts(
    context.member!.id,
    context.user.associationId!
  );

  if (data.products.length === 0) {
    return (
      <EmptyState
        icon={HandCoins}
        title="No loan products available"
        description="The association has not published any loan products yet. Please check back later or contact the office."
      />
    );
  }

  if (data.hasActiveLoan && data.products.every((p) => p.singleActiveLoan)) {
    return (
      <div>
        <PageHeader title="Apply for a loan" />
        <EmptyState
          icon={HandCoins}
          title="You already have an active loan"
          description="This association allows one loan at a time. You can apply again once your current loan is fully repaid."
          action={
            <Button asChild variant="outline">
              <Link href="/dashboard/loans">View my loan</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Apply for a loan"
        description="Choose a product, then tell us how much you need and what for."
      />

      <LoanApplicationForm
        products={data.products}
        savingsBalance={data.savingsBalance}
        membershipMonths={data.membershipMonths}
      />
    </div>
  );
}
