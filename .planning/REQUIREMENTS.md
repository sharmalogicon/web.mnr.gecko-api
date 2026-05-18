# Requirements: Gecko M&R — Milestone v1.0 (Phase A — Standards Foundations)

**Defined:** 2026-05-17
**Core Value:** Multi-depot operators in SE Asia get a standards-aligned (ISO 6346, CEDEX, IICL-6) M&R tool that runs all three ICD container types (dry, tank, reefer) without enterprise pricing or carrier-required EDI on day one.

## Cross-cutting acceptance (applies to every requirement below)

Every requirement implementation MUST use **container-industry-realistic
seed data**. This is a hard acceptance criterion, not a polish item:

- **BIC owner codes** drawn from real assignments: carriers (MSKU = Maersk, CMAU = CMA CGM, MSCU = MSC, ONEU = Ocean Network Express, HLXU = Hapag-Lloyd, EVRU = Evergreen, COSU = COSCO, YMLU = Yang Ming, HMMU = HMM, ZIMU = ZIM) and lessors (TGHU = Triton, BEAU = Beacon, SEKU = SeaCo, FCIU = Florens, CARU = Caribbean / SeaCastle). Check digits MUST be computed correctly by the BIC algorithm (EQUIP-04) — not random.
- **ISO 6346 size/type codes** taken from the published seed: 22G1, 22G2, 42G1, 42G2, 45G1 (dry); 22T1, 22T2, 22T3, 42T1 (tank); 22R1, 22R8, 42R1, 45R1 (reefer); 22B1 (bulk); 22P1 (flat). No invented codes.
- **Physical specs per type** within real ranges. Example anchors: 20' std dry tare ≈ 2,370 kg / MGW ≈ 30,480 kg / cube ≈ 33.2 m³ ; 40' HC dry tare ≈ 3,920 kg / MGW ≈ 32,500 kg / cube ≈ 76.4 m³ ; 40' HC reefer Carrier 69NT40 with R-134a or R-513A, plug 32 A 380 / 440 V 3-phase, range -25 °C to +25 °C ; T11 IMO 1 tank ≈ 26,000 L / 4 bar / 316L stainless shell.
- **Depot locations** real to launch markets: Laem Chabang Port (TH), Lat Krabang ICD (TH), Port Klang Northport / Westport (MY), Pasir Gudang (MY), Jurong Port (SG), PSA Pasir Panjang (SG).
- **Customer + lessor names** real: see carrier and lessor lists above. Don't invent shipping lines.
- **Surveyor + mechanic names** plausibly SE-Asian (Somchai K., Tan Wei Ming, Ahmad bin Razak, Nguyen Van A, etc.) — keep them anonymised but culturally consistent with the launch markets.
- **Costs** in local currency (THB primarily; MYR / SGD where the depot is in MY / SG). Use realistic depot rate ranges (e.g., a 20' DRY survey ≈ THB 350–500; a tank washout ≈ THB 8,000–15,000; a CEDEX-coded 30 cm dent straighten ≈ THB 1,200 + labour).
- **CEDEX-coded damage examples** drawn from real BIC CEDEX line types — `LOC=8200 COMP=FNX DAM=BEN REP=STR` style — not made-up codes.
- **No placeholder strings** (`Customer A`, `Container 12345`, `$100`, `Lorem ipsum`) visible anywhere a depot operator would see them. Reserve those only for unit-test fixtures hidden from the UI.

This applies to **every** phase, every seed file, every component story. A
phase is not "done" until its visible data is realistic by this bar.

---

## v1 Requirements

Requirements for milestone v1.0 (Phase A — Standards Foundations). Each maps to one roadmap phase.

### UI Polish

- [ ] **UI-01**: Every existing list page in the app (Equipment, Repair, Survey, Cleaning, Storage, Parts, Billing, Tariff lists, Settings sub-pages) has explicit Empty state, Loading state, and Error state — no infinite spinners, no blank pages, no silently-empty grids. Each state has gecko-styled copy + iconography.
- [ ] **UI-02**: Every existing detail page (Equipment/[id], Repair/[id], Survey/[id], Cleaning/[id], Parts/[id], Billing/[id], Tariff/Contracts/[id], Tariff/Customer-Rates/[customerId], etc.) has explicit Loading state and Not-Found state (when the URL ID does not resolve).
- [ ] **UI-03**: All visible data across the existing 47 routes is replaced with container-industry-realistic seed values per the cross-cutting acceptance bar (BIC-valid container numbers with correctly computed check digits, real carrier/lessor names, real TH/MY/SG depot locations, THB-anchored costs). No `Customer A` / `Container 12345` / `$100` placeholders remain anywhere a depot operator would see them.

### Equipment Master

- [ ] **EQUIP-01**: User can register a container with ISO 6346 identification — 4-letter owner code + category identifier (U / J / Z) + 6-digit serial + check digit captured as discrete fields.
- [ ] **EQUIP-02**: User can assign and view an ISO 6346 size/type code (22G1, 42G1, 45G1, 22T1, 42T1, 22R1, 42R1, 45R1, …) on every equipment record, sourced from a seed table covering the dry (G), tank (T), and reefer (R) groups.
- [ ] **EQUIP-03**: System supports DRY, TANK, REEFER as first-class container categories, with GENSET modelled as a reefer-linked accessory; OPEN-TOP / FLAT-RACK / BULK / HARDTOP exist as stubs (selectable but without dedicated workflows) for v2 demand.
- [ ] **EQUIP-04**: System validates container numbers against the BIC ISO 6346 check-digit algorithm on input and rejects malformed inputs with a clear error message.
- [ ] **EQUIP-05**: User can record universal physical specs (tare, MGW, payload, cube, internal L×W×H, door opening, floor type) plus type-specific extensions — tank (pressure / shell / insulation), reefer (plug type / refrigerant / setpoint range).
- [ ] **EQUIP-06**: User can record CSC plate ID, ACEP scheme registration, next periodic examination, 5-year structural test, 2.5-year intermediate test; reefer equipment additionally records ATP plate validity.

### Repair Coding

- [ ] **REPAIR-01**: User can author a repair line using CEDEX codes — Location → Component → Damage → Repair → Quantity → Dimension → Material → Hours → Cost — sourced from seed tables, instead of free-text damage description.
- [ ] **REPAIR-02**: System flags whether a measured damage meets IICL-6 acceptable-wear vs must-repair thresholds, using container-type-specific criteria sets (dry / tank / reefer).
- [ ] **REPAIR-03**: User can assign a responsibility flag (Owner / Operator / Depot / Insurance / Warranty) per repair line; the flag determines the billing destination at invoicing time.
- [ ] **REPAIR-04**: Distinct estimator and approver roles exist on a repair job; an approver can review the estimator's CEDEX-coded lines and explicitly sign off before work proceeds.

### Survey & Inspection

- [ ] **SURV-01**: User can run a DRY container survey using a type-specific checklist (~25 items) with 6 photo angles including door interior, floor, and roof.
- [ ] **SURV-02**: User can run a TANK container survey using a type-specific checklist (~20 items) covering pressure test, vacuum test, and valve inspection.
- [ ] **SURV-03**: User can run a REEFER container survey using a type-specific checklist (~30 items) integrated with the PTI workflow.
- [ ] **SURV-04**: User can run a Reefer PTI (Pre-Trip Inspection) as a distinct survey type with ~25-point checklist covering temperature ramp test, defrost cycle, T-cycle, controller log download, evaporator/condenser inspection, and ATP plate validity check.
- [ ] **SURV-05**: System generates a PTI certificate after a passing reefer PTI survey, capturing date, surveyor, and the relevant ATP/PTI references.
- [ ] **SURV-06**: Off-hire surveys surface IICL-6 criteria flags from REPAIR-02 to guide acceptance vs must-repair disposition for the relevant container type.

### Data Layer

- [ ] **DATA-01**: Page-level mock arrays are replaced with a shared types + repository pattern; every domain entity (Equipment, Repair, Survey, Cleaning, Storage, Parts) has a single typed source of truth.
- [ ] **DATA-02**: The repository pattern is designed against ports / interfaces such that the in-memory / local-persistence implementation can be swapped to the separate API team's backend without UI rewrite.

## v2 Requirements

Deferred to future milestones. Tracked in `ROADMAP.md` (project-root) under Phases B–E.

### Multi-tenant & Money (Phase B target)
- **TENANT-01**: Multi-tenant data isolation (per-tenant subdomain or URL, row-level isolation)
- **TENANT-02**: Multi-depot per tenant with cross-depot rollup reporting
- **MASTER-01**: Customer master CRUD as first-class entity
- **MASTER-02**: Lessor master + lease-pool / per-diem architecture
- **CONTRACT-01**: Contracts with line items + effective-date versioning
- **MONEY-01**: Multi-currency + FX rate table (THB / MYR / SGD / USD priority)
- **MONEY-02**: Tax / VAT engine for TH (VAT 7%), SG (GST 9%), MY (SST 6/10%)
- **MONEY-03**: Rule-engine surcharges (predicate DSL)
- **MONEY-04**: Demurrage / free-time / detention engine
- **MONEY-05**: Quote → Job → Invoice link with credit notes + payment terms + statement of account
- **PARTS-01**: Real Purchase Order workflow with GR / GI movements
- **PARTS-02**: Supplier master + bin / multi-warehouse

### Cleaning, Storage, Mobile (Phase C target)
- **CLEAN-01**: Dry-container washout workflow
- **CLEAN-02**: Tank cleaning depth (EFTCO ECD, ITCO codes, last-cargo compatibility matrix, per-step instrumentation)
- **CLEAN-03**: Reefer wash workflow
- **STORE-01**: Storage demurrage tied to billing engine
- **STORE-02**: IMDG hazmat segregation rules
- **STORE-03**: Stacking / tiering model with 2-D yard map
- **STORE-04**: Movement history per slot + per equipment
- **MOBILE-01**: Mobile / offline survey PWA (offline-first, sync on reconnect, photo queue, GPS + signature)
- **MOBILE-02**: Photo annotation / markup on 6-face container diagram (per-type variants)
- **GATE-01**: EIR-In / EIR-Out workflow distinct from periodic surveys

### Portal, Compliance, Scale (Phase D target)
- **PORTAL-01**: Customer / lessor portal (read-only, then write)
- **EINV-01..03**: E-invoicing — Thai eTax, Singapore InvoiceNow (PEPPOL), Malaysia LHDN MyInvois
- **COMPLY-01**: Audit log on every entity write
- **COMPLY-02**: Role / permission matrix
- **COMPLY-03**: Data residency controls (TH / SG region pinning)
- **HSE-01**: Structured spill capture + regulator notification log + CAPA tracker
- **CLASS-01**: Modification class-society approval flow (DNV / Lloyd's / ABS / RINA)
- **REPORT-01**: KPI dashboards (turn time, dwell, throughput, first-time-pass rate)
- **I18N-01**: UI in EN / TH / MS / ZH

### Integration Platform (Phase E target — deferred by buyer decision)
- **EDI-01**: UN/EDIFACT message belt (CODECO / COPARN / COREOR / DESTIM / COSTOR / IFTSTA / INVOIC / REMADV)
- **API-01..06**: Carrier REST API integrations (Maersk, CMA CGM, MSC, ONE, Hapag, Evergreen)
- **LESSOR-01..04**: Lessor integrations (Triton, Beacon, SeaCo, Florens)
- **BANK-01**: Banking integration (auto-reconciliation REMADV / statement → invoice)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| UN/EDIFACT message belt | Deferred by buyer decision; v1 is a web-only depot tool. Re-evaluate when a carrier mandate forces it. |
| Public REST API for customer BI/TMS | A separate team builds the backend API; we consume it. We do not build primary APIs in v1. |
| Native mobile apps (iOS / Android shells) | PWA only in v1. Revisit if a customer demands native. |
| UIIA / GUEA chassis interchange | US-centric, low SE Asia demand. |
| Vietnam, Indonesia, MENA tax + e-invoicing | Out of v1; TH/MY/SG only. Add per country when a customer drives it. |
| Standalone genset workflow | Genset modelled as reefer-linked accessory only. |
| AI-driven anything (auto-damage detection, photo classification, etc.) | Not on the standards-alignment critical path. Revisit as a v4 differentiator. |
| Chassis / Trailer / Swap-body workflows | Backlog. Re-evaluate when a chassis-heavy customer is in the funnel. |
| Tank cleaning depth (EFTCO ECD generation, last-cargo compatibility matrix, per-step instrumentation) | Defer to Phase C (post-Phase A). Tank survey + tank repair land in Phase A; tank cleaning depth lands in Phase C. |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| DATA-01 | Phase 2 | Pending |
| DATA-02 | Phase 2 | Pending |
| EQUIP-01 | Phase 3 | Pending |
| EQUIP-02 | Phase 3 | Pending |
| EQUIP-03 | Phase 3 | Pending |
| EQUIP-04 | Phase 3 | Pending |
| EQUIP-05 | Phase 3 | Pending |
| EQUIP-06 | Phase 3 | Pending |
| REPAIR-01 | Phase 4 | Pending |
| REPAIR-02 | Phase 4 | Pending |
| REPAIR-03 | Phase 4 | Pending |
| REPAIR-04 | Phase 4 | Pending |
| SURV-01 | Phase 5 | Pending |
| SURV-02 | Phase 5 | Pending |
| SURV-06 | Phase 5 | Pending |
| SURV-03 | Phase 6 | Pending |
| SURV-04 | Phase 6 | Pending |
| SURV-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 21
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-17*
*Last updated: 2026-05-17 — traceability re-mapped after Phase 1 UI/UX Audit & Polish inserted (6 phases, 21 reqs)*
