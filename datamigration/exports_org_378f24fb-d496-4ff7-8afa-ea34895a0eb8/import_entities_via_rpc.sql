BEGIN;

-- stage the CSV as text to avoid type surprises
CREATE TEMP TABLE t_core_entities_stage AS TABLE public.core_entities WITH NO DATA;
\COPY t_core_entities_stage FROM 'public__core_entities.csv' WITH CSV HEADER

-- call RPC per row (UPSERT) — RPC handles smart_code checks & audit stamping
-- you can add WHERE organization_id = :'ORG_ID' if needed
SELECT hera_entities_crud_v2(
  p_actor_user_id      := :'ACTOR_ID',
  p_organization_id    := :'ORG_ID',
  p_operation          := 'UPSERT',
  p_data               := to_jsonb(t),
  p_source             := 'bulk_import'
)
FROM t_core_entities_stage t;

COMMIT;
