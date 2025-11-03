#!/usr/bin/env bash
set -euo pipefail

# ========= CONFIG (edit these) =========
ORG_ID='378f24fb-d496-4ff7-8afa-ea34895a0eb8'
ACTOR_ID='09b0b92a-d797-489e-bc03-5ca0a6272674'   # a valid user UUID in PROD

# SOURCE (awfcrncxngqwbhqapffb) — encode "!" as %21 and force SSL
SRC_DB_URL="postgresql://postgres:Perumpuzha2272%21@db.awfcrncxngqwbhqapffb.supabase.co:5432/postgres?sslmode=require"

# PROD (brfoiosfsviotqseirkx)
PROD_DB_URL="postgresql://postgres:Perumpuzha2272%21@db.brfoiosfsviotqseirkx.supabase.co:5432/postgres"
# ======================================

# --- Setup workdir
WORKDIR="$(pwd)/exports_org_${ORG_ID}"
mkdir -p "$WORKDIR"
echo "Workdir: $WORKDIR"

# --- 0) Sanity
echo "Testing connections..."
psql "$SRC_DB_URL"  -At -c "select 'src_ok'"  | grep -q src_ok  || { echo "Source connect failed"; exit 1; }
psql "$PROD_DB_URL" -At -c "select 'prod_ok'" | grep -q prod_ok || { echo "Prod connect failed";  exit 1; }

# --- 1) Export org-scoped CSVs (same approach you used)
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

echo "Export complete:"
ls -lh "$WORKDIR" | sed -n '1,200p'

cd "$WORKDIR"

# --- 2) Ensure org exists in PROD (if you have a core_organizations CSV, use it; else minimal upsert)
if [[ -f public__core_organizations.csv ]]; then
  echo "Upserting core_organizations from CSV..."
  cat > upsert_core_organizations.sql <<'SQL'
BEGIN;
CREATE TEMP TABLE t_core_organizations AS TABLE public.core_organizations WITH NO DATA;
\COPY t_core_organizations FROM 'public__core_organizations.csv' WITH CSV HEADER
INSERT INTO public.core_organizations SELECT * FROM t_core_organizations
ON CONFLICT (id) DO NOTHING;
COMMIT;
SQL
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -f upsert_core_organizations.sql
else
  echo "core_organizations CSV missing. If table requires an org row, upsert minimal row here."
  # Example (uncomment and adjust columns if needed):
  # psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 <<SQL
  # INSERT INTO public.core_organizations(id, organization_code, organization_name, created_by, updated_by)
  # VALUES ('$ORG_ID','ORG-$ORG_ID','Imported Org', '$ACTOR_ID', '$ACTOR_ID')
  # ON CONFLICT DO NOTHING;
  # SQL
fi

# Helper to build CSV header as quoted column list
header_cols() {
  local f="$1"
  head -n1 "$f" | tr -d '\r' | awk -F',' '{for(i=1;i<=NF;i++){gsub(/^ *| *$/,"",$i); printf "\"%s\"%s",$i,(i<NF?", ":"")}}'
}

# --- 3) core_entities (with temp actor defaults + smart_code CHECK)
echo "Importing core_entities..."
cat > import_core_entities_with_defaults.sql <<'SQL'
ALTER TABLE public.core_entities
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;

BEGIN;

CREATE TEMP TABLE t_core_entities AS TABLE public.core_entities WITH NO DATA;
\COPY t_core_entities FROM 'public__core_entities.csv' WITH CSV HEADER

UPDATE t_core_entities
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);

DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_entities'::regclass
    AND conname='chk_core_entities_smart_code_pattern'
    AND contype='c';
  IF expr IS NULL THEN RAISE EXCEPTION 'Missing CHECK: chk_core_entities_smart_code_pattern'; END IF;

  EXECUTE format(
    'INSERT INTO public.core_entities SELECT * FROM t_core_entities WHERE %s ON CONFLICT DO NOTHING',
    expr
  );
END $do$;

COMMIT;

ALTER TABLE public.core_entities
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -f import_core_entities_with_defaults.sql

# --- 4) core_relationships (use from_entity_id/to_entity_id)
if [[ -f public__core_relationships.csv ]]; then
  echo "Importing core_relationships..."
  cat > import_core_relationships_safe.sql <<'SQL'
