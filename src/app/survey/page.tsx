"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Droplets, Wrench } from "lucide-react";
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
import { surveyRepo } from "@/lib/repos";
import type { SurveyRecord } from "@/lib/types";

const ROUTE = "/survey";

interface Survey {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  type: string;
  status: "pending" | "in_progress" | "passed" | "failed" | "conditional";
  surveyor: string;
  date: string;
}

// Map seed SurveyRecord (FK-shaped) → UI shape.
const OUTCOME_TO_STATUS: Record<SurveyRecord["outcome"], Survey["status"]> = {
  pass: "passed",
  pass_with_notes: "conditional",
  must_repair: "failed",
  reject: "failed",
};

function toUiSurvey(rec: SurveyRecord): Survey {
  return {
    id: rec.reference,
    reference: rec.reference,
    equipment: rec.equipmentId,
    customer: rec.containerType,                 // FK to customers not denormalised in seed; show container type
    type: rec.containerType,
    status: OUTCOME_TO_STATUS[rec.outcome],
    surveyor: rec.surveyorId,
    date: rec.performedDate,
  };
}

const surveyRows: Survey[] = surveyRepo.list().map(toUiSurvey);

const columns: Column<Survey>[] = [
  { key: "reference", label: "Survey #", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Survey["status"]} /> },
  { key: "surveyor", label: "Surveyor", sortable: true },
  { key: "date", label: "Date", sortable: true },
];

export default function SurveyPage() {
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

  const records = forceEmpty ? [] : surveyRows;

  const stats = {
    total: records.length,
    pending: records.filter((s) => s.status === "pending").length,
    inProgress: records.filter((s) => s.status === "in_progress").length,
    completed: records.filter((s) => ["passed", "failed", "conditional"].includes(s.status)).length,
  };

  const filteredSurveys = records.filter((survey) => {
    const matchesSearch =
      !searchQuery ||
      survey.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || survey.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<Survey>[] = [
    { label: "View Details", icon: <Icon name="eye" size={16} />, onClick: (row) => router.push(`/survey/${row.id}`) },
    { label: "Edit Survey", icon: <Icon name="edit" size={16} />, onClick: (row) => router.push(`/survey/${row.id}/edit`) },
    { label: "Generate Report", icon: <Icon name="fileText" size={16} />, onClick: () => {} },
    { label: "Create Cleaning Job", icon: <Droplets className="h-4 w-4" />, onClick: () => {}, separator: true },
    { label: "Create Repair Job", icon: <Wrench className="h-4 w-4" />, onClick: () => {} },
    { label: "Delete", icon: <Icon name="trash" size={16} />, onClick: () => {}, variant: "destructive", separator: true },
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
  const showFilterEmpty = forceFilterEmpty || (filteredSurveys.length === 0 && hasActiveFilters);
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
        title="Surveys"
        count={filteredSurveys.length}
        countSuffix="surveys"
        subtitle="Pre-hire, off-hire and damage surveys with outcome status."
        primaryAction={
          <Link
            href="/survey/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            New Survey
          </Link>
        }
      >
      <StatsGrid>
        <StatsCard label="Total" value={stats.total} color="default" onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
        <StatsCard label="Pending" value={stats.pending} color="amber" onClick={() => setStatusFilter("pending")} active={statusFilter === "pending"} />
        <StatsCard label="In Progress" value={stats.inProgress} color="blue" onClick={() => setStatusFilter("in_progress")} active={statusFilter === "in_progress"} />
        <StatsCard label="Completed" value={stats.completed} color="green" onClick={() => setStatusFilter("passed")} active={statusFilter === "passed"} />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search surveys..."
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
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="conditional">Conditional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredSurveys}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/survey/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredSurveys.length,
            onPageChange: () => {},
          }}
        />
      </div>
      </ListPageShell>
    </AppShell>
  );
}
