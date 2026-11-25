-- ============================================================
-- GECKO REVENUE — REPAIR (M&R) CHARGES FOR INVOICING (Repair P5)
-- Script: 81_repair_charge.sql
-- Owner:  S12 Billing & E-invoice
--
-- Depots whose billing mode is GECKO_REVENUE hand priced M&R charges to Revenue
-- through the contract IContainerRepairChargeIntake. Each charge is one released
-- line from gecko_repair (charge.charge_release_line); Revenue invoices it like
-- any other charge and owns its status from here on.
--
--   billing.container_repair_charge        one released M&R charge: payer, charge code,
--                                          quantity, rate, amount, tax, the owner's
--                                          authorisation number, READY -> INVOICED / CANCELLED
--   billing.container_repair_invoice_line  marks a billing.invoice_line as coming from one
--
-- WHY PARALLEL TO billing.charge (same reason as Fleet 60 / Trucking 47):
-- billing.charge's source CHECK and keys cannot change (additive-only rule).
-- "container_" prefix: Fleet already owns billing.fleet_charge / repair_* names.
--
-- Depots in CHARGE_EXPORT mode never write here: their charges leave gecko_repair
-- as an export batch for the customer's own ERP / TOS billing.
--
-- IDEMPOTENT INTAKE: one row per Repair release line (release_line_id unique),
-- so a replayed release adds nothing.
-- MONEY: rates DECIMAL(18,4); billed amounts DECIMAL(18,2) (gecko_revenue 14).
-- ORDER: run 08_rls_policy.sql (gecko_revenue) after this script. Idempotent.
-- ============================================================

USE gecko_revenue;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   billing.container_repair_charge
-- @purpose One M&R charge released by Repair for invoicing: the Repair release line and case it comes from, who pays, charge code, quantity, rate, amount, tax, the owner's authorisation number, and whether it is ready, invoiced or cancelled.
-- @vector  none — new
-- @owner   S12 Billing & E-invoice
-- @flags   T
-- @phase   Repair P5
IF OBJECT_ID('billing.container_repair_charge') IS NULL
BEGIN
    CREATE TABLE billing.container_repair_charge (
        container_repair_charge_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT df_container_repair_charge__id DEFAULT NEWSEQUENTIALID(),
        tenant_id           UNIQUEIDENTIFIER    NOT NULL,
        branch_id           UNIQUEIDENTIFIER    NOT NULL,   -- the depot
        release_id          UNIQUEIDENTIFIER    NOT NULL,   -- gecko_repair charge.charge_release
        release_no          VARCHAR(30)         NOT NULL,
        release_line_id     UNIQUEIDENTIFIER    NOT NULL,   -- gecko_repair charge.charge_release_line (idempotency key)
        repair_case_id      UNIQUEIDENTIFIER    NULL,       -- gecko_repair mcase.repair_case
        case_no             VARCHAR(30)         NULL,
        source_type         VARCHAR(20)         NOT NULL,   -- ESTIMATE_LINE, SURVEY, CLEANING, PTI, MODIFICATION, INCIDENT, SERVICE
        source_ref          VARCHAR(40)         NULL,       -- document no. printed on the invoice (EOR no, PTI no ...)
        container_no        VARCHAR(11)         NULL,
        payer_party_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party (the bill-to: liner, lessor, lessee ...)
        payer_party_code    VARCHAR(25)         NOT NULL,
        charge_code         VARCHAR(15)         NOT NULL,   -- REPAIR, SURVEYFEE, WASHING, PTI ... (module MNR)
        charge_name         NVARCHAR(300)       NOT NULL,   -- printed on the invoice
        quantity            DECIMAL(18,4)       NOT NULL,
        billing_unit_code   VARCHAR(20)         NULL,
        unit_rate           DECIMAL(18,4)       NOT NULL,
        discount_amount     DECIMAL(18,2)       NOT NULL CONSTRAINT df_container_repair_charge__discount DEFAULT 0,
        amount              DECIMAL(18,2)       NOT NULL,   -- quantity x unit_rate - discount, rounded
        currency_code       CHAR(3)             NOT NULL,
        tax_code            VARCHAR(20)         NULL,
        tax_rate            DECIMAL(9,4)        NOT NULL CONSTRAINT df_container_repair_charge__tax_rate DEFAULT 0,
        tax_amount          DECIMAL(18,2)       NOT NULL CONSTRAINT df_container_repair_charge__tax DEFAULT 0,
        wht_code            VARCHAR(20)         NULL,       -- informational: the payer withholds (services)
        authorisation_no    VARCHAR(60)         NULL,       -- owner's approval reference — liners reject invoices without it
        rate_ref            VARCHAR(80)         NULL,       -- schedule no / rate row the price came from, or MANUAL
        priced_at           DATETIMEOFFSET(7)   NOT NULL,
        status              VARCHAR(20)         NOT NULL CONSTRAINT df_container_repair_charge__status DEFAULT 'READY',   -- READY, INVOICED, CANCELLED
        invoice_id          UNIQUEIDENTIFIER    NULL,       -- ref billing.invoice
        invoice_line_id     UNIQUEIDENTIFIER    NULL,       -- ref billing.invoice_line
        cancelled_at        DATETIMEOFFSET(7)   NULL,
        cancelled_by        UNIQUEIDENTIFIER    NULL,
        cancel_reason       NVARCHAR(500)       NULL,
        created_at          DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_charge__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by          UNIQUEIDENTIFIER    NULL,
        updated_at          DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_charge__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by          UNIQUEIDENTIFIER    NULL,
        deleted_at          DATETIMEOFFSET(7)   NULL,
        deleted_by          UNIQUEIDENTIFIER    NULL,
        row_version         ROWVERSION          NOT NULL,
        CONSTRAINT pk_container_repair_charge PRIMARY KEY CLUSTERED (container_repair_charge_id),
        CONSTRAINT ck_container_repair_charge__source CHECK (source_type IN ('ESTIMATE_LINE','SURVEY','CLEANING','PTI','MODIFICATION','INCIDENT','SERVICE')),
        CONSTRAINT ck_container_repair_charge__status CHECK (status IN ('READY','INVOICED','CANCELLED')),
        CONSTRAINT ck_container_repair_charge__invoiced CHECK (status <> 'INVOICED' OR invoice_id IS NOT NULL),
        CONSTRAINT ck_container_repair_charge__cancelled CHECK (status <> 'CANCELLED' OR (cancelled_at IS NOT NULL AND cancel_reason IS NOT NULL)),
        CONSTRAINT ck_container_repair_charge__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_container_repair_charge__values CHECK (quantity > 0 AND unit_rate >= 0 AND discount_amount >= 0 AND tax_rate >= 0 AND tax_amount >= 0)
    );
    -- A Repair release line becomes one charge (a replayed release adds nothing).
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_charge__release_line
        ON billing.container_repair_charge (tenant_id, release_line_id) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_container_repair_charge__payer
        ON billing.container_repair_charge (tenant_id, payer_party_id, status, branch_id) INCLUDE (amount, currency_code) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_container_repair_charge__release
        ON billing.container_repair_charge (tenant_id, release_id) WHERE deleted_at IS NULL;
