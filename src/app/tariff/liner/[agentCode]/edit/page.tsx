"use client";

/**
 * /tariff/liner/[agentCode]/edit — edit a liner tariff card.
 * Phase 7.9-A — migrated to native gecko form primitives + zero inline CSS.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Icon } from "@/components/ui/Icon";
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
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";
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
    <div className={`gecko-edit-field${mono ? " gecko-edit-field-mono" : ""}`}>
      <div className="gecko-edit-field-label">{label}</div>
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="gecko-field">
      <label className="gecko-field-label">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="gecko-input gecko-input-sm"
      />
    </div>
  );
}

export default function LinerTariffEditPage() {
  const params = useParams();
  const router = useRouter();
  const agentCode = String(params?.agentCode ?? "");
  const initial = linerTariffRepo.byAgent(agentCode);
  const liner = getCustomerByCode(agentCode);

  const [salesPerson, setSalesPerson] = useState(initial?.salesPerson ?? "");
  const [contactNo, setContactNo] = useState(initial?.contactNo ?? "");
  const [effectiveDate, setEffectiveDate] = useState(initial?.effectiveDate ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [approver, setApprover] = useState(initial?.approvedBy ?? "");
  const [waive, setWaive] = useState(initial?.waiveStorageForEmptyDmContainers ?? false);
  const [freeDays, setFreeDays] = useState(initial?.freeDays);
  const [rows, setRows] = useState<ChargeRow[]>(initial?.rows ?? []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ChargeRow | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  if (!initial || !freeDays) {
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
    let quotationNo = initial.quotationNo;
    if (!quotationNo) {
      quotationNo = linerTariffRepo.nextQuotationNo();
    }
    linerTariffRepo.update(initial.id, {
      quotationNo,
      salesPerson,
      contactNo: contactNo || undefined,
      effectiveDate,
      expiryDate,
      approvedBy: approver || undefined,
      freeDays,
      waiveStorageForEmptyDmContainers: waive,
      rows,
      modifiedBy: "CURRENT-USER",
      modifiedOn: today,
    });
    router.push(`/tariff/liner/${encodeURIComponent(agentCode)}`);
  };

  return (
    <AppShell>
      <DetailHeader
        backHref={`/tariff/liner/${encodeURIComponent(agentCode)}`}
        backLabel={`Back to ${liner?.name ?? agentCode}`}
        id={initial.id}
        status={initial.status}
        lane="liner"
        title={liner?.name ?? agentCode}
        acronym={agentCode}
        toolbar={
          <>
            <ExportButton resource={`Liner ${agentCode}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/liner/${encodeURIComponent(agentCode)}`}
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
        <>
          <SectionCard icon="users" label="Parties & Validity">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="gecko-pill gecko-pill-primary">
                <Icon name="ship" size={11} /> Liner schedule
              </span>
              <StatusPill status={initial.status} />
              <span className="gecko-phase-tag">Phase 7 approval flow</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <PartyBox label="Liner" value={liner?.name ?? agentCode} />
              <PartyBox
                label="Forwarder"
                value={<span className="gecko-text-disabled gecko-text-italic">not assigned</span>}
              />
              <PartyBox label="Shipper-Consignee" value={liner?.name ?? agentCode} />
            </div>

            <div className="grid grid-cols-4 gap-3 mb-3">
              <EditField label="Effective" mono>
                <DateField value={effectiveDate} onChange={setEffectiveDate} size="sm" />
              </EditField>
              <EditField label="Expiry" mono>
                <DateField value={expiryDate} onChange={setExpiryDate} size="sm" />
              </EditField>
              <EditField label="Sales person">
                <input
                  className="gecko-input gecko-input-sm"
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                />
              </EditField>
              <EditField label="Approver">
                <input
                  className="gecko-input gecko-input-sm"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder="—"
                />
              </EditField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <EditField label="Quotation no" mono>
                <input
                  className="gecko-input gecko-input-sm"
                  value={initial.quotationNo || "(assigned on save)"}
                  readOnly
                />
              </EditField>
              <EditField label="Contact no">
                <input
                  className="gecko-input gecko-input-sm"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                />
              </EditField>
            </div>
          </SectionCard>

          <SectionCard icon="box" label="Storage Free Days">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
              <div className="gecko-field-label">Full Export</div>
              <NumInput label="Normal" value={freeDays.fullExport.normal} onChange={(v) => setFreeDays({ ...freeDays, fullExport: { ...freeDays.fullExport, normal: v } })} />
              <NumInput label="Reefer" value={freeDays.fullExport.reefer} onChange={(v) => setFreeDays({ ...freeDays, fullExport: { ...freeDays.fullExport, reefer: v } })} />
              <NumInput label="DG" value={freeDays.fullExport.dg} onChange={(v) => setFreeDays({ ...freeDays, fullExport: { ...freeDays.fullExport, dg: v } })} />

              <div className="gecko-field-label">Full Import</div>
              <NumInput label="Normal" value={freeDays.fullImport.normal} onChange={(v) => setFreeDays({ ...freeDays, fullImport: { ...freeDays.fullImport, normal: v } })} />
              <NumInput label="Reefer" value={freeDays.fullImport.reefer} onChange={(v) => setFreeDays({ ...freeDays, fullImport: { ...freeDays.fullImport, reefer: v } })} />
              <NumInput label="DG" value={freeDays.fullImport.dg} onChange={(v) => setFreeDays({ ...freeDays, fullImport: { ...freeDays.fullImport, dg: v } })} />

              <div className="gecko-field-label">Empty Import</div>
              <NumInput label="Normal" value={freeDays.emptyImport.normal} onChange={(v) => setFreeDays({ ...freeDays, emptyImport: { ...freeDays.emptyImport, normal: v } })} />
              <NumInput label="Reefer" value={freeDays.emptyImport.reefer} onChange={(v) => setFreeDays({ ...freeDays, emptyImport: { ...freeDays.emptyImport, reefer: v } })} />
              <div />
            </div>
            <label className="flex items-center gap-2 mt-3">
              <input
                type="checkbox"
                checked={waive}
                onChange={(e) => setWaive(e.target.checked)}
              />
              <span className="gecko-field-label">Waive Storage For MTY DM Containers</span>
            </label>
          </SectionCard>
        </>
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
        parentCardDefaults={{
          defaultOrderType: initial.defaultOrderType,
          defaultMovementCode: initial.defaultMovementCode,
          defaultCargoCategory: initial.defaultCargoCategory,
          defaultPaymentTerm: initial.defaultPaymentTerm,
          defaultBilledTo: initial.defaultBilledTo,
          defaultCreditTermDays: initial.defaultCreditTermDays,
          defaultTruckCategory: initial.defaultTruckCategory,
          defaultDiscountType: initial.defaultDiscountType,
          defaultDiscountRate: initial.defaultDiscountRate,
          defaultRebate: initial.defaultRebate,
        }}
        onClose={() => setEditorOpen(false)}
        onSave={saveRow}
      />
    </AppShell>
  );
}
