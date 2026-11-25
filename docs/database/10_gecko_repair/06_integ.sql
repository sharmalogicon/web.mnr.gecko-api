-- ============================================================
-- GECKO REPAIR (M&R) — INTEGRATION HUB (P2)
-- Script: 06_integ.sql
--
-- The hub through which Repair talks to systems it does not own (decisions G3,
-- G4; doc 05 §5–7): external TOS / depot platforms (Navis N4, OPUS,
-- ContainerChain, TideWorks, generic REST / webhook / SFTP-CSV), PortHub, the
-- EDI service for EDIFACT, and the customers' own webhooks and API clients.
-- Connector WORKERS run in the Gecko.Repair.Connectors host; they only read and
-- write these tables (and call the Repair application services) — the core
-- never knows which vendor is on the other side.
--
--   integ.connector             one configured link (kind, direction, endpoint, credential REFERENCE, schedule)
--   integ.connector_health      its runtime state (health, failures, poll cursor) — kept out of
--                               the temporal connector row so polling does not flood history
--   integ.code_map              external <-> Gecko codes per connector (or tenant-wide)
--   integ.inbound_event         canonical inbound events, idempotent per (connector, external id)   P
--   integ.outbound_event        canonical outbound events, one row per target, with retry / lease    P
--   integ.delivery_log          every transport attempt, both directions (append-only)               A, P
--   integ.webhook_subscription  customer webhook endpoints (secret REFERENCE, event filter)
--   integ.api_client            system API clients (OAuth2 client registered in gecko_identity)
--
-- SECRETS NEVER LIVE HERE. credential_ref / secret_ref hold the NAME of a Key
-- Vault secret; the worker resolves it at run time.
--
-- inbound_event / outbound_event are WORK RECORDS: their payload is written once
-- and never changed (column-level DENY UPDATE below); only status, attempt and
-- result columns move. They have no soft delete (a work record that "disappears"
-- would hide a lost message) and are partitioned monthly for archival.
--
-- Event type codes use a FORMAT check: the canonical catalogue (doc 05 §6)
-- grows, and the additive-only rule forbids changing a CHECK list.
--   in : EQUIPMENT_GATE_IN, EQUIPMENT_GATE_OUT, EQUIPMENT_SURVEYED, CONDITION_CHANGED,
--        HOLD_PLACED, HOLD_RELEASED, RELEASE_REQUESTED, WORK_REQUESTED, PARTY_UPSERTED,
--        CONTAINER_UPSERTED
--   out: CASE_OPENED, ESTIMATE_SUBMITTED, ESTIMATE_APPROVED, ESTIMATE_REJECTED,
--        REPAIR_COMPLETED, CONDITION_CHANGE_REQUESTED, HOLD_PLACE_REQUESTED,
--        HOLD_RELEASE_REQUESTED, CLEANING_COMPLETED, PTI_COMPLETED, CHARGES_READY
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Known connector kinds (validated by the Repair module): GECKO_TOS, PORTHUB,
-- NAVIS_N4, OPUS, CONTAINERCHAIN, TIDEWORKS, GENERIC_REST, WEBHOOK_IN, SFTP_CSV,
-- EDIFACT_VIA_EDI, CHARGE_EXPORT_CSV, ERP_REST.

