-- ============================================================
-- GECKO REPAIR (M&R) — ROW-LEVEL SECURITY POLICY
-- Script: 91_rls_policy.sql
--
-- GENERATED from every table that has tenant_id — the gecko_master 10 /
-- gecko_revenue 08 pattern, which exists because gecko_identity's hand-written
-- policy missed two BLOCK predicates that only running statements found.
-- Copied from gecko_fleet 91 with Repair's schema lists; logic unchanged.
-- Run it LAST, after the table scripts (and again after any script that adds a table):
-- it drops and rebuilds the one policy, which changes the policy object and
-- no table.
--
-- Every tenant table gets FILTER + BLOCK AFTER INSERT + BLOCK AFTER UPDATE.
-- Every temporal history table gets a FILTER of its own: SQL Server does NOT
-- extend a table's policy to its history table (found in gecko_revenue 14:
-- gecko_app with no tenant context could read every tenant's history rows).
--
-- Then the guards. Each one THROWs, failing the deployment, rather than
-- leaving a database that is open across tenants:
--   50331  a tenant table without the full predicate set
--   50332  a table in a tenant schema without tenant_id
--   50333  a dbo function gecko_app cannot EXECUTE (gecko_master 14's lesson)
--   50334  a history table readable across tenants
--   50335  a table in a schema this script does not know about
--   (50336, the lookup guard, is not needed: gecko_repair has no lookup schema —
--    global vocab is read from gecko_master through IMasterDataReferences)
--   50337  a tenant schema where DELETE is not denied (soft delete only)
--   50338  an append-only-shaped table without DENY UPDATE
--   50339  a table in rpt (views only)
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ------------------------------------------------------------
-- The policy is NEVER dropped (owner rule, 2026-11-07). Between a DROP and the
-- next CREATE every tenant's rows are readable by every tenant, and a failed
-- CREATE would leave them that way. So this section lists the predicates the
-- database needs in #want, and the APPLY block below:
--   * no policy yet        -> CREATE it with all of them (a new database);
--   * the policy exists    -> ONE ALTER ... ADD for the missing ones only. One
--                             statement = all or nothing; tables already
--                             covered keep their predicates throughout;
--   * a predicate exists but differs from the wanted one -> THROW, nothing changed.
-- Re-running the script is safe and adds nothing when the policy is complete.
-- ------------------------------------------------------------
SET XACT_ABORT ON;
IF OBJECT_ID('tempdb..#want') IS NOT NULL DROP TABLE #want;
CREATE TABLE #want (
    sort    INT IDENTITY(1,1) NOT NULL,
    obj_id  INT               NOT NULL,
    target  NVARCHAR(300)     NOT NULL,
    kind    VARCHAR(6)        NOT NULL,   -- FILTER | BLOCK
    op      VARCHAR(20)       NULL,       -- NULL for FILTER; AFTER INSERT | AFTER UPDATE | BEFORE UPDATE
    pred    NVARCHAR(400)     NOT NULL);

-- Every tenant table: FILTER (other tenants' rows invisible to SELECT / UPDATE /
-- DELETE) + BLOCK AFTER INSERT / AFTER UPDATE (a write that would land outside the
-- caller's tenant is refused).
INSERT INTO #want (obj_id, target, kind, op, pred)
SELECT t.object_id, QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name), k.kind, k.op,
       N'dbo.fn_tenant_security_predicate(tenant_id)'
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'tenant_id'
CROSS JOIN (VALUES (1, 'FILTER', CAST(NULL AS VARCHAR(20))), (2, 'BLOCK', 'AFTER INSERT'), (3, 'BLOCK', 'AFTER UPDATE')) k (n, kind, op)
WHERE t.temporal_type <> 1            -- 1 = history table: FILTER only, below
  AND SCHEMA_NAME(t.schema_id) NOT IN ('history','dbo')
ORDER BY SCHEMA_NAME(t.schema_id), t.name, k.n;
DECLARE @count INT = @@ROWCOUNT / 3;

-- History tables get a FILTER of their own: SQL Server does not extend a
-- table's policy to its temporal history table. BLOCK is not allowed there,
-- and not needed: only the engine writes there.
INSERT INTO #want (obj_id, target, kind, op, pred)
SELECT t.object_id, QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name), 'FILTER', NULL,
       N'dbo.fn_tenant_security_predicate(tenant_id)'
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'tenant_id'
WHERE t.temporal_type = 1
ORDER BY SCHEMA_NAME(t.schema_id), t.name;
DECLARE @history_count INT = @@ROWCOUNT;

IF @count = 0
    THROW 50330, 'No tenant tables found — run the table scripts before this one.', 1;

PRINT '>> wanted: ' + CAST(@count AS VARCHAR) + ' tenant table(s) x 3 predicates + a FILTER on '
    + CAST(@history_count AS VARCHAR) + ' history table(s).';

