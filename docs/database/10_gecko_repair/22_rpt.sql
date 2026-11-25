-- ============================================================
-- GECKO REPAIR (M&R) — DASHBOARD, INQUIRY AND REPORT VIEWS (doc 03 P12, doc 01 §17)
-- Script: 22_rpt.sql
--
-- Phase 1 read models are plain views over the owning tables (the gecko_trucking
-- 17_rpt_views pattern). The API's GET /dashboard/kpis, GET /inquiry/{...} and
-- GET /reports/{code} read these; PDF / Excel come from GeckoPdf / TabularReport.
--
--   rpt.vw_case_board            one row per case: status, owner, current estimate,
--                                latest work order, the KPI clocks (gate-in/open ->
--                                estimate submitted -> approved -> completed) and
--                                SLA breach flags. Also the container case history
--                                inquiry and the TOS ContainerRepairSummary feed
--   rpt.vw_approval_aging        estimates waiting (internal, to send, on owner) with
--                                age and age band
--   rpt.vw_damaged_stock         boxes in the depot with an open case (DM stock):
--                                owner, age, ready-for-repair backlog
--   rpt.vw_estimate_cut_rate     decided estimates: estimated vs approved amount
--   rpt.vw_wo_margin             completed work orders: approved sell vs labour +
--                                material + sublet cost
--   rpt.vw_billable_charge       charge lines with release state (unreleased
--                                charges inquiry, revenue by charge code)
--   rpt.vw_repeat_damage         an approved repair of the same container +
--                                component as an earlier approved repair, with
--                                the days between (the API filters "within N days")
--   rpt.vw_wip                   open work orders: age, overdue, hours used
--   rpt.vw_cleaning_daily        cleaning throughput per bay per day
--   rpt.vw_pti_daily             PTI completions and pass rate per depot per day
--   rpt.vw_certificate_expiry    latest tank / periodic test per unit and test
--                                type + ATP validity, with due band
--   rpt.vw_case_activity_daily   case events per depot per day per type (daily
--                                M&R activity report)
--   rpt.vw_connector_sla         per connector: health, last success, inbound
--                                exceptions, outbound backlog (connector SLA report)
--   rpt.vw_stock_position        parts stock per material and store: on hand,
--                                reserved, value, below reorder point
--   rpt.vw_vendor_bill_aging     vendor bills not yet exported: age, due, match
--   rpt.vw_depot_kpi             dashboard tiles, one row per depot (branch)
--
-- Rules for every view here:
--  * Views only, no tables (91 guard 50339). rpt has SELECT-only grants (01).
--  * No tenant filter in the views: the base tables' fail-closed RLS applies
--    through them, so a caller sees only its own tenant. Joins still match
--    tenant_id on both sides so index seeks work.
--  * TENANT ROLL-UP is not a special view: a tenant-level user sees every
--    branch's rows, and the API sums rpt.vw_depot_kpi (doc 01 "a read over the
--    tenant's own rows, not a special mode"). Branch scope is the API's filter.
--  * Soft-deleted rows (deleted_at IS NOT NULL) are left out.
--  * Money is never added across currencies: every amount column has its
--    currency_code beside it; the API groups by currency.
--  * "Now" is SYSDATETIMEOFFSET() (an absolute instant); "today" and daily
--    buckets are UTC dates. A depot's local day (Bangkok is UTC+7) is the API's
--    job when it filters or groups.
--  * Hours are minutes / 60.0, so partial hours survive.
--
-- NO foreign keys. Run as sysadmin / db_owner, after scripts 02–21. Idempotent
-- (CREATE OR ALTER). 91 re-run afterwards only re-checks the guards.
-- ============================================================

USE gecko_repair;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO

IF NOT (IS_SRVROLEMEMBER('sysadmin') = 1 OR IS_MEMBER('db_owner') = 1)
BEGIN
    RAISERROR('Run as sysadmin / db_owner.', 16, 1);
    SET NOEXEC ON;
END
GO

IF OBJECT_ID('config.client_depot') IS NULL OR OBJECT_ID('audit.activity') IS NULL
BEGIN
    RAISERROR('Run scripts 02–21 first: the views read every phase.', 16, 1);
    SET NOEXEC ON;
