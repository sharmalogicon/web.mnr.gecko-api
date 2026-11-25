-- ============================================================
-- GECKO REPAIR (M&R) — ATTACHMENTS AND DAMAGE MARKS (P3)
-- Script: 10_doc.sql
--
--   doc.attachment    metadata of a photo, signature, certificate or document;
--                     the file itself lives in blob storage (the volume driver)
--   doc.damage_mark   one mark on the 2D / 3D container damage map (R15)
--
-- ATTACHMENTS: blob_uri is the storage PATH (container/blob name), never a SAS
-- URL — read links are signed on demand by the API. sha256 lets the API refuse
-- a duplicate upload and proves a photo was not swapped after an estimate was
-- sent. Photos are never deleted from a submitted record: hide (hidden_at) keeps
-- them out of the owner PDF / portal with a reason. Photos may show people:
-- retention and access follow the tenant's privacy settings (G7, PDPA / GDPR).
--
-- DAMAGE MARKS: (face, x, y[, width, height | polygon]) normalised 0..1 with the
-- origin at the top-left of the face as drawn in the unfolded 2D view; 3D is
-- computed from code.model_face (origin, u, v, normal). One record serves 2D,
-- 3D, the estimate PDF and the mobile app. A mark names the exact model version
-- it was placed on. Marks are copied forward (gate -> survey -> estimate ->
-- work-order task) with source_mark_id, so each stage can move its own copy
-- without rewriting the evidence of the earlier stage.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Known attachment owner types (validated by the Repair module; format check):
--   SURVEY, SURVEY_DAMAGE, SURVEY_ITEM, REPAIR_CASE, ESTIMATE, ESTIMATE_LINE,
--   WORK_ORDER, WO_TASK, CLEANING_JOB, PTI_JOB, UNIT_TEST, MODIFICATION,
--   INCIDENT, VENDOR_BILL, EQUIPMENT_VISIT

