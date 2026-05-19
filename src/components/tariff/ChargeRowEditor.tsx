"use client";

/**
 * <ChargeRowEditor> — Phase 7.8-F rewrite using NATIVE gecko form primitives.
 *
 * Match TOS exactly:
 *   - native <input class="gecko-input">       (36px h, 13px text, gecko-bg-surface)
 *   - native <select class="gecko-select">     (36px h, 13px text, baked-in chevron)
 *   - native <label class="gecko-field-label"> (11-13px medium)
 *   - <div class="gecko-field">                (flex-column, 4-5px gap)
 * The previous shadcn Radix Select / shadcn Input mix rendered at different
 * heights and styles, causing the "dancing" look. Migrating to gecko
 * primitives + native HTML aligns everything on the same 36px baseline.
 *
 * Three sections (vertical stack, hairline dividers — no boxed chrome):
 *   §1 Charges Details   — repair-pricing identity + base rates
 *   §2 Man Hours         — tiered labor slab table
 *   §3 Material Price    — tiered material slab table
 *
 * Zero inline `style={{}}` props per CLAUDE.md §1.
 */

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/Icon";

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

const emptyRow: ChargeRowInput = {
  id: "",
  chargeCode: "",
  billingUnit: "JOB",
  sellingRateThb: 0,
  adjustable: false,
};

const cedexCodeOptions = chargeCodes.filter((c) => c.cedexComponent);
const svcCodeOptions = chargeCodes.filter((c) => !c.cedexComponent);

