# Gecko M&R (web.mnr.gecko-api)

## What This Is

A modern, web-based depot M&R (Maintenance & Repair) platform for ISO
container operations — dry, tank, and reefer — targeting multi-depot
operators in SE Asia (Thailand, Malaysia, Singapore). UI-first Next.js
frontend; the backend REST API is a separate team's deliverable that this
frontend consumes. Field surveyor use is PWA (offline-capable web), not
native.

## Current Milestone: v1.0 M&R Phase A — Standards Foundations

**Goal:** Lock the UI/UX quality bar across the existing 47 routes first
(empty / loading / error / not-found states, realistic data everywhere),
then add standards alignment (ISO 6346, CEDEX, IICL-6) and first-class
workflows for the three ICD container types (dry, tank, reefer). All
frontend; REST API is a future milestone owned by a separate team.

**Target features:**
- **UI completeness across all 47 existing routes** — empty / loading / error / not-found states everywhere; realistic seed data swap-in
- Shared types + port-based repository pattern (frontend plumbing for future REST API)
- ISO 6346 equipment master + BIC check-digit validation + size/type code matrix
- Container category expansion to dry / tank / reefer as first-class types
- CEDEX-coded repair line items (Location · Component · Damage · Repair)
- IICL-6 acceptance criteria across all three types
- Reefer PTI workflow as a distinct survey type
- Per-type survey checklist templates (dry / tank / reefer)
- CSC + ACEP certification fields + dimensional / payload fields
- Estimator / approver split with responsibility flag per repair line

## Core Value

Multi-depot operators in SE Asia get a standards-aligned (ISO 6346, CEDEX,
IICL-6) M&R tool that runs all three ICD container types (dry, tank, reefer)
without enterprise pricing or carrier-required EDI on day one.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — pre-v1)

### Active

<!-- Current scope. Building toward these. Detail lives in REQUIREMENTS.md. -->

- [ ] Standards-aligned equipment master (ISO 6346 + size/type code)
- [ ] CEDEX-coded repair line items (location · component · damage · repair)
- [ ] IICL-6 acceptance criteria across dry / tank / reefer
- [ ] Reefer PTI workflow as a distinct survey type
- [ ] Per-type survey checklists (dry / tank / reefer)
- [ ] Persistent data layer designed to consume the separate team's API

### Out of Scope

<!-- Explicit boundaries with reasoning. -->

- **UN/EDIFACT message belt (CODECO, COPARN, COREOR, DESTIM, COSTOR, INVOIC, REMADV)** — deferred by buyer decision; v1 is a web-only depot tool. Re-evaluate when a carrier mandate forces it.
- **Public REST API for customer BI/TMS** — a separate team builds the backend API; we consume it.
- **Native mobile apps** — PWA only in v1. Revisit if a customer demands native.
- **UIIA / GUEA chassis interchange** — US-centric, low SE Asia demand.
- **Vietnam, Indonesia, MENA tax / e-invoicing** — out of v1; TH/MY/SG only.
- **Standalone genset workflow** — genset modelled as a reefer-linked accessory only.
- **AI-driven anything (auto-damage detection, etc.)** — not on the standards-alignment critical path; revisit as a v4 differentiator.

## Context

- **Sister apps in the Gecko family:** `web.tos.gecko-api` (terminal OS), `my.gecko-api.com` (My portal). Shared visual design system (`gecko_design_system*.css`) lives in the TOS repo and was copied byte-identical into MNR during the recent styling adoption.
- **Codebase state:** Next.js 16 + React 19 + TS 5 + Tailwind v4 + shadcn/Radix UI. Frontend currently mock-data only (no API layer); every page owns its own mock array.
- **Tank-centric bias:** the current frontend's forms, photo angles, checklists, and rate-card line items are visibly built for ISO tanks. Dry/Reefer appear in the sidebar nav and type filter chips but have no dedicated workflow yet — this is the central gap Phase A closes.
- **Recently shipped (pre-GSD):** Gecko design system adoption across the codebase (CSS layered import fix, AppShell rebuild on TOS shape, shadcn UI wrappers refactored to emit gecko classes, 41 pages/components refactored across 3 parallel sub-agents).
- **Backend API:** separate team. This frontend project should design its data layer (Phase A.12) so it can swap from in-memory/local persistence to the API team's backend without UI rewrite.
- **Anchor customer:** a pilot multi-depot operator will drive Phase A/B sequencing within phase. Identity not yet captured here.

