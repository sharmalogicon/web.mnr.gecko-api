-- ============================================================
-- GECKO IDENTITY — REPAIR (M&R) PLANS, SCT PILOT ENTITLEMENT, ROLE TEMPLATES, GRANTS
-- Script: 61_repair_roles_and_plans.sql
-- Owner:  Identity & Access
--
-- ROWS ONLY, in existing generic tables (the 38_fleet_roles_and_plans pattern):
--   subscription.plan              MNR STARTER / PROFESSIONAL exist (07): names
--                                  aligned to the editions of doc 05 §10
--                                  (Essentials / Professional); ENTERPRISE added
--   subscription.plan_limit        CASES per month and USERS per plan
--   subscription.entitlement       MNR for the pilot tenant SCT (section 0)
--   iam.role_template              6 M&R role templates (doc 01 §22)
--   iam.role_template_permission   what each holds, plus repair.* for TENANT_OWNER,
--                                  OPS_MANAGER, ACCOUNTS, VIEWER
--   iam.role / iam.role_permission backfill for tenants entitled to MNR
--
-- PRICES ARE PLACEHOLDERS (07 marks them the same way); existing prices are
-- not changed. Limits are first guesses for review, not commitments.
--
-- Guards: REPAIR_TECHNICIAN stays narrow; repair.setup.manage and
-- repair.integration.manage (API client secrets, connector endpoints) are
-- TENANT_OWNER and REPAIR_MANAGER only.
--
-- BACKFILL RULE (as 30 / 38): grants missing on SYSTEM roles are added; a role a
-- tenant created itself is never touched. The new templates become roles only
-- in tenants with a live MNR entitlement (TRIAL / ACTIVE / PAST_DUE).
--
-- Idempotent. Run as sysadmin or a member of gecko_system. Run after 60.
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

IF NOT EXISTS (SELECT 1 FROM dbo.schema_version WHERE script_name = '60_repair_permissions.sql')
    THROW 50510, 'Run 60_repair_permissions.sql first.', 1;
GO

-- ============================================================
-- 0. PARAMETERS — REVIEW BEFORE RUNNING
--    The pilot tenant and the depots (branches) that get MNR. SCT1 is the
--    branch holding the other SCT entitlements today. Add a row per depot when
--    SCT confirms which depots run M&R.
-- ============================================================
DROP TABLE IF EXISTS #pilot;
CREATE TABLE #pilot (
    tenant_code   VARCHAR(30) COLLATE DATABASE_DEFAULT NOT NULL,
    branch_code   VARCHAR(30) COLLATE DATABASE_DEFAULT NOT NULL,
    plan_code     VARCHAR(30) COLLATE DATABASE_DEFAULT NOT NULL,
    trial_days    INT         NOT NULL,   -- TRIAL length; the pilot runs until go-live (MVP, P8)
    PRIMARY KEY (tenant_code, branch_code)
);
INSERT INTO #pilot (tenant_code, branch_code, plan_code, trial_days) VALUES
    ('SCT', 'SCT1', 'PROFESSIONAL', 270);
GO

-- iam.role, iam.role_permission and subscription.entitlement are under RLS.
EXEC sp_set_session_context @key = N'IsSystemContext', @value = 1;
GO

-- ============================================================
-- 1. Plans and limits (module MNR)
--    Existing rows: display name and description refreshed, prices untouched.
-- ============================================================
MERGE subscription.[plan] AS t
USING (VALUES
    ('MNR', 'STARTER',      N'Essentials',   N'PLACEHOLDER PRICE - CONFIRM BEFORE QUOTING. One depot: cases, surveys with damage map, estimates (PDF approval), work orders, cleaning, PTI, charges to Revenue or export, standalone or Gecko TOS yard source.', 1,  300.00,  3000.00, 'THB', 1),
    ('MNR', 'PROFESSIONAL', N'Professional', N'PLACEHOLDER PRICE - CONFIRM BEFORE QUOTING. Essentials + several depots, parts stock and purchasing, sublet and vendor bills, owner profiles and EDI hand-off, REST / webhook / CSV connectors, reports.', 2,  700.00,  7000.00, 'THB', 1),
    ('MNR', 'ENTERPRISE',   N'Enterprise',   N'PLACEHOLDER PRICE - CONFIRM BEFORE QUOTING. Professional + vendor TOS connectors (Navis N4, OPUS, ContainerChain), public API and embeddable components, SSO, contractor mode, data residency.', 3, 1500.00, 15000.00, 'THB', 1)
) AS s (module_code, plan_code, display_name, description, tier_level, price_monthly, price_yearly, currency, is_public)
   ON t.module_code = s.module_code AND t.plan_code = s.plan_code AND t.deleted_at IS NULL
