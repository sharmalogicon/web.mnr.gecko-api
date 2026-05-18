"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Camera, Check } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Tank Info" },
  { id: 2, label: "Inspection" },
  { id: 3, label: "Review" },
];

const checklistItems = [
  { id: "frame", label: "Frame condition", category: "External" },
  { id: "shell", label: "Shell condition", category: "External" },
  { id: "walkway", label: "Walkway & ladder", category: "External" },
  { id: "dataplate", label: "Data plate legibility", category: "External" },
  { id: "interior", label: "Tank interior cleanliness", category: "Internal" },
  { id: "residue", label: "Cargo residue check", category: "Internal" },
  { id: "coating", label: "Internal coating condition", category: "Internal" },
  { id: "topvalve", label: "Top discharge valve", category: "Valves" },
  { id: "bottomvalve", label: "Bottom discharge valve", category: "Valves" },
  { id: "reliefvalve", label: "Pressure relief valve", category: "Valves" },
  { id: "gaskets", label: "Gaskets & seals", category: "Valves" },
  { id: "pressure", label: "Pressure test (@ 4 bar)", category: "Testing" },
  { id: "vacuum", label: "Vacuum test", category: "Testing" },
];

export default function NewSurveyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [tankNumber, setTankNumber] = useState("");
  const [customer, setCustomer] = useState("");
  const [surveyType, setSurveyType] = useState("");
  const [previousCargo, setPreviousCargo] = useState("");
  const [nextCargo, setNextCargo] = useState("");
  const [checklistResults, setChecklistResults] = useState<Record<string, string>>({});
  const [checklistNotes, setChecklistNotes] = useState<Record<string, string>>({});
  const [overallResult, setOverallResult] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    // In real app, would submit to API
    router.push("/survey");
  };

  const toggleRecommendation = (rec: string) => {
    setRecommendations((prev) =>
      prev.includes(rec) ? prev.filter((r) => r !== rec) : [...prev, rec]
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="New Tank Survey"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Survey", href: "/survey" },
          { label: "New Survey" },
        ]}
      />

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium",
                  currentStep >= step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  "ml-2 text-sm font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-0.5 mx-4",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Tank Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tank Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tank-number">Tank Number *</Label>
              <div className="flex gap-2">
                <Input
                  id="tank-number"
                  placeholder="Enter tank number or scan barcode..."
                  value={tankNumber}
                  onChange={(e) => setTankNumber(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {tankNumber && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium mb-2">Tank found in registry</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Type: T11 (26,000L)</div>
                  <div>Owner: CMA CGM</div>
                  <div>Last Survey: Oct 15, 2024</div>
                  <div>Status: Available</div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="previous-cargo">Previous Cargo</Label>
                <Select value={previousCargo} onValueChange={setPreviousCargo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="methanol">Methanol</SelectItem>
                    <SelectItem value="palm-oil">Palm Oil</SelectItem>
                    <SelectItem value="chemicals">Chemicals</SelectItem>
                    <SelectItem value="food-grade">Food Grade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="next-cargo">Next Intended Cargo</Label>
                <Select value={nextCargo} onValueChange={setNextCargo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="palm-oil">Palm Oil</SelectItem>
                    <SelectItem value="chemicals">Chemicals</SelectItem>
                    <SelectItem value="food-grade">Food Grade</SelectItem>
                    <SelectItem value="methanol">Methanol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Survey Type *</Label>
              <RadioGroup value={surveyType} onValueChange={setSurveyType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pre-cleaning" id="pre-cleaning" />
                  <Label htmlFor="pre-cleaning" className="font-normal">Pre-Cleaning Survey</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="post-repair" id="post-repair" />
                  <Label htmlFor="post-repair" className="font-normal">Post-Repair Survey</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="storage-entry" id="storage-entry" />
                  <Label htmlFor="storage-entry" className="font-normal">Storage Entry Survey</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="periodic" id="periodic" />
                  <Label htmlFor="periodic" className="font-normal">Periodic Inspection</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Inspection Checklist */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Inspection Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {["External", "Internal", "Valves", "Testing"].map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  {category} Inspection
                </h4>
                <div className="space-y-3">
                  {checklistItems
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <div key={item.id} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={item.id}
                              checked={!!checklistResults[item.id]}
                            />
                            <Label htmlFor={item.id} className="font-medium">
                              {item.label}
                            </Label>
                          </div>
                          <Select
                            value={checklistResults[item.id] || ""}
                            onValueChange={(val) =>
                              setChecklistResults((prev) => ({ ...prev, [item.id]: val }))
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Result" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pass">Pass</SelectItem>
                              <SelectItem value="fail">Fail</SelectItem>
                              <SelectItem value="na">N/A</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="mt-2">
                          <Input
                            placeholder="Notes (optional)..."
                            value={checklistNotes[item.id] || ""}
                            onChange={(e) =>
                              setChecklistNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            <div className="space-y-3">
              <Label>Photos</Label>
              <div className="flex gap-2 flex-wrap">
                {["Front", "Left", "Right", "Rear", "Top"].map((angle) => (
                  <Button key={angle} variant="outline" className="h-20 w-20 flex-col gap-1">
                    <Camera className="h-5 w-5" />
                    <span className="text-xs">{angle}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Survey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Overall Result *</Label>
              <RadioGroup value={overallResult} onValueChange={setOverallResult}>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="pass" id="result-pass" />
                  <Label htmlFor="result-pass" className="flex-1 cursor-pointer">
                    <span
                      style={{
                        fontWeight: "var(--gecko-font-weight-medium)",
                        color: "var(--gecko-success-700)",
                      }}
                    >
                      PASS
                    </span>
                    <span className="text-muted-foreground ml-2">- Tank approved for service</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="conditional" id="result-conditional" />
                  <Label htmlFor="result-conditional" className="flex-1 cursor-pointer">
                    <span
                      style={{
                        fontWeight: "var(--gecko-font-weight-medium)",
                        color: "var(--gecko-warning-700)",
                      }}
                    >
                      CONDITIONAL
                    </span>
                    <span className="text-muted-foreground ml-2">- Requires minor work before service</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="fail" id="result-fail" />
                  <Label htmlFor="result-fail" className="flex-1 cursor-pointer">
                    <span
                      style={{
                        fontWeight: "var(--gecko-font-weight-medium)",
                        color: "var(--gecko-error-700)",
                      }}
                    >
                      FAIL
                    </span>
                    <span className="text-muted-foreground ml-2">- Tank requires repair before service</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label>Recommendations</Label>
              <div className="space-y-2">
                {["Proceed to Cleaning", "Create Repair Job", "Ready for Storage"].map((rec) => (
                  <div key={rec} className="flex items-center space-x-2">
                    <Checkbox
                      id={rec}
                      checked={recommendations.includes(rec)}
                      onCheckedChange={() => toggleRecommendation(rec)}
                    />
                    <Label htmlFor={rec} className="font-normal">{rec}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-3">Summary</h4>
              <div className="space-y-1 text-sm">
                <p>Tank: {tankNumber || "Not specified"}</p>
                <p>Customer: {customer || "Not selected"}</p>
                <p>Survey Type: {surveyType || "Not selected"}</p>
                <p>Checklist: {Object.keys(checklistResults).length}/{checklistItems.length} items completed</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Surveyor Notes</Label>
              <Textarea placeholder="Add any additional notes or observations..." rows={3} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.push("/survey")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Submit Survey</Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