## Constraints

- **Tech stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind v4 + shadcn/Radix UI. Match TOS dep versions where they overlap. No new styling deps.
- **Standards alignment:** ISO 6346, CEDEX (BIC), IICL-6 / IICL-7, CSC + ACEP, ATP (reefer), EFTCO ECD (tank cleaning), IMDG, ISO 668 / 1496 are non-negotiable for v1 (except where explicitly deferred above).
- **Launch markets:** Thailand, Malaysia, Singapore only in v1. Tax + i18n work scoped to TH (VAT 7%), SG (GST 9%), MY (SST 6/10%) + languages EN, TH, MS, ZH.
- **Backend API:** UI-first. We do not build primary APIs in v1 — we design to consume the separate API team's backend.
- **Mobile:** PWA only. No React Native, no Capacitor, no native shells.
- **Design system:** the 6 `gecko_design_system*.css` files are immutable inside MNR. MNR-specific patterns go in `src/app/gecko_mnr_overlay.css`. Promote upstream candidates at code review.
- **Multi-tenant:** every transaction is tenant + depot scoped from day one. Architecturally provision multi-depot rollup and lease-pool / per-diem accounting even when the surface UI is minimal.
- **Realistic test data (cross-cutting):** every seed dataset, demo record, and screenshot uses container-industry-realistic values. Real BIC owner codes (MSKU, CMAU, MSCU, ONEU, HLXU, EVRU, COSU, YMLU, HMMU, ZIMU, TGHU, BEAU, SEKU, FCIU, CARU, …) with **computed-correct check digits**. Real ISO 6346 size/type codes (22G1 / 42G1 / 45G1 / 22T1 / 22R1 / 42R1 / 45R1, …). Realistic physical specs per type (20' std dry: tare ≈ 2,370 kg, MGW ≈ 30,480 kg, cube ≈ 33.2 m³; 40' HC reefer: Carrier 69NT40 / R-134a / -25 °C to +25 °C; T11 IMO 1 tank: ≈ 26,000 L / 4 bar / 316L shell). Real depot locations in launch markets (Laem Chabang, Lat Krabang ICD, Port Klang, Pasir Gudang, Jurong Port, PSA). Real carrier and lessor names. Costs in local currency (THB primarily). **No `"Customer A" / "Container 12345" / 100USD`-style placeholders anywhere visible to a depot operator.**

## Key Decisions

<!-- Significant choices that affect future work. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Primary buyer = multi-depot operators (regional chains, SE Asia) | Open seam between Navis/CargoWise (enterprise pricing) and Containerchain/Envision (regional / scheduling-first) | — Pending |
| All three container types (dry + tank + reefer) first-class in v1 | A real ICD handles all three; dry-only would not be credible | — Pending |
| EDIFACT belt deferred to post-v1 | Carriers won't be integration partners on day one; faster TTM | — Pending |
| UI-first; backend API by separate team | Division of labour — our team owns the user-facing surface | — Pending |
| PWA over native mobile | Faster TTM, no app-store gate, mid-range Android yard tablets are the target | — Pending |
| Lessor master architecturally provisioned with lease-pool / per-diem hook from v1 | Keep doors open for leasing-pool operators; minimal surface UI initially | — Pending |
| Launch markets = Thailand, Malaysia, Singapore | Scope tax/i18n/e-invoicing work; defer VN/ID/MENA | — Pending |
| Gecko design system adopted (Sept 2026 styling pass) | Visual consistency across TOS / MNR / My portal | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-17 after bootstrap from conversation context (codebase scan, gap-analysis report, ROADMAP.md, 6 captured product decisions)*
