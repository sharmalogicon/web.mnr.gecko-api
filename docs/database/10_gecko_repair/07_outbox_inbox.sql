-- ============================================================
-- GECKO REPAIR (M&R) — TRANSACTIONAL OUTBOX AND INBOX (P2)
-- Script: 07_outbox_inbox.sql
--
-- outbox.message: the platform design (gecko_tos 06 / gecko_portal 06), copied
-- with the text unchanged so the dispatcher is one implementation for every
-- database. Gecko.Repair.Api drains ONLY this outbox (doc 02 §6.2).
-- Platform events Repair publishes (written in the SAME transaction as the change):
--   repair.case.opened / completed, repair.estimate.submitted / approved / rejected,
--   repair.pti.failed, repair.certificate.expiring, repair.incident.raised,
--   repair.charges.ready -> Notification, Portal (phase 2), Revenue intake.
-- (Events for OUTSIDE systems are integ.outbound_event, not this table.)
--
-- inbox.processed: every platform message from another context handled ONCE
-- (TOS ContainerSurveyed / GatedOut / HoldReleased through the GECKO_TOS
-- adapter registered in Gecko.Api, Revenue charge status, PortHub, Identity
-- tenant module changes). Keyed per tenant, source, message id, type and
-- aggregate from the start (the gecko_revenue 44 lesson: outbox ids restart).
--
-- Delivery is AT LEAST ONCE; the inbox is how Repair dedupes.
-- No security policy here — 91 generates it from every tenant_id table.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ------------------------------------------------------------
-- outbox.message
--
-- BIGINT IDENTITY, not a GUID: the clustered key IS the publication order.
-- A dispatcher that reads by message_id replays events in the order they
-- happened, which matters when TenantModuleEnabled is followed seconds
-- later by TenantModuleDisabled.
--
-- No soft delete. This is a queue, not a record — processed rows are
-- archived and purged, and a `deleted_at` here would mean a message that
-- looks unsent forever.
-- ------------------------------------------------------------
IF OBJECT_ID('outbox.message') IS NULL
BEGIN
    CREATE TABLE outbox.message (
        message_id      BIGINT              IDENTITY(1,1) NOT NULL,
        tenant_id       UNIQUEIDENTIFIER    NOT NULL,   -- denormalised so RLS covers it directly

        aggregate_type  VARCHAR(50)         NOT NULL,   -- REPAIR_CASE, ESTIMATE, WORK_ORDER, PTI_JOB, CHARGE_RELEASE ...
        aggregate_id    UNIQUEIDENTIFIER    NULL,
        message_type    VARCHAR(100)        NOT NULL,   -- repair.estimate.submitted, repair.case.completed, ...
        payload_json    NVARCHAR(MAX)       NOT NULL,

        correlation_id  UNIQUEIDENTIFIER    NULL,       -- ties a message back to the request that caused it
        occurred_at     DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_outbox_message__occurred_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),

        -- Retry scheduling. available_at moves forward on failure, which is
        -- how backoff is expressed without a separate retry table.
        available_at    DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_outbox_message__available_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        attempt_count   INT                 NOT NULL CONSTRAINT df_outbox_message__attempt_count DEFAULT 0,
        max_attempts    INT                 NOT NULL CONSTRAINT df_outbox_message__max_attempts DEFAULT 5,

        -- Lease, so two dispatcher instances cannot both take one message.
        -- A lease that expires releases the message rather than stranding it,
        -- which is what makes a crashed dispatcher self-healing.
        locked_until    DATETIMEOFFSET(7)   NULL,
        locked_by       VARCHAR(100)        NULL,

        processed_at    DATETIMEOFFSET(7)   NULL,       -- success, terminal
        failed_at       DATETIMEOFFSET(7)   NULL,       -- dead-lettered, terminal
        last_error      NVARCHAR(2000)      NULL,

        CONSTRAINT pk_outbox_message PRIMARY KEY CLUSTERED (message_id),
        CONSTRAINT ck_outbox_message__payload CHECK (ISJSON(payload_json) = 1)
    );
    PRINT '>> outbox.message created.';
END
GO

