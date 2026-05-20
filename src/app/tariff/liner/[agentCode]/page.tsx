"use client";

/**
 * /tariff/liner/[agentCode] — Liner tariff detail (view) page.
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
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";

import styles from "./LinerTariff.module.css";

export default function LinerTariffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentCode = String(params?.agentCode ?? "");
  const card = linerTariffRepo.byAgent(agentCode);
  const liner = getCustomerByCode(agentCode);

  const [tab, setTab] = useState<TabKey>("overview");

  if (!card) {
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          title="Liner tariff not found"
          description={`No tariff configured for agent ${agentCode}.`}
          primary={{ label: "Back to Liner Tariffs", href: "/tariff/liner" }}
        />
      </AppShell>
    );
  }

  const onClone = () => {
    const cloned = linerTariffRepo.clone(card.id, agentCode);
    if (!cloned) return;
    linerTariffRepo.create(cloned);
    router.push(`/tariff/liner/${encodeURIComponent(agentCode)}/edit?cloneId=${encodeURIComponent(cloned.id)}`);
  };

  return (
    <AppShell>
      <DetailPageShell
        backHref="/tariff/liner"
        backLabel="Back to Liner Tariffs"
        id={card.id}
        pills={
          <>
            <StatusPill status={card.status} />
            <TypePill lane="liner" />
          </>
        }
        title={liner?.name ?? card.agentCode}
        subtitle={card.agentCode}
        viewOnly
        toolbar={
          <>
            <button
              type="button"
              onClick={onClone}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              <Icon name="copy" size={16} /> Duplicate
            </button>
            {card.status === "DRAFT" && (
              <button
                type="button"
                onClick={() => {
                  linerTariffRepo.approve(card.id, "CURRENT-USER");
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
                  linerTariffRepo.unapprove(card.id);
                  router.refresh();
                }}
                className="gecko-btn gecko-btn-outline gecko-btn-sm"
              >
                <Icon name="refreshCcw" size={16} /> Un Approve
              </button>
            )}
            <ExportButton resource={`Liner ${card.agentCode}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/liner/${encodeURIComponent(card.agentCode)}/edit`}
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
          <>
            <SectionCard icon="users" label="Parties & Validity">
              <div className={styles.pillRow}>
                <span className="gecko-pill gecko-pill-primary">
                  <Icon name="ship" size={11} /> Liner schedule
                </span>
                <StatusPill status={card.status} />
                <span className="gecko-phase-tag">Phase 7 approval flow</span>
              </div>

              <div className={styles.partyGridTriple}>
                <PartyBox label="Liner" value={liner?.name ?? card.agentCode} />
                <PartyBox
                  label="Forwarder"
                  value={<span className={styles.notAssigned}>not assigned</span>}
                />
                <PartyBox label="Shipper-Consignee" value={liner?.name ?? card.agentCode} />
              </div>

              <div className={styles.partyGridQuad}>
                <PartyBox label="Effective" value={card.effectiveDate} mono />
                <PartyBox label="Expiry" value={card.expiryDate} mono />
                <PartyBox label="Sales person" value={card.salesPerson || "—"} />
                <PartyBox label="Approver" value={card.approvedBy || "—"} />
              </div>
            </SectionCard>

            <SectionCard icon="clock" label="Storage Free Days">
              <div className={styles.freeDaysGrid}>
                <div>
                  <div className={styles.freeDaysLabel}>Full</div>
                  <table className={`gecko-table ${styles.freeDaysTable}`}>
                    <thead>
                      <tr>
                        <th className={styles.freeDaysHeadLeft}></th>
                        <th className={styles.freeDaysHeadRight}>Normal</th>
                        <th className={styles.freeDaysHeadRight}>Reefer</th>
                        <th className={styles.freeDaysHeadRight}>DG</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.freeDaysRowLabel}>Export</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.fullExport.normal}</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.fullExport.reefer}</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.fullExport.dg}</td>
                      </tr>
                      <tr>
                        <td className={styles.freeDaysRowLabel}>Import</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.fullImport.normal}</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.fullImport.reefer}</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.fullImport.dg}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div className={styles.freeDaysLabel}>Empty (import)</div>
                  <table className={`gecko-table ${styles.freeDaysTable}`}>
                    <thead>
                      <tr>
                        <th className={styles.freeDaysHeadRight}>Normal</th>
                        <th className={styles.freeDaysHeadRight}>Reefer</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className={styles.freeDaysCell}>{card.freeDays.emptyImport.normal}</td>
                        <td className={styles.freeDaysCell}>{card.freeDays.emptyImport.reefer}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {card.waiveStorageForEmptyDmContainers && (
                <div className={styles.freeDaysWaiveNote}>
                  Storage waived for empty DM containers
                </div>
              )}
            </SectionCard>
          </>
        )}

        {tab === "charges" && <ChargesTable rows={card.rows} />}

        {tab === "activity" && <TariffActivityList cardId={card.id} />}
      </DetailPageShell>
    </AppShell>
  );
}
