-- HERA Universal Workflow Read Models
-- Pure Six-Table + JSON reads for operational visibility
-- No new tables; materialized views for performance

-- 1) Workflow Instances View
CREATE OR REPLACE VIEW wf_instances_view AS
SELECT
  ut.id                           AS instance_id,
  ut.organization_id,
  (ut.dynamic->>'definition_code')        AS definition_code,
  (ut.dynamic->>'definition_version')     AS definition_version,
  (ut.dynamic->>'current_state')          AS current_state,
  (ut.dynamic->>'subject_ref')            AS subject_ref_json,
  (ut.dynamic->>'sla_at')::timestamptz    AS sla_at,
  (ut.dynamic->>'paused')::boolean        AS paused,
  (ut.dynamic->>'owner_team')             AS owner_team,
  (ut.dynamic->>'owner_user_id')          AS owner_user_id,
  ut.status,
  ut.created_at,
  ut.updated_at
FROM universal_transactions ut
WHERE ut.smart_code = 'HERA.UNIV.WF.INSTANCE.V1';

-- 2) Workflow Steps / Transitions View
CREATE OR REPLACE VIEW wf_steps_view AS
SELECT
  utl.transaction_id               AS instance_id,
  utl.id                           AS step_id,
  utl.organization_id,
  (utl.dynamic->>'from')           AS from_state,
  (utl.dynamic->>'to')             AS to_state,
  (utl.dynamic->>'by')             AS actor_role,
  (utl.dynamic->>'actor_user_id')  AS actor_user_id,
  (utl.dynamic->>'duration_ms')::bigint AS duration_ms,
  (utl.dynamic->>'note')           AS note,
  COALESCE((utl.dynamic->'effects_failed')::jsonb, '[]'::jsonb) AS effects_failed,
  COALESCE((utl.dynamic->'guards_executed')::jsonb, '[]'::jsonb) AS guards_executed,
  COALESCE((utl.dynamic->'effects_queued')::jsonb, '[]'::jsonb) AS effects_queued,
  utl.created_at
FROM universal_transaction_lines utl
WHERE utl.smart_code = 'HERA.UNIV.WF.STEP.V1';

-- 3) Workflow Tasks View
CREATE OR REPLACE VIEW wf_tasks_view AS
WITH task_dyn AS (
  SELECT
    cdd.organization_id,
    cdd.entity_id,
    jsonb_object_agg(cdd.key_slug, cdd.value_json) AS dd
  FROM core_dynamic_data cdd
  JOIN core_entities ce ON ce.id = cdd.entity_id
  WHERE ce.entity_type = 'task'
  GROUP BY 1,2
)
SELECT
  ce.id                         AS task_id,
  ce.organization_id,
  ce.entity_name                AS title,
  ce.status,
  (task_dyn.dd->'task'->>'state')                 AS task_state,
  (task_dyn.dd->'task'->>'assignee_user_id')      AS assignee_user_id,
  (task_dyn.dd->'task'->>'assignee_role')         AS assignee_role,
  (task_dyn.dd->'task'->>'due_at')::timestamptz   AS due_at,
  (task_dyn.dd->'task'->>'sla_at')::timestamptz   AS sla_at,
  (task_dyn.dd->'task'->>'instance_id')           AS instance_id,
  (task_dyn.dd->'task'->>'priority')              AS priority,
  (task_dyn.dd->'task'->>'outcome')               AS outcome,
  (task_dyn.dd->'task'->>'completed_at')::timestamptz AS completed_at,
  (task_dyn.dd->'task'->>'completed_by')          AS completed_by,
  ce.created_at, 
  ce.updated_at
FROM core_entities ce
LEFT JOIN task_dyn ON task_dyn.entity_id = ce.id
WHERE ce.entity_type = 'task';

-- 4) Workflow Timers View
CREATE OR REPLACE VIEW wf_timers_view AS
SELECT
  ut.id                           AS timer_id,
  ut.organization_id,
  (ut.dynamic->>'instance_id')    AS instance_id,
  (ut.dynamic->>'name')           AS timer_name,
  (ut.dynamic->>'fire_at')::timestamptz AS fire_at,
  (ut.dynamic->>'on_fire_smart_code') AS on_fire_smart_code,
  (ut.dynamic->>'status')         AS timer_status,
  (ut.dynamic->>'fired_at')::timestamptz AS fired_at,
  ut.created_at
FROM universal_transactions ut
WHERE ut.smart_code = 'HERA.UNIV.WF.TIMER.V1';

-- 5) Workflow Effects View
CREATE OR REPLACE VIEW wf_effects_view AS
SELECT
  ut.id                           AS effect_id,
  ut.organization_id,
  (ut.dynamic->>'instance_id')    AS instance_id,
  (ut.dynamic->>'step_id')        AS step_id,
  (ut.dynamic->>'effect_smart_code') AS effect_smart_code,
  (ut.dynamic->>'status')         AS effect_status,
  (ut.dynamic->>'attempt_count')::integer AS attempt_count,
  (ut.dynamic->>'last_error')     AS last_error,
  (ut.dynamic->>'next_retry_at')::timestamptz AS next_retry_at,
  (ut.dynamic->>'completed_at')::timestamptz AS completed_at,
  ut.created_at
FROM universal_transactions ut
WHERE ut.smart_code = 'HERA.UNIV.WF.EFFECT.V1';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_wf_instances_org_state 
  ON universal_transactions (organization_id, (dynamic->>'current_state')) 
  WHERE smart_code = 'HERA.UNIV.WF.INSTANCE.V1';

CREATE INDEX IF NOT EXISTS idx_wf_instances_sla 
  ON universal_transactions (organization_id, ((dynamic->>'sla_at')::timestamptz)) 
  WHERE smart_code = 'HERA.UNIV.WF.INSTANCE.V1' 
  AND (dynamic->>'sla_at') IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wf_steps_instance 
  ON universal_transaction_lines (transaction_id) 
  WHERE smart_code = 'HERA.UNIV.WF.STEP.V1';

CREATE INDEX IF NOT EXISTS idx_wf_tasks_state_due 
  ON core_entities (organization_id, status) 
  WHERE entity_type = 'task';

CREATE INDEX IF NOT EXISTS idx_wf_timers_due 
  ON universal_transactions (organization_id, ((dynamic->>'fire_at')::timestamptz), (dynamic->>'status')) 
  WHERE smart_code = 'HERA.UNIV.WF.TIMER.V1';

CREATE INDEX IF NOT EXISTS idx_wf_effects_retry 
  ON universal_transactions (organization_id, ((dynamic->>'next_retry_at')::timestamptz), (dynamic->>'status')) 
  WHERE smart_code = 'HERA.UNIV.WF.EFFECT.V1';

-- Aggregate Performance View (for dashboards)
CREATE OR REPLACE VIEW wf_metrics_view AS
SELECT
  organization_id,
  COUNT(*) FILTER (WHERE current_state NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')) AS active_instances,
  COUNT(*) FILTER (WHERE current_state IN ('COMPLETED')) AS completed_instances,
  COUNT(*) FILTER (WHERE current_state IN ('CANCELLED', 'FAILED')) AS failed_instances,
  COUNT(*) FILTER (WHERE paused = true) AS paused_instances,
  COUNT(*) FILTER (WHERE sla_at < NOW() AND current_state NOT IN ('COMPLETED', 'CANCELLED', 'FAILED')) AS overdue_instances,
  MAX(created_at) AS last_instance_created
FROM wf_instances_view
GROUP BY organization_id;