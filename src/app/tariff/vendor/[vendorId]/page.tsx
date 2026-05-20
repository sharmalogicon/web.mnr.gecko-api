"use client";

/**
 * /tariff/vendor/[vendorId] — Vendor tariff detail (view) page.
 * Phase 7.13-A3 — migrated to <DetailPageShell> from page-shells.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DetailPageShell } from "@/components/page-shells";
import {
  ChargesTable,
  StatCardsRow,
  ValidityProgress,
  TabsNav,
  SectionCard,
  PartyBox,
  TariffActivityList,
  StatusPill,
  TypePill,
  formatLongDate,
  daysRemaining,
  annualizedEstimate,
  type TabKey,
} from "@/components/tariff";
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";

import styles from "./VendorTariff.module.css";

export default function VendorTariffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = String(params?.vendorId ?? "");
  const card = vendorTariffRepo.byVendor(vendorId);
  const vendor = findVendor(vendorId);

  const [tab, setTab] = useState<TabKey>("overview");

  if (!card) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="Vendor tariff not found"
          description={`No tariff configured for vendor ${vendorId}.`}
          primary={{ label: "Back to Vendor Tariffs", href: "/tariff/vendor" }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DetailPageShell
        backHref="/tariff/vendor"
        backLabel="Back to Vendor Tariffs"
        id={card.id}
        pills={
          <>
            <StatusPill status={card.status} />
            <TypePill lane="vendor" />
          </>
        }
        title={vendor?.name ?? card.vendorId}
        subtitle={vendor?.category?.replace(/_/g, " ") ?? card.vendorId}
        viewOnly
        toolbar={
          <>
            {card.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => {
                  vendorTariffRepo.approve(card.id, "CURRENT-USER");
                  router.refresh();
                }}
                className="gecko-btn gecko-btn-success gecko-btn-sm"
              >
                <Icon name="check" size={16} /> Approve
              </button>
            )}
            {card.status === "APPROVED" && (
              <button
                type="button"
                onClick={() => {
                  vendorTariffRepo.unapprove(card.id);
                  router.refresh();
                }}
                className="gecko-btn gecko-btn-outline gecko-btn-sm"
              >
                <Icon name="refreshCcw" size={16} /> Un Approve
              </button>
            )}
            <ExportButton resource={`Vendor ${card.vendorId}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/vendor/${encodeURIComponent(card.vendorId)}/edit`}
              className="gecko-btn gecko-btn-primary gecko-btn-sm"
            >
              <Icon name="edit" size={16} /> Edit Schedule
            </Link>
          </>
        }
      >
        <StatCardsRow
          cards={[
            {
              icon: "calendar",
              iconColor: "var(--gecko-primary-600)",
              iconBg: "var(--gecko-primary-50)",
              value: formatLongDate(card.effectiveDate),
              caption: "Effective from",
            },
            {
              icon: "clock",
              iconColor: "var(--gecko-warning-600)",
              iconBg: "var(--gecko-warning-50)",
              value: String(daysRemaining(card.expiryDate)),
              caption: `${daysRemaining(card.expiryDate)} days remaining`,
            },
            {
              icon: "tag",
              iconColor: "var(--gecko-text-secondary)",
              iconBg: "var(--gecko-bg-subtle)",
              value: String(card.rows.length),
              caption: `Priced charges · ${card.rows.length} rate rows`,
            },
            {
              icon: "percent",
              iconColor: "var(--gecko-success-600)",
              iconBg: "var(--gecko-success-50)",
              value: annualizedEstimate(card.rows),
              caption: "Annualized estimate (rough)",
            },
          ]}
        />

        <ValidityProgress effectiveDate={card.effectiveDate} expiryDate={card.expiryDate} />

        <TabsNav active={tab} onChange={setTab} />

        {tab === "overview" && (
          <SectionCard icon="users" label="Parties & Validity">
            <div className={styles.pillRow}>
              <span className="gecko-pill gecko-pill-warning">
                <Icon name="tool" size={11} /> Vendor schedule
              </span>
              <StatusPill status={card.status} />
              <span className="gecko-phase-tag">Phase 7 approval flow</span>
            </div>

            <div className={styles.partyGridSingle}>
              <PartyBox
                label="Vendor"
                value={
                  <>
                    {vendor?.name ?? card.vendorId}{" "}
                    <span className={styles.vendorId}>· {card.vendorId}</span>
                  </>
                }
              />
            </div>

            <div className={styles.partyGridQuad}>
              <PartyBox label="Effective" value={card.effectiveDate} mono />
              <PartyBox label="Expiry" value={card.expiryDate} mono />
              <PartyBox label="Procurement contact" value={card.procurementContact || "—"} />
              <PartyBox label="Approver" value={card.approvedBy || "—"} />
            </div>
          </SectionCard>
        )}

        {tab === "charges" && <ChargesTable rows={card.rows} />}

        {tab === "activity" && <TariffActivityList cardId={card.id} />}
      </DetailPageShell>
    </AppShell>
  );
}
