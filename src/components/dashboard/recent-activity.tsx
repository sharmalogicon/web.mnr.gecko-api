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

import styles from "./recent-activity.module.css";

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

type Tone = "success" | "danger" | "primary" | "warning" | "neutral";

const activityConfig: Record<
  Activity["type"],
  { icon: typeof CheckCircle; tone: Tone }
> = {
  survey_passed:     { icon: CheckCircle, tone: "success" },
  survey_failed:     { icon: XCircle,     tone: "danger" },
  cleaning_started:  { icon: Droplets,    tone: "primary" },
  cleaning_complete: { icon: CheckCircle, tone: "success" },
  repair_started:    { icon: Wrench,      tone: "warning" },
  gate_in:           { icon: ArrowRight,  tone: "primary" },
  gate_out:          { icon: ArrowLeft,   tone: "neutral" },
  quote_approved:    { icon: DollarSign,  tone: "success" },
};

export function RecentActivity() {
  return (
    <div className="gecko-card">
      <div className={styles.header}>
        <h3 className={styles.title}>Recent Activity</h3>
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
              <div className={styles.iconBubble} data-tone={config.tone}>
                <Icon className="h-4 w-4" />
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
