-- ============================================================
-- GECKO REPAIR (M&R) — OWNER PROFILES (P4)
-- Script: 11_owner_profile.sql
--
-- How each container owner (liner or lessor) wants M&R handled — decisions
-- Q7 (approval channel), Q8 (coding), Q11 / Q17 (billing trigger), Q16 / Q20
-- (EDI partners: Maersk, ONE, CMA CGM, COSCO SHIPPING, Wan Hai, HMM):
--
--   config.owner_profile   one row per owner party (tenant-wide, or a depot override)
--
-- The PARTY stays in gecko_master (party.party; BIC prefixes in
-- party.container_prefix). No lessor extension is added there: whether the
-- owner is a LINER or a LESSOR, and how it approves, is M&R behaviour, so it
-- lives here (owner decision 2026-11-25: confirm recommendations).
--
-- No row for an owner = the tenant defaults (settings DEFAULT_BILLING_TRIGGER,
-- PDF approval, description allowed).
--
-- Idempotent.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- @table   config.owner_profile
-- @purpose How one container owner (liner or lessor) works with the depot on M&R: CEDEX codes required or description allowed, how estimates are approved (EDI, PDF by e-mail, portal, phone), when charges are billed (on approval or on completion), the auto-approve limit, estimate currency and the default tariff schedules.
-- @vector  none — new (decisions Q7, Q8, Q11, Q16, Q17)
-- @owner   R16 Owner Profiles & EDI
-- @flags   T
-- @phase   4
IF OBJECT_ID('config.owner_profile') IS NULL
BEGIN
    CREATE TABLE config.owner_profile (
        owner_profile_id        UNIQUEIDENTIFIER    NOT NULL CONSTRAINT df_owner_profile__id DEFAULT NEWSEQUENTIALID(),
        tenant_id               UNIQUEIDENTIFIER    NOT NULL,
        branch_id               UNIQUEIDENTIFIER    NULL,       -- NULL = every depot; set = this depot's override
        owner_party_id          UNIQUEIDENTIFIER    NOT NULL,   -- ref gecko_master:party.party
        owner_party_code        VARCHAR(20)         NOT NULL,
        owner_kind              VARCHAR(10)         NOT NULL,   -- LINER, LESSOR, OTHER (shipper-owned, NVOCC ...)
        coding_requirement      VARCHAR(20)         NOT NULL CONSTRAINT df_owner_profile__coding DEFAULT 'DESCRIPTION_ALLOWED',   -- CEDEX_REQUIRED or DESCRIPTION_ALLOWED (Q8)
        approval_channel        VARCHAR(10)         NOT NULL CONSTRAINT df_owner_profile__channel DEFAULT 'PDF_EMAIL',   -- EDI, PDF_EMAIL, PORTAL, PHONE (Q7)
        edi_partner_code        VARCHAR(30)         NULL,       -- partner id in the GECKO EDI service (EDI channel), e.g. MAERSK, COSCO
        approval_emails_json    NVARCHAR(1000)      NULL,       -- JSON array of addresses the estimate PDF goes to (PDF_EMAIL)
        billing_trigger         VARCHAR(15)         NOT NULL CONSTRAINT df_owner_profile__billing DEFAULT 'ON_APPROVAL',   -- ON_APPROVAL (Q11 default) or ON_COMPLETION (Q17 per owner)
        auto_approve_limit      DECIMAL(18,4)       NULL,       -- estimates up to this total are approved without asking the owner
        auto_approve_currency   CHAR(3)             NULL,
        estimate_currency_code  CHAR(3)             NULL,       -- currency the owner wants estimates in (FX from gecko_master); NULL = depot currency
        estimate_validity_days  SMALLINT            NULL,       -- overrides setting ESTIMATE_VALIDITY_DAYS
        requires_photos         BIT                 NOT NULL CONSTRAINT df_owner_profile__photos DEFAULT 1,   -- an estimate cannot be sent without damage photos
        requires_joint_survey   BIT                 NOT NULL CONSTRAINT df_owner_profile__joint DEFAULT 0,    -- off-hire surveys need the owner's surveyor (lessors)
        owner_schedule_id       UNIQUEIDENTIFIER    NULL,       -- ref gecko_revenue:tariff.schedule — tariff for lines the OWNER pays
        owner_schedule_no       VARCHAR(30)         NULL,
        user_schedule_id        UNIQUEIDENTIFIER    NULL,       -- ref gecko_revenue:tariff.schedule — tariff for lines the USER (lessee / liner) pays
        user_schedule_no        VARCHAR(30)         NULL,
        is_active               BIT                 NOT NULL CONSTRAINT df_owner_profile__is_active DEFAULT 1,
        remarks                 NVARCHAR(1000)      NULL,
        created_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_owner_profile__created_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        created_by              UNIQUEIDENTIFIER    NULL,
        updated_at              DATETIMEOFFSET(7)   NOT NULL CONSTRAINT df_owner_profile__updated_at DEFAULT (SYSUTCDATETIME() AT TIME ZONE 'UTC'),
        updated_by              UNIQUEIDENTIFIER    NULL,
        deleted_at              DATETIMEOFFSET(7)   NULL,
        deleted_by              UNIQUEIDENTIFIER    NULL,
        row_version             ROWVERSION          NOT NULL,
        CONSTRAINT pk_owner_profile PRIMARY KEY CLUSTERED (owner_profile_id),
        CONSTRAINT ck_owner_profile__kind CHECK (owner_kind IN ('LINER','LESSOR','OTHER')),
        CONSTRAINT ck_owner_profile__coding CHECK (coding_requirement IN ('CEDEX_REQUIRED','DESCRIPTION_ALLOWED')),
        CONSTRAINT ck_owner_profile__channel CHECK (approval_channel IN ('EDI','PDF_EMAIL','PORTAL','PHONE')),
        -- EDI owners name their EDI partner and always need CEDEX codes (an EDI estimate cannot carry free text only).
        CONSTRAINT ck_owner_profile__edi CHECK ((approval_channel = 'EDI' AND edi_partner_code IS NOT NULL AND coding_requirement = 'CEDEX_REQUIRED')
            OR (approval_channel <> 'EDI' AND edi_partner_code IS NULL)),
        CONSTRAINT ck_owner_profile__emails CHECK ((approval_channel <> 'PDF_EMAIL' OR approval_emails_json IS NOT NULL)
            AND (approval_emails_json IS NULL OR ISJSON(approval_emails_json) = 1)),
        CONSTRAINT ck_owner_profile__billing CHECK (billing_trigger IN ('ON_APPROVAL','ON_COMPLETION')),
        CONSTRAINT ck_owner_profile__auto_pair CHECK ((auto_approve_limit IS NULL AND auto_approve_currency IS NULL)
            OR (auto_approve_limit >= 0 AND auto_approve_currency LIKE '[A-Z][A-Z][A-Z]')),
        CONSTRAINT ck_owner_profile__currency CHECK (estimate_currency_code IS NULL OR estimate_currency_code LIKE '[A-Z][A-Z][A-Z]'),
        CONSTRAINT ck_owner_profile__validity CHECK (estimate_validity_days IS NULL OR estimate_validity_days BETWEEN 1 AND 365),
        CONSTRAINT ck_owner_profile__owner_schedule CHECK ((owner_schedule_id IS NULL AND owner_schedule_no IS NULL) OR (owner_schedule_id IS NOT NULL AND owner_schedule_no IS NOT NULL)),
        CONSTRAINT ck_owner_profile__user_schedule CHECK ((user_schedule_id IS NULL AND user_schedule_no IS NULL) OR (user_schedule_id IS NOT NULL AND user_schedule_no IS NOT NULL))
    );
    CREATE UNIQUE NONCLUSTERED INDEX uq_owner_profile__branch
        ON config.owner_profile (tenant_id, branch_id, owner_party_id) WHERE branch_id IS NOT NULL AND deleted_at IS NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uq_owner_profile__tenant
        ON config.owner_profile (tenant_id, owner_party_id) WHERE branch_id IS NULL AND deleted_at IS NULL;
    EXEC dbo.usp_enable_temporal @schema = 'config', @table = 'owner_profile';
END
GO

EXEC dbo.usp_record_script '11_owner_profile.sql', N'config.owner_profile: owner kind, coding (CEDEX / description), approval channel (EDI partner, PDF e-mails, portal, phone), billing trigger, auto-approve limit, estimate currency, default owner / user tariff schedules';
GO

PRINT '>> 11_owner_profile.sql completed.';
GO
