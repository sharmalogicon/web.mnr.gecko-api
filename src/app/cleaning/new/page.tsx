"use client";

/**
 * /cleaning/new — Phase 7.9-D native gecko form primitives.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";

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
    router.push("/cleaning");
  };

  return (
    <AppShell>
      <FormPageShell
        backHref="/cleaning"
        backLabel="Back to Cleaning"
        title="New cleaning job"
        onCancel={() => router.push("/cleaning")}
        onSave={handleSubmit}
        saveLabel="Create Cleaning Job"
        narrow={false}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Tank Selection */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Tank Selection</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="gecko-field">
                    <label htmlFor="tank-number" className="gecko-field-label">
                      Tank Number <span className="gecko-field-required">*</span>
                    </label>
                    <input
                      id="tank-number"
                      className="gecko-input"
                      placeholder="Search tank..."
                      value={tankNumber}
                      onChange={(e) => setTankNumber(e.target.value)}
                    />
                  </div>
                  <div className="gecko-field">
                    <label htmlFor="survey" className="gecko-field-label">Or link from Survey</label>
                    <select
                      id="survey"
                      className="gecko-select"
                      value={linkedSurvey}
                      onChange={(e) => setLinkedSurvey(e.target.value)}
                    >
                      <option value="">Select survey...</option>
                      <option value="SRV-001234">SRV-001234 - MSKU2234567</option>
                      <option value="SRV-001235">SRV-001235 - TCLU9987654</option>
                      <option value="SRV-001236">SRV-001236 - HLXU1122334</option>
                    </select>
                  </div>
                </div>

                {(tankNumber || linkedSurvey) && (
                  <div className="gecko-alert gecko-alert-info flex items-start gap-3">
                    <Icon name="info" size={20} />
                    <div>
                      <p>
                        <strong>Tank Info</strong>
                      </p>
                      <p className="gecko-field-helper">
                        Customer: CMA CGM | Type: T11 | Previous Cargo: Methanol
                      </p>
                      <p className="gecko-field-helper">
                        Survey: SRV-001234 (Passed) | Last Clean: Oct 15, 2024
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cleaning Details */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Cleaning Details</h2>
                <div className="flex flex-col gap-3">
                  <span className="gecko-field-label">
                    Cleaning Type <span className="gecko-field-required">*</span>
                  </span>
                  <div className="flex flex-col gap-2">
                    {cleaningTypes.map((type) => (
                      <label
                        key={type.id}
                        className="gecko-bordered-group flex items-center gap-3"
                      >
                        <input
                          type="radio"
                          name="cleaningType"
                          value={type.id}
                          checked={cleaningType === type.id}
                          onChange={(e) => setCleaningType(e.target.value)}
                        />
                        <span className="flex-1">
                          <span className="gecko-field-label">{type.label}</span>
                          <span className="gecko-field-helper">
                            {" "}— {type.description} ({type.duration}) - ${type.price}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="gecko-field">
                    <label htmlFor="next-cargo" className="gecko-field-label">Next Cargo (if known)</label>
                    <select
                      id="next-cargo"
                      className="gecko-select"
                      value={nextCargo}
                      onChange={(e) => setNextCargo(e.target.value)}
                    >
                      <option value="">Select cargo...</option>
                      <option value="palm-oil">Palm Oil (Food)</option>
                      <option value="chemicals">Chemicals</option>
                      <option value="methanol">Methanol</option>
                      <option value="glycol">Glycol</option>
                    </select>
                  </div>
                  <div className="gecko-field">
                    <span className="gecko-field-label">Priority</span>
                    <div className="flex gap-4">
                      {(["normal", "urgent", "express"] as const).map((p) => (
                        <label key={p} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="priority"
                            value={p}
                            checked={priority === p}
                            onChange={(e) => setPriority(e.target.value)}
                          />
                          <span className="gecko-field-label">
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="gecko-field">
                  <label htmlFor="instructions" className="gecko-field-label">Special Instructions</label>
                  <textarea
                    id="instructions"
                    className="gecko-textarea"
                    placeholder="Enter special cleaning requirements or notes..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Scheduling</h2>

                <div className="flex flex-col gap-2">
                  <label className="gecko-bordered-group flex items-center gap-3">
                    <input
                      type="radio"
                      name="scheduling"
                      value="queue"
                      checked={scheduling === "queue"}
                      onChange={(e) => setScheduling(e.target.value)}
                    />
                    <span className="flex-1">
                      <span className="gecko-field-label">Add to Queue</span>
                      <span className="gecko-field-helper">{" "}— Next available bay</span>
                    </span>
                  </label>
                  <label className="gecko-bordered-group flex items-center gap-3">
                    <input
                      type="radio"
                      name="scheduling"
                      value="schedule"
                      checked={scheduling === "schedule"}
                      onChange={(e) => setScheduling(e.target.value)}
                    />
                    <span className="flex-1">
                      <span className="gecko-field-label">Schedule for specific time</span>
                    </span>
                  </label>
                </div>

                {scheduling === "schedule" && (
                  <div className="grid gap-4 sm:grid-cols-3 ml-6">
                    <div className="gecko-field">
                      <label htmlFor="date" className="gecko-field-label">Date</label>
                      <input id="date" type="date" className="gecko-input" />
                    </div>
                    <div className="gecko-field">
                      <label htmlFor="time" className="gecko-field-label">Time</label>
                      <input id="time" type="time" className="gecko-input" />
                    </div>
                    <div className="gecko-field">
                      <label htmlFor="bay" className="gecko-field-label">Bay</label>
                      <select id="bay" className="gecko-select" defaultValue="">
                        <option value="">Any</option>
                        <option value="any">Any Available</option>
                        <option value="bay1">Bay 1</option>
                        <option value="bay2">Bay 2</option>
                        <option value="bay3">Bay 3</option>
                        <option value="bay4">Bay 4</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="gecko-card sticky top-6">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Job Summary</h2>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Tank:</span>
                    <span>{tankNumber || linkedSurvey || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Type:</span>
                    <span>{selectedType?.label || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Priority:</span>
                    <span className="capitalize">{priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Scheduling:</span>
                    <span>{scheduling === "queue" ? "Queue" : "Scheduled"}</span>
                  </div>
                </div>

                <div className="border-t pt-4 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Est. Duration:</span>
                    <span>{selectedType?.duration || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-label">Est. Cost:</span>
                    <span>${selectedType?.price || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FormPageShell>
    </AppShell>
  );
}
