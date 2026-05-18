"use client";

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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function NewRateCardPage() {
  console.log("🟣 NewRateCardPage - Component Loaded");

  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/rate-cards">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Rate Cards
        </Button>
      </Link>

      <div className="max-w-3xl">
        {/* Service Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Service Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name *</Label>
              <Input
                id="service-name"
                placeholder="e.g., Food Grade Cleaning"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="survey">Survey & Inspection</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="modification">Modification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment Type *</Label>
                <Select>
                  <SelectTrigger id="equipment">
                    <SelectValue placeholder="Select equipment..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    <SelectItem value="tank">ISO Tank</SelectItem>
                    <SelectItem value="dry">Dry Container</SelectItem>
                    <SelectItem value="reefer">Reefer</SelectItem>
                    <SelectItem value="genset">Genset</SelectItem>
                    <SelectItem value="chassis">Chassis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the service..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Rate Type *</Label>
              <RadioGroup defaultValue="fixed">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-normal">
                    Fixed (per unit)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="variable" id="variable" />
                  <Label htmlFor="variable" className="font-normal">
                    Variable (per unit with size factor)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hourly" id="hourly" />
                  <Label htmlFor="hourly" className="font-normal">
                    Hourly (labor-based)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base-rate">Base Rate *</Label>
                <Input
                  id="base-rate"
                  type="number"
                  step="0.01"
                  placeholder="850.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select defaultValue="usd">
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="thb">THB (฿)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Size Adjustments (shown when variable is selected) */}
            <div className="p-4 border rounded-lg space-y-3">
              <Label>Size Adjustments (Optional)</Label>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="size-20" className="text-xs">20ft</Label>
                    <Input id="size-20" placeholder="1.0x" defaultValue="1.0" />
                  </div>
                  <div>
                    <Label htmlFor="size-40" className="text-xs">40ft</Label>
                    <Input id="size-40" placeholder="1.5x" defaultValue="1.5" />
                  </div>
                  <div>
                    <Label htmlFor="size-45" className="text-xs">45ft</Label>
                    <Input id="size-45" placeholder="1.8x" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Validity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective-from">Effective From *</Label>
                <Input
                  id="effective-from"
                  type="date"
                  defaultValue="2025-01-01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective-to">Effective To</Label>
                <Input
                  id="effective-to"
                  type="date"
                  placeholder="No end date"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="active" defaultChecked />
              <Label htmlFor="active" className="font-normal">
                Active (rate will be immediately available)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/tariff/rate-cards">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button>Create Rate Card</Button>
        </div>
      </div>
    </AppShell>
  );
}
