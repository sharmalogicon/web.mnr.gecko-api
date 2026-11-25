-- ============================================================
-- GECKO REPAIR (M&R) — AUDIT TRAIL + AUDIT INTEGRITY (doc 03 P12)
-- Script: 21_audit.sql
--
-- The same two layers as every other module database (gecko_tos 36/38,
-- gecko_revenue 57/58, gecko_master 46/47, gecko_trucking 33/34), so the
-- platform audit reader, the integrity worker and the audit screens work on
-- gecko_repair unchanged:
--
--   audit.activity              one row per business action (SURVEY_RECORDED,
--                               ESTIMATE_SUBMITTED, ESTIMATE_APPROVED, WO_COMPLETED,
--                               CONDITION_RESTORED, CHARGE_RELEASED, STOCK_ADJUSTED ...)
--                               with reason, IP and request id, written in the SAME
--                               transaction as the change by
--                               AddAuditActivitySource<RepairDbContext>("MNR").
--                               APPEND-ONLY LEDGER: insert only; SQL Server keeps a
--                               hash chain over it.                              A
--   audit.ledger_digest         one row per daily ledger digest (the trusted copy is
--                               the write-once file in the audit Blob store)
--   audit.ledger_verification   each sys.sp_verify_database_ledger run and result
--   audit.archive_file          one write-once Parquet file per tenant per history
--                               table per closed month (read back and counted first)
--   audit.archive_month         a history table's month archived for every tenant
--
-- Field-level changes (old -> new) are the temporal history.* tables already
-- created by usp_enable_temporal in scripts 02–20; nothing to add here.
--
-- Differences from the 00 header note: audit.activity is NOT partitioned. It
-- keeps the exact platform shape (a LEDGER table, BIGINT identity key) so one
-- reader serves every module; volume is one row per user action, far below
-- the stock ledger or the integration logs.
--
-- Access:
--   * audit.activity: both app logins SELECT + INSERT (the 01 schema grant),
--     UPDATE / DELETE denied (01 schema DENY + per-table DENY here). Tenant rows:
--     91 adds its FILTER + BLOCK predicates.
--   * the 4 integrity tables: gecko_system only (the worker, system context);
--     gecko_app is DENIED everything on them. ledger_digest, ledger_verification
--     and archive_month have no tenant_id by design (one digest / one archived
--     month covers every tenant): 91 guard 50332 exempts them ONLY while that
--     DENY SELECT stands.
--   * VIEW LEDGER CONTENT to gecko_system; DENY ALTER on the database and
--     ALTER / TAKE OWNERSHIP on history + audit to both app logins.
--   * ALLOW_SNAPSHOT_ISOLATION must be ON (set by 00; checked here, 50343).
--
-- History RETENTION is NOT switched on here (owner 2026-11-16: retention stays
-- off until an archive run is verified). The retention script is the trucking
-- 35 pattern, written when the archive worker runs for Repair.
--
-- Run 91_rls_policy.sql AFTER this script. Run as sysadmin / db_owner. Idempotent.
-- Azure: run 21 + 91 BEFORE publishing the Repair API — every audited save
-- writes audit.activity in the same transaction.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO

IF NOT (IS_SRVROLEMEMBER('sysadmin') = 1 OR IS_MEMBER('db_owner') = 1)
BEGIN
    RAISERROR('Run as sysadmin / db_owner. DDL is not granted to either application login.', 16, 1);
    SET NOEXEC ON;
END
GO

IF SCHEMA_ID('audit') IS NULL
    THROW 50340, 'Schema audit is missing: run 00_create_database.sql and 01_security_foundation.sql first.', 1;
GO

