/**
 * Per-route Phase 1 copy registry.
 *
 * Single source of truth for:
 *   - emptyStateCopy: per-route empty / filter-empty / not-found configs
 *   - loadingLabels:  per-route-family DetailSpinner labels
 *   - errorCopy:      per-route error title + description
 *
 * Why centralised (D-04):
 *   - i18n-ready: Phase D's i18n pass swaps the literal strings to t(key) calls
 *     in this one file only — no 47-route sweep needed.
 *   - Auditor (plan 10) spot-checks against UI-SPEC §10.1 verbatim table.
 *   - Plans 08 (list wiring) and 09 (detail wiring) consume by route-path key.
 *
 * Voice rules (D-01, D-02):
 *   - Domain-aware actionable: name the noun + offer a next action.
 *   - Generic "No data" / "Nothing to show" is REJECTED.
 *   - Distinguish empty (zero records ever) vs filter-empty (records exist but filter shows none).
 *
 * Placeholder convention:
 *   - `{ID}` in not-found descriptions is substituted by the caller at render time
 *     via `.replace('{ID}', params.id)`. The string lives in config — substitution is
 *     the caller's job (keeps config pure-data per D-04).
 */

export type StateVariant = 'empty' | 'filter-empty' | 'not-found' | 'error';

export interface CopyConfig {
  icon: string;
  title: string;
  description: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

export type RouteCopyMap = Partial<Record<StateVariant, CopyConfig>>;

/**
 * Per-route copy. Keyed by route path (Next.js convention — `/equipment`, `/equipment/[id]`).
 * Plans 08 + 09 read: `const copy = emptyStateCopy['/equipment']?.['empty']`.
 */
export const emptyStateCopy: Record<string, RouteCopyMap> = {
  // ============ LIST ROUTES (UI-SPEC §12.1) ============

  '/dashboard': {
    empty: {
      icon: 'inbox',
      title: 'No operational data yet',
      description: 'Seed data loaded? Try refreshing. The dashboard will populate once equipment, repair, and survey records are present.',
      primary: { label: 'Reload', href: '/dashboard' },
    },
  },

  '/equipment': {
    empty: {
      icon: 'box',
      title: 'No containers in the master register yet',
      description: 'Register your first container or import a fleet list to start tracking ISO 6346 equipment across your depots.',
      primary:   { label: 'Register container', href: '/equipment/new' },
      secondary: { label: 'Import fleet',       href: '/equipment/import' },
    },
    'filter-empty': {
      icon: 'search',
      title: 'No reefer containers match this filter',
      description: 'Clear the filter to see all equipment, or register your first reefer container.',
      primary:   { label: 'Clear filter',    href: '/equipment' },
      secondary: { label: 'Register reefer', href: '/equipment/new?type=REEFER' },
    },
  },

  '/repair': {
    empty: {
      icon: 'clipboardList',
      title: 'No repair jobs yet',
      description: 'Open a repair job to start CEDEX-coded estimation for an in-yard container.',
      primary: { label: 'Open repair job', href: '/repair/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No critical repairs right now',
      description: "Nothing in the critical bucket — that's a good sign. Clear the filter to see all jobs.",
      primary: { label: 'Clear filter', href: '/repair' },
    },
  },

  '/survey': {
    empty: {
      icon: 'clipboardList',
      title: 'No surveys recorded yet',
      description: "Start a DRY, TANK, or REEFER survey to log a container's condition and trigger any IICL-6 repair flags.",
      primary:   { label: 'New survey',           href: '/survey/new' },
      secondary: { label: 'Browse seed examples', href: '/survey?demo=1' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No TANK surveys match this filter',
      description: 'Clear the filter to see all surveys, or start a new TANK survey.',
      primary: { label: 'Clear filter', href: '/survey' },
    },
  },

  '/cleaning': {
    empty: {
      icon: 'box',
      title: 'No cleaning jobs in the queue',
      description: 'Open a cleaning job for a tank or dry-box that arrived dirty — washouts, vacuum cleans, and reefer wipes all land here.',
      primary: { label: 'New cleaning job', href: '/cleaning/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No cleaning jobs match this filter',
      description: 'Clear the filter to see all jobs in the queue.',
      primary: { label: 'Clear filter', href: '/cleaning' },
    },
  },

  '/storage': {
    empty: {
      icon: 'box',
      title: 'No containers in storage',
      description: 'Containers placed on storage hold appear here with their per-diem accrual. Use Equipment to put one on hold.',
      primary: { label: 'View equipment', href: '/equipment' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No storage rows match this filter',
      description: 'Clear the filter to see every container on storage hold.',
      primary: { label: 'Clear filter', href: '/storage' },
    },
  },

  '/parts': {
    empty: {
      icon: 'inbox',
      title: 'Parts catalogue is empty',
      description: 'Add a part to start tracking inventory and pairing parts with CEDEX repair lines.',
      primary: { label: 'Add part', href: '/parts/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No parts match this filter',
      description: 'Clear the filter to see the full catalogue.',
      primary: { label: 'Clear filter', href: '/parts' },
    },
  },

  '/billing': {
    empty: {
      icon: 'inbox',
      title: 'No invoices generated yet',
      description: 'Once repair, survey, or storage jobs complete, billable lines surface here for invoicing.',
      primary: { label: 'View unbilled services', href: '/billing/unbilled' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No overdue invoices',
      description: "Nothing overdue — that's a good sign. Clear the filter to see all invoices.",
      primary: { label: 'Clear filter', href: '/billing' },
    },
  },

  '/modification': {
    empty: {
      icon: 'clipboardList',
      title: 'No modification jobs yet',
      description: 'Open a modification job for a class-society-approved structural change (e.g. tank coating upgrade, reefer plug retrofit).',
      primary: { label: 'New modification', href: '/modification/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No modification jobs match this filter',
      description: 'Clear the filter to see all modifications.',
      primary: { label: 'Clear filter', href: '/modification' },
    },
  },

  '/emergency': {
    empty: {
      icon: 'inbox',
      title: 'No emergency jobs open',
      description: 'Spill response, hazmat incidents, and rapid-repair-on-deck jobs land here when they happen — none active right now.',
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No emergency jobs match this filter',
      description: 'Clear the filter to see all emergency jobs.',
      primary: { label: 'Clear filter', href: '/emergency' },
    },
  },

  '/tariff': {
    empty: {
      icon: 'inbox',
      title: 'No tariff data configured',
      description: 'Start with a rate card to lock standard pricing per service, then layer contracts and customer-specific overrides on top.',
      primary: { label: 'New rate card', href: '/tariff/rate-cards/new' },
    },
  },

  '/tariff/rate-cards': {
    empty: {
      icon: 'clipboardList',
      title: 'No rate cards configured',
      description: 'Rate cards define standard depot pricing per service. Add one to start quoting.',
      primary: { label: 'New rate card', href: '/tariff/rate-cards/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No rate cards match this filter',
      description: 'Clear the filter to see all rate cards.',
      primary: { label: 'Clear filter', href: '/tariff/rate-cards' },
    },
  },

  '/tariff/customer-rates': {
    empty: {
      icon: 'clipboardList',
      title: 'No customer rate overrides',
      description: 'Customers without overrides bill at standard rate-card pricing. Add an override to deviate.',
      primary: { label: 'New customer rate', href: '/tariff/customer-rates/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No customer rates match this filter',
      description: 'Clear the filter to see every customer rate override.',
      primary: { label: 'Clear filter', href: '/tariff/customer-rates' },
    },
  },

  '/tariff/contracts': {
    empty: {
      icon: 'clipboardList',
      title: 'No contracts on file',
      description: 'Contracts override standard rate cards for specific customers — typically Platinum and Gold tier shipping lines.',
      primary: { label: 'New contract', href: '/tariff/contracts/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No contracts match this filter',
      description: 'Clear the filter to see all contracts.',
      primary: { label: 'Clear filter', href: '/tariff/contracts' },
    },
  },

  '/tariff/surcharges': {
    empty: {
      icon: 'clipboardList',
      title: 'No surcharges configured',
      description: 'Surcharges apply on top of base rates — e.g. peak-season, hazmat handling, after-hours gate.',
      primary: { label: 'New surcharge', href: '/tariff/surcharges/new' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No surcharges match this filter',
      description: 'Clear the filter to see all surcharges.',
      primary: { label: 'Clear filter', href: '/tariff/surcharges' },
    },
  },

  '/tariff/simulator': {
    empty: {
      icon: 'search',
      title: 'Run a price simulation',
      description: 'Pick a customer, equipment type, and service to preview the all-in quoted price using current rate cards, contracts, and surcharges.',
      primary: { label: 'Start simulation', href: '/tariff/simulator?start=1' },
    },
  },

  '/tariff/history': {
    empty: {
      icon: 'inbox',
      title: 'No price changes logged yet',
      description: 'Once you publish rate-card or contract changes, the audit trail appears here.',
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No history entries match this filter',
      description: 'Clear the filter to see the full audit trail.',
      primary: { label: 'Clear filter', href: '/tariff/history' },
    },
  },

  '/settings/users': {
    empty: {
      icon: 'box',
      title: 'No users yet',
      description: 'Invite team members — surveyors, estimators, approvers — to access the depot console.',
      primary: { label: 'Invite user', href: '/settings/users?invite=1' },
    },
    'filter-empty': {
      icon: 'filter',
      title: 'No users match this filter',
      description: 'Clear the filter to see all users.',
      primary: { label: 'Clear filter', href: '/settings/users' },
    },
  },

  '/settings/integrations': {
    empty: {
      icon: 'inbox',
      title: 'No integrations configured',
      description: 'Connect external systems (carrier APIs, lessor portals, bank feeds) once Phase E lands. None active in v1.',
    },
  },

  // ============ DETAIL ROUTES — NOT-FOUND ONLY (UI-SPEC §12.2) ============
  // Detail pages only need a not-found variant in copy; loading uses DetailSpinner via loadingLabels.

  '/equipment/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This container doesn't exist",
      description: "The reference {ID} wasn't found in the equipment register. It may have been archived or never registered.",
      primary:   { label: '← Back to Equipment Register', href: '/equipment' },
      secondary: { label: 'Search by reference',          href: '/equipment?q={ID}' },
    },
  },

  '/repair/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This repair job doesn't exist",
      description: "The reference {ID} wasn't found in the repair register. It may have been archived.",
      primary:   { label: '← Back to Repair Register', href: '/repair' },
      secondary: { label: 'Search by reference',       href: '/repair?q={ID}' },
    },
  },

  '/survey/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This survey doesn't exist",
      description: "The reference {ID} wasn't found. It may have been deleted or never created.",
      primary: { label: '← Back to Survey Register', href: '/survey' },
    },
  },

  '/cleaning/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This cleaning job doesn't exist",
      description: "The reference {ID} wasn't found in the cleaning queue.",
      primary: { label: '← Back to Cleaning Queue', href: '/cleaning' },
    },
  },

  '/parts/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This part doesn't exist",
      description: "The part reference {ID} wasn't found in the catalogue.",
      primary: { label: '← Back to Parts Catalogue', href: '/parts' },
    },
  },

  '/billing/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This invoice doesn't exist",
      description: "Invoice {ID} wasn't found. It may have been voided or never issued.",
      primary: { label: '← Back to Billing', href: '/billing' },
    },
  },

