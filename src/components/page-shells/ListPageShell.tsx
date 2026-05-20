"use client";

/**
 * <ListPageShell> — locked template for any "list of records" page.
 * Phase 7.11.
 *
 * Hard-wired chrome:
 *   - Page header with title (24px / 700), count badge (gecko-count-badge),
 *     and an optional subtitle (13px secondary).
 *   - Right-side toolbar with secondary actions (Export, Filter — must be
 *     gecko-btn-sm) and ONE primary action ("+ New X" — gecko-btn-primary
 *     gecko-btn-sm).
 *   - Page body for the data table.
 *
 * Usage:
 *   <ListPageShell
 *     title="Liner Tariffs"
 *     count={cards.length}
 *     countSuffix="agreements"
 *     subtitle="Per-carrier overrides relative to the depot Standard tariff."
 *     primaryAction={<Link className="gecko-btn gecko-btn-primary gecko-btn-sm" href="…">+ New</Link>}
 *     secondaryActions={<><ExportBtn /><FilterBtn /></>}
 *   >
 *     <table className="gecko-table gecko-table-comfortable">…</table>
 *   </ListPageShell>
 */

import styles from "./PageShells.module.css";

export interface ListPageShellProps {
  title: React.ReactNode;
  /** Numeric count rendered in a gecko-count-badge next to the title. */
  count?: number;
  /** Word after the count, e.g. "items" / "agreements" / "depots". */
  countSuffix?: string;
  /** Optional secondary line under the title. */
  subtitle?: React.ReactNode;
  /** Secondary toolbar actions on the right (Export, Filter, etc.). */
  secondaryActions?: React.ReactNode;
  /** ONE primary action button — typically "+ New X". */
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
}

export function ListPageShell({
  title,
  count,
  countSuffix = "items",
  subtitle,
  secondaryActions,
  primaryAction,
  children,
}: ListPageShellProps) {
  return (
    <div className={styles.shell}>
      <div className="gecko-page-actions">
        <div className="gecko-page-actions-left">
          <div className={styles.listTitleRow}>
            <h1 className={styles.title}>{title}</h1>
            {typeof count === "number" && (
              <span className="gecko-count-badge">
                {count} {countSuffix}
              </span>
            )}
          </div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className="gecko-toolbar">
          {secondaryActions}
          {primaryAction}
        </div>
      </div>

      <div className={styles.body}>{children}</div>
    </div>
  );
}