-- ---------- APPLY (same block in every gecko_* policy script) ----------
DECLARE @policy_id INT = (SELECT object_id FROM sys.security_policies WHERE name = N'tenant_isolation_policy');

DECLARE @differs NVARCHAR(MAX) = (
    SELECT STRING_AGG(CAST(w.target + N' ' + w.kind + ISNULL(N' ' + w.op, N'') AS NVARCHAR(MAX)), N', ')
    FROM #want w
    JOIN sys.security_predicates p
      ON p.object_id = @policy_id AND p.target_object_id = w.obj_id
     AND p.predicate_type_desc COLLATE DATABASE_DEFAULT = w.kind COLLATE DATABASE_DEFAULT
     AND ISNULL(p.operation_desc COLLATE DATABASE_DEFAULT, N'') = ISNULL(w.op COLLATE DATABASE_DEFAULT, N'')
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(p.predicate_definition COLLATE DATABASE_DEFAULT, N'[', N''), N']', N''), N'(', N''), N')', N''), N' ', N'')
       <> REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(w.pred COLLATE DATABASE_DEFAULT, N'[', N''), N']', N''), N'(', N''), N')', N''), N' ', N''));
IF @differs IS NOT NULL
BEGIN
    PRINT 'Existing predicates that differ from the wanted ones: ' + @differs;
    THROW 50340, 'An existing tenant predicate differs from the one this script wants. Nothing was changed: fix it by hand with ALTER SECURITY POLICY ... ALTER.', 1;
END

DECLARE @missing INT, @body NVARCHAR(MAX);
SELECT @missing = COUNT(*),
       @body = STRING_AGG(CAST(N'    ADD ' + CASE w.kind WHEN 'FILTER' THEN N'FILTER PREDICATE ' ELSE N'BLOCK  PREDICATE ' END
                               + w.pred + N' ON ' + w.target + ISNULL(N' ' + w.op, N'') AS NVARCHAR(MAX)),
                          N',' + CHAR(13) + CHAR(10)) WITHIN GROUP (ORDER BY w.sort)
FROM #want w
WHERE NOT EXISTS (SELECT 1 FROM sys.security_predicates p
                  WHERE p.object_id = @policy_id AND p.target_object_id = w.obj_id
                    AND p.predicate_type_desc COLLATE DATABASE_DEFAULT = w.kind COLLATE DATABASE_DEFAULT
                    AND ISNULL(p.operation_desc COLLATE DATABASE_DEFAULT, N'') = ISNULL(w.op COLLATE DATABASE_DEFAULT, N''));

DECLARE @policy_sql NVARCHAR(MAX) = CASE
    WHEN @policy_id IS NULL THEN N'CREATE SECURITY POLICY dbo.tenant_isolation_policy' + CHAR(13) + CHAR(10) + @body + CHAR(13) + CHAR(10) + N'WITH (STATE = ON);'
    WHEN @missing > 0      THEN N'ALTER SECURITY POLICY dbo.tenant_isolation_policy' + CHAR(13) + CHAR(10) + @body + N';'
END;
IF @policy_sql IS NOT NULL
    EXEC sp_executesql @policy_sql;

-- A policy someone switched off is switched back on (never the other way).
IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'tenant_isolation_policy' AND is_enabled = 0)
BEGIN
    EXEC (N'ALTER SECURITY POLICY dbo.tenant_isolation_policy WITH (STATE = ON);');   -- dynamic: the batch must compile on a database with no policy yet
    PRINT '>> tenant_isolation_policy was OFF: switched ON.';
END

PRINT CASE WHEN @policy_id IS NULL THEN '>> tenant_isolation_policy CREATED with '
           ELSE '>> tenant_isolation_policy kept (not dropped); added ' END
    + CAST(ISNULL(@missing, 0) AS VARCHAR) + ' predicate(s).';
DROP TABLE #want;
GO

-- ------------------------------------------------------------
-- Guard 50331: every tenant table carries all three predicates.
-- ------------------------------------------------------------
DECLARE @missing NVARCHAR(MAX) = (
    SELECT STRING_AGG(x.tbl, ', ')
    FROM (
        SELECT SCHEMA_NAME(t.schema_id) + '.' + t.name AS tbl
        FROM sys.tables t
        JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'tenant_id'
        WHERE t.temporal_type <> 1
          AND SCHEMA_NAME(t.schema_id) NOT IN ('history','dbo')
          AND (SELECT COUNT(*) FROM sys.security_predicates p WHERE p.target_object_id = t.object_id) < 3
    ) x);

IF @missing IS NOT NULL
BEGIN
    PRINT 'Without FILTER + BLOCK(INSERT) + BLOCK(UPDATE): ' + @missing;
    THROW 50331, 'Tenant tables without the full predicate set exist.', 1;
