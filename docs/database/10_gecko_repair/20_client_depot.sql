-- ============================================================
-- GECKO REPAIR (M&R) — CONTRACTOR MODE: CLIENT DEPOTS (doc 03 P11)
-- Script: 20_client_depot.sql
--
--   config.client_depot    a depot the tenant works at as an M&R CONTRACTOR but
--                          does not own: client party, site facts, how work
--                          requests arrive (connector / portal / e-mail), how
--                          status is reported back, estimate route, bill-to
--                          (client depot by default, owner when the agreement
--                          allows), currency, rate card, contract and validity    T
--
-- MODEL (doc 05 §8.2, G6): every Repair table is keyed by branch_id (the depot).
-- A contractor tenant therefore creates one gecko_identity BRANCH per client
-- depot site, and config.client_depot says "this branch is a client's depot".
-- Cases, visits, surveys, estimates, work orders, numbering, RLS branch scope
-- and entitlements all work unchanged — NO existing table is altered and no
-- client_depot_id is added anywhere: the client depot of any record is found
-- through its branch_id (one live client_depot per branch).
--   * the branch's config.depot_profile still says where yard facts come from
--     (CONNECTOR to the client's TOS, or STANDALONE when the client has none)
--     and where REPAIR_COMPLETED write-back goes (work.write_back);
--   * this table adds the CONTRACT side: who the client is, how WORK_REQUESTED
--     reaches the contractor, how case / estimate status is reported to the
--     client depot, and who is billed.
-- A tenant may mix own-yard branches (depot_profile only) and client-depot
-- branches (depot_profile + client_depot).
--
-- TENANT KIND (DEPOT_OPERATOR / REPAIR_CONTRACTOR, design G6 "MNR_CONTRACTOR",
-- renamed per the repair naming rule) is a REPAIR-OWNED setting, not a column
-- on the shared gecko_identity tenant.tenant table (used by TOS, Fleet,
-- Trucking ...; it has no settings table and the kind only changes Repair
-- behaviour). It is the tenant-level row of config.repair_setting:
--   setting_code REPAIR_TENANT_KIND, value_type CODE,
--   values DEPOT_OPERATOR (default when absent) | REPAIR_CONTRACTOR
-- validated by RepairSetupCatalogue; contractor mode itself is sold through the
-- MNR ENTERPRISE plan (identity 61) and guarded by repair.client_depot.manage
-- (identity 60).
--
-- WORK_REQUESTED arrives as integ.inbound_event (06) and becomes a case; the
-- outbound status report is integ.outbound_event to a connector or a webhook
-- subscription (06) — both reused through soft refs here, not duplicated.
-- Client depot users are invited as guests through Identity counterparty
-- access (no table here). SECRETS: none stored; connectors / webhooks hold
-- Key Vault secret names in integ.*.
--
-- Rules the database cannot see across tables (the branch's depot_profile
-- matches country / time zone, connector / webhook belong to the tenant and
-- are active, the client party is a depot operator) are Repair module rules.
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   config.client_depot
-- @purpose A depot the tenant serves as an M&R contractor but does not own, mapped to one branch of the tenant: client party, site name / codes, country and time zone, work-request intake channel, status-report channel back to the client depot, estimate route (depot or owner on its behalf), bill-to (client depot by default, owner when allowed), billing currency, contractor rate card, contract reference and validity, status.
-- @vector  none — new (G6, doc 05 §8.2; R19 Contractor Mode)
-- @owner   R19 Contractor Mode
-- @flags   T
-- @phase   11
IF OBJECT_ID('config.client_depot') IS NULL
BEGIN
    CREATE TABLE config.client_depot (
        client_depot_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_client_depot__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_identity:tenant.branch — the contractor's branch standing for this client site
        branch_code             VARCHAR(30)         NOT NULL,   -- code of the above
        client_depot_code       VARCHAR(30)         NOT NULL,   -- short code the contractor uses for the client depot, e.g. KERRY_LCB
        depot_name              NVARCHAR(200)       NOT NULL,   -- client depot name as printed on estimates and reports
        client_party_id         UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party — the depot operator company (default bill-to)
        client_party_code       VARCHAR(20)         NOT NULL,
        facility_code           VARCHAR(30)         NULL,       -- the depot's own id in the client's systems / SMDG depot code
        un_locode               CHAR(5)             NULL,       -- UN/LOCODE of the site, e.g. THLCH
        country_code            CHAR(2)             NOT NULL,   -- ISO 3166-1 (country pack: tax, e-invoicing)
        time_zone_id            VARCHAR(50)         NOT NULL,   -- IANA time zone, e.g. Asia/Bangkok
        -- How work requests (WORK_REQUESTED: survey, estimate, repair, clean, PTI) arrive.
        intake_channel          VARCHAR(10)         NOT NULL,   -- CONNECTOR, PORTAL, EMAIL
        intake_connector_id     UNIQUEIDENTIFIER    NULL,       -- ref integ.connector — CONNECTOR intake
        intake_email            VARCHAR(254)        NULL,       -- contractor mailbox alias that routes requests to this client depot (EMAIL intake)
        -- How case / estimate / work status is reported to the client depot.
        report_channel          VARCHAR(10)         NOT NULL CONSTRAINT df_client_depot__report DEFAULT 'PORTAL',   -- CONNECTOR, WEBHOOK, EMAIL, PORTAL (guests look it up), NONE
        report_connector_id     UNIQUEIDENTIFIER    NULL,       -- ref integ.connector — CONNECTOR report
        report_webhook_subscription_id UNIQUEIDENTIFIER NULL,   -- ref integ.webhook_subscription — WEBHOOK report
        report_emails_json      NVARCHAR(1000)      NULL,       -- JSON array of client addresses — EMAIL report
        report_event_types_json NVARCHAR(1000)      NULL,       -- JSON array of outbound event types reported; NULL = module default set
        -- Commercial agreement with the client depot.
        estimate_route          VARCHAR(20)         NOT NULL CONSTRAINT df_client_depot__estimate_route DEFAULT 'DEPOT',   -- DEPOT (client approves / forwards) or OWNER_ON_BEHALF (straight to the owner for the depot)
        bill_to_default         VARCHAR(15)         NOT NULL CONSTRAINT df_client_depot__bill_to DEFAULT 'CLIENT_DEPOT',   -- CLIENT_DEPOT or OWNER
        owner_billing_allowed   BIT                 NOT NULL CONSTRAINT df_client_depot__owner_billing DEFAULT 0,   -- agreement lets the contractor bill the owner directly
        currency_code           CHAR(3)             NOT NULL,   -- billing currency agreed with the client
        tariff_schedule_id      UNIQUEIDENTIFIER    NULL,       -- ref gecko_revenue:tariff.schedule — contractor's rate card for this client
        tariff_schedule_no      VARCHAR(30)         NULL,
        contract_ref            NVARCHAR(60)        NULL,       -- service agreement number
        valid_from              DATE                NOT NULL,
        valid_to                DATE                NULL,       -- NULL = open-ended
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_client_depot__status DEFAULT 'DRAFT',   -- DRAFT, ACTIVE, SUSPENDED, ENDED
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_client_depot__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_client_depot__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_client_depot PRIMARY KEY CLUSTERED (client_depot_id),
        CONSTRAINT ck_client_depot__code CHECK (client_depot_code = UPPER(client_depot_code) COLLATE Latin1_General_100_CS_AS AND client_depot_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_client_depot__locode CHECK (un_locode IS NULL OR un_locode = UPPER(un_locode) COLLATE Latin1_General_100_CS_AS AND un_locode LIKE '[A-Z][A-Z][A-Z2-9][A-Z2-9][A-Z2-9]'),
        CONSTRAINT ck_client_depot__country CHECK (country_code LIKE '[A-Z][A-Z]'),
        CONSTRAINT ck_client_depot__tz CHECK (time_zone_id LIKE '%/%' OR time_zone_id = 'UTC'),
        CONSTRAINT ck_client_depot__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        -- Intake: each channel carries exactly its own reference.
        CONSTRAINT ck_client_depot__intake CHECK (intake_channel IN ('CONNECTOR','PORTAL','EMAIL')),
        CONSTRAINT ck_client_depot__intake_connector CHECK ((intake_channel = 'CONNECTOR' AND intake_connector_id IS NOT NULL) OR (intake_channel <> 'CONNECTOR' AND intake_connector_id IS NULL)),
        CONSTRAINT ck_client_depot__intake_email CHECK ((intake_channel = 'EMAIL' AND intake_email IS NOT NULL) OR (intake_channel <> 'EMAIL' AND intake_email IS NULL)),
        CONSTRAINT ck_client_depot__intake_email_format CHECK (intake_email IS NULL OR (intake_email LIKE '%_@_%._%' AND intake_email NOT LIKE '% %')),
        -- Status report: each channel carries exactly its own reference.
        CONSTRAINT ck_client_depot__report CHECK (report_channel IN ('CONNECTOR','WEBHOOK','EMAIL','PORTAL','NONE')),
        CONSTRAINT ck_client_depot__report_connector CHECK ((report_channel = 'CONNECTOR' AND report_connector_id IS NOT NULL) OR (report_channel <> 'CONNECTOR' AND report_connector_id IS NULL)),
        CONSTRAINT ck_client_depot__report_webhook CHECK ((report_channel = 'WEBHOOK' AND report_webhook_subscription_id IS NOT NULL) OR (report_channel <> 'WEBHOOK' AND report_webhook_subscription_id IS NULL)),
        CONSTRAINT ck_client_depot__report_emails CHECK ((report_channel = 'EMAIL' AND report_emails_json IS NOT NULL) OR (report_channel <> 'EMAIL' AND report_emails_json IS NULL)),
        CONSTRAINT ck_client_depot__json CHECK ((report_emails_json IS NULL OR ISJSON(report_emails_json) = 1) AND (report_event_types_json IS NULL OR ISJSON(report_event_types_json) = 1)),
        -- Commercial terms.
        CONSTRAINT ck_client_depot__estimate_route CHECK (estimate_route IN ('DEPOT','OWNER_ON_BEHALF')),
        CONSTRAINT ck_client_depot__bill_to CHECK (bill_to_default IN ('CLIENT_DEPOT','OWNER')),
        CONSTRAINT ck_client_depot__owner_billing CHECK (bill_to_default = 'CLIENT_DEPOT' OR owner_billing_allowed = 1),
        CONSTRAINT ck_client_depot__schedule_pair CHECK ((tariff_schedule_id IS NULL AND tariff_schedule_no IS NULL) OR (tariff_schedule_id IS NOT NULL AND tariff_schedule_no IS NOT NULL)),
        CONSTRAINT ck_client_depot__validity CHECK (valid_to IS NULL OR valid_to >= valid_from),
        CONSTRAINT ck_client_depot__status CHECK (status IN ('DRAFT','ACTIVE','SUSPENDED','ENDED')),
        CONSTRAINT ck_client_depot__ended CHECK (status <> 'ENDED' OR valid_to IS NOT NULL)
    );
    -- One live client depot per branch: a record's client depot is found through its branch_id.
    CREATE UNIQUE NONCLUSTERED INDEX uq_client_depot__branch
        ON config.client_depot (tenant_id, branch_id) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_client_depot__code
        ON config.client_depot (tenant_id, client_depot_code) WHERE deleted_at IS NULL;
    -- A mailbox alias routes to exactly one client depot of one tenant (the mail router
    -- resolves it before any tenant context exists), so it is unique across tenants.
    CREATE UNIQUE NONCLUSTERED INDEX uq_client_depot__intake_email
        ON config.client_depot (intake_email) WHERE intake_email IS NOT NULL AND deleted_at IS NULL;
    -- Client list / "which sites do we serve for this client".
    CREATE NONCLUSTERED INDEX ix_client_depot__client
        ON config.client_depot (tenant_id, client_party_id, status) INCLUDE (branch_id, client_depot_code, depot_name) WHERE deleted_at IS NULL;
    -- Routing an inbound WORK_REQUESTED from a connector to its client depot.
    CREATE NONCLUSTERED INDEX ix_client_depot__intake_connector
        ON config.client_depot (tenant_id, intake_connector_id) INCLUDE (branch_id, status) WHERE intake_connector_id IS NOT NULL AND deleted_at IS NULL;
    -- Contract expiry reminders.
    CREATE NONCLUSTERED INDEX ix_client_depot__validity
        ON config.client_depot (tenant_id, valid_to) INCLUDE (client_depot_code, status) WHERE valid_to IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'config', @table = 'client_depot';
END
GO

EXEC dbo.usp_record_script '20_client_depot.sql', N'config: client_depot (contractor mode, one per branch; intake CONNECTOR/PORTAL/EMAIL, status report CONNECTOR/WEBHOOK/EMAIL/PORTAL/NONE, estimate route, bill-to client depot or owner when allowed, rate card, contract validity). Tenant kind = config.repair_setting REPAIR_TENANT_KIND; no identity change, no existing table altered';
GO

PRINT '>> 20_client_depot.sql completed.';
GO
