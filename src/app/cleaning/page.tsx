"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { List } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { cleaningRepo } from "@/lib/repos";
import type { CleaningJob as SeedCleaningJob } from "@/lib/types";

const ROUTE = "/cleaning";

interface CleaningJob {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  cleaningType: string;
  status: "queued" | "assigned" | "in_progress" | "completed" | "certified";
  bay?: number;
  progress?: number;
  estimatedTime: string;
}

interface Bay {
  id: number;
  name: string;
  status: "available" | "occupied" | "maintenance" | "offline";
  currentJob?: CleaningJob;
}

const CLEANING_TYPE_LABEL: Record<SeedCleaningJob["type"], string> = {
  washout: "Washout",
  vacuum: "Vacuum",
  reefer_wipe: "Reefer Wipe",
  tank_wash: "Tank Wash",
};

function toUiJob(rec: SeedCleaningJob): CleaningJob {
  return {
    id: rec.reference,
    reference: rec.reference,
    equipment: rec.equipmentId,
    customer: rec.depotCode,
    cleaningType: CLEANING_TYPE_LABEL[rec.type],
    status: rec.status,
    estimatedTime: rec.status === "completed" ? "Done" : "—",
    progress: rec.status === "in_progress" ? 60 : undefined,
  };
}

const cleaningRows: CleaningJob[] = cleaningRepo.list().map(toUiJob);

// Yard bay layout is operational chrome, not seeded data — kept inline.
const mockBays: Bay[] = [
  { id: 1, name: "Bay 1", status: "available" },
  { id: 2, name: "Bay 2", status: "available" },
  { id: 3, name: "Bay 3", status: "available" },
  { id: 4, name: "Bay 4", status: "maintenance" },
];

const bayStatusStyles: Record<
  Bay["status"],
  { background: string; borderColor: string; color: string }
> = {
  available: {
    background: "var(--gecko-success-100)",
    borderColor: "var(--gecko-success-300)",
    color: "var(--gecko-success-700)",
  },
  occupied: {
    background: "var(--gecko-info-100)",
    borderColor: "var(--gecko-info-300)",
    color: "var(--gecko-info-700)",
  },
  maintenance: {
    background: "var(--gecko-warning-100)",
    borderColor: "var(--gecko-warning-300)",
    color: "var(--gecko-warning-700)",
  },
  offline: {
    background: "var(--gecko-error-100)",
    borderColor: "var(--gecko-error-300)",
    color: "var(--gecko-error-700)",
  },
};

export default function CleaningPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : cleaningRows;

  const filteredJobs = records.filter((j) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return j.reference.toLowerCase().includes(q) ||
           j.equipment.toLowerCase().includes(q) ||
           j.customer.toLowerCase().includes(q);
  });

  const queuedJobs = filteredJobs.filter((j) => j.status === "queued");
  const inProgressJobs = filteredJobs.filter((j) => j.status === "in_progress");
  const completedJobs = filteredJobs.filter((j) => j.status === "completed" || j.status === "certified");

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
  const hasActiveFilters = !!searchQuery;
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
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button asChild>
          <Link href="/cleaning/new">
            <Icon name="plus" size={16} className="mr-2" />
            New Cleaning Job
          </Link>
        </Button>
      </div>

      {/* Bay Status */}
      <div className="mb-6 rounded-xl border bg-card p-4">
        <h3 className="mb-4 font-semibold">Cleaning Bay Status</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mockBays.map((bay) => {
            const tone = bayStatusStyles[bay.status];
            return (
              <div
                key={bay.id}
                className={cn(
                  "p-4 text-center transition-all",
                  bay.status === "available" && "cursor-pointer hover:shadow-md"
                )}
                style={{
                  borderRadius: "var(--gecko-radius-lg)",
                  border: `2px solid ${tone.borderColor}`,
                  background: tone.background,
                  color: tone.color,
                }}
              >
                <div className="text-lg font-semibold">{bay.name}</div>
                {bay.status === "occupied" && bay.currentJob ? (
                  <div className="mt-2">
                    <div className="font-mono text-xs">{bay.currentJob.equipment}</div>
                    <div className="text-xs">{bay.currentJob.estimatedTime}</div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm capitalize">{bay.status}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cleaning jobs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
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
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {[
            { title: "Queue",       jobs: queuedJobs,     dot: "var(--gecko-gray-500)" },
            { title: "In Progress", jobs: inProgressJobs, dot: "var(--gecko-info-500)" },
            { title: "Completed",   jobs: completedJobs,  dot: "var(--gecko-success-500)" },
          ].map((column) => (
            <div
              key={column.title}
              className="w-80 flex-shrink-0"
              style={{
                background: "var(--gecko-bg-subtle)",
                borderRadius: "var(--gecko-radius-lg)",
              }}
            >
              <div
                className="flex items-center justify-between p-3"
                style={{ borderBottom: "1px solid var(--gecko-border)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      height: 10,
                      width: 10,
                      borderRadius: "var(--gecko-radius-full)",
                      background: column.dot,
                    }}
                  />
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="secondary">{column.jobs.length}</Badge>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[400px]">
                {column.jobs.map((job) => (
                  <CleaningCard key={job.id} job={job} onClick={() => router.push(`/cleaning/${job.id}`)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </AppShell>
  );
}

function CleaningCard({ job, onClick }: { job: CleaningJob; onClick: () => void }) {
  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-sm font-medium">{job.reference}</span>
        <StatusBadge status={job.status} />
      </div>
      <div className="text-sm font-medium">{job.equipment}</div>
      <div className="text-xs text-muted-foreground">{job.customer}</div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <Badge variant="outline">{job.cleaningType}</Badge>
        <span className="text-muted-foreground">Est: {job.estimatedTime}</span>
      </div>
      {job.status === "in_progress" && job.progress !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Bay {job.bay}</span>
            <span>{job.progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
