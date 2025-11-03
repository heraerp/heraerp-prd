BEGIN;
CREATE TEMP TABLE t_core_relationships AS TABLE public.core_relationships WITH NO DATA;
\COPY t_core_relationships FROM 'public__core_relationships.csv' WITH CSV HEADER
UPDATE t_core_relationships
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_relationships'::regclass
    AND conname='core_relationships_smart_code_ck' AND contype='c';
  IF expr IS NOT NULL THEN
    expr := replace(expr, '"smart_code"', 'r.smart_code');
    expr := replace(expr, 'smart_code', 'r.smart_code');
  END IF;
  IF expr IS NULL THEN
    INSERT INTO public.core_relationships
    SELECT r.*
    FROM t_core_relationships r
    JOIN public.core_entities e_from ON e_from.id = r.from_entity_id
    JOIN public.core_entities e_to   ON e_to.id   = r.to_entity_id
    WHERE r.organization_id = current_setting('app.org_id')::uuid
    ON CONFLICT DO NOTHING;
  ELSE
    EXECUTE format(
      'INSERT INTO public.core_relationships
         SELECT r.*
         FROM t_core_relationships r
         JOIN public.core_entities e_from ON e_from.id = r.from_entity_id
         JOIN public.core_entities e_to   ON e_to.id   = r.to_entity_id
         WHERE r.organization_id = current_setting(''app.org_id'')::uuid AND (%s)
       ON CONFLICT DO NOTHING',
      expr
    );
  END IF;
END $do$;
COMMIT;
