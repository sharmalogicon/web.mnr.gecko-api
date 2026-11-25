-- ============================================================
-- GECKO REPAIR (M&R) — VENDOR COST CARDS, VENDOR BILLS, MODIFICATIONS, INCIDENTS (doc 03 P10)
-- Script: 19_vend_mods_incident.sql
--
--   vend.vendor_rate_card    vendor cost card (REPAIR_VRC) per vendor party: depot,
--                            currency, validity, payment terms, approval            T
--   vend.vendor_rate_line    one cost row: same row key as the sell tariff (category,
--                            size, CEDEX component / damage / repair, uom) or a
--                            service charge code; labour hours, cost rate, material  T
--   vend.vendor_bill         vendor / subcontractor bill (REPAIR_VBL): vendor invoice
--                            no., subtotal + tax = total, match state, approval,
--                            accounting export (CSV now, SAP B1 later)               T
--   vend.vendor_bill_line    one billed amount matched to a work.wo_sublet or a
--                            part.goods_receipt_line: expected vs billed, variance  T
--   mods.modification        container modification (REPAIR_MOD) with class review:
--                            PROPOSED -> CLASS_REVIEW -> APPROVED -> IN_PROGRESS ->
--                            COMPLETED -> CERTIFIED                                  T
--   incident.incident        emergency / incident (REPAIR_EMG): type, severity,
--                            OPEN -> ON_SITE -> CONTAINED -> CLOSED, call-out charge T
--   incident.incident_update timeline entry: notes, status / severity changes,
--                            responders                                              A
--
-- COST vs SELL: vend.* is the COST side only (what the depot pays a vendor). It
-- prices work.wo_sublet (vendor_rate_line_id) and feeds margin; it is never
-- billed. The SELL side is the gecko_revenue tariff (module MNR). Fleet's own
-- repair_rate_card in gecko_revenue is not touched. Rate rows carry repair
-- pricing keys only: no TOS shipping fields (order type, movement, cargo,
-- payment term) — payment term / credit days are card-level vendor terms.
--
-- VENDOR BILL MATCH: each bill line is matched to the sublet or receipt it pays.
-- expected_amount comes from wo_sublet.actual_cost (or the receipt line value);
-- variance = billed - expected. Within config.repair_setting
-- VENDOR_BILL_MATCH_TOLERANCE_PCT the line is WITHIN_TOLERANCE and the bill may
-- be approved by the system; outside it, the bill needs a person through
-- config.approval_policy document type VENDOR_BILL. The module mirrors the
-- result onto work.wo_sublet.vendor_bill_id / bill_match_status. A cancelled
-- bill has its lines soft-deleted so the sublet can be billed again.
--
-- MODIFICATION reuses the estimate engine (est.estimate estimate_kind =
-- MODIFICATION) and work orders (work.work_order wo_kind = MODIFICATION).
--
-- Rules the database cannot see across tables (line totals = header subtotal,
-- sublet belongs to the same vendor, estimate approved before modification
-- APPROVED, critical incident notifies the depot manager) are Repair module
-- rules. Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   vend.vendor_rate_card
-- @purpose Vendor cost card (REPAIR_VRC) for one vendor party, for every depot or one depot: currency, validity window, vendor quotation reference, payment term and credit days, approval and status DRAFT -> PENDING_APPROVAL -> APPROVED -> EXPIRED (or CANCELLED).
-- @vector  none — new (UI VendorTariffCard, /tariff/vendor)
-- @owner   R11 Repair Tariff (cost side)
-- @flags   T
-- @phase   10
IF OBJECT_ID('vend.vendor_rate_card') IS NULL
BEGIN
    CREATE TABLE vend.vendor_rate_card (
        vendor_rate_card_id     UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_vendor_rate_card__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,       -- NULL = every depot of the tenant; set = this depot only
        card_no                 VARCHAR(30)         NOT NULL,   -- REPAIR_VRC series
        card_name               NVARCHAR(150)       NOT NULL,
        vendor_party_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party (vendor / subcontractor)
        vendor_party_code       VARCHAR(20)         NOT NULL,
        vendor_quote_ref        VARCHAR(60)         NULL,       -- vendor's quotation number
        currency_code           CHAR(3)             NOT NULL,
        prices_include_tax      BIT                 NOT NULL CONSTRAINT df_vendor_rate_card__incl_tax DEFAULT 0,
        effective_from          DATE                NOT NULL,
        effective_to            DATE                NULL,       -- NULL = open-ended
        payment_term_code       VARCHAR(20)         NULL,       -- vendor terms (card level, never on rate rows)
        credit_days             SMALLINT            NULL,
        status                  VARCHAR(20)         NOT NULL CONSTRAINT df_vendor_rate_card__status DEFAULT 'DRAFT',   -- DRAFT, PENDING_APPROVAL, APPROVED, EXPIRED, CANCELLED
        approved_at             DATETIMEOFFSET(7)   NULL,
        approved_by             UNIQUEIDENTIFIER    NULL,
        cancel_reason           NVARCHAR(300)       NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_rate_card__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_rate_card__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_vendor_rate_card PRIMARY KEY CLUSTERED (vendor_rate_card_id),
        CONSTRAINT ck_vendor_rate_card__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_vendor_rate_card__dates CHECK (effective_to IS NULL OR effective_to >= effective_from),
        CONSTRAINT ck_vendor_rate_card__credit_days CHECK (credit_days IS NULL OR credit_days BETWEEN 0 AND 365),
        CONSTRAINT ck_vendor_rate_card__status CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','EXPIRED','CANCELLED')),
        -- A card prices sublets only once approved; an expired card was approved before.
        CONSTRAINT ck_vendor_rate_card__approved CHECK ((status IN ('APPROVED','EXPIRED') AND approved_at IS NOT NULL AND approved_by IS NOT NULL)
            OR (status IN ('DRAFT','PENDING_APPROVAL') AND approved_at IS NULL)
            OR status = 'CANCELLED'),
        CONSTRAINT ck_vendor_rate_card__approval_pair CHECK ((approved_at IS NULL AND approved_by IS NULL) OR (approved_at IS NOT NULL AND approved_by IS NOT NULL)),
        CONSTRAINT ck_vendor_rate_card__cancel CHECK ((status = 'CANCELLED' AND cancel_reason IS NOT NULL) OR (status <> 'CANCELLED' AND cancel_reason IS NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_rate_card__no
        ON vend.vendor_rate_card (tenant_id, card_no) WHERE deleted_at IS NULL;
    -- One approved card per vendor, depot scope and start date (overlap of windows is a module check).
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_rate_card__approved_start
        ON vend.vendor_rate_card (tenant_id, vendor_party_id, branch_id, effective_from) WHERE status = 'APPROVED' AND deleted_at IS NULL;
    -- "Which card prices this sublet": vendor + date lookup.
    CREATE NONCLUSTERED INDEX ix_vendor_rate_card__vendor
        ON vend.vendor_rate_card (tenant_id, vendor_party_id, status, effective_from) INCLUDE (branch_id, effective_to, currency_code, card_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'vend', @table = 'vendor_rate_card';
END
GO

-- @table   vend.vendor_rate_line
-- @purpose One cost row on a vendor card: either a REPAIR row keyed like the sell tariff (equipment category, size, CEDEX component / damage / repair code, uom) or a SERVICE row by charge code; cost labour hours x cost rate + material cost = unit cost, with optional dimension / quantity tiers as JSON.
-- @vector  none — new (UI ChargeRow on the vendor card)
-- @owner   R11 Repair Tariff (cost side)
-- @flags   T
-- @phase   10
IF OBJECT_ID('vend.vendor_rate_line') IS NULL
BEGIN
    CREATE TABLE vend.vendor_rate_line (
        vendor_rate_line_id     UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_vendor_rate_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        vendor_rate_card_id     UNIQUEIDENTIFIER    NOT NULL,   -- ref vend.vendor_rate_card
        line_no                 SMALLINT            NOT NULL,
        line_kind               VARCHAR(10)         NOT NULL CONSTRAINT df_vendor_rate_line__kind DEFAULT 'REPAIR',   -- REPAIR (CEDEX row), SERVICE (charge code)
        equipment_category      VARCHAR(10)         NULL,       -- DRY, REEFER, TANK ... NULL = any
        size_ft                 VARCHAR(3)          NULL,       -- 20, 40, 45 ... NULL = any
        component_code          VARCHAR(20)         NULL,       -- CEDEX (gecko_master)
        damage_code             VARCHAR(10)         NULL,
        repair_code             VARCHAR(10)         NULL,
        service_charge_code     VARCHAR(20)         NULL,       -- gecko_master charge code (WASHING, PTI, TOWING ...)
        description             NVARCHAR(300)       NULL,
        uom_code                VARCHAR(10)         NOT NULL CONSTRAINT df_vendor_rate_line__uom DEFAULT 'EA',   -- EA, M, M2, CM, HR, LS
        labour_hours            DECIMAL(9,2)        NOT NULL CONSTRAINT df_vendor_rate_line__hours DEFAULT 0,
        labour_cost_rate        DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_rate_line__rate DEFAULT 0,   -- per hour, card currency
        material_cost           DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_rate_line__material DEFAULT 0,
        unit_cost               DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_rate_line__unit_cost DEFAULT 0,   -- ROUND(hours x rate, 4) + material
        tiers_json              NVARCHAR(4000)      NULL,       -- [{"fromQty":0,"toQty":1,"unitCost":..}] or LENGTH_CM / AREA_CM2 bands
        is_active               BIT                 NOT NULL CONSTRAINT df_vendor_rate_line__active DEFAULT 1,
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_rate_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_rate_line__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_vendor_rate_line PRIMARY KEY CLUSTERED (vendor_rate_line_id),
        CONSTRAINT ck_vendor_rate_line__line_no CHECK (line_no >= 1),
        CONSTRAINT ck_vendor_rate_line__kind CHECK (line_kind IN ('REPAIR','SERVICE')),
        -- A repair row is a CEDEX repair (or a described one); a service row is a charge code and nothing CEDEX.
        CONSTRAINT ck_vendor_rate_line__repair CHECK (line_kind <> 'REPAIR'
            OR (service_charge_code IS NULL AND (repair_code IS NOT NULL OR description IS NOT NULL))),
        CONSTRAINT ck_vendor_rate_line__service CHECK (line_kind <> 'SERVICE'
            OR (service_charge_code IS NOT NULL AND component_code IS NULL AND damage_code IS NULL AND repair_code IS NULL)),
        CONSTRAINT ck_vendor_rate_line__values CHECK (labour_hours >= 0 AND labour_cost_rate >= 0 AND material_cost >= 0),
        CONSTRAINT ck_vendor_rate_line__unit_cost CHECK (unit_cost = ROUND(labour_hours * labour_cost_rate, 4) + material_cost),
        CONSTRAINT ck_vendor_rate_line__tiers CHECK (tiers_json IS NULL OR ISJSON(tiers_json) = 1)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_rate_line__line_no
        ON vend.vendor_rate_line (tenant_id, vendor_rate_card_id, line_no) WHERE deleted_at IS NULL;
    -- One live row per row key on a card (NULL "any" values compare equal in a unique index).
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_rate_line__row_key
        ON vend.vendor_rate_line (tenant_id, vendor_rate_card_id, line_kind, equipment_category, size_ft, component_code, damage_code, repair_code, service_charge_code, uom_code)
        WHERE is_active = 1 AND deleted_at IS NULL;
    -- Cost lookup by repair code across cards (margin / simulator).
    CREATE NONCLUSTERED INDEX ix_vendor_rate_line__repair
        ON vend.vendor_rate_line (tenant_id, repair_code, component_code) INCLUDE (vendor_rate_card_id, unit_cost, uom_code) WHERE repair_code IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'vend', @table = 'vendor_rate_line';
END
GO

-- @table   vend.vendor_bill
-- @purpose One supplier / subcontractor bill (REPAIR_VBL): vendor, vendor invoice number and date (unique per vendor), currency, subtotal + tax = total, expected amount and variance from the matched lines, match state, approval (VENDOR_BILL policy when outside tolerance), dispute and the accounting export batch.
-- @vector  none — new
-- @owner   R6 Repair Work Orders / R10 Parts & Stock (shared vendor bill record)
-- @flags   T
-- @phase   10
IF OBJECT_ID('vend.vendor_bill') IS NULL
BEGIN
    CREATE TABLE vend.vendor_bill (
        vendor_bill_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_vendor_bill__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        bill_no                 VARCHAR(30)         NOT NULL,   -- REPAIR_VBL series
        vendor_party_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        vendor_party_code       VARCHAR(20)         NOT NULL,
        vendor_invoice_no       VARCHAR(60)         NOT NULL,   -- the vendor's own invoice number
        vendor_invoice_date     DATE                NOT NULL,
        received_date           DATE                NOT NULL,
        due_date                DATE                NULL,
        currency_code           CHAR(3)             NOT NULL,
        subtotal_amount         DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_bill__subtotal DEFAULT 0,   -- sum of line billed_amount
        tax_amount              DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_bill__tax DEFAULT 0,
        total_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_bill__total DEFAULT 0,      -- subtotal + tax
        expected_amount         DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_bill__expected DEFAULT 0,   -- sum of line expected_amount
        variance_amount         DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_bill__variance DEFAULT 0,   -- subtotal - expected
        tolerance_pct           DECIMAL(9,4)        NULL,       -- VENDOR_BILL_MATCH_TOLERANCE_PCT used at match time
        match_status            VARCHAR(10)         NOT NULL CONSTRAINT df_vendor_bill__match DEFAULT 'PENDING',   -- PENDING, MATCHED (all within tolerance), VARIANCE, DISPUTED
        dispute_reason          NVARCHAR(500)       NULL,
        status                  VARCHAR(20)         NOT NULL CONSTRAINT df_vendor_bill__status DEFAULT 'DRAFT',   -- DRAFT, PENDING_APPROVAL, APPROVED, EXPORTED, CANCELLED
        approved_at             DATETIMEOFFSET(7)   NULL,
        approved_by             UNIQUEIDENTIFIER    NULL,       -- NULL only for a MATCHED bill approved by the system
        export_batch_ref        VARCHAR(60)         NULL,       -- CSV batch now, SAP B1 document later
        exported_at             DATETIMEOFFSET(7)   NULL,
        cancel_reason           NVARCHAR(300)       NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_bill__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_bill__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_vendor_bill PRIMARY KEY CLUSTERED (vendor_bill_id),
        CONSTRAINT ck_vendor_bill__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_vendor_bill__dates CHECK (received_date >= vendor_invoice_date AND (due_date IS NULL OR due_date >= vendor_invoice_date)),
        CONSTRAINT ck_vendor_bill__amounts CHECK (subtotal_amount >= 0 AND tax_amount >= 0 AND expected_amount >= 0),
        CONSTRAINT ck_vendor_bill__total CHECK (total_amount = subtotal_amount + tax_amount),
        CONSTRAINT ck_vendor_bill__variance CHECK (variance_amount = subtotal_amount - expected_amount),
        CONSTRAINT ck_vendor_bill__tolerance CHECK (tolerance_pct IS NULL OR tolerance_pct BETWEEN 0 AND 100),
        CONSTRAINT ck_vendor_bill__match CHECK (match_status IN ('PENDING','MATCHED','VARIANCE','DISPUTED')),
        CONSTRAINT ck_vendor_bill__matched_tolerance CHECK (match_status = 'PENDING' OR tolerance_pct IS NOT NULL),
        CONSTRAINT ck_vendor_bill__dispute CHECK ((match_status = 'DISPUTED' AND dispute_reason IS NOT NULL) OR (match_status <> 'DISPUTED' AND dispute_reason IS NULL)),
        CONSTRAINT ck_vendor_bill__status CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','EXPORTED','CANCELLED')),
        -- Approval needs a finished match; a VARIANCE bill needs a person (VENDOR_BILL policy).
        CONSTRAINT ck_vendor_bill__approved CHECK (status NOT IN ('APPROVED','EXPORTED')
            OR (approved_at IS NOT NULL AND match_status IN ('MATCHED','VARIANCE')
                AND (match_status = 'MATCHED' OR approved_by IS NOT NULL))),
        CONSTRAINT ck_vendor_bill__not_approved CHECK (status IN ('APPROVED','EXPORTED','CANCELLED') OR approved_at IS NULL),
        CONSTRAINT ck_vendor_bill__approver CHECK (approved_by IS NULL OR approved_at IS NOT NULL),
        CONSTRAINT ck_vendor_bill__exported CHECK ((status = 'EXPORTED' AND exported_at IS NOT NULL AND export_batch_ref IS NOT NULL)
            OR (status <> 'EXPORTED' AND exported_at IS NULL)),
        CONSTRAINT ck_vendor_bill__cancel CHECK ((status = 'CANCELLED' AND cancel_reason IS NOT NULL) OR (status <> 'CANCELLED' AND cancel_reason IS NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_bill__no
        ON vend.vendor_bill (tenant_id, bill_no) WHERE deleted_at IS NULL;
    -- A vendor's invoice is recorded once (a cancelled entry may be re-keyed).
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_bill__vendor_invoice
        ON vend.vendor_bill (tenant_id, vendor_party_id, vendor_invoice_no) WHERE status IN ('DRAFT','PENDING_APPROVAL','APPROVED','EXPORTED') AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_vendor_bill__list
        ON vend.vendor_bill (tenant_id, branch_id, status, vendor_invoice_date) INCLUDE (bill_no, vendor_party_code, total_amount, match_status) WHERE deleted_at IS NULL;
    -- Export worker: approved, not yet exported.
    CREATE NONCLUSTERED INDEX ix_vendor_bill__to_export
        ON vend.vendor_bill (tenant_id, approved_at) INCLUDE (bill_no, total_amount, currency_code) WHERE status = 'APPROVED' AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'vend', @table = 'vendor_bill';
END
GO

-- @table   vend.vendor_bill_line
-- @purpose One billed amount on a vendor bill, matched to what it pays: a work.wo_sublet (subcontract) or a part.goods_receipt_line (supplier goods), or OTHER (unmatched, always needs approval); expected vs billed amount, variance and tolerance status.
-- @vector  none — new
-- @owner   R6 Repair Work Orders / R10 Parts & Stock
-- @flags   T
-- @phase   10
IF OBJECT_ID('vend.vendor_bill_line') IS NULL
BEGIN
    CREATE TABLE vend.vendor_bill_line (
        vendor_bill_line_id     UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_vendor_bill_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        vendor_bill_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref vend.vendor_bill
        line_no                 SMALLINT            NOT NULL,
        source_kind             VARCHAR(15)         NOT NULL,   -- SUBLET, GOODS_RECEIPT, OTHER
        wo_sublet_id            UNIQUEIDENTIFIER    NULL,       -- ref work.wo_sublet (SUBLET)
        work_order_id           UNIQUEIDENTIFIER    NULL,       -- ref work.work_order of that sublet
        wo_no                   VARCHAR(30)         NULL,       -- copy for the bill view / export
        goods_receipt_line_id   UNIQUEIDENTIFIER    NULL,       -- ref part.goods_receipt_line (GOODS_RECEIPT)
        goods_receipt_id        UNIQUEIDENTIFIER    NULL,       -- ref part.goods_receipt
        grn_no                  VARCHAR(30)         NULL,
        description             NVARCHAR(500)       NOT NULL,
        quantity                DECIMAL(18,4)       NOT NULL CONSTRAINT df_vendor_bill_line__qty DEFAULT 1,
        expected_amount         DECIMAL(18,4)       NULL,       -- sublet actual cost / receipt value; NULL for OTHER
        billed_amount           DECIMAL(18,4)       NOT NULL,   -- net of tax, bill currency
        variance_amount         DECIMAL(18,4)       NULL,       -- billed - expected
        tolerance_status        VARCHAR(16)         NOT NULL CONSTRAINT df_vendor_bill_line__tolerance DEFAULT 'PENDING',   -- PENDING, MATCHED, WITHIN_TOLERANCE, OVER_TOLERANCE, DISPUTED, NO_SOURCE
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_bill_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_vendor_bill_line__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_vendor_bill_line PRIMARY KEY CLUSTERED (vendor_bill_line_id),
        CONSTRAINT ck_vendor_bill_line__line_no CHECK (line_no >= 1),
        CONSTRAINT ck_vendor_bill_line__source CHECK (source_kind IN ('SUBLET','GOODS_RECEIPT','OTHER')),
        CONSTRAINT ck_vendor_bill_line__wo_pair CHECK ((work_order_id IS NULL AND wo_no IS NULL) OR (work_order_id IS NOT NULL AND wo_no IS NOT NULL)),
        CONSTRAINT ck_vendor_bill_line__grn_pair CHECK ((goods_receipt_id IS NULL AND grn_no IS NULL) OR (goods_receipt_id IS NOT NULL AND grn_no IS NOT NULL)),
        -- Each source kind carries exactly its own reference.
        CONSTRAINT ck_vendor_bill_line__sublet CHECK ((source_kind = 'SUBLET' AND wo_sublet_id IS NOT NULL AND work_order_id IS NOT NULL)
            OR (source_kind <> 'SUBLET' AND wo_sublet_id IS NULL AND work_order_id IS NULL)),
        CONSTRAINT ck_vendor_bill_line__receipt CHECK ((source_kind = 'GOODS_RECEIPT' AND goods_receipt_line_id IS NOT NULL AND goods_receipt_id IS NOT NULL)
            OR (source_kind <> 'GOODS_RECEIPT' AND goods_receipt_line_id IS NULL AND goods_receipt_id IS NULL)),
        CONSTRAINT ck_vendor_bill_line__values CHECK (quantity > 0 AND billed_amount >= 0 AND (expected_amount IS NULL OR expected_amount >= 0)),
        CONSTRAINT ck_vendor_bill_line__expected CHECK ((source_kind = 'OTHER' AND expected_amount IS NULL) OR (source_kind <> 'OTHER' AND expected_amount IS NOT NULL)),
        CONSTRAINT ck_vendor_bill_line__variance CHECK ((expected_amount IS NULL AND variance_amount IS NULL)
            OR (expected_amount IS NOT NULL AND variance_amount = billed_amount - expected_amount)),
        CONSTRAINT ck_vendor_bill_line__tolerance CHECK (tolerance_status IN ('PENDING','MATCHED','WITHIN_TOLERANCE','OVER_TOLERANCE','DISPUTED','NO_SOURCE')),
        CONSTRAINT ck_vendor_bill_line__no_source CHECK ((source_kind = 'OTHER' AND tolerance_status IN ('NO_SOURCE','DISPUTED'))
            OR (source_kind <> 'OTHER' AND tolerance_status <> 'NO_SOURCE')),
        CONSTRAINT ck_vendor_bill_line__matched CHECK (tolerance_status <> 'MATCHED' OR (variance_amount IS NOT NULL AND variance_amount = 0))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_bill_line__line_no
        ON vend.vendor_bill_line (tenant_id, vendor_bill_id, line_no) WHERE deleted_at IS NULL;
    -- A sublet is paid once: one live bill line per sublet (cancelled bills soft-delete their lines).
    CREATE UNIQUE NONCLUSTERED INDEX uq_vendor_bill_line__sublet
        ON vend.vendor_bill_line (tenant_id, wo_sublet_id) WHERE wo_sublet_id IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_vendor_bill_line__receipt
        ON vend.vendor_bill_line (tenant_id, goods_receipt_line_id) INCLUDE (vendor_bill_id, billed_amount) WHERE goods_receipt_line_id IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_vendor_bill_line__work_order
        ON vend.vendor_bill_line (tenant_id, work_order_id) INCLUDE (billed_amount, variance_amount) WHERE work_order_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'vend', @table = 'vendor_bill_line';
END
GO

-- @table   mods.modification
-- @purpose One container modification (REPAIR_MOD) on a case: type (MODIFICATION_TYPE), description and justification, whether class approval is needed, class society (CLASS_SOCIETY) and approval reference, the MODIFICATION estimate and work order, and status PROPOSED -> CLASS_REVIEW -> APPROVED -> IN_PROGRESS -> COMPLETED -> CERTIFIED (or REJECTED / CANCELLED) with the certificate / data-plate update.
-- @vector  none — new (UI ModificationJob, /modification/*)
-- @owner   R9 Modifications & Emergency
-- @flags   T
-- @phase   10
IF OBJECT_ID('mods.modification') IS NULL
BEGIN
    CREATE TABLE mods.modification (
        modification_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_modification__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        modification_no         VARCHAR(30)         NOT NULL,   -- REPAIR_MOD series
        repair_case_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref mcase.repair_case (case_kind MODIFICATION)
        case_no                 VARCHAR(30)         NOT NULL,
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party requesting / paying
        owner_party_code        VARCHAR(20)         NULL,
        modification_type_code  VARCHAR(40)         NOT NULL,   -- MODIFICATION_TYPE code list (gecko_master)
        title                   NVARCHAR(150)       NOT NULL,
        description             NVARCHAR(2000)      NULL,
        justification           NVARCHAR(1000)      NULL,
        class_required          BIT                 NOT NULL CONSTRAINT df_modification__class_required DEFAULT 0,
        class_society_code      VARCHAR(40)         NULL,       -- CLASS_SOCIETY code list: ABS, BV, DNV, LR, NK ...
        class_submitted_at      DATETIMEOFFSET(7)   NULL,
        class_approval_ref      VARCHAR(60)         NULL,       -- class society's approval / drawing reference
        class_approved_at       DATETIMEOFFSET(7)   NULL,
        estimate_id             UNIQUEIDENTIFIER    NULL,       -- ref est.estimate (estimate_kind MODIFICATION)
        estimate_no             VARCHAR(30)         NULL,
        work_order_id           UNIQUEIDENTIFIER    NULL,       -- ref work.work_order (wo_kind MODIFICATION)
        wo_no                   VARCHAR(30)         NULL,
        status                  VARCHAR(15)         NOT NULL CONSTRAINT df_modification__status DEFAULT 'PROPOSED',
        approved_at             DATETIMEOFFSET(7)   NULL,
        approved_by             UNIQUEIDENTIFIER    NULL,
        started_at              DATETIMEOFFSET(7)   NULL,
        completed_at            DATETIMEOFFSET(7)   NULL,
        certified_at            DATETIMEOFFSET(7)   NULL,
        certificate_no          VARCHAR(60)         NULL,
        data_plate_updated      BIT                 NOT NULL CONSTRAINT df_modification__data_plate DEFAULT 0,
        close_reason            NVARCHAR(500)       NULL,       -- REJECTED / CANCELLED: why
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_modification__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_modification__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_modification PRIMARY KEY CLUSTERED (modification_id),
        CONSTRAINT ck_modification__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_modification__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        CONSTRAINT ck_modification__type CHECK (modification_type_code = UPPER(modification_type_code) COLLATE Latin1_General_100_CS_AS AND modification_type_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_modification__estimate_pair CHECK ((estimate_id IS NULL AND estimate_no IS NULL) OR (estimate_id IS NOT NULL AND estimate_no IS NOT NULL)),
        CONSTRAINT ck_modification__wo_pair CHECK ((work_order_id IS NULL AND wo_no IS NULL) OR (work_order_id IS NOT NULL AND wo_no IS NOT NULL)),
        CONSTRAINT ck_modification__status CHECK (status IN ('PROPOSED','CLASS_REVIEW','APPROVED','IN_PROGRESS','COMPLETED','CERTIFIED','REJECTED','CANCELLED')),
        -- Class: only a class-required modification goes to CLASS_REVIEW, and it cannot pass review without society + approval ref.
        CONSTRAINT ck_modification__class_review CHECK (status <> 'CLASS_REVIEW'
            OR (class_required = 1 AND class_society_code IS NOT NULL AND class_submitted_at IS NOT NULL)),
        CONSTRAINT ck_modification__class_passed CHECK (class_required = 0
            OR status NOT IN ('APPROVED','IN_PROGRESS','COMPLETED','CERTIFIED')
            OR (class_society_code IS NOT NULL AND class_approval_ref IS NOT NULL AND class_approved_at IS NOT NULL)),
        CONSTRAINT ck_modification__class_pair CHECK ((class_approval_ref IS NULL AND class_approved_at IS NULL) OR (class_approval_ref IS NOT NULL AND class_approved_at IS NOT NULL)),
        CONSTRAINT ck_modification__class_none CHECK (class_required = 1 OR (class_approval_ref IS NULL AND class_submitted_at IS NULL)),
        CONSTRAINT ck_modification__class_order CHECK (class_approved_at IS NULL OR (class_submitted_at IS NOT NULL AND class_approved_at >= class_submitted_at)),
        -- Each later state carries the facts of the states before it.
        CONSTRAINT ck_modification__approved CHECK (status NOT IN ('APPROVED','IN_PROGRESS','COMPLETED','CERTIFIED')
            OR (approved_at IS NOT NULL AND approved_by IS NOT NULL AND estimate_id IS NOT NULL)),
        CONSTRAINT ck_modification__in_progress CHECK (status NOT IN ('IN_PROGRESS','COMPLETED','CERTIFIED')
            OR (work_order_id IS NOT NULL AND started_at IS NOT NULL)),
        CONSTRAINT ck_modification__completed CHECK ((status IN ('COMPLETED','CERTIFIED') AND completed_at IS NOT NULL)
            OR (status NOT IN ('COMPLETED','CERTIFIED') AND completed_at IS NULL)),
        CONSTRAINT ck_modification__certified CHECK ((status = 'CERTIFIED' AND certified_at IS NOT NULL AND certificate_no IS NOT NULL)
            OR (status <> 'CERTIFIED' AND certified_at IS NULL)),
        -- No approval / start facts on a record that never got there.
        CONSTRAINT ck_modification__early CHECK (status NOT IN ('PROPOSED','CLASS_REVIEW') OR (approved_at IS NULL AND started_at IS NULL AND work_order_id IS NULL)),
        CONSTRAINT ck_modification__dates CHECK ((started_at IS NULL OR approved_at IS NULL OR started_at >= approved_at)
            AND (completed_at IS NULL OR (started_at IS NOT NULL AND completed_at >= started_at))
            AND (certified_at IS NULL OR certified_at >= completed_at)),
        CONSTRAINT ck_modification__close CHECK ((status IN ('REJECTED','CANCELLED') AND close_reason IS NOT NULL)
            OR (status NOT IN ('REJECTED','CANCELLED') AND close_reason IS NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_modification__no
        ON mods.modification (tenant_id, modification_no) WHERE deleted_at IS NULL;
    -- One live modification per MODIFICATION estimate.
    CREATE UNIQUE NONCLUSTERED INDEX uq_modification__estimate
        ON mods.modification (tenant_id, estimate_no) WHERE estimate_no IS NOT NULL AND status IN ('PROPOSED','CLASS_REVIEW','APPROVED','IN_PROGRESS','COMPLETED','CERTIFIED') AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_modification__case
        ON mods.modification (tenant_id, repair_case_id) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_modification__list
        ON mods.modification (tenant_id, branch_id, status, created_at) INCLUDE (modification_no, container_no, modification_type_code, class_society_code) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_modification__container
        ON mods.modification (tenant_id, container_no) INCLUDE (status, modification_type_code, certified_at) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'mods', @table = 'modification';
END
GO

-- @table   incident.incident
-- @purpose One emergency / incident (REPAIR_EMG) at a depot: type (INCIDENT_TYPE), severity LOW..CRITICAL, status OPEN -> ON_SITE -> CONTAINED -> CLOSED (or CANCELLED as false alarm / duplicate), when reported, reached, contained and closed, location, container(s), hazmat, lead responder, the repair case opened from it and the call-out charge (EMERGENCY) with its bill-to party.
-- @vector  none — new (UI EmergencyJob, /emergency/*)
-- @owner   R9 Modifications & Emergency
-- @flags   T
-- @phase   10
IF OBJECT_ID('incident.incident') IS NULL
BEGIN
    CREATE TABLE incident.incident (
        incident_id             UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_incident__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        incident_no             VARCHAR(30)         NOT NULL,   -- REPAIR_EMG series
        incident_type_code      VARCHAR(40)         NOT NULL,   -- INCIDENT_TYPE code list (gecko_master): SPILL, HAZMAT, STRUCTURAL, REEFER_FAILURE ...
        severity                VARCHAR(10)         NOT NULL CONSTRAINT df_incident__severity DEFAULT 'MEDIUM',   -- LOW, MEDIUM, HIGH, CRITICAL
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_incident__status DEFAULT 'OPEN',      -- OPEN, ON_SITE, CONTAINED, CLOSED, CANCELLED
        summary                 NVARCHAR(300)       NOT NULL,
        description             NVARCHAR(2000)      NULL,
        location_text           NVARCHAR(200)       NOT NULL,   -- block / row / berth / road, as reported
        latitude                DECIMAL(9,6)        NULL,
        longitude               DECIMAL(9,6)        NULL,
        container_id            UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:equipment.container (main unit involved)
        container_no            VARCHAR(11)         NULL,
        is_hazmat               BIT                 NOT NULL CONSTRAINT df_incident__hazmat DEFAULT 0,
        un_number               VARCHAR(4)          NULL,       -- UN no. of the substance when known
        reported_at             DATETIMEOFFSET(7)   NOT NULL,
        reported_by_user_id     UNIQUEIDENTIFIER    NULL,
        reporter_name           NVARCHAR(100)       NULL,       -- outside reporter (driver, vessel crew ...)
        lead_responder_user_id  UNIQUEIDENTIFIER    NULL,
        on_site_at              DATETIMEOFFSET(7)   NULL,
        contained_at            DATETIMEOFFSET(7)   NULL,
        closed_at               DATETIMEOFFSET(7)   NULL,
        closed_by               UNIQUEIDENTIFIER    NULL,
        resolution_summary      NVARCHAR(1000)      NULL,
        root_cause              NVARCHAR(1000)      NULL,
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case opened by "Create repair job"
        case_no                 VARCHAR(30)         NULL,
        callout_chargeable      BIT                 NOT NULL CONSTRAINT df_incident__callout DEFAULT 0,
        callout_charge_code     VARCHAR(20)         NULL,       -- gecko_master charge code (EMERGENCY), priced by the Revenue tariff
        bill_to_party_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party
        bill_to_party_code      VARCHAR(20)         NULL,
        currency_code           CHAR(3)             NULL,
        response_cost           DECIMAL(18,4)       NULL,       -- depot's own cost of the response (margin)
        cancel_reason           NVARCHAR(300)       NULL,
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline / idempotent create key
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_incident__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_incident__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_incident PRIMARY KEY CLUSTERED (incident_id),
        CONSTRAINT ck_incident__type CHECK (incident_type_code = UPPER(incident_type_code) COLLATE Latin1_General_100_CS_AS AND incident_type_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_incident__severity CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
        CONSTRAINT ck_incident__status CHECK (status IN ('OPEN','ON_SITE','CONTAINED','CLOSED','CANCELLED')),
        CONSTRAINT ck_incident__geo CHECK ((latitude IS NULL AND longitude IS NULL)
            OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)),
        CONSTRAINT ck_incident__container_pair CHECK ((container_id IS NULL AND container_no IS NULL) OR (container_id IS NOT NULL AND container_no IS NOT NULL)),
        CONSTRAINT ck_incident__container_no CHECK (container_no IS NULL OR container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_incident__un_number CHECK (un_number IS NULL OR (is_hazmat = 1 AND un_number LIKE '[0-9][0-9][0-9][0-9]')),
        CONSTRAINT ck_incident__reporter CHECK (reported_by_user_id IS NOT NULL OR reporter_name IS NOT NULL),
        CONSTRAINT ck_incident__case_pair CHECK ((repair_case_id IS NULL AND case_no IS NULL) OR (repair_case_id IS NOT NULL AND case_no IS NOT NULL)),
        -- Each later state carries the time of the states before it.
        CONSTRAINT ck_incident__on_site CHECK (status NOT IN ('ON_SITE','CONTAINED','CLOSED') OR on_site_at IS NOT NULL),
        CONSTRAINT ck_incident__contained CHECK (status NOT IN ('CONTAINED','CLOSED') OR contained_at IS NOT NULL),
        CONSTRAINT ck_incident__open CHECK (status <> 'OPEN' OR (on_site_at IS NULL AND contained_at IS NULL)),
        CONSTRAINT ck_incident__closed CHECK ((status = 'CLOSED' AND closed_at IS NOT NULL AND closed_by IS NOT NULL AND resolution_summary IS NOT NULL)
            OR (status <> 'CLOSED' AND closed_at IS NULL)),
        CONSTRAINT ck_incident__timeline CHECK ((on_site_at IS NULL OR on_site_at >= reported_at)
            AND (contained_at IS NULL OR (on_site_at IS NOT NULL AND contained_at >= on_site_at))
            AND (closed_at IS NULL OR closed_at >= COALESCE(contained_at, reported_at))),
        CONSTRAINT ck_incident__cancel CHECK ((status = 'CANCELLED' AND cancel_reason IS NOT NULL AND callout_chargeable = 0)
            OR (status <> 'CANCELLED' AND cancel_reason IS NULL)),
        CONSTRAINT ck_incident__bill_to_pair CHECK ((bill_to_party_id IS NULL AND bill_to_party_code IS NULL) OR (bill_to_party_id IS NOT NULL AND bill_to_party_code IS NOT NULL)),
        -- A chargeable call-out names the charge and who pays it.
        CONSTRAINT ck_incident__callout CHECK ((callout_chargeable = 1 AND callout_charge_code IS NOT NULL AND bill_to_party_id IS NOT NULL)
            OR (callout_chargeable = 0 AND callout_charge_code IS NULL)),
        CONSTRAINT ck_incident__cost CHECK ((response_cost IS NULL AND currency_code IS NULL)
            OR (response_cost IS NOT NULL AND response_cost >= 0 AND currency_code LIKE '[A-Z][A-Z][A-Z]'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_incident__no
        ON incident.incident (tenant_id, incident_no) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_incident__client_ref
        ON incident.incident (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    -- Live incident board per depot, critical first.
    CREATE NONCLUSTERED INDEX ix_incident__board
        ON incident.incident (tenant_id, branch_id, status, severity, reported_at) INCLUDE (incident_no, incident_type_code, location_text, container_no)
        WHERE status IN ('OPEN','ON_SITE','CONTAINED') AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_incident__list
        ON incident.incident (tenant_id, branch_id, reported_at) INCLUDE (incident_no, status, severity) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_incident__container
        ON incident.incident (tenant_id, container_no) WHERE container_no IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'incident', @table = 'incident';
END
GO

-- @table   incident.incident_update
-- @purpose One timeline entry on an incident: a note, a status or severity change, or a responder joining / leaving (user or outside party such as fire brigade or the cleaning contractor). Never changed.
-- @vector  none — new (UI emergency timeline was hard-coded)
-- @owner   R9 Modifications & Emergency
-- @flags   A
-- @phase   10
IF OBJECT_ID('incident.incident_update') IS NULL
BEGIN
    CREATE TABLE incident.incident_update (
        incident_update_id      UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_incident_update__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        incident_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref incident.incident
        update_kind             VARCHAR(20)         NOT NULL,   -- NOTE, STATUS_CHANGE, SEVERITY_CHANGE, RESPONDER_JOINED, RESPONDER_LEFT
        from_status             VARCHAR(10)         NULL,
        to_status               VARCHAR(10)         NULL,
        from_severity           VARCHAR(10)         NULL,
        to_severity             VARCHAR(10)         NULL,
        responder_user_id       UNIQUEIDENTIFIER    NULL,       -- depot staff responder
        responder_party_id      UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party (outside responder)
        responder_party_code    VARCHAR(20)         NULL,
        responder_name          NVARCHAR(100)       NULL,
        responder_role          NVARCHAR(60)        NULL,       -- incident lead, hazmat team, fire brigade ...
        note                    NVARCHAR(2000)      NULL,
        occurred_at             DATETIMEOFFSET(7)   NOT NULL,
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline app key
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_incident_update__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_incident_update PRIMARY KEY CLUSTERED (incident_update_id),
        CONSTRAINT ck_incident_update__kind CHECK (update_kind IN ('NOTE','STATUS_CHANGE','SEVERITY_CHANGE','RESPONDER_JOINED','RESPONDER_LEFT')),
        CONSTRAINT ck_incident_update__status_values CHECK ((from_status IS NULL OR from_status IN ('OPEN','ON_SITE','CONTAINED','CLOSED','CANCELLED'))
            AND (to_status IS NULL OR to_status IN ('OPEN','ON_SITE','CONTAINED','CLOSED','CANCELLED'))),
        CONSTRAINT ck_incident_update__severity_values CHECK ((from_severity IS NULL OR from_severity IN ('LOW','MEDIUM','HIGH','CRITICAL'))
            AND (to_severity IS NULL OR to_severity IN ('LOW','MEDIUM','HIGH','CRITICAL'))),
        CONSTRAINT ck_incident_update__note CHECK (update_kind <> 'NOTE' OR note IS NOT NULL),
        CONSTRAINT ck_incident_update__status CHECK ((update_kind = 'STATUS_CHANGE' AND to_status IS NOT NULL AND (from_status IS NULL OR from_status <> to_status))
            OR (update_kind <> 'STATUS_CHANGE' AND from_status IS NULL AND to_status IS NULL)),
        CONSTRAINT ck_incident_update__severity CHECK ((update_kind = 'SEVERITY_CHANGE' AND from_severity IS NOT NULL AND to_severity IS NOT NULL AND from_severity <> to_severity)
            OR (update_kind <> 'SEVERITY_CHANGE' AND from_severity IS NULL AND to_severity IS NULL)),
        CONSTRAINT ck_incident_update__responder_pair CHECK ((responder_party_id IS NULL AND responder_party_code IS NULL) OR (responder_party_id IS NOT NULL AND responder_party_code IS NOT NULL)),
        CONSTRAINT ck_incident_update__responder CHECK (update_kind NOT IN ('RESPONDER_JOINED','RESPONDER_LEFT')
            OR responder_user_id IS NOT NULL OR responder_party_id IS NOT NULL OR responder_name IS NOT NULL),
        CONSTRAINT ck_incident_update__responder_only CHECK (update_kind IN ('RESPONDER_JOINED','RESPONDER_LEFT')
            OR (responder_user_id IS NULL AND responder_party_id IS NULL AND responder_name IS NULL AND responder_role IS NULL))
    );
    CREATE NONCLUSTERED INDEX ix_incident_update__incident
        ON incident.incident_update (tenant_id, incident_id, occurred_at);
    CREATE UNIQUE NONCLUSTERED INDEX uq_incident_update__client_ref
        ON incident.incident_update (tenant_id, client_ref) WHERE client_ref IS NOT NULL;
    EXEC dbo.usp_make_append_only @schema = 'incident', @table = 'incident_update';
END
GO

EXEC dbo.usp_record_script '19_vend_mods_incident.sql', N'vend: vendor_rate_card (REPAIR_VRC, approval), vendor_rate_line (sell-tariff row key, unit cost rule), vendor_bill (REPAIR_VBL, unique vendor invoice, subtotal + tax = total, match / approval / export), vendor_bill_line (sublet or receipt match, one live line per sublet); mods.modification (REPAIR_MOD, class review rules); incident.incident (REPAIR_EMG, call-out charge), incident_update (A)';
GO

PRINT '>> 19_vend_mods_incident.sql completed.';
GO
