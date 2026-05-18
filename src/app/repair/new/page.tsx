"use client";

/**
 * /repair/new — CEDEX-coded repair-line authoring form.
 * Phase 4 D-06.
 *
 * Replaces the Phase 1 stub (which used hardcoded damage types) with a
 * real chain: pick equipment → pick CEDEX location → component → damage →
 * repair action → enter dimension (IICL-6 verdict surfaces inline) → hours
 * → cost → responsibility. Submit creates a RepairJob in 'estimated' state
 * via the Phase 2 repository seam.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function NewRepairPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const presetEquipmentId = sp.get("equipmentId") ?? "";
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
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
      <Link href="/repair">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Repairs
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
            <CardTitle>Repair job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              New reference: <span className="gecko-text-mono">{nextRef}</span> · auto-derived severity:{" "}
              <Badge>{severityFromTotal(totalCost)}</Badge>
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
                {selectedEquipment && (
                  <p className="text-xs text-muted-foreground">
                    {selectedEquipment.ownerName} · {selectedEquipment.depotCode}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerCode">Customer (billing target)</Label>
                <Select
                  onValueChange={(v) => setValue("customerCode", v, { shouldValidate: true })}
                  value={watch("customerCode") ?? ""}
                >
                  <SelectTrigger id="customerCode">
                    <SelectValue placeholder="Pick a customer…" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.customerCode && (
                  <p className="text-xs text-destructive">{errors.customerCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatorId">Estimator</Label>
                <Select
                  onValueChange={(v) => setValue("estimatorId", v, { shouldValidate: true })}
                  value={watch("estimatorId") ?? ""}
                >
                  <SelectTrigger id="estimatorId">
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
                {errors.estimatorId && (
                  <p className="text-xs text-destructive">{errors.estimatorId.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        {fields.map((field, idx) => {
          const line = lines?.[idx];
          const dim = Number(line?.dimensionCm);
          const verdict =
            line?.component && selectedEquipment && !isNaN(dim) && dim > 0
              ? getIicl6Verdict(line.component, dim, selectedEquipment.category)
              : "no-threshold";
          return (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Repair line #{idx + 1}</CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(idx)}
                  >
                    <Icon name="trash" size={16} className="mr-1" />
                    Remove
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CEDEX chain */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>CEDEX location</Label>
                    <Select
                      onValueChange={(v) => setValue(`lines.${idx}.location`, v, { shouldValidate: true })}
                      value={line?.location ?? ""}
                    >
                      <SelectTrigger><SelectValue placeholder="Where…" /></SelectTrigger>
                      <SelectContent>
                        {cedexLocations.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lines?.[idx]?.location && (
                      <p className="text-xs text-destructive">{errors.lines[idx]?.location?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Component</Label>
                    <Select
                      onValueChange={(v) => setValue(`lines.${idx}.component`, v, { shouldValidate: true })}
                      value={line?.component ?? ""}
                    >
                      <SelectTrigger><SelectValue placeholder="Part…" /></SelectTrigger>
                      <SelectContent>
                        {cedexComponents.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lines?.[idx]?.component && (
                      <p className="text-xs text-destructive">{errors.lines[idx]?.component?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Damage</Label>
                    <Select
                      onValueChange={(v) => setValue(`lines.${idx}.damage`, v, { shouldValidate: true })}
                      value={line?.damage ?? ""}
                    >
                      <SelectTrigger><SelectValue placeholder="What's wrong…" /></SelectTrigger>
                      <SelectContent>
                        {cedexDamages.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lines?.[idx]?.damage && (
                      <p className="text-xs text-destructive">{errors.lines[idx]?.damage?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Repair action</Label>
                    <Select
                      onValueChange={(v) => setValue(`lines.${idx}.repair`, v, { shouldValidate: true })}
                      value={line?.repair ?? ""}
                    >
                      <SelectTrigger><SelectValue placeholder="Action…" /></SelectTrigger>
                      <SelectContent>
                        {cedexRepairs.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lines?.[idx]?.repair && (
                      <p className="text-xs text-destructive">{errors.lines[idx]?.repair?.message}</p>
                    )}
                  </div>
                </div>

                {/* Quantity / measurement / cost */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Dimension (cm)</Label>
                    <Input type="number" step="0.5" min={0} {...register(`lines.${idx}.dimensionCm`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Input placeholder="STL / PNL / GAS…" {...register(`lines.${idx}.material`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours</Label>
                    <Input type="number" step="0.25" min={0} {...register(`lines.${idx}.hours`)} />
                    {errors.lines?.[idx]?.hours && (
                      <p className="text-xs text-destructive">{errors.lines[idx]?.hours?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Cost (THB)</Label>
                    <Input type="number" min={0} {...register(`lines.${idx}.costThb`)} />
                    {errors.lines?.[idx]?.costThb && (
                      <p className="text-xs text-destructive">{errors.lines[idx]?.costThb?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Responsibility</Label>
                    <Select
                      onValueChange={(v) => setValue(`lines.${idx}.responsibility`, v as RepairJobInput["lines"][number]["responsibility"], { shouldValidate: true })}
                      value={line?.responsibility ?? "operator"}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["owner","operator","depot","insurance","warranty"] as const).map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* IICL-6 verdict */}
                {verdict !== "no-threshold" && (
                  <div
                    className={
                      verdict === "acceptable"
                        ? "gecko-alert"
                        : "gecko-alert gecko-alert-warning"
                    }
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
                    <strong>IICL-6 verdict:</strong>{" "}
                    {verdict === "acceptable"
                      ? `Acceptable wear at ${dim} cm on ${line?.component} (${selectedEquipment?.category}). Damage is within IICL-6 tolerance — repair is optional.`
                      : `Must-repair at ${dim} cm on ${line?.component} (${selectedEquipment?.category}). Damage exceeds IICL-6 tolerance — repair is mandatory.`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {errors.lines && typeof errors.lines.message === "string" && (
          <p className="text-sm text-destructive">{errors.lines.message}</p>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => append({ ...emptyLine } as unknown as RepairJobInput["lines"][number])}
        >
          <Icon name="plus" size={16} className="mr-2" />
          Add another repair line
        </Button>

        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Estimated total</p>
              <p className="text-xl font-semibold">฿{totalCost.toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
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
                Submit estimate
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </AppShell>
  );
}
