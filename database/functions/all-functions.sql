[
  {
    "schema_name": "auth",
    "function_name": "email",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.email()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.email', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')\n  )::text\n$function$\n"
  },
  {
    "schema_name": "auth",
    "function_name": "jwt",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.jwt()\n RETURNS jsonb\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n    coalesce(\n        nullif(current_setting('request.jwt.claim', true), ''),\n        nullif(current_setting('request.jwt.claims', true), '')\n    )::jsonb\n$function$\n"
  },
  {
    "schema_name": "auth",
    "function_name": "role",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.role()\n RETURNS text\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.role', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')\n  )::text\n$function$\n"
  },
  {
    "schema_name": "auth",
    "function_name": "uid",
    "function_definition": "CREATE OR REPLACE FUNCTION auth.uid()\n RETURNS uuid\n LANGUAGE sql\n STABLE\nAS $function$\n  select \n  coalesce(\n    nullif(current_setting('request.jwt.claim.sub', true), ''),\n    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')\n  )::uuid\n$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "armor",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.armor(bytea, text[], text[])\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_armor$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "armor",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.armor(bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_armor$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "crypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.crypt(text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_crypt$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "dearmor",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.dearmor(text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_dearmor$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.decrypt(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_decrypt$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "decrypt_iv",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_decrypt_iv$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "digest",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.digest(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_digest$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "digest",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.digest(text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_digest$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.encrypt(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_encrypt$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "encrypt_iv",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_encrypt_iv$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_random_bytes",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_random_bytes(integer)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_random_bytes$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_random_uuid",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE\nAS '$libdir/pgcrypto', $function$pg_random_uuid$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_salt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text, integer)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt_rounds$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "gen_salt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.gen_salt(text)\n RETURNS text\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_gen_salt$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "grant_pg_cron_access",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_cron_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF EXISTS (\n    SELECT\n    FROM pg_event_trigger_ddl_commands() AS ev\n    JOIN pg_extension AS ext\n    ON ev.objid = ext.oid\n    WHERE ext.extname = 'pg_cron'\n  )\n  THEN\n    grant usage on schema cron to postgres with grant option;\n\n    alter default privileges in schema cron grant all on tables to postgres with grant option;\n    alter default privileges in schema cron grant all on functions to postgres with grant option;\n    alter default privileges in schema cron grant all on sequences to postgres with grant option;\n\n    alter default privileges for user supabase_admin in schema cron grant all\n        on sequences to postgres with grant option;\n    alter default privileges for user supabase_admin in schema cron grant all\n        on tables to postgres with grant option;\n    alter default privileges for user supabase_admin in schema cron grant all\n        on functions to postgres with grant option;\n\n    grant all privileges on all tables in schema cron to postgres with grant option;\n    revoke all on table cron.job from postgres;\n    grant select on table cron.job to postgres with grant option;\n  END IF;\nEND;\n$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "grant_pg_graphql_access",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_graphql_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    func_is_graphql_resolve bool;\nBEGIN\n    func_is_graphql_resolve = (\n        SELECT n.proname = 'resolve'\n        FROM pg_event_trigger_ddl_commands() AS ev\n        LEFT JOIN pg_catalog.pg_proc AS n\n        ON ev.objid = n.oid\n    );\n\n    IF func_is_graphql_resolve\n    THEN\n        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func\n        DROP FUNCTION IF EXISTS graphql_public.graphql;\n        create or replace function graphql_public.graphql(\n            \"operationName\" text default null,\n            query text default null,\n            variables jsonb default null,\n            extensions jsonb default null\n        )\n            returns jsonb\n            language sql\n        as $$\n            select graphql.resolve(\n                query := query,\n                variables := coalesce(variables, '{}'),\n                \"operationName\" := \"operationName\",\n                extensions := extensions\n            );\n        $$;\n\n        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last\n        -- function in the extension so we need to grant permissions on existing entities AND\n        -- update default permissions to any others that are created after `graphql.resolve`\n        grant usage on schema graphql to postgres, anon, authenticated, service_role;\n        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;\n        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;\n        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;\n        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;\n\n        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles\n        grant usage on schema graphql_public to postgres with grant option;\n        grant usage on schema graphql to postgres with grant option;\n    END IF;\n\nEND;\n$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "grant_pg_net_access",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.grant_pg_net_access()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  IF EXISTS (\n    SELECT 1\n    FROM pg_event_trigger_ddl_commands() AS ev\n    JOIN pg_extension AS ext\n    ON ev.objid = ext.oid\n    WHERE ext.extname = 'pg_net'\n  )\n  THEN\n    IF NOT EXISTS (\n      SELECT 1\n      FROM pg_roles\n      WHERE rolname = 'supabase_functions_admin'\n    )\n    THEN\n      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;\n    END IF;\n\n    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n\n    IF EXISTS (\n      SELECT FROM pg_extension\n      WHERE extname = 'pg_net'\n      -- all versions in use on existing projects as of 2025-02-20\n      -- version 0.12.0 onwards don't need these applied\n      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')\n    ) THEN\n      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;\n      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;\n\n      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;\n      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;\n\n      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;\n      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;\n\n      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;\n    END IF;\n  END IF;\nEND;\n$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "hmac",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "hmac",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.hmac(text, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pg_hmac$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pg_stat_statements",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone)\n RETURNS SETOF record\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_1_11$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pg_stat_statements_info",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone)\n RETURNS record\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_info$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pg_stat_statements_reset",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pg_stat_statements_reset(userid oid DEFAULT 0, dbid oid DEFAULT 0, queryid bigint DEFAULT 0, minmax_only boolean DEFAULT false)\n RETURNS timestamp with time zone\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pg_stat_statements', $function$pg_stat_statements_reset_1_11$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_armor_headers",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text)\n RETURNS SETOF record\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_armor_headers$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_key_id",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_key_id(bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_key_id_w$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_decrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt(text, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_pub_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_pub_encrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt(bytea, text)\n RETURNS text\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_decrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_decrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt(text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_text$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgp_sym_encrypt_bytea",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text)\n RETURNS bytea\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/pgcrypto', $function$pgp_sym_encrypt_bytea$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgrst_ddl_watch",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgrst_ddl_watch()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  cmd record;\nBEGIN\n  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()\n  LOOP\n    IF cmd.command_tag IN (\n      'CREATE SCHEMA', 'ALTER SCHEMA'\n    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'\n    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'\n    , 'CREATE VIEW', 'ALTER VIEW'\n    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'\n    , 'CREATE FUNCTION', 'ALTER FUNCTION'\n    , 'CREATE TRIGGER'\n    , 'CREATE TYPE', 'ALTER TYPE'\n    , 'CREATE RULE'\n    , 'COMMENT'\n    )\n    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp\n    AND cmd.schema_name is distinct from 'pg_temp'\n    THEN\n      NOTIFY pgrst, 'reload schema';\n    END IF;\n  END LOOP;\nEND; $function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "pgrst_drop_watch",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.pgrst_drop_watch()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n  obj record;\nBEGIN\n  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()\n  LOOP\n    IF obj.object_type IN (\n      'schema'\n    , 'table'\n    , 'foreign table'\n    , 'view'\n    , 'materialized view'\n    , 'function'\n    , 'trigger'\n    , 'type'\n    , 'rule'\n    )\n    AND obj.is_temporary IS false -- no pg_temp objects\n    THEN\n      NOTIFY pgrst, 'reload schema';\n    END IF;\n  END LOOP;\nEND; $function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "set_graphql_placeholder",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.set_graphql_placeholder()\n RETURNS event_trigger\n LANGUAGE plpgsql\nAS $function$\n    DECLARE\n    graphql_is_dropped bool;\n    BEGIN\n    graphql_is_dropped = (\n        SELECT ev.schema_name = 'graphql_public'\n        FROM pg_event_trigger_dropped_objects() AS ev\n        WHERE ev.schema_name = 'graphql_public'\n    );\n\n    IF graphql_is_dropped\n    THEN\n        create or replace function graphql_public.graphql(\n            \"operationName\" text default null,\n            query text default null,\n            variables jsonb default null,\n            extensions jsonb default null\n        )\n            returns jsonb\n            language plpgsql\n        as $$\n            DECLARE\n                server_version float;\n            BEGIN\n                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);\n\n                IF server_version >= 14 THEN\n                    RETURN jsonb_build_object(\n                        'errors', jsonb_build_array(\n                            jsonb_build_object(\n                                'message', 'pg_graphql extension is not enabled.'\n                            )\n                        )\n                    );\n                ELSE\n                    RETURN jsonb_build_object(\n                        'errors', jsonb_build_array(\n                            jsonb_build_object(\n                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'\n                            )\n                        )\n                    );\n                END IF;\n            END;\n        $$;\n    END IF;\n\n    END;\n$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v1",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v1mc",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v1mc()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v3",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v3(namespace uuid, name text)\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v4",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v4()\n RETURNS uuid\n LANGUAGE c\n PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_generate_v5",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_generate_v5(namespace uuid, name text)\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_nil",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_nil()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_nil$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_dns",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_dns()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_oid",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_oid()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_url",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_url()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_url$function$\n"
  },
  {
    "schema_name": "extensions",
    "function_name": "uuid_ns_x500",
    "function_definition": "CREATE OR REPLACE FUNCTION extensions.uuid_ns_x500()\n RETURNS uuid\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$\n"
  },
  {
    "schema_name": "graphql",
    "function_name": "_internal_resolve",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql._internal_resolve(query text, variables jsonb DEFAULT '{}'::jsonb, \"operationName\" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE c\nAS '$libdir/pg_graphql', $function$resolve_wrapper$function$\n"
  },
  {
    "schema_name": "graphql",
    "function_name": "comment_directive",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.comment_directive(comment_ text)\n RETURNS jsonb\n LANGUAGE sql\n IMMUTABLE\nAS $function$\n    /*\n    comment on column public.account.name is '@graphql.name: myField'\n    */\n    select\n        coalesce(\n            (\n                regexp_match(\n                    comment_,\n                    '@graphql\\((.+)\\)'\n                )\n            )[1]::jsonb,\n            jsonb_build_object()\n        )\n$function$\n"
  },
  {
    "schema_name": "graphql",
    "function_name": "exception",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.exception(message text)\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nbegin\n    raise exception using errcode='22000', message=message;\nend;\n$function$\n"
  },
  {
    "schema_name": "graphql",
    "function_name": "get_schema_version",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.get_schema_version()\n RETURNS integer\n LANGUAGE sql\n SECURITY DEFINER\nAS $function$\n    select last_value from graphql.seq_schema_version;\n$function$\n"
  },
  {
    "schema_name": "graphql",
    "function_name": "increment_schema_version",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.increment_schema_version()\n RETURNS event_trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n    perform pg_catalog.nextval('graphql.seq_schema_version');\nend;\n$function$\n"
  },
  {
    "schema_name": "graphql",
    "function_name": "resolve",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql.resolve(query text, variables jsonb DEFAULT '{}'::jsonb, \"operationName\" text DEFAULT NULL::text, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE plpgsql\nAS $function$\ndeclare\n    res jsonb;\n    message_text text;\nbegin\n  begin\n    select graphql._internal_resolve(\"query\" := \"query\",\n                                     \"variables\" := \"variables\",\n                                     \"operationName\" := \"operationName\",\n                                     \"extensions\" := \"extensions\") into res;\n    return res;\n  exception\n    when others then\n    get stacked diagnostics message_text = message_text;\n    return\n    jsonb_build_object('data', null,\n                       'errors', jsonb_build_array(jsonb_build_object('message', message_text)));\n  end;\nend;\n$function$\n"
  },
  {
    "schema_name": "graphql_public",
    "function_name": "graphql",
    "function_definition": "CREATE OR REPLACE FUNCTION graphql_public.graphql(\"operationName\" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb)\n RETURNS jsonb\n LANGUAGE sql\nAS $function$\n            select graphql.resolve(\n                query := query,\n                variables := coalesce(variables, '{}'),\n                \"operationName\" := \"operationName\",\n                extensions := extensions\n            );\n        $function$\n"
  },
  {
    "schema_name": "pgbouncer",
    "function_name": "get_auth",
    "function_definition": "CREATE OR REPLACE FUNCTION pgbouncer.get_auth(p_usename text)\n RETURNS TABLE(username text, password text)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nbegin\n    raise debug 'PgBouncer auth request: %', p_usename;\n\n    return query\n    select \n        rolname::text, \n        case when rolvaliduntil < now() \n            then null \n            else rolpassword::text \n        end \n    from pg_authid \n    where rolname=$1 and rolcanlogin;\nend;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "create_sample_hierarchical_data",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_sample_hierarchical_data()\n RETURNS text\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    microsoft_client_id UUID;\n    microsoft_india_org_id UUID;\n    microsoft_uk_org_id UUID;\n    result_text TEXT := '';\nBEGIN\n    -- Create Microsoft client\n    INSERT INTO core_clients (\n        client_name, \n        client_code, \n        client_type,\n        headquarters_country,\n        stock_exchange,\n        ticker_symbol,\n        reporting_currency\n    ) VALUES (\n        'Microsoft Corporation',\n        'MSFT_CORP',\n        'corporation',\n        'USA',\n        'NASDAQ',\n        'MSFT',\n        'USD'\n    ) RETURNING id INTO microsoft_client_id;\n    \n    result_text := result_text || 'Created Microsoft Corporation client: ' || microsoft_client_id || E'\\n';\n    \n    -- Create Microsoft India organization\n    INSERT INTO core_organizations (\n        client_id,\n        organization_name,\n        organization_code,\n        organization_type,\n        country_code,\n        region,\n        subsidiary_type,\n        functional_currency,\n        reporting_currency\n    ) VALUES (\n        microsoft_client_id,\n        'Microsoft India Private Limited',\n        'MSFT_INDIA',\n        'technology',\n        'IND',\n        'APAC',\n        'subsidiary',\n        'INR',\n        'USD'\n    ) RETURNING id INTO microsoft_india_org_id;\n    \n    result_text := result_text || 'Created Microsoft India organization: ' || microsoft_india_org_id || E'\\n';\n    \n    -- Create Microsoft UK organization\n    INSERT INTO core_organizations (\n        client_id,\n        organization_name,\n        organization_code,\n        organization_type,\n        country_code,\n        region,\n        subsidiary_type,\n        functional_currency,\n        reporting_currency\n    ) VALUES (\n        microsoft_client_id,\n        'Microsoft UK Limited',\n        'MSFT_UK',\n        'technology',\n        'GBR',\n        'EMEA',\n        'subsidiary',\n        'GBP',\n        'USD'\n    ) RETURNING id INTO microsoft_uk_org_id;\n    \n    result_text := result_text || 'Created Microsoft UK organization: ' || microsoft_uk_org_id || E'\\n';\n    \n    -- Create standard GL accounts for both organizations\n    PERFORM create_standard_gl_accounts(microsoft_india_org_id, 'technology');\n    PERFORM create_standard_gl_accounts(microsoft_uk_org_id, 'technology');\n    \n    result_text := result_text || 'Created standard GL accounts for both subsidiaries' || E'\\n';\n    result_text := result_text || 'Sample hierarchical data creation completed!';\n    \n    RETURN result_text;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "create_standard_gl_accounts",
    "function_definition": "CREATE OR REPLACE FUNCTION public.create_standard_gl_accounts(org_id uuid, business_type character varying)\n RETURNS void\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    -- Assets (1000000-1999999)\n    INSERT INTO gl_chart_of_accounts (organization_id, account_code, account_name, account_type) VALUES\n    (org_id, '1100000', 'Cash and Cash Equivalents', 'assets'),\n    (org_id, '1200000', 'Accounts Receivable', 'assets'),\n    (org_id, '1300000', 'Inventory', 'assets'),\n    (org_id, '1400000', 'Prepaid Expenses', 'assets'),\n    (org_id, '1500000', 'Property, Plant & Equipment', 'assets'),\n    (org_id, '1600000', 'Accumulated Depreciation', 'assets'),\n    \n    -- Liabilities (2000000-2999999)\n    (org_id, '2100000', 'Accounts Payable', 'liabilities'),\n    (org_id, '2200000', 'Accrued Liabilities', 'liabilities'),\n    (org_id, '2300000', 'Short-term Debt', 'liabilities'),\n    (org_id, '2400000', 'Long-term Debt', 'liabilities'),\n    \n    -- Equity (3000000-3999999)\n    (org_id, '3100000', 'Owner''s Equity', 'equity'),\n    (org_id, '3200000', 'Retained Earnings', 'equity'),\n    \n    -- Revenue (4000000-4999999)\n    (org_id, '4100000', 'Sales Revenue', 'revenue'),\n    (org_id, '4200000', 'Service Revenue', 'revenue'),\n    (org_id, '4900000', 'Other Income', 'revenue');\n    \n    -- Add business-type specific accounts\n    IF business_type = 'restaurant' THEN\n        INSERT INTO gl_chart_of_accounts (organization_id, account_code, account_name, account_type) VALUES\n        (org_id, '5150000', 'Food & Beverage Costs', 'cost_of_sales'),\n        (org_id, '6150000', 'Kitchen Supplies', 'direct_expenses'),\n        (org_id, '7150000', 'Restaurant Utilities', 'indirect_expenses');\n    ELSIF business_type = 'professional_services' THEN\n        INSERT INTO gl_chart_of_accounts (organization_id, account_code, account_name, account_type) VALUES\n        (org_id, '5250000', 'Professional Service Costs', 'cost_of_sales'),\n        (org_id, '6250000', 'Client Entertainment', 'direct_expenses'),\n        (org_id, '7250000', 'Office Rent', 'indirect_expenses');\n    END IF;\n    \n    -- Common expense accounts for all business types\n    INSERT INTO gl_chart_of_accounts (organization_id, account_code, account_name, account_type) VALUES\n    (org_id, '7100000', 'Salaries & Wages', 'indirect_expenses'),\n    (org_id, '7200000', 'Office Supplies', 'indirect_expenses'),\n    (org_id, '7300000', 'Insurance', 'indirect_expenses'),\n    (org_id, '7400000', 'Professional Services', 'indirect_expenses'),\n    (org_id, '8100000', 'Income Tax Expense', 'tax_extraordinary'),\n    (org_id, '8200000', 'Sales Tax Payable', 'tax_extraordinary');\n    \nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "current_client_id",
    "function_definition": "CREATE OR REPLACE FUNCTION public.current_client_id()\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n    RETURN (auth.jwt() ->> 'client_id')::uuid;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "enforce_hierarchical_organization_consistency",
    "function_definition": "CREATE OR REPLACE FUNCTION public.enforce_hierarchical_organization_consistency()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nDECLARE\n    parent_org_id UUID;\n    related_org_id UUID;\n    entity_client_id UUID;\n    user_client_id UUID;\nBEGIN\n    -- Get the client_id for the organization\n    SELECT client_id INTO entity_client_id\n    FROM core_organizations \n    WHERE id = NEW.organization_id;\n    \n    IF entity_client_id IS NULL THEN\n        RAISE EXCEPTION 'HERA_ORG_NOT_FOUND: Organization % not found or has no client', NEW.organization_id;\n    END IF;\n    \n    -- Validate user has access to this client (for manual operations)\n    user_client_id := (auth.jwt() ->> 'client_id')::uuid;\n    IF user_client_id IS NOT NULL AND user_client_id != entity_client_id THEN\n        IF auth.jwt() ->> 'role' NOT IN ('super_admin') THEN\n            RAISE EXCEPTION 'HERA_CLIENT_ACCESS_DENIED: User client % cannot access organization in client %', \n                user_client_id, entity_client_id;\n        END IF;\n    END IF;\n\n    -- Continue with existing organization consistency checks\n    -- [Previous organization consistency logic remains the same]\n    \n    -- RULE: organization_id MUST NEVER be NULL\n    IF NEW.organization_id IS NULL THEN\n        RAISE EXCEPTION 'HERA_MISSING_ORG_ID: organization_id cannot be NULL in table %', TG_TABLE_NAME;\n    END IF;\n\n    -- Apply table-specific validations (same as before, but with client awareness)\n    IF TG_TABLE_NAME = 'core_entities' AND NEW.parent_entity_id IS NOT NULL THEN\n        SELECT organization_id INTO parent_org_id\n        FROM core_entities \n        WHERE id = NEW.parent_entity_id;\n        \n        IF parent_org_id IS NOT NULL AND parent_org_id != NEW.organization_id THEN\n            RAISE EXCEPTION 'HERA_ORG_MISMATCH: Entity parent organization % does not match entity organization %', \n                parent_org_id, NEW.organization_id;\n        END IF;\n    END IF;\n\n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_client_hierarchy",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_client_hierarchy(root_client_id uuid)\n RETURNS TABLE(client_id uuid, client_name character varying, level integer, path text[])\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY\n    WITH RECURSIVE client_tree AS (\n        -- Root level\n        SELECT \n            c.id,\n            c.client_name,\n            0 as level,\n            ARRAY[c.client_name] as path\n        FROM core_clients c\n        WHERE c.id = root_client_id\n        \n        UNION ALL\n        \n        -- Recursive level\n        SELECT \n            c.id,\n            c.client_name,\n            ct.level + 1,\n            ct.path || c.client_name\n        FROM core_clients c\n        INNER JOIN client_tree ct ON c.parent_client_id = ct.client_id\n    )\n    SELECT * FROM client_tree ORDER BY level, client_name;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_client_organizations",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_client_organizations(target_client_id uuid)\n RETURNS TABLE(organization_id uuid, organization_name character varying, country_code character varying, region character varying, functional_currency character varying)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY\n    SELECT \n        o.id,\n        o.organization_name,\n        o.country_code,\n        o.region,\n        o.functional_currency\n    FROM core_organizations o\n    WHERE o.client_id = target_client_id\n    AND o.status = 'active'\n    ORDER BY o.region, o.organization_name;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_consolidated_financials",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_consolidated_financials(target_client_id uuid, start_date date, end_date date)\n RETURNS TABLE(gl_account_code character varying, account_name character varying, account_type character varying, total_amount numeric, organization_breakdown jsonb)\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n    RETURN QUERY\n    WITH client_orgs AS (\n        SELECT id, organization_name \n        FROM core_organizations \n        WHERE client_id = target_client_id \n        AND status = 'active'\n    ),\n    consolidated_data AS (\n        SELECT \n            tl.gl_account_code,\n            gl.account_name,\n            gl.account_type,\n            SUM(tl.net_line_amount) as total_amount,\n            jsonb_object_agg(\n                co.organization_name, \n                SUM(tl.net_line_amount)\n            ) as org_breakdown\n        FROM universal_transaction_lines tl\n        JOIN universal_transactions t ON tl.transaction_id = t.id\n        JOIN client_orgs co ON tl.organization_id = co.id\n        LEFT JOIN gl_chart_of_accounts gl ON tl.gl_account_code = gl.account_code \n            AND gl.organization_id = tl.organization_id\n        WHERE t.transaction_date BETWEEN start_date AND end_date\n        AND t.status = 'completed'\n        AND tl.gl_account_code IS NOT NULL\n        GROUP BY tl.gl_account_code, gl.account_name, gl.account_type\n    )\n    SELECT * FROM consolidated_data\n    ORDER BY gl_account_code;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_entity_audit_trail",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_entity_audit_trail(entity_id uuid, org_id uuid)\n RETURNS TABLE(action text, performed_by uuid, performed_at timestamp with time zone, entity_name text, entity_type text)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n    RETURN QUERY\n    SELECT \n        'CREATE'::TEXT,\n        e.created_by,\n        e.created_at,\n        e.entity_name,\n        e.entity_type\n    FROM core_entities e\n    WHERE e.id = entity_id \n    AND e.organization_id = org_id\n    \n    UNION ALL\n    \n    SELECT \n        'UPDATE'::TEXT,\n        e.updated_by,\n        e.updated_at,\n        e.entity_name,\n        e.entity_type\n    FROM core_entities e\n    WHERE e.id = entity_id \n    AND e.organization_id = org_id\n    AND e.updated_at > e.created_at\n    \n    ORDER BY performed_at DESC;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_transaction_audit_trail",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_transaction_audit_trail(transaction_id uuid, org_id uuid)\n RETURNS TABLE(action text, performed_by uuid, performed_at timestamp with time zone, transaction_number text, transaction_type text, total_amount numeric)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n    RETURN QUERY\n    SELECT \n        'CREATE'::TEXT,\n        t.created_by,\n        t.created_at,\n        t.transaction_number,\n        t.transaction_type,\n        t.total_amount\n    FROM universal_transactions t\n    WHERE t.id = transaction_id \n    AND t.organization_id = org_id\n    \n    UNION ALL\n    \n    SELECT \n        'UPDATE'::TEXT,\n        t.updated_by,\n        t.updated_at,\n        t.transaction_number,\n        t.transaction_type,\n        t.total_amount\n    FROM universal_transactions t\n    WHERE t.id = transaction_id \n    AND t.organization_id = org_id\n    AND t.updated_at > t.created_at\n    \n    ORDER BY performed_at DESC;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "get_user_activity",
    "function_definition": "CREATE OR REPLACE FUNCTION public.get_user_activity(user_id uuid, org_id uuid)\n RETURNS TABLE(table_name text, total_creates bigint, total_updates bigint, last_activity timestamp with time zone)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n    RETURN QUERY\n    SELECT \n        'core_entities'::TEXT,\n        COUNT(*) FILTER (WHERE created_by = user_id),\n        COUNT(*) FILTER (WHERE updated_by = user_id AND updated_at > created_at),\n        MAX(GREATEST(created_at, updated_at))\n    FROM core_entities\n    WHERE organization_id = org_id\n    AND (created_by = user_id OR updated_by = user_id)\n    \n    UNION ALL\n    \n    SELECT \n        'universal_transactions'::TEXT,\n        COUNT(*) FILTER (WHERE created_by = user_id),\n        COUNT(*) FILTER (WHERE updated_by = user_id AND updated_at > created_at),\n        MAX(GREATEST(created_at, updated_at))\n    FROM universal_transactions\n    WHERE organization_id = org_id\n    AND (created_by = user_id OR updated_by = user_id);\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gin_extract_query_trgm",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gin_extract_value_trgm",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gin_trgm_consistent",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)\n RETURNS boolean\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_trgm_consistent$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gin_trgm_triconsistent",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)\n RETURNS \"char\"\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gin_trgm_triconsistent$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_compress",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_compress(internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_compress$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_consistent",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal)\n RETURNS boolean\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_consistent$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_decompress",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_decompress(internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_decompress$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_distance",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal)\n RETURNS double precision\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_distance$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_in",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_in(cstring)\n RETURNS gtrgm\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_in$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_options",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_options(internal)\n RETURNS void\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE\nAS '$libdir/pg_trgm', $function$gtrgm_options$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_out",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_out(gtrgm)\n RETURNS cstring\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_out$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_penalty",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_penalty(internal, internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_penalty$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_picksplit",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_picksplit(internal, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_picksplit$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_same",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal)\n RETURNS internal\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_same$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "gtrgm_union",
    "function_definition": "CREATE OR REPLACE FUNCTION public.gtrgm_union(internal, internal)\n RETURNS gtrgm\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$gtrgm_union$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "handle_audit_trail",
    "function_definition": "CREATE OR REPLACE FUNCTION public.handle_audit_trail()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n    -- Set timestamps and user tracking\n    IF TG_OP = 'INSERT' THEN\n        NEW.created_at = NOW();\n        NEW.updated_at = NOW();\n        NEW.created_by = auth.uid();\n        NEW.updated_by = auth.uid();\n    ELSIF TG_OP = 'UPDATE' THEN\n        NEW.updated_at = NOW();\n        NEW.updated_by = auth.uid();\n        -- Preserve original created_at and created_by\n        NEW.created_at = OLD.created_at;\n        NEW.created_by = OLD.created_by;\n    END IF;\n    \n    RETURN NEW;\nEND;\n$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "set_limit",
    "function_definition": "CREATE OR REPLACE FUNCTION public.set_limit(real)\n RETURNS real\n LANGUAGE c\n STRICT\nAS '$libdir/pg_trgm', $function$set_limit$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "show_limit",
    "function_definition": "CREATE OR REPLACE FUNCTION public.show_limit()\n RETURNS real\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$show_limit$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "show_trgm",
    "function_definition": "CREATE OR REPLACE FUNCTION public.show_trgm(text)\n RETURNS text[]\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$show_trgm$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "similarity",
    "function_definition": "CREATE OR REPLACE FUNCTION public.similarity(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$similarity$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "similarity_dist",
    "function_definition": "CREATE OR REPLACE FUNCTION public.similarity_dist(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$similarity_dist$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "similarity_op",
    "function_definition": "CREATE OR REPLACE FUNCTION public.similarity_op(text, text)\n RETURNS boolean\n LANGUAGE c\n STABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$similarity_op$function$\n"
  },
  {
    "schema_name": "public",
    "function_name": "strict_word_similarity",
    "function_definition": "CREATE OR REPLACE FUNCTION public.strict_word_similarity(text, text)\n RETURNS real\n LANGUAGE c\n IMMUTABLE PARALLEL SAFE STRICT\nAS '$libdir/pg_trgm', $function$strict_word_similarity$function$\n"
  }
]