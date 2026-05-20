"use client";

/**
 * /settings/integrations — Phase 7.9-E native gecko form primitives.
 * Phase 7.13-C3 — wrapped in <ListPageShell>.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ListPageShell } from "@/components/page-shells";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, type EmptyStateVariant } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getEmptyCopy, getErrorCopy } from "@/data/copy/empty-states";
import { integrationRepo } from "@/lib/repos";
import type { IntegrationEntry } from "@/lib/types";

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

const integrationRows: IntegrationRow[] = integrationRepo.list().map(toRow);

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
    <ListPageShell
      title="Integrations"
      count={integrationRows.length}
      countSuffix="integrations"
      subtitle="API keys, third-party services, and webhooks."
    >
      {/* API Keys */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">API Keys</h2>
            <p className="gecko-card-description">Manage API keys for external integrations</p>
          </div>
          <div className="gecko-field">
            <label htmlFor="apiKey" className="gecko-field-label">Live API Key</label>
            <div className="flex gap-2">
              <div className="gecko-input-wrap flex-1">
                <input
                  id="apiKey"
                  type={showApiKey ? "text" : "password"}
                  className="gecko-input gecko-text-mono"
                  value={apiKey}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="gecko-input-affix"
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                >
                  <Icon name={showApiKey ? "eyeOff" : "eye"} size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={handleCopyApiKey}
                className="gecko-btn gecko-btn-outline gecko-btn-icon gecko-btn-sm"
                aria-label={copied ? "Copied" : "Copy API key"}
              >
                {copied ? (
                  <Icon name="check" size={16} className="gecko-text-success" />
                ) : (
                  <Icon name="copy" size={16} />
                )}
              </button>
              <button
                type="button"
                className="gecko-btn gecko-btn-outline gecko-btn-icon gecko-btn-sm"
                aria-label="Regenerate API key"
              >
                <Icon name="refreshCcw" size={16} />
              </button>
            </div>
            <span className="gecko-field-helper">
              Use this key for server-side API requests. Keep it secret.
            </span>
          </div>
        </div>
      </div>

      {/* Third-Party Integrations */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div>
            <h2 className="gecko-card-title">Third-Party Integrations</h2>
            <p className="gecko-card-description">Connect with external services and systems</p>
          </div>
          {records.map((integration, index) => (
            <div key={integration.id}>
              {index > 0 && <hr className="gecko-divider mb-4" />}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="gecko-vendor-bubble">{integration.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="gecko-field-label">{integration.name}</p>
                      <span
                        className={
                          integration.status === "connected"
                            ? "gecko-pill gecko-pill-success"
                            : integration.status === "error"
                            ? "gecko-pill gecko-pill-danger"
                            : "gecko-pill gecko-pill-neutral"
                        }
                      >
                        {integration.status === "connected"
                          ? "Connected"
                          : integration.status === "error"
                          ? "Error"
                          : "Not Connected"}
                      </span>
                    </div>
                    <p className="gecko-field-helper">{integration.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    integration.status === "connected"
                      ? "gecko-btn gecko-btn-outline gecko-btn-sm"
                      : "gecko-btn gecko-btn-primary gecko-btn-sm"
                  }
                >
                  {integration.status === "connected" ? "Configure" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Webhooks */}
      <div className="gecko-card">
        <div className="gecko-card-body flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="gecko-card-title">Webhooks</h2>
              <p className="gecko-card-description">Receive real-time notifications for events</p>
            </div>
            <button type="button" className="gecko-btn gecko-btn-primary gecko-btn-sm">
              <Icon name="plus" size={16} />
              Add Webhook
            </button>
          </div>
          {webhooks.map((webhook, index) => (
            <div key={webhook.id}>
              {index > 0 && <hr className="gecko-divider mb-4" />}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="gecko-code-pill">{webhook.url}</code>
                    <span className="gecko-pill gecko-pill-success">Active</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {webhook.events.map((event) => (
                      <span key={event} className="gecko-pill gecko-pill-neutral">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="gecko-btn gecko-btn-ghost gecko-btn-sm">
                    Edit
                  </button>
                  <button
                    type="button"
                    className="gecko-btn gecko-btn-ghost gecko-btn-sm gecko-text-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Link */}
      <div className="gecko-card">
        <div className="gecko-card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="gecko-field-label">API Documentation</p>
              <p className="gecko-field-helper">
                Learn how to integrate with Gecko M&amp;R API
              </p>
            </div>
            <button type="button" className="gecko-btn gecko-btn-outline gecko-btn-sm">
              <ExternalLink size={16} />
              View Docs
            </button>
          </div>
        </div>
      </div>
    </ListPageShell>
  );
}
