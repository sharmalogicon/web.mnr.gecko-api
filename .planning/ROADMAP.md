# Roadmap — Gecko M&R v1.0 (Phase A — Standards Foundations)

**Milestone:** v1.0 M&R Phase A — Standards Foundations
**Created:** 2026-05-17 (revised 2026-05-17 to insert Phase 1: UI/UX Audit & Polish)
**Granularity:** balanced (5-8 phases)
**Phases:** 6
**Coverage:** 21/21 v1 requirements mapped

> This is the GSD **execution** roadmap that operationalises the strategic
> roadmap's Phase A. The strategic 5-phase plan (Phases A–E) lives in the
> repo-root `ROADMAP.md` and is not modified by GSD workflows.

**Tech stack for every phase:** Next.js 16 + React 19 + TypeScript 5 +
Tailwind v4 + Gecko design system + shadcn/Radix UI. **Frontend-only — no
backend in this milestone.** The REST API is a separate team's deliverable
that this codebase will consume in a future milestone. In-memory / local
persistence is acceptable scaffolding for v1.0.

**Cross-cutting realistic-data rule (every phase):** every seed dataset,
demo record, and screenshot uses container-industry-realistic values per
the cross-cutting acceptance bar in `REQUIREMENTS.md`.

---

## Phases

- [x] **Phase 1: UI/UX Audit & Polish** — Walk every existing list and detail route; add explicit Empty / Loading / Error / Not-Found states; swap all placeholder data for realistic seed values. **Locks the UI quality bar before new capability is added.** *(Shipped 2026-05-18 with deferred human-verify residual on Task 3.)*
- [x] **Phase 2: Data Layer Foundation** — Shared types + repository pattern with swappable ports, replacing per-page mock arrays so the future REST API can plug in without UI rewrite. *(Shipped 2026-05-18, 4 plans, 8/8 autonomous gates, REST swap recipe documented.)*
- [x] **Phase 3: Equipment Master & ISO 6346** — Container registration as DRY / TANK / REEFER with BIC check-digit validation, size/type code, full specs, and certification plates. *(Shipped 2026-05-19, 9/9 autonomous gates, Zod + react-hook-form established.)*
- [x] **Phase 4: CEDEX Repair Coding & IICL-6 Thresholds** — Structured repair lines (Location · Component · Damage · Repair), IICL-6 acceptance flags, responsibility billing flag, estimator/approver split. *(Shipped 2026-05-19, 9/9 autonomous gates, CEDEX + IICL-6 stub-data residuals.)*
- [x] **Phase 5: DRY & TANK Survey Workflows** — Per-type survey checklists (DRY ~25-item / 6 photo angles; TANK ~20-item with pressure / vacuum / valves) with IICL-6 disposition surfacing on off-hire. *(Shipped 2026-05-19; checklist stubs not from a single published standard.)*
- [x] **Phase 6: Reefer Survey & PTI Workflow** — Reefer survey checklist (~30-item) plus distinct Reefer PTI as its own survey type with controller log / T-cycle / defrost / ATP coverage and certificate generation. *(Shipped 2026-05-19; print-friendly certificate route + REEFER/PTI checklists via Phase 5.)*

---

## Phase Details

