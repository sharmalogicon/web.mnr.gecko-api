"use client";

/**
 * /tariff/liner/new — create a new liner tariff agreement.
 * Phase 7.9-A — migrated to native gecko form primitives.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";

import { linerTariffRepo } from "@/lib/repos";
import { customers } from "@/data/seed/_shared/customers";
import type { LinerTariffCard } from "@/lib/types";

export default function NewLinerTariffPage() {
  const router = useRouter();
  const [agentCode, setAgentCode] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState(
    `${new Date().getFullYear()}-12-31`,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Liners that don't yet have a card
  const existingAgents = new Set(linerTariffRepo.list().map((c) => c.agentCode));
  const availableLiners = customers.filter((c) => !existingAgents.has(c.code));

  const onCreate = () => {
    setSubmitError(null);
    if (!agentCode) return setSubmitError("Pick a liner");
    if (!salesPerson) return setSubmitError("Sales person required");

    const today = new Date().toISOString().slice(0, 10);
    const card: LinerTariffCard = {
      id: `LNR-${agentCode.replace(/^C-/, "")}-DRAFT-${Date.now()}`,
      agentCode,
      quotationNo: "",
      salesPerson,
      contactNo: contactNo || undefined,
      effectiveDate,
      expiryDate,
      status: "DRAFT",
      createdBy: "CURRENT-USER",
      createdOn: today,
      freeDays: {
        fullExport: { normal: 7, reefer: 5, dg: 3 },
        fullImport: { normal: 7, reefer: 5, dg: 3 },
        emptyImport: { normal: 14, reefer: 7 },
      },
      waiveStorageForEmptyDmContainers: false,
      rows: [],
    };
    try {
      linerTariffRepo.create(card);
      router.push(`/tariff/liner/${encodeURIComponent(agentCode)}/edit`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create liner tariff");
    }
  };

  return (
    <AppShell>
      <FormPageShell
        backHref="/tariff/liner"
        backLabel="Back to Liner Tariffs"
        title="New Liner Tariff Agreement"
        subtitle="Pick the liner, enter the header fields. After save you'll be taken to the edit page to add charge rows."
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
                <label htmlFor="agentCode" className="gecko-field-label">
                  Liner <span className="gecko-field-required">*</span>
                </label>
                <select
                  id="agentCode"
                  className="gecko-select"
                  value={agentCode}
                  onChange={(e) => setAgentCode(e.target.value)}
                >
                  <option value="">Pick a liner without an existing card…</option>
                  {availableLiners.length === 0 ? (
                    <option value="" disabled>
                      All liners already have a tariff card.
                    </option>
                  ) : (
                    availableLiners.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="salesPerson" className="gecko-field-label">
                  Sales person <span className="gecko-field-required">*</span>
                </label>
                <input
                  id="salesPerson"
                  className="gecko-input"
                  value={salesPerson}
                  onChange={(e) => setSalesPerson(e.target.value)}
                  placeholder="YOKPORN"
                />
              </div>
              <div className="gecko-field">
                <label htmlFor="contactNo" className="gecko-field-label">Contact no</label>
                <input
                  id="contactNo"
                  className="gecko-input"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="02-708-0888"
                />
              </div>
              <div />
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
