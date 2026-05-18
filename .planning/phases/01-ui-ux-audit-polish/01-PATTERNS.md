# Phase 1: UI/UX Audit & Polish — Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 60 (5 new shared components, 1 new util, 17 new seed files, 1 new copy config, 1 new overlay CSS section, ~35 modified pages, 1 tracker doc)
**Analogs found:** 58 / 60 (2 files — `iso6346/check-digit.ts`, `01-AUDIT.md` — have no in-repo or sibling-repo analog)

> **Headline match:** The TOS sibling repo `web.tos.gecko-api` already
> ships `EmptyState.tsx` and `Skeleton.tsx` as standalone React modules
> wrapping the same `gecko_design_system_components.css` classes that the
> MNR repo also vendors byte-identical. These are the primary analogs
> for the Phase-1 state-component work; copy the TOS shapes and extend
> per UI-SPEC §5–§8.

---

## File Classification

### New shared UI components (5)

| New File | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `src/components/ui/EmptyState.tsx` | shared-component (presentation) | event-driven (click on CTA) | `web.tos.gecko-api/src/components/ui/EmptyState.tsx` | **exact** — sibling-repo verbatim shape; extend with `variant` + `primary`/`secondary` props |
| `src/components/ui/ErrorState.tsx` | shared-component (presentation) | event-driven (retry click + disclosure toggle) | TOS `EmptyState.tsx` (for outer shape) + MNR `Toast.tsx:65-83` (for variant-styling pattern) | role-match — no direct ErrorState analog; compose EmptyState `variant="error"` + `<details>` disclosure |
| `src/components/ui/LoadingState.tsx` | shared-component (presentation) | render-only (CSS shimmer) | `web.tos.gecko-api/src/components/ui/Skeleton.tsx` | **exact** — sibling-repo namespace pattern (`Skeleton.Text`, `Skeleton.TableRow`); add `<TableSkeleton>`, `<KpiTileSkeleton>`, `<DetailSpinner>` |
| `src/components/ui/NotFoundState.tsx` *(may collapse into `EmptyState variant="not-found"`)* | shared-component | render-only + optional Levenshtein lookup | TOS `EmptyState.tsx` | role-match — variant of EmptyState per UI-SPEC §5.3 |
| `src/components/ui/PageActions.tsx` *(optional)* | shared-component (layout helper) | render-only | inline pattern in TOS `billing/invoices/page.tsx:48-73` | partial — extract `gecko-page-actions` row into a tiny wrapper |

### New util (1)

| New File | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `src/lib/iso6346/check-digit.ts` | util (pure function) | transform | MNR `src/lib/utils.ts` (only existing lib file); TOS `src/lib/tariff-types.ts:1-30` for typed-module style | **no analog** — algorithm-new; closest stylistic match for typed pure-function module is `web.tos.gecko-api/src/lib/tariff-types.ts` |

### New seed-data files (17) — `src/data/seed/`

| New File | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `src/data/seed/equipment.ts` | seed-data (typed const array) | static export | `web.tos.gecko-api/src/lib/demo-seed.ts:14-95` (typed-record demo seed); inline arrays in `web.tos.gecko-api/src/app/billing/invoices/page.tsx:8-16` | role-match |
| `src/data/seed/repair.ts` | seed-data | static export | (same) | role-match |
| `src/data/seed/survey.ts` | seed-data | static export | (same) | role-match |
| `src/data/seed/cleaning.ts` | seed-data | static export | (same) | role-match |
| `src/data/seed/storage.ts` | seed-data | static export | (same) | role-match |
| `src/data/seed/parts.ts` | seed-data | static export | (same) | role-match |
| `src/data/seed/billing.ts` | seed-data | static export | `web.tos.gecko-api/src/app/billing/invoices/page.tsx:8-16` (invoice shape with THB amounts) | **exact** for the invoice shape |
| `src/data/seed/tariff/rate-cards.ts` | seed-data | static export | `web.tos.gecko-api/src/lib/tariff-mocks.ts` | role-match |
| `src/data/seed/tariff/contracts.ts` | seed-data | static export | `web.tos.gecko-api/src/lib/tariff-mocks.ts` | role-match |
| `src/data/seed/tariff/customer-rates.ts` | seed-data | static export | `web.tos.gecko-api/src/lib/tariff-mocks.ts` | role-match |
| `src/data/seed/tariff/surcharges.ts` | seed-data | static export | `web.tos.gecko-api/src/lib/tariff-mocks.ts` | role-match |
| `src/data/seed/tariff/history.ts` | seed-data | static export | (same) | role-match |
| `src/data/seed/_shared/customers.ts` | seed-data (cross-cutting) | static export | `web.tos.gecko-api/src/app/billing/invoices/page.tsx:8-16` (real customer names + codes) | **exact** shape |
| `src/data/seed/_shared/lessors.ts` | seed-data | static export | (none — pure list) | role-match |
| `src/data/seed/_shared/depots.ts` | seed-data | static export | `web.tos.gecko-api/src/lib/demo-seed.ts:31-39` (Laem Chabang yard naming) | role-match |
| `src/data/seed/_shared/bic-owner-codes.ts` | seed-data | static export | (none — pure list) | no analog (data-only) |
| `src/data/seed/_shared/iso-6346-size-types.ts` | seed-data | static export | (none — pure list) | no analog (data-only) |

### New config (1)

| New File | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `src/data/copy/empty-states.ts` | config (per-route copy map) | static export | `web.tos.gecko-api/src/lib/order-types-catalog.ts` (typed-record map keyed by enum) ; `web.tos.gecko-api/src/lib/reports-catalog.ts` | role-match |

### New CSS section (1)

