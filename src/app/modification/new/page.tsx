"use client";

/**
 * /modification/new — Phase 7.9-D native gecko form primitives.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";

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
      <FormPageShell
        backHref="/modification"
        backLabel="Back to Modifications"
        title="New modification request"
        onCancel={() => router.push("/modification")}
        onSave={handleSubmit}
        saveLabel="Submit Request"
        narrow={false}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Equipment Selection */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Equipment Selection</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="gecko-field">
                    <label htmlFor="equipment" className="gecko-field-label">
                      Equipment Number <span className="gecko-field-required">*</span>
                    </label>
                    <input
                      id="equipment"
                      className="gecko-input"
                      placeholder="Search equipment..."
                      value={equipment}
                      onChange={(e) => setEquipment(e.target.value)}
                    />
                  </div>
                  <div className="gecko-field">
                    <label htmlFor="customer" className="gecko-field-label">
                      Customer <span className="gecko-field-required">*</span>
                    </label>
                    <select
                      id="customer"
                      className="gecko-select"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                    >
                      <option value="">Select customer...</option>
                      <option value="cma">CMA CGM</option>
                      <option value="msc">MSC</option>
                      <option value="maersk">Maersk</option>
                      <option value="hapag">Hapag-Lloyd</option>
                      <option value="one">ONE</option>
                    </select>
                  </div>
                </div>

                {equipment && (
                  <div className="gecko-alert gecko-alert-info flex items-start gap-3">
                    <Icon name="info" size={20} />
                    <div>
                      <p><strong>Equipment Info</strong></p>
                      <p className="gecko-field-helper">
                        Type: ISO Tank (T11) | Owner: CMA CGM | Year: 2019
                      </p>
                      <p className="gecko-field-helper">
                        Current Status: Available | Location: Zone A, Bay 12
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modification Details */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Modification Details</h2>
                <div className="flex flex-col gap-3">
                  <span className="gecko-field-label">
                    Modification Type <span className="gecko-field-required">*</span>
                  </span>
                  <div className="flex flex-col gap-2">
                    {modificationTypes.map((type) => (
                      <label key={type.id} className="gecko-bordered-group flex items-center gap-3">
                        <input
                          type="radio"
                          name="modificationType"
                          value={type.id}
                          checked={modificationType === type.id}
                          onChange={(e) => setModificationType(e.target.value)}
                        />
                        <span className="flex-1">
                          <span className="gecko-field-label">{type.label}</span>
                          <span className="gecko-field-helper"> — {type.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="gecko-field">
                  <label htmlFor="description" className="gecko-field-label">
                    Description <span className="gecko-field-required">*</span>
                  </label>
                  <textarea
                    id="description"
                    className="gecko-textarea"
                    placeholder="Describe the modification in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="gecko-field">
                  <label htmlFor="justification" className="gecko-field-label">Business Justification</label>
                  <textarea
                    id="justification"
                    className="gecko-textarea"
                    placeholder="Explain why this modification is needed..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Cost & Priority */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Cost &amp; Priority</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="gecko-field">
                    <label htmlFor="cost" className="gecko-field-label">Estimated Cost ($)</label>
                    <input
                      id="cost"
                      type="number"
                      className="gecko-input"
                      placeholder="0.00"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                    />
                  </div>
                  <div className="gecko-field">
                    <span className="gecko-field-label">Priority</span>
                    <div className="flex gap-4">
                      {(["normal", "high", "urgent"] as const).map((p) => (
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
              </div>
            </div>

            {/* Attachments */}
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Attachments</h2>
                <div className="gecko-photo-placeholder">
                  <div>
                    <Icon name="upload" size={32} />
                    <p className="gecko-field-label">Drag &amp; drop files here, or click to browse</p>
                    <p className="gecko-field-helper">Supported: PDF, JPG, PNG (max 10MB)</p>
                    <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm mt-4">
                      Browse Files
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div>
            <div className="gecko-card sticky top-6">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Request Summary</h2>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Equipment:</span>
                    <span className="gecko-text-mono">{equipment || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Customer:</span>
                    <span className="capitalize">{customer || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Type:</span>
                    <span>{modificationTypes.find((t) => t.id === modificationType)?.label || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Priority:</span>
                    <span className="capitalize">{priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="gecko-field-helper">Est. Cost:</span>
                    <span>{estimatedCost ? `$${estimatedCost}` : "-"}</span>
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
