import type { Locale } from "@/types";

/**
 * Dashboard translations.
 *
 * Kept apart from `dictionary.ts`, which covers the marketing site. The two
 * have almost no vocabulary in common — one sells membership, the other names
 * financial operations — and a single file carrying both would be edited by
 * different people for different reasons.
 *
 * TRANSLATING FINANCIAL TERMS IS NOT A MATTER OF TASTE. A member reading
 * "Kubitsa" must understand the same operation an administrator sees as
 * "Deposit", because they are looking at the same ledger row from two sides.
 * Where an established Kinyarwanda banking term exists it is used; where one
 * does not, the English is kept rather than invented, since an unfamiliar
 * coinage is worse than a familiar loan word.
 */

export interface DashboardDictionary {
  /// Sidebar section headings and item labels, keyed to lib/navigation.ts.
  nav: {
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
  };
  /// Chrome around every page: header, user menu, shared controls.
  shell: {
    dashboard: string;
    notifications: string;
    notificationsUnread: string;
    signOut: string;
    signingOut: string;
    openMenu: string;
    closeMenu: string;
    changeLanguage: string;
    language: string;
    myAccount: string;
    changePassword: string;
    member: string;
    admin: string;
    superAdmin: string;
  };
  /// Words that recur across screens.
  common: {
    search: string;
    apply: string;
    clear: string;
    cancel: string;
    save: string;
    saving: string;
    confirm: string;
    back: string;
    view: string;
    viewAll: string;
    edit: string;
    delete: string;
    loading: string;
    noResults: string;
    total: string;
    status: string;
    date: string;
    amount: string;
    balance: string;
    reference: string;
    description: string;
    actions: string;
    page: string;
    of: string;
  };
}

const dashboardDictionary: Record<Locale, DashboardDictionary> = {
  en: {
    nav: {
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
    shell: {
      dashboard: "Dashboard",
      notifications: "Notifications",
      notificationsUnread: "unread",
      signOut: "Sign out",
      signingOut: "Signing out…",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      changeLanguage: "Change language",
      language: "Language",
      myAccount: "My account",
      changePassword: "Change password",
      member: "Member",
      admin: "Administrator",
      superAdmin: "Super administrator",
    },
    common: {
      search: "Search",
      apply: "Apply",
      clear: "Clear",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving…",
      confirm: "Confirm",
      back: "Back",
      view: "View",
      viewAll: "View all",
      edit: "Edit",
      delete: "Delete",
      loading: "Loading…",
      noResults: "No results",
      total: "Total",
      status: "Status",
      date: "Date",
      amount: "Amount",
      balance: "Balance",
      reference: "Reference",
      description: "Description",
      actions: "Actions",
      page: "Page",
      of: "of",
    },
  },

  rw: {
    nav: {
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
    shell: {
      dashboard: "Imbonerahamwe",
      notifications: "Ubutumwa",
      notificationsUnread: "butarasomwa",
      signOut: "Gusohoka",
      signingOut: "Turasohoka…",
      openMenu: "Fungura menu",
      closeMenu: "Funga menu",
      changeLanguage: "Hindura ururimi",
      language: "Ururimi",
      myAccount: "Konti yanjye",
      changePassword: "Hindura ijambobanga",
      member: "Umunyamuryango",
      admin: "Umuyobozi",
      superAdmin: "Umuyobozi mukuru",
    },
    common: {
      search: "Shakisha",
      apply: "Emeza",
      clear: "Siba",
      cancel: "Hagarika",
      save: "Bika",
      saving: "Turabika…",
      confirm: "Emeza",
      back: "Subira inyuma",
      view: "Reba",
      viewAll: "Reba byose",
      edit: "Hindura",
      delete: "Siba",
      loading: "Birimo gupakirwa…",
      noResults: "Nta bisubizo",
      total: "Igiteranyo",
      status: "Imimerere",
      date: "Itariki",
      amount: "Umubare",
      balance: "Amafaranga asigaye",
      reference: "Nimero y'ubwishyu",
      description: "Ibisobanuro",
      actions: "Ibikorwa",
      page: "Urupapuro",
      of: "kuri",
    },
  },
};

/** Every navigation label key, so `lib/navigation.ts` stays type-checked. */
export type NavLabelKey = keyof DashboardDictionary["nav"];

export default dashboardDictionary;