| New File / Edit | Role | Data Flow | Closest Analog | Match |
|-----------------|------|-----------|----------------|-------|
| `src/app/gecko_mnr_overlay.css` §6.4 (append) | overlay-css | static | existing §6.1–§6.3 in same file | **exact** — append per UI-SPEC §13 block |

### New tracker doc (1)

| New File | Role | Data Flow | Closest Analog | Match |
|----------|------|-----------|----------------|-------|
| `.planning/phases/01-ui-ux-audit-polish/01-AUDIT.md` | docs (markdown punch-list) | static | (none — first phase tracker) | **no analog** |

### Modified pages (~35)

Every page in `src/app/**/page.tsx` (47 total) is modified in at least
one of three ways:

1. **Remove `<PageHeader>` + remove `<h1>`** (20 files importing it,
   per Grep) — see `src/components/shared/page-header.tsx:43-54`.
2. **Replace local mock array with `import … from '@/data/seed/…'`**
   (~35 files declaring local consts).
3. **Add Empty / Filter-Empty / Loading / Error / Not-Found branches**
   gated by `?empty=1 / ?filter-empty=1 / ?loading=1 / ?error=1` dev
   params (UI-SPEC §5.6).

| Modified File | Role | Data Flow | Closest Analog | Match |
|---------------|------|-----------|----------------|-------|
| `src/app/equipment/page.tsx` | list-page | render + filter | `src/app/equipment/page.tsx` itself (current shape) + UI-SPEC §5.6 wire-up | self |
| `src/app/equipment/[id]/page.tsx` | detail-page | render | (current shape) + new Not-Found branch | self |
| `src/app/repair/page.tsx` | list-page (kanban) | render + filter | (current) | self |
| `src/app/repair/[id]/page.tsx` | detail-page | render | (current) | self |
| `src/app/survey/page.tsx` etc. | list-page | render | (current) | self |
| `src/app/dashboard/page.tsx` | dashboard | render | `web.tos.gecko-api/src/app/dashboard/overview/page.tsx:21-56` (KPICard shape) | **exact for KPI tile** |
| `src/app/billing/page.tsx` | list-page | render | `web.tos.gecko-api/src/app/billing/invoices/page.tsx:40-116` (full invoice list shape) | **exact** |
| `src/app/page.tsx` | public-page | render | (current) + brand string fix | self |
| `src/app/login/page.tsx` | public-page (form) | event-driven | (current) + brand string fix + Loading/Error already present | self |
| `src/app/forgot-password/page.tsx` | public-page (form) | event-driven | (current) + brand string fix | self |
| `src/app/layout.tsx` | layout (metadata) | render | (current) — already says `Gecko M&R` per line 17-19 | self (no change needed for title, but verify) |

---

## Pattern Assignments

### 1. `src/components/ui/EmptyState.tsx` (shared-component, render + click)

**Analog:** `web.tos.gecko-api/src/components/ui/EmptyState.tsx` (whole file, 50 lines).

**Imports pattern** (lines 1-3):

```typescript
"use client";
import React from 'react';
import { Icon } from '@/components/ui/Icon';
```

**Props + JSX core** (lines 5-49 — the entire file):

```tsx
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = 'clipboardList',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`gecko-empty-state ${className}`.trim()}>
      <div className="gecko-empty-state-icon">
        <Icon name={icon} size={28} />
      </div>
      <div className="gecko-empty-state-title">{title}</div>
      {description && (
        <div className="gecko-empty-state-description">{description}</div>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
```

**Phase-1 extensions required** (UI-SPEC §5.1, §5.3):

- Replace `action?: ReactNode` with `primary?: { label, href }` and
  `secondary?: { label, href, onClick? }` so per-route copy in
  `src/data/copy/empty-states.ts` can be a plain serialisable record
  rather than carrying JSX.
- Add `variant?: 'empty' | 'filter-empty' | 'not-found' | 'error'`
  (default `'empty'`); append `gecko-empty-state-{variant}` to the
  wrapper so the new MNR-overlay §6.4 icon-tint rules apply (see UI-SPEC §13).
- Add `gecko-empty-state-compact` modifier when rendered inside a card
  (for filter-empty inside the table card per UI-SPEC §5.4).

**Class shell already exists in MNR** (`src/app/gecko_design_system_components.css:789-822`):

```css
.gecko-empty-state { /* 64px disc, padding var(--gecko-space-16) var(--gecko-space-8) */ }
.gecko-empty-state-icon { width: 64px; height: 64px; border-radius: var(--gecko-radius-xl); ... }
.gecko-empty-state-title { font-size: var(--gecko-text-lg); font-weight: var(--gecko-font-weight-semibold); ... }
.gecko-empty-state-description { font-size: var(--gecko-text-sm); color: var(--gecko-text-secondary); max-width: 360px; }
```

> **No CSS work needed for the base shell** — overlay §6.4 only adds
> the four variant tints + the `-compact` padding override.

**Notes / risks.** TOS uses `action: ReactNode`; MNR needs the split
primary/secondary props so per-route copy can be serialisable for i18n
(D-04). Keep TOS's defaults small (icon default `clipboardList`, size
28). Confirm this is a "use client" boundary because the secondary CTA
takes `onClick` for filter-clearing.

---

### 2. `src/components/ui/ErrorState.tsx` (shared-component, click + disclosure)

**Primary analog:** TOS `EmptyState.tsx` (outer shape).
**Secondary analog:** MNR `src/components/ui/Toast.tsx:35-40` (variant-meta pattern) and `src/components/ui/Toast.tsx:65-83` (icon + body + close-button JSX).

**Variant-meta pattern to copy** (`src/components/ui/Toast.tsx:35-40`):

```typescript
const VARIANT_META: Record<ToastVariant, { className: string; icon: string }> = {
  success: { className: 'gecko-toast-success', icon: 'checkCircle'   },
  warning: { className: 'gecko-toast-warning', icon: 'alertTriangle' },
  danger:  { className: 'gecko-toast-error',   icon: 'trash'         },
  info:    { className: 'gecko-toast-info',    icon: 'info'          },
};
```

