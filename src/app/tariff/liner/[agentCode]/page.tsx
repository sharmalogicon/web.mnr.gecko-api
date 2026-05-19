"use client";

/**
 * /tariff/liner/[agentCode] — Liner tariff detail (view) page.
 * Phase 7.7-I — TOS detail-chrome parity.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";

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
      <DetailHeader
        backHref="/tariff/liner"
        backLabel="Back to Liner Tariffs"
        id={card.id}
        status={card.status}
        lane="liner"
        title={liner?.name ?? card.agentCode}
        acronym={card.agentCode}
        viewOnly
        toolbar={
          <>
            <ExportButton resource={`Liner ${card.agentCode}`} variant="outline" iconSize={16} />
            <button
              type="button"
              onClick={onClone}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              <Icon name="copy" size={16} /> Duplicate
            </button>
            <Link
              href={`/tariff/liner/${encodeURIComponent(card.agentCode)}/edit`}
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
          {/* Row 1: pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <span className="gecko-pill gecko-pill-primary">
              <Icon name="ship" size={11} /> Liner schedule
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

          {/* Row 2: Liner / Forwarder / Shipper-Consignee */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <PartyBox label="Liner" value={liner?.name ?? card.agentCode} />
            <PartyBox
              label="Forwarder"
              value={<span style={{ color: "var(--gecko-text-disabled)", fontStyle: "italic" }}>not assigned</span>}
            />
            <PartyBox label="Shipper-Consignee" value={liner?.name ?? card.agentCode} />
          </div>

          {/* Row 3: Effective · Expiry · Sales person · Approver */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <PartyBox label="Effective" value={card.effectiveDate} mono />
            <PartyBox label="Expiry" value={card.expiryDate} mono />
            <PartyBox label="Sales person" value={card.salesPerson || "—"} />
            <PartyBox label="Approver" value={card.approvedBy || "—"} />
          </div>
        </SectionCard>
      )}

      {tab === "charges" && <ChargesTable rows={card.rows} />}

      {tab === "activity" && <ActivityEmpty />}
    </AppShell>
  );
}
