-- ============================================================
-- GECKO REPAIR (M&R) — CLEANING, REEFER PTI AND TANK TESTS (doc 03 P9)
-- Script: 18_clean_reefer.sql
--
--   clean.bay              cleaning bay per depot: capabilities (CLEANING_BAY_CAPABILITY),
--                          hazmat / food-grade approval, state, the job running in it     T
--   clean.cleaning_job     cleaning job (REPAIR_CLN) for a container visit: optional case,
--                          CLEANING_TYPE, previous / next cargo, priority + SLA, bay,
--                          status, inspection, certificate, cost roll-up                  T
--   clean.cleaning_step    process log: pre-rinse, caustic, rinse, acid, final rinse,
--                          dry, inspection ... with temperature, duration, operator        -
--   clean.chemical_usage   chemical / detergent consumed by a job, priced from the
--                          stock issue that took it out of store                          A
--   reefer.pti_job         reefer pre-trip inspection (REPAIR_PTI) for a container visit:
--                          level, set point, refrigerant, technician, outcome,
--                          certificate (PASS only), controller download, cost roll-up      T
--   reefer.pti_result      one checklist item of a PTI (PTI template, 25 items): reading,
--                          unit, expected range, result, controller fault code             -
--
-- TANK TESTS: periodic tank / CSC / ATP tests and certificates stay in unit.unit_test
-- (03_unit.sql, UNIT_TEST_TYPE). A PTI that also performs a periodic test writes a
-- unit.unit_test row with source_type = 'PTI_JOB' / source_id = pti_job_id; nothing is
-- duplicated here. The PTI module also writes unit.unit_profile.last_pti_at / _result.
--
-- CHEMICALS: consumption is stock — the chemical leaves the store as a part.stock_ledger
-- ISSUE row (16_part_stock.sql, like work-order materials). clean.chemical_usage is the
-- job-side record of that issue (ledger / document refs + cost copy) so the job's cost
-- and the cleaning certificate can show product, batch and quantity. Non-stocked product
-- (bought in for the job) is recorded with supply_source = 'DIRECT' and no ledger refs.
-- A wrong entry is reversed by a REVERSAL row, never changed.
--
-- SELL vs COST: the sell price of cleaning / PTI is a SERVICE rate in the Gecko Revenue
-- tariff (container_repair_rate_id soft ref, charge code WASHING / PTI / pre-cool);
-- billing goes through charge.billable_item with source_type 'CLEANING' / 'PTI'
-- (pre-cooling as 'SERVICE'). This script holds COST only.
--
-- POWER: plug-in time during a PTI belongs to the yard system's reefer power session;
-- Repair does not record power — only an optional generic reference to that session.
--
-- Rules the database cannot see across tables (bay capability fits the job, technician
-- has REEFER_TECH trade, FAIL opens an estimate on the same case, the bay is released
-- when its job ends) are Repair module rules. Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   clean.bay
-- @purpose One cleaning bay of a depot: code and name, capabilities (CLEANING_BAY_CAPABILITY codes), whether it is approved for hazardous residue and food-grade cleaning, its state (available, occupied, maintenance, offline) and the job running in it.
-- @vector  none — new (UI Bays 1–4 were hard-coded)
-- @owner   R7 Cleaning
-- @flags   T
-- @phase   9
IF OBJECT_ID('clean.bay') IS NULL
BEGIN
    CREATE TABLE clean.bay (
        bay_id                  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_bay__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- the depot
        bay_code                VARCHAR(20)         NOT NULL,   -- e.g. WB1, TANK2
        bay_name                NVARCHAR(100)       NOT NULL,
        capability_codes        VARCHAR(200)        NOT NULL,   -- CLEANING_BAY_CAPABILITY values, comma separated: WATER,STEAM,CHEMICAL,TANK,REEFER
        hazmat_approved         BIT                 NOT NULL CONSTRAINT df_bay__hazmat DEFAULT 0,   -- may clean hazardous (UN-numbered) residue
        food_grade              BIT                 NOT NULL CONSTRAINT df_bay__food DEFAULT 0,     -- food-grade equipment and water
        state                   VARCHAR(12)         NOT NULL CONSTRAINT df_bay__state DEFAULT 'AVAILABLE',   -- AVAILABLE, OCCUPIED, MAINTENANCE, OFFLINE
        state_reason            NVARCHAR(300)       NULL,       -- MAINTENANCE / OFFLINE: why
        current_cleaning_job_id UNIQUEIDENTIFIER    NULL,       -- ref clean.cleaning_job running now (OCCUPIED)
        sort_order              SMALLINT            NOT NULL CONSTRAINT df_bay__sort DEFAULT 0,
        is_active               BIT                 NOT NULL CONSTRAINT df_bay__active DEFAULT 1,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_bay__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_bay__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_bay PRIMARY KEY CLUSTERED (bay_id),
        CONSTRAINT ck_bay__code CHECK (bay_code = UPPER(bay_code) COLLATE Latin1_General_100_CS_AS AND bay_code NOT LIKE '%[^A-Z0-9_-]%'),
        -- Upper-case codes separated by commas, no blanks, no leading / trailing / double comma.
        CONSTRAINT ck_bay__capabilities CHECK (capability_codes = UPPER(capability_codes) COLLATE Latin1_General_100_CS_AS
            AND capability_codes NOT LIKE '%[^A-Z0-9_,]%' AND capability_codes NOT LIKE ',%' AND capability_codes NOT LIKE '%,'
            AND capability_codes NOT LIKE '%,,%' AND LEN(capability_codes) > 0),
        CONSTRAINT ck_bay__state CHECK (state IN ('AVAILABLE','OCCUPIED','MAINTENANCE','OFFLINE')),
        CONSTRAINT ck_bay__state_reason CHECK (state NOT IN ('MAINTENANCE','OFFLINE') OR state_reason IS NOT NULL),
        -- OCCUPIED exactly when a job is running in the bay.
        CONSTRAINT ck_bay__occupied CHECK ((state = 'OCCUPIED' AND current_cleaning_job_id IS NOT NULL) OR (state <> 'OCCUPIED' AND current_cleaning_job_id IS NULL)),
        CONSTRAINT ck_bay__inactive CHECK (is_active = 1 OR state IN ('MAINTENANCE','OFFLINE'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_bay__code
        ON clean.bay (tenant_id, branch_id, bay_code) WHERE deleted_at IS NULL;
    -- A job runs in one bay at a time.
    CREATE UNIQUE NONCLUSTERED INDEX uq_bay__current_job
        ON clean.bay (tenant_id, current_cleaning_job_id) WHERE current_cleaning_job_id IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_bay__board
        ON clean.bay (tenant_id, branch_id, state) INCLUDE (bay_code, capability_codes, current_cleaning_job_id) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'clean', @table = 'bay';
END
GO

-- @table   clean.cleaning_job
-- @purpose One cleaning job (REPAIR_CLN) for a container visit, with or without an M&R case: cleaning type, previous and next cargo (UN no., product), priority and SLA, who asked, bay and schedule, status (queued, assigned, started, paused, completed, certified, cancelled), the inspection after cleaning, the certificate, the tariff rate it is sold at and the cost roll-up.
-- @vector  CleaningJob (UI /cleaning, /cleaning/new, /cleaning/[id])
-- @owner   R7 Cleaning
-- @flags   T
-- @phase   9
IF OBJECT_ID('clean.cleaning_job') IS NULL
BEGIN
    CREATE TABLE clean.cleaning_job (
        cleaning_job_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_cleaning_job__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        job_no                  VARCHAR(30)         NOT NULL,   -- REPAIR_CLN series
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case (optional: a clean can be ordered without damage)
        case_no                 VARCHAR(30)         NULL,
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref intake.equipment_visit
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        equipment_category      VARCHAR(10)         NULL,       -- DRY, REEFER, TANK ... (copy from the visit / unit profile)
        cleaning_type_code      VARCHAR(40)         NOT NULL,   -- CLEANING_TYPE code list (gecko_master): SWEEP, WATER_WASH, STEAM, CHEMICAL, TANK_CLEAN ...
        request_source          VARCHAR(15)         NOT NULL CONSTRAINT df_cleaning_job__source DEFAULT 'MANUAL',   -- MANUAL, GATE_CONDITION (auto on CL), CASE, CUSTOMER
        requested_by_party_id   UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party (line / lessor / shipper asking)
        requested_by_party_code VARCHAR(20)         NULL,
        customer_ref            VARCHAR(60)         NULL,       -- requester's order / booking reference
        prev_cargo_un_no        CHAR(4)             NULL,       -- UN number of the last cargo (hazardous residue)
        prev_cargo_name         NVARCHAR(200)       NULL,
        prev_cargo_hazardous    BIT                 NOT NULL CONSTRAINT df_cleaning_job__prev_haz DEFAULT 0,
        next_cargo_un_no        CHAR(4)             NULL,
        next_cargo_name         NVARCHAR(200)       NULL,
        food_grade_required     BIT                 NOT NULL CONSTRAINT df_cleaning_job__food DEFAULT 0,   -- next cargo is food: food-grade bay and certificate
        priority                VARCHAR(10)         NOT NULL CONSTRAINT df_cleaning_job__priority DEFAULT 'NORMAL',   -- NORMAL, URGENT, EXPRESS
        sla_due_at              DATETIMEOFFSET(7)   NULL,       -- from config.repair_setting SLA by priority
        bay_id                  UNIQUEIDENTIFIER    NULL,       -- ref clean.bay
        bay_code                VARCHAR(20)         NULL,
        scheduled_at            DATETIMEOFFSET(7)   NULL,
        operator_user_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_identity user leading the job
        status                  VARCHAR(12)         NOT NULL CONSTRAINT df_cleaning_job__status DEFAULT 'QUEUED',   -- QUEUED, ASSIGNED, STARTED, PAUSED, COMPLETED, CERTIFIED, CANCELLED
        pause_reason            NVARCHAR(300)       NULL,
        started_at              DATETIMEOFFSET(7)   NULL,
        completed_at            DATETIMEOFFSET(7)   NULL,
        completed_by            UNIQUEIDENTIFIER    NULL,
        reclean_count           TINYINT             NOT NULL CONSTRAINT df_cleaning_job__reclean DEFAULT 0,   -- times sent back after a failed inspection
        inspection_result       VARCHAR(4)          NULL,       -- PASS, FAIL (inspection after cleaning, before the certificate)
        inspected_at            DATETIMEOFFSET(7)   NULL,
        inspected_by            UNIQUEIDENTIFIER    NULL,
        inspection_remarks      NVARCHAR(500)       NULL,
        certificate_no          VARCHAR(40)         NULL,       -- cleaning certificate (tank: EFTCO ECD-compatible layout later)
        certificate_issued_at   DATETIMEOFFSET(7)   NULL,
        certificate_attachment_id UNIQUEIDENTIFIER  NULL,       -- ref doc.attachment (the printed PDF)
        is_billable             BIT                 NOT NULL CONSTRAINT df_cleaning_job__billable DEFAULT 1,
        charge_code             VARCHAR(15)         NULL,       -- gecko_master charge code (WASHING ...)
        container_repair_rate_id UNIQUEIDENTIFIER   NULL,       -- ref gecko_revenue:tariff.container_repair_rate (SERVICE rate kind) the sell price comes from
        billable_item_id        UNIQUEIDENTIFIER    NULL,       -- ref charge.billable_item (source_type CLEANING)
        currency_code           CHAR(3)             NOT NULL,   -- depot currency (cost)
        labour_hours            DECIMAL(9,2)        NOT NULL CONSTRAINT df_cleaning_job__labour_hours DEFAULT 0,
        labour_cost             DECIMAL(18,4)       NOT NULL CONSTRAINT df_cleaning_job__labour DEFAULT 0,
        chemical_cost           DECIMAL(18,4)       NOT NULL CONSTRAINT df_cleaning_job__chemical DEFAULT 0,   -- sum of clean.chemical_usage
        other_cost              DECIMAL(18,4)       NOT NULL CONSTRAINT df_cleaning_job__other DEFAULT 0,      -- water, steam, waste disposal
        total_cost              DECIMAL(18,4)       NOT NULL CONSTRAINT df_cleaning_job__total DEFAULT 0,      -- labour + chemical + other
        cancel_reason           NVARCHAR(300)       NULL,
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline / idempotent create key
        legacy_ref              VARCHAR(80)         NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_cleaning_job__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_cleaning_job__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_cleaning_job PRIMARY KEY CLUSTERED (cleaning_job_id),
        CONSTRAINT ck_cleaning_job__case_pair CHECK ((repair_case_id IS NULL AND case_no IS NULL) OR (repair_case_id IS NOT NULL AND case_no IS NOT NULL)),
        CONSTRAINT ck_cleaning_job__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_cleaning_job__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_cleaning_job__type CHECK (cleaning_type_code = UPPER(cleaning_type_code) COLLATE Latin1_General_100_CS_AS AND cleaning_type_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_cleaning_job__tank_clean CHECK (cleaning_type_code <> 'TANK_CLEAN' OR (equipment_category IS NOT NULL AND equipment_category = 'TANK')),
        CONSTRAINT ck_cleaning_job__source CHECK (request_source IN ('MANUAL','GATE_CONDITION','CASE','CUSTOMER')),
        CONSTRAINT ck_cleaning_job__case_source CHECK (request_source <> 'CASE' OR repair_case_id IS NOT NULL),
        CONSTRAINT ck_cleaning_job__requester_pair CHECK ((requested_by_party_id IS NULL AND requested_by_party_code IS NULL) OR (requested_by_party_id IS NOT NULL AND requested_by_party_code IS NOT NULL)),
        CONSTRAINT ck_cleaning_job__un_no CHECK ((prev_cargo_un_no IS NULL OR prev_cargo_un_no LIKE '[0-9][0-9][0-9][0-9]')
            AND (next_cargo_un_no IS NULL OR next_cargo_un_no LIKE '[0-9][0-9][0-9][0-9]')),
        -- A hazardous residue must say what it was.
        CONSTRAINT ck_cleaning_job__hazardous CHECK (prev_cargo_hazardous = 0 OR prev_cargo_un_no IS NOT NULL),
        CONSTRAINT ck_cleaning_job__priority CHECK (priority IN ('NORMAL','URGENT','EXPRESS')),
        CONSTRAINT ck_cleaning_job__bay_pair CHECK ((bay_id IS NULL AND bay_code IS NULL) OR (bay_id IS NOT NULL AND bay_code IS NOT NULL)),
        CONSTRAINT ck_cleaning_job__status CHECK (status IN ('QUEUED','ASSIGNED','STARTED','PAUSED','COMPLETED','CERTIFIED','CANCELLED')),
        -- Past the queue the job has a bay.
        CONSTRAINT ck_cleaning_job__bay CHECK (status IN ('QUEUED','CANCELLED') OR bay_id IS NOT NULL),
        CONSTRAINT ck_cleaning_job__started CHECK (status IN ('QUEUED','ASSIGNED','CANCELLED') OR started_at IS NOT NULL),
        CONSTRAINT ck_cleaning_job__paused CHECK (status <> 'PAUSED' OR pause_reason IS NOT NULL),
        CONSTRAINT ck_cleaning_job__completed CHECK ((status IN ('COMPLETED','CERTIFIED') AND completed_at IS NOT NULL AND completed_by IS NOT NULL)
            OR (status NOT IN ('COMPLETED','CERTIFIED') AND completed_at IS NULL)),
        CONSTRAINT ck_cleaning_job__span CHECK (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at)),
        CONSTRAINT ck_cleaning_job__inspection CHECK ((inspection_result IS NULL AND inspected_at IS NULL AND inspected_by IS NULL)
            OR (inspection_result IN ('PASS','FAIL') AND inspected_at IS NOT NULL AND inspected_by IS NOT NULL)),
        CONSTRAINT ck_cleaning_job__inspection_fail CHECK (inspection_result IS NULL OR inspection_result <> 'FAIL' OR inspection_remarks IS NOT NULL),
        -- Certified = completed, inspected PASS and a certificate number issued; a certificate only on CERTIFIED.
        CONSTRAINT ck_cleaning_job__certified CHECK (status <> 'CERTIFIED'
            OR (inspection_result IS NOT NULL AND inspection_result = 'PASS' AND certificate_no IS NOT NULL AND certificate_issued_at IS NOT NULL)),
        CONSTRAINT ck_cleaning_job__certificate_only CHECK (status = 'CERTIFIED' OR (certificate_no IS NULL AND certificate_issued_at IS NULL)),
        CONSTRAINT ck_cleaning_job__cancel CHECK (status <> 'CANCELLED' OR cancel_reason IS NOT NULL),
        CONSTRAINT ck_cleaning_job__billing CHECK (is_billable = 1 OR (billable_item_id IS NULL AND container_repair_rate_id IS NULL)),
        CONSTRAINT ck_cleaning_job__billed CHECK (billable_item_id IS NULL OR charge_code IS NOT NULL),
        CONSTRAINT ck_cleaning_job__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_cleaning_job__costs CHECK (labour_hours >= 0 AND labour_cost >= 0 AND chemical_cost >= 0 AND other_cost >= 0),
        CONSTRAINT ck_cleaning_job__total CHECK (total_cost = labour_cost + chemical_cost + other_cost)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_cleaning_job__job_no
        ON clean.cleaning_job (tenant_id, job_no) WHERE deleted_at IS NULL;
    -- One open job per container visit and cleaning type; a new one only after the
    -- previous is certified or cancelled.
    CREATE UNIQUE NONCLUSTERED INDEX uq_cleaning_job__visit_type
        ON clean.cleaning_job (tenant_id, equipment_visit_id, cleaning_type_code)
        WHERE status IN ('QUEUED','ASSIGNED','STARTED','PAUSED','COMPLETED') AND deleted_at IS NULL;
    -- One running job per bay.
    CREATE UNIQUE NONCLUSTERED INDEX uq_cleaning_job__bay_active
        ON clean.cleaning_job (tenant_id, bay_id) WHERE status IN ('STARTED','PAUSED') AND bay_id IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_cleaning_job__certificate
        ON clean.cleaning_job (tenant_id, certificate_no) WHERE certificate_no IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_cleaning_job__client_ref
        ON clean.cleaning_job (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_cleaning_job__board
        ON clean.cleaning_job (tenant_id, branch_id, status, created_at) INCLUDE (job_no, container_no, cleaning_type_code, priority, bay_code, sla_due_at) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_cleaning_job__case
        ON clean.cleaning_job (tenant_id, repair_case_id) WHERE repair_case_id IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_cleaning_job__container_no
        ON clean.cleaning_job (tenant_id, container_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'clean', @table = 'cleaning_job';
END
GO

-- @table   clean.cleaning_step
-- @purpose One step of a cleaning job's process log (pre-rinse, caustic, rinse, acid, final rinse, dry, inspection ...): sequence, temperature, pressure, duration, water used, operator, done or skipped and when.
-- @vector  none — new (UI process log was hard-coded)
-- @owner   R7 Cleaning
-- @flags   -
-- @phase   9
IF OBJECT_ID('clean.cleaning_step') IS NULL
BEGIN
    CREATE TABLE clean.cleaning_step (
        cleaning_step_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_cleaning_step__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        cleaning_job_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref clean.cleaning_job
        step_no                 SMALLINT            NOT NULL,
        step_code               VARCHAR(15)         NOT NULL,   -- SWEEP, PRE_RINSE, CAUSTIC, DETERGENT, RINSE, ACID, STEAM, FINAL_RINSE, DEODORISE, DRY, INSPECTION, OTHER
        description             NVARCHAR(300)       NULL,       -- required for OTHER
        temperature_c           DECIMAL(5,1)        NULL,
        pressure_bar            DECIMAL(6,2)        NULL,
        planned_minutes         SMALLINT            NULL,
        duration_minutes        SMALLINT            NULL,       -- actual
        water_l                 DECIMAL(10,2)       NULL,
        operator_user_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_identity user who did the step
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_cleaning_step__status DEFAULT 'PENDING',   -- PENDING, IN_PROGRESS, DONE, SKIPPED
        skip_reason             NVARCHAR(300)       NULL,
        started_at              DATETIMEOFFSET(7)   NULL,
        done_at                 DATETIMEOFFSET(7)   NULL,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_cleaning_step__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_cleaning_step__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_cleaning_step PRIMARY KEY CLUSTERED (cleaning_step_id),
        CONSTRAINT ck_cleaning_step__no CHECK (step_no >= 1),
        CONSTRAINT ck_cleaning_step__code CHECK (step_code IN ('SWEEP','PRE_RINSE','CAUSTIC','DETERGENT','RINSE','ACID','STEAM','FINAL_RINSE','DEODORISE','DRY','INSPECTION','OTHER')),
        CONSTRAINT ck_cleaning_step__other CHECK (step_code <> 'OTHER' OR description IS NOT NULL),
        CONSTRAINT ck_cleaning_step__readings CHECK ((temperature_c IS NULL OR temperature_c BETWEEN -20 AND 200)
            AND (pressure_bar IS NULL OR pressure_bar >= 0) AND (water_l IS NULL OR water_l >= 0)
            AND (planned_minutes IS NULL OR planned_minutes >= 0) AND (duration_minutes IS NULL OR duration_minutes >= 0)),
        CONSTRAINT ck_cleaning_step__status CHECK (status IN ('PENDING','IN_PROGRESS','DONE','SKIPPED')),
        CONSTRAINT ck_cleaning_step__started CHECK (status NOT IN ('IN_PROGRESS','DONE') OR started_at IS NOT NULL),
        CONSTRAINT ck_cleaning_step__done CHECK ((status = 'DONE' AND done_at IS NOT NULL AND operator_user_id IS NOT NULL) OR (status <> 'DONE' AND done_at IS NULL)),
        CONSTRAINT ck_cleaning_step__span CHECK (done_at IS NULL OR done_at >= started_at),
        CONSTRAINT ck_cleaning_step__skipped CHECK (status <> 'SKIPPED' OR skip_reason IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_cleaning_step__no
        ON clean.cleaning_step (tenant_id, cleaning_job_id, step_no) WHERE deleted_at IS NULL;
END
GO

-- @table   clean.chemical_usage
-- @purpose One chemical or detergent consumed by a cleaning job (optionally a step): material, quantity, batch, the stock issue (part.stock_ledger ISSUE row) it came from and its cost at moving average. Never changed: a wrong entry is reversed by a REVERSAL row with negative quantity.
-- @vector  none — new (UI chemicals were hard-coded)
-- @owner   R7 Cleaning
-- @flags   A
-- @phase   9
IF OBJECT_ID('clean.chemical_usage') IS NULL
BEGIN
    CREATE TABLE clean.chemical_usage (
        chemical_usage_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_chemical_usage__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        cleaning_job_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref clean.cleaning_job
        cleaning_step_id        UNIQUEIDENTIFIER    NULL,       -- ref clean.cleaning_step (where it was dosed)
        entry_kind              VARCHAR(10)         NOT NULL,   -- USAGE, REVERSAL
        supply_source           VARCHAR(10)         NOT NULL CONSTRAINT df_chemical_usage__supply DEFAULT 'STOCK',   -- STOCK (issued from a store), DIRECT (bought in for the job)
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        material_code           VARCHAR(40)         NOT NULL,
        store_id                UNIQUEIDENTIFIER    NULL,       -- ref part.store it was issued from (STOCK)
        stock_ledger_id         UNIQUEIDENTIFIER    NULL,       -- ref part.stock_ledger ISSUE row (STOCK)
        stock_document_id       UNIQUEIDENTIFIER    NULL,       -- ref part.stock_document (REPAIR_ISS)
        stock_document_no       VARCHAR(30)         NULL,
        batch_no                VARCHAR(40)         NULL,       -- product batch / lot (printed on the certificate)
        quantity                DECIMAL(18,4)       NOT NULL,   -- base unit; negative only on REVERSAL
        uom_code                VARCHAR(10)         NOT NULL,
        unit_cost               DECIMAL(18,4)       NOT NULL,   -- STOCK: ledger unit cost (moving average); DIRECT: purchase price
        cost_amount             DECIMAL(18,4)       NOT NULL,   -- ROUND(quantity x unit_cost, 4)
        currency_code           CHAR(3)             NOT NULL,
        reverses_chemical_usage_id UNIQUEIDENTIFIER NULL,       -- ref clean.chemical_usage (REVERSAL)
        reason                  NVARCHAR(300)       NULL,       -- DIRECT / REVERSAL: why
        client_ref              UNIQUEIDENTIFIER    NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_chemical_usage__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_chemical_usage PRIMARY KEY CLUSTERED (chemical_usage_id),
        CONSTRAINT ck_chemical_usage__kind CHECK (entry_kind IN ('USAGE','REVERSAL')),
        CONSTRAINT ck_chemical_usage__supply CHECK (supply_source IN ('STOCK','DIRECT')),
        -- Stock usage is an issue posted in part.*; direct supply has no stock references.
        CONSTRAINT ck_chemical_usage__stock CHECK (
            (supply_source = 'STOCK' AND store_id IS NOT NULL AND stock_ledger_id IS NOT NULL AND stock_document_id IS NOT NULL AND stock_document_no IS NOT NULL)
            OR (supply_source = 'DIRECT' AND store_id IS NULL AND stock_ledger_id IS NULL AND stock_document_id IS NULL AND stock_document_no IS NULL)),
        CONSTRAINT ck_chemical_usage__qty CHECK ((entry_kind = 'REVERSAL' AND quantity < 0) OR (entry_kind = 'USAGE' AND quantity > 0)),
        CONSTRAINT ck_chemical_usage__reversal CHECK ((entry_kind = 'REVERSAL' AND reverses_chemical_usage_id IS NOT NULL) OR (entry_kind = 'USAGE' AND reverses_chemical_usage_id IS NULL)),
        CONSTRAINT ck_chemical_usage__reason CHECK ((entry_kind = 'USAGE' AND supply_source = 'STOCK') OR reason IS NOT NULL),
        CONSTRAINT ck_chemical_usage__rate CHECK (unit_cost >= 0),
        CONSTRAINT ck_chemical_usage__cost CHECK (cost_amount = ROUND(quantity * unit_cost, 4)),
        CONSTRAINT ck_chemical_usage__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]')
    );
    -- A stock ledger row backs at most one usage record (a reversal carries the ledger REVERSAL row's id).
    CREATE UNIQUE NONCLUSTERED INDEX uq_chemical_usage__ledger
        ON clean.chemical_usage (tenant_id, stock_ledger_id) WHERE stock_ledger_id IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_chemical_usage__reverses
        ON clean.chemical_usage (tenant_id, reverses_chemical_usage_id) WHERE reverses_chemical_usage_id IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_chemical_usage__client_ref
        ON clean.chemical_usage (tenant_id, client_ref) WHERE client_ref IS NOT NULL;
    CREATE NONCLUSTERED INDEX ix_chemical_usage__job
        ON clean.chemical_usage (tenant_id, cleaning_job_id) INCLUDE (material_code, quantity, cost_amount);
    -- Chemical consumption reports per product.
    CREATE NONCLUSTERED INDEX ix_chemical_usage__material
        ON clean.chemical_usage (tenant_id, material_id, created_at) INCLUDE (quantity, cost_amount);
    EXEC dbo.usp_make_append_only @schema = 'clean', @table = 'chemical_usage';
END
GO

-- @table   reefer.pti_job
-- @purpose One reefer pre-trip inspection (REPAIR_PTI) for a container visit, with or without an M&R case: reefer unit make / model, refrigerant, PTI level, set point and pre-cool, who asked, technician, checklist version, start / end, outcome (PASS / FAIL with reason), certificate (PASS only), controller download, the estimate raised on FAIL, an optional reference to the yard system's power session, the tariff rate it is sold at and the cost roll-up.
-- @vector  survey type pti (UI /survey?type=pti, /survey/[id]/certificate)
-- @owner   R8 Reefer PTI
-- @flags   T
-- @phase   9
IF OBJECT_ID('reefer.pti_job') IS NULL
BEGIN
    CREATE TABLE reefer.pti_job (
        pti_job_id              UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_pti_job__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        pti_no                  VARCHAR(30)         NOT NULL,   -- REPAIR_PTI series
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case (optional)
        case_no                 VARCHAR(30)         NULL,
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref intake.equipment_visit
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        unit_profile_id         UNIQUEIDENTIFIER    NULL,       -- ref unit.unit_profile (last PTI written back)
        reefer_make_code        VARCHAR(20)         NULL,       -- REEFER_UNIT_MAKE (copy from the registry): CARRIER, DAIKIN, THERMO_KING, STAR_COOL
        reefer_model            VARCHAR(40)         NULL,
        controller_software     VARCHAR(40)         NULL,
        refrigerant             VARCHAR(10)         NULL,       -- R134A, R513A, R452A, R744 ...
        pti_level               VARCHAR(10)         NOT NULL,   -- PTI_1, PTI_2, PTI_3, FULL, SHORT
        set_point_c             DECIMAL(5,1)        NULL,       -- set point requested for the next cargo
        pre_cool_required       BIT                 NOT NULL CONSTRAINT df_pti_job__pre_cool DEFAULT 0,
        pre_cool_set_point_c    DECIMAL(5,1)        NULL,
        request_source          VARCHAR(15)         NOT NULL CONSTRAINT df_pti_job__source DEFAULT 'MANUAL',   -- MANUAL, CASE, CUSTOMER, BOOKING
        requested_by_party_id   UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party
        requested_by_party_code VARCHAR(20)         NULL,
        customer_ref            VARCHAR(60)         NULL,       -- requester's booking / release reference
        priority                VARCHAR(10)         NOT NULL CONSTRAINT df_pti_job__priority DEFAULT 'NORMAL',   -- NORMAL, URGENT, EXPRESS
        sla_due_at              DATETIMEOFFSET(7)   NULL,
        scheduled_at            DATETIMEOFFSET(7)   NULL,
        technician_id           UNIQUEIDENTIFIER    NULL,       -- ref work.technician (REEFER_TECH trade — module rule)
        checklist_template_id   UNIQUEIDENTIFIER    NULL,       -- ref code.checklist_template (PTI, exact version used)
        template_code           VARCHAR(40)         NULL,
        template_version        SMALLINT            NULL,
        status                  VARCHAR(12)         NOT NULL CONSTRAINT df_pti_job__status DEFAULT 'REQUESTED',   -- REQUESTED, SCHEDULED, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
        hold_reason             NVARCHAR(300)       NULL,
        started_at              DATETIMEOFFSET(7)   NULL,
        ended_at                DATETIMEOFFSET(7)   NULL,
        outcome                 VARCHAR(4)          NULL,       -- PASS, FAIL (set on COMPLETED)
        failure_reason          NVARCHAR(500)       NULL,
        completed_by            UNIQUEIDENTIFIER    NULL,
        follow_up_estimate_id   UNIQUEIDENTIFIER    NULL,       -- ref est.estimate raised on the same case after FAIL
        certificate_no          VARCHAR(40)         NULL,       -- PTI certificate, PASS only (SURV-05)
        certificate_issued_at   DATETIMEOFFSET(7)   NULL,
        certificate_attachment_id UNIQUEIDENTIFIER  NULL,       -- ref doc.attachment (printed PDF)
        controller_download_ref NVARCHAR(200)       NULL,       -- controller data download file / reference
        controller_download_attachment_id UNIQUEIDENTIFIER NULL,   -- ref doc.attachment (the download file)
        power_session_source    VARCHAR(12)         NULL,       -- GECKO_TOS, CONNECTOR, MANUAL — whose power session
        power_session_ref       VARCHAR(80)         NULL,       -- that system's reefer power session id (Repair does not record power)
        is_billable             BIT                 NOT NULL CONSTRAINT df_pti_job__billable DEFAULT 1,
        charge_code             VARCHAR(15)         NULL,       -- gecko_master charge code (PTI); pre-cool billed as a SERVICE billable item
        container_repair_rate_id UNIQUEIDENTIFIER   NULL,       -- ref gecko_revenue:tariff.container_repair_rate (SERVICE rate kind)
        billable_item_id        UNIQUEIDENTIFIER    NULL,       -- ref charge.billable_item (source_type PTI)
        currency_code           CHAR(3)             NOT NULL,   -- depot currency (cost)
        labour_hours            DECIMAL(9,2)        NOT NULL CONSTRAINT df_pti_job__labour_hours DEFAULT 0,
        labour_cost             DECIMAL(18,4)       NOT NULL CONSTRAINT df_pti_job__labour DEFAULT 0,
        material_cost           DECIMAL(18,4)       NOT NULL CONSTRAINT df_pti_job__material DEFAULT 0,   -- refrigerant top-up, consumables
        other_cost              DECIMAL(18,4)       NOT NULL CONSTRAINT df_pti_job__other DEFAULT 0,
        total_cost              DECIMAL(18,4)       NOT NULL CONSTRAINT df_pti_job__total DEFAULT 0,      -- labour + material + other
        cancel_reason           NVARCHAR(300)       NULL,
        client_ref              UNIQUEIDENTIFIER    NULL,
        legacy_ref              VARCHAR(80)         NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_pti_job__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_pti_job__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_pti_job PRIMARY KEY CLUSTERED (pti_job_id),
        CONSTRAINT ck_pti_job__case_pair CHECK ((repair_case_id IS NULL AND case_no IS NULL) OR (repair_case_id IS NOT NULL AND case_no IS NOT NULL)),
        CONSTRAINT ck_pti_job__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_pti_job__refrigerant CHECK (refrigerant IS NULL OR (refrigerant = UPPER(refrigerant) COLLATE Latin1_General_100_CS_AS AND refrigerant LIKE 'R%' AND refrigerant NOT LIKE '%[^A-Z0-9]%')),
        CONSTRAINT ck_pti_job__level CHECK (pti_level IN ('PTI_1','PTI_2','PTI_3','FULL','SHORT')),
        CONSTRAINT ck_pti_job__set_point CHECK ((set_point_c IS NULL OR set_point_c BETWEEN -40 AND 40)
            AND (pre_cool_set_point_c IS NULL OR pre_cool_set_point_c BETWEEN -40 AND 40)),
        CONSTRAINT ck_pti_job__pre_cool CHECK (pre_cool_required = 1 OR pre_cool_set_point_c IS NULL),
        CONSTRAINT ck_pti_job__source CHECK (request_source IN ('MANUAL','CASE','CUSTOMER','BOOKING')),
        CONSTRAINT ck_pti_job__case_source CHECK (request_source <> 'CASE' OR repair_case_id IS NOT NULL),
        CONSTRAINT ck_pti_job__requester_pair CHECK ((requested_by_party_id IS NULL AND requested_by_party_code IS NULL) OR (requested_by_party_id IS NOT NULL AND requested_by_party_code IS NOT NULL)),
        CONSTRAINT ck_pti_job__priority CHECK (priority IN ('NORMAL','URGENT','EXPRESS')),
        CONSTRAINT ck_pti_job__template CHECK ((checklist_template_id IS NULL AND template_code IS NULL AND template_version IS NULL)
            OR (checklist_template_id IS NOT NULL AND template_code IS NOT NULL AND template_version IS NOT NULL)),
        CONSTRAINT ck_pti_job__status CHECK (status IN ('REQUESTED','SCHEDULED','IN_PROGRESS','ON_HOLD','COMPLETED','CANCELLED')),
        CONSTRAINT ck_pti_job__scheduled CHECK (status IN ('REQUESTED','CANCELLED') OR technician_id IS NOT NULL),
        CONSTRAINT ck_pti_job__hold CHECK (status <> 'ON_HOLD' OR hold_reason IS NOT NULL),
        CONSTRAINT ck_pti_job__started CHECK (status IN ('REQUESTED','SCHEDULED','CANCELLED') OR started_at IS NOT NULL),
        CONSTRAINT ck_pti_job__span CHECK (ended_at IS NULL OR (started_at IS NOT NULL AND ended_at >= started_at)),
        -- Completed = ended with an outcome; an outcome only on COMPLETED.
        CONSTRAINT ck_pti_job__completed CHECK ((status = 'COMPLETED' AND ended_at IS NOT NULL AND outcome IS NOT NULL AND outcome IN ('PASS','FAIL') AND completed_by IS NOT NULL)
            OR (status <> 'COMPLETED' AND outcome IS NULL)),
        CONSTRAINT ck_pti_job__failed CHECK (outcome IS NULL OR outcome <> 'FAIL' OR failure_reason IS NOT NULL),
        CONSTRAINT ck_pti_job__estimate CHECK (follow_up_estimate_id IS NULL OR (outcome IS NOT NULL AND outcome = 'FAIL')),
        -- Certificate printed only for PASS (SURV-05), number and issue time together.
        CONSTRAINT ck_pti_job__certificate_pair CHECK ((certificate_no IS NULL AND certificate_issued_at IS NULL) OR (certificate_no IS NOT NULL AND certificate_issued_at IS NOT NULL)),
        CONSTRAINT ck_pti_job__certificate_pass CHECK (certificate_no IS NULL OR (status = 'COMPLETED' AND outcome IS NOT NULL AND outcome = 'PASS')),
        CONSTRAINT ck_pti_job__power_pair CHECK ((power_session_source IS NULL AND power_session_ref IS NULL) OR (power_session_source IS NOT NULL AND power_session_ref IS NOT NULL)),
        CONSTRAINT ck_pti_job__power_source CHECK (power_session_source IS NULL OR power_session_source IN ('GECKO_TOS','CONNECTOR','MANUAL')),
        CONSTRAINT ck_pti_job__cancel CHECK (status <> 'CANCELLED' OR cancel_reason IS NOT NULL),
        CONSTRAINT ck_pti_job__billing CHECK (is_billable = 1 OR (billable_item_id IS NULL AND container_repair_rate_id IS NULL)),
        CONSTRAINT ck_pti_job__billed CHECK (billable_item_id IS NULL OR charge_code IS NOT NULL),
        CONSTRAINT ck_pti_job__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_pti_job__costs CHECK (labour_hours >= 0 AND labour_cost >= 0 AND material_cost >= 0 AND other_cost >= 0),
        CONSTRAINT ck_pti_job__total CHECK (total_cost = labour_cost + material_cost + other_cost)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_pti_job__pti_no
        ON reefer.pti_job (tenant_id, pti_no) WHERE deleted_at IS NULL;
    -- One open PTI per container visit.
    CREATE UNIQUE NONCLUSTERED INDEX uq_pti_job__visit_open
        ON reefer.pti_job (tenant_id, equipment_visit_id) WHERE status IN ('REQUESTED','SCHEDULED','IN_PROGRESS','ON_HOLD') AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_pti_job__certificate
        ON reefer.pti_job (tenant_id, certificate_no) WHERE certificate_no IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_pti_job__client_ref
        ON reefer.pti_job (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_pti_job__board
        ON reefer.pti_job (tenant_id, branch_id, status, created_at) INCLUDE (pti_no, container_no, pti_level, priority, outcome, sla_due_at) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_pti_job__case
        ON reefer.pti_job (tenant_id, repair_case_id) WHERE repair_case_id IS NOT NULL AND deleted_at IS NULL;
    -- Last PTI of a box (TOS reefer reports read it through the contract) and search by number.
    CREATE NONCLUSTERED INDEX ix_pti_job__container_no
        ON reefer.pti_job (tenant_id, container_no, ended_at) INCLUDE (outcome, pti_level, certificate_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_pti_job__technician
        ON reefer.pti_job (tenant_id, technician_id, status) WHERE technician_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'reefer', @table = 'pti_job';
END
GO

-- @table   reefer.pti_result
-- @purpose One checklist item of a PTI (set-up, controller, pull-down, defrost, T-cycle, inspection, ATP): the template item, reading and its unit, the expected range, result (pass, fail, not applicable) and the controller fault / alarm code.
-- @vector  PTI checklist (25 items, UI stub)
-- @owner   R8 Reefer PTI
-- @flags   -
-- @phase   9
IF OBJECT_ID('reefer.pti_result') IS NULL
BEGIN
    CREATE TABLE reefer.pti_result (
        pti_result_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_pti_result__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        pti_job_id              UNIQUEIDENTIFIER    NOT NULL,   -- ref reefer.pti_job
        item_no                 SMALLINT            NOT NULL,   -- sequence on the checklist
        checklist_item_id       UNIQUEIDENTIFIER    NULL,       -- ref code.checklist_item (NULL = item added by the technician)
        item_code               VARCHAR(40)         NOT NULL,
        category                VARCHAR(12)         NOT NULL,   -- SETUP, CONTROLLER, PULL_DOWN, DEFROST, T_CYCLE, INSPECTION, ATP, OTHER
        label                   NVARCHAR(200)       NOT NULL,   -- copy of the template label (printed on the certificate)
        reading_value           DECIMAL(18,4)       NULL,
        reading_text            NVARCHAR(200)       NULL,       -- non-numeric reading (e.g. controller version)
        reading_uom             VARCHAR(10)         NULL,       -- C, BAR, PSI, A, V, HZ, MIN, PCT ...
        expected_min            DECIMAL(18,4)       NULL,
        expected_max            DECIMAL(18,4)       NULL,
        result                  VARCHAR(8)          NOT NULL CONSTRAINT df_pti_result__result DEFAULT 'PENDING',   -- PENDING, PASS, FAIL, NA
        fault_code              VARCHAR(20)         NULL,       -- controller alarm / fault code
        remarks                 NVARCHAR(500)       NULL,
        recorded_at             DATETIMEOFFSET(7)   NULL,
        recorded_by             UNIQUEIDENTIFIER    NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_pti_result__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_pti_result__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_pti_result PRIMARY KEY CLUSTERED (pti_result_id),
        CONSTRAINT ck_pti_result__item_no CHECK (item_no >= 1),
        CONSTRAINT ck_pti_result__item_code CHECK (item_code = UPPER(item_code) COLLATE Latin1_General_100_CS_AS AND item_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_pti_result__category CHECK (category IN ('SETUP','CONTROLLER','PULL_DOWN','DEFROST','T_CYCLE','INSPECTION','ATP','OTHER')),
        CONSTRAINT ck_pti_result__uom CHECK (reading_value IS NULL OR reading_uom IS NOT NULL),
        CONSTRAINT ck_pti_result__range CHECK (expected_min IS NULL OR expected_max IS NULL OR expected_min <= expected_max),
        CONSTRAINT ck_pti_result__result CHECK (result IN ('PENDING','PASS','FAIL','NA')),
        -- A result is recorded by someone at a time; PENDING has neither.
        CONSTRAINT ck_pti_result__recorded CHECK ((result = 'PENDING' AND recorded_at IS NULL AND recorded_by IS NULL)
            OR (result <> 'PENDING' AND recorded_at IS NOT NULL AND recorded_by IS NOT NULL)),
        CONSTRAINT ck_pti_result__fail CHECK (result <> 'FAIL' OR fault_code IS NOT NULL OR remarks IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_pti_result__item_no
        ON reefer.pti_result (tenant_id, pti_job_id, item_no) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_pti_result__item_code
        ON reefer.pti_result (tenant_id, pti_job_id, item_code) WHERE deleted_at IS NULL;
    -- Failure analysis: which checks fail most, per fault code.
    CREATE NONCLUSTERED INDEX ix_pti_result__failed
        ON reefer.pti_result (tenant_id, item_code, fault_code) INCLUDE (pti_job_id) WHERE result = 'FAIL' AND deleted_at IS NULL;
END
GO

-- ------------------------------------------------------------
-- part.stock_document: an ISS / RTN may be for a cleaning job instead of a work
-- order (chemicals). Additive: two NULLable columns, and the P7 CHECK
-- ck_stock_document__work_order is replaced by ck_stock_document__job
-- (ISS / RTN name exactly one job: a work order OR a cleaning job).
-- ------------------------------------------------------------
IF COL_LENGTH('part.stock_document', 'cleaning_job_id') IS NULL
    ALTER TABLE part.stock_document ADD
        cleaning_job_id         UNIQUEIDENTIFIER    NULL,       -- ref clean.cleaning_job (ISS / RTN of chemicals, P9)
        cleaning_job_no         VARCHAR(30)         NULL;
GO

IF OBJECT_ID('part.ck_stock_document__job', 'C') IS NULL
BEGIN
    IF OBJECT_ID('part.ck_stock_document__work_order', 'C') IS NOT NULL
        ALTER TABLE part.stock_document DROP CONSTRAINT ck_stock_document__work_order;
    EXEC (N'ALTER TABLE part.stock_document ADD CONSTRAINT ck_stock_document__job CHECK (
        (doc_type IN (''ISS'',''RTN'') AND (
            (work_order_id IS NOT NULL AND work_order_no IS NOT NULL AND cleaning_job_id IS NULL AND cleaning_job_no IS NULL)
            OR (cleaning_job_id IS NOT NULL AND cleaning_job_no IS NOT NULL AND work_order_id IS NULL AND work_order_no IS NULL)))
        OR (doc_type NOT IN (''ISS'',''RTN'') AND work_order_id IS NULL AND cleaning_job_id IS NULL));');
    EXEC (N'CREATE NONCLUSTERED INDEX ix_stock_document__cleaning_job
        ON part.stock_document (tenant_id, cleaning_job_id) WHERE cleaning_job_id IS NOT NULL AND deleted_at IS NULL;');
END
GO

EXEC dbo.usp_record_script '18_clean_reefer.sql', N'clean: bay (capabilities, OCCUPIED <-> current job), cleaning_job (REPAIR_CLN, one open job per visit + type, one running job per bay, certificate after PASS inspection, cost roll-up), cleaning_step, chemical_usage (A, stock ISSUE refs, reversals); reefer: pti_job (REPAIR_PTI, one open PTI per visit, outcome + certificate PASS only, generic power-session ref), pti_result; tank tests stay in unit.unit_test';
GO

PRINT '>> 18_clean_reefer.sql completed.';
GO
