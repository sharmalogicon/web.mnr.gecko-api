-- ============================================================
-- GECKO REPAIR (M&R) — DATABASE, SCHEMAS, ROLES, VERSION TABLE, MONTHLY PARTITIONS
-- Script: 00_create_database.sql
--
-- The Repair context: container Maintenance & Repair for depot operators and
-- M&R contractors — repair cases, surveys, estimates and owner approvals,
-- repair work orders, cleaning, reefer PTI, tank tests, modifications,
-- incidents, the 2D/3D damage map, parts stock, vendor costs and charge release.
--
-- Repair is an INDEPENDENT product (decisions G1–G8, doc 05). It owns its own
-- equipment visit (intake.*) and talks to any yard system — Gecko TOS, an
-- external TOS/depot platform, PortHub or its own light register — through the
-- yard gateway and the integration hub (integ.*). NO table here references
-- gecko_tos. Containers, CEDEX codes, conditions, parties and charge codes stay
-- in gecko_master; tenants, depots (= branches) and users in gecko_identity;
-- the sell tariff, invoices and e-invoicing in gecko_revenue. Module code MNR.
--
-- Design: docs/backend-analysis/02_Gecko_Repair_Database_Design.docx (v0.5)
--         and 05_Gecko_Repair_Global_Product_and_Integration.docx,
-- house rules: web.trucking.gecko-api/docs/database/CONVENTIONS.md.
--
-- SCHEMAS
--   config.*    number series, settings, approval policies, labour cost rates,
--               depot profiles, owner profiles, client depots
--   intake.*    equipment visits, visit events, depot holds (G1)
--   integ.*     connectors, inbound/outbound canonical events, code maps,
--               delivery log, webhooks, API clients (G3, G4)
--   unit.*      repair unit profile, periodic tests and certificates
--   code.*      IICL thresholds, CEDEX pairs, checklists, damage-map models
--   mcase.*     the M&R case and its events ('case' is a T-SQL keyword)
--   survey.*    surveys, checklist answers, damage lines
--   est.*       estimates of repair, lines, approvals
--   work.*      repair work orders, tasks, labour, sublet
--   clean.*     cleaning bays and jobs
--   reefer.*    PTI jobs and results
--   mods.*      modifications
--   incident.*  emergencies and incidents
--   part.*      materials, stores, stock ledger and balances, purchasing
--   vend.*      vendor cost cards and vendor bills
--   charge.*    charge release to Revenue / charge export
--   exch.*      EDI hand-off tables for the GECKO EDI service (Q22)
--   doc.*       attachment metadata and damage marks (files live in blob storage)
--   sec.*       branch grants replicated from identity (if needed)
--   audit.*     activity ledger (append-only)
--   outbox.*    transactional outbox (what Repair publishes)
--   inbox.*     idempotent consumer log (what Repair has handled)
--   history.*   temporal history tables (written only by the engine)
--   archive.*   copies of closed, old aggregates
--   rpt.*       reporting views
--
-- HOUSE CONVENTIONS — identical to every other gecko_* database
--  1. NO FOREIGN KEYS. Anywhere. Ever. References are soft: an id column
--     (plus the code beside it when the row lives in another database).
--  2. Every unique rule is a filtered unique index (deleted_at IS NULL),
--     leading with tenant_id.
--  3. DATETIMEOFFSET(7) defaulted (SYSUTCDATETIME() AT TIME ZONE 'UTC') —
--     never SYSDATETIMEOFFSET(): servers do not all run at UTC.
--  4. Money DECIMAL(18,4) with currency_code CHAR(3) beside it.
--  5. Fail-closed row-level security on SESSION_CONTEXT('TenantId') (91).
--  6. Every script idempotent and self-recording in dbo.schema_version.
--  7. Append-only, high-volume tables (integ.inbound_event, integ.outbound_event,
--     integ.delivery_log, part.stock_ledger, audit.activity) are partitioned
--     monthly on pf_month.
--
-- Run as the deploying admin (sysadmin / db_owner). Idempotent.
-- ============================================================

