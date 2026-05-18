# Gecko M&R — Product Roadmap

> A standards-aligned, multi-depot, multi-type ICD M&R platform for regional
> depot operators in SE Asia (Thailand, Malaysia, Singapore). EDI deferred.
> UI-first; PWA for field. Three container types (dry, tank, reefer) are
> first-class from v1 because that's what a real ICD handles.

---

## 1. Positioning decisions (locked 2026-05-17)

| Decision | Value |
|---|---|
| **Primary buyer** | Multi-depot operators (regional chains, SE Asia) |
| **Launch markets v1** | Thailand, Malaysia, Singapore |
| **Equipment focus v1** | ISO Dry + Tank + Reefer (the three types a real ICD actually handles) |
| **Genset** | Modelled as reefer-linked accessory in v1; standalone workflow deferred |
| **Chassis / Trailer** | Backlog — UIIA-heavy, US-centric, low SEA demand |
| **EDI / EDIFACT** | Out of scope for v1 (web-only depot tool) |
| **API surface** | UI-first; backend API is a separate team's deliverable that we consume |
| **Mobile** | PWA (offline-capable web), not native |
| **Anchor customer** | Yes — pilot multi-depot operator drives Phase A/B sequencing within phase |
| **Lessor model** | Flexible: lease-pool + per-diem accounting architecturally provisioned from v1 |

### What this re-orientation changes from the discovery report

- **Codebase pivot:** the current frontend is tank-centric (forms, photo
  angles, checklists, rate-card line items). v1 expands to **DRY + TANK +
  REEFER** as three first-class workflows with a shared base and per-type
  variants. Tank work isn't retired — it gets two siblings.
- **Reefer PTI moves into Phase A.** ICDs handle reefers; a depot tool can't
  ship without a Pre-Trip Inspection workflow.
