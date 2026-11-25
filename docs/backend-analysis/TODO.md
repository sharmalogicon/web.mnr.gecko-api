# Gecko Repair (M&R) backend analysis — TODO / resume log

Read this first when resuming after a crash. Newest status on top. Update after every step.

## How to rebuild the .docx files
- Sources: `docs/backend-analysis/build/*.js` (+ `lib.js`, copied from the Fleet set and adapted).
- `docx` is NOT installed in any repo. Install once: `npm i docx@9` in any folder (e.g. the session scratchpad `docxenv`), then
  `NODE_PATH=<that folder>/node_modules node 01_business_modules.js` (same for 02, 03, 04). Output lands in `docs/backend-analysis/`.
- Bash heredocs containing apostrophes break in this environment — write helper scripts with the Write tool instead.
- In the JS sources, strings are single-quoted: escape apostrophes as `\'` (or avoid them).

## Decisions (do not reopen)
- Q1 name: **Gecko.Repair** (projects/host/DB `gecko_repair`, route `/api/repair`); module code stays **MNR** (already seeded).
- Q2 format: Word docs via docx-js, like Fleet.
- Q3 pilot SCT, no legacy M&R data.
- Q4 own host Gecko.Repair.Api + own DB; sell tariff in gecko_revenue (`tariff.schedule` module MNR + `tariff.mnr_rate`).
- Q5 dry + reefer PTI + tank cleaning/tests all in scope.
- Q6 leased boxes for lessors: yes (owner/user split).
- Q7 global liners approve by EDI; local liners/lessors by PDF estimate.
- Q8 CEDEX required for global liners; free-text description allowed for small lessors (owner profile setting).
- Q9 parts stock control in first release.
- Q10 subcontracted repairs: yes (sublet + vendor bills).
- Q11 bill on approval (per-owner setting ON_APPROVAL default / ON_COMPLETION); industry research written into doc 01 §15.1.
- Q12 storage = read-only view over TOS.
- Q13 same two-person team (product owner + Claude).
- Q14 surveyor mobile app: recorded now, built in phase 2 (`client_ref` offline keys from P2).
- Q15 2D + 3D container damage map on view/edit/add (DB tables + UI prompt).

- Q16 EDI at go-live: MAERSK, ONE, CMA CGM, CHINASHIP (= COSCO SHIPPING? confirm), WAN HAI, HMM. Collect each implementation guide now.
- Q17 billing trigger stays a per-owner setting (owner profile).
- Q18 vendor bills: CSV export first (SAP B1 later). PO-vs-direct-receipt not answered -> kept as a setting (PO for stock items, direct receipt under a limit).
- Q19 3D: detailed model per container type (not a plain box).

## Decided v0.4 (25 Nov)
- Q20 CHINASHIP = COSCO SHIPPING Lines.
- Q21 detailed 3D models built procedurally in code (glTF optional per type).
- Q22 EDI is a separate phase/module (EDI service). Repair only keeps DB hand-off tables (exch.edi_outbound / exch.edi_inbound) for the EDI service to pick up. No Repair-owned EDI adapter. User: no more lengthy questions.

## v0.4 tasks
- [x] v0.4 applied and all 4 docx rebuilt (EDI = hand-off tables only; ~32 weeks; nothing open)

## (old) Open questions (v0.4)
- Q20 "CHINASHIP" = COSCO SHIPPING Lines (China Shipping merged into COSCO in 2016)? Which EDI endpoint/guide?
- Q21 detailed 3D models: build procedurally in code (recommended: exact ISO dimensions, aligned to zones, no licence) or buy/commission glTF assets?
- Q22 who obtains the 6 liners' EDI guides + test accounts, and by when (needed before P8).

## v0.3 tasks (25 Nov, after the Q16–Q19 answers)
- [x] lib.js version 0.3
- [x] doc 01: EDI partner list, detailed models, assumptions
- [x] doc 02: container_model model_kind, exch partner seeds
- [x] doc 03: decision table Q16–Q19, open Q20–Q22, P1/P8 effort + timeline shift, risks
- [x] doc 04: K and N rows/notes
- [x] UI prompt: detailed per-type models
- [x] rebuild all 4 docx (doc 04 now closed in Word), brand check

