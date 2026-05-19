"use client";

/**
 * Shared chrome for tariff detail + edit pages.
 *
 * Phase 7.7-I/J/K — TOS reference parity:
 *   - <DetailHeader>       top header row (back arrow → id badge → status pill →
 *                          type pill → "view only", title beneath, top-right toolbar)
 *   - <StatCardsRow>       4 hero stat cards (effective / days remaining /
 *                          priced charges / annualized estimate)
 *   - <ValidityProgress>   thin progress bar with day N / 364 (X%)
 *   - <TabsNav>            blue-underline tab nav
 *   - <SectionCard>        rounded raw-div container with uppercase header
 *   - <ActivityEmpty>      "No activity yet" stub
 *
 * Everything is composed of raw divs + gecko CSS variables — no shadcn Cards.
 */

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { TariffStatus } from "@/lib/types/tariff/standard";

// ─── Status pill (Active / Expired / Draft) ──────────────────────────────────

export function StatusPill({ status }: { status: TariffStatus }) {
  if (status === "APPROVED") return <span className="gecko-pill gecko-pill-success">Active</span>;
  if (status === "EXPIRED")  return <span className="gecko-pill gecko-pill-danger">Expired</span>;
  return <span className="gecko-pill gecko-pill-neutral">Draft</span>;
}

// ─── Type pill (Standard / Liner / Vendor) ───────────────────────────────────

export type TariffLane = "standard" | "liner" | "vendor";

export function TypePill({ lane }: { lane: TariffLane }) {
  if (lane === "liner")   return <span className="gecko-pill gecko-pill-primary"><Icon name="ship" size={11} /> Liner</span>;
  if (lane === "vendor")  return <span className="gecko-pill gecko-pill-warning"><Icon name="tool" size={11} /> Vendor</span>;
  return <span className="gecko-pill gecko-pill-info"><Icon name="layers" size={11} /> Standard</span>;
}

// ─── Detail page header ──────────────────────────────────────────────────────

export interface DetailHeaderProps {
  backHref: string;
  backLabel: string;
  id: string;
  status: TariffStatus;
  lane: TariffLane;
  /** Big page title (e.g. carrier name, depot name, vendor name). */
  title: string;
  /** Optional acronym / sub-line shown muted next to the title. */
  acronym?: string;
  viewOnly?: boolean;
  /** Toolbar children (Export, Duplicate, Edit, Save, Cancel, …). */
  toolbar: React.ReactNode;
}

export function DetailHeader({
  backHref,
  backLabel,
  id,
  status,
  lane,
  title,
  acronym,
  viewOnly = false,
  toolbar,
}: DetailHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={backHref}
            className="gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm"
            aria-label={backLabel}
            style={{ textDecoration: "none" }}
          >
            <Icon name="arrowLeft" size={16} />
          </Link>
          <span
            className="gecko-text-mono"
            style={{
              fontWeight: 700,
              color: "var(--gecko-primary-700)",
              fontSize: 13,
              padding: "4px 8px",
              background: "var(--gecko-primary-50)",
              borderRadius: 6,
              border: "1px solid var(--gecko-primary-100)",
            }}
          >
            {id}
          </span>
          <StatusPill status={status} />
          <TypePill lane={lane} />
          {viewOnly && (
            <span
              style={{
                fontStyle: "italic",
                color: "var(--gecko-text-secondary)",
                fontSize: 12,
              }}
            >
              view only
            </span>
          )}
        </div>
        <div className="gecko-toolbar">{toolbar}</div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gecko-text-primary)" }}>
          {title}
        </h1>
        {acronym && (
          <span style={{ color: "var(--gecko-text-secondary)", fontSize: 14 }}>{acronym}</span>
        )}
      </div>
    </div>
  );
}

// ─── 4 hero stat cards ───────────────────────────────────────────────────────

export interface StatCard {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: string;
  caption: string;
}