- **EDIFACT belt removed from v1:** carriers and lessors will not be
  integration partners on day one. Replace with **REST API consumption
  (the separate team's backend) + customer/lessor portal in Phase D**.
- **Multi-tenant + multi-depot becomes structural**, not "Phase E nice-to-
  have." Regional chains can't be served on a single-tenant deployment.
- **Launch-market focus narrows v1 tax/i18n work** to TH/MY/SG. Vietnam,
  Indonesia, MENA stay on the v2 list.

---

## 2. Standards alignment (target state across the roadmap)

| Standard | Why it matters even without EDI |
|---|---|
| **ISO 6346** | Container ID + size/type — the *only* legitimate way to identify a container globally. Drives everything downstream. |
| **CEDEX** (BIC) | Damage / component / repair coding. Lets quotes be portable across depots and comparable for procurement. Standard regardless of whether you transmit DESTIM by EDI. |
| **IICL-6 / IICL-7** | Inspection acceptance criteria. Required to credibly serve lessor-owned containers (~30% of global fleet). |
| **CSC + ACEP** | Periodic examination — already partially in code as `certifications[]`. Needs naming alignment. |
| **EFTCO ECD** | Cleaning handover document. Required for tank cleaning workflow in v1 (tank is first-class). |
| **IMDG** | Hazmat segregation in storage. Required even for dry depots that hold a hazmat zone. |
| **ISO 668 / ISO 1496** | Dimensions / structural classes — equipment master schema. |
| **ATP** (reefer) | Agreement on the International Carriage of Perishable Foodstuffs. Reefer PTI workflow references ATP plate validity. |

Out of v1 (defer with intent):
- UN/EDIFACT message belt (CODECO, COPARN, COREOR, DESTIM, COSTOR, INVOIC, REMADV)
- UIIA / GUEA intermodal interchange agreements
- Vietnam / Indonesia / MENA tax + e-invoicing

---

## 3. The roadmap

Five phases, A → E. Each phase is shippable in isolation; later phases assume
earlier ones. T-shirt sizes are rough order-of-magnitude relative to your
TOS-module velocity. Calendar dates depend on team size and are not promised
here.

### Phase A — Foundations (mandatory; everything else assumes this)

**Goal:** A correct, validated equipment & repair model covering the three
ICD container types (dry, tank, reefer) with proper standards coding.

| # | Deliverable | Notes | Size |
|---|---|---|---|
| A.1 | ISO 6346 equipment master | Owner code + category identifier (U / J / Z) + 6-digit serial + check digit. Validation on input, autocomplete on existing equipment. | M |
| A.2 | Size/type code matrix | `22G1`, `42G1`, `45G1`, `22T1`, `22R1`, `42R1`, `45R1`, etc. Seed table; UI shows human label + code. Three groups: dry (G), tank (T), reefer (R). | S |
| A.3 | Container category expansion | DRY (first-class), TANK (first-class), REEFER (first-class), GENSET (reefer-linked accessory). OPEN-TOP / FLAT-RACK / BULK / HARDTOP stubbed for v2 demand. Chassis backlog. | M |
| A.4 | BIC check-digit validation library | ~30 lines. Reject malformed numbers. Show check digit as separate field. | XS |
| A.5 | Dimensions / payload / cube fields | Tare, MGW, payload, cube, internal L×W×H, door opening, floor type. Universal across types. Type-specific extensions: tank pressure/shell/insulation, reefer plug type/refrigerant/setpoint range. | S |
| A.6 | CSC plate + ACEP scheme fields | Replace generic `certifications[]` with named: CSC plate ID, ACEP reg, next periodic exam, 5-year structural, 2.5-year intermediate. Reefer adds ATP plate. | S |
| A.7 | CEDEX seed data + repair line refactor | Tables: location, component, damage, repair, material. Repair-job form switches from free-text `damageType` to (Location → Component → Damage → Repair → Qty → Dim → Material → Hours → Cost). | L |
| A.8 | IICL-6 acceptance criteria table | Mapping (damage code + dimension threshold) → acceptable wear vs must-repair. Drives survey verdicts and off-hire disposition. Three criteria sets for dry / tank / reefer. | M |
| A.9 | Estimator / approver split | Roles + responsibility flag per repair line (Owner / Operator / Depot / Insurance / Warranty). Drives billing destination. | M |
| A.10 | Per-type survey checklist templates | Three templates loaded at survey creation: **DRY** (~25 items, 6 photo angles incl. door interior, floor, roof), **TANK** (current 13-item base expanded to ~20 with pressure test + valves), **REEFER** (~30 items + PTI integration). | L |
| A.11 | **Reefer PTI workflow** | Distinct survey type. ~25-point checklist: temperature ramp test, defrost cycle, T-cycle, controller log download, evaporator/condenser inspection. ATP plate validity check. Aligned with Carrier / Thermo King / Daikin reefer service procedures. | M |
| A.12 | Persistent data layer | Move from per-page mock arrays to a shared types + repository pattern. Pre-API; in-memory or local persistence is fine as scaffolding for Phase B. Designed to swap to API-team backend without UI rewrite. | L |

**Phase A exit criteria:**
- Every equipment record validates as ISO 6346 and carries a size/type code.
- Every repair line is CEDEX-coded.
- All three container types (dry, tank, reefer) have working survey workflows with type-appropriate checklists.
- Reefer PTI is its own survey type and produces a PTI certificate.
- IICL-6 criteria flags surface on off-hire surveys for all three types.
- The persistent data layer is shaped to hand off to the separate API team's backend without UI rewrite.

---

### Phase B — Multi-depot, multi-tenant, money

**Goal:** Make Gecko M&R a credible product for a regional chain in TH/MY/SG.
Multi-tenant data isolation, contract-versioned pricing, multi-currency,
country tax compliance.

> **Anchor-customer note:** the depot operator piloting v1 should drive the
> sequence WITHIN this phase. Likely order if their pain is data shape:
> B.1+B.2+B.3 first, then their billing pain (B.6+B.7+B.9), then their parts
> pain (B.13+B.14+B.15). Re-tier when the anchor is named.

| # | Deliverable | Size |
|---|---|---|
| B.1 | Multi-tenant data isolation | Tenant = operator group. Per-tenant URL or subdomain. Row-level isolation in storage layer. | L |
| B.2 | Multi-depot per tenant | Depot = physical site. Every transaction is depot-scoped. Cross-depot reporting at tenant level. | M |
| B.3 | Customer master CRUD | First-class entity (currently a dropdown string). Fields: legal name, tax ID, address, billing currency, payment terms, contact tree, EDI partner placeholder. | M |
| B.4 | Lessor master + lease-pool architecture | Fleet-pool owner separate from customer. **Lease-pool placeholder + per-diem accounting hook from v1 architecturally**, even if the surface UI is minimal initially. Drives off-hire workflow + lessor-billing. | M |
| B.5 | Contracts with line items + effective-date versioning | Replace single rate card with versioned contract pricing. Future-effective price changes. | M |
| B.6 | Multi-currency + FX rate table | Currency per customer; functional currency per tenant; FX maintained centrally. THB / MYR / SGD / USD priority. Receipts in local currency, books in functional. | M |
| B.7 | Tax / VAT engine (TH/MY/SG focus) | Thailand VAT 7%, Singapore GST 9%, Malaysia SST 6% / 10%. Tax codes per line. Per-tenant tax rules. Vietnam / Indonesia / MENA deferred to v2. | M |
| B.8 | Rule-engine surcharges | Replace string surcharges with a small DSL: `if cargo.imdg_class in [3,6.1] then +25%`, `if outside business_hours then +15%`. UI: surcharge builder with predicates + result. | L |
| B.9 | Demurrage / free-time / detention | Per-customer free-day window; tiered escalation (`free 5d; THB 500/d 6-10; THB 1000/d 11+`). Auto-billed nightly. | L |
| B.10 | Number-series configuration | Per-document type, per-depot, configurable format (`SRV-{YYYY}-{depot}-{0000}`). Replace decorative reference strings. | S |
| B.11 | Quote → Job → Invoice link | Single thread from estimate through approval, work, billing. Today these are disconnected mock arrays. | M |
| B.12 | Credit notes + payment terms + statement of account | Standard finance loop. Net 30 / Net 60 / advance payment customers handled. | M |
| B.13 | Real Purchase Order workflow | PO header + lines; status draft → sent → ack → partial-receive → received → invoiced → paid. GR/GI movements. Auto-create from reorder points. | L |
| B.14 | Supplier master | Lead time, MOQ, UoM, currency, payment terms, country, HS code. | S |
| B.15 | Bin / multi-warehouse on parts | Depots have multiple stores. | S |

**Phase B exit criteria:**
- A two-depot tenant can run, with each depot seeing only its own work and reporting rolling up at tenant level.
- A repair job auto-prices from a versioned contract with surcharges and taxes and produces an invoice in the customer's currency (THB, MYR, or SGD).
- A 30-day-storage container auto-bills demurrage on day 6 per the customer's free-time window.
- Lessor-owned container off-hire bills the lessor (not the customer) at the right per-diem.

---

### Phase C — Cleaning depth, storage depth, mobile PWA

**Goal:** Catch up the operational modules that v1 left thin, and put a
surveyor's tool in their hand. Tank cleaning is first-class here (not
on-demand) because tank is a v1 container type.