## Tasks
- [x] Analyse MNR UI, platform (Gecko.Api/TOS/Revenue/MasterData/Fleet), legacy MNR specs + C# services
- [x] v0.1 docs 01–04 written and built
- [x] v0.2: cover version bumped (lib.js)
- [x] v0.2: doc 01 updated (scope, R10 parts & stock, R15 damage map, R16 owner profiles & EDI, billing §15.1, roles, flows, assumptions)
- [x] v0.2: doc 02 updated (owner_profile, container_model/face/zone, damage_mark, part.* stock, vend.vendor_bill, exch.*, description columns, script order)
- [x] v0.2: doc 03 updated (decision log Q5–Q15, open Q16–Q19, endpoints, FE items, 13-phase plan ~33 weeks, cut-over, tests, risks)
- [x] v0.2: doc 04 updated (scores, area N damage visualisation, parts/EDI gaps to phase 1, pages, roadmap)
- [x] Write `docs/backend-analysis/UI_PROMPT_CONTAINER_DAMAGE_MAP.md` (2D + 3D damage map; reuses Fleet AxleDiagram3D stack)
- [x] doc 02 `code.model_face` now carries 3D placement (origin/u/v/normal) to match the prompt
- [x] Final check 25 Nov: all 4 docx are v0.2, brand check (CLAUDE.md §5) clean. Note: doc 04 was open in Word during the last rebuild (EBUSY) — its source had not changed since its v0.2 build, so the file is current. If 04 source is edited later, close Word before rebuilding.
- [x] v0.3 built 25 Nov: all 4 docx rebuilt (timeline now ~36 weeks: P1 +1 week for detailed models, P8 = 5 weeks for six EDI liners), brand check clean
## v0.5 — INDEPENDENT + GLOBAL product (user directive 25 Nov)
User: M&R must be an **independent module**, integrating with Gecko TOS, Navis, OPUS, ContainerChain etc., easily pluggable into any TOS, and **global-ready**. Reuse generic DBs (identity, master, revenue, notification).
Facts found: `Gecko.PortHub` = cross-tenant normalised port-event hub (GATE_IN/OUT, HOLD_*, EMPTY_RETURN_DEPOT…; IPortHub Submit/Watch) → reusable intake for external terminal facts. Identity has `DataPlacement.RegionCode` (data residency groundwork). Revenue has TH e-Tax only.
Key architecture (recommended defaults, to confirm in review):
- G1 Repair owns its own **equipment visit** (`intake.equipment_visit`): Gecko TOS is just one source. No Repair table depends on gecko_tos.
- G2 **Yard gateway port** `IYardGateway` with adapters: GECKO_TOS (in-process), CONNECTOR (external TOS via integ tables), STANDALONE (Repair's own light gate-in/out).
- G3 **Integration hub** in gecko_repair `integ` schema: connector, inbound_event, outbound_event, code_map, delivery log; connector workers in a separate `Gecko.Repair.Connectors` worker host; transports REST/webhook/SFTP-CSV/EDIFACT (via EDI service)/PortHub. Vendor adapters: Navis N4, OPUS, ContainerChain, generic.
- G4 **Plug-in kit**: public REST API + webhooks + OIDC SSO + deep links + embeddable web components (damage map, case panel).
- G5 **Billing modes** per tenant/depot: GECKO_REVENUE invoices or CHARGE_EXPORT to customer ERP/TOS billing (tariff still in Revenue).
- G6 **Tenant types**: DEPOT_OPERATOR and MNR_CONTRACTOR (repair vendor inside client depots, bills the depot).
- G7 **Global**: i18n everywhere (EN, TH, VI, ID, MS, ZH +), branch timezone, multi-currency + FX, tax + e-invoicing country adapters in Revenue (TH done; MY MyInvois, SG Peppol, ID Coretax, VN, PH, IN, EU Peppol), units mm/inch, data residency via DataPlacement regions, PDPA/GDPR, SSO.
- G8 Editions/packaging + self-service onboarding.
Tasks v0.5:
- [x] lib.js version 0.5; companion docs list incl. 05
- [x] NEW doc 05 `05_Gecko_Repair_Global_Product_and_Integration.docx` (build/05_global_integration.js)
- [x] doc 01: positioning, scope, new modules R17 Intake & Visit, R18 Integration Hub, R19 Contractor mode, global rules
- [x] doc 02: D-decisions revised (no TOS dependency), schemas intake + integ, settings, contracts/events via gateway
- [x] doc 03: decisions G1–G8, architecture (connectors worker host, plug-in kit), re-phased plan, FE i18n
- [x] doc 04: scorecard + areas O Integration/plug-in, P Globalisation, Q Commercial/onboarding; benchmark repositioned
- [x] rebuild all 5, brand check, update this TODO
- [x] v0.5 built 25 Nov: 5 docx (new doc 05), ~39-week phase 1 incl. intake/integration core (P2) and plug-in kit + contractor mode (P11); brand check clean
- [x] USER REVIEW done 25 Nov: user approved doc 05 ("clean, better way to build it") → G1–G8 confirmed. GO for database.

## DB scripts (started 25 Nov) — see `docs/database/TODO_DB.md` for the per-script checklist
- [ ] (not asked yet) commit — only if the user asks

## Next steps after v0.2 (when the user says go)
- P0 Foundation: Gecko.Repair projects + Gecko.Repair.Api host, gecko_repair 00–02 scripts, identity MNR permission/role scripts, `docs/database/` folder + REPAIR_RUN build (copy Fleet `_build`).

## v0.6 — rename mnr -> repair in docs 01–05 + UI prompt (25 Nov, owner picked option 2 after DB P12)
Names follow what the database actually built (docs/database README decision 1): repair.* permissions, REPAIR_* roles / series / code lists, tariff.container_repair_rate(_tier), billing.container_repair_charge, IContainerRepairRating / IContainerRepairChargeIntake. Module code MNR, product name "GECKO M&R" and the repo path web.mnr.gecko-api stay.
- [x] rename script over build/*.js (scratch rename_v06.py, v0.5 sources backed up to scratch build_v05_backup); seeded codes kept only as history. Left on purpose: module code MNR, repo path web.mnr.gecko-api, real folders /gecko-mnr-specs and mnr-services-c#
- [x] content fixes found on the way: tier = own tariff.container_repair_rate_tier; SURCHARGES marked OPEN (rate_condition is TOS_RATE only, no M&R surcharge table yet: decide before backend P4); revenue 80 comment repo path fixed
- [x] doc 02 §9 script set -> as-built run order 001–045 (doc 03 phases)
- [x] cover version 0.6 (lib.js)
- [x] v0.6 built 25 Nov: 5 docx rebuilt; text check of each docx: only module code MNR, repo path, real folder names and the seeded-code history remain; brand check clean. UI prompt needed no change (only the repo path)
