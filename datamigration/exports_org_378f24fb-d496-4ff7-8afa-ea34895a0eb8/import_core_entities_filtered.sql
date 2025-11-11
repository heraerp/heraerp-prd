BEGIN;

CREATE TEMP TABLE t_core_entities AS TABLE public.core_entities WITH NO DATA;
\COPY t_core_entities FROM 'public__core_entities.csv' WITH CSV HEADER

-- Stamp actor to satisfy BEFORE INSERT trigger
UPDATE t_core_entities
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);

DO $do$
DECLARE
  expr TEXT;
  inserted BIGINT := 0;
  total    BIGINT := 0;
BEGIN
  -- Only the predicate of the CHECK
  SELECT pg_get_expr(conbin, conrelid)
    INTO expr
  FROM pg_constraint
  WHERE conrelid = 'public.core_entities'::regclass
    AND conname  = 'chk_core_entities_smart_code_pattern'
    AND contype  = 'c';

  IF expr IS NULL THEN
    RAISE EXCEPTION 'Missing CHECK constraint: chk_core_entities_smart_code_pattern';
  END IF;

  SELECT count(*) INTO total FROM t_core_entities;

  -- Insert only rows passing the CHECK; ignore duplicates
  EXECUTE format(
    'INSERT INTO public.core_entities SELECT * FROM t_core_entities WHERE %s ON CONFLICT DO NOTHING',
    expr
  );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RAISE NOTICE 'core_entities: inserted %, skipped % (failed CHECK or conflicts)', inserted, (total - inserted);
END
$do$;

COMMIT;
