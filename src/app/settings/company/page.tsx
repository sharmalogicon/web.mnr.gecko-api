"use client";

import { useState } from "react";
import { Building } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CompanySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Company Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>Upload your company logo for branding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                <Icon name="upload" size={16} className="mr-2" />
                Change Logo
              </Button>
              <p className="text-xs text-muted-foreground">
                Recommended: 200x200px, PNG or SVG
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Update your company information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" defaultValue="ABC Depot Co., Ltd." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input id="taxId" defaultValue="0-1234-56789-01-2" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              defaultValue="123 Depot Road, Laem Chabang"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" defaultValue="Laem Chabang" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Input id="province" defaultValue="Chonburi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" defaultValue="20230" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" defaultValue="+66 38 123 456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="info@abcdepot.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Default Settings</CardTitle>
          <CardDescription>Set default values for new users and operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="defaultLanguage">Default Language</Label>
              <Select defaultValue="th">
                <SelectTrigger id="defaultLanguage">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{"\u{1F1FA}\u{1F1F8}"} English</SelectItem>
                  <SelectItem value="th">{"\u{1F1F9}\u{1F1ED}"} Thai</SelectItem>
                  <SelectItem value="vi">{"\u{1F1FB}\u{1F1F3}"} Vietnamese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultCurrency">Default Currency</Label>
              <Select defaultValue="thb">
                <SelectTrigger id="defaultCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thb">THB ({"\u0E3F"})</SelectItem>
                  <SelectItem value="usd">USD ($)</SelectItem>
                  <SelectItem value="eur">EUR ({"\u20AC"})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultTimezone">Default Timezone</Label>
            <Select defaultValue="asia_bangkok">
              <SelectTrigger id="defaultTimezone" className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asia_bangkok">Asia/Bangkok (UTC+7)</SelectItem>
                <SelectItem value="asia_singapore">Asia/Singapore (UTC+8)</SelectItem>
                <SelectItem value="asia_ho_chi_minh">Asia/Ho Chi Minh (UTC+7)</SelectItem>
                <SelectItem value="utc">UTC (UTC+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <span className="gecko-spinner gecko-spinner-sm gecko-spinner-white mr-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
