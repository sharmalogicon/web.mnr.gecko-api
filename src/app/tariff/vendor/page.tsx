"use client";

/**
 * /tariff/vendor — list of vendor tariff cards (cost side).
 * Phase 7.7-H — TOS data-table layout.
 * Phase 7.7-N — FilterPopover wired (status, category, country).
 * Phase 7.13-C2 — chrome moves into <ListPageShell>; per-row styling lives
 * in shared TariffTable.module.css.
 *
 * Columns: VENDOR ID (mono primary) · VENDOR NAME (bold) · TYPE (Vendor pill) ·
 * CATEGORY · EFFECTIVE · EXPIRY (red if past) · STATUS pill · trailing "…" cell.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { FilterPopover, type FilterField } from "@/components/ui/FilterPopover";
import { TariffRowMenu } from "@/components/tariff";
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";
import type { TariffStatus } from "@/lib/types/tariff/standard";

import styles from "../TariffTable.module.css";

const TODAY = new Date().toISOString().slice(0, 10);

function StatusPill({ status }: { status: TariffStatus }) {
  if (status === "APPROVED") return <span className="gecko-pill gecko-pill-success">Active</span>;
  if (status === "EXPIRED")  return <span className="gecko-pill gecko-pill-danger">Expired</span>;
  return <span className="gecko-pill gecko-pill-neutral">Draft</span>;
}

export default function VendorTariffListPage() {
  const cards = vendorTariffRepo.list();
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: "",
    category: "",
    country: "",
  });

  const { categories, countries } = useMemo(() => {
    const cats = new Set<string>();
    const cts = new Set<string>();
    cards.forEach((c) => {
      const v = findVendor(c.vendorId);
      if (v?.category) cats.add(v.category);
      if (v?.country) cts.add(v.country);
    });
    return {
      categories: Array.from(cats).sort(),
      countries: Array.from(cts).sort(),
    };
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
      key: "category",
      label: "Category",
      options: [
        { label: "All", value: "" },
        ...categories.map((c) => ({ label: c.replace(/_/g, " "), value: c })),
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
      if (filterValues.category) {
        const v = findVendor(c.vendorId);
        if (v?.category !== filterValues.category) return false;
      }
      if (filterValues.country) {
        const v = findVendor(c.vendorId);
        if (v?.country !== filterValues.country) return false;
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
        title="Vendor Tariffs"
        subtitle="What each third-party vendor charges us when we outsource a job. Used by the simulator to compute margin (Revenue − Cost)."
        secondaryActions={
          <>
            <span className="gecko-count-badge">{countLabel} vendors</span>
            <ExportButton resource="Vendor tariffs" variant="outline" iconSize={16} />
            <FilterPopover
              fields={filterFields}
              values={filterValues}
              onChange={setFilterValues}
              onApply={setFilterValues}
              onClear={() => setFilterValues({ status: "", category: "", country: "" })}
            />
          </>
        }
        primaryAction={
          <Link href="/tariff/vendor/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            <Icon name="plus" size={16} /> Onboard Vendor
          </Link>
        }
      >
        <div className={styles.tableWrap}>
          <table className={`gecko-table gecko-table-comfortable ${styles.table}`}>
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
              {filteredCards.map((card) => {
                const vendor = findVendor(card.vendorId);
                const expired = card.expiryDate && card.expiryDate < TODAY;
                return (
                  <tr key={card.id}>
                    <td>
                      <Link
                        href={`/tariff/vendor/${encodeURIComponent(card.vendorId)}`}
                        className={`gecko-text-mono ${styles.idLink}`}
                      >
                        {card.vendorId}
                      </Link>
                    </td>
                    <td>
                      <div className={styles.name}>{vendor?.name ?? card.vendorId}</div>
                      <div className={styles.subId}>{card.quotationNo || card.id}</div>
                    </td>
                    <td>
                      <span className="gecko-pill gecko-pill-warning">
                        <Icon name="tool" size={11} /> Vendor
                      </span>
                    </td>
                    <td className={styles.secondary}>
                      {vendor?.category?.replace(/_/g, " ") ?? "—"}
                    </td>
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
                      <TariffRowMenu lane="vendor" cardId={card.id} routeParam={card.vendorId} />
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
