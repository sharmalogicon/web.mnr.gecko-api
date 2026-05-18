# Milestones — Gecko M&R

Track-record of shipped milestones. Nothing yet — the project is entering
its first GSD-tracked milestone.

## v1.0 — In progress

**M&R Phase A — Standards Foundations**

See `.planning/ROADMAP.md` for the active phase plan.

### Phase 1 — UI/UX Audit & Polish — SHIPPED (with deferred human-verify residual)

- 2026-05-18: 10 of 10 plans executed; autonomous quality gates 8/8 pass; tsc + 17/17 tests clean.
- 2 in-place gap-closures landed: G-1 (page-body `<h1>` removal × 18 files, commit `4d8fac3`) and G-2 (USD → THB × 4 files, commit `15361c8`).
- Side-scope chore: centralized `<Icon>` migration across 42 files (commit `9ac7ea6`).
- Plan 01.10 Task 3 (browser walkthrough + 8 screenshots + density side-by-side) deferred per user decision; turn-key checklist at `.planning/phases/01-ui-ux-audit-polish/01.10-WALKTHROUGH.md`.
- Close-out artefact: [`.planning/phases/01-ui-ux-audit-polish/01.10-SUMMARY.md`](phases/01-ui-ux-audit-polish/01.10-SUMMARY.md).
- Phase 2 (Data Layer Foundation) green-lit; cursor advances.

## Prior work (pre-GSD, not milestone-tracked)

- **2026-05 — Gecko design system adoption.** Six gecko CSS files imported
  byte-identical from `web.tos.gecko-api`; layered CSS architecture so
  Tailwind utilities + page overrides win over gecko defaults; AppShell
  rebuilt on TOS shape with MNR's nav tree; Icon + Toast ported verbatim;
  shadcn UI wrappers (button, input, badge, card, table, label, textarea)
  refactored to emit gecko classes; 41 pages/components refactored across
  3 parallel sub-agents; build passes clean on 47 routes. Not tracked as
  a GSD milestone — landed before milestone discipline was set up.

---
*Last updated: 2026-05-18 — Phase 1 close-out + Phase 2 kick-off.*