USE master;
GO

IF DB_ID('gecko_repair') IS NULL
BEGIN
    PRINT '>> Creating database gecko_repair...';
    EXEC('CREATE DATABASE gecko_repair COLLATE Latin1_General_100_CI_AS_SC_UTF8');
END
ELSE
    PRINT '>> Database gecko_repair already exists.';
GO

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF (SELECT is_read_committed_snapshot_on FROM sys.databases WHERE name = 'gecko_repair') = 0
BEGIN
    -- The M&R board, approval queues and stock screens read all day while
    -- surveyors, estimators and technicians post; readers must not block writers.
    ALTER DATABASE gecko_repair SET READ_COMMITTED_SNAPSHOT ON WITH ROLLBACK IMMEDIATE;
    PRINT '>> READ_COMMITTED_SNAPSHOT enabled.';
END
GO

-- sys.sp_verify_database_ledger (audit integrity, 21_audit.sql) needs snapshot
-- isolation. On by default on Azure SQL; set here because ALTER DATABASE cannot
-- run inside the one-transaction run files. (Added 25 Nov with P12; the local
-- database got it by hand, see RUN_LOG.)
IF (SELECT snapshot_isolation_state FROM sys.databases WHERE name = 'gecko_repair') = 0
BEGIN
    ALTER DATABASE gecko_repair SET ALLOW_SNAPSHOT_ISOLATION ON;
    PRINT '>> ALLOW_SNAPSHOT_ISOLATION enabled.';
END
GO

-- Temporal history retention (24 months) only runs when this is ON.
IF (SELECT is_temporal_history_retention_enabled FROM sys.databases WHERE name = 'gecko_repair') = 0
    ALTER DATABASE gecko_repair SET TEMPORAL_HISTORY_RETENTION ON;
GO

-- ------------------------------------------------------------
-- Schemas (all of them now, so 01 can grant them once; tables arrive per phase)
-- ------------------------------------------------------------
IF SCHEMA_ID('config')   IS NULL EXEC('CREATE SCHEMA config');
IF SCHEMA_ID('intake')   IS NULL EXEC('CREATE SCHEMA intake');
IF SCHEMA_ID('integ')    IS NULL EXEC('CREATE SCHEMA integ');
IF SCHEMA_ID('unit')     IS NULL EXEC('CREATE SCHEMA unit');
IF SCHEMA_ID('code')     IS NULL EXEC('CREATE SCHEMA code');
IF SCHEMA_ID('mcase')    IS NULL EXEC('CREATE SCHEMA mcase');
IF SCHEMA_ID('survey')   IS NULL EXEC('CREATE SCHEMA survey');
IF SCHEMA_ID('est')      IS NULL EXEC('CREATE SCHEMA est');
IF SCHEMA_ID('work')     IS NULL EXEC('CREATE SCHEMA work');
IF SCHEMA_ID('clean')    IS NULL EXEC('CREATE SCHEMA clean');
IF SCHEMA_ID('reefer')   IS NULL EXEC('CREATE SCHEMA reefer');
IF SCHEMA_ID('mods')     IS NULL EXEC('CREATE SCHEMA mods');
IF SCHEMA_ID('incident') IS NULL EXEC('CREATE SCHEMA incident');
IF SCHEMA_ID('part')     IS NULL EXEC('CREATE SCHEMA part');
IF SCHEMA_ID('vend')     IS NULL EXEC('CREATE SCHEMA vend');
IF SCHEMA_ID('charge')   IS NULL EXEC('CREATE SCHEMA charge');
IF SCHEMA_ID('exch')     IS NULL EXEC('CREATE SCHEMA exch');
IF SCHEMA_ID('doc')      IS NULL EXEC('CREATE SCHEMA doc');
IF SCHEMA_ID('sec')      IS NULL EXEC('CREATE SCHEMA sec');
IF SCHEMA_ID('audit')    IS NULL EXEC('CREATE SCHEMA audit');
IF SCHEMA_ID('outbox')   IS NULL EXEC('CREATE SCHEMA outbox');
IF SCHEMA_ID('inbox')    IS NULL EXEC('CREATE SCHEMA inbox');
IF SCHEMA_ID('history')  IS NULL EXEC('CREATE SCHEMA history');
IF SCHEMA_ID('archive')  IS NULL EXEC('CREATE SCHEMA archive');
IF SCHEMA_ID('rpt')      IS NULL EXEC('CREATE SCHEMA rpt');
GO

