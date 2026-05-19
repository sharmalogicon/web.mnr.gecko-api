"use client";

/**
 * Shared <ChargeRowEditor> — right-side drawer for adding/editing a
 * tariff charge row. Phase 7.2 redesign.
 *
 * Layout: 4 labeled sections following TOS subtitle convention
 * (11px / 700 / uppercase / letter-spacing 0.05em / secondary color):
 *   1. SERVICE        — Charge Code (combobox + Browse all), Order Type,
 *                       Movement, Charge Type, Billing Unit
 *   2. APPLICABILITY  — Size, Cargo, Truck Cat, Billed To (=AGENT)
 *   3. PRICING        — Original Rate, Selling Rate, Discount Type,
 *                       Discount Rate, Rebate
 *   4. PAYMENT TERMS  — Payment Term, Credit Term (days)
 *   + Optional slab rules (Day, TEU) as collapsibles
 *
 * Save flow: "Save row" closes the drawer; "Save and add another"
 * keeps Charge Code / Order Type / Movement / Cargo, clears Size +
 * rates so the user can stamp out size variants quickly.
 */

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ChargeCodeCombobox } from "./ChargeCodeCombobox";
import { ChargeCodeBrowser } from "./ChargeCodeBrowser";

import { chargeRowSchema, type ChargeRowInput } from "@/lib/validators/tariff";
import { findChargeCode } from "@/data/seed/_shared/charge-codes";
import { orderTypes } from "@/data/seed/_shared/order-types";
import { movementCodes } from "@/data/seed/_shared/movement-codes";
import { cargoCategories } from "@/data/seed/_shared/cargo-categories";
import type { ChargeRow } from "@/lib/types";

export interface ChargeRowEditorProps {
  open: boolean;
  /** When defined, the form is pre-filled (edit mode). Otherwise it's blank (add mode). */
  initial?: ChargeRow | null;
  onClose: () => void;
  onSave: (row: ChargeRow) => void;
}

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--gecko-text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 12,
  marginTop: 4,
};