BEGIN;
CREATE TEMP TABLE t_core_relationships AS TABLE public.core_relationships WITH NO DATA;
\COPY t_core_relationships FROM 'public__core_relationships.csv' WITH CSV HEADER
INSERT INTO public.core_relationships
SELECT r.* FROM t_core_relationships r
JOIN public.core_entities e1 ON e1.id = r.from_entity_id
JOIN public.core_entities e2 ON e2.id = r.to_entity_id
ON CONFLICT DO NOTHING;
COMMIT;
SQL
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -f import_core_relationships_safe.sql
fi

# --- 5) core_dynamic_data (temp actor defaults + smart_code CHECK + entity exists)
if [[ -f public__core_dynamic_data.csv ]]; then
  echo "Importing core_dynamic_data..."
  cat > import_core_dynamic_data_with_defaults.sql <<'SQL'
ALTER TABLE public.core_dynamic_data
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;

BEGIN;

CREATE TEMP TABLE t_core_dynamic_data AS TABLE public.core_dynamic_data WITH NO DATA;
\COPY t_core_dynamic_data FROM 'public__core_dynamic_data.csv' WITH CSV HEADER

UPDATE t_core_dynamic_data
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);

DO $do$
DECLARE expr TEXT; BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO expr
  FROM pg_constraint
  WHERE conrelid='public.core_dynamic_data'::regclass
    AND conname='core_dynamic_data_smart_code_ck'
    AND contype='c';
  IF expr IS NULL THEN RAISE EXCEPTION 'Missing CHECK: core_dynamic_data_smart_code_ck'; END IF;

  EXECUTE format(
    'INSERT INTO public.core_dynamic_data
       SELECT d.* FROM t_core_dynamic_data d
       JOIN public.core_entities e ON e.id = d.entity_id
       WHERE %s
     ON CONFLICT DO NOTHING',
    expr
  );
END $do$;

COMMIT;

ALTER TABLE public.core_dynamic_data
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -f import_core_dynamic_data_with_defaults.sql
fi

# --- 6) universal_transactions (headers) with temp actor defaults
if [[ -f public__universal_transactions.csv ]]; then
  echo "Importing universal_transactions..."
  cat > import_universal_transactions_with_defaults.sql <<'SQL'
ALTER TABLE public.universal_transactions
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_universal_transactions AS TABLE public.universal_transactions WITH NO DATA;
\COPY t_universal_transactions FROM 'public__universal_transactions.csv' WITH CSV HEADER
UPDATE t_universal_transactions
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);
INSERT INTO public.universal_transactions
SELECT * FROM t_universal_transactions
ON CONFLICT DO NOTHING;
COMMIT;
ALTER TABLE public.universal_transactions
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -f import_universal_transactions_with_defaults.sql
fi

# --- 7) universal_transaction_lines (lines) with temp actor defaults + header exists
if [[ -f public__universal_transaction_lines.csv ]]; then
  echo "Importing universal_transaction_lines..."
  cat > import_universal_transaction_lines_with_defaults.sql <<'SQL'
ALTER TABLE public.universal_transaction_lines
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_universal_transaction_lines AS TABLE public.universal_transaction_lines WITH NO DATA;
\COPY t_universal_transaction_lines FROM 'public__universal_transaction_lines.csv' WITH CSV HEADER
UPDATE t_universal_transaction_lines
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid);
INSERT INTO public.universal_transaction_lines
SELECT l.* FROM t_universal_transaction_lines l
JOIN public.universal_transactions h ON h.id = l.transaction_id
ON CONFLICT DO NOTHING;
COMMIT;
ALTER TABLE public.universal_transaction_lines
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
SQL
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 -v ACTOR_ID="$ACTOR_ID" -f import_universal_transaction_lines_with_defaults.sql
fi

# --- 8) ANALYZE
echo "ANALYZE..."
psql "$PROD_DB_URL" -c "ANALYZE VERBOSE;"

# --- 9) Verify counts (no psql vars so zsh won’t choke)
echo "Verify org counts:"
psql "$PROD_DB_URL" -c "
SELECT 'core_entities' AS tbl, count(*) FROM public.core_entities WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'core_relationships', count(*) FROM public.core_relationships WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'core_dynamic_data', count(*) FROM public.core_dynamic_data WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'universal_transactions', count(*) FROM public.universal_transactions WHERE organization_id::text = '$ORG_ID'
UNION ALL SELECT 'universal_transaction_lines', count(*) FROM public.universal_transaction_lines WHERE organization_id::text = '$ORG_ID'
ORDER BY 1;"

echo "Done."
