ALTER TABLE public.core_entities
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;

BEGIN;

CREATE TEMP TABLE t_core_entities AS TABLE public.core_entities WITH NO DATA;
\COPY t_core_entities FROM 'public__core_entities.csv' WITH CSV HEADER

UPDATE t_core_entities
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);

DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_entities'::regclass
    AND conname='chk_core_entities_smart_code_pattern'
    AND contype='c';
  IF expr IS NULL THEN RAISE EXCEPTION 'Missing CHECK: chk_core_entities_smart_code_pattern'; END IF;

  EXECUTE format(
    'INSERT INTO public.core_entities SELECT * FROM t_core_entities WHERE %s ON CONFLICT DO NOTHING',
    expr
  );
END $do$;

COMMIT;

ALTER TABLE public.core_entities
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