END
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_case_board
-- @purpose One row per repair case with owner, status, the current estimate, the latest work order, the KPI clocks from case events and SLA breach flags. Feeds the case board, the container case history inquiry, the turnaround KPIs and the TOS repair summary.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_case_board
AS
WITH ce AS (
    SELECT e.tenant_id,
           e.repair_case_id,
           MIN(CASE WHEN e.event_type = 'SURVEYED'           THEN e.occurred_at END) AS first_surveyed_at,
           MIN(CASE WHEN e.event_type = 'ESTIMATE_SUBMITTED' THEN e.occurred_at END) AS first_estimate_submitted_at,
           MIN(CASE WHEN e.event_type = 'ESTIMATE_APPROVED'  THEN e.occurred_at END) AS first_estimate_approved_at,
           MIN(CASE WHEN e.event_type = 'WO_STARTED'         THEN e.occurred_at END) AS first_wo_started_at,
           MAX(CASE WHEN e.event_type = 'CONDITION_RESTORED' THEN e.occurred_at END) AS condition_restored_at,
           MAX(CASE WHEN e.event_type = 'HOLD_RELEASED'      THEN e.occurred_at END) AS hold_released_at,
           MAX(e.occurred_at)                                                       AS last_event_at
    FROM mcase.case_event e
    GROUP BY e.tenant_id, e.repair_case_id
),
base AS (
    SELECT c.repair_case_id,
           c.tenant_id,
           c.branch_id,
           c.case_no,
           c.case_kind,
           c.status                                AS case_status,
           c.priority,
           c.container_id,
           c.container_no,
           c.iso_code,
           c.equipment_category,
           c.size_ft,
           c.owner_party_id,
           c.owner_party_code,
           c.user_party_id,
           c.user_party_code,
           c.equipment_visit_id,
           v.gate_in_no,
           v.in_at                                 AS gate_in_at,
           v.out_at                                AS gate_out_at,
           v.status                                AS visit_status,
           v.condition_code                        AS visit_condition_code,
           v.grade_code                            AS visit_grade_code,
           c.opened_at,
           c.completed_at,
           c.closed_at,
           c.sla_estimate_due_at,
           c.sla_repair_due_at,
           -- the clock starts at gate-in when the box came through a gate, else at case open
           COALESCE(v.in_at, c.opened_at)          AS clock_start_at,
           ce.first_surveyed_at,
           COALESCE(ce.first_estimate_submitted_at, fe.first_sent_at) AS estimate_submitted_at,
           COALESCE(ce.first_estimate_approved_at,  fe.first_approved_at) AS estimate_approved_at,
           ce.first_wo_started_at                  AS wo_started_at,
           ce.condition_restored_at,
           ce.hold_released_at,
           ce.last_event_at,
           CASE WHEN c.status IN ('OPEN','ESTIMATING','AWAITING_APPROVAL','APPROVED','IN_REPAIR') THEN 1 ELSE 0 END AS is_open
    FROM mcase.repair_case c
    LEFT JOIN intake.equipment_visit v
           ON v.tenant_id = c.tenant_id AND v.equipment_visit_id = c.equipment_visit_id AND v.deleted_at IS NULL
    LEFT JOIN ce
           ON ce.tenant_id = c.tenant_id AND ce.repair_case_id = c.repair_case_id
    OUTER APPLY (
        -- fallback when no case event was written: the estimates' own stamps
        SELECT MIN(e.sent_at)                                                                   AS first_sent_at,
               MIN(CASE WHEN e.status IN ('APPROVED','PARTIALLY_APPROVED') OR (e.status = 'SUPERSEDED' AND e.approved_amount IS NOT NULL)
                        THEN e.decided_at END)                                                  AS first_approved_at
        FROM est.estimate e
        WHERE e.tenant_id = c.tenant_id AND e.repair_case_id = c.repair_case_id AND e.deleted_at IS NULL
    ) fe
    WHERE c.deleted_at IS NULL
)
SELECT b.*,
       ce2.estimate_id                         AS current_estimate_id,
       ce2.estimate_no                         AS current_estimate_no,
       ce2.revision_no                         AS current_revision_no,
       ce2.status                              AS current_estimate_status,
       ce2.currency_code                       AS estimate_currency_code,
       ce2.total_amount                        AS estimate_total_amount,
       ce2.owner_amount                        AS estimate_owner_amount,
       ce2.user_amount                         AS estimate_user_amount,
       ce2.approved_amount                     AS estimate_approved_amount,
       ce2.authorisation_no,
       ce2.approval_channel,
       wo.work_order_id                        AS latest_work_order_id,
       wo.wo_no                                AS latest_wo_no,
       wo.status                               AS latest_wo_status,
       wo.qc_status                            AS latest_wo_qc_status,
       wo.actual_end_at                        AS latest_wo_completed_at,
       wo.condition_code_after,
       wo.grade_code_after,
       DATEDIFF(DAY, b.opened_at, COALESCE(b.closed_at, b.completed_at, SYSDATETIMEOFFSET()))           AS case_age_days,
       CAST(DATEDIFF(MINUTE, b.clock_start_at, b.estimate_submitted_at) / 60.0 AS DECIMAL(10,2))        AS estimate_turnaround_hours,
       CAST(DATEDIFF(MINUTE, b.estimate_submitted_at, b.estimate_approved_at) / 60.0 AS DECIMAL(10,2))  AS approval_hours,
       CAST(DATEDIFF(MINUTE, b.estimate_approved_at, b.completed_at) / 1440.0 AS DECIMAL(10,2))         AS repair_turnaround_days,
       CAST(DATEDIFF(MINUTE, b.clock_start_at, COALESCE(b.completed_at, SYSDATETIMEOFFSET())) / 1440.0 AS DECIMAL(10,2)) AS dwell_days,
       CASE WHEN b.sla_estimate_due_at IS NOT NULL
             AND COALESCE(b.estimate_submitted_at, SYSDATETIMEOFFSET()) > b.sla_estimate_due_at THEN 1 ELSE 0 END AS estimate_sla_breached,
       CASE WHEN b.sla_repair_due_at IS NOT NULL
             AND COALESCE(b.completed_at, SYSDATETIMEOFFSET()) > b.sla_repair_due_at THEN 1 ELSE 0 END             AS repair_sla_breached
