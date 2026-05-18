"use client";

/**
 * @deprecated Removed in Phase 1 per UI-SPEC §1 / §7 (the "no page-body H1"
 * corrective). The AppShell header (src/components/layout/app-shell.tsx:333-349)
 * already renders the 15px page title + breadcrumb derived from useNavMatch.
 *
 * If you need an action row, use the inline pattern:
 *
 *   <div className="mnr-page-actions">
 *     ... left-aligned cluster ...
 *     <div className="mnr-page-actions-spacer" />
 *     <Link className="gecko-btn gecko-btn-primary gecko-btn-sm" ...>...</Link>
 *   </div>
 *
 * See src/app/gecko_mnr_overlay.css §6.4 for the classes.
 * This component remains on disk for git-history continuity but emits a
 * console warning on every render to surface accidental re-imports.
 */

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

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
      "See src/components/shared/page-header.tsx JSDoc for the migration."
    );
  }
  return (
    <div className="gecko-page-header">
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="gecko-breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={index} style={{ display: "inline-flex", alignItems: "center" }}>
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
        <h1
          style={{
            fontSize: "var(--gecko-text-2xl)",
            fontWeight: "var(--gecko-font-weight-bold)",
            color: "var(--gecko-text-primary)",
            lineHeight: "var(--gecko-leading-tight)",
            margin: 0,
            marginTop: breadcrumbs && breadcrumbs.length > 0 ? 4 : 0,
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              marginTop: 4,
              fontSize: "var(--gecko-text-sm)",
              color: "var(--gecko-text-secondary)",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