-- ------------------------------------------------------------
-- 1. audit.activity (same shape as the other module databases)
-- ------------------------------------------------------------
-- @table   audit.activity
-- @purpose One business action on a Repair record: who (user or system actor), from where (UI, EDI, JOB, SCRIPT), what (action on entity, with its parent), why (reason) and a one-line summary, written in the same transaction as the change. Insert only; a SQL Server ledger proves no row was changed.
-- @vector  none — new (platform audit trail, AUDIT_TRAIL_PLAN)
-- @owner   Platform audit (module code MNR)
-- @flags   A
-- @phase   12
IF OBJECT_ID('audit.activity') IS NULL
BEGIN
    CREATE TABLE audit.activity (
        activity_id     BIGINT IDENTITY(1,1)  NOT NULL,
        tenant_id       UNIQUEIDENTIFIER      NOT NULL,
        branch_id       UNIQUEIDENTIFIER      NULL,
        occurred_at     DATETIMEOFFSET(7)     NOT NULL CONSTRAINT df_activity__occurred_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        actor_user_id   UNIQUEIDENTIFIER      NULL,       -- null = no signed-in user (EDI, a job, a connector, a script)
        actor_name      NVARCHAR(100)         NULL,       -- a system actor's name ("System·Job"); people are named from the directory
        source          VARCHAR(10)           NOT NULL,   -- UI | EDI | JOB | SCRIPT
        action          VARCHAR(50)           NOT NULL,   -- ESTIMATE_APPROVED, WO_COMPLETED, ...
        entity_type     VARCHAR(40)           NOT NULL,   -- REPAIR_CASE, SURVEY, ESTIMATE, WORK_ORDER, CLEANING_JOB, PTI_JOB, CHARGE_RELEASE, STOCK_DOCUMENT, VENDOR_BILL, ...
        entity_id       UNIQUEIDENTIFIER      NOT NULL,
        entity_ref      NVARCHAR(60)          NULL,       -- what a person calls it: case no, estimate no + revision, WO no
        parent_type     VARCHAR(40)           NULL,       -- an estimate's REPAIR_CASE, a QC check's WORK_ORDER
        parent_id       UNIQUEIDENTIFIER      NULL,
        reason          NVARCHAR(500)         NULL,
        summary         NVARCHAR(500)         NOT NULL,
        details_json    NVARCHAR(MAX)         NULL,
        ip_address      VARCHAR(45)           NULL,
        correlation_id  VARCHAR(64)           NULL,
        CONSTRAINT pk_activity PRIMARY KEY CLUSTERED (activity_id),
        CONSTRAINT ck_activity__source CHECK (source IN ('UI', 'EDI', 'JOB', 'SCRIPT')),
        CONSTRAINT ck_activity__details_json CHECK (details_json IS NULL OR ISJSON(details_json) = 1)
    )
    WITH (LEDGER = ON (APPEND_ONLY = ON));

    CREATE NONCLUSTERED INDEX ix_activity__entity ON audit.activity (tenant_id, entity_type, entity_id, occurred_at);
    CREATE NONCLUSTERED INDEX ix_activity__parent ON audit.activity (tenant_id, parent_type, parent_id, occurred_at) WHERE parent_id IS NOT NULL;
    CREATE NONCLUSTERED INDEX ix_activity__time   ON audit.activity (tenant_id, occurred_at DESC);
    PRINT '>> audit.activity created (append-only ledger).';
END
GO

GRANT SELECT, INSERT ON audit.activity TO gecko_app;
GRANT SELECT, INSERT ON audit.activity TO gecko_system;
DENY UPDATE, DELETE ON audit.activity TO gecko_app;
DENY UPDATE, DELETE ON audit.activity TO gecko_system;
GO

-- ------------------------------------------------------------
-- 2. Integrity bookkeeping (worker only, system context)
-- ------------------------------------------------------------
-- @table   audit.ledger_digest
-- @purpose One database ledger digest (sys.sp_generate_database_ledger_digest, daily): block id, hash, a copy of the JSON and the write-once file it was stored in. Database-wide: no tenant_id; gecko_app denied.
-- @owner   Platform audit
-- @flags   A
-- @phase   12
IF OBJECT_ID('audit.ledger_digest') IS NULL
BEGIN
    CREATE TABLE audit.ledger_digest (
        digest_id     BIGINT IDENTITY(1,1) NOT NULL,
        generated_at  DATETIMEOFFSET(7)    NOT NULL CONSTRAINT df_ledger_digest__generated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        block_id      BIGINT               NOT NULL,
        digest_hash   VARCHAR(200)         NOT NULL,
        digest_json   NVARCHAR(MAX)        NOT NULL,   -- a copy: the trusted one is the file
        file_uri      VARCHAR(400)         NOT NULL,
        file_sha256   VARBINARY(32)        NOT NULL,
        file_bytes    BIGINT               NOT NULL,
        CONSTRAINT pk_ledger_digest PRIMARY KEY CLUSTERED (digest_id)
    );
    PRINT '>> audit.ledger_digest created.';