### Phase 1: UI/UX Audit & Polish
**Goal**: Bring every existing route in the codebase to a consistent quality bar — visible Empty / Loading / Error / Not-Found states, realistic seed data throughout — before any new domain capability is added on top.
**Depends on**: Nothing (first phase)
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. A user can walk every list route (Equipment, Repair, Survey, Cleaning, Storage, Parts, Billing, Tariff Rate-Cards, Tariff Customer-Rates, Tariff Contracts, Tariff Surcharges, Tariff Simulator, Tariff History, all Settings sub-pages, Dashboard) and see a gecko-styled Empty state when the data set is empty, a gecko-styled Loading state during data fetch, and a gecko-styled Error state on fetch failure. No blank pages. No infinite spinners.
  2. A user navigating to any detail URL with an invalid or non-existent ID (e.g., `/repair/DOES-NOT-EXIST`) lands on a gecko-styled Not-Found state with a clear way back to the list — not a crash, not a blank page, not a generic 404.
  3. Every visible data point across the 47 routes is realistic by the cross-cutting bar: BIC owner codes are real (MSKU / CMAU / MSCU / ONEU / HLXU / EVRU / TGHU / BEAU / SEKU / FCIU / …), check digits compute correctly, ISO 6346 size/type codes are real (22G1 / 42G1 / 45G1 / 22T1 / 22R1 / 42R1 / 45R1 / …), depot locations are real (Laem Chabang / Lat Krabang ICD / Port Klang / Pasir Gudang / Jurong Port / PSA), customers are real shipping lines, costs are THB-anchored, surveyor names are plausibly SE-Asian. No `Customer A` / `Container 12345` / `$100` strings remain visible.
**Plans** (10 plans, 4 waves):
  - Wave 1 (parallel): `01.01-state-components`, `01.02-bic-check-digit-util`, `01.03-shared-seed-tables`, `01.04-empty-state-copy-config`, `01.05-pageheader-deprecation`, `01.06-brand-string-cleanup`
  - Wave 2: `01.07-per-entity-seed-data` (depends on 02, 03)
  - Wave 3 (parallel): `01.08-list-route-wiring`, `01.09-detail-route-wiring` (depend on 01, 04, 05, 07)
  - Wave 4: `01.10-audit-tracker-and-signoff` (depends on all; human-verify checkpoint)
**UI hint**: yes (this entire phase is UI work)

### Phase 2: Data Layer Foundation
**Goal**: Every domain entity has a single typed source of truth behind a port-based repository inside the frontend, so when the future REST API arrives it can be slotted in with zero UI component changes. **This is frontend plumbing, not a backend.**
**Depends on**: Phase 1 (UI states established; realistic data ready to migrate behind the repository)
**Requirements**: DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Every list / detail page (Equipment, Repair, Survey, Cleaning, Storage, Parts) renders from a single shared typed data source rather than its own local mock array — updating a record in one page reflects in another.
  2. A developer can swap the in-memory repository implementation for a stub `fetch()`-based HTTP one in a single wiring file (no UI component change required) and the app continues to render. This is the seam the future REST API will plug into.
  3. Every domain entity (Equipment, Repair, Survey, Cleaning, Storage, Parts) is declared as an exported TypeScript type used by both reads and writes — no page redeclares its own shape.
**Plans**: TBD

### Phase 3: Equipment Master & ISO 6346
**Goal**: Users can register and view containers as standards-compliant ISO 6346 records spanning DRY / TANK / REEFER, with BIC-validated identifiers, size/type codes, full physical specs, and complete CSC / ACEP / (ATP for reefer) certification fields.
**Depends on**: Phase 2
**Requirements**: EQUIP-01, EQUIP-02, EQUIP-03, EQUIP-04, EQUIP-05, EQUIP-06
**Success Criteria** (what must be TRUE):
  1. User can create a new container record by entering the four ISO 6346 parts as discrete fields (4-letter owner code, category identifier U / J / Z, 6-digit serial, check digit) and the form rejects invalid BIC check digits inline with a clear error message.
  2. User can pick a size/type code (22G1, 42G1, 45G1, 22T1, 42T1, 22R1, 42R1, 45R1, …) from a seed-driven list grouped by dry (G) / tank (T) / reefer (R) and the selected code displays alongside its human label on the equipment record.
  3. User can select DRY, TANK, or REEFER as the container category (with GENSET available as a reefer-linked accessory and OPEN-TOP / FLAT-RACK / BULK / HARDTOP selectable as stubs), and the chosen type drives which spec extensions appear (tank: pressure / shell / insulation; reefer: plug type / refrigerant / setpoint range).
  4. User can record universal physical specs (tare, MGW, payload, cube, internal L×W×H, door opening, floor type) on every equipment record regardless of type.
  5. User can capture CSC plate ID, ACEP scheme registration, next periodic examination, 5-year structural test, and 2.5-year intermediate test on any container — and additionally an ATP plate validity date when the container is REEFER.
