"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Info } from "lucide-react";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cleaningTypes = [
  { id: "standard", label: "Standard Clean", description: "General purpose cleaning", duration: "2-3 hrs", price: 350 },
  { id: "deep", label: "Deep Clean", description: "Heavy residue removal", duration: "4-6 hrs", price: 550 },
  { id: "chemical", label: "Chemical Wash", description: "Chemical residue cleaning", duration: "4-8 hrs", price: 750 },
  { id: "food-grade", label: "Food Grade", description: "FDA compliant cleaning", duration: "6-8 hrs", price: 850 },
  { id: "steam", label: "Steam Clean", description: "High temp sterilization", duration: "3-5 hrs", price: 450 },
];

export default function NewCleaningPage() {
  const router = useRouter();
  const [tankNumber, setTankNumber] = useState("");
  const [linkedSurvey, setLinkedSurvey] = useState("");
  const [cleaningType, setCleaningType] = useState("");
  const [nextCargo, setNextCargo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [scheduling, setScheduling] = useState("queue");
  const [instructions, setInstructions] = useState("");

  const selectedType = cleaningTypes.find((t) => t.id === cleaningType);

  const handleSubmit = () => {
    // In real app, would submit to API
    router.push("/cleaning");
  };

  return (
    <AppShell>
      <PageHeader
        title="New Cleaning Job"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cleaning", href: "/cleaning" },
          { label: "New Job" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Tank Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Tank Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tank-number">Tank Number *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="tank-number"
                      placeholder="Search tank..."
                      className="pl-9"
                      value={tankNumber}
                      onChange={(e) => setTankNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey">Or link from Survey</Label>
                  <Select value={linkedSurvey} onValueChange={setLinkedSurvey}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select survey..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SRV-001234">SRV-001234 - MSKU2234567</SelectItem>
                      <SelectItem value="SRV-001235">SRV-001235 - TCLU9987654</SelectItem>
                      <SelectItem value="SRV-001236">SRV-001236 - HLXU1122334</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(tankNumber || linkedSurvey) && (
                <div className="rounded-lg border bg-muted/50 p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 mt-0.5" style={{ color: "var(--gecko-info-600)" }} />
                  <div className="text-sm">
                    <p className="font-medium">Tank Info</p>
                    <p className="text-muted-foreground">
                      Customer: CMA CGM | Type: T11 | Previous Cargo: Methanol
                    </p>
                    <p className="text-muted-foreground">
                      Survey: SRV-001234 (Passed) | Last Clean: Oct 15, 2024
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cleaning Details */}
          <Card>
            <CardHeader>
              <CardTitle>Cleaning Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Cleaning Type *</Label>
                <RadioGroup value={cleaningType} onValueChange={setCleaningType}>
                  {cleaningTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem value={type.id} id={type.id} />
                      <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-muted-foreground ml-2">
                          - {type.description} ({type.duration}) - ${type.price}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="next-cargo">Next Cargo (if known)</Label>
                  <Select value={nextCargo} onValueChange={setNextCargo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cargo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="palm-oil">Palm Oil (Food)</SelectItem>
                      <SelectItem value="chemicals">Chemicals</SelectItem>
                      <SelectItem value="methanol">Methanol</SelectItem>
                      <SelectItem value="glycol">Glycol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <RadioGroup
                    value={priority}
                    onValueChange={setPriority}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="urgent" id="urgent" />
                      <Label htmlFor="urgent">Urgent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="express" id="express" />
                      <Label htmlFor="express">Express</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter special cleaning requirements or notes..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={scheduling} onValueChange={setScheduling}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="queue" id="queue" />
                  <Label htmlFor="queue" className="flex-1 cursor-pointer">
                    <span className="font-medium">Add to Queue</span>
                    <span className="text-muted-foreground ml-2">- Next available bay</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value="schedule" id="schedule" />
                  <Label htmlFor="schedule" className="flex-1 cursor-pointer">
                    <span className="font-medium">Schedule for specific time</span>
                  </Label>
                </div>
              </RadioGroup>

              {scheduling === "schedule" && (
                <div className="grid gap-4 sm:grid-cols-3 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bay">Bay</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Available</SelectItem>
                        <SelectItem value="bay1">Bay 1</SelectItem>
                        <SelectItem value="bay2">Bay 2</SelectItem>
                        <SelectItem value="bay3">Bay 3</SelectItem>
                        <SelectItem value="bay4">Bay 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tank:</span>
                  <span>{tankNumber || linkedSurvey || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{selectedType?.label || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="capitalize">{priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduling:</span>
                  <span>{scheduling === "queue" ? "Queue" : "Scheduled"}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Duration:</span>
                  <span>{selectedType?.duration || "-"}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Est. Cost:</span>
                  <span>${selectedType?.price || 0}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button onClick={handleSubmit} disabled={!tankNumber && !linkedSurvey}>
                  Create Cleaning Job
                </Button>
                <Button variant="outline" onClick={() => router.push("/cleaning")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
