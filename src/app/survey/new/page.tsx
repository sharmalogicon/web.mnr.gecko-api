"use client";

/**
 * /survey/new — checklist-driven survey authoring form.
 * Phase 5 (DRY + TANK) + Phase 6 (REEFER + PTI).
 * Phase 7.9-D — native gecko form primitives, zero inline CSS.
 * Phase 7.13-C1 — wrapped in <FormPageShell>.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppShell } from "@/components/layout";
import { FormPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";

import { equipmentRepo, surveyRepo } from "@/lib/repos";
import { surveyors } from "@/data/seed/_shared/surveyors";
import { depots } from "@/data/seed/_shared/depots";
import {
  getChecklist,
  type ChecklistItem,
} from "@/data/seed/_shared/survey-checklists";
import { getIicl6Verdict } from "@/lib/cedex/iicl6";
import {
  surveyInputSchema,
  type SurveyInput,
} from "@/lib/validators/survey";
import type {
  SurveyRecord,
  EquipmentCategory,
  SurveyContainerType,
} from "@/lib/types";

function containerCategoryToSurveyType(category: EquipmentCategory): SurveyContainerType {
  if (category === "TANK") return "TANK";
  if (category === "REEFER") return "REEFER";
  return "DRY";
}

export default function NewSurveyPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const preset = sp.get("equipmentId") ?? "";
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SurveyInput>({
    resolver: zodResolver(surveyInputSchema),
    defaultValues: {
      equipmentId: preset,
      type: "periodic",
      surveyorId: "",
      depotCode: "",
      performedDate: new Date().toISOString().slice(0, 10),
      outcome: "pass",
      costThb: 500,
      notes: "",
      checklist: [],
    },
    mode: "onBlur",
  });

  const { fields, replace } = useFieldArray({ control, name: "checklist" });
  const equipmentId = watch("equipmentId");
  const type = watch("type");
  const checklistAnswers = watch("checklist");

  const selectedEquipment = equipmentId ? equipmentRepo.get(equipmentId) : undefined;
  const containerType: SurveyContainerType | undefined = selectedEquipment
    ? containerCategoryToSurveyType(selectedEquipment.category)
    : undefined;
  const isPti = type === "pti";
  const isOffHire = type === "off_hire";
  const { items: checklistItems, photos: photoAngles } = containerType
    ? getChecklist(containerType, isPti)
    : { items: [] as ChecklistItem[], photos: [] as string[] };

  useEffect(() => {
    if (!containerType) return;
    replace(
      checklistItems.map((it) => ({
        itemId: it.id,
        result: "pass" as const,
        measurementCm: undefined,
        notes: "",
      })),
    );
  }, [containerType, isPti]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextRef = surveyRepo.nextReference();

  const onSubmit: SubmitHandler<SurveyInput> = async (input) => {
    setSubmitError(null);
    try {
      if (!selectedEquipment || !containerType) {
        setSubmitError("Pick an equipment first");
        return;
      }
      const record: SurveyRecord = {
        reference: nextRef,
        equipmentId: input.equipmentId,
        type: input.type,
        containerType,
        surveyorId: input.surveyorId,
        depotCode: input.depotCode,
        performedDate: input.performedDate,
        outcome: input.outcome,
        notes: input.notes || undefined,
        costThb: Number(input.costThb),
      };
      surveyRepo.create(record);
      router.push(`/survey/${encodeURIComponent(nextRef)}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create survey");
    }
  };

  const grouped = checklistItems.reduce<Record<string, ChecklistItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <AppShell>
      <FormPageShell
        backHref="/survey"
        backLabel="Back to Surveys"
        title="New survey"
        subtitle={
          <>
            New reference: <span className="gecko-text-mono">{nextRef}</span>
            {containerType && (
              <>
                {" · "}
                Detected category: <span className="gecko-pill gecko-pill-neutral">{containerType}</span>
                {isPti && (
                  <>
                    {" · "}
                    <span className="gecko-pill gecko-pill-info">PTI</span>
                  </>
                )}
              </>
            )}
          </>
        }
        onCancel={() => router.back()}
        onSave={handleSubmit(onSubmit)}
        saving={isSubmitting}
        saveLabel="Submit survey"
        narrow={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {submitError && (
            <div className="gecko-alert gecko-alert-error" role="alert">
              {submitError}
            </div>
          )}

          {/* Header */}
          <div className="gecko-card">
            <div className="gecko-card-body flex flex-col gap-4">
              <h2 className="gecko-card-title">Survey</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="gecko-field">
                  <label htmlFor="equipmentId" className="gecko-field-label">Equipment</label>
                  <select id="equipmentId" className="gecko-select" {...register("equipmentId")}>
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
                </div>

                <div className="gecko-field">
                  <label htmlFor="type" className="gecko-field-label">Survey type</label>
                  <select id="type" className="gecko-select" {...register("type")}>
                    <option value="on_hire">On-hire</option>
                    <option value="off_hire">Off-hire</option>
                    <option value="periodic">Periodic</option>
                    <option value="pti">PTI (REEFER only)</option>
                  </select>
                </div>

                <div className="gecko-field">
                  <label htmlFor="surveyorId" className="gecko-field-label">Surveyor</label>
                  <select id="surveyorId" className="gecko-select" {...register("surveyorId")}>
                    <option value="">Pick a surveyor…</option>
                    {surveyors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.surveyorId && (
                    <span className="gecko-field-error">{errors.surveyorId.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="gecko-field">
                  <label htmlFor="depotCode" className="gecko-field-label">Depot</label>
                  <select id="depotCode" className="gecko-select" {...register("depotCode")}>
                    <option value="">Pick…</option>
                    {depots.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                  {errors.depotCode && (
                    <span className="gecko-field-error">{errors.depotCode.message}</span>
                  )}
                </div>
                <div className="gecko-field">
                  <label htmlFor="performedDate" className="gecko-field-label">Performed</label>
                  <input id="performedDate" type="date" className="gecko-input" {...register("performedDate")} />
                </div>
                <div className="gecko-field">
                  <label htmlFor="costThb" className="gecko-field-label">Cost (THB)</label>
                  <input id="costThb" type="number" min={0} className="gecko-input" {...register("costThb")} />
                  {errors.costThb && (
                    <span className="gecko-field-error">{errors.costThb.message}</span>
                  )}
                </div>
                <div className="gecko-field">
                  <label htmlFor="outcome" className="gecko-field-label">Outcome</label>
                  <select id="outcome" className="gecko-select" {...register("outcome")}>
                    <option value="pass">Pass</option>
                    <option value="pass_with_notes">Pass with notes</option>
                    <option value="must_repair">Must repair</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          {containerType && fields.length > 0 && (
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-6">
                <h2 className="gecko-card-title">
                  Checklist — {containerType}{isPti && " PTI"} ({checklistItems.length} items)
                </h2>
                {Object.entries(grouped).map(([cat, items]) => {
                  // Per-category status summary so the surveyor can scan at a
                  // glance which sections still need attention before
                  // collapsing them.
                  const itemIdxs = items
                    .map((it) => fields.findIndex(
                      (f) => (f as { itemId?: string }).itemId === it.id,
                    ))
                    .filter((i) => i !== -1);
                  const counts = itemIdxs.reduce(
                    (acc, idx) => {
                      const r = checklistAnswers?.[idx]?.result ?? "pass";
                      if (r === "fail") acc.fail += 1;
                      else if (r === "na") acc.na += 1;
                      else acc.pass += 1;
                      return acc;
                    },
                    { pass: 0, fail: 0, na: 0 },
                  );
                  return (
                  <details key={cat} className="gecko-collapsible-card" open>
                    <summary className="gecko-collapsible-summary">
                      <span className="gecko-collapsible-title">{cat}</span>
                      <span className="gecko-collapsible-meta">
                        {items.length} item{items.length === 1 ? "" : "s"}
                      </span>
                      {counts.fail > 0 && (
                        <span className="gecko-pill gecko-pill-danger">
                          {counts.fail} fail
                        </span>
                      )}
                      {counts.na === items.length && items.length > 0 && (
                        <span className="gecko-pill gecko-pill-neutral">all N/A</span>
                      )}
                    </summary>
                    <div className="gecko-collapsible-body">
                    {items.map((item) => {
                      const idx = fields.findIndex(
                        (f) => (f as { itemId?: string }).itemId === item.id,
                      );
                      if (idx === -1) return null;
                      const answer = checklistAnswers?.[idx];
                      const dim = Number(answer?.measurementCm);
                      const verdict =
                        isOffHire && item.cedexComponent && selectedEquipment && !isNaN(dim) && dim > 0
                          ? getIicl6Verdict(item.cedexComponent, dim, selectedEquipment.category)
                          : "no-threshold";

                      return (
                        <div key={item.id} className="gecko-bordered-group flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="gecko-field-label flex-1">{item.label}</span>
                            <div className="flex gap-3">
                              {(["pass", "fail", "na"] as const).map((r) => (
                                <label key={r} className="flex items-center gap-1">
                                  <input
                                    type="radio"
                                    value={r}
                                    id={`${item.id}-${r}`}
                                    checked={(answer?.result ?? "pass") === r}
                                    onChange={(e) => setValue(
                                      `checklist.${idx}.result`,
                                      e.target.value as "pass" | "fail" | "na",
                                      { shouldValidate: true },
                                    )}
                                  />
                                  <span className="gecko-field-helper">{r}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          {item.measurementCm && (
                            <div className="flex items-center gap-2">
                              <label className="gecko-field-label w-32">Damage dimension</label>
                              <input
                                type="number"
                                step="0.5"
                                min={0}
                                placeholder="cm"
                                className="gecko-input gecko-input-sm w-28"
                                {...register(`checklist.${idx}.measurementCm`)}
                              />
                              {verdict !== "no-threshold" && (
                                <span
                                  className={
                                    verdict === "acceptable"
                                      ? "gecko-pill gecko-pill-success"
                                      : "gecko-pill gecko-pill-warning"
                                  }
                                >
                                  IICL-6: {verdict}
                                </span>
                              )}
                            </div>
                          )}
                          {answer?.result === "fail" && (
                            <textarea
                              placeholder="Notes (required for fail)"
                              className="gecko-textarea"
                              rows={2}
                              {...register(`checklist.${idx}.notes`)}
                            />
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </details>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photos */}
          {photoAngles.length > 0 && (
            <div className="gecko-card">
              <div className="gecko-card-body flex flex-col gap-4">
                <h2 className="gecko-card-title">Photo angles ({photoAngles.length})</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photoAngles.map((angle) => (
                    <div key={angle} className="gecko-photo-placeholder">
                      <div>
                        <Icon name="camera" size={24} />
                        {angle}
                        <p className="gecko-field-helper">(upload placeholder)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="gecko-card">
            <div className="gecko-card-body flex flex-col gap-4">
              <h2 className="gecko-card-title">Surveyor notes</h2>
              <textarea
                className="gecko-textarea"
                placeholder="Optional summary notes…"
                rows={3}
                {...register("notes")}
              />
            </div>
          </div>
        </form>
      </FormPageShell>
    </AppShell>
  );
}