const SECTION_DIVIDER: React.CSSProperties = {
  borderTop: "1px solid var(--gecko-border)",
  marginTop: 20,
  paddingTop: 20,
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

export function ChargeRowEditor({ open, initial, onClose, onSave }: ChargeRowEditorProps) {
  const [browserOpen, setBrowserOpen] = useState(false);
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

  // Auto-fill default Charge Type + Billing Unit when Charge Code changes
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
    // Carry-forward fields per Phase 7.2 spec; clear size + rates.
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
    reset({
      ...emptyRow,
      ...kept,
      id: `r-${Date.now()}`,
    });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[720px] overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>{initial ? "Edit charge row" : "Add charge row"}</SheetTitle>
        </SheetHeader>

        <form
          id="charge-row-form"
          onSubmit={handleSubmit(submitClose)}
          className="pb-24"
        >
          {/* ===== SERVICE ===== */}
          <div style={SECTION_LABEL}>Service</div>
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1">
              <Label htmlFor="chargeCode">Charge Code *</Label>
              <ChargeCodeCombobox
                id="chargeCode"
                value={watch("chargeCode") ?? ""}
                onChange={(code) => setValue("chargeCode", code, { shouldValidate: true })}
                onBrowseClick={() => setBrowserOpen(true)}
              />
              {errors.chargeCode && (
                <p className="text-xs text-destructive">{errors.chargeCode.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="orderType">Order Type *</Label>
                <Select
                  onValueChange={(v) => setValue("orderType", v, { shouldValidate: true })}
                  value={watch("orderType") ?? ""}
                >
                  <SelectTrigger id="orderType">
                    <SelectValue placeholder="Pick…" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderTypes.map((o) => (
                      <SelectItem key={o.code} value={o.code}>
                        {o.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.orderType && (
                  <p className="text-xs text-destructive">{errors.orderType.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="movementCode">Movement *</Label>
                <Select
                  onValueChange={(v) => setValue("movementCode", v, { shouldValidate: true })}
                  value={watch("movementCode") ?? ""}
                >
                  <SelectTrigger id="movementCode">
                    <SelectValue placeholder="Pick…" />
                  </SelectTrigger>
                  <SelectContent>
                    {movementCodes.map((m) => (
                      <SelectItem key={m.code} value={m.code}>
                        {m.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.movementCode && (
                  <p className="text-xs text-destructive">{errors.movementCode.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="chargeType">Charge Type *</Label>
                <Select
                  onValueChange={(v) => setValue("chargeType", v as ChargeRowInput["chargeType"], { shouldValidate: true })}
                  value={watch("chargeType") ?? ""}
                >
                  <SelectTrigger id="chargeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["REPAIR", "SURVEY", "PTI", "CLEANING", "STORAGE", "GATE", "EMERGENCY", "LABOR", "UTILITY"] as const).map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-filled from charge code; override if needed.</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="billingUnit">Billing Unit *</Label>
                <Select
                  onValueChange={(v) => setValue("billingUnit", v as ChargeRowInput["billingUnit"], { shouldValidate: true })}
                  value={watch("billingUnit") ?? ""}
                >
                  <SelectTrigger id="billingUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["CONT", "TEU", "HOUR", "DAY", "JOB", "KG", "M"] as const).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Auto-filled from charge code; override if needed.</p>
              </div>
            </div>
          </div>

          {/* ===== APPLICABILITY ===== */}
          <div style={SECTION_DIVIDER} />
          <div style={SECTION_LABEL}>Applicability</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="size">Size</Label>
              <Select
                onValueChange={(v) =>
                  setValue("size", v === "_none" ? undefined : (v as ChargeRowInput["size"]), { shouldValidate: true })
                }
                value={watch("size") ?? "_none"}
              >
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">(any)</SelectItem>
                  <SelectItem value="20">20'</SelectItem>
                  <SelectItem value="40">40'</SelectItem>
                  <SelectItem value="45">45'</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cargoCategory">Cargo *</Label>
              <Select
                onValueChange={(v) => setValue("cargoCategory", v as ChargeRowInput["cargoCategory"], { shouldValidate: true })}
                value={watch("cargoCategory") ?? ""}
              >
                <SelectTrigger id="cargoCategory">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cargoCategories.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="truckCategory">Truck Cat.</Label>
              <Input id="truckCategory" placeholder="(optional)" {...register("truckCategory")} />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Label>Billed To</Label>
            <Input value="AGENT" readOnly style={{ background: "var(--gecko-bg-subtle)" }} />
            <p className="text-xs text-muted-foreground">
              Pinned to AGENT for MNR per Phase 7 D-08.
            </p>
          </div>

          {/* ===== PRICING ===== */}
          <div style={SECTION_DIVIDER} />
          <div style={SECTION_LABEL}>Pricing</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="originalRateThb">Original Rate (THB) *</Label>
              <Input
                id="originalRateThb"
                type="number"
                min={0}
                {...register("originalRateThb")}
              />
              {errors.originalRateThb && (
                <p className="text-xs text-destructive">{errors.originalRateThb.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="sellingRateThb">Selling Rate (THB) *</Label>
              <Input
                id="sellingRateThb"
                type="number"
                min={0}
                {...register("sellingRateThb")}
              />
              {errors.sellingRateThb && (
                <p className="text-xs text-destructive">{errors.sellingRateThb.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="space-y-1">
              <Label htmlFor="discountType">Discount Type</Label>
              <Select
                onValueChange={(v) => setValue("discountType", v as ChargeRowInput["discountType"], { shouldValidate: true })}
                value={watch("discountType") ?? "NONE"}
              >
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">NONE</SelectItem>
                  <SelectItem value="PERCENT">PERCENT</SelectItem>
                  <SelectItem value="FIXED">FIXED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="discountRate">Discount Rate</Label>
              <Input id="discountRate" type="number" min={0} {...register("discountRate")} />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <Label htmlFor="rebate">Rebate (THB)</Label>
            <Input id="rebate" type="number" min={0} {...register("rebate")} />
          </div>

          {/* ===== PAYMENT TERMS ===== */}
          <div style={SECTION_DIVIDER} />
          <div style={SECTION_LABEL}>Payment terms</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="paymentTerm">Payment Term *</Label>
              <Select
                onValueChange={(v) => setValue("paymentTerm", v as ChargeRowInput["paymentTerm"], { shouldValidate: true })}
                value={watch("paymentTerm") ?? ""}
              >
                <SelectTrigger id="paymentTerm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">CASH</SelectItem>
                  <SelectItem value="CREDIT">CREDIT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="creditTermDays">Credit Term (days)</Label>
              <Input id="creditTermDays" type="number" min={0} {...register("creditTermDays")} />
            </div>
          </div>

          {/* ===== SLAB RULES (collapsibles) ===== */}
          <div style={SECTION_DIVIDER} />
          <div style={SECTION_LABEL}>Slab rules (optional)</div>
          <details className="border rounded-md p-3 mb-2">
            <summary className="cursor-pointer text-sm font-medium">Slab Rate (Day)</summary>
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div>
                <Label className="text-xs">From day</Label>
                <Input type="number" min={0} {...register("slabDay.fromDay")} />
              </div>
              <div>
                <Label className="text-xs">To day</Label>
                <Input type="number" min={0} {...register("slabDay.toDay")} />
              </div>
              <div>
                <Label className="text-xs">Rate (THB)</Label>
                <Input type="number" min={0} {...register("slabDay.rateThb")} />
              </div>
            </div>
          </details>
          <details className="border rounded-md p-3">
            <summary className="cursor-pointer text-sm font-medium">Slab Rate (TEU)</summary>
            <div className="grid grid-cols-3 gap-2 pt-3">
              <div>
                <Label className="text-xs">From TEU</Label>
                <Input type="number" min={0} {...register("slabTeu.fromTeu")} />
              </div>
              <div>
                <Label className="text-xs">To TEU</Label>
                <Input type="number" min={0} {...register("slabTeu.toTeu")} />
              </div>
              <div>
                <Label className="text-xs">Rate (THB)</Label>
                <Input type="number" min={0} {...register("slabTeu.rateThb")} />
              </div>
            </div>
          </details>
        </form>

        {/* ===== Sticky footer ===== */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            marginLeft: -24,
            marginRight: -24,
            padding: "12px 24px",
            background: "var(--gecko-bg-surface)",
            borderTop: "1px solid var(--gecko-border)",
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
            {initial ? "Save changes" : "Add row"}
          </Button>
        </div>

        {/* Charge code full-browser modal */}
        <ChargeCodeBrowser
          open={browserOpen}
          onClose={() => setBrowserOpen(false)}
          onPick={(code) => setValue("chargeCode", code, { shouldValidate: true })}
        />
      </SheetContent>
    </Sheet>
  );
}
