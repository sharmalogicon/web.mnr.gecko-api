"use client";

/**
 * /tariff/standard/[depot]/edit — edit a depot's standard tariff card.
 * Phase 7.7-K — TOS detail-chrome parity with editable PARTIES & VALIDITY card
 * and editable Charges tab.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/ui/DateField";
import { ExportButton } from "@/components/ui/ExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChargesTable,
  ChargeRowEditor,
  DetailHeader,
  StatCardsRow,
  ValidityProgress,
  TabsNav,
  SectionCard,
  PartyBox,
  TariffActivityList,
  StatusPill,
  formatLongDate,
  daysRemaining,
  annualizedEstimate,
  type TabKey,
} from "@/components/tariff";
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";
import type { ChargeRow } from "@/lib/types/tariff/charge-row";

function EditField({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--gecko-bg-subtle)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 8,
        padding: "10px 12px",
        fontFamily: mono ? "var(--gecko-font-mono)" : undefined,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--gecko-text-secondary)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

export default function StandardTariffEditPage() {
  const params = useParams();
  const router = useRouter();
  const depotCode = String(params?.depot ?? "");
  const initial = standardTariffRepo.byDepot(depotCode);
  const depot = getDepotByCode(depotCode);

  const [effectiveDate, setEffectiveDate] = useState(initial?.effectiveDate ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [createdBy, setCreatedBy] = useState(initial?.createdBy ?? "");
  const [approver, setApprover] = useState(initial?.approvedBy ?? "");
  const [rows, setRows] = useState<ChargeRow[]>(initial?.rows ?? []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ChargeRow | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  if (!initial) {
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

  const openAdd = () => { setEditingRow(null); setEditorOpen(true); };
  const openEdit = (row: ChargeRow) => { setEditingRow(row); setEditorOpen(true); };
  const saveRow = (saved: ChargeRow) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const copy = [...prev]; copy[idx] = saved; return copy;
    });
  };
  const deleteRow = (row: ChargeRow) => setRows((prev) => prev.filter((r) => r.id !== row.id));
  const moveRow = (_row: ChargeRow, fromIndex: number, dir: "up" | "down") => {
    setRows((prev) => {
      const copy = [...prev];
      const swap = dir === "up" ? fromIndex - 1 : fromIndex + 1;
      [copy[fromIndex], copy[swap]] = [copy[swap], copy[fromIndex]];
      return copy;
    });
  };

  const onSave = () => {
    const today = new Date().toISOString().slice(0, 10);
    standardTariffRepo.update(initial.id, {
      effectiveDate,
      expiryDate,
      createdBy: createdBy || initial.createdBy,
      approvedBy: approver || undefined,
      rows,
      modifiedBy: "CURRENT-USER",
      modifiedOn: today,
    });
    router.push(`/tariff/standard/${encodeURIComponent(depotCode)}`);
  };

  return (
    <AppShell>
      <DetailHeader
        backHref={`/tariff/standard/${encodeURIComponent(depotCode)}`}
        backLabel={`Back to ${depotCode}`}
        id={initial.id}
        status={initial.status}
        lane="standard"
        title={depot?.name ?? depotCode}
        acronym={depotCode}
        toolbar={
          <>
            <ExportButton resource={`Standard ${depotCode}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/standard/${encodeURIComponent(depotCode)}`}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={onSave}
              className="gecko-btn gecko-btn-primary gecko-btn-sm"
            >
              <Icon name="save" size={16} /> Save
            </button>
          </>
        }
      />

      <StatCardsRow
        cards={[
          {
            icon: "calendar",
            iconColor: "var(--gecko-primary-600)",
            iconBg: "var(--gecko-primary-50)",
            value: formatLongDate(effectiveDate),
            caption: "Effective from",
          },
          {
            icon: "clock",
            iconColor: "var(--gecko-warning-600)",
            iconBg: "var(--gecko-warning-50)",
            value: String(daysRemaining(expiryDate)),
            caption: `${daysRemaining(expiryDate)} days remaining`,
          },
          {
            icon: "tag",
            iconColor: "var(--gecko-text-secondary)",
            iconBg: "var(--gecko-bg-subtle)",
            value: String(rows.length),
            caption: `Priced charges · ${rows.length} rate rows`,
          },
          {
            icon: "percent",
            iconColor: "var(--gecko-success-600)",
            iconBg: "var(--gecko-success-50)",
            value: annualizedEstimate(rows),
            caption: "Annualized estimate (rough)",
          },
        ]}
      />

      <ValidityProgress effectiveDate={effectiveDate} expiryDate={expiryDate} />

      <TabsNav active={tab} onChange={setTab} />

      {tab === "overview" && (
        <SectionCard icon="users" label="Parties & Validity">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <span className="gecko-pill gecko-pill-info">
              <Icon name="layers" size={11} /> Standard schedule
            </span>
            <StatusPill status={initial.status} />
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
                  {depot?.name ?? depotCode}{" "}
                  <span className="gecko-text-mono" style={{ color: "var(--gecko-text-secondary)", fontWeight: 400 }}>
                    · {depotCode}
                  </span>
                </>
              }
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
            }}
          >
            <EditField label="Effective" mono>
              <DateField value={effectiveDate} onChange={setEffectiveDate} size="sm" />
            </EditField>
            <EditField label="Expiry" mono>
              <DateField value={expiryDate} onChange={setExpiryDate} size="sm" />
            </EditField>
            <EditField label="Created by">
              <Input
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                style={{ height: 28, fontSize: 13 }}
              />
            </EditField>
            <EditField label="Approver">
              <Input
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="—"
                style={{ height: 28, fontSize: 13 }}
              />
            </EditField>
          </div>
        </SectionCard>
      )}

      {tab === "charges" && (
        <ChargesTable
          rows={rows}
          editable
          onRowClick={openEdit}
          onAddRow={openAdd}
          onDeleteRow={deleteRow}
          onMoveRow={moveRow}
        />
      )}

      {tab === "activity" && <TariffActivityList cardId={initial.id} />}

      <ChargeRowEditor
        open={editorOpen}
        initial={editingRow}
        onClose={() => setEditorOpen(false)}
        onSave={saveRow}
      />
    </AppShell>
  );
}
