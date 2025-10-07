-- HERA Enterprise Partitioning
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Strategy: LIST by organization_id, then RANGE monthly on event_time for hera_UT/UTL logs
-- Notes:
-- - All objects are namespaced with hera_ to respect the covenant.
-- - This script is idempotent and safe to re-run.
-- - Do NOT alter sacred core tables here.

-- Ensure required extension for partitioning helpers (no-op if present)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- hera_ut: Universal Transactions log (example infra table, not a business table)
-- Parent partitioned table by LIST (organization_id)
CREATE TABLE IF NOT EXISTS hera_ut (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  category text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
)
PARTITION BY LIST (organization_id);

-- Subpartition template: by RANGE on event_time monthly
-- For each org partition, we further partition by month
-- Helper function to create monthly range partitions for a given org
CREATE OR REPLACE FUNCTION hera_ut_create_monthly_partitions(p_org_id uuid, p_start date, p_months int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i int;
  v_month_start date;
  v_month_end date;
  v_org_part regclass;
  v_org_part_name text;
  v_part_name text;
BEGIN
  v_org_part_name := format('hera_ut_org_%s', replace(p_org_id::text,'-',''));
  IF to_regclass(v_org_part_name) IS NULL THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF hera_ut FOR VALUES IN (%L) PARTITION BY RANGE (event_time)'
      , v_org_part_name, p_org_id
    );
  END IF;

  FOR i IN 0..p_months-1 LOOP
    v_month_start := (p_start + (i || ' months')::interval)::date;
    v_month_end := (v_month_start + interval '1 month')::date;
    v_part_name := format('%s_%s', v_org_part_name, to_char(v_month_start,'YYYYMM'));
    IF to_regclass(v_part_name) IS NULL THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)'
        , v_part_name, v_org_part_name, v_month_start, v_month_end
      );
    END IF;
  END LOOP;
END;
$$;

-- hera_utl: Universal Transaction Log (lightweight), same scheme
CREATE TABLE IF NOT EXISTS hera_utl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_time timestamptz NOT NULL DEFAULT now(),
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
)
PARTITION BY LIST (organization_id);

CREATE OR REPLACE FUNCTION hera_utl_create_monthly_partitions(p_org_id uuid, p_start date, p_months int)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  i int;
  v_month_start date;
  v_month_end date;
  v_org_part_name text;
  v_part_name text;
BEGIN
  v_org_part_name := format('hera_utl_org_%s', replace(p_org_id::text,'-',''));
  IF to_regclass(v_org_part_name) IS NULL THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF hera_utl FOR VALUES IN (%L) PARTITION BY RANGE (event_time)'
      , v_org_part_name, p_org_id
    );
  END IF;

  FOR i IN 0..p_months-1 LOOP
    v_month_start := (p_start + (i || ' months')::interval)::date;
    v_month_end := (v_month_start + interval '1 month')::date;
    v_part_name := format('%s_%s', v_org_part_name, to_char(v_month_start,'YYYYMM'));
    IF to_regclass(v_part_name) IS NULL THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)'
        , v_part_name, v_org_part_name, v_month_start, v_month_end
      );
    END IF;
  END LOOP;
END;
$$;

-- Optional: seed partitions for known org_ids via manifest apply script
-- SELECT hera_ut_create_monthly_partitions('00000000-0000-0000-0000-000000000000', date_trunc('month', now())::date, 6);
-- SELECT hera_utl_create_monthly_partitions('00000000-0000-0000-0000-000000000000', date_trunc('month', now())::date, 6);

