"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit, FileText, Droplets, Wrench, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { DataTable, StatsCard, StatsGrid, StatusBadge, Column, RowAction } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Survey {
  id: string;
  reference: string;
  equipment: string;
  customer: string;
  type: string;
  status: "pending" | "in_progress" | "passed" | "failed" | "conditional";
  surveyor: string;
  date: string;
}

const mockSurveys: Survey[] = [
  { id: "1", reference: "SRV-001234", equipment: "MSKU2234567", customer: "CMA CGM", type: "T11", status: "passed", surveyor: "John D.", date: "Dec 12" },
  { id: "2", reference: "SRV-001235", equipment: "TCLU9987654", customer: "MAERSK", type: "T14", status: "pending", surveyor: "-", date: "Dec 12" },
  { id: "3", reference: "SRV-001236", equipment: "HLXU1122334", customer: "MSC", type: "T11", status: "in_progress", surveyor: "Mike J.", date: "Dec 11" },
  { id: "4", reference: "SRV-001237", equipment: "MSCU5566778", customer: "CMA CGM", type: "T11", status: "failed", surveyor: "John D.", date: "Dec 11" },
  { id: "5", reference: "SRV-001238", equipment: "REEF4455667", customer: "Hapag-Lloyd", type: "RF", status: "conditional", surveyor: "Sarah L.", date: "Dec 10" },
  { id: "6", reference: "SRV-001239", equipment: "TCKU8899001", customer: "Evergreen", type: "T11", status: "passed", surveyor: "John D.", date: "Dec 10" },
  { id: "7", reference: "SRV-001240", equipment: "MSKU9988776", customer: "ONE", type: "T14", status: "passed", surveyor: "Mike J.", date: "Dec 9" },
];

const columns: Column<Survey>[] = [
  { key: "reference", label: "Survey #", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "equipment", label: "Equipment", sortable: true, render: (val) => <span className="font-mono">{String(val)}</span> },
  { key: "customer", label: "Customer", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Survey["status"]} /> },
  { key: "surveyor", label: "Surveyor", sortable: true },
  { key: "date", label: "Date", sortable: true },
];

export default function SurveyPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = {
    total: mockSurveys.length,
    pending: mockSurveys.filter((s) => s.status === "pending").length,
    inProgress: mockSurveys.filter((s) => s.status === "in_progress").length,
    completed: mockSurveys.filter((s) => ["passed", "failed", "conditional"].includes(s.status)).length,
  };

  const filteredSurveys = mockSurveys.filter((survey) => {
    const matchesSearch =
      !searchQuery ||
      survey.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || survey.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const actions: RowAction<Survey>[] = [
    { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: (row) => router.push(`/survey/${row.id}`) },
    { label: "Edit Survey", icon: <Edit className="h-4 w-4" />, onClick: (row) => router.push(`/survey/${row.id}/edit`) },
    { label: "Generate Report", icon: <FileText className="h-4 w-4" />, onClick: () => {} },
    { label: "Create Cleaning Job", icon: <Droplets className="h-4 w-4" />, onClick: () => {}, separator: true },
    { label: "Create Repair Job", icon: <Wrench className="h-4 w-4" />, onClick: () => {} },
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => {}, variant: "destructive", separator: true },
  ];

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button asChild>
          <Link href="/survey/new">
            <Plus className="mr-2 h-4 w-4" />
            New Survey
          </Link>
        </Button>
      </div>

      <StatsGrid>
        <StatsCard label="Total" value={stats.total} color="default" onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
        <StatsCard label="Pending" value={stats.pending} color="amber" onClick={() => setStatusFilter("pending")} active={statusFilter === "pending"} />
        <StatsCard label="In Progress" value={stats.inProgress} color="blue" onClick={() => setStatusFilter("in_progress")} active={statusFilter === "in_progress"} />
        <StatsCard label="Completed" value={stats.completed} color="green" onClick={() => setStatusFilter("passed")} active={statusFilter === "passed"} />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search surveys..."
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
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="conditional">Conditional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredSurveys}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/survey/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredSurveys.length,
            onPageChange: () => {},
          }}
        />
      </div>
    </AppShell>
  );
}
