"use client";

/**
 * Shared <ChargeRowEditor> — modal dialog for adding/editing a single
 * tariff charge row. Phase 7 D-09. Opened by <ChargesTable> rowClick / +.
 *
 * Uses react-hook-form + Zod (Phase 3 pattern) so error messages live
 * next to the inputs that triggered them.
 */

import { useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  /** When defined, the form is pre-filled (edit mode). Otherwise it's blank (add mode). */
  initial?: ChargeRow | null;
  onClose: () => void;
  onSave: (row: ChargeRow) => void;
}

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

  // Reset form when dialog opens/closes or `initial` changes
  useEffect(() => {
    if (open) {
      reset(
        initial
          ? { ...(initial as unknown as ChargeRowInput) }
          : { ...emptyRow, id: `r-${Date.now()}` },
      );
    }
  }, [open, initial, reset]);

  // When user picks a charge code, auto-fill its defaults
  const selectedChargeCode = watch("chargeCode");
  useEffect(() => {
    if (!selectedChargeCode) return;
    const meta = findChargeCode(selectedChargeCode);
    if (!meta) return;
    setValue("chargeType", meta.chargeType, { shouldValidate: true });
    setValue("billingUnit", meta.defaultBillingUnit, { shouldValidate: true });
  }, [selectedChargeCode, setValue]);

  const onSubmit: SubmitHandler<ChargeRowInput> = (input) => {
    onSave(input as unknown as ChargeRow);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit charge row" : "Add charge row"}</DialogTitle>
        </DialogHeader>

        <form
          id="charge-row-form"
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2"
        >
          {/* ===== Left column ===== */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="chargeCode">Charge Code *</Label>
              <Select
                onValueChange={(v) => setValue("chargeCode", v, { shouldValidate: true })}
                value={watch("chargeCode") ?? ""}
              >
                <SelectTrigger id="chargeCode">
                  <SelectValue placeholder="Pick a charge code…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>CEDEX — repair codes</SelectLabel>
                    {chargeCodes
                      .filter((c) => c.cedexComponent)
                      .map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Services</SelectLabel>
                    {chargeCodes
                      .filter((c) => !c.cedexComponent)
                      .map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} — {c.label}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="size">Size</Label>
                <Select
                  onValueChange={(v) => setValue("size", v === "_none" ? undefined : (v as ChargeRowInput["size"]), { shouldValidate: true })}
                  value={watch("size") ?? "_none"}
                >
                  <SelectTrigger id="size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">(any)</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="40">40</SelectItem>
                    <SelectItem value="45">45</SelectItem>
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
                      <SelectItem key={c.code} value={c.code}>
                        {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="paymentTerm">Pymt Term *</Label>
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

            <div className="space-y-1">
              <Label>Billed To</Label>
              <Input value="AGENT" readOnly style={{ background: "var(--gecko-bg-subtle)" }} />
              <p className="text-xs text-muted-foreground">
                Pinned to AGENT for MNR per Phase 7 D-08.
              </p>
            </div>
          </div>

          {/* ===== Right column ===== */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="originalRateThb">Original Rate (THB) *</Label>
                <Input id="originalRateThb" type="number" min={0} {...register("originalRateThb")} />
                {errors.originalRateThb && (
                  <p className="text-xs text-destructive">{errors.originalRateThb.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="sellingRateThb">Selling Rate (THB) *</Label>
                <Input id="sellingRateThb" type="number" min={0} {...register("sellingRateThb")} />
                {errors.sellingRateThb && (
                  <p className="text-xs text-destructive">{errors.sellingRateThb.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="space-y-1">
              <Label htmlFor="rebate">Rebate (THB)</Label>
              <Input id="rebate" type="number" min={0} {...register("rebate")} />
            </div>

            <details className="space-y-1 border rounded-md p-2">
              <summary className="cursor-pointer text-sm font-medium">Slab Rate (Day) — optional</summary>
              <div className="grid grid-cols-3 gap-2 pt-2">
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

            <details className="space-y-1 border rounded-md p-2">
              <summary className="cursor-pointer text-sm font-medium">Slab Rate (TEU) — optional</summary>
              <div className="grid grid-cols-3 gap-2 pt-2">
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
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="charge-row-form" disabled={isSubmitting}>
            {initial ? "Save changes" : "Add row"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
