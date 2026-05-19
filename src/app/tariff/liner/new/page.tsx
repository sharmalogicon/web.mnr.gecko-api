"use client";

/**
 * /tariff/liner/new — create a new liner tariff agreement.
 * Phase 7 D-02. Captures the header; user is taken to the edit page to
 * fill in rows.
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

import { linerTariffRepo } from "@/lib/repos";
import { customers } from "@/data/seed/_shared/customers";
import type { LinerTariffCard } from "@/lib/types";

export default function NewLinerTariffPage() {
  const router = useRouter();
  const [agentCode, setAgentCode] = useState("");
  const [salesPerson, setSalesPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [expiryDate, setExpiryDate] = useState(
    `${new Date().getFullYear()}-12-31`,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Liners that don't yet have a card
  const existingAgents = new Set(linerTariffRepo.list().map((c) => c.agentCode));
  const availableLiners = customers.filter((c) => !existingAgents.has(c.code));

  const onCreate = () => {
    setSubmitError(null);
    if (!agentCode) return setSubmitError("Pick a liner");
    if (!salesPerson) return setSubmitError("Sales person required");

    const today = new Date().toISOString().slice(0, 10);
    const card: LinerTariffCard = {
      id: `LNR-${agentCode.replace(/^C-/, "")}-DRAFT-${Date.now()}`,
      agentCode,
      quotationNo: "",
      salesPerson,
      contactNo: contactNo || undefined,
      effectiveDate,
      expiryDate,
      status: "DRAFT",
      createdBy: "CURRENT-USER",
      createdOn: today,
      freeDays: {
        fullExport: { normal: 7, reefer: 5, dg: 3 },
        fullImport: { normal: 7, reefer: 5, dg: 3 },
        emptyImport: { normal: 14, reefer: 7 },
      },
      waiveStorageForEmptyDmContainers: false,
      rows: [],
    };
    try {
      linerTariffRepo.create(card);
      router.push(`/tariff/liner/${encodeURIComponent(agentCode)}/edit`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create liner tariff");
    }
  };

  return (
    <AppShell>
      <Link href="/tariff/liner">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Liner Tariffs
        </Button>
      </Link>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>New Liner Tariff Agreement</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pick the liner, enter the header fields. After save you'll be
            taken to the edit page to add charge rows.
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
              <Label htmlFor="agentCode">Liner *</Label>
              <Select onValueChange={setAgentCode} value={agentCode}>
                <SelectTrigger id="agentCode">
                  <SelectValue placeholder="Pick a liner without an existing card…" />
                </SelectTrigger>
                <SelectContent>
                  {availableLiners.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      All liners already have a tariff card.
                    </div>
                  ) : (
                    availableLiners.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="salesPerson">Sales person *</Label>
              <Input
                id="salesPerson"
                value={salesPerson}
                onChange={(e) => setSalesPerson(e.target.value)}
                placeholder="YOKPORN"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contactNo">Contact no</Label>
              <Input
                id="contactNo"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                placeholder="02-708-0888"
              />
            </div>
            <div />
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
