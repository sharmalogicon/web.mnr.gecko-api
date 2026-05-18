"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const damageTypes = [
  { id: "valve", label: "Valve/Fitting Damage" },
  { id: "shell", label: "Shell Damage" },
  { id: "frame", label: "Frame Damage" },
  { id: "insulation", label: "Insulation Damage" },
  { id: "heating", label: "Heating System" },
  { id: "walkway", label: "Walkway/Ladder" },
  { id: "dataplate", label: "Data Plate" },
  { id: "coating", label: "Coating/Lining" },
];

const mockSurveys = [
  { id: "SRV-001234", equipment: "MSKU2234567", status: "Failed" },
  { id: "SRV-001235", equipment: "TCLU9987654", status: "Failed" },
  { id: "SRV-001230", equipment: "HLXU1122334", status: "Failed" },
];

const mockParts = [
  { id: "1", name: 'Ball Valve 3" DN80', price: 450 },
  { id: "2", name: "Gasket Set T11 Standard", price: 85 },
  { id: "3", name: "Teflon Tape Roll", price: 12 },
  { id: "4", name: 'Butterfly Valve 4"', price: 280 },
  { id: "5", name: "Pressure Gauge", price: 95 },
];

export default function NewRepairPage() {
  const router = useRouter();
  const [severity, setSeverity] = useState("medium");
  const [selectedDamageTypes, setSelectedDamageTypes] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<{ id: string; qty: number }[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const toggleDamageType = (id: string) => {
    setSelectedDamageTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addPart = () => {
    setSelectedParts([...selectedParts, { id: "", qty: 1 }]);
  };

  const removePart = (index: number) => {
    setSelectedParts(selectedParts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: "id" | "qty", value: string | number) => {
    const updated = [...selectedParts];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedParts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    router.push("/repair");
  };

  return (
    <AppShell>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Dashboard
        </Link>
        <Icon name="chevronRight" size={16} className="mx-2" />
        <Link href="/repair" className="hover:text-foreground">
          Repair
        </Link>
        <Icon name="chevronRight" size={16} className="mx-2" />
        <span className="text-foreground font-medium">New Repair Job</span>
      </nav>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Tank Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equipment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tank-number">Equipment Number *</Label>
                    <div className="relative">
                      <Input
                        id="tank-number"
                        placeholder="e.g., MSKU2234567"
                        className="pr-10"
                      />
                      <Icon name="search" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="survey-link">Link from Survey</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a failed survey" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockSurveys.map((survey) => (
                          <SelectItem key={survey.id} value={survey.id}>
                            {survey.id} ({survey.equipment}) - {survey.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Damage Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Damage Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Severity */}
                <div className="space-y-3">
                  <Label>Severity *</Label>
                  <RadioGroup
                    value={severity}
                    onValueChange={setSeverity}
                    className="space-y-2"
                  >
                    <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="critical" id="critical" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="critical" className="font-medium cursor-pointer">
                          Critical
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Safety risk, immediate attention required
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="high" id="high" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="high" className="font-medium cursor-pointer">
                          High
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Major damage affecting operation
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="medium" id="medium" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="medium" className="font-medium cursor-pointer">
                          Medium
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Moderate damage, can wait
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50">
                      <RadioGroupItem value="low" id="low" className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor="low" className="font-medium cursor-pointer">
                          Low
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Minor cosmetic or non-urgent
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Damage Type */}
                <div className="space-y-3">
                  <Label>Damage Type *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {damageTypes.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={type.id}
                          checked={selectedDamageTypes.includes(type.id)}
                          onCheckedChange={() => toggleDamageType(type.id)}
                        />
                        <Label
                          htmlFor={type.id}
                          className="text-sm cursor-pointer"
                        >
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="other" />
                    <Label htmlFor="other" className="text-sm">
                      Other:
                    </Label>
                    <Input className="h-8 flex-1" placeholder="Specify other damage" />
                  </div>
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Damage Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the damage in detail..."
                    rows={4}
                  />
                </div>

                <Separator />

                {/* Photos */}
                <div className="space-y-3">
                  <Label>Damage Photos *</Label>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex h-24 w-24 items-center justify-center rounded-lg border bg-muted/50"
                      >
                        <div className="text-center">
                          <Icon name="upload" size={24} className="mx-auto text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Photo {i}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border border-dashed hover:bg-muted/50"
                    >
                      <Icon name="plus" size={24} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Upload photos of the damage. Drag and drop or click to select.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Preliminary Estimate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preliminary Estimate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="labor-hours">Labor Hours (est)</Label>
                    <Input id="labor-hours" type="number" placeholder="e.g., 8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration (days)</Label>
                    <Input id="duration" type="number" placeholder="e.g., 3" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Parts Required</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addPart}>
                      <Icon name="plus" size={16} className="mr-2" />
                      Add Part
                    </Button>
                  </div>
                  {selectedParts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No parts added yet. Click &quot;Add Part&quot; to add required parts.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedParts.map((part, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={part.id}
                            onValueChange={(value) => updatePart(index, "id", value)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select a part" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockParts.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} - ${p.price}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            className="w-20"
                            value={part.qty}
                            onChange={(e) =>
                              updatePart(index, "qty", parseInt(e.target.value) || 1)
                            }
                            min={1}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePart(index)}
                          >
                            <Icon name="x" size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Summary */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity</span>
                    <span
                      className="font-medium capitalize"
                      style={{
                        color:
                          severity === "critical"
                            ? "var(--gecko-error-600)"
                            : severity === "high"
                              ? "var(--gecko-accent-600)"
                              : severity === "medium"
                                ? "var(--gecko-warning-600)"
                                : severity === "low"
                                  ? "var(--gecko-success-600)"
                                  : undefined,
                      }}
                    >
                      {severity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Damage Types</span>
                    <span className="font-medium">
                      {selectedDamageTypes.length || "None selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parts</span>
                    <span className="font-medium">
                      {selectedParts.length || "None added"}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button type="submit" className="w-full">
                    Create Repair Job
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/repair")}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
