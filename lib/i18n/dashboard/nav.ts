import type { Locale } from "@/types";

/** Sidebar section headings and item labels, keyed to lib/navigation.ts. */
export interface NavCopy {
  overview: string;
  savings: string;
  mySavings: string;
  transactions: string;
  deposit: string;
  withdrawals: string;
  loans: string;
  myLoans: string;
  applyLoan: string;
  repayments: string;
  account: string;
  statements: string;
  notifications: string;
  profile: string;

  members: string;
  allMembers: string;
  pendingApprovals: string;
  accounts: string;
  payments: string;
  allPayments: string;
  unmatched: string;
  importStatement: string;
  portfolio: string;
  applications: string;
  loanProducts: string;
  association: string;
  reports: string;
  auditLog: string;
  settings: string;

  platformOverview: string;
  tenants: string;
  associations: string;
  administrators: string;
  permissions: string;
  financialOversight: string;
  allTransactions: string;
  loanPortfolio: string;
  system: string;
  integrations: string;
  backgroundJobs: string;
}

export const nav: Record<Locale, NavCopy> = {
  en: {
    overview: "Overview",
    savings: "Savings",
    mySavings: "My savings",
    transactions: "Transactions",
    deposit: "Deposit",
    withdrawals: "Withdrawals",
    loans: "Loans",
    myLoans: "My loans",
    applyLoan: "Apply for a loan",
    repayments: "Repayments",
    account: "Account",
    statements: "Statements",
    notifications: "Notifications",
    profile: "Profile",

    members: "Members",
    allMembers: "All members",
    pendingApprovals: "Pending approvals",
    accounts: "Accounts",
    payments: "Payments",
    allPayments: "All payments",
    unmatched: "Unmatched",
    importStatement: "Import statement",
    portfolio: "Portfolio",
    applications: "Applications",
    loanProducts: "Loan products",
    association: "Association",
    reports: "Reports",
    auditLog: "Audit log",
    settings: "Settings",

    platformOverview: "Platform overview",
    tenants: "Tenants",
    associations: "Associations",
    administrators: "Administrators",
    permissions: "Permissions",
    financialOversight: "Financial oversight",
    allTransactions: "All transactions",
    loanPortfolio: "Loan portfolio",
    system: "System",
    integrations: "Integrations",
    backgroundJobs: "Background jobs",
  },

  rw: {
    overview: "Incamake",
    savings: "Kuzigama",
    mySavings: "Ubuzigame bwanjye",
    transactions: "Ibikorwa",
    deposit: "Kubitsa",
    withdrawals: "Kubikuza",
    loans: "Inguzanyo",
    myLoans: "Inguzanyo zanjye",
    applyLoan: "Gusaba inguzanyo",
    repayments: "Kwishyura",
    account: "Konti",
    statements: "Inyandiko za konti",
    notifications: "Ubutumwa",
    profile: "Umwirondoro",

    members: "Abanyamuryango",
    allMembers: "Abanyamuryango bose",
    pendingApprovals: "Bategereje kwemezwa",
    accounts: "Konti",
    payments: "Ubwishyu",
    allPayments: "Ubwishyu bwose",
    unmatched: "Butarahuzwa",
    importStatement: "Kwinjiza inyandiko ya banki",
    portfolio: "Inguzanyo zose",
    applications: "Ubusabe",
    loanProducts: "Ubwoko bw'inguzanyo",
    association: "Ihuriro",
    reports: "Raporo",
    auditLog: "Ibyakozwe byose",
    settings: "Igenamiterere",

    platformOverview: "Incamake y'urubuga",
    tenants: "Amahuriro",
    associations: "Amahuriro",
    administrators: "Abayobozi",
    permissions: "Uburenganzira",
    financialOversight: "Igenzura ry'imari",
    allTransactions: "Ibikorwa byose",
    loanPortfolio: "Inguzanyo zose",
    system: "Sisitemu",
    integrations: "Ihuzwa rya serivisi",
    backgroundJobs: "Imirimo yikora",
  },
};
