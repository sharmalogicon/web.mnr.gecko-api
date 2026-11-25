-- ============================================================
-- GECKO REVENUE — REPAIR (M&R) TARIFF SURCHARGES (Repair P4 follow-up, 25 Nov)
-- Script: 82_repair_surcharge.sql
-- Owner:  S05 Commercial & Rating
--
--   tariff.container_repair_surcharge   one surcharge on an M&R schedule (module MNR):
--                          what triggers it (after hours, weekend, holiday, emergency,
--                          express, hazmat, peak season, manual), how much (a PERCENT of
--                          labour / material / service / total, or a FLAT amount per
--                          estimate or per line — never both), optional equipment
--                          category / size scope, optional floor / cap, optional
--                          validity window inside the schedule's own validity.       T
--
-- WHY OWN TABLE: tariff.rate_condition is CHECKed to owner_type = 'TOS_RATE' and to
-- TOS axes (cargo category, truck category, DG, OOG, weight), and a deployed CHECK
-- never changes (additive-only rule) — the same reason 80 has its own tier table.
-- Agreement-level facts (party, currency, tax inclusion, validity, versioning,
-- approval) stay on the tariff.schedule header; rows carry no order type,
-- movement, cargo category or payment term (web.mnr.gecko-api CLAUDE.md §4).
--
-- HOW IT IS USED: IContainerRepairRating returns the surcharges that apply with the
-- priced lines; Repair adds each as an estimate line with price_source = 'SURCHARGE'
-- and container_repair_surcharge_id (gecko_repair 12_est), amount in sundry_amount,
-- billed like any other approved line. Which trigger applies (is the work after
-- hours? is the case EXPRESS?) is decided by the rating code, not the database.
--
-- ORDER: run 08_rls_policy.sql (gecko_revenue) after this script. Idempotent.
-- ============================================================

USE gecko_revenue;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF OBJECT_ID('tariff.container_repair_rate') IS NULL
    THROW 50760, '82_repair_surcharge: run 80_repair_tariff.sql first.', 1;
GO

