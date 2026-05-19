"use client";

/**
 * /tariff/liner — list of liner tariff cards.
 * Phase 7.7-H — TOS data-table layout.
 * Phase 7.7-N — FilterPopover wired (status, tier).
 *
 * Columns: AGENT CODE (mono primary) · CARRIER NAME (bold) · TYPE (Liner pill) ·
 * AGENT · EFFECTIVE · EXPIRY (red if past) · STATUS pill · trailing "…" cell.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { FilterPopover, type FilterField } from "@/components/ui/FilterPopover";
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";
import type { TariffStatus } from "@/lib/types/tariff/standard";

const TODAY = new Date().toISOString().slice(0, 10);

function StatusPill({ status }: { status: TariffStatus }) {
  if (status === "APPROVED") return <span className="gecko-pill gecko-pill-success">Active</span>;
  if (status === "EXPIRED")  return <span className="gecko-pill gecko-pill-danger">Expired</span>;
  return <span className="gecko-pill gecko-pill-neutral">Draft</span>;
}

export default function LinerTariffListPage() {
  const cards = linerTariffRepo.list();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ status: "", tier: "" });

  const filterFields: FilterField[] = [
    {
      type: "select",
      key: "status",
      label: "Status",
      options: [
        { label: "All", value: "" },
        { label: "Draft", value: "DRAFT" },
        { label: "Approved", value: "APPROVED" },
        { label: "Expired", value: "EXPIRED" },
      ],
    },
    {
      type: "select",
      key: "tier",
      label: "Tier",
      options: [
        { label: "All", value: "" },
        { label: "Platinum", value: "platinum" },
        { label: "Gold", value: "gold" },
        { label: "Silver", value: "silver" },
        { label: "Standard", value: "standard" },
      ],
    },
  ];

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (filterValues.status && c.status !== filterValues.status) return false;
      if (filterValues.tier) {
        const liner = getCustomerByCode(c.agentCode);
        if (liner?.tier !== filterValues.tier) return false;
      }
      return true;
    });
  }, [cards, filterValues]);

  return (
    <AppShell>
      <div className="gecko-page-actions">
        <div className="gecko-page-actions-left">
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--gecko-text-primary)" }}>
              Liner Tariffs
            </h1>
            <span className="gecko-count-badge">
              {filteredCards.length === cards.length
                ? `${cards.length} agreements`
                : `${filteredCards.length} of ${cards.length} agreements`}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
            Per-carrier override rates relative to the depot Standard tariff. Liner rows take precedence
            at quote time; missing rows fall back to the depot Standard.
          </div>
        </div>
        <div className="gecko-toolbar">
          <ExportButton resource="Liner tariffs" variant="outline" iconSize={16} />
          <FilterPopover
            fields={filterFields}
            values={filterValues}
            onChange={setFilterValues}
            onApply={setFilterValues}
            onClear={() => setFilterValues({ status: "", tier: "" })}
          />
          <Link href="/tariff/liner/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            <Icon name="plus" size={16} /> New Liner Agreement
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
              <th>Agent code</th>
              <th>Carrier name</th>
              <th>Type</th>
              <th>Agent</th>
              <th>Effective</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card) => {
              const liner = getCustomerByCode(card.agentCode);
              const expired = card.expiryDate && card.expiryDate < TODAY;
              return (
                <tr key={card.id}>
                  <td>
                    <Link
                      href={`/tariff/liner/${encodeURIComponent(card.agentCode)}`}
                      className="gecko-text-mono"
                      style={{ fontWeight: 600, color: "var(--gecko-primary-700)" }}
                    >
                      {card.agentCode}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--gecko-text-primary)" }}>
                      {liner?.name ?? card.agentCode}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gecko-text-disabled)" }}>
                      {card.quotationNo || card.id}
                    </div>
                  </td>
                  <td>
                    <span className="gecko-pill gecko-pill-primary">
                      <Icon name="ship" size={11} /> Liner
                    </span>
                  </td>
                  <td style={{ color: "var(--gecko-text-secondary)" }}>{liner?.name ?? card.agentCode}</td>
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