-- ------------------------------------------------------------
-- Roles. Members are added in 01 once the server logins are known to exist.
-- ------------------------------------------------------------
IF DATABASE_PRINCIPAL_ID('gecko_app')    IS NULL CREATE ROLE gecko_app;
IF DATABASE_PRINCIPAL_ID('gecko_system') IS NULL CREATE ROLE gecko_system;
GO

-- ------------------------------------------------------------
-- Script ledger — same shape as every other gecko_* database
-- ------------------------------------------------------------
IF OBJECT_ID('dbo.schema_version') IS NULL
BEGIN
    CREATE TABLE dbo.schema_version (
        version_id    INT IDENTITY(1,1)  NOT NULL,
        script_name   VARCHAR(200)       NOT NULL,
        description   NVARCHAR(400)      NULL,
        applied_at    DATETIMEOFFSET(7)  NOT NULL CONSTRAINT df_schema_version__applied_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        applied_by    NVARCHAR(128)      NOT NULL CONSTRAINT df_schema_version__applied_by DEFAULT (SUSER_SNAME()),
        CONSTRAINT pk_schema_version PRIMARY KEY CLUSTERED (version_id)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_schema_version__script ON dbo.schema_version (script_name);
END
GO

CREATE OR ALTER PROCEDURE dbo.usp_record_script
    @script_name VARCHAR(200),
    @description NVARCHAR(400)
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.schema_version WHERE script_name = @script_name)
        INSERT INTO dbo.schema_version (script_name, description) VALUES (@script_name, @description);
END
GO

-- ------------------------------------------------------------
-- Monthly partitioning for append-only, high-volume tables.
-- RANGE RIGHT: each boundary is the FIRST instant of a month (UTC).
-- 36 boundaries, 2026-01-01 .. 2028-12-01; the monthly maintenance job SPLITs
-- the next month in ahead of time. Same names as gecko_trucking / gecko_fleet.
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.partition_functions WHERE name = 'pf_month')
BEGIN
    DECLARE @values NVARCHAR(MAX) = N'';
    DECLARE @d DATE = '2026-01-01';
    WHILE @d <= '2028-12-01'
    BEGIN
        SET @values = @values + CASE WHEN @values = N'' THEN N'' ELSE N', ' END
                    + N'''' + CONVERT(NVARCHAR(10), @d, 23) + N'T00:00:00.0000000+00:00''';
        SET @d = DATEADD(MONTH, 1, @d);
    END
    EXEC(N'CREATE PARTITION FUNCTION pf_month (DATETIMEOFFSET(7)) AS RANGE RIGHT FOR VALUES (' + @values + N');');
    PRINT '>> Partition function pf_month created (36 monthly boundaries).';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.partition_schemes WHERE name = 'ps_month')
BEGIN
    CREATE PARTITION SCHEME ps_month AS PARTITION pf_month ALL TO ([PRIMARY]);
    PRINT '>> Partition scheme ps_month created.';
END
GO

DECLARE @boundaries INT = (SELECT fanout - 1 FROM sys.partition_functions WHERE name = 'pf_month');
IF @boundaries < 36
    THROW 50001, 'pf_month has fewer than 36 monthly boundaries.', 1;
GO

EXEC dbo.usp_record_script '00_create_database.sql', N'Database gecko_repair (UTF-8, RCSI), 25 schemas incl. intake/integ, roles, schema_version, pf_month/ps_month monthly 2026-01..2028-12';
GO

PRINT '>> 00_create_database.sql completed.';
GO
