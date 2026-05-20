"use client";

/**
 * Shared equipment registration / edit form.
 * Phase 3 plan 03.04 + 03.05.
 *
 * Drives BOTH /equipment/new (create) and /equipment/[id]/edit (edit). The
 * BIC identifier fields are read-only in edit mode.
 */

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { equipmentSchema, type EquipmentFormInput } from "@/lib/validators/equipment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isoSizeTypes } from "@/data/seed/_shared/iso-6346-size-types";
import { depots } from "@/data/seed/_shared/depots";

export interface EquipmentFormProps {
  mode: "create" | "edit";
  defaultValues?: Partial<EquipmentFormInput>;
  onSubmit: SubmitHandler<EquipmentFormInput>;
  /** Optional submit-time error to render in a gecko-alert (e.g. id conflict). */
  submitError?: string | null;
}

const CATEGORY_FROM_SIZE_TYPE: Record<string, EquipmentFormInput["category"]> = {
  G: "DRY",
  T: "TANK",
  R: "REEFER",
  B: "BULK",
  P: "FLAT",
  U: "OPEN-TOP",
};

export function EquipmentForm({ mode, defaultValues, onSubmit, submitError }: EquipmentFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EquipmentFormInput>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: defaultValues as EquipmentFormInput,
    mode: "onBlur",
  });

  const category = watch("category");
  const isoSizeType = watch("isoSizeType");
  const tareKg = watch("tareKg");
  const maxGrossKg = watch("maxGrossKg");
  const payloadKg =
    typeof maxGrossKg === "number" && typeof tareKg === "number"
      ? maxGrossKg - tareKg
      : undefined;

  // When the user picks a size/type code, auto-set the category from its
  // group letter (G→DRY, T→TANK, R→REEFER, B→BULK, P→FLAT).
  useEffect(() => {
    if (!isoSizeType || isoSizeType.length < 4) return;
    const groupLetter = isoSizeType.charAt(2).toUpperCase();
    const mapped = CATEGORY_FROM_SIZE_TYPE[groupLetter];
    if (mapped && mapped !== category) {
      setValue("category", mapped, { shouldValidate: true, shouldDirty: true });
    }
  }, [isoSizeType, category, setValue]);

  const isEdit = mode === "edit";
  const readOnlyId = isEdit;

  // Group iso size types by category for the picker
  const sizeTypeGroups: Array<{ label: string; codes: typeof isoSizeTypes }> = [
    { label: "Dry", codes: isoSizeTypes.filter((s) => s.category === "DRY") },
    { label: "Tank", codes: isoSizeTypes.filter((s) => s.category === "TANK") },
    { label: "Reefer", codes: isoSizeTypes.filter((s) => s.category === "REEFER") },
    { label: "Bulk", codes: isoSizeTypes.filter((s) => s.category === "BULK") },
    { label: "Flat", codes: isoSizeTypes.filter((s) => s.category === "FLAT") },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
      {submitError && (
        <div className="gecko-alert gecko-alert-error" role="alert">
          {submitError}
        </div>
      )}

      {/* ---------- 1. ISO 6346 identifier ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>ISO 6346 identifier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Four discrete parts. The 11-character container number is{" "}
            <span className="gecko-text-mono">
              {(watch("ownerPrefix") ?? "OPF") +
                (watch("categoryIdentifier") ?? "U") +
                (watch("serial") ?? "000000") +
                (watch("checkDigit") ?? "0")}
            </span>
            . The check digit is validated against the BIC algorithm.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerPrefix">Owner prefix (3 letters)</Label>
              <Input
                id="ownerPrefix"
                className="uppercase"
                maxLength={3}
                disabled={readOnlyId}
                placeholder="MSK"
                {...register("ownerPrefix")}
              />
              {errors.ownerPrefix && (
                <p className="text-xs text-destructive">{errors.ownerPrefix.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryIdentifier">Category</Label>
              <Select
                disabled={readOnlyId}
                onValueChange={(v) => setValue("categoryIdentifier", v as "U" | "J" | "Z", { shouldValidate: true })}
                value={watch("categoryIdentifier") ?? ""}
              >
                <SelectTrigger id="categoryIdentifier">
                  <SelectValue placeholder="U / J / Z" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U">U — freight container</SelectItem>
                  <SelectItem value="J">J — detachable equipment</SelectItem>
                  <SelectItem value="Z">Z — trailers / chassis</SelectItem>
                </SelectContent>
              </Select>
              {errors.categoryIdentifier && (
                <p className="text-xs text-destructive">{errors.categoryIdentifier.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="serial">Serial (6 digits)</Label>
              <Input
                id="serial"
                maxLength={6}
                disabled={readOnlyId}
                placeholder="234567"
                {...register("serial")}
              />
              {errors.serial && (
                <p className="text-xs text-destructive">{errors.serial.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkDigit">Check digit</Label>
              <Input
                id="checkDigit"
                type="number"
                min={0}
                max={9}
                disabled={readOnlyId}
                placeholder="1"
                {...register("checkDigit")}
              />
              {errors.checkDigit && (
                <p className="text-xs text-destructive">{errors.checkDigit.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner name</Label>
            <Input id="ownerName" placeholder="Maersk Line" {...register("ownerName")} />
            {errors.ownerName && (
              <p className="text-xs text-destructive">{errors.ownerName.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ---------- 2. Size/Type & Category ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Size, type & category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="isoSizeType">ISO 6346 size/type code</Label>
              <Select
                onValueChange={(v) => setValue("isoSizeType", v, { shouldValidate: true })}
                value={watch("isoSizeType") ?? ""}
              >
                <SelectTrigger id="isoSizeType">
                  <SelectValue placeholder="Pick a code…" />
                </SelectTrigger>
                <SelectContent>
                  {sizeTypeGroups
                    .filter((g) => g.codes.length > 0)
                    .map((g) => (
                      <SelectGroup key={g.label}>
                        <SelectLabel>{g.label}</SelectLabel>
                        {g.codes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} — {c.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                </SelectContent>
              </Select>
              {errors.isoSizeType && (
                <p className="text-xs text-destructive">{errors.isoSizeType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Container category</Label>
              <Input
                id="category"
                readOnly
                value={category ?? ""}
                style={{ background: "var(--gecko-bg-subtle)" }}
              />
              <p className="text-xs text-muted-foreground">
                Derived from the size/type code.
              </p>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="depotCode">Depot</Label>
              <Select
                onValueChange={(v) => setValue("depotCode", v, { shouldValidate: true })}
                value={watch("depotCode") ?? ""}
              >
                <SelectTrigger id="depotCode">
                  <SelectValue placeholder="Pick a depot…" />
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
              <Label htmlFor="status">Status</Label>
              <Select
                onValueChange={(v) => setValue("status", v as EquipmentFormInput["status"], { shouldValidate: true })}
                value={watch("status") ?? ""}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Pick a status…" />
                </SelectTrigger>
                <SelectContent>
                  {(["available","in_service","repair","cleaning","storage","off_hire"] as const).map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastSurveyDate">Last survey</Label>
              <Input id="lastSurveyDate" type="date" {...register("lastSurveyDate")} />
              {errors.lastSurveyDate && (
                <p className="text-xs text-destructive">{errors.lastSurveyDate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- 3. Universal physical specs (EQUIP-04) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Physical specs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tareKg">Tare (kg)</Label>
              <Input id="tareKg" type="number" min={1} {...register("tareKg")} />
              {errors.tareKg && <p className="text-xs text-destructive">{errors.tareKg.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxGrossKg">Max gross (kg)</Label>
              <Input id="maxGrossKg" type="number" min={1} {...register("maxGrossKg")} />
              {errors.maxGrossKg && <p className="text-xs text-destructive">{errors.maxGrossKg.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Payload (kg, derived)</Label>
              <Input
                readOnly
                value={typeof payloadKg === "number" && !isNaN(payloadKg) ? payloadKg : ""}
                style={{ background: "var(--gecko-bg-subtle)" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cubeM3">Cube (m³)</Label>
              <Input id="cubeM3" type="number" step="0.1" min={0} {...register("cubeM3")} />
              {errors.cubeM3 && <p className="text-xs text-destructive">{errors.cubeM3.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="internalLengthM">Internal length (m)</Label>
              <Input id="internalLengthM" type="number" step="0.01" min={0} {...register("internalLengthM")} />
              {errors.internalLengthM && <p className="text-xs text-destructive">{errors.internalLengthM.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalWidthM">Internal width (m)</Label>
              <Input id="internalWidthM" type="number" step="0.01" min={0} {...register("internalWidthM")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalHeightM">Internal height (m)</Label>
              <Input id="internalHeightM" type="number" step="0.01" min={0} {...register("internalHeightM")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doorOpeningWidthM">Door opening width (m)</Label>
              <Input id="doorOpeningWidthM" type="number" step="0.01" min={0} {...register("doorOpeningWidthM")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doorOpeningHeightM">Door opening height (m)</Label>
              <Input id="doorOpeningHeightM" type="number" step="0.01" min={0} {...register("doorOpeningHeightM")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floorType">Floor type</Label>
              <Select
                onValueChange={(v) => setValue("floorType", v as EquipmentFormInput["floorType"], { shouldValidate: true })}
                value={watch("floorType") ?? ""}
              >
                <SelectTrigger id="floorType">
                  <SelectValue placeholder="Pick…" />
                </SelectTrigger>
                <SelectContent>
                  {(["hardwood","plywood","bamboo","composite","steel"] as const).map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.floorType && <p className="text-xs text-destructive">{errors.floorType.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- 4. Certifications (EQUIP-05) ---------- */}
      <Card>
        <CardHeader>
          <CardTitle>Certifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cscPlateId">CSC plate ID</Label>
              <Input id="cscPlateId" placeholder="CSC/TH/12-345/2025" {...register("cscPlateId")} />
              {errors.cscPlateId && <p className="text-xs text-destructive">{errors.cscPlateId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="acepRegistration">ACEP registration</Label>
              <Input id="acepRegistration" placeholder="ACEP/TH/A12345-MSKU" {...register("acepRegistration")} />
              {errors.acepRegistration && <p className="text-xs text-destructive">{errors.acepRegistration.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextPeriodicExam">Next periodic exam</Label>
              <Input id="nextPeriodicExam" type="date" {...register("nextPeriodicExam")} />
              {errors.nextPeriodicExam && <p className="text-xs text-destructive">{errors.nextPeriodicExam.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="structuralTestDate">Structural test (5-year)</Label>
              <Input id="structuralTestDate" type="date" {...register("structuralTestDate")} />
              {errors.structuralTestDate && <p className="text-xs text-destructive">{errors.structuralTestDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="intermediateTestDate">Intermediate test (2.5-year)</Label>
              <Input id="intermediateTestDate" type="date" {...register("intermediateTestDate")} />
              {errors.intermediateTestDate && <p className="text-xs text-destructive">{errors.intermediateTestDate.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------- 5. TANK extensions (conditional) ---------- */}
      {category === "TANK" && (
        <Card>
          <CardHeader>
            <CardTitle>Tank specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tankShellMaterial">Shell material</Label>
                <Select
                  onValueChange={(v) => setValue("tankShellMaterial" as never, v as never, { shouldValidate: true })}
                  value={(watch("tankShellMaterial" as never) as unknown as string) ?? ""}
                >
                  <SelectTrigger id="tankShellMaterial"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {(["316L stainless","food-grade lined","carbon steel"] as const).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tankPressureBar">Pressure (bar)</Label>
                <Input id="tankPressureBar" type="number" step="0.1" min={0} {...register("tankPressureBar" as never)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tankCapacityL">Capacity (L)</Label>
                <Input id="tankCapacityL" type="number" min={0} {...register("tankCapacityL" as never)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tankImoClass">IMO class</Label>
                <Select
                  onValueChange={(v) => setValue("tankImoClass" as never, v as never, { shouldValidate: true })}
                  value={(watch("tankImoClass" as never) as unknown as string) ?? ""}
                >
                  <SelectTrigger id="tankImoClass"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {(["IMO 1","IMO 2","IMO 4","T7"] as const).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------- 6. REEFER extensions + ATP plate (EQUIP-06) ---------- */}
      {category === "REEFER" && (
        <Card>
          <CardHeader>
            <CardTitle>Reefer specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reeferRefrigerant">Refrigerant</Label>
                <Select
                  onValueChange={(v) => setValue("reeferRefrigerant" as never, v as never, { shouldValidate: true })}
                  value={(watch("reeferRefrigerant" as never) as unknown as string) ?? ""}
                >
                  <SelectTrigger id="reeferRefrigerant"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {(["R-134a","R-513A","R-404A"] as const).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reeferUnitModel">Unit model</Label>
                <Input id="reeferUnitModel" placeholder="Carrier 69NT40" {...register("reeferUnitModel" as never)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reeferSetpointMinC">Min setpoint (°C)</Label>
                <Input id="reeferSetpointMinC" type="number" {...register("reeferSetpointMinC" as never)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reeferSetpointMaxC">Max setpoint (°C)</Label>
                <Input id="reeferSetpointMaxC" type="number" {...register("reeferSetpointMaxC" as never)} />
              </div>
            </div>
            <div className="space-y-2 md:w-1/3">
              <Label htmlFor="atpPlateValidity">ATP plate validity</Label>
              <Input id="atpPlateValidity" type="date" {...register("atpPlateValidity" as never)} />
              {"atpPlateValidity" in errors && (
                <p className="text-xs text-destructive">
                  {(errors as Record<string, { message?: string }>).atpPlateValidity?.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---------- Actions ---------- */}
      <div className="flex justify-end gap-3">
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
          {isEdit ? "Save changes" : "Register equipment"}
        </Button>
      </div>
    </form>
  );
}
