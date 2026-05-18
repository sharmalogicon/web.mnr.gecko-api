"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Eye, EyeOff, RefreshCw, Plus, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { integrations as seedIntegrations, type IntegrationEntry } from "@/data/seed/integrations";

const ROUTE = "/settings/integrations";

interface IntegrationRow {
  id: string;
  name: string;
  description: string;
  status: "connected" | "disconnected" | "error";
  icon: string;
}

function toRow(rec: IntegrationEntry): IntegrationRow {
  const status: IntegrationRow["status"] =
    rec.status === "configured" ? "connected"
    : rec.status === "error"   ? "error"
    : "disconnected";
  return {
    id: rec.id,
    name: rec.name,
    description: rec.notes ?? `${rec.category.replace(/_/g, " ")} integration via ${rec.vendor}`,
    status,
    icon: rec.vendor.charAt(0).toUpperCase(),
  };
}

const integrationRows: IntegrationRow[] = seedIntegrations.map(toRow);

// Webhook config is operational chrome (real webhooks live in API config, not seed).
const webhooks = [
  {
    id: 1,
    url: "https://hooks.gecko-mnr.example/survey-completed",
    events: ["survey.completed", "repair.approved"],
    status: "active",
  },
  {
    id: 2,
    url: "https://hooks.gecko-mnr.example/emergency",
    events: ["emergency.created"],
    status: "active",
  },
];

export default function IntegrationsSettingsPage() {
  const sp = useSearchParams();
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const apiKey = "sk_live_gecko_a1b2c3d4e5f6g7h8i9j0";

  // T-08-01 mitigation: dev-param gates ONLY in non-production builds.
  const isDev = process.env.NODE_ENV !== "production";
  const forceLoading     = isDev && sp.get("loading") === "1";
  const forceError       = isDev && sp.get("error") === "1";
  const forceEmpty       = isDev && sp.get("empty") === "1";
  const forceFilterEmpty = isDev && sp.get("filter-empty") === "1";

  const records = forceEmpty ? [] : integrationRows;

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---- State-machine branches (UI-SPEC §5.6) ---------------------------------
  // Settings layout already provides AppShell — render bare branches.
  if (forceLoading) {
    return <TableSkeleton columns={3} rows={5} />;
  }
  if (forceError) {
    const errCopy = getErrorCopy(ROUTE);
    return (
      <ErrorState
        title={errCopy.title}
        description={errCopy.description}
        onRetry={() => window.location.reload()}
      />
    );
  }
  if (forceEmpty || forceFilterEmpty) {
    const variant: EmptyStateVariant = forceFilterEmpty ? "filter-empty" : "empty";
    const copy = getEmptyCopy(ROUTE, variant) ?? getEmptyCopy(ROUTE, "empty");
    if (copy) {
      return (
        <EmptyState
          variant={variant}
          icon={copy.icon}
          title={copy.title}
          description={copy.description}
          primary={copy.primary}
          secondary={copy.secondary}
        />
      );
    }
  }
  if (records.length === 0) {
    const copy = getEmptyCopy(ROUTE, "empty");
    if (copy) {
      return (
        <EmptyState
          variant="empty"
          icon={copy.icon}
          title={copy.title}
          description={copy.description}
          primary={copy.primary}
          secondary={copy.secondary}
        />
      );
    }
  }

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
          {records.map((integration, index) => (
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
                        {integration.status === "connected" ? "Connected" :
                         integration.status === "error" ? "Error" : "Not Connected"}
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
                Learn how to integrate with Gecko M&amp;R API
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
