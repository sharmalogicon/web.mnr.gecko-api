"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Phone, Clock, CheckCircle } from "lucide-react";
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
import { emergencyRepo } from "@/lib/repos";
import type { EmergencyJob } from "@/lib/types";

const ROUTE = "/emergency";

interface EmergencyCall {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  type: "leak" | "fire" | "spill" | "structural" | "other";
  severity: "critical" | "high" | "medium";
  status: "active" | "responding" | "resolved" | "closed";
  reportedAt: string;
  location: string;
}

const SEED_TYPE_TO_UI: Record<EmergencyJob["type"], EmergencyCall["type"]> = {
  spill_response: "spill",
  hazmat_incident: "spill",
  rapid_repair_on_deck: "other",
  structural_failure: "structural",
  reefer_unit_failure: "other",
};

const SEED_STATUS_TO_UI: Record<EmergencyJob["status"], EmergencyCall["status"]> = {
  open: "active",
  on_site: "responding",
  contained: "resolved",
  closed: "closed",
};

const SEED_SEVERITY_TO_UI: Record<EmergencyJob["severity"], EmergencyCall["severity"]> = {
  low: "medium",
  medium: "medium",
  high: "high",
  critical: "critical",
};

function toUiEmergency(rec: EmergencyJob): EmergencyCall {
  return {
    id: rec.reference,
    reference: rec.reference,
    equipment: rec.equipmentId,
    customer: rec.depotCode,
    type: SEED_TYPE_TO_UI[rec.type],
    severity: SEED_SEVERITY_TO_UI[rec.severity],
    status: SEED_STATUS_TO_UI[rec.status],
    reportedAt: rec.reportedAt.slice(0, 10),
    location: rec.depotCode,
  };
}

const emergencyRows: EmergencyCall[] = emergencyRepo.list().map(toUiEmergency);

const typeBadge: Record<string, string> = {
  leak: "gecko-badge-info",
  fire: "gecko-badge-error",
  spill: "gecko-badge-warning",
  structural: "gecko-badge-accent",
  other: "gecko-badge-gray",
};

const severityBadge: Record<string, string> = {
  critical: "gecko-badge-error",
  high: "gecko-badge-accent",
  medium: "gecko-badge-warning",
};

const columns: Column<EmergencyCall>[] = [
  { key: "reference", label: "Reference", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono text-xs">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "type", label: "Type", sortable: true, render: (val) => <span className={`gecko-badge ${typeBadge[String(val)]}`}>{String(val).charAt(0).toUpperCase() + String(val).slice(1)}</span> },
  { key: "severity", label: "Severity", sortable: true, render: (val) => <span className={`gecko-badge ${severityBadge[String(val)]}`}>{String(val).charAt(0).toUpperCase() + String(val).slice(1)}</span> },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as EmergencyCall["status"]} /> },
  { key: "reportedAt", label: "Reported", sortable: true },
  { key: "location", label: "Location", sortable: true },
];

export default function EmergencyPage() {
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

  const records = forceEmpty ? [] : emergencyRows;

  const stats = {
    active: records.filter((e) => e.status === "active" || e.status === "responding").length,
    critical: records.filter((e) => e.severity === "critical" && e.status !== "closed").length,
    resolved: records.filter((e) => e.status === "resolved").length,
    total: records.length,
  };

  const activeEmergencies = records.filter((e) => e.status === "active" || e.status === "responding");

  const filteredEmergencies = records.filter((emergency) => {
    const matchesSearch =
      !searchQuery ||
      emergency.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emergency.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emergency.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || emergency.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<EmergencyCall>[] = [
    { label: "View Details", onClick: (row) => router.push(`/emergency/${row.id}`) },
    { label: "Update Status", onClick: () => {} },
    { label: "Create Report", onClick: () => {} },
  ];

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={8} rows={6} /></AppShell>;
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
  const showFilterEmpty = forceFilterEmpty || (filteredEmergencies.length === 0 && hasActiveFilters);
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
        title="Emergencies"
        count={filteredEmergencies.length}
        countSuffix="incidents"
        subtitle="Spills, fires, hazmat and structural failures requiring rapid response."
        primaryAction={
          <Link
            href="/emergency/new"
            className="gecko-btn gecko-btn-danger gecko-btn-sm"
          >
            <Phone className="h-4 w-4" />
            Report Emergency
          </Link>
        }
      >
      {/* Active Emergency Alert */}
      {activeEmergencies.length > 0 && (
        <div className="gecko-alert gecko-alert-error mb-6 gecko-emergency-banner">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 animate-pulse gecko-text-danger" />
            <h3 className="gecko-emergency-banner-title">
              Active Emergencies ({activeEmergencies.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeEmergencies.map((emergency) => (
              <div
                key={emergency.id}
                className="flex items-center justify-between p-3 gecko-emergency-row"
              >
                <div>
                  <span className="font-mono font-medium">{emergency.reference}</span>
                  <span className="mx-2 text-muted-foreground">-</span>
                  <span className="font-mono text-sm">{emergency.equipment}</span>
                  <span className={`gecko-badge ml-2 ${severityBadge[emergency.severity]}`}>{emergency.severity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{emergency.location}</span>
                  <Button size="sm" onClick={() => router.push(`/emergency/${emergency.id}`)}>Respond</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StatsGrid>
        <StatsCard label="Active" value={stats.active} icon={AlertTriangle} color="red" />
        <StatsCard label="Critical" value={stats.critical} icon={Phone} color="amber" />
        <StatsCard label="Resolved Today" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatsCard label="Total Incidents" value={stats.total} icon={Clock} color="default" />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search emergencies..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="responding">Responding</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredEmergencies}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/emergency/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredEmergencies.length,
            onPageChange: () => {},
          }}
        />
      </div>
      </ListPageShell>
    </AppShell>
  );
}
