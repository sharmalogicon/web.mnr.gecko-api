# Gecko Repair (M&R) — database scripts (SOURCES)

This folder holds the **source** scripts. You do not run these directly.
**What you run** is the numbered run folder `D:\SHARMA\PROJECT\gecko\database\REPAIR_RUN\` (see its `RUN_ORDER.md`),
generated from these sources by `_build/build_run_folder.py` using `_build/run_manifest.json`
(the Fleet process, copied). The same numbered files run on the local SQL Server first (`run_local.ps1`) and later on Azure SQL (SSMS, SQLCMD Mode).

House rules: `web.trucking.gecko-api/docs/database/CONVENTIONS.md` (no FKs, UUID PKs, tenant_id + fail-closed RLS, 7-column audit, annotations, idempotent).
Design: `docs/backend-analysis/02_Gecko_Repair_Database_Design.docx` (v0.5) and `05_Gecko_Repair_Global_Product_and_Integration.docx`.
Progress / resume: `TODO_DB.md`.

## Adding a script (every phase)
1. Write the source here (`10_gecko_repair/NN_x.sql`, or `00_gecko_identity/NN_x.sql` etc.).
2. Append an entry to `_build/run_manifest.json` with the next run number. Add another `91_rls_policy.sql` entry after any script that creates tables.
3. `python _build/build_run_folder.py`, then `.\run_local.ps1 -Server 'DESKTOP-6AQI384\APPIFY'` in REPAIR_RUN.
4. Never renumber. Once a run file has been applied on Azure it is frozen: fixes become new numbered files.

## Sources
| Source | Run | What it does |
|---|---|---|
| `00_gecko_identity/60_repair_permissions.sql` | 001 | 56 `repair.*` permission codes (module MNR); keeps the 2 seeded by identity 07 |
| `00_gecko_identity/61_repair_roles_and_plans.sql` | 002 | MNR plans Essentials (STARTER) / Professional / Enterprise + CASES/USERS limits, SCT pilot (§0), 6 Repair role templates, grants, guards, backfill |
| `10_gecko_repair/00_create_database.sql` | 003 (local only) + 004 | database (UTF-8, RCSI), 25 schemas, roles, schema_version, pf_month/ps_month |
| `10_gecko_repair/01_security_foundation.sql` | 005 | RLS predicate, tenant context proc, users, grants + DENY DELETE, deploy helpers (copied from Fleet) |
| `10_gecko_repair/02_config.sql` | 006 | number_series (REPAIR_*, + counter, usp_next_number), repair_setting, approval_policy (repair.%), labor_cost_rate |
| `10_gecko_repair/91_rls_policy.sql` | 007 (+ after each table script) | generated RLS policy + guards (copied from Fleet) |
| `01_gecko_master/80_repair_code_lists.sql` | 008 | 8 MNR code lists + 61 global starting values |
| `10_gecko_repair/03_unit.sql` | 009 | unit.unit_profile (technical data, PTI, M&R status projection), unit.unit_test |
| `10_gecko_repair/04_code.sql` | 010 (+ 011 = 91) | IICL thresholds, CEDEX pairs, versioned checklists, versioned damage-map models + ISO map + faces (2D layout, 3D placement) + zones |
| `10_gecko_repair/05_intake.sql` | 012 | config.depot_profile (yard source, billing mode, locale), intake.equipment_visit, visit_event (append-only), depot_hold |
| `10_gecko_repair/06_integ.sql` | 013 | integration hub: connector (+ health), code_map, inbound/outbound events (partitioned, write-once payload), delivery_log, webhooks, API clients |
| `10_gecko_repair/07_outbox_inbox.sql` | 014 (+ 015 = 91) | outbox.message (platform design) + inbox.processed |
| `10_gecko_repair/08_mcase.sql` | 016 | mcase.repair_case (visit-based, one open case per visit, SLA clocks), case_event (append-only) |
| `10_gecko_repair/09_survey.sql` | 017 | survey (supersede chain, yard-system copies), survey_item, survey_damage (CEDEX or description) |
| `10_gecko_repair/10_doc.sql` | 018 (+ 019 = 91) | doc.attachment (photos, signatures, certificates), doc.damage_mark (2D/3D map) |
| `02_gecko_revenue/80_repair_tariff.sql` | 020 (+ 021 = revenue 08_rls_policy) | tariff.container_repair_rate (REPAIR / SERVICE / LABOUR) + tariff.container_repair_rate_tier under tariff.schedule module MNR |
| `10_gecko_repair/11_owner_profile.sql` | 022 | config.owner_profile (coding, approval channel, billing trigger, auto-approve, schedules) |
| `10_gecko_repair/12_est.sql` | 023 (+ 024 = 91) | est.estimate (revisions), estimate_line, estimate_internal_approval, estimate_approval, estimate_status_log |
| `02_gecko_revenue/81_repair_charge.sql` | 025 (+ 026 = revenue 08_rls_policy) | billing.container_repair_charge (one per Repair release line) + container_repair_invoice_line |
| `02_gecko_revenue/82_repair_surcharge.sql` | 046 (+ 047 = revenue 08_rls_policy) | tariff.container_repair_surcharge (PERCENT xor FLAT, trigger, window); 12_est adds SURCHARGE estimate lines |
| `10_gecko_repair/13_charge.sql` | 027 (+ 028 = 91) | charge.billable_item (charges-ready queue, no double billing), charge_release (Revenue or export), charge_release_line (A) |
| `10_gecko_repair/14_exch.sql` | 029 (+ 030 = 91) | exch.edi_outbound / edi_inbound hand-off for the GECKO EDI service; role gecko_edi (no member yet) |
| `10_gecko_repair/15_part_master.sql` | 031 | part.material, material_uom, material_supplier, store, bin, material_store |
| `10_gecko_repair/16_part_stock.sql` | 032 (+ 033 = 91) | part.stock_ledger (A, P), stock_balance, reservation, purchase_order(+line), goods_receipt(+line), stock_document(+line) |
| `10_gecko_repair/17_work.sql` | 034 (+ 035 = 91) | work.technician(+skill), work_order, wo_task, wo_labour (A), wo_sublet, wo_status_log (A), qc_check (A), write_back |
| `10_gecko_repair/18_clean_reefer.sql` | 036 (+ 037 = 91) | clean.bay, cleaning_job, cleaning_step, chemical_usage (A); reefer.pti_job, pti_result; part.stock_document + cleaning_job_id |
| `10_gecko_repair/19_vend_mods_incident.sql` | 038 (+ 039 = 91) | vend.vendor_rate_card/line, vendor_bill/line; mods.modification; incident.incident, incident_update (A) |
| `10_gecko_repair/20_client_depot.sql` | 040 (+ 041 = 91) | config.client_depot (contractor mode, one per branch) |
| `10_gecko_repair/21_audit.sql` | 042 (+ 043 = 91) | audit.activity (append-only LEDGER, platform shape) + ledger_digest, ledger_verification, archive_file, archive_month (worker only) |
| `10_gecko_repair/22_rpt.sql` | 044 (+ 045 = 91) | 16 rpt views: case board + KPI clocks, approval aging, damaged stock, cut rate, WO margin, billable charges, repeat damage, WIP, cleaning/PTI daily, certificate expiry, daily activity, connector SLA, stock position, vendor bill aging, depot KPI tiles |

Default number series, settings and the standards catalogue (IICL limits, CEDEX pairs, checklists, damage-map models) per tenant are NOT a script: the Repair API writes them (`POST /api/repair/setup/initialize`).

## Decisions made while writing P0 (for review)
1. **Naming = repair** (owner, 25 Nov): repair.* permissions, REPAIR_* roles / series / code lists, tariff.container_repair_*; module code stays MNR. **Reserved script numbers**: identity 60–69, master 80–89, revenue 80–89 (Freight numbers concurrently).
2. **Editions**: the seeded MNR plan codes STARTER / PROFESSIONAL are kept (renaming codes would break entitlements); STARTER is displayed as *Essentials*; ENTERPRISE added. Prices are placeholders; existing prices untouched.
3. **CASES per month** is the usage metric, a soft limit (a container is never blocked at the gate by a subscription).
4. **Guards**: REPAIR_TECHNICIAN holds only labour, work-order view, cleaning and PTI codes. `repair.setup.manage` and `repair.integration.manage` are TENANT_OWNER / REPAIR_MANAGER only (OPS_MANAGER gets everything else).
5. **SCT pilot**: SCT / SCT1, PROFESSIONAL, 270-day TRIAL (to the MVP). Add depots in §0 of 51 when SCT confirms.
6. **Standards and models are per tenant** (guard 50332: no untenanted tables). The starting catalogue is C# and written by setup/initialize; tenants may add lessor limits and new versions.
7. **Versioning**: ACTIVE checklist templates and container models are never edited; one ACTIVE version per code (filtered unique index). Marks and surveys keep their version.
8. **Lessor party extension deferred to P4** (owner profiles); `owner_party_id/code` pairs already exist where needed.
9. **Secrets never in the database**: connectors and webhooks store a Key Vault secret NAME (`credential_ref`, `secret_ref`); API client secrets stay hashed in gecko_identity.
10. **Inbound / outbound events are work records**: payload columns are write-once (column-level DENY UPDATE), status columns move; no soft delete; partitioned monthly. Connector runtime state is in `integ.connector_health` so polling does not flood temporal history.
11. **One IN_DEPOT visit per container per tenant**; external visits are idempotent per (source, connector, external ref); a Gecko TOS visit id is allowed only on GECKO_TOS visits.
12. **M&R tariff under tariff.schedule (module MNR)**: PUBLIC = standard tariff, CONTRACT = one liner / lessor. Own tier table because tariff.rate_tier / rate_condition are CHECKed to TOS_RATE (additive-only). Rate rows carry repair axes only (no order type / movement / cargo / payment term — CLAUDE.md §4).
13. **No TOS-specific references** in case / survey / marks: generic source refs + inbound event instead of gecko_tos ids (G1).
14. **Evidence rules**: completed surveys are superseded, not edited; photos are hidden, not deleted; blob_uri never holds a signed URL.
15. **No lessor extension in gecko_master**: owner kind and approval contacts are M&R behaviour (config.owner_profile).
16. **Estimates**: a sent revision is never edited (new revision instead); totals are stored and CHECKed; nothing is sent before the internal approval chain is done; every owner decision is a new row with its evidence.
17. **EDI service access** is a role (gecko_edi) with grants only on the two hand-off tables; its login and cross-tenant polling are settled in the EDI phase.
18. **Filtered indexes cannot use NOT IN** — use an IN list of the wanted statuses (found on run 029).
19. **Materials on work orders** are the part.stock_ledger ISSUE / RETURN rows (work_order_id, wo_task_id); no separate work.wo_material.
20. **Write-back** is one work.write_back row per completion, routed by config.depot_profile.yard_source (GECKO_TOS via outbox, CONNECTOR via integ.outbound_event, STANDALONE applied to Repair's own register).
21. **NULL never satisfies a requirement**: a CHECK branch like `status <> 'X' OR col = 'Y'` passes when col is NULL (UNKNOWN passes). Write `col IS NOT NULL AND col = 'Y'`. Scan: scratch null_trap.sql (found 7 on 25 Nov, fixed).
22. **Contractor mode** = one branch per client site + config.client_depot; tenant kind is the Repair setting REPAIR_TENANT_KIND (no gecko_identity change).
23. **Stock issues** (ISS / RTN) name exactly one job: a work order or a cleaning job.
24. **ALTER DATABASE never goes in a run file**: run files are one transaction. Database options (READ_COMMITTED_SNAPSHOT, ALLOW_SNAPSHOT_ISOLATION) live in 00; later scripts only check them.
25. **Reports never add money across currencies**; tenant roll-up = the API summing rpt.vw_depot_kpi rows (no special view). Audit history retention stays OFF until an archive run is verified.
26. **Surcharges** are their own Revenue table (rate_condition is TOS_RATE only); an applied surcharge is an estimate line with price_source SURCHARGE + container_repair_surcharge_id, amount in sundry_amount.
