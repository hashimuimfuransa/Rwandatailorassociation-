import type { Locale } from "@/types";

/**
 * The member's own dashboard: savings, loans, withdrawals, statements, profile.
 *
 * The most important area of the platform to translate. An administrator is
 * paid to learn the system's vocabulary; a tailor is not, and this is where
 * they read what they are owed and what they owe. Where a sentence carries
 * money or a deadline it is translated in full rather than shortened, because
 * a member acting on half an instruction is the failure this is meant to avoid.
 */
export interface MemberCopy {
  overview: {
    welcome: string;
    lastActivity: string;
    firstContribution: string;
    overdueTitle: string;
    overdueBody: string;
    makeRepayment: string;
    applicationTitle: string;
    applicationBody: string;
    viewDetails: string;
    savingsBalance: string;
    availableHint: string;
    activeLoan: string;
    noLoanRunning: string;
    outstandingLoan: string;
    repaidPercent: string;
    nothingOwed: string;
    nextRepayment: string;
    dueOn: string;
    dueInDays: string;
    noRepaymentScheduled: string;
    quickActions: string;
    makeDeposit: string;
    requestWithdrawal: string;
    applyLoan: string;
    borrowQuestion: string;
    borrowUpTo: string;
    borrowUnder: string;
    borrowNeedMinimum: string;
    borrowCurrentBalance: string;
    savingsGrowth: string;
    savingsGrowthHint: string;
    savingsGrowthEmpty: string;
    contributions: string;
    contributionsHint: string;
    contributionsEmpty: string;
    repaymentProgress: string;
    totalPayableHint: string;
    recentTransactions: string;
    noTransactions: string;
    noTransactionsHint: string;
    noAccountTitle: string;
    noAccountBody: string;
  };
  savings: {
    title: string;
    accountOpened: string;
    statement: string;
    deposit: string;
    currentBalance: string;
    transactionCount: string;
    available: string;
    pledged: string;
    nothingPledged: string;
    totalContributed: string;
    lifetimeDeposits: string;
    totalWithdrawn: string;
    lifetimeWithdrawals: string;
    pledgedNotice: string;
    tileDeposit: string;
    tileDepositHint: string;
    tileWithdraw: string;
    tileWithdrawHint: string;
    tileTransactions: string;
    tileTransactionsHint: string;
    recentActivity: string;
    noTransactionsQuote: string;
    noAccountTitle: string;
    noAccountBody: string;
  };
  deposit: {
    title: string;
    description: string;
    alwaysQuoteTitle: string;
    alwaysQuoteBody: string;
    bankTransfer: string;
    bank: string;
    accountName: string;
    accountNumber: string;
    branchCode: string;
    referenceToQuote: string;
    noAccountPublished: string;
    noAccountPhone: string;
    noAccountQuote: string;
    mobileMoney: string;
    mobileMoneyBody: string;
    contributionRules: string;
    minimumDeposit: string;
    monthlyContribution: string;
    dueEachMonth: string;
    day: string;
  };
  transactions: {
    title: string;
    description: string;
    matching: string;
    totalIn: string;
    totalOut: string;
    balanceAfter: string;
    noneFoundTitle: string;
    noneFoundBody: string;
  };
  loans: {
    title: string;
    description: string;
    applyAction: string;
    noneTitle: string;
    noneBody: string;
    applications: string;
    submittedOn: string;
    purpose: string;
    needMoreInformation: string;
    notApproved: string;
    approvedFor: string;
    approvedBody: string;
    disbursedOn: string;
    overdueAmount: string;
    penaltiesMayApply: string;
    interestRate: string;
    perYear: string;
    totalPayable: string;
    repaid: string;
    outstanding: string;
    schedule: string;
    dueDate: string;
    principal: string;
    interest: string;
    fees: string;
    totalDue: string;
    paid: string;
    remaining: string;
  };
  apply: {
    title: string;
    description: string;
    noProductsTitle: string;
    noProductsBody: string;
    activeLoanTitle: string;
    activeLoanBody: string;
    viewMyLoan: string;
  };
  repayments: {
    title: string;
    description: string;
    noLoansTitle: string;
    noLoansBody: string;
    applyAction: string;
    arrearsTitle: string;
    arrearsBody: string;
    totalOutstanding: string;
    acrossLoans: string;
    nextInstalment: string;
    dueOn: string;
    nothingScheduled: string;
    inArrears: string;
    settleSoon: string;
    upToDate: string;
    schedule: string;
    loan: string;
    instalment: string;
    daysLate: string;
    noSchedule: string;
    received: string;
    penalty: string;
    balanceAfter: string;
    noneReceived: string;
    matchingNote: string;
  };
  withdrawals: {
    title: string;
    description: string;
    suspendedTitle: string;
    suspendedBody: string;
    yourRequests: string;
    requested: string;
    fee: string;
    youReceive: string;
    noneYet: string;
    reviewNote: string;
  };
  statements: {
    title: string;
    description: string;
    ledgerNote: string;
    formatNote: string;
  };
  notifications: {
    title: string;
    unread: string;
    upToDate: string;
    noneTitle: string;
    noneBody: string;
    unreadLabel: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
  profile: {
    title: string;
    description: string;
    changePassword: string;
    incompleteTitle: string;
    incompleteBody: string;
    yourReference: string;
    yourReferenceBody: string;
    membership: string;
    memberNumber: string;
    identityCheck: string;
    association: string;
    joined: string;
    approvedOn: string;
    contactSecurity: string;
    emailVerified: string;
    phoneVerified: string;
    notVerified: string;
    twoFactor: string;
    enabled: string;
    disabled: string;
    passwordChanged: string;
    lastSignIn: string;
    personalDetails: string;
    business: string;
    payoutKin: string;
    mobileMoney: string;
    bankAccount: string;
    nextOfKin: string;
    theirPhone: string;
    relationship: string;
    maintainedNote: string;
    anAdministrator: string;
    orCall: string;
  };
  security: {
    title: string;
    description: string;
    forcedTitle: string;
    forcedBody: string;
    activeSessions: string;
    sessionsCount: string;
    sessionsWarning: string;
    recentActivity: string;
    successfulSignIn: string;
    failedAttempt: string;
    unknownIp: string;
    warning: string;
  };
}

export const member: Record<Locale, MemberCopy> = {
  en: {
    overview: {
      welcome: "Welcome, {name}",
      lastActivity: "Last activity on your account: {date}",
      firstContribution:
        "Here is your account. Make your first contribution to get started.",
      overdueTitle: "Your loan repayment is overdue",
      overdueBody:
        "Your loan is {days} day past due. Penalties may apply until it is settled.|Your loan is {days} days past due. Penalties may apply until it is settled.",
      makeRepayment: "Make a repayment",
      applicationTitle: "Loan application {reference}",
      applicationBody: "Your request for {amount} is {status}.",
      viewDetails: "View details",
      savingsBalance: "Savings balance",
      availableHint: "Available: {amount}",
      activeLoan: "Active loan",
      noLoanRunning: "No loan currently running",
      outstandingLoan: "Outstanding loan",
      repaidPercent: "{percent}% repaid",
      nothingOwed: "Nothing owed",
      nextRepayment: "Next repayment",
      dueOn: "Due {date}",
      dueInDays: "in {days} day|in {days} days",
      noRepaymentScheduled: "No repayment scheduled",
      quickActions: "Quick actions",
      makeDeposit: "Make a deposit",
      requestWithdrawal: "Request withdrawal",
      applyLoan: "Apply for a loan",
      borrowQuestion: "How much can I borrow?",
      borrowUpTo: "Up to",
      borrowUnder:
        "under {product}. Final approval depends on your contribution history and the association's review.",
      borrowNeedMinimum: "You need at least",
      borrowCurrentBalance:
        "in savings to qualify{product}. You currently have {balance}.",
      savingsGrowth: "Savings growth",
      savingsGrowthHint: "Closing balance at the end of each month",
      savingsGrowthEmpty:
        "Your savings growth will appear here after your first contribution.",
      contributions: "Monthly contributions",
      contributionsHint: "Deposits and withdrawals over the last 12 months",
      contributionsEmpty:
        "Contribution history will appear here once you start saving.",
      repaymentProgress: "Loan repayment progress",
      totalPayableHint: "{amount} total payable",
      recentTransactions: "Recent transactions",
      noTransactions: "No transactions yet",
      noTransactionsHint:
        "Make your first contribution using payment reference {reference} and it will appear here.",
      noAccountTitle: "No savings account yet",
      noAccountBody:
        "Your membership is active but no savings account has been opened. Please contact your association administrator.",
    },
    savings: {
      title: "My savings",
      accountOpened: "Account {number} · opened {date}",
      statement: "Statement",
      deposit: "Deposit",
      currentBalance: "Current balance",
      transactionCount: "{count} transaction|{count} transactions",
      available: "Available",
      pledged: "{amount} pledged",
      nothingPledged: "Nothing pledged",
      totalContributed: "Total contributed",
      lifetimeDeposits: "Lifetime deposits",
      totalWithdrawn: "Total withdrawn",
      lifetimeWithdrawals: "Lifetime withdrawals",
      pledgedNotice:
        "of your balance is pledged against an active loan or a pending withdrawal, so it cannot be withdrawn until that is settled.",
      tileDeposit: "Make a deposit",
      tileDepositHint: "How to pay, and your reference",
      tileWithdraw: "Request a withdrawal",
      tileWithdrawHint: "Subject to association approval",
      tileTransactions: "All transactions",
      tileTransactionsHint: "Search and filter your history",
      recentActivity: "Recent activity",
      noTransactionsQuote: "No transactions yet. Quote reference",
      noAccountTitle: "No savings account",
      noAccountBody:
        "No savings account has been opened for your membership yet. Please contact your association administrator.",
    },
    deposit: {
      title: "Make a deposit",
      description: "How to send money to your savings account.",
      alwaysQuoteTitle: "Always quote your reference",
      alwaysQuoteBody:
        "cannot be matched to you automatically. It will be held until an administrator identifies it by hand, which delays your balance updating.",
      bankTransfer: "Bank transfer",
      bank: "Bank",
      accountName: "Account name",
      accountNumber: "Account number",
      branchCode: "Branch code",
      referenceToQuote: "Reference to quote",
      noAccountPublished:
        "The association has not yet published its collection account details. Please contact the office",
      noAccountPhone: "on {phone}",
      noAccountQuote: "for payment instructions, and quote",
      mobileMoney: "Mobile money",
      mobileMoneyBody:
        "in the reason or reference field. Payments are collected from the association's bank account and matched automatically — your balance normally updates within 15 minutes of the money arriving.",
      contributionRules: "Contribution rules",
      minimumDeposit: "Minimum deposit",
      monthlyContribution: "Expected monthly contribution",
      dueEachMonth: "Due each month by",
      day: "Day {day}",
    },
    transactions: {
      title: "Transactions",
      description: "Every movement on your savings account, newest first.",
      matching: "Matching transactions",
      totalIn: "Total in",
      totalOut: "Total out",
      balanceAfter: "Balance after",
      noneFoundTitle: "No transactions found",
      noneFoundBody:
        "No transactions match these filters. Try widening the date range or clearing the search.",
    },
    loans: {
      title: "My loans",
      description:
        "Your loan applications, active loans and repayment schedules.",
      applyAction: "Apply for a loan",
      noneTitle: "No loans yet",
      noneBody:
        "You have not applied for a loan. How much you can borrow depends on your savings balance and how long you have been a member.",
      applications: "Applications",
      submittedOn: "submitted {date}",
      purpose: "Purpose:",
      needMoreInformation: "The association needs more information:",
      notApproved: "Not approved:",
      approvedFor: "Approved for",
      approvedBody: ". You will be notified when the funds are disbursed.",
      disbursedOn: "disbursed {date}",
      overdueAmount:
        "{amount} is {days} day overdue.|{amount} is {days} days overdue.",
      penaltiesMayApply: "Penalties may be applied until it is settled.",
      interestRate: "Interest rate",
      perYear: "p.a.",
      totalPayable: "Total payable",
      repaid: "Repaid",
      outstanding: "Outstanding",
      schedule: "Repayment schedule",
      dueDate: "Due date",
      principal: "Principal",
      interest: "Interest",
      fees: "Fees",
      totalDue: "Total due",
      paid: "Paid",
      remaining: "Remaining",
    },
    apply: {
      title: "Apply for a loan",
      description: "Choose a product, then tell us how much you need and what for.",
      noProductsTitle: "No loan products available",
      noProductsBody:
        "The association has not published any loan products yet. Please check back later or contact the office.",
      activeLoanTitle: "You already have an active loan",
      activeLoanBody:
        "This association allows one loan at a time. You can apply again once your current loan is fully repaid.",
      viewMyLoan: "View my loan",
    },
    repayments: {
      title: "Repayments",
      description:
        "Your repayment schedule and everything you have paid so far.",
      noLoansTitle: "You have no active loans",
      noLoansBody:
        "Once a loan is disbursed to you, its repayment schedule will appear here.",
      applyAction: "Apply for a loan",
      arrearsTitle: "You have overdue repayments",
      arrearsBody:
        "{amount} is past its due date. Penalties may continue to accrue until it is settled.",
      totalOutstanding: "Total outstanding",
      acrossLoans: "Across {count} loan|Across {count} loans",
      nextInstalment: "Next instalment",
      dueOn: "Due {date}",
      nothingScheduled: "Nothing scheduled",
      inArrears: "In arrears",
      settleSoon: "Settle as soon as possible",
      upToDate: "You are up to date",
      schedule: "Repayment schedule",
      loan: "Loan",
      instalment: "Instalment",
      daysLate: "{days} day late|{days} days late",
      noSchedule:
        "No schedule has been generated yet. It is created when the loan is disbursed.",
      received: "Repayments received",
      penalty: "Penalty",
      balanceAfter: "Balance after",
      noneReceived: "No repayments have been posted yet.",
      matchingNote:
        "Repayments are matched automatically when you pay using your payment reference {reference}. Allow up to one working day for a payment to appear here.",
    },
    withdrawals: {
      title: "Withdrawals",
      description: "Request money from your savings and track approval.",
      suspendedTitle: "Withdrawals are not currently available",
      suspendedBody:
        "The association has suspended withdrawals. Please contact the office if you need assistance.",
      yourRequests: "Your requests",
      requested: "Requested",
      fee: "Fee",
      youReceive: "You receive",
      noneYet: "You have not requested any withdrawals.",
      reviewNote:
        "Withdrawals are reviewed by the association before payout. Money leaves your balance only once the payout has actually been made.",
    },
    statements: {
      title: "Statements",
      description:
        "Download a statement of your savings account for any period.",
      ledgerNote:
        "Statements are produced directly from the association's transaction ledger. Every entry shows its reference and the running balance after it, so the document reconciles line by line.",
      formatNote:
        "Choose PDF to open a printable statement — use your browser's print dialog and select “Save as PDF”. Choose CSV to open the data in Excel.",
    },
    notifications: {
      title: "Notifications",
      unread: "{count} unread",
      upToDate: "You are up to date.",
      noneTitle: "No notifications",
      noneBody:
        "Payment confirmations, loan updates and reminders will appear here.",
      unreadLabel: "Unread",
      justNow: "just now",
      minutesAgo: "{count}m ago",
      hoursAgo: "{count}h ago",
      daysAgo: "{count}d ago",
    },
    profile: {
      title: "Profile",
      description:
        "Your membership details as they are held by the association.",
      changePassword: "Change password",
      incompleteTitle: "Your contact details are incomplete",
      incompleteBody:
        "The association uses your phone and email to notify you about payments, loan decisions and withdrawals. Ask an administrator to update them.",
      yourReference: "Your payment reference",
      yourReferenceBody:
        "Quote this on every deposit so it is credited to your account automatically. A payment without it has to be matched by hand and will take longer to appear.",
      membership: "Membership",
      memberNumber: "Member number",
      identityCheck: "Identity check",
      association: "Association",
      joined: "Joined",
      approvedOn: "Approved",
      contactSecurity: "Contact and security",
      emailVerified: "Email verified",
      phoneVerified: "Phone verified",
      notVerified: "Not verified",
      twoFactor: "Two-factor",
      enabled: "Enabled",
      disabled: "Disabled",
      passwordChanged: "Password changed",
      lastSignIn: "Last sign-in",
      personalDetails: "Personal details",
      business: "Business",
      payoutKin: "Payout and next of kin",
      mobileMoney: "Mobile money",
      bankAccount: "Bank account",
      nextOfKin: "Next of kin",
      theirPhone: "Their phone",
      relationship: "Relationship",
      maintainedNote:
        "These details are maintained by the association. To correct anything on this page, contact",
      anAdministrator: "an administrator",
      orCall: "or call {phone}",
    },
    security: {
      title: "Security & password",
      description: "Change your password and review recent sign-in activity.",
      forcedTitle: "You must change your password",
      forcedBody:
        "This account was created with a temporary password. Choose a new one before continuing.",
      activeSessions: "Active sessions",
      sessionsCount:
        "You are signed in on {count} device.|You are signed in on {count} devices.",
      sessionsWarning:
        "Changing your password signs out every other device immediately.",
      recentActivity: "Recent sign-in activity",
      successfulSignIn: "Successful sign-in",
      failedAttempt: "Failed attempt",
      unknownIp: "unknown IP",
      warning:
        "If you see a sign-in you do not recognise, change your password immediately and contact your association administrator.",
    },
  },

  rw: {
    overview: {
      welcome: "Murakaza neza, {name}",
      lastActivity: "Igikorwa giheruka kuri konti yawe: {date}",
      firstContribution:
        "Iyi ni konti yawe. Tanga umusanzu wawe wa mbere kugira ngo utangire.",
      overdueTitle: "Ubwishyu bw'inguzanyo yawe burengeje igihe",
      overdueBody:
        "Inguzanyo yawe irengeje umunsi {days}. Ihazabu ishobora gukurikiranwa kugeza yishyuwe.|Inguzanyo yawe irengeje iminsi {days}. Ihazabu ishobora gukurikiranwa kugeza yishyuwe.",
      makeRepayment: "Ishyura",
      applicationTitle: "Ubusabe bw'inguzanyo {reference}",
      applicationBody: "Ubusabe bwawe bwa {amount} ni {status}.",
      viewDetails: "Reba ibisobanuro",
      savingsBalance: "Amafaranga y'ubuzigame",
      availableHint: "Ashobora gukoreshwa: {amount}",
      activeLoan: "Inguzanyo iriho",
      noLoanRunning: "Nta nguzanyo iriho ubu",
      outstandingLoan: "Inguzanyo isigaye",
      repaidPercent: "{percent}% byishyuwe",
      nothingOwed: "Nta mwenda uhari",
      nextRepayment: "Ubwishyu bukurikira",
      dueOn: "Bugomba kwishyurwa {date}",
      dueInDays: "mu munsi umwe|mu minsi {days}",
      noRepaymentScheduled: "Nta bwishyu buteganyijwe",
      quickActions: "Ibikorwa byihuse",
      makeDeposit: "Bitsa amafaranga",
      requestWithdrawal: "Saba kubikuza",
      applyLoan: "Saba inguzanyo",
      borrowQuestion: "Nshobora kuguza angahe?",
      borrowUpTo: "Kugera kuri",
      borrowUnder:
        "kuri {product}. Kwemeza burundu bishingira ku mateka y'imisanzu yawe no ku isuzuma ry'ihuriro.",
      borrowNeedMinimum: "Ukeneye byibuze",
      borrowCurrentBalance:
        "mu buzigame kugira ngo wemererwe{product}. Ubu ufite {balance}.",
      savingsGrowth: "Ukwiyongera k'ubuzigame",
      savingsGrowthHint: "Amafaranga asigaye ku mpera za buri kwezi",
      savingsGrowthEmpty:
        "Ukwiyongera k'ubuzigame bwawe bizagaragara hano nyuma y'umusanzu wawe wa mbere.",
      contributions: "Imisanzu ya buri kwezi",
      contributionsHint: "Ubwitso n'ubwikuze mu mezi 12 ashize",
      contributionsEmpty:
        "Amateka y'imisanzu azagaragara hano nyuma yo gutangira kuzigama.",
      repaymentProgress: "Aho ubwishyu bw'inguzanyo bugeze",
      totalPayableHint: "{amount} agomba kwishyurwa yose",
      recentTransactions: "Ibikorwa biherutse",
      noTransactions: "Nta gikorwa kirakorwa",
      noTransactionsHint:
        "Tanga umusanzu wawe wa mbere ukoresheje nimero y'ubwishyu {reference}, uzagaragara hano.",
      noAccountTitle: "Nta konti y'ubuzigame irahafungurwa",
      noAccountBody:
        "Ubunyamuryango bwawe burakora ariko nta konti y'ubuzigame irafungurwa. Vugana n'umuyobozi w'ihuriro.",
    },
    savings: {
      title: "Ubuzigame bwanjye",
      accountOpened: "Konti {number} · yafunguwe {date}",
      statement: "Inyandiko ya konti",
      deposit: "Bitsa",
      currentBalance: "Amafaranga ari kuri konti",
      transactionCount: "Igikorwa {count}|Ibikorwa {count}",
      available: "Ashobora gukoreshwa",
      pledged: "{amount} yafatiriwe",
      nothingPledged: "Nta yafatiriwe",
      totalContributed: "Amafaranga yose yatanzwe",
      lifetimeDeposits: "Ubwitso bwose bwakozwe",
      totalWithdrawn: "Amafaranga yose yabikujwe",
      lifetimeWithdrawals: "Ubwikuze bwose bwakozwe",
      pledgedNotice:
        "ku mafaranga yawe yafatiriwe kubera inguzanyo iriho cyangwa ubusabe bwo kubikuza butegereje, ku buryo adashobora kubikuzwa kugeza ibyo birangiye.",
      tileDeposit: "Bitsa amafaranga",
      tileDepositHint: "Uko wishyura, na nimero yawe",
      tileWithdraw: "Saba kubikuza",
      tileWithdrawHint: "Bisaba kwemezwa n'ihuriro",
      tileTransactions: "Ibikorwa byose",
      tileTransactionsHint: "Shakisha kandi ushungure amateka yawe",
      recentActivity: "Ibikorwa biherutse",
      noTransactionsQuote: "Nta gikorwa kirakorwa. Andika nimero",
      noAccountTitle: "Nta konti y'ubuzigame",
      noAccountBody:
        "Nta konti y'ubuzigame irafungurwa ku bunyamuryango bwawe. Vugana n'umuyobozi w'ihuriro.",
    },
    deposit: {
      title: "Bitsa amafaranga",
      description: "Uko wohereza amafaranga kuri konti yawe y'ubuzigame.",
      alwaysQuoteTitle: "Buri gihe andika nimero yawe y'ubwishyu",
      alwaysQuoteBody:
        "ntibashobora guhuzwa nawe byikora. Bizabikwa kugeza umuyobozi abimenye n'intoki, bituma amafaranga yawe atinda kugaragara.",
      bankTransfer: "Kohereza kuri banki",
      bank: "Banki",
      accountName: "Izina rya konti",
      accountNumber: "Nimero ya konti",
      branchCode: "Kode y'ishami",
      referenceToQuote: "Nimero ugomba kwandika",
      noAccountPublished:
        "Ihuriro ntiratangaza amakuru ya konti yakira amafaranga. Vugana n'ibiro",
      noAccountPhone: "kuri {phone}",
      noAccountQuote: "kubona amabwiriza y'ubwishyu, kandi wandike",
      mobileMoney: "Mobile money",
      mobileMoneyBody:
        "mu mwanya w'impamvu cyangwa wa nimero y'ubwishyu. Amafaranga akurwa kuri konti ya banki y'ihuriro kandi ahuzwa byikora — amafaranga yawe akunda kugaragara mu minota 15 nyuma yo kugera.",
      contributionRules: "Amabwiriza y'imisanzu",
      minimumDeposit: "Ubwitso buto ntarengwa",
      monthlyContribution: "Umusanzu w'ukwezi witezwe",
      dueEachMonth: "Bugomba kwishyurwa buri kwezi bitarenze",
      day: "Umunsi wa {day}",
    },
    transactions: {
      title: "Ibikorwa",
      description:
        "Ibikorwa byose byakozwe kuri konti yawe y'ubuzigame, bishya mbere.",
      matching: "Ibikorwa bihuye",
      totalIn: "Ayinjiye yose",
      totalOut: "Ayasohotse yose",
      balanceAfter: "Amafaranga asigaye",
      noneFoundTitle: "Nta gikorwa cyabonetse",
      noneFoundBody:
        "Nta gikorwa gihuye n'ibyo washungurishije. Gerageza wagure igihe cyangwa usibe ibyo washakishije.",
    },
    loans: {
      title: "Inguzanyo zanjye",
      description:
        "Ubusabe bwawe bw'inguzanyo, inguzanyo ziriho na gahunda y'ubwishyu.",
      applyAction: "Saba inguzanyo",
      noneTitle: "Nta nguzanyo irahari",
      noneBody:
        "Ntiwasabye inguzanyo. Amafaranga ushobora kuguza bishingira ku buzigame bwawe n'igihe umaze mu ihuriro.",
      applications: "Ubusabe",
      submittedOn: "bwatanzwe {date}",
      purpose: "Impamvu:",
      needMoreInformation: "Ihuriro rikeneye andi makuru:",
      notApproved: "Ntibyemewe:",
      approvedFor: "Byemewe kuri",
      approvedBody: ". Uzamenyeshwa igihe amafaranga azoherezwa.",
      disbursedOn: "yatanzwe {date}",
      overdueAmount:
        "{amount} yarengeje umunsi {days}.|{amount} yarengeje iminsi {days}.",
      penaltiesMayApply:
        "Ihazabu ishobora gushyirwaho kugeza byishyuwe.",
      interestRate: "Inyungu",
      perYear: "ku mwaka",
      totalPayable: "Yose agomba kwishyurwa",
      repaid: "Yishyuwe",
      outstanding: "Asigaye",
      schedule: "Gahunda y'ubwishyu",
      dueDate: "Itariki ntarengwa",
      principal: "Umwenda w'ibanze",
      interest: "Inyungu",
      fees: "Amafaranga y'ikiguzi",
      totalDue: "Yose agomba kwishyurwa",
      paid: "Yishyuwe",
      remaining: "Asigaye",
    },
    apply: {
      title: "Saba inguzanyo",
      description:
        "Hitamo ubwoko bw'inguzanyo, hanyuma utubwire amafaranga ukeneye n'icyo uzayakoresha.",
      noProductsTitle: "Nta bwoko bw'inguzanyo buhari",
      noProductsBody:
        "Ihuriro ntiratangaza ubwoko bw'inguzanyo. Ongera ugaruke cyangwa uvugane n'ibiro.",
      activeLoanTitle: "Usanzwe ufite inguzanyo iriho",
      activeLoanBody:
        "Iri huriro ryemera inguzanyo imwe icyarimwe. Uzashobora kongera gusaba nyuma yo kwishyura inguzanyo yawe yose.",
      viewMyLoan: "Reba inguzanyo yanjye",
    },
    repayments: {
      title: "Kwishyura",
      description:
        "Gahunda y'ubwishyu bwawe n'ibyose umaze kwishyura.",
      noLoansTitle: "Nta nguzanyo iriho ufite",
      noLoansBody:
        "Igihe inguzanyo izaba yakoherejwe, gahunda y'ubwishyu izagaragara hano.",
      applyAction: "Saba inguzanyo",
      arrearsTitle: "Ufite ubwishyu bwarengeje igihe",
      arrearsBody:
        "{amount} yarengeje itariki ntarengwa. Ihazabu ishobora gukomeza kwiyongera kugeza yishyuwe.",
      totalOutstanding: "Umwenda wose usigaye",
      acrossLoans: "Ku nguzanyo imwe|Ku nguzanyo {count}",
      nextInstalment: "Igice cy'ubwishyu gikurikira",
      dueOn: "Kigomba kwishyurwa {date}",
      nothingScheduled: "Nta kiteganyijwe",
      inArrears: "Byarengeje igihe",
      settleSoon: "Ishyura vuba bishoboka",
      upToDate: "Uri ku gihe",
      schedule: "Gahunda y'ubwishyu",
      loan: "Inguzanyo",
      instalment: "Igice cy'ubwishyu",
      daysLate: "Umunsi {days} warenze|Iminsi {days} yarenze",
      noSchedule:
        "Nta gahunda irakorwa. Ikorwa igihe inguzanyo yoherejwe.",
      received: "Ubwishyu bwakiriwe",
      penalty: "Ihazabu",
      balanceAfter: "Amafaranga asigaye",
      noneReceived: "Nta bwishyu burashyirwaho.",
      matchingNote:
        "Ubwishyu buhuzwa byikora igihe wishyuye ukoresheje nimero yawe y'ubwishyu {reference}. Tegereza kugeza ku munsi umwe w'akazi ngo ubwishyu bugaragare hano.",
    },
    withdrawals: {
      title: "Kubikuza",
      description:
        "Saba amafaranga ku buzigame bwawe kandi ukurikirane uko byemezwa.",
      suspendedTitle: "Kubikuza ntibishoboka ubu",
      suspendedBody:
        "Ihuriro rimaze guhagarika kubikuza. Vugana n'ibiro niba ukeneye ubufasha.",
      yourRequests: "Ubusabe bwawe",
      requested: "Byasabwe",
      fee: "Ikiguzi",
      youReceive: "Uzahabwa",
      noneYet: "Ntiwasabye kubikuza na rimwe.",
      reviewNote:
        "Ubusabe bwo kubikuza busuzumwa n'ihuriro mbere yo kwishyurwa. Amafaranga akurwa ku konti yawe ari uko yishyuwe koko.",
    },
    statements: {
      title: "Inyandiko za konti",
      description:
        "Kuramo inyandiko ya konti yawe y'ubuzigame ku gihe icyo ari cyo cyose.",
      ledgerNote:
        "Inyandiko za konti zikorwa hakoreshejwe igitabo cy'ibikorwa cy'ihuriro. Buri gikorwa kigaragaza nimero yacyo n'amafaranga asigaye nyuma yacyo, ku buryo inyandiko ihuza umurongo ku murongo.",
      formatNote:
        "Hitamo PDF kugira ngo ubone inyandiko ishobora gucapwa — koresha idirishya ryo gucapa rya mushakisha hanyuma uhitemo “Save as PDF”. Hitamo CSV kugira ngo ufungure amakuru muri Excel.",
    },
    notifications: {
      title: "Ubutumwa",
      unread: "{count} butarasomwa",
      upToDate: "Uri ku gihe.",
      noneTitle: "Nta butumwa buhari",
      noneBody:
        "Kwemeza ubwishyu, amakuru y'inguzanyo n'ibyibutsa bizagaragara hano.",
      unreadLabel: "Butarasomwa",
      justNow: "nonaha",
      minutesAgo: "hashize iminota {count}",
      hoursAgo: "hashize amasaha {count}",
      daysAgo: "hashize iminsi {count}",
    },
    profile: {
      title: "Umwirondoro",
      description:
        "Amakuru y'ubunyamuryango bwawe nk'uko ihuriro ayafite.",
      changePassword: "Hindura ijambobanga",
      incompleteTitle: "Amakuru yawe yo kuvugana ntuzuye",
      incompleteBody:
        "Ihuriro rikoresha telefone na imeyili yawe mu kumenyesha ibijyanye n'ubwishyu, ibyemezo by'inguzanyo no kubikuza. Saba umuyobozi kuyavugurura.",
      yourReference: "Nimero yawe y'ubwishyu",
      yourReferenceBody:
        "Andika iyi nimero kuri buri bwitso kugira ngo yandikwe kuri konti yawe ako kanya. Ubwishyu butayifite bugomba guhuzwa n'intoki kandi butinda kugaragara.",
      membership: "Ubunyamuryango",
      memberNumber: "Nimero y'umunyamuryango",
      identityCheck: "Igenzura ry'umwirondoro",
      association: "Ihuriro",
      joined: "Yinjiye",
      approvedOn: "Yemejwe",
      contactSecurity: "Kuvugana n'umutekano",
      emailVerified: "Imeyili yemejwe",
      phoneVerified: "Telefone yemejwe",
      notVerified: "Ntiyemejwe",
      twoFactor: "Kwemeza kabiri",
      enabled: "Birakora",
      disabled: "Ntibikora",
      passwordChanged: "Ijambobanga ryahindutse",
      lastSignIn: "Ubwinjiro buheruka",
      personalDetails: "Amakuru bwite",
      business: "Ubucuruzi",
      payoutKin: "Kwishyurwa n'uwo mwegereye",
      mobileMoney: "Mobile money",
      bankAccount: "Konti ya banki",
      nextOfKin: "Uwo mwegereye",
      theirPhone: "Telefone ye",
      relationship: "Isano",
      maintainedNote:
        "Aya makuru abikwa n'ihuriro. Kugira ngo ukosore ikintu kiri kuri uru rupapuro, vugana na",
      anAdministrator: "umuyobozi",
      orCall: "cyangwa uhamagare {phone}",
    },
    security: {
      title: "Umutekano n'ijambobanga",
      description:
        "Hindura ijambobanga ryawe kandi urebe ibyaherutse ku bwinjiro bwawe.",
      forcedTitle: "Ugomba guhindura ijambobanga",
      forcedBody:
        "Iyi konti yakoreshejwe ijambobanga ry'agateganyo. Hitamo irishya mbere yo kubandanya.",
      activeSessions: "Ibyuma winjiyeho",
      sessionsCount:
        "Winjiye ku gikoresho {count}.|Winjiye ku bikoresho {count}.",
      sessionsWarning:
        "Guhindura ijambobanga bikura ibindi byuma byose ako kanya.",
      recentActivity: "Ubwinjiro buheruka",
      successfulSignIn: "Ubwinjiro bwagenze neza",
      failedAttempt: "Ubwinjiro bwanze",
      unknownIp: "IP itazwi",
      warning:
        "Nubona ubwinjiro utazi, hindura ijambobanga ako kanya kandi uvugane n'umuyobozi w'ihuriro.",
    },
  },
};
