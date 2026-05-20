/**
 * Page-shells barrel — Phase 7.11.
 *
 * Every page in the app composes one of these. Do NOT freelance page
 * chrome (back link / title / toolbar / metrics) — pass content into the
 * matching shell.
 *
 *  - DetailPageShell — read-only view of a record (e.g. /billing/[id])
 *  - EditPageShell   — editable view of a record  (e.g. /billing/[id]/edit)
 *  - ListPageShell   — list / table of records   (e.g. /billing)
 *  - FormPageShell   — create a new record       (e.g. /repair/new)
 *
 * See CLAUDE.md §3 (Layout chrome) for the canonical TOS references each
 * shell mirrors.
 */

export { DetailPageShell } from "./DetailPageShell";
export type { DetailPageShellProps, DetailMetric } from "./DetailPageShell";
export { EditPageShell } from "./EditPageShell";
export type { EditPageShellProps } from "./EditPageShell";
export { ListPageShell } from "./ListPageShell";
export type { ListPageShellProps } from "./ListPageShell";
export { FormPageShell } from "./FormPageShell";
export type { FormPageShellProps } from "./FormPageShell";
