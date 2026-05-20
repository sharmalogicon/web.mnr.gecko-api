"use client";

/**
 * /tariff/surcharges/new — author a surcharge / discount rule.
 * Phase 7.9-A — migrated to native gecko form primitives.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";

export default function NewSurchargePage() {
  const router = useRouter();

  return (
    <AppShell>
      <FormPageShell
        backHref="/tariff/surcharges"
        backLabel="Back to Surcharges"
        title="New surcharge"
        onCancel={() => router.push("/tariff/surcharges")}
        onSave={() => router.push("/tariff/surcharges")}
        saveLabel="Save Surcharge"
      >
        {/* Basic Information */}
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            <h2 className="gecko-card-title">Basic Information</h2>

            <div className="gecko-field">
              <label htmlFor="name" className="gecko-field-label">
                Name <span className="gecko-field-required">*</span>
              </label>
              <input
                id="name"
                className="gecko-input"
                placeholder="e.g., Weekend Surcharge"
              />
            </div>

            <div className="gecko-field">
              <span className="gecko-field-label">
                Type <span className="gecko-field-required">*</span>
              </span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="type" value="surcharge" defaultChecked />
                  <span className="gecko-field-label">Surcharge (adds to price)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="type" value="discount" />
                  <span className="gecko-field-label">Discount (reduces price)</span>
                </label>
              </div>
            </div>

            <div className="gecko-field">
              <label htmlFor="category" className="gecko-field-label">
                Category <span className="gecko-field-required">*</span>
              </label>
              <select id="category" className="gecko-select" defaultValue="">
                <option value="">Select category...</option>
                <option value="time">Time-Based</option>
                <option value="service">Service-Based</option>
                <option value="equipment">Equipment-Based</option>
                <option value="handling">Handling-Based</option>
                <option value="promotional">Promotional</option>
              </select>
            </div>

            <div className="gecko-field">
              <label htmlFor="description" className="gecko-field-label">Description</label>
              <textarea
                id="description"
                className="gecko-textarea"
                placeholder="Additional charge for services performed on weekends"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Adjustment Value */}
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            <h2 className="gecko-card-title">Adjustment Value</h2>

            <div className="gecko-field">
              <span className="gecko-field-label">
                Calculation Method <span className="gecko-field-required">*</span>
              </span>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input type="radio" name="calc" value="percentage" defaultChecked />
                  <span className="gecko-field-label">Percentage of service total</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="calc" value="fixed" />
                  <span className="gecko-field-label">Fixed amount</span>
                </label>
              </div>
            </div>

            <div className="gecko-field">
              <label htmlFor="value" className="gecko-field-label">
                Value <span className="gecko-field-required">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="value"
                  type="number"
                  step="0.01"
                  className="gecko-input w-[150px]"
                  placeholder="30"
                />
                <span className="gecko-field-helper">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Applicability */}
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            <h2 className="gecko-card-title">Applicability</h2>

            <div className="gecko-field">
              <span className="gecko-field-label">
                Applies To <span className="gecko-field-required">*</span>
              </span>
              <div className="gecko-bordered-group flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" id="all-services" />
                  <span className="gecko-field-label">All Services</span>
                </label>
                <hr className="gecko-divider" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "survey", label: "Survey & Inspection" },
                    { id: "cleaning", label: "Cleaning" },
                    { id: "repair", label: "Repair" },
                    { id: "storage", label: "Storage" },
                    { id: "modification", label: "Modification" },
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2">
                      <input type="checkbox" id={opt.id} />
                      <span className="gecko-field-label">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="gecko-field">
              <span className="gecko-field-label">Equipment Types</span>
              <div className="gecko-bordered-group">
                <label className="flex items-center gap-2">
                  <input type="checkbox" id="all-equipment" defaultChecked />
                  <span className="gecko-field-label">All Equipment Types</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            <h2 className="gecko-card-title">Conditions</h2>

            <div className="gecko-field">
              <span className="gecko-field-label">
                When to Apply <span className="gecko-field-required">*</span>
              </span>
              <div className="flex flex-col gap-2">
                {[
                  { id: "always", label: "Always (when applicable)" },
                  { id: "time", label: "Time-based rules" },
                  { id: "date", label: "Date range" },
                  { id: "manual", label: "Manual (user selects)" },
                ].map((opt, i) => (
                  <label key={opt.id} className="flex items-center gap-2">
                    <input type="radio" name="when" value={opt.id} defaultChecked={i === 0} />
                    <span className="gecko-field-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Rules */}
            <div className="gecko-bordered-group flex flex-col gap-3">
              <span className="gecko-field-label">Time Rules</span>
              <div className="gecko-field">
                <span className="gecko-field-helper">Days:</span>
                <div className="flex gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <label key={day} className="flex items-center gap-1">
                      <input type="checkbox" id={day.toLowerCase()} />
                      <span className="gecko-field-helper">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="gecko-field">
                <span className="gecko-field-helper">Hours:</span>
                <div className="flex items-center gap-2">
                  <input type="time" className="gecko-input w-[150px]" defaultValue="00:00" />
                  <span className="gecko-field-helper">to</span>
                  <input type="time" className="gecko-input w-[150px]" defaultValue="23:59" />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="gecko-bordered-group flex flex-col gap-3">
              <span className="gecko-field-label">Date Range</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="gecko-field">
                  <label htmlFor="start-date" className="gecko-field-label">Start Date</label>
                  <input id="start-date" type="date" className="gecko-input" />
                </div>
                <div className="gecko-field">
                  <label htmlFor="end-date" className="gecko-field-label">End Date</label>
                  <input id="end-date" type="date" className="gecko-input" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="gecko-card">
          <div className="gecko-card-body">
            <label className="flex items-center gap-2">
              <input type="checkbox" id="active" defaultChecked />
              <span className="gecko-field-label">
                Active (surcharge will be immediately available)
              </span>
            </label>
          </div>
        </div>
      </FormPageShell>
    </AppShell>
  );
}
