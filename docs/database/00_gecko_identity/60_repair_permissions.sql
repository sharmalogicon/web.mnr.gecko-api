-- ============================================================
-- GECKO IDENTITY — REPAIR (M&R) PERMISSIONS
-- Script: 60_repair_permissions.sql
-- Owner:  Identity & Access (codes requested by the Repair module, P0)
--
-- ROWS ONLY in iam.permission (a platform reference table: no tenant_id, not in
-- the RLS policy — 06 header). One code per decision an M&R screen makes, named
-- <module>.<area>.<action> like the fleet.* / freight.* codes (37, 45). Every
-- code carries module_code MNR, so a tenant without the MNR entitlement never
-- sees them in effect (RequireModule("MNR")).
--
-- NAMING: codes are repair.* (owner decision 2026-11-25: the naming convention
-- is "repair", not "mnr"); only the platform MODULE code stays MNR. The two
-- codes 07 seeded, mnr.survey.manage and mnr.repair.approve, are replaced by
-- repair.survey.manage and repair.estimate.approve and switched OFF here
-- (is_active = 0 — never deleted: 07 re-creates them on a re-run, and old
-- grants must stay explainable). Section 2 switches them off again each run.
--
-- REPAIR TARIFF USES revenue.* (decision Q4): the Repair rate cards are tables in
-- gecko_revenue (tariff.schedule module MNR + tariff.container_repair_rate), so editing /
-- approving them is revenue.tariff.manage / .approve; M&R roles get .view.
--
-- APPROVAL CODES are the values config.approval_policy.required_permission
-- holds in gecko_repair (ck_approval_policy__permission: must start repair.).
--
-- Role-template grants, plans, the SCT entitlement and the backfill are in 61.
-- REBUILD ORDER: 07 TRUNCATEs iam.role_template_permission; after any re-run
-- of 07, re-run the later permission scripts (14 onward) and then 60–61 again.
--
-- Idempotent. Safe to re-run. Run as sysadmin or a member of gecko_system.
-- ============================================================

USE gecko_identity;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

SET NOCOUNT ON;
GO

IF NOT (IS_ROLEMEMBER('gecko_system') = 1 OR IS_SRVROLEMEMBER('sysadmin') = 1)
BEGIN
    RAISERROR('Run as sysadmin or a member of gecko_system.', 16, 1);
    SET NOEXEC ON;
END
GO

IF NOT EXISTS (SELECT 1 FROM lookup.module WHERE module_code = 'MNR' AND is_active = 1)
    THROW 50500, 'MNR is not an active row of lookup.module — run 07_seed_data.sql first.', 1;
GO

