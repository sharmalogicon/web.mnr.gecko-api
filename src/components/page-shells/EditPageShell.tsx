"use client";

/**
 * <EditPageShell> — locked template for any "edit a record" page.
 * Phase 7.11.
 *
 * Shares the same header chrome as <DetailPageShell> but the toolbar is
 * always Cancel (outline) + Save (primary). The body wraps form content
 * in a max-width column for readability.
 *
 * Usage:
 *   <EditPageShell
 *     backHref="/billing/INV-001"
 *     backLabel="Back to INV-001"
 *     id="INV-001"
 *     pills={<StatusPill status="DRAFT" />}
 *     title="Edit invoice"
 *     onCancel={() => router.back()}
 *     onSave={onSave}
 *     saving={isSubmitting}
 *   >
 *     <SectionCard>…</SectionCard>
 *   </EditPageShell>
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

import styles from "./PageShells.module.css";

export interface EditPageShellProps {
  backHref?: string;
  backLabel?: string;
  id: string;
  pills?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Cancel handler — usually router.back() or navigate to the view page. */
  onCancel?: () => void;
  /** Save handler — wired to form submit or repo write. */
  onSave?: () => void;
  /** Disables the save button + shows a spinner when true. */
  saving?: boolean;
  /** Override the Save button label (default "Save"). */
  saveLabel?: string;
  /** Optional extra toolbar buttons rendered BEFORE Cancel/Save. */
  extraToolbar?: React.ReactNode;
  children: React.ReactNode;
}

export function EditPageShell({
  backHref,
  backLabel,
  id,
  pills,
  title,
  subtitle,
  onCancel,
  onSave,
  saving = false,
  saveLabel = "Save",
  extraToolbar,
  children,
}: EditPageShellProps) {
  return (
    <div className={styles.shell}>
      {/* ─── Header row ───────────────────────────────────────────── */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          {backHref && (
            <Link
              href={backHref}
              className="gecko-btn gecko-btn-ghost gecko-btn-sm gecko-btn-icon"
              aria-label={backLabel ?? "Back"}
            >
              <Icon name="arrowLeft" size={16} />
            </Link>
          )}
          <div className={styles.headerIdRow}>
            <span className={styles.headerId}>{id}</span>
            {pills}
          </div>
        </div>
        <div className={styles.toolbar}>
          {extraToolbar}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="gecko-btn gecko-btn-primary gecko-btn-sm"
            >
              {saving ? (
                <>
                  <span
                    className="gecko-spinner gecko-spinner-sm gecko-spinner-white"
                    aria-hidden="true"
                  />
                  Saving…
                </>
              ) : (
                <>
                  <Icon name="save" size={16} />
                  {saveLabel}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {(title || subtitle) && (
        <div className={styles.titleBlock}>
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}

      <div className={styles.body}>{children}</div>
    </div>
  );
}
