#!/bin/bash

# Rollback app-specific pages
APP_PAGES=(
  "src/app/salon/"
  "src/app/salon-data/"
  "src/app/finance/"
  "src/app/financial/"
  "src/app/isp/"
  "src/app/civicflow/"
  "src/app/crm/"
  "src/app/furniture/"
  "src/app/franchise/"
  "src/app/development/"
  "src/app/whatsapp"
  "src/app/mcp-"
  "src/app/enterprise/"
  "src/app/budgeting/"
  "src/app/calendar/"
  "src/app/dashboard/"
  "src/app/dashboards/"
  "src/app/debug-auth/"
  "src/app/demo-init/"
  "src/app/hairtalkz/"
  "src/app/learning/"
  "src/app/org/"
  "src/app/readiness-"
  "src/app/runs/"
  "src/app/settings/"
  "src/app/sql-"
  "src/app/tasks/"
  "src/app/test-"
  "src/app/trial-balance/"
  "src/app/universal-ui/"
  "src/app/validate/"
  "src/app/auto-journal/"
  "src/app/admin/"
  "src/app/docs/"
)

echo "Rolling back app-specific pages..."
for pattern in "${APP_PAGES[@]}"; do
  files=$(git diff --name-only | grep "^$pattern" || true)
  if [ ! -z "$files" ]; then
    echo "$files" | while read file; do
      if [ -f "$file" ]; then
        git checkout HEAD -- "$file"
        echo "Rolled back: $file"
      fi
    done
  fi
done

echo ""
echo "Rollback complete. Checking remaining changes..."