END
GO

-- @table   audit.ledger_verification
-- @purpose One sys.sp_verify_database_ledger run: when, result, digests used, last verified block, message and who asked. Database-wide: no tenant_id; gecko_app denied.
-- @owner   Platform audit
-- @flags   A
-- @phase   12
IF OBJECT_ID('audit.ledger_verification') IS NULL
BEGIN
    CREATE TABLE audit.ledger_verification (
        verification_id      BIGINT IDENTITY(1,1) NOT NULL,
        started_at           DATETIMEOFFSET(7)    NOT NULL,
        finished_at          DATETIMEOFFSET(7)    NOT NULL,
        ok                   BIT                  NOT NULL,
        digests_used         INT                  NOT NULL,
        last_verified_block  BIGINT               NULL,
        message              NVARCHAR(MAX)        NOT NULL,
        requested_by         UNIQUEIDENTIFIER     NULL,   -- the user who asked (null = the daily run)
        CONSTRAINT pk_ledger_verification PRIMARY KEY CLUSTERED (verification_id),
        CONSTRAINT ck_ledger_verification__window CHECK (finished_at >= started_at)
    );
    PRINT '>> audit.ledger_verification created.';
END
GO

-- @table   audit.archive_file
-- @purpose One tenant's rows of one history table for one closed month, copied to a write-once Parquet file and counted back: the proof that lets retention delete them from SQL. gecko_app denied.
-- @owner   Platform audit
-- @flags   A
-- @phase   12
IF OBJECT_ID('audit.archive_file') IS NULL
BEGIN
    CREATE TABLE audit.archive_file (
        archive_id     BIGINT IDENTITY(1,1) NOT NULL,
        history_table  NVARCHAR(260)        NOT NULL,   -- history.est_estimate
        period_month   DATE                 NOT NULL,   -- first day of the month of the period-end column (UTC)
        tenant_id      UNIQUEIDENTIFIER     NOT NULL,
        row_count      BIGINT               NOT NULL,
        file_uri       VARCHAR(400)         NOT NULL,
        file_sha256    VARBINARY(32)        NOT NULL,
        file_bytes     BIGINT               NOT NULL,
        archived_at    DATETIMEOFFSET(7)    NOT NULL CONSTRAINT df_archive_file__archived_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_archive_file PRIMARY KEY CLUSTERED (archive_id),
        CONSTRAINT uq_archive_file UNIQUE (history_table, period_month, tenant_id),
        CONSTRAINT ck_archive_file__month CHECK (DAY(period_month) = 1),
        CONSTRAINT ck_archive_file__rows CHECK (row_count >= 0 AND file_bytes > 0)
    );
    CREATE NONCLUSTERED INDEX ix_archive_file__tenant ON audit.archive_file (tenant_id, period_month DESC) INCLUDE (history_table, row_count);
    PRINT '>> audit.archive_file created.';
END
GO

-- @table   audit.archive_month
-- @purpose A history table's closed month archived for every tenant (row and tenant counts). Database-wide: no tenant_id; gecko_app denied.
-- @owner   Platform audit
-- @flags   A
-- @phase   12
IF OBJECT_ID('audit.archive_month') IS NULL
BEGIN
    CREATE TABLE audit.archive_month (
        history_table  NVARCHAR(260)     NOT NULL,
        period_month   DATE              NOT NULL,
        row_count      BIGINT            NOT NULL,
        tenant_count   INT               NOT NULL,
        completed_at   DATETIMEOFFSET(7) NOT NULL CONSTRAINT df_archive_month__completed_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_archive_month PRIMARY KEY CLUSTERED (history_table, period_month),
        CONSTRAINT ck_archive_month__month CHECK (DAY(period_month) = 1)
    );
    PRINT '>> audit.archive_month created.';
END
GO

