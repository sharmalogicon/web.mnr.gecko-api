-- ============================================================
-- GECKO REPAIR (M&R) — STOCK, PURCHASING, RECEIPTS, STOCK DOCUMENTS (P7, part 2 of 2)
-- Script: 16_part_stock.sql
--
--   part.stock_ledger         every movement, signed base-unit qty at moving-average cost (A, P)
--   part.stock_balance        on hand / reserved / average cost / value per material x store x bin,
--                             updated in the same transaction as the ledger
--   part.reservation          quantity held for a work-order task until issued or released
--   part.purchase_order       PO (REPAIR_PO) with approval;          part.purchase_order_line
--   part.goods_receipt        GRN (REPAIR_GRN), against a PO or direct
--                             (direct receipt allowed up to setting DIRECT_RECEIPT_LIMIT, Q18);
--                             part.goods_receipt_line
--   part.stock_document       issue / return / adjustment / transfer / count / vendor return
--                             (REPAIR_ISS, _RTN, _ADJ, _TRF, _CNT, _RTV); part.stock_document_line
--
-- Shapes follow gecko_fleet inv.* / purch.* (Fleet P4). Costing: weighted moving
-- average (setting COSTING_METHOD = WMA). A posted document is never edited: a
-- mistake is reversed (REVERSAL ledger rows) and posted again.
-- work_order_id / wo_task_id are soft references to work.* (P8).
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   part.stock_ledger
-- @purpose Every stock movement of a material in a store: signed base-unit quantity, cost at moving average, the quantity and average after it, the document that caused it and the work order it was charged to. Never changed: a mistake is reversed by a REVERSAL row.
-- @vector  none — new (UI stock history was hard-coded)
-- @owner   R10 Parts & Stock
-- @flags   A, P
-- @phase   7
IF OBJECT_ID('part.stock_ledger') IS NULL
BEGIN
    CREATE TABLE part.stock_ledger (
        stock_ledger_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_stock_ledger__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- the store's depot
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store
        bin_id                  UNIQUEIDENTIFIER    NULL,       -- ref part.bin
        movement_type           VARCHAR(20)         NOT NULL,   -- OPENING, RECEIPT, ISSUE, ISSUE_RETURN, VENDOR_RETURN, ADJUST_IN, ADJUST_OUT, TRANSFER_OUT, TRANSFER_IN, COUNT_VARIANCE, REVERSAL
        qty                     DECIMAL(18,4)       NOT NULL,   -- signed, base unit (+ in, - out)
        unit_cost               DECIMAL(18,4)       NOT NULL,   -- base-unit cost of this movement (issues: the average at the time)
        amount                  DECIMAL(18,4)       NOT NULL,   -- signed qty x unit_cost
        qty_after               DECIMAL(18,4)       NOT NULL,   -- material x store on hand after the movement
        avg_cost_after          DECIMAL(18,4)       NOT NULL,   -- material x store moving average after the movement
        currency_code           CHAR(3)             NOT NULL,   -- depot currency
        source_doc_type         VARCHAR(10)         NOT NULL,   -- GRN, ISS, RTN, RTV, ADJ, TRF, CNT, OPEN
        source_doc_id           UNIQUEIDENTIFIER    NOT NULL,
        source_line_id          UNIQUEIDENTIFIER    NULL,
        source_doc_no           VARCHAR(30)         NOT NULL,
        work_order_id           UNIQUEIDENTIFIER    NULL,       -- ref work.work_order (P8): cost attribution
        wo_task_id              UNIQUEIDENTIFIER    NULL,       -- ref work.wo_task (P8)
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case
        reverses_stock_ledger_id UNIQUEIDENTIFIER   NULL,       -- ref part.stock_ledger (a REVERSAL row)
        posted_at               DATETIMEOFFSET(7)   NOT NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_ledger__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_stock_ledger PRIMARY KEY NONCLUSTERED (stock_ledger_id) ON [PRIMARY],
        CONSTRAINT ck_stock_ledger__movement CHECK (movement_type IN ('OPENING','RECEIPT','ISSUE','ISSUE_RETURN','VENDOR_RETURN','ADJUST_IN','ADJUST_OUT',
            'TRANSFER_OUT','TRANSFER_IN','COUNT_VARIANCE','REVERSAL')),
        CONSTRAINT ck_stock_ledger__doc_type CHECK (source_doc_type IN ('GRN','ISS','RTN','RTV','ADJ','TRF','CNT','OPEN')),
        CONSTRAINT ck_stock_ledger__qty CHECK (qty <> 0 AND unit_cost >= 0 AND avg_cost_after >= 0),
        -- Direction matches the movement (COUNT_VARIANCE and REVERSAL may go either way).
        CONSTRAINT ck_stock_ledger__sign CHECK (
            (movement_type IN ('OPENING','RECEIPT','ISSUE_RETURN','ADJUST_IN','TRANSFER_IN') AND qty > 0)
            OR (movement_type IN ('ISSUE','VENDOR_RETURN','ADJUST_OUT','TRANSFER_OUT') AND qty < 0)
            OR movement_type IN ('COUNT_VARIANCE','REVERSAL')),
        CONSTRAINT ck_stock_ledger__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_stock_ledger__reversal CHECK ((movement_type = 'REVERSAL' AND reverses_stock_ledger_id IS NOT NULL)
            OR (movement_type <> 'REVERSAL' AND reverses_stock_ledger_id IS NULL))
    ) ON ps_month (posted_at);
    CREATE CLUSTERED INDEX cx_stock_ledger ON part.stock_ledger (posted_at, stock_ledger_id) ON ps_month (posted_at);
    CREATE NONCLUSTERED INDEX ix_stock_ledger__material ON part.stock_ledger (tenant_id, material_id, store_id, posted_at) INCLUDE (qty, amount, movement_type) ON [PRIMARY];
    CREATE NONCLUSTERED INDEX ix_stock_ledger__source ON part.stock_ledger (tenant_id, source_doc_id) ON [PRIMARY];
    CREATE NONCLUSTERED INDEX ix_stock_ledger__work_order ON part.stock_ledger (tenant_id, work_order_id) WHERE work_order_id IS NOT NULL ON [PRIMARY];
    -- A row is reversed at most once.
    CREATE UNIQUE NONCLUSTERED INDEX uq_stock_ledger__reverses ON part.stock_ledger (tenant_id, reverses_stock_ledger_id) WHERE reverses_stock_ledger_id IS NOT NULL ON [PRIMARY];
    EXEC dbo.usp_make_append_only @schema = 'part', @table = 'stock_ledger';