WHEN MATCHED THEN UPDATE SET display_name = s.display_name, description = s.description
WHEN NOT MATCHED THEN
    INSERT (module_code, plan_code, display_name, description, tier_level, price_monthly, price_yearly, currency, is_public)
    VALUES (s.module_code, s.plan_code, s.display_name, s.description, s.tier_level, s.price_monthly, s.price_yearly, s.currency, s.is_public);
PRINT CONCAT('>> repair plans merged: ', @@ROWCOUNT);
GO

-- CASES = M&R cases opened per month (the usage metric depots understand).
-- Soft limit: one case past the plan is billed / flagged, never refused —
-- a container cannot wait at the gate for a subscription upgrade.
-- NULL = unlimited. Existing USERS rows from 07 are left as they are.
MERGE subscription.plan_limit AS t
USING (
    SELECT p.plan_id, s.metric_code, s.display_name, s.limit_value, s.period, s.is_hard_limit
    FROM (VALUES
        ('STARTER',      'CASES', N'Repair cases', 300,  'MONTH', 0),
        ('STARTER',      'USERS', N'Users',        5,    'MONTH', 0),
        ('PROFESSIONAL', 'CASES', N'Repair cases', 2000, 'MONTH', 0),
        ('PROFESSIONAL', 'USERS', N'Users',        25,   'MONTH', 0),
        ('ENTERPRISE',   'CASES', N'Repair cases', NULL, 'MONTH', 0),
        ('ENTERPRISE',   'USERS', N'Users',        NULL, 'MONTH', 0)
    ) AS s (plan_code, metric_code, display_name, limit_value, period, is_hard_limit)
    JOIN subscription.[plan] p ON p.module_code = 'MNR' AND p.plan_code = s.plan_code AND p.deleted_at IS NULL
) AS s
   ON t.plan_id = s.plan_id AND t.metric_code = s.metric_code AND t.deleted_at IS NULL
WHEN NOT MATCHED THEN
    INSERT (plan_id, metric_code, display_name, limit_value, period, is_hard_limit)
    VALUES (s.plan_id, s.metric_code, s.display_name, s.limit_value, s.period, s.is_hard_limit);
PRINT CONCAT('>> repair plan limits added: ', @@ROWCOUNT);
GO

IF (SELECT COUNT(*) FROM subscription.[plan] WHERE module_code = 'MNR' AND deleted_at IS NULL) < 3
    THROW 50511, 'MNR must have three plans (STARTER, PROFESSIONAL, ENTERPRISE).', 1;
GO

-- ============================================================
-- 2. Pilot entitlement (branch-scoped, as TOS / TRUCKING / FLEET are)
-- ============================================================
DECLARE @missing NVARCHAR(MAX) = (
    SELECT STRING_AGG(pl.tenant_code + '/' + pl.branch_code, ', ')
    FROM #pilot pl
    WHERE NOT EXISTS (
        SELECT 1 FROM tenant.tenant tn
        JOIN tenant.branch b ON b.tenant_id = tn.tenant_id AND b.deleted_at IS NULL AND b.is_active = 1
        WHERE tn.tenant_code = pl.tenant_code AND tn.deleted_at IS NULL AND b.branch_code = pl.branch_code));
IF @missing IS NOT NULL
BEGIN
    DECLARE @m NVARCHAR(2048) = N'Pilot tenant/branch not found or inactive: ' + @missing + N'. Fix section 0.';
    THROW 50512, @m, 1;
