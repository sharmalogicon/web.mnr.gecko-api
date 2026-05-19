"use client";

/**
 * /tariff/vendor — list of vendor tariff cards (cost side).
 * Phase 7.7-H — TOS data-table layout.
 *
 * Columns: VENDOR ID (mono primary) · VENDOR NAME (bold) · TYPE (Vendor pill) ·
 * CATEGORY · EFFECTIVE · EXPIRY (red if past) · STATUS pill · trailing "…" cell.
 */

import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";
import type { TariffStatus } from "@/lib/types/tariff/standard";

const TODAY = new Date().toISOString().slice(0, 10);

function StatusPill({ status }: { status: TariffStatus }) {
  if (status === "APPROVED") return <span className="gecko-pill gecko-pill-success">Active</span>;
  if (status === "EXPIRED")  return <span className="gecko-pill gecko-pill-danger">Expired</span>;
  return <span className="gecko-pill gecko-pill-neutral">Draft</span>;
}

export default function VendorTariffListPage() {
  const cards = vendorTariffRepo.list();
  return (
    <AppShell>
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
          <ExportButton resource="Vendor tariffs" variant="outline" iconSize={16} />
          <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
            <Icon name="filter" size={16} /> Filter
          </button>
          <Link href="/tariff/vendor/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            <Icon name="plus" size={16} /> Onboard Vendor
          </Link>
        </div>
      </div>

      <div
        style={{
          background: "var(--gecko-bg-surface)",
          border: "1px solid var(--gecko-border)",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "var(--gecko-shadow-sm)",
          marginTop: 16,
        }}
      >
        <table className="gecko-table gecko-table-comfortable" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>Vendor ID</th>
              <th>Vendor name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Effective</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => {
              const vendor = findVendor(card.vendorId);
              const expired = card.expiryDate && card.expiryDate < TODAY;
              return (
                <tr key={card.id}>
                  <td>
                    <Link
                      href={`/tariff/vendor/${encodeURIComponent(card.vendorId)}`}
                      className="gecko-text-mono"
                      style={{ fontWeight: 600, color: "var(--gecko-primary-700)" }}
                    >
                      {card.vendorId}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--gecko-text-primary)" }}>
                      {vendor?.name ?? card.vendorId}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gecko-text-disabled)" }}>
                      {card.quotationNo || card.id}
                    </div>
                  </td>
                  <td>
                    <span className="gecko-pill gecko-pill-warning">
                      <Icon name="tool" size={11} /> Vendor
                    </span>
                  </td>
                  <td style={{ color: "var(--gecko-text-secondary)" }}>
                    {vendor?.category?.replace(/_/g, " ") ?? "—"}
                  </td>
                  <td className="gecko-text-mono" style={{ color: "var(--gecko-text-secondary)" }}>
                    {card.effectiveDate}
                  </td>
                  <td
                    className="gecko-text-mono"
                    style={{
                      color: expired ? "var(--gecko-error-600)" : "var(--gecko-text-secondary)",
                      fontWeight: expired ? 600 : 400,
                    }}
                  >
                    {card.expiryDate}
                  </td>
                  <td>
                    <StatusPill status={card.status} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--gecko-text-disabled)",
                        cursor: "pointer",
                      }}
                      aria-label="Row actions"
                    >
                      <Icon name="moreHorizontal" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