  '/modification/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This modification job doesn't exist",
      description: "The reference {ID} wasn't found in the modification register.",
      primary: { label: '← Back to Modifications', href: '/modification' },
    },
  },

  '/emergency/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This emergency job doesn't exist",
      description: "The reference {ID} wasn't found in the emergency register.",
      primary: { label: '← Back to Emergency Jobs', href: '/emergency' },
    },
  },

  '/tariff/contracts/[id]': {
    'not-found': {
      icon: 'fileX',
      title: "This contract doesn't exist",
      description: "Contract {ID} wasn't found. It may have been replaced by a newer version.",
      primary: { label: '← Back to Contracts', href: '/tariff/contracts' },
    },
  },

  '/tariff/customer-rates/[customerId]': {
    'not-found': {
      icon: 'fileX',
      title: "This customer has no rate overrides",
      description: "Customer {ID} bills at standard rate-card pricing — no overrides configured. You can add one.",
      primary:   { label: '← Back to Customer Rates', href: '/tariff/customer-rates' },
      secondary: { label: 'Add override',             href: '/tariff/customer-rates/new?customer={ID}' },
    },
  },
};

/**
 * Per-route-family DetailSpinner labels per UI-SPEC §10.2.
 * Plan 09 reads: `<DetailSpinner label={loadingLabels[routeKey] ?? 'Loading…'} />`
 */
