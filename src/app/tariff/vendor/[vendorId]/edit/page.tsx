"use client";

/**
 * /tariff/vendor/[vendorId]/edit — edit a vendor tariff card.
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
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";
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

export default function VendorTariffEditPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = String(params?.vendorId ?? "");
  const initial = vendorTariffRepo.byVendor(vendorId);
  const vendor = findVendor(vendorId);

  const [procurementContact, setProcurementContact] = useState(initial?.procurementContact ?? "");
  const [effectiveDate, setEffectiveDate] = useState(initial?.effectiveDate ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
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
          title="Vendor tariff not found"
          description={`No tariff configured for vendor ${vendorId}.`}
          primary={{ label: "Back to Vendor Tariffs", href: "/tariff/vendor" }}
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
      quotationNo = vendorTariffRepo.nextQuotationNo();
    }
    vendorTariffRepo.update(initial.id, {
      quotationNo,
      procurementContact,
      effectiveDate,
      expiryDate,
      approvedBy: approver || undefined,
      rows,
      modifiedBy: "CURRENT-USER",
      modifiedOn: today,
    });
    router.push(`/tariff/vendor/${encodeURIComponent(vendorId)}`);
  };

  return (
    <AppShell>
      <DetailHeader
        backHref={`/tariff/vendor/${encodeURIComponent(vendorId)}`}
        backLabel={`Back to ${vendor?.name ?? vendorId}`}
        id={initial.id}
        status={initial.status}
        lane="vendor"
        title={vendor?.name ?? vendorId}
        acronym={vendor?.category?.replace(/_/g, " ")}
        toolbar={
          <>
            <ExportButton resource={`Vendor ${vendorId}`} variant="outline" iconSize={16} />
            <Link
              href={`/tariff/vendor/${encodeURIComponent(vendorId)}`}
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
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="gecko-pill gecko-pill-warning">
              <Icon name="tool" size={11} /> Vendor schedule
            </span>
            <StatusPill status={initial.status} />
            <span className="gecko-phase-tag">Phase 7 approval flow</span>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-3">
            <PartyBox
              label="Vendor"
              value={
                <>
                  {vendor?.name ?? vendorId}{" "}
                  <span className="gecko-text-mono gecko-text-secondary">
                    · {vendorId}
                  </span>
                </>
              }
            />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <EditField label="Effective" mono>
              <DateField value={effectiveDate} onChange={setEffectiveDate} size="sm" />
            </EditField>
            <EditField label="Expiry" mono>
              <DateField value={expiryDate} onChange={setExpiryDate} size="sm" />
            </EditField>
            <EditField label="Procurement contact">
              <input
                className="gecko-input gecko-input-sm"
                value={procurementContact}
                onChange={(e) => setProcurementContact(e.target.value)}
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

          <div className="grid grid-cols-1 gap-3">
            <EditField label="VQ no" mono>
              <input
                className="gecko-input gecko-input-sm"
                value={initial.quotationNo || "(assigned on save)"}
                readOnly
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
        parentCardDefaults={{
          defaultOrderType: initial.defaultOrderType,
          defaultMovementCode: initial.defaultMovementCode,
          defaultCargoCategory: initial.defaultCargoCategory,
          defaultPaymentTerm: initial.defaultPaymentTerm,
          defaultBilledTo: initial.defaultBilledTo,
          defaultCreditTermDays: initial.defaultCreditTermDays,
          defaultTruckCategory: initial.defaultTruckCategory,
        }}
        onClose={() => setEditorOpen(false)}
        onSave={saveRow}
      />
    </AppShell>
  );
}
