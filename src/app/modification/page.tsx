"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit, Settings2, Wrench, FileCheck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Modification {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  modificationType: string;
  status: "pending" | "approved" | "in_progress" | "completed" | "rejected";
  estimatedCost: number;
  requestDate: string;
}

const mockModifications: Modification[] = [
  { id: "1", reference: "MOD-000456", equipment: "MSKU2234567", customer: "CMA CGM", modificationType: "Heating System Upgrade", status: "in_progress", estimatedCost: 4500, requestDate: "Dec 10" },
  { id: "2", reference: "MOD-000457", equipment: "TCLU9987654", customer: "MSC", modificationType: "Valve Replacement", status: "pending", estimatedCost: 1850, requestDate: "Dec 11" },
  { id: "3", reference: "MOD-000458", equipment: "HLXU1122334", customer: "Hapag-Lloyd", modificationType: "Insulation Upgrade", status: "approved", estimatedCost: 3200, requestDate: "Dec 8" },
  { id: "4", reference: "MOD-000455", equipment: "MSCU5566778", customer: "ONE", modificationType: "Safety Equipment", status: "completed", estimatedCost: 950, requestDate: "Dec 5" },
  { id: "5", reference: "MOD-000454", equipment: "REEF4455667", customer: "Maersk", modificationType: "Refrigeration Upgrade", status: "completed", estimatedCost: 6800, requestDate: "Dec 1" },
  { id: "6", reference: "MOD-000459", equipment: "TCKU8899001", customer: "Evergreen", modificationType: "Frame Reinforcement", status: "rejected", estimatedCost: 2400, requestDate: "Dec 12" },
];

const columns: Column<Modification>[] = [
  { key: "reference", label: "Reference", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono text-xs">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "modificationType", label: "Type", sortable: true },
  { key: "estimatedCost", label: "Est. Cost", sortable: true, align: "right", render: (val) => <span className="font-medium">${Number(val).toLocaleString()}</span> },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Modification["status"]} /> },
  { key: "requestDate", label: "Requested", sortable: true },
];

export default function ModificationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = {
    pending: mockModifications.filter((m) => m.status === "pending").length,
    inProgress: mockModifications.filter((m) => m.status === "in_progress" || m.status === "approved").length,
    completed: mockModifications.filter((m) => m.status === "completed").length,
    totalValue: mockModifications.filter((m) => m.status !== "rejected").reduce((sum, m) => sum + m.estimatedCost, 0),
  };

  const filteredModifications = mockModifications.filter((mod) => {
    const matchesSearch =
      !searchQuery ||
      mod.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || mod.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<Modification>[] = [
    { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: (row) => router.push(`/modification/${row.id}`) },
    { label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => {} },
    { label: "Approve", icon: <FileCheck className="h-4 w-4" />, onClick: () => {}, separator: true },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Modifications"
        description="Manage equipment modification requests"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Modification" },
        ]}
        actions={
          <Button asChild>
            <Link href="/modification/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard label="Pending Approval" value={stats.pending} icon={Settings2} color="amber" />
        <StatsCard label="In Progress" value={stats.inProgress} icon={Wrench} color="blue" />
        <StatsCard label="Completed" value={stats.completed} icon={FileCheck} color="green" />
        <StatsCard label="Total Value" value={`$${stats.totalValue.toLocaleString()}`} color="default" />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search modifications..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredModifications}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/modification/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredModifications.length,
            onPageChange: () => {},
          }}
        />
      </div>
    </AppShell>
  );
}
