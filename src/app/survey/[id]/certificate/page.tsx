"use client";

/**
 * /survey/[id]/certificate — PTI certificate (SURV-05).
 * Phase 6 D-03.
 *
 * Renders a print-friendly certificate when the survey is a passing PTI.
 * Uses the browser's native print dialog (window.print()) — no PDF library.
 */

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { equipmentRepo, surveyRepo } from "@/lib/repos";
import { surveyors } from "@/data/seed/_shared/surveyors";

export default function PtiCertificatePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? "");

  const survey = surveyRepo.get(id);
  const equipment = survey ? equipmentRepo.get(survey.equipmentId) : undefined;
  const surveyor = survey ? surveyors.find((s) => s.id === survey.surveyorId) : undefined;

  // Print on mount? No — let the user trigger it via the button. The screen
  // version remains useful even without printing.
  useEffect(() => {
    document.title = `PTI Certificate — ${id}`;
  }, [id]);

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold">Survey not found</h1>
          <p className="text-sm text-muted-foreground">No survey {id} on record.</p>
          <Button asChild>
            <Link href="/survey">Back to surveys</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (survey.type !== "pti" || survey.outcome !== "pass") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <h1 className="text-xl font-semibold">Certificate unavailable</h1>
          <p className="text-sm text-muted-foreground">
            A PTI certificate is only generated for surveys where{" "}
            <code>type === "pti"</code> and <code>outcome === "pass"</code>.
            This survey is <strong>{survey.type}</strong> with outcome{" "}
            <strong>{survey.outcome}</strong>.
          </p>
          <Button asChild variant="outline">
            <Link href={`/survey/${encodeURIComponent(id)}`}>Back to survey</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--gecko-bg-base)",
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      {/* Print-control row — hidden in @media print */}
      <div
        className="max-w-3xl mx-auto mb-6 flex justify-between items-center"
        style={{ printColorAdjust: "exact" }}
        data-print-hidden="true"
      >
        <Button variant="outline" onClick={() => router.back()}>
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back
        </Button>
        <Button onClick={() => window.print()}>
          <Icon name="printer" size={16} className="mr-2" />
          Print certificate
        </Button>
      </div>

      {/* Certificate body */}
      <div
        className="max-w-3xl mx-auto"
        style={{
          background: "var(--gecko-bg-surface)",
          border: "4px double var(--gecko-primary-600)",
          padding: "3rem",
        }}
      >
        <header className="text-center mb-8">
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: "var(--gecko-text-secondary)" }}
          >
            Gecko M&R
          </p>
          <h1
            className="text-3xl"
            style={{
              fontWeight: "var(--gecko-font-weight-bold)",
              color: "var(--gecko-primary-700)",
              marginTop: "0.5rem",
            }}
          >
            Pre-Trip Inspection Certificate
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--gecko-text-secondary)" }}
          >
            ISO 6346 · ATP-compliant
          </p>
        </header>

        <div
          style={{
            background: "var(--gecko-success-100)",
            color: "var(--gecko-success-800)",
            padding: "0.75rem 1rem",
            borderRadius: "var(--gecko-radius-lg)",
            textAlign: "center",
            fontWeight: "var(--gecko-font-weight-semibold)",
            marginBottom: "2rem",
          }}
        >
          ✓ This container has passed Pre-Trip Inspection
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="Certificate reference">{survey.reference}</Field>
          <Field label="Performed">{survey.performedDate}</Field>
          <Field label="Container ID">{survey.equipmentId}</Field>
          <Field label="ISO 6346 size/type">{equipment?.isoSizeType ?? "—"}</Field>
          <Field label="Owner">{equipment?.ownerName ?? "—"}</Field>
          <Field label="Refrigeration unit">{equipment?.reeferUnitModel ?? "—"}</Field>
          <Field label="Refrigerant">{equipment?.reeferRefrigerant ?? "—"}</Field>
          <Field label="Setpoint range">
            {equipment?.reeferSetpointMinC !== undefined
              ? `${equipment.reeferSetpointMinC} °C → ${equipment.reeferSetpointMaxC} °C`
              : "—"}
          </Field>
          <Field label="ATP plate validity" highlight>
            {equipment?.atpPlateValidity ?? "—"}
          </Field>
          <Field label="Depot">{survey.depotCode}</Field>
        </dl>

        {survey.notes && (
          <div className="mt-6 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
              Surveyor notes
            </p>
            <p>{survey.notes}</p>
          </div>
        )}

        {/* Signature block */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12 pt-8"
          style={{ borderTop: "1px solid var(--gecko-border)" }}
        >
          <div>
            <p
              style={{
                borderBottom: "1px solid var(--gecko-text-primary)",
                height: "2.5rem",
                marginBottom: "0.5rem",
              }}
            />
            <p className="text-xs text-muted-foreground">Surveyor signature</p>
            <p className="text-sm font-semibold mt-2">{surveyor?.name ?? survey.surveyorId}</p>
            {surveyor?.certifications.includes("ATP") && (
              <p className="text-xs text-muted-foreground">ATP-qualified surveyor</p>
            )}
          </div>
          <div>
            <p
              style={{
                borderBottom: "1px solid var(--gecko-text-primary)",
                height: "2.5rem",
                marginBottom: "0.5rem",
              }}
            />
            <p className="text-xs text-muted-foreground">Depot stamp</p>
            <p className="text-sm font-semibold mt-2">{survey.depotCode}</p>
          </div>
        </div>

        <p
          className="text-center text-xs mt-12"
          style={{ color: "var(--gecko-text-secondary)" }}
        >
          Issued by Gecko M&R on behalf of the depot operator.<br />
          This certificate is valid until the next periodic exam or the ATP plate expiry, whichever is sooner.
        </p>
      </div>

      {/* Print styles — hide controls when printing */}
      <style jsx global>{`
        @media print {
          [data-print-hidden="true"] {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
  highlight,
}: {
  label: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt
        className="text-xs uppercase tracking-wider"
        style={{ color: "var(--gecko-text-secondary)" }}
      >
        {label}
      </dt>
      <dd
        className="gecko-text-mono mt-1"
        style={{
          fontSize: "0.95rem",
          fontWeight: highlight
            ? "var(--gecko-font-weight-bold)"
            : "var(--gecko-font-weight-medium)",
          color: highlight ? "var(--gecko-primary-700)" : undefined,
        }}
      >
        {children}
      </dd>
    </div>
  );
}
