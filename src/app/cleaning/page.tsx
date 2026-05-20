"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { List } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { ListPageShell } from "@/components/page-shells";
import { StatusBadge } from "@/components/shared";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { cleaningRepo } from "@/lib/repos";
import type { CleaningJob as SeedCleaningJob } from "@/lib/types";

import styles from "./Cleaning.module.css";

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

function snapTo5(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped / 5) * 5;
}

const cleaningRows: CleaningJob[] = cleaningRepo.list().map(toUiJob);

// Yard bay layout is operational chrome, not seeded data — kept inline.
const mockBays: Bay[] = [
  { id: 1, name: "Bay 1", status: "available" },
  { id: 2, name: "Bay 2", status: "available" },
  { id: 3, name: "Bay 3", status: "available" },
  { id: 4, name: "Bay 4", status: "maintenance" },
];

function CleaningPageInner() {
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
      <ListPageShell
        title="Cleaning Jobs"
        count={filteredJobs.length}
        countSuffix="jobs"
        subtitle="Washouts, vacuum cleans, reefer wipes, tank washes."
        primaryAction={
          <Link
            href="/cleaning/new"
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            New Cleaning Job
          </Link>
        }
      >
      {/* Bay Status */}
      <div className={styles.bayCard}>
        <h3 className={styles.bayTitle}>Cleaning Bay Status</h3>
        <div className={styles.bayGrid}>
          {mockBays.map((bay) => (
            <div
              key={bay.id}
              className={styles.bayTile}
              data-status={bay.status}
            >
              <div className={styles.bayName}>{bay.name}</div>
              {bay.status === "occupied" && bay.currentJob ? (
                <div className={styles.bayMeta}>
                  <div className={styles.bayEquipment}>{bay.currentJob.equipment}</div>
                  <div className={styles.bayEta}>{bay.currentJob.estimatedTime}</div>
                </div>
              ) : (
                <div className={styles.bayStatusLine}>{bay.status}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbarRow}>
        <div className={styles.searchWrap}>
          <Icon name="search" size={16} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search cleaning jobs..."
            className={`gecko-input ${styles.searchInput}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={`gecko-btn gecko-btn-sm ${
              viewMode === "board" ? "gecko-btn-primary" : "gecko-btn-ghost"
            }`}
            onClick={() => setViewMode("board")}
            aria-label="Board view"
          >
            <Icon name="grid" size={16} />
          </button>
          <button
            type="button"
            className={`gecko-btn gecko-btn-sm ${
              viewMode === "list" ? "gecko-btn-primary" : "gecko-btn-ghost"
            }`}
            onClick={() => setViewMode("list")}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {[
            { title: "Queue",       tone: "queue",       jobs: queuedJobs },
            { title: "In Progress", tone: "in-progress", jobs: inProgressJobs },
            { title: "Completed",   tone: "completed",   jobs: completedJobs },
          ].map((column) => (
            <div key={column.title} className={styles.column}>
              <div className={styles.columnHeader}>
                <div className={styles.columnHeaderLeft}>
                  <span className={styles.columnDot} data-tone={column.tone} />
                  <h3 className={styles.columnTitle}>{column.title}</h3>
                  <span className="gecko-pill gecko-pill-neutral">{column.jobs.length}</span>
                </div>
              </div>
              <div className={styles.columnBody}>
                {column.jobs.map((job) => (
                  <CleaningCard key={job.id} job={job} onClick={() => router.push(`/cleaning/${job.id}`)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      </ListPageShell>
    </AppShell>
  );
}

function CleaningCard({ job, onClick }: { job: CleaningJob; onClick: () => void }) {
  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className={styles.cardHeader}>
        <span className={styles.cardRef}>{job.reference}</span>
        <StatusBadge status={job.status} />
      </div>
      <div className={styles.cardEquipment}>{job.equipment}</div>
      <div className={styles.cardCustomer}>{job.customer}</div>
      <div className={styles.cardFooter}>
        <span className="gecko-pill gecko-pill-neutral">{job.cleaningType}</span>
        <span className={styles.cardEta}>Est: {job.estimatedTime}</span>
      </div>
      {job.status === "in_progress" && job.progress !== undefined && (
        <div className={styles.cardProgress}>
          <div className={styles.cardProgressMeta}>
            <span>Bay {job.bay}</span>
            <span>{job.progress}%</span>
          </div>
          <div className="gecko-progress">
            <div
              className="gecko-progress-bar gecko-progress-fill gecko-progress-primary"
              data-progress={snapTo5(job.progress)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CleaningPage() {
  return (
    <Suspense fallback={null}>
      <CleaningPageInner />
    </Suspense>
  );
}
