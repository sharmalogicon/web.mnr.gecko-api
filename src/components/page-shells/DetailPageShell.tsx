"use client";

/**
 * <DetailPageShell> — locked template for any "view a record" page.
 * Phase 7.11.
 *
 * Hard-wired chrome (do NOT override from consumers):
 *   - 24px / 700 gecko-page-title for the page identifier (mono ID)
 *   - back arrow (gecko-btn gecko-btn-ghost gecko-btn-sm gecko-btn-icon)
 *   - status / type pills inline with the ID
 *   - "view only" italic gecko-text-secondary label
 *   - toolbar (always gecko-btn-sm)
 *   - optional 3- or 4-card metric strip (uppercase 11px labels, mono values)
 *
 * Consumers compose:
 *   <DetailPageShell
 *      backHref="/billing"
 *      backLabel="Billing"
 *      id="BKGTH20260412"
 *      pills={[<StatusPill .../>, <TypePill .../>]}
 *      title="Maersk Line"
 *      viewOnly
 *      toolbar={<><Export /><Edit primary /></>}
 *      metrics={[
 *        { label: "Total billable", value: "฿2,100.00" },
 *        { label: "Billed", value: "฿0.00", tone: "success" },
 *        { label: "Unbilled", value: "฿2,100.00" },
 *      ]}
 *    >
 *      {page body}
 *    </DetailPageShell>
 *
 * Use this for every detail (read-only) page across the app.
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

import styles from "./PageShells.module.css";

export interface DetailMetric {
  label: string;
  value: React.ReactNode;
  /** Optional helper line under the value (e.g. "226 days remaining"). */
  hint?: React.ReactNode;
  /** Optional semantic color tint for the value. */
  tone?: "default" | "success" | "warning" | "danger";
}

export interface DetailPageShellProps {
  /** Back link target (e.g. "/billing"). */
  backHref?: string;
  /** Back link label shown next to the arrow. */
  backLabel?: string;
  /** Mono identifier (e.g. "BKGTH20260412"). Goes at the top. */
  id: string;
  /** Small pills next to the ID (status, type, etc.). */
  pills?: React.ReactNode;
  /** Optional human-readable title shown below the ID row. */
  title?: React.ReactNode;
  /** Optional subtitle / description line under the title. */
  subtitle?: React.ReactNode;
  /** When true an italic "view only" label appears in the ID row. */
  viewOnly?: boolean;
  /** Toolbar — must be `gecko-btn gecko-btn-sm` buttons. */
  toolbar?: React.ReactNode;
  /** 3- or 4-card metric strip. */
  metrics?: DetailMetric[];
  /** Page body. */
  children: React.ReactNode;
}

function MetricCard({ metric }: { metric: DetailMetric }) {
  const toneClass =
    metric.tone === "success"
      ? styles.metricValueSuccess
      : metric.tone === "warning"
      ? styles.metricValueWarning
      : metric.tone === "danger"
      ? styles.metricValueDanger
      : styles.metricValue;
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricLabel}>{metric.label}</div>
      <div className={toneClass}>{metric.value}</div>
      {metric.hint && <div className={styles.metricHint}>{metric.hint}</div>}
    </div>
  );
}

export function DetailPageShell({
  backHref,
  backLabel,
  id,
  pills,
  title,
  subtitle,
  viewOnly,
  toolbar,
  metrics,
  children,
}: DetailPageShellProps) {
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
            {viewOnly && <span className={styles.viewOnly}>view only</span>}
          </div>
        </div>
        {toolbar && <div className={styles.toolbar}>{toolbar}</div>}
      </div>

      {/* ─── Title + subtitle (optional) ──────────────────────────── */}
      {(title || subtitle) && (
        <div className={styles.titleBlock}>
          {title && <h1 className={styles.title}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}

      {/* ─── Metric strip ─────────────────────────────────────────── */}
      {metrics && metrics.length > 0 && (
        <div
          className={styles.metricStrip}
          data-cards={metrics.length}
        >
          {metrics.map((m, i) => (
            <MetricCard key={i} metric={m} />
          ))}
        </div>
      )}

      {/* ─── Page body ────────────────────────────────────────────── */}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
