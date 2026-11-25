-- ============================================================
-- GECKO REPAIR (M&R) — WORK ORDERS, LABOUR, SUBLET, QC, WRITE-BACK (doc 03 P8)
-- Script: 17_work.sql
--
--   work.technician        technician profile on a gecko_identity user: home depot,
--                          in-house or contractor, current clock-on                     T
--   work.technician_skill  trades a technician may do, level, certificate expiry          T
--   work.work_order        work order (REPAIR_WO) for a case: approved estimate, site
--                          (in-house / vendor / mixed), plan vs actual, cost roll-up,
--                          QC state, condition / grade after repair                      T
--   work.wo_task           one task, normally one APPROVED estimate line; technician,
--                          estimated vs actual hours                                     T
--   work.wo_labour         technician time per task at the internal cost rate            A
--   work.wo_sublet         work sent to a vendor (approval, cost, vendor bill match)     T
--   work.wo_status_log     every work-order status transition                            A
--   work.qc_check          each QC attempt (pass / fail) with the post-repair survey     A
--   work.write_back        REPAIR_COMPLETED report to the yard: condition / grade and
--                          hold release, through the depot's yard gateway route          T
--
-- MATERIALS: there is no work.wo_material. Materials used on a work order are the
-- part.stock_ledger ISSUE / RETURN rows carrying work_order_id / wo_task_id (P7);
-- work_order.material_cost is their roll-up. One record of each fact.
--
-- SELL vs COST: the sell price stays the approved estimate (est.*, billed via
-- charge.*); this script holds COST only (labour at config.labor_cost_rate,
-- materials at moving average, sublet at the vendor price) for margin.
--
-- WRITE-BACK route follows config.depot_profile.yard_source:
--   GECKO_TOS  -> in-process TOS contract, carried by outbox.message
--   CONNECTOR  -> integ.outbound_event to the external yard system / webhook / CODECO
--   STANDALONE -> applied directly to intake.equipment_visit (Repair's own register)
--
-- Rules the database cannot see across tables (only APPROVED estimate lines become
-- tasks, QC checker is not the technician, write-back after QC pass) are
-- Repair module rules. Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   work.technician
-- @purpose Technician profile on a gecko_identity user: home depot, employee number, in-house or contractor (vendor party), active state and the task the technician is clocked on to right now.
-- @vector  none — new (UI surveyors.ts was a separate list)
-- @owner   R6 Repair Work Orders
-- @flags   T
-- @phase   8
IF OBJECT_ID('work.technician') IS NULL
BEGIN
    CREATE TABLE work.technician (
        technician_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_technician__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- home depot (gecko_identity branch)
        user_id                 UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_identity user (one person, one record)
        employee_no             VARCHAR(30)         NULL,
        display_name            NVARCHAR(100)       NOT NULL,   -- copy for boards and print
        employment_kind         VARCHAR(12)         NOT NULL CONSTRAINT df_technician__kind DEFAULT 'IN_HOUSE',   -- IN_HOUSE, CONTRACTOR
        vendor_party_id         UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party (CONTRACTOR's company)
        vendor_party_code       VARCHAR(20)         NULL,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_technician__status DEFAULT 'ACTIVE',   -- ACTIVE, INACTIVE
        clocked_on_wo_task_id   UNIQUEIDENTIFIER    NULL,       -- ref work.wo_task the technician is working on now
        clocked_on_at           DATETIMEOFFSET(7)   NULL,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_technician__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_technician__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_technician PRIMARY KEY CLUSTERED (technician_id),
        CONSTRAINT ck_technician__kind CHECK (employment_kind IN ('IN_HOUSE','CONTRACTOR')),
        CONSTRAINT ck_technician__vendor_pair CHECK ((vendor_party_id IS NULL AND vendor_party_code IS NULL) OR (vendor_party_id IS NOT NULL AND vendor_party_code IS NOT NULL)),
        CONSTRAINT ck_technician__contractor CHECK ((employment_kind = 'CONTRACTOR' AND vendor_party_id IS NOT NULL) OR (employment_kind = 'IN_HOUSE' AND vendor_party_id IS NULL)),
        CONSTRAINT ck_technician__status CHECK (status IN ('ACTIVE','INACTIVE')),
        CONSTRAINT ck_technician__clock_pair CHECK ((clocked_on_wo_task_id IS NULL AND clocked_on_at IS NULL) OR (clocked_on_wo_task_id IS NOT NULL AND clocked_on_at IS NOT NULL)),
        CONSTRAINT ck_technician__clock_active CHECK (status = 'ACTIVE' OR clocked_on_wo_task_id IS NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_technician__user
        ON work.technician (tenant_id, user_id) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_technician__employee_no
        ON work.technician (tenant_id, employee_no) WHERE employee_no IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_technician__branch
        ON work.technician (tenant_id, branch_id, status) INCLUDE (display_name, clocked_on_wo_task_id) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'work', @table = 'technician';
END
GO

-- @table   work.technician_skill
-- @purpose One trade a technician may work in (REPAIR_TRADE code list): level, whether it is the main trade, and the certificate with its expiry (welding, refrigerant handling ...).
-- @vector  none — new
-- @owner   R6 Repair Work Orders
-- @flags   T
-- @phase   8
IF OBJECT_ID('work.technician_skill') IS NULL
BEGIN
    CREATE TABLE work.technician_skill (
        technician_skill_id     UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_technician_skill__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        technician_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.technician
        trade_code              VARCHAR(40)         NOT NULL,   -- REPAIR_TRADE code list value (gecko_master)
        skill_level             VARCHAR(10)         NOT NULL CONSTRAINT df_technician_skill__level DEFAULT 'QUALIFIED',   -- TRAINEE, QUALIFIED, SENIOR
        is_primary              BIT                 NOT NULL CONSTRAINT df_technician_skill__primary DEFAULT 0,
        certificate_no          VARCHAR(60)         NULL,
        certificate_expires_on  DATE                NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_technician_skill__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_technician_skill__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_technician_skill PRIMARY KEY CLUSTERED (technician_skill_id),
        CONSTRAINT ck_technician_skill__trade CHECK (trade_code = UPPER(trade_code) COLLATE Latin1_General_100_CS_AS AND trade_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_technician_skill__level CHECK (skill_level IN ('TRAINEE','QUALIFIED','SENIOR')),
        CONSTRAINT ck_technician_skill__certificate CHECK (certificate_expires_on IS NULL OR certificate_no IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_technician_skill__trade
        ON work.technician_skill (tenant_id, technician_id, trade_code) WHERE deleted_at IS NULL;
    -- At most one main trade per technician.
    CREATE UNIQUE NONCLUSTERED INDEX uq_technician_skill__primary
        ON work.technician_skill (tenant_id, technician_id) WHERE is_primary = 1 AND deleted_at IS NULL;
    -- "Who can weld at this depot" and certificate-expiry reminders.
    CREATE NONCLUSTERED INDEX ix_technician_skill__trade
        ON work.technician_skill (tenant_id, trade_code) INCLUDE (technician_id, skill_level, certificate_expires_on) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'work', @table = 'technician_skill';
END
GO

-- @table   work.work_order
-- @purpose One repair work order (REPAIR_WO) for a case: the approved estimate it executes, where the work is done (in-house, vendor, mixed), supervisor, planned and actual dates, status, cost roll-up (labour, materials, sublet) against the approved sell amount, QC state and the condition / grade the unit leaves with.
-- @vector  none — new (UI /repair/[id] work log was hard-coded)
-- @owner   R6 Repair Work Orders
-- @flags   T
-- @phase   8
IF OBJECT_ID('work.work_order') IS NULL
BEGIN
    CREATE TABLE work.work_order (
        work_order_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_work_order__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        wo_no                   VARCHAR(30)         NOT NULL,   -- REPAIR_WO series
        wo_kind                 VARCHAR(15)         NOT NULL CONSTRAINT df_work_order__kind DEFAULT 'REPAIR',   -- REPAIR, MODIFICATION, REWORK
        rework_of_work_order_id UNIQUEIDENTIFIER    NULL,       -- ref work.work_order: REWORK after a failed QC / warranty claim
        repair_case_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref mcase.repair_case
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref intake.equipment_visit (write-back target)
        estimate_id             UNIQUEIDENTIFIER    NULL,       -- ref est.estimate: latest approved revision executed (supplementary revisions extend the same WO)
        estimate_no             VARCHAR(30)         NULL,
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        repair_site             VARCHAR(10)         NOT NULL CONSTRAINT df_work_order__site DEFAULT 'IN_HOUSE',   -- IN_HOUSE, VENDOR, MIXED
        vendor_party_id         UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party (VENDOR site: the workshop doing all of it)
        vendor_party_code       VARCHAR(20)         NULL,
        supervisor_user_id      UNIQUEIDENTIFIER    NULL,
        priority                VARCHAR(10)         NOT NULL CONSTRAINT df_work_order__priority DEFAULT 'NORMAL',   -- LOW, NORMAL, HIGH, URGENT
        workshop_location       NVARCHAR(60)        NULL,       -- bay / row in the workshop
        planned_start_at        DATETIMEOFFSET(7)   NULL,
        planned_end_at          DATETIMEOFFSET(7)   NULL,
        actual_start_at         DATETIMEOFFSET(7)   NULL,
        actual_end_at           DATETIMEOFFSET(7)   NULL,
        status                  VARCHAR(15)         NOT NULL CONSTRAINT df_work_order__status DEFAULT 'PLANNED',
        hold_reason             NVARCHAR(300)       NULL,       -- ON_HOLD: waiting parts, owner, vendor ...
        currency_code           CHAR(3)             NOT NULL,   -- depot currency (cost)
        labour_cost             DECIMAL(18,4)       NOT NULL CONSTRAINT df_work_order__labour DEFAULT 0,     -- sum of work.wo_labour
        material_cost           DECIMAL(18,4)       NOT NULL CONSTRAINT df_work_order__material DEFAULT 0,   -- sum of part.stock_ledger issues - returns
        sublet_cost             DECIMAL(18,4)       NOT NULL CONSTRAINT df_work_order__sublet DEFAULT 0,     -- sum of work.wo_sublet
        total_cost              DECIMAL(18,4)       NOT NULL CONSTRAINT df_work_order__total DEFAULT 0,      -- labour + material + sublet
        approved_sell_amount    DECIMAL(18,4)       NULL,       -- approved estimate amount (in depot currency) for margin
        estimated_hours         DECIMAL(9,2)        NOT NULL CONSTRAINT df_work_order__est_hours DEFAULT 0,
        actual_hours            DECIMAL(9,2)        NOT NULL CONSTRAINT df_work_order__act_hours DEFAULT 0,
        qc_required             BIT                 NOT NULL CONSTRAINT df_work_order__qc_required DEFAULT 1,
        qc_status               VARCHAR(12)         NOT NULL CONSTRAINT df_work_order__qc DEFAULT 'PENDING',   -- NOT_REQUIRED, PENDING, PASSED, FAILED
        qc_survey_id            UNIQUEIDENTIFIER    NULL,       -- ref survey.survey: post-repair survey that passed
        condition_code_after    VARCHAR(10)         NULL,       -- gecko_master condition reported on completion (AV ...)
        grade_code_after        VARCHAR(10)         NULL,
        completed_at            DATETIMEOFFSET(7)   NULL,
        completed_by            UNIQUEIDENTIFIER    NULL,
        cancel_reason           NVARCHAR(300)       NULL,
        reopen_count            TINYINT             NOT NULL CONSTRAINT df_work_order__reopen DEFAULT 0,
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline / idempotent create key
        legacy_ref              VARCHAR(80)         NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_work_order__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_work_order__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_work_order PRIMARY KEY CLUSTERED (work_order_id),
        CONSTRAINT ck_work_order__kind CHECK (wo_kind IN ('REPAIR','MODIFICATION','REWORK')),
        CONSTRAINT ck_work_order__rework CHECK ((wo_kind = 'REWORK' AND rework_of_work_order_id IS NOT NULL) OR (wo_kind <> 'REWORK' AND rework_of_work_order_id IS NULL)),
        -- Repair and modification work only runs on an approved estimate; rework is the depot's own cost.
        CONSTRAINT ck_work_order__estimate CHECK ((estimate_id IS NULL AND estimate_no IS NULL) OR (estimate_id IS NOT NULL AND estimate_no IS NOT NULL)),
        CONSTRAINT ck_work_order__estimate_required CHECK (wo_kind = 'REWORK' OR estimate_id IS NOT NULL),
        CONSTRAINT ck_work_order__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_work_order__site CHECK (repair_site IN ('IN_HOUSE','VENDOR','MIXED')),
        CONSTRAINT ck_work_order__vendor_pair CHECK ((vendor_party_id IS NULL AND vendor_party_code IS NULL) OR (vendor_party_id IS NOT NULL AND vendor_party_code IS NOT NULL)),
        CONSTRAINT ck_work_order__vendor CHECK ((repair_site = 'VENDOR' AND vendor_party_id IS NOT NULL) OR (repair_site = 'IN_HOUSE' AND vendor_party_id IS NULL) OR repair_site = 'MIXED'),
        CONSTRAINT ck_work_order__priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
        CONSTRAINT ck_work_order__planned CHECK (planned_end_at IS NULL OR planned_start_at IS NULL OR planned_end_at >= planned_start_at),
        CONSTRAINT ck_work_order__actual CHECK (actual_end_at IS NULL OR (actual_start_at IS NOT NULL AND actual_end_at >= actual_start_at)),
        CONSTRAINT ck_work_order__status CHECK (status IN ('PLANNED','RELEASED','IN_PROGRESS','ON_HOLD','AWAITING_QC','COMPLETED','CANCELLED')),
        CONSTRAINT ck_work_order__hold CHECK (status <> 'ON_HOLD' OR hold_reason IS NOT NULL),
        CONSTRAINT ck_work_order__started CHECK (status IN ('PLANNED','RELEASED','CANCELLED') OR actual_start_at IS NOT NULL),
        CONSTRAINT ck_work_order__cancel CHECK (status <> 'CANCELLED' OR cancel_reason IS NOT NULL),
        CONSTRAINT ck_work_order__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_work_order__costs CHECK (labour_cost >= 0 AND material_cost >= 0 AND sublet_cost >= 0
            AND (approved_sell_amount IS NULL OR approved_sell_amount >= 0)),
        CONSTRAINT ck_work_order__total CHECK (total_cost = labour_cost + material_cost + sublet_cost),
        CONSTRAINT ck_work_order__hours CHECK (estimated_hours >= 0 AND actual_hours >= 0),
        CONSTRAINT ck_work_order__qc CHECK (qc_status IN ('NOT_REQUIRED','PENDING','PASSED','FAILED')),
        CONSTRAINT ck_work_order__qc_required CHECK ((qc_required = 0 AND qc_status = 'NOT_REQUIRED') OR (qc_required = 1 AND qc_status <> 'NOT_REQUIRED')),
        CONSTRAINT ck_work_order__qc_passed CHECK (qc_status <> 'PASSED' OR qc_survey_id IS NOT NULL),
        -- Completed = work ended, QC done (or not required) and the condition it leaves with is known.
        CONSTRAINT ck_work_order__completed CHECK (status <> 'COMPLETED'
            OR (actual_end_at IS NOT NULL AND completed_at IS NOT NULL AND completed_by IS NOT NULL
                AND qc_status IN ('NOT_REQUIRED','PASSED') AND condition_code_after IS NOT NULL)),
        CONSTRAINT ck_work_order__completed_only CHECK (status = 'COMPLETED' OR completed_at IS NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_work_order__wo_no
        ON work.work_order (tenant_id, wo_no) WHERE deleted_at IS NULL;
    -- One live work order per estimate (supplementary revisions extend it, not a second WO).
    CREATE UNIQUE NONCLUSTERED INDEX uq_work_order__estimate
        ON work.work_order (tenant_id, repair_case_id, estimate_no) WHERE estimate_no IS NOT NULL AND status <> 'CANCELLED' AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_work_order__client_ref
        ON work.work_order (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_work_order__case
        ON work.work_order (tenant_id, repair_case_id) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_work_order__board
        ON work.work_order (tenant_id, branch_id, status, planned_start_at) INCLUDE (wo_no, container_no, priority, qc_status) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_work_order__vendor
        ON work.work_order (tenant_id, vendor_party_id, status) WHERE vendor_party_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'work', @table = 'work_order';
END
GO

-- @table   work.wo_task
-- @purpose One task of a work order, normally one APPROVED estimate line (CEDEX codes copied), or depot-own rework: trade, technician, in-house or sublet, estimated vs actual hours, status and completion.
-- @vector  none — new
-- @owner   R6 Repair Work Orders
-- @flags   T
-- @phase   8
IF OBJECT_ID('work.wo_task') IS NULL
BEGIN
    CREATE TABLE work.wo_task (
        wo_task_id              UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_wo_task__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order
        task_no                 SMALLINT            NOT NULL,
        task_source             VARCHAR(15)         NOT NULL CONSTRAINT df_wo_task__source DEFAULT 'ESTIMATE_LINE',   -- ESTIMATE_LINE, REWORK, INTERNAL
        estimate_line_id        UNIQUEIDENTIFIER    NULL,       -- ref est.estimate_line (APPROVED — Repair module rule)
        estimate_id             UNIQUEIDENTIFIER    NULL,       -- ref est.estimate revision of that line
        estimate_line_no        SMALLINT            NULL,       -- number on the estimate and the damage map
        damage_location_code    VARCHAR(10)         NULL,       -- copies from the line for the technician view
        component_code          VARCHAR(20)         NULL,
        damage_code             VARCHAR(10)         NULL,
        repair_code             VARCHAR(10)         NULL,
        description             NVARCHAR(500)       NULL,
        quantity                DECIMAL(18,4)       NOT NULL CONSTRAINT df_wo_task__qty DEFAULT 1,
        uom_code                VARCHAR(10)         NOT NULL CONSTRAINT df_wo_task__uom DEFAULT 'EA',
        trade_code              VARCHAR(40)         NULL,       -- REPAIR_TRADE needed
        execution               VARCHAR(10)         NOT NULL CONSTRAINT df_wo_task__execution DEFAULT 'IN_HOUSE',   -- IN_HOUSE, SUBLET
        technician_id           UNIQUEIDENTIFIER    NULL,       -- ref work.technician assigned
        estimated_hours         DECIMAL(9,2)        NOT NULL CONSTRAINT df_wo_task__est_hours DEFAULT 0,   -- from the estimate line (sold hours)
        actual_hours            DECIMAL(9,2)        NOT NULL CONSTRAINT df_wo_task__act_hours DEFAULT 0,   -- sum of work.wo_labour
        status                  VARCHAR(12)         NOT NULL CONSTRAINT df_wo_task__status DEFAULT 'PENDING',   -- PENDING, ASSIGNED, IN_PROGRESS, DONE, NOT_DONE, CANCELLED
        not_done_reason         NVARCHAR(300)       NULL,
        started_at              DATETIMEOFFSET(7)   NULL,
        completed_at            DATETIMEOFFSET(7)   NULL,
        completed_by            UNIQUEIDENTIFIER    NULL,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_wo_task__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_wo_task__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_wo_task PRIMARY KEY CLUSTERED (wo_task_id),
        CONSTRAINT ck_wo_task__task_no CHECK (task_no >= 1),
        CONSTRAINT ck_wo_task__source CHECK (task_source IN ('ESTIMATE_LINE','REWORK','INTERNAL')),
        -- Billable work comes from an estimate line; rework / internal tasks say what they are.
        CONSTRAINT ck_wo_task__line CHECK ((task_source = 'ESTIMATE_LINE' AND estimate_line_id IS NOT NULL AND estimate_id IS NOT NULL AND estimate_line_no IS NOT NULL)
            OR (task_source <> 'ESTIMATE_LINE' AND estimate_line_id IS NULL AND description IS NOT NULL)),
        CONSTRAINT ck_wo_task__coded_or_described CHECK ((damage_code IS NOT NULL AND repair_code IS NOT NULL) OR description IS NOT NULL),
        CONSTRAINT ck_wo_task__qty CHECK (quantity > 0),
        CONSTRAINT ck_wo_task__execution CHECK (execution IN ('IN_HOUSE','SUBLET')),
        CONSTRAINT ck_wo_task__hours CHECK (estimated_hours >= 0 AND actual_hours >= 0),
        CONSTRAINT ck_wo_task__status CHECK (status IN ('PENDING','ASSIGNED','IN_PROGRESS','DONE','NOT_DONE','CANCELLED')),
        CONSTRAINT ck_wo_task__assigned CHECK (status NOT IN ('ASSIGNED','IN_PROGRESS') OR execution = 'SUBLET' OR technician_id IS NOT NULL),
        CONSTRAINT ck_wo_task__started CHECK (status NOT IN ('IN_PROGRESS','DONE') OR started_at IS NOT NULL),
        CONSTRAINT ck_wo_task__done CHECK ((status = 'DONE' AND completed_at IS NOT NULL AND completed_by IS NOT NULL) OR (status <> 'DONE' AND completed_at IS NULL)),
        CONSTRAINT ck_wo_task__not_done CHECK (status NOT IN ('NOT_DONE','CANCELLED') OR not_done_reason IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_wo_task__task_no
        ON work.wo_task (tenant_id, work_order_id, task_no) WHERE deleted_at IS NULL;
    -- An approved line is worked (and later billed) once: one live task per estimate line.
    CREATE UNIQUE NONCLUSTERED INDEX uq_wo_task__estimate_line
        ON work.wo_task (tenant_id, estimate_line_id) WHERE estimate_line_id IS NOT NULL AND status <> 'CANCELLED' AND deleted_at IS NULL;
    -- Technician's "my tasks" list.
    CREATE NONCLUSTERED INDEX ix_wo_task__technician
        ON work.wo_task (tenant_id, technician_id, status) INCLUDE (work_order_id, task_no) WHERE technician_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'work', @table = 'wo_task';
END
GO

-- @table   work.wo_labour
-- @purpose Technician time on a task: clock on/off or a manual entry, trade, hours, the internal cost rate used and the cost. Never changed: a wrong entry is reversed by a REVERSAL row with negative hours.
-- @vector  none — new
-- @owner   R6 Repair Work Orders
-- @flags   A
-- @phase   8
IF OBJECT_ID('work.wo_labour') IS NULL
BEGIN
    CREATE TABLE work.wo_labour (
        wo_labour_id            UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_wo_labour__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order
        wo_task_id              UNIQUEIDENTIFIER    NOT NULL,   -- ref work.wo_task
        technician_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.technician
        trade_code              VARCHAR(40)         NOT NULL,   -- REPAIR_TRADE the time is costed at
        entry_kind              VARCHAR(10)         NOT NULL,   -- CLOCK (on/off), MANUAL (entered after), REVERSAL
        started_at              DATETIMEOFFSET(7)   NULL,
        ended_at                DATETIMEOFFSET(7)   NULL,
        work_date               DATE                NOT NULL,   -- depot-local date for timesheets
        hours                   DECIMAL(9,2)        NOT NULL,   -- negative only on REVERSAL
        labor_cost_rate_id      UNIQUEIDENTIFIER    NULL,       -- ref config.labor_cost_rate used
        cost_rate               DECIMAL(18,4)       NOT NULL,   -- per hour, depot currency
        cost_amount             DECIMAL(18,4)       NOT NULL,   -- ROUND(hours x cost_rate, 4)
        currency_code           CHAR(3)             NOT NULL,
        reverses_wo_labour_id   UNIQUEIDENTIFIER    NULL,       -- ref work.wo_labour (REVERSAL)
        reason                  NVARCHAR(300)       NULL,       -- MANUAL / REVERSAL: why
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline technician app key
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_wo_labour__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_wo_labour PRIMARY KEY CLUSTERED (wo_labour_id),
        CONSTRAINT ck_wo_labour__kind CHECK (entry_kind IN ('CLOCK','MANUAL','REVERSAL')),
        CONSTRAINT ck_wo_labour__clock CHECK (entry_kind <> 'CLOCK' OR (started_at IS NOT NULL AND ended_at IS NOT NULL AND ended_at > started_at)),
        CONSTRAINT ck_wo_labour__span CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at > started_at),
        CONSTRAINT ck_wo_labour__hours CHECK ((entry_kind = 'REVERSAL' AND hours < 0) OR (entry_kind <> 'REVERSAL' AND hours > 0 AND hours <= 24)),
        CONSTRAINT ck_wo_labour__reversal CHECK ((entry_kind = 'REVERSAL' AND reverses_wo_labour_id IS NOT NULL) OR (entry_kind <> 'REVERSAL' AND reverses_wo_labour_id IS NULL)),
        CONSTRAINT ck_wo_labour__reason CHECK (entry_kind = 'CLOCK' OR reason IS NOT NULL),
        CONSTRAINT ck_wo_labour__rate CHECK (cost_rate >= 0),
        CONSTRAINT ck_wo_labour__cost CHECK (cost_amount = ROUND(hours * cost_rate, 4)),
        CONSTRAINT ck_wo_labour__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]')
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_wo_labour__reverses
        ON work.wo_labour (tenant_id, reverses_wo_labour_id) WHERE reverses_wo_labour_id IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_wo_labour__client_ref
        ON work.wo_labour (tenant_id, client_ref) WHERE client_ref IS NOT NULL;
    CREATE NONCLUSTERED INDEX ix_wo_labour__task
        ON work.wo_labour (tenant_id, wo_task_id) INCLUDE (hours, cost_amount);
    CREATE NONCLUSTERED INDEX ix_wo_labour__work_order
        ON work.wo_labour (tenant_id, work_order_id) INCLUDE (hours, cost_amount);
    -- Timesheets and productivity per technician.
    CREATE NONCLUSTERED INDEX ix_wo_labour__timesheet
        ON work.wo_labour (tenant_id, technician_id, work_date) INCLUDE (hours, trade_code);
    EXEC dbo.usp_make_append_only @schema = 'work', @table = 'wo_labour';
END
GO

-- @table   work.wo_sublet
-- @purpose Work sent to an outside vendor for a work order or one task: vendor, vendor rate line it was priced from, quoted and actual cost, internal approval (config.approval_policy WORK_ORDER_SUBLET), vendor reference and the match to the vendor bill (P10).
-- @vector  none — new
-- @owner   R6 Repair Work Orders
-- @flags   T
-- @phase   8
IF OBJECT_ID('work.wo_sublet') IS NULL
BEGIN
    CREATE TABLE work.wo_sublet (
        wo_sublet_id            UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_wo_sublet__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order
        wo_task_id              UNIQUEIDENTIFIER    NULL,       -- ref work.wo_task (NULL = whole work order)
        sublet_no               SMALLINT            NOT NULL,
        vendor_party_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        vendor_party_code       VARCHAR(20)         NOT NULL,
        vendor_rate_line_id     UNIQUEIDENTIFIER    NULL,       -- ref vend.vendor_rate_line (P10) it was priced from
        description             NVARCHAR(500)       NOT NULL,
        currency_code           CHAR(3)             NOT NULL,
        quoted_cost             DECIMAL(18,4)       NOT NULL,
        actual_cost             DECIMAL(18,4)       NULL,       -- set when DONE (vendor's final figure)
        status                  VARCHAR(12)         NOT NULL CONSTRAINT df_wo_sublet__status DEFAULT 'REQUESTED',   -- REQUESTED, APPROVED, SENT, DONE, CANCELLED
        approved_at             DATETIMEOFFSET(7)   NULL,
        approved_by             UNIQUEIDENTIFIER    NULL,
        sent_at                 DATETIMEOFFSET(7)   NULL,
        vendor_ref              VARCHAR(60)         NULL,       -- vendor's job / quotation number
        done_at                 DATETIMEOFFSET(7)   NULL,
        vendor_bill_id          UNIQUEIDENTIFIER    NULL,       -- ref vend.vendor_bill (P10)
        bill_match_status       VARCHAR(12)         NOT NULL CONSTRAINT df_wo_sublet__match DEFAULT 'NOT_BILLED',   -- NOT_BILLED, MATCHED, DISPUTED
        cancel_reason           NVARCHAR(300)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_wo_sublet__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_wo_sublet__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_wo_sublet PRIMARY KEY CLUSTERED (wo_sublet_id),
        CONSTRAINT ck_wo_sublet__no CHECK (sublet_no >= 1),
        CONSTRAINT ck_wo_sublet__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_wo_sublet__cost CHECK (quoted_cost >= 0 AND (actual_cost IS NULL OR actual_cost >= 0)),
        CONSTRAINT ck_wo_sublet__status CHECK (status IN ('REQUESTED','APPROVED','SENT','DONE','CANCELLED')),
        -- Nothing goes to a vendor before the depot approves the cost.
        CONSTRAINT ck_wo_sublet__approved CHECK (status IN ('REQUESTED','CANCELLED') OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)),
        CONSTRAINT ck_wo_sublet__sent CHECK (status NOT IN ('SENT','DONE') OR sent_at IS NOT NULL),
        CONSTRAINT ck_wo_sublet__done CHECK ((status = 'DONE' AND done_at IS NOT NULL AND actual_cost IS NOT NULL) OR (status <> 'DONE' AND done_at IS NULL)),
        CONSTRAINT ck_wo_sublet__cancel CHECK (status <> 'CANCELLED' OR cancel_reason IS NOT NULL),
        CONSTRAINT ck_wo_sublet__match CHECK (bill_match_status IN ('NOT_BILLED','MATCHED','DISPUTED')),
        CONSTRAINT ck_wo_sublet__bill CHECK (bill_match_status = 'NOT_BILLED' OR vendor_bill_id IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_wo_sublet__no
        ON work.wo_sublet (tenant_id, work_order_id, sublet_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_wo_sublet__vendor
        ON work.wo_sublet (tenant_id, vendor_party_id, status, bill_match_status) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'work', @table = 'wo_sublet';
END
GO

-- @table   work.wo_status_log
-- @purpose One status transition of a work order (planned, released, started, on hold, awaiting QC, completed, reopened, cancelled) with who, when and why. Never changed.
-- @vector  none — new
-- @owner   R6 Repair Work Orders
-- @flags   A
-- @phase   8
IF OBJECT_ID('work.wo_status_log') IS NULL
BEGIN
    CREATE TABLE work.wo_status_log (
        wo_status_log_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_wo_status_log__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order
        from_status             VARCHAR(15)         NULL,
        to_status               VARCHAR(15)         NOT NULL,
        is_reopen               BIT                 NOT NULL CONSTRAINT df_wo_status_log__reopen DEFAULT 0,   -- COMPLETED -> IN_PROGRESS (repair.work_order.complete)
        reason                  NVARCHAR(500)       NULL,
        occurred_at             DATETIMEOFFSET(7)   NOT NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_wo_status_log__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_wo_status_log PRIMARY KEY CLUSTERED (wo_status_log_id),
        CONSTRAINT ck_wo_status_log__to CHECK (to_status IN ('PLANNED','RELEASED','IN_PROGRESS','ON_HOLD','AWAITING_QC','COMPLETED','CANCELLED')),
        CONSTRAINT ck_wo_status_log__reopen CHECK (is_reopen = 0 OR (from_status IS NOT NULL AND from_status = 'COMPLETED' AND reason IS NOT NULL))
    );
    CREATE NONCLUSTERED INDEX ix_wo_status_log__work_order
        ON work.wo_status_log (tenant_id, work_order_id, occurred_at);
    EXEC dbo.usp_make_append_only @schema = 'work', @table = 'wo_status_log';
END
GO

-- @table   work.qc_check
-- @purpose One quality-check attempt on a work order: attempt number, pass or fail, who checked (repair.qc.sign_off, not the technician who did the work), the post-repair survey and, on failure, what must be redone. Never changed.
-- @vector  none — new
-- @owner   R6 Repair Work Orders
-- @flags   A
-- @phase   8
IF OBJECT_ID('work.qc_check') IS NULL
BEGIN
    CREATE TABLE work.qc_check (
        qc_check_id             UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_qc_check__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order
        attempt_no              TINYINT             NOT NULL,
        result                  VARCHAR(4)          NOT NULL,   -- PASS, FAIL
        checked_by              UNIQUEIDENTIFIER    NOT NULL,
        checked_at              DATETIMEOFFSET(7)   NOT NULL,
        post_repair_survey_id   UNIQUEIDENTIFIER    NULL,       -- ref survey.survey (POST_REPAIR)
        failed_tasks_json       NVARCHAR(2000)      NULL,       -- FAIL: [{"taskNo":2,"note":"weld porous"}]
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_qc_check__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_qc_check PRIMARY KEY CLUSTERED (qc_check_id),
        CONSTRAINT ck_qc_check__attempt CHECK (attempt_no >= 1),
        CONSTRAINT ck_qc_check__result CHECK (result IN ('PASS','FAIL')),
        CONSTRAINT ck_qc_check__pass CHECK (result <> 'PASS' OR post_repair_survey_id IS NOT NULL),
        CONSTRAINT ck_qc_check__fail CHECK (result <> 'FAIL' OR remarks IS NOT NULL),
        CONSTRAINT ck_qc_check__json CHECK (failed_tasks_json IS NULL OR ISJSON(failed_tasks_json) = 1)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_qc_check__attempt
        ON work.qc_check (tenant_id, work_order_id, attempt_no);
    EXEC dbo.usp_make_append_only @schema = 'work', @table = 'qc_check';
END
GO

-- @table   work.write_back
-- @purpose The REPAIR_COMPLETED report for a finished work order: condition / grade after repair and the hold to release, the route it took (in-process Gecko TOS, outbound event to an external yard system, or Repair's own register), delivery status, attempts and confirmation.
-- @vector  none — new (UI Complete button did nothing)
-- @owner   R6 Repair Work Orders
-- @flags   T
-- @phase   8
IF OBJECT_ID('work.write_back') IS NULL
BEGIN
    CREATE TABLE work.write_back (
        write_back_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_write_back__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order
        sequence_no             TINYINT             NOT NULL CONSTRAINT df_write_back__seq DEFAULT 1,   -- 2+ after a reopen and re-completion
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref intake.equipment_visit
        container_no            VARCHAR(11)         NOT NULL,
        route                   VARCHAR(12)         NOT NULL,   -- GECKO_TOS, CONNECTOR, STANDALONE (config.depot_profile.yard_source at the time)
        condition_code          VARCHAR(10)         NOT NULL,   -- condition after repair (AV ...)
        grade_code              VARCHAR(10)         NULL,
        depot_hold_id           UNIQUEIDENTIFIER    NULL,       -- ref intake.depot_hold to release (DAMAGE ...)
        release_ref             VARCHAR(40)         NULL,       -- quoted on the release: case / work order no.
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_write_back__status DEFAULT 'PENDING',   -- PENDING, SENT, CONFIRMED, FAILED, SUPERSEDED
        outbox_message_id       BIGINT              NULL,       -- ref outbox.message (GECKO_TOS in-process)
        outbound_event_id       UNIQUEIDENTIFIER    NULL,       -- ref integ.outbound_event (CONNECTOR)
        visit_event_id          UNIQUEIDENTIFIER    NULL,       -- ref intake.visit_event written when applied (any route)
        attempt_count           SMALLINT            NOT NULL CONSTRAINT df_write_back__attempts DEFAULT 0,
        last_error              NVARCHAR(1000)      NULL,
        sent_at                 DATETIMEOFFSET(7)   NULL,
        confirmed_at            DATETIMEOFFSET(7)   NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_write_back__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_write_back__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_write_back PRIMARY KEY CLUSTERED (write_back_id),
        CONSTRAINT ck_write_back__seq CHECK (sequence_no >= 1),
        CONSTRAINT ck_write_back__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_write_back__route CHECK (route IN ('GECKO_TOS','CONNECTOR','STANDALONE')),
        CONSTRAINT ck_write_back__status CHECK (status IN ('PENDING','SENT','CONFIRMED','FAILED','SUPERSEDED')),
        -- Each route carries its own delivery reference once it has gone out.
        CONSTRAINT ck_write_back__gecko_tos CHECK (route <> 'GECKO_TOS' OR status IN ('PENDING','SUPERSEDED') OR outbox_message_id IS NOT NULL),
        CONSTRAINT ck_write_back__connector CHECK (route <> 'CONNECTOR' OR status IN ('PENDING','SUPERSEDED') OR outbound_event_id IS NOT NULL),
        CONSTRAINT ck_write_back__route_refs CHECK ((route = 'GECKO_TOS' OR outbox_message_id IS NULL) AND (route = 'CONNECTOR' OR outbound_event_id IS NULL)),
        -- Standalone is applied in Repair's own register: confirmed at once with the visit event.
        CONSTRAINT ck_write_back__standalone CHECK (route <> 'STANDALONE' OR status IN ('PENDING','CONFIRMED','SUPERSEDED')),
        CONSTRAINT ck_write_back__sent CHECK (status NOT IN ('SENT','CONFIRMED') OR route = 'STANDALONE' OR sent_at IS NOT NULL),
        CONSTRAINT ck_write_back__confirmed CHECK ((status = 'CONFIRMED' AND confirmed_at IS NOT NULL AND visit_event_id IS NOT NULL) OR (status <> 'CONFIRMED' AND confirmed_at IS NULL)),
        CONSTRAINT ck_write_back__failed CHECK (status <> 'FAILED' OR last_error IS NOT NULL),
        CONSTRAINT ck_write_back__attempts CHECK (attempt_count >= 0)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_write_back__seq
        ON work.write_back (tenant_id, work_order_id, sequence_no) WHERE deleted_at IS NULL;
    -- Only one live report per work order at a time (a reopen supersedes the old one).
    CREATE UNIQUE NONCLUSTERED INDEX uq_write_back__live
        ON work.write_back (tenant_id, work_order_id) WHERE status IN ('PENDING','SENT','CONFIRMED','FAILED') AND deleted_at IS NULL;
    -- Retry worker and the "not reported to the yard" exception list.
    CREATE NONCLUSTERED INDEX ix_write_back__open
        ON work.write_back (tenant_id, status, updated_at) INCLUDE (route, container_no, attempt_count) WHERE status IN ('PENDING','SENT','FAILED') AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'work', @table = 'write_back';
END
GO

EXEC dbo.usp_record_script '17_work.sql', N'work: technician (+skill), work_order (REPAIR_WO, cost roll-up, QC, completion rule), wo_task (one live task per approved estimate line), wo_labour (A, reversals), wo_sublet (approve before send), wo_status_log (A), qc_check (A), write_back (route per yard source, one live report per WO)';
GO

PRINT '>> 17_work.sql completed.';
GO
