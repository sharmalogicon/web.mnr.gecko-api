"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../ui/Icon";
import { ToastProvider } from "../ui/Toast";

// ─── Navigation tree ──────────────────────────────────────────────────────────
// Single source of truth for sidebar, header breadcrumbs, and tab titles.
// Mirror MNR's actual route structure; deeper detail segments are derived
// from the URL automatically.

type NavChild = { id: string; label: string; path: string };
type NavModule = { id: string; icon: string; label: string; children?: NavChild[] };

const NAV: NavModule[] = [
  {
    id: "dashboard",
    icon: "home",
    label: "Dashboard",
    children: [{ id: "overview", label: "Overview", path: "/dashboard" }],
  },
  {
    id: "equipment",
    icon: "database",
    label: "Master Data",
    children: [
      { id: "all", label: "All Equipment", path: "/equipment" },
    ],
  },
  {
    id: "tariff",
    icon: "tag",
    label: "Tariff",
    children: [
      { id: "overview", label: "Overview", path: "/tariff" },
      { id: "rate-cards", label: "Rate Cards", path: "/tariff/rate-cards" },
      { id: "customer-rates", label: "Customer Rates", path: "/tariff/customer-rates" },
      { id: "contracts", label: "Contracts", path: "/tariff/contracts" },
      { id: "surcharges", label: "Surcharges", path: "/tariff/surcharges" },
      { id: "simulator", label: "Price Simulator", path: "/tariff/simulator" },
      { id: "history", label: "Price History", path: "/tariff/history" },
    ],
  },
  { id: "survey", icon: "search", label: "Survey / Inspection",
    children: [
      { id: "register", label: "Survey Register", path: "/survey" },
      { id: "new", label: "New Survey", path: "/survey/new" },
    ],
  },
  { id: "cleaning", icon: "sparkles", label: "Cleaning",
    children: [
      { id: "register", label: "Cleaning Register", path: "/cleaning" },
      { id: "new", label: "New Cleaning", path: "/cleaning/new" },
    ],
  },
  { id: "repair", icon: "tool", label: "Repair",
    children: [
      { id: "register", label: "Repair Register", path: "/repair" },
      { id: "new", label: "New Repair", path: "/repair/new" },
    ],
  },
  { id: "storage", icon: "mapPin", label: "Storage",
    children: [{ id: "register", label: "Storage Register", path: "/storage" }],
  },
  { id: "emergency", icon: "warning", label: "Emergency",
    children: [{ id: "register", label: "Emergency Register", path: "/emergency" }],
  },
  { id: "modification", icon: "edit", label: "Modification",
    children: [
      { id: "register", label: "Modification Register", path: "/modification" },
      { id: "new", label: "New Modification", path: "/modification/new" },
    ],
  },
  { id: "parts", icon: "packageOpen", label: "Parts & Inventory",
    children: [
      { id: "register", label: "Parts Catalogue", path: "/parts" },
      { id: "new", label: "New Part", path: "/parts/new" },
    ],
  },
  { id: "billing", icon: "invoice", label: "Billing & Payments",
    children: [{ id: "register", label: "Billing Register", path: "/billing" }],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function titleCaseSegment(s: string) {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function useNavMatch(pathname: string | null) {
  return useMemo(() => {
    const path = pathname ?? "/";
    const segments = path.split("/").filter(Boolean);

    if (segments.length === 0) {
      return { pageTitle: "Workspace", breadcrumbs: ["Workspace"] };
    }

    const mod = NAV.find((m) => m.id === segments[0]);
    if (!mod) {
      const label = titleCaseSegment(segments[0]);
      return { pageTitle: label, breadcrumbs: [label] };
    }

    const matches = (mod.children ?? []).filter(
      (c) => path === c.path || path.startsWith(c.path + "/")
    );
    const child = matches.length
      ? matches.reduce((longest, c) =>
          c.path.length > longest.path.length ? c : longest
        )
      : null;

    if (!child) {
      return { pageTitle: mod.label, breadcrumbs: [mod.label] };
    }

    if (path === child.path) {
      return {
        pageTitle: child.label,
        breadcrumbs: [mod.label, child.label],
      };
    }

    const remainder = path.slice(child.path.length).replace(/^\/+/, "");
    const detail = decodeURIComponent(
      remainder.split("/").filter(Boolean).pop() || ""
    );
    return {
      pageTitle: detail || child.label,
      breadcrumbs: [mod.label, child.label, detail].filter(Boolean),
    };
  }, [pathname]);
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const activeModule = pathname ? pathname.split("/")[1] : "dashboard";
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set([activeModule]));

  useEffect(() => {
    if (activeModule) {
      setOpenGroups((prev) => new Set([...prev, activeModule]));
    }
  }, [activeModule]);

  const toggleGroup = (id: string) => {
    const next = new Set(openGroups);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenGroups(next);
  };

  return (
    <aside
      className={`gecko-sidebar ${collapsed ? "gecko-sidebar-collapsed" : ""}`}
      style={{ position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 40 }}
    >
      <div className="gecko-sidebar-brand">
        <div className="gecko-logo" style={{ background: "var(--gecko-primary-600)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h4l3-9 4 18 3-9h4" />
          </svg>
        </div>
        {!collapsed && (
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span className="gecko-logo-text" style={{ fontSize: 15 }}>GECKO</span>
            <span style={{ fontSize: 10, color: "var(--gecko-text-secondary)", fontWeight: 500, letterSpacing: "0.1em" }}>
              M&amp;R · DEPOT OPS
            </span>
          </div>
        )}
      </div>

      <nav className="gecko-sidebar-nav" role="navigation" aria-label="Main navigation" style={{ overflowY: "auto" }}>
        {NAV.map((mod) => {
          const isActiveMod = activeModule === mod.id;
          const isOpen = openGroups.has(mod.id);
          return (
            <div key={mod.id}>
              <button
                className={`gecko-nav-item${isActiveMod ? " gecko-nav-item-active" : ""}`}
                aria-expanded={mod.children ? isOpen : undefined}
                aria-controls={mod.children ? `nav-group-${mod.id}` : undefined}
                onClick={() => { if (!collapsed) toggleGroup(mod.id); }}
                title={collapsed ? mod.label : ""}
              >
                <Icon name={mod.icon} size={18} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1, textAlign: "left" }}>{mod.label}</span>
                    {mod.children && (
                      <Icon name="chevronDown" size={14} className="gecko-nav-chevron" />
                    )}
                  </>
                )}
              </button>
              {!collapsed && isOpen && mod.children && (() => {
                const matches = mod.children.filter(
                  (c) => pathname === c.path || pathname?.startsWith(c.path + "/")
                );
                const activeChildId = matches.length > 0
                  ? matches.reduce((longest, c) =>
                      c.path.length > longest.path.length ? c : longest
                    ).id
                  : null;
                return (
                  <div id={`nav-group-${mod.id}`} className="gecko-nav-children">
                    {mod.children.map((child) => {
                      const active = child.id === activeChildId;
                      return (
                        <Link
                          key={child.id}
                          href={child.path}
                          className={`gecko-nav-child${active ? " gecko-nav-child-active" : ""}`}
                          aria-current={active ? "page" : undefined}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </nav>

      <div className="gecko-sidebar-footer">
        {!collapsed ? (
          <>
            <Link
              href="/settings"
              className="gecko-nav-item"
              style={{ marginBottom: 4 }}
            >
              <Icon name="settings" size={18} />
              <span style={{ flex: 1, textAlign: "left" }}>Settings</span>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
              <div className="gecko-avatar gecko-avatar-accent">JD</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--gecko-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  John Doe
                </div>
                <div style={{ fontSize: 11, color: "var(--gecko-text-secondary)" }}>
                  Operations Manager
                </div>
              </div>
              <Link
                href="/login"
                className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm"
                title="Sign out"
                style={{ color: "var(--gecko-text-secondary)" }}
              >
                <Icon name="logOut" size={15} />
              </Link>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
            <Link
              href="/settings"
              className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm"
              title="Settings"
            >
              <Icon name="settings" size={18} />
            </Link>
            <div className="gecko-avatar gecko-avatar-accent">JD</div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  collapsed,
  onToggleSidebar,
  pageTitle,
  breadcrumbs,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  pageTitle: string;
  breadcrumbs: string[];
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Initialise from any pre-existing data-theme so toggle stays in sync after
  // hydration when the html element was rendered with a default.
  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark") setTheme("dark");
  }, []);

  const onToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    // Keep the .dark class in sync so Tailwind dark: variants resolve too —
    // both selectors are wired in @custom-variant dark.
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  return (
    <header
      className="gecko-header"
      role="banner"
      style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--gecko-bg-surface)" }}
    >
      <button
        className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm"
        onClick={onToggleSidebar}
        title="Toggle sidebar"
      >
        <Icon name="menu" size={18} />
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <nav className="gecko-breadcrumb" aria-label="Breadcrumb" style={{ fontSize: 11 }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="gecko-breadcrumb-sep" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="gecko-breadcrumb-current" style={{ fontSize: 11 }}>{b}</span>
              ) : (
                <span className="gecko-breadcrumb-item" style={{ fontSize: 11 }}>{b}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--gecko-text-primary)" }}>
          {pageTitle}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 420, marginLeft: 32, position: "relative" }}>
        <Icon
          name="search"
          size={16}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--gecko-text-disabled)",
            pointerEvents: "none",
          }}
        />
        <input
          className="gecko-input gecko-input-sm"
          placeholder="Search equipment, jobs, parts…"
          style={{ paddingLeft: 36, paddingRight: 56, height: 34 }}
        />
        <kbd
          className="gecko-kbd"
          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
        >
          ⌘K
        </kbd>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <button
          className="gecko-btn gecko-btn-ghost gecko-btn-sm"
          style={{ height: 34, fontSize: 11, fontWeight: 600, color: "var(--gecko-text-secondary)", padding: "0 8px" }}
          title="Language"
        >
          <Icon name="globe" size={14} /> EN
        </button>
        <button
          className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm"
          title="Notifications"
          style={{ position: "relative" }}
        >
          <Icon name="bell" size={17} />
          <span className="gecko-notification-dot" />
        </button>
        <button className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm" title="Help">
          <Icon name="help" size={17} />
        </button>
        <button
          className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm"
          onClick={onToggleTheme}
          title="Toggle theme"
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>
      </div>
    </header>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { pageTitle, breadcrumbs } = useNavMatch(pathname);

  useEffect(() => {
    if (typeof document !== "undefined" && pageTitle) {
      document.title = `${pageTitle} · Gecko M&R`;
    }
  }, [pageTitle]);

  return (
    <ToastProvider>
      <div
        className="gecko-app"
        style={{ position: "relative", minHeight: "100vh", background: "var(--gecko-bg-subtle)" }}
      >
        <Sidebar collapsed={collapsed} />
        <div
          className={`gecko-main ${collapsed ? "gecko-main-collapsed" : ""}`}
          style={{
            marginLeft: collapsed
              ? "var(--gecko-sidebar-width-collapsed)"
              : "var(--gecko-sidebar-width)",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Header
            collapsed={collapsed}
            onToggleSidebar={() => setCollapsed((c) => !c)}
            pageTitle={pageTitle}
            breadcrumbs={breadcrumbs}
          />
          <main
            className="gecko-content"
            style={{ flex: 1, padding: "var(--gecko-space-6)", overflowX: "auto" }}
          >
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