| # | Deliverable | Size |
|---|---|---|
| C.1 | Dry-container washout workflow | Distinct from tank cleaning. Process steps, photo capture, pass/fail. | M |
| C.2 | Tank cleaning depth | EFTCO ECD generation, ITCO cleaning codes, last-cargo → next-cargo compatibility matrix (refuses incompatible pairs without an additional step), per-step instrumentation (temp / pressure / time / water-volume / effluent-volume). HACCP / Kosher / Halal flags. Chemical MSDS links. **First-class because tank is a v1 type.** | L |
| C.3 | Reefer wash workflow | Distinct from dry washout (no cargo residue) and tank cleaning (no chemicals). Evaporator / drain / door-seal focus. Sanitisation cycle. | M |
| C.4 | Storage demurrage tied to billing | Free-time + tier engine from B.9 visualised on each slot. Customer-portal-visible. | M |
| C.5 | IMDG hazmat segregation rules in storage | Class-pair compatibility matrix + minimum-separation distance. Reject incompatible slot assignment. | M |
| C.6 | Stacking / tiering model | Row × bay × tier coordinate. Max-stack-height by type. Visual 2-D yard map. | L |
| C.7 | Movement history per slot + per equipment | Audit trail of who moved what when and why. | M |
| C.8 | **Mobile / offline survey PWA** | PWA confirmed (no native). Offline-first service worker, IndexedDB queue, sync on reconnect. Photo upload queue. GPS + timestamp + signature capture. Targets mid-range Android tablets used in yards. | XL |
| C.9 | Photo annotation / markup | Mark damage on a container diagram (the 6-face unfolded view used industry-wide). Per-type diagrams (dry / tank / reefer). | M |
| C.10 | EIR-In / EIR-Out workflow | Distinct from periodic surveys. Truck reference, driver, seal, booking — captured at gate. | M |
| C.11 | Master-data CRUD for the 6 settings tiles | Customers (Phase B), Tank Types, Damage Codes, Cleaning Types, Part Categories, Suppliers — finish the settings tiles that today route nowhere. | M |

