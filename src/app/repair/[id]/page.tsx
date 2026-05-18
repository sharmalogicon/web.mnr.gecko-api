"use client";

import { use } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Edit,
  FileText,
  CheckCircle,
  Calendar,
  User,
  Clock,
  Plus,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Mock data for the repair job
const repairJob = {
  id: "1",
  reference: "REP-001234",
  status: "in_progress",
  progress: 60,
  daysCurrent: 3,
  daysTotal: 5,
  equipment: {
    number: "MSKU2234567",
    type: "T11",
    equipmentType: "TANK",
  },
  customer: {
    name: "CMA CGM",
    contact: "john@cmacgm.com",
  },
  survey: {
    reference: "SRV-001234",
    status: "failed",
  },
  severity: "critical",
  damageType: "Valve Replacement",
  assignedTo: "Workshop Team A",
  startDate: "Dec 10, 2024",
  dueDate: "Dec 15, 2024",
  description:
    "Bottom discharge valve leaking. Gasket worn and valve body shows signs of corrosion. Complete valve replacement required.",
  photos: [
    { id: 1, label: "Before 1", type: "before" },
    { id: 2, label: "Before 2", type: "before" },
    { id: 3, label: "Before 3", type: "before" },
    { id: 4, label: "During 1", type: "during" },
    { id: 5, label: "During 2", type: "during" },
  ],
  workLog: [
    {
      id: 1,
      date: "Dec 12",
      time: "14:30",
      user: "Mike J.",
      action: "Valve removed, awaiting new part",
    },
    {
      id: 2,
      date: "Dec 11",
      time: "16:00",
      user: "Mike J.",
      action: "Old gasket removed, surface cleaned",
    },
    {
      id: 3,
      date: "Dec 11",
      time: "09:00",
      user: "Mike J.",
      action: "Started disassembly",
    },
    {
      id: 4,
      date: "Dec 10",
      time: "14:00",
      user: "System",
      action: "Work order created",
    },
  ],
  parts: [
    { name: 'Ball Valve 3"', qty: 1, status: "issued", unitPrice: 450, total: 450 },
    { name: "Gasket Set T11", qty: 1, status: "issued", unitPrice: 85, total: 85 },
    { name: "Teflon Tape", qty: 2, status: "issued", unitPrice: 12, total: 24 },
  ],
  costs: {
    parts: 559,
    labor: 640,
    laborHours: 8,
    laborRate: 80,
    overhead: 120,
    subtotal: 1319,
    margin: 329.75,
    marginPercent: 25,
    total: 1648.75,
  },
};

const severityConfig = {
  critical: { label: "Critical", badge: "gecko-badge-error" },
  high:     { label: "High",     badge: "gecko-badge-accent" },
  medium:   { label: "Medium",   badge: "gecko-badge-warning" },
  low:      { label: "Low",      badge: "gecko-badge-success" },
};

const statusConfig = {
  assessment:  { label: "Assessment",  badge: "gecko-badge-info" },
  quoted:      { label: "Quoted",      badge: "gecko-badge-accent" },
  approved:    { label: "Approved",    badge: "gecko-badge-primary" },
  in_progress: { label: "In Progress", badge: "gecko-badge-warning" },
  completed:   { label: "Completed",   badge: "gecko-badge-success" },
};

export default function RepairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const severity = severityConfig[repairJob.severity as keyof typeof severityConfig];
  const status = statusConfig[repairJob.status as keyof typeof statusConfig];

  return (
    <AppShell>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href="/repair" className="hover:text-foreground">
          Repair
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-foreground font-medium">{repairJob.reference}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{repairJob.reference}</h1>
            <span className={cn("gecko-badge", status.badge)}>{status.label}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Quote
          </Button>
          <Button>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              Day {repairJob.daysCurrent} of {repairJob.daysTotal}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-primary transition-all"
              style={{ width: `${repairJob.progress}%` }}
            />
          </div>
          <div className="mt-2 text-right text-sm font-medium">
            {repairJob.progress}% Complete
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Tank & Repair Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tank Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tank</span>
                  <span className="font-medium font-mono">{repairJob.equipment.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{repairJob.equipment.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span>{repairJob.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Survey</span>
                  <Link href={`/survey/${repairJob.survey.reference}`} className="text-primary hover:underline">
                    {repairJob.survey.reference}
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Repair Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{repairJob.damageType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Severity</span>
                  <span className={cn("gecko-badge", severity.badge)}>
                    {severity.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned</span>
                  <span>{repairJob.assignedTo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started</span>
                  <span>{repairJob.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due</span>
                  <span>{repairJob.dueDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Damage Assessment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Damage Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{repairJob.description}</p>
            </CardContent>
          </Card>

          {/* Damage Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Damage Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {repairJob.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border bg-muted/50 text-center"
                  >
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">
                      {photo.label}
                    </span>
                  </div>
                ))}
                <button className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed hover:bg-muted/50">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                  <span className="mt-1 text-xs text-muted-foreground">Add</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Work Log */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Work Log</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {repairJob.workLog.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-start gap-4 text-sm",
                      index !== repairJob.workLog.length - 1 && "pb-3 border-b"
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                      <Calendar className="h-3.5 w-3.5" />
                      {entry.date}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                      <Clock className="h-3.5 w-3.5" />
                      {entry.time}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                      <User className="h-3.5 w-3.5" />
                      {entry.user}
                    </div>
                    <span className="flex-1">{entry.action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Cost Summary */}
        <div className="space-y-6">
          {/* Parts & Materials */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parts & Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {repairJob.parts.map((part, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{part.name}</span>
                      <span className="text-muted-foreground">x{part.qty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "gecko-badge",
                          part.status === "issued"
                            ? "gecko-badge-success"
                            : "gecko-badge-warning"
                        )}
                      >
                        {part.status === "issued" ? "Issued" : "Pending"}
                      </span>
                      <span className="font-medium">${part.total}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between text-sm font-medium">
                <span>Parts Total</span>
                <span>${repairJob.costs.parts}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cost Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parts</span>
                  <span>${repairJob.costs.parts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Labor ({repairJob.costs.laborHours} hrs x ${repairJob.costs.laborRate}/hr)
                  </span>
                  <span>${repairJob.costs.labor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overhead</span>
                  <span>${repairJob.costs.overhead.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${repairJob.costs.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Margin ({repairJob.costs.marginPercent}%)
                  </span>
                  <span>${repairJob.costs.margin.toFixed(2)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Quote Total</span>
                  <span>${repairJob.costs.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