FROM base b
OUTER APPLY (
    -- current estimate: the newest live revision (supersede/cancel retire older ones)
    SELECT TOP (1) e.estimate_id, e.estimate_no, e.revision_no, e.status, e.currency_code,
           e.total_amount, e.owner_amount, e.user_amount, e.approved_amount, e.authorisation_no, e.approval_channel
    FROM est.estimate e
    WHERE e.tenant_id = b.tenant_id AND e.repair_case_id = b.repair_case_id
      AND e.deleted_at IS NULL AND e.status NOT IN ('SUPERSEDED','CANCELLED')
    ORDER BY CASE e.estimate_kind WHEN 'REPAIR' THEN 0 ELSE 1 END, e.estimate_date DESC, e.revision_no DESC
) ce2
OUTER APPLY (
    SELECT TOP (1) w.work_order_id, w.wo_no, w.status, w.qc_status, w.actual_end_at, w.condition_code_after, w.grade_code_after
    FROM work.work_order w
    WHERE w.tenant_id = b.tenant_id AND w.repair_case_id = b.repair_case_id
      AND w.deleted_at IS NULL AND w.status <> 'CANCELLED'
    ORDER BY w.created_at DESC
) wo;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_approval_aging
-- @purpose Estimates still waiting for a decision: who it waits on (INTERNAL approval, DEPOT to send, OWNER to decide), since when, age in hours and age band, amount and currency.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_approval_aging
AS
SELECT x.*,
       CASE WHEN x.age_hours < 24  THEN '0-1D'
            WHEN x.age_hours < 72  THEN '1-3D'
            WHEN x.age_hours < 168 THEN '3-7D'
            WHEN x.age_hours < 336 THEN '7-14D'
            ELSE '14D+' END                                   AS age_band
FROM (
    SELECT e.estimate_id,
           e.tenant_id,
           e.branch_id,
           e.estimate_no,
           e.revision_no,
           e.estimate_kind,
           e.repair_case_id,
           c.case_no,
           e.container_no,
           e.owner_party_id,
           e.owner_party_code,
           e.user_party_code,
           e.status,
           CASE e.status WHEN 'PENDING_INTERNAL' THEN 'INTERNAL'
                         WHEN 'READY_TO_SEND'    THEN 'DEPOT'
                         ELSE 'OWNER' END                      AS waiting_on,
           e.approval_channel,
           e.currency_code,
           e.total_amount,
           e.owner_amount,
           e.user_amount,
           CASE WHEN e.status = 'SENT' THEN e.sent_at ELSE e.created_at END AS waiting_since,
           CAST(DATEDIFF(MINUTE, CASE WHEN e.status = 'SENT' THEN e.sent_at ELSE e.created_at END, SYSDATETIMEOFFSET()) / 60.0
                AS DECIMAL(10,2))                              AS age_hours,
           e.valid_until,
           CASE WHEN e.valid_until IS NOT NULL AND e.valid_until < CAST(SYSUTCDATETIME() AS DATE) THEN 1 ELSE 0 END AS is_past_validity
    FROM est.estimate e
    LEFT JOIN mcase.repair_case c
           ON c.tenant_id = e.tenant_id AND c.repair_case_id = e.repair_case_id
    WHERE e.deleted_at IS NULL
      AND e.status IN ('PENDING_INTERNAL','READY_TO_SEND','SENT')
) x;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_damaged_stock
-- @purpose Boxes in the depot with an open repair case (the DM / UC stock): owner, condition, case status, days in depot, age band, and whether the box is approved and waiting for repair (ready-for-repair backlog).
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_damaged_stock
AS
SELECT x.*,
       CASE WHEN x.days_in_depot < 7  THEN '0-7D'
            WHEN x.days_in_depot < 14 THEN '7-14D'
            WHEN x.days_in_depot < 30 THEN '14-30D'
            WHEN x.days_in_depot < 60 THEN '30-60D'
            ELSE '60D+' END                                    AS age_band
FROM (
    SELECT v.equipment_visit_id,
           v.tenant_id,
           v.branch_id,
           v.container_no,
           v.iso_code,
           v.equipment_category,
           COALESCE(c.owner_party_code, v.owner_party_code)     AS owner_party_code,
           COALESCE(c.owner_party_id, v.owner_party_id)         AS owner_party_id,
           v.line_party_code,
           v.gate_in_no,
           v.in_at,
           v.condition_code,
           v.grade_code,
           v.yard_location,
           c.repair_case_id,
           c.case_no,
           c.case_kind,
           c.status                                             AS case_status,
           c.priority,
           CASE WHEN c.status = 'APPROVED' THEN 1 ELSE 0 END    AS is_ready_for_repair,
           CASE WHEN c.status = 'IN_REPAIR' THEN 1 ELSE 0 END   AS is_in_repair,
           DATEDIFF(DAY, v.in_at, SYSDATETIMEOFFSET())          AS days_in_depot
    FROM intake.equipment_visit v
    JOIN mcase.repair_case c
      ON c.tenant_id = v.tenant_id AND c.equipment_visit_id = v.equipment_visit_id
     AND c.deleted_at IS NULL
     AND c.status IN ('OPEN','ESTIMATING','AWAITING_APPROVAL','APPROVED','IN_REPAIR')
    WHERE v.deleted_at IS NULL
      AND v.status = 'IN_DEPOT'
) x;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_estimate_cut_rate
-- @purpose Decided estimates: estimated amount, approved amount, the amount cut and the approval rate (approved / estimated), by owner, depot and decision month. REJECTED counts as approved 0.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_estimate_cut_rate
AS
SELECT e.estimate_id,
       e.tenant_id,
       e.branch_id,
       e.estimate_no,
       e.revision_no,
       e.estimate_kind,
       e.repair_case_id,
       e.container_no,
       e.owner_party_id,
       e.owner_party_code,
       e.approval_channel,
       e.status,
       e.decided_at,
       DATEFROMPARTS(YEAR(e.decided_at), MONTH(e.decided_at), 1)                    AS decided_month,
       e.currency_code,
       e.total_amount                                                               AS estimated_amount,
       ISNULL(e.approved_amount, 0)                                                 AS approved_amount,
       e.total_amount - ISNULL(e.approved_amount, 0)                                AS cut_amount,
       CAST(ISNULL(e.approved_amount, 0) / NULLIF(e.total_amount, 0) AS DECIMAL(9,4)) AS approval_rate,
       e.is_auto_approved
