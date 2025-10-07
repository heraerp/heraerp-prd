-- HERA Enterprise Extensions (from manifest extensions_allowed)
-- Smart Code: HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2
-- Only safe, commonly allowed extensions. Additional ones applied via apply.ts from manifest.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

-- Manifest-driven additional extensions will be applied by scripts/manifest/apply.ts

