import "server-only";
import { withFinancialTransaction } from "@/lib/db/prisma";
import { ledgerLogger } from "@/lib/logger";
import { recordAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { add, gt, isPositive, lt, subtract, toMoney, toMoneyString } from "@/lib/money";
import {
  buildTransactionReference,
  postSavingsTransaction,
} from "@/lib/services/ledger";
import { computeCharge } from "@/lib/services/loan-calculator";
import { notify, NOTIFICATION_EVENTS } from "@/lib/notifications";
import type { PaymentChannel } from "@/lib/generated/prisma/enums";

/**
 * Withdrawal workflow.
 *
 * request → review → approve/reject → payout
 *
 * THE MONEY MOVES ONCE, AT PAYOUT. Requesting does not debit the account, and
 * neither does approval — the balance is only reduced when an administrator
 * records that the money has actually left. Debiting earlier would mean a
 * member's balance dropping for a payout that might never happen.
 *
 * What a request DOES do is place a hold on the amount (`lockedBalance`), so a
 * member cannot request three withdrawals of their full balance and have all
 * three approved.
 */

export class WithdrawalError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INSUFFICIENT_FUNDS"
      | "BELOW_MINIMUM"
      | "ABOVE_MAXIMUM"
      | "NOT_ALLOWED"
      | "INVALID_STATE"
      | "NOT_FOUND"
      | "REASON_REQUIRED"
  ) {
    super(message);
    this.name = "WithdrawalError";
  }
}

export async function requestWithdrawal(params: {
  memberId: string;
  amount: string;
  reason?: string;
  channel?: PaymentChannel;
  destinationDetail?: string;
}): Promise<{ id: string; reference: string; fee: string; netAmount: string }> {
  const amount = toMoney(params.amount);
  if (!isPositive(amount)) {
    throw new WithdrawalError("Enter an amount greater than zero", "INVALID_STATE");
  }

  return withFinancialTransaction(async (tx) => {
    const member = await tx.member.findUniqueOrThrow({
      where: { id: params.memberId },
      select: {
        id: true,
        associationId: true,
        status: true,
        user: { select: { id: true } },
        savingsAccounts: { where: { isActive: true }, take: 1 },
      },
    });

    if (member.status !== "ACTIVE") {
      throw new WithdrawalError("Your membership is not active", "NOT_ALLOWED");
    }

    const account = member.savingsAccounts[0];
    if (!account) {
      throw new WithdrawalError("No active savings account", "NOT_FOUND");
    }

    const rule = await tx.savingsRule.findUnique({
      where: { associationId: member.associationId },
    });

    if (rule && !rule.allowWithdrawals) {
      throw new WithdrawalError(
        "This association does not currently permit withdrawals",
        "NOT_ALLOWED"
      );
    }

    if (rule && lt(amount, rule.minimumWithdrawal)) {
      throw new WithdrawalError(
        `The minimum withdrawal is ${toMoneyString(rule.minimumWithdrawal)}`,
        "BELOW_MINIMUM"
      );
    }

    if (rule?.maximumWithdrawal && gt(amount, rule.maximumWithdrawal)) {
      throw new WithdrawalError(
        `The maximum withdrawal is ${toMoneyString(rule.maximumWithdrawal)}`,
        "ABOVE_MAXIMUM"
      );
    }

    const fee = rule
      ? computeCharge(amount, rule.withdrawalFeeType, rule.withdrawalFeeValue)
      : toMoney(0);

    const totalRequired = add(amount, fee);

    // Available = balance − already-locked. Checking against the raw balance
    // would let a member stack requests beyond what they actually hold.
    const available = subtract(account.balance, account.lockedBalance);

    if (gt(totalRequired, available)) {
      throw new WithdrawalError(
        `You can withdraw at most ${toMoneyString(available)} right now` +
          (fee.isZero() ? "" : ` (including a ${toMoneyString(fee)} fee)`),
        "INSUFFICIENT_FUNDS"
      );
    }

    // Minimum balance the association requires members to keep.
    if (rule && gt(rule.minimumBalance, 0)) {
      const remaining = subtract(account.balance, totalRequired);
      if (lt(remaining, rule.minimumBalance)) {
        throw new WithdrawalError(
          `You must keep at least ${toMoneyString(rule.minimumBalance)} in your account`,
          "INSUFFICIENT_FUNDS"
        );
      }
    }

    const reference = buildTransactionReference("WDR");

    const withdrawal = await tx.withdrawal.create({
      data: {
        associationId: member.associationId,
        memberId: member.id,
        savingsAccountId: account.id,
        reference,
        amount: toMoneyString(amount),
        fee: toMoneyString(fee),
        netAmount: toMoneyString(subtract(amount, fee)),
        currency: account.currency,
        status: rule?.withdrawalRequiresApproval === false ? "APPROVED" : "PENDING",
        reason: params.reason ?? null,
        channel: params.channel ?? "BANK_TRANSFER",
        destinationDetail: params.destinationDetail ?? null,
        balanceAtRequest: toMoneyString(account.balance),
      },
      select: { id: true, reference: true },
    });

    // Place the hold.
    await tx.savingsAccount.update({
      where: { id: account.id },
      data: { lockedBalance: toMoneyString(add(account.lockedBalance, totalRequired)) },
    });

    await recordAudit(
      {
        action: AUDIT_ACTIONS.WITHDRAWAL_REQUESTED,
        entityType: "Withdrawal",
        entityId: withdrawal.id,
        associationId: member.associationId,
        newValue: {
          reference,
          amount: toMoneyString(amount),
          fee: toMoneyString(fee),
        },
      },
      null,
      tx
    );

    void notify({
      userId: member.user.id,
      event: NOTIFICATION_EVENTS.WITHDRAWAL_SUBMITTED,
      context: { amount: toMoneyString(amount), reference },
      entityType: "Withdrawal",
      entityId: withdrawal.id,
    });

    return {
      id: withdrawal.id,
      reference,
      fee: toMoneyString(fee),
      netAmount: toMoneyString(subtract(amount, fee)),
    };
  });
}

