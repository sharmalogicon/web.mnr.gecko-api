"use client";

/**
 * @deprecated Removed in Phase 1 per UI-SPEC §1 / §7.
 * Use the inline `<div className="mnr-page-actions">` pattern instead.
 * See `src/app/gecko_mnr_overlay.css` §6.4 for the classes.
 *
 * This component remains on disk for git-history continuity but emits a
 * console warning on every render to surface accidental re-imports.
 */

import Link from "next/link";

import styles from "./page-header.module.css";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  if (typeof window !== "undefined") {
    console.warn(
      "[deprecated] <PageHeader> was removed in Phase 1 per UI-SPEC §1 / §7. " +
        "Use the inline <div className=\"mnr-page-actions\"> pattern. " +
        "See src/components/shared/page-header.tsx JSDoc for the migration.",
    );
  }
  const hasCrumb = !!breadcrumbs && breadcrumbs.length > 0;
  return (
    <div className="gecko-page-header">
      <div className={styles.left}>
        {hasCrumb && (
          <nav className="gecko-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs!.map((item, index) => (
              <span key={index} className={styles.crumbRow}>
                {index > 0 && <span className="gecko-breadcrumb-sep" />}
                {item.href ? (
                  <Link href={item.href} className="gecko-breadcrumb-item">
                    {item.label}
                  </Link>
                ) : (
                  <span className="gecko-breadcrumb-current">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className={`${styles.title}${hasCrumb ? ` ${styles.titleWithCrumb}` : ""}`}>
          {title}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
