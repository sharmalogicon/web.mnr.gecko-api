"use client";

/**
 * /survey/[id]/certificate — PTI certificate (SURV-05).
 * Phase 6 D-03; Phase 7.15-B inline-style + Tailwind typography purge.
 *
 * Renders a print-friendly certificate when the survey is a passing PTI.
 * Uses the browser's native print dialog (window.print()) — no PDF library.
 */

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

import { Icon } from "@/components/ui/Icon";
import { equipmentRepo, surveyRepo } from "@/lib/repos";
import { surveyors } from "@/data/seed/_shared/surveyors";

import styles from "./Certificate.module.css";

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
      <div className={styles.errorWrap}>
        <div className={styles.errorBody}>
          <h1 className={styles.errorTitle}>Survey not found</h1>
          <p className={styles.errorDescription}>No survey {id} on record.</p>
          <Link href="/survey" className="gecko-btn gecko-btn-primary gecko-btn-sm">
            Back to surveys
          </Link>
        </div>
      </div>
    );
  }

  if (survey.type !== "pti" || survey.outcome !== "pass") {
    return (
      <div className={styles.errorWrap}>
        <div className={styles.errorBody}>
          <h1 className={styles.errorTitle}>Certificate unavailable</h1>
          <p className={styles.errorDescription}>
            A PTI certificate is only generated for surveys where{" "}
            <code>type === &quot;pti&quot;</code> and{" "}
            <code>outcome === &quot;pass&quot;</code>. This survey is{" "}
            <strong>{survey.type}</strong> with outcome{" "}
            <strong>{survey.outcome}</strong>.
          </p>
          <Link
            href={`/survey/${encodeURIComponent(id)}`}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            Back to survey
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Print-control row — hidden in @media print */}
      <div className={styles.controls} data-print-hidden="true">
        <button
          type="button"
          className="gecko-btn gecko-btn-outline gecko-btn-sm"
          onClick={() => router.back()}
        >
          <Icon name="arrowLeft" size={16} />
          Back
        </button>
        <button
          type="button"
          className="gecko-btn gecko-btn-primary gecko-btn-sm"
          onClick={() => window.print()}
        >
          <Icon name="printer" size={16} />
          Print certificate
        </button>
      </div>

      {/* Certificate body */}
      <div className={styles.body}>
        <header className={styles.header}>
          <p className={styles.headerBrand}>Gecko M&amp;R</p>
          <h1 className={styles.headerTitle}>Pre-Trip Inspection Certificate</h1>
          <p className={styles.headerSubtitle}>ISO 6346 · ATP-compliant</p>
        </header>

        <div className={styles.passBanner}>
          ✓ This container has passed Pre-Trip Inspection
        </div>

        <dl className={styles.fields}>
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
          <div className={styles.notesWrap}>
            <p className={styles.notesLabel}>Surveyor notes</p>
            <p className={styles.notesText}>{survey.notes}</p>
          </div>
        )}

        {/* Signature block */}
        <div className={styles.signatureBlock}>
          <div>
            <p className={styles.signatureLine} />
            <p className={styles.signatureLabel}>Surveyor signature</p>
            <p className={styles.signatureName}>{surveyor?.name ?? survey.surveyorId}</p>
            {surveyor?.certifications.includes("ATP") && (
              <p className={styles.signatureSubLabel}>ATP-qualified surveyor</p>
            )}
          </div>
          <div>
            <p className={styles.signatureLine} />
            <p className={styles.signatureLabel}>Depot stamp</p>
            <p className={styles.signatureName}>{survey.depotCode}</p>
          </div>
        </div>

        <p className={styles.footer}>
          Issued by Gecko M&amp;R on behalf of the depot operator.
          <br />
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
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={highlight ? styles.fieldValueHighlight : styles.fieldValue}>
        {children}
      </dd>
    </div>
  );
}
