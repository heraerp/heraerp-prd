BEGIN;

-- Stage the CSV
CREATE TEMP TABLE t_core_dynamic_data AS TABLE public.core_dynamic_data WITH NO DATA;
\COPY t_core_dynamic_data FROM 'public__core_dynamic_data.csv' WITH CSV HEADER

DO $do$
DECLARE
  expr TEXT;
  inserted BIGINT := 0;
  total    BIGINT := 0;
BEGIN
  -- get ONLY the predicate for the CHECK constraint
  SELECT pg_get_expr(conbin, conrelid)
    INTO expr
  FROM pg_constraint
  WHERE conrelid = 'public.core_dynamic_data'::regclass
    AND conname  = 'core_dynamic_data_smart_code_ck'
    AND contype  = 'c';

  IF expr IS NULL THEN
    RAISE EXCEPTION 'Could not find CHECK constraint core_dynamic_data_smart_code_ck';
  END IF;

  SELECT count(*) INTO total FROM t_core_dynamic_data;

  -- insert only rows that satisfy the CHECK predicate
  EXECUTE format(
    'INSERT INTO public.core_dynamic_data SELECT * FROM t_core_dynamic_data WHERE %s',
    expr
  );

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RAISE NOTICE 'Inserted %, skipped % (failed CHECK)', inserted, (total - inserted);
END
$do$;

COMMIT;
