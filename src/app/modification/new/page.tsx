"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Info, Upload } from "lucide-react";
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

const modificationTypes = [
  { id: "heating", label: "Heating System Upgrade", description: "Install or upgrade tank heating system" },
  { id: "valve", label: "Valve Replacement", description: "Replace or upgrade discharge valves" },
  { id: "insulation", label: "Insulation Upgrade", description: "Improve tank insulation" },
  { id: "safety", label: "Safety Equipment", description: "Add safety equipment or systems" },
  { id: "frame", label: "Frame Reinforcement", description: "Strengthen frame structure" },
  { id: "refrigeration", label: "Refrigeration Upgrade", description: "Install or upgrade refrigeration system" },
  { id: "other", label: "Other", description: "Custom modification request" },
];

export default function NewModificationPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState("");
  const [customer, setCustomer] = useState("");
  const [modificationType, setModificationType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [justification, setJustification] = useState("");

  const handleSubmit = () => {
    router.push("/modification");
  };

  return (
    <AppShell>
      <PageHeader
        title="New Modification Request"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Modification", href: "/modification" },
          { label: "New Request" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Equipment Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipment Number *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="equipment"
                      placeholder="Search equipment..."
                      className="pl-9"
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={customer} onValueChange={setCustomer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cma">CMA CGM</SelectItem>
                      <SelectItem value="msc">MSC</SelectItem>
                      <SelectItem value="maersk">Maersk</SelectItem>
                      <SelectItem value="hapag">Hapag-Lloyd</SelectItem>
                      <SelectItem value="one">ONE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {equipment && (
                <div className="rounded-lg border bg-muted/50 p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 mt-0.5" style={{ color: "var(--gecko-info-600)" }} />
                  <div className="text-sm">
                    <p className="font-medium">Equipment Info</p>
                    <p className="text-muted-foreground">
                      Type: ISO Tank (T11) | Owner: CMA CGM | Year: 2019
                    </p>
                    <p className="text-muted-foreground">
                      Current Status: Available | Location: Zone A, Bay 12
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modification Details */}
          <Card>
            <CardHeader>
              <CardTitle>Modification Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Modification Type *</Label>
                <RadioGroup value={modificationType} onValueChange={setModificationType}>
                  {modificationTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem value={type.id} id={type.id} />
                      <Label htmlFor={type.id} className="flex-1 cursor-pointer">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          - {type.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the modification in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Business Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Explain why this modification is needed..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost & Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Cost & Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cost">Estimated Cost ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <RadioGroup
                    value={priority}
                    onValueChange={setPriority}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="priority-normal" />
                      <Label htmlFor="priority-normal">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="priority-high" />
                      <Label htmlFor="priority-high">High</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="urgent" id="priority-urgent" />
                      <Label htmlFor="priority-urgent">Urgent</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drag & drop files here, or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: PDF, JPG, PNG (max 10MB)
                </p>
                <Button variant="outline" className="mt-4">
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Request Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Equipment:</span>
                  <span className="font-mono">{equipment || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="capitalize">{customer || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>
                    {modificationTypes.find((t) => t.id === modificationType)?.label || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="capitalize">{priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Cost:</span>
                  <span>{estimatedCost ? `$${estimatedCost}` : "-"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!equipment || !customer || !modificationType || !description}
                >
                  Submit Request
                </Button>
                <Button variant="outline" onClick={() => router.push("/modification")}>
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
