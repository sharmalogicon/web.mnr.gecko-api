"use client";

/**
 * Shared <ChargesTable> — the rows table from the TOS Customer Rate Profile
 * pattern. Used by Standard / Liner / Vendor tariff card pages.
 * Phase 7 D-09.
 */

import { Button } from "@/components/ui/button";
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

export function ChargesTable({
  rows,
  editable = false,
  onRowClick,
  onAddRow,
  onDeleteRow,
  onMoveRow,
}: ChargesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="w-10 px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Charge Code</th>
              <th className="px-3 py-2 text-left">Order Type</th>
              <th className="px-3 py-2 text-left">Movement</th>
              <th className="px-3 py-2 text-left">Charge Type</th>
              <th className="px-3 py-2 text-left">Unit</th>
              <th className="px-3 py-2 text-left">Size</th>
              <th className="px-3 py-2 text-left">Cargo</th>
              <th className="px-3 py-2 text-left">Pymt</th>
              <th className="px-3 py-2 text-right">Rate (THB)</th>
              {editable && <th className="w-24 px-3 py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={editable ? 11 : 10} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No charge rows yet. {editable && "Click + to add the first row."}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const meta = findChargeCode(row.chargeCode);
                return (
                  <tr
                    key={row.id}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/40" : undefined}
                    onClick={() => onRowClick?.(row, idx)}
                  >
                    <td className="px-3 py-2 text-sm text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2">
                      <div className="font-mono text-sm font-medium">{row.chargeCode}</div>
                      {meta && <div className="text-xs text-muted-foreground">{meta.label}</div>}
                    </td>
                    <td className="px-3 py-2 text-sm">{row.orderType}</td>
                    <td className="px-3 py-2 text-sm">{row.movementCode}</td>
                    <td className="px-3 py-2 text-xs">{row.chargeType}</td>
                    <td className="px-3 py-2 text-xs font-medium">{row.billingUnit}</td>
                    <td className="px-3 py-2 text-sm">{row.size ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{row.cargoCategory}</td>
                    <td className="px-3 py-2 text-xs">{row.paymentTerm}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="font-semibold">฿{row.sellingRateThb.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">/ {row.billingUnit}</div>
                    </td>
                    {editable && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() => onMoveRow?.(row, idx, "up")}
                            aria-label="Move up"
                          >
                            <Icon name="arrowUp" size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === rows.length - 1}
                            onClick={() => onMoveRow?.(row, idx, "down")}
                            aria-label="Move down"
                          >
                            <Icon name="arrowDown" size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onDeleteRow?.(row, idx)}
                            aria-label="Delete row"
                          >
                            <Icon name="trash" size={14} />
                          </Button>
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
        <div className="border-t bg-muted/30 px-3 py-2 flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={onAddRow}>
            <Icon name="plus" size={14} className="mr-1" />
            Add row
          </Button>
        </div>
      )}
    </div>
  );
}
