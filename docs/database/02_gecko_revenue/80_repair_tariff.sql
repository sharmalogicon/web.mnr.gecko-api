-- ============================================================
-- GECKO REVENUE — REPAIR (M&R) TARIFF (Repair P3)
-- Script: 80_repair_tariff.sql
-- Owner:  S05 Commercial & Rating
--
-- The M&R SELL tariff lives in Revenue (decision Q4), under the existing
-- tariff.schedule header with module_code = 'MNR':
--   PUBLIC schedule    = the depot's standard M&R tariff
--   CONTRACT schedule  = one liner's / lessor's agreed tariff (customer party pair)
-- The header already carries what is agreement-level (party, currency, tax
-- inclusion, validity, versioning, approval). The rows below carry ONLY repair
-- pricing axes — no order type, movement, cargo category or payment term
-- (web.mnr.gecko-api CLAUDE.md §4: those are not M&R row fields).
--
--   tariff.container_repair_rate        one price row, by kind:
--                            REPAIR   CEDEX-keyed (component + damage + repair [+ location]):
--                                     labour hours, labour rate override, material price
--                            SERVICE  charge code (survey, wash, PTI, pre-cool, lift ...): price
--                            LABOUR   default labour rate per hour (per trade / time band)
--   tariff.container_repair_rate_tier   dimension / area / quantity bands overriding a row's hours
--                          and prices (e.g. a dent up to 30 cm, 30–60 cm, over 60 cm)
--
-- WHY OWN TIER TABLE: tariff.rate_tier and rate_condition are CHECKed to
-- owner_type = 'TOS_RATE', and a CHECK may never change once deployed
-- (additive-only rule) — the same reason Trucking has trucking_charge_tier.
--
-- Charges handed over for invoicing (billing.container_repair_charge) come with Repair P5.
-- Used by the Repair module only through the Revenue contract IContainerRepairRating.
--
-- MONEY: rates DECIMAL(18,4) (billed amounts DECIMAL(18,2) in billing.*).
-- ORDER: run 08_rls_policy.sql (gecko_revenue) after this script: it adds the
-- new tables to the tenant policy. Idempotent.
-- ============================================================

