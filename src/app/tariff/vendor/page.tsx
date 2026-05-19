"use client";

/**
 * /tariff/vendor — list of vendor tariff cards (cost side).
 * Phase 7 D-02. Phase 7.1 — TOS design parity: gecko-page-actions header
 * + raw-div cards using gecko tokens (no shadcn Card).
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { TariffStatusBadge } from "@/components/tariff";
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";

export default function VendorTariffListPage() {
  const cards = vendorTariffRepo.list();
  return (
    <AppShell>
      {/* ===== Page header (gecko-page-actions) ===== */}
      <div className="gecko-page-actions">
        <div className="gecko-page-actions-left">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gecko-text-primary)" }}>
              Vendor Tariffs
            </h1>
            <span className="gecko-count-badge">{cards.length} vendors</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
            What each third-party vendor charges us when we outsource a job. Used by the simulator to
            compute margin (Revenue − Cost).
          </div>
        </div>
        <div className="gecko-toolbar">
          <Link href="/tariff/vendor/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            <Icon name="plus" size={16} /> Onboard Vendor
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {cards.map((card) => {
          const vendor = findVendor(card.vendorId);
          return (
            <Link
              key={card.id}
              href={`/tariff/vendor/${encodeURIComponent(card.vendorId)}`}
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
                    {vendor?.name ?? card.vendorId}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
                    {vendor?.category?.replace(/_/g, " ") ?? "—"} · {vendor?.country ?? "—"}
                  </div>
                </div>
                <TariffStatusBadge status={card.status} />
              </div>
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>VQ no</span>
                  <span style={{ fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-text-primary)" }}>{card.quotationNo || "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--gecko-text-secondary)" }}>Service rows</span>
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
