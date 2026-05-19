"use client";

/**
 * /tariff/standard/[depot]/edit — edit a depot's standard tariff card.
 * Phase 7 D-01 + D-09.
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
import { standardTariffRepo } from "@/lib/repos";
import { getDepotByCode } from "@/data/seed/_shared/depots";
import type { ChargeRow } from "@/lib/types";

export default function StandardTariffEditPage() {
  const params = useParams();
  const router = useRouter();
  const depotCode = String(params?.depot ?? "");
  const initial = standardTariffRepo.byDepot(depotCode);
  const depot = getDepotByCode(depotCode);

  const [rows, setRows] = useState<ChargeRow[]>(initial?.rows ?? []);
  const [effectiveDate, setEffectiveDate] = useState(initial?.effectiveDate ?? "");
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate ?? "");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ChargeRow | null>(null);

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
    standardTariffRepo.update(initial.id, {
      effectiveDate,
      expiryDate,
      rows,
      modifiedBy: "CURRENT-USER",
      modifiedOn: today,
    });
    router.push(`/tariff/standard/${encodeURIComponent(depotCode)}`);
  };

  return (
    <AppShell>
      <Link href={`/tariff/standard/${encodeURIComponent(depotCode)}`}>
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to {depotCode}
        </Button>
      </Link>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">
              Edit Standard Tariff —{" "}
              <span className="font-mono">{depotCode}</span>
              <span className="ml-3 text-base text-muted-foreground">{depot?.name}</span>
            </CardTitle>
          </div>
          <TariffStatusBadge status={initial.status} />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <div className="space-y-1">
              <Label>Card ID</Label>
              <Input value={initial.id} readOnly style={{ background: "var(--gecko-bg-subtle)" }} />
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