-- @table   doc.attachment
-- @purpose One file attached to an M&R record (photo before / during / after, signature, certificate, estimate PDF, document): where it is stored, its type, size and hash, the photo angle and stage, who took it, when and where, and whether it is hidden from the owner.
-- @vector  none — new (UI photo placeholders)
-- @owner   R3 Survey
-- @flags   T
-- @phase   3
IF OBJECT_ID('doc.attachment') IS NULL
BEGIN
    CREATE TABLE doc.attachment (
        attachment_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_attachment__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,
        owner_type              VARCHAR(20)         NOT NULL,   -- catalogue above
        owner_id                UNIQUEIDENTIFIER    NOT NULL,   -- id of the owning record
        kind                    VARCHAR(15)         NOT NULL,   -- PHOTO, SIGNATURE, CERTIFICATE, ESTIMATE_PDF, DOCUMENT, VIDEO
        blob_uri                NVARCHAR(400)       NOT NULL,   -- storage path (container/blob), never a signed URL
        file_name               NVARCHAR(200)       NULL,
        content_type            VARCHAR(100)        NOT NULL,   -- image/jpeg, application/pdf ...
        size_bytes              BIGINT              NOT NULL,
        sha256                  CHAR(64)            NOT NULL,   -- hex hash of the file
        photo_angle             VARCHAR(20)         NULL,       -- DOOR, LEFT, RIGHT, FRONT, ROOF, FLOOR, UNDER, INTERIOR, CSC_PLATE, CLOSE_UP ... (checklist angles)
        stage                   VARCHAR(10)         NULL,       -- BEFORE, DURING, AFTER (repair evidence)
        caption                 NVARCHAR(400)       NULL,
        taken_at                DATETIMEOFFSET(7)   NULL,       -- from the device / EXIF
        taken_by                UNIQUEIDENTIFIER    NULL,
        latitude                DECIMAL(9,6)        NULL,
        longitude               DECIMAL(9,6)        NULL,
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline key (phase 2 app): idempotent upload
        hidden_at               DATETIMEOFFSET(7)   NULL,       -- hidden from owner PDF / portal (never deleted once submitted)
        hidden_by               UNIQUEIDENTIFIER    NULL,
        hidden_reason           NVARCHAR(200)       NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_attachment__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_attachment__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_attachment PRIMARY KEY CLUSTERED (attachment_id),
        CONSTRAINT ck_attachment__owner_type CHECK (owner_type = UPPER(owner_type) COLLATE Latin1_General_100_CS_AS AND owner_type NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_attachment__kind CHECK (kind IN ('PHOTO','SIGNATURE','CERTIFICATE','ESTIMATE_PDF','DOCUMENT','VIDEO')),
        CONSTRAINT ck_attachment__uri CHECK (blob_uri NOT LIKE '%?%'),   -- no query string = no SAS token stored
        CONSTRAINT ck_attachment__size CHECK (size_bytes > 0),
        CONSTRAINT ck_attachment__sha CHECK (sha256 NOT LIKE '%[^0-9a-f]%' COLLATE Latin1_General_100_CS_AS AND LEN(sha256) = 64),
        CONSTRAINT ck_attachment__angle CHECK (photo_angle IS NULL OR (photo_angle = UPPER(photo_angle) COLLATE Latin1_General_100_CS_AS AND photo_angle NOT LIKE '%[^A-Z0-9_]%')),
        CONSTRAINT ck_attachment__stage CHECK (stage IS NULL OR stage IN ('BEFORE','DURING','AFTER')),
        CONSTRAINT ck_attachment__geo CHECK ((latitude IS NULL AND longitude IS NULL)
            OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)),
        CONSTRAINT ck_attachment__hidden CHECK ((hidden_at IS NULL AND hidden_by IS NULL AND hidden_reason IS NULL)
            OR (hidden_at IS NOT NULL AND hidden_reason IS NOT NULL))
    );
    CREATE NONCLUSTERED INDEX ix_attachment__owner
        ON doc.attachment (tenant_id, owner_type, owner_id) INCLUDE (kind, photo_angle, stage, hidden_at) WHERE deleted_at IS NULL;
    -- The same file attached twice to the same record is refused.
    CREATE UNIQUE NONCLUSTERED INDEX uq_attachment__file
        ON doc.attachment (tenant_id, owner_type, owner_id, sha256) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_attachment__client_ref
        ON doc.attachment (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'doc', @table = 'attachment';
END
GO

-- @table   doc.damage_mark
-- @purpose One mark on the 2D / 3D damage map of a container, tied to a survey damage line, checklist answer, estimate line or work-order task: model version, face, position and shape in normalised face coordinates, the CEDEX location it falls in, and the mark it was copied from.
-- @vector  none — new (R15)
-- @owner   R15 Damage Map
-- @flags   T
-- @phase   3
IF OBJECT_ID('doc.damage_mark') IS NULL
BEGIN
    CREATE TABLE doc.damage_mark (
        damage_mark_id          UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_damage_mark__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        owner_type              VARCHAR(20)         NOT NULL,   -- SURVEY_DAMAGE, SURVEY_ITEM, ESTIMATE_LINE, WO_TASK
        owner_id                UNIQUEIDENTIFIER    NOT NULL,   -- id of that line
        container_model_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref code.container_model (the exact version)
        model_code              VARCHAR(20)         NOT NULL,   -- copy: code + version of the above
        model_version           SMALLINT            NOT NULL,
        face_code               VARCHAR(20)         NOT NULL,   -- LEFT, RIGHT, FRONT, DOOR, ROOF, FLOOR, UNDER, INTERIOR, MACHINERY
        shape                   VARCHAR(10)         NOT NULL,   -- POINT, RECT, POLYGON
        x                       DECIMAL(7,6)        NOT NULL,   -- POINT: the point; RECT: top-left; POLYGON: first vertex (0..1)
        y                       DECIMAL(7,6)        NOT NULL,
        width                   DECIMAL(7,6)        NULL,       -- RECT only
        height                  DECIMAL(7,6)        NULL,       -- RECT only
        points_json             NVARCHAR(2000)      NULL,       -- POLYGON only: [[x,y],[x,y],...] normalised
        is_interior             BIT                 NOT NULL CONSTRAINT df_damage_mark__interior DEFAULT 0,   -- on the inside surface of the face
        derived_location_code   VARCHAR(10)         NULL,       -- CEDEX location of the code.face_zone under the mark centre
        label_no                SMALLINT            NOT NULL,   -- number drawn on the map = line number of the owner
        source_mark_id          UNIQUEIDENTIFIER    NULL,       -- ref doc.damage_mark it was copied from (gate -> survey -> estimate -> task)
        source_damage_ref       VARCHAR(80)         NULL,       -- yard-system gate damage line it was auto-placed from (no mark existed there)
        input_mode              VARCHAR(5)          NOT NULL,   -- 2D, 3D, AUTO (auto-placed at the zone of a location code)
        client_ref              UNIQUEIDENTIFIER    NULL,       -- offline key (phase 2 app)
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_damage_mark__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_damage_mark__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_damage_mark PRIMARY KEY CLUSTERED (damage_mark_id),
        CONSTRAINT ck_damage_mark__owner_type CHECK (owner_type IN ('SURVEY_DAMAGE','SURVEY_ITEM','ESTIMATE_LINE','WO_TASK')),
        CONSTRAINT ck_damage_mark__face CHECK (face_code IN ('LEFT','RIGHT','FRONT','DOOR','ROOF','FLOOR','UNDER','INTERIOR','MACHINERY')),
        CONSTRAINT ck_damage_mark__shape CHECK (shape IN ('POINT','RECT','POLYGON')),
        CONSTRAINT ck_damage_mark__xy CHECK (x BETWEEN 0 AND 1 AND y BETWEEN 0 AND 1),
        -- Each shape carries exactly what it needs, and a rectangle stays on the face.
        CONSTRAINT ck_damage_mark__shape_data CHECK (
               (shape = 'POINT'   AND width IS NULL AND height IS NULL AND points_json IS NULL)
            OR (shape = 'RECT'    AND width > 0 AND height > 0 AND x + width <= 1 AND y + height <= 1 AND points_json IS NULL)
            OR (shape = 'POLYGON' AND width IS NULL AND height IS NULL AND points_json IS NOT NULL AND ISJSON(points_json) = 1)),
        CONSTRAINT ck_damage_mark__label CHECK (label_no >= 1),
        CONSTRAINT ck_damage_mark__input CHECK (input_mode IN ('2D','3D','AUTO')),
        CONSTRAINT ck_damage_mark__not_self CHECK (source_mark_id IS NULL OR source_mark_id <> damage_mark_id)
    );
    CREATE NONCLUSTERED INDEX ix_damage_mark__owner
        ON doc.damage_mark (tenant_id, owner_type, owner_id) WHERE deleted_at IS NULL;
    CREATE NONCLUSTERED INDEX ix_damage_mark__source
        ON doc.damage_mark (tenant_id, source_mark_id) WHERE source_mark_id IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_damage_mark__client_ref
        ON doc.damage_mark (tenant_id, client_ref) WHERE client_ref IS NOT NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'doc', @table = 'damage_mark';
END
GO

EXEC dbo.usp_record_script '10_doc.sql', N'doc: attachment (blob path + sha256, angle / stage, hide-not-delete) and damage_mark (model version, face, normalised POINT / RECT / POLYGON, derived CEDEX location, copy chain) — temporal';
GO

PRINT '>> 10_doc.sql completed.';
GO
