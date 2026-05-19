"use client";

/**
 * Shared <ChargeRowEditor> — compact modal for adding/editing a tariff
 * charge row. Phase 7.3 — modal with proper density.
 *
 * Layout fits in a single screen at 1024px (max-w-4xl). Four sections
 * stacked with thin dividers and TOS subtitle labels.
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
};

const DIALOG_TITLE_STYLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "var(--gecko-text-primary)",
  margin: 0,
  lineHeight: 1.4,
};

const HELPER: React.CSSProperties = {
  fontSize: 11,
  color: "var(--gecko-text-secondary)",
  marginTop: 2,
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

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div style={SECTION_LABEL}>{title}</div>
      <div style={{ borderBottom: "1px solid var(--gecko-border)", margin: "6px 0 12px" }} />
      {children}
    </section>
  );
}

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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader
          className="px-5 py-3"
          style={{ borderBottom: "1px solid var(--gecko-border)" }}
        >
          <DialogTitle asChild>
            <h2 style={DIALOG_TITLE_STYLE}>{initial ? "Edit charge row" : "Add charge row"}</h2>
          </DialogTitle>
        </DialogHeader>

        <form
          id="charge-row-form"
          onSubmit={handleSubmit(submitClose)}
          className="px-5 py-4"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* ===== SERVICE ===== */}
          <Section title="Service">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <Label htmlFor="chargeCode" className="text-xs">Charge Code *</Label>
                <ChargeCodeCombobox
                  id="chargeCode"
                  value={watch("chargeCode") ?? ""}
                  onChange={(code) => setValue("chargeCode", code, { shouldValidate: true })}
                  onBrowseClick={() => setBrowserOpen(true)}
                />
                {errors.chargeCode && (
                  <p className="text-xs text-destructive mt-1">{errors.chargeCode.message}</p>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="orderType" className="text-xs">Order Type *</Label>
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
                  <Label htmlFor="movementCode" className="text-xs">Movement *</Label>
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
                  <Label htmlFor="chargeType" className="text-xs">Charge Type *</Label>
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
                  <Label htmlFor="billingUnit" className="text-xs">Billing Unit *</Label>
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
              <p style={HELPER}>Charge Type + Billing Unit auto-fill from the picked code; override here if needed.</p>
            </div>
          </Section>

          {/* ===== two-column block: APPLICABILITY | PRICING ===== */}
          <div className="grid grid-cols-2 gap-6">
            <Section title="Applicability">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="size" className="text-xs">Size</Label>
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
                  <Label htmlFor="cargoCategory" className="text-xs">Cargo *</Label>
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
                  <Label htmlFor="truckCategory" className="text-xs">Truck Cat.</Label>
                  <Input id="truckCategory" placeholder="(opt.)" {...register("truckCategory")} />
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs">Billed To</Label>
                <Input value="AGENT" readOnly style={{ background: "var(--gecko-bg-subtle)" }} />
                <p style={HELPER}>Pinned to AGENT for MNR per D-08.</p>
              </div>
            </Section>

            <Section title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="originalRateThb" className="text-xs">Original Rate (THB) *</Label>
                  <Input id="originalRateThb" type="number" min={0} {...register("originalRateThb")} />
                  {errors.originalRateThb && <p className="text-xs text-destructive">{errors.originalRateThb.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sellingRateThb" className="text-xs">Selling Rate (THB) *</Label>
                  <Input id="sellingRateThb" type="number" min={0} {...register("sellingRateThb")} />
                  {errors.sellingRateThb && <p className="text-xs text-destructive">{errors.sellingRateThb.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label htmlFor="discountType" className="text-xs">Discount Type</Label>
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
                  <Label htmlFor="discountRate" className="text-xs">Discount Rate</Label>
                  <Input id="discountRate" type="number" min={0} {...register("discountRate")} />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="rebate" className="text-xs">Rebate (THB)</Label>
                <Input id="rebate" type="number" min={0} {...register("rebate")} />
              </div>
            </Section>
          </div>

          {/* ===== two-column block: PAYMENT | SLAB RULES ===== */}
          <div className="grid grid-cols-2 gap-6">
            <Section title="Payment terms">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="paymentTerm" className="text-xs">Payment Term *</Label>
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
                  <Label htmlFor="creditTermDays" className="text-xs">Credit Term (days)</Label>
                  <Input id="creditTermDays" type="number" min={0} {...register("creditTermDays")} />
                </div>
              </div>
            </Section>

            <Section title="Slab rules (optional)">
              <details
                style={{
                  border: "1px solid var(--gecko-border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 6,
                }}
              >
                <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Slab Rate (Day)</summary>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <Label className="text-[10px]">From day</Label>
                    <Input type="number" min={0} {...register("slabDay.fromDay")} />
                  </div>
                  <div>
                    <Label className="text-[10px]">To day</Label>
                    <Input type="number" min={0} {...register("slabDay.toDay")} />
                  </div>
                  <div>
                    <Label className="text-[10px]">Rate (THB)</Label>
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
                    <Label className="text-[10px]">From TEU</Label>
                    <Input type="number" min={0} {...register("slabTeu.fromTeu")} />
                  </div>
                  <div>
                    <Label className="text-[10px]">To TEU</Label>
                    <Input type="number" min={0} {...register("slabTeu.toTeu")} />
                  </div>
                  <div>
                    <Label className="text-[10px]">Rate (THB)</Label>
                    <Input type="number" min={0} {...register("slabTeu.rateThb")} />
                  </div>
                </div>
              </details>
            </Section>
          </div>
        </form>

        {/* ===== Footer ===== */}
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
            {initial ? "Save changes" : "Add row"}
          </Button>
        </div>

        <ChargeCodeBrowser
          open={browserOpen}
          onClose={() => setBrowserOpen(false)}
          onPick={(code) => setValue("chargeCode", code, { shouldValidate: true })}
        />
      </DialogContent>
    </Dialog>
  );
}
