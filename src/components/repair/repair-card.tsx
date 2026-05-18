"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { label: string; badgeClass: string; dot: string; accent: string }
> = {
  critical: {
    label: "Critical",
    badgeClass: "gecko-badge-error",
    dot: "var(--gecko-error-500)",
    accent: "var(--gecko-error-500)",
  },
  high: {
    label: "High",
    badgeClass: "gecko-badge-accent",
    dot: "var(--gecko-accent-500)",
    accent: "var(--gecko-accent-500)",
  },
  medium: {
    label: "Medium",
    badgeClass: "gecko-badge-warning",
    dot: "var(--gecko-warning-500)",
    accent: "var(--gecko-warning-500)",
  },
  low: {
    label: "Low",
    badgeClass: "gecko-badge-success",
    dot: "var(--gecko-success-500)",
    accent: "var(--gecko-success-500)",
  },
};

const equipmentTypeLabels = {
  TANK: "Tank",
  DRY: "Dry",
  REEF: "Reefer",
  GENS: "Genset",
  CHAS: "Chassis",
};

export function RepairCard({ job, onClick }: RepairCardProps) {
  const severity = severityConfig[job.severity];
  const cost = job.actualCost || job.estimatedCost;

  return (
    <Link href={`/repair/${job.id}`}>
      <div
        className="gecko-card group cursor-pointer transition-all hover:shadow-md"
        style={{
          padding: "var(--gecko-space-3)",
          borderLeft:
            job.severity === "critical"
              ? `4px solid ${severity.accent}`
              : undefined,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <span
            className="font-mono"
            style={{
              fontSize: "var(--gecko-text-sm)",
              fontWeight: "var(--gecko-font-weight-medium)",
              color: "var(--gecko-text-primary)",
            }}
          >
            {job.reference}
          </span>
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
              <DropdownMenuItem style={{ color: "var(--gecko-error-600)" }}>
                Cancel Job
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Equipment Info */}
        <div className="mb-3">
          <p
            style={{
              fontSize: "var(--gecko-text-sm)",
              fontWeight: "var(--gecko-font-weight-medium)",
              color: "var(--gecko-text-primary)",
            }}
          >
            {job.equipment}
          </p>
          <p
            style={{
              fontSize: "var(--gecko-text-xs)",
              color: "var(--gecko-text-secondary)",
            }}
          >
            {job.customer} - {equipmentTypeLabels[job.equipmentType]}
          </p>
        </div>

        {/* Severity & Damage Type */}
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("gecko-badge", severity.badgeClass)}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "var(--gecko-radius-full)",
                background: severity.dot,
                display: "inline-block",
                marginRight: 4,
              }}
            />
            {severity.label}
          </span>
          <span
            className="truncate"
            style={{
              fontSize: "var(--gecko-text-xs)",
              color: "var(--gecko-text-secondary)",
            }}
          >
            {job.damageType}
          </span>
        </div>

        {/* Progress Bar (for in_progress status) */}
        {job.status === "in_progress" && job.progress !== undefined && (
          <div className="mb-3">
            <div
              className="flex items-center justify-between mb-1"
              style={{ fontSize: "var(--gecko-text-xs)" }}
            >
              <span style={{ color: "var(--gecko-text-secondary)" }}>
                Progress
              </span>
              <span style={{ fontWeight: "var(--gecko-font-weight-medium)" }}>
                {job.progress}%
              </span>
            </div>
            <div
              style={{
                height: 6,
                width: "100%",
                borderRadius: "var(--gecko-radius-full)",
                background: "var(--gecko-gray-100)",
              }}
            >
              <div
                style={{
                  height: 6,
                  borderRadius: "var(--gecko-radius-full)",
                  background: "var(--gecko-primary-600)",
                  width: `${job.progress}%`,
                  transition: "width 200ms ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between pt-2"
          style={{
            fontSize: "var(--gecko-text-xs)",
            color: "var(--gecko-text-secondary)",
            borderTop: "1px solid var(--gecko-border)",
          }}
        >
          <div className="flex items-center gap-1">
            <Icon name="calendar" size={12} />
            <span>{job.createdAt}</span>
          </div>
          {cost && (
            <span
              style={{
                fontWeight: "var(--gecko-font-weight-medium)",
                color: "var(--gecko-text-primary)",
              }}
            >
              ${cost.toLocaleString()}
            </span>
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
