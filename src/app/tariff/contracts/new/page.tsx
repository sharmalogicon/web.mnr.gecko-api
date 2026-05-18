"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";

export default function NewContractPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/contracts">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Contracts
        </Button>
      </Link>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={
                currentStep >= 1
                  ? {
                      background: "var(--gecko-primary-600)",
                      color: "var(--gecko-text-inverse)",
                    }
                  : {
                      border: "2px solid var(--gecko-border-strong)",
                      color: "var(--gecko-text-secondary)",
                    }
              }
            >
              1
            </div>
            <span className={`text-sm ${currentStep >= 1 ? 'font-medium' : 'text-muted-foreground'}`}>Contract Info</span>
          </div>
          <div
            className="h-px w-12"
            style={{ background: currentStep >= 2 ? "var(--gecko-primary-600)" : "var(--gecko-border-strong)" }}
          />
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={
                currentStep >= 2
                  ? {
                      background: "var(--gecko-primary-600)",
                      color: "var(--gecko-text-inverse)",
                    }
                  : {
                      border: "2px solid var(--gecko-border-strong)",
                      color: "var(--gecko-text-secondary)",
                    }
              }
            >
              2
            </div>
            <span className={`text-sm ${currentStep >= 2 ? 'font-medium' : 'text-muted-foreground'}`}>Pricing Terms</span>
          </div>
          <div
            className="h-px w-12"
            style={{ background: currentStep >= 3 ? "var(--gecko-primary-600)" : "var(--gecko-border-strong)" }}
          />
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={
                currentStep >= 3
                  ? {
                      background: "var(--gecko-primary-600)",
                      color: "var(--gecko-text-inverse)",
                    }
                  : {
                      border: "2px solid var(--gecko-border-strong)",
                      color: "var(--gecko-text-secondary)",
                    }
              }
            >
              3
            </div>
            <span className={`text-sm ${currentStep >= 3 ? 'font-medium' : 'text-muted-foreground'}`}>Review</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Contract Info */}
          {currentStep === 1 && (
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer *</Label>
                <Select>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Search customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cma-cgm">CMA CGM (Thailand) Co., Ltd.</SelectItem>
                    <SelectItem value="maersk">MAERSK Line</SelectItem>
                    <SelectItem value="msc">MSC Mediterranean Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract-type">Contract Type *</Label>
                <Select>
                  <SelectTrigger id="contract-type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual Service Agreement</SelectItem>
                    <SelectItem value="spot">Spot Contract</SelectItem>
                    <SelectItem value="volume">Volume Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input id="start-date" type="date" defaultValue="2025-01-01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date *</Label>
                  <Input id="end-date" type="date" defaultValue="2025-12-31" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-tier">Customer Tier *</Label>
                <Select>
                  <SelectTrigger id="customer-tier">
                    <SelectValue placeholder="Select tier..." />
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

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Renewal Terms</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-renew" defaultChecked />
                  <label
                    htmlFor="auto-renew"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Auto-renew unless cancelled
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notice-period">Notice Period (days)</Label>
                  <Input
                    id="notice-period"
                    type="number"
                    defaultValue="30"
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Volume Commitment</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="volume-commitment" />
                  <label
                    htmlFor="volume-commitment"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Minimum volume commitment
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min-volume">Minimum Units</Label>
                    <Input id="min-volume" type="number" placeholder="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Per</Label>
                    <Select>
                      <SelectTrigger id="period">
                        <SelectValue placeholder="month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">month</SelectItem>
                        <SelectItem value="quarter">quarter</SelectItem>
                        <SelectItem value="year">year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Pricing Terms */}
          {currentStep === 2 && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Service Pricing</h3>
                <p className="text-sm text-muted-foreground">
                  Define custom rates or use tier-based discounts
                </p>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Service Category</th>
                        <th className="text-left p-3 text-sm font-medium">Standard Rate</th>
                        <th className="text-left p-3 text-sm font-medium">Contract Rate</th>
                        <th className="text-left p-3 text-sm font-medium">Discount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3 font-medium">Tank Survey</td>
                        <td className="p-3 text-sm text-muted-foreground">฿3,500</td>
                        <td className="p-3">
                          <Input type="number" placeholder="2800" className="w-[120px]" />
                        </td>
                        <td className="p-3 text-sm font-medium" style={{ color: "var(--gecko-success-600)" }}>-20%</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3 font-medium">Standard Clean</td>
                        <td className="p-3 text-sm text-muted-foreground">฿7,000</td>
                        <td className="p-3">
                          <Input type="number" placeholder="5600" className="w-[120px]" />
                        </td>
                        <td className="p-3 text-sm font-medium" style={{ color: "var(--gecko-success-600)" }}>-20%</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3 font-medium">Food Grade Clean</td>
                        <td className="p-3 text-sm text-muted-foreground">฿30,000</td>
                        <td className="p-3">
                          <Input type="number" placeholder="24000" className="w-[120px]" />
                        </td>
                        <td className="p-3 text-sm font-medium" style={{ color: "var(--gecko-success-600)" }}>-20%</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3 font-medium">Storage (General Zone)</td>
                        <td className="p-3 text-sm text-muted-foreground">฿900/day</td>
                        <td className="p-3">
                          <Input type="number" placeholder="700" className="w-[120px]" />
                        </td>
                        <td className="p-3 text-sm font-medium" style={{ color: "var(--gecko-success-600)" }}>-20%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Payment Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-terms">Payment Due</Label>
                    <Select>
                      <SelectTrigger id="payment-terms">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net-30">Net 30 days</SelectItem>
                        <SelectItem value="net-45">Net 45 days</SelectItem>
                        <SelectItem value="net-60">Net 60 days</SelectItem>
                        <SelectItem value="immediate">Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                        <SelectItem value="thb">THB (฿)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-medium">Additional Terms</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="price-lock" defaultChecked />
                    <label htmlFor="price-lock" className="text-sm font-medium">
                      Lock prices for contract duration
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="surcharges" />
                    <label htmlFor="surcharges" className="text-sm font-medium">
                      Exempt from surcharges (weekend, after-hours, etc.)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-4">
                <h3 className="font-medium text-lg">Review Contract</h3>
                <p className="text-sm text-muted-foreground">
                  Please review all contract details before creating
                </p>

                <div className="space-y-6">
                  {/* Contract Information */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Contract Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <p className="font-medium">CMA CGM (Thailand) Co., Ltd.</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Contract Type:</span>
                        <p className="font-medium">Annual Service Agreement</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Period:</span>
                        <p className="font-medium">Jan 1, 2025 - Dec 31, 2025</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tier:</span>
                        <p className="font-medium">🥇 Platinum (20% discount)</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Pricing Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tank Survey</span>
                        <span className="font-medium">฿2,800 <span className="text-xs" style={{ color: "var(--gecko-success-600)" }}>(-20%)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Standard Clean</span>
                        <span className="font-medium">฿5,600 <span className="text-xs" style={{ color: "var(--gecko-success-600)" }}>(-20%)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Grade Clean</span>
                        <span className="font-medium">฿24,000 <span className="text-xs" style={{ color: "var(--gecko-success-600)" }}>(-20%)</span></span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Storage (General Zone)</span>
                        <span className="font-medium">฿700/day <span className="text-xs" style={{ color: "var(--gecko-success-600)" }}>(-20%)</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="p-4 border rounded-lg space-y-3">
                    <h4 className="font-medium">Contract Terms</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--gecko-success-600)" }}>✓</span>
                        <span>Auto-renewal enabled (30 days notice)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--gecko-success-600)" }}>✓</span>
                        <span>Payment terms: Net 30 days</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--gecko-success-600)" }}>✓</span>
                        <span>Prices locked for contract duration</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add any special terms or conditions..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between mt-6">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePrevious}>
              ← Previous
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Link href="/tariff/contracts">
            <Button variant="outline">Cancel</Button>
          </Link>
          {currentStep < 3 ? (
            <Button onClick={handleNext}>
              Next: {currentStep === 1 ? 'Pricing' : 'Review'} →
            </Button>
          ) : (
            <Link href="/tariff/contracts">
              <Button>Create Contract</Button>
            </Link>
          )}
        </div>
      </div>
    </AppShell>
  );
}
