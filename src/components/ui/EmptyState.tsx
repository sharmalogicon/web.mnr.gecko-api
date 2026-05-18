"use client";
import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

export type EmptyStateVariant = 'empty' | 'filter-empty' | 'not-found' | 'error';

export interface EmptyStateCTA {
  label: string;
  href?: string;        // required for link-style CTAs
  onClick?: () => void; // optional for in-page actions (e.g. clear filter)
}

export interface EmptyStateProps {
  /** Icon glyph name from src/components/ui/Icon.tsx. Defaults vary by variant. */
  icon?: string;
  /** Headline. Required. */
  title: string;
  /** Sub-text under the title. Plain text or one-paragraph ReactNode. */
  description?: ReactNode;
  /** Primary CTA — domain-specific verb + noun. */
  primary?: EmptyStateCTA;
  /** Secondary CTA — recovery / dismissive action. */
  secondary?: EmptyStateCTA;
  /** Variant — drives outer className suffix (which the §6.4 CSS tints react to) AND default icon. */
  variant?: EmptyStateVariant;
  /** Render in compact mode (inside a card, for filter-empty rendered inside table card). Adds gecko-empty-state-compact. */
  compact?: boolean;
  /** Extra class on the outer wrapper. */
  className?: string;
}

const DEFAULT_ICON: Record<EmptyStateVariant, string> = {
  'empty':         'box',
  'filter-empty':  'search',
  'not-found':     'fileX',
  'error':         'alertCircle',
};

export function EmptyState({
  icon,
  title,
  description,
  primary,
  secondary,
  variant = 'empty',
  compact = false,
  className = '',
}: EmptyStateProps) {
  const glyph = icon ?? DEFAULT_ICON[variant];
  const wrapperClass = [
    'gecko-empty-state',
    `gecko-empty-state-${variant}`,
    compact ? 'gecko-empty-state-compact' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      <div className="gecko-empty-state-icon">
        <Icon name={glyph} size={28} />
      </div>
      <div className="gecko-empty-state-title">{title}</div>
      {description && (
        <div className="gecko-empty-state-description">{description}</div>
      )}
      {(primary || secondary) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {primary && renderCTA(primary, 'gecko-btn gecko-btn-primary')}
          {secondary && renderCTA(secondary, 'gecko-btn gecko-btn-outline')}
        </div>
      )}
    </div>
  );
}

function renderCTA(cta: EmptyStateCTA, classes: string) {
  if (cta.href) {
    return (
      <Link href={cta.href} className={classes} onClick={cta.onClick}>
        {cta.label}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} onClick={cta.onClick}>
      {cta.label}
    </button>
  );
}
