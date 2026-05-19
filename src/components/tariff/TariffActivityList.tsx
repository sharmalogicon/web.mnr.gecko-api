"use client";

/**
 * Activity-tab timeline backed by `historyRepo`.
 * Phase 7.7-P / 7.9-B — inline styles converted to CSS module.
 */

import { Icon } from "@/components/ui/Icon";
import { historyRepo } from "@/lib/repos";
import { ActivityEmpty } from "./TariffDetailChrome";

import styles from "./TariffActivityList.module.css";

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
    <div className={styles.shell}>
      <div className={styles.header}>
        <Icon name="activity" size={14} />
        Audit Trail
      </div>

      <div className={styles.timeline}>
        <div aria-hidden className={styles.rail} />

        {entries.map((entry) => (
          <div key={entry.id} className={styles.entry}>
            <span aria-hidden className={styles.dot} />
            <div className={styles.entryHead}>
              <span className={`gecko-text-mono ${styles.timestamp}`}>
                {formatTimestamp(entry.changedAt)}
              </span>
              <span className={styles.actor}>{entry.changedBy}</span>
              <span className={`gecko-pill gecko-pill-neutral ${styles.kindPill}`}>
                {entry.type.replace(/_/g, " ")}
              </span>
            </div>
            <div className={styles.summary}>{entry.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