-- The dispatcher's only query. Filtered so the index holds just the work
-- that is left — on a table where 99% of rows are processed history, an
-- unfiltered index would be almost entirely dead weight.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_outbox__pending' AND object_id=OBJECT_ID('outbox.message'))
    CREATE NONCLUSTERED INDEX ix_outbox__pending
        ON outbox.message (available_at, message_id)
        INCLUDE (tenant_id, message_type, locked_until, attempt_count, max_attempts)
        WHERE processed_at IS NULL AND failed_at IS NULL;
GO

-- For the dead-letter screen and for purging processed history.
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_outbox__failed' AND object_id=OBJECT_ID('outbox.message'))
    CREATE NONCLUSTERED INDEX ix_outbox__failed
        ON outbox.message (failed_at)
        INCLUDE (tenant_id, message_type, attempt_count, last_error)
        WHERE failed_at IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='ix_outbox__processed' AND object_id=OBJECT_ID('outbox.message'))
    CREATE NONCLUSTERED INDEX ix_outbox__processed
        ON outbox.message (processed_at)
        WHERE processed_at IS NOT NULL;
GO

-- ------------------------------------------------------------
-- outbox.usp_claim_messages
--
-- READPAST + UPDLOCK + ROWLOCK is the SQL Server queue idiom: skip rows
-- another dispatcher already holds instead of blocking behind them. The CTE
-- exists because UPDATE TOP cannot carry an ORDER BY, and without ordering
-- the outbox stops being ordered.
--
-- Claiming increments attempt_count immediately — before the work is tried.
-- A dispatcher that crashes mid-send therefore burns an attempt, which is
-- correct: it stops a message that reliably kills its handler from being
-- retried forever.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE outbox.usp_claim_messages
    @worker_id     VARCHAR(100),
    @batch_size    INT = 20,
    @lease_seconds INT = 60
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now DATETIMEOFFSET(7) = SYSUTCDATETIME() AT TIME ZONE 'UTC';

    ;WITH claimed AS (
        SELECT TOP (@batch_size) *
        FROM outbox.message WITH (READPAST, UPDLOCK, ROWLOCK)
        WHERE processed_at IS NULL
          AND failed_at    IS NULL
          AND available_at <= @now
          AND (locked_until IS NULL OR locked_until < @now)
        ORDER BY message_id
    )
    UPDATE claimed
       SET locked_until  = DATEADD(SECOND, @lease_seconds, @now),
           locked_by     = @worker_id,
           attempt_count = attempt_count + 1
    OUTPUT inserted.message_id, inserted.tenant_id, inserted.aggregate_type,
           inserted.aggregate_id, inserted.message_type, inserted.payload_json,
           inserted.correlation_id, inserted.occurred_at, inserted.attempt_count,
           inserted.max_attempts;
END
GO

-- ------------------------------------------------------------
-- outbox.usp_complete_message — terminal success
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE outbox.usp_complete_message
    @message_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE outbox.message
       SET processed_at = SYSUTCDATETIME() AT TIME ZONE 'UTC',
           locked_until = NULL,
           locked_by    = NULL,
           last_error   = NULL
     WHERE message_id = @message_id AND processed_at IS NULL;
END
GO

-- ------------------------------------------------------------
-- outbox.usp_fail_message
--
-- Exponential backoff, then dead-letter. The same 5/10/20/40/80 second
-- curve the Notification module already uses — one retry policy across the
-- platform is worth more than a locally optimal one here.
--
-- Dead-lettered messages are NOT deleted. A message that could never be
-- delivered is exactly the thing someone needs to look at on Monday.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE outbox.usp_fail_message
    @message_id BIGINT,
    @error      NVARCHAR(2000)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @now DATETIMEOFFSET(7) = SYSUTCDATETIME() AT TIME ZONE 'UTC';

    UPDATE outbox.message
       SET last_error   = @error,
           locked_until = NULL,
           locked_by    = NULL,
           failed_at    = CASE WHEN attempt_count >= max_attempts THEN @now END,
           available_at = CASE WHEN attempt_count <  max_attempts
                               THEN DATEADD(SECOND, POWER(2, attempt_count - 1) * 5, @now)
                               ELSE available_at END
     WHERE message_id = @message_id AND processed_at IS NULL;
END
GO

