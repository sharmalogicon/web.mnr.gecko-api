"use client";

/**
 * /tariff/vendor/new — onboard a vendor's tariff card.
 * Phase 7.9-A — migrated to native gecko form primitives.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";

import { vendorTariffRepo } from "@/lib/repos";
import { vendors } from "@/data/seed/_shared/vendors";
import type { VendorTariffCard } from "@/lib/types";

export default function NewVendorTariffPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState("");
  const [procurementContact, setProcurementContact] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState(
    `${new Date().getFullYear()}-12-31`,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const existing = new Set(vendorTariffRepo.list().map((c) => c.vendorId));
  const availableVendors = vendors.filter((v) => !existing.has(v.id));

  const onCreate = () => {
    setSubmitError(null);
    if (!vendorId) return setSubmitError("Pick a vendor");
    if (!procurementContact) return setSubmitError("Procurement contact required");

    const today = new Date().toISOString().slice(0, 10);
    const card: VendorTariffCard = {
      id: `VND-${vendorId}-DRAFT-${Date.now()}`,
      vendorId,
      quotationNo: "",
      procurementContact,
      effectiveDate,
      expiryDate,
      status: "DRAFT",
      createdBy: "CURRENT-USER",
      createdOn: today,
      rows: [],
    };
    try {
      vendorTariffRepo.create(card);
      router.push(`/tariff/vendor/${encodeURIComponent(vendorId)}/edit`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create vendor tariff");
    }
  };

  return (
    <AppShell>
      <FormPageShell
        backHref="/tariff/vendor"
        backLabel="Back to Vendor Tariffs"
        title="Onboard Vendor — new tariff card"
        subtitle="Pick the vendor + procurement contact. You'll add service-rate rows on the next page."
        onCancel={() => router.back()}
        onSave={onCreate}
        saveLabel="Create and add rows"
      >
        <div className="gecko-card">
          <div className="gecko-card-body flex flex-col gap-4">
            {submitError && (
              <div className="gecko-alert gecko-alert-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="gecko-field">
                <label htmlFor="vendorId" className="gecko-field-label">
                  Vendor <span className="gecko-field-required">*</span>
                </label>
                <select
                  id="vendorId"
                  className="gecko-select"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Pick a vendor without a card…</option>
                  {availableVendors.length === 0 ? (
                    <option value="" disabled>
                      All vendors already have tariff cards.
                    </option>
                  ) : (
                    availableVendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.id} — {v.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="procurementContact" className="gecko-field-label">
                  Procurement contact <span className="gecko-field-required">*</span>
                </label>
                <input
                  id="procurementContact"
                  className="gecko-input"
                  value={procurementContact}
                  onChange={(e) => setProcurementContact(e.target.value)}
                  placeholder="PROC-TH-01"
                />
              </div>
              <div className="gecko-field">
                <label htmlFor="effectiveDate" className="gecko-field-label">
                  Effective date <span className="gecko-field-required">*</span>
                </label>
                <input
                  id="effectiveDate"
                  type="date"
                  className="gecko-input"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                />
              </div>
              <div className="gecko-field">
                <label htmlFor="expiryDate" className="gecko-field-label">
                  Expiry date <span className="gecko-field-required">*</span>
                </label>
                <input
                  id="expiryDate"
                  type="date"
                  className="gecko-input"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </FormPageShell>
    </AppShell>
  );
}
