"use client";

/**
 * <FormPageShell> — locked template for "create a new X" pages.
 * Phase 7.11.
 *
 * Differs from <EditPageShell> in that there's no record identifier yet
 * (id is shown as "(new)" or a placeholder), and the body is constrained
 * to a single-column max-width form for readability.
 *
 * Usage:
 *   <FormPageShell
 *     backHref="/repair"
 *     backLabel="Back to repairs"
 *     title="New repair job"
 *     subtitle="Choose container, then add CEDEX-coded repair lines."
 *     onCancel={() => router.back()}
 *     onSave={handleSave}
 *     saving={isSubmitting}
 *   >
 *     <SectionCard title="Equipment">…</SectionCard>
 *     <SectionCard title="Lines">…</SectionCard>
 *   </FormPageShell>
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

import styles from "./PageShells.module.css";

export interface FormPageShellProps {
  backHref?: string;
  backLabel?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  extraToolbar?: React.ReactNode;
  /** Constrain the form body to a narrow column. Default true. */
  narrow?: boolean;
  children: React.ReactNode;
}

export function FormPageShell({
  backHref,
  backLabel,
  title,
  subtitle,
  onCancel,
  onSave,
  saving = false,
  saveLabel = "Save",
  extraToolbar,
  narrow = true,
  children,
}: FormPageShellProps) {
  return (
    <div className={styles.shell}>
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
            <h1 className={styles.title}>{title}</h1>
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

      {subtitle && (
        <div className={styles.titleBlock}>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      )}

      <div className={`${styles.body} ${narrow ? styles.bodyNarrow : ""}`}>
        {children}
      </div>
    </div>
  );
}
