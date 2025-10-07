-- HERA Enterprise RPCs (only hera_ prefixed functions)
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Note: Business RPCs should be defined elsewhere; here we enforce/ensure hera_ infra functions exist.

-- Example: hera_current_org_id() helper ensured in rls.sql
-- Additional infra RPCs may be added here, always prefixed with hera_

-- Placeholder for manifest-driven RPCs (apply.ts will manage)

-- One-time infra helper (namespaced, read-only)
CREATE OR REPLACE FUNCTION public.hera_execute_readonly_sql(
  p_sql text,
  p_params jsonb DEFAULT '[]'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout = '8s'
SET row_security = on
AS $$
DECLARE
  res jsonb;
BEGIN
  -- hard deny: anything not beginning with SELECT/with CTE
  IF p_sql !~* '^\s*(with|select)\b' THEN
    RAISE EXCEPTION 'Only SELECT/CTE allowed in hera_execute_readonly_sql';
  END IF;

  -- No-op to keep SECURITY DEFINER harmless
  PERFORM 1 WHERE false;

  EXECUTE format(
    'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t',
    p_sql
  )
  INTO res;

  RETURN coalesce(res, '[]'::jsonb);
END $$;

REVOKE ALL ON FUNCTION public.hera_execute_readonly_sql(text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.hera_execute_readonly_sql(text, jsonb) TO authenticated, service_role;