> Mirror this for ErrorState's optional sub-variants (e.g. network /
> permission / data-shape) if needed; otherwise ship one default and
> let UI-SPEC §5.5 drive the disclosure.

**Disclosure JSX to ship** (UI-SPEC §5.5 verbatim, 16 lines):

```tsx
<details className="gecko-error-disclosure">
  <summary>Show details</summary>
  <div className="gecko-error-disclosure-body">
    <div>Code <span style={{marginLeft: 16}}>{error?.code ?? '—'}</span></div>
    <div>Correlation <span style={{marginLeft: 16}}>{error?.correlationId ?? '—'}</span></div>
    <div>Message <span style={{marginLeft: 16}}>{error?.message ?? '—'}</span></div>
    <button
      className="gecko-btn gecko-btn-outline gecko-btn-sm"
      onClick={() => navigator.clipboard.writeText(JSON.stringify(error))}
      style={{marginTop: 12}}>
      <Icon name="copy" size={14} /> Copy details
    </button>
  </div>
</details>
```

**Disclosure CSS** ships in overlay §6.4 (UI-SPEC §13 verbatim — already
written, planner just appends).

**Correlation-ID placeholder generator** (UI-SPEC §5.5):

```typescript
function placeholderCorrelationId(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return 'MNR-' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
```

**Notes / risks.** No TOS `ErrorState` exists — this is net-new.
Compose: render `<EmptyState variant="error" icon="alertCircle"
title={…} description={…} primary={{ label: 'Try again', … }} />`
then append the `<details>` block below. Keep the
`onRetry`-vs-`primary.href` choice flexible (retry usually has no href).

---

### 3. `src/components/ui/LoadingState.tsx` (shared-component, render-only)

**Analog:** `web.tos.gecko-api/src/components/ui/Skeleton.tsx` (whole file, 83 lines).

**Namespace export pattern** (lines 31-83):

```tsx
function Text({ lines = 1, size = 'md', className = '' }: TextProps) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`gecko-skeleton gecko-skeleton-text ${TEXT_SIZE_CLASS[size]}`.trim()}
          style={{
            width: lines > 1 && i === lines - 1 ? '70%' : '100%',
            marginTop: i === 0 ? 0 : 6,
          }}
        />
      ))}
    </div>
  );
}

function TableRow({ columns = 4, className = '' }: TableRowProps) {
  return (
    <div className={`gecko-skeleton-table-row ${className}`.trim()}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="gecko-skeleton gecko-skeleton-text" />
      ))}
    </div>
  );
}

export const Skeleton = { Text, Avatar, Card, Block, TableRow };
```

**Phase-1 additions** required by UI-SPEC §8.3:

- `<TableSkeleton columns={N} rows={8}>` — repeats `Skeleton.TableRow`
  rows × 8 inside the table card so the column structure is preserved.
- `<KpiTileSkeleton />` — composes `Skeleton.Text size="sm"` (label)
  + `Skeleton.Block width={32} height={32}` (icon disc) +
  `Skeleton.Block width={80} height={28}` (value) +
  `Skeleton.Block width={96} height={36}` (spark).
- `<DetailSpinner label="Loading repair…" />` — centred `<span
  className="gecko-spinner gecko-spinner-lg"/>` + label, wrapper at
  `min-height: 320px`. Spinner class already exists at
  `src/app/gecko_design_system_components.css:1702-1715`.

**Shimmer CSS already in place** (`src/app/gecko_design_system_components.css:553-568`):

```css
@keyframes gecko-shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position:  1000px 0; }
}
.gecko-skeleton {
  border-radius: var(--gecko-radius-md);
  background: linear-gradient(/* gray-100 → gray-200 → gray-100 */);
  background-size: 2000px 100%;
  animation: gecko-shimmer 1.8s infinite linear;
}
```

> **D-05 override.** Discussion-phase D-05 said "1.5s ease-in-out".
> UI-SPEC §8.2 corrects this to "1.8s linear" because the shared bundle
> already ships that, and TOS depends on it. Phase 1 honours UI-SPEC.

**Notes / risks.** The TOS file is "use client" — match that for MNR.
The `gecko-skeleton-*` extended classes (`-text`, `-avatar`, `-card`,
`-table-row`) are already vendored at
`src/app/gecko_design_system_components.css:2799-2848`, so no CSS work
is needed for skeleton primitives.

---

### 4. `src/components/ui/NotFoundState.tsx` (variant of EmptyState — may not need its own file)

**Recommendation.** Don't ship a separate file. Render in the page
itself:

```tsx
const config = COPY.notFound[routeKey];
return (
  <EmptyState
    variant="not-found"
    icon="fileX"
    title={config.title}
    description={
      <>
        {config.description.replace('{ID}', params.id)}
        {suggestion && <><br/><br/>Did you mean <Link href={suggestion.href}>{suggestion.id}</Link>?</>}
      </>
    }
    primary={config.primary}
    secondary={config.secondary}
  />
);
```

**Levenshtein helper.** Inline tiny implementation in
`src/lib/levenshtein.ts` (no separate plan needed — pure utility
≤ 25 lines).

**Analog for the "Did you mean …" pattern:** none in repo. UI-SPEC §10.1
locks the copy.

---

### 5. `src/lib/iso6346/check-digit.ts` (util, pure function)

**No existing analog.** Closest stylistic match for typed pure-function
module: `web.tos.gecko-api/src/lib/tariff-types.ts` (typed-types-only
module, ESM `export type` + `export const`).

**Module shape to ship** (per UI-SPEC §13 / D-10):

