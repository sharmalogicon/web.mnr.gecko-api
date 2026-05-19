"use client";

/**
 * /tariff/standard — list of depot standard tariff cards (one per depot).
 * Phase 7 D-01. Phase 7.1 — TOS design parity: gecko-page-actions header
 * + raw-div cards using gecko tokens (no shadcn Card).
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { TariffStatusBadge } from "@/components/tariff";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";

export default function StandardTariffListPage() {
  const cards = standardTariffRepo.list();
  return (
    <AppShell>
      {/* ===== Page header (gecko-page-actions) ===== */}
      <div className="gecko-page-actions">
        <div className="gecko-page-actions-left">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gecko-text-primary)" }}>
              Standard Tariffs
            </h1>
            <span className="gecko-count-badge">{cards.length} depots</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
            Baseline price list per depot. When a Liner job runs at a depot, the Liner card's row (if any)
            supersedes; otherwise the Standard row applies.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {cards.map((card) => {
          const depot = getDepotByCode(card.depotCode);
          return (
            <Link
              key={card.id}
              href={`/tariff/standard/${encodeURIComponent(card.depotCode)}`}
              style={{
                display: "block",
                background: "var(--gecko-bg-surface)",
                border: "1px solid var(--gecko-border)",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "var(--gecko-shadow-sm)",
                textDecoration: "none",
                color: "inherit",
                transition: "box-shadow 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--gecko-shadow-md)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--gecko-shadow-sm)")}
            >
              <div style={{ padding: 16, borderBottom: "1px solid var(--gecko-border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: "var(--gecko-text-base)", fontWeight: "var(--gecko-font-weight-semibold)", color: "var(--gecko-text-primary)", fontFamily: "var(--gecko-font-mono)" }}>
                    {card.depotCode}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
                    {depot?.name ?? "—"}
                  </div>
                </div>
                <TariffStatusBadge status={card.status} />
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>Rows</span>
                  <span style={{ fontWeight: 600, color: "var(--gecko-text-primary)" }}>{card.rows.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>Effective</span>
                  <span style={{ fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-text-primary)" }}>{card.effectiveDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>Expiry</span>
                  <span style={{ fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-text-primary)" }}>{card.expiryDate}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
