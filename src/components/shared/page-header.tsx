"use client";

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