```typescript
/**
 * BIC ISO 6346 container check-digit algorithm.
 * Reference: BIC published specification.
 *
 * Letters map to values per the BIC table (skipping multiples of 11):
 *   A=10 B=12 C=13 D=14 E=15 F=16 G=17 H=18 I=19 J=20 K=21 L=23
 *   M=24 N=25 O=26 P=27 Q=28 R=29 S=30 T=31 U=32 V=34 W=35 X=36 Y=37 Z=38
 * Positional weights: 2^0, 2^1, … 2^9.
 * Sum × weights, mod 11, mod 10 → check digit.
 */
const LETTER_VALUES: Record<string, number> = {
  A: 10, B: 12, C: 13, D: 14, E: 15, F: 16, G: 17, H: 18, I: 19, J: 20,
  K: 21, L: 23, M: 24, N: 25, O: 26, P: 27, Q: 28, R: 29, S: 30, T: 31,
  U: 32, V: 34, W: 35, X: 36, Y: 37, Z: 38,
};

/** Returns the 0–9 check digit for a 10-char BIC code (4 letters + 6 digits). */
export function computeCheckDigit(ownerCodeAndSerial: string): number {
  const s = ownerCodeAndSerial.toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{4}[0-9]{6}$/.test(s)) {
    throw new Error(`Invalid BIC code shape: ${ownerCodeAndSerial}`);
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const ch = s[i];
    const v = i < 4 ? LETTER_VALUES[ch] : Number(ch);
    sum += v * (1 << i); // 2^i
  }
  return (sum % 11) % 10;
}

/** Returns true if the 11-char container number's check digit is correct. */
export function isValidContainerNumber(containerNumber: string): boolean {
  const s = containerNumber.toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z]{4}[0-9]{7}$/.test(s)) return false;
  return computeCheckDigit(s.slice(0, 10)) === Number(s[10]);
}
```

**Unit-test file** at `src/lib/iso6346/check-digit.test.ts` — uses the
D-11 anchors as known-good fixtures (MSKU 234567 5, CMAU 412935 0, ONEU
786543 2, TCNU 845321 8, BEAU 267194 6, MNBU 459832 1, MWCU 678403 7).
The seed-file generation script (or one-time computation) calls
`computeCheckDigit('XXXX######')` to fill the eleven "verify check
digit" slots in UI-SPEC §9.1.

**Notes / risks.** Algorithm well-known; no library dep needed. Phase
3's EQUIP-04 inherits this util — that requirement is the load-bearing
downstream consumer. CI test guard called out in D-10.

---

### 6. `src/data/seed/equipment.ts` (seed-data, static export)

**Analog:** `web.tos.gecko-api/src/lib/demo-seed.ts:14-95`.

**Typed-record + typed export pattern** (lines 14-30, then 36-95):

```typescript
interface YardBlock {
  id: string; code: string;
  type: 'IMPORT' | 'EXPORT' | 'EMPTY' | 'REEFER' | 'DAMAGE' | 'HAZ' | 'OOG' | 'TRANSHIPMENT';
  bays: number; rows: number; tiers: number;
  // …
}

const DEMO_YARD: YardTemplate = {
  version: 1,
  yardId: 'lcb-icd-yard-a',
  name: 'Laem Chabang ICD — Yard A',
  // …
  blocks: [
    { id: 'b-imp-1', code: 'IMP-A1', type: 'IMPORT', /* … */ reservedParty: 'MAERSK', isoAccepted: ['20GP', '40GP', '40HC'], reeferPlugCount: 0 },
    // …
  ],
};
```

**Phase-1 equipment shape** (UI-SPEC §9.1 dictates the columns):

```typescript
export interface EquipmentRecord {
  id: string;                  // e.g. 'MSKU2345675' (BIC-valid)
  ownerCode: string;           // 'MSKU'
  serial: string;              // '234567'
  checkDigit: number;          // 5 (computed)
  ownerName: string;           // 'Maersk Line'
  isoSizeType: string;         // '22G1'
  category: 'DRY' | 'TANK' | 'REEFER';
  tareKg: number;              // 2370
  maxGrossKg: number;          // 30480
  cubeM3: number;              // 33.2
  depot: string;               // 'Laem Chabang Port'
  status: 'available' | 'in_service' | 'repair' | 'cleaning' | 'storage';
  lastSurvey: string;          // ISO date or display string
  // type-specific (tank | reefer):
  pressureBar?: number;
  shellMaterial?: string;
  refrigerant?: 'R-134a' | 'R-513A';
  setpointMinC?: number;
  setpointMaxC?: number;
}

export const equipment: EquipmentRecord[] = [
  { id: 'MSKU2345675', ownerCode: 'MSKU', serial: '234567', checkDigit: 5, ownerName: 'Maersk Line', isoSizeType: '22G1', category: 'DRY', tareKg: 2370, maxGrossKg: 30480, cubeM3: 33.2, depot: 'Laem Chabang Port', status: 'available', lastSurvey: '2026-04-10' },
  // … 17 more per UI-SPEC §9.1
];
```

**Notes / risks.** Current page-local mock in
`src/app/equipment/page.tsx:31-40` uses unrealistic shapes
(`number: "MSKU2234567"` with a malformed 11-char concatenation;
`owner: "CMA CGM"` paired with `MSKU` is wrong — MSKU = Maersk). The
new seed FIXES these. Pages then `import { equipment } from
'@/data/seed/equipment'` and drop their local array. The current
`Equipment` interface in `src/app/equipment/page.tsx:20-29` is a
useful starting point for the typed record but must be migrated to the
seed file (single source of truth).

---

### 7. `src/data/seed/billing.ts` (seed-data, invoice shape)

**Analog:** `web.tos.gecko-api/src/app/billing/invoices/page.tsx:8-16`.

