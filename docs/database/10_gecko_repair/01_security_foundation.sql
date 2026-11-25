-- ============================================================
-- GECKO REPAIR (M&R) — SECURITY FOUNDATION AND DEPLOY HELPERS
-- Script: 01_security_foundation.sql
--
-- Same contract as gecko_identity, gecko_master, gecko_revenue and gecko_trucking, deliberately
-- unchanged: one fail-closed predicate, one read-only way to set the tenant,
-- the same two logins. Gecko.Data's interceptors therefore scope this database
-- without a line of new C#. The POLICY itself is generated in 91_rls_policy.sql
-- once every table exists.
--
-- Also creates the three DEPLOY-TIME helpers every later script calls:
--   dbo.usp_grant_tenant_schema  standard grants + DENY DELETE on one schema
--   dbo.usp_enable_temporal      system versioning into history.<schema>_<table>
--   dbo.usp_make_append_only     DENY UPDATE, DELETE on one table
-- They run at deployment time AS THE DEPLOYING ADMIN (sysadmin / db_owner).
-- No application login is granted EXECUTE on them: they change permissions
-- and table structure, which the application must never do.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ------------------------------------------------------------
-- 1. Predicate — FAIL-CLOSED. Identical to gecko_revenue 01 / gecko_master 01.
--    A row is visible only when its tenant_id equals the session's TenantId,
--    or when a gecko_system (or sysadmin) session has declared system context.
--    No TenantId in the session = no rows, never all rows.
--    Skipped while the policy exists (SCHEMABINDING); 91 rebuilds the policy.
--    The same function body as gecko_trucking 01, so Gecko.Data's
--    TenantSessionInterceptor works here unchanged.
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.security_policies WHERE name = 'tenant_isolation_policy')
EXEC('
CREATE OR ALTER FUNCTION dbo.fn_tenant_security_predicate(@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
    RETURN SELECT 1 AS fn_result
    WHERE
        @tenant_id = CAST(SESSION_CONTEXT(N''TenantId'') AS UNIQUEIDENTIFIER)
        OR (
            CAST(SESSION_CONTEXT(N''IsSystemContext'') AS BIT) = 1
            AND (IS_ROLEMEMBER(''gecko_system'') = 1 OR IS_SRVROLEMEMBER(''sysadmin'') = 1)
        );
');
GO

-- ------------------------------------------------------------
-- 2. The ONE way to scope a request (read-only session key: once set, a
--    connection cannot be re-pointed at another tenant).
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.usp_set_tenant_context
    @tenant_id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    IF @tenant_id IS NULL
        THROW 50010, 'TenantId is required. A request with no tenant must not reach the database.', 1;
    EXEC sp_set_session_context @key = N'TenantId', @value = @tenant_id, @read_only = 1;
END
GO

-- ------------------------------------------------------------
-- 3. Users for the server logins created by gecko_identity/09.
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gecko_app')
   OR NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'gecko_system')
    THROW 50001, 'Logins gecko_app / gecko_system are missing. Run gecko_identity/09_security_hardening.sql first.', 1;
GO

IF DATABASE_PRINCIPAL_ID('gecko_app_user') IS NULL    CREATE USER gecko_app_user    FOR LOGIN gecko_app;
IF DATABASE_PRINCIPAL_ID('gecko_system_user') IS NULL CREATE USER gecko_system_user FOR LOGIN gecko_system;
GO

IF IS_ROLEMEMBER('gecko_app',    'gecko_app_user')    = 0 ALTER ROLE gecko_app    ADD MEMBER gecko_app_user;
IF IS_ROLEMEMBER('gecko_system', 'gecko_system_user') = 0 ALTER ROLE gecko_system ADD MEMBER gecko_system_user;
-- The system login must not also hold the app role: the two are audited apart.
IF IS_ROLEMEMBER('gecko_app', 'gecko_system_user') = 1 ALTER ROLE gecko_app DROP MEMBER gecko_system_user;
GO

-- ------------------------------------------------------------
-- 4. dbo.usp_grant_tenant_schema — DEPLOY-TIME HELPER (run as admin)
--    SELECT, INSERT, UPDATE for both roles; DENY DELETE (soft delete only).
--    Schema-level, so tables added later are covered automatically.
--    A schema added in a later phase calls this in the script that creates it.
--    Idempotent: GRANT and DENY can be repeated safely.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.usp_grant_tenant_schema
    @schema SYSNAME
AS
BEGIN
    SET NOCOUNT ON;
    IF SCHEMA_ID(@schema) IS NULL
        THROW 50020, 'usp_grant_tenant_schema: schema does not exist.', 1;
    IF @schema IN ('history', 'outbox', 'inbox', 'dbo', 'rpt', 'archive')
        THROW 50021, 'usp_grant_tenant_schema: this schema has its own grant rules (see 01 and the outbox/inbox script).', 1;

    DECLARE @sql NVARCHAR(MAX) =
          N'GRANT SELECT, INSERT, UPDATE ON SCHEMA::' + QUOTENAME(@schema) + N' TO gecko_app;'
        + N'GRANT SELECT, INSERT, UPDATE ON SCHEMA::' + QUOTENAME(@schema) + N' TO gecko_system;'
        + N'DENY DELETE ON SCHEMA::' + QUOTENAME(@schema) + N' TO gecko_app;'
        + N'DENY DELETE ON SCHEMA::' + QUOTENAME(@schema) + N' TO gecko_system;';
    EXEC sp_executesql @sql;
END
GO

-- ------------------------------------------------------------
-- 5. Grants
-- ------------------------------------------------------------
DECLARE @schema SYSNAME;
DECLARE schemas CURSOR LOCAL FAST_FORWARD FOR
    SELECT name FROM (VALUES
        ('config'), ('intake'), ('integ'), ('unit'), ('code'), ('mcase'), ('survey'), ('est'),
        ('work'), ('clean'), ('reefer'), ('mods'), ('incident'), ('part'), ('vend'), ('charge'),
        ('exch'), ('doc'), ('sec'), ('audit')
    ) AS s(name)
    WHERE SCHEMA_ID(s.name) IS NOT NULL;
OPEN schemas;
FETCH NEXT FROM schemas INTO @schema;
WHILE @@FETCH_STATUS = 0
BEGIN
    EXEC dbo.usp_grant_tenant_schema @schema = @schema;
    FETCH NEXT FROM schemas INTO @schema;
END
CLOSE schemas;
DEALLOCATE schemas;
GO

-- audit.* is a log: nobody edits a log. The per-table DENY from
-- usp_make_append_only repeats this, so a table moved into another schema keeps it.
DENY UPDATE ON SCHEMA::audit TO gecko_app;
DENY UPDATE ON SCHEMA::audit TO gecko_system;
GO

-- history.* is written by the engine only (system versioning).
GRANT SELECT ON SCHEMA::history TO gecko_app;
GRANT SELECT ON SCHEMA::history TO gecko_system;
DENY INSERT, UPDATE, DELETE ON SCHEMA::history TO gecko_app;
DENY INSERT, UPDATE, DELETE ON SCHEMA::history TO gecko_system;

-- archive.* is written by the archival job (gecko_system); the app only reads
-- it through the "archived" API path. Rows are never edited once archived.
GRANT SELECT ON SCHEMA::archive TO gecko_app;
GRANT SELECT, INSERT ON SCHEMA::archive TO gecko_system;
DENY INSERT, UPDATE, DELETE ON SCHEMA::archive TO gecko_app;
DENY UPDATE, DELETE ON SCHEMA::archive TO gecko_system;

-- rpt.* holds views only; base-table RLS applies through them.
GRANT SELECT ON SCHEMA::rpt TO gecko_app;
GRANT SELECT ON SCHEMA::rpt TO gecko_system;

-- outbox.* and inbox.* are queues: their grants (including the DELETE the
-- purge needs) are set in the outbox/inbox script (13–15 range), not here.

GRANT EXECUTE ON dbo.usp_set_tenant_context TO gecko_app;
GRANT EXECUTE ON dbo.usp_set_tenant_context TO gecko_system;
GRANT SELECT ON dbo.schema_version TO gecko_app;
GRANT SELECT ON dbo.schema_version TO gecko_system;
GO

-- ------------------------------------------------------------
-- 6. dbo.usp_enable_temporal — DEPLOY-TIME HELPER (run as admin)
--
-- Copied from gecko_fleet 01 / gecko_trucking 01 (the gecko_revenue 09 pattern), one table at a time so each CREATE TABLE can
-- switch itself on right away (flag T in the annotation block):
--   * HIDDEN period columns sys_valid_from / sys_valid_to, so SELECT * and
--     EF scaffolding are unaffected;
--   * history table history.<schema>_<table>, created by the engine;
--   * HISTORY_RETENTION_PERIOD = 24 MONTHS (operational history is kept
--     online two years, then the engine trims it — same as Trucking).
-- 91 adds a FILTER predicate to every history table: SQL Server does NOT
-- extend a table's RLS policy to its history table.
--
-- Idempotent: a table already versioned is left alone; a table that has the
-- period columns but not versioning (a half-finished earlier run) only gets
-- versioning switched on.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.usp_enable_temporal
    @schema SYSNAME,
    @table  SYSNAME
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @object_id INT = OBJECT_ID(QUOTENAME(@schema) + N'.' + QUOTENAME(@table));
    IF @object_id IS NULL
        THROW 50030, 'usp_enable_temporal: table not found.', 1;

    IF (SELECT temporal_type FROM sys.tables WHERE object_id = @object_id) = 2
        RETURN;   -- already system-versioned

    DECLARE @target  NVARCHAR(300) = QUOTENAME(@schema) + N'.' + QUOTENAME(@table);
    DECLARE @history NVARCHAR(300) = N'history.' + QUOTENAME(@schema + N'_' + @table);
    DECLARE @sql NVARCHAR(MAX);

    IF NOT EXISTS (SELECT 1 FROM sys.periods WHERE object_id = @object_id)
    BEGIN
        SET @sql = N'ALTER TABLE ' + @target + N' ADD
            sys_valid_from DATETIME2(7) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
                CONSTRAINT ' + QUOTENAME(N'df_' + @schema + N'_' + @table + N'__sys_valid_from') + N' DEFAULT SYSUTCDATETIME(),
            sys_valid_to   DATETIME2(7) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
                CONSTRAINT ' + QUOTENAME(N'df_' + @schema + N'_' + @table + N'__sys_valid_to')   + N' DEFAULT CONVERT(DATETIME2(7), ''9999-12-31 23:59:59.9999999''),
            PERIOD FOR SYSTEM_TIME (sys_valid_from, sys_valid_to);';
        EXEC sp_executesql @sql;
    END

    SET @sql = N'ALTER TABLE ' + @target + N' SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = ' + @history
             + N', DATA_CONSISTENCY_CHECK = ON, HISTORY_RETENTION_PERIOD = 24 MONTHS));';
    EXEC sp_executesql @sql;

    PRINT '>> system versioning enabled on ' + @schema + '.' + @table + ' -> history.' + @schema + '_' + @table;
END
GO

-- ------------------------------------------------------------
-- 7. dbo.usp_make_append_only — DEPLOY-TIME HELPER (run as admin)
--
-- Flag A tables are ledgers: a correction is a new reversing row, never an
-- edit. DENY UPDATE, DELETE on the object to both roles makes that a database
-- fact rather than a coding rule. (A DENY beats any schema-level GRANT.)
-- Partition SWITCH-out by the archival job runs as admin and is unaffected.
-- Idempotent: only issues the DENY when it is not already in place.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.usp_make_append_only
    @schema SYSNAME,
    @table  SYSNAME
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @object_id INT = OBJECT_ID(QUOTENAME(@schema) + N'.' + QUOTENAME(@table));
    IF @object_id IS NULL
        THROW 50040, 'usp_make_append_only: table not found.', 1;

    DECLARE @target NVARCHAR(300) = QUOTENAME(@schema) + N'.' + QUOTENAME(@table);
    DECLARE @role SYSNAME, @perm VARCHAR(10), @sql NVARCHAR(MAX);

    DECLARE pairs CURSOR LOCAL FAST_FORWARD FOR
        SELECT r.name, p.perm
        FROM (VALUES ('gecko_app'), ('gecko_system')) AS r(name)
        CROSS JOIN (VALUES ('UPDATE'), ('DELETE')) AS p(perm);
    OPEN pairs;
    FETCH NEXT FROM pairs INTO @role, @perm;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.database_permissions dp
            JOIN sys.database_principals pr ON pr.principal_id = dp.grantee_principal_id
            WHERE dp.class = 1 AND dp.major_id = @object_id AND dp.minor_id = 0
              AND dp.permission_name = @perm AND dp.state = 'D' AND pr.name = @role)
        BEGIN
            SET @sql = N'DENY ' + @perm + N' ON OBJECT::' + @target + N' TO ' + QUOTENAME(@role) + N';';
            EXEC sp_executesql @sql;
        END
        FETCH NEXT FROM pairs INTO @role, @perm;
    END
    CLOSE pairs;
    DEALLOCATE pairs;
END
GO

EXEC dbo.usp_record_script '01_security_foundation.sql', N'RLS predicate, usp_set_tenant_context, users, schema grants + DENY DELETE, deploy helpers usp_grant_tenant_schema / usp_enable_temporal / usp_make_append_only';
GO

PRINT '>> 01_security_foundation.sql completed.';
GO
