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

export default function NewSurchargePage() {
  console.log("🟣 NewSurchargePage - Component Loaded");

  return (
    <AppShell>
      {/* Back Button */}
      <Link href="/tariff/surcharges">
        <Button variant="ghost" className="mb-6">
          <Icon name="arrowLeft" size={16} className="mr-2" />
          Back to Surcharges
        </Button>
      </Link>

      <div className="max-w-3xl">
        {/* Basic Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Weekend Surcharge"
              />
            </div>

            <div className="space-y-3">
              <Label>Type *</Label>
              <RadioGroup defaultValue="surcharge">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="surcharge" id="surcharge" />
                  <Label htmlFor="surcharge" className="font-normal">
                    Surcharge (adds to price)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discount" id="discount" />
                  <Label htmlFor="discount" className="font-normal">
                    Discount (reduces price)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">Time-Based</SelectItem>
                  <SelectItem value="service">Service-Based</SelectItem>
                  <SelectItem value="equipment">Equipment-Based</SelectItem>
                  <SelectItem value="handling">Handling-Based</SelectItem>
                  <SelectItem value="promotional">Promotional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional charge for services performed on weekends"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Adjustment Value */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Adjustment Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Calculation Method *</Label>
              <RadioGroup defaultValue="percentage">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage" className="font-normal">
                    Percentage of service total
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="font-normal">
                    Fixed amount
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="30"
                  className="w-[150px]"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applicability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Applicability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Applies To *</Label>
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox id="all-services" />
                  <Label htmlFor="all-services" className="font-normal">
                    All Services
                  </Label>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="survey" />
                    <Label htmlFor="survey" className="font-normal">
                      Survey & Inspection
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="cleaning" />
                    <Label htmlFor="cleaning" className="font-normal">
                      Cleaning
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="repair" />
                    <Label htmlFor="repair" className="font-normal">
                      Repair
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="storage" />
                    <Label htmlFor="storage" className="font-normal">
                      Storage
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="modification" />
                    <Label htmlFor="modification" className="font-normal">
                      Modification
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Equipment Types</Label>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox id="all-equipment" defaultChecked />
                  <Label htmlFor="all-equipment" className="font-normal">
                    All Equipment Types
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>When to Apply *</Label>
              <RadioGroup defaultValue="always">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="always" id="always" />
                  <Label htmlFor="always" className="font-normal">
                    Always (when applicable)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="time" id="time" />
                  <Label htmlFor="time" className="font-normal">
                    Time-based rules
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="date" />
                  <Label htmlFor="date" className="font-normal">
                    Date range
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual" className="font-normal">
                    Manual (user selects)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Time Rules (shown when "Time-based rules" is selected) */}
            <div className="p-4 border rounded-lg space-y-3">
              <Label>Time Rules</Label>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Days:</Label>
                <div className="flex gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <div key={day} className="flex items-center space-x-1">
                      <Checkbox id={day.toLowerCase()} />
                      <Label htmlFor={day.toLowerCase()} className="text-xs font-normal">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Hours:</Label>
                <div className="flex items-center gap-2">
                  <Input type="time" className="w-[150px]" defaultValue="00:00" />
                  <span className="text-sm">to</span>
                  <Input type="time" className="w-[150px]" defaultValue="23:59" />
                </div>
              </div>
            </div>

            {/* Date Range (shown when "Date range" is selected) */}
            <div className="p-4 border rounded-lg space-y-3">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date" className="text-sm">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="active" defaultChecked />
              <Label htmlFor="active" className="font-normal">
                Active (surcharge will be immediately available)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/tariff/surcharges">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button>Save Surcharge</Button>
        </div>
      </div>
    </AppShell>
  );
}
