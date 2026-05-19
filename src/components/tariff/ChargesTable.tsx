"use client";

/**
 * Shared <ChargesTable> — TOS-pattern data table.
 * Phase 7.4 / 7.9-B — TOS density + chrome:
 *   - uppercase 12px semibold headers with secondary color
 *   - 14px body, generous row padding
 *   - primary identifier (Charge Code) bold + label below
 *   - SIZE / UNIT / CHARGE TYPE rendered as subtle pills
 *   - row hover gets gecko-bg-subtle
 *   - actions (UP / DOWN / EDIT / DELETE) grouped right end, only in editable mode
 *
 * Phase 7.9-B: all inline styles converted to CSS module.
 */

import { Icon } from "@/components/ui/Icon";
import { findChargeCode } from "@/data/seed/_shared/charge-codes";
import type { ChargeRow } from "@/lib/types";

import styles from "./ChargesTable.module.css";

export interface ChargesTableProps {
  rows: ChargeRow[];
  editable?: boolean;
  onRowClick?: (row: ChargeRow, index: number) => void;
  onAddRow?: () => void;
  onDeleteRow?: (row: ChargeRow, index: number) => void;
  onMoveRow?: (row: ChargeRow, fromIndex: number, direction: "up" | "down") => void;
}

type PillTone = "primary" | "accent" | "warning" | "gray";

function Pill({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: PillTone;
}) {
  const toneClass = {
    primary: styles.pillPrimary,
    accent: styles.pillAccent,
    warning: styles.pillWarning,
    gray: styles.pillGray,
  }[tone];
  return <span className={`${styles.pill} ${toneClass}`}>{children}</span>;
}

const CHARGE_TYPE_TONE: Record<string, PillTone> = {
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
      className={`${styles.actionBtn}${destructive ? ` ${styles.actionBtnDanger}` : ""}`}
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
  const colCount = editable ? 10 : 9;
  return (
    <div>
      <div className={styles.shell}>
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.th} ${styles.thNum}`}>#</th>
                <th className={styles.th}>Charge Code</th>
                <th className={styles.th}>Component</th>
                <th className={styles.th}>Damage</th>
                <th className={styles.th}>Repair</th>
                <th className={styles.th}>Charge Type</th>
                <th className={styles.th}>Unit</th>
                <th className={styles.th}>Size</th>
                <th className={`${styles.th} ${styles.thRight}`}>Rate (THB)</th>
                {editable && <th className={`${styles.th} ${styles.thActions}`} aria-label="Actions" />}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className={styles.emptyCell}>
                    No charge rows yet.{" "}
                    {editable && (
                      <button
                        type="button"
                        onClick={onAddRow}
                        className={styles.emptyLink}
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
                  const tdClass = `${styles.td}${lastRow ? ` ${styles.tdLast}` : ""}`;
                  const tdMonoSm = `${styles.td}${lastRow ? ` ${styles.tdLast}` : ""} ${styles.tdMonoSmall}`;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row, idx)}
                      className={`${styles.row}${onRowClick ? ` ${styles.rowClickable}` : ""}`}
                    >
                      <td className={`${tdClass} ${styles.tdSecondary}`}>{idx + 1}</td>
                      <td className={tdClass}>
                        <div className={styles.chargeCode}>{row.chargeCode}</div>
                        {meta && <div className={styles.chargeLabel}>{meta.label}</div>}
                      </td>
                      <td className={tdMonoSm}>{row.component ?? "—"}</td>
                      <td className={tdMonoSm}>{row.damageCode ?? "—"}</td>
                      <td className={tdMonoSm}>{row.repairCode ?? "—"}</td>
                      <td className={tdClass}>
                        {meta ? (
                          <Pill tone={CHARGE_TYPE_TONE[meta.chargeType] ?? "gray"}>
                            {meta.chargeType}
                          </Pill>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={tdClass}>
                        <Pill tone="gray">{row.billingUnit}</Pill>
                      </td>
                      <td className={tdClass}>
                        {row.size ? (
                          <Pill tone="primary">{row.size}&apos;</Pill>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={`${tdClass} ${styles.tdRight}`}>
                        <div className={styles.rateValue}>
                          ฿{row.sellingRateThb.toLocaleString()}
                        </div>
                        <div className={styles.rateUnit}>/ {row.billingUnit}</div>
                      </td>
                      {editable && (
                        <td
                          className={`${tdClass} ${styles.actionsCell}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.actionsGroup}>
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
          <div className={styles.addFooter}>
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
        <div className={styles.helpLine}>
          Showing {rows.length} row{rows.length === 1 ? "" : "s"}
          {editable && onRowClick && " · Click any row to edit"}
        </div>
      )}
    </div>
  );
}
