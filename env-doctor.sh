#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-production}"

if ! command -v railway >/dev/null 2>&1; then
  echo "❌ railway CLI not found. Install from https://docs.railway.app/develop/cli"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "❌ jq not found. Install with: brew install jq"
  exit 1
fi

echo "🔎 Pulling Railway $ENV variables…"
if ! json="$(railway variables --environment "$ENV" --json 2>/dev/null)"; then
  echo "❌ Could not read variables. Try: railway login"
  exit 1
fi

# Required keys
req_vars=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_URL
  HAIRTALKZ_ORG_ID
  SERVICE_USER_ENTITY_ID
  ALLOWLIST_DOMAIN
  DISABLE_EMERGENCY_AUTO_PROVISION
  NEXT_PUBLIC_SITE_URL
  NODE_ENV
)

# Expected literals
declare -A expected
expected[HAIRTALKZ_ORG_ID]="378f24fb-d496-4ff7-8afa-ea34895a0eb8"
expected[ALLOWLIST_DOMAIN]="hairtalkz.com"
expected[DISABLE_EMERGENCY_AUTO_PROVISION]="false"
expected[NODE_ENV]="production"
expected[NEXT_PUBLIC_SITE_URL]="https://heraerp.com"

printf "\n%-34s | %-10s | %-32s | %-32s\n" "Variable" "State" "Current" "Expected"
printf -- "---------------------------------------------------------------------------------------------------------------\n"

fix_cmds=()

for key in "${req_vars[@]}"; do
  cur="$(echo "$json" | jq -r --arg k "$key" '.[] | select(.name==$k) | .value' 2>/dev/null || true)"
  [ "$cur" = "null" ] && cur=""
  exp="${expected[$key]:-}"

  state="OK"
  if [ -z "$cur" ]; then
    state="MISSING"
    fix_cmds+=("railway variables set $key=\"<VALUE>\" --environment $ENV")
  elif [ -n "$exp" ] && [ "$cur" != "$exp" ]; then
    state="MISMATCH"
    fix_cmds+=("railway variables set $key=\"$exp\" --environment $ENV")
  fi

  mask_cur="-"; [ -n "$cur" ] && mask_cur="$(echo "$cur" | sed 's/./•/g' | cut -c1-8)"
  show_exp="-"; [ -n "$exp" ] && show_exp="$exp"
  printf "%-34s | %-10s | %-32s | %-32s\n" "$key" "$state" "$mask_cur" "$show_exp"
done

# Supabase URL consistency hint
np_url="$(echo "$json" | jq -r '.[] | select(.name=="NEXT_PUBLIC_SUPABASE_URL") | .value' 2>/dev/null || true)"
sv_url="$(echo "$json" | jq -r '.[] | select(.name=="SUPABASE_URL") | .value' 2>/dev/null || true)"
if [ -n "$np_url" ] && [ -n "$sv_url" ] && [ "$np_url" != "$sv_url" ]; then
  echo
  echo "⚠️  SUPABASE_URL != NEXT_PUBLIC_SUPABASE_URL"
  echo "   → railway variables set SUPABASE_URL=\"$np_url\" --environment $ENV"
fi

echo
if [ ${#fix_cmds[@]} -gt 0 ]; then
  echo "🔧 Run these to fix:"
  printf '%s\n' "${fix_cmds[@]}"
else
  echo "✅ All required vars present (and expected values match where specified)."
fi
