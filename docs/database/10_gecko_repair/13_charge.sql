-- ============================================================
-- GECKO REPAIR (M&R) — CHARGES READY AND CHARGE RELEASE (P5)
-- Script: 13_charge.sql
--
-- How priced M&R work leaves Repair for billing (decisions Q11 / Q17 billing
-- trigger per owner, G5 billing mode per depot):
--
--   charge.billable_item        the "charges ready" queue: ONE live row per billable source
--                               line (estimate line, survey fee, cleaning, PTI ...), created
--                               when the owner's billing trigger fires (ON_APPROVAL /
--                               ON_COMPLETION) or by hand; READY -> RELEASED (or HELD / CANCELLED)
--   charge.charge_release       one batch to one bill-to party: to Gecko Revenue
--                               (IContainerRepairChargeIntake -> billing.container_repair_charge)
--                               or, for CHARGE_EXPORT depots, a file / outbound event for the
--                               customer's own ERP / TOS billing
--   charge.charge_release_line  what exactly was released, frozen (append-only); its id is
--                               Revenue's idempotency key
--
-- NO DOUBLE BILLING: a source line has at most one live billable_item (filtered
-- unique index excluding CANCELLED). A failed release puts its items back to
-- READY and a new release is made; the failed release keeps its lines as evidence.
-- After release, invoicing status is owned by Revenue (read through the contract),
-- not mirrored here.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   charge.billable_item
-- @purpose One billable M&R line waiting to be, or already, released for billing: the source line (estimate line, survey, cleaning, PTI ...), who pays, charge code, quantity, price, the owner's authorisation, why it became ready, and its release.
-- @vector  none — new (UI billing / charges-ready list)
-- @owner   R13 Charges
-- @flags   T
-- @phase   5
IF OBJECT_ID('charge.billable_item') IS NULL
BEGIN
    CREATE TABLE charge.billable_item (
        billable_item_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_billable_item__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case
        case_no                 VARCHAR(30)         NULL,
        container_no            VARCHAR(11)         NULL,
        source_type             VARCHAR(20)         NOT NULL,   -- ESTIMATE_LINE, SURVEY, CLEANING, PTI, MODIFICATION, INCIDENT, SERVICE
        source_id               UNIQUEIDENTIFIER    NOT NULL,   -- the document (estimate revision, survey, cleaning job ...)
        source_line_id          UNIQUEIDENTIFIER    NOT NULL,   -- the line within it (= source_id for one-line documents)
        source_ref              VARCHAR(40)         NULL,       -- document no. for people (EOR no, PTI no ...)
        bill_to_party_id        UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        bill_to_party_code      VARCHAR(20)         NOT NULL,
        responsibility          VARCHAR(12)         NULL,       -- OWNER, USER, THIRD_PARTY, INSURANCE (estimate lines)
        charge_code             VARCHAR(15)         NOT NULL,   -- gecko_master charge code (module MNR)
        description             NVARCHAR(300)       NOT NULL,
        quantity                DECIMAL(18,4)       NOT NULL,
        uom_code                VARCHAR(10)         NULL,
        unit_rate               DECIMAL(18,4)       NOT NULL,
        amount                  DECIMAL(18,4)       NOT NULL,
        currency_code           CHAR(3)             NOT NULL,
        authorisation_no        VARCHAR(60)         NULL,       -- owner's approval reference (printed on the invoice)
        rate_ref                VARCHAR(80)         NULL,       -- schedule no / rate row, or MANUAL
        ready_reason            VARCHAR(15)         NOT NULL,   -- ON_APPROVAL, ON_COMPLETION, MANUAL
        ready_at                DATETIMEOFFSET(7)   NOT NULL,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_billable_item__status DEFAULT 'READY',   -- READY, HELD, RELEASED, CANCELLED
        hold_reason             NVARCHAR(300)       NULL,
        charge_release_id       UNIQUEIDENTIFIER    NULL,       -- ref charge.charge_release that took it (RELEASED)
        cancel_reason           NVARCHAR(300)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_billable_item__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_billable_item__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_billable_item PRIMARY KEY CLUSTERED (billable_item_id),
        CONSTRAINT ck_billable_item__source CHECK (source_type IN ('ESTIMATE_LINE','SURVEY','CLEANING','PTI','MODIFICATION','INCIDENT','SERVICE')),
        CONSTRAINT ck_billable_item__responsibility CHECK (responsibility IS NULL OR responsibility IN ('OWNER','USER','THIRD_PARTY','INSURANCE')),
        CONSTRAINT ck_billable_item__values CHECK (quantity > 0 AND unit_rate >= 0 AND amount >= 0),
        CONSTRAINT ck_billable_item__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_billable_item__reason CHECK (ready_reason IN ('ON_APPROVAL','ON_COMPLETION','MANUAL')),
        CONSTRAINT ck_billable_item__status CHECK (status IN ('READY','HELD','RELEASED','CANCELLED')),
        CONSTRAINT ck_billable_item__released CHECK ((status = 'RELEASED' AND charge_release_id IS NOT NULL) OR (status <> 'RELEASED')),
        CONSTRAINT ck_billable_item__held CHECK (status <> 'HELD' OR hold_reason IS NOT NULL),
        CONSTRAINT ck_billable_item__cancelled CHECK (status <> 'CANCELLED' OR cancel_reason IS NOT NULL)
    );
    -- No double billing: one live item per source line.
    CREATE UNIQUE NONCLUSTERED INDEX uq_billable_item__source_line
        ON charge.billable_item (tenant_id, source_type, source_line_id) WHERE status <> 'CANCELLED' AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_billable_item__ready
        ON charge.billable_item (tenant_id, branch_id, status, bill_to_party_id) INCLUDE (amount, currency_code, ready_at) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_billable_item__case
        ON charge.billable_item (tenant_id, repair_case_id) WHERE repair_case_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'charge', @table = 'billable_item';
