BEGIN;

-- Stage rows into a temp table with the same structure as the target
CREATE TEMP TABLE t_core_dynamic_data AS TABLE public.core_dynamic_data WITH NO DATA;

-- Load the CSV into the temp table (client-side copy)
\COPY t_core_dynamic_data FROM '/Users/san/documents/PRD/heraerp-dev/datamigration/exports_org_378f24fb-d496-4ff7-8afa-ea34895a0eb8/public__core_dynamic_data.csv' WITH CSV HEADER

DO $do$
DECLARE
  expr text;
  inserted bigint := 0;
  total    bigint := 0;
BEGIN
  -- Get ONLY the predicate of the CHECK constraint (no 'CHECK (...)', no 'NOT VALID')
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

  -- Bypass FKs/triggers for the insert (CHECK still enforced; we filter ourselves)
  PERFORM set_config('session_replication_role','replica', true);

  -- Insert only rows that satisfy the CHECK expression
  EXECUTE format(
    'INSERT INTO public.core_dynamic_data SELECT * FROM t_core_dynamic_data WHERE %s',
    expr
  );

  GET DIAGNOSTICS inserted = ROW_COUNT;

  RAISE NOTICE 'Inserted %, skipped % (failed CHECK)', inserted, (total - inserted);
END
$do$;

COMMIT;
