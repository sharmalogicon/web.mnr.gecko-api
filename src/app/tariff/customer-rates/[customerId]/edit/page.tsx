"use client";

import { use } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";

export default function EditCustomerRatePage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  console.log("🔵 EditCustomerRatePage - Component Loading");

  const { customerId } = use(params);

  console.log("🔵 Customer ID:", customerId);
  console.log("🔵 EditCustomerRatePage - Loaded Successfully");

  return (
    <AppShell>
      {/* Back Button */}
      <Link href={`/tariff/customer-rates/${customerId}`}>
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customer Rate
        </Button>
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Edit Customer Rates</h1>
        <p className="text-muted-foreground mt-1">
          CMA CGM (Thailand) Co., Ltd.
        </p>
      </div>

      <div className="max-w-3xl">
        {/* Pricing Method */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pricing Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup defaultValue="custom">
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
              <Select defaultValue="platinum">
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

        {/* Service Rates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Survey Services */}
            <div>
              <h3 className="font-medium mb-3">Survey Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServiceRateInput
                  name="Tank Survey"
                  standard="$100"
                  useTierDiscount={true}
                  customRate="80"
                />
                <ServiceRateInput
                  name="Container Survey"
                  standard="$60"
                  useTierDiscount={true}
                  customRate=""
                />
                <ServiceRateInput
                  name="PTI Test"
                  standard="$150"
                  useTierDiscount={true}
                  customRate=""
                />
              </div>
            </div>

            {/* Cleaning Services */}
            <div>
              <h3 className="font-medium mb-3">Cleaning Services</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServiceRateInput
                  name="Standard Clean"
                  standard="$200"
                  useTierDiscount={true}
                  customRate=""
                />
                <ServiceRateInput
                  name="Chemical Wash"
                  standard="$450"
                  useTierDiscount={true}
                  customRate=""
                />
                <ServiceRateInput
                  name="Food Grade Clean ⭐"
                  standard="$850"
                  useTierDiscount={false}
                  customRate="650"
                  highlighted={true}
                />
              </div>
            </div>

            {/* Storage Rates */}
            <div>
              <h3 className="font-medium mb-3">Storage Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServiceRateInput
                  name="General Zone"
                  standard="$25/day"
                  useTierDiscount={true}
                  customRate=""
                />
                <ServiceRateInput
                  name="Food Grade Zone ⭐"
                  standard="$35/day"
                  useTierDiscount={false}
                  customRate="25"
                  highlighted={true}
                />
                <ServiceRateInput
                  name="Hazmat Zone"
                  standard="$50/day"
                  useTierDiscount={true}
                  customRate=""
                />
              </div>
            </div>

            {/* Labor Rates */}
            <div>
              <h3 className="font-medium mb-3">Labor Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ServiceRateInput
                  name="Technician Labor"
                  standard="$75/hr"
                  useTierDiscount={true}
                  customRate=""
                />
                <ServiceRateInput
                  name="Specialist Labor ⭐"
                  standard="$100/hr"
                  useTierDiscount={false}
                  customRate="85"
                  highlighted={true}
                />
              </div>
            </div>
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
                  <TableRow threshold="50" discount="2" />
                  <TableRow threshold="100" discount="5" />
                  <TableRow threshold="200" discount="8" />
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
              defaultValue="Special rates negotiated per contract CTR-2024-001. Food grade cleaning and storage rates below tier discount due to volume commitment of 100+ tanks/month."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href={`/tariff/customer-rates/${customerId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button>Save Changes</Button>
        </div>
      </div>
    </AppShell>
  );
}

interface ServiceRateInputProps {
  name: string;
  standard: string;
  useTierDiscount: boolean;
  customRate: string;
  highlighted?: boolean;
}

function ServiceRateInput({
  name,
  standard,
  useTierDiscount,
  customRate,
  highlighted,
}: ServiceRateInputProps) {
  const containerStyle: React.CSSProperties = highlighted
    ? {
        background: "var(--gecko-primary-50)",
        borderColor: "var(--gecko-primary-200)",
      }
    : {};
  return (
    <div className="p-3 border rounded-lg" style={containerStyle}>
      <div className="mb-2">
        <span
          className="text-sm font-medium"
          style={highlighted ? { color: "var(--gecko-primary-900)" } : undefined}
        >
          {name}
        </span>
        <p className="text-xs text-muted-foreground">Standard: {standard}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            name={`rate-${name}`}
            id={`tier-${name}`}
            defaultChecked={useTierDiscount}
            className="h-4 w-4"
          />
          <Label htmlFor={`tier-${name}`} className="text-sm font-normal">
            Use tier discount (20%)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            name={`rate-${name}`}
            id={`custom-${name}`}
            defaultChecked={!useTierDiscount}
            className="h-4 w-4"
          />
          <Label htmlFor={`custom-${name}`} className="text-sm font-normal">
            Custom rate
          </Label>
        </div>
        {!useTierDiscount && (
          <Input
            type="number"
            placeholder="Custom rate"
            defaultValue={customRate}
            className="w-full"
          />
        )}
      </div>
      {customRate && !useTierDiscount && (
        <p className="text-xs mt-2" style={{ color: "var(--gecko-primary-600)" }}>
          Effective: ${customRate} (
          {Math.round(
            ((parseFloat(standard.replace(/[^0-9.]/g, "")) -
              parseFloat(customRate)) /
              parseFloat(standard.replace(/[^0-9.]/g, ""))) *
              100
          )}
          %)
        </p>
      )}
    </div>
  );
}

interface TableRowProps {
  threshold: string;
  discount: string;
}

function TableRow({ threshold, discount }: TableRowProps) {
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