END

DECLARE @now DATETIMEOFFSET(7) = SYSUTCDATETIME() AT TIME ZONE 'UTC';

INSERT INTO subscription.entitlement (tenant_id, branch_id, module_code, plan_id, status, billing_cycle, trial_ends_at, notes, created_at, updated_at)
SELECT tn.tenant_id, b.branch_id, 'MNR', p.plan_id, 'TRIAL', 'MONTHLY', DATEADD(DAY, pl.trial_days, @now),
       N'Repair (M&R) pilot (P0). Go-live fixed at the MVP (P8).', @now, @now
FROM #pilot pl
JOIN tenant.tenant tn ON tn.tenant_code = pl.tenant_code AND tn.deleted_at IS NULL
JOIN tenant.branch b  ON b.tenant_id = tn.tenant_id AND b.branch_code = pl.branch_code AND b.deleted_at IS NULL
JOIN subscription.[plan] p ON p.module_code = 'MNR' AND p.plan_code = pl.plan_code AND p.deleted_at IS NULL
WHERE NOT EXISTS (SELECT 1 FROM subscription.entitlement e
                  WHERE e.tenant_id = tn.tenant_id AND e.branch_id = b.branch_id
                    AND e.module_code = 'MNR' AND e.deleted_at IS NULL);
PRINT CONCAT('>> repair pilot entitlements added: ', @@ROWCOUNT);
GO

-- ============================================================
-- 3. Role templates (doc 01 §22)
-- ============================================================
MERGE iam.role_template AS t
USING (VALUES
    ('REPAIR_MANAGER',     N'M&R Manager',     N'Runs M&R at the depot: setup, approvals, charge release, integrations and reports.',                    0, 1, 37),
    ('REPAIR_SURVEYOR',    N'M&R Surveyor',    N'Surveys containers: checklists, damage lines, photos and the damage map; PTI checks.',                  0, 1, 38),
    ('REPAIR_ESTIMATOR',   N'M&R Estimator',   N'Prepares estimates of repair, sends them to owners and records owner decisions.',                       0, 1, 39),
    ('REPAIR_SUPERVISOR',  N'M&R Supervisor',  N'Runs the repair workshop: work orders, QC sign-off, cleaning, PTI and incidents.',                       0, 1, 40),
    ('REPAIR_TECHNICIAN',  N'M&R Technician',  N'Records own labour on assigned work orders, cleaning and PTI jobs.',                                     0, 1, 82),
    ('REPAIR_STOREKEEPER', N'M&R Storekeeper', N'M&R parts store: receipts, issues to work orders, transfers and stock counts.',                          0, 1, 64)
) AS s (role_code, display_name, description, is_tenant_admin, is_assignable, sort_order)
   ON t.role_code = s.role_code
WHEN MATCHED THEN UPDATE SET
    display_name = s.display_name, description = s.description, is_tenant_admin = s.is_tenant_admin,
    is_assignable = s.is_assignable, sort_order = s.sort_order, is_active = 1
WHEN NOT MATCHED THEN
    INSERT (role_code, display_name, description, is_tenant_admin, is_assignable, sort_order)
    VALUES (s.role_code, s.display_name, s.description, s.is_tenant_admin, s.is_assignable, s.sort_order);
PRINT CONCAT('>> repair role templates merged: ', @@ROWCOUNT);
GO

-- ============================================================
-- 4. Template grants (temp table so section 6 backfills exactly these pairs)
-- ============================================================
DROP TABLE IF EXISTS #grants;
CREATE TABLE #grants (role_code VARCHAR(40) COLLATE DATABASE_DEFAULT NOT NULL, permission_code VARCHAR(80) COLLATE DATABASE_DEFAULT NOT NULL, PRIMARY KEY (role_code, permission_code));

-- REPAIR_MANAGER and TENANT_OWNER: every active repair code, plus a view of Repair tariffs.
INSERT INTO #grants (role_code, permission_code)
SELECT r.role_code, p.permission_code
FROM iam.permission p CROSS JOIN (VALUES ('REPAIR_MANAGER'), ('TENANT_OWNER')) r(role_code)
WHERE p.module_code = 'MNR' AND p.is_active = 1;
INSERT INTO #grants (role_code, permission_code) VALUES ('REPAIR_MANAGER', 'revenue.tariff.view');