END

PRINT '>> Every tenant table carries FILTER + BLOCK(INSERT) + BLOCK(UPDATE).';
GO

-- ------------------------------------------------------------
-- Guard 50332: a table in a tenant schema WITHOUT tenant_id would sit outside
-- the policy entirely. None are allowed. (Schemas without tables yet are
-- listed too: the guard must hold from the day their first table exists.)
--
-- Exception (the platform 34_audit_integrity pattern, copied into Repair's
-- audit script in a later phase): audit.ledger_digest, ledger_verification
-- and archive_month are database-wide by design (one ledger digest / one archived
-- month covers every tenant). They are exempt ONLY while gecko_app is DENIED
-- SELECT on them, so a request can never read them; the worker reads them as
-- gecko_system in system context. Lose that DENY and the guard fires again.
-- ------------------------------------------------------------
DECLARE @untenanted NVARCHAR(MAX) = (
    SELECT STRING_AGG(SCHEMA_NAME(t.schema_id) + '.' + t.name, ', ')
    FROM sys.tables t
    WHERE SCHEMA_NAME(t.schema_id) IN ('config','intake','integ','unit','code','mcase','survey','est','work','clean','reefer','mods','incident','part','vend','charge','exch','doc','sec','audit',
                                       'outbox','inbox','archive')
      AND NOT EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id = t.object_id AND c.name = 'tenant_id')
      AND NOT (SCHEMA_NAME(t.schema_id) = 'audit'
               AND t.name IN ('ledger_digest','ledger_verification','archive_month')
               AND EXISTS (SELECT 1 FROM sys.database_permissions dp
                           JOIN sys.database_principals pr ON pr.principal_id = dp.grantee_principal_id
                           WHERE dp.class = 1 AND dp.major_id = t.object_id AND dp.minor_id = 0
                             AND dp.permission_name = 'SELECT' AND dp.state = 'D' AND pr.name = 'gecko_app')));
IF @untenanted IS NOT NULL
BEGIN
    PRINT 'No tenant_id: ' + @untenanted;
    THROW 50332, 'A table in a tenant schema has no tenant_id, so RLS cannot cover it.', 1;
END
PRINT '>> Every table in a tenant schema has tenant_id (the 3 database-wide audit integrity tables excepted: gecko_app is denied them).';
GO

-- ------------------------------------------------------------
-- Guard 50333: a dbo function no application login can EXECUTE is dead
-- weight (RLS predicate functions excluded — the engine calls those itself,
-- and granting EXECUTE would let the app probe the policy).
-- ------------------------------------------------------------
DECLARE @ungranted NVARCHAR(MAX);
SELECT @ungranted = STRING_AGG(o.name, ', ')
FROM sys.objects o
WHERE o.type IN ('FN', 'IF', 'TF')
  AND SCHEMA_NAME(o.schema_id) = 'dbo'
  AND o.is_ms_shipped = 0
  AND NOT EXISTS (SELECT 1 FROM sys.security_predicates sp WHERE sp.predicate_definition COLLATE DATABASE_DEFAULT LIKE '%' + o.name COLLATE DATABASE_DEFAULT + '%')
  AND NOT EXISTS (
        SELECT 1 FROM sys.database_permissions p
        JOIN sys.database_principals u ON u.principal_id = p.grantee_principal_id
        WHERE p.major_id = o.object_id AND p.permission_name = 'EXECUTE' AND p.state = 'G' AND u.name = 'gecko_app');
IF @ungranted IS NOT NULL
BEGIN
    PRINT 'Functions gecko_app cannot execute: ' + @ungranted;
    THROW 50333, 'A dbo function has no EXECUTE grant for gecko_app.', 1;
END
GO

-- ------------------------------------------------------------
-- Guard 50334: every history table that carries tenant_id is filtered too.
-- ------------------------------------------------------------
DECLARE @unfiltered_history NVARCHAR(MAX) = (
    SELECT STRING_AGG(SCHEMA_NAME(t.schema_id) + '.' + t.name, ', ')
    FROM sys.tables t
    JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'tenant_id'
    WHERE t.temporal_type = 1
      AND NOT EXISTS (SELECT 1 FROM sys.security_predicates p
                      WHERE p.target_object_id = t.object_id AND p.predicate_type_desc = 'FILTER'));
IF @unfiltered_history IS NOT NULL
BEGIN
    PRINT 'History tables without a FILTER predicate: ' + @unfiltered_history;
    THROW 50334, 'A temporal history table is readable across tenants.', 1;
END
PRINT '>> Every tenant history table carries a FILTER predicate.';
GO

