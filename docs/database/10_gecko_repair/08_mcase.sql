-- ============================================================
-- GECKO REPAIR (M&R) — THE M&R CASE (P3)
-- Script: 08_mcase.sql
--
-- One case = one M&R file for a container: opened from an equipment visit (or
-- without one, e.g. an on-hire survey at a customer site), it carries the
-- surveys, estimates, work, cleaning and PTI of that box until it is closed.
--
--   mcase.repair_case   the file (status, owner / user parties, priority, SLA clocks)
--   mcase.case_event    every status change and milestone with its time (KPI clocks; append-only)
--
-- INDEPENDENCE (G1): the case points at intake.equipment_visit, never at a
-- gecko_tos row. The gate survey that triggered it is referenced generically
-- (source + external ref + inbound event), whichever yard system sent it.
--
-- One OPEN case per visit (filtered unique index). Case kinds and statuses are
-- closed lists: they are the M&R process itself, not vocabulary.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   mcase.repair_case
-- @purpose One M&R file for a container at a depot: why it was opened (damage, off-hire, cleaning, PTI ...), the owner / lessor and the user that returned it, where it is in the process, its priority and SLA due times.
-- @vector  none — new (UI case list / detail)
-- @owner   R2 Case
-- @flags   T
-- @phase   3
IF OBJECT_ID('mcase.repair_case') IS NULL
BEGIN
    CREATE TABLE mcase.repair_case (
        repair_case_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_repair_case__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- the depot
        case_no                 VARCHAR(30)         NOT NULL,   -- REPAIR_CASE series
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        iso_code                VARCHAR(4)          NULL,
        equipment_category      VARCHAR(10)         NOT NULL,   -- DRY, REEFER, TANK ...
        size_ft                 VARCHAR(3)          NULL,
        unit_profile_id         UNIQUEIDENTIFIER    NULL,       -- ref unit.unit_profile
        equipment_visit_id      UNIQUEIDENTIFIER    NULL,       -- ref intake.equipment_visit; NULL = box not at the depot (e.g. on-hire at a customer site)
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party — owner or lessor (from the registry)
        owner_party_code        VARCHAR(20)         NULL,
        user_party_id           UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party — liner / lessee that returned the box
        user_party_code         VARCHAR(20)         NULL,
        case_kind               VARCHAR(20)         NOT NULL,   -- DAMAGE, OFF_HIRE, ON_HIRE, CLEANING, PTI, MODIFICATION, PERIODIC
        status                  VARCHAR(20)         NOT NULL CONSTRAINT df_repair_case__status DEFAULT 'OPEN',
        priority                VARCHAR(10)         NOT NULL CONSTRAINT df_repair_case__priority DEFAULT 'NORMAL',   -- NORMAL, URGENT, EXPRESS
        opened_by_source        VARCHAR(20)         NOT NULL,   -- USER, GATE_SURVEY (automatic from intake), CONDITION_RULE, API, IMPORT
        source_survey_ref       VARCHAR(80)         NULL,       -- the triggering survey / EIR in the yard system (any source)
        inbound_event_id        UNIQUEIDENTIFIER    NULL,       -- ref integ.inbound_event that opened it, when it came through the hub
        sla_estimate_due_at     DATETIMEOFFSET(7)   NULL,       -- settings SLA_ESTIMATE_HOURS_*
        sla_repair_due_at       DATETIMEOFFSET(7)   NULL,       -- set when approved: SLA_REPAIR_HOURS_*
        opened_at               DATETIMEOFFSET(7)   NOT NULL,
        completed_at            DATETIMEOFFSET(7)   NULL,       -- work done, condition restored
        closed_at               DATETIMEOFFSET(7)   NULL,       -- file closed (completed, declined, as-is, scrap, cancelled)
        close_reason            NVARCHAR(400)       NULL,
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline key (phase 2 app)
        legacy_ref              VARCHAR(80)         NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_repair_case__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_repair_case__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_repair_case PRIMARY KEY CLUSTERED (repair_case_id),
        CONSTRAINT ck_repair_case__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_repair_case__category CHECK (equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_repair_case__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        CONSTRAINT ck_repair_case__user_pair CHECK ((user_party_id IS NULL AND user_party_code IS NULL) OR (user_party_id IS NOT NULL AND user_party_code IS NOT NULL)),
        CONSTRAINT ck_repair_case__kind CHECK (case_kind IN ('DAMAGE','OFF_HIRE','ON_HIRE','CLEANING','PTI','MODIFICATION','PERIODIC')),
        CONSTRAINT ck_repair_case__status CHECK (status IN ('OPEN','ESTIMATING','AWAITING_APPROVAL','APPROVED','IN_REPAIR','COMPLETED',
            'CLOSED','DECLINED','AS_IS','SCRAP','CANCELLED')),
        CONSTRAINT ck_repair_case__priority CHECK (priority IN ('NORMAL','URGENT','EXPRESS')),
        CONSTRAINT ck_repair_case__opened_by CHECK (opened_by_source IN ('USER','GATE_SURVEY','CONDITION_RULE','API','IMPORT')),
        -- Terminal statuses carry their closing time; open ones do not.
        CONSTRAINT ck_repair_case__closed CHECK (
            (status IN ('CLOSED','DECLINED','AS_IS','SCRAP','CANCELLED') AND closed_at IS NOT NULL)
            OR (status NOT IN ('CLOSED','DECLINED','AS_IS','SCRAP','CANCELLED') AND closed_at IS NULL)),
        CONSTRAINT ck_repair_case__completed CHECK (status <> 'COMPLETED' OR completed_at IS NOT NULL),
        CONSTRAINT ck_repair_case__times CHECK ((completed_at IS NULL OR completed_at >= opened_at) AND (closed_at IS NULL OR closed_at >= opened_at))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_repair_case__no
        ON mcase.repair_case (tenant_id, case_no) WHERE deleted_at IS NULL;
    -- One open case per visit.
    CREATE UNIQUE NONCLUSTERED INDEX uq_repair_case__open_visit
        ON mcase.repair_case (tenant_id, equipment_visit_id)
        WHERE equipment_visit_id IS NOT NULL AND closed_at IS NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_repair_case__client_ref
        ON mcase.repair_case (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_repair_case__board
        ON mcase.repair_case (tenant_id, branch_id, status, opened_at) INCLUDE (case_no, container_no, priority, owner_party_code) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_repair_case__container
        ON mcase.repair_case (tenant_id, container_no, opened_at DESC) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_repair_case__owner
        ON mcase.repair_case (tenant_id, owner_party_id, status) WHERE owner_party_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'mcase', @table = 'repair_case';
END
GO

-- Known case event types (validated by the Repair module; format check):
--   OPENED, SURVEYED, ESTIMATE_SUBMITTED, ESTIMATE_APPROVED, ESTIMATE_REJECTED,
--   WO_STARTED, WO_COMPLETED, QC_PASSED, CONDITION_RESTORED, HOLD_PLACED,
--   HOLD_RELEASED, STATUS_CHANGED, PRIORITY_CHANGED, COMPLETED, CLOSED, REOPENED, CANCELLED

-- @table   mcase.case_event
-- @purpose One status change or milestone of a case with when it happened, who did it and the document behind it: the timeline on the case screen and the clocks behind turnaround and SLA KPIs. Never changed.
-- @vector  none — new
-- @owner   R2 Case
-- @flags   A
-- @phase   3
IF OBJECT_ID('mcase.case_event') IS NULL
BEGIN
    CREATE TABLE mcase.case_event (
        case_event_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_case_event__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        repair_case_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref mcase.repair_case
        event_type              VARCHAR(30)         NOT NULL,   -- catalogue above
        from_status             VARCHAR(20)         NULL,       -- case status before (STATUS_CHANGED and transitions)
        to_status               VARCHAR(20)         NULL,       -- case status after
        occurred_at             DATETIMEOFFSET(7)   NOT NULL,
        source_type             VARCHAR(20)         NULL,       -- SURVEY, ESTIMATE, WORK_ORDER, DEPOT_HOLD, CLEANING_JOB, PTI_JOB, INBOUND_EVENT
        source_id               UNIQUEIDENTIFIER    NULL,
        source_ref              VARCHAR(40)         NULL,       -- document number for the timeline (EOR no, WO no ...)
        note                    NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_case_event__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,       -- user; NULL for system / integration events
        CONSTRAINT pk_case_event PRIMARY KEY CLUSTERED (case_event_id),
        CONSTRAINT ck_case_event__type CHECK (event_type = UPPER(event_type) COLLATE Latin1_General_100_CS_AS AND event_type NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_case_event__source_pair CHECK ((source_type IS NULL AND source_id IS NULL) OR (source_type IS NOT NULL AND source_id IS NOT NULL))
    );
    CREATE NONCLUSTERED INDEX ix_case_event__case
        ON mcase.case_event (tenant_id, repair_case_id, occurred_at);
    CREATE NONCLUSTERED INDEX ix_case_event__type_time
        ON mcase.case_event (tenant_id, event_type, occurred_at) INCLUDE (repair_case_id, branch_id);
    EXEC dbo.usp_make_append_only @schema = 'mcase', @table = 'case_event';
END
GO

EXEC dbo.usp_record_script '08_mcase.sql', N'mcase: repair_case (visit-based, one open case per visit, SLA clocks, generic source survey ref) and case_event (append-only timeline / KPI clocks)';
GO

PRINT '>> 08_mcase.sql completed.';
GO
