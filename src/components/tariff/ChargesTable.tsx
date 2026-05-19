"use client";

/**
 * Shared <ChargesTable> — TOS-pattern data table.
 * Phase 7.4 — matches the TOS container list density and chrome:
 *   - uppercase 12px semibold headers with secondary color
 *   - 14px body, generous row padding
 *   - primary identifier (Charge Code) bold + label below
 *   - SIZE / UNIT / CHARGE TYPE rendered as subtle pills
 *   - row hover gets gecko-bg-subtle
 *   - actions (↑ / ↓ / ✎ / ×) grouped right end, only in editable mode
 *   - helpful instruction line below the table
 */

import { Icon } from "@/components/ui/Icon";
import { findChargeCode } from "@/data/seed/_shared/charge-codes";
import type { ChargeRow } from "@/lib/types";

export interface ChargesTableProps {
  rows: ChargeRow[];
  editable?: boolean;
  onRowClick?: (row: ChargeRow, index: number) => void;
  onAddRow?: () => void;
  onDeleteRow?: (row: ChargeRow, index: number) => void;
  onMoveRow?: (row: ChargeRow, fromIndex: number, direction: "up" | "down") => void;
}

const TH_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--gecko-text-secondary)",
  textAlign: "left",
  padding: "12px 14px",
  background: "var(--gecko-bg-subtle)",
  borderBottom: "1px solid var(--gecko-border)",
};

const TD_BASE: React.CSSProperties = {
  fontSize: 14,
  padding: "14px",
  borderBottom: "1px solid var(--gecko-border)",
  verticalAlign: "middle",
};

/** Subtle pill in the gecko primary-50 / primary-700 palette (like TOS "40HC"). */
function Pill({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "accent" | "warning" | "gray";
}) {
  const palette: Record<typeof tone, { bg: string; fg: string }> = {
    primary: { bg: "var(--gecko-primary-50)", fg: "var(--gecko-primary-700)" },
    accent:  { bg: "var(--gecko-accent-50)",  fg: "var(--gecko-accent-700)"  },
    warning: { bg: "var(--gecko-warning-50)", fg: "var(--gecko-warning-700)" },
    gray:    { bg: "var(--gecko-bg-subtle)",  fg: "var(--gecko-text-secondary)" },
  } as const;
  const p = palette[tone];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: p.bg,
        color: p.fg,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

const CHARGE_TYPE_TONE: Record<string, "primary" | "accent" | "warning" | "gray"> = {
  REPAIR: "warning",
  SURVEY: "primary",
  PTI: "primary",
  CLEANING: "accent",
  STORAGE: "gray",
  GATE: "gray",
  EMERGENCY: "warning",
  LABOR: "gray",
  UTILITY: "gray",
};

function ActionButton({
  onClick,
  ariaLabel,
  iconName,
  disabled,
  destructive,
}: {
  onClick: () => void;
  ariaLabel: string;
  iconName: string;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: 6,
        borderRadius: 6,
        color: destructive ? "var(--gecko-error-600)" : "var(--gecko-text-secondary)",
        opacity: disabled ? 0.35 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--gecko-bg-subtle)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon name={iconName} size={16} />
    </button>
  );
}