-- @table   integ.connector
-- @purpose One configured link between a tenant (optionally one depot) and an outside system: what kind it is, which way data flows, where it connects, which Key Vault secret it authenticates with, how often it polls and which code-map profile it uses.
-- @vector  none — new (G3)
-- @owner   R18 Integration Hub
-- @flags   T
-- @phase   2
IF OBJECT_ID('integ.connector') IS NULL
BEGIN
    CREATE TABLE integ.connector (
        connector_id            UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_connector__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,       -- the depot it serves; NULL = every depot of the tenant
        connector_code          VARCHAR(30)         NOT NULL,   -- short unique name, e.g. N4_LCB, CC_SGP, HAULIER_CSV
        name                    NVARCHAR(200)       NOT NULL,
        connector_kind          VARCHAR(30)         NOT NULL,   -- catalogue above
        direction               VARCHAR(4)          NOT NULL,   -- IN, OUT, BOTH
        environment             VARCHAR(10)         NOT NULL CONSTRAINT df_connector__env DEFAULT 'TEST',   -- TEST, PRODUCTION
        endpoint_url            NVARCHAR(400)       NULL,       -- base URL / SFTP host; NULL for in-process kinds (GECKO_TOS, PORTHUB)
        auth_kind               VARCHAR(20)         NOT NULL CONSTRAINT df_connector__auth DEFAULT 'NONE',   -- NONE, API_KEY, BASIC, OAUTH2_CLIENT, HMAC, SFTP_KEY, MTLS
        credential_ref          NVARCHAR(200)       NULL,       -- Key Vault secret NAME (never the secret)
        schedule_cron           VARCHAR(60)         NULL,       -- pollers / file drops: when to run (UTC)
        poll_interval_seconds   INT                 NULL,       -- alternative to cron for near-real-time polling
        source_time_zone        VARCHAR(50)         NULL,       -- IANA zone the source sends local times in, when it sends no offset
        mapping_profile_code    VARCHAR(40)         NULL,       -- vendor mapping profile in the connector SDK, e.g. NAVIS_N4_V3
        event_types_json        NVARCHAR(2000)      NULL,       -- JSON array of canonical event types it carries; NULL = all of its kind
        settings_json           NVARCHAR(MAX)       NULL,       -- kind-specific settings (file pattern, page size, facility id ...)
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_connector__status DEFAULT 'DRAFT',   -- DRAFT, ACTIVE, PAUSED, DISABLED
        activated_at            DATETIMEOFFSET(7)   NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_connector__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_connector__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_connector PRIMARY KEY CLUSTERED (connector_id),
        CONSTRAINT ck_connector__code CHECK (connector_code = UPPER(connector_code) COLLATE Latin1_General_100_CS_AS AND connector_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_connector__kind CHECK (connector_kind = UPPER(connector_kind) COLLATE Latin1_General_100_CS_AS AND connector_kind NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_connector__direction CHECK (direction IN ('IN','OUT','BOTH')),
        CONSTRAINT ck_connector__env CHECK (environment IN ('TEST','PRODUCTION')),
        CONSTRAINT ck_connector__auth CHECK (auth_kind IN ('NONE','API_KEY','BASIC','OAUTH2_CLIENT','HMAC','SFTP_KEY','MTLS')),
        -- Anything that authenticates names its Key Vault secret.
        CONSTRAINT ck_connector__credential CHECK (auth_kind = 'NONE' OR credential_ref IS NOT NULL),
        CONSTRAINT ck_connector__url CHECK (endpoint_url IS NULL OR endpoint_url LIKE 'https://%' OR endpoint_url LIKE 'sftp://%'),
        CONSTRAINT ck_connector__poll CHECK (poll_interval_seconds IS NULL OR poll_interval_seconds BETWEEN 15 AND 86400),
        CONSTRAINT ck_connector__json CHECK ((event_types_json IS NULL OR ISJSON(event_types_json) = 1) AND (settings_json IS NULL OR ISJSON(settings_json) = 1)),
        CONSTRAINT ck_connector__status CHECK (status IN ('DRAFT','ACTIVE','PAUSED','DISABLED')),
        CONSTRAINT ck_connector__activated CHECK (status = 'DRAFT' OR activated_at IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_connector__code
        ON integ.connector (tenant_id, connector_code) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_connector__active
        ON integ.connector (status, connector_kind) INCLUDE (tenant_id, branch_id) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'integ', @table = 'connector';
END
GO

-- @table   integ.connector_health
-- @purpose The runtime state of one connector: health, last success and failure, consecutive failures and the poll cursor (watermark) a polling worker resumes from. Changes every run, so it is not temporal.
-- @vector  none — new
-- @owner   R18 Integration Hub
-- @flags   -
-- @phase   2
IF OBJECT_ID('integ.connector_health') IS NULL
BEGIN
    CREATE TABLE integ.connector_health (
        connector_health_id     UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_connector_health__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        connector_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref integ.connector (1:1)
        health_status           VARCHAR(10)         NOT NULL CONSTRAINT df_connector_health__status DEFAULT 'UNKNOWN',   -- UNKNOWN, HEALTHY, DEGRADED, DOWN
        last_run_at             DATETIMEOFFSET(7)   NULL,
        last_success_at         DATETIMEOFFSET(7)   NULL,
        last_failure_at         DATETIMEOFFSET(7)   NULL,
        last_error_text         NVARCHAR(2000)      NULL,
        consecutive_failures    INT                 NOT NULL CONSTRAINT df_connector_health__failures DEFAULT 0,
        poll_cursor             NVARCHAR(400)       NULL,       -- source watermark (timestamp, sequence or file name) to resume from
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_connector_health__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_connector_health__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_connector_health PRIMARY KEY CLUSTERED (connector_health_id),
        CONSTRAINT ck_connector_health__status CHECK (health_status IN ('UNKNOWN','HEALTHY','DEGRADED','DOWN')),
        CONSTRAINT ck_connector_health__failures CHECK (consecutive_failures >= 0)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_connector_health__connector
        ON integ.connector_health (tenant_id, connector_id);
END
GO

-- @table   integ.code_map
-- @purpose One translation between an outside system's code and the Gecko code for a domain (condition, grade, damage, repair, location, component, ISO type, party, hold, charge ...), for one connector or tenant-wide, in one or both directions.
-- @vector  none — new (G3)
-- @owner   R18 Integration Hub
-- @flags   T
-- @phase   2
IF OBJECT_ID('integ.code_map') IS NULL
BEGIN
    CREATE TABLE integ.code_map (
        code_map_id             UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_code_map__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        connector_id            UNIQUEIDENTIFIER    NULL,       -- ref integ.connector; NULL = tenant-wide default for every connector
        domain                  VARCHAR(20)         NOT NULL,   -- CONDITION, GRADE, DAMAGE, REPAIR, LOCATION, COMPONENT, ISO_TYPE, PARTY, HOLD, CHARGE, MOVE_MODE, EVENT_TYPE ...
        direction               VARCHAR(4)          NOT NULL CONSTRAINT df_code_map__direction DEFAULT 'BOTH',   -- IN (external -> Gecko), OUT, BOTH
        external_code           NVARCHAR(100)       NOT NULL,   -- as the outside system writes it
        gecko_code              VARCHAR(40)         NOT NULL,   -- Gecko code (master data code, party code ...)
        gecko_id                UNIQUEIDENTIFIER    NULL,       -- id beside the code when it is a row in another database (party, charge code)
        description             NVARCHAR(200)       NULL,
        is_active               BIT                 NOT NULL CONSTRAINT df_code_map__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_code_map__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_code_map__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_code_map PRIMARY KEY CLUSTERED (code_map_id),
        CONSTRAINT ck_code_map__domain CHECK (domain = UPPER(domain) COLLATE Latin1_General_100_CS_AS AND domain NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_code_map__direction CHECK (direction IN ('IN','OUT','BOTH'))
    );
    -- Reading IN: one Gecko code per external code. Writing OUT: one external code per Gecko code.
    CREATE UNIQUE NONCLUSTERED INDEX uq_code_map__in
        ON integ.code_map (tenant_id, connector_id, domain, external_code) WHERE direction IN ('IN','BOTH') AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_code_map__out
        ON integ.code_map (tenant_id, connector_id, domain, gecko_code) WHERE direction IN ('OUT','BOTH') AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'integ', @table = 'code_map';
END
GO

-- @table   integ.inbound_event
-- @purpose One fact received from an outside system: the raw message as received, its canonical form after mapping, and where it is in processing (received, mapped, applied, exception, ignored). Idempotent per connector and external id.
-- @vector  none — new (G3)
-- @owner   R18 Integration Hub
-- @flags   P
-- @phase   2
IF OBJECT_ID('integ.inbound_event') IS NULL
BEGIN
    CREATE TABLE integ.inbound_event (
        inbound_event_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_inbound_event__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,       -- depot, once known (from the connector or the mapped message)
        connector_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref integ.connector
        event_type              VARCHAR(40)         NOT NULL,   -- canonical type (header catalogue); UNKNOWN until mapped
        external_event_id       VARCHAR(200)        NOT NULL,   -- the source's id for the fact (message id, EIR no, file name + row): the idempotency key
        container_no            VARCHAR(11)         NULL,       -- for search and the exception screen
        occurred_at             DATETIMEOFFSET(7)   NULL,       -- when it happened at the source (offset from the source or the connector's source_time_zone)
        received_at             DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_inbound_event__received_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        raw_content_type        VARCHAR(60)         NULL,       -- application/json, text/csv, application/edifact ...
        raw_payload             NVARCHAR(MAX)       NULL,       -- the message as received (small messages)
        raw_blob_uri            NVARCHAR(400)       NULL,       -- large files kept in blob storage instead
        canonical_json          NVARCHAR(MAX)       NULL,       -- the mapped canonical event (set at MAPPED)
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_inbound_event__status DEFAULT 'RECEIVED',   -- RECEIVED, MAPPED, APPLIED, EXCEPTION, IGNORED
        status_at               DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_inbound_event__status_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        attempt_count           INT                 NOT NULL CONSTRAINT df_inbound_event__attempts DEFAULT 0,
        exception_code          VARCHAR(40)         NULL,       -- UNMAPPED_CODE, UNKNOWN_CONTAINER, NO_VISIT, OUT_OF_ORDER, INVALID ...
        exception_text          NVARCHAR(2000)      NULL,
        applied_aggregate_type  VARCHAR(30)         NULL,       -- EQUIPMENT_VISIT, REPAIR_CASE, DEPOT_HOLD ... what it changed
        applied_aggregate_id    UNIQUEIDENTIFIER    NULL,
        resolved_by             UNIQUEIDENTIFIER    NULL,       -- user who replayed or ignored an exception
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_inbound_event__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_inbound_event PRIMARY KEY NONCLUSTERED (inbound_event_id) ON [PRIMARY],
        CONSTRAINT ck_inbound_event__type CHECK (event_type = UPPER(event_type) COLLATE Latin1_General_100_CS_AS AND event_type NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_inbound_event__raw CHECK (raw_payload IS NOT NULL OR raw_blob_uri IS NOT NULL),
        CONSTRAINT ck_inbound_event__canonical CHECK (canonical_json IS NULL OR ISJSON(canonical_json) = 1),
        CONSTRAINT ck_inbound_event__status CHECK (status IN ('RECEIVED','MAPPED','APPLIED','EXCEPTION','IGNORED')),
        CONSTRAINT ck_inbound_event__mapped CHECK (status IN ('RECEIVED','EXCEPTION','IGNORED') OR canonical_json IS NOT NULL),
        CONSTRAINT ck_inbound_event__exception CHECK (status <> 'EXCEPTION' OR exception_code IS NOT NULL),
        CONSTRAINT ck_inbound_event__applied CHECK ((applied_aggregate_type IS NULL AND applied_aggregate_id IS NULL) OR (applied_aggregate_type IS NOT NULL AND applied_aggregate_id IS NOT NULL))
    ) ON ps_month (received_at);
    CREATE CLUSTERED INDEX cx_inbound_event ON integ.inbound_event (received_at, inbound_event_id) ON ps_month (received_at);
    -- Idempotency: the same fact from the same connector is stored once (not partition-aligned on purpose).
    CREATE UNIQUE NONCLUSTERED INDEX uq_inbound_event__external
        ON integ.inbound_event (tenant_id, connector_id, external_event_id) ON [PRIMARY];
    CREATE NONCLUSTERED INDEX ix_inbound_event__work
        ON integ.inbound_event (status, received_at) INCLUDE (tenant_id, connector_id, event_type)
        WHERE status IN ('RECEIVED','MAPPED','EXCEPTION') ON [PRIMARY];
    CREATE NONCLUSTERED INDEX ix_inbound_event__container
        ON integ.inbound_event (tenant_id, container_no, received_at) WHERE container_no IS NOT NULL ON [PRIMARY];
END
GO

-- @table   integ.outbound_event
-- @purpose One canonical event Repair must deliver to one target (a connector or a customer webhook): payload, delivery status, attempts and retry time, lease, and the target's acknowledgement.
-- @vector  none — new (G3, G4)
-- @owner   R18 Integration Hub
-- @flags   P
-- @phase   2
IF OBJECT_ID('integ.outbound_event') IS NULL
BEGIN
    CREATE TABLE integ.outbound_event (
        outbound_event_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_outbound_event__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,
        target_kind             VARCHAR(10)         NOT NULL,   -- CONNECTOR or WEBHOOK
        connector_id            UNIQUEIDENTIFIER    NULL,       -- ref integ.connector (CONNECTOR)
        webhook_subscription_id UNIQUEIDENTIFIER    NULL,       -- ref integ.webhook_subscription (WEBHOOK)
        event_type              VARCHAR(40)         NOT NULL,   -- canonical type (header catalogue)
        aggregate_type          VARCHAR(30)         NOT NULL,   -- REPAIR_CASE, ESTIMATE, DEPOT_HOLD, WORK_ORDER, CHARGE_RELEASE ...
        aggregate_id            UNIQUEIDENTIFIER    NOT NULL,
        aggregate_ref           VARCHAR(40)         NULL,       -- document number for people (case no, EOR no)
        container_no            VARCHAR(11)         NULL,
        dedupe_key              VARCHAR(120)        NOT NULL,   -- same business change -> same key (e.g. estimate id + revision + status): written once per target
        payload_json            NVARCHAR(MAX)       NOT NULL,   -- canonical payload, versioned (api v1)
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_outbound_event__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_outbound_event__status DEFAULT 'READY',   -- READY, SENDING, SENT, ACKED, FAILED, CANCELLED
        attempt_count           INT                 NOT NULL CONSTRAINT df_outbound_event__attempts DEFAULT 0,
        max_attempts            INT                 NOT NULL CONSTRAINT df_outbound_event__max_attempts DEFAULT 8,
        next_attempt_at         DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_outbound_event__next_attempt DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        locked_until            DATETIMEOFFSET(7)   NULL,       -- worker lease
        locked_by               VARCHAR(100)        NULL,
        sent_at                 DATETIMEOFFSET(7)   NULL,
        acked_at                DATETIMEOFFSET(7)   NULL,
        external_ref            VARCHAR(200)        NULL,       -- id the target returned
        last_error              NVARCHAR(2000)      NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_outbound_event__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_outbound_event PRIMARY KEY NONCLUSTERED (outbound_event_id) ON [PRIMARY],
        CONSTRAINT ck_outbound_event__target CHECK ((target_kind = 'CONNECTOR' AND connector_id IS NOT NULL AND webhook_subscription_id IS NULL)
            OR (target_kind = 'WEBHOOK' AND webhook_subscription_id IS NOT NULL AND connector_id IS NULL)),
        CONSTRAINT ck_outbound_event__type CHECK (event_type = UPPER(event_type) COLLATE Latin1_General_100_CS_AS AND event_type NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_outbound_event__payload CHECK (ISJSON(payload_json) = 1),
        CONSTRAINT ck_outbound_event__status CHECK (status IN ('READY','SENDING','SENT','ACKED','FAILED','CANCELLED')),
        CONSTRAINT ck_outbound_event__attempts CHECK (attempt_count >= 0 AND max_attempts BETWEEN 1 AND 50),
        CONSTRAINT ck_outbound_event__sent CHECK (status NOT IN ('SENT','ACKED') OR sent_at IS NOT NULL)
    ) ON ps_month (created_at);
    CREATE CLUSTERED INDEX cx_outbound_event ON integ.outbound_event (created_at, outbound_event_id) ON ps_month (created_at);
    CREATE UNIQUE NONCLUSTERED INDEX uq_outbound_event__dedupe
        ON integ.outbound_event (tenant_id, target_kind, connector_id, webhook_subscription_id, dedupe_key) ON [PRIMARY];
    -- The workers' only query: what is due.
    CREATE NONCLUSTERED INDEX ix_outbound_event__due
        ON integ.outbound_event (next_attempt_at, created_at) INCLUDE (tenant_id, target_kind, connector_id, webhook_subscription_id, locked_until)
        WHERE status IN ('READY','SENDING') ON [PRIMARY];
    CREATE NONCLUSTERED INDEX ix_outbound_event__aggregate
        ON integ.outbound_event (tenant_id, aggregate_type, aggregate_id) ON [PRIMARY];
END
GO

-- @table   integ.delivery_log
-- @purpose One transport attempt in either direction (a poll, a file pick-up, a POST to a webhook, a call to a vendor API): when, outcome, HTTP status, duration and a short response summary. Never changed.
-- @vector  none — new
-- @owner   R18 Integration Hub
-- @flags   A, P
-- @phase   2
IF OBJECT_ID('integ.delivery_log') IS NULL
BEGIN
    CREATE TABLE integ.delivery_log (
        delivery_log_id         UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_delivery_log__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        direction               VARCHAR(3)          NOT NULL,   -- IN, OUT
        connector_id            UNIQUEIDENTIFIER    NULL,       -- ref integ.connector
        webhook_subscription_id UNIQUEIDENTIFIER    NULL,       -- ref integ.webhook_subscription
        inbound_event_id        UNIQUEIDENTIFIER    NULL,       -- ref integ.inbound_event (when the attempt produced / concerned one)
        outbound_event_id       UNIQUEIDENTIFIER    NULL,       -- ref integ.outbound_event
        attempt_no              INT                 NOT NULL CONSTRAINT df_delivery_log__attempt DEFAULT 1,
        outcome                 VARCHAR(10)         NOT NULL,   -- SUCCESS, FAILURE, TIMEOUT, REJECTED
        http_status             SMALLINT            NULL,
        duration_ms             INT                 NULL,
        items_count             INT                 NULL,       -- polls / files: how many records were read
        response_summary        NVARCHAR(1000)      NULL,       -- short, no personal data, no secrets
        worker_id               VARCHAR(100)        NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_delivery_log__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        CONSTRAINT pk_delivery_log PRIMARY KEY NONCLUSTERED (delivery_log_id) ON [PRIMARY],
        CONSTRAINT ck_delivery_log__direction CHECK (direction IN ('IN','OUT')),
        CONSTRAINT ck_delivery_log__target CHECK (connector_id IS NOT NULL OR webhook_subscription_id IS NOT NULL),
        CONSTRAINT ck_delivery_log__outcome CHECK (outcome IN ('SUCCESS','FAILURE','TIMEOUT','REJECTED')),
        CONSTRAINT ck_delivery_log__numbers CHECK (attempt_no >= 1 AND (duration_ms IS NULL OR duration_ms >= 0) AND (items_count IS NULL OR items_count >= 0))
    ) ON ps_month (created_at);
    CREATE CLUSTERED INDEX cx_delivery_log ON integ.delivery_log (created_at, delivery_log_id) ON ps_month (created_at);
    CREATE NONCLUSTERED INDEX ix_delivery_log__connector
        ON integ.delivery_log (tenant_id, connector_id, created_at) ON ps_month (created_at);
    EXEC dbo.usp_make_append_only @schema = 'integ', @table = 'delivery_log';
END
GO

-- @table   integ.webhook_subscription
-- @purpose One customer webhook endpoint: where Repair POSTs canonical events, which event types, the Key Vault name of the HMAC signing secret, and whether it is active or was disabled after repeated failures.
-- @vector  none — new (G4 plug-in kit)
-- @owner   R18 Integration Hub
-- @flags   T
-- @phase   2
IF OBJECT_ID('integ.webhook_subscription') IS NULL
BEGIN
    CREATE TABLE integ.webhook_subscription (
        webhook_subscription_id UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_webhook_subscription__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,       -- only events of this depot; NULL = all depots
        name                    NVARCHAR(100)       NOT NULL,
        endpoint_url            NVARCHAR(400)       NOT NULL,   -- https only
        secret_ref              NVARCHAR(200)       NOT NULL,   -- Key Vault secret NAME of the HMAC signing key (never the key)
        event_types_json        NVARCHAR(2000)      NOT NULL,   -- JSON array of canonical event types, e.g. ["ESTIMATE_APPROVED","REPAIR_COMPLETED"]
        api_version             VARCHAR(10)         NOT NULL CONSTRAINT df_webhook_subscription__version DEFAULT 'v1',
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_webhook_subscription__status DEFAULT 'ACTIVE',   -- ACTIVE, PAUSED, DISABLED
        disabled_reason         NVARCHAR(400)       NULL,       -- e.g. disabled after 8 consecutive failures
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_webhook_subscription__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_webhook_subscription__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_webhook_subscription PRIMARY KEY CLUSTERED (webhook_subscription_id),
        CONSTRAINT ck_webhook_subscription__url CHECK (endpoint_url LIKE 'https://%'),
        CONSTRAINT ck_webhook_subscription__events CHECK (ISJSON(event_types_json) = 1),
        CONSTRAINT ck_webhook_subscription__version CHECK (api_version LIKE 'v[0-9]%'),
        CONSTRAINT ck_webhook_subscription__status CHECK (status IN ('ACTIVE','PAUSED','DISABLED')),
        CONSTRAINT ck_webhook_subscription__disabled CHECK (status <> 'DISABLED' OR disabled_reason IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_webhook_subscription__name
        ON integ.webhook_subscription (tenant_id, name) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'integ', @table = 'webhook_subscription';
END
GO

-- @table   integ.api_client
-- @purpose One system client allowed to call the Repair public API (a customer TOS, ERP or partner app): its OAuth2 client id registered in gecko_identity, granted scopes, optional depot restriction and rate limit.
-- @vector  none — new (G4 plug-in kit)
-- @owner   R18 Integration Hub
-- @flags   T
-- @phase   2
IF OBJECT_ID('integ.api_client') IS NULL
BEGIN
    CREATE TABLE integ.api_client (
        api_client_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_api_client__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        client_name             NVARCHAR(100)       NOT NULL,   -- e.g. Customer N4 integration
        identity_client_id      VARCHAR(100)        NOT NULL,   -- OAuth2 client id in gecko_identity (the secret lives there, hashed)
        scopes_json             NVARCHAR(2000)      NOT NULL,   -- JSON array, e.g. ["repair.visits.write","repair.cases.read"]
        allowed_branch_ids_json NVARCHAR(4000)      NULL,       -- JSON array of depot ids; NULL = every depot of the tenant
        rate_limit_per_minute   INT                 NOT NULL CONSTRAINT df_api_client__rate DEFAULT 600,
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_api_client__status DEFAULT 'ACTIVE',   -- ACTIVE, SUSPENDED, REVOKED
        expires_at              DATETIMEOFFSET(7)   NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_api_client__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_api_client__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_api_client PRIMARY KEY CLUSTERED (api_client_id),
        CONSTRAINT ck_api_client__scopes CHECK (ISJSON(scopes_json) = 1),
        CONSTRAINT ck_api_client__branches CHECK (allowed_branch_ids_json IS NULL OR ISJSON(allowed_branch_ids_json) = 1),
        CONSTRAINT ck_api_client__rate CHECK (rate_limit_per_minute BETWEEN 1 AND 100000),
        CONSTRAINT ck_api_client__status CHECK (status IN ('ACTIVE','SUSPENDED','REVOKED'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_api_client__identity
        ON integ.api_client (tenant_id, identity_client_id) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'integ', @table = 'api_client';
END
GO

-- ------------------------------------------------------------
-- Work records: the payload is written once. Only status / attempt / result
-- columns may change (column-level DENY beats the schema GRANT).
-- ------------------------------------------------------------
DENY UPDATE ON integ.inbound_event (tenant_id, connector_id, external_event_id, received_at, raw_content_type, raw_payload, raw_blob_uri) TO gecko_app;
DENY UPDATE ON integ.inbound_event (tenant_id, connector_id, external_event_id, received_at, raw_content_type, raw_payload, raw_blob_uri) TO gecko_system;
DENY UPDATE ON integ.outbound_event (tenant_id, target_kind, connector_id, webhook_subscription_id, event_type, aggregate_type, aggregate_id, dedupe_key, payload_json, created_at) TO gecko_app;
DENY UPDATE ON integ.outbound_event (tenant_id, target_kind, connector_id, webhook_subscription_id, event_type, aggregate_type, aggregate_id, dedupe_key, payload_json, created_at) TO gecko_system;
GO

EXEC dbo.usp_record_script '06_integ.sql', N'integ: connector (+ health), code_map, inbound_event (P, idempotent), outbound_event (P, per target, lease/retry), delivery_log (A, P), webhook_subscription, api_client; payload columns write-once';
GO

PRINT '>> 06_integ.sql completed.';
GO