-- OPS_MANAGER: everything except setup and integration configuration.
INSERT INTO #grants (role_code, permission_code)
SELECT 'OPS_MANAGER', p.permission_code FROM iam.permission p
WHERE p.module_code = 'MNR' AND p.is_active = 1
  AND p.permission_code NOT IN ('repair.setup.manage', 'repair.integration.manage');

-- VIEWER: every repair *.view code.
INSERT INTO #grants (role_code, permission_code)
SELECT 'VIEWER', p.permission_code FROM iam.permission p
WHERE p.module_code = 'MNR' AND p.is_active = 1 AND p.permission_code LIKE '%.view';

INSERT INTO #grants (role_code, permission_code) VALUES
    -- REPAIR_SURVEYOR
    ('REPAIR_SURVEYOR', 'repair.case.view'), ('REPAIR_SURVEYOR', 'repair.case.manage'),
    ('REPAIR_SURVEYOR', 'repair.survey.view'), ('REPAIR_SURVEYOR', 'repair.survey.manage'),
    ('REPAIR_SURVEYOR', 'repair.pti.view'), ('REPAIR_SURVEYOR', 'repair.pti.manage'),
    ('REPAIR_SURVEYOR', 'repair.unit.view'), ('REPAIR_SURVEYOR', 'repair.code.view'),
    ('REPAIR_SURVEYOR', 'repair.intake.view'), ('REPAIR_SURVEYOR', 'repair.intake.gate'),
    -- REPAIR_ESTIMATOR
    ('REPAIR_ESTIMATOR', 'repair.case.view'), ('REPAIR_ESTIMATOR', 'repair.case.manage'),
    ('REPAIR_ESTIMATOR', 'repair.survey.view'), ('REPAIR_ESTIMATOR', 'repair.unit.view'), ('REPAIR_ESTIMATOR', 'repair.code.view'),
    ('REPAIR_ESTIMATOR', 'repair.intake.view'),
    ('REPAIR_ESTIMATOR', 'repair.estimate.view'), ('REPAIR_ESTIMATOR', 'repair.estimate.manage'), ('REPAIR_ESTIMATOR', 'repair.estimate.submit'),
    ('REPAIR_ESTIMATOR', 'repair.estimate.record_owner_approval'), ('REPAIR_ESTIMATOR', 'repair.edi.view'),
    ('REPAIR_ESTIMATOR', 'repair.charge.view'), ('REPAIR_ESTIMATOR', 'revenue.tariff.view'),
    -- REPAIR_SUPERVISOR
    ('REPAIR_SUPERVISOR', 'repair.case.view'), ('REPAIR_SUPERVISOR', 'repair.survey.view'), ('REPAIR_SUPERVISOR', 'repair.estimate.view'),
    ('REPAIR_SUPERVISOR', 'repair.unit.view'), ('REPAIR_SUPERVISOR', 'repair.code.view'), ('REPAIR_SUPERVISOR', 'repair.intake.view'),
    ('REPAIR_SUPERVISOR', 'repair.work_order.view'), ('REPAIR_SUPERVISOR', 'repair.work_order.manage'), ('REPAIR_SUPERVISOR', 'repair.work_order.complete'),
    ('REPAIR_SUPERVISOR', 'repair.labour.record'), ('REPAIR_SUPERVISOR', 'repair.qc.sign_off'),
    ('REPAIR_SUPERVISOR', 'repair.cleaning.view'), ('REPAIR_SUPERVISOR', 'repair.cleaning.manage'),
    ('REPAIR_SUPERVISOR', 'repair.pti.view'), ('REPAIR_SUPERVISOR', 'repair.pti.manage'),
    ('REPAIR_SUPERVISOR', 'repair.modification.view'), ('REPAIR_SUPERVISOR', 'repair.incident.view'), ('REPAIR_SUPERVISOR', 'repair.incident.manage'),
    ('REPAIR_SUPERVISOR', 'repair.part.view'), ('REPAIR_SUPERVISOR', 'repair.stock.issue'), ('REPAIR_SUPERVISOR', 'repair.purchase.view'),
    ('REPAIR_SUPERVISOR', 'repair.technician.manage'), ('REPAIR_SUPERVISOR', 'repair.report.view'),
    -- REPAIR_TECHNICIAN (guarded in section 5)
    ('REPAIR_TECHNICIAN', 'repair.labour.record'), ('REPAIR_TECHNICIAN', 'repair.work_order.view'),
    ('REPAIR_TECHNICIAN', 'repair.cleaning.view'), ('REPAIR_TECHNICIAN', 'repair.cleaning.manage'),
    ('REPAIR_TECHNICIAN', 'repair.pti.view'), ('REPAIR_TECHNICIAN', 'repair.pti.manage'),
    -- REPAIR_STOREKEEPER
    ('REPAIR_STOREKEEPER', 'repair.work_order.view'), ('REPAIR_STOREKEEPER', 'repair.part.view'), ('REPAIR_STOREKEEPER', 'repair.part.manage'),
    ('REPAIR_STOREKEEPER', 'repair.stock.receive'), ('REPAIR_STOREKEEPER', 'repair.stock.issue'), ('REPAIR_STOREKEEPER', 'repair.stock.count'),
    ('REPAIR_STOREKEEPER', 'repair.stock.adjust'), ('REPAIR_STOREKEEPER', 'repair.purchase.view'), ('REPAIR_STOREKEEPER', 'repair.report.view'),
    -- ACCOUNTS (existing)
    ('ACCOUNTS', 'repair.estimate.view'), ('ACCOUNTS', 'repair.charge.view'), ('ACCOUNTS', 'repair.charge.release'),
    ('ACCOUNTS', 'repair.purchase.view'), ('ACCOUNTS', 'repair.vendor_bill.view'), ('ACCOUNTS', 'repair.vendor_bill.manage'),
    ('ACCOUNTS', 'repair.vendor_bill.export'), ('ACCOUNTS', 'repair.vendor_rate.view'), ('ACCOUNTS', 'repair.report.view');

