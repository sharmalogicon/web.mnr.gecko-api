"use client";

/**
 * Shared <ChargeRowEditor> — modal for adding/editing a tariff charge row.
 * Phase 7.4 — mirror the TOS container-edit modal pattern (user reference).
 *
 * Standard selects only (no combobox / hybrid). Charge Code is a
 * grouped <Select> with two optgroup labels (CEDEX repair / Services).
 * Single-column sections with multi-column tucking inside where
 * appropriate. Dashed divider between sections.
 */

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Icon } from "@/components/ui/Icon";

import { chargeRowSchema, type ChargeRowInput } from "@/lib/validators/tariff";
import {
  chargeCodes,
  findChargeCode,
} from "@/data/seed/_shared/charge-codes";
import { orderTypes } from "@/data/seed/_shared/order-types";
import { movementCodes } from "@/data/seed/_shared/movement-codes";
import { cargoCategories } from "@/data/seed/_shared/cargo-categories";
import type { ChargeRow } from "@/lib/types";

export interface ChargeRowEditorProps {
  open: boolean;
  initial?: ChargeRow | null;
  onClose: () => void;
  onSave: (row: ChargeRow) => void;
}

const DIALOG_TITLE_STYLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "var(--gecko-text-primary)",
  margin: 0,
  lineHeight: 1.4,
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--gecko-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const SECTION_DIVIDER: React.CSSProperties = {
  borderTop: "1px dashed var(--gecko-border)",
  margin: "16px 0",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: "var(--gecko-text-primary)",
  display: "block",
  marginBottom: 6,
};

const FIELD_HELP: React.CSSProperties = {
  fontSize: 12,
  color: "var(--gecko-text-secondary)",
  marginLeft: 6,
  fontWeight: 400,
};

const HELPER: React.CSSProperties = {
  fontSize: 12,
  color: "var(--gecko-text-secondary)",
  marginTop: 4,
};

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
};

function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Label htmlFor={htmlFor} style={FIELD_LABEL}>
      {children}
      {required && <span style={{ color: "var(--gecko-error-600)", marginLeft: 2 }}>*</span>}
      {hint && <span style={FIELD_HELP}>({hint})</span>}
    </Label>
  );
}

function SectionHeader({ icon, title }: { icon?: string; title: string }) {
  return (
    <div style={SECTION_LABEL}>
      {icon && <Icon name={icon} size={12} />}
      {title}
    </div>
  );
}

