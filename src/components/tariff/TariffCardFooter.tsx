"use client";

/**
 * Shared <TariffCardFooter> — action row matching the TOS Customer Rate
 * Profile screen. Per Phase 7 D-06 Print is no-op (window.print()).
 */

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import type { TariffStatus } from "@/lib/types";

export interface TariffCardFooterProps {
  status: TariffStatus;
  /** Persist current edits. */
  onSave?: () => void;
  /** Clear all rows + reset to defaults. */
  onClear?: () => void;
  /** Hard-delete the card (admin only — wire as needed). */
  onDelete?: () => void;
  /** Approve / Un Approve toggle. */
  onApprove?: () => void;
  onUnApprove?: () => void;
  /** Clone (Liner only — pass undefined to omit the button). */
  onClone?: () => void;
  /** Close → navigates back. */
  onClose?: () => void;
  /** Loading state (e.g. during async save). */
  isSubmitting?: boolean;
  /** Audit line (Created By / Modified By / Approved By/On). */
  audit?: {
    createdBy?: string;
    createdOn?: string;
    modifiedBy?: string;
    modifiedOn?: string;
    approvedBy?: string;
    approvedOn?: string;
  };
}

export function TariffCardFooter({
  status,
  onSave,
  onClear,
  onDelete,
  onApprove,
  onUnApprove,
  onClone,
  onClose,
  isSubmitting,
  audit,
}: TariffCardFooterProps) {
  const isApproved = status === "APPROVED";
  return (
    <div
      className="border-t pt-4 mt-6 flex flex-col gap-3"
      data-print-hidden="true"
    >
      <div className="flex flex-wrap gap-2">
        {onSave && (
          <Button onClick={onSave} disabled={isSubmitting}>
            {isSubmitting && (
              <span
                className="gecko-spinner gecko-spinner-sm gecko-spinner-white mr-2"
                aria-hidden="true"
              />
            )}
            Save
          </Button>
        )}
        <Button variant="outline" onClick={() => window.print()}>
          <Icon name="printer" size={14} className="mr-2" />
          Print
        </Button>
        {onClear && (
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" className="text-destructive" onClick={onDelete}>
            <Icon name="trash" size={14} className="mr-2" />
            Delete
          </Button>
        )}
        {isApproved ? (
          onUnApprove && (
            <Button variant="outline" onClick={onUnApprove}>
              Un Approve
            </Button>
          )
        ) : (
          onApprove && (
            <Button onClick={onApprove}>
              <Icon name="check" size={14} className="mr-2" />
              Approve
            </Button>
          )
        )}
        {onClone && (
          <Button variant="outline" onClick={onClone}>
            <Icon name="copy" size={14} className="mr-2" />
            Clone Quotation
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {audit && (
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t">
          {audit.createdBy && (
            <span>
              Created By: <strong>{audit.createdBy}</strong>
              {audit.createdOn && <> · {audit.createdOn}</>}
            </span>
          )}
          {audit.modifiedBy && (
            <span>
              Modified By: <strong>{audit.modifiedBy}</strong>
              {audit.modifiedOn && <> · {audit.modifiedOn}</>}
            </span>
          )}
          {audit.approvedBy && (
            <span>
              Approved By: <strong>{audit.approvedBy}</strong>
              {audit.approvedOn && <> · {audit.approvedOn}</>}
            </span>
          )}
        </div>
      )}

      {/* Print styles — hide controls when printing */}
      <style jsx global>{`
        @media print {
          [data-print-hidden="true"] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