USE gecko_revenue;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   tariff.container_repair_rate
-- @purpose One M&R sell price on a schedule (module MNR): a CEDEX-keyed repair (labour hours, labour rate, material), a service charge (survey, wash, PTI ...) or a default labour rate, for an equipment category and size, with the limits an estimator may adjust within.
-- @vector  none — new (UI tariff cards / ChargeRow)
-- @owner   S05 Commercial & Rating
-- @flags   T
-- @phase   Repair P3
IF OBJECT_ID('tariff.container_repair_rate') IS NULL
BEGIN
    CREATE TABLE tariff.container_repair_rate (
        container_repair_rate_id             UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_container_repair_rate__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        schedule_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref tariff.schedule (module_code MNR)
        line_no                 SMALLINT            NOT NULL,   -- order on the tariff card
        rate_kind               VARCHAR(10)         NOT NULL,   -- REPAIR, SERVICE, LABOUR
        charge_code_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:commercial.charge_code
        charge_code             VARCHAR(15)         NOT NULL,   -- REPAIR, SURVEYFEE, WASHING, PTI ... (module MNR)
        equipment_category      VARCHAR(10)         NULL,       -- DRY, REEFER, TANK ...; NULL = any
        size_ft                 VARCHAR(3)          NULL,       -- 20, 40, 45 ...; NULL = any
        component_code          VARCHAR(20)         NULL,       -- REPAIR: CEDEX component
        damage_code             VARCHAR(10)         NULL,       -- REPAIR: CEDEX damage; NULL = any damage
        repair_code             VARCHAR(10)         NULL,       -- REPAIR: CEDEX repair
        damage_location_code    VARCHAR(10)         NULL,       -- REPAIR: CEDEX location; NULL = anywhere
        trade_code              VARCHAR(40)         NULL,       -- LABOUR: REPAIR_TRADE code; NULL = any trade
        time_band               VARCHAR(10)         NULL,       -- LABOUR: NORMAL, OT, HOLIDAY
        description             NVARCHAR(200)       NULL,       -- shown on the card and the estimate
        uom_code                VARCHAR(10)         NOT NULL,   -- EA, M, M2, CM, HR, LS (gecko_master uom)
        labour_hours            DECIMAL(9,2)        NULL,       -- REPAIR: hours per unit
        labour_rate             DECIMAL(18,4)       NULL,       -- LABOUR: rate per hour; REPAIR: override of the default labour rate
        material_price          DECIMAL(18,4)       NULL,       -- REPAIR: material per unit
        service_price           DECIMAL(18,4)       NULL,       -- SERVICE: price per unit
        tier_basis              VARCHAR(10)         NULL,       -- LENGTH_CM, AREA_CM2, QUANTITY: bands in tariff.container_repair_rate_tier; NULL = flat
        is_adjustable           BIT                 NOT NULL CONSTRAINT df_container_repair_rate__adjustable DEFAULT 1,   -- estimator may change hours / qty within the limits
        max_hours               DECIMAL(9,2)        NULL,       -- most hours an estimator may enter without override
        max_qty                 DECIMAL(9,2)        NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_rate__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_rate__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_container_repair_rate PRIMARY KEY CLUSTERED (container_repair_rate_id),
        CONSTRAINT ck_container_repair_rate__kind CHECK (rate_kind IN ('REPAIR','SERVICE','LABOUR')),
        CONSTRAINT ck_container_repair_rate__line CHECK (line_no >= 1),
        CONSTRAINT ck_container_repair_rate__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_container_repair_rate__size CHECK (size_ft IS NULL OR size_ft IN ('10','20','40','45','48','53')),
        CONSTRAINT ck_container_repair_rate__band CHECK (time_band IS NULL OR time_band IN ('NORMAL','OT','HOLIDAY')),
        CONSTRAINT ck_container_repair_rate__tier_basis CHECK (tier_basis IS NULL OR tier_basis IN ('LENGTH_CM','AREA_CM2','QUANTITY')),
        -- What each kind needs, and nothing that belongs to another kind.
        CONSTRAINT ck_container_repair_rate__repair CHECK (rate_kind <> 'REPAIR'
            OR (component_code IS NOT NULL AND repair_code IS NOT NULL AND trade_code IS NULL AND time_band IS NULL AND service_price IS NULL
                AND (labour_hours IS NOT NULL OR material_price IS NOT NULL OR tier_basis IS NOT NULL))),
        CONSTRAINT ck_container_repair_rate__service CHECK (rate_kind <> 'SERVICE'
            OR (component_code IS NULL AND damage_code IS NULL AND repair_code IS NULL AND damage_location_code IS NULL
                AND trade_code IS NULL AND time_band IS NULL AND (service_price IS NOT NULL OR tier_basis IS NOT NULL))),
        CONSTRAINT ck_container_repair_rate__labour CHECK (rate_kind <> 'LABOUR'
            OR (labour_rate IS NOT NULL AND time_band IS NOT NULL AND component_code IS NULL AND damage_code IS NULL AND repair_code IS NULL
                AND damage_location_code IS NULL AND material_price IS NULL AND service_price IS NULL AND tier_basis IS NULL)),
        CONSTRAINT ck_container_repair_rate__values CHECK ((labour_hours IS NULL OR labour_hours >= 0) AND (labour_rate IS NULL OR labour_rate >= 0)
            AND (material_price IS NULL OR material_price >= 0) AND (service_price IS NULL OR service_price >= 0)
            AND (max_hours IS NULL OR max_hours > 0) AND (max_qty IS NULL OR max_qty > 0))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_rate__line
        ON tariff.container_repair_rate (tenant_id, schedule_id, line_no) WHERE deleted_at IS NULL;
    -- One price per combination of axes on a schedule (NULLs compare equal = "any").
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_rate__axes
        ON tariff.container_repair_rate (tenant_id, schedule_id, rate_kind, charge_code, equipment_category, size_ft,
                            component_code, damage_code, repair_code, damage_location_code, trade_code, time_band, uom_code)
        WHERE deleted_at IS NULL;
    -- Rating lookup: a CEDEX line on a schedule.
    CREATE NONCLUSTERED INDEX ix_container_repair_rate__rating
        ON tariff.container_repair_rate (tenant_id, schedule_id, component_code, repair_code) INCLUDE (damage_code, equipment_category, size_ft, uom_code)
        WHERE deleted_at IS NULL;
END
GO

-- @table   tariff.container_repair_rate_tier
-- @purpose One band of an M&R rate: from / to a damage length, area or quantity, with the hours and prices that replace the row's own in that band.
-- @vector  none — new
-- @owner   S05 Commercial & Rating
-- @flags   T
-- @phase   Repair P3
IF OBJECT_ID('tariff.container_repair_rate_tier') IS NULL
BEGIN
    CREATE TABLE tariff.container_repair_rate_tier (
        container_repair_rate_tier_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_container_repair_rate_tier__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        container_repair_rate_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref tariff.container_repair_rate (its tier_basis says what from / to measure)
        from_value              DECIMAL(12,2)       NOT NULL,   -- inclusive
        to_value                DECIMAL(12,2)       NULL,       -- exclusive; NULL = no upper end
        labour_hours            DECIMAL(9,2)        NULL,
        material_price          DECIMAL(18,4)       NULL,
        service_price           DECIMAL(18,4)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_rate_tier__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_rate_tier__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_container_repair_rate_tier PRIMARY KEY CLUSTERED (container_repair_rate_tier_id),
        CONSTRAINT ck_container_repair_rate_tier__range CHECK (from_value >= 0 AND (to_value IS NULL OR to_value > from_value)),
        CONSTRAINT ck_container_repair_rate_tier__something CHECK (labour_hours IS NOT NULL OR material_price IS NOT NULL OR service_price IS NOT NULL),
        CONSTRAINT ck_container_repair_rate_tier__values CHECK ((labour_hours IS NULL OR labour_hours >= 0) AND (material_price IS NULL OR material_price >= 0)
            AND (service_price IS NULL OR service_price >= 0))
    );
    -- Overlapping bands are refused by Revenue; this stops two bands starting at the same value.
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_rate_tier__from
        ON tariff.container_repair_rate_tier (tenant_id, container_repair_rate_id, from_value) WHERE deleted_at IS NULL;
END
GO

-- Temporal: "what was the price on the day this estimate was rated" must be answerable.
IF (SELECT temporal_type FROM sys.tables WHERE object_id = OBJECT_ID('tariff.container_repair_rate')) = 0
BEGIN
    ALTER TABLE tariff.container_repair_rate ADD
        sys_valid_from DATETIME2(7) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
            CONSTRAINT df_tariff_container_repair_rate__sys_valid_from DEFAULT SYSUTCDATETIME(),
        sys_valid_to   DATETIME2(7) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
            CONSTRAINT df_tariff_container_repair_rate__sys_valid_to DEFAULT CONVERT(DATETIME2(7), '9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (sys_valid_from, sys_valid_to);
    ALTER TABLE tariff.container_repair_rate SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = history.tariff_container_repair_rate, DATA_CONSISTENCY_CHECK = ON));
    PRINT '>> tariff.container_repair_rate is system-versioned.';
