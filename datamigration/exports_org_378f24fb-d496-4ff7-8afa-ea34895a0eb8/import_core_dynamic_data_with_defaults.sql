-- TEMP defaults so triggers have an actor
ALTER TABLE public.core_dynamic_data
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;

BEGIN;

-- Stage CSV into a temp table shaped like target
CREATE TEMP TABLE t_core_dynamic_data AS TABLE public.core_dynamic_data WITH NO DATA;
\COPY t_core_dynamic_data FROM 'public__core_dynamic_data.csv' WITH CSV HEADER

-- Stamp actor on staged rows
UPDATE t_core_dynamic_data
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);

-- Ensure org on staged rows (in case CSV is missing it)
UPDATE t_core_dynamic_data
SET organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);

-- Set session org for RLS policies
SELECT set_config('app.org_id', :'ORG_ID', true);

DO $do$
DECLARE
  expr TEXT;
BEGIN
  -- Get only the predicate of the CHECK constraint
  SELECT pg_get_expr(conbin, conrelid)
    INTO expr
  FROM pg_constraint
  WHERE conrelid = 'public.core_dynamic_data'::regclass
    AND conname  = 'core_dynamic_data_smart_code_ck'
    AND contype  = 'c';

  -- Qualify 'smart_code' to d.smart_code to avoid ambiguity
  IF expr IS NOT NULL THEN
    expr := replace(expr, '"smart_code"', 'd.smart_code');
    expr := replace(expr, 'smart_code', 'd.smart_code');
  END IF;

  IF expr IS NULL THEN
    INSERT INTO public.core_dynamic_data
    SELECT d.*
    FROM t_core_dynamic_data d
    JOIN public.core_entities e ON e.id = d.entity_id
    WHERE d.organization_id = current_setting('app.org_id')::uuid
    ON CONFLICT DO NOTHING;
  ELSE
    EXECUTE format(
      'INSERT INTO public.core_dynamic_data
         SELECT d.*
         FROM t_core_dynamic_data d
         JOIN public.core_entities e ON e.id = d.entity_id
         WHERE d.organization_id = current_setting(''app.org_id'')::uuid AND (%s)
       ON CONFLICT DO NOTHING',
      expr
    );
  END IF;
END
$do$;

COMMIT;

-- Drop TEMP defaults immediately
ALTER TABLE public.core_dynamic_data
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
