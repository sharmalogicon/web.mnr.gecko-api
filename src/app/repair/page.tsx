"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { AppShell } from "@/components/layout";
import { KanbanBoard, SeverityFilter, RepairJob } from "@/components/repair";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data
const mockJobs: RepairJob[] = [
  {
    id: "1",
    reference: "REP-001234",
    equipment: "MSKU2234567",
    equipmentType: "TANK",
    customer: "CMA CGM",
    severity: "critical",
    damageType: "Valve Failure",
    status: "assessment",
    estimatedCost: 2400,
    createdAt: "Dec 12",
  },
  {
    id: "2",
    reference: "REP-001235",
    equipment: "TCLU9987654",
    equipmentType: "TANK",
    customer: "MSC",
    severity: "high",
    damageType: "Frame Damage",
    status: "assessment",
    estimatedCost: 5600,
    createdAt: "Dec 11",
  },
  {
    id: "3",
    reference: "REP-001230",
    equipment: "HLXU1122334",
    equipmentType: "DRY",
    customer: "Hapag-Lloyd",
    severity: "medium",
    damageType: "Panel Damage",
    status: "assessment",
    estimatedCost: 1200,
    createdAt: "Dec 10",
  },
  {
    id: "4",
    reference: "REP-001220",
    equipment: "MSKU5566778",
    equipmentType: "TANK",
    customer: "CMA CGM",
    severity: "medium",
    damageType: "Gasket Wear",
    status: "quoted",
    estimatedCost: 2400,
    quoteStatus: "pending",
    createdAt: "Dec 9",
  },
  {
    id: "5",
    reference: "REP-001221",
    equipment: "REEF4455667",
    equipmentType: "REEF",
    customer: "Maersk",
    severity: "high",
    damageType: "Compressor Issue",
    status: "quoted",
    estimatedCost: 5600,
    quoteStatus: "approved",
    createdAt: "Dec 8",
  },
  {
    id: "6",
    reference: "REP-001215",
    equipment: "MSCU1234567",
    equipmentType: "DRY",
    customer: "COSCO",
    severity: "medium",
    damageType: "Floor Repair",
    status: "in_progress",
    estimatedCost: 1800,
    progress: 60,
    createdAt: "Dec 7",
    dueDate: "Dec 15",
  },
  {
    id: "7",
    reference: "REP-001216",
    equipment: "TCKU8899001",
    equipmentType: "TANK",
    customer: "Evergreen",
    severity: "low",
    damageType: "Welding",
    status: "in_progress",
    estimatedCost: 950,
    progress: 30,
    createdAt: "Dec 6",
  },
  {
    id: "8",
    reference: "REP-001200",
    equipment: "MSKU9988776",
    equipmentType: "TANK",
    customer: "CMA CGM",
    severity: "medium",
    damageType: "Coating",
    status: "completed",
    actualCost: 1850,
    createdAt: "Dec 1",
  },
  {
    id: "9",
    reference: "REP-001199",
    equipment: "HLXU5544332",
    equipmentType: "DRY",
    customer: "ONE",
    severity: "low",
    damageType: "Door Seal",
    status: "completed",
    actualCost: 450,
    createdAt: "Nov 30",
  },
];

export default function RepairPage() {
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);

  // Calculate severity counts
  const severityCounts = [
    { severity: "critical" as const, count: mockJobs.filter((j) => j.severity === "critical").length },
    { severity: "high" as const, count: mockJobs.filter((j) => j.severity === "high").length },
    { severity: "medium" as const, count: mockJobs.filter((j) => j.severity === "medium").length },
    { severity: "low" as const, count: mockJobs.filter((j) => j.severity === "low").length },
  ];

  // Filter jobs
  const filteredJobs = mockJobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      selectedSeverities.length === 0 ||
      selectedSeverities.includes(job.severity);

    return matchesSearch && matchesSeverity;
  });

  return (
    <AppShell>
      {/* Page Header */}
      <div className="mb-6">
        <nav className="mb-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Dashboard
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Repair</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Repair Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Manage equipment damage assessment and repairs
            </p>
          </div>
          <Button asChild>
            <Link href="/repair/new">
              <Plus className="mr-2 h-4 w-4" />
              New Repair Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Severity Filter Pills */}
      <div className="mb-6">
        <SeverityFilter
          counts={severityCounts}
          selected={selectedSeverities}
          onChange={setSelectedSeverities}
        />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by reference, equipment, customer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Severity
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Critical</DropdownMenuItem>
              <DropdownMenuItem>High</DropdownMenuItem>
              <DropdownMenuItem>Medium</DropdownMenuItem>
              <DropdownMenuItem>Low</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Customer
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All Customers</DropdownMenuItem>
              <DropdownMenuItem>CMA CGM</DropdownMenuItem>
              <DropdownMenuItem>MSC</DropdownMenuItem>
              <DropdownMenuItem>Maersk</DropdownMenuItem>
              <DropdownMenuItem>Hapag-Lloyd</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === "board" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("board")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "board" && <KanbanBoard jobs={filteredJobs} />}

      {/* List View (placeholder) */}
      {viewMode === "list" && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          List view coming soon...
        </div>
      )}
    </AppShell>
  );
}