---

### Phase D — Portal, compliance, scale

**Goal:** Self-service for customers; defensible compliance posture; ready
for the TH/MY/SG regional rollout.

| # | Deliverable | Size |
|---|---|---|
| D.1 | Customer / lessor portal (read-only first) | Read-only view of containers, work in progress, invoices, statements. | L |
| D.2 | Customer portal (write) | Upload pre-arrival announcements, approve/reject quotes, raise enquiries. | L |
| D.3 | E-invoicing — launch markets | **Thai eTax Invoice & e-Receipt** (Revenue Department), **Singapore InvoiceNow** (IMDA / PEPPOL), **Malaysia LHDN MyInvois** (mandatory phasing by turnover band). One country at a time, driven by customer. | M per country |
| D.4 | Audit log on every entity | Who, when, before, after — for every write. Per-tenant, queryable, exportable. | M |
| D.5 | Role / permission matrix | Depot manager, surveyor, mechanic, supervisor, finance, customer-portal-user, lessor-portal-user, sysadmin. Per-action permissions. | M |
| D.6 | Data residency controls | Per-tenant region pinning (TH / SG). Backups respect region. Thailand PDPA, Malaysia PDPA, Singapore PDPA compliance posture. | L |
| D.7 | HSE: structured spill capture | Spill volume, UN number, IMDG class structured. Regulator notification log (TH DDPM/PCD, MY DOE, SG NEA). Insurer notification log. CAPA tracker. Near-miss / incident / accident classification. | M |
| D.8 | Modification class-society approval flow | DNV / Lloyd's / ABS / RINA approval doc reference; before/after spec capture; warranty impact flag; engineering drawing attachment. | M |
| D.9 | Reporting / dashboards depth | KPIs: turn time, dwell, repair throughput, first-time-pass rate, depot utilisation, revenue/equipment-day, cost/repair. Per-depot + cross-depot. | L |
| D.10 | i18n surface | UI in EN, TH, MS, ZH (Singapore Chinese). RTL not needed in launch markets. Numerals + currency formatting per locale. | M |

---

### Phase E — Integration platform (the deferred EDI work)

> Deferred by buyer decision. Listed here so the architecture in earlier
> phases keeps doors open. Note: the **backend API is a separate team's
> deliverable**, so this phase is largely about consuming + integrating,
> not building primary APIs from scratch.