/** Approve or reject. Rejection releases the hold and requires a reason. */
export async function reviewWithdrawal(params: {
  withdrawalId: string;
  approve: boolean;
  actorId: string;
  notes?: string;
  rejectionReason?: string;
}): Promise<void> {
  if (!params.approve && !params.rejectionReason?.trim()) {
    throw new WithdrawalError(
      "A rejection requires a written reason",
      "REASON_REQUIRED"
    );
  }

  await withFinancialTransaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUniqueOrThrow({
      where: { id: params.withdrawalId },
      include: {
        savingsAccount: { select: { id: true, lockedBalance: true } },
        member: { select: { user: { select: { id: true } } } },
      },
    });

    if (!["PENDING", "UNDER_REVIEW"].includes(withdrawal.status)) {
      throw new WithdrawalError(
        `This withdrawal is ${withdrawal.status} and cannot be reviewed`,
        "INVALID_STATE"
      );
    }

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: params.approve ? "APPROVED" : "REJECTED",
        reviewedById: params.actorId,
        reviewedAt: new Date(),
        reviewNotes: params.notes ?? null,
        rejectionReason: params.rejectionReason ?? null,
      },
    });

    // A rejected request must release its hold, or the member's money stays
    // locked forever with nothing to show for it.
    if (!params.approve) {
      const held = add(withdrawal.amount, withdrawal.fee);
      const released = subtract(withdrawal.savingsAccount.lockedBalance, held);

      await tx.savingsAccount.update({
        where: { id: withdrawal.savingsAccount.id },
        data: { lockedBalance: toMoneyString(lt(released, 0) ? 0 : released) },
      });
    }

    await recordAudit(
      {
        action: params.approve
          ? AUDIT_ACTIONS.WITHDRAWAL_APPROVED
          : AUDIT_ACTIONS.WITHDRAWAL_REJECTED,
        entityType: "Withdrawal",
        entityId: withdrawal.id,
        associationId: withdrawal.associationId,
        oldValue: { status: withdrawal.status },
        newValue: { status: params.approve ? "APPROVED" : "REJECTED" },
        reason: params.rejectionReason ?? params.notes ?? null,
        severity: "NOTICE",
      },
      { id: params.actorId },
      tx
    );

    void notify({
      userId: withdrawal.member.user.id,
      event: params.approve
        ? NOTIFICATION_EVENTS.WITHDRAWAL_APPROVED
        : NOTIFICATION_EVENTS.WITHDRAWAL_REJECTED,
      context: {
        amount: toMoneyString(withdrawal.amount),
        reference: withdrawal.reference,
        reason: params.rejectionReason ?? undefined,
      },
      entityType: "Withdrawal",
      entityId: withdrawal.id,
    });
  });
}

