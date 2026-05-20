"use client";

/**
 * /tariff/standard/[depot] — Standard tariff detail (view) page.
 * Phase 7.13-A2 — migrated to <DetailPageShell> from page-shells.
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
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";

import styles from "./StandardTariff.module.css";

export default function StandardTariffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const depotCode = String(params?.depot ?? "");
  const card = standardTariffRepo.byDepot(depotCode);
  const depot = getDepotByCode(depotCode);

  const [tab, setTab] = useState<TabKey>("overview");

  if (!card) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="No standard tariff for this depot"
          description={`Depot ${depotCode} has no Standard tariff configured.`}
          primary={{ label: "Back to Standard Tariffs", href: "/tariff/standard" }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <DetailPageShell
        backHref="/tariff/standard"
        backLabel="Back to Standard Tariffs"
        id={card.id}
        pills={
          <>
            <StatusPill status={card.status} />
            <TypePill lane="standard" />
          </>
        }
        title={depot?.name ?? card.depotCode}
        subtitle={card.depotCode}
        viewOnly
        toolbar={
          <>
            {card.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => {
                  standardTariffRepo.approve(card.id, "CURRENT-USER");
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
                  standardTariffRepo.unapprove(card.id);
                  router.refresh();
                }}
                className="gecko-btn gecko-btn-outline gecko-btn-sm"
              >
                <Icon name="refreshCcw" size={16} /> Un Approve
              </button>
            )}
            <ExportButton resource={`Standard ${card.depotCode}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/standard/${encodeURIComponent(card.depotCode)}/edit`}
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
              <span className="gecko-pill gecko-pill-info">
                <Icon name="layers" size={11} /> Standard schedule
              </span>
              <StatusPill status={card.status} />
              <span className="gecko-phase-tag">Phase 7 approval flow</span>
            </div>

            <div className={styles.partyGridSingle}>
              <PartyBox
                label="Depot"
                value={
                  <>
                    {depot?.name ?? card.depotCode}{" "}
                    <span className={styles.depotName}>· {card.depotCode}</span>
                  </>
                }
              />
            </div>

            <div className={styles.partyGridQuad}>
              <PartyBox label="Effective" value={card.effectiveDate} mono />
              <PartyBox label="Expiry" value={card.expiryDate} mono />
              <PartyBox label="Created by" value={card.createdBy || "—"} />
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