export function StatCardsRow({ cards }: { cards: [StatCard, StatCard, StatCard, StatCard] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 16,
        marginBottom: 20,
      }}
    >
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            background: "var(--gecko-bg-surface)",
            border: "1px solid var(--gecko-border)",
            borderRadius: 12,
            padding: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            boxShadow: "var(--gecko-shadow-sm)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: c.iconBg,
              color: c.iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name={c.icon} size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              className="gecko-text-mono"
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--gecko-text-primary)",
                lineHeight: 1.2,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
              {c.caption}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Validity progress bar ───────────────────────────────────────────────────

export function ValidityProgress({
  effectiveDate,
  expiryDate,
}: {
  effectiveDate: string;
  expiryDate: string;
}) {
  const eff = effectiveDate ? new Date(effectiveDate + "T00:00:00") : null;
  const exp = expiryDate ? new Date(expiryDate + "T00:00:00") : null;
  if (!eff || !exp) return null;
  const total = Math.max(1, Math.round((exp.getTime() - eff.getTime()) / 86400000));
  const elapsed = Math.max(0, Math.round((Date.now() - eff.getTime()) / 86400000));
  const day = Math.min(elapsed, total);
  const pct = Math.min(100, Math.max(0, Math.round((day / total) * 100)));
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--gecko-text-secondary)",
          marginBottom: 6,
        }}
      >
        <span>Validity</span>
        <span className="gecko-text-mono">
          day {day} / of {total} ({pct}%)
        </span>
      </div>
      <div className="gecko-progress gecko-progress-sm">
        <div
          className="gecko-progress-bar gecko-progress-success"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export type TabKey = "overview" | "charges" | "activity";

export function TabsNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "charges", label: "Charges" },
    { key: "activity", label: "Activity" },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        borderBottom: "1px solid var(--gecko-border)",
        marginBottom: 20,
      }}
    >
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              background: "transparent",
              border: "none",
              padding: "10px 0",
              fontSize: 14,
              fontWeight: 600,
              color: on ? "var(--gecko-primary-600)" : "var(--gecko-text-secondary)",
              borderBottom: on
                ? "2px solid var(--gecko-primary-600)"
                : "2px solid transparent",
              cursor: "pointer",
              marginBottom: -1,
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section card with uppercase header ──────────────────────────────────────

export function SectionCard({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--gecko-bg-surface)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: "var(--gecko-shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "var(--gecko-text-secondary)",
        }}
      >
        <Icon name={icon} size={14} />
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Activity empty state ────────────────────────────────────────────────────

export function ActivityEmpty() {
  return (
    <div
      style={{
        background: "var(--gecko-bg-surface)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 12,
        padding: "60px 20px",
        textAlign: "center",
        color: "var(--gecko-text-secondary)",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <Icon name="activity" size={36} style={{ color: "var(--gecko-text-disabled)" }} />
      </div>
      <div style={{ fontWeight: 600, color: "var(--gecko-text-primary)", marginBottom: 4 }}>
        No activity yet
      </div>
      <div style={{ fontSize: 13 }}>
        Audit log entries for this tariff card will appear here.
      </div>
    </div>
  );
}

// ─── Date formatting helper ──────────────────────────────────────────────────

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatLongDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH_SHORT[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

export function daysRemaining(expiryDate: string): number {
  if (!expiryDate) return 0;
  const exp = new Date(expiryDate + "T00:00:00");
  if (Number.isNaN(exp.getTime())) return 0;
  return Math.max(0, Math.round((exp.getTime() - Date.now()) / 86400000));
}

export function annualizedEstimate(rows: { sellingRateThb: number }[]): string {
  const sum = rows.reduce((acc, r) => acc + (r.sellingRateThb || 0) * 1000, 0);
  if (!sum) return "—";
  if (sum >= 1_000_000) return `฿${(sum / 1_000_000).toFixed(1)}M`;
  if (sum >= 1_000) return `฿${(sum / 1_000).toFixed(1)}K`;
  return `฿${sum.toFixed(0)}`;
}

// ─── Parties row helpers ─────────────────────────────────────────────────────

/** Single label/value box used in the PARTIES & VALIDITY card row 2 / row 3. */
export function PartyBox({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--gecko-bg-subtle)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--gecko-text-secondary)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className={mono ? "gecko-text-mono" : undefined}
        style={{ fontSize: 13, fontWeight: 600, color: "var(--gecko-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