export function ChargeRowEditor({ open, initial, onClose, onSave }: ChargeRowEditorProps) {
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

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? { ...(initial as unknown as ChargeRowInput) }
          : { ...emptyRow, id: `r-${Date.now()}` },
      );
    }
  }, [open, initial, reset]);

  const selectedChargeCode = watch("chargeCode");
  useEffect(() => {
    if (!selectedChargeCode) return;
    const meta = findChargeCode(selectedChargeCode);
    if (!meta) return;
    setValue("chargeType", meta.chargeType, { shouldValidate: true });
    setValue("billingUnit", meta.defaultBillingUnit, { shouldValidate: true });
  }, [selectedChargeCode, setValue]);

  const submitClose: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(input as unknown as ChargeRow);
    onClose();
  };

  const submitAndContinue: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(input as unknown as ChargeRow);
    const kept = {
      chargeCode: input.chargeCode,
      orderType: input.orderType,
      movementCode: input.movementCode,
      chargeType: input.chargeType,
      billingUnit: input.billingUnit,
      cargoCategory: input.cargoCategory,
      paymentTerm: input.paymentTerm,
      billedTo: input.billedTo as "AGENT",
    };
    reset({ ...emptyRow, ...kept, id: `r-${Date.now()}` });
  };

  const cedexCodes = chargeCodes.filter((c) => c.cedexComponent);
  const svcCodes = chargeCodes.filter((c) => !c.cedexComponent);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader
          className="px-5 py-3"
          style={{ borderBottom: "1px solid var(--gecko-border)" }}
        >
          <DialogTitle asChild>
            <h2 style={DIALOG_TITLE_STYLE}>{initial ? "Edit charge row" : "Add charge row"}</h2>
          </DialogTitle>
        </DialogHeader>

        <form id="charge-row-form" onSubmit={handleSubmit(submitClose)} className="px-5 py-4">
          {/* ===== SERVICE ===== */}
          <SectionHeader title="Service" />
          <div style={{ marginTop: 10 }}>
            <FieldLabel htmlFor="chargeCode" required>Charge Code</FieldLabel>
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
                  {cedexCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span style={{ fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-primary-700)" }}>{c.code}</span>
                      <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Services</SelectLabel>
                  {svcCodes.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span style={{ fontFamily: "var(--gecko-font-mono)", color: "var(--gecko-primary-700)" }}>{c.code}</span>
                      <span style={{ marginLeft: 8, color: "var(--gecko-text-secondary)" }}>{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.chargeCode && (
              <p className="text-xs text-destructive mt-1">{errors.chargeCode.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 12 }}>
            <div>
              <FieldLabel htmlFor="orderType" required>Order Type</FieldLabel>
              <Select
                onValueChange={(v) => setValue("orderType", v, { shouldValidate: true })}
                value={watch("orderType") ?? ""}
              >
                <SelectTrigger id="orderType"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {orderTypes.map((o) => (
                    <SelectItem key={o.code} value={o.code}>{o.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="movementCode" required>Movement</FieldLabel>
              <Select
                onValueChange={(v) => setValue("movementCode", v, { shouldValidate: true })}
                value={watch("movementCode") ?? ""}
              >
                <SelectTrigger id="movementCode"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {movementCodes.map((m) => (
                    <SelectItem key={m.code} value={m.code}>{m.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 12 }}>
            <div>
              <FieldLabel htmlFor="chargeType" required hint="auto-filled">Charge Type</FieldLabel>
              <Select
                onValueChange={(v) => setValue("chargeType", v as ChargeRowInput["chargeType"], { shouldValidate: true })}
                value={watch("chargeType") ?? ""}
              >
                <SelectTrigger id="chargeType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["REPAIR", "SURVEY", "PTI", "CLEANING", "STORAGE", "GATE", "EMERGENCY", "LABOR", "UTILITY"] as const).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="billingUnit" required hint="auto-filled">Billing Unit</FieldLabel>
              <Select
                onValueChange={(v) => setValue("billingUnit", v as ChargeRowInput["billingUnit"], { shouldValidate: true })}
                value={watch("billingUnit") ?? ""}
              >
                <SelectTrigger id="billingUnit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["CONT", "TEU", "HOUR", "DAY", "JOB", "KG", "M"] as const).map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ===== APPLICABILITY ===== */}
          <div style={SECTION_DIVIDER} />
          <SectionHeader title="Applicability" />
          <div className="grid grid-cols-3 gap-4" style={{ marginTop: 10 }}>
            <div>
              <FieldLabel htmlFor="size">Size</FieldLabel>
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
              <FieldLabel htmlFor="cargoCategory" required>Cargo Cat.</FieldLabel>
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
            <div>
              <FieldLabel htmlFor="truckCategory">Truck Cat.</FieldLabel>
              <Input id="truckCategory" placeholder="(optional)" {...register("truckCategory")} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <FieldLabel>Billed To</FieldLabel>
            <Input value="AGENT" readOnly style={{ background: "var(--gecko-bg-subtle)" }} />
            <p style={HELPER}>Pinned to AGENT for MNR per D-08.</p>
          </div>

          {/* ===== PRICING ===== */}
          <div style={SECTION_DIVIDER} />
          <SectionHeader title="Pricing" />
          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 10 }}>
            <div>
              <FieldLabel htmlFor="originalRateThb" required>Original Rate (THB)</FieldLabel>
              <Input id="originalRateThb" type="number" min={0} {...register("originalRateThb")} />
              {errors.originalRateThb && <p className="text-xs text-destructive mt-1">{errors.originalRateThb.message}</p>}
            </div>
            <div>
              <FieldLabel htmlFor="sellingRateThb" required>Selling Rate (THB)</FieldLabel>
              <Input id="sellingRateThb" type="number" min={0} {...register("sellingRateThb")} />
              {errors.sellingRateThb && <p className="text-xs text-destructive mt-1">{errors.sellingRateThb.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 12 }}>
            <div>
              <FieldLabel htmlFor="discountType">Discount Type</FieldLabel>
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
              <FieldLabel htmlFor="discountRate">Discount Rate</FieldLabel>
              <Input id="discountRate" type="number" min={0} {...register("discountRate")} />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <FieldLabel htmlFor="rebate">Rebate (THB)</FieldLabel>
            <Input id="rebate" type="number" min={0} {...register("rebate")} />
          </div>

          {/* ===== PAYMENT TERMS ===== */}
          <div style={SECTION_DIVIDER} />
          <SectionHeader title="Payment terms" />
          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 10 }}>
            <div>
              <FieldLabel htmlFor="paymentTerm" required>Payment Term</FieldLabel>
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
              <FieldLabel htmlFor="creditTermDays" hint="if CREDIT">Credit Term (days)</FieldLabel>
              <Input id="creditTermDays" type="number" min={0} {...register("creditTermDays")} />
            </div>
          </div>

          {/* ===== SLAB RULES ===== */}
          <div style={SECTION_DIVIDER} />
          <SectionHeader title="Slab rules (optional)" />
          <div className="grid grid-cols-2 gap-4" style={{ marginTop: 10 }}>
            <details
              style={{
                border: "1px solid var(--gecko-border)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Slab Rate (Day)</summary>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                  <FieldLabel>From day</FieldLabel>
                  <Input type="number" min={0} {...register("slabDay.fromDay")} />
                </div>
                <div>
                  <FieldLabel>To day</FieldLabel>
                  <Input type="number" min={0} {...register("slabDay.toDay")} />
                </div>
                <div>
                  <FieldLabel>Rate (THB)</FieldLabel>
                  <Input type="number" min={0} {...register("slabDay.rateThb")} />
                </div>
              </div>
            </details>
            <details
              style={{
                border: "1px solid var(--gecko-border)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Slab Rate (TEU)</summary>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                  <FieldLabel>From TEU</FieldLabel>
                  <Input type="number" min={0} {...register("slabTeu.fromTeu")} />
                </div>
                <div>
                  <FieldLabel>To TEU</FieldLabel>
                  <Input type="number" min={0} {...register("slabTeu.toTeu")} />
                </div>
                <div>
                  <FieldLabel>Rate (THB)</FieldLabel>
                  <Input type="number" min={0} {...register("slabTeu.rateThb")} />
                </div>
              </div>
            </details>
          </div>
        </form>

        <div
          className="px-5 py-3"
          style={{
            borderTop: "1px solid var(--gecko-border)",
            background: "var(--gecko-bg-subtle)",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(submitAndContinue)()}
          >
            Save and add another
          </Button>
          <Button type="submit" form="charge-row-form" disabled={isSubmitting}>
            {initial ? "Save changes" : "Save row"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
