"use client";

/**
 * /tariff/standard/[depot] — Standard tariff detail (view) page.
 * Phase 7.7-J — TOS detail-chrome parity.
 */

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { ExportButton } from "@/components/ui/ExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChargesTable,
  DetailHeader,
  StatCardsRow,
  ValidityProgress,
  TabsNav,
  SectionCard,
  PartyBox,
  ActivityEmpty,
  StatusPill,
  formatLongDate,
  daysRemaining,
  annualizedEstimate,
  type TabKey,
} from "@/components/tariff";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";

export default function StandardTariffDetailPage() {
  const params = useParams();
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
      <DetailHeader
        backHref="/tariff/standard"
        backLabel="Back to Standard Tariffs"
        id={card.id}
        status={card.status}
        lane="standard"
        title={depot?.name ?? card.depotCode}
        acronym={card.depotCode}
        viewOnly
        toolbar={
          <>
            <ExportButton resource={`Standard ${card.depotCode}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/standard/${encodeURIComponent(card.depotCode)}/edit`}
              className="gecko-btn gecko-btn-primary gecko-btn-sm"
            >
              <Icon name="edit" size={16} /> Edit Schedule
            </Link>
          </>
        }
      />

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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <span className="gecko-pill gecko-pill-info">
              <Icon name="layers" size={11} /> Standard schedule
            </span>
            <StatusPill status={card.status} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--gecko-primary-700)",
                padding: "2px 8px",
              }}
            >
              Phase 7 approval flow
            </span>
          </div>

          {/* Row 2: Depot only */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <PartyBox
              label="Depot"
              value={
                <>
                  {depot?.name ?? card.depotCode}{" "}
                  <span className="gecko-text-mono" style={{ color: "var(--gecko-text-secondary)", fontWeight: 400 }}>
                    · {card.depotCode}
                  </span>
                </>
              }
            />
          </div>

          {/* Row 3: Effective · Expiry · Created by · Approver */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <PartyBox label="Effective" value={card.effectiveDate} mono />
            <PartyBox label="Expiry" value={card.expiryDate} mono />
            <PartyBox label="Created by" value={card.createdBy || "—"} />
            <PartyBox label="Approver" value={card.approvedBy || "—"} />
          </div>
        </SectionCard>
      )}

      {tab === "charges" && <ChargesTable rows={card.rows} />}

      {tab === "activity" && <ActivityEmpty />}
    </AppShell>
  );
}