DECLARE @bad NVARCHAR(MAX) = (
    SELECT STRING_AGG(g.role_code + ' -> ' + g.permission_code, ', ')
    FROM #grants g
    WHERE NOT EXISTS (SELECT 1 FROM iam.permission p WHERE p.permission_code = g.permission_code AND p.is_active = 1)
       OR NOT EXISTS (SELECT 1 FROM iam.role_template rt WHERE rt.role_code = g.role_code AND rt.is_active = 1));
IF @bad IS NOT NULL
BEGIN
    DECLARE @m NVARCHAR(2048) = N'Unknown role or inactive permission in the repair grants: ' + @bad;
    THROW 50513, @m, 1;
END

MERGE iam.role_template_permission AS t
USING #grants AS s
   ON t.role_code = s.role_code AND t.permission_code = s.permission_code
WHEN NOT MATCHED THEN
    INSERT (role_code, permission_code) VALUES (s.role_code, s.permission_code);
PRINT CONCAT('>> repair template grants added: ', @@ROWCOUNT);

-- ============================================================
-- 5. Guards on the result
-- ============================================================
DECLARE @wide NVARCHAR(MAX) = (
    SELECT STRING_AGG(rtp.permission_code, ', ') FROM iam.role_template_permission rtp
    WHERE rtp.role_code = 'REPAIR_TECHNICIAN'
      AND rtp.permission_code NOT IN ('repair.labour.record', 'repair.work_order.view', 'repair.cleaning.view',
                                      'repair.cleaning.manage', 'repair.pti.view', 'repair.pti.manage'));
IF @wide IS NOT NULL
BEGIN
    DECLARE @m2 NVARCHAR(2048) = N'REPAIR_TECHNICIAN must hold only labour, work-order view, cleaning and PTI codes; it also holds: ' + @wide;
    THROW 50514, @m2, 1;
