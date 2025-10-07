-- HERA Enterprise Settings (role-scoped) from manifest settings_enforced
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Idempotent ALTER ROLE/ALTER DATABASE statements. Many settings require elevated roles.

-- Baseline safe settings (will be refined via apply.ts reading manifest)
ALTER DATABASE postgres SET statement_timeout = '60000';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '60000';
ALTER DATABASE postgres SET lock_timeout = '60000';

-- Supabase roles: authenticated, anon, service_role (examples)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE $$ALTER ROLE authenticated SET search_path = public$$;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE $$ALTER ROLE anon SET search_path = public$$;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE $$ALTER ROLE service_role SET search_path = public$$;
  END IF;
END $$;

-- Manifest-driven settings will be applied by scripts/manifest/apply.ts

