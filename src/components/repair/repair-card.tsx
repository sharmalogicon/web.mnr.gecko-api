"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import styles from "./repair-card.module.css";

export interface RepairJob {
  id: string;
  reference: string;
  equipment: string;
  equipmentType: "TANK" | "DRY" | "REEF" | "GENS" | "CHAS";
  customer: string;
  severity: "critical" | "high" | "medium" | "low";
  damageType: string;
  status: "assessment" | "quoted" | "approved" | "in_progress" | "completed";
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
  dueDate?: string;
  progress?: number;
  assignedTo?: string;
  quoteStatus?: "pending" | "approved" | "rejected";
}

interface RepairCardProps {
  job: RepairJob;
  onClick?: () => void;
}

const severityConfig: Record<
  RepairJob["severity"],
  { label: string; badgeClass: string }
> = {
  critical: { label: "Critical", badgeClass: "gecko-badge-error" },
  high:     { label: "High",     badgeClass: "gecko-badge-error" },
  medium:   { label: "Medium",   badgeClass: "gecko-badge-warning" },
  low:      { label: "Low",      badgeClass: "gecko-badge-success" },
};

const equipmentTypeLabels = {
  TANK: "Tank",
  DRY: "Dry",
  REEF: "Reefer",
  GENS: "Genset",
  CHAS: "Chassis",
};

function snapTo5(pct: number): number {
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped / 5) * 5;
}

export function RepairCard({ job }: RepairCardProps) {
  const severity = severityConfig[job.severity];
  const cost = job.actualCost || job.estimatedCost;

  return (
    <Link href={`/repair/${job.id}`}>
      <div
        className={cn("gecko-card group hover:shadow-md", styles.card)}
        data-severity={job.severity}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span className={styles.reference}>{job.reference}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.preventDefault()}
              >
                <Icon name="moreHorizontal" size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Create Quote</DropdownMenuItem>
              <DropdownMenuItem className={styles.dropdownDanger}>
                Cancel Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Equipment Info */}
        <div className="mb-3">
          <p className={styles.equipment}>{job.equipment}</p>
          <p className={styles.equipmentMeta}>
            {job.customer} - {equipmentTypeLabels[job.equipmentType]}
          </p>
        </div>

        {/* Severity & Damage Type */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("gecko-badge", severity.badgeClass)}>
            <span className={styles.badgeDot} data-tone={job.severity} />
            {severity.label}
          </span>
          <span className={cn("truncate", styles.damageType)}>
            {job.damageType}
          </span>
        </div>

        {/* Progress Bar (for in_progress status) */}
        {job.status === "in_progress" && job.progress !== undefined && (
          <div className="mb-3">
            <div className={styles.progressRow}>
              <span className={styles.progressRowLabel}>Progress</span>
              <span className={styles.progressRowValue}>{job.progress}%</span>
            </div>
            <div className="gecko-progress">
              <div
                className="gecko-progress-bar gecko-progress-fill gecko-progress-primary"
                data-progress={snapTo5(job.progress)}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className="flex items-center gap-1">
            <Icon name="calendar" size={12} />
            <span>{job.createdAt}</span>
          </div>
          {cost && (
            <span className={styles.footerCost}>${cost.toLocaleString()}</span>
          )}
        </div>

        {/* Quote Status Badge */}
        {job.status === "quoted" && job.quoteStatus && (
          <div className="mt-2">
            <span
              className={cn(
                "gecko-badge",
                job.quoteStatus === "approved"
                  ? "gecko-badge-success"
                  : job.quoteStatus === "rejected"
                    ? "gecko-badge-error"
                    : "gecko-badge-gray"
              )}
            >
              {job.quoteStatus === "pending" && "Awaiting Approval"}
              {job.quoteStatus === "approved" && "Approved"}
              {job.quoteStatus === "rejected" && "Rejected"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
