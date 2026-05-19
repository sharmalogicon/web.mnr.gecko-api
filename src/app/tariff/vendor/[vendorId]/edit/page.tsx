"use client";

/**
 * /tariff/vendor/[vendorId]/edit — edit a vendor tariff card.
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
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ChargesTable,
  ChargeRowEditor,
  TariffCardFooter,
  TariffStatusBadge,
} from "@/components/tariff";
import { vendorTariffRepo } from "@/lib/repos";
import { findVendor } from "@/data/seed/_shared/vendors";
import type { ChargeRow } from "@/lib/types";

export default function VendorTariffEditPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = String(params?.vendorId ?? "");
  const initial = vendorTariffRepo.byVendor(vendorId);
  const vendor = findVendor(vendorId);

  const [procurementContact, setProcurementContact] = useState(initial?.procurementContact ?? "");
  const [effectiveDate, setEffectiveDate] = useState(initial?.effectiveDate ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [rows, setRows] = useState<ChargeRow[]>(initial?.rows ?? []);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ChargeRow | null>(null);

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
      quotationNo = vendorTariffRepo.nextQuotationNo();
    }
    vendorTariffRepo.update(initial.id, {
      quotationNo,
      procurementContact,
      effectiveDate,
      expiryDate,
      rows,
      modifiedBy: "CURRENT-USER",
      modifiedOn: today,
    });
    router.push(`/tariff/vendor/${encodeURIComponent(vendorId)}`);
  };

  return (
    <AppShell>
      <Link href={`/tariff/vendor/${encodeURIComponent(vendorId)}`}>
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to {vendor?.name ?? vendorId}
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle className="text-xl">
            Edit Vendor Tariff — {vendor?.name ?? vendorId}
          </CardTitle>
          <TariffStatusBadge status={initial.status} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label>VQ no</Label>
              <Input
                value={initial.quotationNo || "(assigned on save)"}
                readOnly
                style={{ background: "var(--gecko-bg-subtle)" }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="procurementContact">Procurement contact *</Label>
              <Input
                id="procurementContact"
                value={procurementContact}
                onChange={(e) => setProcurementContact(e.target.value)}
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
