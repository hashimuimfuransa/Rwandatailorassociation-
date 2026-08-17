import type { Locale } from "@/types";

/**
 * The association administrator's screens: the register, payments, loans,
 * withdrawals, reports, the audit log and settings.
 *
 * Translated for the same reason as the member's own pages, even though staff
 * are more likely to read English: an association officer in a district office
 * is not necessarily an English speaker, and an administrator who half-follows
 * an instruction is approving real money.
 *
 * Enum values — a member's status, a transaction type — are rendered by
 * StatusBadge from the database value and are not translated here; they are the
 * words the ledger itself uses, and two names for one state is how a
 * reconciliation goes wrong.
 */
export interface AdminCopy {
  overview: {
    title: string;
    platform: string;
    description: string;
    unmatchedPayments: string;
    unmatchedDetail: string;
    overdueLoans: string;
    overdueDetail: string;
    membershipApplications: string;
    awaitingApproval: string;
    suspiciousTitle: string;
    suspiciousBody: string;
    reviewThem: string;
    funds: string;
    totalSavings: string;
    activeMembers: string;
    collectedToday: string;
    transactionsToday: string;
    collectedThisMonth: string;
    withdrawalsHint: string;
    outstandingLoans: string;
    activeLoans: string;
    needsAttention: string;
    pendingApplications: string;
    pendingApplicationsHint: string;
    pendingWithdrawals: string;
    unmatchedCount: string;
    overdueCount: string;
    membership: string;
    totalMembers: string;
    joinedThisMonth: string;
    active: string;
    pendingApproval: string;
    suspended: string;
    monthlyDeposits: string;
    monthlyDepositsHint: string;
    monthlyWithdrawals: string;
    monthlyWithdrawalsHint: string;
    seriesDeposits: string;
    seriesWithdrawals: string;
    noData: string;
    latestTransactions: string;
    colChannel: string;
    noTransactions: string;
  };
  members: {
    title: string;
    inRegister: string;
    enrol: string;
    noneTitle: string;
    noneBody: string;
    colMember: string;
    colContact: string;
    colSavings: string;
    colLoanOwing: string;
    colKyc: string;
    colJoined: string;
    overdue: string;

    pendingTitle: string;
    pendingDescription: string;
    pendingNoneTitle: string;
    pendingNoneBody: string;
    pendingNotice: string;

    newTitle: string;
    newDescription: string;
    newDescriptionPlain: string;
    backToRegister: string;
    noAssociationTitle: string;
    noAssociationBody: string;

    editTitle: string;
    editDescription: string;
    backToFile: string;
  };
  /// A single member's file.
  file: {
    description: string;
    editDetails: string;
    suspendedReason: string;
    savingsBalance: string;
    accountNumber: string;
    noAccount: string;
    available: string;
    locked: string;
    nothingToWithdraw: string;
    loansOwing: string;
    loansOnFile: string;
    overdueLoans: string;
    inArrears: string;
    upToDate: string;
    memberFile: string;
    memberNumber: string;
    paymentReference: string;
    business: string;
    joined: string;
    approvedOn: string;
    contactAccess: string;
    emailVerified: string;
    phoneVerified: string;
    mobileMoney: string;
    bankAccount: string;
    lastSignIn: string;
    nextOfKin: string;
    theirPhone: string;
    loans: string;
    colPrincipal: string;
    colPayable: string;
    colRepaid: string;
    colOutstanding: string;
    colDisbursed: string;
    daysLate: string;
    neverBorrowed: string;
    recentTransactions: string;
    balanceAfter: string;
    noTransactions: string;
    notes: string;
    noNotes: string;
    internal: string;
  };
  savings: {
    title: string;
    description: string;
    totalHeld: string;
    accountCount: string;
    locked: string;
    lockedHint: string;
    available: string;
    availableHint: string;
    searchPlaceholder: string;
    noneTitle: string;
    noneSearchBody: string;
    noneBody: string;
    colMember: string;
    colAccount: string;
    colLocked: string;
    colAvailable: string;
    colDeposits: string;
    colWithdrawn: string;
    colLastActivity: string;
    transactionCount: string;
  };
  transactions: {
    title: string;
    description: string;
  };
  payments: {
    title: string;
    description: string;
    unmatchedTitle: string;
    unmatchedDescription: string;
    unmatchedNoneTitle: string;
    unmatchedNoneBody: string;
    unmatchedCount: string;
    unmatchedNotice: string;
  };
  loans: {
    title: string;
    description: string;
  };
  audit: {
    title: string;
    description: string;
  };
  withdrawals: {
    title: string;
    description: string;
    noneTitle: string;
    noneBody: string;
  };
  import: {
    title: string;
    description: string;
    noPermission: string;
    howTitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    digitalOnly: string;
    digitalOnlyBody: string;
    reuploadSafe: string;
    creditsOnly: string;
  };
  applications: {
    title: string;
    description: string;
    noneTitle: string;
    noneBody: string;
  };
  products: {
    title: string;
    description: string;
    noneTitle: string;
    noneBody: string;
    interest: string;
    amount: string;
    minAmount: string;
    inUse: string;
    applicationCount: string;
    eligibility: string;
    eligibilityValue: string;
    multiplier: string;
    multiplierValue: string;
    cappedAt: string;
    term: string;
    termValue: string;
    processingFee: string;
    insuranceFee: string;
    latePenalty: string;
    graceDays: string;
    guarantors: string;
    guarantorsRequired: string;
    notRequired: string;
    collateral: string;
    required: string;
    concurrent: string;
    singleLoan: string;
    multipleAllowed: string;
    advisoryNote: string;
  };
  reports: {
    title: string;
    description: string;
    savingsHeld: string;
    activeMembers: string;
    loansOutstanding: string;
    activeLoans: string;
    inArrears: string;
    overdueCount: string;
    members: string;
    joinedThisMonth: string;
  };
  notifications: {
    title: string;
    description: string;
    sent: string;
    notYetRead: string;
    delivered: string;
    deliveredHint: string;
    handedOver: string;
    handedOverHint: string;
    failed: string;
    failedHint: string;
    noFailures: string;
    event: string;
    allEvents: string;
    noneTitle: string;
    noneBody: string;
    colRecipient: string;
    colMessage: string;
    colDelivery: string;
    colSent: string;
    colRead: string;
    inAppOnly: string;
    read: string;
    unread: string;
  };
  settings: {
    title: string;
    descriptionPlain: string;
    description: string;
    noAssociationTitle: string;
    noAssociationBody: string;
    profile: string;
    legalName: string;
    code: string;
    registrationNo: string;
    taxId: string;
    currency: string;
    timezone: string;
    created: string;
    contact: string;
    website: string;
    administrators: string;
    loanProducts: string;
    collectionAccount: string;
    bank: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    referenceSequence: string;
    referenceSequenceHint: string;
    rules: string;
    minimumDeposit: string;
    maximumDeposit: string;
    noLimit: string;
    minimumBalance: string;
    withdrawalsLabel: string;
    allowed: string;
    suspended: string;
    approvalRequired: string;
    withdrawalFee: string;
    noticePeriod: string;
    noticeDays: string;
    monthlyContribution: string;
    dueDay: string;
    notEnforced: string;
    annualInterest: string;
    noRule: string;
    storedConfiguration: string;
    noStoredSettings: string;
    readOnlyNote: string;
  };
}