**Verbatim shape to copy** (lines 8-16, 9 records):

```typescript
const INVOICES = [
  { id: 'INV-26-009412', date: 'Apr 24, 2026', dueDate: 'May 24, 2026',
    customer: 'C-00142', custName: 'Thai Union Group PCL',
    amount: '฿12,450.00', vat: '฿871.50', total: '฿13,321.50', status: 'Draft' },
  { id: 'INV-26-009411', /* … */ status: 'Final' },
  { id: 'INV-26-009408', /* … */ status: 'Final' },
  { id: 'INV-26-009395', /* … */ status: 'Overdue' },
  // …
];
```

**Status-badge inline pattern** (TOS lines 32-38) is also the analog for
MNR's status rendering (THB currency, real Thai customer names).

**MNR adaptations.** Replace TOS customers (Thai Union, PTT, Siam
Cement) with shipping-line customers per UI-SPEC §9.3 (Maersk Line,
CMA CGM (Thailand) Co., Ltd., MSC, ONE, Hapag-Lloyd, Evergreen, COSCO,
Yang Ming, HMM, ZIM). Keep the `฿` currency prefix and the same status
vocabulary.

**Notes / risks.** TOS uses string-formatted amounts (`'฿12,450.00'`)
— for Phase 1 that's fine; Phase 2's repository pattern will move to
numeric amounts + currency tag.

---

### 8. `src/data/seed/_shared/depots.ts` & `customers.ts` (cross-cutting)

**Analog for depot naming:** `web.tos.gecko-api/src/lib/demo-seed.ts:39`
(`name: 'Laem Chabang ICD — Yard A'`).

**Shape** (per UI-SPEC §9.2):

```typescript
export type CountryCode = 'TH' | 'MY' | 'SG';
export interface Depot { code: string; name: string; country: CountryCode; }

export const depots: Depot[] = [
  { code: 'LCB', name: 'Laem Chabang Port',     country: 'TH' },
  { code: 'LKR', name: 'Lat Krabang ICD',       country: 'TH' },
  { code: 'PKL', name: 'Port Klang Northport',  country: 'MY' },
  { code: 'PKW', name: 'Port Klang Westport',   country: 'MY' },
  { code: 'PGU', name: 'Pasir Gudang',          country: 'MY' },
  { code: 'JUR', name: 'Jurong Port',           country: 'SG' },
  { code: 'PPP', name: 'PSA Pasir Panjang',     country: 'SG' },
];
```

**Customer shape** parallels TOS invoices customer fields:

```typescript
export interface Customer { code: string; name: string; tier?: 'platinum' | 'gold' | 'silver' | 'bronze' | 'standard'; }

export const customers: Customer[] = [
  { code: 'C-MSKU', name: 'Maersk Line',                            tier: 'platinum' },
  { code: 'C-CMAU', name: 'CMA CGM (Thailand) Co., Ltd.',           tier: 'platinum' },
  { code: 'C-MSCU', name: 'MSC Mediterranean Shipping',             tier: 'gold' },
  { code: 'C-ONEU', name: 'Ocean Network Express (ONE)',            tier: 'gold' },
  // … per UI-SPEC §9.3
];
```

---

### 9. `src/data/copy/empty-states.ts` (config, per-route copy map)

**Analog:** `web.tos.gecko-api/src/lib/order-types-catalog.ts` /
`reports-catalog.ts` (typed-record map keyed by string id).

**Shape** (per UI-SPEC §10.1 — the worked-example table is the source-of-truth):

```typescript
import type { ReactNode } from 'react';

export type StateVariant = 'empty' | 'filter-empty' | 'not-found' | 'error';

export interface CopyConfig {
  icon: string;
  title: string;
  description: string;   // {ID} placeholder substituted at render for not-found
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

export type RouteCopyMap = Partial<Record<StateVariant, CopyConfig>>;

export const emptyStateCopy: Record<string, RouteCopyMap> = {
  '/equipment': {
    empty: {
      icon: 'box',
      title: 'No containers in the master register yet',
      description: 'Register your first container or import a fleet list to start tracking ISO 6346 equipment across your depots.',
      primary: { label: 'Register container', href: '/equipment/new' },
      secondary: { label: 'Import fleet', href: '/equipment/import' },
    },
    'filter-empty': {
      icon: 'search',
      title: 'No reefer containers match this filter',
      description: 'Clear the filter to see all equipment, or register your first reefer.',
      primary: { label: 'Clear filter', href: '/equipment' },
      secondary: { label: 'Register reefer', href: '/equipment/new?type=REEFER' },
    },
  },
  '/repair': { /* … */ },
  // 47 routes per UI-SPEC §10.1 + §12
};
```

**Loading-label map** (UI-SPEC §10.2) and **error-copy map**
(UI-SPEC §10.3) can co-exist in the same file as `loadingLabels` and
`errorCopy` exports, keyed by the same route paths.

---

### 10. `src/app/gecko_mnr_overlay.css` §6.4 (append-only edit)

**Analog:** §6.1–§6.3 already in the same file (tier badges, severity
pill, equipment chart palette).

**Block to append:** UI-SPEC §13 (full ~50-line block) — verbatim. NO
existing section is modified. Planner copies it byte-for-byte.

**Verification:** After append, the four selectors
`.gecko-empty-state-{empty|filter-empty|not-found|error}` must light
up the icon disc per UI-SPEC §5.3 colour table.

---

### 11. Modified page pattern (applies to every list page)

**Reference page (current MNR shape):** `src/app/equipment/page.tsx`.

**Imports to add** (top of file):

```tsx
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/LoadingState';
import { equipment as seedEquipment } from '@/data/seed/equipment';
import { emptyStateCopy } from '@/data/copy/empty-states';
```

**Imports to remove:**

