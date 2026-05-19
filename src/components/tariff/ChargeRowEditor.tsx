"use client";

/**
 * <ChargeRowEditor> — Phase 7.7 "editorial tariff document" redesign.
 *
 * Three numbered editorial sections (No. 01 / 02 / 03) stacked vertically:
 *   01 — CHARGES DETAILS (with italic sub-kickers: identity / applicability
 *        / pricing / payment terms)
 *   02 — MAN HOURS slab table (financial-statement style)
 *   03 — MATERIAL PRICE slab table
 *
 * Aesthetic moves:
 *   - section markers are tracked-out small caps secondary, flanked by
 *     hairline rules with mono "No. NN" at the right
 *   - italic kickers (11px, lowercase) guide the eye inside section 01
 *   - slab tables read like a financial statement: tabular-nums mono,
 *     hairline row dividers, "+ Add slab tier" as an underlined text-link
 *   - 95% neutrals; gecko-primary-600 ONLY on focused field borders + the
 *     primary "Save row" CTA
 *   - footer hierarchy: cancel = text link, save-and-add-another = text
 *     button with underline-on-hover, save row = primary
 *   - staggered fade-in on open (80ms × 3 sections)
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
import { orderTypes } from "@/data/seed/_shared/order-types";
import { movementCodes } from "@/data/seed/_shared/movement-codes";
import { cargoCategories } from "@/data/seed/_shared/cargo-categories";
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

export interface ChargeRowEditorProps {
  open: boolean;
  initial?: ChargeRow | null;
  onClose: () => void;
  onSave: (row: ChargeRow) => void;
}

// ─── style tokens (composed from gecko CSS variables) ─────────────────

const TITLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "var(--gecko-text-primary)",
  margin: 0,
  lineHeight: 1.4,
};

const SECTION_RULE_TEXT: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--gecko-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  whiteSpace: "nowrap",
};

const SECTION_RULE_NO: React.CSSProperties = {
  ...SECTION_RULE_TEXT,
  fontFamily: "var(--gecko-font-mono)",
  fontWeight: 500,
};

const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontStyle: "italic",
  color: "var(--gecko-text-secondary)",
  marginBottom: 8,
  marginTop: 18,
  letterSpacing: "0.02em",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "var(--gecko-text-primary)",
  display: "block",
  marginBottom: 6,
};

const FIELD_LABEL_HINT: React.CSSProperties = {
  fontSize: 11,
  color: "var(--gecko-text-secondary)",
  fontWeight: 400,
  marginLeft: 6,
  fontStyle: "italic",
};

const MONO_NUM: React.CSSProperties = {
  fontFamily: "var(--gecko-font-mono)",
  fontVariantNumeric: "tabular-nums",
};

const SLAB_TH: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--gecko-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  padding: "8px 12px",
  textAlign: "left",
  borderBottom: "1px solid var(--gecko-border)",
};

const SLAB_TD: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--gecko-border)",
  fontSize: 13,
};

const TEXT_LINK: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  font: "inherit",
  fontSize: 12,
  color: "var(--gecko-text-secondary)",
  cursor: "pointer",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  textDecorationColor: "var(--gecko-border)",
};

// ─── small primitives ─────────────────────────────────────────────────

function SectionMarker({ no, label }: { no: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        marginTop: 40,
        marginBottom: 16,
      }}
    >
      <span style={SECTION_RULE_TEXT}>{label}</span>
      <span
        aria-hidden
        style={{ flex: 1, height: 1, background: "var(--gecko-border)" }}
      />
      <span style={SECTION_RULE_NO}>No. {no}</span>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <div style={KICKER}>{children}</div>;
}

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
    <Label htmlFor={htmlFor} style={FIELD_LABEL}>
      {children}
      {required && (
        <span style={{ color: "var(--gecko-error-600)", marginLeft: 2 }}>*</span>
      )}
      {hint && <span style={FIELD_LABEL_HINT}>({hint})</span>}
    </Label>
  );
}

// ─── empty form value ──────────────────────────────────────────────────

const emptyRow: ChargeRowInput = {
  id: "",
  chargeCode: "",
  orderType: "",
  movementCode: "",
  chargeType: "REPAIR",
  billingUnit: "JOB",
  cargoCategory: "GENERAL",
  paymentTerm: "CASH",
  billedTo: "AGENT",
  originalRateThb: 0,
  discountType: "NONE",
  sellingRateThb: 0,
  adjustable: false,
};

// ─── editor ────────────────────────────────────────────────────────────

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

  // Local slab state (managed outside react-hook-form for table-of-rows UX)
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

  // Auto-fill chargeType / billingUnit + CEDEX component / repair from chargeCode
  const selectedChargeCode = watch("chargeCode");
  useEffect(() => {
    if (!selectedChargeCode) return;
    const meta = findChargeCode(selectedChargeCode);
    if (!meta) return;
    setValue("chargeType", meta.chargeType, { shouldValidate: true });
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

  const submitClose: SubmitHandler<ChargeRowInput> = (input) => {
    const row: ChargeRow = {
      ...(input as unknown as ChargeRow),
      manHoursSlab: manHoursSlab.length > 0 ? manHoursSlab : undefined,
      materialPriceSlab: materialPriceSlab.length > 0 ? materialPriceSlab : undefined,
    };
    onSave(row);
    onClose();
  };

  const submitAndContinue: SubmitHandler<ChargeRowInput> = (input) => {
    const row: ChargeRow = {
      ...(input as unknown as ChargeRow),
      manHoursSlab: manHoursSlab.length > 0 ? manHoursSlab : undefined,
      materialPriceSlab: materialPriceSlab.length > 0 ? materialPriceSlab : undefined,
    };
    onSave(row);
    const kept = {
      chargeCode: input.chargeCode,
      orderType: input.orderType,
      movementCode: input.movementCode,
      chargeType: input.chargeType,
      billingUnit: input.billingUnit,
      cargoCategory: input.cargoCategory,
      paymentTerm: input.paymentTerm,
      billedTo: input.billedTo as "AGENT",
      containerMode: input.containerMode,
      damageCode: input.damageCode,
      repairCode: input.repairCode,
      component: input.component,
      uom: input.uom,
    };
    reset({ ...emptyRow, ...kept, id: `r-${Date.now()}` });
    setManHoursSlab([]);
    setMaterialPriceSlab([]);
  };

  // ─── slab table mutators ────────────────────────────────────────────

  const addManHoursSlab = () =>
    setManHoursSlab((prev) => [
      ...prev,
      { fromHour: prev.length === 0 ? 0 : (prev[prev.length - 1].toHour ?? 0) + 1, toHour: 0, manHours: 0 },
    ]);
  const updateManHoursSlab = (i: number, patch: Partial<ManHoursSlabRow>) =>
    setManHoursSlab((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeManHoursSlab = (i: number) =>
    setManHoursSlab((prev) => prev.filter((_, idx) => idx !== i));

  const addMaterialPriceSlab = () =>
    setMaterialPriceSlab((prev) => [
      ...prev,
      { fromQty: prev.length === 0 ? 0 : (prev[prev.length - 1].toQty ?? 0) + 1, toQty: 0, priceThb: 0, costThb: 0 },
    ]);
  const updateMaterialPriceSlab = (i: number, patch: Partial<MaterialPriceSlabRow>) =>
    setMaterialPriceSlab((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeMaterialPriceSlab = (i: number) =>
    setMaterialPriceSlab((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* ─── Title bar ─────────────────────────────────────────────── */}
        <DialogHeader
          className="px-8 py-5"
          style={{ borderBottom: "1px solid var(--gecko-border)" }}
        >
          <DialogTitle asChild>
            <h2 style={TITLE}>{initial ? "Edit charge row" : "Add charge row"}</h2>
          </DialogTitle>
        </DialogHeader>

        <form
          id="charge-row-form"
          onSubmit={handleSubmit(submitClose)}
          className="px-8 pb-6"
          style={{ paddingTop: 12 }}
        >
          {/* ═════════════════════════════════════════════════════════════
              No. 01 — CHARGES DETAILS
              ═════════════════════════════════════════════════════════ */}
          <div className="charge-row-editor-section" style={{ animationDelay: "0ms" }}>
            <SectionMarker no="01" label="Charges Details" />

            <Kicker>identity</Kicker>

            <div style={{ marginBottom: 16 }}>
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
                        <span style={{ ...MONO_NUM, color: "var(--gecko-primary-700)" }}>{c.code}</span>
                        <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Services</SelectLabel>
                    {svcCodeOptions.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span style={{ ...MONO_NUM, color: "var(--gecko-primary-700)" }}>{c.code}</span>
                        <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.chargeCode && (
                <p className="text-xs text-destructive mt-1">{errors.chargeCode.message}</p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <FieldLabelText htmlFor="containerMode">Container Mode</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("containerMode", v, { shouldValidate: true })}
                  value={watch("containerMode") ?? ""}
                >
                  <SelectTrigger id="containerMode"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {containerModes.map((m) => (
                      <SelectItem key={m.code} value={m.code}>{m.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="damageCode" hint="CEDEX">Damage</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("damageCode", v, { shouldValidate: true })}
                  value={watch("damageCode") ?? ""}
                >
                  <SelectTrigger id="damageCode"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {cedexDamages.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        <span style={MONO_NUM}>{d.code}</span>
                        <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>{d.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="repairCode" hint="CEDEX">Repair</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("repairCode", v, { shouldValidate: true })}
                  value={watch("repairCode") ?? ""}
                >
                  <SelectTrigger id="repairCode"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {cedexRepairs.map((r) => (
                      <SelectItem key={r.code} value={r.code}>
                        <span style={MONO_NUM}>{r.code}</span>
                        <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>{r.label}</span>
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
                  <SelectTrigger id="component"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {cedexComponents.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <span style={MONO_NUM}>{c.code}</span>
                        <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 mt-3">
              <div>
                <FieldLabelText htmlFor="uom">UOM</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("uom", v, { shouldValidate: true })}
                  value={watch("uom") ?? ""}
                >
                  <SelectTrigger id="uom"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {uoms.map((u) => (
                      <SelectItem key={u.code} value={u.code}>{u.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6 }}>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <Checkbox
                    checked={watch("adjustable") ?? false}
                    onCheckedChange={(c) =>
                      setValue("adjustable", c === true, { shouldValidate: true })
                    }
                  />
                  <span style={{ color: "var(--gecko-text-primary)" }}>Adjustable</span>
                </label>
              </div>
              <div>
                <FieldLabelText htmlFor="maxHour">Max Hour</FieldLabelText>
                <Input id="maxHour" type="number" min={0} style={MONO_NUM} {...register("maxHour")} />
              </div>
              <div>
                <FieldLabelText htmlFor="maxQuantity">Max Quantity</FieldLabelText>
                <Input id="maxQuantity" type="number" min={0} style={MONO_NUM} {...register("maxQuantity")} />
              </div>
              <div>
                <FieldLabelText htmlFor="labourRateThb" hint="THB / HR">Labour Rate</FieldLabelText>
                <Input id="labourRateThb" type="number" min={0} style={MONO_NUM} {...register("labourRateThb")} />
              </div>
            </div>

            <Kicker>applicability</Kicker>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <FieldLabelText htmlFor="orderType" required>Order Type</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("orderType", v, { shouldValidate: true })}
                  value={watch("orderType") ?? ""}
                >
                  <SelectTrigger id="orderType"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {orderTypes.map((o) => (
                      <SelectItem key={o.code} value={o.code}>{o.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="movementCode" required>Movement</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("movementCode", v, { shouldValidate: true })}
                  value={watch("movementCode") ?? ""}
                >
                  <SelectTrigger id="movementCode"><SelectValue placeholder="Pick…" /></SelectTrigger>
                  <SelectContent>
                    {movementCodes.map((m) => (
                      <SelectItem key={m.code} value={m.code}>{m.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="size">Size</FieldLabelText>
                <Select
                  onValueChange={(v) =>
                    setValue("size", v === "_none" ? undefined : (v as ChargeRowInput["size"]), { shouldValidate: true })
                  }
                  value={watch("size") ?? "_none"}
                >
                  <SelectTrigger id="size"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">(any)</SelectItem>
                    <SelectItem value="20">20'</SelectItem>
                    <SelectItem value="40">40'</SelectItem>
                    <SelectItem value="45">45'</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="cargoCategory" required>Cargo Cat.</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("cargoCategory", v as ChargeRowInput["cargoCategory"], { shouldValidate: true })}
                  value={watch("cargoCategory") ?? ""}
                >
                  <SelectTrigger id="cargoCategory"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cargoCategories.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3 items-end">
              <div>
                <FieldLabelText htmlFor="truckCategory">Truck Cat.</FieldLabelText>
                <Input id="truckCategory" placeholder="(optional)" {...register("truckCategory")} />
              </div>
              <div style={{ gridColumn: "span 3", paddingBottom: 6 }}>
                <span style={{ fontSize: 12, color: "var(--gecko-text-secondary)" }}>
                  Billed to <span style={{ ...MONO_NUM, color: "var(--gecko-text-primary)", fontWeight: 600 }}>AGENT</span> — pinned per Phase 7 D-08.
                </span>
              </div>
            </div>

            <Kicker>pricing</Kicker>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabelText htmlFor="originalRateThb" required hint="THB">Original</FieldLabelText>
                <Input id="originalRateThb" type="number" min={0} style={MONO_NUM} {...register("originalRateThb")} />
                {errors.originalRateThb && <p className="text-xs text-destructive mt-1">{errors.originalRateThb.message}</p>}
              </div>
              <div>
                <FieldLabelText htmlFor="sellingRateThb" required hint="THB">Selling</FieldLabelText>
                <Input id="sellingRateThb" type="number" min={0} style={MONO_NUM} {...register("sellingRateThb")} />
                {errors.sellingRateThb && <p className="text-xs text-destructive mt-1">{errors.sellingRateThb.message}</p>}
              </div>
              <div>
                <FieldLabelText htmlFor="rebate" hint="THB">Rebate</FieldLabelText>
                <Input id="rebate" type="number" min={0} style={MONO_NUM} {...register("rebate")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div>
                <FieldLabelText htmlFor="discountType">Discount Type</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("discountType", v as ChargeRowInput["discountType"], { shouldValidate: true })}
                  value={watch("discountType") ?? "NONE"}
                >
                  <SelectTrigger id="discountType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">NONE</SelectItem>
                    <SelectItem value="PERCENT">PERCENT</SelectItem>
                    <SelectItem value="FIXED">FIXED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="discountRate">Discount Rate</FieldLabelText>
                <Input id="discountRate" type="number" min={0} style={MONO_NUM} {...register("discountRate")} />
              </div>
              <div />
            </div>

            <Kicker>payment terms</Kicker>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FieldLabelText htmlFor="paymentTerm" required>Payment Term</FieldLabelText>
                <Select
                  onValueChange={(v) => setValue("paymentTerm", v as ChargeRowInput["paymentTerm"], { shouldValidate: true })}
                  value={watch("paymentTerm") ?? ""}
                >
                  <SelectTrigger id="paymentTerm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">CASH</SelectItem>
                    <SelectItem value="CREDIT">CREDIT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <FieldLabelText htmlFor="creditTermDays" hint="if CREDIT">Credit Term</FieldLabelText>
                <Input id="creditTermDays" type="number" min={0} style={MONO_NUM} {...register("creditTermDays")} />
              </div>
              <div />
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              No. 02 — MAN HOURS
              ═════════════════════════════════════════════════════════ */}
          <div className="charge-row-editor-section" style={{ animationDelay: "80ms" }}>
            <SectionMarker no="02" label="Man Hours" />

            {manHoursSlab.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--gecko-text-secondary)", fontStyle: "italic" }}>
                No tiered labor pricing. Uses base Labour Rate from §01.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...SLAB_TH, width: 80 }}>From hr</th>
                    <th style={{ ...SLAB_TH, width: 80 }}>To hr</th>
                    <th style={SLAB_TH}>Man hours</th>
                    <th style={{ ...SLAB_TH, width: 40 }} aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {manHoursSlab.map((row, i) => (
                    <tr key={i}>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          value={row.fromHour}
                          onChange={(e) => updateManHoursSlab(i, { fromHour: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32 }}
                        />
                      </td>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          value={row.toHour}
                          onChange={(e) => updateManHoursSlab(i, { toHour: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32 }}
                        />
                      </td>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={row.manHours}
                          onChange={(e) => updateManHoursSlab(i, { manHours: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32 }}
                        />
                      </td>
                      <td style={{ ...SLAB_TD, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => removeManHoursSlab(i)}
                          aria-label="Remove slab tier"
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--gecko-text-secondary)",
                            padding: 4,
                          }}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={addManHoursSlab} style={TEXT_LINK}>
                + Add slab tier
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              No. 03 — MATERIAL PRICE
              ═════════════════════════════════════════════════════════ */}
          <div className="charge-row-editor-section" style={{ animationDelay: "160ms" }}>
            <SectionMarker no="03" label="Material Price" />

            {materialPriceSlab.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--gecko-text-secondary)", fontStyle: "italic" }}>
                No tiered material pricing.
              </p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...SLAB_TH, width: 80 }}>From qty</th>
                    <th style={{ ...SLAB_TH, width: 80 }}>To qty</th>
                    <th style={{ ...SLAB_TH, textAlign: "right" }}>Price (THB)</th>
                    <th style={{ ...SLAB_TH, textAlign: "right" }}>Cost (THB)</th>
                    <th style={{ ...SLAB_TH, width: 40 }} aria-label="actions" />
                  </tr>
                </thead>
                <tbody>
                  {materialPriceSlab.map((row, i) => (
                    <tr key={i}>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          value={row.fromQty}
                          onChange={(e) => updateMaterialPriceSlab(i, { fromQty: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32 }}
                        />
                      </td>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          value={row.toQty}
                          onChange={(e) => updateMaterialPriceSlab(i, { toQty: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32 }}
                        />
                      </td>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          value={row.priceThb}
                          onChange={(e) => updateMaterialPriceSlab(i, { priceThb: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32, textAlign: "right" }}
                        />
                      </td>
                      <td style={SLAB_TD}>
                        <Input
                          type="number"
                          min={0}
                          value={row.costThb}
                          onChange={(e) => updateMaterialPriceSlab(i, { costThb: Number(e.target.value) })}
                          style={{ ...MONO_NUM, height: 32, textAlign: "right" }}
                        />
                      </td>
                      <td style={{ ...SLAB_TD, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => removeMaterialPriceSlab(i)}
                          aria-label="Remove slab tier"
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--gecko-text-secondary)",
                            padding: 4,
                          }}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={addMaterialPriceSlab} style={TEXT_LINK}>
                + Add slab tier
              </button>
            </div>
          </div>
        </form>

        {/* ─── Footer ────────────────────────────────────────────────── */}
        <div
          className="px-8 py-4"
          style={{
            borderTop: "1px solid var(--gecko-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--gecko-bg-surface)",
          }}
        >
          <button type="button" onClick={onClose} style={TEXT_LINK}>
            cancel
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <button
              type="button"
              onClick={() => handleSubmit(submitAndContinue)()}
              disabled={isSubmitting}
              style={{
                ...TEXT_LINK,
                color: "var(--gecko-text-primary)",
                textDecorationColor: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--gecko-text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "transparent")}
            >
              save & add another
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
        </div>

        {/* Local styles — staggered fade-in for the 3 sections */}
        <style jsx global>{`
          .charge-row-editor-section {
            animation: chargeRowEditorReveal 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes chargeRowEditorReveal {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
