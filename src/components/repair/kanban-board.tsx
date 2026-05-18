"use client";

import { RepairCard, RepairJob } from "./repair-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface KanbanColumn {
  id: string;
  title: string;
  status: RepairJob["status"];
  dot: string;
}

const columns: KanbanColumn[] = [
  { id: "assessment",  title: "Assessment",  status: "assessment",  dot: "var(--gecko-info-500)" },
  { id: "quoted",      title: "Quoted",      status: "quoted",      dot: "var(--gecko-accent-500)" },
  { id: "in_progress", title: "In Progress", status: "in_progress", dot: "var(--gecko-warning-500)" },
  { id: "completed",   title: "Completed",   status: "completed",   dot: "var(--gecko-success-500)" },
];

interface KanbanBoardProps {
  jobs: RepairJob[];
}

export function KanbanBoard({ jobs }: KanbanBoardProps) {
  const getJobsByStatus = (status: RepairJob["status"]) => {
    return jobs.filter((job) => job.status === status);
  };

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4 min-w-max">
        {columns.map((column) => {
          const columnJobs = getJobsByStatus(column.status);
          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80"
              style={{
                background: "var(--gecko-bg-subtle)",
                borderRadius: "var(--gecko-radius-lg)",
              }}
            >
              {/* Column Header */}
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
                  <h3
                    style={{
                      fontSize: "var(--gecko-text-sm)",
                      fontWeight: "var(--gecko-font-weight-semibold)",
                      color: "var(--gecko-text-primary)",
                    }}
                  >
                    {column.title}
                  </h3>
                  <span
                    className="flex items-center justify-center"
                    style={{
                      height: 20,
                      width: 20,
                      borderRadius: "var(--gecko-radius-full)",
                      background: "var(--gecko-gray-100)",
                      fontSize: "var(--gecko-text-xs)",
                      fontWeight: "var(--gecko-font-weight-medium)",
                      color: "var(--gecko-text-secondary)",
                    }}
                  >
                    {columnJobs.length}
                  </span>
                </div>
                {column.status === "assessment" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href="/repair/new">
                      <Plus className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Column Content */}
              <div className="p-2 space-y-2 min-h-[calc(100vh-20rem)] max-h-[calc(100vh-20rem)] overflow-y-auto">
                {columnJobs.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center py-8"
                    style={{ color: "var(--gecko-text-secondary)" }}
                  >
                    <p style={{ fontSize: "var(--gecko-text-sm)" }}>No jobs</p>
                  </div>
                ) : (
                  columnJobs.map((job) => (
                    <RepairCard key={job.id} job={job} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