FROM est.estimate e
WHERE e.deleted_at IS NULL
  AND e.decided_at IS NOT NULL
  AND (e.status IN ('APPROVED','PARTIALLY_APPROVED','REJECTED')
       -- a later revision superseded it, but this revision was decided first
       OR (e.status = 'SUPERSEDED' AND e.approved_amount IS NOT NULL));
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_wo_margin
-- @purpose Completed work orders: approved sell amount against labour, material and sublet cost, margin and margin rate, by depot, owner (from the case) and completion month.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_wo_margin
AS
SELECT w.work_order_id,
       w.tenant_id,
       w.branch_id,
       w.wo_no,
       w.wo_kind,
       w.repair_site,
       w.repair_case_id,
       c.case_no,
       w.container_no,
       c.owner_party_id,
       c.owner_party_code,
       w.estimate_no,
       w.completed_at,
       DATEFROMPARTS(YEAR(w.completed_at), MONTH(w.completed_at), 1)                AS completed_month,
       w.currency_code,
       w.approved_sell_amount,
       w.labour_cost,
       w.material_cost,
       w.sublet_cost,
       w.total_cost,
       ISNULL(w.approved_sell_amount, 0) - w.total_cost                             AS margin_amount,
       CAST((ISNULL(w.approved_sell_amount, 0) - w.total_cost) / NULLIF(w.approved_sell_amount, 0) AS DECIMAL(9,4)) AS margin_rate,
       w.estimated_hours,
       w.actual_hours
FROM work.work_order w
LEFT JOIN mcase.repair_case c
       ON c.tenant_id = w.tenant_id AND c.repair_case_id = w.repair_case_id
WHERE w.deleted_at IS NULL
  AND w.status = 'COMPLETED';
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_billable_charge
-- @purpose Every live charge line with its source, bill-to, responsibility, amount and release state (READY / HELD unreleased, RELEASED with its release no and status): the unreleased charges inquiry and revenue by charge code.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_billable_charge
AS
SELECT b.billable_item_id,
       b.tenant_id,
       b.branch_id,
       b.repair_case_id,
       b.case_no,
       b.container_no,
       b.source_type,
       b.source_ref,
       b.charge_code,
       b.description,
       b.responsibility,
       b.bill_to_party_id,
       b.bill_to_party_code,
       b.quantity,
       b.uom_code,
       b.unit_rate,
       b.amount,
       b.currency_code,
       b.authorisation_no,
       b.status,
       CASE WHEN b.status IN ('READY','HELD') THEN 1 ELSE 0 END                     AS is_unreleased,
       b.ready_at,
       DATEDIFF(DAY, b.ready_at, SYSDATETIMEOFFSET())                               AS days_since_ready,
       b.hold_reason,
       r.release_no,
       r.billing_mode,
       r.status                                                                     AS release_status,
       r.released_at,
       r.revenue_batch_ref
FROM charge.billable_item b
LEFT JOIN charge.charge_release r
       ON r.tenant_id = b.tenant_id AND r.charge_release_id = b.charge_release_id AND r.deleted_at IS NULL
WHERE b.deleted_at IS NULL
  AND b.status <> 'CANCELLED';
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_repeat_damage
-- @purpose An approved repair line on a container + component that was already repaired on an earlier approved estimate, with both estimates and the days between them. The API keeps the rows within its N days.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_repeat_damage
AS
SELECT r.*
FROM (
    SELECT l.estimate_line_id,
           l.tenant_id,
           e.branch_id,
           e.container_no,
           l.component_code,
           l.damage_location_code,
           l.damage_code,
           l.repair_code,
           e.owner_party_code,
           e.estimate_id,
           e.estimate_no,
           e.decided_at,
           LAG(e.estimate_id)  OVER (PARTITION BY l.tenant_id, e.container_no, l.component_code ORDER BY e.decided_at, l.estimate_line_id) AS previous_estimate_id,
           LAG(e.estimate_no)  OVER (PARTITION BY l.tenant_id, e.container_no, l.component_code ORDER BY e.decided_at, l.estimate_line_id) AS previous_estimate_no,
           LAG(e.decided_at)   OVER (PARTITION BY l.tenant_id, e.container_no, l.component_code ORDER BY e.decided_at, l.estimate_line_id) AS previous_decided_at,
           LAG(l.damage_code)  OVER (PARTITION BY l.tenant_id, e.container_no, l.component_code ORDER BY e.decided_at, l.estimate_line_id) AS previous_damage_code,
           LAG(e.repair_case_id) OVER (PARTITION BY l.tenant_id, e.container_no, l.component_code ORDER BY e.decided_at, l.estimate_line_id) AS previous_repair_case_id,
           e.repair_case_id
    FROM est.estimate_line l
    JOIN est.estimate e
      ON e.tenant_id = l.tenant_id AND e.estimate_id = l.estimate_id
    WHERE l.deleted_at IS NULL
      AND e.deleted_at IS NULL
      AND l.line_status = 'APPROVED'
      AND l.component_code IS NOT NULL
      AND e.decided_at IS NOT NULL
      AND e.status IN ('APPROVED','PARTIALLY_APPROVED')
) r
-- a different case: two lines on the same component in one case are not a repeat
WHERE r.previous_estimate_id IS NOT NULL
  AND r.previous_repair_case_id <> r.repair_case_id;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_wip
