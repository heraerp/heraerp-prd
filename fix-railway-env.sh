#!/bin/bash

# Railway Environment Variables Fix Script
# Run this after linking to your Railway service

echo "🚀 Setting critical HERA v2.2 environment variables..."

# Critical missing variables that prevent dashboard loading
echo "Setting SUPABASE_URL..."
railway variables --set "SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co"

echo "Setting canonical Hair Talkz organization ID..."
railway variables --set "HAIRTALKZ_ORG_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8"

echo "Setting site URL..."
railway variables --set "NEXT_PUBLIC_SITE_URL=https://heraerp.com"

echo "Setting security configuration..."
railway variables --set "ALLOWLIST_DOMAIN=hairtalkz.com"
railway variables --set "DISABLE_EMERGENCY_AUTO_PROVISION=false"

# Sync organization IDs to prevent drift
echo "Syncing organization ID variables..."
railway variables --set "DEFAULT_ORGANIZATION_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8"
railway variables --set "HERA_SALON_ORG_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8" 
railway variables --set "NEXT_PUBLIC_HERA_TENANT_ORG_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8"
railway variables --set "NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=378f24fb-d496-4ff7-8afa-ea34895a0eb8"

echo "✅ Environment variables set. Now checking current variables..."

# Verify the critical variables
echo "📋 Checking critical variables:"
railway variables --json | jq '.[] | select(.name|test("SUPABASE_URL$|HAIRTALKZ_ORG_ID$|NEXT_PUBLIC_SITE_URL$|ALLOWLIST_DOMAIN$"))'

echo ""
echo "🔧 Next steps:"
echo "1. Find the SERVICE_USER_ENTITY_ID by querying your database"
echo "2. Set it with: railway variables --set \"SERVICE_USER_ENTITY_ID=<uuid>\""
echo "3. Redeploy: railway redeploy"
echo "4. Test: curl -H \"Authorization: Bearer invalid\" https://heraerp.com/api/v2/bearer-test"