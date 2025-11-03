#!/usr/bin/env bash
set -euo pipefail

# ========= CONFIG =========
# Platform org
ORG_ID='00000000-0000-0000-0000-000000000000'

# Use a valid user UUID that exists in PROD
ACTOR_ID='09b0b92a-d797-489e-bc03-5ca0a6272674'

# SOURCE (qqagokigwuujyeyrgdkq). Update password if different; encode "!" as %21; force SSL.
SRC_DB_URL="postgresql://postgres:Perumpuzha2272%21@db.qqagokigwuujyeyrgdkq.supabase.co:5432/postgres?sslmode=require"

# PROD (brfoiosfsviotqseirkx)
PROD_DB_URL="postgresql://postgres:Perumpuzha2272%21@db.brfoiosfsviotqseirkx.supabase.co:5432/postgres"
# ==========================

WORKDIR="$(pwd)/exports_org_${ORG_ID}"
mkdir -p "$WORKDIR"
echo "Workdir: $WORKDIR"

echo "Testing connections..."
psql "$SRC_DB_URL"  -At -c "select 'src_ok'"  | grep -q src_ok  || { echo "Source connect failed"; exit 1; }
psql "$PROD_DB_URL" -At -c "select 'prod_ok'" | grep -q prod_ok || { echo "Prod connect failed";  exit 1; }

echo "Discovering candidate org columns on SOURCE..."
psql "$SRC_DB_URL" -At -F $'\t' -c "
SELECT table_schema || E'\t' || table_name || E'\t' || column_name
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog','information_schema')
  AND (column_name ILIKE '%org%' OR column_name ILIKE '%organization%' OR column_name ILIKE '%tenant%' OR column_name ILIKE '%company%' OR column_name ILIKE '%account%')
ORDER BY table_schema, table_name, column_name;
" > "$WORKDIR/candidate_columns.tsv"

cut -f1-2 "$WORKDIR/candidate_columns.tsv" | sort -u > "$WORKDIR/tables_to_check.txt"

echo "Exporting rows for ORG_ID=$ORG_ID ..."
while IFS=$'\t' read -r schema table; do
  cols=$(awk -F $'\t' -v s="$schema" -v t="$table" '$1==s && $2==t {print $3}' "$WORKDIR/candidate_columns.tsv" | tr '\n' '|' | sed 's/|$//')
  [[ -z "$cols" ]] && continue
  IFS='|' read -r -a arr <<< "$cols"
  where_sql=""
  for c in "${arr[@]}"; do
    [[ -z "$where_sql" ]] && where_sql="(\"$c\"::text = '$ORG_ID')" || where_sql="$where_sql OR (\"$c\"::text = '$ORG_ID')"
  done
  out="$WORKDIR/${schema}__${table}.csv"
  echo "  -> $schema.$table"
  psql "$SRC_DB_URL" -v ON_ERROR_STOP=1 -c "\copy (SELECT * FROM \"$schema\".\"$table\" WHERE $where_sql) TO '$out' WITH CSV HEADER"
done < "$WORKDIR/tables_to_check.txt"

cd "$WORKDIR"
echo "Export complete:"
ls -lh | sed -n '1,200p'

# ---------- Ensure platform org exists in PROD ----------
cat > upsert_min_core_org.sql <<'SQL'
ALTER TABLE public.core_organizations
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
INSERT INTO public.core_organizations (
  id, organization_name, organization_code, status, created_by, updated_by
) VALUES (
  :'ORG_ID'::uuid,
  'Platform Org',
  'PLATFORM',
  'active',
  :'ACTOR_ID'::uuid,
  :'ACTOR_ID'::uuid
)
ON CONFLICT (id) DO NOTHING;
COMMIT;
ALTER TABLE public.core_organizations
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ORG_ID="$ORG_ID" -v ACTOR_ID="$ACTOR_ID" -f upsert_min_core_org.sql

# ---------- core_entities ----------
cat > import_core_entities_with_defaults.sql <<'SQL'
ALTER TABLE public.core_entities
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_core_entities AS TABLE public.core_entities WITH NO DATA;
\COPY t_core_entities FROM 'public__core_entities.csv' WITH CSV HEADER
UPDATE t_core_entities
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_entities'::regclass
    AND conname='chk_core_entities_smart_code_pattern' AND contype='c';
  IF expr IS NULL THEN
    INSERT INTO public.core_entities SELECT * FROM t_core_entities
    WHERE organization_id = current_setting('app.org_id')::uuid
    ON CONFLICT DO NOTHING;
  ELSE
    EXECUTE format(
      'INSERT INTO public.core_entities SELECT * FROM t_core_entities WHERE organization_id = current_setting(''app.org_id'')::uuid AND (%s) ON CONFLICT DO NOTHING',
      expr
    );
  END IF;
END $do$;
COMMIT;
ALTER TABLE public.core_entities
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -v ORG_ID="$ORG_ID" -f import_core_entities_with_defaults.sql

