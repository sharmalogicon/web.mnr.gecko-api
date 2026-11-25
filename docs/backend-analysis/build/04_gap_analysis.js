const { H1, H2, P, bullets, T, callout, cover, build } = require('./lib');

const gapTable = (rows) => T(['Gap', 'Why it matters', 'How to fill it (data · API · UI)', 'Priority', 'Phase'], rows, [18, 22, 42, 9, 9], { size: 14 });

const content = [
  cover('Enterprise Gap Analysis', 'Current GECKO M&R UI compared with global depot M&R and terminal products, and how to close the gaps', 'GR-04 Gap Analysis'),

  H1('1. Purpose and method'),
  P('This document compares the current GECKO M&R web UI (62 routes on seed data) and the back end planned in documents 01–03 against the capabilities buyers expect from established depot and terminal M&R products. For each gap it proposes how to close it in Gecko. The benchmark set is the competitor list in the project brief; the capability descriptions are those generally expected in the category, not a feature-by-feature audit of each product.'),
  H2('1.1 Benchmark set'),
  ...T(['Category', 'Representative products', 'What they set the bar for'], [
    ['Terminal & depot operating systems with M&R', 'Navis (N4 and depot offerings), TideWorks, CYBERLOGITEC OPUS', 'Integrated gate → survey → estimate → repair → release; EDI with lines and lessors; yard integration; enterprise reporting'],
    ['Depot-focused cloud platforms', 'ContainerChain, DBR BoxOps', 'Depot booking and release, liner/lessor collaboration portals, mobile survey with photos, fast onboarding'],
    ['Lessor / carrier side', 'Lessor estimate portals and EDI (DESTIM / estimate messages), carrier M&R desks', 'Standard CEDEX coding, IICL criteria, labour/material split, authorisation numbers, owner/user responsibility, photo evidence'],
    ['Standards', 'CEDEX (ISO 9897), IICL-6/7, ISO 6346, CSC/ACEP, ATP, EFTCO ECD', 'Shared vocabulary that makes estimates exchangeable and auditable'],
  ], [24, 33, 43]),
  H2('1.2 Maturity scale'),
  ...T(['Level', 'Meaning'], [
    ['0 — Absent', 'No screen and no data model'],
    ['1 — Screens only', 'UI exists on seed data; no persistence, no business logic beyond display'],
    ['2 — Transactional', 'Records persisted with validation and CRUD'],
    ['3 — Managed', 'Workflow, approvals, pricing, integration with gate and billing, KPIs'],
    ['4 — Optimised', 'Automation, portals/EDI, mobile/offline, analytics and benchmarking'],
  ], [22, 78]),

  H1('2. Scorecard'),
  P('"Current" is the UI today. "Planned" is the level after the execution plan (document 03, about 39 weeks). "Target" is the level GECKO M&R should reach over 12–18 months to compete.'),
  ...T(['#', 'Capability area', 'Current', 'Planned', 'Target', 'Biggest gaps'], [
    ['A', 'Equipment registry & certification', '1.5', '3', '4', 'One registry with TOS, test/certificate due list, CSC_EXP automation, lessor ownership'],
    ['B', 'Survey & inspection', '1.5', '3', '4', 'Checklist and photos persisted, joint/off-hire surveys, offline mobile, photo annotation'],
    ['C', 'Damage coding & standards', '1', '3', '4', 'Real CEDEX/IICL tables, validity matrices, lessor-specific criteria'],
    ['D', 'Estimating & pricing', '1.5', '3', '4', 'Labour/material split, quantity, tariff slabs, lessor tariffs, revisions, supplementary'],
    ['E', 'Approval & owner collaboration', '1', '3', '4', 'Authorisation numbers, partial approval, portal, EDI estimates, aging'],
    ['F', 'Repair execution & workshop', '0.5', '3', '4', 'Work orders, technician time, QC, write-back to TOS'],
    ['G', 'Cleaning & tank services', '1', '3', '4', 'Bays, chemicals, certificates, cargo compatibility, EFTCO'],
    ['H', 'Reefer PTI', '1.5', '3', '4', 'PTI jobs and results, controller downloads, PTI dates in reefer reports'],
    ['I', 'Parts & materials', '1', '3', '3.5', 'Barcode scanning, kits, SAP B1 posting'],
    ['J', 'Billing & commercial', '1', '3', '4', 'Charges by responsibility, lessor billing, contracts, statements'],
    ['K', 'EDI & integration', '0', '3', '4', 'Six liners via the EDI service; lessor formats, webhooks, portals later'],
    ['L', 'Analytics & reporting', '1', '3', '4', 'Turnaround, aging, cut rate, margin, repeat damage, benchmarking'],
    ['M', 'Platform (tenancy, RBAC, audit, i18n, mobile)', '0.5', '3', '4', 'Auth, depot scoping, audit history, offline PWA, TH/MS/ZH'],
    ['N', 'Damage visualisation (2D/3D)', '0.5', '3.5', '4', 'Detailed per-type 3D models from phase 1; mobile marking in phase 2'],
    ['O', 'Independence & TOS integration', '0', '3', '4', 'Equipment visit owned by Repair, yard gateway, integration hub; vendor TOS adapters in phase 2 (doc 05)'],
    ['P', 'Pluggability & ecosystem', '0', '3', '4', 'Public API, webhooks, SSO, deep links, web components, connector SDK'],
    ['Q', 'Globalisation & compliance', '1', '3', '4', 'i18n, time zones, FX, units, residency; e-invoicing adapters per country in phase 2'],
    ['R', 'Commercial readiness', '0', '2.5', '4', 'Editions, self-service onboarding, country packs, contractor tenants'],
  ], [4, 24, 9, 9, 9, 45], { size: 15 }),
  ...callout('Reading the scorecard', [
    'The UI is **wide and visually complete** but has no persistence, no workflow beyond the estimate submit/approve toggle, and several hard-coded detail sections. The planned back end brings the core loop (survey → estimate → approval → repair → billing) to level 3.',
    'Gecko\'s **structural advantage** over standalone depot tools is that TOS, Revenue and M&R share one platform: gate damage, holds, condition, tariff and invoice are one data path. With the v0.2 decisions, phase 1 now covers estimate **EDI with global liners (K)**, **parts stock (I)** and a **2D/3D damage map (N)**, three areas where depot buyers compare products directly. The remaining structural gap is **owner self-service (portal approvals) and offline mobile**, both planned for phase 2.',
  ], 'warn'),

  H1('3. UI structural gaps (current web app)'),
  P('These gaps come from the inventory of `web.mnr.gecko-api` and must be closed whatever happens with the enterprise features.'),
  ...T(['Gap', 'Evidence', 'Fix', 'Phase'], [
    ['No back end, auth or depot context', 'Synchronous seed repos; no API client, no middleware; approve records "CURRENT-USER"', 'Doc 03 §3.4: API client, Identity login, depot switcher, async repos', 'P0'],
    ['Survey answers and photos are lost', 'Checklist collected but not saved (Phase 5 D-05); photo slots are placeholders', 'survey_item + doc.attachment; upload with angles', 'P2'],
    ['Estimate line too thin', 'Single `costThb`, no quantity, `hours` does not affect price', 'Quantity, labour × rate, material, responsibility, price source', 'P4'],
    ['No case linking jobs', 'Survey, repair, cleaning, invoice are disconnected (roadmap B.11)', 'M&R case per container visit', 'P2'],
    ['Repair states stop at "approved"', 'In-progress/completed set by no UI action; Complete does nothing', 'Work order lifecycle + TOS write-back', 'P5'],
    ['Hard-coded detail sections', 'Repair work log, parts, cost summary; cleaning process and chemicals; invoice lines and payments; modification timeline', 'Wire to API entities', 'P4–P9'],
    ['Duplicated TOS concerns', 'Storage zones/per-diem, free-days grid, order type/movement/truck category on tariff cards', 'Read-only storage view; storage terms stay in TOS tariff; drop shipping defaults', 'P3'],
    ['Broken links', '/survey/[id]/edit, /storage/checkin, /storage/checkout, /emergency/new, /parts/orders, /billing/new', 'Build or remove (doc 03 §3.4)', 'P2–P8'],
    ['Stub standards', 'CEDEX tables, IICL-6 thresholds and checklists marked as stubs', 'Real tables in the code library', 'P1'],
    ['Users and surveyors are separate', 'surveyors.ts vs users.ts, no link', 'Identity users + technician profile', 'P1'],
    ['Invoice data as strings', '`amount: \'฿12,450.00\'`, display dates', 'Revenue invoice DTO', 'P6'],
    ['Exports and PDFs do nothing', 'ExportButton toast; Print/Download buttons without handlers', 'Server PDFs (GeckoPdf) and Excel (TabularReport)', 'P2–P9'],
  ], [20, 30, 38, 12], { size: 14 }),

  H1('4. Detailed gaps and how to fill them'),

  H2('A. Equipment registry & certification'),
  gapTable([
    ['Single container registry', 'Two registries drift; TOS and M&R must agree on owner and type', 'Use gecko_master equipment.container; Repair unit_profile only for technical data', 'Must', 'P1'],
    ['Test and certificate due list', 'Tank periodic tests, CSC exams and ATP plates expire; expired boxes must not be released', 'unit_test + nightly expiry job; CSC_EXP hold through TOS', 'Must', 'P1/P9'],
    ['Lessor ownership and lease status', 'Off-hire billing and owner approval depend on who owns the box', 'lessor_party on registry + lessor extension; lease pool later', 'Must', 'P1'],
    ['Unit history (360°)', 'Disputes and repeat damage need the full history', 'Case history per container across visits', 'Should', 'P2/P9'],
  ]),

  H2('B. Survey & inspection'),
  gapTable([
    ['Persisted checklists and photos', 'Evidence for owners and disputes', 'survey_item, attachments with angle/stage/hash', 'Must', 'P2'],
    ['Joint and off-hire surveys with signatures', 'Lessor interchange requires both parties\' sign-off', 'JOINT type, owner surveyor, signature attachments', 'Must', 'P2'],
    ['Offline mobile survey', 'Yards have poor signal; surveyors work on tablets', 'PWA with offline queue (`client_ref`), background photo upload', 'Should', 'Ph 2'],
    ['Damage marking on a 2D/3D container image', 'Faster, clearer damage location; owners approve from the picture', 'Container models + face zones + damage marks; shared 2D/3D component (see N)', 'Must', 'P1–P2'],
    ['Gate damage hand-over', 'Re-keying gate damage wastes time and loses evidence', '`ContainerSurveyed` event; copy gate damage lines and photos', 'Must', 'P2'],
  ]),

  H2('C. Damage coding & standards'),
  gapTable([
    ['Real CEDEX dictionary and validity', 'Wrong codes are rejected by lessors and EDI', 'MasterData CEDEX tables completed; location–component and component–repair matrices', 'Must', 'P1'],
    ['IICL-6/7 criteria', 'Off-hire responsibility depends on them', 'code.iicl_threshold with criterion and source; lessor-specific overrides', 'Must', 'P1'],
    ['Repair standards per lessor', 'Lessors publish their own repair limits and methods', 'Lessor-scoped thresholds and tariff schedules', 'Should', 'P3/Ph 2'],
  ]),

  H2('D. Estimating & pricing'),
  gapTable([
    ['Labour/material split with quantity', 'Required by lessors, invoices and EDI', 'est.estimate_line fields; IContainerRepairRating', 'Must', 'P4'],
    ['Tariff slabs and limits', 'Hours by damage size; caps on overrides', 'Revenue rate_tier DIMENSION/QUANTITY; max hours/qty; adjustable flag', 'Must', 'P3'],
    ['Revisions and supplementary estimates', 'Hidden damage is common; owners approve the delta', 'Revision chain; supplementary kind', 'Must', 'P4'],
    ['Estimate templates / quick lines', 'Speed for frequent repairs (patch, straighten)', 'Favourite line sets per depot', 'Could', 'Ph 2'],
    ['Margin visibility', 'Depots price against vendor and internal cost', 'Vendor cost cards + labour cost rates; margin per case', 'Should', 'P8'],
  ]),

  H2('E. Approval & owner collaboration'),
  gapTable([
    ['Authorisation numbers and partial approval', 'Lessors pay only approved lines with their reference', 'estimate_approval with per-line decisions', 'Must', 'P4'],
    ['Approval aging and reminders', 'Boxes waiting for approval are idle stock', 'Aging inquiry + Notification reminders', 'Must', 'P4/P9'],
    ['Liner/lessor portal approval', 'Removes e-mail round trips for owners not on EDI', 'Gecko.Portal reads IRepairCaseReader; approve/reject per line; counterparty gate already exists', 'Should', 'Ph 2'],
    ['Pre-approved limits per owner', 'Owners often pre-authorise repairs under an amount', 'Owner policy: auto-approve below limit, recorded as channel AUTO_LIMIT', 'Should', 'Ph 2'],
  ]),

  H2('F. Repair execution & workshop'),
  gapTable([
    ['Work orders from approved lines', 'Only approved work may be done and billed', 'work.work_order + tasks', 'Must', 'P5'],
    ['Technician time and productivity', 'Labour cost and planning', 'wo_labour; technician view', 'Must', 'P5'],
    ['QC and post-repair survey', 'Release only checked boxes', 'QC sign-off + POST_REPAIR survey', 'Must', 'P5'],
    ['Automatic condition restore and hold release', 'Clerks forget, boxes stay blocked', 'ITosRepairOutcome; ReleaseSource MNR', 'Must', 'P5'],
    ['Repair yard planning', 'Move boxes to the right repair bay/stack', 'TOS yard jobs for M&R yard (yard type MNR)', 'Could', 'Ph 2'],
  ]),

  H2('G. Cleaning & tank services'),
  gapTable([
    ['Cleaning jobs with bays and steps', 'Throughput and compliance', 'clean.* tables', 'Must (if in scope)', 'P7'],
    ['Cleaning certificate', 'Required by shippers of food and chemicals', 'Certificate PDF; EFTCO ECD layout later', 'Must (if in scope)', 'P7'],
    ['Last-cargo compatibility', 'Food after chemicals needs special cleaning', 'Compatibility matrix → required cleaning type', 'Could', 'Ph 2'],
  ]),

  H2('H. Reefer PTI'),
  gapTable([
    ['PTI job and results', 'Reefers cannot be released without a valid PTI', 'reefer.pti_job + results; certificate', 'Must (if in scope)', 'P7'],
    ['PTI dates in TOS reefer reports', 'Reports print them blank today (gap D8)', 'IRepairCaseReader.LastPti', 'Should', 'P7'],
    ['Controller data download', 'Evidence of PTI quality', 'Attach controller files; parse later', 'Could', 'Ph 2'],
  ]),

  H2('I. Parts & materials'),
  gapTable([
    ['Stock ledger with average cost', 'Real material cost and availability (decided Q9)', 'part.* in gecko_repair (Fleet inv.* pattern)', 'Must', 'P6'],
    ['Purchasing and vendor bills', 'Control spend and subcontractors (Q9, Q10)', 'PO → receipt; vendor bills matched to receipts and sublet lines; CSV export, SAP B1 later', 'Must', 'P6/P10'],
    ['Barcode scanning and kits', 'Speed at issue and count', 'Material barcodes; repair kits per repair code', 'Could', 'Ph 2'],
  ]),

  H2('J. Billing & commercial'),
  gapTable([
    ['Charges by responsibility', 'Owner and user pay different parts of one estimate', 'Bill-to from responsibility; separate releases', 'Must', 'P6'],
    ['Lessor billing with authorisation numbers', 'Lessors reject invoices without them', 'Authorisation no. on charge lines and invoice lines', 'Must', 'P6'],
    ['Versioned contracts and surcharges', 'Commercial terms change over time', 'Revenue schedule versions and rate conditions', 'Must', 'P3'],
    ['Multi-currency and regional tax', 'MY/SG depots (MYR/SGD, SST, GST)', 'Revenue FX and tax engine', 'Should', 'Ph 2'],
    ['E-invoicing', 'Thai e-Tax today; SG InvoiceNow, MY MyInvois later', 'Revenue e-Tax (exists for TH)', 'Must (TH)', 'P6'],
  ]),

  H2('K. EDI & integration'),
  gapTable([
    ['Estimate EDI with global liners (Maersk, ONE, CMA CGM, COSCO SHIPPING, Wan Hai and HMM)', 'Global liners approve only by EDI (decided Q7)', 'Repair keeps hand-off tables (exch.edi_outbound / edi_inbound); the GECKO EDI service does mapping, transport and certification in its own phase (Q22)', 'Must', 'P8 + EDI phase'],
    ['Estimate EDI with lessors', 'Large lessors also exchange estimates electronically', 'Same hand-off tables; lessor partners set up in the EDI service', 'Should', 'Ph 2'],
    ['CODECO with condition', 'Lines expect gate messages with damage status', 'TOS/EDI already handle CODECO; ensure condition after repair flows', 'Should', 'Ph 2'],
    ['Webhooks and open API', 'Integration with customer systems', 'Published OpenAPI; webhook subscriptions for case events', 'Could', 'Ph 2'],
  ]),

  H2('L. Analytics & reporting'),
  gapTable([
    ['Turnaround and aging KPIs', 'The core depot performance measures', 'case_event clocks; dashboard', 'Must', 'P9'],
    ['Cut rate and margin by owner', 'Commercial negotiation with lines and lessors', 'Approved vs estimated; sell vs cost', 'Should', 'P9'],
    ['Repeat damage detection', 'Quality and customer disputes', 'Same container + component within N days', 'Should', 'P9'],
    ['BI export', 'Group-level analytics', 'Reporting views + Parquet export (platform)', 'Could', 'Ph 2'],
  ]),

  H2('N. Damage visualisation (2D/3D)'),
  gapTable([
    ['2D unfolded view with marks', 'The common depot picture; printable on PDF estimates', 'SVG faces from container models; marks normalised per face', 'Must', 'P1–P2'],
    ['3D view with detailed per-type models', 'Faster orientation for approvers and customers; a visual differentiator (decided Q19)', 'react-three-fiber; procedural detailed models (corrugation, rails, castings, door gear, reefer unit, tank barrel) from exact ISO dimensions; same marks projected on faces', 'Must', 'P1–P2'],
    ['Marks carried from survey to estimate to work order', 'One picture across the whole case', 'source_mark_id chain; repaired state after QC', 'Must', 'P4/P7'],
    ['Mobile marking and photo-textured models', 'Field use; extra realism', 'Same mark format offline; optional glTF per type', 'Could', 'Ph 2'],
  ]),

  H2('M. Platform'),
  gapTable([
    ['Fine-grained RBAC and maker-checker', 'Enterprise buyers require segregation of duties', 'repair.* permissions, approval policy, maker-checker', 'Must', 'P0/P4'],
    ['Audit history view', 'Who changed an estimate and when', 'Audit trail + temporal history; History tab', 'Should', 'P9'],
    ['Languages', 'TH now; MS/ZH for regional depots', 'EN/TH keys for every label; others later', 'Must (TH)', 'every phase'],
    ['Multi-depot tenants', 'Operators run several depots', 'Branch scoping + tenant roll-up', 'Must', 'P0'],
  ]),

  H2('O–R. Independence, pluggability, globalisation, commercial (v0.5)'),
  P('The full analysis is in document 05 (§12 global readiness scorecard). Summary of the gaps and how they close:'),
  gapTable([
    ['Hard dependency on Gecko TOS', 'Blocks every non-Gecko depot', 'Repair-owned equipment visit; yard gateway (GECKO_TOS, CONNECTOR, STANDALONE)', 'Must', 'P2'],
    ['No way to integrate other TOS/depot platforms', 'Navis, OPUS, ContainerChain sites cannot buy', 'Integration hub, canonical events, REST/webhook/CSV connectors; vendor adapters with first customers', 'Must', 'P2 / Ph 2'],
    ['Not embeddable', 'TOS vendors and customer IT want M&R inside their screens', 'Public API, webhooks, SSO, deep links, web components', 'Must', 'P11'],
    ['No contractor product', 'M&R vendors are a separate buyer group', 'Tenant type REPAIR_CONTRACTOR, client depots, work requests', 'Should', 'P11'],
    ['Single country', 'SEA and beyond need local tax, e-invoicing, language, currency', 'Country packs; e-invoicing adapters in Revenue; CHARGE_EXPORT fallback', 'Must', 'P0–P6 / Ph 2'],
    ['No packaging or onboarding', 'Low-touch sales to many small depots', 'Editions, setup wizard, import templates', 'Should', 'P0 / P11'],
  ]),

  H1('5. New UI pages to add'),
  ...T(['Route (proposed)', 'Purpose', 'Phase'], [
    ['/cases, /cases/[id]', 'M&R case list and file (timeline, surveys, estimates, WOs, charges)', 'P2'],
    ['/repair/[id]/estimate (editor), /repair/[id]/approval', 'Line editor with pricing; owner approval record', 'P4'],
    ['/work-orders, /work-orders/[id], /technician', 'Workshop execution', 'P5'],
    ['/approvals (aging)', 'Estimates waiting for owners, by age and amount', 'P4'],
    ['/charges', 'Unreleased charges and release batches', 'P6'],
    ['/settings/code-library/*', 'IICL thresholds, checklists, validity matrices', 'P1'],
    ['/settings/approval-policy, /settings/number-series, /settings/technicians', 'Setup', 'P0–P5'],
    ['/tariff/lessor', 'Lessor contract schedules', 'P3'],
    ['/units/expiring', 'Certificate and test due list', 'P9'],
    ['/emergency/new', 'Report an incident (linked today, missing)', 'P10'],
    ['/parts/orders, /parts/receipts, /parts/stock-documents, /parts/counts, /parts/reorder', 'Purchasing and stock control', 'P6'],
    ['/settings/owner-profiles, /settings/edi-partners, /edi/exceptions', 'Owner coding/channel/billing terms; EDI', 'P4/P8'],
    ['/vendor-bills', 'Subcontractor and supplier bills matched to work', 'P10'],
  ], [32, 55, 13], { size: 15 }),

  H1('6. Gap-closure roadmap'),
  ...T(['Horizon', 'Focus', 'Main deliverables'], [
    ['Phase 1 (about 39 weeks, doc 03)', 'Core M&R loop on the platform', 'Auth and depots, code library with real standards, 2D/3D damage map, gate-to-case hand-over, surveys with photos, Revenue repair tariff, estimates with PDF and EDI approvals, billing on approval by responsibility, parts stock and purchasing, work orders with TOS write-back, cleaning/PTI/tank tests, sublet and vendor bills, KPIs and reports'],
    ['Phase 2 (months 10–15)', 'Global roll-out, owner collaboration and mobility', 'Vendor TOS adapters (Navis N4, OPUS, ContainerChain) with first customers, country packs and e-invoicing adapters (MY, SG, ID, VN, PH), liner/lessor portal approvals, owner pre-approval limits, offline surveyor/technician app with the same damage map, lessor EDI, SAP B1 for vendor bills, barcode scanning, multi-currency MY/SG, CODECO with condition, BI export'],
    ['Phase 3 (months 12–18)', 'Electronic exchange and optimisation', 'Lessor EDI formats, controller data parsing, cargo compatibility, cross-depot benchmarking, AI assistance (damage suggestion from photos, line suggestions from history)'],
  ], [22, 26, 52], { size: 15 }),
  ...callout('Recommendation', [
    'Lock Phase 1 to the core loop plus the "Must" items above, because the **gate-to-repair-to-invoice data path is what standalone depot tools cannot offer**. With EDI for global liners already in phase 1, invest first in phase 2 in **portal approvals for the owners not on EDI** and the **offline surveyor app** (decided Q14), which reuses the damage map and mark format built in phase 1.',
  ], 'ok'),

  H1('7. Standards worth adopting'),
  ...bullets([
    '**CEDEX** (ISO 9897) location, component, damage and repair codes as the only coding on estimate lines.',
    '**IICL-6/7** inspection criteria for owner vs user responsibility, with lessor-specific overrides.',
    '**ISO 6346** container identification and size-type codes (already validated by MasterData).',
    '**CSC / ACEP** examination rules; **ATP** for reefers; tank periodic tests (2.5/5-year) for IMO tanks.',
    '**EFTCO ECD** for tank cleaning documents.',
    'UN/EDIFACT estimate and gate messages (DESTIM, CODECO) for electronic exchange with lines and lessors.',
  ]),
];

build('04_Gecko_Repair_Enterprise_Gap_Analysis.docx', 'Enterprise Gap Analysis', content);
