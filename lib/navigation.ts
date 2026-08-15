import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  Cog,
  CreditCard,
  FileText,
  FileUp,
  Gauge,
  HandCoins,
  LayoutDashboard,
  Link2,
  PiggyBank,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { PERMISSIONS, type PermissionCode } from "@/lib/auth/permissions";
import type { NavLabelKey } from "@/lib/i18n/dashboard";
import type { UserRole } from "@/lib/generated/prisma/enums";

/**
 * Dashboard navigation.
 *
 * `permission` here controls VISIBILITY ONLY. Hiding a link is a usability
 * decision — it keeps a screen from advertising things the user cannot do. It
 * is not access control: the page behind every one of these links calls a
 * guard from lib/auth/guards.ts, and that is what actually decides.
 */

export interface NavItem {
  /// Key into the dashboard dictionary rather than literal text, so the
  /// sidebar translates. Typed against the dictionary, so a key that has no
  /// translation is a compile error rather than a blank label in the UI.
  labelKey: NavLabelKey;
  href: string;
  icon: LucideIcon;
  /// Hide unless the user holds this permission.
  permission?: PermissionCode;
  /// Live count badge key, resolved by the shell (e.g. pending applications).
  badgeKey?: "pendingLoans" | "pendingWithdrawals" | "unmatchedPayments" | "pendingMembers";
  /// Match child routes too (default true). False for index links.
  exact?: boolean;
}

export interface NavSection {
  titleKey?: NavLabelKey;
  items: NavItem[];
}