-- @purpose Open work orders (planned, released, in progress, on hold, awaiting QC): case, container, site, supervisor, age, planned end and overdue flag, estimated against actual hours.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_wip
AS
SELECT w.work_order_id,
       w.tenant_id,
       w.branch_id,
       w.wo_no,
       w.wo_kind,
       w.status,
       w.hold_reason,
       w.priority,
       w.repair_site,
       w.vendor_party_code,
       w.supervisor_user_id,
       w.workshop_location,
       w.repair_case_id,
       c.case_no,
       w.container_no,
       c.owner_party_code,
       w.estimate_no,
       w.planned_start_at,
       w.planned_end_at,
       w.actual_start_at,
       w.qc_required,
       w.qc_status,
       w.estimated_hours,
       w.actual_hours,
       DATEDIFF(DAY, w.created_at, SYSDATETIMEOFFSET())                              AS age_days,
       CASE WHEN w.planned_end_at IS NOT NULL AND w.planned_end_at < SYSDATETIMEOFFSET() THEN 1 ELSE 0 END AS is_overdue,
       CASE WHEN w.estimated_hours > 0 AND w.actual_hours > w.estimated_hours THEN 1 ELSE 0 END          AS is_over_hours
FROM work.work_order w
LEFT JOIN mcase.repair_case c
       ON c.tenant_id = w.tenant_id AND c.repair_case_id = w.repair_case_id
WHERE w.deleted_at IS NULL
  AND w.status IN ('PLANNED','RELEASED','IN_PROGRESS','ON_HOLD','AWAITING_QC');
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_cleaning_daily
-- @purpose Cleaning throughput per depot, bay and UTC day: jobs finished, certified, re-cleans, average minutes from start to finish.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_cleaning_daily
AS
SELECT j.tenant_id,
       j.branch_id,
       j.bay_id,
       j.bay_code,
       CAST(j.completed_at AS DATE)                                                  AS work_date,
       COUNT(*)                                                                      AS jobs_completed,
       SUM(CASE WHEN j.status = 'CERTIFIED' THEN 1 ELSE 0 END)                       AS jobs_certified,
       SUM(CASE WHEN j.inspection_result = 'FAIL' THEN 1 ELSE 0 END)                 AS inspections_failed,
       SUM(j.reclean_count)                                                          AS recleans,
       SUM(CASE WHEN j.prev_cargo_hazardous = 1 THEN 1 ELSE 0 END)                   AS hazardous_jobs,
       CAST(AVG(CAST(DATEDIFF(MINUTE, j.started_at, j.completed_at) AS DECIMAL(12,2))) AS DECIMAL(12,2)) AS avg_minutes
FROM clean.cleaning_job j
WHERE j.deleted_at IS NULL
  AND j.completed_at IS NOT NULL
  AND j.status IN ('COMPLETED','CERTIFIED')
GROUP BY j.tenant_id, j.branch_id, j.bay_id, j.bay_code, CAST(j.completed_at AS DATE);
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_pti_daily
-- @purpose PTI completions per depot, PTI level and UTC day: completed, passed, failed, pass rate, average minutes.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_pti_daily
AS
SELECT p.tenant_id,
       p.branch_id,
       p.pti_level,
       CAST(p.ended_at AS DATE)                                                      AS work_date,
       COUNT(*)                                                                      AS ptis_completed,
       SUM(CASE WHEN p.outcome = 'PASS' THEN 1 ELSE 0 END)                           AS ptis_passed,
       SUM(CASE WHEN p.outcome = 'FAIL' THEN 1 ELSE 0 END)                           AS ptis_failed,
       CAST(SUM(CASE WHEN p.outcome = 'PASS' THEN 1.0 ELSE 0 END) / COUNT(*) AS DECIMAL(9,4)) AS pass_rate,
       CAST(AVG(CAST(DATEDIFF(MINUTE, p.started_at, p.ended_at) AS DECIMAL(12,2))) AS DECIMAL(12,2)) AS avg_minutes
FROM reefer.pti_job p
WHERE p.deleted_at IS NULL
  AND p.status = 'COMPLETED'
  AND p.ended_at IS NOT NULL
GROUP BY p.tenant_id, p.branch_id, p.pti_level, CAST(p.ended_at AS DATE);
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_certificate_expiry
-- @purpose The latest test per unit and test type (tank periodic / CSC / ... from unit.unit_test) and the ATP validity on the unit profile, with the due date, days to due and a band (OVERDUE, DUE_30, DUE_90, OK).
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_certificate_expiry
AS
WITH latest AS (
    SELECT t.tenant_id,
           t.branch_id,
           t.unit_profile_id,
           t.container_no,
           t.test_type_code                                                          AS certificate_kind,
           t.test_date                                                               AS last_test_date,
           t.result                                                                  AS last_result,
           t.certificate_no,
           t.next_due_date                                                           AS due_date,
           ROW_NUMBER() OVER (PARTITION BY t.tenant_id, t.unit_profile_id, t.test_type_code ORDER BY t.test_date DESC, t.created_at DESC) AS rn
    FROM unit.unit_test t
    WHERE t.deleted_at IS NULL
),
items AS (
    SELECT tenant_id, branch_id, unit_profile_id, container_no, certificate_kind, last_test_date, last_result, certificate_no, due_date
    FROM latest
    WHERE rn = 1 AND due_date IS NOT NULL
    UNION ALL
    SELECT u.tenant_id, CAST(NULL AS UNIQUEIDENTIFIER), u.unit_profile_id, u.container_no, 'ATP', NULL, NULL, NULL, u.atp_valid_until
    FROM unit.unit_profile u
    WHERE u.deleted_at IS NULL AND u.atp_valid_until IS NOT NULL
)
SELECT i.*,
       u.iso_code,
       u.equipment_category,
       DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), i.due_date)                     AS days_to_due,
       CASE WHEN i.due_date <  CAST(SYSUTCDATETIME() AS DATE)                         THEN 'OVERDUE'
            WHEN i.due_date <= DATEADD(DAY, 30, CAST(SYSUTCDATETIME() AS DATE))       THEN 'DUE_30'
            WHEN i.due_date <= DATEADD(DAY, 90, CAST(SYSUTCDATETIME() AS DATE))       THEN 'DUE_90'
            ELSE 'OK' END                                                             AS due_band
