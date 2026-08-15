import "server-only";
import { prisma, Prisma } from "@/lib/db/prisma";
import { add, toMoneyString } from "@/lib/money";
import type { AssociationStatus } from "@/lib/generated/prisma/enums";

/**
 * Tenant directory for the super admin.
 *
 * Every figure here is an aggregate over one association's data, and there is
 * no association scope applied — this is the one screen that deliberately
 * crosses tenant boundaries, which is why the only caller is behind
 * `requireSuperAdmin`.
 *
 * The aggregates are computed as one grouped query per metric and then joined
 * in memory by associationId, rather than a per-association dashboard call.
 * Thirty tenants would otherwise mean thirty round trips of twenty queries
 * each, and the page would get slower with every association onboarded.
 */

export interface AssociationSummary {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  status: AssociationStatus;
  currency: string;
  city: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
  members: {
    total: number;
    active: number;
    pendingApproval: number;
  };
  /// Decimal strings — never numbers. See lib/money.ts.
  savingsBalance: string;
  loans: {
    activeCount: number;
    outstanding: string;
    overdueCount: number;
  };
  unmatchedPayments: number;
  admins: number;
}

export interface AssociationDirectory {
  associations: AssociationSummary[];
  /// Totals across the rows returned, i.e. after any filter is applied.
  totals: {
    associations: number;
    active: number;
    members: number;
    savingsBalance: string;
    loansOutstanding: string;
    unmatchedPayments: number;
  };
}

/** Loan statuses that still carry a balance the association is owed. */
const OPEN_LOAN_STATUSES = ["ACTIVE", "DISBURSED", "OVERDUE"] as const;

export async function listAssociations(
  options: { search?: string; status?: AssociationStatus } = {}
): Promise<AssociationDirectory> {
  const { search, status } = options;

  const where: Prisma.AssociationWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { legalName: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const associations = await prisma.association.findMany({
    where,
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      legalName: true,
      status: true,
      currency: true,
      city: true,
      country: true,
      email: true,
      phone: true,
      createdAt: true,
    },
  });

  if (associations.length === 0) {
    return {
      associations: [],
      totals: {
        associations: 0,
        active: 0,
        members: 0,
        savingsBalance: toMoneyString(0),
        loansOutstanding: toMoneyString(0),
        unmatchedPayments: 0,
      },
    };
  }

  const ids = associations.map((a) => a.id);
  const scope = { associationId: { in: ids } };

  const [memberCounts, savings, openLoans, overdueLoans, unmatched, admins] =
    await Promise.all([
      prisma.member.groupBy({
        by: ["associationId", "status"],
        where: scope,
        _count: true,
      }),

      prisma.savingsAccount.groupBy({
        by: ["associationId"],
        where: { ...scope, isActive: true },
        _sum: { balance: true },
      }),

      prisma.loan.groupBy({
        by: ["associationId"],
        where: { ...scope, status: { in: [...OPEN_LOAN_STATUSES] } },
        _count: true,
        _sum: {
          principalOutstanding: true,
          interestOutstanding: true,
          feesOutstanding: true,
          penaltyOutstanding: true,
        },
      }),

      prisma.loan.groupBy({
        by: ["associationId"],
        where: { ...scope, status: "OVERDUE" },
        _count: true,
      }),

      prisma.payment.groupBy({
        by: ["associationId"],
        where: { ...scope, status: "UNMATCHED" },
        _count: true,
      }),

      prisma.user.groupBy({
        by: ["associationId"],
        where: { ...scope, role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        _count: true,
      }),
    ]);

  // Member counts arrive one row per (association, status) pair.
  const membersByAssociation = new Map<
    string,
    { total: number; active: number; pendingApproval: number }
  >();

  for (const row of memberCounts) {
    const bucket = membersByAssociation.get(row.associationId) ?? {
      total: 0,
      active: 0,
      pendingApproval: 0,
    };
    bucket.total += row._count;
    if (row.status === "ACTIVE") bucket.active += row._count;
    if (row.status === "PENDING_APPROVAL") bucket.pendingApproval += row._count;
    membersByAssociation.set(row.associationId, bucket);
  }

  const savingsByAssociation = new Map(
    savings.map((row) => [row.associationId, row._sum.balance ?? 0])
  );

  const loansByAssociation = new Map(
    openLoans.map((row) => [
      row.associationId,
      {
        count: row._count,
        outstanding: add(
          row._sum.principalOutstanding ?? 0,
          row._sum.interestOutstanding ?? 0,
          row._sum.feesOutstanding ?? 0,
          row._sum.penaltyOutstanding ?? 0
        ),
      },
    ])
  );

  const overdueByAssociation = new Map(
    overdueLoans.map((row) => [row.associationId, row._count])
  );

  // Payment.associationId and User.associationId are both nullable — an
  // unattributed payment or a super admin with no tenant groups under null,
  // which simply never matches an association id below.
  const unmatchedByAssociation = new Map(
    unmatched.map((row) => [row.associationId, row._count])
  );

  const adminsByAssociation = new Map(
    admins.map((row) => [row.associationId, row._count])
  );

  const rows: AssociationSummary[] = associations.map((association) => {
    const members = membersByAssociation.get(association.id) ?? {
      total: 0,
      active: 0,
      pendingApproval: 0,
    };
    const loans = loansByAssociation.get(association.id);

    return {
      ...association,
      members,
      savingsBalance: toMoneyString(savingsByAssociation.get(association.id) ?? 0),
      loans: {
        activeCount: loans?.count ?? 0,
        outstanding: toMoneyString(loans?.outstanding ?? 0),
        overdueCount: overdueByAssociation.get(association.id) ?? 0,
      },
      unmatchedPayments: unmatchedByAssociation.get(association.id) ?? 0,
      admins: adminsByAssociation.get(association.id) ?? 0,
    };
  });

  return {
    associations: rows,
    totals: {
      associations: rows.length,
      active: rows.filter((row) => row.status === "ACTIVE").length,
      members: rows.reduce((sum, row) => sum + row.members.total, 0),
      savingsBalance: toMoneyString(
        rows.reduce((sum, row) => add(sum, row.savingsBalance), add(0))
      ),
      loansOutstanding: toMoneyString(
        rows.reduce((sum, row) => add(sum, row.loans.outstanding), add(0))
      ),
      unmatchedPayments: rows.reduce((sum, row) => sum + row.unmatchedPayments, 0),
    },
  };
}
