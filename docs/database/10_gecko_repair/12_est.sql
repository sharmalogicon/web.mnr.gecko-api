-- ============================================================
-- GECKO REPAIR (M&R) — ESTIMATES OF REPAIR AND APPROVALS (P4)
-- Script: 12_est.sql
--
--   est.estimate                  one REVISION of an estimate (EOR): parties, tariff
--                                 schedules, totals per responsibility, internal
--                                 approval state, owner status
--   est.estimate_line             one repair line: CEDEX codes or description, qty,
--                                 size, labour / material / sundry, who pays, tariff row
--   est.estimate_internal_approval one step of the depot's own approval chain
--                                 (config.approval_policy levels; maker-checker)   A
--   est.estimate_approval         one decision received from an owner / user
--                                 (e-mail, phone, portal, EDI or auto-approve)        A
--   est.estimate_status_log       every status transition with user and reason       A
--
-- REVISIONS: a sent estimate is never edited. A change after sending is a new
-- revision (same estimate_no, revision_no + 1, copies its lines with
-- source_line_id); the old revision becomes SUPERSEDED. Lines are editable only
-- while the revision is DRAFT (Repair module rule).
--
-- MONEY: DECIMAL(18,4) in the estimate currency. Totals are stored (the PDF and
-- the owner see exactly these numbers) and CHECKed against their parts.
-- Pricing comes from gecko_revenue tariff.container_repair_rate through the
-- Revenue contract IContainerRepairRating; the line keeps a soft reference to
-- the rate row and schedule it was priced from.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   est.estimate
-- @purpose One revision of an estimate of repair (EOR) for a case: who pays (owner / user), the tariff schedules used, totals per responsibility, the depot's internal approval state and the owner's decision status.
-- @vector  none — new (UI RepairJob)
-- @owner   R4 Estimate & Approval
-- @flags   T
-- @phase   4
IF OBJECT_ID('est.estimate') IS NULL
BEGIN
    CREATE TABLE est.estimate (
        estimate_id             UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_estimate__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        estimate_no             VARCHAR(30)         NOT NULL,   -- REPAIR_EOR series; the same for every revision
        revision_no             SMALLINT            NOT NULL CONSTRAINT df_estimate__revision DEFAULT 1,
        previous_estimate_id    UNIQUEIDENTIFIER    NULL,       -- ref est.estimate: the revision this one replaces
        repair_case_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref mcase.repair_case
        survey_id               UNIQUEIDENTIFIER    NULL,       -- ref survey.survey it was built from
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        iso_code                VARCHAR(4)          NULL,
        equipment_category      VARCHAR(10)         NOT NULL,
        size_ft                 VARCHAR(3)          NULL,
        estimate_kind           VARCHAR(15)         NOT NULL CONSTRAINT df_estimate__kind DEFAULT 'REPAIR',   -- REPAIR, SUPPLEMENTARY (extra damage found during repair), MODIFICATION
        estimator_user_id       UNIQUEIDENTIFIER    NULL,
        estimate_date           DATE                NOT NULL,
        valid_until             DATE                NULL,
        currency_code           CHAR(3)             NOT NULL,
        fx_rate_to_depot        DECIMAL(18,8)       NULL,       -- estimate currency -> depot currency at estimate date, when they differ
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party
        owner_party_code        VARCHAR(20)         NULL,
        user_party_id           UNIQUEIDENTIFIER    NULL,
        user_party_code         VARCHAR(20)         NULL,
        owner_profile_id        UNIQUEIDENTIFIER    NULL,       -- ref config.owner_profile applied (NULL = tenant defaults)
        owner_schedule_id       UNIQUEIDENTIFIER    NULL,       -- ref gecko_revenue:tariff.schedule for OWNER lines
        owner_schedule_no       VARCHAR(30)         NULL,
        user_schedule_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_revenue:tariff.schedule for USER lines
        user_schedule_no        VARCHAR(30)         NULL,
        labour_total            DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__labour DEFAULT 0,
        material_total          DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__material DEFAULT 0,
        sundry_total            DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__sundry DEFAULT 0,
        total_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__total DEFAULT 0,   -- labour + material + sundry
        owner_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__owner DEFAULT 0,   -- part the owner / lessor pays
        user_amount             DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__user DEFAULT 0,    -- part the user / lessee / liner pays
        other_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate__other DEFAULT 0,   -- depot, third party, insurance, warranty
        approved_amount         DECIMAL(18,4)       NULL,       -- after owner decisions (partial approvals cut lines)
        internal_approval_status VARCHAR(12)        NOT NULL CONSTRAINT df_estimate__internal DEFAULT 'NOT_REQUIRED',   -- NOT_REQUIRED, PENDING, APPROVED, REJECTED
        status                  VARCHAR(20)         NOT NULL CONSTRAINT df_estimate__status DEFAULT 'DRAFT',
        approval_channel        VARCHAR(10)         NULL,       -- channel used when sent: EDI, PDF_EMAIL, PORTAL, PHONE (copied from the owner profile)
        sent_at                 DATETIMEOFFSET(7)   NULL,
        sent_by                 UNIQUEIDENTIFIER    NULL,
        decided_at              DATETIMEOFFSET(7)   NULL,       -- final owner decision
        authorisation_no        VARCHAR(60)         NULL,       -- owner's authorisation / approval reference
        is_auto_approved        BIT                 NOT NULL CONSTRAINT df_estimate__auto DEFAULT 0,   -- within the owner's auto-approve limit
        pdf_attachment_id       UNIQUEIDENTIFIER    NULL,       -- ref doc.attachment: the PDF frozen when sent
        client_ref              UNIQUEIDENTIFIER    NULL,
        legacy_ref              VARCHAR(80)         NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_estimate PRIMARY KEY CLUSTERED (estimate_id),
        CONSTRAINT ck_estimate__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_estimate__category CHECK (equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_estimate__revision CHECK (revision_no >= 1 AND ((revision_no = 1 AND previous_estimate_id IS NULL) OR (revision_no > 1 AND previous_estimate_id IS NOT NULL))),
        CONSTRAINT ck_estimate__kind CHECK (estimate_kind IN ('REPAIR','SUPPLEMENTARY','MODIFICATION')),
        CONSTRAINT ck_estimate__valid CHECK (valid_until IS NULL OR valid_until >= estimate_date),
        CONSTRAINT ck_estimate__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_estimate__fx CHECK (fx_rate_to_depot IS NULL OR fx_rate_to_depot > 0),
        CONSTRAINT ck_estimate__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        CONSTRAINT ck_estimate__user_pair CHECK ((user_party_id IS NULL AND user_party_code IS NULL) OR (user_party_id IS NOT NULL AND user_party_code IS NOT NULL)),
        CONSTRAINT ck_estimate__owner_schedule CHECK ((owner_schedule_id IS NULL AND owner_schedule_no IS NULL) OR (owner_schedule_id IS NOT NULL AND owner_schedule_no IS NOT NULL)),
        CONSTRAINT ck_estimate__user_schedule CHECK ((user_schedule_id IS NULL AND user_schedule_no IS NULL) OR (user_schedule_id IS NOT NULL AND user_schedule_no IS NOT NULL)),
        -- Stored totals add up.
        CONSTRAINT ck_estimate__total CHECK (total_amount = labour_total + material_total + sundry_total),
        CONSTRAINT ck_estimate__split CHECK (total_amount = owner_amount + user_amount + other_amount),
        CONSTRAINT ck_estimate__amounts CHECK (labour_total >= 0 AND material_total >= 0 AND sundry_total >= 0
            AND owner_amount >= 0 AND user_amount >= 0 AND other_amount >= 0
            AND (approved_amount IS NULL OR (approved_amount >= 0 AND approved_amount <= total_amount))),
        CONSTRAINT ck_estimate__internal CHECK (internal_approval_status IN ('NOT_REQUIRED','PENDING','APPROVED','REJECTED')),
        CONSTRAINT ck_estimate__status CHECK (status IN ('DRAFT','PENDING_INTERNAL','READY_TO_SEND','SENT','PARTIALLY_APPROVED',
            'APPROVED','REJECTED','EXPIRED','CANCELLED','SUPERSEDED')),
        CONSTRAINT ck_estimate__channel CHECK (approval_channel IS NULL OR approval_channel IN ('EDI','PDF_EMAIL','PORTAL','PHONE')),
        -- Sent (or decided) revisions record when and how they went out; decided ones when the owner answered.
        CONSTRAINT ck_estimate__sent CHECK (status NOT IN ('SENT','PARTIALLY_APPROVED','REJECTED','EXPIRED')
            OR (sent_at IS NOT NULL AND approval_channel IS NOT NULL)),
        CONSTRAINT ck_estimate__decided CHECK (status NOT IN ('APPROVED','PARTIALLY_APPROVED','REJECTED')
            OR (decided_at IS NOT NULL AND (status = 'REJECTED' OR approved_amount IS NOT NULL))),
        -- Nothing goes to the owner before the depot's own approval chain is done.
        CONSTRAINT ck_estimate__internal_first CHECK (status IN ('DRAFT','PENDING_INTERNAL','CANCELLED')
            OR internal_approval_status IN ('NOT_REQUIRED','APPROVED')),
        CONSTRAINT ck_estimate__auto CHECK (is_auto_approved = 0 OR status IN ('APPROVED','SUPERSEDED','CANCELLED'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_estimate__revision
        ON est.estimate (tenant_id, estimate_no, revision_no) WHERE deleted_at IS NULL;
    -- A revision is replaced at most once (no forked revisions).
    CREATE UNIQUE NONCLUSTERED INDEX uq_estimate__previous
        ON est.estimate (tenant_id, previous_estimate_id) WHERE previous_estimate_id IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_estimate__client_ref
        ON est.estimate (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_estimate__case
        ON est.estimate (tenant_id, repair_case_id, revision_no) WHERE deleted_at IS NULL;
    -- Approval aging per owner (the "pending approvals" widget and reminders).
    CREATE NONCLUSTERED INDEX ix_estimate__owner_status
        ON est.estimate (tenant_id, owner_party_id, status, sent_at) INCLUDE (estimate_no, container_no, total_amount, currency_code) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_estimate__list
        ON est.estimate (tenant_id, branch_id, status, estimate_date) INCLUDE (estimate_no, revision_no, container_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'est', @table = 'estimate';
END
GO

-- @table   est.estimate_line
-- @purpose One repair line of an estimate revision: CEDEX location / component / damage / repair (or a description), quantity and size, labour hours and rate, material and sundry amounts, who is responsible and billed, the tariff row it was priced from, and the owner's decision on the line.
-- @vector  none — new (UI RepairLine)
-- @owner   R4 Estimate & Approval
-- @flags   -
-- @phase   4
IF OBJECT_ID('est.estimate_line') IS NULL
BEGIN
    CREATE TABLE est.estimate_line (
        estimate_line_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_estimate_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        estimate_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref est.estimate (one revision)
        line_no                 SMALLINT            NOT NULL,   -- also the number on the damage map
        source_line_id          UNIQUEIDENTIFIER    NULL,       -- ref est.estimate_line of the previous revision it was copied from
        survey_damage_id        UNIQUEIDENTIFIER    NULL,       -- ref survey.survey_damage it repairs
        damage_location_code    VARCHAR(10)         NULL,       -- CEDEX (gecko_master); required when the owner is CEDEX_REQUIRED (Repair module)
        component_code          VARCHAR(20)         NULL,
        damage_code             VARCHAR(10)         NULL,
        repair_code             VARCHAR(10)         NULL,
        repair_mode_code        VARCHAR(40)         NULL,       -- REPAIR_MODE code list: REPLACE, PATCH, WELD ...
        description             NVARCHAR(500)       NULL,       -- damage + repair in words (owners that allow DESCRIPTION, Q8)
        quantity                DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate_line__qty DEFAULT 1,
        uom_code                VARCHAR(10)         NOT NULL,   -- EA, M, M2, CM, HR, LS
        length_cm               DECIMAL(7,1)        NULL,       -- drives LENGTH_CM tiers
        width_cm                DECIMAL(7,1)        NULL,       -- with length: AREA_CM2 tiers
        material_code           VARCHAR(30)         NULL,       -- ref part.material (P6)
        labour_hours            DECIMAL(9,2)        NOT NULL CONSTRAINT df_estimate_line__hours DEFAULT 0,
        labour_rate             DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate_line__rate DEFAULT 0,
        labour_amount           DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate_line__labour DEFAULT 0,
        material_amount         DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate_line__material DEFAULT 0,
        sundry_amount           DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate_line__sundry DEFAULT 0,
        line_total              DECIMAL(18,4)       NOT NULL CONSTRAINT df_estimate_line__total DEFAULT 0,   -- labour + material + sundry
        responsibility          VARCHAR(12)         NOT NULL,   -- OWNER, USER, DEPOT, THIRD_PARTY, INSURANCE, WARRANTY
        bill_to_party_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party; NULL for DEPOT / WARRANTY
        bill_to_party_code      VARCHAR(20)         NULL,
        container_repair_rate_id UNIQUEIDENTIFIER   NULL,       -- ref gecko_revenue:tariff.container_repair_rate it was priced from
        schedule_no             VARCHAR(30)         NULL,       -- schedule of that rate (copy for the PDF and audit)
        price_source            VARCHAR(10)         NOT NULL CONSTRAINT df_estimate_line__price_source DEFAULT 'TARIFF',   -- TARIFF, MANUAL or SURCHARGE (column added below)
        override_reason         NVARCHAR(200)       NULL,       -- why a MANUAL price or hours beyond the tariff limit (repair.estimate.override_price)
        iicl_verdict            VARCHAR(15)         NULL,       -- ACCEPTABLE, MUST_REPAIR, NO_THRESHOLD
        line_status             VARCHAR(10)         NOT NULL CONSTRAINT df_estimate_line__status DEFAULT 'PENDING',   -- PENDING, APPROVED, REJECTED (owner decision per line)
        approved_amount         DECIMAL(18,4)       NULL,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate_line__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_estimate_line PRIMARY KEY CLUSTERED (estimate_line_id),
        CONSTRAINT ck_estimate_line__line CHECK (line_no >= 1),
        -- Coded (damage + repair) or described (Q8).
        CONSTRAINT ck_estimate_line__coded_or_described CHECK ((damage_code IS NOT NULL AND repair_code IS NOT NULL) OR description IS NOT NULL),
        CONSTRAINT ck_estimate_line__qty CHECK (quantity > 0),
        CONSTRAINT ck_estimate_line__dims CHECK ((length_cm IS NULL OR length_cm > 0) AND (width_cm IS NULL OR width_cm > 0)),
        CONSTRAINT ck_estimate_line__amounts CHECK (labour_hours >= 0 AND labour_rate >= 0 AND labour_amount >= 0
            AND material_amount >= 0 AND sundry_amount >= 0),
        CONSTRAINT ck_estimate_line__total CHECK (line_total = labour_amount + material_amount + sundry_amount),
        CONSTRAINT ck_estimate_line__responsibility CHECK (responsibility IN ('OWNER','USER','DEPOT','THIRD_PARTY','INSURANCE','WARRANTY')),
        CONSTRAINT ck_estimate_line__bill_to_pair CHECK ((bill_to_party_id IS NULL AND bill_to_party_code IS NULL) OR (bill_to_party_id IS NOT NULL AND bill_to_party_code IS NOT NULL)),
        -- Somebody outside the depot is billed for OWNER / USER / THIRD_PARTY / INSURANCE lines.
        CONSTRAINT ck_estimate_line__bill_to CHECK (responsibility IN ('DEPOT','WARRANTY') OR bill_to_party_id IS NOT NULL),
        CONSTRAINT ck_estimate_line__price_source CHECK (price_source IN ('TARIFF','MANUAL')),
        CONSTRAINT ck_estimate_line__manual CHECK (price_source = 'TARIFF' OR override_reason IS NOT NULL),
        CONSTRAINT ck_estimate_line__tariff CHECK (price_source = 'MANUAL' OR container_repair_rate_id IS NOT NULL),
        CONSTRAINT ck_estimate_line__verdict CHECK (iicl_verdict IS NULL OR iicl_verdict IN ('ACCEPTABLE','MUST_REPAIR','NO_THRESHOLD')),
        CONSTRAINT ck_estimate_line__status CHECK (line_status IN ('PENDING','APPROVED','REJECTED')),
        CONSTRAINT ck_estimate_line__approved CHECK ((line_status = 'PENDING' AND approved_amount IS NULL)
            OR (line_status = 'REJECTED' AND (approved_amount IS NULL OR approved_amount = 0))
            OR (line_status = 'APPROVED' AND approved_amount IS NOT NULL AND approved_amount >= 0 AND approved_amount <= line_total))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_estimate_line__line
        ON est.estimate_line (tenant_id, estimate_id, line_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_estimate_line__survey_damage
        ON est.estimate_line (tenant_id, survey_damage_id) WHERE survey_damage_id IS NOT NULL AND deleted_at IS NULL;
END
GO

-- Surcharge lines (25 Nov, with gecko_revenue 82_repair_surcharge): a line the rating
-- engine added from tariff.container_repair_surcharge (after hours, emergency, hazmat ...),
-- its amount in sundry_amount. Added AFTER the table (not inside CREATE TABLE) so a
-- database built before this change and a fresh one end up identical.
IF COL_LENGTH('est.estimate_line', 'container_repair_surcharge_id') IS NULL
    ALTER TABLE est.estimate_line ADD container_repair_surcharge_id UNIQUEIDENTIFIER NULL;   -- ref gecko_revenue:tariff.container_repair_surcharge
GO
IF OBJECT_ID('est.ck_estimate_line__surcharge', 'C') IS NULL
BEGIN
    ALTER TABLE est.estimate_line DROP CONSTRAINT ck_estimate_line__price_source, ck_estimate_line__manual, ck_estimate_line__tariff;
    EXEC (N'ALTER TABLE est.estimate_line ADD
        CONSTRAINT ck_estimate_line__price_source CHECK (price_source IN (''TARIFF'',''MANUAL'',''SURCHARGE'')),
        CONSTRAINT ck_estimate_line__manual CHECK (price_source <> ''MANUAL'' OR override_reason IS NOT NULL),
        CONSTRAINT ck_estimate_line__tariff CHECK (price_source <> ''TARIFF'' OR container_repair_rate_id IS NOT NULL),
        CONSTRAINT ck_estimate_line__surcharge CHECK ((price_source = ''SURCHARGE'' AND container_repair_surcharge_id IS NOT NULL AND container_repair_rate_id IS NULL)
            OR (price_source <> ''SURCHARGE'' AND container_repair_surcharge_id IS NULL));');
    PRINT '>> est.estimate_line accepts SURCHARGE lines.';
END
GO

-- @table   est.estimate_internal_approval
-- @purpose One step of the depot's own approval chain for an estimate revision (from config.approval_policy): level, the permission required, who decided, when and the comment. Never changed.
-- @vector  none — new (UI approve() recorded "CURRENT-USER" with no role check)
-- @owner   R4 Estimate & Approval
-- @flags   A
-- @phase   4
IF OBJECT_ID('est.estimate_internal_approval') IS NULL
BEGIN
    CREATE TABLE est.estimate_internal_approval (
        estimate_internal_approval_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_estimate_internal_approval__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        estimate_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref est.estimate (one revision)
        approval_level          TINYINT             NOT NULL,   -- config.approval_policy level
        required_permission     VARCHAR(80)         NOT NULL,   -- e.g. repair.estimate.approve
        decision                VARCHAR(10)         NOT NULL,   -- APPROVED, REJECTED
        decided_by              UNIQUEIDENTIFIER    NOT NULL,   -- user (maker-checker: not the estimator — Repair module rule)
        decided_at              DATETIMEOFFSET(7)   NOT NULL,
        comment                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate_internal_approval__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_estimate_internal_approval PRIMARY KEY CLUSTERED (estimate_internal_approval_id),
        CONSTRAINT ck_estimate_internal_approval__level CHECK (approval_level BETWEEN 1 AND 9),
        CONSTRAINT ck_estimate_internal_approval__permission CHECK (required_permission LIKE 'repair.%'),
        CONSTRAINT ck_estimate_internal_approval__decision CHECK (decision IN ('APPROVED','REJECTED')),
        CONSTRAINT ck_estimate_internal_approval__reason CHECK (decision = 'APPROVED' OR comment IS NOT NULL)
    );
    -- One decision per level per revision.
    CREATE UNIQUE NONCLUSTERED INDEX uq_estimate_internal_approval__level
        ON est.estimate_internal_approval (tenant_id, estimate_id, approval_level);
    EXEC dbo.usp_make_append_only @schema = 'est', @table = 'estimate_internal_approval';
END
GO

-- @table   est.estimate_approval
-- @purpose One decision received from an owner, lessor or user on an estimate revision: by which channel, who approved, their authorisation number, the decision (approved, partial, rejected), the approved total, per-line decisions and the evidence. Never changed: a later decision is a new row.
-- @vector  none — new
-- @owner   R4 Estimate & Approval
-- @flags   A
-- @phase   4
IF OBJECT_ID('est.estimate_approval') IS NULL
BEGIN
    CREATE TABLE est.estimate_approval (
        estimate_approval_id    UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_estimate_approval__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        estimate_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref est.estimate (one revision)
        party_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party — who decided (owner, lessor, user)
        party_code              VARCHAR(20)         NOT NULL,
        scope                   VARCHAR(10)         NOT NULL,   -- OWNER (owner lines), USER (user lines), ALL
        channel                 VARCHAR(10)         NOT NULL,   -- EMAIL, PHONE, PORTAL, EDI, AUTO (within the auto-approve limit)
        approver_name           NVARCHAR(100)       NULL,       -- person at the owner (EMAIL / PHONE / PORTAL)
        authorisation_no        VARCHAR(60)         NULL,       -- owner's authorisation reference
        decision                VARCHAR(10)         NOT NULL,   -- APPROVED, PARTIAL, REJECTED
        decided_at              DATETIMEOFFSET(7)   NOT NULL,   -- when the owner decided
        approved_amount         DECIMAL(18,4)       NULL,
        currency_code           CHAR(3)             NOT NULL,
        line_decisions_json     NVARCHAR(MAX)       NULL,       -- PARTIAL: [{"lineNo":1,"decision":"APPROVED","amount":120.00}, ...]
        reject_reason           NVARCHAR(500)       NULL,
        attachment_id           UNIQUEIDENTIFIER    NULL,       -- ref doc.attachment: the e-mail / signed PDF
        edi_inbound_id          UNIQUEIDENTIFIER    NULL,       -- ref exch.edi_inbound (EDI, P8)
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate_approval__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,       -- user who recorded it; NULL for EDI / AUTO
        CONSTRAINT pk_estimate_approval PRIMARY KEY CLUSTERED (estimate_approval_id),
        CONSTRAINT ck_estimate_approval__scope CHECK (scope IN ('OWNER','USER','ALL')),
        CONSTRAINT ck_estimate_approval__channel CHECK (channel IN ('EMAIL','PHONE','PORTAL','EDI','AUTO')),
        CONSTRAINT ck_estimate_approval__decision CHECK (decision IN ('APPROVED','PARTIAL','REJECTED')),
        CONSTRAINT ck_estimate_approval__amount CHECK ((decision = 'REJECTED' AND (approved_amount IS NULL OR approved_amount = 0))
            OR (decision <> 'REJECTED' AND approved_amount IS NOT NULL AND approved_amount >= 0)),
        CONSTRAINT ck_estimate_approval__partial CHECK (decision <> 'PARTIAL' OR (line_decisions_json IS NOT NULL AND ISJSON(line_decisions_json) = 1)),
        CONSTRAINT ck_estimate_approval__reject CHECK (decision <> 'REJECTED' OR reject_reason IS NOT NULL),
        CONSTRAINT ck_estimate_approval__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        -- A person-recorded decision names the approver or carries the evidence; EDI decisions carry their inbound row.
        CONSTRAINT ck_estimate_approval__evidence CHECK ((channel = 'EDI' AND edi_inbound_id IS NOT NULL)
            OR channel = 'AUTO'
            OR (channel IN ('EMAIL','PHONE','PORTAL') AND (approver_name IS NOT NULL OR attachment_id IS NOT NULL)))
    );
    CREATE NONCLUSTERED INDEX ix_estimate_approval__estimate
        ON est.estimate_approval (tenant_id, estimate_id, decided_at);
    CREATE UNIQUE NONCLUSTERED INDEX uq_estimate_approval__edi
        ON est.estimate_approval (tenant_id, edi_inbound_id) WHERE edi_inbound_id IS NOT NULL;
    EXEC dbo.usp_make_append_only @schema = 'est', @table = 'estimate_approval';
END
GO

-- @table   est.estimate_status_log
-- @purpose One status transition of an estimate revision (draft, internal approval, sent, approved, rejected, expired, superseded ...) with who, when and why. Never changed.
-- @vector  none — new
-- @owner   R4 Estimate & Approval
-- @flags   A
-- @phase   4
IF OBJECT_ID('est.estimate_status_log') IS NULL
BEGIN
    CREATE TABLE est.estimate_status_log (
        estimate_status_log_id  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_estimate_status_log__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        estimate_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref est.estimate
        from_status             VARCHAR(20)         NULL,
        to_status               VARCHAR(20)         NOT NULL,
        reason                  NVARCHAR(500)       NULL,
        occurred_at             DATETIMEOFFSET(7)   NOT NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_estimate_status_log__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,       -- NULL for system transitions (expiry job, EDI, auto-approve)
        CONSTRAINT pk_estimate_status_log PRIMARY KEY CLUSTERED (estimate_status_log_id),
        CONSTRAINT ck_estimate_status_log__to CHECK (to_status IN ('DRAFT','PENDING_INTERNAL','READY_TO_SEND','SENT','PARTIALLY_APPROVED',
            'APPROVED','REJECTED','EXPIRED','CANCELLED','SUPERSEDED'))
    );
    CREATE NONCLUSTERED INDEX ix_estimate_status_log__estimate
        ON est.estimate_status_log (tenant_id, estimate_id, occurred_at);
    EXEC dbo.usp_make_append_only @schema = 'est', @table = 'estimate_status_log';
END
GO

EXEC dbo.usp_record_script '12_est.sql', N'est: estimate (revisions, totals CHECKed, internal-first rule), estimate_line (coded or described, tariff or manual with reason, who pays), estimate_internal_approval (A), estimate_approval (A, channel evidence), estimate_status_log (A)';
GO

PRINT '>> 12_est.sql completed.';
GO