-- ============================================================
-- 1. The codes (MERGE: re-running refreshes names and descriptions)
-- ============================================================
MERGE iam.permission AS t
USING (VALUES
    -- R1 setup and masters
    ('repair.setup.manage',                    N'Manage M&R setup',                  N'Maintain M&R number series, settings, approval policies, labour cost rates and depot profiles.'),
    ('repair.code.view',                       N'View M&R standards',                N'Read IICL thresholds, CEDEX pairs, checklists and damage-map models.'),
    ('repair.code.manage',                     N'Manage M&R standards',              N'Maintain IICL thresholds, CEDEX location/component/repair pairs, checklists and validity rules.'),
    ('repair.unit.view',                       N'View repair units',                 N'Read the repair unit profile, periodic tests and certificates.'),
    ('repair.unit.manage',                     N'Manage repair units',               N'Edit unit technical data, tests and certificates.'),
    ('repair.technician.manage',               N'Manage M&R technicians',            N'Maintain technicians, their trades and skills.'),
    ('repair.vendor_rate.view',                N'View vendor cost cards',            N'Read subcontractor and supplier cost cards.'),
    ('repair.vendor_rate.manage',              N'Manage vendor cost cards',          N'Create, edit and approve vendor cost cards.'),
    -- R17 intake (equipment visits) and R18 integration hub
    ('repair.intake.view',                     N'View equipment visits',             N'Read equipment visits, visit events and depot holds from every yard source.'),
    ('repair.intake.gate',                     N'Record gate in / out (standalone)', N'Use the light gate register when the depot has no yard system (STANDALONE).'),
    ('repair.integration.view',                N'View integrations',                 N'Read connectors, inbound/outbound events, code maps and delivery health.'),
    ('repair.integration.manage',              N'Manage integrations',               N'Configure connectors, code maps, webhooks and API clients.'),
    ('repair.integration.resolve',             N'Resolve integration exceptions',    N'Fix, replay or ignore inbound and outbound events in exception.'),
    ('repair.client_depot.manage',             N'Manage client depots',              N'Contractor mode: maintain the client depots served, their intake and bill-to.'),
    -- R2 case and R3 survey
    ('repair.case.view',                       N'View repair cases',                 N'Read M&R cases, their timeline, surveys, estimates and work.'),
    ('repair.case.manage',                     N'Manage repair cases',               N'Open, update, close or cancel M&R cases; set as-is, scrap or decline.'),
    ('repair.survey.view',                     N'View surveys',                      N'Read surveys, checklists, damage lines, photos and the damage map.'),
    ('repair.survey.manage',                   N'Record surveys',                    N'Record and complete surveys, damage lines, photos and damage marks.'),
    -- R4 estimate and approval
    ('repair.estimate.view',                   N'View estimates',                    N'Read estimates of repair, revisions and approvals.'),
    ('repair.estimate.manage',                 N'Manage estimates',                  N'Create and edit estimates of repair and their lines.'),
    ('repair.estimate.submit',                 N'Submit estimates',                  N'Send an estimate to the owner (PDF, EDI hand-off or portal).'),
    ('repair.estimate.approve',                  N'Approve repair estimates',          N'Internal approval of estimates within the approval policy.'),
    ('repair.estimate.record_owner_approval',  N'Record owner approval',             N'Record an owner or lessor decision received by e-mail or phone.'),
    ('repair.estimate.override_price',         N'Override tariff price',             N'Change a tariff-priced line beyond the allowed adjustment.'),
    -- R5 work
    ('repair.work_order.view',                 N'View repair work orders',           N'Read repair work orders, tasks, labour, materials and sublet.'),
    ('repair.work_order.manage',               N'Manage repair work orders',         N'Create, plan, assign and edit work orders; record materials and sublet.'),
    ('repair.work_order.complete',             N'Complete work orders',              N'Complete a work order (condition restored, charges released per trigger) or reopen it.'),
    ('repair.labour.record',                   N'Record own labour',                 N'Clock on and off tasks and record work done — the technician permission.'),
    ('repair.qc.sign_off',                     N'QC sign-off',                       N'Sign off repaired units after quality check.'),
    -- R6–R9 cleaning, PTI, modifications, incidents
    ('repair.cleaning.view',                   N'View cleaning',                     N'Read cleaning jobs, bays and certificates.'),
    ('repair.cleaning.manage',                 N'Manage cleaning',                   N'Plan and record cleaning jobs, steps, chemicals and certificates.'),
    ('repair.pti.view',                        N'View PTI',                          N'Read reefer PTI jobs, results and certificates.'),
    ('repair.pti.manage',                      N'Manage PTI',                        N'Record PTI jobs, results, pre-cool and certificates.'),
    ('repair.modification.view',               N'View modifications',                N'Read container modifications.'),
    ('repair.modification.manage',             N'Manage modifications',              N'Record modifications and their class review.'),
    ('repair.incident.view',                   N'View incidents',                    N'Read emergencies and incidents.'),
    ('repair.incident.manage',                 N'Manage incidents',                  N'Raise and handle emergencies and incidents.'),
    -- R10 parts and stock, purchasing, vendor bills
    ('repair.part.view',                       N'View materials and stock',          N'Read materials, stores, bins, balances and the stock ledger.'),
    ('repair.part.manage',                     N'Manage materials and stores',       N'Maintain materials, supplier prices, stores, bins and reorder levels.'),
    ('repair.stock.receive',                   N'Receive goods',                     N'Record goods receipts against purchase orders or as direct receipts.'),
    ('repair.stock.issue',                     N'Issue and transfer stock',          N'Issue materials to work orders, return them and transfer between stores.'),
    ('repair.stock.adjust',                    N'Adjust stock',                      N'Record stock adjustments (damage, write-off).'),
    ('repair.stock.count',                     N'Count stock',                       N'Record cycle counts.'),
    ('repair.stock.approve',                   N'Approve stock adjustments',         N'Approve stock adjustments above the threshold.'),
    ('repair.purchase.view',                   N'View purchasing',                   N'Read purchase orders and receipts.'),
    ('repair.purchase.manage',                 N'Manage purchase orders',            N'Create and send purchase orders.'),
    ('repair.purchase.approve',                N'Approve purchase orders',           N'Approve purchase orders above the threshold.'),
    ('repair.vendor_bill.view',                N'View vendor bills',                 N'Read vendor bills and export batches.'),
    ('repair.vendor_bill.manage',              N'Manage vendor bills',               N'Enter vendor bills and match them to sublet lines and receipts.'),
    ('repair.vendor_bill.export',              N'Export vendor bills',               N'Create vendor bill export batches (CSV now, SAP Business One later).'),
    -- R16 owner profiles and EDI hand-off
    ('repair.owner_profile.manage',            N'Manage owner profiles',             N'Maintain owner and lessor profiles: coding, approval channel, billing trigger, auto-approve limit.'),
    ('repair.edi.view',                        N'View EDI hand-off',                 N'Read EDI hand-off status of estimates and authorisations.'),
    ('repair.edi.resolve',                     N'Resolve EDI exceptions',            N'Match or reject inbound authorisations that could not be applied.'),
    -- R13 billing and R14 reports
    ('repair.charge.view',                     N'View M&R charges',                  N'Read charges ready, released and invoiced.'),
    ('repair.charge.release',                  N'Release M&R charges',               N'Release charges to Revenue or to the charge export.'),
    ('repair.report.view',                     N'View M&R reports',                  N'Run M&R reports, inquiries and dashboards.')
) AS s (permission_code, display_name, description)
   ON t.permission_code = s.permission_code
