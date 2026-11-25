-- ============================================================
-- GECKO REPAIR (M&R) — SURVEYS AND INSPECTIONS (P3)
-- Script: 09_survey.sql
--
--   survey.survey         header: type, checklist version, surveyor(s), outcome,
--                         proposed condition / grade, status, signatures
--   survey.survey_item    one checklist answer (result, measurement, IICL verdict)
--   survey.survey_damage  one damage line (CEDEX codes or free description,
--                         dimensions in cm, responsibility, IICL verdict)
--
-- A COMPLETED survey is evidence in owner / lessor disputes: it is never edited.
-- A correction is a NEW survey that supersedes it (supersedes_survey_id); the
-- old one becomes SUPERSEDED. Lines are editable only while the survey is DRAFT
-- (enforced by the Repair module; temporal history on the header shows when).
--
-- INDEPENDENCE (G1): a gate survey taken in the yard system (Gecko TOS or an
-- external TOS) is COPIED in as a survey with source YARD_SYSTEM, its damage
-- lines keep source_damage_ref = the source line id. No gecko_tos reference.
--
-- Coding (decision Q8): global liners need CEDEX codes; small lessors may accept
-- a free-text description. So a damage line has a damage code OR a description
-- (CHECK); the owner profile (P4) decides which is required at submission.
-- Dimensions are stored in cm whatever the depot shows (depot_profile.dimension_unit).
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   survey.survey
-- @purpose One survey or inspection of a container (gate-in, off-hire, on-hire, periodic, PTI check): which checklist version, who surveyed (and the owner's surveyor on a joint survey), the outcome, proposed condition and grade, and whether it is draft, completed or superseded.
-- @vector  none — new (UI SurveyRecord)
-- @owner   R3 Survey
-- @flags   T
-- @phase   3
IF OBJECT_ID('survey.survey') IS NULL
BEGIN
    CREATE TABLE survey.survey (
        survey_id               UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_survey__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NOT NULL,
        survey_no               VARCHAR(30)         NOT NULL,   -- REPAIR_SUR series
        repair_case_id          UNIQUEIDENTIFIER    NULL,       -- ref mcase.repair_case; NULL = a sound box that never needed a case
        equipment_visit_id      UNIQUEIDENTIFIER    NULL,       -- ref intake.equipment_visit
        container_id            UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:equipment.container
        container_no            VARCHAR(11)         NOT NULL,
        iso_code                VARCHAR(4)          NULL,
        equipment_category      VARCHAR(10)         NOT NULL,
        survey_type_code        VARCHAR(40)         NOT NULL,   -- SURVEY_TYPE code list: GATE_IN, GATE_OUT, ON_HIRE, OFF_HIRE, PERIODIC, PRE_TRIP
        checklist_template_id   UNIQUEIDENTIFIER    NULL,       -- ref code.checklist_template (the exact version used)
        template_code           VARCHAR(30)         NULL,       -- copy: code + version of the above
        template_version        SMALLINT            NULL,
        source                  VARCHAR(12)         NOT NULL CONSTRAINT df_survey__source DEFAULT 'REPAIR',   -- REPAIR (done here) or YARD_SYSTEM (copied from the yard system's gate survey)
        source_survey_ref       VARCHAR(80)         NULL,       -- id of the survey in the yard system (YARD_SYSTEM)
        inbound_event_id        UNIQUEIDENTIFIER    NULL,       -- ref integ.inbound_event that carried it
        surveyor_user_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_identity user — the depot surveyor
        third_party_surveyor    NVARCHAR(100)       NULL,       -- independent surveyor name / company
        owner_surveyor_name     NVARCHAR(100)       NULL,       -- owner / lessor surveyor on a joint survey
        performed_at            DATETIMEOFFSET(7)   NULL,       -- when the box was inspected
        outcome                 VARCHAR(20)         NULL,       -- NO_DAMAGE, DAMAGED, CLEANING_ONLY, TOTAL_LOSS, INCONCLUSIVE
        proposed_condition_code VARCHAR(10)         NULL,       -- gecko_master condition: AV, WW, CL, DM, UC, SC
        proposed_grade_code     VARCHAR(10)         NULL,       -- gecko_master grade
        is_serviceable          BIT                 NULL,       -- surveyor's verdict; NULL while DRAFT
        status                  VARCHAR(12)         NOT NULL CONSTRAINT df_survey__status DEFAULT 'DRAFT',   -- DRAFT, COMPLETED, SUPERSEDED, CANCELLED
        completed_at            DATETIMEOFFSET(7)   NULL,
        supersedes_survey_id    UNIQUEIDENTIFIER    NULL,       -- ref survey.survey: the completed survey this one corrects
        surveyor_signature_attachment_id UNIQUEIDENTIFIER NULL, -- ref doc.attachment
        owner_signature_attachment_id    UNIQUEIDENTIFIER NULL, -- ref doc.attachment (joint survey)
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline key (phase 2 app)
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_survey__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_survey__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_survey PRIMARY KEY CLUSTERED (survey_id),
        CONSTRAINT ck_survey__container_no CHECK (container_no LIKE '[A-Z][A-Z][A-Z][A-Z][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
        CONSTRAINT ck_survey__category CHECK (equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_survey__template CHECK ((checklist_template_id IS NULL AND template_code IS NULL AND template_version IS NULL)
            OR (checklist_template_id IS NOT NULL AND template_code IS NOT NULL AND template_version IS NOT NULL)),
        CONSTRAINT ck_survey__source CHECK (source IN ('REPAIR','YARD_SYSTEM')),
        CONSTRAINT ck_survey__source_ref CHECK (source = 'REPAIR' OR source_survey_ref IS NOT NULL),
        CONSTRAINT ck_survey__outcome CHECK (outcome IS NULL OR outcome IN ('NO_DAMAGE','DAMAGED','CLEANING_ONLY','TOTAL_LOSS','INCONCLUSIVE')),
        CONSTRAINT ck_survey__status CHECK (status IN ('DRAFT','COMPLETED','SUPERSEDED','CANCELLED')),
        -- A completed (or later superseded) survey has its time, outcome and verdict.
        CONSTRAINT ck_survey__completed CHECK (status IN ('DRAFT','CANCELLED')
            OR (completed_at IS NOT NULL AND performed_at IS NOT NULL AND outcome IS NOT NULL AND is_serviceable IS NOT NULL)),
        CONSTRAINT ck_survey__not_self CHECK (supersedes_survey_id IS NULL OR supersedes_survey_id <> survey_id)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey__no
        ON survey.survey (tenant_id, survey_no) WHERE deleted_at IS NULL;
    -- A survey is superseded at most once (no forked corrections).
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey__supersedes
        ON survey.survey (tenant_id, supersedes_survey_id) WHERE supersedes_survey_id IS NOT NULL AND deleted_at IS NULL;
    -- A yard-system survey is copied in once.
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey__source_ref
        ON survey.survey (tenant_id, source, source_survey_ref) WHERE source_survey_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey__client_ref
        ON survey.survey (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_survey__case
        ON survey.survey (tenant_id, repair_case_id) WHERE repair_case_id IS NOT NULL AND deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_survey__container
        ON survey.survey (tenant_id, container_no, performed_at DESC) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_survey__list
        ON survey.survey (tenant_id, branch_id, status, created_at) INCLUDE (survey_no, container_no, survey_type_code) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'survey', @table = 'survey';
END
GO

-- @table   survey.survey_item
-- @purpose One answer to one checklist question in a survey: pass / fail / not applicable, the measurement taken, and the IICL verdict the server computed from it.
-- @vector  none — new (UI checklist[], not saved today)
-- @owner   R3 Survey
-- @flags   -
-- @phase   3
IF OBJECT_ID('survey.survey_item') IS NULL
BEGIN
    CREATE TABLE survey.survey_item (
        survey_item_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_survey_item__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        survey_id               UNIQUEIDENTIFIER    NOT NULL,   -- ref survey.survey
        checklist_item_id       UNIQUEIDENTIFIER    NOT NULL,   -- ref code.checklist_item (of the survey's template version)
        sequence_no             SMALLINT            NOT NULL,   -- copy of the question order
        result                  VARCHAR(4)          NULL,       -- PASS, FAIL, NA; NULL = not answered yet
        measurement_value       DECIMAL(9,2)        NULL,
        measurement_uom_code    VARCHAR(10)         NULL,       -- MM, CM, CM2, C, BAR (from the question)
        iicl_verdict            VARCHAR(15)         NULL,       -- ACCEPTABLE, MUST_REPAIR, NO_THRESHOLD — computed by the server, never typed
        notes                   NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_survey_item__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_survey_item__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_survey_item PRIMARY KEY CLUSTERED (survey_item_id),
        CONSTRAINT ck_survey_item__result CHECK (result IS NULL OR result IN ('PASS','FAIL','NA')),
        CONSTRAINT ck_survey_item__measure CHECK ((measurement_value IS NULL AND measurement_uom_code IS NULL)
            OR (measurement_value IS NOT NULL AND measurement_uom_code IN ('MM','CM','CM2','C','BAR'))),
        CONSTRAINT ck_survey_item__verdict CHECK (iicl_verdict IS NULL OR iicl_verdict IN ('ACCEPTABLE','MUST_REPAIR','NO_THRESHOLD'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey_item__question
        ON survey.survey_item (tenant_id, survey_id, checklist_item_id) WHERE deleted_at IS NULL;
END
GO

-- @table   survey.survey_damage
-- @purpose One damage line found in a survey: CEDEX location, component, damage and proposed repair (or a free description for owners that allow it), size in cm, quantity, whether it was there before, who is responsible, and the IICL verdict.
-- @vector  none — new (shape of the yard gate survey damage line)
-- @owner   R3 Survey
-- @flags   -
-- @phase   3
IF OBJECT_ID('survey.survey_damage') IS NULL
BEGIN
    CREATE TABLE survey.survey_damage (
        survey_damage_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_survey_damage__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        survey_id               UNIQUEIDENTIFIER    NOT NULL,   -- ref survey.survey
        line_no                 SMALLINT            NOT NULL,   -- also the number shown on the damage map
        survey_item_id          UNIQUEIDENTIFIER    NULL,       -- ref survey.survey_item when found on a checklist question
        damage_location_code    VARCHAR(10)         NULL,       -- CEDEX location (gecko_master equipment.damage_location)
        component_code          VARCHAR(20)         NULL,       -- CEDEX component
        damage_code             VARCHAR(10)         NULL,       -- CEDEX damage
        proposed_repair_code    VARCHAR(10)         NULL,       -- CEDEX repair (gecko_master equipment.repair_code)
        damage_description      NVARCHAR(500)       NULL,       -- free text (owners that allow DESCRIPTION, Q8)
        length_cm               DECIMAL(7,1)        NULL,
        width_cm                DECIMAL(7,1)        NULL,
        depth_cm                DECIMAL(7,1)        NULL,
        quantity                DECIMAL(9,2)        NOT NULL CONSTRAINT df_survey_damage__qty DEFAULT 1,
        is_pre_existing         BIT                 NOT NULL CONSTRAINT df_survey_damage__pre DEFAULT 0,   -- already there at the previous survey / on-hire
        responsibility          VARCHAR(12)         NULL,       -- OWNER, USER, DEPOT, THIRD_PARTY, INSURANCE, WARRANTY
        iicl_verdict            VARCHAR(15)         NULL,       -- ACCEPTABLE, MUST_REPAIR, NO_THRESHOLD (server-computed)
        source_damage_ref       VARCHAR(80)         NULL,       -- the line id in the yard system's gate survey (copied lines)
        remarks                 NVARCHAR(500)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_survey_damage__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_survey_damage__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_survey_damage PRIMARY KEY CLUSTERED (survey_damage_id),
        CONSTRAINT ck_survey_damage__line CHECK (line_no >= 1),
        -- Coded or described (Q8): never neither.
        CONSTRAINT ck_survey_damage__coded_or_described CHECK (damage_code IS NOT NULL OR damage_description IS NOT NULL),
        CONSTRAINT ck_survey_damage__dims CHECK ((length_cm IS NULL OR length_cm > 0) AND (width_cm IS NULL OR width_cm > 0) AND (depth_cm IS NULL OR depth_cm > 0)),
        CONSTRAINT ck_survey_damage__qty CHECK (quantity > 0),
        CONSTRAINT ck_survey_damage__responsibility CHECK (responsibility IS NULL OR responsibility IN ('OWNER','USER','DEPOT','THIRD_PARTY','INSURANCE','WARRANTY')),
        CONSTRAINT ck_survey_damage__verdict CHECK (iicl_verdict IS NULL OR iicl_verdict IN ('ACCEPTABLE','MUST_REPAIR','NO_THRESHOLD'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey_damage__line
        ON survey.survey_damage (tenant_id, survey_id, line_no) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_survey_damage__source_ref
        ON survey.survey_damage (tenant_id, survey_id, source_damage_ref) WHERE source_damage_ref IS NOT NULL AND deleted_at IS NULL;
END
GO

EXEC dbo.usp_record_script '09_survey.sql', N'survey: survey (versioned checklist, joint surveyor, outcome, supersede chain, yard-system copies by source ref), survey_item (IICL verdict), survey_damage (CEDEX or description, cm, responsibility)';
GO

PRINT '>> 09_survey.sql completed.';
GO
