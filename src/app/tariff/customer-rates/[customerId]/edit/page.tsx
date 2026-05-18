"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { customers } from "@/data/seed/_shared/customers";
import { customerRates } from "@/data/seed/tariff/customer-rates";

const ROUTE = "/tariff/customer-rates/[customerId]";
const LIST_ROUTE = "/tariff/customer-rates";

export default function EditCustomerRatePage() {
  const params = useParams();
  const sp = useSearchParams();
  const id = String(params?.customerId ?? "");

  // T-09-01: dev-only param gating
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading = isDev && sp.get("loading") === "1";
  const forceError = isDev && sp.get("error") === "1";

  const customer = customers.find((c) => c.code === id);
  const ratesForCustomer = customerRates.filter((r) => r.customerCode === id);

  if (forceLoading) {
    return (
      <AppShell>
        <DetailSpinner label={getLoadingLabel(ROUTE)} />
      </AppShell>
    );
  }
  if (forceError) {
    const errCopy = getErrorCopy(LIST_ROUTE);
    return (
      <AppShell>
        <ErrorState
          title={errCopy.title}
          description={errCopy.description}
          onRetry={() => window.location.reload()}
        />
      </AppShell>
    );
  }
  if (!customer) {
    const allRefs = customers.map((c) => c.code);
    const suggestion = nearestReference(id, allRefs);
    const copy = getEmptyCopy(ROUTE, "not-found");
    if (!copy) {
      return (
        <AppShell>
          <EmptyState variant="not-found" title="Customer not found" />
        </AppShell>
      );
    }
    return (
      <AppShell>
        <EmptyState
          variant="not-found"
          icon={copy.icon}
          title="This customer doesn't exist"
          description={
            <>
              The customer code {id} wasn&apos;t found in the customer register.
              {suggestion && (
                <>
                  <br />
                  <br />
                  Did you mean{" "}
                  <Link
                    href={`/tariff/customer-rates/${encodeURIComponent(suggestion)}/edit`}
                    className="gecko-text-mono"
                    style={{ color: "var(--gecko-primary-600)", fontWeight: 600 }}
                  >
                    {suggestion}
                  </Link>
                  ?
                </>
              )}
            </>
          }
          primary={copy.primary}
          secondary={
            copy.secondary && {
              ...copy.secondary,
              href: copy.secondary.href.replace("{ID}", encodeURIComponent(id)),
            }
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Back Button */}
      <Link href={`/tariff/customer-rates/${encodeURIComponent(id)}`}>
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Customer Rate
        </Button>
      </Link>

      {/* Customer context (AppShell header already prints page title) */}
      <p className="text-muted-foreground mb-6">
        {customer.name} <span className="font-mono">({customer.code})</span>
      </p>

      <div className="max-w-3xl">
        {/* Pricing Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pricing Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup defaultValue={ratesForCustomer.length > 0 ? "custom" : "tier"}>
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="tier" id="tier" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="tier" className="font-medium">
                    Tier-Based Discount
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Apply standard discount based on customer tier
                  </p>
                </div>
              </div>

              <div
                className="flex items-start space-x-3 p-3 border rounded-lg"
                style={{ background: "var(--gecko-primary-50)" }}
              >
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="font-medium">
                    Custom Rates
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set specific rates for each service
                  </p>
                </div>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="customer-tier">Customer Tier</Label>
              <Select defaultValue={customer.tier}>
                <SelectTrigger id="customer-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platinum">🥇 Platinum (20% base discount)</SelectItem>
                  <SelectItem value="gold">🥈 Gold (15% base discount)</SelectItem>
                  <SelectItem value="silver">🥉 Silver (10% base discount)</SelectItem>
                  <SelectItem value="bronze">🏅 Bronze (5% base discount)</SelectItem>
                  <SelectItem value="standard">── Standard (0% discount)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Rate Overrides — driven from seed */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Rate Overrides ({ratesForCustomer.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratesForCustomer.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No rate overrides configured for this customer. Add one below to deviate from the
                tier discount.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ratesForCustomer.map((rate) => (
                  <ServiceRateInput
                    key={rate.id}
                    serviceCode={rate.serviceCode}
                    overrideRate={String(rate.overrideRateThb)}
                    notes={rate.notes}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Volume Discounts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Volume Discounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="enable-volume" defaultChecked />
              <Label htmlFor="enable-volume" className="font-normal">
                Enable volume-based discounts
              </Label>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">
                      Threshold (units/month)
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Additional Discount
                    </th>
                    <th className="text-left p-3 text-sm font-medium w-[80px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <VolumeTierRow threshold="50" discount="2" />
                  <VolumeTierRow threshold="100" discount="5" />
                  <VolumeTierRow threshold="200" discount="8" />
                </tbody>
              </table>
              <div className="p-3 border-t">
                <Button variant="outline" size="sm">
                  + Add Tier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              defaultValue={
                ratesForCustomer
                  .map((r) => r.notes)
                  .filter(Boolean)
                  .join("\n") ||
                "No notes recorded for this customer's rate overrides."
              }
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/tariff/customer-rates/${encodeURIComponent(id)}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button>Save Changes</Button>
        </div>
      </div>
    </AppShell>
  );
}

interface ServiceRateInputProps {
  serviceCode: string;
  overrideRate: string;
  notes?: string;
}

function ServiceRateInput({ serviceCode, overrideRate, notes }: ServiceRateInputProps) {
  return (
    <div
      className="p-3 border rounded-lg"
      style={{
        background: "var(--gecko-primary-50)",
        borderColor: "var(--gecko-primary-200)",
      }}
    >
      <div className="mb-2">
        <span className="text-sm font-medium font-mono" style={{ color: "var(--gecko-primary-900)" }}>
          {serviceCode}
        </span>
        {notes && <p className="text-xs text-muted-foreground mt-1">{notes}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Override rate (THB)</Label>
        <Input type="number" defaultValue={overrideRate} className="w-full" />
      </div>
    </div>
  );
}

interface VolumeTierRowProps {
  threshold: string;
  discount: string;
}

function VolumeTierRow({ threshold, discount }: VolumeTierRowProps) {
  return (
    <tr className="border-t">
      <td className="p-3">
        <Input type="number" defaultValue={threshold} className="w-[150px]" />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Input type="number" defaultValue={discount} className="w-[100px]" />
          <span className="text-sm">%</span>
        </div>
      </td>
      <td className="p-3">
        <Button variant="ghost" size="sm">
          🗑
        </Button>
      </td>
    </tr>
  );
}
