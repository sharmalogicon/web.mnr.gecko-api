"use client";

/**
 * Shared chrome for tariff detail + edit pages.
 *
 * Phase 7.7-I/J/K / 7.9-B — TOS reference parity, native gecko classes.
 *   - <DetailHeader>       top header row (back arrow -> id badge -> status pill ->
 *                          type pill -> "view only", title beneath, top-right toolbar)
 *   - <StatCardsRow>       4 hero stat cards (effective / days remaining /
 *                          priced charges / annualized estimate)
 *   - <ValidityProgress>   thin progress bar with day N / 364 (X%)
 *   - <TabsNav>            blue-underline tab nav
 *   - <SectionCard>        rounded container with uppercase header
 *   - <ActivityEmpty>      "No activity yet" stub
 *
 * Everything is composed of raw divs + gecko CSS variables — no shadcn Cards.
 */

import React from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { TariffStatus } from "@/lib/types/tariff/standard";

import styles from "./TariffDetailChrome.module.css";

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
  title: string;
  acronym?: string;
  viewOnly?: boolean;
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
    <div className={styles.headerRoot}>
      <div className={styles.headerTop}>
        <div className={styles.headerTopLeft}>
          <Link
            href={backHref}
            className={`gecko-btn gecko-btn-ghost gecko-btn-icon gecko-btn-sm ${styles.backLink}`}
            aria-label={backLabel}
          >
            <Icon name="arrowLeft" size={16} />
          </Link>
          <span className={`gecko-text-mono ${styles.idBadge}`}>{id}</span>
          <StatusPill status={status} />
          <TypePill lane={lane} />
          {viewOnly && <span className={styles.viewOnly}>view only</span>}
        </div>
        <div className="gecko-toolbar">{toolbar}</div>
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {acronym && <span className={styles.acronym}>{acronym}</span>}
      </div>
    </div>
  );
}

// ─── 4 hero stat cards ───────────────────────────────────────────────────────

export type StatTone = "primary" | "success" | "warning" | "neutral";

/**
 * Stat-card prop shape. Backward-compatible with the legacy
 * `iconColor` + `iconBg` API: when both are present they are mapped to
 * the closest `tone`. New code should pass `tone` directly.
 */
export interface StatCard {
  icon: string;
  value: string;
  caption: string;
  tone?: StatTone;
  /** @deprecated use `tone`. */
  iconColor?: string;
  /** @deprecated use `tone`. */
  iconBg?: string;
}

function toneFromLegacy(card: StatCard): StatTone {
  if (card.tone) return card.tone;
  if (card.iconBg?.includes("primary")) return "primary";
  if (card.iconBg?.includes("warning")) return "warning";
  if (card.iconBg?.includes("success")) return "success";
  return "neutral";
}

export function StatCardsRow({ cards }: { cards: [StatCard, StatCard, StatCard, StatCard] }) {
  return (
    <div className={styles.statRow}>
      {cards.map((c, i) => (
        <StatTile key={i} card={c} />
      ))}
    </div>
  );
}

function StatTile({ card }: { card: StatCard }) {
  const tone = toneFromLegacy(card);
  return (
    <div className={styles.statTile}>
      <div className={`${styles.statIcon} gecko-stat-card-icon-${tone}`}>
        <Icon name={card.icon} size={18} />
      </div>
      <div className={styles.statBody}>
        <div className={`gecko-text-mono ${styles.statValue}`}>{card.value}</div>
        <div className={styles.statCaption}>{card.caption}</div>
      </div>
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
  // Snap to nearest 5% bucket so the .progressFill CSS module rule can paint it.
  const pctBucket = Math.round(pct / 5) * 5;
  return (
    <div className={styles.validityRoot}>
      <div className={styles.validityHead}>
        <span>Validity</span>
        <span className="gecko-text-mono">
          day {day} / of {total} ({pct}%)
        </span>
      </div>
      <div className="gecko-progress gecko-progress-sm">
        <div
          className="gecko-progress-bar gecko-progress-success gecko-progress-fill"
          data-progress={pctBucket}
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
    <div className={styles.tabsRow}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`${styles.tabBtn}${on ? ` ${styles.tabBtnActive}` : ""}`}
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
    <div className={styles.sectionRoot}>
      <div className={styles.sectionHead}>
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
    <div className={styles.activityEmpty}>
      <div className={styles.activityEmptyIcon}>
        <Icon name="activity" size={36} />
      </div>
      <div className={styles.activityEmptyTitle}>No activity yet</div>
      <div className={styles.activityEmptyHint}>
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
    <div className={styles.partyBox}>
      <div className={styles.partyLabel}>{label}</div>
      <div className={`${styles.partyValue}${mono ? " gecko-text-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
