-- HERA Enterprise Observability
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Enables pg_stat_statements and configures slow query logging within allowed scope.

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Database-level settings (Supabase may override at instance level)
ALTER DATABASE postgres SET pg_stat_statements.track = 'all';
ALTER DATABASE postgres SET pg_stat_statements.max = 5000;
ALTER DATABASE postgres SET log_min_duration_statement = 1000; -- 1s slow query log

-- Optional helper view for top queries (namespaced)
CREATE OR REPLACE VIEW hera_observability_top_queries AS
SELECT
  queryid,
  calls,
  mean_exec_time,
  rows,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 100;

COMMENT ON VIEW hera_observability_top_queries IS 'HERA: top slow queries via pg_stat_statements';

