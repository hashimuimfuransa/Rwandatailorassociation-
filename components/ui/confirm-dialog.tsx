"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

/**
 * Confirmation dialog for consequential actions.
 *
 * `requireReason` is not a nicety. Approving a loan, rejecting a withdrawal or
 * adjusting a balance all write an audit row that must carry a justification —
 * the API refuses these without one. Collecting it here means the person
 * making the decision writes the reason at the moment they decide, rather than
 * someone reconstructing it from memory during a later dispute.
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  /// Show a mandatory free-text reason, passed to onConfirm.
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  /// Minimum characters the reason must carry. MUST match what the endpoint
  /// enforces: a dialog that accepts a shorter reason than the API does lets
  /// the user write one, press confirm, and receive a generic validation
  /// failure with no idea which field was wrong.
  reasonMinLength?: number;
  /// Extra context rendered above the actions, e.g. an amount summary.
  children?: React.ReactNode;
  onConfirm: (reason?: string) => Promise<void> | void;
}

export function ConfirmDialog({ open, onOpenChange, ...props }: ConfirmDialogProps) {
  // The body is keyed on the open state so every opening mounts a fresh copy
  // with empty fields. Resetting from an effect instead would leave the
  // previous reason briefly visible on reopen — and on a dialog that records
  // an audit justification, showing the last decision's wording is an easy way
  // to have it submitted again by mistake.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ConfirmDialogBody
        key={open ? "open" : "closed"}
        open={open}
        onOpenChange={onOpenChange}
        {...props}
      />
    </Dialog>
  );
}

function ConfirmDialogBody({
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Explain why this action is being taken…",
  reasonMinLength = 5,
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const trimmedLength = reason.trim().length;
  const reasonValid = !requireReason || trimmedLength >= reasonMinLength;
  const remaining = reasonMinLength - trimmedLength;

  async function handleConfirm() {
    if (!reasonValid) {
      setError(`Please give a reason of at least ${reasonMinLength} characters.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The action could not be completed."
      );
      setSubmitting(false);
    }
  }

  return (
    <DialogContent showClose={!submitting}>
        <div className="flex gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              tone === "danger" ? "bg-red-50 text-red-600" : "bg-primary-50 text-primary"
            )}
          >
            <AlertTriangle className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0 flex-1">
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription className="mt-2">{description}</DialogDescription>
            )}
          </div>
        </div>

        {children && <div>{children}</div>}

        {requireReason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason" required>
              {reasonLabel}
            </Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              invalid={Boolean(error) && !reasonValid}
              rows={3}
              disabled={submitting}
            />
            <p className="text-xs text-ink-muted">
              {remaining > 0
                ? `${remaining} more character${remaining === 1 ? "" : "s"} needed. `
                : ""}
              This is recorded permanently in the audit log against your name.
            </p>
          </div>
        )}

        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={submitting || !reasonValid}
            className={cn(
              tone === "danger" && "bg-red-600 hover:bg-red-700"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
      </div>
    </DialogContent>
  );
}
