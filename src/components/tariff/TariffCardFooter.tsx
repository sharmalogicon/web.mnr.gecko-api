"use client";

/**
 * Shared <TariffCardFooter> — action row matching the TOS Customer Rate
 * Profile screen. Phase 7.9-B — migrated to native gecko-btn primitives,
 * no shadcn Button, no inline `<style jsx>` block.
 */

import { Icon } from "@/components/ui/Icon";
import type { TariffStatus } from "@/lib/types";

import styles from "./TariffCardFooter.module.css";

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
    <div className={`${styles.printHidden} border-t pt-4 mt-6 flex flex-col gap-3`}>
      <div className="flex flex-wrap gap-2">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting}
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            {isSubmitting && (
              <span
                className="gecko-spinner gecko-spinner-sm gecko-spinner-white"
                aria-hidden="true"
              />
            )}
            Save
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="gecko-btn gecko-btn-outline gecko-btn-sm"
        >
          <Icon name="printer" size={14} />
          Print
        </button>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            Clear
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="gecko-btn gecko-btn-outline gecko-btn-sm gecko-text-danger"
          >
            <Icon name="trash" size={14} />
            Delete
          </button>
        )}
        {isApproved ? (
          onUnApprove && (
            <button
              type="button"
              onClick={onUnApprove}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              Un Approve
            </button>
          )
        ) : (
          onApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="gecko-btn gecko-btn-primary gecko-btn-sm"
            >
              <Icon name="check" size={14} />
              Approve
            </button>
          )
        )}
        {onClone && (
          <button
            type="button"
            onClick={onClone}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            <Icon name="copy" size={14} />
            Clone Quotation
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="gecko-btn gecko-btn-ghost gecko-btn-sm"
          >
            Close
          </button>
        )}
      </div>

      {audit && (
        <div className={`${styles.audit} flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t`}>
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
    </div>
  );
}
