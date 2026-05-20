"use client";

/**
 * /settings/notifications — Phase 7.9-E native gecko form primitives.
 * Switch wrapper kept (Radix switch isn't on the migration list).
 * Phase 7.13-C3 — wrapped in <FormPageShell>.
 */

import { useState } from "react";
import { FormPageShell } from "@/components/page-shells";
import { Switch } from "@/components/ui/switch";

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

interface Channel {
  id: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}

function ChannelRow({ channel }: { channel: Channel }) {
  return (
    <label className="flex items-start gap-3" htmlFor={channel.id}>
      <input
        id={channel.id}
        type="checkbox"
        defaultChecked={channel.defaultChecked !== false}
      />
      <div className="flex flex-col">
        <span className="gecko-field-label">{channel.label}</span>
        <span className="gecko-field-helper">{channel.description}</span>
      </div>
    </label>
  );
}

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
    <FormPageShell
      title="Notifications"
      subtitle="Choose which channels deliver each event type."
      onSave={handleSave}
      saving={isSaving}
      saveLabel="Save Preferences"
      narrow={false}
    >
      {/* Email Notifications */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="gecko-card-title">Email Notifications</h2>
              <p className="gecko-card-description">Receive notifications via email</p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
              aria-label="Toggle email notifications"
            />
          </div>
          {emailEnabled && (
            <div className="flex flex-col gap-4">
              {emailNotifications.map((notification) => (
                <ChannelRow key={notification.id} channel={notification} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="gecko-card-title">Push Notifications</h2>
              <p className="gecko-card-description">Receive notifications in the browser</p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              aria-label="Toggle push notifications"
            />
          </div>
          {pushEnabled && (
            <div className="flex flex-col gap-4">
              {pushNotifications.map((notification) => (
                <ChannelRow key={notification.id} channel={notification} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SMS Notifications */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="gecko-card-title">SMS Notifications</h2>
              <p className="gecko-card-description">Receive notifications via text message</p>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={setSmsEnabled}
              aria-label="Toggle SMS notifications"
            />
          </div>
          {smsEnabled ? (
            <div className="flex flex-col gap-4">
              {smsNotifications.map((notification) => (
                <ChannelRow key={notification.id} channel={notification} />
              ))}
            </div>
          ) : (
            <p className="gecko-field-helper">
              SMS notifications are disabled. Enable to receive text messages.
            </p>
          )}
        </div>
      </div>
    </FormPageShell>
  );
}