export function ChargesTable({
  rows,
  editable = false,
  onRowClick,
  onAddRow,
  onDeleteRow,
  onMoveRow,
}: ChargesTableProps) {
  // Phase 7.8-C: dropped Order Type / Movement / Cargo / Pymt columns —
  // those are agreement-level (card-header) defaults. Charge Type is now
  // derived via findChargeCode(row.chargeCode).chargeType. New columns
  // surface the M&R repair context (Component, Damage, Repair).
  const colCount = editable ? 10 : 9;
  return (
    <div>
      <div
        style={{
          background: "var(--gecko-bg-surface)",
          border: "1px solid var(--gecko-border)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "var(--gecko-shadow-sm)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ ...TH_STYLE, width: 56 }}>#</th>
                <th style={TH_STYLE}>Charge Code</th>
                <th style={TH_STYLE}>Component</th>
                <th style={TH_STYLE}>Damage</th>
                <th style={TH_STYLE}>Repair</th>
                <th style={TH_STYLE}>Charge Type</th>
                <th style={TH_STYLE}>Unit</th>
                <th style={TH_STYLE}>Size</th>
                <th style={{ ...TH_STYLE, textAlign: "right" }}>Rate (THB)</th>
                {editable && <th style={{ ...TH_STYLE, width: 140, textAlign: "right" }} aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    style={{
                      padding: "40px 14px",
                      textAlign: "center",
                      fontSize: 14,
                      color: "var(--gecko-text-secondary)",
                    }}
                  >
                    No charge rows yet.{" "}
                    {editable && (
                      <button
                        type="button"
                        onClick={onAddRow}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--gecko-primary-600)",
                          cursor: "pointer",
                          textDecoration: "underline",
                          font: "inherit",
                        }}
                      >
                        Add the first row.
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const meta = findChargeCode(row.chargeCode);
                  const lastRow = idx === rows.length - 1;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row, idx)}
                      style={{
                        cursor: onRowClick ? "pointer" : "default",
                        transition: "background-color 100ms",
                      }}
                      onMouseEnter={(e) => {
                        if (onRowClick) e.currentTarget.style.background = "var(--gecko-bg-subtle)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td style={{ ...TD_BASE, color: "var(--gecko-text-secondary)", borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        {idx + 1}
                      </td>
                      <td style={{ ...TD_BASE, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        <div
                          style={{
                            fontFamily: "var(--gecko-font-mono)",
                            fontWeight: 700,
                            color: "var(--gecko-text-primary)",
                            fontSize: 14,
                          }}
                        >
                          {row.chargeCode}
                        </div>
                        {meta && (
                          <div style={{ fontSize: 12, color: "var(--gecko-text-secondary)", marginTop: 2 }}>
                            {meta.label}
                          </div>
                        )}
                      </td>
                      <td style={{ ...TD_BASE, color: "var(--gecko-text-secondary)", fontFamily: "var(--gecko-font-mono)", fontSize: 13, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        {row.component ?? "—"}
                      </td>
                      <td style={{ ...TD_BASE, color: "var(--gecko-text-secondary)", fontFamily: "var(--gecko-font-mono)", fontSize: 13, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        {row.damageCode ?? "—"}
                      </td>
                      <td style={{ ...TD_BASE, color: "var(--gecko-text-secondary)", fontFamily: "var(--gecko-font-mono)", fontSize: 13, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        {row.repairCode ?? "—"}
                      </td>
                      <td style={{ ...TD_BASE, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        {meta ? <Pill tone={CHARGE_TYPE_TONE[meta.chargeType] ?? "gray"}>{meta.chargeType}</Pill> : <span style={{ color: "var(--gecko-text-disabled)" }}>—</span>}
                      </td>
                      <td style={{ ...TD_BASE, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        <Pill tone="gray">{row.billingUnit}</Pill>
                      </td>
                      <td style={{ ...TD_BASE, borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        {row.size ? <Pill tone="primary">{row.size}'</Pill> : <span style={{ color: "var(--gecko-text-disabled)" }}>—</span>}
                      </td>
                      <td style={{ ...TD_BASE, textAlign: "right", borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}>
                        <div style={{ fontFamily: "var(--gecko-font-mono)", fontWeight: 700, color: "var(--gecko-text-primary)", fontSize: 14 }}>
                          ฿{row.sellingRateThb.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--gecko-text-secondary)", marginTop: 2 }}>
                          / {row.billingUnit}
                        </div>
                      </td>
                      {editable && (
                        <td
                          style={{ ...TD_BASE, textAlign: "right", borderBottom: lastRow ? "none" : TD_BASE.borderBottom }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                            <ActionButton
                              ariaLabel="Edit row"
                              iconName="edit"
                              onClick={() => onRowClick?.(row, idx)}
                            />
                            <ActionButton
                              ariaLabel="Move up"
                              iconName="arrowUp"
                              onClick={() => onMoveRow?.(row, idx, "up")}
                              disabled={idx === 0}
                            />
                            <ActionButton
                              ariaLabel="Move down"
                              iconName="arrowDown"
                              onClick={() => onMoveRow?.(row, idx, "down")}
                              disabled={idx === rows.length - 1}
                            />
                            <ActionButton
                              ariaLabel="Delete row"
                              iconName="trash"
                              destructive
                              onClick={() => onDeleteRow?.(row, idx)}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {editable && rows.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--gecko-border)",
              background: "var(--gecko-bg-subtle)",
              padding: "10px 14px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={onAddRow}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              <Icon name="plus" size={14} /> Add row
            </button>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: "var(--gecko-text-secondary)",
          }}
        >
          Showing {rows.length} row{rows.length === 1 ? "" : "s"}
          {editable && onRowClick && " · Click any row to edit"}
        </div>
      )}
    </div>
  );
}
