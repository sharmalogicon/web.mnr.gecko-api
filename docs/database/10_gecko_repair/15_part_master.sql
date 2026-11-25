-- ============================================================
-- GECKO REPAIR (M&R) — MATERIALS AND STORES (P7, part 1 of 2)
-- Script: 15_part_master.sql
--
-- Parts stock control is in the first release (decision Q9). Part 1 is the
-- master data; part 2 (16_part_stock.sql) is the ledger, balances, reservations,
-- purchasing, receipts and stock documents.
--
--   part.material           an M&R material / part (steel sheet, plywood, paint, gasket, refrigerant ...)
--   part.material_uom       pack conversions to the base unit (box of 50, drum of 20 L ...)
--   part.material_supplier  supplier prices and part numbers
--   part.store              a parts store at a depot (branch)
--   part.bin                bin locations in a store
--   part.material_store     reorder point / quantity / max per material and store
--
-- Shapes follow gecko_fleet inv.* (Fleet P4), so the costing code (weighted
-- moving average, setting COSTING_METHOD = WMA) is one implementation.
-- Suppliers are parties in gecko_master (supplier extension, Fleet 51).
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   part.material
-- @purpose One M&R material or part: code, name, category, base unit, the CEDEX component it is used on, standard cost, preferred supplier, and whether stock is tracked.
-- @vector  none — new (UI Part)
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.material') IS NULL
BEGIN
    CREATE TABLE part.material (
        material_id             UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_material__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        material_code           VARCHAR(30)         NOT NULL,   -- e.g. STL-CORTEN-2MM, PLY-28MM, GSK-DOOR-40
        name_en                 NVARCHAR(200)       NOT NULL,
        name_local              NVARCHAR(200)       NULL,
        material_category_code  VARCHAR(40)         NOT NULL,   -- MATERIAL_CATEGORY code list (gecko_master)
        base_uom_code           VARCHAR(10)         NOT NULL,   -- unit stock is counted in: EA, M, M2, KG, L
        cedex_component_code    VARCHAR(20)         NULL,       -- component it is normally used on (estimate line suggestion)
        standard_cost           DECIMAL(18,4)       NULL,       -- planning cost per base unit (stock is valued at moving average)
        currency_code           CHAR(3)             NULL,       -- currency of standard_cost
        preferred_supplier_party_id   UNIQUEIDENTIFIER NULL,    -- ref gecko_master:party.party
        preferred_supplier_party_code VARCHAR(20)      NULL,
        is_stock_tracked        BIT                 NOT NULL CONSTRAINT df_material__tracked DEFAULT 1,   -- 0 = consumable charged directly, no stock ledger
        is_active               BIT                 NOT NULL CONSTRAINT df_material__is_active DEFAULT 1,
        legacy_ref              VARCHAR(80)         NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_material PRIMARY KEY CLUSTERED (material_id),
        CONSTRAINT ck_material__code CHECK (material_code = UPPER(material_code) COLLATE Latin1_General_100_CS_AS AND material_code NOT LIKE '%[^A-Z0-9_.-]%'),
        CONSTRAINT ck_material__cost CHECK ((standard_cost IS NULL AND currency_code IS NULL) OR (standard_cost >= 0 AND currency_code LIKE '[A-Z][A-Z][A-Z]')),
        CONSTRAINT ck_material__supplier_pair CHECK ((preferred_supplier_party_id IS NULL AND preferred_supplier_party_code IS NULL)
            OR (preferred_supplier_party_id IS NOT NULL AND preferred_supplier_party_code IS NOT NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_material__code
        ON part.material (tenant_id, material_code) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_material__category
        ON part.material (tenant_id, material_category_code) INCLUDE (material_code, name_en) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'material';
END
GO

-- @table   part.material_uom
-- @purpose One pack unit a material is bought or issued in, and how many base units it holds (box of 50 rivets, 20 L drum, sheet of 2.44 m2).
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.material_uom') IS NULL
BEGIN
    CREATE TABLE part.material_uom (
        material_uom_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_material_uom__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        uom_code                VARCHAR(10)         NOT NULL,   -- BOX, DRUM, SHEET, ROLL ...
        factor_to_base          DECIMAL(18,6)       NOT NULL,   -- base units in one of this unit
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material_uom__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material_uom__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_material_uom PRIMARY KEY CLUSTERED (material_uom_id),
        CONSTRAINT ck_material_uom__factor CHECK (factor_to_base > 0)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_material_uom__uom
        ON part.material_uom (tenant_id, material_id, uom_code) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'material_uom';
END
GO

-- @table   part.material_supplier
-- @purpose One supplier's offer for a material: their part number, price per unit, currency, lead time, minimum order and validity.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.material_supplier') IS NULL
BEGIN
    CREATE TABLE part.material_supplier (
        material_supplier_id    UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_material_supplier__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        supplier_party_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        supplier_party_code     VARCHAR(20)         NOT NULL,
        supplier_part_no        NVARCHAR(60)        NULL,
        uom_code                VARCHAR(10)         NOT NULL,   -- unit the price is per (base or a pack unit)
        unit_price              DECIMAL(18,4)       NOT NULL,
        currency_code           CHAR(3)             NOT NULL,
        lead_days               SMALLINT            NULL,
        min_order_qty           DECIMAL(18,4)       NULL,
        valid_from              DATE                NOT NULL,
        valid_to                DATE                NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material_supplier__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material_supplier__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_material_supplier PRIMARY KEY CLUSTERED (material_supplier_id),
        CONSTRAINT ck_material_supplier__price CHECK (unit_price >= 0 AND currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_material_supplier__lead CHECK ((lead_days IS NULL OR lead_days >= 0) AND (min_order_qty IS NULL OR min_order_qty > 0)),
        CONSTRAINT ck_material_supplier__dates CHECK (valid_to IS NULL OR valid_to >= valid_from)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_material_supplier__offer
        ON part.material_supplier (tenant_id, material_id, supplier_party_id, uom_code, valid_from) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'material_supplier';
END
GO

-- @table   part.store
-- @purpose One parts store at a depot (branch): code, name, and whether it is the depot's default store for issues to work orders.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.store') IS NULL
BEGIN
    CREATE TABLE part.store (
        store_id                UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_store__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- the depot
        store_code              VARCHAR(20)         NOT NULL,
        name                    NVARCHAR(100)       NOT NULL,
        is_default              BIT                 NOT NULL CONSTRAINT df_store__default DEFAULT 0,
        is_active               BIT                 NOT NULL CONSTRAINT df_store__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_store__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_store__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_store PRIMARY KEY CLUSTERED (store_id),
        CONSTRAINT ck_store__code CHECK (store_code = UPPER(store_code) COLLATE Latin1_General_100_CS_AS AND store_code NOT LIKE '%[^A-Z0-9_-]%')
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_store__code
        ON part.store (tenant_id, store_code) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_store__default
        ON part.store (tenant_id, branch_id) WHERE is_default = 1 AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'store';
END
GO

-- @table   part.bin
-- @purpose One bin location in a parts store (rack / shelf / bin code).
-- @vector  none — new (UI: bin location not modelled)
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.bin') IS NULL
BEGIN
    CREATE TABLE part.bin (
        bin_id                  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_bin__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store
        bin_code                VARCHAR(20)         NOT NULL,   -- e.g. A-01-03
        description             NVARCHAR(100)       NULL,
        is_active               BIT                 NOT NULL CONSTRAINT df_bin__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_bin__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_bin__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_bin PRIMARY KEY CLUSTERED (bin_id),
        CONSTRAINT ck_bin__code CHECK (bin_code = UPPER(bin_code) COLLATE Latin1_General_100_CS_AS AND bin_code NOT LIKE '%[^A-Z0-9_./-]%')
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_bin__code
        ON part.bin (tenant_id, store_id, bin_code) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'bin';
END
GO

-- @table   part.material_store
-- @purpose Stocking rule for one material in one store: reorder point, reorder quantity, maximum, and the default bin.
-- @vector  none — new (UI frontend reorder rule)
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.material_store') IS NULL
BEGIN
    CREATE TABLE part.material_store (
        material_store_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_material_store__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store
        default_bin_id          UNIQUEIDENTIFIER    NULL,       -- ref part.bin
        reorder_point           DECIMAL(18,4)       NULL,       -- base units: at or below this, propose a PO
        reorder_qty             DECIMAL(18,4)       NULL,
        max_qty                 DECIMAL(18,4)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material_store__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_material_store__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_material_store PRIMARY KEY CLUSTERED (material_store_id),
        CONSTRAINT ck_material_store__values CHECK ((reorder_point IS NULL OR reorder_point >= 0) AND (reorder_qty IS NULL OR reorder_qty > 0)
            AND (max_qty IS NULL OR max_qty > 0) AND (max_qty IS NULL OR reorder_point IS NULL OR max_qty >= reorder_point))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_material_store__key
        ON part.material_store (tenant_id, material_id, store_id) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'material_store';
END
GO

EXEC dbo.usp_record_script '15_part_master.sql', N'part (master): material, material_uom, material_supplier, store, bin, material_store — temporal';
GO

PRINT '>> 15_part_master.sql completed.';
GO
