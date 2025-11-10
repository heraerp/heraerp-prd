-- Fix bulk RPC to check for both USER_MEMBER_OF_ORG and MEMBER_OF relationships
-- This makes it compatible with existing data

CREATE OR REPLACE FUNCTION public.hera_entities_bulk_crud_v1(
    p_action          text,
    p_actor_user_id   uuid,
    p_organization_id uuid,
    p_entities        jsonb DEFAULT '[]'::jsonb,
    p_options         jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    -- Normalized action
    v_action          text  := upper(coalesce(p_action,''));

    -- Global options (applied to all, can be overridden per-entity)
    v_global_options  jsonb := coalesce(p_options, '{}'::jsonb);

    -- Atomic mode: if true and any failures, rollback all changes
    v_atomic          boolean := coalesce((v_global_options->>'atomic')::boolean, false);

    -- Batch size guardrail (can be overridden in options)
    v_max_batch_size  int := coalesce((v_global_options->>'max_batch_size')::int, 1000);

    -- Loop variables
    v_idx             int := 0;
    v_total           int := 0;
    v_item            jsonb;
    v_entity          jsonb;
    v_dynamic         jsonb;
    v_relationships   jsonb;
    v_entity_opts     jsonb;
    v_call_opts       jsonb;
    v_call_result     jsonb;

    -- Aggregated results
    v_results         jsonb := '[]'::jsonb;
    v_success_count   int   := 0;
    v_failure_count   int   := 0;

    -- Error context
    v_err_context     text;
    v_err_msg         text;
BEGIN
    -- ===== FATAL VALIDATION (Batch-level guardrails) =====

    IF v_action NOT IN ('CREATE','READ','UPDATE','DELETE') THEN
      RAISE EXCEPTION 'HERA_INVALID_ACTION:%', p_action;
    END IF;

    IF p_organization_id IS NULL THEN
      RAISE EXCEPTION 'HERA_ORG_REQUIRED';
    END IF;

    IF p_actor_user_id IS NULL THEN
      RAISE EXCEPTION 'HERA_ACTOR_REQUIRED';
    END IF;

    -- Pre-validate actor membership (fail fast before processing entities)
    -- UPDATED: Check for both USER_MEMBER_OF_ORG and MEMBER_OF relationship types
    IF v_action IN ('CREATE','UPDATE','DELETE') THEN
      IF NOT EXISTS (
        SELECT 1
        FROM core_relationships cr
        WHERE cr.organization_id   = p_organization_id
          AND cr.from_entity_id    = p_actor_user_id
          AND cr.to_entity_id      = p_organization_id
          AND cr.relationship_type IN ('USER_MEMBER_OF_ORG', 'MEMBER_OF')  -- Support both types
          AND cr.is_active         = true
          AND (cr.expiration_date IS NULL OR cr.expiration_date > now())
      ) THEN
        RAISE EXCEPTION 'HERA_ACTOR_NOT_MEMBER: Actor % not member of organization %',
          p_actor_user_id, p_organization_id;
      END IF;
    END IF;

    -- Require array for bulk
    IF jsonb_typeof(p_entities) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'HERA_ENTITIES_ARRAY_REQUIRED';
    END IF;

    v_total := jsonb_array_length(p_entities);

    -- Nothing to do: return empty success
    IF v_total = 0 THEN
      RETURN jsonb_build_object(
        'success',         true,
        'action',          v_action,
        'organization_id', p_organization_id,
        'total',           0,
        'succeeded',       0,
        'failed',          0,
        'atomic',          v_atomic,
        'results',         '[]'::jsonb
      );
    END IF;

    -- Batch size guardrail
    IF v_total > v_max_batch_size THEN
      RAISE EXCEPTION 'HERA_BATCH_TOO_LARGE: Maximum % entities per call (got %)',
        v_max_batch_size, v_total;
    END IF;

    -- ===== MAIN PROCESSING LOOP =====

    FOR v_idx IN 0..(v_total - 1) LOOP
      BEGIN
        v_item := p_entities->v_idx;

        -- Shape 1: envelope { entity, dynamic, relationships, options }
        -- Shape 2: bare entity { entity_type, entity_name, ... }
        v_entity        := coalesce(v_item->'entity',        v_item);
        v_dynamic       := coalesce(v_item->'dynamic',       '{}'::jsonb);
        v_relationships := coalesce(v_item->'relationships', '[]'::jsonb);  -- ARRAY default
        v_entity_opts   := coalesce(v_item->'options',       '{}'::jsonb);

        -- Merge global + per-entity options (per-entity wins)
        v_call_opts := v_global_options || v_entity_opts;

        -- Delegate actual work to existing single-entity RPC
        v_call_result := public.hera_entities_crud_v1(
          v_action,
          p_actor_user_id,
          p_organization_id,
          v_entity,
          v_dynamic,
          v_relationships,
          v_call_opts
        );

        -- Defensive result validation
        IF v_call_result IS NULL OR jsonb_typeof(v_call_result) <> 'object' THEN
          v_call_result := jsonb_build_object(
            'success', false,
            'error',   'HERA_BULK_NULL_RESULT',
            'context', jsonb_build_object('index', v_idx)
          );
        END IF;

        -- In atomic mode, fail fast on first logical error
        IF v_atomic AND NOT coalesce((v_call_result->>'success')::boolean, false) THEN
          RAISE EXCEPTION 'HERA_BULK_ATOMIC_FAILED at index %: %',
            v_idx, coalesce(v_call_result->>'error', 'UNKNOWN_ERROR');
        END IF;

        -- Update stats
        IF coalesce((v_call_result->>'success')::boolean, false) THEN
          v_success_count := v_success_count + 1;
        ELSE
          v_failure_count := v_failure_count + 1;
        END IF;

        -- Append per-entity result with index
        v_results := v_results || jsonb_build_array(
          jsonb_build_object(
            'index',     v_idx,
            'entity_id', v_call_result->>'entity_id',
            'success',   coalesce((v_call_result->>'success')::boolean, false),
            'result',    v_call_result
          )
        );

        -- Progress notice for large batches
        IF v_idx > 0 AND v_idx % 100 = 0 THEN
          RAISE NOTICE 'HERA_BULK_PROGRESS: Processed % of % entities (% succeeded, % failed)',
            v_idx, v_total, v_success_count, v_failure_count;
        END IF;

      EXCEPTION
        WHEN OTHERS THEN
          -- Per-entity exception handling (non-atomic mode only)
          v_err_msg := SQLERRM;
          v_failure_count := v_failure_count + 1;

          -- Append error result
          v_results := v_results || jsonb_build_array(
            jsonb_build_object(
              'index',    v_idx,
              'success',  false,
              'error',    v_err_msg,
              'sqlstate', SQLSTATE
            )
          );

          -- In atomic mode, re-raise to trigger rollback of entire batch
          IF v_atomic THEN
            RAISE;
          END IF;
      END;
    END LOOP;

    -- ===== SUCCESS RESPONSE =====
    -- We only reach here if no exceptions escaped the loop
    RETURN jsonb_build_object(
      'success',         (v_failure_count = 0),
      'action',          v_action,
      'organization_id', p_organization_id,
      'total',           v_total,
      'succeeded',       v_success_count,
      'failed',          v_failure_count,
      'atomic',          v_atomic,
      'results',         v_results
    );

EXCEPTION
  WHEN OTHERS THEN
    -- ===== ERROR RESPONSE (Fatal or Atomic Rollback) =====
    -- All DML in the BEGIN block is rolled back.
    -- Local vars (v_results, counts) are still visible here.
    GET STACKED DIAGNOSTICS v_err_context = PG_EXCEPTION_CONTEXT;

    RETURN jsonb_build_object(
      'success',         false,
      'action',          v_action,
      'organization_id', p_organization_id,
      'total',           v_total,
      'succeeded',       v_success_count,
      'failed',          v_failure_count,
      'atomic',          v_atomic,
      'atomic_rollback', v_atomic,  -- if we're here in atomic mode, rollback occurred
      'error',           SQLERRM,
      'sqlstate',        SQLSTATE,
      'context',         v_err_context,
      'partial_results', v_results
    );
END;
$function$;

COMMENT ON FUNCTION public.hera_entities_bulk_crud_v1(text, uuid, uuid, jsonb, jsonb) IS
'HERA Bulk Entities CRUD v1 - Processes multiple entity operations in a single call.

UPDATED: Now supports both USER_MEMBER_OF_ORG and MEMBER_OF relationship types for actor membership validation.

ATOMIC MODE (atomic: true):
  - All operations succeed or all rollback
  - Fails fast on first error
  - Returns error response with partial_results

NON-ATOMIC MODE (atomic: false, default):
  - Continues processing after errors
  - Returns mix of successes and failures
  - Useful for bulk imports with validation

BATCH LIMITS:
  - Default: 1000 entities per call
  - Override via options: { "max_batch_size": 500 }

ACTOR VALIDATION:
  - Pre-validates actor membership before processing
  - Supports USER_MEMBER_OF_ORG and MEMBER_OF relationship types
  - Delegates to hera_entities_crud_v1 for entity-level rules.';