FROM items i
LEFT JOIN unit.unit_profile u
       ON u.tenant_id = i.tenant_id AND u.unit_profile_id = i.unit_profile_id;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_case_activity_daily
-- @purpose Case events per depot, UTC day and event type (cases opened, surveyed, estimates submitted / approved, work started / completed, holds released, closed): the daily M&R activity report.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_case_activity_daily
AS
SELECT e.tenant_id,
       e.branch_id,
       CAST(e.occurred_at AS DATE)                                                   AS activity_date,
       e.event_type,
       COUNT(*)                                                                      AS event_count,
       COUNT(DISTINCT e.repair_case_id)                                              AS case_count
FROM mcase.case_event e
GROUP BY e.tenant_id, e.branch_id, CAST(e.occurred_at AS DATE), e.event_type;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_connector_sla
-- @purpose One row per live connector: health, last success, minutes since it, consecutive failures; inbound events in the last 24 h, open exceptions and the oldest; outbound events waiting or failed and the oldest waiting. The connector SLA report.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_connector_sla
AS
SELECT k.connector_id,
       k.tenant_id,
       k.branch_id,
       k.connector_code,
       k.name,
       k.connector_kind,
       k.direction,
       k.environment,
       k.status                                                                      AS connector_status,
       ISNULL(h.health_status, 'UNKNOWN')                                            AS health_status,
       h.last_run_at,
       h.last_success_at,
       h.last_failure_at,
       h.last_error_text,
       ISNULL(h.consecutive_failures, 0)                                             AS consecutive_failures,
       DATEDIFF(MINUTE, h.last_success_at, SYSDATETIMEOFFSET())                      AS minutes_since_success,
       ISNULL(i.received_24h, 0)                                                     AS inbound_received_24h,
       ISNULL(i.applied_24h, 0)                                                      AS inbound_applied_24h,
       ISNULL(i.open_exceptions, 0)                                                  AS inbound_open_exceptions,
       i.oldest_exception_at,
       ISNULL(o.waiting, 0)                                                          AS outbound_waiting,
       ISNULL(o.failed, 0)                                                           AS outbound_failed,
       o.oldest_waiting_at,
       DATEDIFF(MINUTE, o.oldest_waiting_at, SYSDATETIMEOFFSET())                    AS oldest_waiting_minutes
FROM integ.connector k
LEFT JOIN integ.connector_health h
       ON h.tenant_id = k.tenant_id AND h.connector_id = k.connector_id
OUTER APPLY (
    SELECT SUM(CASE WHEN ie.received_at >= DATEADD(HOUR, -24, SYSDATETIMEOFFSET()) THEN 1 ELSE 0 END)                             AS received_24h,
           SUM(CASE WHEN ie.received_at >= DATEADD(HOUR, -24, SYSDATETIMEOFFSET()) AND ie.status = 'APPLIED' THEN 1 ELSE 0 END)   AS applied_24h,
           SUM(CASE WHEN ie.status = 'EXCEPTION' THEN 1 ELSE 0 END)                                                               AS open_exceptions,
           MIN(CASE WHEN ie.status = 'EXCEPTION' THEN ie.received_at END)                                                         AS oldest_exception_at
    FROM integ.inbound_event ie
    WHERE ie.tenant_id = k.tenant_id AND ie.connector_id = k.connector_id
      AND (ie.status = 'EXCEPTION' OR ie.received_at >= DATEADD(HOUR, -24, SYSDATETIMEOFFSET()))
) i
OUTER APPLY (
    SELECT SUM(CASE WHEN oe.status IN ('READY','SENDING') THEN 1 ELSE 0 END)                                                      AS waiting,
           SUM(CASE WHEN oe.status = 'FAILED' THEN 1 ELSE 0 END)                                                                  AS failed,
           MIN(CASE WHEN oe.status IN ('READY','SENDING') THEN oe.created_at END)                                                 AS oldest_waiting_at
    FROM integ.outbound_event oe
    WHERE oe.tenant_id = k.tenant_id AND oe.connector_id = k.connector_id
      AND oe.status IN ('READY','SENDING','FAILED')
) o
WHERE k.deleted_at IS NULL;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_stock_position
-- @purpose Parts stock per material and store (all bins summed): on hand, reserved, available, value and average cost, the reorder point and whether available stock is at or below it.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_stock_position
AS
WITH bal AS (
    SELECT b.tenant_id,
           b.store_id,
           b.material_id,
           SUM(b.qty_on_hand)                                                        AS qty_on_hand,
           SUM(b.qty_reserved)                                                       AS qty_reserved,
           SUM(b.stock_value)                                                        AS stock_value,
           MAX(b.last_movement_at)                                                   AS last_movement_at
    FROM part.stock_balance b
    WHERE b.deleted_at IS NULL
    GROUP BY b.tenant_id, b.store_id, b.material_id
)
SELECT s.branch_id,
       bal.tenant_id,
       bal.store_id,
       s.store_code,
       bal.material_id,
       m.material_code,
       m.name_en,
       m.name_local,
       m.material_category_code,
       m.base_uom_code,
       m.currency_code,
       bal.qty_on_hand,
       bal.qty_reserved,
       bal.qty_on_hand - bal.qty_reserved                                            AS qty_available,
       bal.stock_value,
       CAST(bal.stock_value / NULLIF(bal.qty_on_hand, 0) AS DECIMAL(18,4))           AS avg_unit_cost,
       ms.reorder_point,
       ms.reorder_qty,
       ms.max_qty,
       CASE WHEN ms.reorder_point IS NOT NULL AND bal.qty_on_hand - bal.qty_reserved <= ms.reorder_point THEN 1 ELSE 0 END AS is_below_reorder,
       bal.last_movement_at,
       DATEDIFF(DAY, bal.last_movement_at, SYSDATETIMEOFFSET())                      AS days_since_movement
