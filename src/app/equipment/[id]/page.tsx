"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { History, Wrench, Droplets, ClipboardCheck } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { DetailPageShell } from "@/components/page-shells";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { equipmentRepo } from "@/lib/repos";

// Visual chrome that the seed doesn't yet model — kept as fallback for the
// non-seed-driven UI elements (certifications, history, specs detail).
// Container-specific fields (id, type, status, depot) come from the seed record.
const mockChrome = {
  capacity: "26,000L",
  owner: "CMA CGM",
  manufacturer: "CIMC",
  yearBuilt: 2019,
  lastSurvey: "Dec 10, 2024",
  lastCleaning: "Dec 8, 2024",
  nextInspection: "Jun 10, 2025",
  certifications: [
    { name: "CSC Plate", expiry: "Dec 2025", status: "valid" },
    { name: "Pressure Test", expiry: "Jun 2025", status: "valid" },
    { name: "5-Year Inspection", expiry: "Mar 2024", status: "expired" },
  ],
  history: [
    { date: "Dec 10, 2024", type: "Survey", ref: "SRV-001234", result: "Passed" },
    { date: "Dec 8, 2024", type: "Cleaning", ref: "CLN-001220", result: "Certified" },
    { date: "Nov 15, 2024", type: "Repair", ref: "REP-000890", result: "Completed" },
    { date: "Oct 20, 2024", type: "Survey", ref: "SRV-001100", result: "Conditional" },
    { date: "Oct 18, 2024", type: "Cleaning", ref: "CLN-001150", result: "Certified" },
  ],
  specs: {
    tare: "3,850 kg",
    maxGross: "36,000 kg",
    testPressure: "4.0 bar",
    workingPressure: "2.65 bar",
    shell: "Stainless Steel 316L",
    insulation: "Polyurethane Foam",
    cladding: "Aluminum",
  },
};

