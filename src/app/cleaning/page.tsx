"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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

const mockBays: Bay[] = [
  { id: 1, name: "Bay 1", status: "available" },
  { id: 2, name: "Bay 2", status: "occupied", currentJob: { id: "2", reference: "CLN-001230", equipment: "MSKU1111222", customer: "CMA CGM", cleaningType: "Food Grade", status: "in_progress", bay: 2, progress: 80, estimatedTime: "45 min" } },
  { id: 3, name: "Bay 3", status: "occupied", currentJob: { id: "3", reference: "CLN-001231", equipment: "TCLU9987654", customer: "MSC", cleaningType: "Standard", status: "in_progress", bay: 3, progress: 55, estimatedTime: "1h 20m" } },
  { id: 4, name: "Bay 4", status: "maintenance" },
];

const mockJobs: CleaningJob[] = [
  { id: "1", reference: "CLN-001234", equipment: "MSKU2234567", customer: "CMA CGM", cleaningType: "Standard", status: "queued", estimatedTime: "2h" },
  { id: "2", reference: "CLN-001235", equipment: "TCLU8877665", customer: "MAERSK", cleaningType: "Food Grade", status: "queued", estimatedTime: "6h" },
  { id: "3", reference: "CLN-001236", equipment: "HLXU3344556", customer: "MSC", cleaningType: "Deep Clean", status: "queued", estimatedTime: "4h" },
  { id: "4", reference: "CLN-001230", equipment: "MSKU1111222", customer: "CMA CGM", cleaningType: "Food Grade", status: "in_progress", bay: 2, progress: 80, estimatedTime: "45 min" },
  { id: "5", reference: "CLN-001231", equipment: "TCLU9987654", customer: "MSC", cleaningType: "Standard", status: "in_progress", bay: 3, progress: 55, estimatedTime: "1h 20m" },
  { id: "6", reference: "CLN-001225", equipment: "TCLU8888999", customer: "Hapag-Lloyd", cleaningType: "Food Grade", status: "certified", estimatedTime: "2h 15m" },
  { id: "7", reference: "CLN-001224", equipment: "MSCU5566778", customer: "ONE", cleaningType: "Standard", status: "completed", estimatedTime: "2h" },
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
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");

  const queuedJobs = mockJobs.filter((j) => j.status === "queued");
  const inProgressJobs = mockJobs.filter((j) => j.status === "in_progress");
  const completedJobs = mockJobs.filter((j) => j.status === "completed" || j.status === "certified");

  return (
    <AppShell>
      <PageHeader
        title="Tank Cleaning"
        description="Manage cleaning operations and bay assignments"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cleaning" },
        ]}
        actions={
          <Button asChild>
            <Link href="/cleaning/new">
              <Plus className="mr-2 h-4 w-4" />
              New Cleaning Job
            </Link>
          </Button>
        }
      />

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
                    <div
                      className="mt-2"
                      style={{
                        height: 6,
                        width: "100%",
                        borderRadius: "var(--gecko-radius-full)",
                        background: "rgba(255,255,255,0.5)",
                      }}
                    >
                      <div
                        style={{
                          height: 6,
                          borderRadius: "var(--gecko-radius-full)",
                          background: "var(--gecko-info-500)",
                          width: `${bay.currentJob.progress}%`,
                          transition: "width 200ms ease",
                        }}
                      />
                    </div>
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              <LayoutGrid className="h-4 w-4" />
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