# ---------- core_relationships ----------
cat > import_core_relationships_safe.sql <<'SQL'
BEGIN;
CREATE TEMP TABLE t_core_relationships AS TABLE public.core_relationships WITH NO DATA;
\COPY t_core_relationships FROM 'public__core_relationships.csv' WITH CSV HEADER
UPDATE t_core_relationships
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_relationships'::regclass
    AND conname='core_relationships_smart_code_ck' AND contype='c';
  IF expr IS NOT NULL THEN
    expr := replace(expr, '"smart_code"', 'r.smart_code');
    expr := replace(expr, 'smart_code', 'r.smart_code');
  END IF;
  IF expr IS NULL THEN
    INSERT INTO public.core_relationships
    SELECT r.*
    FROM t_core_relationships r
    JOIN public.core_entities e_from ON e_from.id = r.from_entity_id
    JOIN public.core_entities e_to   ON e_to.id   = r.to_entity_id
    WHERE r.organization_id = current_setting('app.org_id')::uuid
    ON CONFLICT DO NOTHING;
  ELSE
    EXECUTE format(
      'INSERT INTO public.core_relationships
         SELECT r.*
         FROM t_core_relationships r
         JOIN public.core_entities e_from ON e_from.id = r.from_entity_id
         JOIN public.core_entities e_to   ON e_to.id   = r.to_entity_id
         WHERE r.organization_id = current_setting(''app.org_id'')::uuid AND (%s)
       ON CONFLICT DO NOTHING',
      expr
    );
  END IF;
END $do$;
COMMIT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -v ORG_ID="$ORG_ID" -f import_core_relationships_safe.sql

# ---------- core_dynamic_data ----------
cat > import_core_dynamic_data_with_defaults.sql <<'SQL'
ALTER TABLE public.core_dynamic_data
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_core_dynamic_data AS TABLE public.core_dynamic_data WITH NO DATA;
\COPY t_core_dynamic_data FROM 'public__core_dynamic_data.csv' WITH CSV HEADER
UPDATE t_core_dynamic_data
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_dynamic_data'::regclass
    AND conname='core_dynamic_data_smart_code_ck' AND contype='c';
  IF expr IS NOT NULL THEN
    expr := replace(expr, '"smart_code"', 'd.smart_code');
    expr := replace(expr, 'smart_code', 'd.smart_code');
  END IF;
  IF expr IS NULL THEN
    INSERT INTO public.core_dynamic_data
    SELECT d.* FROM t_core_dynamic_data d
    JOIN public.core_entities e ON e.id = d.entity_id
    WHERE d.organization_id = current_setting('app.org_id')::uuid
    ON CONFLICT DO NOTHING;
  ELSE
    EXECUTE format(
      'INSERT INTO public.core_dynamic_data
         SELECT d.* FROM t_core_dynamic_data d
         JOIN public.core_entities e ON e.id = d.entity_id
         WHERE d.organization_id = current_setting(''app.org_id'')::uuid AND (%s)
       ON CONFLICT DO NOTHING',
      expr
    );
  END IF;
END $do$;
COMMIT;
ALTER TABLE public.core_dynamic_data
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -v ORG_ID="$ORG_ID" -f import_core_dynamic_data_with_defaults.sql

# ---------- universal_transactions (headers) ----------
cat > import_universal_transactions_with_defaults.sql <<'SQL'
ALTER TABLE public.universal_transactions
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_universal_transactions AS TABLE public.universal_transactions WITH NO DATA;
\COPY t_universal_transactions FROM 'public__universal_transactions.csv' WITH CSV HEADER
UPDATE t_universal_transactions
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
INSERT INTO public.universal_transactions
SELECT h.* FROM t_universal_transactions h
WHERE h.organization_id = current_setting('app.org_id')::uuid
ON CONFLICT DO NOTHING;
COMMIT;
ALTER TABLE public.universal_transactions
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -v ORG_ID="$ORG_ID" -f import_universal_transactions_with_defaults.sql

# ---------- universal_transaction_lines (lines) ----------
cat > import_universal_transaction_lines_with_defaults.sql <<'SQL'
ALTER TABLE public.universal_transaction_lines
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_universal_transaction_lines AS TABLE public.universal_transaction_lines WITH NO DATA;
\COPY t_universal_transaction_lines FROM 'public__universal_transaction_lines.csv' WITH CSV HEADER
UPDATE t_universal_transaction_lines
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
INSERT INTO public.universal_transaction_lines
SELECT l.*
FROM t_universal_transaction_lines l
JOIN public.universal_transactions h ON h.id = l.transaction_id
WHERE l.organization_id = current_setting('app.org_id')::uuid
ON CONFLICT DO NOTHING;
COMMIT;
ALTER TABLE public.universal_transaction_lines
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -v ORG_ID="$ORG_ID" -f import_universal_transaction_lines_with_defaults.sql

echo "ANALYZE..."
psql "$PROD_DB_URL" -c "ANALYZE VERBOSE;"

echo "Verify slice:"
psql "$PROD_DB_URL" -c "
SELECT 'core_organizations' AS tbl, count(*) FROM public.core_organizations WHERE id::text = '$ORG_ID'
UNION ALL SELECT 'core_entities', count(*) FROM public.core_entities WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'core_relationships', count(*) FROM public.core_relationships WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'core_dynamic_data', count(*) FROM public.core_dynamic_data WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'universal_transactions', count(*) FROM public.universal_transactions WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'universal_transaction_lines', count(*) FROM public.universal_transaction_lines WHERE organization_id::text = '$ORG_ID'
ORDER BY 1;"
echo "Done."
