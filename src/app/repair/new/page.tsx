"use client";

/**
 * /repair/new — CEDEX-coded repair-line authoring form.
 * Phase 4 D-06 / Phase 7.9-C — native gecko form primitives, no inline CSS.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";

import { equipmentRepo, repairRepo } from "@/lib/repos";
import { customers } from "@/data/seed/_shared/customers";
import { surveyors } from "@/data/seed/_shared/surveyors";
import {
  cedexLocations,
  cedexComponents,
  cedexDamages,
  cedexRepairs,
} from "@/data/seed/_shared/cedex";
import { getIicl6Verdict } from "@/lib/cedex/iicl6";
import {
  repairJobInputSchema,
  type RepairJobInput,
} from "@/lib/validators/repair";
import type { RepairJob } from "@/lib/types";

const emptyLine = {
  location: "",
  component: "",
  damage: "",
  repair: "",
  dimensionCm: undefined,
  material: "",
  hours: 0,
  costThb: 0,
  responsibility: "operator" as const,
};

function severityFromTotal(total: number): RepairJob["severity"] {
  if (total < 5000) return "minor";
  if (total < 25000) return "normal";
  return "critical";
}

function NewRepairPageInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetEquipmentId = sp.get("equipmentId") ?? "";
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RepairJobInput>({
    resolver: zodResolver(repairJobInputSchema),
    defaultValues: {
      equipmentId: presetEquipmentId,
      customerCode: "",
      estimatorId: "",
      severity: "normal",
      lines: [{ ...emptyLine } as unknown as RepairJobInput["lines"][number]],
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");
  const equipmentId = watch("equipmentId");
  const selectedEquipment = equipmentId ? equipmentRepo.get(equipmentId) : undefined;
  const totalCost = (lines ?? []).reduce(
    (sum, l) => sum + (Number(l?.costThb) || 0),
    0,
  );

  const nextRef = repairRepo.nextReference();

  const onSubmit: SubmitHandler<RepairJobInput> = async (input) => {
    setSubmitError(null);
    try {
      const total = input.lines.reduce((s, l) => s + Number(l.costThb), 0);
      const record: RepairJob = {
        reference: nextRef,
        equipmentId: input.equipmentId,
        openedDate: new Date().toISOString().slice(0, 10),
        status: "estimated",
        severity: input.severity,
        estimatorId: input.estimatorId,
        customerCode: input.customerCode,
        lines: input.lines.map((l) => ({
          location: l.location,
          component: l.component,
          damage: l.damage,
          repair: l.repair,
          dimensionCm: l.dimensionCm,
          material: l.material || undefined,
          hours: Number(l.hours),
          costThb: Number(l.costThb),
          responsibility: l.responsibility,
        })),
        totalCostThb: total,
      };
      repairRepo.create(record);
      router.push(`/repair/${encodeURIComponent(nextRef)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create repair");
    }
  };

  return (
    <AppShell>
      <FormPageShell
        backHref="/repair"
        backLabel="Back to Repairs"
        title="New repair job"
        subtitle={
          <>
            New reference: <span className="gecko-text-mono">{nextRef}</span> · auto-derived severity:{" "}
            <span className="gecko-pill gecko-pill-neutral">{severityFromTotal(totalCost)}</span>
          </>
        }
        onCancel={() => router.back()}
        onSave={handleSubmit(onSubmit)}
        saving={isSubmitting}
        saveLabel="Submit estimate"
        narrow={false}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          {submitError && (
            <div className="gecko-alert gecko-alert-error" role="alert">
              {submitError}
            </div>
          )}

          {/* Header */}
          <div className="gecko-card">
            <div className="gecko-card-body flex flex-col gap-4">
              <h2 className="gecko-card-title">Repair job</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="gecko-field">
                  <label htmlFor="equipmentId" className="gecko-field-label">Equipment</label>
                  <select
                    id="equipmentId"
                    className="gecko-select"
                    {...register("equipmentId")}
                  >
                    <option value="">Pick a container…</option>
                    {equipmentRepo.list().map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.id} — {e.category} {e.isoSizeType}
                      </option>
                    ))}
                  </select>
                  {errors.equipmentId && (
                    <span className="gecko-field-error">{errors.equipmentId.message}</span>
                  )}
                  {selectedEquipment && (
                    <span className="gecko-field-helper">
                      {selectedEquipment.ownerName} · {selectedEquipment.depotCode}
                    </span>
                  )}
                </div>

                <div className="gecko-field">
                  <label htmlFor="customerCode" className="gecko-field-label">Customer (billing target)</label>
                  <select
                    id="customerCode"
                    className="gecko-select"
                    {...register("customerCode")}
                  >
                    <option value="">Pick a customer…</option>
                    {customers.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.customerCode && (
                    <span className="gecko-field-error">{errors.customerCode.message}</span>
                  )}
                </div>

                <div className="gecko-field">
                  <label htmlFor="estimatorId" className="gecko-field-label">Estimator</label>
                  <select
                    id="estimatorId"
                    className="gecko-select"
                    {...register("estimatorId")}
                  >
                    <option value="">Pick a surveyor…</option>
                    {surveyors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.estimatorId && (
                    <span className="gecko-field-error">{errors.estimatorId.message}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lines */}
          {fields.map((field, idx) => {
            const line = lines?.[idx];
            const dim = Number(line?.dimensionCm);
            const verdict =
              line?.component && selectedEquipment && !isNaN(dim) && dim > 0
                ? getIicl6Verdict(line.component, dim, selectedEquipment.category)
                : "no-threshold";
            return (
              <div key={field.id} className="gecko-card">
                <div className="gecko-card-body flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-between">
                    <h2 className="gecko-card-title">Repair line #{idx + 1}</h2>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="gecko-btn gecko-btn-ghost gecko-btn-sm"
                      >
                        <Icon name="trash" size={16} />
                        Remove
                      </button>
                    )}
                  </div>

                  {/* CEDEX chain */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="gecko-field">
                      <label className="gecko-field-label">CEDEX location</label>
                      <select className="gecko-select" {...register(`lines.${idx}.location`)}>
                        <option value="">Where…</option>
                        {cedexLocations.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[idx]?.location && (
                        <span className="gecko-field-error">{errors.lines[idx]?.location?.message}</span>
                      )}
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Component</label>
                      <select className="gecko-select" {...register(`lines.${idx}.component`)}>
                        <option value="">Part…</option>
                        {cedexComponents.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[idx]?.component && (
                        <span className="gecko-field-error">{errors.lines[idx]?.component?.message}</span>
                      )}
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Damage</label>
                      <select className="gecko-select" {...register(`lines.${idx}.damage`)}>
                        <option value="">What&apos;s wrong…</option>
                        {cedexDamages.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[idx]?.damage && (
                        <span className="gecko-field-error">{errors.lines[idx]?.damage?.message}</span>
                      )}
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Repair action</label>
                      <select className="gecko-select" {...register(`lines.${idx}.repair`)}>
                        <option value="">Action…</option>
                        {cedexRepairs.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </option>
                        ))}
                      </select>
                      {errors.lines?.[idx]?.repair && (
                        <span className="gecko-field-error">{errors.lines[idx]?.repair?.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity / measurement / cost */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="gecko-field">
                      <label className="gecko-field-label">Dimension (cm)</label>
                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        className="gecko-input"
                        {...register(`lines.${idx}.dimensionCm`)}
                      />
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Material</label>
                      <input
                        className="gecko-input"
                        placeholder="STL / PNL / GAS…"
                        {...register(`lines.${idx}.material`)}
                      />
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Hours</label>
                      <input
                        type="number"
                        step="0.25"
                        min={0}
                        className="gecko-input"
                        {...register(`lines.${idx}.hours`)}
                      />
                      {errors.lines?.[idx]?.hours && (
                        <span className="gecko-field-error">{errors.lines[idx]?.hours?.message}</span>
                      )}
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Cost (THB)</label>
                      <input
                        type="number"
                        min={0}
                        className="gecko-input"
                        {...register(`lines.${idx}.costThb`)}
                      />
                      {errors.lines?.[idx]?.costThb && (
                        <span className="gecko-field-error">{errors.lines[idx]?.costThb?.message}</span>
                      )}
                    </div>
                    <div className="gecko-field">
                      <label className="gecko-field-label">Responsibility</label>
                      <select className="gecko-select" {...register(`lines.${idx}.responsibility`)}>
                        {(["owner", "operator", "depot", "insurance", "warranty"] as const).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* IICL-6 verdict */}
                  {verdict !== "no-threshold" && (
                    <div
                      className={
                        verdict === "acceptable"
                          ? "gecko-alert gecko-alert-success"
                          : "gecko-alert gecko-alert-warning"
                      }
                    >
                      <strong>IICL-6 verdict:</strong>{" "}
                      {verdict === "acceptable"
                        ? `Acceptable wear at ${dim} cm on ${line?.component} (${selectedEquipment?.category}). Damage is within IICL-6 tolerance — repair is optional.`
                        : `Must-repair at ${dim} cm on ${line?.component} (${selectedEquipment?.category}). Damage exceeds IICL-6 tolerance — repair is mandatory.`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {errors.lines && typeof errors.lines.message === "string" && (
            <p className="gecko-field-error">{errors.lines.message}</p>
          )}

          <button
            type="button"
            onClick={() => append({ ...emptyLine } as unknown as RepairJobInput["lines"][number])}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            <Icon name="plus" size={16} />
            Add another repair line
          </button>

          <div className="gecko-card">
            <div className="gecko-card-body flex justify-between items-center">
              <div>
                <p className="gecko-field-helper">Estimated total</p>
                <p className="gecko-bignum">฿{totalCost.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </form>
      </FormPageShell>
    </AppShell>
  );
}

export default function NewRepairPage() {
  return (
    <Suspense fallback={null}>
      <NewRepairPageInner />
    </Suspense>
  );
}
