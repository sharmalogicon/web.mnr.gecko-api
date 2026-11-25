-- ============================================================
-- GECKO REPAIR (M&R) — STANDARDS LIBRARY AND DAMAGE-MAP MODELS (P1)
-- Script: 04_code.sql
--
-- The CEDEX vocabulary itself (damage location, component, damage, repair
-- codes) stays in gecko_master equipment.*; Repair stores CODES, validated at
-- write time. What Repair adds, per tenant:
--
--   code.iicl_threshold        IICL-6 / lessor / tenant acceptance limits
--   code.location_component    valid CEDEX location <-> component pairs
--   code.component_repair      valid repair codes per component, default UoM and hours
--   code.checklist_template    survey / PTI checklists, versioned, with required photo angles
--   code.checklist_item        the questions of a checklist
--   code.container_model       2D / 3D damage-map model per container type (R15, Q19, Q21)
--   code.container_model_iso   ISO size-type -> model
--   code.model_face            faces of a model: 2D unfolded layout + 3D placement
--   code.face_zone             zones of a face -> CEDEX location code
--
-- WHY PER TENANT AND NOT GLOBAL ROWS
-- Every table in a tenant schema carries tenant_id (91, guard 50332). The
-- standard starting set (IICL-6 limits, CEDEX pairs, checklists, the
-- procedural models for 20DV/40DV/40HC/20RF/40RH/20TK/20FR/40FR/20OT/40OT) is a
-- catalogue in code (Gecko.Repair/Application/RepairStandardsCatalogue.cs),
-- written into a tenant by POST /api/repair/setup/initialize, like number
-- series. A tenant may then tighten limits, add lessor rows or new checklist
-- versions without touching anyone else.
--
-- VERSIONING: a checklist template or a container model that is ACTIVE is never
-- edited — a change is a new version (DRAFT -> ACTIVE, the old one RETIRED).
-- Surveys and damage marks keep the version they were made with, so an old
-- mark is always drawn on the model it was placed on. One ACTIVE version per
-- code (filtered unique index).
--
-- Damage-map coordinates: a mark is (face, x, y) normalised 0..1 with the
-- origin at the top-left of the face as drawn in the unfolded 2D view
-- (doc.damage_mark, P3). The 3D view maps it with the face's origin + u + v
-- vectors (model millimetres, outward normal), so one record serves 2D, 3D,
-- PDF and the mobile app.
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   code.iicl_threshold
-- @purpose One acceptance limit: for a component (and optionally a damage code and equipment category) the largest dent, cut, hole or count that is still acceptable, from IICL-6, a lessor's own criteria or the tenant.
-- @vector  none — new (UI iicl6.ts, 8 stub rows)
-- @owner   R1 Units and Standards
-- @flags   T
-- @phase   1
IF OBJECT_ID('code.iicl_threshold') IS NULL
BEGIN
    CREATE TABLE code.iicl_threshold (
        iicl_threshold_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_iicl_threshold__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        component_code          VARCHAR(20)         NOT NULL,   -- CEDEX component (gecko_master equipment.component)
        damage_code             VARCHAR(10)         NULL,       -- CEDEX damage code; NULL = any damage on the component
        equipment_category      VARCHAR(10)         NULL,       -- DRY, REEFER, TANK ...; NULL = every category
        criterion               VARCHAR(10)         NOT NULL,   -- what is measured: LENGTH, WIDTH, DEPTH, AREA, COUNT
        max_value               DECIMAL(9,2)        NOT NULL,   -- largest acceptable value (above it = repair)
        uom_code                VARCHAR(10)         NOT NULL,   -- MM, CM, CM2, EA
        source                  VARCHAR(10)         NOT NULL,   -- IICL6, LESSOR, TENANT
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party — the lessor whose criteria these are (LESSOR only)
        owner_party_code        VARCHAR(20)         NULL,       -- code of the above
        reference_text          NVARCHAR(200)       NULL,       -- manual clause, e.g. IICL-6 3.4.2 side panel dent
        effective_from          DATE                NOT NULL,
        effective_to            DATE                NULL,
        is_active               BIT                 NOT NULL CONSTRAINT df_iicl_threshold__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_iicl_threshold__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_iicl_threshold__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_iicl_threshold PRIMARY KEY CLUSTERED (iicl_threshold_id),
        CONSTRAINT ck_iicl_threshold__criterion CHECK (criterion IN ('LENGTH','WIDTH','DEPTH','AREA','COUNT')),
        CONSTRAINT ck_iicl_threshold__uom CHECK (uom_code IN ('MM','CM','CM2','EA')),
        CONSTRAINT ck_iicl_threshold__uom_fits CHECK ((criterion = 'COUNT' AND uom_code = 'EA') OR (criterion = 'AREA' AND uom_code = 'CM2')
            OR (criterion IN ('LENGTH','WIDTH','DEPTH') AND uom_code IN ('MM','CM'))),
        CONSTRAINT ck_iicl_threshold__value CHECK (max_value >= 0),
        CONSTRAINT ck_iicl_threshold__source CHECK (source IN ('IICL6','LESSOR','TENANT')),
        CONSTRAINT ck_iicl_threshold__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_iicl_threshold__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        -- Lessor criteria name the lessor; IICL-6 and tenant rows do not.
        CONSTRAINT ck_iicl_threshold__owner_source CHECK ((source = 'LESSOR' AND owner_party_id IS NOT NULL) OR (source <> 'LESSOR' AND owner_party_id IS NULL)),
        CONSTRAINT ck_iicl_threshold__dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
    );
    -- NULLs compare equal in a SQL Server unique index, so "any damage" / "every category" rows are unique too.
    CREATE UNIQUE NONCLUSTERED INDEX uq_iicl_threshold__rule
        ON code.iicl_threshold (tenant_id, component_code, damage_code, equipment_category, criterion, owner_party_id, effective_from) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'code', @table = 'iicl_threshold';
