"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { equipmentRepo } from "@/lib/repos";
import type { EquipmentRecord } from "@/lib/types";

const ROUTE = "/equipment";

interface Equipment {
  id: string;
  number: string;
  type: "TANK" | "DRY" | "REEF" | "GENS" | "CHAS";
  typeLabel: string;
  owner: string;
  status: "available" | "in_service" | "repair" | "cleaning" | "storage";
  location: string;
  lastSurvey: string;
}

// Map seed EquipmentRecord (BIC-valid, domain-canonical) → UI shape.
// Category mapping per UI-SPEC §9.1: seed REEFER→REEF, others retain first 4 chars.
const SEED_CATEGORY_TO_UI: Record<EquipmentRecord["category"], Equipment["type"]> = {
  DRY: "DRY",
  TANK: "TANK",
  REEFER: "REEF",
  BULK: "DRY",
  FLAT: "CHAS",
  "OPEN-TOP": "DRY",
};

function toUiEquipment(rec: EquipmentRecord): Equipment {
  const status: Equipment["status"] =
    rec.status === "off_hire" || rec.status === "in_service"
      ? "available"
      : (rec.status as Equipment["status"]);
  return {
    id: rec.id,
    number: rec.id,
    type: SEED_CATEGORY_TO_UI[rec.category],
    typeLabel: rec.isoSizeType,
    owner: rec.ownerName,
    status,
    location: rec.depotCode,
    lastSurvey: rec.lastSurveyDate,
  };
}

const equipmentRows: Equipment[] = equipmentRepo.list().map(toUiEquipment);

const typeBadge: Record<string, string> = {
  TANK: "gecko-badge-primary",
  DRY: "gecko-badge-gray",
  REEF: "gecko-badge-info",
  GENS: "gecko-badge-accent",
  CHAS: "gecko-badge-success",
};

const columns: Column<Equipment>[] = [
  { key: "number", label: "Equipment #", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "typeLabel", label: "Type", sortable: true, render: (val, row) => <span className={`gecko-badge ${typeBadge[row.type]}`}>{String(val)}</span> },
  { key: "owner", label: "Owner", sortable: true },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Equipment["status"]} /> },
  { key: "location", label: "Location", sortable: true },
  { key: "lastSurvey", label: "Last Survey", sortable: true },
];

function EquipmentPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : equipmentRows;

  const stats = {
    total: records.length,
    tanks: records.filter((e) => e.type === "TANK").length,
    dry: records.filter((e) => e.type === "DRY").length,
    reefers: records.filter((e) => e.type === "REEF").length,
  };

  const filteredEquipment = records.filter((eq) => {
    const matchesSearch =
      !searchQuery ||
      eq.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.owner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || eq.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const actions: RowAction<Equipment>[] = [
    { label: "View Details", icon: <Icon name="eye" size={16} />, onClick: (row) => router.push(`/equipment/${row.id}`) },
    { label: "Edit", icon: <Icon name="edit" size={16} />, onClick: () => {} },
    { label: "View History", icon: <Icon name="fileText" size={16} />, onClick: () => {} },
    { label: "Delete", icon: <Icon name="trash" size={16} />, onClick: () => {}, variant: "destructive", separator: true },
  ];

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={6} rows={8} /></AppShell>;
  }
  if (forceError) {
    const errCopy = getErrorCopy(ROUTE);
    return (
      <AppShell>
        <ErrorState
          title={errCopy.title}
          description={errCopy.description}
          onRetry={() => window.location.reload()}
        />
      </AppShell>
    );
  }
  const hasActiveFilters = !!searchQuery || typeFilter !== "all";
  const showFilterEmpty = forceFilterEmpty || (filteredEquipment.length === 0 && hasActiveFilters);
  const showEmpty       = forceEmpty       || (records.length === 0 && !hasActiveFilters);
  if (showFilterEmpty || showEmpty) {
    const variant: EmptyStateVariant = showFilterEmpty ? "filter-empty" : "empty";
    const copy = getEmptyCopy(ROUTE, variant) ?? getEmptyCopy(ROUTE, "empty");
    if (copy) {
      return (
        <AppShell>
          <EmptyState
            variant={variant}
            icon={copy.icon}
            title={copy.title}
            description={copy.description}
            primary={copy.primary}
            secondary={copy.secondary}
          />
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      <ListPageShell
        title="Equipment"
        count={filteredEquipment.length}
        countSuffix="units"
        subtitle="BIC-coded containers, tanks, reefers, gensets and chassis."
        primaryAction={
          <Link
            href="/equipment/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            Add Equipment
          </Link>
        }
      >
      <StatsGrid>
        <StatsCard label="Total Equipment" value={stats.total} icon={Package} color="default" />
        <StatsCard label="ISO Tanks" value={stats.tanks} color="blue" onClick={() => setTypeFilter("TANK")} active={typeFilter === "TANK"} />
        <StatsCard label="Dry Containers" value={stats.dry} color="default" onClick={() => setTypeFilter("DRY")} active={typeFilter === "DRY"} />
        <StatsCard label="Reefers" value={stats.reefers} color="amber" onClick={() => setTypeFilter("REEF")} active={typeFilter === "REEF"} />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search equipment..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="TANK">ISO Tanks</SelectItem>
              <SelectItem value="DRY">Dry Containers</SelectItem>
              <SelectItem value="REEF">Reefers</SelectItem>
              <SelectItem value="GENS">Gensets</SelectItem>
              <SelectItem value="CHAS">Chassis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredEquipment}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/equipment/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredEquipment.length,
            onPageChange: () => {},
          }}
        />
      </div>
      </ListPageShell>
    </AppShell>
  );
}

export default function EquipmentPage() {
  return (
    <Suspense fallback={null}>
      <EquipmentPageInner />
    </Suspense>
  );
}
