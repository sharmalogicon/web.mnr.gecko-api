-- ============================================================
-- GECKO REPAIR (M&R) — DEPOT PROFILE AND EQUIPMENT INTAKE (P2)
-- Script: 05_intake.sql
--
-- What makes Repair independent of any one yard system (decisions G1, G2, G5,
-- G7; doc 05 §3–4):
--
--   config.depot_profile   per depot (branch): where yard facts come from
--                          (GECKO_TOS, CONNECTOR, STANDALONE), how charges leave
--                          (GECKO_REVENUE, CHARGE_EXPORT), time zone, country,
--                          currency, language and dimension unit
--   intake.equipment_visit one stay of a container at a depot — Repair's OWN
--                          record, fed by the yard gateway adapter of the depot
--   intake.visit_event     every gate / condition / grade / hold / location fact
--                          applied to a visit, with the source event (append-only)
--   intake.depot_hold      M&R holds as Repair sees them, with the state of the
--                          mirror in the yard system (or Repair's own hold when
--                          the depot is STANDALONE)
--
-- No column here references gecko_tos except tos_container_visit_id, a soft
-- reference set only when the source is GECKO_TOS (adapter bookkeeping).
--
-- TIME: every *_at is DATETIMEOFFSET(7) stored with the DEPOT's local offset as
-- received (an external TOS sends local times); comparisons are on the instant.
-- The depot time zone (IANA id) is in depot_profile for display and for
-- branch-local numbering.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   config.depot_profile
-- @purpose How one depot (branch) runs Repair: its yard source (Gecko TOS, a connector to another TOS, or Repair's own light register), billing mode (Gecko Revenue or charge export), and its locale (time zone, country, currency, language, cm / inch).
-- @vector  none — new (G2, G5, G7)
-- @owner   R17 Intake
-- @flags   T
-- @phase   2
IF OBJECT_ID('config.depot_profile') IS NULL
BEGIN
    CREATE TABLE config.depot_profile (
        depot_profile_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_depot_profile__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_identity:tenant.branch (the depot)
        branch_code             VARCHAR(30)         NOT NULL,   -- code of the above
        yard_source             VARCHAR(20)         NOT NULL,   -- GECKO_TOS, CONNECTOR, STANDALONE: which yard gateway adapter serves the depot
        yard_connector_id       UNIQUEIDENTIFIER    NULL,       -- ref integ.connector — required when yard_source = CONNECTOR
        billing_mode            VARCHAR(20)         NOT NULL CONSTRAINT df_depot_profile__billing DEFAULT 'GECKO_REVENUE',   -- GECKO_REVENUE (invoices in Gecko) or CHARGE_EXPORT (priced charges to the customer's ERP / TOS billing)
        charge_export_connector_id UNIQUEIDENTIFIER NULL,       -- ref integ.connector — where exported charges go; NULL = file download only
        time_zone_id            VARCHAR(50)         NOT NULL,   -- IANA time zone, e.g. Asia/Bangkok, Asia/Ho_Chi_Minh
        country_code            CHAR(2)             NOT NULL,   -- ISO 3166-1, drives the country pack (tax, e-invoicing, holidays)
        currency_code           CHAR(3)             NOT NULL,   -- depot's operating currency (FX to other currencies in gecko_master)
        document_language       VARCHAR(10)         NOT NULL CONSTRAINT df_depot_profile__language DEFAULT 'en',   -- BCP 47 tag for printed documents: en, th, vi, id, ms, zh-Hans ...
        dimension_unit          VARCHAR(4)          NOT NULL CONSTRAINT df_depot_profile__unit DEFAULT 'CM',   -- how damage sizes are shown and entered: CM or INCH (stored in cm)
        is_active               BIT                 NOT NULL CONSTRAINT df_depot_profile__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_depot_profile__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_depot_profile__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_depot_profile PRIMARY KEY CLUSTERED (depot_profile_id),
        CONSTRAINT ck_depot_profile__yard_source CHECK (yard_source IN ('GECKO_TOS','CONNECTOR','STANDALONE')),
        -- A connector depot names its connector; the others do not.
        CONSTRAINT ck_depot_profile__yard_connector CHECK ((yard_source = 'CONNECTOR' AND yard_connector_id IS NOT NULL)
            OR (yard_source <> 'CONNECTOR' AND yard_connector_id IS NULL)),
        CONSTRAINT ck_depot_profile__billing CHECK (billing_mode IN ('GECKO_REVENUE','CHARGE_EXPORT')),
        CONSTRAINT ck_depot_profile__export_connector CHECK (billing_mode = 'CHARGE_EXPORT' OR charge_export_connector_id IS NULL),
        CONSTRAINT ck_depot_profile__country CHECK (country_code LIKE '[A-Z][A-Z]'),
        CONSTRAINT ck_depot_profile__currency CHECK (currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_depot_profile__language CHECK (document_language NOT LIKE '%[^A-Za-z0-9-]%'),
        CONSTRAINT ck_depot_profile__unit CHECK (dimension_unit IN ('CM','INCH')),
        CONSTRAINT ck_depot_profile__tz CHECK (time_zone_id LIKE '%/%' OR time_zone_id = 'UTC')
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_depot_profile__branch
        ON config.depot_profile (tenant_id, branch_id) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'config', @table = 'depot_profile';
END
GO

-- @table   intake.equipment_visit
-- @purpose One stay of a container at a depot as Repair knows it, whatever system reported it (Gecko TOS, an external TOS / depot platform, PortHub, Repair's own gate register or manual entry): in / out times, owner and line, full or empty, last known condition, grade and location.
-- @vector  none — new (G1; replaces the plan to reference gecko_tos yard.container_visit directly)
-- @owner   R17 Intake
-- @flags   T
-- @phase   2
IF OBJECT_ID('intake.equipment_visit') IS NULL
BEGIN
    CREATE TABLE intake.equipment_visit (
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_equipment_visit__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,   -- the depot
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container (created / upserted by intake when unknown)
        container_no            VARCHAR(11)         NOT NULL,   -- ISO 6346 number of the above
        iso_code                VARCHAR(4)          NULL,       -- size-type as reported at gate-in
        equipment_category      VARCHAR(10)         NULL,       -- DRY, REEFER, TANK ... (from the registry)
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party — box owner or lessor
        owner_party_code        VARCHAR(20)         NULL,
        line_party_id           UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party — liner / lessee that returned or will take the box
        line_party_code         VARCHAR(20)         NULL,
        source                  VARCHAR(20)         NOT NULL,   -- GECKO_TOS, CONNECTOR, PORTHUB, STANDALONE, MANUAL
        connector_id            UNIQUEIDENTIFIER    NULL,       -- ref integ.connector (CONNECTOR / PORTHUB sources)
        external_visit_ref      VARCHAR(80)         NULL,       -- the visit / EIR id in the source system
        tos_container_visit_id  UNIQUEIDENTIFIER    NULL,       -- ref gecko_tos:yard.container_visit — GECKO_TOS source only
        gate_in_no              VARCHAR(30)         NULL,       -- REPAIR_GIN number when Repair's own register took the gate-in (STANDALONE)
        in_at                   DATETIMEOFFSET(7)   NOT NULL,   -- gate-in, depot local offset
        in_mode                 VARCHAR(10)         NULL,       -- TRUCK, RAIL, VESSEL, BARGE, INTERNAL
        out_at                  DATETIMEOFFSET(7)   NULL,       -- gate-out
        out_mode                VARCHAR(10)         NULL,
        full_empty              CHAR(1)             NOT NULL CONSTRAINT df_equipment_visit__fe DEFAULT 'E',   -- F or E at gate-in
        condition_code          VARCHAR(10)         NULL,       -- last known condition (gecko_master conditions: AV, WW, CL, DM, UC, SC)
        grade_code              VARCHAR(10)         NULL,       -- last known grade (gecko_master grades)
        yard_location           NVARCHAR(40)        NULL,       -- last known position as text (block / bay / row / tier or area)
        release_ref             VARCHAR(40)         NULL,       -- booking / release order the box left on
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_equipment_visit__status DEFAULT 'IN_DEPOT',   -- IN_DEPOT, OUT, CANCELLED
        last_event_at           DATETIMEOFFSET(7)   NULL,       -- occurred_at of the latest applied visit_event (out-of-order facts are kept but do not move the projection back)
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline key from the phase 2 app (idempotent create)
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_equipment_visit__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_equipment_visit__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_equipment_visit PRIMARY KEY CLUSTERED (equipment_visit_id),
        CONSTRAINT ck_equipment_visit__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_equipment_visit__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_equipment_visit__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        CONSTRAINT ck_equipment_visit__line_pair CHECK ((line_party_id IS NULL AND line_party_code IS NULL) OR (line_party_id IS NOT NULL AND line_party_code IS NOT NULL)),
        CONSTRAINT ck_equipment_visit__source CHECK (source IN ('GECKO_TOS','CONNECTOR','PORTHUB','STANDALONE','MANUAL')),
        -- Source bookkeeping: a Gecko TOS visit id only from GECKO_TOS; a connector only from CONNECTOR / PORTHUB;
        -- a Repair gate-in number only from STANDALONE.
        CONSTRAINT ck_equipment_visit__tos_ref CHECK (tos_container_visit_id IS NULL OR source = 'GECKO_TOS'),
        CONSTRAINT ck_equipment_visit__connector CHECK ((source IN ('CONNECTOR','PORTHUB') AND connector_id IS NOT NULL)
            OR (source NOT IN ('CONNECTOR','PORTHUB') AND connector_id IS NULL)),
        CONSTRAINT ck_equipment_visit__gate_in_no CHECK (gate_in_no IS NULL OR source = 'STANDALONE'),
        CONSTRAINT ck_equipment_visit__modes CHECK ((in_mode IS NULL OR in_mode IN ('TRUCK','RAIL','VESSEL','BARGE','INTERNAL'))
            AND (out_mode IS NULL OR out_mode IN ('TRUCK','RAIL','VESSEL','BARGE','INTERNAL'))),
        CONSTRAINT ck_equipment_visit__fe CHECK (full_empty IN ('F','E')),
        CONSTRAINT ck_equipment_visit__status CHECK (status IN ('IN_DEPOT','OUT','CANCELLED')),
        CONSTRAINT ck_equipment_visit__out CHECK ((status = 'OUT' AND out_at IS NOT NULL) OR (status = 'IN_DEPOT' AND out_at IS NULL) OR status = 'CANCELLED'),
        CONSTRAINT ck_equipment_visit__times CHECK (out_at IS NULL OR out_at >= in_at)
    );
    -- A container is in one depot at a time, per tenant.
    CREATE UNIQUE NONCLUSTERED INDEX uq_equipment_visit__in_depot
        ON intake.equipment_visit (tenant_id, container_id) WHERE status = 'IN_DEPOT' AND deleted_at IS NULL;
    -- The same external visit never becomes two Repair visits (idempotent intake).
    CREATE UNIQUE NONCLUSTERED INDEX uq_equipment_visit__external
        ON intake.equipment_visit (tenant_id, source, connector_id, external_visit_ref) WHERE external_visit_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_equipment_visit__tos
        ON intake.equipment_visit (tenant_id, tos_container_visit_id) WHERE tos_container_visit_id IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_equipment_visit__client_ref
        ON intake.equipment_visit (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_equipment_visit__gate_in_no
        ON intake.equipment_visit (tenant_id, gate_in_no) WHERE gate_in_no IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_equipment_visit__container_no
        ON intake.equipment_visit (tenant_id, container_no, in_at DESC) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_equipment_visit__depot_status
        ON intake.equipment_visit (tenant_id, branch_id, status, in_at) INCLUDE (container_no, condition_code) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'intake', @table = 'equipment_visit';
END
GO

-- Known visit event types (validated by the Repair module; format check below
-- because the list grows with connectors): GATE_IN, GATE_OUT, CONDITION_CHANGED,
-- GRADE_CHANGED, HOLD_PLACED, HOLD_RELEASED, LOCATION_CHANGED, RELEASE_REQUESTED,
-- VISIT_CANCELLED, VISIT_CORRECTED.

-- @table   intake.visit_event
-- @purpose One fact applied to an equipment visit (gate in / out, condition, grade, hold, location, release request), when it happened at the source, and which inbound event or user it came from. Never changed: a correction is a new event.
-- @vector  none — new
-- @owner   R17 Intake
-- @flags   A
-- @phase   2
IF OBJECT_ID('intake.visit_event') IS NULL
BEGIN
    CREATE TABLE intake.visit_event (
        visit_event_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_visit_event__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref intake.equipment_visit
        event_type              VARCHAR(30)         NOT NULL,   -- catalogue above
        occurred_at             DATETIMEOFFSET(7)   NOT NULL,   -- when it happened at the source (depot local offset)
        source                  VARCHAR(20)         NOT NULL,   -- GECKO_TOS, CONNECTOR, PORTHUB, STANDALONE, MANUAL, REPAIR
        inbound_event_id        UNIQUEIDENTIFIER    NULL,       -- ref integ.inbound_event when it arrived through the hub
        source_event_ref        VARCHAR(100)        NULL,       -- id of the fact in the source (outbox message id, EIR no ...)
        payload_json            NVARCHAR(4000)      NULL,       -- the canonical fields of the fact (condition, grade, hold code, location ...)
        is_applied              BIT                 NOT NULL CONSTRAINT df_visit_event__applied DEFAULT 1,   -- 0 = recorded but older than the projection (out of order)
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_visit_event__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        CONSTRAINT pk_visit_event PRIMARY KEY CLUSTERED (visit_event_id),
        CONSTRAINT ck_visit_event__type CHECK (event_type = UPPER(event_type) COLLATE Latin1_General_100_CS_AS AND event_type NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_visit_event__source CHECK (source IN ('GECKO_TOS','CONNECTOR','PORTHUB','STANDALONE','MANUAL','REPAIR')),
        CONSTRAINT ck_visit_event__payload CHECK (payload_json IS NULL OR ISJSON(payload_json) = 1)
    );
    CREATE NONCLUSTERED INDEX ix_visit_event__visit
        ON intake.visit_event (tenant_id, equipment_visit_id, occurred_at);
    -- One fact from one source applied once.
    CREATE UNIQUE NONCLUSTERED INDEX uq_visit_event__source_ref
        ON intake.visit_event (tenant_id, source, source_event_ref, event_type) WHERE source_event_ref IS NOT NULL;
    EXEC dbo.usp_make_append_only @schema = 'intake', @table = 'visit_event';
END
GO

-- @table   intake.depot_hold
-- @purpose One M&R hold on a container visit (DAMAGE, CSC_EXP, CLEANING ...): who placed it and why, its release, and whether the hold is mirrored in the depot's yard system (or kept only here when the depot is STANDALONE).
-- @vector  none — new (G2: Gecko TOS holds via ITosRepairOutcome; external TOS via outbound HOLD_*_REQUESTED)
-- @owner   R17 Intake
-- @flags   T
-- @phase   2
IF OBJECT_ID('intake.depot_hold') IS NULL
BEGIN
    CREATE TABLE intake.depot_hold (
        depot_hold_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_depot_hold__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        equipment_visit_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref intake.equipment_visit
        container_no            VARCHAR(11)         NOT NULL,   -- copy for lists
        hold_code               VARCHAR(20)         NOT NULL,   -- gecko_master equipment.hold code: DAMAGE, CSC_EXP ...
        origin                  VARCHAR(10)         NOT NULL,   -- REPAIR (placed by M&R) or YARD (placed in the yard system, seen here)
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_depot_hold__status DEFAULT 'ACTIVE',   -- ACTIVE, RELEASED
        reason                  NVARCHAR(400)       NULL,
        placed_at               DATETIMEOFFSET(7)   NOT NULL,
        placed_by               UNIQUEIDENTIFIER    NULL,       -- user; NULL when placed by the yard system
        source_type             VARCHAR(20)         NULL,       -- REPAIR_CASE, SURVEY, UNIT_TEST: the M&R document that caused it
        source_id               UNIQUEIDENTIFIER    NULL,
        released_at             DATETIMEOFFSET(7)   NULL,
        released_by             UNIQUEIDENTIFIER    NULL,
        release_ref             VARCHAR(40)         NULL,       -- case / work order no. quoted on the release
        mirror_status           VARCHAR(12)         NOT NULL CONSTRAINT df_depot_hold__mirror DEFAULT 'NOT_NEEDED',   -- NOT_NEEDED (standalone), REQUESTED, CONFIRMED, FAILED
        mirror_outbound_event_id UNIQUEIDENTIFIER   NULL,       -- ref integ.outbound_event that carried the last request
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_depot_hold__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_depot_hold__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_depot_hold PRIMARY KEY CLUSTERED (depot_hold_id),
        CONSTRAINT ck_depot_hold__code CHECK (hold_code = UPPER(hold_code) COLLATE Latin1_General_100_CS_AS AND hold_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_depot_hold__origin CHECK (origin IN ('REPAIR','YARD')),
        CONSTRAINT ck_depot_hold__status CHECK (status IN ('ACTIVE','RELEASED')),
        CONSTRAINT ck_depot_hold__released CHECK ((status = 'ACTIVE' AND released_at IS NULL) OR (status = 'RELEASED' AND released_at IS NOT NULL)),
        CONSTRAINT ck_depot_hold__times CHECK (released_at IS NULL OR released_at >= placed_at),
        CONSTRAINT ck_depot_hold__source_pair CHECK ((source_type IS NULL AND source_id IS NULL) OR (source_type IS NOT NULL AND source_id IS NOT NULL)),
        CONSTRAINT ck_depot_hold__source_type CHECK (source_type IS NULL OR source_type IN ('REPAIR_CASE','SURVEY','UNIT_TEST')),
        CONSTRAINT ck_depot_hold__mirror CHECK (mirror_status IN ('NOT_NEEDED','REQUESTED','CONFIRMED','FAILED'))
    );
    -- One active hold of a kind per visit.
    CREATE UNIQUE NONCLUSTERED INDEX uq_depot_hold__active
        ON intake.depot_hold (tenant_id, equipment_visit_id, hold_code) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_depot_hold__mirror
        ON intake.depot_hold (tenant_id, mirror_status) WHERE mirror_status IN ('REQUESTED','FAILED') AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'intake', @table = 'depot_hold';
END
GO

EXEC dbo.usp_record_script '05_intake.sql', N'config.depot_profile (yard source, billing mode, locale), intake.equipment_visit (Repair-owned visit, idempotent per source), visit_event (append-only), depot_hold (with yard mirror state)';
GO

PRINT '>> 05_intake.sql completed.';
GO
