"use client";

/**
 * Shared <ChargesTable> — the rows table from the TOS Customer Rate Profile
 * pattern. Used by Standard / Liner / Vendor tariff card pages.
 * Phase 7 D-09.
 *
 * Phase 7.1 — TOS design parity: gecko-table markup wrapped in raw-div card,
 * uppercase 12px semibold headers, 13px body, gecko-btn primitives.
 */

import { Icon } from "@/components/ui/Icon";
import { findChargeCode } from "@/data/seed/_shared/charge-codes";
import type { ChargeRow } from "@/lib/types";

export interface ChargesTableProps {
  rows: ChargeRow[];
  /** When provided, the action column with +/×/⇅ buttons is rendered. */
  editable?: boolean;
  /** Triggered when user clicks a row → typically opens the edit modal. */
  onRowClick?: (row: ChargeRow, index: number) => void;
  /** Triggered when user clicks the + (add) button. */
  onAddRow?: () => void;
  /** Triggered when user clicks the × (delete) button for a row. */
  onDeleteRow?: (row: ChargeRow, index: number) => void;
  /** Triggered when user clicks the ⇅ (move) button — passes new index. */
  onMoveRow?: (row: ChargeRow, fromIndex: number, direction: "up" | "down") => void;
}

const TH_STYLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: "var(--gecko-font-weight-semibold)" as React.CSSProperties["fontWeight"],
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--gecko-text-secondary)",
  textAlign: "left",
};

export function ChargesTable({
  rows,
  editable = false,
  onRowClick,
  onAddRow,
  onDeleteRow,
  onMoveRow,
}: ChargesTableProps) {
  const colCount = editable ? 11 : 10;
  return (
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
        <table className="gecko-table gecko-table-comfortable" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, width: 40 }}>#</th>
              <th style={TH_STYLE}>Charge Code</th>
              <th style={TH_STYLE}>Order Type</th>
              <th style={TH_STYLE}>Movement</th>
              <th style={TH_STYLE}>Charge Type</th>
              <th style={TH_STYLE}>Unit</th>
              <th style={TH_STYLE}>Size</th>
              <th style={TH_STYLE}>Cargo</th>
              <th style={TH_STYLE}>Pymt</th>
              <th style={{ ...TH_STYLE, textAlign: "right" }}>Rate (THB)</th>
              {editable && <th style={{ ...TH_STYLE, textAlign: "right", width: 96 }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  style={{
                    padding: "32px 12px",
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--gecko-text-secondary)",
                  }}
                >
                  No charge rows yet. {editable && "Click + to add the first row."}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const meta = findChargeCode(row.chargeCode);
                return (
                  <tr
                    key={row.id}
                    className={onRowClick ? "gecko-row-clickable" : undefined}
                    onClick={() => onRowClick?.(row, idx)}
                    style={onRowClick ? { cursor: "pointer" } : undefined}
                  >
                    <td style={{ color: "var(--gecko-text-secondary)" }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontFamily: "var(--gecko-font-mono)", fontWeight: 600, color: "var(--gecko-text-primary)" }}>
                        {row.chargeCode}
                      </div>
                      {meta && (
                        <div style={{ fontSize: 12, color: "var(--gecko-text-secondary)", marginTop: 2 }}>
                          {meta.label}
                        </div>
                      )}
                    </td>
                    <td>{row.orderType}</td>
                    <td>{row.movementCode}</td>
                    <td style={{ fontSize: 12 }}>{row.chargeType}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{row.billingUnit}</td>
                    <td>{row.size ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>{row.cargoCategory}</td>
                    <td style={{ fontSize: 12 }}>{row.paymentTerm}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: "var(--gecko-text-primary)", fontFamily: "var(--gecko-font-mono)" }}>
                        ฿{row.sellingRateThb.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--gecko-text-secondary)" }}>
                        / {row.billingUnit}
                      </div>
                    </td>
                    {editable && (
                      <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="gecko-btn gecko-btn-ghost gecko-btn-sm"
                            disabled={idx === 0}
                            onClick={() => onMoveRow?.(row, idx, "up")}
                            aria-label="Move up"
                            style={{ padding: 4 }}
                          >
                            <Icon name="arrowUp" size={14} />
                          </button>
                          <button
                            type="button"
                            className="gecko-btn gecko-btn-ghost gecko-btn-sm"
                            disabled={idx === rows.length - 1}
                            onClick={() => onMoveRow?.(row, idx, "down")}
                            aria-label="Move down"
                            style={{ padding: 4 }}
                          >
                            <Icon name="arrowDown" size={14} />
                          </button>
                          <button
                            type="button"
                            className="gecko-btn gecko-btn-ghost gecko-btn-sm"
                            onClick={() => onDeleteRow?.(row, idx)}
                            aria-label="Delete row"
                            style={{ padding: 4, color: "var(--gecko-error-600)" }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
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
      {editable && (
        <div
          style={{
            borderTop: "1px solid var(--gecko-border)",
            background: "var(--gecko-bg-subtle)",
            padding: "8px 12px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
            onClick={onAddRow}
          >
            <Icon name="plus" size={14} /> Add row
          </button>
        </div>
      )}
    </div>
  );
}
