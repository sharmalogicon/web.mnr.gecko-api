"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Phone, MapPin, Clock, AlertTriangle, User, FileText } from "lucide-react";
import { AppShell } from "@/components/layout";
import { StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const mockEmergency = {
  id: "EMG-001234",
  equipment: "MSKU2234567",
  customer: "CMA CGM",
  type: "leak" as const,
  severity: "critical" as const,
  status: "responding" as "active" | "responding" | "resolved" | "closed",
  location: "Bay 2, Zone A",
  reportedAt: "Dec 12, 2024 10:15 AM",
  reportedBy: "Mike Johnson",
  description: "Significant leak detected from bottom discharge valve. Product appears to be leaking at approximately 1 liter per minute.",
  responders: [
    { name: "John Smith", role: "Lead Technician", arrived: "10:25 AM" },
    { name: "Sarah Lee", role: "Safety Officer", arrived: "10:30 AM" },
  ],
  timeline: [
    { time: "10:15 AM", event: "Emergency reported", user: "Mike Johnson" },
    { time: "10:18 AM", event: "Alert dispatched to response team", user: "System" },
    { time: "10:25 AM", event: "First responder on scene", user: "John Smith" },
    { time: "10:30 AM", event: "Safety perimeter established", user: "Sarah Lee" },
    { time: "10:35 AM", event: "Leak contained with temporary seal", user: "John Smith" },
  ],
  actions: [
    "Valve isolated and secured",
    "Spill contained - approx 50L collected",
    "Area cordoned off",
    "Repair team notified",
  ],
};

const severityBadge: Record<"critical" | "high" | "medium", string> = {
  critical: "gecko-badge-error",
  high: "gecko-badge-accent",
  medium: "gecko-badge-warning",
};

const typeLabels = {
  leak: "Leak",
  fire: "Fire",
  spill: "Chemical Spill",
  structural: "Structural Damage",
  other: "Other",
};

export default function EmergencyDetailPage() {
  const params = useParams();
  const router = useRouter();

  return (
    <AppShell>
      <div className="mnr-page-actions">
        <div className="mnr-page-actions-spacer" />
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
        <Button variant="destructive">
          <Phone className="mr-2 h-4 w-4" />
          Call for Backup
        </Button>
      </div>

      {/* Alert Banner */}
      {mockEmergency.status !== "closed" && (
        <div
          className={cn(
            "gecko-alert mb-6",
            mockEmergency.severity === "critical"
              ? "gecko-alert-error"
              : "gecko-alert-warning"
          )}
          style={{ display: "block", borderWidth: 2 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle
                className={cn(
                  "h-6 w-6",
                  mockEmergency.severity === "critical" && "animate-pulse"
                )}
                style={{
                  color:
                    mockEmergency.severity === "critical"
                      ? "var(--gecko-error-600)"
                      : "var(--gecko-warning-600)",
                }}
              />
              <div>
                <span className="font-bold text-lg">
                  {mockEmergency.severity.toUpperCase()} - {typeLabels[mockEmergency.type]}
                </span>
                <p className="text-sm text-muted-foreground">{mockEmergency.location}</p>
              </div>
            </div>
            <StatusBadge status={mockEmergency.status} />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Incident Details */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Equipment:</span>
                    <span className="font-mono font-medium">{mockEmergency.equipment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{mockEmergency.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{typeLabels[mockEmergency.type]}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity:</span>
                    <span className={`gecko-badge ${severityBadge[mockEmergency.severity]}`}>
                      {mockEmergency.severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reported:</span>
                    <span>{mockEmergency.reportedAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reported By:</span>
                    <span>{mockEmergency.reportedBy}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Description:</p>
                <p className="text-sm text-muted-foreground">{mockEmergency.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Response Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Response Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEmergency.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      {index < mockEmergency.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-border flex-1 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{item.time}</span>
                        <span className="font-medium">{item.event}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">by {item.user}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions Taken */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mockEmergency.actions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "var(--gecko-radius-full)",
                        background: "var(--gecko-success-500)",
                      }}
                    />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Add Update */}
          <Card>
            <CardHeader>
              <CardTitle>Add Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea placeholder="Enter status update..." rows={3} />
              <Button>Post Update</Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Responders on Scene</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockEmergency.responders.map((responder, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{responder.name}</p>
                      <p className="text-sm text-muted-foreground">{responder.role}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {responder.arrived}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{mockEmergency.location}</span>
              </div>
              <div className="h-40 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                Map Placeholder
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                Mark as Resolved
              </Button>
              <Button className="w-full" variant="outline">
                Create Repair Job
              </Button>
              <Button className="w-full" variant="outline">
                Close Incident
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push("/emergency")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Emergency
        </Button>
      </div>
    </AppShell>
  );
}