**Plans**: TBD
**UI hint**: yes

### Phase 4: CEDEX Repair Coding & IICL-6 Thresholds
**Goal**: Users can author repair jobs as CEDEX-coded line items with IICL-6-aware accept/repair flags, per-line responsibility/billing flag, and an enforced estimator → approver hand-off.
**Depends on**: Phase 3
**Requirements**: REPAIR-01, REPAIR-02, REPAIR-03, REPAIR-04
**Success Criteria** (what must be TRUE):
  1. User can author a repair line by picking from CEDEX-coded seed tables — Location → Component → Damage → Repair — and entering Quantity, Dimension, Material, Hours, Cost; no free-text damage description is required to save the line.
  2. When a user enters a damage measurement (dimension) on a repair line, the system shows an IICL-6 verdict (acceptable wear vs must-repair) appropriate to the equipment's type (dry / tank / reefer).
  3. User can assign a Responsibility flag (Owner / Operator / Depot / Insurance / Warranty) to each repair line and the assignment is visible at job level.
  4. User in the estimator role can submit a repair job for approval; user in the approver role sees the CEDEX-coded lines and must explicitly sign off before the job can move to work-in-progress.
**Plans**: TBD
**UI hint**: yes

### Phase 5: DRY & TANK Survey Workflows
**Goal**: Surveyors can run a fully type-appropriate survey for a DRY or TANK container with the right checklist and the right photo set, and off-hire surveys surface IICL-6 disposition guidance from the repair coding layer.
**Depends on**: Phase 4
**Requirements**: SURV-01, SURV-02, SURV-06
**Success Criteria** (what must be TRUE):
  1. When a user starts a survey on a DRY container, the form loads a ~25-item DRY-specific checklist and prompts for 6 photo angles including door interior, floor, and roof.
  2. When a user starts a survey on a TANK container, the form loads a ~20-item TANK-specific checklist covering pressure test, vacuum test, and valve inspection.
  3. When a user runs an off-hire survey on a DRY or TANK container and records a damage measurement, the IICL-6 acceptable-wear vs must-repair flag (from REPAIR-02) appears on the survey line to guide acceptance vs must-repair disposition.
**Plans**: TBD
**UI hint**: yes

### Phase 6: Reefer Survey & PTI Workflow
**Goal**: Surveyors can run both a full reefer survey and a distinct Reefer PTI as separate survey types, with the right reefer-specific checklists, and a passing PTI produces a printable certificate.
**Depends on**: Phase 3 (for ATP plate) and Phase 5 (shared survey scaffolding); Phase 4 (for IICL-6 reefer thresholds on off-hire reefer surveys)
**Requirements**: SURV-03, SURV-04, SURV-05
**Success Criteria** (what must be TRUE):
  1. When a user starts a survey on a REEFER container, the form loads a ~30-item REEFER-specific checklist that integrates with the PTI workflow (PTI can be launched from or linked to the reefer survey).
  2. User can start a Reefer PTI as a distinct survey type (selectable separately from a normal reefer survey) and the form presents a ~25-point PTI checklist covering temperature ramp test, defrost cycle, T-cycle, controller log download, evaporator/condenser inspection, and ATP plate validity check.
  3. When a Reefer PTI is completed with a passing result, the system generates a PTI certificate showing date, surveyor, and the relevant ATP / PTI references that the user can view and print.
**Plans**: TBD
**UI hint**: yes

---

## Dependency Graph

```
Phase 1 (UI/UX Audit & Polish)
   |
   v
Phase 2 (Data Layer)
   |
   v
Phase 3 (Equipment Master)
   |
   v
Phase 4 (Repair Coding + IICL-6)
   |
   +---> Phase 5 (DRY + TANK Surveys)
   |
   +---> Phase 6 (Reefer Survey + PTI)   [also depends on Phase 3 ATP, shares survey scaffolding with Phase 5]
```