const ROUTE = "/equipment/[id]";
const LIST_ROUTE = "/equipment";

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const id = String(params?.id ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const record = equipmentRepo.get(id);

  if (forceLoading) {
    return (
      <AppShell>
        <DetailSpinner label={getLoadingLabel(ROUTE)} />
      </AppShell>
    );
  }
  if (forceError) {
    const errCopy = getErrorCopy(LIST_ROUTE);
    return (
      <AppShell>
        <ErrorState
          title={errCopy.title}
          description={errCopy.description}
          onRetry={() => window.location.reload()}
        />
      </AppShell>
    );
  }
  if (!record) {
    const allRefs = equipmentRepo.list().map((r) => r.id);
    const suggestion = nearestReference(id, allRefs);
    const copy = getEmptyCopy(ROUTE, "not-found");
    if (!copy) {
      return (
        <AppShell>
          <EmptyState variant="not-found" title="Not found" />
        </AppShell>
      );
    }
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          icon={copy.icon}
          title={copy.title}
          description={
            <>
              {copy.description.replace("{ID}", id)}
              {suggestion && (
                <>
                  <br />
                  <br />
                  Did you mean{" "}
                  <Link
                    href={`/equipment/${encodeURIComponent(suggestion)}`}
                    className="gecko-text-mono gecko-text-primary"
                  >
                    {suggestion}
                  </Link>
                  ?
                </>
              )}
            </>
          }
          primary={copy.primary}
          secondary={
            copy.secondary && {
              ...copy.secondary,
              href: copy.secondary.href.replace("{ID}", encodeURIComponent(id)),
            }
          }
        />
      </AppShell>
    );
  }

  // Existing detail render — uses `record` for ID/type/status/depot from seed,
  // mockChrome for unmodeled visual decoration (certs/history/specs).
  // Map EquipmentStatus → StatusBadge status (off_hire isn't in StatusBadge → fall back to maintenance)
  const badgeStatus = record.status === "off_hire" ? "maintenance" : record.status;

  return (
    <AppShell>
      <DetailPageShell
        backHref="/equipment"
        backLabel="Back to Equipment"
        id={record.id}
        pills={
          <>
            <span className="gecko-badge gecko-badge-gray">{record.category}</span>
            <StatusBadge status={badgeStatus} />
          </>
        }
        toolbar={
          <>
            <Link
              href={`/equipment/${encodeURIComponent(record.id)}/edit`}
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              <Icon name="edit" size={16} />
              Edit
            </Link>
            <button
              type="button"
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
            >
              <History className="h-4 w-4" />
              Full History
            </button>
          </>
        }
        metrics={[
          { label: "ISO size/type", value: record.isoSizeType },
          { label: "Tare", value: `${record.tareKg.toLocaleString()} kg` },
          { label: "Max gross", value: `${record.maxGrossKg.toLocaleString()} kg` },
          { label: "Depot", value: record.depotCode },
        ]}
      >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Equipment Details</CardTitle>
                <StatusBadge status={badgeStatus} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment ID:</span>
                    <span className="font-mono font-medium">{record.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{record.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span>{mockChrome.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span>{mockChrome.owner}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span>{mockChrome.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year Built:</span>
                    <span>{mockChrome.yearBuilt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{record.depotCode}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for History, Specs, Certifications, Type-specific */}
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Service History</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="certs">Certifications</TabsTrigger>
              {(record.category === "TANK" || record.category === "REEFER") && (
                <TabsTrigger value="typespec">
                  {record.category === "TANK" ? "Tank specs" : "Reefer specs"}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {mockChrome.history.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/${item.type.toLowerCase()}/${item.ref}`)}
                      >
                        <div className="flex items-center gap-3">
                          {item.type === "Survey" && <ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
                          {item.type === "Cleaning" && <Droplets className="h-4 w-4 text-muted-foreground" />}
                          {item.type === "Repair" && <Wrench className="h-4 w-4 text-muted-foreground" />}
                          <div>
                            <span className="font-mono text-sm">{item.ref}</span>
                            <span className="mx-2 text-muted-foreground">-</span>
                            <span>{item.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{item.date}</span>
                          <Badge variant="outline">{item.result}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specs">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SpecRow label="ISO 6346 size/type" value={record.isoSizeType} />
                    <SpecRow label="Category" value={record.category} />
                    <SpecRow label="Tare" value={`${record.tareKg.toLocaleString()} kg`} />
                    <SpecRow label="Max gross" value={`${record.maxGrossKg.toLocaleString()} kg`} />
                    <SpecRow label="Payload" value={`${record.payloadKg.toLocaleString()} kg`} />
                    <SpecRow label="Cube" value={`${record.cubeM3} m³`} />
                    <SpecRow label="Internal L × W × H" value={`${record.internalLengthM} × ${record.internalWidthM} × ${record.internalHeightM} m`} />
                    <SpecRow label="Door opening" value={`${record.doorOpeningWidthM} × ${record.doorOpeningHeightM} m`} />
                    <SpecRow label="Floor type" value={record.floorType} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certs">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <CertRow label="CSC Plate ID" value={record.cscPlateId} status="valid" />
                    <CertRow label="ACEP Registration" value={record.acepRegistration} status="valid" />
                    <CertRow label="Next Periodic Examination" value={record.nextPeriodicExam} status={daysUntil(record.nextPeriodicExam) > 30 ? "valid" : "expiring"} />
                    <CertRow label="5-year Structural Test" value={record.structuralTestDate} status="valid" />
                    <CertRow label="2.5-year Intermediate Test" value={record.intermediateTestDate} status="valid" />
                    {record.atpPlateValidity && (
                      <CertRow label="ATP Plate Validity (REEFER)" value={record.atpPlateValidity} status={daysUntil(record.atpPlateValidity) > 60 ? "valid" : "expiring"} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {(record.category === "TANK" || record.category === "REEFER") && (
              <TabsContent value="typespec">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {record.category === "TANK" && (
                        <>
                          <SpecRow label="Shell material" value={record.tankShellMaterial ?? "—"} />
                          <SpecRow label="Pressure" value={record.tankPressureBar !== undefined ? `${record.tankPressureBar} bar` : "—"} />
                          <SpecRow label="Capacity" value={record.tankCapacityL !== undefined ? `${record.tankCapacityL.toLocaleString()} L` : "—"} />
                          <SpecRow label="IMO class" value={record.tankImoClass ?? "—"} />
                        </>
                      )}
                      {record.category === "REEFER" && (
                        <>
                          <SpecRow label="Refrigerant" value={record.reeferRefrigerant ?? "—"} />
                          <SpecRow label="Unit model" value={record.reeferUnitModel ?? "—"} />
                          <SpecRow label="Setpoint range" value={record.reeferSetpointMinC !== undefined ? `${record.reeferSetpointMinC}°C → ${record.reeferSetpointMaxC}°C` : "—"} />
                          <SpecRow label="ATP plate validity" value={record.atpPlateValidity ?? "—"} />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                New Survey
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Droplets className="mr-2 h-4 w-4" />
                New Cleaning Job
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Wrench className="mr-2 h-4 w-4" />
                New Repair Job
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Survey:</span>
                <span>{mockChrome.lastSurvey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Cleaning:</span>
                <span>{mockChrome.lastCleaning}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Inspection:</span>
                <span className="gecko-text-warning">
                  {mockChrome.nextInspection}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </DetailPageShell>
    </AppShell>
  );
}

function SpecRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between p-2 rounded bg-muted/50">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function CertRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: "valid" | "expiring" | "expired";
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <Icon name="fileText" size={16} className="text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground gecko-text-mono">{value}</span>
        </div>
      </div>
      <Badge variant={status === "valid" ? "secondary" : "destructive"}>{status}</Badge>
    </div>
  );
}

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  const ms = target.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}