END
GO

-- @table   code.location_component
-- @purpose One valid pair of CEDEX damage location and component for an equipment category: the survey and estimate screens offer only components that exist at the chosen location.
-- @vector  none — new (deferred in the UI, D-04)
-- @owner   R1 Units and Standards
-- @flags   -
-- @phase   1
IF OBJECT_ID('code.location_component') IS NULL
BEGIN
    CREATE TABLE code.location_component (
        location_component_id   UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_location_component__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        equipment_category      VARCHAR(10)         NOT NULL,   -- DRY, REEFER, TANK ...
        damage_location_code    VARCHAR(10)         NOT NULL,   -- CEDEX location (gecko_master equipment.damage_location), e.g. LX2N
        component_code          VARCHAR(20)         NOT NULL,   -- CEDEX component
        is_active               BIT                 NOT NULL CONSTRAINT df_location_component__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_location_component__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_location_component__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_location_component PRIMARY KEY CLUSTERED (location_component_id),
        CONSTRAINT ck_location_component__category CHECK (equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_location_component__pair
        ON code.location_component (tenant_id, equipment_category, damage_location_code, component_code) WHERE deleted_at IS NULL;
END
GO

-- @table   code.component_repair
-- @purpose One valid repair for a component (optionally per equipment category): the repair code, its default unit of measure and default labour hours the estimate line starts from before the tariff prices it.
-- @vector  none — new
-- @owner   R1 Units and Standards
-- @flags   -
-- @phase   1
IF OBJECT_ID('code.component_repair') IS NULL
BEGIN
    CREATE TABLE code.component_repair (
        component_repair_id     UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_component_repair__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        component_code          VARCHAR(20)         NOT NULL,   -- CEDEX component
        repair_code             VARCHAR(10)         NOT NULL,   -- CEDEX repair code (gecko_master equipment.repair_code)
        equipment_category      VARCHAR(10)         NULL,       -- NULL = every category
        default_uom_code        VARCHAR(10)         NOT NULL,   -- EA, M, M2, CM, HR (gecko_master uom)
        default_labour_hours    DECIMAL(9,2)        NULL,       -- starting hours per unit; the tariff may override
        is_default              BIT                 NOT NULL CONSTRAINT df_component_repair__is_default DEFAULT 0,   -- the repair proposed first for this component
        is_active               BIT                 NOT NULL CONSTRAINT df_component_repair__is_active DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_component_repair__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_component_repair__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_component_repair PRIMARY KEY CLUSTERED (component_repair_id),
        CONSTRAINT ck_component_repair__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_component_repair__hours CHECK (default_labour_hours IS NULL OR default_labour_hours >= 0)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_component_repair__pair
        ON code.component_repair (tenant_id, component_code, repair_code, equipment_category) WHERE deleted_at IS NULL;
    -- At most one default repair per component and category.
    CREATE UNIQUE NONCLUSTERED INDEX uq_component_repair__default
        ON code.component_repair (tenant_id, component_code, equipment_category) WHERE is_default = 1 AND deleted_at IS NULL;
END
GO

-- @table   code.checklist_template
-- @purpose One version of a survey or PTI checklist for a survey type (and optionally an equipment category), with the photo angles a surveyor must take. ACTIVE versions are never edited: a change is a new version.
-- @vector  none — new (UI survey-checklists.ts)
-- @owner   R3 Survey
-- @flags   T
-- @phase   1
IF OBJECT_ID('code.checklist_template') IS NULL
BEGIN
    CREATE TABLE code.checklist_template (
        checklist_template_id   UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_checklist_template__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        template_code           VARCHAR(30)         NOT NULL,   -- e.g. GATE_IN_DRY, OFF_HIRE_REEFER, PTI_STANDARD
        template_version        SMALLINT            NOT NULL,   -- 1, 2, 3 ...
        name_en                 NVARCHAR(200)       NOT NULL,
        name_local              NVARCHAR(200)       NULL,       -- depot language; full i18n comes from label keys
        survey_type_code        VARCHAR(40)         NOT NULL,   -- SURVEY_TYPE code list: GATE_IN, OFF_HIRE, ON_HIRE, PERIODIC, PRE_TRIP ...
        equipment_category      VARCHAR(10)         NULL,       -- NULL = every category
        owner_party_id          UNIQUEIDENTIFIER    NULL,       -- ref gecko_master:party.party — a lessor's own checklist; NULL = standard
        owner_party_code        VARCHAR(20)         NULL,
        required_photo_angles_json NVARCHAR(1000)   NULL,       -- JSON array of angle codes, e.g. ["DOOR","LEFT","RIGHT","FRONT","ROOF","INTERIOR","CSC_PLATE"]
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_checklist_template__status DEFAULT 'DRAFT',   -- DRAFT, ACTIVE, RETIRED
        activated_at            DATETIMEOFFSET(7)   NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_checklist_template__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_checklist_template__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_checklist_template PRIMARY KEY CLUSTERED (checklist_template_id),
        CONSTRAINT ck_checklist_template__code CHECK (template_code = UPPER(template_code) COLLATE Latin1_General_100_CS_AS AND template_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_checklist_template__version CHECK (template_version >= 1),
        CONSTRAINT ck_checklist_template__category CHECK (equipment_category IS NULL OR equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_checklist_template__owner_pair CHECK ((owner_party_id IS NULL AND owner_party_code IS NULL) OR (owner_party_id IS NOT NULL AND owner_party_code IS NOT NULL)),
        CONSTRAINT ck_checklist_template__angles CHECK (required_photo_angles_json IS NULL OR ISJSON(required_photo_angles_json) = 1),
        CONSTRAINT ck_checklist_template__status CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
        CONSTRAINT ck_checklist_template__activated CHECK (status = 'DRAFT' OR activated_at IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_checklist_template__version
        ON code.checklist_template (tenant_id, template_code, template_version) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_checklist_template__active
        ON code.checklist_template (tenant_id, template_code) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'code', @table = 'checklist_template';
END
GO

-- @table   code.checklist_item
-- @purpose One question of a checklist version, in order: what to check, whether a measurement is needed, the CEDEX component it concerns, whether IICL limits apply, and the face the damage map opens on.
-- @vector  none — new (UI ChecklistItem)
-- @owner   R3 Survey
-- @flags   T
-- @phase   1
IF OBJECT_ID('code.checklist_item') IS NULL
BEGIN
    CREATE TABLE code.checklist_item (
        checklist_item_id       UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_checklist_item__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        checklist_template_id   UNIQUEIDENTIFIER    NOT NULL,   -- ref code.checklist_template
        sequence_no             SMALLINT            NOT NULL,   -- order on the form
        category_code           VARCHAR(30)         NOT NULL,   -- section on the form: EXTERIOR, INTERIOR, DOORS, UNDERSTRUCTURE, MACHINERY, TANK, MARKINGS
        label_key               VARCHAR(100)        NOT NULL,   -- i18n key, e.g. checklist.door.gasket
        label_en                NVARCHAR(200)       NOT NULL,   -- English fallback
        requires_measurement    BIT                 NOT NULL CONSTRAINT df_checklist_item__measure DEFAULT 0,
        measurement_uom_code    VARCHAR(10)         NULL,       -- MM, CM, CM2, C, BAR — set only with requires_measurement
        cedex_component_code    VARCHAR(20)         NULL,       -- component the question is about (links answers to IICL limits)
        iicl_applies            BIT                 NOT NULL CONSTRAINT df_checklist_item__iicl DEFAULT 0,   -- server computes the IICL verdict from the measurement
        default_face_code       VARCHAR(20)         NULL,       -- damage-map face opened for this question
        is_mandatory            BIT                 NOT NULL CONSTRAINT df_checklist_item__mandatory DEFAULT 1,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_checklist_item__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_checklist_item__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_checklist_item PRIMARY KEY CLUSTERED (checklist_item_id),
        CONSTRAINT ck_checklist_item__seq CHECK (sequence_no >= 1),
        CONSTRAINT ck_checklist_item__category CHECK (category_code = UPPER(category_code) COLLATE Latin1_General_100_CS_AS AND category_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_checklist_item__uom CHECK ((requires_measurement = 0 AND measurement_uom_code IS NULL)
            OR (requires_measurement = 1 AND measurement_uom_code IN ('MM','CM','CM2','C','BAR'))),
        CONSTRAINT ck_checklist_item__iicl CHECK (iicl_applies = 0 OR (requires_measurement = 1 AND cedex_component_code IS NOT NULL)),
        CONSTRAINT ck_checklist_item__face CHECK (default_face_code IS NULL OR default_face_code IN ('LEFT','RIGHT','FRONT','DOOR','ROOF','FLOOR','UNDER','INTERIOR','MACHINERY'))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_checklist_item__seq
        ON code.checklist_item (tenant_id, checklist_template_id, sequence_no) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'code', @table = 'checklist_item';
END
GO

-- @table   code.container_model
-- @purpose One version of the damage-map model of a container type (20DV, 40HC, 40RH, 20TK, 40FR ...): outside dimensions, machinery end, and how the 3D view is built (procedural builder parameters, or a glTF file). ACTIVE versions are never edited.
-- @vector  none — new (R15; decided Q19 detailed per type, Q21 procedural)
-- @owner   R15 Damage Map
-- @flags   T
-- @phase   1
IF OBJECT_ID('code.container_model') IS NULL
BEGIN
    CREATE TABLE code.container_model (
        container_model_id      UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_container_model__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        model_code              VARCHAR(20)         NOT NULL,   -- 20DV, 40DV, 40HC, 20RF, 40RH, 20TK, 20FR, 40FR, 20OT, 40OT ...
        model_version           SMALLINT            NOT NULL,   -- marks keep the version they were placed on
        name_en                 NVARCHAR(100)       NOT NULL,   -- e.g. 40' high cube dry
        equipment_category      VARCHAR(10)         NOT NULL,   -- DRY, REEFER, TANK, FLAT, OPEN_TOP ...
        size_ft                 VARCHAR(3)          NOT NULL,   -- 20, 40, 45 ...
        length_mm               INT                 NOT NULL,   -- outside dimensions (ISO 668), e.g. 12192
        width_mm                INT                 NOT NULL,   -- e.g. 2438
        height_mm               INT                 NOT NULL,   -- e.g. 2896 (high cube)
        has_machinery_end       BIT                 NOT NULL CONSTRAINT df_container_model__machinery DEFAULT 0,   -- reefer machinery at the front end (MACHINERY face)
        model_kind              VARCHAR(20)         NOT NULL CONSTRAINT df_container_model__kind DEFAULT 'DETAILED_PROCEDURAL',   -- DETAILED_PROCEDURAL (built in code) or GLTF (file)
        detail_spec_json        NVARCHAR(MAX)       NULL,       -- builder parameters: corrugation pitch/depth, rails, posts, corner castings, door gear, machinery / tank barrel and frame
        asset_uri               NVARCHAR(400)       NULL,       -- glTF in blob storage (GLTF only)
        status                  VARCHAR(10)         NOT NULL CONSTRAINT df_container_model__status DEFAULT 'DRAFT',   -- DRAFT, ACTIVE, RETIRED
        activated_at            DATETIMEOFFSET(7)   NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_model__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_model__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_container_model PRIMARY KEY CLUSTERED (container_model_id),
        CONSTRAINT ck_container_model__code CHECK (model_code = UPPER(model_code) COLLATE Latin1_General_100_CS_AS AND model_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_container_model__version CHECK (model_version >= 1),
        CONSTRAINT ck_container_model__category CHECK (equipment_category IN ('DRY','REEFER','TANK','FLAT','OPEN_TOP','BULK','VENTILATED','PLATFORM','OTHER')),
        CONSTRAINT ck_container_model__size CHECK (size_ft IN ('10','20','40','45','48','53')),
        CONSTRAINT ck_container_model__dims CHECK (length_mm BETWEEN 2000 AND 17000 AND width_mm BETWEEN 2000 AND 2700 AND height_mm BETWEEN 300 AND 3200),
        CONSTRAINT ck_container_model__kind CHECK (model_kind IN ('DETAILED_PROCEDURAL','GLTF')),
        CONSTRAINT ck_container_model__spec CHECK (detail_spec_json IS NULL OR ISJSON(detail_spec_json) = 1),
        -- A procedural model needs its builder parameters; a glTF model needs its file.
        CONSTRAINT ck_container_model__kind_data CHECK ((model_kind = 'DETAILED_PROCEDURAL' AND detail_spec_json IS NOT NULL)
            OR (model_kind = 'GLTF' AND asset_uri IS NOT NULL)),
        CONSTRAINT ck_container_model__status CHECK (status IN ('DRAFT','ACTIVE','RETIRED')),
        CONSTRAINT ck_container_model__activated CHECK (status = 'DRAFT' OR activated_at IS NOT NULL)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_model__version
        ON code.container_model (tenant_id, model_code, model_version) WHERE deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_model__active
        ON code.container_model (tenant_id, model_code) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'code', @table = 'container_model';
END
GO

-- @table   code.container_model_iso
-- @purpose Which damage-map model a container of a given ISO size-type is drawn with (22G1 -> 20DV, 45G1 -> 40HC, 45R1 -> 40RH ...). The ACTIVE version of the model code is used.
-- @vector  none — new
-- @owner   R15 Damage Map
-- @flags   T
-- @phase   1
IF OBJECT_ID('code.container_model_iso') IS NULL
BEGIN
    CREATE TABLE code.container_model_iso (
        container_model_iso_id  UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_container_model_iso__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        iso_code                VARCHAR(4)          NOT NULL,   -- ISO 6346 size-type, e.g. 45G1
        model_code              VARCHAR(20)         NOT NULL,   -- code.container_model.model_code (any version; the ACTIVE one is drawn)
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_model_iso__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_container_model_iso__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_container_model_iso PRIMARY KEY CLUSTERED (container_model_iso_id),
        CONSTRAINT ck_container_model_iso__iso CHECK (iso_code LIKE '[0-9A-Z][0-9A-Z][0-9A-Z][0-9A-Z]')
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_container_model_iso__iso
        ON code.container_model_iso (tenant_id, iso_code) WHERE deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'code', @table = 'container_model_iso';
END
GO

-- @table   code.model_face
-- @purpose One face of a model version (left, right, front, door, roof, floor, under, interior, machinery): its size, where it sits in the unfolded 2D view, where it sits in 3D (origin, u, v, outward normal in model millimetres), and its grid.
-- @vector  none — new (R15)
-- @owner   R15 Damage Map
-- @flags   -
-- @phase   1
IF OBJECT_ID('code.model_face') IS NULL
BEGIN
    CREATE TABLE code.model_face (
        model_face_id           UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_model_face__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        container_model_id      UNIQUEIDENTIFIER    NOT NULL,   -- ref code.container_model (a specific version)
        face_code               VARCHAR(20)         NOT NULL,   -- LEFT, RIGHT, FRONT, DOOR, ROOF, FLOOR, UNDER, INTERIOR, MACHINERY
        width_mm                INT                 NOT NULL,   -- face size as drawn (x direction)
        height_mm               INT                 NOT NULL,   -- (y direction)
        layout_x_mm             DECIMAL(9,1)        NOT NULL,   -- top-left of the face in the unfolded 2D sheet
        layout_y_mm             DECIMAL(9,1)        NOT NULL,
        layout_rotation_deg     SMALLINT            NOT NULL CONSTRAINT df_model_face__rotation DEFAULT 0,   -- 0, 90, 180, 270
        origin_x_mm             DECIMAL(9,1)        NOT NULL,   -- 3D: model point at the face's 2D top-left (x, y) = (0, 0)
        origin_y_mm             DECIMAL(9,1)        NOT NULL,
        origin_z_mm             DECIMAL(9,1)        NOT NULL,
        u_x                     DECIMAL(7,4)        NOT NULL,   -- 3D unit vector along 2D x (left to right)
        u_y                     DECIMAL(7,4)        NOT NULL,
        u_z                     DECIMAL(7,4)        NOT NULL,
        v_x                     DECIMAL(7,4)        NOT NULL,   -- 3D unit vector along 2D y (top to bottom)
        v_y                     DECIMAL(7,4)        NOT NULL,
        v_z                     DECIMAL(7,4)        NOT NULL,
        normal_x                DECIMAL(7,4)        NOT NULL,   -- outward normal (interior marks are drawn on the inside)
        normal_y                DECIMAL(7,4)        NOT NULL,
        normal_z                DECIMAL(7,4)        NOT NULL,
        grid_columns            TINYINT             NOT NULL,   -- CEDEX-style grid across the face (e.g. 10 sections on a 40' side)
        grid_rows               TINYINT             NOT NULL,   -- (e.g. 4 bands: top rail, upper, lower, bottom rail)
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_model_face__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_model_face__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_model_face PRIMARY KEY CLUSTERED (model_face_id),
        CONSTRAINT ck_model_face__code CHECK (face_code IN ('LEFT','RIGHT','FRONT','DOOR','ROOF','FLOOR','UNDER','INTERIOR','MACHINERY')),
        CONSTRAINT ck_model_face__size CHECK (width_mm > 0 AND height_mm > 0),
        CONSTRAINT ck_model_face__rotation CHECK (layout_rotation_deg IN (0, 90, 180, 270)),
        -- u, v and normal are unit vectors (tolerance for DECIMAL(7,4) rounding).
        CONSTRAINT ck_model_face__unit_vectors CHECK (
            ABS(u_x*u_x + u_y*u_y + u_z*u_z - 1) < 0.01
            AND ABS(v_x*v_x + v_y*v_y + v_z*v_z - 1) < 0.01
            AND ABS(normal_x*normal_x + normal_y*normal_y + normal_z*normal_z - 1) < 0.01),
        -- u and v span the face: perpendicular to each other.
        CONSTRAINT ck_model_face__orthogonal CHECK (ABS(u_x*v_x + u_y*v_y + u_z*v_z) < 0.01),
        CONSTRAINT ck_model_face__grid CHECK (grid_columns BETWEEN 1 AND 40 AND grid_rows BETWEEN 1 AND 20)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_model_face__face
        ON code.model_face (tenant_id, container_model_id, face_code) WHERE deleted_at IS NULL;
END
GO

-- @table   code.face_zone
-- @purpose One zone of a face (a rectangle in normalised 0..1 face coordinates) and the CEDEX damage location code it stands for, so a mark placed on the map proposes its location code.
-- @vector  none — new (R15)
-- @owner   R15 Damage Map
-- @flags   -
-- @phase   1
IF OBJECT_ID('code.face_zone') IS NULL
BEGIN
    CREATE TABLE code.face_zone (
        face_zone_id            UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_face_zone__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        model_face_id           UNIQUEIDENTIFIER    NOT NULL,   -- ref code.model_face
        zone_code               VARCHAR(20)         NOT NULL,   -- unique on the face, e.g. C03R2 (column 3, row 2)
        x_from                  DECIMAL(7,6)        NOT NULL,   -- normalised rectangle, origin top-left of the face
        x_to                    DECIMAL(7,6)        NOT NULL,
        y_from                  DECIMAL(7,6)        NOT NULL,
        y_to                    DECIMAL(7,6)        NOT NULL,
        damage_location_code    VARCHAR(10)         NOT NULL,   -- CEDEX location the zone maps to, e.g. LX3N
        label_key               VARCHAR(100)        NULL,       -- i18n key for the zone name
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_face_zone__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_face_zone__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_face_zone PRIMARY KEY CLUSTERED (face_zone_id),
        CONSTRAINT ck_face_zone__code CHECK (zone_code = UPPER(zone_code) COLLATE Latin1_General_100_CS_AS AND zone_code NOT LIKE '%[^A-Z0-9_]%'),
        CONSTRAINT ck_face_zone__rect CHECK (x_from >= 0 AND x_from < x_to AND x_to <= 1 AND y_from >= 0 AND y_from < y_to AND y_to <= 1)
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_face_zone__code
        ON code.face_zone (tenant_id, model_face_id, zone_code) WHERE deleted_at IS NULL;
    -- Overlapping zones on one face are refused by the Repair module (an index cannot express it).
END
GO

EXEC dbo.usp_record_script '04_code.sql', N'code: iicl_threshold, location_component, component_repair, checklist_template/item (versioned), container_model (versioned, procedural or glTF), container_model_iso, model_face (2D layout + 3D placement), face_zone';
GO

PRINT '>> 04_code.sql completed.';
GO