export const admin: Record<Locale, AdminCopy> = {
  en: {
    overview: {
      title: "{association} overview",
      platform: "Platform",
      description: "Today's position across savings, loans and payments.",
      unmatchedPayments:
        "{count} unmatched payment|{count} unmatched payments",
      unmatchedDetail: "{amount} received but not yet credited to a member",
      overdueLoans: "{count} overdue loan|{count} overdue loans",
      overdueDetail: "{amount} in arrears",
      membershipApplications:
        "{count} membership application|{count} membership applications",
      awaitingApproval: "Awaiting your approval",
      suspiciousTitle: "Payments flagged as suspicious",
      suspiciousBody:
        "{count} payment has been flagged and held.|{count} payments have been flagged and held.",
      reviewThem: "Review them",
      funds: "Association funds",
      totalSavings: "Total savings held",
      activeMembers: "{count} active member|{count} active members",
      collectedToday: "Collected today",
      transactionsToday: "{count} transaction|{count} transactions",
      collectedThisMonth: "Collected this month",
      withdrawalsHint: "Withdrawals {amount}",
      outstandingLoans: "Outstanding loans",
      activeLoans: "{count} active loan|{count} active loans",
      needsAttention: "Needs attention",
      pendingApplications: "Pending applications",
      pendingApplicationsHint: "Loan applications awaiting review",
      pendingWithdrawals: "Pending withdrawals",
      unmatchedCount: "Unmatched payments",
      overdueCount: "Overdue loans",
      membership: "Membership",
      totalMembers: "Total members",
      joinedThisMonth: "{count} joined this month",
      active: "Active",
      pendingApproval: "Pending approval",
      suspended: "Suspended",
      monthlyDeposits: "Monthly deposits",
      monthlyDepositsHint: "Contributions received per month",
      monthlyWithdrawals: "Monthly withdrawals",
      monthlyWithdrawalsHint: "Paid out per month",
      seriesDeposits: "Deposits",
      seriesWithdrawals: "Withdrawals",
      noData: "No data for this period yet.",
      latestTransactions: "Latest transactions",
      colChannel: "Channel",
      noTransactions: "No transactions recorded yet.",
    },
    members: {
      title: "Members",
      inRegister:
        "{count} member in the register.|{count} members in the register.",
      enrol: "Enrol member",
      noneTitle: "No members found",
      noneBody: "No members match these filters. Try clearing the search.",
      colMember: "Member",
      colContact: "Contact",
      colSavings: "Savings",
      colLoanOwing: "Loan owing",
      colKyc: "KYC",
      colJoined: "Joined",
      overdue: "overdue",

      pendingTitle: "Pending approvals",
      pendingDescription: "Membership applications awaiting a decision.",
      pendingNoneTitle: "Nothing waiting",
      pendingNoneBody:
        "Every membership application has been reviewed. New applications will appear here.",
      pendingNotice:
        "Approving activates the member's login and opens their savings account. They will be sent their payment reference, which is what their contributions are matched on.",

      newTitle: "Enrol a member",
      newDescription:
        "Add someone to {association}'s register directly, without waiting for them to sign up.",
      newDescriptionPlain: "Add someone to the association's register.",
      backToRegister: "Back to register",
      noAssociationTitle: "No association selected",
      noAssociationBody:
        "Members belong to one association. Open an association from the platform directory before enrolling anyone.",

      editTitle: "Edit {name}",
      editDescription:
        "Member {number}. Their member number and payment reference cannot be changed — those are printed on every payment instruction they hold.",
      backToFile: "Back to member file",
    },
    file: {
      description: "Member {number} · payment reference {reference}",
      editDetails: "Edit details",
      suspendedReason: "Suspended: {reason}",
      savingsBalance: "Savings balance",
      accountNumber: "Account {number}",
      noAccount: "No account opened",
      available: "Available",
      locked: "{amount} locked",
      nothingToWithdraw: "Nothing to withdraw",
      loansOwing: "Loans owing",
      loansOnFile: "{count} loan on file|{count} loans on file",
      overdueLoans: "Overdue loans",
      inArrears: "In arrears",
      upToDate: "Up to date",
      memberFile: "Member file",
      memberNumber: "Member number",
      paymentReference: "Payment reference",
      business: "Business",
      joined: "Joined",
      approvedOn: "Approved",
      contactAccess: "Contact and access",
      emailVerified: "Email verified",
      phoneVerified: "Phone verified",
      mobileMoney: "Mobile money",
      bankAccount: "Bank account",
      lastSignIn: "Last sign-in",
      nextOfKin: "Next of kin",
      theirPhone: "Their phone",
      loans: "Loans",
      colPrincipal: "Principal",
      colPayable: "Payable",
      colRepaid: "Repaid",
      colOutstanding: "Outstanding",
      colDisbursed: "Disbursed",
      daysLate: "{count} day late|{count} days late",
      neverBorrowed: "This member has never taken a loan.",
      recentTransactions: "Recent transactions",
      balanceAfter: "Balance after",
      noTransactions: "No transactions have been posted to this account.",
      notes: "Administrator notes",
      noNotes: "No notes have been recorded on this member.",
      internal: "internal",
    },
    savings: {
      title: "Savings accounts",
      description: "Every member savings account and the balance it holds.",
      totalHeld: "Total held",
      accountCount: "{count} account|{count} accounts",
      locked: "Locked",
      lockedHint: "Pledged against loans and pending withdrawals",
      available: "Available",
      availableHint: "Balance members could withdraw today",
      searchPlaceholder:
        "Member name, number, payment reference or account number…",
      noneTitle: "No savings accounts found",
      noneSearchBody: "No accounts match this search. Try clearing it.",
      noneBody:
        "No savings accounts have been opened yet. One is created when a member is approved.",
      colMember: "Member",
      colAccount: "Account",
      colLocked: "Locked",
      colAvailable: "Available",
      colDeposits: "Deposits",
      colWithdrawn: "Withdrawn",
      colLastActivity: "Last activity",
      transactionCount: "{count} transaction|{count} transactions",
    },
    transactions: {
      title: "Transactions",
      description: "Every movement across every member's savings account.",
    },
    payments: {
      title: "Payments",
      description: "Every payment the association has received from the provider.",
      unmatchedTitle: "Unmatched payments",
      unmatchedDescription:
        "Money received that could not be attributed to a member automatically.",
      unmatchedNoneTitle: "Nothing waiting",
      unmatchedNoneBody:
        "Every payment received has been matched to a member and credited. New unmatched payments will appear here.",
      unmatchedCount:
        "{count} payment awaiting attention.|{count} payments awaiting attention.",
      unmatchedNotice:
        "Each one is money in the association's account that a member has not been credited for. Match it only when you are confident whose it is — the decision is recorded against your name.",
    },
    loans: {
      title: "Loan portfolio",
      description: "Every loan the association has on its books.",
    },
    audit: {
      title: "Audit log",
      description:
        "Every consequential action taken in this association, with who did it and why.",
    },
    withdrawals: {
      title: "Withdrawals",
      description: "Requests awaiting review, and approved payouts to record.",
      noneTitle: "No open withdrawal requests",
      noneBody: "Requests awaiting approval or payout will appear here.",
    },
    import: {
      title: "Import bank statement",
      description: "Upload a PDF statement to credit members who have paid.",
      noPermission:
        "You can upload and preview a statement, but you do not have permission to commit an import. Ask a super administrator for the “Match payments manually” permission.",
      howTitle: "How this works",
      step1: "Upload the PDF statement from your association's bank account.",
      step2:
        "Review every row. The system shows which member each payment would be credited to, and why.",
      step3:
        "Tick the rows you have checked and confirm. Only ticked rows are imported.",
      step4:
        "Members are credited and receive an SMS confirming their new balance.",
      digitalOnly: "The PDF must be a digital statement",
      digitalOnlyBody:
        ", not a scan or a photograph. A scanned image contains no text to read. If your bank only provides scans, ask for the PDF or CSV export from internet banking.",
      reuploadSafe:
        "Re-uploading the same statement is safe. Rows already imported are detected and skipped, so nobody is credited twice.",
      creditsOnly:
        "Only credits can be member contributions. Debits are shown for context but never imported.",
    },
    applications: {
      title: "Loan applications",
      description: "Review applications and disburse approved loans.",
      noneTitle: "No applications waiting",
      noneBody:
        "New loan applications and approved loans awaiting disbursement will appear here.",
    },
    products: {
      title: "Loan products",
      description: "The rules every loan application is assessed against.",
      noneTitle: "No loan products configured",
      noneBody:
        "Members cannot apply for a loan until at least one product exists. Products are created by seeding or by a platform administrator.",
      interest: "Interest",
      amount: "Amount",
      minAmount: "min {amount}",
      inUse: "In use",
      applicationCount: "{count} application|{count} applications",
      eligibility: "Eligibility",
      eligibilityValue:
        "{amount} saved · {months} month membership|{amount} saved · {months} months membership",
      multiplier: "Savings multiplier",
      multiplierValue: "{factor}× savings",
      cappedAt: ", capped at {amount}",
      term: "Term",
      termValue: "{min}–{max} months, {frequency}",
      processingFee: "Processing fee",
      insuranceFee: "Insurance fee",
      latePenalty: "Late penalty",
      graceDays: " after {count} grace day| after {count} grace days",
      guarantors: "Guarantors",
      guarantorsRequired: "{count} required",
      notRequired: "Not required",
      collateral: "Collateral",
      required: "Required",
      concurrent: "Concurrent loans",
      singleLoan: "One active loan per member",
      multipleAllowed: "Multiple allowed",
      advisoryNote:
        "These rules are advisory in the application form and authoritative on submission — eligibility is re-checked server-side when a member applies, so changing a product here changes what is actually enforced.",
    },
    reports: {
      title: "Reports",
      description: "Where the association's money is, and how it moved.",
      savingsHeld: "Savings held",
      activeMembers: "{count} active member|{count} active members",
      loansOutstanding: "Loans outstanding",
      activeLoans: "{count} active loan|{count} active loans",
      inArrears: "In arrears",
      overdueCount: "{count} overdue",
      members: "Members",
      joinedThisMonth: "{count} joined this month",
    },
    notifications: {
      title: "Notifications",
      description:
        "Everything the system has sent to members, and whether it arrived.",
      sent: "Notifications sent",
      notYetRead: "{count} not yet read",
      delivered: "Delivered",
      deliveredHint: "Confirmed by the provider",
      handedOver: "Sent",
      handedOverHint: "Handed to the provider",
      failed: "Failed deliveries",
      failedHint: "Members were not reached",
      noFailures: "No delivery failures",
      event: "Event",
      allEvents: "All events",
      noneTitle: "Nothing has been sent yet",
      noneBody:
        "Notifications are raised automatically when payments are credited, loans are decided and withdrawals are processed.",
      colRecipient: "Recipient",
      colMessage: "Message",
      colDelivery: "Delivery",
      colSent: "Sent",
      colRead: "Read",
      inAppOnly: "In-app only",
      read: "Read",
      unread: "Unread",
    },
    settings: {
      title: "Association settings",
      descriptionPlain: "Configuration for a single association.",
      description: "Configuration for {association}.",
      noAssociationTitle: "No association selected",
      noAssociationBody:
        "These settings belong to one association. Open an association from the platform directory, or use platform settings for global configuration.",
      profile: "Profile",
      legalName: "Legal name",
      code: "Code",
      registrationNo: "Registration no.",
      taxId: "Tax id",
      currency: "Currency",
      timezone: "Timezone",
      created: "Created",
      contact: "Contact",
      website: "Website",
      administrators: "Administrators",
      loanProducts: "Loan products",
      collectionAccount: "Collection account",
      bank: "Bank",
      accountName: "Account name",
      accountNumber: "Account number",
      branchCode: "Branch code",
      referenceSequence: "Reference sequence",
      referenceSequenceHint:
        "Next member payment reference is minted from this counter",
      rules: "Savings and withdrawal rules",
      minimumDeposit: "Minimum deposit",
      maximumDeposit: "Maximum deposit",
      noLimit: "No limit",
      minimumBalance: "Minimum balance",
      withdrawalsLabel: "Withdrawals",
      allowed: "Allowed",
      suspended: "Suspended",
      approvalRequired: "Approval required",
      withdrawalFee: "Withdrawal fee",
      noticePeriod: "Notice period",
      noticeDays: "{count} day|{count} days",
      monthlyContribution: "Monthly contribution",
      dueDay: ", due day {day}",
      notEnforced: "Not enforced",
      annualInterest: "Annual interest",
      noRule:
        "No savings rule is configured, so platform defaults apply: deposits are unrestricted and withdrawals require approval.",
      storedConfiguration: "Stored configuration",
      noStoredSettings:
        "This association has no stored settings; platform defaults apply to everything.",
      readOnlyNote:
        "This screen is read-only. Changing a financial rule alters how every future deposit, withdrawal and loan is calculated, so edits are made through a migration or by a platform administrator, and every change is recorded in the audit log.",
    },
  },

  rw: {
    overview: {
      title: "Incamake ya {association}",
      platform: "Urubuga",
      description: "Uko bihagaze uyu munsi ku buzigame, inguzanyo n'ubwishyu.",
      unmatchedPayments:
        "Ubwishyu {count} butarahuzwa|Ubwishyu {count} butarahuzwa",
      unmatchedDetail:
        "{amount} yakiriwe ariko ntiyandikwa kuri konti y'umunyamuryango",
      overdueLoans:
        "Inguzanyo {count} yarengeje igihe|Inguzanyo {count} zarengeje igihe",
      overdueDetail: "{amount} y'umwenda urengeje igihe",
      membershipApplications:
        "Ubusabe {count} bw'ubunyamuryango|Ubusabe {count} bw'ubunyamuryango",
      awaitingApproval: "Butegereje ko wemeza",
      suspiciousTitle: "Ubwishyu bushidikanywaho",
      suspiciousBody:
        "Ubwishyu {count} bwashyizwe ku ruhande kandi bwahagaritswe.|Ubwishyu {count} bwashyizwe ku ruhande kandi bwahagaritswe.",
      reviewThem: "Busuzume",
      funds: "Amafaranga y'ihuriro",
      totalSavings: "Ubuzigame bwose bufitwe",
      activeMembers:
        "Umunyamuryango {count} ukora|Abanyamuryango {count} bakora",
      collectedToday: "Yakiriwe uyu munsi",
      transactionsToday: "Igikorwa {count}|Ibikorwa {count}",
      collectedThisMonth: "Yakiriwe uku kwezi",
      withdrawalsHint: "Ubwikuze {amount}",
      outstandingLoans: "Inguzanyo zisigaye",
      activeLoans: "Inguzanyo {count} iriho|Inguzanyo {count} ziriho",
      needsAttention: "Bisaba kwitabwaho",
      pendingApplications: "Ubusabe butegereje",
      pendingApplicationsHint: "Ubusabe bw'inguzanyo butegereje isuzuma",
      pendingWithdrawals: "Ubwikuze butegereje",
      unmatchedCount: "Ubwishyu butarahuzwa",
      overdueCount: "Inguzanyo zarengeje igihe",
      membership: "Ubunyamuryango",
      totalMembers: "Abanyamuryango bose",
      joinedThisMonth: "{count} binjiye uku kwezi",
      active: "Barakora",
      pendingApproval: "Bategereje kwemezwa",
      suspended: "Bahagaritswe",
      monthlyDeposits: "Ubwitso bwa buri kwezi",
      monthlyDepositsHint: "Imisanzu yakiriwe buri kwezi",
      monthlyWithdrawals: "Ubwikuze bwa buri kwezi",
      monthlyWithdrawalsHint: "Yishyuwe buri kwezi",
      seriesDeposits: "Ubwitso",
      seriesWithdrawals: "Ubwikuze",
      noData: "Nta makuru ahari kuri iki gihe.",
      latestTransactions: "Ibikorwa biheruka",
      colChannel: "Uburyo",
      noTransactions: "Nta gikorwa kirandikwa.",
    },
    members: {
      title: "Abanyamuryango",
      inRegister:
        "Umunyamuryango {count} uri mu gitabo.|Abanyamuryango {count} bari mu gitabo.",
      enrol: "Injiza umunyamuryango",
      noneTitle: "Nta munyamuryango wabonetse",
      noneBody:
        "Nta munyamuryango uhuye n'ibyo washungurishije. Gerageza usibe ibyo washakishije.",
      colMember: "Umunyamuryango",
      colContact: "Aho bamugeraho",
      colSavings: "Ubuzigame",
      colLoanOwing: "Umwenda w'inguzanyo",
      colKyc: "Umwirondoro",
      colJoined: "Yinjiye",
      overdue: "byarengeje igihe",

      pendingTitle: "Bategereje kwemezwa",
      pendingDescription: "Ubusabe bw'ubunyamuryango butegereje icyemezo.",
      pendingNoneTitle: "Nta kintu gitegereje",
      pendingNoneBody:
        "Ubusabe bwose bw'ubunyamuryango bwasuzumwe. Ubusabe bushya buzagaragara hano.",
      pendingNotice:
        "Kwemeza bituma ubwinjiro bw'umunyamuryango butangira gukora kandi konti ye y'ubuzigame ifungurwa. Azoherezwa nimero ye y'ubwishyu, ari yo imisanzu ye ihuzwa na yo.",

      newTitle: "Injiza umunyamuryango",
      newDescription:
        "Ongeraho umuntu mu gitabo cya {association} ako kanya, utegereje ko yiyandikisha.",
      newDescriptionPlain: "Ongeraho umuntu mu gitabo cy'ihuriro.",
      backToRegister: "Subira ku gitabo",
      noAssociationTitle: "Nta huriro ryatoranyijwe",
      noAssociationBody:
        "Abanyamuryango bari mu ihuriro rimwe. Fungura ihuriro mu rutonde rw'urubuga mbere yo kwinjiza umuntu.",

      editTitle: "Hindura {name}",
      editDescription:
        "Umunyamuryango {number}. Nimero ye y'umunyamuryango na nimero y'ubwishyu ntizihinduka — zanditse ku mabwiriza yose y'ubwishyu afite.",
      backToFile: "Subira ku dosiye y'umunyamuryango",
    },
    file: {
      description: "Umunyamuryango {number} · nimero y'ubwishyu {reference}",
      editDetails: "Hindura amakuru",
      suspendedReason: "Yahagaritswe: {reason}",
      savingsBalance: "Amafaranga y'ubuzigame",
      accountNumber: "Konti {number}",
      noAccount: "Nta konti yafunguwe",
      available: "Ashobora gukoreshwa",
      locked: "{amount} yafatiriwe",
      nothingToWithdraw: "Nta yo kubikuza",
      loansOwing: "Umwenda w'inguzanyo",
      loansOnFile:
        "Inguzanyo {count} iri mu dosiye|Inguzanyo {count} ziri mu dosiye",
      overdueLoans: "Inguzanyo zarengeje igihe",
      inArrears: "Arafite umwenda urengeje igihe",
      upToDate: "Ari ku gihe",
      memberFile: "Dosiye y'umunyamuryango",
      memberNumber: "Nimero y'umunyamuryango",
      paymentReference: "Nimero y'ubwishyu",
      business: "Ubucuruzi",
      joined: "Yinjiye",
      approvedOn: "Yemejwe",
      contactAccess: "Aho bamugeraho n'uburenganzira",
      emailVerified: "Imeyili yemejwe",
      phoneVerified: "Telefone yemejwe",
      mobileMoney: "Mobile money",
      bankAccount: "Konti ya banki",
      lastSignIn: "Ubwinjiro buheruka",
      nextOfKin: "Uwo begereye",
      theirPhone: "Telefone ye",
      loans: "Inguzanyo",
      colPrincipal: "Umwenda w'ibanze",
      colPayable: "Agomba kwishyurwa",
      colRepaid: "Yishyuwe",
      colOutstanding: "Asigaye",
      colDisbursed: "Yatanzwe",
      daysLate: "Umunsi {count} warenze|Iminsi {count} yarenze",
      neverBorrowed: "Uyu munyamuryango ntiyafashe inguzanyo na rimwe.",
      recentTransactions: "Ibikorwa biherutse",
      balanceAfter: "Amafaranga asigaye",
      noTransactions: "Nta gikorwa cyanditswe kuri iyi konti.",
      notes: "Ibyitonderwa by'umuyobozi",
      noNotes: "Nta cyitonderwa cyanditswe kuri uyu munyamuryango.",
      internal: "by'imbere",
    },
    savings: {
      title: "Konti z'ubuzigame",
      description:
        "Konti zose z'ubuzigame z'abanyamuryango n'amafaranga ziriho.",
      totalHeld: "Yose afitwe",
      accountCount: "Konti {count}|Konti {count}",
      locked: "Yafatiriwe",
      lockedHint: "Yafatiriwe kubera inguzanyo n'ubwikuze butegereje",
      available: "Ashobora gukoreshwa",
      availableHint: "Amafaranga abanyamuryango bashobora kubikuza uyu munsi",
      searchPlaceholder:
        "Izina ry'umunyamuryango, nimero ye, nimero y'ubwishyu cyangwa nimero ya konti…",
      noneTitle: "Nta konti y'ubuzigame yabonetse",
      noneSearchBody:
        "Nta konti ihuye n'ibyo washakishije. Gerageza usibe ibyo washakishije.",
      noneBody:
        "Nta konti y'ubuzigame irafungurwa. Ifungurwa igihe umunyamuryango yemejwe.",
      colMember: "Umunyamuryango",
      colAccount: "Konti",
      colLocked: "Yafatiriwe",
      colAvailable: "Ashobora gukoreshwa",
      colDeposits: "Ubwitso",
      colWithdrawn: "Yabikujwe",
      colLastActivity: "Igikorwa giheruka",
      transactionCount: "Igikorwa {count}|Ibikorwa {count}",
    },
    transactions: {
      title: "Ibikorwa",
      description:
        "Ibikorwa byose byakozwe kuri konti z'ubuzigame z'abanyamuryango bose.",
    },
    payments: {
      title: "Ubwishyu",
      description: "Ubwishyu bwose ihuriro ryakiriye kuva ku utanga serivisi.",
      unmatchedTitle: "Ubwishyu butarahuzwa",
      unmatchedDescription:
        "Amafaranga yakiriwe adashoboye guhuzwa n'umunyamuryango byikora.",
      unmatchedNoneTitle: "Nta kintu gitegereje",
      unmatchedNoneBody:
        "Ubwishyu bwose bwakiriwe bwahujwe n'abanyamuryango kandi bwanditswe. Ubwishyu butarahuzwa buzagaragara hano.",
      unmatchedCount:
        "Ubwishyu {count} butegereje kwitabwaho.|Ubwishyu {count} butegereje kwitabwaho.",
      unmatchedNotice:
        "Buri bumwe ni amafaranga ari kuri konti y'ihuriro umunyamuryango atarandikirwa. Buhuze gusa iyo uzi neza uwo ari bwe — icyemezo cyandikwa ku izina ryawe.",
    },
    loans: {
      title: "Inguzanyo zose",
      description: "Inguzanyo zose ihuriro rifite mu bitabo byaryo.",
    },
    audit: {
      title: "Ibyakozwe byose",
      description:
        "Igikorwa cyose cy'ingirakamaro cyakozwe muri iri huriro, n'uwagikoze n'impamvu.",
    },
    withdrawals: {
      title: "Kubikuza",
      description:
        "Ubusabe butegereje isuzuma, n'ubwishyu bwemejwe bugomba kwandikwa.",
      noneTitle: "Nta busabe bwo kubikuza bufunguye",
      noneBody:
        "Ubusabe butegereje kwemezwa cyangwa kwishyurwa buzagaragara hano.",
    },
    import: {
      title: "Kwinjiza inyandiko ya banki",
      description:
        "Ohereza inyandiko ya banki (PDF) kugira ngo abanyamuryango bishyuye bandikirwe.",
      noPermission:
        "Ushobora kohereza no kureba inyandiko, ariko ntufite uburenganzira bwo kwemeza kwinjiza. Saba umuyobozi mukuru uburenganzira bwa “Guhuza ubwishyu n'intoki”.",
      howTitle: "Uko bikorwa",
      step1: "Ohereza inyandiko PDF iva kuri konti ya banki y'ihuriro ryanyu.",
      step2:
        "Suzuma buri murongo. Sisitemu yerekana umunyamuryango buri bwishyu bwandikirwa, n'impamvu.",
      step3:
        "Shyira akamenyetso ku mirongo wagenzuye hanyuma wemeze. Imirongo ifite akamenyetso gusa yinjizwa.",
      step4:
        "Abanyamuryango bandikirwa kandi bakohererezwa ubutumwa bwemeza amafaranga bafite.",
      digitalOnly: "Inyandiko PDF igomba kuba iya digitale",
      digitalOnlyBody:
        ", ntabwo ari iyakoporowe cyangwa ifoto. Ifoto yakoporowe ntirimo inyandiko ishobora kusomwa. Niba banki yanyu itanga gusa amakopi, sabaza PDF cyangwa CSV kuri interineti ya banki.",
      reuploadSafe:
        "Kongera kohereza inyandiko imwe nta kibazo. Imirongo yamaze kwinjizwa imenyekana kandi isimbukwa, ku buryo nta muntu wandikirwa kabiri.",
      creditsOnly:
        "Amafaranga yinjiye gusa ashobora kuba imisanzu y'abanyamuryango. Ayasohotse yerekanwa kugira ngo umenye uko byagenze ariko ntayinjizwa.",
    },
    applications: {
      title: "Ubusabe bw'inguzanyo",
      description: "Suzuma ubusabe kandi utange inguzanyo zemejwe.",
      noneTitle: "Nta busabe butegereje",
      noneBody:
        "Ubusabe bushya bw'inguzanyo n'inguzanyo zemejwe zitegereje gutangwa bizagaragara hano.",
    },
    products: {
      title: "Ubwoko bw'inguzanyo",
      description: "Amabwiriza buri busabe bw'inguzanyo busuzumirwa.",
      noneTitle: "Nta bwoko bw'inguzanyo bwashyizweho",
      noneBody:
        "Abanyamuryango ntibashobora gusaba inguzanyo hatariho nibura ubwoko bumwe. Ubwoko bushyirwaho n'umuyobozi w'urubuga.",
      interest: "Inyungu",
      amount: "Umubare",
      minAmount: "muto {amount}",
      inUse: "Zikoreshwa",
      applicationCount: "Ubusabe {count}|Ubusabe {count}",
      eligibility: "Ibisabwa",
      eligibilityValue:
        "{amount} yazigamwe · ukwezi {months} mu bunyamuryango|{amount} yazigamwe · amezi {months} mu bunyamuryango",
      multiplier: "Ikigereranyo ku buzigame",
      multiplierValue: "{factor}× ubuzigame",
      cappedAt: ", ntarengwa {amount}",
      term: "Igihe",
      termValue: "Amezi {min}–{max}, {frequency}",
      processingFee: "Amafaranga y'itunganya",
      insuranceFee: "Amafaranga y'ubwishingizi",
      latePenalty: "Ihazabu yo gutinda",
      graceDays:
        " nyuma y'umunsi {count} w'imbabazi| nyuma y'iminsi {count} y'imbabazi",
      guarantors: "Abishingizi",
      guarantorsRequired: "{count} basabwa",
      notRequired: "Ntibisabwa",
      collateral: "Ingwate",
      required: "Birasabwa",
      concurrent: "Inguzanyo nyinshi icyarimwe",
      singleLoan: "Inguzanyo imwe ikora ku munyamuryango",
      multipleAllowed: "Nyinshi zemewe",
      advisoryNote:
        "Aya mabwiriza ni inama mu rupapuro rw'ubusabe kandi ni itegeko igihe ubusabe bwoherejwe — ibisabwa bisubirwamo kuri seriveri igihe umunyamuryango asaba, ku buryo guhindura ubwoko hano bihindura ibyubahirizwa koko.",
    },
    reports: {
      title: "Raporo",
      description: "Aho amafaranga y'ihuriro ari, n'uko yagenze.",
      savingsHeld: "Ubuzigame bufitwe",
      activeMembers:
        "Umunyamuryango {count} ukora|Abanyamuryango {count} bakora",
      loansOutstanding: "Inguzanyo zisigaye",
      activeLoans: "Inguzanyo {count} iriho|Inguzanyo {count} ziriho",
      inArrears: "Umwenda urengeje igihe",
      overdueCount: "{count} yarengeje igihe",
      members: "Abanyamuryango",
      joinedThisMonth: "{count} binjiye uku kwezi",
    },
    notifications: {
      title: "Ubutumwa",
      description:
        "Ubutumwa bwose sisitemu yohereje abanyamuryango, n'uko bwageze.",
      sent: "Ubutumwa bwoherejwe",
      notYetRead: "{count} butarasomwa",
      delivered: "Bwageze",
      deliveredHint: "Byemejwe n'utanga serivisi",
      handedOver: "Bwoherejwe",
      handedOverHint: "Bwahawe utanga serivisi",
      failed: "Ubutumwa butageze",
      failedHint: "Abanyamuryango ntibagezweho",
      noFailures: "Nta butumwa butageze",
      event: "Igikorwa",
      allEvents: "Ibikorwa byose",
      noneTitle: "Nta butumwa burohererezwa",
      noneBody:
        "Ubutumwa bwoherezwa byikora igihe ubwishyu bwanditswe, inguzanyo zafatiwe icyemezo n'ubwikuze bwatunganyijwe.",
      colRecipient: "Uwoherejwe",
      colMessage: "Ubutumwa",
      colDelivery: "Uko bwageze",
      colSent: "Bwoherejwe",
      colRead: "Bwasomwe",
      inAppOnly: "Muri porogaramu gusa",
      read: "Bwasomwe",
      unread: "Butarasomwa",
    },
    settings: {
      title: "Igenamiterere ry'ihuriro",
      descriptionPlain: "Igenamiterere ry'ihuriro rimwe.",
      description: "Igenamiterere rya {association}.",
      noAssociationTitle: "Nta huriro ryatoranyijwe",
      noAssociationBody:
        "Iri genamiterere ni ry'ihuriro rimwe. Fungura ihuriro mu rutonde rw'urubuga, cyangwa ukoreshe igenamiterere ry'urubuga rusange.",
      profile: "Umwirondoro",
      legalName: "Izina ryemewe n'amategeko",
      code: "Kode",
      registrationNo: "Nimero y'iyandikwa",
      taxId: "Nimero y'imisoro",
      currency: "Ifaranga",
      timezone: "Isaha y'akarere",
      created: "Ryashyizweho",
      contact: "Aho bagerwaho",
      website: "Urubuga",
      administrators: "Abayobozi",
      loanProducts: "Ubwoko bw'inguzanyo",
      collectionAccount: "Konti yakira amafaranga",
      bank: "Banki",
      accountName: "Izina rya konti",
      accountNumber: "Nimero ya konti",
      branchCode: "Kode y'ishami",
      referenceSequence: "Urukurikirane rwa nimero z'ubwishyu",
      referenceSequenceHint:
        "Nimero y'ubwishyu y'umunyamuryango ukurikira ikorwa kuva kuri iyi mibare",
      rules: "Amabwiriza yo kuzigama no kubikuza",
      minimumDeposit: "Ubwitso buto ntarengwa",
      maximumDeposit: "Ubwitso bunini ntarengwa",
      noLimit: "Nta ntarengwa",
      minimumBalance: "Amafaranga make ntarengwa",
      withdrawalsLabel: "Kubikuza",
      allowed: "Byemewe",
      suspended: "Byahagaritswe",
      approvalRequired: "Bisaba kwemezwa",
      withdrawalFee: "Ikiguzi cyo kubikuza",
      noticePeriod: "Igihe cyo kumenyesha",
      noticeDays: "Umunsi {count}|Iminsi {count}",
      monthlyContribution: "Umusanzu w'ukwezi",
      dueDay: ", ku munsi wa {day}",
      notEnforced: "Ntibitegetswe",
      annualInterest: "Inyungu ku mwaka",
      noRule:
        "Nta bwiriza ry'ubuzigame ryashyizweho, bityo amabwiriza asanzwe y'urubuga akoreshwa: ubwitso ntibugarukira kandi kubikuza bisaba kwemezwa.",
      storedConfiguration: "Igenamiterere ryabitswe",
      noStoredSettings:
        "Iri huriro nta genamiterere ryabitswe rifite; amabwiriza asanzwe y'urubuga akurikizwa kuri byose.",
      readOnlyNote:
        "Uru rupapuro ni urwo kureba gusa. Guhindura ibwiriza ry'imari bihindura uko buri bwitso, ubwikuze n'inguzanyo bizabarwa, bityo impinduka zikorwa n'umuyobozi w'urubuga, kandi buri mpinduka yandikwa mu gitabo cy'ibyakozwe.",
    },
  },
};