/**
 * Records that an approved withdrawal has actually been paid out.
 * THIS is where the money leaves — the ledger debit happens here and nowhere
 * else in the withdrawal flow.
 */
export async function processWithdrawalPayout(params: {
  withdrawalId: string;
  actorId: string;
  externalReference?: string;
}): Promise<{ reference: string; balanceAfter: string }> {
  return withFinancialTransaction(async (tx) => {
    const withdrawal = await tx.withdrawal.findUniqueOrThrow({
      where: { id: params.withdrawalId },
      include: {
        savingsAccount: { select: { id: true, lockedBalance: true } },
        member: { select: { user: { select: { id: true } } } },
      },
    });

    if (withdrawal.status !== "APPROVED") {
      throw new WithdrawalError(
        `Only an approved withdrawal can be paid out (this one is ${withdrawal.status})`,
        "INVALID_STATE"
      );
    }

    const total = add(withdrawal.amount, withdrawal.fee);

    const posted = await postSavingsTransaction(
      {
        savingsAccountId: withdrawal.savingsAccountId,
        type: "WITHDRAWAL",
        direction: "DEBIT",
        amount: toMoneyString(withdrawal.amount),
        channel: withdrawal.channel,
        description: `Withdrawal ${withdrawal.reference}`,
        externalReference: params.externalReference ?? null,
        withdrawalId: withdrawal.id,
        postedById: params.actorId,
      },
      tx
    );

    if (gt(withdrawal.fee, 0)) {
      await postSavingsTransaction(
        {
          savingsAccountId: withdrawal.savingsAccountId,
          type: "FEE",
          direction: "DEBIT",
          amount: toMoneyString(withdrawal.fee),
          channel: "INTERNAL_TRANSFER",
          description: `Withdrawal fee for ${withdrawal.reference}`,
          withdrawalId: withdrawal.id,
          postedById: params.actorId,
          // The balance check already accounted for the fee at request time;
          // allow the posting so a rounding edge cannot strand a payout
          // half-completed.
          allowOverdraft: true,
        },
        tx
      );
    }

    // Release the hold now the debit has actually happened.
    const released = subtract(withdrawal.savingsAccount.lockedBalance, total);

    await tx.savingsAccount.update({
      where: { id: withdrawal.savingsAccount.id },
      data: { lockedBalance: toMoneyString(lt(released, 0) ? 0 : released) },
    });

    await tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: "COMPLETED",
        processedById: params.actorId,
        processedAt: new Date(),
        externalReference: params.externalReference ?? null,
      },
    });

    await recordAudit(
      {
        action: AUDIT_ACTIONS.WITHDRAWAL_PROCESSED,
        entityType: "Withdrawal",
        entityId: withdrawal.id,
        associationId: withdrawal.associationId,
        newValue: {
          reference: withdrawal.reference,
          amount: toMoneyString(withdrawal.amount),
          savingsTransactionReference: posted.reference,
        },
        severity: "NOTICE",
      },
      { id: params.actorId },
      tx
    );

    ledgerLogger.info(
      { withdrawalId: withdrawal.id, reference: withdrawal.reference },
      "withdrawal paid out"
    );

    void notify({
      userId: withdrawal.member.user.id,
      event: NOTIFICATION_EVENTS.WITHDRAWAL_PAID,
      context: {
        amount: toMoneyString(withdrawal.amount),
        reference: withdrawal.reference,
        balance: posted.balanceAfter,
      },
      entityType: "Withdrawal",
      entityId: withdrawal.id,
    });

    return { reference: posted.reference, balanceAfter: posted.balanceAfter };
  });
}
