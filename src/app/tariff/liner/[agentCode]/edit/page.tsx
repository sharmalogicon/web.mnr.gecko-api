"use client";

/**
 * /tariff/liner/[agentCode]/edit — edit a liner tariff card.
 * Phase 7 D-02 + D-09.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChargesTable,
  ChargeRowEditor,
  TariffCardFooter,
  TariffStatusBadge,
} from "@/components/tariff";
import { linerTariffRepo } from "@/lib/repos";
import { getCustomerByCode } from "@/data/seed/_shared/customers";
import type { ChargeRow } from "@/lib/types";

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
  const [waive, setWaive] = useState(initial?.waiveStorageForEmptyDmContainers ?? false);
  const [freeDays, setFreeDays] = useState(initial?.freeDays);
  const [rows, setRows] = useState<ChargeRow[]>(initial?.rows ?? []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ChargeRow | null>(null);

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

  const openAdd = () => {
    setEditingRow(null);
    setEditorOpen(true);
  };
  const openEdit = (row: ChargeRow) => {
    setEditingRow(row);
    setEditorOpen(true);
  };
  const saveRow = (saved: ChargeRow) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const copy = [...prev];
      copy[idx] = saved;
      return copy;
    });
  };
  const deleteRow = (row: ChargeRow) => setRows((prev) => prev.filter((r) => r.id !== row.id));
  const moveRow = (row: ChargeRow, fromIndex: number, dir: "up" | "down") => {
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
      // Clone or new: assign on first save (Phase 7 D-07).
      quotationNo = linerTariffRepo.nextQuotationNo();
    }
    linerTariffRepo.update(initial.id, {
      quotationNo,
      salesPerson,
      contactNo: contactNo || undefined,
      effectiveDate,
      expiryDate,
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
      <Link href={`/tariff/liner/${encodeURIComponent(agentCode)}`}>
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to {liner?.name ?? agentCode}
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-xl">
            Edit Liner Tariff — {liner?.name ?? agentCode}
          </CardTitle>
          <TariffStatusBadge status={initial.status} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="space-y-1">
              <Label>Quotation No</Label>
              <Input
                value={initial.quotationNo || "(assigned on save)"}
                readOnly
                style={{ background: "var(--gecko-bg-subtle)" }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="salesPerson">Sales person *</Label>
              <Input
                id="salesPerson"
                value={salesPerson}
                onChange={(e) => setSalesPerson(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactNo">Contact no</Label>
              <Input
                id="contactNo"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="effectiveDate">Effective</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiryDate">Expiry</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">Storage Free Days</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
              <div className="font-medium text-muted-foreground">Full Export</div>
              <NumInput label="Normal" value={freeDays.fullExport.normal} onChange={(v) => setFreeDays({ ...freeDays, fullExport: { ...freeDays.fullExport, normal: v } })} />
              <NumInput label="Reefer" value={freeDays.fullExport.reefer} onChange={(v) => setFreeDays({ ...freeDays, fullExport: { ...freeDays.fullExport, reefer: v } })} />
              <NumInput label="DG" value={freeDays.fullExport.dg} onChange={(v) => setFreeDays({ ...freeDays, fullExport: { ...freeDays.fullExport, dg: v } })} />

              <div className="font-medium text-muted-foreground">Full Import</div>
              <NumInput label="Normal" value={freeDays.fullImport.normal} onChange={(v) => setFreeDays({ ...freeDays, fullImport: { ...freeDays.fullImport, normal: v } })} />
              <NumInput label="Reefer" value={freeDays.fullImport.reefer} onChange={(v) => setFreeDays({ ...freeDays, fullImport: { ...freeDays.fullImport, reefer: v } })} />
              <NumInput label="DG" value={freeDays.fullImport.dg} onChange={(v) => setFreeDays({ ...freeDays, fullImport: { ...freeDays.fullImport, dg: v } })} />

              <div className="font-medium text-muted-foreground">Empty Import</div>
              <NumInput label="Normal" value={freeDays.emptyImport.normal} onChange={(v) => setFreeDays({ ...freeDays, emptyImport: { ...freeDays.emptyImport, normal: v } })} />
              <NumInput label="Reefer" value={freeDays.emptyImport.reefer} onChange={(v) => setFreeDays({ ...freeDays, emptyImport: { ...freeDays.emptyImport, reefer: v } })} />
              <div />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Checkbox
                id="waive"
                checked={waive}
                onCheckedChange={(checked) => setWaive(Boolean(checked))}
              />
              <Label htmlFor="waive" className="font-normal">
                Waive Storage For MTY DM Containers
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChargesTable
        rows={rows}
        editable
        onRowClick={openEdit}
        onAddRow={openAdd}
        onDeleteRow={deleteRow}
        onMoveRow={moveRow}
      />

      <ChargeRowEditor
        open={editorOpen}
        initial={editingRow}
        onClose={() => setEditorOpen(false)}
        onSave={saveRow}
      />

      <TariffCardFooter
        status={initial.status}
        onSave={onSave}
        onClear={() => setRows([])}
        onClose={() => router.back()}
        audit={{
          createdBy: initial.createdBy,
          createdOn: initial.createdOn,
          modifiedBy: initial.modifiedBy,
          modifiedOn: initial.modifiedOn,
          approvedBy: initial.approvedBy,
          approvedOn: initial.approvedOn,
        }}
      />
    </AppShell>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
        className="h-8 text-sm"
      />
    </div>
  );
}