export const loadingLabels: Record<string, string> = {
  '/equipment/[id]':                        'Loading container…',
  '/repair/[id]':                           'Loading repair job…',
  '/survey/[id]':                           'Loading survey…',
  '/cleaning/[id]':                         'Loading cleaning job…',
  '/parts/[id]':                            'Loading part…',
  '/billing/[id]':                          'Loading invoice…',
  '/modification/[id]':                     'Loading modification job…',
  '/emergency/[id]':                        'Loading emergency job…',
  '/tariff/contracts/[id]':                 'Loading contract…',
  '/tariff/customer-rates/[customerId]':    'Loading customer rates…',
};

/**
 * Per-route error title + description per UI-SPEC §10.3.
 *
 * The `_fallback` key is type-encoded as a required member of the map (W-6) so callers
 * that go through `getErrorCopy()` always get a valid response — TS guarantees the
 * fallback exists at compile time.
 *
 * Plan 08 reads: `getErrorCopy(routePath)` which returns `errorCopy[route] ?? errorCopy._fallback`.
 */
export type ErrorCopyEntry = { title: string; description: string };

export const errorCopy: Record<string, ErrorCopyEntry> & { _fallback: ErrorCopyEntry } = {
  '/equipment':             { title: "We couldn't load the equipment register",    description: 'Something interrupted the request. Try again, or contact support if it keeps failing.' },
  '/repair':                { title: "We couldn't load the repair register",       description: 'Something interrupted the request. Try again, or contact support if it keeps failing.' },
  '/survey':                { title: "We couldn't load the survey register",       description: 'Something interrupted the request. Try again, or contact support if it keeps failing.' },
  '/cleaning':              { title: "We couldn't load the cleaning queue",        description: 'Something interrupted the request. Try again.' },
  '/storage':               { title: "We couldn't load the storage register",      description: 'Something interrupted the request. Try again.' },
  '/parts':                 { title: "We couldn't load the parts catalogue",       description: 'Something interrupted the request. Try again.' },
  '/billing':               { title: "We couldn't load the billing list",          description: 'Something interrupted the request. Try again.' },
  '/modification':          { title: "We couldn't load the modification register", description: 'Something interrupted the request. Try again.' },
  '/emergency':             { title: "We couldn't load the emergency register",    description: 'Something interrupted the request. Try again.' },
  '/dashboard':             { title: "We couldn't load the dashboard",             description: 'One or more KPI sources failed. Try again.' },
  '/tariff':                { title: "We couldn't load tariff data",               description: 'Something interrupted the request. Try again.' },
  '/tariff/rate-cards':     { title: "We couldn't load rate cards",                description: 'Something interrupted the request. Try again.' },
  '/tariff/contracts':      { title: "We couldn't load contracts",                 description: 'Something interrupted the request. Try again.' },
  '/tariff/customer-rates': { title: "We couldn't load customer rates",            description: 'Something interrupted the request. Try again.' },
  '/tariff/surcharges':     { title: "We couldn't load surcharges",                description: 'Something interrupted the request. Try again.' },
  '/tariff/simulator':      { title: "We couldn't load the simulator",             description: 'Something interrupted the request. Try again.' },
  '/tariff/history':        { title: "We couldn't load price history",             description: 'Something interrupted the request. Try again.' },
  '/settings/users':        { title: "We couldn't load users",                     description: 'Something interrupted the request. Try again.' },
  '/settings/integrations': { title: "We couldn't load integrations",              description: 'Something interrupted the request. Try again.' },
  _fallback:                { title: 'Something went wrong',                       description: 'We hit an error loading this page. Try again, or contact support.' },
};

/**
 * Helper to resolve copy for a route+variant with safe undefined return when missing.
 * Callers handle undefined explicitly (e.g. fall back to generic EmptyState defaults).
 */
export function getEmptyCopy(route: string, variant: StateVariant): CopyConfig | undefined {
  return emptyStateCopy[route]?.[variant];
}

/**
 * Helper to resolve error copy for a route. Always returns a valid entry — falls back
 * to the type-guaranteed `_fallback` entry when the route is unmapped.
 */
export function getErrorCopy(route: string): ErrorCopyEntry {
  return errorCopy[route] ?? errorCopy._fallback;
}

/**
 * Helper to resolve loading label for a route family. Falls back to a generic
 * `Loading…` label when the route has no specific label.
 */
export function getLoadingLabel(route: string): string {
  return loadingLabels[route] ?? 'Loading…';
}
