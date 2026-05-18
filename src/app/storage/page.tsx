"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, MapPin, ArrowRight, ArrowLeft, Search, Map, List, Grid } from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatsCard, StatsGrid } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  zone: string;
  status: "available" | "occupied" | "repair" | "cleaning" | "reserved" | "blocked";
  equipment?: string;
  customer?: string;
}

const zones = [
  { id: "A", name: "Zone A: Hazmat", slots: 10 },
  { id: "B", name: "Zone B: Food Grade", slots: 12 },
  { id: "C", name: "Zone C: General", slots: 14 },
];

const mockSlots: Slot[] = [
  { id: "A1", zone: "A", status: "occupied", equipment: "MSKU2234567", customer: "CMA CGM" },
  { id: "A2", zone: "A", status: "occupied", equipment: "TCLU9987654", customer: "MSC" },
  { id: "A3", zone: "A", status: "available" },
  { id: "A4", zone: "A", status: "available" },
  { id: "A5", zone: "A", status: "reserved" },
  { id: "B1", zone: "B", status: "occupied", equipment: "HLXU1122334", customer: "Hapag-Lloyd" },
  { id: "B2", zone: "B", status: "available" },
  { id: "B3", zone: "B", status: "available" },
  { id: "B4", zone: "B", status: "occupied", equipment: "MSCU5566778", customer: "ONE" },
  { id: "B5", zone: "B", status: "available" },
  { id: "B6", zone: "B", status: "cleaning", equipment: "TCKU8899001", customer: "Evergreen" },
  { id: "C1", zone: "C", status: "occupied", equipment: "REEF4455667", customer: "Maersk" },
  { id: "C2", zone: "C", status: "available" },
  { id: "C3", zone: "C", status: "available" },
  { id: "C4", zone: "C", status: "repair", equipment: "MSKU9988776", customer: "CMA CGM" },
  { id: "C5", zone: "C", status: "occupied", equipment: "HLXU5544332", customer: "ONE" },
  { id: "C6", zone: "C", status: "available" },
  { id: "C7", zone: "C", status: "available" },
];

const statusTones: Record<
  string,
  { background: string; borderColor: string; color: string }
> = {
  available: {
    background: "var(--gecko-success-100)",
    borderColor: "var(--gecko-success-300)",
    color: "var(--gecko-success-700)",
  },
  occupied: {
    background: "var(--gecko-info-100)",
    borderColor: "var(--gecko-info-300)",
    color: "var(--gecko-info-700)",
  },
  repair: {
    background: "var(--gecko-warning-100)",
    borderColor: "var(--gecko-warning-300)",
    color: "var(--gecko-warning-700)",
  },
  cleaning: {
    background: "var(--gecko-accent-100)",
    borderColor: "var(--gecko-accent-300)",
    color: "var(--gecko-accent-700)",
  },
  reserved: {
    background: "var(--gecko-primary-100)",
    borderColor: "var(--gecko-primary-300)",
    color: "var(--gecko-primary-700)",
  },
  blocked: {
    background: "var(--gecko-error-100)",
    borderColor: "var(--gecko-error-300)",
    color: "var(--gecko-error-700)",
  },
};

const statusIcons: Record<string, string> = {
  available: "🟢",
  occupied: "🔵",
  repair: "🟡",
  cleaning: "🟣",
  reserved: "🔷",
  blocked: "🔴",
};

export default function StoragePage() {
  const [viewMode, setViewMode] = useState<"map" | "list" | "grid">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const stats = {
    total: mockSlots.length,
    available: mockSlots.filter((s) => s.status === "available").length,
    inService: mockSlots.filter((s) => ["repair", "cleaning"].includes(s.status)).length,
    occupied: mockSlots.filter((s) => s.status === "occupied").length,
  };

  const getSlotsByZone = (zoneId: string) => mockSlots.filter((s) => s.zone === zoneId);

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline" asChild>
          <Link href="/storage/checkout">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Check-out
          </Link>
        </Button>
        <Button asChild>
          <Link href="/storage/checkin">
            <ArrowRight className="mr-2 h-4 w-4" />
            Check-in
          </Link>
        </Button>
      </div>

      <StatsGrid>
        <StatsCard label="Total Slots" value={stats.total} icon={MapPin} color="default" />
        <StatsCard label="Available" value={stats.available} icon={Package} color="green" />
        <StatsCard label="In Service" value={stats.inService} color="purple" />
        <StatsCard label="Occupied" value={stats.occupied} color="blue" />
      </StatsGrid>

      {/* Toolbar */}
      <div className="mt-6 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Button variant={viewMode === "map" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("map")}>
              <Map className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Yard Map */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="mb-4 font-semibold">Yard Map</h3>

        <div className="space-y-6">
          {zones.map((zone) => (
            <div key={zone.id}>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">{zone.name}</h4>
              <div className="flex flex-wrap gap-2">
                {getSlotsByZone(zone.id).map((slot) => {
                  const tone = statusTones[slot.status];
                  return (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "flex h-16 w-16 flex-col items-center justify-center text-xs font-medium transition-all",
                        selectedSlot?.id === slot.id && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{
                        borderRadius: "var(--gecko-radius-lg)",
                        border: `2px solid ${tone.borderColor}`,
                        background: tone.background,
                        color: tone.color,
                      }}
                    >
                      <span className="text-lg">{statusIcons[slot.status]}</span>
                      <span>{slot.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1"><span>🟢</span> Available</div>
          <div className="flex items-center gap-1"><span>🔵</span> Occupied</div>
          <div className="flex items-center gap-1"><span>🟡</span> Repair</div>
          <div className="flex items-center gap-1"><span>🟣</span> Cleaning</div>
          <div className="flex items-center gap-1"><span>🔷</span> Reserved</div>
        </div>
      </div>

      {/* Selected Slot Details */}
      {selectedSlot && (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Slot {selectedSlot.id}</h4>
              <p className="text-sm text-muted-foreground">
                Status: <Badge variant="outline" className="ml-1 capitalize">{selectedSlot.status}</Badge>
              </p>
              {selectedSlot.equipment && (
                <p className="text-sm mt-1">
                  Equipment: <span className="font-mono">{selectedSlot.equipment}</span> ({selectedSlot.customer})
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {selectedSlot.status === "available" && (
                <Button size="sm">Assign Tank</Button>
              )}
              {selectedSlot.status === "occupied" && (
                <Button size="sm" variant="outline">View Details</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
