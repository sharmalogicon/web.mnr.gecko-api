"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsConfigPage() {
  return (
    <div className="space-y-6">
      {/* Pricing Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>Set default pricing for services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Survey Pricing</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Pre-Cleaning Survey</Label>
                <Input type="number" defaultValue="150" />
              </div>
              <div className="space-y-2">
                <Label>Post-Repair Survey</Label>
                <Input type="number" defaultValue="150" />
              </div>
              <div className="space-y-2">
                <Label>Periodic Inspection</Label>
                <Input type="number" defaultValue="200" />
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium">Cleaning Pricing</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Standard Clean</Label>
                <Input type="number" defaultValue="350" />
              </div>
              <div className="space-y-2">
                <Label>Food Grade</Label>
                <Input type="number" defaultValue="850" />
              </div>
              <div className="space-y-2">
                <Label>Deep Clean</Label>
                <Input type="number" defaultValue="550" />
              </div>
            </div>
          </div>
          <Separator />
          <Button>Save Pricing</Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage authentication and security options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Password Policy</div>
              <div className="text-sm text-muted-foreground">Set minimum password requirements</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Require 2FA for all users</div>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Session Timeout</div>
              <div className="text-sm text-muted-foreground">Auto-logout after inactivity</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Data */}
      <Card>
        <CardHeader>
          <CardTitle>Master Data</CardTitle>
          <CardDescription>Manage reference data and lookups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-medium">Customers</div>
                <div className="text-xs text-muted-foreground">Manage customer list</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-medium">Tank Types</div>
                <div className="text-xs text-muted-foreground">Configure tank types</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-medium">Damage Codes</div>
                <div className="text-xs text-muted-foreground">Repair damage codes</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-medium">Cleaning Types</div>
                <div className="text-xs text-muted-foreground">Cleaning categories</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-medium">Part Categories</div>
                <div className="text-xs text-muted-foreground">Spare parts categories</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <div className="font-medium">Suppliers</div>
                <div className="text-xs text-muted-foreground">Supplier directory</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Customize email notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Quote Email</div>
              <div className="text-sm text-muted-foreground">Sent when quote is generated</div>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Invoice Email</div>
              <div className="text-sm text-muted-foreground">Sent with invoice</div>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-medium">Completion Certificate</div>
              <div className="text-sm text-muted-foreground">Sent when job is completed</div>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