```tsx
import { PageHeader, /* … */ } from "@/components/shared";   // remove PageHeader
// Remove local `const mockEquipment = [...]` (current lines 31-40).
```

**Branch pattern to insert** (UI-SPEC §5.6, verbatim):

```tsx
const sp = useSearchParams();
const forceLoading = sp.get('loading') === '1';
const forceError   = sp.get('error') === '1';
const forceEmpty   = sp.get('empty') === '1';
const forceFilterEmpty = sp.get('filter-empty') === '1';

const hasActiveFilters = typeFilter !== 'all' || !!searchQuery;
const copy = emptyStateCopy['/equipment'];

if (forceLoading) {
  return <AppShell><TableSkeleton columns={6} rows={8} /></AppShell>;
}
if (forceError) {
  return (
    <AppShell>
      <ErrorState
        title="We couldn't load the equipment register"
        description="Something interrupted the request. Try again, or contact support if it keeps failing."
        onRetry={() => location.reload()}
      />
    </AppShell>
  );
}
if (forceEmpty || filteredEquipment.length === 0) {
  const variant = (forceFilterEmpty || hasActiveFilters) ? 'filter-empty' : 'empty';
  return <AppShell><EmptyState variant={variant} {...copy[variant]!} /></AppShell>;
}
```

**`<PageHeader>` removal** (current `src/app/equipment/page.tsx:91-97`):

```tsx
// REMOVE THIS BLOCK ENTIRELY:
<PageHeader
  title="Equipment Registry"
  description="Manage all equipment in the depot"
  breadcrumbs={[ { label: "Dashboard", href: "/" }, { label: "Equipment" } ]}
  actions={<Button asChild><Link href="/equipment/new">…</Link></Button>}
/>
```

The breadcrumb + 15px page title now come from the AppShell header
(see `src/components/layout/app-shell.tsx:333-349`). Actions move to a
new `<div className="mnr-page-actions">` row immediately above the
content surface, per UI-SPEC §7.2:

```tsx
<div className="mnr-page-actions">
  {/* filter chips, sort, etc., on the left */}
  <div className="mnr-page-actions-spacer" />
  <Link href="/equipment/new" className="gecko-btn gecko-btn-primary gecko-btn-sm">
    <Icon name="plus" size={14} /> Register container
  </Link>
</div>
```

**Notes / risks.**

- All 20 `PageHeader` import sites (per Grep) get this removal. The
  shared component `src/components/shared/page-header.tsx` stays on
  disk for reference but is no longer imported.
- The current `src/app/equipment/page.tsx:43-54` renders an `<h1>`
  inside `PageHeader`; that `<h1>` violates UI-SPEC §1 / §7 and goes
  away with the PageHeader removal — UI-SPEC corrective rule satisfied.
- Local mock arrays get replaced with seed imports (`const
  filteredEquipment = seedEquipment.filter(…)`). This is the swap-in
  for D-09 and the `Customer A / MSKU2234567`-style data is replaced
  with the BIC-valid records from §6.

---

### 12. Modified detail page pattern (applies to every `[id]/page.tsx`)

**Reference page:** `src/app/repair/[id]/page.tsx`.

**Branch pattern to insert** (UI-SPEC §5.6):

```tsx
const params = useParams();
const sp = useSearchParams();
const forceLoading = sp.get('loading') === '1';
const forceError   = sp.get('error') === '1';

const job = seedRepair.find(r => r.reference === params.id);

if (forceLoading) {
  return <AppShell><DetailSpinner label="Loading repair job…" /></AppShell>;
}
if (forceError) {
  return <AppShell><ErrorState title="We couldn't load this repair job" onRetry={() => location.reload()} /></AppShell>;
}
if (!job) {
  const suggestion = nearestReference(String(params.id), seedRepair.map(r => r.reference));
  return (
    <AppShell>
      <EmptyState
        variant="not-found"
        icon="fileX"
        title="This repair job doesn't exist"
        description={
          <>
            The reference {String(params.id)} wasn't found in the repair register. It may have been archived.
            {suggestion && <><br/><br/>Did you mean <Link href={`/repair/${suggestion}`}>{suggestion}</Link>?</>}
          </>
        }
        primary={{ label: '← Back to Repair Register', href: '/repair' }}
        secondary={{ label: 'Search by reference', href: `/repair?q=${encodeURIComponent(String(params.id))}` }}
      />
    </AppShell>
  );
}
```

**Notes / risks.** `nearestReference` is the Levenshtein helper from
§4. Detail pages also remove the `<PageHeader>` block (their current
lines 53-72 in `equipment/[id]/page.tsx`).

---

### 13. Modified public pages (`/`, `/login`, `/forgot-password`)

**Reference files:** `src/app/page.tsx`, `src/app/login/page.tsx`,
`src/app/forgot-password/page.tsx` (all three contain `logicon` per
Grep on 4 files).

**Brand-string replacement sites** (string-literal edits — per D-16):

| File | Line(s) | Current | Replacement |
|------|---------|---------|-------------|
| `src/app/page.tsx` | 119 | `logicon-mnr` (hero nav) | `Gecko M&R` |
| `src/app/page.tsx` | 574 | `logicon-mnr` (footer brand) | `Gecko M&R` |
| `src/app/page.tsx` | 641 | `&copy; 2024 logicon-mnr` (footer copyright) | `© 2026 Gecko M&R` |
| `src/app/login/page.tsx` | 73 | `logicon-mnr` (left-panel hero) | `Gecko M&R` |
| `src/app/forgot-password/page.tsx` | (similar) | `logicon-mnr` | `Gecko M&R` |
| `src/app/settings/integrations/page.tsx` | (line per Grep) | `logicon` URL/strings | `gecko` |

**Landing-page testimonial replacement** (UI-SPEC §10.4, pick one and
freeze):