FROM bal
JOIN part.store s
  ON s.tenant_id = bal.tenant_id AND s.store_id = bal.store_id AND s.deleted_at IS NULL
JOIN part.material m
  ON m.tenant_id = bal.tenant_id AND m.material_id = bal.material_id AND m.deleted_at IS NULL
LEFT JOIN part.material_store ms
       ON ms.tenant_id = bal.tenant_id AND ms.material_id = bal.material_id AND ms.store_id = bal.store_id AND ms.deleted_at IS NULL;
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_vendor_bill_aging
-- @purpose Vendor bills not yet exported to accounts (draft, pending approval, approved): vendor, amounts, match result and variance, age since received, days to or past due.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_vendor_bill_aging
AS
SELECT v.vendor_bill_id,
       v.tenant_id,
       v.branch_id,
       v.bill_no,
       v.vendor_party_id,
       v.vendor_party_code,
       v.vendor_invoice_no,
       v.vendor_invoice_date,
       v.received_date,
       v.due_date,
       v.status,
       v.match_status,
       v.currency_code,
       v.total_amount,
       v.expected_amount,
       v.variance_amount,
       v.dispute_reason,
       DATEDIFF(DAY, v.received_date, CAST(SYSUTCDATETIME() AS DATE))                AS age_days,
       DATEDIFF(DAY, CAST(SYSUTCDATETIME() AS DATE), v.due_date)                     AS days_to_due,
       CASE WHEN v.due_date IS NOT NULL AND v.due_date < CAST(SYSUTCDATETIME() AS DATE) THEN 1 ELSE 0 END AS is_past_due
FROM vend.vendor_bill v
WHERE v.deleted_at IS NULL
  AND v.status IN ('DRAFT','PENDING_APPROVAL','APPROVED');
GO