WHEN MATCHED THEN UPDATE SET
    module_code = 'MNR', display_name = s.display_name, description = s.description, is_active = 1
WHEN NOT MATCHED THEN
    INSERT (permission_code, module_code, display_name, description)
    VALUES (s.permission_code, 'MNR', s.display_name, s.description);
PRINT CONCAT('>> repair permissions merged: ', @@ROWCOUNT);
GO

-- ============================================================
-- 1b. The two 07 codes named mnr.* are replaced (see header): switched off.
-- ============================================================
UPDATE iam.permission SET is_active = 0
WHERE permission_code IN ('mnr.survey.manage', 'mnr.repair.approve') AND is_active = 1;
PRINT CONCAT('>> legacy mnr.* codes switched off: ', @@ROWCOUNT);
GO

-- ============================================================
-- 2. Guard: every repair.* code belongs to module MNR
-- ============================================================
DECLARE @stray NVARCHAR(MAX) = (
    SELECT STRING_AGG(permission_code + ' (' + module_code + ')', ', ')
    FROM iam.permission WHERE permission_code LIKE 'repair.%' AND module_code <> 'MNR');
IF @stray IS NOT NULL
BEGIN
    DECLARE @m NVARCHAR(2048) = N'repair.* codes filed under another module: ' + @stray;
    THROW 50501, @m, 1;
END
GO

SELECT module_code, COUNT(*) AS permissions, SUM(CAST(is_active AS INT)) AS active
FROM iam.permission WHERE module_code = 'MNR' GROUP BY module_code;
GO

INSERT INTO dbo.schema_version (script_name, description)
SELECT '60_repair_permissions.sql', N'56 repair.* permissions (setup, standards, units, intake, integration, case, survey, estimate, work, cleaning, PTI, modifications, incidents, parts, purchasing, vendor bills, owner profiles, EDI, charges, reports)'
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_version WHERE script_name = '60_repair_permissions.sql');
GO

PRINT '>> 60_repair_permissions.sql completed — run 61 next.';
GO