```tsx
// Stable single quote for Phase 1:
"Gecko gave our depot crew the standards alignment we'd been chasing on
spreadsheets for years." — Tan Wei Ming, Yard Operations Manager,
PSA-affiliated ICD, Singapore
```

**Login page Loading + Error** are ALREADY in the current code
(`src/app/login/page.tsx:30-31, 36-52`) — `isLoading`, `error` state +
`setTimeout(1500)` simulated call. Phase 1 just verifies they render
gecko-styled inline (`gecko-alert gecko-alert-error` per UI-SPEC §7.4)
rather than the current Tailwind / lucide chrome.

**Notes / risks.** `src/app/layout.tsx:17` already says `Gecko M&R` —
no metadata edit needed there. Phase 1 ships the public-page brand
fix; settings/integrations URLs may be domain-related (verify before
replacing).

---

### 14. `01-AUDIT.md` tracker

**No code analog.** Project artifact. Shape locked by UI-SPEC §12 +
CONTEXT.md §D-12.

**Recommended layout** (per UI-SPEC §12 + audit cell vocabulary §12.5):

```markdown
# Phase 1 — UI/UX Audit Tracker

## List routes (28)

| # | Route | Empty | Filter-Empty | Loading | Error | Verified by |
|---|-------|-------|--------------|---------|-------|-------------|
| 1 | `/dashboard`     | ☐ Pending | n/a       | ☐ Pending | ☐ Pending |  |
| 2 | `/equipment`     | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending |  |
| 3 | `/repair`        | ☐ Pending | ☐ Pending | ☐ Pending | ☐ Pending |  |
| … | … | … | … | … | … | … |

## Detail routes (10)

| # | Route | Loading | Not-Found | Verified by |
|---|-------|---------|-----------|-------------|
| 27 | `/equipment/[id]` | ☐ Pending | ☐ Pending |  |
| 28 | `/repair/[id]`    | ☐ Pending | ☐ Pending |  |
| … | … | … | … | … |

## Form / create routes (11)

| # | Route | Loading-on-submit | Error-on-submit | Verified by |
|---|-------|-------------------|-----------------|-------------|
| 37 | `/repair/new` | ☐ Pending | ☐ Pending |  |
| … | … | … | … | … |

## Public / chromeless (3)

| # | Route | Brand string | Loading | Error | Testimonial | Verified by |
|---|-------|--------------|---------|-------|-------------|-------------|
| 45 | `/`               | ☐ Pending | n/a       | n/a       | ☐ Pending |  |
| 46 | `/login`          | ☐ Pending | ☐ Pending | ☐ Pending | n/a       |  |
| 47 | `/forgot-password`| ☐ Pending | ☐ Pending | ☐ Pending | n/a       |  |

## Spot-screenshots (CONTEXT.md §D-13)

- [ ] `/dashboard` — KPI tile density
- [ ] `/equipment` — list table density
- [ ] `/equipment?type=REEFER&empty=1` — filter-empty render
- [ ] `/repair/REP-DOES-NOT-EXIST` — not-found render
- [ ] `/survey/[id]?loading=1` — detail spinner
- [ ] `/cleaning?error=1` — error state with disclosure
- [ ] `/billing` — table card density
- [ ] `/tariff/contracts/[id]` — detail page header
```

---

## Shared Patterns

### Authentication
Not applicable to Phase 1 — no auth changes. Login/forgot-password
already in place.

### Error Handling

**Source:** `src/components/ui/ErrorState.tsx` (new, this phase).
**Apply to:** All list + detail pages (every page with a `?error=1`
branch). All 35 modified pages.

```tsx
if (forceError) {
  return (
    <AppShell>
      <ErrorState
        title={errorCopy[routeKey]?.title ?? 'Something went wrong'}
        description={errorCopy[routeKey]?.description}
        onRetry={() => location.reload()}
      />
    </AppShell>
  );
}
```

### Loading

**Source:** `src/components/ui/LoadingState.tsx` (new).
**Apply to:** All list pages (`TableSkeleton`); dashboard
(`KpiTileSkeleton`); all detail pages (`DetailSpinner`).

```tsx
if (forceLoading) return <AppShell><TableSkeleton columns={N} rows={8} /></AppShell>;
// or:
if (forceLoading) return <AppShell><DetailSpinner label="Loading repair job…" /></AppShell>;
```

### Empty / Filter-Empty / Not-Found

**Source:** `src/components/ui/EmptyState.tsx` (new) +
`src/data/copy/empty-states.ts` (new).
**Apply to:** All list pages (empty + filter-empty); all detail pages
(not-found).

```tsx
const copy = emptyStateCopy[routeKey];
return <EmptyState variant={variant} {...copy[variant]!} />;
```

### Brand-string lockdown

**Source:** Sed-replace `logicon-mnr` → `Gecko M&R` and `logicon` →
`Gecko` across 4 files (per Grep): `src/app/page.tsx`,
`src/app/login/page.tsx`, `src/app/forgot-password/page.tsx`,
`src/app/settings/integrations/page.tsx`. Verify with the §14
brand-string quality gate (`grep -ri 'logicon' src/` returns zero
outside `.gitignore`).

### Seed-data import swap

**Source:** All 17 new seed files in `src/data/seed/`.
**Apply to:** Every page currently declaring a local mock array (~35
pages per the early Grep estimate). Replace
`const mockEquipment = [...]` → `import { equipment as seedEquipment }
from '@/data/seed/equipment'` (or per-entity equivalent).

### `<PageHeader>` removal

**Source:** Remove the import from
`@/components/shared/page-header.tsx` in all 20 files (per Grep on
`from "@/components/shared/page-header"`-pattern via the `PageHeader`
identifier import). Replace with the §11 `<div
className="mnr-page-actions">` inline-actions row.