END
GO
IF (SELECT temporal_type FROM sys.tables WHERE object_id = OBJECT_ID('tariff.container_repair_rate_tier')) = 0
BEGIN
    ALTER TABLE tariff.container_repair_rate_tier ADD
        sys_valid_from DATETIME2(7) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
            CONSTRAINT df_tariff_container_repair_rate_tier__sys_valid_from DEFAULT SYSUTCDATETIME(),
        sys_valid_to   DATETIME2(7) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
            CONSTRAINT df_tariff_container_repair_rate_tier__sys_valid_to DEFAULT CONVERT(DATETIME2(7), '9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (sys_valid_from, sys_valid_to);
    ALTER TABLE tariff.container_repair_rate_tier SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = history.tariff_container_repair_rate_tier, DATA_CONSISTENCY_CHECK = ON));
    PRINT '>> tariff.container_repair_rate_tier is system-versioned.';
END
GO

EXEC dbo.usp_record_script '80_repair_tariff.sql', N'Repair P3: tariff.container_repair_rate (REPAIR CEDEX-keyed / SERVICE / LABOUR rows under tariff.schedule module MNR, no TOS shipping axes) + tariff.container_repair_rate_tier (length / area / quantity bands), temporal';
GO

IF OBJECT_ID('history.tariff_container_repair_rate') IS NULL OR OBJECT_ID('history.tariff_container_repair_rate_tier') IS NULL
    THROW 50750, '80_repair_tariff: a table or its history is missing.', 1;
GO
PRINT '>> 80_repair_tariff.sql completed.';
GO
