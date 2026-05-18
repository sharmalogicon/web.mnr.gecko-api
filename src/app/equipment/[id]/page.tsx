"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, History, FileText, Wrench, Droplets, ClipboardCheck } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockEquipment = {
  id: "MSKU2234567",
  type: "ISO Tank",
  typeCode: "T11",
  capacity: "26,000L",
  owner: "CMA CGM",
  manufacturer: "CIMC",
  yearBuilt: 2019,
  status: "available" as const,
  location: "Zone A, Bay 12",
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

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <AppShell>
      <PageHeader
        title={`Equipment ${mockEquipment.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Equipment", href: "/equipment" },
          { label: mockEquipment.id },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline">
              <History className="mr-2 h-4 w-4" />
              Full History
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Equipment Details</CardTitle>
                <StatusBadge status={mockEquipment.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment ID:</span>
                    <span className="font-mono font-medium">{mockEquipment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{mockEquipment.type} ({mockEquipment.typeCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span>{mockEquipment.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner:</span>
                    <span>{mockEquipment.owner}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span>{mockEquipment.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year Built:</span>
                    <span>{mockEquipment.yearBuilt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span>{mockEquipment.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for History and Specs */}
          <Tabs defaultValue="history">
            <TabsList>
              <TabsTrigger value="history">Service History</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
              <TabsTrigger value="certs">Certifications</TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {mockEquipment.history.map((item, index) => (
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
                    {Object.entries(mockEquipment.specs).map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="certs">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {mockEquipment.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{cert.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">Expires: {cert.expiry}</span>
                          <Badge variant={cert.status === "valid" ? "secondary" : "destructive"}>
                            {cert.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
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
                <span>{mockEquipment.lastSurvey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Cleaning:</span>
                <span>{mockEquipment.lastCleaning}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next Inspection:</span>
                <span
                  style={{
                    color: "var(--gecko-warning-600)",
                    fontWeight: "var(--gecko-font-weight-medium)",
                  }}
                >
                  {mockEquipment.nextInspection}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/equipment")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment
        </Button>
      </div>
    </AppShell>
  );
}
