#!/usr/bin/env bash
set -euo pipefail
: "${PROD_DB_URL:?Set PROD_DB_URL first}"

for csv in public__*.csv; do
  base="${csv%.csv}"
  schema="${base%%__*}"
  table="${base#*__}"

  # skip views + core_dynamic_data (handled separately)
  if [[ "$table" == v_* || "$table" == "core_dynamic_data" ]]; then
    echo "SKIP: $schema.$table"
    continue
  fi

  # explicit column list from header
  header="$(head -n1 "$csv" | tr -d '\r')"
  cols="$(echo "$header" | awk -F',' '{
    for(i=1;i<=NF;i++){ gsub(/^ *| *$/,"",$i); printf "\"%s\"%s",$i,(i<NF?", ":"") }
  }')"

  echo "IMPORT: $schema.$table from $csv"
  psql "$PROD_DB_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;
\COPY "$schema"."$table" ($cols) FROM '$(pwd)/$csv' WITH CSV HEADER
COMMIT;
SQL
done