END
GO

-- @table   part.stock_balance
-- @purpose Stock on hand and reserved per material x store x bin, with the material x store moving-average cost and value; kept in step with the ledger in the same transaction.
-- @vector  none — new (UI stockOnHand)
-- @owner   R10 Parts & Stock
-- @flags   -
-- @phase   7
IF OBJECT_ID('part.stock_balance') IS NULL
BEGIN
    CREATE TABLE part.stock_balance (
        stock_balance_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_stock_balance__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store
        bin_id                  UNIQUEIDENTIFIER    NULL,       -- ref part.bin (NULL = no bin)
        qty_on_hand             DECIMAL(18,4)       NOT NULL CONSTRAINT df_stock_balance__on_hand DEFAULT 0,   -- may go below 0 only when NEGATIVE_STOCK_ALLOWED (module rule)
        qty_reserved            DECIMAL(18,4)       NOT NULL CONSTRAINT df_stock_balance__reserved DEFAULT 0,
        avg_unit_cost           DECIMAL(18,4)       NOT NULL CONSTRAINT df_stock_balance__avg DEFAULT 0,
        stock_value             DECIMAL(18,4)       NOT NULL CONSTRAINT df_stock_balance__value DEFAULT 0,
        last_movement_at        DATETIMEOFFSET(7)   NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_balance__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_balance__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_stock_balance PRIMARY KEY CLUSTERED (stock_balance_id),
        CONSTRAINT ck_stock_balance__values CHECK (qty_reserved >= 0 AND avg_unit_cost >= 0)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_stock_balance__key ON part.stock_balance (tenant_id, material_id, store_id, bin_id);
    CREATE NONCLUSTERED INDEX ix_stock_balance__store ON part.stock_balance (tenant_id, store_id, material_id) INCLUDE (qty_on_hand, qty_reserved, stock_value);
END
GO

-- @table   part.reservation
-- @purpose Quantity of a material held in a store for one work-order task until it is issued or released.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   -
-- @phase   7
IF OBJECT_ID('part.reservation') IS NULL
BEGIN
    CREATE TABLE part.reservation (
        reservation_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_reservation__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store
        work_order_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref work.work_order (P8)
        wo_task_id              UNIQUEIDENTIFIER    NULL,       -- ref work.wo_task (P8)
        qty_reserved            DECIMAL(18,4)       NOT NULL,   -- base units
        qty_issued              DECIMAL(18,4)       NOT NULL CONSTRAINT df_reservation__issued DEFAULT 0,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_reservation__status DEFAULT 'OPEN',   -- OPEN, ISSUED, RELEASED
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_reservation__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_reservation__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_reservation PRIMARY KEY CLUSTERED (reservation_id),
        CONSTRAINT ck_reservation__qty CHECK (qty_reserved > 0 AND qty_issued >= 0 AND qty_issued <= qty_reserved),
        CONSTRAINT ck_reservation__status CHECK (status IN ('OPEN','ISSUED','RELEASED')),
        CONSTRAINT ck_reservation__issued CHECK (status <> 'ISSUED' OR qty_issued = qty_reserved)
    );
    CREATE NONCLUSTERED INDEX ix_reservation__open
        ON part.reservation (tenant_id, material_id, store_id) INCLUDE (qty_reserved, qty_issued) WHERE status = 'OPEN' AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_reservation__work_order
        ON part.reservation (tenant_id, work_order_id) WHERE deleted_at IS NULL;
END
GO

-- @table   part.purchase_order
-- @purpose One purchase order to a supplier for a store: dates, currency, totals, approval and status from draft to received or closed.
-- @vector  none — new (UI /parts/orders, missing)
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.purchase_order') IS NULL
BEGIN
    CREATE TABLE part.purchase_order (
        purchase_order_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_purchase_order__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        po_no                   VARCHAR(30)         NOT NULL,   -- REPAIR_PO series
        supplier_party_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        supplier_party_code     VARCHAR(20)         NOT NULL,
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store: deliver to
        order_date              DATE                NOT NULL,
        expected_date           DATE                NULL,
        currency_code           CHAR(3)             NOT NULL,
        prices_include_tax      BIT                 NOT NULL CONSTRAINT df_purchase_order__incl_tax DEFAULT 0,
        subtotal_amount         DECIMAL(18,4)       NOT NULL CONSTRAINT df_purchase_order__subtotal DEFAULT 0,
        tax_amount              DECIMAL(18,4)       NOT NULL CONSTRAINT df_purchase_order__tax DEFAULT 0,
        total_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_purchase_order__total DEFAULT 0,
        status                  VARCHAR(20)         NOT NULL CONSTRAINT df_purchase_order__status DEFAULT 'DRAFT',   -- DRAFT, PENDING_APPROVAL, APPROVED, SENT, PARTIAL, RECEIVED, CLOSED, CANCELLED
        approved_at             DATETIMEOFFSET(7)   NULL,
        approved_by             UNIQUEIDENTIFIER    NULL,
        sent_at                 DATETIMEOFFSET(7)   NULL,
        cancel_reason           NVARCHAR(300)       NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_purchase_order__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_purchase_order__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_purchase_order PRIMARY KEY CLUSTERED (purchase_order_id),
        CONSTRAINT ck_purchase_order__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_purchase_order__dates CHECK (expected_date IS NULL OR expected_date >= order_date),
        CONSTRAINT ck_purchase_order__amounts CHECK (subtotal_amount >= 0 AND tax_amount >= 0
            AND total_amount = CASE WHEN prices_include_tax = 1 THEN subtotal_amount ELSE subtotal_amount + tax_amount END),
        CONSTRAINT ck_purchase_order__status CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','SENT','PARTIAL','RECEIVED','CLOSED','CANCELLED')),
        CONSTRAINT ck_purchase_order__approved CHECK (status IN ('DRAFT','PENDING_APPROVAL','CANCELLED') OR approved_at IS NOT NULL),
        CONSTRAINT ck_purchase_order__cancelled CHECK (status <> 'CANCELLED' OR cancel_reason IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_purchase_order__no
        ON part.purchase_order (tenant_id, po_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_purchase_order__list
        ON part.purchase_order (tenant_id, branch_id, status, order_date) INCLUDE (po_no, supplier_party_code, total_amount) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'purchase_order';
END
GO

-- @table   part.purchase_order_line
-- @purpose One material on a purchase order: quantity, unit, price, tax, amount, and how much has been received.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.purchase_order_line') IS NULL
BEGIN
    CREATE TABLE part.purchase_order_line (
        purchase_order_line_id  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_purchase_order_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        purchase_order_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref part.purchase_order
        line_no                 SMALLINT            NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        material_code           VARCHAR(30)         NOT NULL,
        description             NVARCHAR(200)       NULL,
        uom_code                VARCHAR(10)         NOT NULL,   -- ordering unit (base or pack)
        factor_to_base          DECIMAL(18,6)       NOT NULL CONSTRAINT df_purchase_order_line__factor DEFAULT 1,
        qty_ordered             DECIMAL(18,4)       NOT NULL,
        qty_received            DECIMAL(18,4)       NOT NULL CONSTRAINT df_purchase_order_line__received DEFAULT 0,   -- in the ordering unit
        unit_price              DECIMAL(18,4)       NOT NULL,
        tax_code                VARCHAR(20)         NULL,
        tax_rate                DECIMAL(9,4)        NOT NULL CONSTRAINT df_purchase_order_line__tax_rate DEFAULT 0,
        line_amount             DECIMAL(18,4)       NOT NULL,   -- qty_ordered x unit_price
        work_order_id           UNIQUEIDENTIFIER    NULL,       -- ref work.work_order when bought for one job (P8)
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_purchase_order_line__status DEFAULT 'OPEN',   -- OPEN, CLOSED, CANCELLED
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_purchase_order_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_purchase_order_line__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_purchase_order_line PRIMARY KEY CLUSTERED (purchase_order_line_id),
        CONSTRAINT ck_purchase_order_line__values CHECK (line_no >= 1 AND factor_to_base > 0 AND qty_ordered > 0 AND qty_received >= 0
            AND unit_price >= 0 AND tax_rate >= 0 AND line_amount >= 0),
        CONSTRAINT ck_purchase_order_line__status CHECK (status IN ('OPEN','CLOSED','CANCELLED'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_purchase_order_line__line
        ON part.purchase_order_line (tenant_id, purchase_order_id, line_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'purchase_order_line';
END
GO

-- @table   part.goods_receipt
-- @purpose One goods receipt into a store: from which supplier, against which PO (or direct, within the allowed limit), the supplier's delivery note, and when it was posted to stock.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.goods_receipt') IS NULL
BEGIN
    CREATE TABLE part.goods_receipt (
        goods_receipt_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_goods_receipt__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        grn_no                  VARCHAR(30)         NOT NULL,   -- REPAIR_GRN series
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store
        supplier_party_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        supplier_party_code     VARCHAR(20)         NOT NULL,
        purchase_order_id       UNIQUEIDENTIFIER    NULL,       -- ref part.purchase_order; NULL = direct receipt (setting DIRECT_RECEIPT_LIMIT)
        po_no                   VARCHAR(30)         NULL,
        delivery_note_no        NVARCHAR(60)        NULL,
        received_date           DATE                NOT NULL,
        currency_code           CHAR(3)             NOT NULL,
        total_amount            DECIMAL(18,4)       NOT NULL CONSTRAINT df_goods_receipt__total DEFAULT 0,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_goods_receipt__status DEFAULT 'DRAFT',   -- DRAFT, POSTED, REVERSED
        posted_at               DATETIMEOFFSET(7)   NULL,
        posted_by               UNIQUEIDENTIFIER    NULL,
        reversed_at             DATETIMEOFFSET(7)   NULL,
        reverse_reason          NVARCHAR(300)       NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_goods_receipt__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_goods_receipt__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_goods_receipt PRIMARY KEY CLUSTERED (goods_receipt_id),
        CONSTRAINT ck_goods_receipt__po_pair CHECK ((purchase_order_id IS NULL AND po_no IS NULL) OR (purchase_order_id IS NOT NULL AND po_no IS NOT NULL)),
        CONSTRAINT ck_goods_receipt__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_goods_receipt__total CHECK (total_amount >= 0),
        CONSTRAINT ck_goods_receipt__status CHECK (status IN ('DRAFT','POSTED','REVERSED')),
        CONSTRAINT ck_goods_receipt__posted CHECK (status = 'DRAFT' OR posted_at IS NOT NULL),
        CONSTRAINT ck_goods_receipt__reversed CHECK (status <> 'REVERSED' OR (reversed_at IS NOT NULL AND reverse_reason IS NOT NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_goods_receipt__no
        ON part.goods_receipt (tenant_id, grn_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_goods_receipt__po
        ON part.goods_receipt (tenant_id, purchase_order_id) WHERE purchase_order_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'goods_receipt';
END
GO

-- @table   part.goods_receipt_line
-- @purpose One material received on a goods receipt: quantity and unit (converted to base), unit cost, amount, the PO line it fills and the bin it went to.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.goods_receipt_line') IS NULL
BEGIN
    CREATE TABLE part.goods_receipt_line (
        goods_receipt_line_id   UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_goods_receipt_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        goods_receipt_id        UNIQUEIDENTIFIER    NOT NULL,   -- ref part.goods_receipt
        line_no                 SMALLINT            NOT NULL,
        purchase_order_line_id  UNIQUEIDENTIFIER    NULL,       -- ref part.purchase_order_line
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        material_code           VARCHAR(30)         NOT NULL,
        bin_id                  UNIQUEIDENTIFIER    NULL,       -- ref part.bin
        uom_code                VARCHAR(10)         NOT NULL,
        factor_to_base          DECIMAL(18,6)       NOT NULL CONSTRAINT df_goods_receipt_line__factor DEFAULT 1,
        qty                     DECIMAL(18,4)       NOT NULL,   -- in uom_code
        qty_base                DECIMAL(18,4)       NOT NULL,   -- qty x factor_to_base
        unit_cost               DECIMAL(18,4)       NOT NULL,   -- per uom_code
        line_amount             DECIMAL(18,4)       NOT NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_goods_receipt_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_goods_receipt_line__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_goods_receipt_line PRIMARY KEY CLUSTERED (goods_receipt_line_id),
        CONSTRAINT ck_goods_receipt_line__values CHECK (line_no >= 1 AND factor_to_base > 0 AND qty > 0 AND qty_base > 0 AND unit_cost >= 0 AND line_amount >= 0)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_goods_receipt_line__line
        ON part.goods_receipt_line (tenant_id, goods_receipt_id, line_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'goods_receipt_line';
END
GO

-- @table   part.stock_document
-- @purpose One stock document other than a receipt: issue to a work order, return from it, adjustment (with reason and approval), transfer between stores, stock count, or return to supplier; posted to the ledger.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.stock_document') IS NULL
BEGIN
    CREATE TABLE part.stock_document (
        stock_document_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_stock_document__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        doc_type                VARCHAR(3)          NOT NULL,   -- ISS issue, RTN return from job, ADJ adjustment, TRF transfer, CNT count, RTV return to supplier
        doc_no                  VARCHAR(30)         NOT NULL,   -- REPAIR_ISS / _RTN / _ADJ / _TRF / _CNT / _RTV series
        doc_date                DATE                NOT NULL,
        store_id                UNIQUEIDENTIFIER    NOT NULL,   -- ref part.store (from-store for transfers)
        to_store_id             UNIQUEIDENTIFIER    NULL,       -- ref part.store (TRF only)
        work_order_id           UNIQUEIDENTIFIER    NULL,       -- ref work.work_order (ISS / RTN, P8)
        work_order_no           VARCHAR(30)         NULL,
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case
        supplier_party_id       UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party (RTV only)
        supplier_party_code     VARCHAR(20)         NULL,
        reason_code             VARCHAR(30)         NULL,       -- ADJ: DAMAGED, EXPIRED, LOST, FOUND, WRITE_OFF, CORRECTION
        status                  VARCHAR(20)         NOT NULL CONSTRAINT df_stock_document__status DEFAULT 'DRAFT',   -- DRAFT, PENDING_APPROVAL, APPROVED, POSTED, CANCELLED
        approved_at             DATETIMEOFFSET(7)   NULL,
        approved_by             UNIQUEIDENTIFIER    NULL,
        posted_at               DATETIMEOFFSET(7)   NULL,
        posted_by               UNIQUEIDENTIFIER    NULL,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_document__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_document__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_stock_document PRIMARY KEY CLUSTERED (stock_document_id),
        CONSTRAINT ck_stock_document__type CHECK (doc_type IN ('ISS','RTN','ADJ','TRF','CNT','RTV')),
        CONSTRAINT ck_stock_document__status CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED','POSTED','CANCELLED')),
        CONSTRAINT ck_stock_document__posted CHECK (status <> 'POSTED' OR posted_at IS NOT NULL),
        -- What each document type needs.
        CONSTRAINT ck_stock_document__transfer CHECK ((doc_type = 'TRF' AND to_store_id IS NOT NULL AND to_store_id <> store_id) OR (doc_type <> 'TRF' AND to_store_id IS NULL)),
        CONSTRAINT ck_stock_document__work_order CHECK ((doc_type IN ('ISS','RTN') AND work_order_id IS NOT NULL AND work_order_no IS NOT NULL)
            OR (doc_type NOT IN ('ISS','RTN') AND work_order_id IS NULL)),
        CONSTRAINT ck_stock_document__supplier CHECK ((doc_type = 'RTV' AND supplier_party_id IS NOT NULL AND supplier_party_code IS NOT NULL)
            OR (doc_type <> 'RTV' AND supplier_party_id IS NULL AND supplier_party_code IS NULL)),
        CONSTRAINT ck_stock_document__reason CHECK ((doc_type = 'ADJ' AND reason_code IS NOT NULL) OR doc_type <> 'ADJ'),
        CONSTRAINT ck_stock_document__approval CHECK (status NOT IN ('APPROVED') OR approved_at IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_stock_document__no
        ON part.stock_document (tenant_id, doc_no) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_stock_document__list
        ON part.stock_document (tenant_id, branch_id, doc_type, status, doc_date) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_stock_document__work_order
        ON part.stock_document (tenant_id, work_order_id) WHERE work_order_id IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'stock_document';
END
GO

-- @table   part.stock_document_line
-- @purpose One material on a stock document: quantity (and for counts the system and counted quantity), bins, the cost it was posted at, and the work-order task it was issued to.
-- @vector  none — new
-- @owner   R10 Parts & Stock
-- @flags   T
-- @phase   7
IF OBJECT_ID('part.stock_document_line') IS NULL
BEGIN
    CREATE TABLE part.stock_document_line (
        stock_document_line_id  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_stock_document_line__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        stock_document_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref part.stock_document
        line_no                 SMALLINT            NOT NULL,
        material_id             UNIQUEIDENTIFIER    NOT NULL,   -- ref part.material
        material_code           VARCHAR(30)         NOT NULL,
        bin_id                  UNIQUEIDENTIFIER    NULL,       -- ref part.bin (from)
        to_bin_id               UNIQUEIDENTIFIER    NULL,       -- ref part.bin (TRF to)
        uom_code                VARCHAR(10)         NOT NULL,
        factor_to_base          DECIMAL(18,6)       NOT NULL CONSTRAINT df_stock_document_line__factor DEFAULT 1,
        qty                     DECIMAL(18,4)       NULL,       -- ISS / RTN / TRF / RTV: quantity moved; ADJ: signed (+ in, - out); CNT: NULL
        system_qty              DECIMAL(18,4)       NULL,       -- CNT: on hand per the system when counted
        counted_qty             DECIMAL(18,4)       NULL,       -- CNT: what was found
        unit_cost               DECIMAL(18,4)       NULL,       -- base-unit cost it was posted at (filled when POSTED)
        wo_task_id              UNIQUEIDENTIFIER    NULL,       -- ref work.wo_task (ISS / RTN, P8)
        reservation_id          UNIQUEIDENTIFIER    NULL,       -- ref part.reservation it fulfils
        remarks                 NVARCHAR(300)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_document_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_stock_document_line__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_stock_document_line PRIMARY KEY CLUSTERED (stock_document_line_id),
        CONSTRAINT ck_stock_document_line__values CHECK (line_no >= 1 AND factor_to_base > 0 AND (unit_cost IS NULL OR unit_cost >= 0)),
        -- Either a moved quantity, or a count (system + counted), never both.
        CONSTRAINT ck_stock_document_line__qty_or_count CHECK (
            (qty IS NOT NULL AND qty <> 0 AND system_qty IS NULL AND counted_qty IS NULL)
            OR (qty IS NULL AND system_qty IS NOT NULL AND counted_qty IS NOT NULL AND counted_qty >= 0))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_stock_document_line__line
        ON part.stock_document_line (tenant_id, stock_document_id, line_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'part', @table = 'stock_document_line';
END
GO

EXEC dbo.usp_record_script '16_part_stock.sql', N'part (stock): stock_ledger (A, P, signed qty, reversals), stock_balance, reservation, purchase_order(+line), goods_receipt(+line, direct receipt allowed), stock_document(+line: ISS / RTN / ADJ / TRF / CNT / RTV)';
GO

PRINT '>> 16_part_stock.sql completed.';
GO
