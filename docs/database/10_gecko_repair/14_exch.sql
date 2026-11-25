-- ============================================================
-- GECKO REPAIR (M&R) — EDI HAND-OFF TABLES FOR THE GECKO EDI SERVICE (P5, doc 03)
-- Script: 14_exch.sql
--
-- Decision Q22: EDI is a separate module / phase (the GECKO EDI service). Repair
-- does no EDI mapping, transport or partner certification; it only keeps the data
-- ready in two hand-off tables:
--
--   exch.edi_outbound   written by Repair when an estimate is sent to an EDI owner
--                       (config.owner_profile.approval_channel = EDI): a canonical JSON
--                       snapshot of the frozen revision. The EDI service picks it up and
--                       moves it READY -> PICKED -> SENT -> ACKED / FAILED.
--   exch.edi_inbound    written by the EDI service when an owner's authorisation /
--                       rejection arrives; Repair's apply job moves it NEW -> APPLIED /
--                       EXCEPTION (est.estimate_approval channel EDI points back here).
-- Go-live partners (Q16, Q20): Maersk, ONE, CMA CGM, COSCO SHIPPING, Wan Hai, HMM.
--
-- WORK RECORDS (as integ.inbound_event / outbound_event): payload columns are
-- write-once (column-level DENY UPDATE), only status / result columns move; no
-- soft delete.
--
-- ACCESS FOR THE EDI SERVICE: database role gecko_edi, granted only what the
-- hand-off needs (read + status update on edi_outbound, read + insert on
-- edi_inbound). It has NO member yet: the EDI service's login / user is created in
-- the EDI phase (one user, added to gecko_edi). Cross-tenant polling then runs in
-- system context — how that user satisfies the RLS predicate is decided in the
-- EDI phase (the predicate is the platform's, unchanged here).
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   exch.edi_outbound
-- @purpose One estimate message waiting for, or handled by, the GECKO EDI service: which owner and EDI partner, which estimate revision, the canonical snapshot to translate, and how far the EDI service got (picked, sent, acknowledged, failed).
-- @vector  none — new (decision Q22)
-- @owner   R16 Owner Profiles & EDI
-- @flags   -
-- @phase   5
IF OBJECT_ID('exch.edi_outbound') IS NULL
BEGIN
    CREATE TABLE exch.edi_outbound (
        edi_outbound_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_edi_outbound__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        owner_party_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        owner_party_code        VARCHAR(20)         NOT NULL,
        edi_partner_code        VARCHAR(30)         NOT NULL,   -- from config.owner_profile, e.g. MAERSK, ONE, CMACGM, COSCO, WANHAI, HMM
        message_kind            VARCHAR(20)         NOT NULL,   -- ESTIMATE, ESTIMATE_CANCEL
        estimate_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref est.estimate (the revision)
        estimate_no             VARCHAR(30)         NOT NULL,
        revision_no             SMALLINT            NOT NULL,
        container_no            VARCHAR(11)         NOT NULL,
        payload_version         VARCHAR(10)         NOT NULL CONSTRAINT df_edi_outbound__version DEFAULT 'v1',   -- canonical snapshot schema version
        payload_json            NVARCHAR(MAX)       NOT NULL,   -- header, container, lines (CEDEX codes, dimensions, qty, hours, labour / material, responsibility), totals
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_edi_outbound__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_edi_outbound__status DEFAULT 'READY',   -- READY, PICKED, SENT, ACKED, FAILED, CANCELLED
        picked_at               DATETIMEOFFSET(7)   NULL,       -- EDI service took it
        sent_at                 DATETIMEOFFSET(7)   NULL,
        acked_at                DATETIMEOFFSET(7)   NULL,       -- partner acknowledgement (CONTRL / APERAK where sent)
        interchange_ref         VARCHAR(60)         NULL,       -- interchange / message reference the EDI service used
        attempt_count           INT                 NOT NULL CONSTRAINT df_edi_outbound__attempts DEFAULT 0,
        error_text              NVARCHAR(2000)      NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_edi_outbound__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_edi_outbound PRIMARY KEY CLUSTERED (edi_outbound_id),
        CONSTRAINT ck_edi_outbound__kind CHECK (message_kind IN ('ESTIMATE','ESTIMATE_CANCEL')),
        CONSTRAINT ck_edi_outbound__partner CHECK (edi_partner_code = UPPER(edi_partner_code) COLLATE Latin1_General_100_CS_AS AND edi_partner_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_edi_outbound__payload CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT ck_edi_outbound__status CHECK (status IN ('READY','PICKED','SENT','ACKED','FAILED','CANCELLED')),
        CONSTRAINT ck_edi_outbound__picked CHECK (status IN ('READY','CANCELLED') OR picked_at IS NOT NULL),
        CONSTRAINT ck_edi_outbound__sent CHECK (status NOT IN ('SENT','ACKED') OR sent_at IS NOT NULL),
        CONSTRAINT ck_edi_outbound__acked CHECK (status <> 'ACKED' OR acked_at IS NOT NULL),
        CONSTRAINT ck_edi_outbound__failed CHECK (status <> 'FAILED' OR error_text IS NOT NULL)
    );
    -- One live message per estimate revision and kind (a FAILED / CANCELLED one may be requeued as a new row).
    CREATE UNIQUE NONCLUSTERED INDEX uq_edi_outbound__live
        ON exch.edi_outbound (tenant_id, estimate_id, message_kind) WHERE status IN ('READY','PICKED','SENT','ACKED');
    -- The EDI service's pick-up query.
    CREATE NONCLUSTERED INDEX ix_edi_outbound__ready
        ON exch.edi_outbound (status, created_at) INCLUDE (tenant_id, edi_partner_code) WHERE status IN ('READY','PICKED');
    CREATE NONCLUSTERED INDEX ix_edi_outbound__estimate
        ON exch.edi_outbound (tenant_id, estimate_no, revision_no);
END
GO

-- @table   exch.edi_inbound
-- @purpose One owner reply translated by the GECKO EDI service (authorisation or rejection, with the authorisation number and per-line decisions), and whether Repair applied it to the estimate or parked it as an exception.
-- @vector  none — new (decision Q22)
-- @owner   R16 Owner Profiles & EDI
-- @flags   -
-- @phase   5
IF OBJECT_ID('exch.edi_inbound') IS NULL
BEGIN
    CREATE TABLE exch.edi_inbound (
        edi_inbound_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_edi_inbound__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party (as resolved by the EDI service)
        owner_party_code        VARCHAR(20)         NULL,
        edi_partner_code        VARCHAR(30)         NOT NULL,
        message_kind            VARCHAR(20)         NOT NULL,   -- AUTHORISATION, REJECTION
        interchange_ref         VARCHAR(60)         NOT NULL,   -- partner interchange reference
        message_ref             VARCHAR(60)         NOT NULL,   -- message within the interchange (idempotency with the above)
        estimate_no             VARCHAR(30)         NOT NULL,   -- as quoted by the owner
        revision_no             SMALLINT            NULL,
        container_no            VARCHAR(11)         NULL,
        authorisation_no        VARCHAR(60)         NULL,
        payload_json            NVARCHAR(MAX)       NOT NULL,   -- per-line decisions and amounts, canonical form
        received_at             DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_edi_inbound__received_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_edi_inbound__status DEFAULT 'NEW',   -- NEW, APPLIED, EXCEPTION, IGNORED (set by Repair)
        estimate_id             UNIQUEIDENTIFIER    NULL,       -- ref est.estimate it was matched to
        applied_at              DATETIMEOFFSET(7)   NULL,
        exception_text          NVARCHAR(2000)      NULL,
        resolved_by             UNIQUEIDENTIFIER    NULL,       -- estimator who matched / ignored an exception (repair.edi.resolve)
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_edi_inbound__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_edi_inbound PRIMARY KEY CLUSTERED (edi_inbound_id),
        CONSTRAINT ck_edi_inbound__kind CHECK (message_kind IN ('AUTHORISATION','REJECTION')),
        CONSTRAINT ck_edi_inbound__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        CONSTRAINT ck_edi_inbound__payload CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT ck_edi_inbound__status CHECK (status IN ('NEW','APPLIED','EXCEPTION','IGNORED')),
        CONSTRAINT ck_edi_inbound__applied CHECK (status <> 'APPLIED' OR (applied_at IS NOT NULL AND estimate_id IS NOT NULL)),
        CONSTRAINT ck_edi_inbound__exception CHECK (status <> 'EXCEPTION' OR exception_text IS NOT NULL)
    );
    -- The same partner message is stored once (the EDI service may re-deliver).
    CREATE UNIQUE NONCLUSTERED INDEX uq_edi_inbound__message
        ON exch.edi_inbound (tenant_id, edi_partner_code, interchange_ref, message_ref);
    -- Repair's apply job and the exception queue.
    CREATE NONCLUSTERED INDEX ix_edi_inbound__work
        ON exch.edi_inbound (status, received_at) INCLUDE (tenant_id, estimate_no) WHERE status IN ('NEW','EXCEPTION');
END
GO

-- ------------------------------------------------------------
-- Payload columns are write-once for everyone.
-- ------------------------------------------------------------
DENY UPDATE ON exch.edi_outbound (tenant_id, branch_id, owner_party_id, owner_party_code, edi_partner_code, message_kind, estimate_id, estimate_no, revision_no, container_no, payload_version, payload_json, created_at) TO gecko_app;
DENY UPDATE ON exch.edi_outbound (tenant_id, branch_id, owner_party_id, owner_party_code, edi_partner_code, message_kind, estimate_id, estimate_no, revision_no, container_no, payload_version, payload_json, created_at) TO gecko_system;
DENY UPDATE ON exch.edi_inbound (tenant_id, edi_partner_code, message_kind, interchange_ref, message_ref, estimate_no, revision_no, authorisation_no, payload_json, received_at) TO gecko_app;
DENY UPDATE ON exch.edi_inbound (tenant_id, edi_partner_code, message_kind, interchange_ref, message_ref, estimate_no, revision_no, authorisation_no, payload_json, received_at) TO gecko_system;
GO

-- ------------------------------------------------------------
-- Role for the GECKO EDI service (no member until the EDI phase).
-- ------------------------------------------------------------
IF DATABASE_PRINCIPAL_ID('gecko_edi') IS NULL CREATE ROLE gecko_edi;
GO
GRANT SELECT ON exch.edi_outbound TO gecko_edi;
GRANT UPDATE ON exch.edi_outbound (status, picked_at, sent_at, acked_at, interchange_ref, attempt_count, error_text, updated_at) TO gecko_edi;
GRANT SELECT, INSERT ON exch.edi_inbound TO gecko_edi;
DENY DELETE ON exch.edi_outbound TO gecko_edi;
DENY DELETE ON exch.edi_inbound TO gecko_edi;
DENY UPDATE ON exch.edi_inbound TO gecko_edi;   -- after inserting, the inbound row belongs to Repair
GO

EXEC dbo.usp_record_script '14_exch.sql', N'exch: edi_outbound (estimate snapshot for the GECKO EDI service, READY->PICKED->SENT->ACKED/FAILED) and edi_inbound (owner replies, NEW->APPLIED/EXCEPTION); payload write-once; role gecko_edi (no member yet)';
GO

PRINT '>> 14_exch.sql completed.';
GO
