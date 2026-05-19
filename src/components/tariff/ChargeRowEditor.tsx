"use client";

/**
 * <ChargeRowEditor> — Phase 7.8-B rewrite.
 *
 * THREE vertical-stacked card sections matching the WinForms reference:
 *   §1 Charges Details   — repair-pricing identity + base rates
 *   §2 Man Hours         — tiered labor slab table
 *   §3 Material Price    — tiered material slab table
 *
 * What this editor does NOT collect anymore (moved to card-header
 * agreement defaults — see StandardTariffCard / LinerTariffCard /
 * VendorTariffCard.default*): orderType, movementCode, cargoCategory,
 * paymentTerm, billedTo, originalRateThb, discountType, discountRate,
 * rebate, creditTermDays, truckCategory, isoType. The data model still
 * carries those for now (Phase 7.8-C drops them); when adding a NEW row
 * we pre-fill them from `parentCardDefaults`.
 *
 * Zero `style={{}}` — all visual chrome comes from gecko classes
 * (gecko-card, gecko-btn-*, gecko-modal-title-lg, gecko-section-label,
 * gecko-field-label) plus the co-located CSS Module.
 */

import { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/Icon";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { chargeRowSchema, type ChargeRowInput } from "@/lib/validators/tariff";
import { chargeCodes, findChargeCode } from "@/data/seed/_shared/charge-codes";
import { containerModes } from "@/data/seed/_shared/container-modes";
import { uoms } from "@/data/seed/_shared/uoms";
import {
  cedexComponents,
  cedexRepairs,
  cedexDamages,
} from "@/data/seed/_shared/cedex";
import type {
  ChargeRow,
  ManHoursSlabRow,
  MaterialPriceSlabRow,
} from "@/lib/types/tariff/charge-row";

import styles from "./ChargeRowEditor.module.css";

/**
 * Subset of card-header agreement defaults the editor uses to pre-fill new
 * rows. After Phase 7.8-C the ChargeRow itself no longer carries these
 * fields — they live on the parent card. The editor keeps the prop for
 * future use (e.g. surfacing inheritance hints in the form), but does not
 * write any of them into the row payload.
 */
export interface ParentCardDefaults {
  defaultOrderType?: string;
  defaultMovementCode?: string;
  defaultCargoCategory?: "GENERAL" | "HAZMAT" | "REEFER" | "FOODGRADE";
  defaultPaymentTerm?: "CASH" | "CREDIT";
  defaultBilledTo?: "AGENT";
  defaultCreditTermDays?: number;
  defaultTruckCategory?: string;
  defaultDiscountType?: "NONE" | "PERCENT" | "FIXED";
  defaultDiscountRate?: number;
  defaultRebate?: number;
}

export interface ChargeRowEditorProps {
  open: boolean;
  initial?: ChargeRow | null;
  parentCardDefaults?: ParentCardDefaults;
  onClose: () => void;
  onSave: (row: ChargeRow) => void;
}

// ─── small primitives (all use gecko classes / CSS module) ─────────────

function FieldLabelText({
  htmlFor,
  required,
  hint,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Label htmlFor={htmlFor} className="gecko-field-label">
      {children}
      {required && <span className="gecko-field-required">*</span>}
      {hint && <span className="gecko-field-hint">({hint})</span>}
    </Label>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────

function buildEmptyRow(_parent?: ParentCardDefaults): ChargeRowInput {
  // Phase 7.8-C: ChargeRow is now a pure M&R repair-pricing record.
  // Agreement-level defaults are read from the parent card by consumers
  // (simulator, billing) — the editor does not write them into the row.
  return {
    id: "",
    chargeCode: "",
    billingUnit: "JOB",
    sellingRateThb: 0,
    adjustable: false,
  };
}

// ─── editor ────────────────────────────────────────────────────────────

export function ChargeRowEditor({
  open,
  initial,
  parentCardDefaults,
  onClose,
  onSave,
}: ChargeRowEditorProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChargeRowInput>({
    resolver: zodResolver(chargeRowSchema),
    defaultValues: buildEmptyRow(parentCardDefaults),
    mode: "onBlur",
  });

  // Local slab state (managed outside react-hook-form for table-of-rows UX)
  const [manHoursSlab, setManHoursSlab] = useState<ManHoursSlabRow[]>([]);
  const [materialPriceSlab, setMaterialPriceSlab] = useState<MaterialPriceSlabRow[]>([]);

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? { ...(initial as unknown as ChargeRowInput) }
          : { ...buildEmptyRow(parentCardDefaults), id: `r-${Date.now()}` },
      );
      setManHoursSlab(initial?.manHoursSlab ?? []);
      setMaterialPriceSlab(initial?.materialPriceSlab ?? []);
    }
  }, [open, initial, parentCardDefaults, reset]);

  // Auto-fill billingUnit + CEDEX component / repair from chargeCode.
  // (chargeType lives on the charge-code master, not on the row; derived
  //  on display via findChargeCode(row.chargeCode).chargeType.)
  const selectedChargeCode = watch("chargeCode");
  useEffect(() => {
    if (!selectedChargeCode) return;
    const meta = findChargeCode(selectedChargeCode);
    if (!meta) return;
    setValue("billingUnit", meta.defaultBillingUnit, { shouldValidate: true });
    if (meta.cedexComponent) {
      setValue("component", meta.cedexComponent, { shouldValidate: true });
    }
    if (meta.cedexRepair) {
      setValue("repairCode", meta.cedexRepair, { shouldValidate: true });
    }
  }, [selectedChargeCode, setValue]);

  const cedexCodeOptions = useMemo(
    () => chargeCodes.filter((c) => c.cedexComponent),
    [],
  );
  const svcCodeOptions = useMemo(
    () => chargeCodes.filter((c) => !c.cedexComponent),
    [],
  );

  const finalizeRow = (input: ChargeRowInput): ChargeRow => ({
    ...(input as unknown as ChargeRow),
    manHoursSlab: manHoursSlab.length > 0 ? manHoursSlab : undefined,
    materialPriceSlab: materialPriceSlab.length > 0 ? materialPriceSlab : undefined,
  });

  const submitClose: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(finalizeRow(input));
    onClose();
  };

  const submitAndContinue: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(finalizeRow(input));
    // Keep applicability context, reset identity + pricing.
    const carryFromInput = {
      containerMode: input.containerMode,
      uom: input.uom,
    };
    reset({
      ...buildEmptyRow(parentCardDefaults),
      ...carryFromInput,
      id: `r-${Date.now()}`,
    });
    setManHoursSlab([]);
    setMaterialPriceSlab([]);
  };

  // ─── slab mutators ─────────────────────────────────────────────────

  const addManHoursSlab = () =>
    setManHoursSlab((prev) => [
      ...prev,
      {
        fromHour: prev.length === 0 ? 0 : (prev[prev.length - 1].toHour ?? 0) + 1,
        toHour: 0,
        manHours: 0,
      },
    ]);
  const updateManHoursSlab = (i: number, patch: Partial<ManHoursSlabRow>) =>
    setManHoursSlab((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeManHoursSlab = (i: number) =>
    setManHoursSlab((prev) => prev.filter((_, idx) => idx !== i));

  const addMaterialPriceSlab = () =>
    setMaterialPriceSlab((prev) => [
      ...prev,
      {
        fromQty: prev.length === 0 ? 0 : (prev[prev.length - 1].toQty ?? 0) + 1,
        toQty: 0,
        priceThb: 0,
        costThb: 0,
      },
    ]);
  const updateMaterialPriceSlab = (i: number, patch: Partial<MaterialPriceSlabRow>) =>
    setMaterialPriceSlab((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeMaterialPriceSlab = (i: number) =>
    setMaterialPriceSlab((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* ─── Title bar ─────────────────────────────────────────────── */}
        <DialogHeader className={styles.headerBar}>
          <DialogTitle asChild>
            <h2 className="gecko-modal-title-lg">
              {initial ? "Edit charge row" : "Add charge row"}
            </h2>
          </DialogTitle>
        </DialogHeader>

        <form
          id="charge-row-form"
          onSubmit={handleSubmit(submitClose)}
          className={styles.body}
        >
          {/* ═════════════════════════ §1 — CHARGES DETAILS ═════════ */}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className="gecko-section-label">Charges Details</span>
            </header>

            <div className="mb-3">
              <FieldLabelText htmlFor="chargeCode" required>
                Charge Code
              </FieldLabelText>
              <Select
                onValueChange={(v) => setValue("chargeCode", v, { shouldValidate: true })}
                value={watch("chargeCode") ?? ""}
              >
                <SelectTrigger id="chargeCode">
                  <SelectValue placeholder="Select a charge code…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>CEDEX — Repair</SelectLabel>
                    {cedexCodeOptions.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="gecko-text-mono">{c.code}</span>
                        {" — "}
                        <span>{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Services</SelectLabel>
                    {svcCodeOptions.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="gecko-text-mono">{c.code}</span>
                        {" — "}
                        <span>{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.chargeCode && (
                <p className="gecko-text-mono gecko-section-label">
                  {errors.chargeCode.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <FieldLabelText htmlFor="containerMode">Container Mode</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("containerMode", v, { shouldValidate: true })}
                  value={watch("containerMode") ?? ""}
                >
                  <SelectTrigger id="containerMode"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {containerModes.map((m) => (
                      <SelectItem key={m.code} value={m.code}>{m.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="damageCode" hint="CEDEX">Damage Code</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("damageCode", v, { shouldValidate: true })}
                  value={watch("damageCode") ?? ""}
                >
                  <SelectTrigger id="damageCode"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {cedexDamages.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        <span className={styles.itemCode}>{d.code}</span>
                        <span className={styles.itemLabel}>{d.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="repairCode" hint="CEDEX">Repair Code</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("repairCode", v, { shouldValidate: true })}
                  value={watch("repairCode") ?? ""}
                >
                  <SelectTrigger id="repairCode"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {cedexRepairs.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        <span className={styles.itemCode}>{r.code}</span>
                        <span className={styles.itemLabel}>{r.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="component" hint="CEDEX">Component</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("component", v, { shouldValidate: true })}
                  value={watch("component") ?? ""}
                >
                  <SelectTrigger id="component"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {cedexComponents.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className={styles.itemCode}>{c.code}</span>
                        <span className={styles.itemLabel}>{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-3">
              <div>
                <FieldLabelText htmlFor="uom">UOM</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("uom", v, { shouldValidate: true })}
                  value={watch("uom") ?? ""}
                >
                  <SelectTrigger id="uom"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {uoms.map((u) => (
                      <SelectItem key={u.code} value={u.code}>{u.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="size">Size</FieldLabelText>
                <Select
                  onValueChange={(v) =>
                    setValue(
                      "size",
                      v === "_none" ? undefined : (v as ChargeRowInput["size"]),
                      { shouldValidate: true },
                    )
                  }
                  value={watch("size") ?? "_none"}
                >
                  <SelectTrigger id="size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">(any)</SelectItem>
                    <SelectItem value="20">20&apos;</SelectItem>
                    <SelectItem value="40">40&apos;</SelectItem>
                    <SelectItem value="45">45&apos;</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={watch("adjustable") ?? false}
                    onCheckedChange={(c) =>
                      setValue("adjustable", c === true, { shouldValidate: true })
                    }
                  />
                  <span className="gecko-field-label">Adjustable</span>
                </label>
              </div>
              <div />
            </div>

            <div className="grid grid-cols-4 gap-3 mt-3">
              <div>
                <FieldLabelText htmlFor="maxHour">Max Hour</FieldLabelText>
                <Input
                  id="maxHour"
                  type="number"
                  min={0}
                  className={`gecko-text-mono ${styles.numInput}`}
                  {...register("maxHour")}
                />
              </div>
              <div>
                <FieldLabelText htmlFor="maxQuantity">Max Quantity</FieldLabelText>
                <Input
                  id="maxQuantity"
                  type="number"
                  min={0}
                  className={`gecko-text-mono ${styles.numInput}`}
                  {...register("maxQuantity")}
                />
              </div>
              <div>
                <FieldLabelText htmlFor="labourRateThb" hint="THB / hr">
                  Labour Rate
                </FieldLabelText>
                <Input
                  id="labourRateThb"
                  type="number"
                  min={0}
                  className={`gecko-text-mono ${styles.numInput}`}
                  {...register("labourRateThb")}
                />
              </div>
              <div>
                <FieldLabelText htmlFor="sellingRateThb" required hint="THB">
                  Selling Rate
                </FieldLabelText>
                <Input
                  id="sellingRateThb"
                  type="number"
                  min={0}
                  className={`gecko-text-mono ${styles.numInput}`}
                  {...register("sellingRateThb")}
                />
                {errors.sellingRateThb && (
                  <p className="gecko-section-label">{errors.sellingRateThb.message}</p>
                )}
              </div>
            </div>
          </section>

          {/* ═════════════════════════ §2 — MAN HOURS ═══════════════ */}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className="gecko-section-label">Man Hours</span>
            </header>

            {manHoursSlab.length === 0 ? (
              <p className={styles.slabEmpty}>
                No tiered labor pricing — uses base Labour Rate from §1.
              </p>
            ) : (
              <table className={styles.slabTable}>
                <thead>
                  <tr>
                    <th>From hr</th>
                    <th>To hr</th>
                    <th>Man hours</th>
                    <th className={styles.actions} aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {manHoursSlab.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <Input
                          type="number"
                          min={0}
                          value={row.fromHour}
                          onChange={(e) => updateManHoursSlab(i, { fromHour: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          min={0}
                          value={row.toHour}
                          onChange={(e) => updateManHoursSlab(i, { toHour: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={row.manHours}
                          onChange={(e) => updateManHoursSlab(i, { manHours: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => removeManHoursSlab(i)}
                          aria-label="Remove slab tier"
                          className={styles.removeBtn}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className={styles.addSlab}>
              <button
                type="button"
                onClick={addManHoursSlab}
                className="gecko-btn gecko-btn-outline gecko-btn-sm"
              >
                <Icon name="plus" size={14} /> Add slab tier
              </button>
            </div>
          </section>

          {/* ═════════════════════════ §3 — MATERIAL PRICE ══════════ */}
          <section className={styles.section}>
            <header className={styles.sectionHeader}>
              <span className="gecko-section-label">Material Price</span>
            </header>

            {materialPriceSlab.length === 0 ? (
              <p className={styles.slabEmpty}>No tiered material pricing.</p>
            ) : (
              <table className={styles.slabTable}>
                <thead>
                  <tr>
                    <th>From qty</th>
                    <th>To qty</th>
                    <th className={styles.num}>Price (THB)</th>
                    <th className={styles.num}>Cost (THB)</th>
                    <th className={styles.actions} aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {materialPriceSlab.map((row, i) => (
                    <tr key={i}>
                      <td>
                        <Input
                          type="number"
                          min={0}
                          value={row.fromQty}
                          onChange={(e) => updateMaterialPriceSlab(i, { fromQty: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          min={0}
                          value={row.toQty}
                          onChange={(e) => updateMaterialPriceSlab(i, { toQty: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td className={styles.num}>
                        <Input
                          type="number"
                          min={0}
                          value={row.priceThb}
                          onChange={(e) => updateMaterialPriceSlab(i, { priceThb: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td className={styles.num}>
                        <Input
                          type="number"
                          min={0}
                          value={row.costThb}
                          onChange={(e) => updateMaterialPriceSlab(i, { costThb: Number(e.target.value) })}
                          className={`gecko-text-mono ${styles.numInput} h-8`}
                        />
                      </td>
                      <td className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => removeMaterialPriceSlab(i)}
                          aria-label="Remove slab tier"
                          className={styles.removeBtn}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className={styles.addSlab}>
              <button
                type="button"
                onClick={addMaterialPriceSlab}
                className="gecko-btn gecko-btn-outline gecko-btn-sm"
              >
                <Icon name="plus" size={14} /> Add slab tier
              </button>
            </div>
          </section>
        </form>

        {/* ─── Footer ────────────────────────────────────────────────── */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={onClose}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(submitAndContinue)()}
            disabled={isSubmitting}
            className="gecko-btn gecko-btn-outline gecko-btn-sm"
          >
            Save and add another
          </button>
          <button
            type="submit"
            form="charge-row-form"
            disabled={isSubmitting}
            className="gecko-btn gecko-btn-primary gecko-btn-sm"
          >
            {initial ? "Save changes" : "Save row"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
