"use client";

/**
 * /tariff/liner — list of liner tariff cards.
 * Phase 7.7-H — TOS data-table layout.
 * Phase 7.7-N — FilterPopover wired (status, tier).
 * Phase 7.13-C2 — chrome moves into <ListPageShell>; per-row styling lives
 * in shared TariffTable.module.css.
 *
 * Columns: AGENT CODE (mono primary) · CARRIER NAME (bold) · TYPE (Liner pill) ·
 * AGENT · EFFECTIVE · EXPIRY (red if past) · STATUS pill · trailing "…" cell.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { FilterPopover, type FilterField } from "@/components/ui/FilterPopover";
import { TariffRowMenu } from "@/components/tariff";
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";
import type { TariffStatus } from "@/lib/types/tariff/standard";

import styles from "../TariffTable.module.css";

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

  const countLabel =
    filteredCards.length === cards.length
      ? `${cards.length}`
      : `${filteredCards.length} of ${cards.length}`;

  return (
    <AppShell>
      <ListPageShell
        title="Liner Tariffs"
        subtitle="Per-carrier override rates relative to the depot Standard tariff. Liner rows take precedence at quote time; missing rows fall back to the depot Standard."
        secondaryActions={
          <>
            <span className="gecko-count-badge">{countLabel} agreements</span>
            <ExportButton resource="Liner tariffs" variant="outline" iconSize={16} />
            <FilterPopover
              fields={filterFields}
              values={filterValues}
              onChange={setFilterValues}
              onApply={setFilterValues}
              onClear={() => setFilterValues({ status: "", tier: "" })}
            />
          </>
        }
        primaryAction={
          <Link href="/tariff/liner/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            <Icon name="plus" size={16} /> New Liner Agreement
          </Link>
        }
      >
        <div className={styles.tableWrap}>
          <table className={`gecko-table gecko-table-comfortable ${styles.table}`}>
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
                        className={`gecko-text-mono ${styles.idLink}`}
                      >
                        {card.agentCode}
                      </Link>
                    </td>
                    <td>
                      <div className={styles.name}>{liner?.name ?? card.agentCode}</div>
                      <div className={styles.subId}>{card.quotationNo || card.id}</div>
                    </td>
                    <td>
                      <span className="gecko-pill gecko-pill-primary">
                        <Icon name="ship" size={11} /> Liner
                      </span>
                    </td>
                    <td className={styles.secondary}>{liner?.name ?? card.agentCode}</td>
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
                      <TariffRowMenu lane="liner" cardId={card.id} routeParam={card.agentCode} />
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