### Realistic-data anchors

**Source:** UI-SPEC §9 + REQUIREMENTS.md cross-cutting acceptance bar.
**Apply to:** Every seed file. BIC owner codes (MSKU, CMAU, etc.) with
computed check digits via `src/lib/iso6346/check-digit.ts`; ISO 6346
size/type codes (22G1, 42G1, 22T1, 42R1, …); THB-anchored costs;
TH/MY/SG depots; real shipping-line and lessor names; SE-Asian
surveyor names.

---

## No Analog Found

| File | Role | Reason |
|------|------|--------|
| `src/lib/iso6346/check-digit.ts` | util (pure function) | Neither MNR nor TOS ships a BIC algorithm util. UI-SPEC §13 / D-10 supplies the algorithm; module-style analog is `web.tos.gecko-api/src/lib/tariff-types.ts` (typed pure ESM module). |
| `.planning/phases/01-ui-ux-audit-polish/01-AUDIT.md` | docs (tracker) | First phase using the GSD audit pattern — no prior tracker exists. UI-SPEC §12 defines the matrix. |
| `src/data/seed/_shared/bic-owner-codes.ts` | seed-data (pure list) | Pure registry list; no analog. UI-SPEC §9.1 + REQUIREMENTS.md cross-cutting bar list the codes. |
| `src/data/seed/_shared/iso-6346-size-types.ts` | seed-data (pure list) | Same — pure registry list. REQUIREMENTS.md lists the codes. |

---

## Metadata

**Analog search scope:**

- `d:\SHARMA\PROJECT\gecko\web.mnr.gecko-api\src\**`
- `d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\components\ui\**`
- `d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\lib\**`
- `d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\billing\invoices\page.tsx`
- `d:\SHARMA\PROJECT\gecko\web.tos.gecko-api\src\app\dashboard\overview\page.tsx`

**Files scanned:** ~ 100 (28 MNR pages + 5 TOS UI components + 7 TOS
lib files + 2 TOS reference pages + 5 MNR shared components + 4 MNR
CSS sections + 1 MNR app-shell + ~ 50 Grep hits across MNR).

**Key codebase facts captured:**

- TOS `EmptyState` and `Skeleton` exist and mirror MNR's design-system
  CSS classes — primary analogs.
- MNR's `gecko_design_system_components.css` already ships
  `.gecko-empty-state`, `.gecko-skeleton`, `.gecko-spinner`, and the
  `@keyframes gecko-shimmer` (1.8s linear) — no CSS shell work needed
  for state components; only the §6.4 overlay block (UI-SPEC §13).
- 20 pages import `PageHeader`; 35 pages declare local mock arrays;
  4 files contain `logicon` strings.
- 47 routes total (28 list + 10 detail + 11 form + 3 public), matching
  UI-SPEC §12 inventory.
- `src/app/layout.tsx` already ships the correct `Gecko M&R` title
  template (line 17-19) — no metadata edit needed.

**Pattern extraction date:** 2026-05-18.

---

## PATTERN MAPPING COMPLETE

**Phase:** 01 — UI/UX Audit & Polish
**Files classified:** 60 (5 new shared UI, 1 new util, 17 new seed, 1 new copy config, 1 CSS append, ~35 modified pages, 1 tracker doc)
**Analogs found:** 58 / 60

### Coverage
- Files with exact analog: 5 (`EmptyState`, `Skeleton`/`LoadingState`, `billing.ts`, dashboard KPI tile, overlay CSS append site)
- Files with role-match analog: 53 (all other seed files, copy config, modified pages, ErrorState)
- Files with no analog: 2 (`iso6346/check-digit.ts`, `01-AUDIT.md`) — both have algorithmic or doc-template guidance from UI-SPEC

### Key Patterns Identified
- TOS sibling repo's `EmptyState.tsx` + `Skeleton.tsx` are the verbatim shape; MNR extends with `variant` + `primary`/`secondary` props per UI-SPEC §5.
- Shared `gecko_design_system_components.css` already ships `.gecko-empty-state`, `.gecko-skeleton`, `.gecko-spinner`, and `@keyframes gecko-shimmer` at 1.8s linear — Phase 1 only appends overlay §6.4 (variant tints + compact paddings + page-actions row + error-disclosure styling).
- All 20 `<PageHeader>` sites are deleted (UI-SPEC §1, §7); the 15px page title comes from `AppShell`'s `gecko-header` (`src/components/layout/app-shell.tsx:333-349`).
- All ~35 local mock arrays are replaced with `import … from '@/data/seed/…'` (D-09); seed records use BIC-valid container numbers computed via the new `src/lib/iso6346/check-digit.ts` (D-10), real shipping-line and lessor names, real TH/MY/SG depots, and THB-anchored costs (UI-SPEC §9 + REQUIREMENTS.md cross-cutting bar).
- `?loading=1 / ?error=1 / ?empty=1 / ?filter-empty=1` dev query params (UI-SPEC §5.6) are the row-by-row verification hook for the `01-AUDIT.md` tracker — no real fetches mocked in Phase 1.
- Brand-string lockdown: 4 files contain `logicon` strings (per Grep); all become `Gecko M&R` / `Gecko` per D-16.

### File Created
`d:\SHARMA\PROJECT\gecko\web.mnr.gecko-api\.planning\phases\01-ui-ux-audit-polish\01-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference TOS sibling
analogs (`EmptyState.tsx`, `Skeleton.tsx`, `billing/invoices/page.tsx`,
`dashboard/overview/page.tsx`), MNR-side reusable assets
(`gecko-empty-state` class shell, `gecko-skeleton`, `gecko-spinner`,
`@keyframes gecko-shimmer`, `Toast.tsx` variant-meta pattern), and the
locked UI-SPEC §13 overlay block when authoring plans.
