"use client";
import React from 'react';

export interface TableSkeletonProps {
  columns?: number;  // default 6
  rows?: number;     // default 8
  className?: string;
}

/**
 * Skeleton for list-page tables. Renders inside the existing table card so the
 * column structure (TH row) stays visible. Per UI-SPEC §8.3.
 */
export function TableSkeleton({ columns = 6, rows = 8, className = '' }: TableSkeletonProps) {
  return (
    <div className={`gecko-card gecko-card-compact ${className}`.trim()}>
      <div className="gecko-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: 12,
              padding: '8px 0',
            }}
          >
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="gecko-skeleton gecko-skeleton-text"
                style={{
                  height: 12,
                  width: `${60 + ((r * c) % 4) * 10}%`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for the dashboard KPI tile. Matches the §6 KPI shape:
 * label row + value + sparkline.
 */
export function KpiTileSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`gecko-card gecko-card-compact gecko-stat-card-compact ${className}`.trim()}>
      <div className="gecko-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="gecko-skeleton gecko-skeleton-text" style={{ height: 12, width: '40%' }} />
          <div className="gecko-skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} />
        </div>
        <div className="gecko-skeleton" style={{ height: 28, width: 80 }} />
        <div className="gecko-skeleton" style={{ height: 36, width: 96 }} />
      </div>
    </div>
  );
}

export interface DetailSpinnerProps {
  label?: string;  // default 'Loading…'
  className?: string;
}

/**
 * Centred spinner with label below — for detail-page fetches.
 * Uses the existing .gecko-spinner class from gecko_design_system_components.css.
 */
export function DetailSpinner({ label = 'Loading…', className = '' }: DetailSpinnerProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 12,
        minHeight: 320,
      }}
    >
      <span className="gecko-spinner gecko-spinner-lg" aria-hidden="true" />
      <div style={{ fontSize: 13, color: 'var(--gecko-text-secondary)' }}>{label}</div>
    </div>
  );
}
