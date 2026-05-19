"use client";

/**
 * /tariff/liner — list of liner tariff cards (one per shipping line).
 * Phase 7 D-02. Phase 7.1 — TOS design parity: gecko-page-actions header
 * + raw-div cards using gecko tokens (no shadcn Card).
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { TariffStatusBadge } from "@/components/tariff";
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";

export default function LinerTariffListPage() {
  const cards = linerTariffRepo.list();
  return (
    <AppShell>
      {/* ===== Page header (gecko-page-actions) ===== */}
      <div className="gecko-page-actions">
        <div className="gecko-page-actions-left">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gecko-text-primary)" }}>
              Liner Tariffs
            </h1>
            <span className="gecko-count-badge">{cards.length} agreements</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
            Per-carrier override rates relative to the depot Standard tariff. Liner rows take precedence
            at quote time; missing rows fall back to the depot Standard.
          </div>
        </div>
        <div className="gecko-toolbar">
          <Link href="/tariff/liner/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            <Icon name="plus" size={16} /> New Liner Agreement
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {cards.map((card) => {
          const liner = getCustomerByCode(card.agentCode);
          return (
            <Link
              key={card.id}
              href={`/tariff/liner/${encodeURIComponent(card.agentCode)}`}
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
                  <div style={{ fontSize: "var(--gecko-text-base)", fontWeight: "var(--gecko-font-weight-semibold)", color: "var(--gecko-text-primary)" }}>
                    {liner?.name ?? card.agentCode}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-text-secondary)", marginTop: 4 }}>
                    {card.agentCode}
                  </div>
                </div>
                <TariffStatusBadge status={card.status} />
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>Quotation</span>
                  <span style={{ fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-text-primary)" }}>{card.quotationNo || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>Override rows</span>
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