-- ------------------------------------------------------------
-- outbox.usp_purge_processed — housekeeping
--
-- Processed rows are history, not state. Keep a fortnight for support
-- questions, then let them go, or the pending index degrades under a table
-- that is 99.99% done.
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE outbox.usp_purge_processed
    @older_than_days INT = 14,
    @batch_size      INT = 5000
AS
BEGIN
    SET NOCOUNT ON;
    DELETE TOP (@batch_size) FROM outbox.message
     WHERE processed_at IS NOT NULL
       AND processed_at < DATEADD(DAY, -@older_than_days, SYSUTCDATETIME());
    RETURN @@ROWCOUNT;
END
GO

-- ------------------------------------------------------------
-- inbox.processed — every platform message from another context, handled
-- once. Written by the handler in the same transaction as the change it caused
-- (gecko_app, tenant set from the message). source_context uses a FORMAT
-- check: sources are added as adapters arrive (TOS, REVENUE, PORTHUB,
-- IDENTITY, MASTER ...).
-- ------------------------------------------------------------
-- @table   inbox.processed
-- @purpose One platform message from another module that Repair has handled (source, message id, type, aggregate) and the outcome, so a redelivered message is never applied twice.
-- @vector  none — new
-- @owner   Platform
-- @flags   A
-- @phase   2
IF OBJECT_ID('inbox.processed') IS NULL
BEGIN
    CREATE TABLE inbox.processed (
        processed_id    BIGINT              IDENTITY(1,1) NOT NULL,
        tenant_id       UNIQUEIDENTIFIER    NOT NULL,
        source_context  VARCHAR(20)         NOT NULL,   -- TOS, REVENUE, PORTHUB, IDENTITY, MASTER ...
        message_id      BIGINT              NOT NULL,   -- the source outbox id
        message_type    VARCHAR(100)        NOT NULL,
        aggregate_id    UNIQUEIDENTIFIER    NULL,
        outcome         VARCHAR(20)         NOT NULL CONSTRAINT df_processed__outcome DEFAULT 'APPLIED',   -- APPLIED, STALE, IGNORED
        note            NVARCHAR(400)       NULL,
        created_at      DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_processed__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_processed PRIMARY KEY CLUSTERED (processed_id),
        CONSTRAINT ck_processed__source CHECK (source_context = UPPER(source_context) COLLATE Latin1_General_100_CS_AS AND source_context NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_processed__outcome CHECK (outcome IN ('APPLIED','STALE','IGNORED'))
    );
    -- NULL aggregate ids compare equal in a unique index: the same message with no aggregate is still the same message.
    CREATE UNIQUE NONCLUSTERED INDEX uq_processed__message
        ON inbox.processed (tenant_id, source_context, message_id, message_type, aggregate_id);
    PRINT '>> inbox.processed created.';
END
GO

-- The inbox is a record of what was handled: never changed, never deleted.
GRANT SELECT, INSERT ON SCHEMA::inbox TO gecko_app;
GRANT SELECT, INSERT ON SCHEMA::inbox TO gecko_system;
DENY UPDATE, DELETE ON SCHEMA::inbox TO gecko_app;
DENY UPDATE, DELETE ON SCHEMA::inbox TO gecko_system;
EXEC dbo.usp_make_append_only @schema = 'inbox', @table = 'processed';
GO

-- ------------------------------------------------------------
-- Outbox grants
-- gecko_app WRITES messages (inside the same transaction as the business
-- change) but never reads or dispatches them. gecko_system runs the
-- dispatcher; purging deletes, so there is no schema-wide DENY DELETE on outbox.
-- ------------------------------------------------------------
GRANT INSERT               ON SCHEMA::outbox TO gecko_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::outbox TO gecko_system;
GRANT EXECUTE ON outbox.usp_claim_messages   TO gecko_system;
GRANT EXECUTE ON outbox.usp_complete_message TO gecko_system;
GRANT EXECUTE ON outbox.usp_fail_message     TO gecko_system;
GRANT EXECUTE ON outbox.usp_purge_processed  TO gecko_system;
GO

EXEC dbo.usp_record_script '07_outbox_inbox.sql', N'Transactional outbox (outbox.message + claim/complete/fail/purge, platform design) and inbox.processed keyed per tenant/source/message/type/aggregate (append-only)';
GO

PRINT '>> 07_outbox_inbox.sql completed.';
GO