| # | Deliverable | Size |
|---|---|---|
| E.1 | Partner directory | Per-partner: protocol (AS2/SFTP/REST), message versions, routing rules, mapping config. | M |
| E.2 | UN/EDIFACT message belt | CODECO out, COPARN in, COREOR in, DESTIM out + ack in, COSTOR out, IFTSTA out, INVOIC out, REMADV in. D.16B baseline. | XL |
| E.3 | Carrier REST API integrations | Maersk, CMA CGM, MSC, ONE, Hapag, Evergreen. Two-way: status events out, release orders in. | L per carrier |
| E.4 | Lessor integrations | Triton, Beacon, SeaCo, Florens for off-hire DESTIM + RAGA. | L per lessor |
| E.5 | Banking integration | Auto-reconciliation of REMADV / bank statement → invoice. Local: Bangkok Bank / SCB / KBank (TH); Maybank / CIMB (MY); DBS / OCBC / UOB (SG). | M |

---

## 4. What's NOT on this roadmap (by intent)

- **UIIA / GUEA chassis interchange** — US-centric, low SE Asia demand.
- **Vietnam, Indonesia, MENA tax / e-invoice** — deferred to v2.
- **Native mobile apps** — PWA only; revisit if a customer demands native.
- **Public REST API for customer BI / TMS** — a separate team's deliverable; we consume it.
- **Standalone genset workflow** — genset is modelled as a reefer-linked accessory in v1.
- **AI-driven anything** (auto-damage detection from photos, etc.) — could be a v4 differentiator but adds nothing to standards alignment.

---

## 5. Decisions captured (2026-05-17)

| Q | Answer | Effect on plan |
|---|---|---|
| Launch markets | Thailand, Malaysia, Singapore | B.7 tax narrows; D.3 e-invoicing narrows; D.10 i18n narrows |
| Anchor customer | Yes | Phase A/B internal sequencing follows their pain |
| API-first or UI-first | UI-first; backend API is separate team | We design the data layer to consume their API; we don't build primary APIs in v1 |
| Mobile native vs PWA | PWA | C.8 is PWA only |
| Tank v2 timing | Tank is first-class in v1 alongside dry and reefer | A.3, A.10, C.2 all elevate tank; A.11 adds reefer PTI |
| Lessor coverage | Flexible — leave room for lease pool | B.4 architecturally provisions lease-pool + per-diem from v1 |

## 5b. Follow-up questions for the next planning round

1. **Anchor customer identity + depot count?** Their site count determines
   whether B.2 multi-depot rollup is a v1 must-have or just architecturally
   provisioned. Their carrier mix shapes Phase E priorities.
2. **Reefer PTI: which OEM service manual to align with?** Carrier
   Transicold / Thermo King / Daikin reefer container units have similar
   but not identical PTI sequences. Anchor customer's fleet mix decides.
3. **Singapore presence: own depot or partner depot?** Singapore land is
   scarce; depots are usually leased from PSA or in-port. Tax + tenant-
   data-residency posture differs.
4. **PWA install model:** kiosk-mode (browser locked to the app on yard
   tablets) or installed-PWA (Android home-screen icon)? Affects barcode /
   camera permission flow.
5. **Tank cleaning customers in the funnel:** TH chemical corridor (Map Ta
   Phut, Eastern Seaboard) is tank-heavy. Are these in the anchor pipeline?
6. **Lease-pool depth needed in v1 architecturally:** which lessors are
   likely first (Triton, Beacon, SeaCo, Florens)? Affects schema of B.4.

---

## 6. Document conventions

- Each phase ships independently; later phases assume earlier ones.
- T-shirt sizes are relative effort, not calendar promises. Use TOS-module
  velocity as the calibration baseline.
- Add to this file when scope moves between phases; don't silently re-tier.
- All standards references are to public BIC / IICL / ISO / UN/CEFACT /
  EFTCO publications. Where seed data is needed (CEDEX, IICL-6, IMDG),
  source from the latest published edition at implementation time.