END

DECLARE @setup NVARCHAR(MAX) = (
    SELECT STRING_AGG(role_code + ' -> ' + permission_code, ', ') FROM iam.role_template_permission
    WHERE permission_code IN ('repair.setup.manage', 'repair.integration.manage') AND role_code NOT IN ('TENANT_OWNER', 'REPAIR_MANAGER'));
IF @setup IS NOT NULL
BEGIN
    DECLARE @m3 NVARCHAR(2048) = N'Setup / integration configuration templated to ' + @setup + N' — owner / M&R manager only. Confirm and update this guard.';
    THROW 50515, @m3, 1;
END

-- ============================================================
-- 6. Backfill tenants entitled to MNR
-- ============================================================
DECLARE @now DATETIMEOFFSET(7) = SYSUTCDATETIME() AT TIME ZONE 'UTC';

INSERT INTO iam.role (tenant_id, role_code, display_name, description, is_system, is_tenant_admin, created_at, updated_at)
SELECT DISTINCT e.tenant_id, rt.role_code, rt.display_name, rt.description, 1, rt.is_tenant_admin, @now, @now
FROM subscription.entitlement e
JOIN tenant.tenant tn ON tn.tenant_id = e.tenant_id AND tn.deleted_at IS NULL
CROSS JOIN iam.role_template rt
WHERE e.module_code = 'MNR' AND e.deleted_at IS NULL AND e.status IN ('TRIAL','ACTIVE','PAST_DUE')
  AND rt.role_code IN ('REPAIR_MANAGER','REPAIR_SURVEYOR','REPAIR_ESTIMATOR','REPAIR_SUPERVISOR','REPAIR_TECHNICIAN','REPAIR_STOREKEEPER')
  AND rt.is_active = 1 AND rt.is_assignable = 1
  AND NOT EXISTS (SELECT 1 FROM iam.role r WHERE r.tenant_id = e.tenant_id AND r.role_code = rt.role_code AND r.deleted_at IS NULL);
PRINT CONCAT('>> repair roles added to entitled tenants: ', @@ROWCOUNT);

INSERT INTO iam.role_permission (tenant_id, role_id, permission_code, created_at)
SELECT r.tenant_id, r.role_id, g.permission_code, @now
FROM iam.role r
JOIN #grants g ON g.role_code = r.role_code
WHERE r.deleted_at IS NULL
  AND r.is_system = 1
  AND NOT EXISTS (SELECT 1 FROM iam.role_permission rp
                  WHERE rp.role_id = r.role_id AND rp.permission_code = g.permission_code AND rp.deleted_at IS NULL);
PRINT CONCAT('>> repair grants backfilled on system roles: ', @@ROWCOUNT);
GO

EXEC sp_set_session_context @key = N'IsSystemContext', @value = 0;
GO

-- Report
SELECT rt.role_code, COUNT(rtp.permission_code) AS repair_template_permissions
FROM iam.role_template rt
LEFT JOIN iam.role_template_permission rtp ON rtp.role_code = rt.role_code AND rtp.permission_code LIKE 'repair.%'
WHERE rt.role_code IN ('REPAIR_MANAGER','REPAIR_SURVEYOR','REPAIR_ESTIMATOR','REPAIR_SUPERVISOR','REPAIR_TECHNICIAN','REPAIR_STOREKEEPER',
                       'TENANT_OWNER','OPS_MANAGER','ACCOUNTS','VIEWER')
GROUP BY rt.role_code ORDER BY rt.role_code;
GO

INSERT INTO dbo.schema_version (script_name, description)
SELECT '61_repair_roles_and_plans.sql', N'MNR plans Essentials/Professional/Enterprise + CASES/USERS limits, SCT pilot entitlement, 6 Repair role templates + grants (and repair codes for owner/ops/accounts/viewer), backfill for MNR-entitled tenants'
WHERE NOT EXISTS (SELECT 1 FROM dbo.schema_version WHERE script_name = '61_repair_roles_and_plans.sql');
GO

PRINT '>> 61_repair_roles_and_plans.sql completed.';
GO
