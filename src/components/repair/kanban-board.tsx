"use client";

import { RepairCard, RepairJob } from "./repair-card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import styles from "./kanban-board.module.css";

interface KanbanColumn {
  id: string;
  title: string;
  status: RepairJob["status"];
}

const columns: KanbanColumn[] = [
  { id: "assessment",  title: "Assessment",  status: "assessment" },
  { id: "quoted",      title: "Quoted",      status: "quoted" },
  { id: "in_progress", title: "In Progress", status: "in_progress" },
  { id: "completed",   title: "Completed",   status: "completed" },
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
            <div key={column.id} className={styles.column}>
              {/* Column Header */}
              <div className={styles.columnHeader}>
                <div className={styles.columnHeaderLeft}>
                  <div className={styles.dot} data-tone={column.status} />
                  <h3 className={styles.title}>{column.title}</h3>
                  <span className={styles.count}>{columnJobs.length}</span>
                </div>
                {column.status === "assessment" && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href="/repair/new">
                      <Icon name="plus" size={16} />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Column Content */}
              <div className="p-2 space-y-2 min-h-[calc(100vh-20rem)] max-h-[calc(100vh-20rem)] overflow-y-auto">
                {columnJobs.length === 0 ? (
                  <div className={styles.empty}>
                    <p className={styles.emptyText}>No jobs</p>
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
