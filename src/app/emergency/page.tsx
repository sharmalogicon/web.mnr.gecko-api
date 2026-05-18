"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, AlertTriangle, Phone, Clock, CheckCircle } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmergencyCall {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  type: "leak" | "fire" | "spill" | "structural" | "other";
  severity: "critical" | "high" | "medium";
  status: "active" | "responding" | "resolved" | "closed";
  reportedAt: string;
  location: string;
}

const mockEmergencies: EmergencyCall[] = [
  { id: "1", reference: "EMG-001234", equipment: "MSKU2234567", customer: "CMA CGM", type: "leak", severity: "critical", status: "active", reportedAt: "10 min ago", location: "Bay 2" },
  { id: "2", reference: "EMG-001233", equipment: "TCLU9987654", customer: "MSC", type: "structural", severity: "high", status: "responding", reportedAt: "45 min ago", location: "Zone A" },
  { id: "3", reference: "EMG-001232", equipment: "HLXU1122334", customer: "Hapag-Lloyd", type: "spill", severity: "medium", status: "resolved", reportedAt: "2 hours ago", location: "Bay 3" },
  { id: "4", reference: "EMG-001231", equipment: "MSCU5566778", customer: "ONE", type: "leak", severity: "high", status: "closed", reportedAt: "Yesterday", location: "Zone C" },
];

const typeBadge: Record<string, string> = {
  leak: "gecko-badge-info",
  fire: "gecko-badge-error",
  spill: "gecko-badge-warning",
  structural: "gecko-badge-accent",
  other: "gecko-badge-gray",
};

const severityBadge: Record<string, string> = {
  critical: "gecko-badge-error",
  high: "gecko-badge-accent",
  medium: "gecko-badge-warning",
};

const columns: Column<EmergencyCall>[] = [
  { key: "reference", label: "Reference", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono text-xs">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "type", label: "Type", sortable: true, render: (val) => <span className={`gecko-badge ${typeBadge[String(val)]}`}>{String(val).charAt(0).toUpperCase() + String(val).slice(1)}</span> },
  { key: "severity", label: "Severity", sortable: true, render: (val) => <span className={`gecko-badge ${severityBadge[String(val)]}`}>{String(val).charAt(0).toUpperCase() + String(val).slice(1)}</span> },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as EmergencyCall["status"]} /> },
  { key: "reportedAt", label: "Reported", sortable: true },
  { key: "location", label: "Location", sortable: true },
];

export default function EmergencyPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = {
    active: mockEmergencies.filter((e) => e.status === "active" || e.status === "responding").length,
    critical: mockEmergencies.filter((e) => e.severity === "critical" && e.status !== "closed").length,
    resolved: mockEmergencies.filter((e) => e.status === "resolved").length,
    total: mockEmergencies.length,
  };

  const activeEmergencies = mockEmergencies.filter((e) => e.status === "active" || e.status === "responding");

  const filteredEmergencies = mockEmergencies.filter((emergency) => {
    const matchesSearch =
      !searchQuery ||
      emergency.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emergency.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emergency.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || emergency.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<EmergencyCall>[] = [
    { label: "View Details", onClick: (row) => router.push(`/emergency/${row.id}`) },
    { label: "Update Status", onClick: () => {} },
    { label: "Create Report", onClick: () => {} },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Emergency Support"
        description="Manage emergency calls and incidents"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Emergency" },
        ]}
        actions={
          <Button variant="destructive" asChild>
            <Link href="/emergency/new">
              <Phone className="mr-2 h-4 w-4" />
              Report Emergency
            </Link>
          </Button>
        }
      />

      {/* Active Emergency Alert */}
      {activeEmergencies.length > 0 && (
        <div
          className="gecko-alert gecko-alert-error mb-6"
          style={{ display: "block", borderWidth: 2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className="h-5 w-5 animate-pulse"
              style={{ color: "var(--gecko-error-600)" }}
            />
            <h3
              style={{
                fontWeight: "var(--gecko-font-weight-semibold)",
                color: "var(--gecko-error-800)",
              }}
            >
              Active Emergencies ({activeEmergencies.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeEmergencies.map((emergency) => (
              <div
                key={emergency.id}
                className="flex items-center justify-between p-3"
                style={{
                  background: "var(--gecko-bg-surface)",
                  borderRadius: "var(--gecko-radius-md)",
                  border: "1px solid var(--gecko-error-200)",
                }}
              >
                <div>
                  <span className="font-mono font-medium">{emergency.reference}</span>
                  <span className="mx-2 text-muted-foreground">-</span>
                  <span className="font-mono text-sm">{emergency.equipment}</span>
                  <span className={`gecko-badge ml-2 ${severityBadge[emergency.severity]}`}>{emergency.severity}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{emergency.location}</span>
                  <Button size="sm" onClick={() => router.push(`/emergency/${emergency.id}`)}>Respond</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StatsGrid>
        <StatsCard label="Active" value={stats.active} icon={AlertTriangle} color="red" />
        <StatsCard label="Critical" value={stats.critical} icon={Phone} color="amber" />
        <StatsCard label="Resolved Today" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatsCard label="Total Incidents" value={stats.total} icon={Clock} color="default" />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search emergencies..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="responding">Responding</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredEmergencies}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/emergency/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredEmergencies.length,
            onPageChange: () => {},
          }}
        />
      </div>
    </AppShell>
  );
}