END
GO

IF (SELECT temporal_type FROM sys.tables WHERE object_id = OBJECT_ID('billing.container_repair_charge')) = 0
BEGIN
    ALTER TABLE billing.container_repair_charge ADD
        sys_valid_from DATETIME2(7) GENERATED ALWAYS AS ROW START HIDDEN NOT NULL
            CONSTRAINT df_billing_container_repair_charge__sys_valid_from DEFAULT SYSUTCDATETIME(),
        sys_valid_to   DATETIME2(7) GENERATED ALWAYS AS ROW END   HIDDEN NOT NULL
            CONSTRAINT df_billing_container_repair_charge__sys_valid_to DEFAULT CONVERT(DATETIME2(7), '9999-12-31 23:59:59.9999999'),
        PERIOD FOR SYSTEM_TIME (sys_valid_from, sys_valid_to);
    ALTER TABLE billing.container_repair_charge SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = history.billing_container_repair_charge, DATA_CONSISTENCY_CHECK = ON));
    PRINT '>> billing.container_repair_charge is system-versioned.';
END
GO

-- @table   billing.container_repair_invoice_line
-- @purpose Marks a billing.invoice_line as coming from an M&R charge (billing.container_repair_charge).
-- @vector  none — new
-- @owner   S12 Billing & E-invoice
-- @flags   A
-- @phase   Repair P5
IF OBJECT_ID('billing.container_repair_invoice_line') IS NULL
BEGIN
    CREATE TABLE billing.container_repair_invoice_line (
        invoice_line_id     UNIQUEIDENTIFIER    NOT NULL,   -- ref billing.invoice_line (same id, one-to-one)
        tenant_id           UNIQUEIDENTIFIER    NOT NULL,
        invoice_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref billing.invoice
        container_repair_charge_id UNIQUEIDENTIFIER NOT NULL,   -- ref billing.container_repair_charge
        created_at          DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_repair_invoice_line__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by          UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_container_repair_invoice_line PRIMARY KEY CLUSTERED (invoice_line_id)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_repair_invoice_line__charge ON billing.container_repair_invoice_line (tenant_id, container_repair_charge_id);
    CREATE NONCLUSTERED INDEX ix_container_repair_invoice_line__invoice ON billing.container_repair_invoice_line (tenant_id, invoice_id);
END
GO

DENY UPDATE ON billing.container_repair_invoice_line TO gecko_app;
DENY UPDATE ON billing.container_repair_invoice_line TO gecko_system;
GO

EXEC dbo.usp_record_script '81_repair_charge.sql', N'Repair P5: billing.container_repair_charge (one per Repair release line, authorisation no., temporal) + billing.container_repair_invoice_line (A)';
GO

IF OBJECT_ID('history.billing_container_repair_charge') IS NULL OR OBJECT_ID('billing.container_repair_invoice_line') IS NULL
    THROW 50810, '81_repair_charge: a table or its history is missing.', 1;
GO
PRINT '>> 81_repair_charge.sql completed.';
GO