const MEMBER_NAV: NavSection[] = [
  {
    items: [
      { labelKey: "overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    titleKey: "savings",
    items: [
      { labelKey: "mySavings", href: "/dashboard/savings", icon: PiggyBank, exact: true },
      { labelKey: "transactions", href: "/dashboard/savings/transactions", icon: ScrollText },
      { labelKey: "deposit", href: "/dashboard/savings/deposit", icon: ArrowDownToLine },
      { labelKey: "withdrawals", href: "/dashboard/withdrawals", icon: ArrowUpFromLine },
    ],
  },
  {
    titleKey: "loans",
    items: [
      { labelKey: "myLoans", href: "/dashboard/loans", icon: HandCoins, exact: true },
      { labelKey: "applyLoan", href: "/dashboard/loans/apply", icon: ClipboardList },
      { labelKey: "repayments", href: "/dashboard/loans/repayments", icon: Banknote },
    ],
  },
  {
    titleKey: "account",
    items: [
      { labelKey: "statements", href: "/dashboard/statements", icon: FileText },
      { labelKey: "notifications", href: "/dashboard/notifications", icon: Bell },
      { labelKey: "profile", href: "/dashboard/profile", icon: Settings },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    items: [{ labelKey: "overview", href: "/admin", icon: LayoutDashboard, exact: true }],
  },
  {
    titleKey: "members",
    items: [
      {
        labelKey: "allMembers",
        href: "/admin/members",
        icon: Users,
        permission: PERMISSIONS.MEMBERS_VIEW,
        exact: true,
      },
      {
        labelKey: "pendingApprovals",
        href: "/admin/members/pending",
        icon: ShieldCheck,
        permission: PERMISSIONS.MEMBERS_APPROVE,
        badgeKey: "pendingMembers",
      },
    ],
  },
  {
    titleKey: "savings",
    items: [
      {
        labelKey: "accounts",
        href: "/admin/savings",
        icon: Wallet,
        permission: PERMISSIONS.SAVINGS_VIEW_ALL,
        exact: true,
      },
      {
        labelKey: "transactions",
        href: "/admin/savings/transactions",
        icon: ScrollText,
        permission: PERMISSIONS.SAVINGS_VIEW_ALL,
      },
      {
        labelKey: "withdrawals",
        href: "/admin/withdrawals",
        icon: ArrowUpFromLine,
        permission: PERMISSIONS.WITHDRAWALS_VIEW_ALL,
        badgeKey: "pendingWithdrawals",
      },
    ],
  },
  {
    titleKey: "payments",
    items: [
      {
        labelKey: "allPayments",
        href: "/admin/payments",
        icon: CreditCard,
        permission: PERMISSIONS.PAYMENTS_VIEW,
        exact: true,
      },
      {
        labelKey: "unmatched",
        href: "/admin/payments/unmatched",
        icon: Link2,
        permission: PERMISSIONS.PAYMENTS_RECONCILE,
        badgeKey: "unmatchedPayments",
      },
      {
        labelKey: "importStatement",
        href: "/admin/payments/import",
        icon: FileUp,
        permission: PERMISSIONS.PAYMENTS_RECONCILE,
      },
    ],
  },
  {
    titleKey: "loans",
    items: [
      {
        labelKey: "portfolio",
        href: "/admin/loans",
        icon: HandCoins,
        permission: PERMISSIONS.LOANS_VIEW_ALL,
        exact: true,
      },
      {
        labelKey: "applications",
        href: "/admin/loans/applications",
        icon: ClipboardList,
        permission: PERMISSIONS.LOANS_REVIEW,
        badgeKey: "pendingLoans",
      },
      {
        labelKey: "loanProducts",
        href: "/admin/loans/products",
        icon: Cog,
        permission: PERMISSIONS.LOAN_PRODUCTS_MANAGE,
      },
    ],
  },
  {
    titleKey: "association",
    items: [
      {
        labelKey: "reports",
        href: "/admin/reports",
        icon: BarChart3,
        permission: PERMISSIONS.REPORTS_VIEW_ASSOCIATION,
      },
      {
        labelKey: "notifications",
        href: "/admin/notifications",
        icon: Bell,
        permission: PERMISSIONS.NOTIFICATIONS_SEND,
      },
      {
        labelKey: "auditLog",
        href: "/admin/audit",
        icon: Activity,
        permission: PERMISSIONS.AUDIT_VIEW,
      },
      {
        labelKey: "settings",
        href: "/admin/settings",
        icon: Settings,
        permission: PERMISSIONS.ASSOCIATION_SETTINGS,
      },
    ],
  },
];

const SUPER_ADMIN_NAV: NavSection[] = [
  {
    items: [
      { labelKey: "platformOverview", href: "/super-admin", icon: Gauge, exact: true },
    ],
  },
  {
    titleKey: "tenants",
    items: [
      { labelKey: "associations", href: "/super-admin/associations", icon: Building2 },
      { labelKey: "administrators", href: "/super-admin/admins", icon: ShieldCheck },
      { labelKey: "permissions", href: "/super-admin/permissions", icon: Users },
    ],
  },
  {
    titleKey: "financialOversight",
    items: [
      { labelKey: "allTransactions", href: "/super-admin/transactions", icon: ScrollText },
      { labelKey: "allPayments", href: "/super-admin/payments", icon: CreditCard },
      { labelKey: "loanPortfolio", href: "/super-admin/loans", icon: HandCoins },
      { labelKey: "reports", href: "/super-admin/reports", icon: BarChart3 },
    ],
  },
  {
    titleKey: "system",
    items: [
      { labelKey: "integrations", href: "/super-admin/integrations", icon: Link2 },
      { labelKey: "backgroundJobs", href: "/super-admin/jobs", icon: Activity },
      { labelKey: "auditLog", href: "/super-admin/audit", icon: ScrollText },
      { labelKey: "settings", href: "/super-admin/settings", icon: Settings },
    ],
  },
];

export function navigationFor(role: UserRole): NavSection[] {
  switch (role) {
    case "MEMBER":
      return MEMBER_NAV;
    case "ADMIN":
      return ADMIN_NAV;
    case "SUPER_ADMIN":
      return SUPER_ADMIN_NAV;
  }
}

/** Filters a navigation tree down to what the user may see. */
export function visibleNavigation(
  role: UserRole,
  permissions: Set<string> | string[]
): NavSection[] {
  const held = permissions instanceof Set ? permissions : new Set(permissions);

  return navigationFor(role)
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || held.has(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);
}

/** True when `pathname` should highlight `item`. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Human-readable labels for breadcrumb segments that are not obvious from the
 * URL. Anything unlisted is title-cased from the slug.
 */
export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Administration",
  "super-admin": "Platform",
  savings: "Savings",
  transactions: "Transactions",
  withdrawals: "Withdrawals",
  loans: "Loans",
  applications: "Applications",
  products: "Loan products",
  repayments: "Repayments",
  payments: "Payments",
  unmatched: "Unmatched payments",
  members: "Members",
  pending: "Pending approvals",
  reports: "Reports",
  statements: "Statements",
  notifications: "Notifications",
  profile: "Profile",
  settings: "Settings",
  audit: "Audit log",
  associations: "Associations",
  admins: "Administrators",
  permissions: "Permissions",
  integrations: "Integrations",
  jobs: "Background jobs",
  apply: "New application",
  deposit: "Make a deposit",
};
