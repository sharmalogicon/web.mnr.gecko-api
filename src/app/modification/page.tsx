"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings2, Wrench, FileCheck } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { modificationRepo } from "@/lib/repos";
import type { ModificationJob } from "@/lib/types";

const ROUTE = "/modification";

interface Modification {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  modificationType: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "rejected";
  estimatedCost: number;
  requestDate: string;
}

const SEED_STATUS_TO_UI: Record<ModificationJob["status"], Modification["status"]> = {
  proposed: "pending",
  class_review: "pending",
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
};

const TYPE_LABEL: Record<ModificationJob["type"], string> = {
  tank_coating_upgrade: "Tank Coating Upgrade",
  reefer_plug_retrofit: "Reefer Plug Retrofit",
  door_seal_upgrade: "Door Seal Upgrade",
  floor_replacement: "Floor Replacement",
  cargo_securing_retrofit: "Cargo Securing Retrofit",
};

function toUiModification(rec: ModificationJob): Modification {
  return {
    id: rec.reference,
    reference: rec.reference,
    equipment: rec.equipmentId,
    customer: rec.customerCode.replace(/^C-/, ""),
    modificationType: TYPE_LABEL[rec.type],
    status: SEED_STATUS_TO_UI[rec.status],
    estimatedCost: rec.costThb,
    requestDate: rec.openedDate,
  };
}

const modificationRows: Modification[] = modificationRepo.list().map(toUiModification);

const columns: Column<Modification>[] = [
  { key: "reference", label: "Reference", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono text-xs">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "modificationType", label: "Type", sortable: true },
  { key: "estimatedCost", label: "Est. Cost", sortable: true, align: "right", render: (val) => <span className="font-medium">฿{Number(val).toLocaleString()}</span> },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Modification["status"]} /> },
  { key: "requestDate", label: "Requested", sortable: true },
];

export default function ModificationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : modificationRows;

  const stats = {
    pending: records.filter((m) => m.status === "pending").length,
    inProgress: records.filter((m) => m.status === "in_progress" || m.status === "approved").length,
    completed: records.filter((m) => m.status === "completed").length,
    totalValue: records.filter((m) => m.status !== "rejected").reduce((sum, m) => sum + m.estimatedCost, 0),
  };

  const filteredModifications = records.filter((mod) => {
    const matchesSearch =
      !searchQuery ||
      mod.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || mod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<Modification>[] = [
    { label: "View Details", icon: <Icon name="eye" size={16} />, onClick: (row) => router.push(`/modification/${row.id}`) },
    { label: "Edit", icon: <Icon name="edit" size={16} />, onClick: () => {} },
    { label: "Approve", icon: <FileCheck className="h-4 w-4" />, onClick: () => {}, separator: true },
  ];

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={7} rows={8} /></AppShell>;
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
  const hasActiveFilters = !!searchQuery || statusFilter !== "all";
  const showFilterEmpty = forceFilterEmpty || (filteredModifications.length === 0 && hasActiveFilters);
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
        title="Modifications"
        count={filteredModifications.length}
        countSuffix="requests"
        subtitle="Coating upgrades, retrofits and class-reviewable conversions."
        primaryAction={
          <Link
            href="/modification/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            New Request
          </Link>
        }
      >
      <StatsGrid>
        <StatsCard label="Pending Approval" value={stats.pending} icon={Settings2} color="amber" />
        <StatsCard label="In Progress" value={stats.inProgress} icon={Wrench} color="blue" />
        <StatsCard label="Completed" value={stats.completed} icon={FileCheck} color="green" />
        <StatsCard label="Total Value" value={`฿${stats.totalValue.toLocaleString()}`} color="default" />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search modifications..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredModifications}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/modification/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredModifications.length,
            onPageChange: () => {},
          }}
        />
      </div>
      </ListPageShell>
    </AppShell>
  );
}