-- The worker inserts and reads; nobody updates or deletes. gecko_app gets nothing:
-- the 01 schema-wide audit grant would otherwise let a request read them.
GRANT SELECT, INSERT ON audit.ledger_digest       TO gecko_system;
GRANT SELECT, INSERT ON audit.ledger_verification TO gecko_system;
GRANT SELECT, INSERT ON audit.archive_file        TO gecko_system;
GRANT SELECT, INSERT ON audit.archive_month       TO gecko_system;
DENY UPDATE, DELETE ON audit.ledger_digest       TO gecko_system;
DENY UPDATE, DELETE ON audit.ledger_verification TO gecko_system;
DENY UPDATE, DELETE ON audit.archive_file        TO gecko_system;
DENY UPDATE, DELETE ON audit.archive_month       TO gecko_system;
DENY SELECT, INSERT, UPDATE, DELETE ON audit.ledger_digest       TO gecko_app;
DENY SELECT, INSERT, UPDATE, DELETE ON audit.ledger_verification TO gecko_app;
DENY SELECT, INSERT, UPDATE, DELETE ON audit.archive_file        TO gecko_app;
DENY SELECT, INSERT, UPDATE, DELETE ON audit.archive_month       TO gecko_app;
GO

-- Digest + verify. VIEW LEDGER CONTENT is enough on SQL Server 2025; Azure SQL may
-- also know GENERATE LEDGER DIGEST: granted where it exists, skipped where not.
GRANT VIEW LEDGER CONTENT TO gecko_system;
IF EXISTS (SELECT 1 FROM sys.fn_builtin_permissions('DATABASE') WHERE permission_name = 'GENERATE LEDGER DIGEST')
    EXEC (N'GRANT GENERATE LEDGER DIGEST TO gecko_system;');
GO

-- Neither app login runs DDL: neither may switch versioning off or touch history.
DECLARE @db sysname = QUOTENAME(DB_NAME());
EXEC (N'DENY ALTER ON DATABASE::' + @db + N' TO gecko_app; DENY ALTER ON DATABASE::' + @db + N' TO gecko_system;');
GO
DENY ALTER, TAKE OWNERSHIP ON SCHEMA::history TO gecko_app;
DENY ALTER, TAKE OWNERSHIP ON SCHEMA::history TO gecko_system;
DENY ALTER, TAKE OWNERSHIP ON SCHEMA::audit   TO gecko_app;
DENY ALTER, TAKE OWNERSHIP ON SCHEMA::audit   TO gecko_system;
GO

IF EXISTS (SELECT 1 FROM sys.database_role_members m
           JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
           JOIN sys.database_principals u ON u.principal_id = m.member_principal_id
           WHERE u.name IN ('gecko_app', 'gecko_system') AND r.name IN ('db_owner', 'db_ddladmin'))
    PRINT '!! WARNING: an app login is db_owner / db_ddladmin here: the DENYs above do not bind a db_owner. Remove that membership.';
GO

-- Snapshot isolation (sys.sp_verify_database_ledger needs it) is set by
-- 00_create_database.sql: ALTER DATABASE cannot run inside a run file's
-- transaction. On by default on Azure SQL. Checked here, not changed.
IF (SELECT snapshot_isolation_state FROM sys.databases WHERE database_id = DB_ID()) <> 1
    THROW 50343, 'ALLOW_SNAPSHOT_ISOLATION is off: run, outside a transaction, ALTER DATABASE <this db> SET ALLOW_SNAPSHOT_ISOLATION ON; then run this file again.', 1;
GO

-- Self-check: the activity table really is an append-only ledger.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE object_id = OBJECT_ID('audit.activity') AND ledger_type = 3)   -- 3 = APPEND_ONLY_LEDGER_TABLE
    THROW 50341, 'audit.activity exists but is not an APPEND_ONLY ledger table (drop it while empty and re-run).', 1;
GO

EXEC dbo.usp_record_script '21_audit.sql', N'audit.activity append-only LEDGER (platform shape) + ledger_digest / ledger_verification / archive_file / archive_month (worker only, gecko_app denied), VIEW LEDGER CONTENT, DENY ALTER for app logins, snapshot isolation checked (set in 00). Retention not switched on. Re-run 91.';
GO

PRINT '>> 21_audit.sql completed. Now re-run 91_rls_policy.sql.';
GO
