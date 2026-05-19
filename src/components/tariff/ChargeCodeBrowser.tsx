"use client";

/**
 * <ChargeCodeBrowser> — full-modal picker for charge codes.
 * Sister to <ChargeCodeCombobox>'s "Browse all" button.
 * Tabs: CEDEX-derived codes vs SVC- prefix services. Search filters
 * across both tabs.
 *
 * Phase 7.2.
 */

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/Icon";
import {
  chargeCodes,
  type ChargeCode,
} from "@/data/seed/_shared/charge-codes";

export interface ChargeCodeBrowserProps {
  open: boolean;
  onClose: () => void;
  onPick: (code: string) => void;
}

type Tab = "all" | "cedex" | "svc";

export function ChargeCodeBrowser({ open, onClose, onPick }: ChargeCodeBrowserProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const filtered: ChargeCode[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chargeCodes.filter((c) => {
      if (tab === "cedex" && !c.cedexComponent) return false;
      if (tab === "svc" && c.cedexComponent) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.chargeType.toLowerCase().includes(q)
      );
    });
  }, [tab, query]);

  // Group by chargeType for visual hierarchy
  const grouped = useMemo(() => {
    const map = new Map<string, ChargeCode[]>();
    for (const c of filtered) {
      const k = c.chargeType;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const TAB_BTN = (id: Tab, label: string, count: number): React.CSSProperties => ({
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: tab === id ? 600 : 500,
    color: tab === id ? "var(--gecko-primary-700)" : "var(--gecko-text-secondary)",
    background: tab === id ? "var(--gecko-primary-50)" : "transparent",
    border: "1px solid",
    borderColor: tab === id ? "var(--gecko-primary-200)" : "var(--gecko-border)",
    borderRadius: 8,
    cursor: "pointer",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Browse charge codes</DialogTitle>
        </DialogHeader>

        {/* Search + tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by code, label, or type…"
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                border: "1px solid var(--gecko-border)",
                borderRadius: 8,
                fontSize: 13,
                background: "var(--gecko-bg-surface)",
                outline: "none",
              }}
            />
            <Icon
              name="search"
              size={16}
              className="absolute"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gecko-text-secondary)" }}
            />
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setTab("all")} style={TAB_BTN("all", "All", chargeCodes.length)}>
              All ({chargeCodes.length})
            </button>
            <button type="button" onClick={() => setTab("cedex")} style={TAB_BTN("cedex", "CEDEX", 0)}>
              CEDEX repair ({chargeCodes.filter((c) => c.cedexComponent).length})
            </button>
            <button type="button" onClick={() => setTab("svc")} style={TAB_BTN("svc", "Services", 0)}>
              Services ({chargeCodes.filter((c) => !c.cedexComponent).length})
            </button>
          </div>

          {/* Grouped list */}
          <div style={{ overflowY: "auto", maxHeight: "50vh", border: "1px solid var(--gecko-border)", borderRadius: 8 }}>
            {grouped.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", fontSize: 13, color: "var(--gecko-text-secondary)" }}>
                No charge codes match.
              </div>
            ) : (
              grouped.map(([chargeType, codes]) => (
                <div key={chargeType}>
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "var(--gecko-bg-subtle)",
                      borderBottom: "1px solid var(--gecko-border)",
                      borderTop: "1px solid var(--gecko-border)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--gecko-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {chargeType} ({codes.length})
                  </div>
                  {codes.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        onPick(c.code);
                        onClose();
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 12px",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--gecko-border)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--gecko-bg-subtle)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span
                        style={{
                          fontFamily: "var(--gecko-font-mono)",
                          fontWeight: 600,
                          color: "var(--gecko-primary-700)",
                          minWidth: 110,
                          fontSize: 13,
                        }}
                      >
                        {c.code}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--gecko-text-primary)" }}>{c.label}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--gecko-text-secondary)",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: 4,
                          background: "var(--gecko-bg-subtle)",
                        }}
                      >
                        {c.defaultBillingUnit}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
