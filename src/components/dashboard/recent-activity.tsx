"use client";

import {
  CheckCircle,
  XCircle,
  Droplets,
  Wrench,
  ArrowRight,
  ArrowLeft,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type:
    | "survey_passed"
    | "survey_failed"
    | "cleaning_started"
    | "cleaning_complete"
    | "repair_started"
    | "gate_in"
    | "gate_out"
    | "quote_approved";
  title: string;
  equipment: string;
  equipmentType: string;
  timeAgo: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "survey_passed",
    title: "Survey SRV-001234 passed",
    equipment: "MSKU2234567",
    equipmentType: "ISO Tank",
    timeAgo: "5 min ago",
  },
  {
    id: "2",
    type: "cleaning_started",
    title: "Cleaning started Bay 3",
    equipment: "TCLU9987654",
    equipmentType: "ISO Tank",
    timeAgo: "12 min ago",
  },
  {
    id: "3",
    type: "gate_in",
    title: "Gate In - PTI required",
    equipment: "REEF4455667",
    equipmentType: "Reefer",
    timeAgo: "25 min ago",
  },
  {
    id: "4",
    type: "repair_started",
    title: "Repair started - Valve replacement",
    equipment: "MSKU1122334",
    equipmentType: "ISO Tank",
    timeAgo: "1 hour ago",
  },
  {
    id: "5",
    type: "quote_approved",
    title: "Quote approved - ฿84,000",
    equipment: "HLXU5566778",
    equipmentType: "Dry Container",
    timeAgo: "2 hours ago",
  },
];

const activityConfig: Record<
  Activity["type"],
  {
    icon: typeof CheckCircle;
    iconBg: string;
    iconColor: string;
  }
> = {
  survey_passed: {
    icon: CheckCircle,
    iconBg: "var(--gecko-success-100)",
    iconColor: "var(--gecko-success-600)",
  },
  survey_failed: {
    icon: XCircle,
    iconBg: "var(--gecko-error-100)",
    iconColor: "var(--gecko-error-600)",
  },
  cleaning_started: {
    icon: Droplets,
    iconBg: "var(--gecko-primary-100)",
    iconColor: "var(--gecko-primary-600)",
  },
  cleaning_complete: {
    icon: CheckCircle,
    iconBg: "var(--gecko-success-100)",
    iconColor: "var(--gecko-success-600)",
  },
  repair_started: {
    icon: Wrench,
    iconBg: "var(--gecko-warning-100)",
    iconColor: "var(--gecko-warning-700)",
  },
  gate_in: {
    icon: ArrowRight,
    iconBg: "var(--gecko-primary-100)",
    iconColor: "var(--gecko-primary-600)",
  },
  gate_out: {
    icon: ArrowLeft,
    iconBg: "var(--gecko-gray-100)",
    iconColor: "var(--gecko-gray-600)",
  },
  quote_approved: {
    icon: DollarSign,
    iconBg: "var(--gecko-success-100)",
    iconColor: "var(--gecko-success-600)",
  },
};

export function RecentActivity() {
  return (
    <div className="gecko-card">
      <div
        className="flex items-center justify-between p-4"
        style={{ borderBottom: "1px solid var(--gecko-border)" }}
      >
        <h3 style={{ fontWeight: "var(--gecko-font-weight-semibold)" }}>
          Recent Activity
        </h3>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activity">View All</Link>
        </Button>
      </div>
      <div className="divide-y">
        {activities.map((activity) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: config.iconBg }}
              >
                <Icon className="h-4 w-4" style={{ color: config.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.equipment} - {activity.equipmentType}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.timeAgo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
