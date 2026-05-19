"use client";

/**
 * /tariff/standard — list of depot standard tariff cards.
 * Phase 7.7-H — TOS data-table layout.
 * Phase 7.7-N — FilterPopover wired (status, country).
 *
 * Columns: DEPOT (mono primary) · NAME (bold) · TYPE (Standard pill) ·
 * DEPOT COUNTRY (Assigned-to surrogate) · EFFECTIVE · EXPIRY (red if past) ·
 * STATUS pill · trailing "…" menu cell.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { FilterPopover, type FilterField } from "@/components/ui/FilterPopover";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";
import type { TariffStatus } from "@/lib/types/tariff/standard";

const TODAY = new Date().toISOString().slice(0, 10);

function StatusPill({ status }: { status: TariffStatus }) {
  if (status === "APPROVED") return <span className="gecko-pill gecko-pill-success">Active</span>;
  if (status === "EXPIRED")  return <span className="gecko-pill gecko-pill-danger">Expired</span>;
  return <span className="gecko-pill gecko-pill-neutral">Draft</span>;
}

export default function StandardTariffListPage() {
  const cards = standardTariffRepo.list();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ status: "", country: "" });

  const countries = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      const d = getDepotByCode(c.depotCode);
      if (d?.country) set.add(d.country);
    });
    return Array.from(set).sort();
  }, [cards]);

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
      key: "country",
      label: "Country",
      options: [
        { label: "All", value: "" },
        ...countries.map((c) => ({ label: c, value: c })),
      ],
    },
  ];

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (filterValues.status && c.status !== filterValues.status) return false;
      if (filterValues.country) {
        const d = getDepotByCode(c.depotCode);
        if (d?.country !== filterValues.country) return false;
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
              Standard Tariffs
            </h1>
            <span className="gecko-count-badge">
              {filteredCards.length === cards.length
                ? `${cards.length} depots`
                : `${filteredCards.length} of ${cards.length} depots`}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--gecko-text-secondary)", marginTop: 4 }}>
            Baseline price list per depot. When a Liner job runs at a depot, the Liner card&apos;s row (if any)
            supersedes; otherwise the Standard row applies.
          </div>
        </div>
        <div className="gecko-toolbar">
          <ExportButton resource="Standard tariffs" variant="outline" iconSize={16} />
          <FilterPopover
            fields={filterFields}
            values={filterValues}
            onChange={setFilterValues}
            onApply={setFilterValues}
            onClear={() => setFilterValues({ status: "", country: "" })}
          />
        </div>
      </div>

      {/* Table */}
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
              <th>Depot</th>
              <th>Name</th>
              <th>Type</th>
              <th>Depot country</th>
              <th>Effective</th>
              <th>Expiry</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredCards.map((card) => {
              const depot = getDepotByCode(card.depotCode);
              const expired = card.expiryDate && card.expiryDate < TODAY;
              return (
                <tr key={card.id}>
                  <td>
                    <Link
                      href={`/tariff/standard/${encodeURIComponent(card.depotCode)}`}
                      className="gecko-text-mono"
                      style={{ fontWeight: 600, color: "var(--gecko-primary-700)" }}
                    >
                      {card.depotCode}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--gecko-text-primary)" }}>
                      {depot?.name ?? "—"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--gecko-text-disabled)" }}>{card.id}</div>
                  </td>
                  <td>
                    <span className="gecko-pill gecko-pill-info">
                      <Icon name="layers" size={11} /> Standard
                    </span>
                  </td>
                  <td style={{ color: "var(--gecko-text-secondary)" }}>{depot?.country ?? "—"}</td>
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
