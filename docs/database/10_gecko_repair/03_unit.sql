-- ============================================================
-- GECKO REPAIR (M&R) — REPAIR UNIT PROFILE AND PERIODIC TESTS (P1)
-- Script: 03_unit.sql
--
-- The container REGISTRY stays in gecko_master (equipment.container: number,
-- ISO type, owner / lessor, CSC, ACEP, reefer unit make / model). Repair keeps
-- only what the registry does not: the technical data an estimator and a
-- tank / reefer technician need, the periodic tests and certificates, the last
-- PTI, and the M&R status of the unit as a projection for lists.
--
--   unit.unit_profile   1:1 with a registry container, per tenant (id + code pair)
--   unit.unit_test      periodic tests and certificates (UNIT_TEST_TYPE code list)
--
-- equipment_category is a CLOSED list (the physical kinds of box do not grow);
-- repair_status is the case projection, written only by the Repair module.
-- Tank columns are allowed only on TANK units and reefer columns only on REEFER
-- units (CHECK), so a dry box can never carry a test pressure.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   unit.unit_profile
-- @purpose One container as M&R knows it: technical data (dimensions, floor, tank and reefer data), last PTI, and its current M&R status and open case. The registry (number, type, owner) stays in gecko_master.
-- @vector  none — new (UI EquipmentRecord, non-registry fields)
-- @owner   R1 Units and Standards
-- @flags   T
-- @phase   1
IF OBJECT_ID('unit.unit_profile') IS NULL
BEGIN
    CREATE TABLE unit.unit_profile (
        unit_profile_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_unit_profile__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,   -- ISO 6346 number of the above (copy for search and lists)
        iso_code                VARCHAR(4)          NULL,       -- ISO size-type copied from the registry, e.g. 22G1, 45R1
        equipment_category      VARCHAR(10)         NOT NULL,   -- DRY, REEFER, TANK, FLAT, OPEN_TOP, BULK, VENTILATED, PLATFORM, OTHER
        size_ft                 VARCHAR(3)          NULL,       -- nominal length: 10, 20, 40, 45, 48, 53
        internal_length_m       DECIMAL(6,3)        NULL,       -- specification tab
        internal_width_m        DECIMAL(6,3)        NULL,
        internal_height_m       DECIMAL(6,3)        NULL,
        door_opening_width_m    DECIMAL(6,3)        NULL,
        door_opening_height_m   DECIMAL(6,3)        NULL,
        cube_m3                 DECIMAL(7,2)        NULL,       -- internal volume
        floor_type              VARCHAR(20)         NULL,       -- PLYWOOD, BAMBOO, HARDWOOD, STEEL, ALUMINIUM, COMPOSITE
        tank_shell_material     VARCHAR(30)         NULL,       -- TANK only, e.g. SS316
        tank_test_pressure_bar  DECIMAL(6,2)        NULL,       -- TANK only
        tank_capacity_l         INT                 NULL,       -- TANK only
        tank_imo_type           VARCHAR(10)         NULL,       -- TANK only: T11, T14, T50 ...
        reefer_refrigerant      VARCHAR(10)         NULL,       -- REEFER only: R134A, R513A, R452A, R744
        reefer_setpoint_min_c   DECIMAL(5,1)        NULL,       -- REEFER only: lowest set point the unit supports
        reefer_setpoint_max_c   DECIMAL(5,1)        NULL,       -- REEFER only
        atp_valid_until         DATE                NULL,       -- REEFER only: ATP certificate expiry
        last_pti_at             DATETIMEOFFSET(7)   NULL,       -- written by the PTI module (P9)
        last_pti_result         VARCHAR(10)         NULL,       -- PASS, FAIL
        repair_status              VARCHAR(20)         NOT NULL CONSTRAINT df_unit_profile__repair_status DEFAULT 'NONE',   -- projection of the open case (Repair module only)
        open_repair_case_id     UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case: the case open on this unit, if any
        registry_synced_at      DATETIMEOFFSET(7)   NULL,       -- when the registry copy (number, ISO, category) was last refreshed
        legacy_ref              VARCHAR(80)         NULL,       -- opening import only
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_unit_profile__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_unit_profile__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_unit_profile PRIMARY KEY CLUSTERED (unit_profile_id),
        CONSTRAINT ck_unit_profile__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_unit_profile__category CHECK (equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_unit_profile__size CHECK (size_ft IS NULL OR size_ft IN ('10','20','40','45','48','53')),
        CONSTRAINT ck_unit_profile__dims CHECK (
            (internal_length_m IS NULL OR internal_length_m > 0) AND (internal_width_m IS NULL OR internal_width_m > 0)
            AND (internal_height_m IS NULL OR internal_height_m > 0) AND (cube_m3 IS NULL OR cube_m3 > 0)),
        CONSTRAINT ck_unit_profile__floor CHECK (floor_type IS NULL OR floor_type IN ('PLYWOOD','BAMBOO','HARDWOOD','STEEL','ALUMINIUM','COMPOSITE')),
        -- Tank data only on tanks, reefer data only on reefers.
        CONSTRAINT ck_unit_profile__tank_only CHECK (equipment_category = 'TANK'
            OR (tank_shell_material IS NULL AND tank_test_pressure_bar IS NULL AND tank_capacity_l IS NULL AND tank_imo_type IS NULL)),
        CONSTRAINT ck_unit_profile__reefer_only CHECK (equipment_category = 'REEFER'
            OR (reefer_refrigerant IS NULL AND reefer_setpoint_min_c IS NULL AND reefer_setpoint_max_c IS NULL
                AND atp_valid_until IS NULL AND last_pti_at IS NULL AND last_pti_result IS NULL)),
        CONSTRAINT ck_unit_profile__setpoints CHECK (reefer_setpoint_min_c IS NULL OR reefer_setpoint_max_c IS NULL OR reefer_setpoint_min_c <= reefer_setpoint_max_c),
        CONSTRAINT ck_unit_profile__pti CHECK ((last_pti_at IS NULL AND last_pti_result IS NULL)
            OR (last_pti_at IS NOT NULL AND last_pti_result IN ('PASS','FAIL'))),
        CONSTRAINT ck_unit_profile__repair_status CHECK (repair_status IN ('NONE','AWAITING_SURVEY','AWAITING_ESTIMATE','AWAITING_APPROVAL',
            'AWAITING_REPAIR','IN_REPAIR','IN_CLEANING','IN_PTI','COMPLETED')),
        -- An open case means a status other than NONE / COMPLETED, and the reverse.
        CONSTRAINT ck_unit_profile__open_case CHECK ((open_repair_case_id IS NULL AND repair_status IN ('NONE','COMPLETED'))
            OR (open_repair_case_id IS NOT NULL AND repair_status NOT IN ('NONE','COMPLETED')))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_unit_profile__container
        ON unit.unit_profile (tenant_id, container_id) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_unit_profile__container_no
        ON unit.unit_profile (tenant_id, container_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_unit_profile__status
        ON unit.unit_profile (tenant_id, repair_status) INCLUDE (container_no, equipment_category) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'unit', @table = 'unit_profile';
END
GO

-- @table   unit.unit_test
-- @purpose One periodic test or certificate of a unit (tank 2.5 / 5 year, CSC, ACEP, ATP, pressure): when, result, by whom, certificate number and the next due date the due-list and expiry alerts read.
-- @vector  none — new (UI structuralTestDate, intermediateTestDate, nextPeriodicExam)
-- @owner   R1 Units and Standards
-- @flags   T
-- @phase   1
IF OBJECT_ID('unit.unit_test') IS NULL
BEGIN
    CREATE TABLE unit.unit_test (
        unit_test_id            UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_unit_test__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,       -- depot where the test was done; NULL = done elsewhere (recorded from a certificate)
        unit_profile_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref unit.unit_profile
        container_no            VARCHAR(11)         NOT NULL,   -- copy for search
        test_type_code          VARCHAR(40)         NOT NULL,   -- UNIT_TEST_TYPE code list (gecko_master): TANK_2_5Y, TANK_5Y, CSC_PERIODIC, ATP ...
        test_date               DATE                NOT NULL,   -- date of the test (depot local date)
        result                  VARCHAR(12)         NOT NULL,   -- PASS, FAIL, CONDITIONAL
        inspector_name          NVARCHAR(100)       NULL,       -- person who tested / signed
        class_society_code      VARCHAR(40)         NULL,       -- CLASS_SOCIETY code list: who witnessed / certified
        certificate_no          NVARCHAR(60)        NULL,       -- certificate or report number
        next_due_date           DATE                NULL,       -- when the next test of this type is due; drives the due list
        test_pressure_bar       DECIMAL(6,2)        NULL,       -- pressure applied (tank / pressure tests)
        source_type             VARCHAR(20)         NULL,       -- what produced it: PTI_JOB, REPAIR_CASE, MANUAL, IMPORT
        source_id               UNIQUEIDENTIFIER    NULL,       -- id of that document (both or neither with source_type)
        attachment_id           UNIQUEIDENTIFIER    NULL,       -- ref doc.attachment: the scanned certificate
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_unit_test__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_unit_test__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_unit_test PRIMARY KEY CLUSTERED (unit_test_id),
        CONSTRAINT ck_unit_test__type CHECK (test_type_code = UPPER(test_type_code) COLLATE Latin1_General_100_CS_AS AND test_type_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_unit_test__result CHECK (result IN ('PASS','FAIL','CONDITIONAL')),
        CONSTRAINT ck_unit_test__due CHECK (next_due_date IS NULL OR next_due_date > test_date),
        CONSTRAINT ck_unit_test__pressure CHECK (test_pressure_bar IS NULL OR test_pressure_bar > 0),
        CONSTRAINT ck_unit_test__source_pair CHECK ((source_type IS NULL AND source_id IS NULL) OR (source_type IS NOT NULL AND source_id IS NOT NULL)),
        CONSTRAINT ck_unit_test__source_type CHECK (source_type IS NULL OR source_type IN ('PTI_JOB','REPAIR_CASE','MANUAL','IMPORT'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_unit_test__once_a_day
        ON unit.unit_test (tenant_id, unit_profile_id, test_type_code, test_date) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_unit_test__due
        ON unit.unit_test (tenant_id, next_due_date) INCLUDE (container_no, test_type_code) WHERE deleted_at IS NULL AND next_due_date IS NOT NULL;
    EXEC dbo.usp_enable_temporal @schema = 'unit', @table = 'unit_test';
END
GO

EXEC dbo.usp_record_script '03_unit.sql', N'unit: unit_profile (registry pair, technical data, tank/reefer data guarded by category, PTI, M&R status projection), unit_test (periodic tests and certificates) — temporal';
GO

PRINT '>> 03_unit.sql completed.';
GO