-- @table   tariff.container_repair_surcharge
-- @purpose One M&R surcharge on a schedule: trigger, PERCENT of a base (labour, material, service, total) or FLAT per estimate / per line, optional category / size scope, floor, cap and validity window, and the charge code it is billed under.
-- @vector  UI tariff/surcharges (Surcharge: trigger, amountThb XOR percentage, effectiveFrom/To)
-- @owner   S05 Commercial & Rating
-- @flags   T
-- @phase   Repair P4
IF OBJECT_ID('tariff.container_repair_surcharge') IS NULL
BEGIN
    CREATE TABLE tariff.container_repair_surcharge (
        container_repair_surcharge_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_container_repair_surcharge__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        schedule_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref tariff.schedule (module_code MNR); currency and tax from the header
        line_no                 SMALLINT            NOT NULL,   -- order on the surcharge card
        surcharge_code          VARCHAR(30)         NOT NULL,   -- AFTER_HOURS, WEEKEND_OT, HAZMAT_CLEAN ... (unique on the schedule)
        name                    NVARCHAR(100)       NOT NULL,
        trigger_code            VARCHAR(20)         NOT NULL,   -- PEAK_SEASON, HAZMAT, AFTER_HOURS, WEEKEND, HOLIDAY, EMERGENCY, EXPRESS, MANUAL
        charge_code_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:commercial.charge_code (module MNR)
        charge_code             VARCHAR(15)         NOT NULL,
        equipment_category      VARCHAR(10)         NULL,       -- NULL = any
        size_ft                 VARCHAR(3)          NULL,       -- NULL = any
        calc_method             VARCHAR(10)         NOT NULL,   -- PERCENT, FLAT
        percent_base            VARCHAR(10)         NULL,       -- PERCENT: LABOUR, MATERIAL, SERVICE, TOTAL
        percentage              DECIMAL(9,4)        NULL,       -- PERCENT: 0 < x <= 100
        flat_per                VARCHAR(10)         NULL,       -- FLAT: ESTIMATE, LINE
        flat_amount             DECIMAL(18,4)       NULL,       -- FLAT: in the schedule currency
        min_amount              DECIMAL(18,4)       NULL,       -- floor of one application
        max_amount              DECIMAL(18,4)       NULL,       -- cap of one application
        valid_from              DATE                NULL,       -- inside the schedule validity; NULL = whole schedule
        valid_to                DATE                NULL,       -- inclusive
        is_active               BIT                 NOT NULL CONSTRAINT df_container_repair_surcharge__active DEFAULT 1,
        notes                   NVARCHAR(300)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_surcharge__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_surcharge__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_container_repair_surcharge PRIMARY KEY CLUSTERED (container_repair_surcharge_id),
        CONSTRAINT ck_container_repair_surcharge__line CHECK (line_no >= 1),
        CONSTRAINT ck_container_repair_surcharge__code CHECK (surcharge_code = UPPER(surcharge_code) COLLATE Latin1_General_100_CS_AS AND surcharge_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_container_repair_surcharge__trigger CHECK (trigger_code IN ('PEAK_SEASON','HAZMAT','AFTER_HOURS','WEEKEND','HOLIDAY','EMERGENCY','EXPRESS','MANUAL')),
        CONSTRAINT ck_container_repair_surcharge__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_container_repair_surcharge__size CHECK (size_ft IS NULL OR size_ft IN ('10','20','40','45','48','53')),
        CONSTRAINT ck_container_repair_surcharge__method CHECK (calc_method IN ('PERCENT','FLAT')),
        -- Percentage OR flat amount, never both (UI rule), each with what it needs.
        CONSTRAINT ck_container_repair_surcharge__percent CHECK (calc_method <> 'PERCENT'
            OR (percentage IS NOT NULL AND percentage > 0 AND percentage <= 100
                AND percent_base IS NOT NULL AND percent_base IN ('LABOUR','MATERIAL','SERVICE','TOTAL')
                AND flat_amount IS NULL AND flat_per IS NULL)),
        CONSTRAINT ck_container_repair_surcharge__flat CHECK (calc_method <> 'FLAT'
            OR (flat_amount IS NOT NULL AND flat_amount > 0
                AND flat_per IS NOT NULL AND flat_per IN ('ESTIMATE','LINE')
                AND percentage IS NULL AND percent_base IS NULL)),
        CONSTRAINT ck_container_repair_surcharge__limits CHECK ((min_amount IS NULL OR min_amount >= 0) AND (max_amount IS NULL OR max_amount > 0)
            AND (min_amount IS NULL OR max_amount IS NULL OR max_amount >= min_amount)),
        CONSTRAINT ck_container_repair_surcharge__window CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from),
        -- A seasonal surcharge must say when the season is.
        CONSTRAINT ck_container_repair_surcharge__season CHECK (trigger_code <> 'PEAK_SEASON' OR (valid_from IS NOT NULL AND valid_to IS NOT NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_surcharge__line
        ON tariff.container_repair_surcharge (tenant_id, schedule_id, line_no) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_surcharge__code
        ON tariff.container_repair_surcharge (tenant_id, schedule_id, surcharge_code) WHERE deleted_at IS NULL;
    -- Rating lookup: the active surcharges of a schedule for a trigger.
    CREATE NONCLUSTERED INDEX ix_container_repair_surcharge__rating
        ON tariff.container_repair_surcharge (tenant_id, schedule_id, trigger_code)
        INCLUDE (equipment_category, size_ft, calc_method, valid_from, valid_to) WHERE deleted_at IS NULL AND is_active = 1;
END
GO

-- Temporal: "which surcharge applied on the day this estimate was rated".
IF (SELECT temporal_type FROM sys.tables WHERE object_id = OBJECT_ID('tariff.container_repair_surcharge')) = 0
BEGIN
    ALTER TABLE tariff.container_repair_surcharge ADD
        sys_valid_from DATETIME2(7) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
            CONSTRAINT df_tariff_container_repair_surcharge__sys_valid_from DEFAULT SYSUTCDATETIME(),
        sys_valid_to   DATETIME2(7) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
            CONSTRAINT df_tariff_container_repair_surcharge__sys_valid_to DEFAULT CONVERT(DATETIME2(7), '9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (sys_valid_from, sys_valid_to);
    ALTER TABLE tariff.container_repair_surcharge SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = history.tariff_container_repair_surcharge, DATA_CONSISTENCY_CHECK = ON));
    PRINT '>> tariff.container_repair_surcharge is system-versioned.';
END
GO

IF OBJECT_ID('history.tariff_container_repair_surcharge') IS NULL
    THROW 50761, '82_repair_surcharge: the table or its history is missing.', 1;
GO

EXEC dbo.usp_record_script '82_repair_surcharge.sql', N'Repair P4 follow-up: tariff.container_repair_surcharge (PERCENT of labour / material / service / total XOR FLAT per estimate / line; trigger, category / size scope, floor, cap, window) under tariff.schedule module MNR, temporal. Own table: rate_condition is TOS_RATE only.';
GO

PRINT '>> 82_repair_surcharge.sql completed. Now re-run 08_rls_policy.sql.';
GO
