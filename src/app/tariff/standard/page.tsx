"use client";

/**
 * /tariff/standard — list of depot standard tariff cards.
 * Phase 7.7-H — TOS data-table layout.
 * Phase 7.7-N — FilterPopover wired (status, country).
 * Phase 7.13-C2 — chrome moves into <ListPageShell>; per-row styling lives
 * in a co-located TariffTable.module.css.
 *
 * Columns: DEPOT (mono primary) · NAME (bold) · TYPE (Standard pill) ·
 * DEPOT COUNTRY (Assigned-to surrogate) · EFFECTIVE · EXPIRY (red if past) ·
 * STATUS pill · trailing "…" menu cell.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { FilterPopover, type FilterField } from "@/components/ui/FilterPopover";
import { TariffRowMenu } from "@/components/tariff";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";
import type { TariffStatus } from "@/lib/types/tariff/standard";

import styles from "../TariffTable.module.css";

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

  const countLabel =
    filteredCards.length === cards.length
      ? `${cards.length}`
      : `${filteredCards.length} of ${cards.length}`;

  return (
    <AppShell>
      <ListPageShell
        title="Standard Tariffs"
        count={undefined}
        subtitle="Baseline price list per depot. When a Liner job runs at a depot, the Liner card's row (if any) supersedes; otherwise the Standard row applies."
        secondaryActions={
          <>
            <span className="gecko-count-badge">{countLabel} depots</span>
            <ExportButton resource="Standard tariffs" variant="outline" iconSize={16} />
            <FilterPopover
              fields={filterFields}
              values={filterValues}
              onChange={setFilterValues}
              onApply={setFilterValues}
              onClear={() => setFilterValues({ status: "", country: "" })}
            />
          </>
        }
      >
        <div className={styles.tableWrap}>
          <table className={`gecko-table gecko-table-comfortable ${styles.table}`}>
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
                        className={`gecko-text-mono ${styles.idLink}`}
                      >
                        {card.depotCode}
                      </Link>
                    </td>
                    <td>
                      <div className={styles.name}>{depot?.name ?? "—"}</div>
                      <div className={styles.subId}>{card.id}</div>
                    </td>
                    <td>
                      <span className="gecko-pill gecko-pill-info">
                        <Icon name="layers" size={11} /> Standard
                      </span>
                    </td>
                    <td className={styles.secondary}>{depot?.country ?? "—"}</td>
                    <td className={`gecko-text-mono ${styles.secondary}`}>
                      {card.effectiveDate}
                    </td>
                    <td
                      className={`gecko-text-mono ${expired ? styles.expired : styles.secondary}`}
                    >
                      {card.expiryDate}
                    </td>
                    <td>
                      <StatusPill status={card.status} />
                    </td>
                    <td className={styles.actionCell}>
                      <TariffRowMenu lane="standard" cardId={card.id} routeParam={card.depotCode} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ListPageShell>
    </AppShell>
  );
}
