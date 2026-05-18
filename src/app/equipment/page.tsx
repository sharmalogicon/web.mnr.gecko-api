"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Eye, Edit, FileText, Trash2, Package } from "lucide-react";
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

interface Equipment {
  id: string;
  number: string;
  type: "TANK" | "DRY" | "REEF" | "GENS" | "CHAS";
  typeLabel: string;
  owner: string;
  status: "available" | "in_service" | "repair" | "cleaning" | "storage";
  location: string;
  lastSurvey: string;
}

const mockEquipment: Equipment[] = [
  { id: "1", number: "MSKU2234567", type: "TANK", typeLabel: "T11", owner: "CMA CGM", status: "available", location: "B5", lastSurvey: "Dec 10" },
  { id: "2", number: "TCLU9987654", type: "TANK", typeLabel: "T14", owner: "MSC", status: "in_service", location: "Bay 2", lastSurvey: "Dec 8" },
  { id: "3", number: "HLXU1122334", type: "DRY", typeLabel: "20DC", owner: "Hapag-Lloyd", status: "repair", location: "D1", lastSurvey: "Dec 5" },
  { id: "4", number: "MSCU5566778", type: "TANK", typeLabel: "T11", owner: "ONE", status: "cleaning", location: "Bay 3", lastSurvey: "Dec 11" },
  { id: "5", number: "REEF4455667", type: "REEF", typeLabel: "40RF", owner: "Maersk", status: "available", location: "C1", lastSurvey: "Dec 9" },
  { id: "6", number: "TCKU8899001", type: "TANK", typeLabel: "T11", owner: "Evergreen", status: "storage", location: "A3", lastSurvey: "Nov 28" },
  { id: "7", number: "MSKU9988776", type: "TANK", typeLabel: "T14", owner: "CMA CGM", status: "available", location: "C7", lastSurvey: "Dec 1" },
  { id: "8", number: "GENS1234567", type: "GENS", typeLabel: "Genset", owner: "COSCO", status: "repair", location: "D2", lastSurvey: "Nov 25" },
];

const typeBadge: Record<string, string> = {
  TANK: "gecko-badge-primary",
  DRY: "gecko-badge-gray",
  REEF: "gecko-badge-info",
  GENS: "gecko-badge-accent",
  CHAS: "gecko-badge-success",
};

const columns: Column<Equipment>[] = [
  { key: "number", label: "Equipment #", sortable: true, render: (val) => <span className="font-mono font-medium">{String(val)}</span> },
  { key: "typeLabel", label: "Type", sortable: true, render: (val, row) => <span className={`gecko-badge ${typeBadge[row.type]}`}>{String(val)}</span> },
  { key: "owner", label: "Owner", sortable: true },
  { key: "status", label: "Status", sortable: true, render: (val) => <StatusBadge status={val as Equipment["status"]} /> },
  { key: "location", label: "Location", sortable: true },
  { key: "lastSurvey", label: "Last Survey", sortable: true },
];

export default function EquipmentPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const stats = {
    total: mockEquipment.length,
    tanks: mockEquipment.filter((e) => e.type === "TANK").length,
    dry: mockEquipment.filter((e) => e.type === "DRY").length,
    reefers: mockEquipment.filter((e) => e.type === "REEF").length,
  };

  const filteredEquipment = mockEquipment.filter((eq) => {
    const matchesSearch =
      !searchQuery ||
      eq.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.owner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || eq.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const actions: RowAction<Equipment>[] = [
    { label: "View Details", icon: <Eye className="h-4 w-4" />, onClick: (row) => router.push(`/equipment/${row.id}`) },
    { label: "Edit", icon: <Edit className="h-4 w-4" />, onClick: () => {} },
    { label: "View History", icon: <FileText className="h-4 w-4" />, onClick: () => {} },
    { label: "Delete", icon: <Trash2 className="h-4 w-4" />, onClick: () => {}, variant: "destructive", separator: true },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Equipment Registry"
        description="Manage all equipment in the depot"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Equipment" },
        ]}
        actions={
          <Button asChild>
            <Link href="/equipment/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        }
      />

      <StatsGrid>
        <StatsCard label="Total Equipment" value={stats.total} icon={Package} color="default" />
        <StatsCard label="ISO Tanks" value={stats.tanks} color="blue" onClick={() => setTypeFilter("TANK")} active={typeFilter === "TANK"} />
        <StatsCard label="Dry Containers" value={stats.dry} color="default" onClick={() => setTypeFilter("DRY")} active={typeFilter === "DRY"} />
        <StatsCard label="Reefers" value={stats.reefers} color="amber" onClick={() => setTypeFilter("REEF")} active={typeFilter === "REEF"} />
      </StatsGrid>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search equipment..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="TANK">ISO Tanks</SelectItem>
              <SelectItem value="DRY">Dry Containers</SelectItem>
              <SelectItem value="REEF">Reefers</SelectItem>
              <SelectItem value="GENS">Gensets</SelectItem>
              <SelectItem value="CHAS">Chassis</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        <DataTable
          data={filteredEquipment}
          columns={columns}
          rowKey="id"
          actions={actions}
          onRowClick={(row) => router.push(`/equipment/${row.id}`)}
          pagination={{
            page: 1,
            pageSize: 10,
            total: filteredEquipment.length,
            onPageChange: () => {},
          }}
        />
      </div>
    </AppShell>
  );
}