Phase 6 may begin once Phase 4 is complete; running it concurrently with
Phase 5 is acceptable if survey scaffolding is shared cleanly.

---

## Coverage

✓ All 21 v1 requirements mapped to exactly one phase
✓ No orphaned requirements
✓ No duplicate mappings

| Phase | # Reqs | Requirements |
|-------|--------|--------------|
| 1. UI/UX Audit & Polish | 3 | UI-01, UI-02, UI-03 |
| 2. Data Layer Foundation | 2 | DATA-01, DATA-02 |
| 3. Equipment Master & ISO 6346 | 6 | EQUIP-01, EQUIP-02, EQUIP-03, EQUIP-04, EQUIP-05, EQUIP-06 |
| 4. CEDEX Repair Coding & IICL-6 Thresholds | 4 | REPAIR-01, REPAIR-02, REPAIR-03, REPAIR-04 |
| 5. DRY & TANK Survey Workflows | 3 | SURV-01, SURV-02, SURV-06 |
| 6. Reefer Survey & PTI Workflow | 3 | SURV-03, SURV-04, SURV-05 |
| **Total** | **21** | — |

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. UI/UX Audit & Polish | 10/10 | Shipped (Task 3 human-verify deferred) | 2026-05-18 |
| 2. Data Layer Foundation | 4/4 | Shipped (8/8 autonomous gates) | 2026-05-18 |
| 3. Equipment Master & ISO 6346 | 4/4 | Shipped (9/9 autonomous gates) | 2026-05-19 |
| 4. CEDEX Repair Coding & IICL-6 Thresholds | — | Shipped (9/9 autonomous gates; stub-data residuals) | 2026-05-19 |
| 5. DRY & TANK Survey Workflows | — | Shipped (checklist + IICL-6 verdict on off-hire; stub residual) | 2026-05-19 |
| 6. Reefer Survey & PTI Workflow | — | Shipped (PTI certificate route; REEFER/PTI checklists via Phase 5) | 2026-05-19 |

---

## Notes

- **Why UI/UX Polish first:** the buyer explicitly directed "fix the UI 100% first." Adding more domain capability on top of an inconsistent UI compounds quality debt. Phase 1 locks the visual + interaction quality bar before any new workflow lands.
- **Why Data Layer second:** every later phase writes / reads entities. Building the typed repository pattern up front means Phases 3–6 don't litter the codebase with new per-page mock arrays that would need to be unwound. The pattern is also the seam where the future REST API will plug in.
- **Why Equipment Master third:** EQUIP-03 (DRY / TANK / REEFER as first-class types) and EQUIP-06 (ATP plate on reefers) gate the survey phases; EQUIP-05 (type-specific spec extensions) shares schema with the repair / survey layers.
- **Why Repair before Surveys:** SURV-06 explicitly requires the IICL-6 flag established by REPAIR-02 to surface on off-hire dispositions for all three types.
- **Why DRY + TANK before Reefer:** these two share the simpler survey shape (checklist + photos + IICL-6 verdict). Reefer adds the PTI sub-workflow and certificate, which is a meaningfully larger surface.
- **Frontend-only:** no backend in this milestone by explicit buyer decision. The REST API is a separate team's deliverable that the Phase 2 repository pattern is designed to consume in a future milestone.
- **Anchor-customer flex:** the strategic roadmap notes the pilot operator may shuffle internal sequencing. Phases 5 and 6 may run concurrently if survey scaffolding is shared cleanly.

---
*Created: 2026-05-17 by gsd-roadmapper from REQUIREMENTS.md (initial 18 v1 requirements + 3 UI-* requirements inserted after Phase 0 decision) + strategic ROADMAP.md Phase A. Revised 2026-05-17 to insert Phase 1: UI/UX Audit & Polish.*
