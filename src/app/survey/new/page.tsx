"use client";

/**
 * /survey/new — checklist-driven survey authoring form.
 * Phase 5 (DRY + TANK) + Phase 6 (REEFER + PTI).
 *
 * Picks equipment + type → renders the right checklist + photo-angle prompts.
 * Items with `measurementCm: true` show a numeric input. On **off-hire**
 * surveys, that dimension drives an inline IICL-6 verdict per SURV-06
 * using `getIicl6Verdict()` from Phase 4.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

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

  // When equipment or survey type changes, rebuild the checklist field array
  // with default-pass answers so the inputs hydrate cleanly.
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

  // Group checklist items by category for rendering
  const grouped = checklistItems.reduce<Record<string, ChecklistItem[]>>((acc, it) => {
    (acc[it.category] ??= []).push(it);
    return acc;
  }, {});

  return (
    <AppShell>
      <Link href="/survey">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Surveys
        </Button>
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl">
        {submitError && (
          <div className="gecko-alert gecko-alert-error" role="alert">
            {submitError}
          </div>
        )}

        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle>Survey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              New reference: <span className="gecko-text-mono">{nextRef}</span>
              {containerType && (
                <>
                  {" · "}
                  Detected category: <Badge>{containerType}</Badge>
                  {isPti && (
                    <>
                      {" · "}
                      <Badge>PTI</Badge>
                    </>
                  )}
                </>
              )}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentId">Equipment</Label>
                <Select
                  onValueChange={(v) => setValue("equipmentId", v, { shouldValidate: true })}
                  value={equipmentId ?? ""}
                >
                  <SelectTrigger id="equipmentId">
                    <SelectValue placeholder="Pick a container…" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentRepo.list().map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.id} — {e.category} {e.isoSizeType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipmentId && (
                  <p className="text-xs text-destructive">{errors.equipmentId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Survey type</Label>
                <Select
                  onValueChange={(v) => setValue("type", v as SurveyInput["type"], { shouldValidate: true })}
                  value={watch("type") ?? "periodic"}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_hire">On-hire</SelectItem>
                    <SelectItem value="off_hire">Off-hire</SelectItem>
                    <SelectItem value="periodic">Periodic</SelectItem>
                    <SelectItem value="pti">PTI (REEFER only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="surveyorId">Surveyor</Label>
                <Select
                  onValueChange={(v) => setValue("surveyorId", v, { shouldValidate: true })}
                  value={watch("surveyorId") ?? ""}
                >
                  <SelectTrigger id="surveyorId">
                    <SelectValue placeholder="Pick a surveyor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {surveyors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.id} — {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.surveyorId && (
                  <p className="text-xs text-destructive">{errors.surveyorId.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="depotCode">Depot</Label>
                <Select
                  onValueChange={(v) => setValue("depotCode", v, { shouldValidate: true })}
                  value={watch("depotCode") ?? ""}
                >
                  <SelectTrigger id="depotCode">
                    <SelectValue placeholder="Pick…" />
                  </SelectTrigger>
                  <SelectContent>
                    {depots.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        {d.code} — {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.depotCode && (
                  <p className="text-xs text-destructive">{errors.depotCode.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="performedDate">Performed</Label>
                <Input id="performedDate" type="date" {...register("performedDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costThb">Cost (THB)</Label>
                <Input id="costThb" type="number" min={0} {...register("costThb")} />
                {errors.costThb && (
                  <p className="text-xs text-destructive">{errors.costThb.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">Outcome</Label>
                <Select
                  onValueChange={(v) => setValue("outcome", v as SurveyInput["outcome"], { shouldValidate: true })}
                  value={watch("outcome") ?? "pass"}
                >
                  <SelectTrigger id="outcome">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="pass_with_notes">Pass with notes</SelectItem>
                    <SelectItem value="must_repair">Must repair</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        {containerType && fields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Checklist — {containerType}{isPti && " PTI"} ({checklistItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {cat}
                  </h3>
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
                      <div key={item.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium flex-1">{item.label}</span>
                          <RadioGroup
                            onValueChange={(v) =>
                              setValue(
                                `checklist.${idx}.result`,
                                v as "pass" | "fail" | "na",
                                { shouldValidate: true },
                              )
                            }
                            value={answer?.result ?? "pass"}
                            className="flex gap-3"
                          >
                            {(["pass", "fail", "na"] as const).map((r) => (
                              <div key={r} className="flex items-center gap-1">
                                <RadioGroupItem value={r} id={`${item.id}-${r}`} />
                                <Label htmlFor={`${item.id}-${r}`} className="text-xs">{r}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                        {item.measurementCm && (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs w-32">Damage dimension</Label>
                            <Input
                              type="number"
                              step="0.5"
                              min={0}
                              placeholder="cm"
                              className="w-28"
                              {...register(`checklist.${idx}.measurementCm`)}
                            />
                            {verdict !== "no-threshold" && (
                              <Badge
                                style={{
                                  background:
                                    verdict === "acceptable"
                                      ? "var(--gecko-success-100)"
                                      : "var(--gecko-warning-100)",
                                  color:
                                    verdict === "acceptable"
                                      ? "var(--gecko-success-800)"
                                      : "var(--gecko-warning-800)",
                                }}
                              >
                                IICL-6: {verdict}
                              </Badge>
                            )}
                          </div>
                        )}
                        {answer?.result === "fail" && (
                          <Textarea
                            placeholder="Notes (required for fail)"
                            className="text-xs"
                            rows={2}
                            {...register(`checklist.${idx}.notes`)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {photoAngles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Photo angles ({photoAngles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photoAngles.map((angle) => (
                  <div
                    key={angle}
                    className="aspect-video border-2 border-dashed rounded-lg flex items-center justify-center text-center p-3 text-sm text-muted-foreground"
                  >
                    <div>
                      <Icon name="camera" size={24} className="mx-auto mb-1 opacity-50" />
                      {angle}
                      <p className="text-xs">(upload placeholder)</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Surveyor notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Optional summary notes…" rows={3} {...register("notes")} />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <span
                  className="gecko-spinner gecko-spinner-sm gecko-spinner-white mr-2"
                  aria-hidden="true"
                />
              )}
              Submit survey
            </Button>
          </CardContent>
        </Card>
      </form>
    </AppShell>
  );
}
