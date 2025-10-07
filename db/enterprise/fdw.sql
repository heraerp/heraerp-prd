-- HERA Enterprise FDW (read-only servers + mappings)
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Note: Requires postgres_fdw extension and appropriate superuser privileges.

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Example read-only FDW server (connection options to be provided at apply time)
-- Namespaced server name to avoid collisions
-- CREATE SERVER hera_fdw_ro FOREIGN DATA WRAPPER postgres_fdw OPTIONS (host 'example', dbname 'db', port '5432');
-- CREATE USER MAPPING FOR current_user SERVER hera_fdw_ro OPTIONS (user 'fdw_user');
-- IMPORT FOREIGN SCHEMA public FROM SERVER hera_fdw_ro INTO public LIMIT TO (/* approved objects only */);

-- Manifest-driven FDW servers and mappings will be applied via scripts/manifest/apply.ts

