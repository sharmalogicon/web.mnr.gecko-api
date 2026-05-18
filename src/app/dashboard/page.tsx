"use client";

import { useState } from "react";
import { Package, Search, Wrench, Droplets } from "lucide-react";
import { AppShell } from "@/components/layout";
import {
  KpiCard,
  EquipmentTypeFilter,
  OperationsTrendChart,
  EquipmentTypeChart,
  RecentActivity,
  PendingApprovals,
} from "@/components/dashboard";

export default function DashboardPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["ALL"]);

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time overview of depot M&R operations
        </p>
      </div>

      {/* Equipment Type Filter */}
      <div className="mb-6">
        <EquipmentTypeFilter
          selected={selectedTypes}
          onChange={setSelectedTypes}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          title="Equipment in Yard"
          value={247}
          icon={Package}
          breakdown={[
            { label: "Tank", value: 112 },
            { label: "Dry", value: 86 },
            { label: "Reefer", value: 49 },
          ]}
          trend={{
            value: "+5",
            direction: "up",
            label: "arrived today",
          }}
        />
        <KpiCard
          title="Surveys Today"
          value={12}
          icon={Search}
          breakdown={[
            { label: "Passed", value: 8 },
            { label: "Pending", value: 3 },
            { label: "Failed", value: 1 },
          ]}
        />
        <KpiCard
          title="Active Repairs"
          value={18}
          subtitle="$24,500 value"
          icon={Wrench}
          trend={{
            value: "3 awaiting parts",
            direction: "neutral",
          }}
        />
        <KpiCard
          title="Cleaning In Progress"
          value={8}
          icon={Droplets}
          breakdown={[{ label: "Queue", value: 4 }]}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
        <OperationsTrendChart />
        <EquipmentTypeChart />
      </div>

      {/* Activity and Approvals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity />
        <PendingApprovals />
      </div>
    </AppShell>
  );
}
