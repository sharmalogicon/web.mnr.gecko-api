"use client";
import React, { type ReactNode } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';

export interface ErrorStateProps {
  /** Friendly headline. Route-aware copy comes from src/data/copy/empty-states.ts errorCopy. */
  title: string;
  /** One-paragraph friendly description. */
  description?: ReactNode;
  /** Retry handler — wires to the page's data-fetch trigger. */
  onRetry?: () => void;
  /** Underlying error for the disclosure. Phase-1 placeholders supplied by caller. */
  error?: {
    code?: string;          // e.g. "FETCH_FAILED"
    correlationId?: string; // Phase-1 placeholder format: MNR-{8-hex-chars}
    message?: string;       // raw error message
  };
}

/**
 * Generate the Phase-1 placeholder correlation ID. Real correlation IDs
 * land when Phase 2's repository pattern wires actual fetches.
 * Format: MNR-{8-hex-chars} per UI-SPEC §5.5.
 */
export function placeholderCorrelationId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return 'MNR-' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function ErrorState({
  title,
  description,
  onRetry,
  error,
}: ErrorStateProps) {
  const correlationId = error?.correlationId ?? placeholderCorrelationId();
  const code = error?.code ?? 'UNKNOWN';
  const message = error?.message ?? '';

  const handleCopy = () => {
    void navigator.clipboard.writeText(JSON.stringify({ code, correlationId, message }, null, 2));
  };

  return (
    <div>
      <EmptyState
        variant="error"
        icon="alertCircle"
        title={title}
        description={description}
        primary={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
      />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <details className="gecko-error-disclosure">
          <summary>Show details</summary>
          <div className="gecko-error-disclosure-body">
            <div>Code <span style={{ marginLeft: 16 }}>{code}</span></div>
            <div>Correlation <span style={{ marginLeft: 16 }}>{correlationId}</span></div>
            {message && <div>Message <span style={{ marginLeft: 16 }}>{message}</span></div>}
            <button
              type="button"
              className="gecko-btn gecko-btn-outline gecko-btn-sm"
              onClick={handleCopy}
              style={{ marginTop: 12 }}
            >
              <Icon name="copy" size={14} /> Copy details
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