END
GO

-- @table   charge.charge_release
-- @purpose One release of ready M&R charges to one bill-to party: to Gecko Revenue for invoicing, or as an export batch to the customer's own billing system; its totals, delivery status and the reference Revenue or the export returned.
-- @vector  none — new
-- @owner   R13 Charges
-- @flags   T
-- @phase   5
IF OBJECT_ID('charge.charge_release') IS NULL
BEGIN
    CREATE TABLE charge.charge_release (
        charge_release_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_charge_release__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        release_no              VARCHAR(30)         NOT NULL,   -- REPAIR_REL series
        billing_mode            VARCHAR(20)         NOT NULL,   -- GECKO_REVENUE or CHARGE_EXPORT (from config.depot_profile at release time)
        bill_to_party_id        UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        bill_to_party_code      VARCHAR(20)         NOT NULL,
        currency_code           CHAR(3)             NOT NULL,
        line_count              INT                 NOT NULL CONSTRAINT df_charge_release__lines DEFAULT 0,
        total_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_charge_release__total DEFAULT 0,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_charge_release__status DEFAULT 'DRAFT',   -- DRAFT, SENT, ACCEPTED, EXPORTED, FAILED, CANCELLED
        released_at             DATETIMEOFFSET(7)   NULL,
        released_by             UNIQUEIDENTIFIER    NULL,
        accepted_at             DATETIMEOFFSET(7)   NULL,       -- Revenue accepted the batch / the export was delivered
        revenue_batch_ref       VARCHAR(60)         NULL,       -- reference Revenue returned (GECKO_REVENUE)
        export_connector_id     UNIQUEIDENTIFIER    NULL,       -- ref integ.connector (CHARGE_EXPORT via a connector)
        export_outbound_event_id UNIQUEIDENTIFIER   NULL,       -- ref integ.outbound_event that carried it
        export_attachment_id    UNIQUEIDENTIFIER    NULL,       -- ref doc.attachment: the CSV / file produced
        error_text              NVARCHAR(2000)      NULL,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_charge_release__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_charge_release__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_charge_release PRIMARY KEY CLUSTERED (charge_release_id),
        CONSTRAINT ck_charge_release__mode CHECK (billing_mode IN ('GECKO_REVENUE','CHARGE_EXPORT')),
        CONSTRAINT ck_charge_release__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_charge_release__values CHECK (line_count >= 0 AND total_amount >= 0),
        CONSTRAINT ck_charge_release__status CHECK (status IN ('DRAFT','SENT','ACCEPTED','EXPORTED','FAILED','CANCELLED')),
        -- ACCEPTED belongs to Revenue releases, EXPORTED to export batches.
        CONSTRAINT ck_charge_release__mode_status CHECK ((status <> 'ACCEPTED' OR billing_mode = 'GECKO_REVENUE')
            AND (status <> 'EXPORTED' OR billing_mode = 'CHARGE_EXPORT')),
        CONSTRAINT ck_charge_release__released CHECK (status IN ('DRAFT','CANCELLED') OR (released_at IS NOT NULL AND line_count > 0)),
        CONSTRAINT ck_charge_release__accepted CHECK (status NOT IN ('ACCEPTED','EXPORTED') OR accepted_at IS NOT NULL),
        CONSTRAINT ck_charge_release__failed CHECK (status <> 'FAILED' OR error_text IS NOT NULL),
        CONSTRAINT ck_charge_release__export_only CHECK (billing_mode = 'CHARGE_EXPORT'
            OR (export_connector_id IS NULL AND export_outbound_event_id IS NULL AND export_attachment_id IS NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_charge_release__no
        ON charge.charge_release (tenant_id, release_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_charge_release__list
        ON charge.charge_release (tenant_id, branch_id, status, released_at) INCLUDE (release_no, bill_to_party_code, total_amount) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'charge', @table = 'charge_release';
END
GO

-- @table   charge.charge_release_line
-- @purpose One line exactly as it was released: the billable item and source line, charge code, quantity, rate, amount and authorisation. Never changed; its id is the key Revenue uses so a replayed release adds nothing.
-- @vector  none — new
-- @owner   R13 Charges
-- @flags   A
-- @phase   5
IF OBJECT_ID('charge.charge_release_line') IS NULL
BEGIN
    CREATE TABLE charge.charge_release_line (
        charge_release_line_id  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_charge_release_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        charge_release_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref charge.charge_release
        line_no                 INT                 NOT NULL,
        billable_item_id        UNIQUEIDENTIFIER    NOT NULL,   -- ref charge.billable_item
        source_type             VARCHAR(20)         NOT NULL,
        source_line_id          UNIQUEIDENTIFIER    NOT NULL,
        source_ref              VARCHAR(40)         NULL,
        repair_case_id          UNIQUEIDENTIFIER    NULL,
        container_no            VARCHAR(11)         NULL,
        charge_code             VARCHAR(15)         NOT NULL,
        description             NVARCHAR(300)       NOT NULL,
        quantity                DECIMAL(18,4)       NOT NULL,
        uom_code                VARCHAR(10)         NULL,
        unit_rate               DECIMAL(18,4)       NOT NULL,
        amount                  DECIMAL(18,4)       NOT NULL,
        currency_code           CHAR(3)             NOT NULL,
        authorisation_no        VARCHAR(60)         NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_charge_release_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_charge_release_line PRIMARY KEY CLUSTERED (charge_release_line_id),
        CONSTRAINT ck_charge_release_line__source CHECK (source_type IN ('ESTIMATE_LINE','SURVEY','CLEANING','PTI','MODIFICATION','INCIDENT','SERVICE')),
        CONSTRAINT ck_charge_release_line__values CHECK (line_no >= 1 AND quantity > 0 AND unit_rate >= 0 AND amount >= 0),
        CONSTRAINT ck_charge_release_line__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]')
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_charge_release_line__line
        ON charge.charge_release_line (tenant_id, charge_release_id, line_no);
    -- An item appears once per release.
    CREATE UNIQUE NONCLUSTERED INDEX uq_charge_release_line__item
        ON charge.charge_release_line (tenant_id, charge_release_id, billable_item_id);
    CREATE NONCLUSTERED INDEX ix_charge_release_line__source
        ON charge.charge_release_line (tenant_id, source_type, source_line_id);
    EXEC dbo.usp_make_append_only @schema = 'charge', @table = 'charge_release_line';
END
GO

EXEC dbo.usp_record_script '13_charge.sql', N'charge: billable_item (charges-ready queue, one live row per source line), charge_release (GECKO_REVENUE or CHARGE_EXPORT batch), charge_release_line (A, Revenue idempotency key)';
GO

PRINT '>> 13_charge.sql completed.';
GO