-- ------------------------------------------------------------
-- @view    rpt.vw_depot_kpi
-- @purpose Dashboard tiles, one row per depot (branch) with activity: open cases by stage, SLA breaches on open cases, cases opened / completed today (UTC), estimates waiting on the owner, open work orders and overdue ones, open cleaning and PTI jobs, unreleased charge lines, DM boxes in depot. Counts only (amounts differ in currency); the tenant roll-up is the sum of the rows.
-- @owner   R14 Dashboard, Inquiry & Reports
-- ------------------------------------------------------------
CREATE OR ALTER VIEW rpt.vw_depot_kpi
AS
WITH c AS (
    SELECT tenant_id, branch_id,
           SUM(is_open)                                                                         AS open_cases,
           SUM(CASE WHEN case_status IN ('OPEN','ESTIMATING') THEN 1 ELSE 0 END)                AS cases_estimating,
           SUM(CASE WHEN case_status = 'AWAITING_APPROVAL' THEN 1 ELSE 0 END)                   AS cases_awaiting_approval,
           SUM(CASE WHEN case_status = 'APPROVED' THEN 1 ELSE 0 END)                            AS cases_ready_for_repair,
           SUM(CASE WHEN case_status = 'IN_REPAIR' THEN 1 ELSE 0 END)                           AS cases_in_repair,
           SUM(is_open * estimate_sla_breached)                                                 AS open_estimate_sla_breached,
           SUM(is_open * repair_sla_breached)                                                   AS open_repair_sla_breached,
           SUM(CASE WHEN CAST(opened_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE) THEN 1 ELSE 0 END)    AS cases_opened_today,
           SUM(CASE WHEN CAST(completed_at AS DATE) = CAST(SYSUTCDATETIME() AS DATE) THEN 1 ELSE 0 END) AS cases_completed_today
    FROM rpt.vw_case_board
    GROUP BY tenant_id, branch_id
),
a AS (
    SELECT tenant_id, branch_id, COUNT(*) AS estimates_waiting_owner,
           SUM(CASE WHEN age_hours >= 72 THEN 1 ELSE 0 END) AS estimates_waiting_owner_3d
    FROM rpt.vw_approval_aging WHERE waiting_on = 'OWNER'
    GROUP BY tenant_id, branch_id
),
w AS (
    SELECT tenant_id, branch_id, COUNT(*) AS open_work_orders, SUM(is_overdue) AS overdue_work_orders,
           SUM(CASE WHEN status = 'AWAITING_QC' THEN 1 ELSE 0 END) AS work_orders_awaiting_qc
    FROM rpt.vw_wip
    GROUP BY tenant_id, branch_id
),
cl AS (
    SELECT tenant_id, branch_id, COUNT(*) AS open_cleaning_jobs
    FROM clean.cleaning_job
    WHERE deleted_at IS NULL AND status IN ('QUEUED','ASSIGNED','STARTED','PAUSED')
    GROUP BY tenant_id, branch_id
),
p AS (
    SELECT tenant_id, branch_id, COUNT(*) AS open_pti_jobs
    FROM reefer.pti_job
    WHERE deleted_at IS NULL AND status IN ('REQUESTED','SCHEDULED','IN_PROGRESS','ON_HOLD')
    GROUP BY tenant_id, branch_id
),
ch AS (
    SELECT tenant_id, branch_id, COUNT(*) AS unreleased_charge_lines,
           SUM(CASE WHEN status = 'HELD' THEN 1 ELSE 0 END) AS held_charge_lines
    FROM charge.billable_item
    WHERE deleted_at IS NULL AND status IN ('READY','HELD')
    GROUP BY tenant_id, branch_id
),
d AS (
    SELECT tenant_id, branch_id, COUNT(*) AS dm_boxes_in_depot,
           SUM(CASE WHEN days_in_depot >= 30 THEN 1 ELSE 0 END) AS dm_boxes_30d_plus
    FROM rpt.vw_damaged_stock
    GROUP BY tenant_id, branch_id
),
k AS (
    SELECT tenant_id, branch_id FROM c  UNION
    SELECT tenant_id, branch_id FROM w  UNION
    SELECT tenant_id, branch_id FROM cl UNION
    SELECT tenant_id, branch_id FROM p  UNION
    SELECT tenant_id, branch_id FROM ch
)
SELECT k.tenant_id,
       k.branch_id,
       ISNULL(c.open_cases, 0)                     AS open_cases,
       ISNULL(c.cases_estimating, 0)               AS cases_estimating,
       ISNULL(c.cases_awaiting_approval, 0)        AS cases_awaiting_approval,
       ISNULL(c.cases_ready_for_repair, 0)         AS cases_ready_for_repair,
       ISNULL(c.cases_in_repair, 0)                AS cases_in_repair,
       ISNULL(c.open_estimate_sla_breached, 0)     AS open_estimate_sla_breached,
       ISNULL(c.open_repair_sla_breached, 0)       AS open_repair_sla_breached,
       ISNULL(c.cases_opened_today, 0)             AS cases_opened_today,
       ISNULL(c.cases_completed_today, 0)          AS cases_completed_today,
       ISNULL(a.estimates_waiting_owner, 0)        AS estimates_waiting_owner,
       ISNULL(a.estimates_waiting_owner_3d, 0)     AS estimates_waiting_owner_3d,
       ISNULL(w.open_work_orders, 0)               AS open_work_orders,
       ISNULL(w.overdue_work_orders, 0)            AS overdue_work_orders,
       ISNULL(w.work_orders_awaiting_qc, 0)        AS work_orders_awaiting_qc,
       ISNULL(cl.open_cleaning_jobs, 0)            AS open_cleaning_jobs,
       ISNULL(p.open_pti_jobs, 0)                  AS open_pti_jobs,
       ISNULL(ch.unreleased_charge_lines, 0)       AS unreleased_charge_lines,
       ISNULL(ch.held_charge_lines, 0)             AS held_charge_lines,
       ISNULL(d.dm_boxes_in_depot, 0)              AS dm_boxes_in_depot,
       ISNULL(d.dm_boxes_30d_plus, 0)              AS dm_boxes_30d_plus
FROM k
LEFT JOIN c  ON c.tenant_id  = k.tenant_id AND c.branch_id  = k.branch_id
LEFT JOIN a  ON a.tenant_id  = k.tenant_id AND a.branch_id  = k.branch_id
LEFT JOIN w  ON w.tenant_id  = k.tenant_id AND w.branch_id  = k.branch_id
LEFT JOIN cl ON cl.tenant_id = k.tenant_id AND cl.branch_id = k.branch_id
LEFT JOIN p  ON p.tenant_id  = k.tenant_id AND p.branch_id  = k.branch_id
LEFT JOIN ch ON ch.tenant_id = k.tenant_id AND ch.branch_id = k.branch_id
LEFT JOIN d  ON d.tenant_id  = k.tenant_id AND d.branch_id  = k.branch_id;
GO

-- ------------------------------------------------------------
-- Self-check: every view compiles against today's tables.
-- ------------------------------------------------------------
DECLARE @bad NVARCHAR(MAX) = N'', @v SYSNAME;
DECLARE v CURSOR LOCAL FAST_FORWARD FOR
    SELECT SCHEMA_NAME(schema_id) + N'.' + name FROM sys.views WHERE SCHEMA_NAME(schema_id) = 'rpt';
OPEN v; FETCH NEXT FROM v INTO @v;
WHILE @@FETCH_STATUS = 0
BEGIN
    BEGIN TRY EXEC sp_refreshview @v; END TRY
    BEGIN CATCH SET @bad += @v + N' (' + ERROR_MESSAGE() + N') '; END CATCH
    FETCH NEXT FROM v INTO @v;
END
CLOSE v; DEALLOCATE v;
IF @bad <> N''
BEGIN
    PRINT 'Broken views: ' + @bad;
    THROW 50342, 'An rpt view does not compile against the current tables.', 1;
END
DECLARE @n INT = (SELECT COUNT(*) FROM sys.views WHERE SCHEMA_NAME(schema_id) = 'rpt');
PRINT '>> ' + CAST(@n AS VARCHAR(10)) + ' rpt views compile.';
GO

EXEC dbo.usp_record_script '22_rpt.sql', N'rpt views (16): case board + KPI clocks, approval aging, damaged stock, cut rate, WO margin, billable charges, repeat damage, WIP, cleaning / PTI daily, certificate expiry, case activity daily, connector SLA, stock position, vendor bill aging, depot KPI tiles. Base-table RLS applies through them.';
GO

PRINT '>> 22_rpt.sql completed.';
GO
