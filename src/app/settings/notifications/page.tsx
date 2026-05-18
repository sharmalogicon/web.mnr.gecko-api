"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const emailNotifications = [
  { id: "survey_completed", label: "Survey completed", description: "Notify when survey is done" },
  { id: "repair_quote_approved", label: "Repair quote approved", description: "Customer approves quote" },
  { id: "low_stock", label: "Low stock alerts", description: "Parts below minimum level" },
  { id: "invoice_paid", label: "Invoice paid", description: "Payment received" },
  { id: "daily_summary", label: "Daily summary", description: "End of day report", defaultChecked: false },
  { id: "emergency_alerts", label: "Emergency alerts", description: "Critical incidents" },
];

const pushNotifications = [
  { id: "real_time_updates", label: "Real-time job updates", description: "Status changes" },
  { id: "assigned_to_me", label: "Assigned to me", description: "New job assignments" },
  { id: "mentions", label: "Mentions", description: "When someone mentions you" },
  { id: "push_emergency", label: "Emergency alerts", description: "Critical incidents" },
];

const smsNotifications = [
  { id: "sms_emergency", label: "Emergency alerts only", description: "Critical incidents via SMS" },
  { id: "sms_approvals", label: "Approval requests", description: "When approval is needed" },
];

export default function NotificationsSettingsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Receive notifications via email</CardDescription>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              aria-label="Toggle email notifications"
            />
          </div>
        </CardHeader>
        {emailEnabled && (
          <CardContent className="space-y-4">
            {emailNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <Checkbox
                  id={notification.id}
                  defaultChecked={notification.defaultChecked !== false}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={notification.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {notification.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Receive notifications in the browser</CardDescription>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              aria-label="Toggle push notifications"
            />
          </div>
        </CardHeader>
        {pushEnabled && (
          <CardContent className="space-y-4">
            {pushNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <Checkbox id={notification.id} defaultChecked />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={notification.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {notification.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS Notifications</CardTitle>
              <CardDescription>Receive notifications via text message</CardDescription>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
              aria-label="Toggle SMS notifications"
            />
          </div>
        </CardHeader>
        {smsEnabled ? (
          <CardContent className="space-y-4">
            {smsNotifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3">
                <Checkbox id={notification.id} defaultChecked />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={notification.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {notification.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              SMS notifications are disabled. Enable to receive text messages.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}
