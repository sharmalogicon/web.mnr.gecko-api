"use client";

import { useSearchParams } from "next/navigation";
import { Calculator } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";

const ROUTE = "/tariff/simulator";

export default function PriceSimulatorPage() {
  const sp = useSearchParams();

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  if (forceLoading) {
    return <AppShell><TableSkeleton columns={2} rows={6} /></AppShell>;
  }
  if (forceError) {
    const errCopy = getErrorCopy(ROUTE);
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
  // Simulator's "empty" state is the "Run a simulation" CTA per plan-04 copy.
  if (forceEmpty || forceFilterEmpty) {
    const variant: EmptyStateVariant = forceFilterEmpty ? "filter-empty" : "empty";
    const copy = getEmptyCopy(ROUTE, variant) ?? getEmptyCopy(ROUTE, "empty");
    if (copy) {
      return (
        <AppShell>
          <EmptyState
            variant={variant}
            icon={copy.icon}
            title={copy.title}
            description={copy.description}
            primary={copy.primary}
            secondary={copy.secondary}
          />
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select defaultValue="cma-cgm">
                <SelectTrigger id="customer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cma-cgm">CMA CGM</SelectItem>
                  <SelectItem value="maersk">Maersk</SelectItem>
                  <SelectItem value="msc">MSC</SelectItem>
                  <SelectItem value="standard">Standard Rate (No Customer)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment Type</Label>
              <Select defaultValue="iso-40">
                <SelectTrigger id="equipment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="iso-20">ISO Tank 20ft</SelectItem>
                  <SelectItem value="iso-40">ISO Tank 40ft</SelectItem>
                  <SelectItem value="dry-20">Dry Container 20ft</SelectItem>
                  <SelectItem value="dry-40">Dry Container 40ft</SelectItem>
                  <SelectItem value="reefer-40">Reefer 40ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select defaultValue="food-grade">
                <SelectTrigger id="service">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food-grade">Food Grade Cleaning</SelectItem>
                  <SelectItem value="chemical">Chemical Wash</SelectItem>
                  <SelectItem value="standard">Standard Clean</SelectItem>
                  <SelectItem value="survey">Tank Survey</SelectItem>
                  <SelectItem value="pti">PTI Test</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" type="datetime-local" defaultValue="2026-05-18T10:00" />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label>Additional Options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="steam" defaultChecked />
                  <label
                    htmlFor="steam"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Steam Heating Required
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="rush" />
                  <label
                    htmlFor="rush"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Rush/Express Service
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="hazmat" />
                  <label
                    htmlFor="hazmat"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Hazmat Handling
                  </label>
                </div>
              </div>
            </div>

            <Button className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate
            </Button>
          </CardContent>
        </Card>

        {/* Price Calculation */}
        <Card>
          <CardHeader>
            <CardTitle>Price Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Base Rate */}
              <div>
                <h4 className="font-medium mb-2">Base Rate</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Food Grade Cleaning
                  </span>
                  <span className="font-medium">฿850.00</span>
                </div>
              </div>

              <Separator />

              {/* Customer Discount */}
              <div>
                <h4 className="font-medium mb-2">Customer Discount</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Platinum Tier (-20%)</span>
                    <span style={{ color: "var(--gecko-error-600)" }}>-฿170.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Custom Rate Override</span>
                    <span style={{ color: "var(--gecko-error-600)" }}>-฿30.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">฿650.00</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Surcharges */}
              <div>
                <h4 className="font-medium mb-2">Surcharges</h4>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Weekend (+30%)</span>
                    <span style={{ color: "var(--gecko-success-600)" }}>+฿195.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">40ft Oversize (+50%)</span>
                    <span style={{ color: "var(--gecko-success-600)" }}>+฿325.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Steam Heating</span>
                    <span style={{ color: "var(--gecko-success-600)" }}>+฿200.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">Surcharge Total</span>
                    <span className="font-medium" style={{ color: "var(--gecko-success-600)" }}>+฿720.00</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">TOTAL</span>
                  <span className="text-2xl font-bold">฿1,370.00</span>
                </div>
              </div>

              {/* Applied Rules */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Applied Rules:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Customer: CMA CGM (Platinum)</li>
                  <li>• Custom rate for Food Grade</li>
                  <li>• Weekend surcharge (Saturday)</li>
                  <li>• 40ft equipment surcharge</li>
                  <li>• Steam heating add-on</li>
                </ul>
              </div>

              {/* Action */}
              <Button variant="outline" className="w-full">
                Create Quote with This Price
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