export function ChargeRowEditor({
  open,
  initial,
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
    defaultValues: emptyRow,
    mode: "onBlur",
  });

  const [manHoursSlab, setManHoursSlab] = useState<ManHoursSlabRow[]>([]);
  const [materialPriceSlab, setMaterialPriceSlab] = useState<MaterialPriceSlabRow[]>([]);

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? { ...(initial as unknown as ChargeRowInput) }
          : { ...emptyRow, id: `r-${Date.now()}` },
      );
      setManHoursSlab(initial?.manHoursSlab ?? []);
      setMaterialPriceSlab(initial?.materialPriceSlab ?? []);
    }
  }, [open, initial, reset]);

  // Auto-fill billingUnit + CEDEX component / repair from chargeCode
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

  const finalize = (input: ChargeRowInput): ChargeRow => ({
    ...(input as unknown as ChargeRow),
    manHoursSlab: manHoursSlab.length > 0 ? manHoursSlab : undefined,
    materialPriceSlab: materialPriceSlab.length > 0 ? materialPriceSlab : undefined,
  });

  const submitClose: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(finalize(input));
    onClose();
  };

  const submitAndContinue: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(finalize(input));
    const kept = {
      chargeCode: input.chargeCode,
      billingUnit: input.billingUnit,
      containerMode: input.containerMode,
      uom: input.uom,
    };
    reset({ ...emptyRow, ...kept, id: `r-${Date.now()}` });
    setManHoursSlab([]);
    setMaterialPriceSlab([]);
  };

  // Slab table mutators
  const addManHours = () =>
    setManHoursSlab((prev) => [
      ...prev,
      { fromHour: prev.length === 0 ? 0 : (prev[prev.length - 1].toHour ?? 0) + 1, toHour: 0, manHours: 0 },
    ]);
  const updateManHours = (i: number, patch: Partial<ManHoursSlabRow>) =>
    setManHoursSlab((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeManHours = (i: number) =>
    setManHoursSlab((prev) => prev.filter((_, idx) => idx !== i));

  const addMaterial = () =>
    setMaterialPriceSlab((prev) => [
      ...prev,
      { fromQty: prev.length === 0 ? 0 : (prev[prev.length - 1].toQty ?? 0) + 1, toQty: 0, priceThb: 0, costThb: 0 },
    ]);
  const updateMaterial = (i: number, patch: Partial<MaterialPriceSlabRow>) =>
    setMaterialPriceSlab((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeMaterial = (i: number) =>
    setMaterialPriceSlab((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
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

            {/* Row 1: Charge Code spans full width */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-4 gecko-field">
                <label htmlFor="chargeCode" className="gecko-field-label">
                  Charge Code <span className="gecko-field-required">*</span>
                </label>
                <select id="chargeCode" className="gecko-select" {...register("chargeCode")}>
                  <option value="">Select a charge code…</option>
                  <optgroup label="CEDEX — Repair">
                    {cedexCodeOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Services">
                    {svcCodeOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {errors.chargeCode && (
                  <span className="gecko-field-error">{errors.chargeCode.message}</span>
                )}
              </div>
            </div>

            {/* Row 2: Container Mode · Damage · Repair · Component (4 cols) */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div className="gecko-field">
                <label htmlFor="containerMode" className="gecko-field-label">Container Mode</label>
                <select id="containerMode" className="gecko-select" {...register("containerMode")}>
                  <option value="">—</option>
                  {containerModes.map((m) => (
                    <option key={m.code} value={m.code}>{m.code}</option>
                  ))}
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="damageCode" className="gecko-field-label">
                  Damage <span className="gecko-field-helper">(CEDEX)</span>
                </label>
                <select id="damageCode" className="gecko-select" {...register("damageCode")}>
                  <option value="">—</option>
                  {cedexDamages.map((d) => (
                    <option key={d.code} value={d.code}>{d.code}</option>
                  ))}
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="repairCode" className="gecko-field-label">
                  Repair <span className="gecko-field-helper">(CEDEX)</span>
                </label>
                <select id="repairCode" className="gecko-select" {...register("repairCode")}>
                  <option value="">—</option>
                  {cedexRepairs.map((r) => (
                    <option key={r.code} value={r.code}>{r.code}</option>
                  ))}
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="component" className="gecko-field-label">
                  Component <span className="gecko-field-helper">(CEDEX)</span>
                </label>
                <select id="component" className="gecko-select" {...register("component")}>
                  <option value="">—</option>
                  {cedexComponents.map((c) => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: UOM · Size · Adjustable · (spacer) */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div className="gecko-field">
                <label htmlFor="uom" className="gecko-field-label">UOM</label>
                <select id="uom" className="gecko-select" {...register("uom")}>
                  <option value="">—</option>
                  {uoms.map((u) => (
                    <option key={u.code} value={u.code}>{u.code}</option>
                  ))}
                </select>
              </div>
              <div className="gecko-field">
                <label htmlFor="size" className="gecko-field-label">Size</label>
                <select id="size" className="gecko-select" {...register("size")}>
                  <option value="">(any)</option>
                  <option value="20">20&apos;</option>
                  <option value="40">40&apos;</option>
                  <option value="45">45&apos;</option>
                </select>
              </div>
              <div className={styles.checkboxField}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" {...register("adjustable")} />
                  <span className="gecko-field-label">Adjustable</span>
                </label>
              </div>
              <div />
            </div>

            {/* Row 4: Max Hour · Max Quantity · Labour Rate · Selling Rate */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <div className="gecko-field">
                <label htmlFor="maxHour" className="gecko-field-label">Max Hour</label>
                <input id="maxHour" type="number" min={0} className="gecko-input" {...register("maxHour")} />
              </div>
              <div className="gecko-field">
                <label htmlFor="maxQuantity" className="gecko-field-label">Max Quantity</label>
                <input id="maxQuantity" type="number" min={0} className="gecko-input" {...register("maxQuantity")} />
              </div>
              <div className="gecko-field">
                <label htmlFor="labourRateThb" className="gecko-field-label">
                  Labour Rate <span className="gecko-field-helper">(THB / hr)</span>
                </label>
                <input id="labourRateThb" type="number" min={0} className="gecko-input" {...register("labourRateThb")} />
              </div>
              <div className="gecko-field">
                <label htmlFor="sellingRateThb" className="gecko-field-label">
                  Selling Rate <span className="gecko-field-required">*</span>{" "}
                  <span className="gecko-field-helper">(THB)</span>
                </label>
                <input id="sellingRateThb" type="number" min={0} className="gecko-input" {...register("sellingRateThb")} />
                {errors.sellingRateThb && (
                  <span className="gecko-field-error">{errors.sellingRateThb.message}</span>
                )}
              </div>
            </div>
          </section>

          {/* ═════════════════════════ §2 — MAN HOURS ═════════════ */}
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
                        <input
                          type="number"
                          min={0}
                          className="gecko-input gecko-input-sm"
                          value={row.fromHour}
                          onChange={(e) => updateManHours(i, { fromHour: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className="gecko-input gecko-input-sm"
                          value={row.toHour}
                          onChange={(e) => updateManHours(i, { toHour: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          className="gecko-input gecko-input-sm"
                          value={row.manHours}
                          onChange={(e) => updateManHours(i, { manHours: Number(e.target.value) })}
                        />
                      </td>
                      <td className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => removeManHours(i)}
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
                onClick={addManHours}
                className="gecko-btn gecko-btn-outline gecko-btn-sm"
              >
                <Icon name="plus" size={14} /> Add slab tier
              </button>
            </div>
          </section>

          {/* ═════════════════════════ §3 — MATERIAL PRICE ════════ */}
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
                        <input
                          type="number"
                          min={0}
                          className="gecko-input gecko-input-sm"
                          value={row.fromQty}
                          onChange={(e) => updateMaterial(i, { fromQty: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          className="gecko-input gecko-input-sm"
                          value={row.toQty}
                          onChange={(e) => updateMaterial(i, { toQty: Number(e.target.value) })}
                        />
                      </td>
                      <td className={styles.num}>
                        <input
                          type="number"
                          min={0}
                          className={`gecko-input gecko-input-sm ${styles.numInput}`}
                          value={row.priceThb}
                          onChange={(e) => updateMaterial(i, { priceThb: Number(e.target.value) })}
                        />
                      </td>
                      <td className={styles.num}>
                        <input
                          type="number"
                          min={0}
                          className={`gecko-input gecko-input-sm ${styles.numInput}`}
                          value={row.costThb}
                          onChange={(e) => updateMaterial(i, { costThb: Number(e.target.value) })}
                        />
                      </td>
                      <td className={styles.actions}>
                        <button
                          type="button"
                          onClick={() => removeMaterial(i)}
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
                onClick={addMaterial}
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
