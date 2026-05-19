"use client";

/**
 * Activity-tab timeline backed by `historyRepo`.
 * Phase 7.7-P.
 *
 * Filters history entries by entityId === cardId. If empty, falls back to
 * <ActivityEmpty>. Otherwise renders a vertical timeline (dot · mono timestamp
 * · actor · summary).
 */

import { Icon } from "@/components/ui/Icon";
import { historyRepo } from "@/lib/repos";
import { ActivityEmpty } from "./TariffDetailChrome";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TariffActivityList({ cardId }: { cardId: string }) {
  const entries = historyRepo
    .list()
    .filter((e) => e.entityId === cardId)
    .sort((a, b) => (a.changedAt < b.changedAt ? 1 : -1));

  if (entries.length === 0) {
    return <ActivityEmpty />;
  }

  return (
    <div
      style={{
        background: "var(--gecko-bg-surface)",
        border: "1px solid var(--gecko-border)",
        borderRadius: 12,
        padding: 20,
        boxShadow: "var(--gecko-shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          textTransform: "uppercase",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "var(--gecko-text-secondary)",
        }}
      >
        <Icon name="activity" size={14} />
        Audit Trail
      </div>

      <div style={{ position: "relative", paddingLeft: 18 }}>
        {/* vertical rail */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 5,
            top: 6,
            bottom: 6,
            width: 1,
            background: "var(--gecko-border)",
          }}
        />

        {entries.map((entry) => (
          <div
            key={entry.id}
            style={{
              position: "relative",
              paddingBottom: 16,
              fontSize: 13,
            }}
          >
            {/* dot */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: -18,
                top: 4,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "var(--gecko-primary-500)",
                border: "2px solid var(--gecko-bg-surface)",
                boxShadow: "0 0 0 1px var(--gecko-border)",
              }}
            />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <span
                className="gecko-text-mono"
                style={{ fontSize: 11, color: "var(--gecko-text-secondary)" }}
              >
                {formatTimestamp(entry.changedAt)}
              </span>
              <span style={{ fontWeight: 600, color: "var(--gecko-text-primary)" }}>
                {entry.changedBy}
              </span>
              <span
                className="gecko-pill gecko-pill-neutral"
                style={{ fontSize: 10 }}
              >
                {entry.type.replace(/_/g, " ")}
              </span>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--gecko-text-secondary)",
                marginTop: 4,
              }}
            >
              {entry.summary}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
