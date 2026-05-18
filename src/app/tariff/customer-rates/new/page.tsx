"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export default function NewCustomerRatePage() {
  console.log("🟣 NewCustomerRatePage - Component Loaded");

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Add Customer Rate</h1>
        <p className="text-muted-foreground mt-1">
          Configure customer-specific pricing
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <SelectItem value="hapag">Hapag-Lloyd AG</SelectItem>
                  <SelectItem value="one">Ocean Network Express (ONE)</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="contract">Link to Contract (Optional)</Label>
              <Select>
                <SelectTrigger id="contract">
                  <SelectValue placeholder="(None)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(None)</SelectItem>
                  <SelectItem value="ctr-2024-001">CTR-2024-001 - CMA CGM</SelectItem>
                  <SelectItem value="ctr-2024-002">CTR-2024-002 - MAERSK</SelectItem>
                  <SelectItem value="ctr-2024-003">CTR-2024-003 - MSC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effective-date">Effective Date *</Label>
              <Input
                id="effective-date"
                type="date"
                defaultValue="2024-12-15"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pricing Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup defaultValue="tier">
              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="tier" id="tier" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="tier" className="font-medium">
                    Tier-Based Only
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically apply tier discount to all services
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="font-medium">
                    Custom Rates
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define specific rates for selected services
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Custom Rates Section (shown when "Custom Rates" is selected) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Custom Rate Overrides (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add services where you want to override the tier discount
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Service</th>
                    <th className="text-left p-3 text-sm font-medium">Standard</th>
                    <th className="text-left p-3 text-sm font-medium">Custom Rate</th>
                    <th className="text-left p-3 text-sm font-medium">Discount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">
                      <Select>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food-clean">Food Grade Cleaning</SelectItem>
                          <SelectItem value="food-storage">Food Grade Storage</SelectItem>
                          <SelectItem value="specialist">Specialist Labor</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3 text-sm">$850</td>
                    <td className="p-3">
                      <Input type="number" placeholder="650" className="w-[120px]" />
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">-24%</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-3 border-t">
                <Button variant="outline" size="sm">
                  + Add Custom Rate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume Discounts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Volume Discounts (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Threshold (units/month)</th>
                    <th className="text-left p-3 text-sm font-medium">Additional Discount</th>
                    <th className="text-left p-3 text-sm font-medium w-[80px]"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">
                      <Input type="number" placeholder="50" className="w-[150px]" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Input type="number" placeholder="2" className="w-[100px]" />
                        <span className="text-sm">%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="sm">Remove</Button>
                    </td>
                  </tr>
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
              placeholder="Add any special notes or terms for this customer rate..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/tariff/customer-rates">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button>Create Customer Rate</Button>
        </div>
      </div>
    </AppShell>
  );
}
