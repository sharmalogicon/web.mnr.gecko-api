"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { List } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { KanbanBoard, SeverityFilter, RepairJob } from "@/components/repair";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { repairRepo } from "@/lib/repos";
import type { RepairJob as SeedRepairJob } from "@/lib/types";

const ROUTE = "/repair";

// Map seed RepairJob (FK + CEDEX line items) → kanban UI shape.
// `RepairJob` from `@/components/repair` is the UI shape (id, equipment, severity, status).
const SEED_STATUS_TO_UI: Record<SeedRepairJob["status"], RepairJob["status"]> = {
  estimated: "assessment",
  awaiting_approval: "quoted",
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
};

// Seed severities are minor/normal/critical; UI severities are low/medium/high/critical.
const SEED_SEVERITY_TO_UI: Record<SeedRepairJob["severity"], RepairJob["severity"]> = {
  minor: "low",
  normal: "medium",
  critical: "critical",
};

function toUiRepair(rec: SeedRepairJob): RepairJob {
  const equipmentType: RepairJob["equipmentType"] = rec.equipmentId.startsWith("MWCU") || rec.equipmentId.startsWith("MNBU")
    ? "REEF"
    : rec.equipmentId.startsWith("TCNU") || rec.equipmentId.startsWith("BEAU")
      ? "TANK"
      : "DRY";
  const damageDescription = rec.lines.length > 0
    ? `${rec.lines[0].component} ${rec.lines[0].damage}`
    : "—";
  const base: RepairJob = {
    id: rec.reference,
    reference: rec.reference,
    equipment: rec.equipmentId,
    equipmentType,
    customer: rec.customerCode.replace(/^C-/, ""),
    severity: SEED_SEVERITY_TO_UI[rec.severity],
    damageType: damageDescription,
    status: SEED_STATUS_TO_UI[rec.status],
    createdAt: rec.openedDate,
    estimatedCost: rec.totalCostThb,
  };
  if (rec.status === "completed") {
    base.actualCost = rec.totalCostThb;
  }
  if (rec.status === "awaiting_approval") {
    base.quoteStatus = "pending";
  }
  if (rec.status === "in_progress") {
    base.progress = 50;
  }
  if (rec.closedDate) {
    base.dueDate = rec.closedDate;
  }
  return base;
}

const repairRows: RepairJob[] = repairRepo.list().map(toUiRepair);

export default function RepairPage() {
  const sp = useSearchParams();
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : repairRows;

  // Calculate severity counts
  const severityCounts = [
    { severity: "critical" as const, count: records.filter((j) => j.severity === "critical").length },
    { severity: "high" as const, count: records.filter((j) => j.severity === "high").length },
    { severity: "medium" as const, count: records.filter((j) => j.severity === "medium").length },
    { severity: "low" as const, count: records.filter((j) => j.severity === "low").length },
  ];

  // Filter jobs
  const filteredJobs = records.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      selectedSeverities.length === 0 ||
      selectedSeverities.includes(job.severity);

    return matchesSearch && matchesSeverity;
  });

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={5} rows={8} /></AppShell>;
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
  const hasActiveFilters = !!searchQuery || selectedSeverities.length > 0;
  const showFilterEmpty = forceFilterEmpty || (filteredJobs.length === 0 && hasActiveFilters);
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
        title="Repair Jobs"
        count={filteredJobs.length}
        countSuffix="jobs"
        subtitle="CEDEX-coded repair workshop jobs."
        primaryAction={
          <Link
            href="/repair/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            New Repair Job
          </Link>
        }
      >
      {/* Severity Filter Pills */}
      <div className="mb-6">
        <SeverityFilter
          counts={severityCounts}
          selected={selectedSeverities}
          onChange={setSelectedSeverities}
        />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by reference, equipment, customer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Severity
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Critical</DropdownMenuItem>
              <DropdownMenuItem>High</DropdownMenuItem>
              <DropdownMenuItem>Medium</DropdownMenuItem>
              <DropdownMenuItem>Low</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Customer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All Customers</DropdownMenuItem>
              <DropdownMenuItem>CMA CGM</DropdownMenuItem>
              <DropdownMenuItem>MSC</DropdownMenuItem>
              <DropdownMenuItem>Maersk</DropdownMenuItem>
              <DropdownMenuItem>Hapag-Lloyd</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("board")}
            >
              <Icon name="grid" size={16} />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "board" && <KanbanBoard jobs={filteredJobs} />}

      {/* List View (placeholder) */}
      {viewMode === "list" && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          List view coming soon...
        </div>
      )}
      </ListPageShell>
    </AppShell>
  );
}
