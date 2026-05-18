"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout";
import { TierBadge } from "@/components/tariff";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DetailSpinner } from "@/components/ui/LoadingState";
import { nearestReference } from "@/lib/levenshtein";
import { getEmptyCopy, getErrorCopy, getLoadingLabel } from "@/data/copy/empty-states";
import { customerRates } from "@/data/seed/tariff/customer-rates";
import { customers } from "@/data/seed/_shared/customers";

const ROUTE = "/tariff/customer-rates/[customerId]";
const LIST_ROUTE = "/tariff/customer-rates";

export default function CustomerRateDetailPage() {
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

  // NotFound triggers when the CUSTOMER doesn't exist
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
                    href={`/tariff/customer-rates/${encodeURIComponent(suggestion)}`}
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

  // Customer exists, but has zero rate overrides — show the not-found-variant copy
  // ("This customer has no rate overrides" + "Add override" CTA per plan 04).
  if (ratesForCustomer.length === 0) {
    const copy = getEmptyCopy(ROUTE, "not-found");
    if (copy) {
      return (
        <AppShell>
          <EmptyState
            variant="not-found"
            icon={copy.icon}
            title={copy.title}
            description={copy.description.replace("{ID}", customer.name)}
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
  }

  // Existing detail render — uses `customer` + `ratesForCustomer` from seed
  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/customer-rates">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customer Rates
        </Button>
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.name}</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{customer.code}</p>
        </div>
        <Link href={`/tariff/customer-rates/${encodeURIComponent(id)}/edit`}>
          <Button>Edit Rates</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tier:</span>
              <TierBadge tier={customer.tier} />
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Country:</span>
              <span className="ml-2 text-sm">{customer.country}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Code:</span>
              <span className="ml-2 text-sm font-mono">{customer.code}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">Rate Overrides:</span>
              <span className="ml-2 text-sm font-semibold">{ratesForCustomer.length}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Average Rate:</span>
              <span className="ml-2 text-sm">
                ฿{Math.round(
                  ratesForCustomer.reduce((sum, r) => sum + r.overrideRateThb, 0) /
                    ratesForCustomer.length
                ).toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t">
              <span className="text-sm text-muted-foreground">Tier:</span>
              <span className="ml-2 text-sm">{customer.tier}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Rate Overrides */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Service Rate Overrides ({ratesForCustomer.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Override ID</TableHead>
                <TableHead>Service Code</TableHead>
                <TableHead>Override Rate (THB)</TableHead>
                <TableHead>Effective From</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratesForCustomer.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-mono text-sm">{rate.id}</TableCell>
                  <TableCell className="font-mono text-sm">{rate.serviceCode}</TableCell>
                  <TableCell className="font-semibold">
                    ฿{rate.overrideRateThb.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{rate.effectiveFrom}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{rate.notes ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Type legend */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">Override</Badge>
            <span className="text-sm text-muted-foreground">
              Per-customer service-code override (deviates from tier discount and master rate card).
            </span>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