-- ------------------------------------------------------------
-- Guard 50335: no table may live in a schema this script does not classify.
-- A new schema must be added to the lists here (and granted in 01) on purpose,
-- not discovered later as a hole.
-- ------------------------------------------------------------
DECLARE @unknown NVARCHAR(MAX) = (
    SELECT STRING_AGG(SCHEMA_NAME(t.schema_id) + '.' + t.name, ', ')
    FROM sys.tables t
    WHERE t.is_ms_shipped = 0
      AND SCHEMA_NAME(t.schema_id) NOT IN ('config','intake','integ','unit','code','mcase','survey','est','work','clean','reefer','mods','incident','part','vend','charge','exch','doc','sec','audit',
                                           'outbox','inbox','archive','history','rpt','dbo'));
IF @unknown IS NOT NULL
BEGIN
    PRINT 'Tables in unclassified schemas: ' + @unknown;
    THROW 50335, 'A table exists in a schema that is neither tenant, global nor system.', 1;
END
GO

-- ------------------------------------------------------------
-- Guard 50337: soft delete only. Every tenant schema (outbox/inbox excepted —
-- their purge deletes; the outbox/inbox script sets their grants) denies DELETE to both roles.
-- ------------------------------------------------------------
DECLARE @deletable NVARCHAR(MAX) = (
    SELECT STRING_AGG(s.name + '/' + r.name, ', ')
    FROM sys.schemas s
    CROSS JOIN (VALUES ('gecko_app'), ('gecko_system')) AS r(name)
    WHERE s.name IN ('config','intake','integ','unit','code','mcase','survey','est','work','clean','reefer','mods','incident','part','vend','charge','exch','doc','sec','audit','archive')
      AND NOT EXISTS (
            SELECT 1 FROM sys.database_permissions dp
            JOIN sys.database_principals pr ON pr.principal_id = dp.grantee_principal_id
            WHERE dp.class = 3 AND dp.major_id = s.schema_id
              AND dp.permission_name = 'DELETE' AND dp.state = 'D' AND pr.name = r.name));
IF @deletable IS NOT NULL
BEGIN
    PRINT 'Schema/role pairs without DENY DELETE: ' + @deletable;
    THROW 50337, 'A tenant schema allows hard DELETE. Run dbo.usp_grant_tenant_schema for it.', 1;
END
PRINT '>> DELETE is denied on every tenant schema.';
GO

-- ------------------------------------------------------------
-- Guard 50338: a table shaped append-only (created_at but no updated_at) in a
-- tenant schema must be write-once in fact: DENY UPDATE to gecko_app, either
-- on the object (usp_make_append_only) or on its schema. Queues and archive
-- copies are excluded (their own rules apply).
-- ------------------------------------------------------------
DECLARE @mutable_ledgers NVARCHAR(MAX) = (
    SELECT STRING_AGG(SCHEMA_NAME(t.schema_id) + '.' + t.name, ', ')
    FROM sys.tables t
    WHERE SCHEMA_NAME(t.schema_id) IN ('config','intake','integ','unit','code','mcase','survey','est','work','clean','reefer','mods','incident','part','vend','charge','exch','doc','sec','audit')
      AND t.temporal_type <> 1
      AND EXISTS     (SELECT 1 FROM sys.columns c WHERE c.object_id = t.object_id AND c.name = 'created_at')
      AND NOT EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id = t.object_id AND c.name = 'updated_at')
      AND NOT EXISTS (
            SELECT 1 FROM sys.database_permissions dp
            JOIN sys.database_principals pr ON pr.principal_id = dp.grantee_principal_id
            WHERE dp.permission_name = 'UPDATE' AND dp.state = 'D' AND pr.name = 'gecko_app'
              AND ((dp.class = 1 AND dp.major_id = t.object_id AND dp.minor_id = 0)
                OR (dp.class = 3 AND dp.major_id = t.schema_id))));
IF @mutable_ledgers IS NOT NULL
BEGIN
    PRINT 'Append-only tables gecko_app can still UPDATE: ' + @mutable_ledgers;
    THROW 50338, 'An append-only table is missing EXEC dbo.usp_make_append_only.', 1;
END
PRINT '>> Every append-only table denies UPDATE.';
GO

-- ------------------------------------------------------------
-- Guard 50339: rpt holds views only (they inherit base-table RLS; a table
-- there would not).
-- ------------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.tables WHERE SCHEMA_NAME(schema_id) = 'rpt')
    THROW 50339, 'rpt.* must contain views only.', 1;
GO

EXEC dbo.usp_record_script '91_rls_policy.sql', N'tenant_isolation_policy generated from every tenant_id table + history FILTERs; guards: predicates, untenanted, function grants, history, unknown schema, DENY DELETE, append-only, rpt views-only';
GO

PRINT '>> 91_rls_policy.sql completed.';
GO
