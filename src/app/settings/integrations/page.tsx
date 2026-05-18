"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, RefreshCw, Plus, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const integrations = [
  {
    id: "sap",
    name: "SAP Business One",
    description: "Sync invoices and customers with SAP",
    status: "connected",
    icon: "S",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    description: "Accounting and invoicing integration",
    status: "disconnected",
    icon: "Q",
  },
  {
    id: "maersk",
    name: "Maersk API",
    description: "Container tracking and EDI messages",
    status: "connected",
    icon: "M",
  },
  {
    id: "cmacgm",
    name: "CMA CGM API",
    description: "Container tracking and EDI messages",
    status: "disconnected",
    icon: "C",
  },
];

const webhooks = [
  {
    id: 1,
    url: "https://api.example.com/webhooks/logicon",
    events: ["survey.completed", "repair.approved"],
    status: "active",
  },
  {
    id: 2,
    url: "https://hooks.slack.com/services/xxx",
    events: ["emergency.created"],
    status: "active",
  },
];

export default function IntegrationsSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "sk_live_logicon_a1b2c3d4e5f6g7h8i9j0";

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage API keys for external integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Live API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  readOnly
                  className="pr-20 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopyApiKey}>
                {copied ? (
                  <Check
                    className="h-4 w-4"
                    style={{ color: "var(--gecko-success-600)" }}
                  />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this key for server-side API requests. Keep it secret.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Third-Party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Third-Party Integrations</CardTitle>
          <CardDescription>Connect with external services and systems</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration, index) => (
            <div key={integration.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{integration.name}</p>
                      <Badge
                        variant={integration.status === "connected" ? "default" : "secondary"}
                      >
                        {integration.status === "connected" ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant={integration.status === "connected" ? "outline" : "default"}
                  size="sm"
                >
                  {integration.status === "connected" ? "Configure" : "Connect"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Receive real-time notifications for events</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {webhooks.map((webhook, index) => (
            <div key={webhook.id}>
              {index > 0 && <Separator className="my-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate max-w-[300px]">
                      {webhook.url}
                    </code>
                    <Badge
                      variant="outline"
                      style={{
                        color: "var(--gecko-success-700)",
                        borderColor: "var(--gecko-success-600)",
                      }}
                    >
                      Active
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: "var(--gecko-error-700)" }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">API Documentation</p>
              <p className="text-sm text-muted-foreground">
                Learn how to integrate with logicon-mnr API
              </p>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
