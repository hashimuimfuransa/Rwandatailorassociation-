-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE', 'EXITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED');

-- CreateEnum
CREATE TYPE "AssociationStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'PENALTY', 'INTEREST', 'FEE', 'ADJUSTMENT', 'REVERSAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('JENGA_EQUITY', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CASH', 'CHEQUE', 'INTERNAL_TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('RECEIVED', 'PENDING', 'VERIFIED', 'UNMATCHED', 'MATCHED', 'PROCESSED', 'FAILED', 'DUPLICATE', 'REJECTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "MatchStrategy" AS ENUM ('MEMBER_PAYMENT_REFERENCE', 'EXTERNAL_CUSTOMER_REFERENCE', 'MOBILE_MONEY_ACCOUNT', 'BANK_ACCOUNT', 'PHONE_NUMBER', 'MANUAL_ADMIN', 'NONE');

-- CreateEnum
CREATE TYPE "ReconciliationOutcome" AS ENUM ('MATCHED', 'UNMATCHED', 'AMBIGUOUS', 'DUPLICATE', 'VERIFICATION_FAILED', 'PROVIDER_ERROR', 'REJECTED', 'POSTED', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING_DISBURSEMENT', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'DEFAULTED', 'WRITTEN_OFF', 'RESTRUCTURED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('UPCOMING', 'DUE', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "RepaymentFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InterestMethod" AS ENUM ('FLAT', 'REDUCING_BALANCE');

-- CreateEnum
CREATE TYPE "ChargeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "LoanTransactionType" AS ENUM ('DISBURSEMENT', 'REPAYMENT', 'INTEREST_ACCRUAL', 'PENALTY', 'FEE', 'WAIVER', 'WRITE_OFF', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "GuarantorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'RELEASED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'PHOTO', 'PROOF_OF_ADDRESS', 'BUSINESS_LICENCE', 'LOAN_SUPPORTING_DOCUMENT', 'LOAN_AGREEMENT', 'GUARANTOR_CONSENT', 'COLLATERAL_DOCUMENT', 'STATEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SettingScope" AS ENUM ('PLATFORM', 'ASSOCIATION');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'NUMBER', 'DECIMAL', 'BOOLEAN', 'JSON', 'DATE');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'NOTICE', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TokenPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PHONE_VERIFICATION', 'PASSWORD_RESET', 'INVITATION', 'TWO_FACTOR');

-- CreateTable
CREATE TABLE "associations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "registrationNo" TEXT,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "status" "AssociationStatus" NOT NULL DEFAULT 'PENDING',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "district" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Rwanda',
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Kigali',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "bankName" TEXT,
    "bankAccountName" TEXT,
    "bankAccountNumber" TEXT,
    "bankBranchCode" TEXT,
    "memberRefSequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "associationId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "passwordHash" TEXT NOT NULL,
    "passwordChangedAt" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deactivatedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifier" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" "TokenPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "grantedById" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberNumber" TEXT NOT NULL,
    "paymentReference" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "nationalId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "occupation" TEXT,
    "businessName" TEXT,
    "addressLine1" TEXT,
    "city" TEXT,
    "district" TEXT,
    "province" TEXT,
    "mobileMoneyNumber" TEXT,
    "bankAccountNumber" TEXT,
    "nextOfKinName" TEXT,
    "nextOfKinPhone" TEXT,
    "nextOfKinRelation" TEXT,
    "joinedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspensionReason" TEXT,
    "exitedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_notes" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_accounts" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lockedBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDeposits" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalWithdrawals" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalInterest" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "lastTransactionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_transactions" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "savingsAccountId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "channel" "PaymentChannel" NOT NULL DEFAULT 'INTERNAL_TRANSFER',
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceBefore" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "description" TEXT,
    "externalReference" TEXT,
    "paymentId" TEXT,
    "withdrawalId" TEXT,
    "loanId" TEXT,
    "loanTransactionId" TEXT,
    "reversalOfId" TEXT,
    "reversalReason" TEXT,
    "postedById" TEXT,
    "reversedById" TEXT,
    "adjustmentReason" TEXT,
    "valueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_rules" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "minimumDeposit" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "maximumDeposit" DECIMAL(18,2),
    "minimumBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "allowWithdrawals" BOOLEAN NOT NULL DEFAULT true,
    "withdrawalRequiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "minimumWithdrawal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "maximumWithdrawal" DECIMAL(18,2),
    "withdrawalFeeType" "ChargeType" NOT NULL DEFAULT 'FIXED',
    "withdrawalFeeValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "withdrawalNoticeDays" INTEGER NOT NULL DEFAULT 0,
    "monthlyContribution" DECIMAL(18,2),
    "contributionDueDay" INTEGER,
    "annualInterestRate" DECIMAL(9,4) NOT NULL DEFAULT 0,
    "interestPostingDay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "savingsAccountId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "fee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "channel" "PaymentChannel" NOT NULL DEFAULT 'BANK_TRANSFER',
    "destinationDetail" TEXT,
    "balanceAtRequest" DECIMAL(18,2) NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "externalReference" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "associationId" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'JENGA',
    "channel" "PaymentChannel" NOT NULL DEFAULT 'JENGA_EQUITY',
    "externalTransactionId" TEXT NOT NULL,
    "transactionReference" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "providerStatus" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'RECEIVED',
    "payerName" TEXT,
    "payerPhone" TEXT,
    "payerAccount" TEXT,
    "payerBank" TEXT,
    "narration" TEXT,
    "debitAccount" TEXT,
    "creditAccount" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3),
    "rawPayload" JSONB,
    "ingestSource" TEXT NOT NULL DEFAULT 'POLL',
    "verifiedAt" TIMESTAMP(3),
    "verificationResponse" JSONB,
    "matchedMemberId" TEXT,
    "matchStrategy" "MatchStrategy" NOT NULL DEFAULT 'NONE',
    "matchConfidence" INTEGER NOT NULL DEFAULT 0,
    "matchedById" TEXT,
    "matchedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_reconciliations" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "outcome" "ReconciliationOutcome" NOT NULL,
    "strategy" "MatchStrategy" NOT NULL DEFAULT 'NONE',
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "candidateIds" TEXT[],
    "resolvedMemberId" TEXT,
    "notes" TEXT,
    "errorMessage" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "userId" TEXT,
    "requestHash" TEXT NOT NULL,
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "lockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_products" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "minimumSavings" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "savingsMultiplier" DECIMAL(9,2) NOT NULL DEFAULT 3,
    "minimumMembershipMonths" INTEGER NOT NULL DEFAULT 0,
    "minAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "maxAmount" DECIMAL(18,2) NOT NULL,
    "absoluteMaxAmount" DECIMAL(18,2),
    "interestRate" DECIMAL(9,4) NOT NULL,
    "interestMethod" "InterestMethod" NOT NULL DEFAULT 'REDUCING_BALANCE',
    "interestPeriod" TEXT NOT NULL DEFAULT 'ANNUAL',
    "processingFeeType" "ChargeType" NOT NULL DEFAULT 'PERCENTAGE',
    "processingFeeValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "insuranceFeeType" "ChargeType" NOT NULL DEFAULT 'PERCENTAGE',
    "insuranceFeeValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyType" "ChargeType" NOT NULL DEFAULT 'PERCENTAGE',
    "penaltyValue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyGraceDays" INTEGER NOT NULL DEFAULT 0,
    "minTermMonths" INTEGER NOT NULL DEFAULT 1,
    "maxTermMonths" INTEGER NOT NULL DEFAULT 24,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "allowedFrequencies" "RepaymentFrequency"[],
    "defaultFrequency" "RepaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "requiresGuarantors" BOOLEAN NOT NULL DEFAULT false,
    "minimumGuarantors" INTEGER NOT NULL DEFAULT 0,
    "requiresCollateral" BOOLEAN NOT NULL DEFAULT false,
    "singleActiveLoan" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_applications" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "loanProductId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "LoanApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "requestedAmount" DECIMAL(18,2) NOT NULL,
    "purpose" TEXT NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "frequency" "RepaymentFrequency" NOT NULL DEFAULT 'MONTHLY',
    "savingsAtApplication" DECIMAL(18,2),
    "maxEligibleAmount" DECIMAL(18,2),
    "eligibilityPassed" BOOLEAN,
    "eligibilityReport" JSONB,
    "approvedAmount" DECIMAL(18,2),
    "approvedRate" DECIMAL(9,4),
    "approvedTermMonths" INTEGER,
    "approvedFrequency" "RepaymentFrequency",
    "submittedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "infoRequested" TEXT,
    "infoRequestedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_application_events" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "fromStatus" "LoanApplicationStatus",
    "toStatus" "LoanApplicationStatus" NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_application_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "loanProductId" TEXT NOT NULL,
    "applicationId" TEXT,
    "reference" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING_DISBURSEMENT',
    "principal" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(9,4) NOT NULL,
    "interestMethod" "InterestMethod" NOT NULL,
    "interestPeriod" TEXT NOT NULL DEFAULT 'ANNUAL',
    "termMonths" INTEGER NOT NULL,
    "frequency" "RepaymentFrequency" NOT NULL,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "totalInterest" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "processingFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "insuranceFee" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalFees" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPayable" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "principalOutstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestOutstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesOutstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyOutstanding" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "principalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "disbursedAmount" DECIMAL(18,2),
    "disbursedAt" TIMESTAMP(3),
    "disbursedById" TEXT,
    "disbursementChannel" "PaymentChannel",
    "disbursementReference" TEXT,
    "firstRepaymentDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "lastRepaymentAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "overdueAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "defaultedAt" TIMESTAMP(3),
    "writtenOffAt" TIMESTAMP(3),
    "restructuredFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_installments" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'UPCOMING',
    "principalDue" DECIMAL(18,2) NOT NULL,
    "interestDue" DECIMAL(18,2) NOT NULL,
    "feesDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyDue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDue" DECIMAL(18,2) NOT NULL,
    "principalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "waivedAt" TIMESTAMP(3),
    "waivedById" TEXT,
    "waiverReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_transactions" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "type" "LoanTransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "channel" "PaymentChannel" NOT NULL DEFAULT 'INTERNAL_TRANSFER',
    "amount" DECIMAL(18,2) NOT NULL,
    "principalPortion" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestPortion" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesPortion" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyPortion" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RWF',
    "description" TEXT,
    "externalReference" TEXT,
    "reversalOfId" TEXT,
    "reversalReason" TEXT,
    "postedById" TEXT,
    "adjustmentReason" TEXT,
    "valueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_repayment_allocations" (
    "id" TEXT NOT NULL,
    "loanTransactionId" TEXT NOT NULL,
    "installmentId" TEXT NOT NULL,
    "principalAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "interestAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "feesAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "penaltyAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_repayment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guarantors" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "loanId" TEXT,
    "guarantorMemberId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "nationalId" TEXT,
    "relationship" TEXT,
    "guaranteedAmount" DECIMAL(18,2),
    "status" "GuarantorStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarantors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "associationId" TEXT,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'INFO',
    "actionUrl" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "destination" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "associationId" TEXT NOT NULL,
    "memberId" TEXT,
    "applicationId" TEXT,
    "loanId" TEXT,
    "type" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "uploadedById" TEXT,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "scope" "SettingScope" NOT NULL DEFAULT 'PLATFORM',
    "associationId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" "SettingValueType" NOT NULL DEFAULT 'STRING',
    "category" TEXT NOT NULL DEFAULT 'general',
    "label" TEXT,
    "description" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "associationId" TEXT,
    "actorId" TEXT,
    "actorRole" "UserRole",
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "itemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "itemsSucceeded" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "cursor" TEXT,
    "errorMessage" TEXT,
    "details" JSONB,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "associations_code_key" ON "associations"("code");

-- CreateIndex
CREATE INDEX "associations_status_idx" ON "associations"("status");

-- CreateIndex
CREATE INDEX "users_associationId_role_idx" ON "users"("associationId", "role");

-- CreateIndex
CREATE INDEX "users_associationId_status_idx" ON "users"("associationId", "status");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_idx" ON "sessions"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "login_activities_userId_createdAt_idx" ON "login_activities"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "login_activities_identifier_createdAt_idx" ON "login_activities"("identifier", "createdAt");

-- CreateIndex
CREATE INDEX "login_activities_createdAt_idx" ON "login_activities"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_userId_purpose_idx" ON "verification_tokens"("userId", "purpose");

-- CreateIndex
CREATE INDEX "verification_tokens_expiresAt_idx" ON "verification_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "permissions"("category");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "user_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "members_userId_key" ON "members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "members_paymentReference_key" ON "members"("paymentReference");

-- CreateIndex
CREATE INDEX "members_associationId_status_idx" ON "members"("associationId", "status");

-- CreateIndex
CREATE INDEX "members_associationId_kycStatus_idx" ON "members"("associationId", "kycStatus");

-- CreateIndex
CREATE INDEX "members_mobileMoneyNumber_idx" ON "members"("mobileMoneyNumber");

-- CreateIndex
CREATE INDEX "members_bankAccountNumber_idx" ON "members"("bankAccountNumber");

-- CreateIndex
CREATE INDEX "members_nationalId_idx" ON "members"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "members_associationId_memberNumber_key" ON "members"("associationId", "memberNumber");

-- CreateIndex
CREATE INDEX "member_notes_memberId_createdAt_idx" ON "member_notes"("memberId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "savings_accounts_accountNumber_key" ON "savings_accounts"("accountNumber");

-- CreateIndex
CREATE INDEX "savings_accounts_associationId_isActive_idx" ON "savings_accounts"("associationId", "isActive");

-- CreateIndex
CREATE INDEX "savings_accounts_memberId_idx" ON "savings_accounts"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_reference_key" ON "savings_transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_paymentId_key" ON "savings_transactions"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_reversalOfId_key" ON "savings_transactions"("reversalOfId");

-- CreateIndex
CREATE INDEX "savings_transactions_associationId_createdAt_idx" ON "savings_transactions"("associationId", "createdAt");

-- CreateIndex
CREATE INDEX "savings_transactions_associationId_type_createdAt_idx" ON "savings_transactions"("associationId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "savings_transactions_savingsAccountId_createdAt_idx" ON "savings_transactions"("savingsAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "savings_transactions_memberId_createdAt_idx" ON "savings_transactions"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "savings_transactions_externalReference_idx" ON "savings_transactions"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_savingsAccountId_sequence_key" ON "savings_transactions"("savingsAccountId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "savings_rules_associationId_key" ON "savings_rules"("associationId");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_reference_key" ON "withdrawals"("reference");

-- CreateIndex
CREATE INDEX "withdrawals_associationId_status_requestedAt_idx" ON "withdrawals"("associationId", "status", "requestedAt");

-- CreateIndex
CREATE INDEX "withdrawals_memberId_requestedAt_idx" ON "withdrawals"("memberId", "requestedAt");

-- CreateIndex
CREATE INDEX "payments_status_transactionDate_idx" ON "payments"("status", "transactionDate");

-- CreateIndex
CREATE INDEX "payments_associationId_status_idx" ON "payments"("associationId", "status");

-- CreateIndex
CREATE INDEX "payments_matchedMemberId_idx" ON "payments"("matchedMemberId");

-- CreateIndex
CREATE INDEX "payments_payerPhone_idx" ON "payments"("payerPhone");

-- CreateIndex
CREATE INDEX "payments_nextRetryAt_idx" ON "payments"("nextRetryAt");

-- CreateIndex
CREATE INDEX "payments_isSuspicious_idx" ON "payments"("isSuspicious");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_externalTransactionId_key" ON "payments"("provider", "externalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_transactionReference_key" ON "payments"("provider", "transactionReference");

-- CreateIndex
CREATE INDEX "payment_reconciliations_paymentId_attempt_idx" ON "payment_reconciliations"("paymentId", "attempt");

-- CreateIndex
CREATE INDEX "payment_reconciliations_outcome_createdAt_idx" ON "payment_reconciliations"("outcome", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_key_key" ON "idempotency_keys"("key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE INDEX "loan_products_associationId_isActive_idx" ON "loan_products"("associationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "loan_products_associationId_code_key" ON "loan_products"("associationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "loan_applications_reference_key" ON "loan_applications"("reference");

-- CreateIndex
CREATE INDEX "loan_applications_associationId_status_submittedAt_idx" ON "loan_applications"("associationId", "status", "submittedAt");

-- CreateIndex
CREATE INDEX "loan_applications_memberId_createdAt_idx" ON "loan_applications"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "loan_application_events_applicationId_createdAt_idx" ON "loan_application_events"("applicationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "loans_applicationId_key" ON "loans"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "loans_reference_key" ON "loans"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "loans_restructuredFromId_key" ON "loans"("restructuredFromId");

-- CreateIndex
CREATE INDEX "loans_associationId_status_idx" ON "loans"("associationId", "status");

-- CreateIndex
CREATE INDEX "loans_memberId_status_idx" ON "loans"("memberId", "status");

-- CreateIndex
CREATE INDEX "loans_status_daysOverdue_idx" ON "loans"("status", "daysOverdue");

-- CreateIndex
CREATE INDEX "loans_maturityDate_idx" ON "loans"("maturityDate");

-- CreateIndex
CREATE INDEX "loan_installments_loanId_dueDate_idx" ON "loan_installments"("loanId", "dueDate");

-- CreateIndex
CREATE INDEX "loan_installments_status_dueDate_idx" ON "loan_installments"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "loan_installments_loanId_installmentNumber_key" ON "loan_installments"("loanId", "installmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "loan_transactions_reference_key" ON "loan_transactions"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "loan_transactions_reversalOfId_key" ON "loan_transactions"("reversalOfId");

-- CreateIndex
CREATE INDEX "loan_transactions_associationId_createdAt_idx" ON "loan_transactions"("associationId", "createdAt");

-- CreateIndex
CREATE INDEX "loan_transactions_loanId_createdAt_idx" ON "loan_transactions"("loanId", "createdAt");

-- CreateIndex
CREATE INDEX "loan_transactions_type_createdAt_idx" ON "loan_transactions"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "loan_transactions_loanId_sequence_key" ON "loan_transactions"("loanId", "sequence");

-- CreateIndex
CREATE INDEX "loan_repayment_allocations_installmentId_idx" ON "loan_repayment_allocations"("installmentId");

-- CreateIndex
CREATE UNIQUE INDEX "loan_repayment_allocations_loanTransactionId_installmentId_key" ON "loan_repayment_allocations"("loanTransactionId", "installmentId");

-- CreateIndex
CREATE INDEX "guarantors_applicationId_idx" ON "guarantors"("applicationId");

-- CreateIndex
CREATE INDEX "guarantors_loanId_idx" ON "guarantors"("loanId");

-- CreateIndex
CREATE INDEX "guarantors_guarantorMemberId_status_idx" ON "guarantors"("guarantorMemberId", "status");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_associationId_eventType_createdAt_idx" ON "notifications"("associationId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_nextRetryAt_idx" ON "notification_deliveries"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "notification_deliveries_notificationId_idx" ON "notification_deliveries"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_eventType_channel_key" ON "notification_preferences"("userId", "eventType", "channel");

-- CreateIndex
CREATE INDEX "documents_associationId_type_idx" ON "documents"("associationId", "type");

-- CreateIndex
CREATE INDEX "documents_memberId_idx" ON "documents"("memberId");

-- CreateIndex
CREATE INDEX "documents_applicationId_idx" ON "documents"("applicationId");

-- CreateIndex
CREATE INDEX "documents_loanId_idx" ON "documents"("loanId");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_scope_associationId_key_key" ON "system_settings"("scope", "associationId", "key");

-- CreateIndex
CREATE INDEX "audit_logs_associationId_createdAt_idx" ON "audit_logs"("associationId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_severity_createdAt_idx" ON "audit_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "job_runs_jobName_startedAt_idx" ON "job_runs"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "job_runs_status_idx" ON "job_runs"("status");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_activities" ADD CONSTRAINT "login_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_savingsAccountId_fkey" FOREIGN KEY ("savingsAccountId") REFERENCES "savings_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_withdrawalId_fkey" FOREIGN KEY ("withdrawalId") REFERENCES "withdrawals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_loanTransactionId_fkey" FOREIGN KEY ("loanTransactionId") REFERENCES "loan_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "savings_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_rules" ADD CONSTRAINT "savings_rules_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_savingsAccountId_fkey" FOREIGN KEY ("savingsAccountId") REFERENCES "savings_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_matchedMemberId_fkey" FOREIGN KEY ("matchedMemberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_matchedById_fkey" FOREIGN KEY ("matchedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reconciliations" ADD CONSTRAINT "payment_reconciliations_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_products" ADD CONSTRAINT "loan_products_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_loanProductId_fkey" FOREIGN KEY ("loanProductId") REFERENCES "loan_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_application_events" ADD CONSTRAINT "loan_application_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_loanProductId_fkey" FOREIGN KEY ("loanProductId") REFERENCES "loan_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_disbursedById_fkey" FOREIGN KEY ("disbursedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_restructuredFromId_fkey" FOREIGN KEY ("restructuredFromId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "loan_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_postedById_fkey" FOREIGN KEY ("postedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayment_allocations" ADD CONSTRAINT "loan_repayment_allocations_loanTransactionId_fkey" FOREIGN KEY ("loanTransactionId") REFERENCES "loan_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayment_allocations" ADD CONSTRAINT "loan_repayment_allocations_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "loan_installments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guarantors" ADD CONSTRAINT "guarantors_guarantorMemberId_fkey" FOREIGN KEY ("guarantorMemberId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
