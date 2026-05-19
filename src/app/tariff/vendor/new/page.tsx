"use client";

/**
 * /tariff/vendor/new — onboard a vendor's tariff card.
 * Phase 7 D-02.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/Icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { vendorTariffRepo } from "@/lib/repos";
import { vendors } from "@/data/seed/_shared/vendors";
import type { VendorTariffCard } from "@/lib/types";

export default function NewVendorTariffPage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState("");
  const [procurementContact, setProcurementContact] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState(
    `${new Date().getFullYear()}-12-31`,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const existing = new Set(vendorTariffRepo.list().map((c) => c.vendorId));
  const availableVendors = vendors.filter((v) => !existing.has(v.id));

  const onCreate = () => {
    setSubmitError(null);
    if (!vendorId) return setSubmitError("Pick a vendor");
    if (!procurementContact) return setSubmitError("Procurement contact required");

    const today = new Date().toISOString().slice(0, 10);
    const card: VendorTariffCard = {
      id: `VND-${vendorId}-DRAFT-${Date.now()}`,
      vendorId,
      quotationNo: "",
      procurementContact,
      effectiveDate,
      expiryDate,
      status: "DRAFT",
      createdBy: "CURRENT-USER",
      createdOn: today,
      rows: [],
    };
    try {
      vendorTariffRepo.create(card);
      router.push(`/tariff/vendor/${encodeURIComponent(vendorId)}/edit`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create vendor tariff");
    }
  };

  return (
    <AppShell>
      <Link href="/tariff/vendor">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Vendor Tariffs
        </Button>
      </Link>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Onboard Vendor — new tariff card</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick the vendor + procurement contact. You'll add service-rate rows
            on the next page.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitError && (
            <div className="gecko-alert gecko-alert-error" role="alert">
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="vendorId">Vendor *</Label>
              <Select onValueChange={setVendorId} value={vendorId}>
                <SelectTrigger id="vendorId">
                  <SelectValue placeholder="Pick a vendor without a card…" />
                </SelectTrigger>
                <SelectContent>
                  {availableVendors.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      All vendors already have tariff cards.
                    </div>
                  ) : (
                    availableVendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.id} — {v.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="procurementContact">Procurement contact *</Label>
              <Input
                id="procurementContact"
                value={procurementContact}
                onChange={(e) => setProcurementContact(e.target.value)}
                placeholder="PROC-TH-01"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="effectiveDate">Effective date *</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="expiryDate">Expiry date *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button onClick={onCreate}>Create and add rows</Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
