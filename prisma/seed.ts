import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { hash } from "@node-rs/argon2";
import {
  ALL_PERMISSIONS,
  PERMISSION_METADATA,
  ROLE_PERMISSIONS,
} from "../lib/auth/permissions";
import type { UserRole } from "../lib/generated/prisma/enums";

/**
 * Database seed.
 *
 * Split deliberately into two halves:
 *
 *   CORE — the permission catalogue, the RTA association, its savings rules,
 *          a starter loan product, and the bootstrap super admin. This is
 *          reference data the platform genuinely cannot run without, so it is
 *          safe (and necessary) to apply in every environment including
 *          production. Every write is an upsert, so re-running changes nothing.
 *
 *   DEMO — sample members with balances and loans, for developing against.
 *          Gated behind SEED_DEMO=true AND a non-production NODE_ENV, because
 *          fabricated ledger entries in a real association's books would be
 *          indistinguishable from fraud. See the guard in `main()`.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

async function seedPermissions() {
  console.log("→ permissions");

  for (const code of ALL_PERMISSIONS) {
    const meta = PERMISSION_METADATA[code];
    await prisma.permission.upsert({
      where: { code },
      update: {
        name: meta.name,
        description: meta.description,
        category: meta.category,
      },
      create: {
        code,
        name: meta.name,
        description: meta.description,
        category: meta.category,
      },
    });
  }

  const permissions = await prisma.permission.findMany({
    select: { id: true, code: true },
  });
  const idByCode = new Map(permissions.map((p) => [p.code, p.id]));

  const roles: UserRole[] = ["MEMBER", "ADMIN", "SUPER_ADMIN"];
  for (const role of roles) {
    const codes = ROLE_PERMISSIONS[role];

    for (const code of codes) {
      const permissionId = idByCode.get(code);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId } },
        update: {},
        create: { role, permissionId },
      });
    }

    // Drop grants that are no longer in the catalogue, so tightening a role in
    // code actually tightens it in the database rather than leaving a stale
    // grant behind.
    const keepIds = codes
      .map((c) => idByCode.get(c))
      .filter((id): id is string => Boolean(id));

    await prisma.rolePermission.deleteMany({
      where: { role, permissionId: { notIn: keepIds } },
    });
  }

  console.log(`  ${permissions.length} permissions, role defaults applied`);
}

async function seedAssociation() {
  console.log("→ association");

  // Details taken from the existing public site (lib/data.ts) so the dashboard
  // and the marketing pages agree on who RTA is.
  const association = await prisma.association.upsert({
    where: { code: "RTA" },
    update: {},
    create: {
      code: "RTA",
      name: "Rwanda Tailors Association",
      legalName: "Rwanda Tailors Association",
      status: "ACTIVE",
      email: "info.rta24@gmail.com",
      phone: "+250788562837",
      website: "https://rwandatailors.rw",
      addressLine1: "Gatenga Sector",
      city: "Kigali",
      district: "Kicukiro",
      province: "Kigali City",
      country: "Rwanda",
      currency: "RWF",
      timezone: "Africa/Kigali",
      locale: "en",
    },
  });

  await prisma.savingsRule.upsert({
    where: { associationId: association.id },
    update: {},
    create: {
      associationId: association.id,
      minimumDeposit: "1000",
      minimumBalance: "0",
      allowWithdrawals: true,
      withdrawalRequiresApproval: true,
      minimumWithdrawal: "5000",
      withdrawalFeeType: "FIXED",
      withdrawalFeeValue: "0",
      withdrawalNoticeDays: 0,
      monthlyContribution: "10000",
      contributionDueDay: 5,
      annualInterestRate: "0",
    },
  });

  await prisma.loanProduct.upsert({
    where: { associationId_code: { associationId: association.id, code: "STD" } },
    update: {},
    create: {
      associationId: association.id,
      code: "STD",
      name: "Standard Member Loan",
      description:
        "General purpose loan for members in good standing, capped at three times the member's savings balance.",
      isActive: true,
      minimumSavings: "50000",
      savingsMultiplier: "3",
      minimumMembershipMonths: 3,
      minAmount: "50000",
      maxAmount: "5000000",
      interestRate: "18",
      interestMethod: "REDUCING_BALANCE",
      interestPeriod: "ANNUAL",
      processingFeeType: "PERCENTAGE",
      processingFeeValue: "1",
      insuranceFeeType: "PERCENTAGE",
      insuranceFeeValue: "0.5",
      penaltyType: "PERCENTAGE",
      penaltyValue: "2",
      penaltyGraceDays: 3,
      minTermMonths: 3,
      maxTermMonths: 24,
      gracePeriodDays: 0,
      allowedFrequencies: ["WEEKLY", "BIWEEKLY", "MONTHLY"],
      defaultFrequency: "MONTHLY",
      requiresGuarantors: true,
      minimumGuarantors: 2,
      requiresCollateral: false,
      singleActiveLoan: true,
    },
  });

  console.log(`  ${association.name} (${association.code}) + savings rule + loan product`);
  return association;
}

async function seedPlatformSettings() {
  console.log("→ platform settings");

  const settings: {
    key: string;
    value: string;
    valueType: "STRING" | "NUMBER" | "BOOLEAN" | "DECIMAL";
    category: string;
    label: string;
    description: string;
    isEditable?: boolean;
  }[] = [
    {
      key: "platform.name",
      value: "RTA Savings & Loans",
      valueType: "STRING",
      category: "general",
      label: "Platform name",
      description: "Shown in dashboard headers, emails and statements",
    },
    {
      key: "platform.default_currency",
      value: "RWF",
      valueType: "STRING",
      category: "general",
      label: "Default currency",
      description: "Currency assigned to new associations",
    },
    {
      key: "payments.auto_match_min_confidence",
      value: "90",
      valueType: "NUMBER",
      category: "payments",
      label: "Auto-match confidence threshold",
      description:
        "Minimum confidence (0-100) before a payment is credited automatically. Below this it waits in the unmatched queue for an admin.",
    },
    {
      key: "payments.require_verification_before_posting",
      value: "true",
      valueType: "BOOLEAN",
      category: "payments",
      label: "Verify before posting",
      description:
        "Re-query the provider and confirm success before crediting savings. Disabling this permits crediting on unverified data.",
      isEditable: false,
    },
    {
      key: "security.session_ttl_minutes",
      value: "720",
      valueType: "NUMBER",
      category: "security",
      label: "Session lifetime (minutes)",
      description: "Absolute maximum age of a login session",
    },
    {
      key: "loans.allow_multiple_active",
      value: "false",
      valueType: "BOOLEAN",
      category: "loans",
      label: "Allow multiple active loans",
      description: "Whether a member may hold more than one active loan at a time",
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { scopeKey: `PLATFORM::${setting.key}` },
      update: {
        label: setting.label,
        description: setting.description,
        category: setting.category,
      },
      create: {
        scope: "PLATFORM",
        associationId: null,
        scopeKey: `PLATFORM::${setting.key}`,
        key: setting.key,
        value: setting.value,
        valueType: setting.valueType,
        category: setting.category,
        label: setting.label,
        description: setting.description,
        isEditable: setting.isEditable ?? true,
      },
    });
  }

  console.log(`  ${settings.length} platform settings`);
}

async function seedSuperAdmin() {
  console.log("→ bootstrap super admin");

  const email = process.env.SEED_SUPER_ADMIN_EMAIL ?? "superadmin@rta.rw";
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  ${email} already exists — left untouched`);
    return;
  }

  if (!password) {
    // Never invent a default password for an account that can see every
    // association's money. An operator must choose one explicitly.
    console.log(
      `  SKIPPED — set SEED_SUPER_ADMIN_PASSWORD to create ${email}.\n` +
        `    e.g.  SEED_SUPER_ADMIN_PASSWORD='ChooseAStrongOne!' npm run db:seed`
    );
    return;
  }

  if (password.length < 10) {
    throw new Error("SEED_SUPER_ADMIN_PASSWORD must be at least 10 characters");
  }

  await prisma.user.create({
    data: {
      email,
      firstName: "Super",
      lastName: "Admin",
      passwordHash: await hash(password, ARGON2_OPTIONS),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      associationId: null,
      emailVerifiedAt: new Date(),
      // Forces a password change at first login, so the value that was typed
      // into a shell (and is now in shell history) does not stay valid.
      mustChangePassword: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "SUPER_ADMIN_BOOTSTRAPPED",
      entityType: "User",
      actorEmail: "system:seed",
      actorRole: "SUPER_ADMIN",
      severity: "CRITICAL",
      reason: "Initial platform bootstrap via database seed",
      metadata: { email },
    },
  });

  console.log(`  created ${email} (must change password at first login)`);
}

async function main() {
  console.log("\nSeeding RTA Savings & Loan platform\n");

  await seedPermissions();
  await seedAssociation();
  await seedPlatformSettings();
  await seedSuperAdmin();

  const wantsDemo = process.env.SEED_DEMO === "true";
  if (wantsDemo && process.env.NODE_ENV === "production") {
    throw new Error(
      "SEED_DEMO=true is refused in production — demo members carry fabricated " +
        "balances and must never enter a real association's ledger."
    );
  }
  if (wantsDemo) {
    const { seedDemoData } = await import("./seed-demo");
    await seedDemoData(prisma);
  }

  console.log("\nSeed complete.\n");
}

main()
  .catch((error) => {
    console.error("\nSeed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
