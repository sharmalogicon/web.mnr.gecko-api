# gecko_repair database — TODO / resume log

Read this first after a crash. Update after every step. Process = the Fleet one (README.md).

## STATUS BOARD (updated 25 Nov, after P12 — database design complete) — phases = doc 03 execution plan numbering
Run-file labels drifted from doc 03: runs tagged P3 include the tariff (doc P4), runs tagged P4 = doc P5, runs tagged P5 = doc P6. Use THIS table.

| Doc 03 phase | Weeks | DB scripts | Runs | Database | App code (C# / API / UI wiring) |
|---|---|---|---|---|---|
| P0 Foundation & global basics | 1–3 | identity 60, 61; repair 00, 01, 02, 91 | 001–007 | DONE | not started |
| P1 Code library, detailed models, TH pack | 4–7 | master 80; repair 03, 04 | 008–011 | DONE | not started |
| P2 Intake & integration core | 8–11 | repair 05, 06, 07 | 012–015 | DONE | not started |
| P3 Cases, surveys & damage marking | 12–15 | repair 08, 09, 10 | 016–019 | DONE | not started |
| P4 Repair tariff (Revenue) | 16–17 | revenue 80 | 020–021 | DONE | not started |
| P5 Estimates, owner profiles, approvals, EDI hand-off | 18–20 | repair 11, 12, 14 | 022–024, 029–030 | DONE | not started |
| P6 Billing modes | 21–22 | revenue 81; repair 13 | 025–028 | DONE | not started |
| P7 Parts & stock | 23–26 | repair 15, 16 | 031–033 | DONE | not started |
| P8 Work orders & write-back | 27–29 | repair 17 | 034–035 | DONE | not started |
| P9 Cleaning, PTI & tank tests | 30–32 | repair 18 | 036–037 | DONE | not started |
| P10 Sublet, vendor bills, modifications, incidents | 33–34 | repair 19 | 038–039 | DONE | not started |
| P11 Plug-in kit & contractor mode | 35–37 | repair 20 (no identity change) | 040–041 | DONE (webhooks / API clients in P2) | not started |
| P12 Dashboard, inquiry, reports | 38–39 | repair 21 audit + 22 rpt (16 views) | 042–045 | DONE | not started |

Totals: database 13 of 13 phases done (P0–P12) + surcharge follow-up. 47 run files applied locally; nothing on Azure; nothing committed.
Objects: gecko_repair 88 tenant tables + 3 database-wide audit tables + 54 history tables + 16 rpt views; revenue +5 tables; master +8 code lists; identity +56 permissions, +6 roles, +1 plan.
NEXT: database design done. Waiting for the owner: commit to git / docs v0.6 rename / backend code from P0 / Azure run. Later: audit retention-on script (trucking 35 pattern) once the archive worker runs.

## How
- Sources here; `python _build/build_run_folder.py` → `D:\SHARMA\PROJECT\gecko\database\REPAIR_RUN\` (+ RUN_ORDER.md, run_local.ps1).
- Local run: `cd ...\REPAIR_RUN; .\run_local.ps1` (logs to RUN_LOG.md). Never renumber; Azure-applied files are frozen.
- NAMING (owner, 25 Nov): everything Repair creates is named **repair** (repair.* permissions, REPAIR_* roles / series / code lists, tariff.container_repair_*). Only the platform MODULE code stays MNR.
- RESERVED number blocks on shared DBs (Freight takes numbers concurrently): identity **60–69**, master **80–89**, revenue **80–89**. Used: identity 60, 61; master 80; revenue 80.
- Bash heredocs with apostrophes break: write helper .py with the Write tool (scratchpad).

## P0 Foundation (runs 001–007)
- [x] 00_gecko_identity/60_repair_permissions.sql (56 repair.* codes, keeps the 2 seeded)
- [x] 00_gecko_identity/61_repair_roles_and_plans.sql (Essentials/Professional/Enterprise, CASES/USERS limits, SCT/SCT1 TRIAL, 6 role templates, grants, guards, backfill)
- [x] 10_gecko_repair/00_create_database.sql (25 schemas incl. intake, integ)
- [x] 10_gecko_repair/01_security_foundation.sql (copied from Fleet, Repair schema list)
- [x] 10_gecko_repair/02_config.sql (number_series REPAIR_*, repair_setting, approval_policy repair.%, labor_cost_rate REPAIR_TRADE)
- [x] 10_gecko_repair/91_rls_policy.sql (copied from Fleet, Repair schema lists)
- [x] _build (builder + manifest + run_local.ps1)
- [x] build run folder
- [x] 25 Nov: backup gecko_identity_before_repair_P0_20261125.bak (copy-only, MSSQL17.APPIFY Backup folder); 001–007 applied locally on DESKTOP-6AQI384\APPIFY; second run added nothing (idempotent)
- [x] verified: gecko_app with no tenant sees 0 rows; usp_next_number -> EOR-SCT1-2611-00001, -00002; FLT_WO refused (547); SCT/SCT1 MNR TRIAL PROFESSIONAL to 2027-08-22; existing SSS/SSS-LCB01 MNR ACTIVE STARTER also got the 6 roles; template counts MANAGER 56, OWNER 56, OPS 54, SUPERVISOR 23, VIEWER 19, ESTIMATOR 12, SURVEYOR 10, ACCOUNTS 9, STOREKEEPER 9, TECHNICIAN 6

## P1 Standards and units (runs 008–011) — DONE 25 Nov
- [x] 01_gecko_master/80_repair_code_lists.sql (REPAIR_TRADE, UNIT_TEST_TYPE (closed), CLASS_SOCIETY, CLEANING_TYPE, CLEANING_BAY_CAPABILITY, MATERIAL_CATEGORY, MODIFICATION_TYPE, INCIDENT_TYPE; 61 values)
- [x] 10_gecko_repair/03_unit.sql (unit_profile, unit_test)
- [x] 10_gecko_repair/04_code.sql (iicl_threshold, location_component, component_repair, checklist_template/item, container_model, container_model_iso, model_face, face_zone)
- [x] 91 re-run (011): 16 tenant tables, 11 history tables, all guards pass
- [x] verified (rolled back): valid 40HC model + LEFT face accepted; non-orthogonal face, DRY unit with tank pressure, GLTF without file all refused
- Deferred to P4 (owner profiles): party lessor extension in gecko_master (not needed before owner profiles)
- Standard catalogue (IICL-6 limits, CEDEX pairs, checklists, 10 procedural models + faces + zones) = C# RepairStandardsCatalogue, written per tenant by setup/initialize (not SQL)

## P2 Intake + integration core (runs 012–015) — DONE 25 Nov
- [x] 10_gecko_repair/05_intake.sql (config.depot_profile, intake.equipment_visit, visit_event (A), depot_hold)
- [x] 10_gecko_repair/06_integ.sql (connector, connector_health, code_map, inbound_event (P), outbound_event (P), delivery_log (A,P), webhook_subscription, api_client; column-level DENY UPDATE on payload columns)
- [x] 10_gecko_repair/07_outbox_inbox.sql (outbox.message + procs = platform design; inbox.processed append-only)
- [x] 91 re-run (015): 30 tenant tables, 18 history tables, all guards pass; re-run 012–015 = no changes
- [x] verified as gecko_app under a tenant (rolled back): CONNECTOR depot without connector refused; duplicate inbound refused; raw payload edit refused, status edit allowed; second IN_DEPOT visit refused; TOS visit id on MANUAL refused; visit_event edit refused; second active DAMAGE hold refused; duplicate outbound refused; outbox insert ok / read refused; duplicate inbox refused; cross-tenant insert refused

## P3 Case, survey, damage map, tariff (runs 016–021) — DONE 25 Nov
- [x] 10_gecko_repair/08_mcase.sql (repair_case on equipment_visit, one open case per visit; case_event A)
- [x] 10_gecko_repair/09_survey.sql (survey with supersede chain + YARD_SYSTEM copies by source ref; survey_item; survey_damage coded OR described)
- [x] 10_gecko_repair/10_doc.sql (doc.attachment: blob path + sha256, no SAS, hide-not-delete; doc.damage_mark: POINT/RECT/POLYGON, model version, copy chain)
- [x] 91 re-run (019): 37 tenant tables, 22 history tables, guards pass
- [x] 02_gecko_revenue/80_repair_tariff.sql (tariff.container_repair_rate REPAIR/SERVICE/LABOUR under tariff.schedule module MNR; own tariff.container_repair_rate_tier because rate_tier/rate_condition are CHECKed to TOS_RATE) + revenue 08_rls_policy re-run (021: +8 predicates). Backup gecko_revenue_before_repair_P3_20261125.bak taken first.
- [x] verified (rolled back): second open case per visit refused; CLOSED without closed_at refused; survey completion without outcome refused; damage with neither code nor description refused, description-only accepted; rect off the face refused; SAS URL in blob_uri refused; REPAIR rate accepted, SERVICE with CEDEX axis refused, LABOUR without time band refused
- Independence: TOS-specific refs from doc 02 (gate_survey_id, tos_survey_damage_id) replaced by generic source_survey_ref / source_damage_ref + inbound_event_id

## RENAME mnr -> repair (25 Nov) — DONE
- [x] sources renamed (identity 60/61, master 80, revenue 80_repair_tariff with tariff.container_repair_rate(_tier) — "container_" because Fleet already owns tariff.repair_rate_card/line); codes, roles, series, code list REPAIR_TRADE, unit.repair_status
- [x] identity 60 switches the 07-seeded mnr.survey.manage / mnr.repair.approve OFF (replaced by repair.survey.manage / repair.estimate.approve)
- [x] local cleanup (scratch cleanup_mnr_names.sql + cleanup_part2.sql): mnr rows deleted from identity/master, revenue mnr tables dropped, gecko_repair dropped; REPAIR_RUN + RUN_LOG reset; runs 001–021 re-applied; verify_p0..p3 all pass; no mnr-named table/column left
- Contracts renamed in plan: IContainerRepairRating, IContainerRepairChargeIntake, billing.container_repair_charge (Fleet already has IRepairRating)
- [x] backend-analysis docs 01–05 renamed to repair naming = v0.6 (25 Nov); doc 02 §9 now lists the as-built runs 001–045. (surcharge gap closed: runs 046–047)

## P4 Estimates, approvals, owner profiles (runs 022–024) — DONE 25 Nov
- [x] lessor extension in gecko_master NOT needed (owner kind + approval contacts in config.owner_profile; BIC prefixes already in party.container_prefix)
- [x] 10_gecko_repair/11_owner_profile.sql (coding, channel + EDI partner / PDF e-mails, billing trigger, auto-approve limit, estimate currency, owner / user schedules; tenant-wide or depot override)
- [x] 10_gecko_repair/12_est.sql (estimate per revision with CHECKed totals + "internal approval before sending"; estimate_line coded-or-described, TARIFF needs rate ref / MANUAL needs reason, bill-to for non-depot lines; estimate_internal_approval A; estimate_approval A with channel evidence; estimate_status_log A)
- [x] 91 re-run (024): 43 tenant tables, 24 history tables, guards pass
- [x] verified (rolled back, as gecko_app): EDI owner without CEDEX refused; PDF owner without e-mails refused; split <> total refused; sending before internal approval refused; manual price without reason refused; USER line without bill-to refused; bad line total refused; internal approval edit refused; phone approval without approver refused

## P5(run label) = doc P6 Billing modes (runs 025–028) — DONE 25 Nov (started 25 Nov; owner confirmed: owner_kind LINER covers liners) — doc 02 §4.10 charge.*, revenue billing.container_repair_charge
- [x] 02_gecko_revenue/81_repair_charge.sql (billing.container_repair_charge + container_repair_invoice_line) — RUN 025 OK
- [x] revenue 08_rls_policy re-run (026): +7 predicates
- [x] 10_gecko_repair/13_charge.sql RUN 027 OK (charge.billable_item = charges-ready queue, one live row per source line; charge.charge_release (GECKO_REVENUE or CHARGE_EXPORT batch); charge.charge_release_line A)
- [ ] 91 re-run
- [x] verified (rolled back): second live billable item for one line refused (no double billing); RELEASED without a release refused; EXPORTED on a Gecko Revenue release refused; released line edit refused; Revenue replayed release line refused (idempotent intake)

## NEXT — close doc P5: EDI hand-off (exch.*) then doc P7 parts & stock
- [x] RUN 029/030 OK (first attempt failed: filtered index cannot use NOT IN -> IN list): 10_gecko_repair/14_exch.sql (exch.edi_outbound, exch.edi_inbound; EDI service login + grants per doc 02 §6.1)
- [x] exch verified (rolled back, incl. a temp gecko_edi member): duplicate live outbound refused; EDI can set status but not payload, cannot read other tables, cannot change inbound after insert; redelivered inbound refused; Repair applies inbound but cannot edit the received authorisation. NOTE for EDI phase: role gecko_edi has no member; cross-tenant polling under RLS to be decided then.
- [x] RUN 031 OK 10_gecko_repair/15_part_master.sql (material, material_uom, material_supplier, store, bin, material_store)
- [x] verified P7 (rolled back): second default store refused; positive ISSUE refused; ledger edit refused; double reversal refused; PO total <> subtotal + tax refused; unapproved PO cannot be sent; transfer without target / issue without WO / adjustment without reason refused
- [x] RUN 031/032/033 OK (91: 63 tenant / 38 history tables, guards pass) — 10_gecko_repair/16_part_stock.sql: (stock_ledger A,P, stock_balance, reservation, purchase_order(+line), goods_receipt(+line), stock_document(+line))

## P8 Work orders & write-back (runs 034–035) — DONE 25 Nov
- [x] 10_gecko_repair/17_work.sql: technician (+skill, clock-on), work_order (REPAIR_WO, cost roll-up, QC + completion rule), wo_task (one live task per estimate line), wo_labour (A, reversals), wo_sublet (approve before send), wo_status_log (A), qc_check (A), write_back (route GECKO_TOS/CONNECTOR/STANDALONE, one live per WO)
- [x] no work.wo_material: materials = part.stock_ledger ISSUE/RETURN rows with work_order_id / wo_task_id
- [x] 91 re-run (035): 72 tenant / 44 history tables, guards pass
- [x] verified (scratch verify_p8.sql, rolled back): contractor without vendor; 2nd WO per estimate; repair WO without estimate; line worked twice; assign without technician; labour cost <> hours x rate; labour edit; double labour reversal; sublet sent unapproved; complete before QC; cost roll-up mismatch; QC pass without survey; connector write-back SENT without outbound event; 2nd live write-back — all refused; completion after QC pass accepted

## P9–P11 (runs 036–041) — DONE 25 Nov (written by 3 parallel agents, run + verified by main session)
- [ ] P9 10_gecko_repair/18_clean_reefer.sql
- [x] P10 source written: 10_gecko_repair/19_vend_mods_incident.sql (vendor_rate_card/line, vendor_bill/line, mods.modification, incident.incident + incident_update A; incident adds CANCELLED; cancelling a bill must soft-delete its lines) — not yet run
- [x] P11 source written: 10_gecko_repair/20_client_depot.sql (config.client_depot; no identity change — tenant kind = config.repair_setting REPAIR_TENANT_KIND; one client depot per branch) — not yet run
- [x] manifest runs 036–041 applied first time (91 after each: 78/86 tenant tables, guards pass)
- [x] P9 blocker fixed in 18: part.stock_document gets cleaning_job_id/no; ck_stock_document__work_order replaced by ck_stock_document__job (ISS/RTN = exactly one of work order OR cleaning job)
- [x] NULL-trap bug found in verify: 7 CHECKs passed on NULL (UNKNOWN passes a CHECK). Sources 17/18/19 corrected (col IS NOT NULL AND col = x); local DB patched (scratch local_patch_null_checks.sql, logged in RUN_LOG); scan scratch null_trap.sql over all gecko_repair CHECKs now returns nothing
- [x] verified (scratch verify_p9_p11.sql + verify_p8.sql re-run, rolled back): 36 refusals as intended, 0 BAD

## P12 Dashboard, inquiry, reports (runs 042–045) — DONE 25 Nov
Split in two scripts (audit is its own platform pattern):
- [x] 10_gecko_repair/21_audit.sql: audit.activity (append-only LEDGER, same shape as tos 36 / trucking 33) + ledger_digest, ledger_verification, archive_file, archive_month (trucking 34 pattern; gecko_app DENIED). Retention-on script NOT written yet (owner: stays off until an archive run is verified; copy trucking 35 then)
- [x] 10_gecko_repair/22_rpt.sql (16 views): rpt.* views (case board, turnaround, approval aging, damaged stock, cut rate, WO margin, unreleased charges, repeat damage, cleaning/PTI throughput, WIP, certificate expiry, daily activity, connector SLA, stock value, vendor bill aging, depot KPI tiles)
- [x] manifest runs 042 (21) 043 (91) 044 (22) 045 (91) applied locally (91: 88 tenant tables, guards pass)
- [x] run fixes: ALTER DATABASE not allowed in the run-file transaction -> ALLOW_SNAPSHOT_ISOLATION moved to 00 (local set by hand, RUN_LOG); ledger_type self-check 2 -> 3; PRINT with subquery
- [x] verified (scratch verify_p12.sql, rolled back, 0 rows left): 21 good / 0 BAD — every view's numbers on sample data (clocks 48 h / 42 h / 8 d, cut 500 = 75%, margin 700, repeat damage 36 d, ATP overdue + tank due 20 d, KPI tiles), another tenant sees 0 rows through views and audit, ledger refuses UPDATE/DELETE, gecko_app denied integrity tables, cannot create objects. NULL-trap scan still empty

## Surcharges + commit (25 Nov, owner: "1 and after that work on 2")
- [x] 02_gecko_revenue/82_repair_surcharge.sql: tariff.container_repair_surcharge (PERCENT of LABOUR/MATERIAL/SERVICE/TOTAL xor FLAT per ESTIMATE/LINE, trigger, category/size, floor/cap, window; temporal) + revenue 08 re-run (+4 predicates); runs 046–047 (backup gecko_revenue_before_repair_surcharge_20261125.bak first)
- [x] 12_est: est.estimate_line + container_repair_surcharge_id, price_source TARIFF/MANUAL/SURCHARGE (idempotent block after the table; local DB patched with the same block, RUN_LOG)
- [x] verified (scratch verify_surcharge.sql, rolled back): 17 good / 0 BAD; NULL-trap scan clean on gecko_repair + gecko_revenue
- [x] docs 01/02 surcharges now built; doc 02 §9 has runs 046–047; docx 01 + 02 rebuilt
- [ ] commit docs/ to git (branch first, conventional commit, no secrets)
