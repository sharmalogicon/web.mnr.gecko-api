"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Search, Wrench, Droplets } from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  KpiCard,
  EquipmentTypeFilter,
  OperationsTrendChart,
  EquipmentTypeChart,
  RecentActivity,
  PendingApprovals,
} from "@/components/dashboard";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton, KpiTileSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { equipmentRepo, repairRepo, surveyRepo, cleaningRepo } from "@/lib/repos";

const ROUTE = "/dashboard";

export default function DashboardPage() {
  const sp = useSearchParams();
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["ALL"]);

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  // Dashboard data signals (used by branches).
  const equipmentCount = forceEmpty ? 0 : equipmentRepo.list().length;
  const repairsCount   = forceEmpty ? 0 : repairRepo.list().length;
  const surveysCount   = forceEmpty ? 0 : surveyRepo.list().length;
  const cleaningCount  = forceEmpty ? 0 : cleaningRepo.list().length;

  // KPI summary numbers from seed.
  const tankCount   = forceEmpty ? 0 : equipmentRepo.list().filter((e) => e.category === "TANK").length;
  const dryCount    = forceEmpty ? 0 : equipmentRepo.list().filter((e) => e.category === "DRY").length;
  const reeferCount = forceEmpty ? 0 : equipmentRepo.list().filter((e) => e.category === "REEFER").length;
  const surveysPass = forceEmpty ? 0 : surveyRepo.list().filter((s) => s.outcome === "pass").length;
  const surveysFail = forceEmpty ? 0 : surveyRepo.list().filter((s) => s.outcome === "must_repair" || s.outcome === "reject").length;
  const repairsInProgress = forceEmpty ? 0 : repairRepo.list().filter((r) => r.status === "in_progress").length;
  const cleaningQueued = forceEmpty ? 0 : cleaningRepo.list().filter((c) => c.status === "queued").length;
  const cleaningInProgress = forceEmpty ? 0 : cleaningRepo.list().filter((c) => c.status === "in_progress").length;
  const repairsValue = forceEmpty ? 0 : repairRepo.list().reduce((sum, r) => sum + r.totalCostThb, 0);

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return (
      <AppShell>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <KpiTileSkeleton />
          <KpiTileSkeleton />
          <KpiTileSkeleton />
          <KpiTileSkeleton />
        </div>
        <TableSkeleton columns={4} rows={5} />
      </AppShell>
    );
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
  // Dashboard "empty" = no operational seed data at all (every entity zero).
  const hasAnyData = equipmentCount + repairsCount + surveysCount + cleaningCount > 0;
  const showFilterEmpty = forceFilterEmpty;
  const showEmpty       = forceEmpty || !hasAnyData;
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
      {/* Equipment Type Filter */}
      <div className="mb-6">
        <EquipmentTypeFilter
          selected={selectedTypes}
          onChange={setSelectedTypes}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          title="Equipment in Yard"
          value={equipmentCount}
          icon={Package}
          breakdown={[
            { label: "Tank", value: tankCount },
            { label: "Dry", value: dryCount },
            { label: "Reefer", value: reeferCount },
          ]}
        />
        <KpiCard
          title="Surveys"
          value={surveysCount}
          icon={Search}
          breakdown={[
            { label: "Passed", value: surveysPass },
            { label: "Flagged", value: surveysFail },
          ]}
        />
        <KpiCard
          title="Active Repairs"
          value={repairsInProgress}
          subtitle={`฿${repairsValue.toLocaleString()} value`}
          icon={Wrench}
        />
        <KpiCard
          title="Cleaning In Progress"
          value={cleaningInProgress}
          icon={Droplets}
          breakdown={[{ label: "Queue", value: cleaningQueued }]}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <OperationsTrendChart />
        <EquipmentTypeChart />
      </div>

      {/* Activity and Approvals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity />
        <PendingApprovals />
      </div>
    </AppShell>
  );
}
