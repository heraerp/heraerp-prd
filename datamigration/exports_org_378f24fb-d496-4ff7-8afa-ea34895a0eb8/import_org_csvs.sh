#!/usr/bin/env bash
set -euo pipefail

: "${TGT_DB_URL:?Set TGT_DB_URL first}"

for csv in public__*.csv; do
  base="${csv%.csv}"
  schema="${base%%__*}"      # "public"
  table="${base#*__}"        # table name

  # skip views
  if [[ "$table" == v_* ]]; then
    echo "SKIP (view): $schema.$table"
    continue
  fi

  # Build explicit column list from CSV header (handles spaces, trims CR)
  header="$(head -n1 "$csv" | tr -d '\r')"
  cols="$(echo "$header" | awk -F',' '{
    for(i=1;i<=NF;i++){
      gsub(/^ *| *$/,"",$i);
      printf "\"%s\"%s",$i,(i<NF?", ":"")
    }}')"

  echo "IMPORT: $schema.$table from $csv"
  psql "$TGT_DB_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SET session_replication_role = replica
\COPY "$schema"."$table" ($cols) FROM '$(pwd)/$csv' WITH CSV HEADER
RESET session_replication_role
COMMIT;
SQL
done
