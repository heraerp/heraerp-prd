#!/bin/bash

# Supabase connection test using curl
# Updated with your new Supabase credentials

SUPABASE_URL="https://awfcrncxngqwbhqapffb.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4"

echo "🔍 Testing Supabase Connection..."
echo "================================"
echo ""

# Test 1: Basic connection with anon key
echo "1️⃣ Testing REST API with Anon Key..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}"

echo ""

# Test 2: Check if core_organizations table exists
echo "2️⃣ Testing core_organizations table..."
curl -s \
  "${SUPABASE_URL}/rest/v1/core_organizations?limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Accept: application/json" | jq '.' 2>/dev/null || echo "Response: $(curl -s "${SUPABASE_URL}/rest/v1/core_organizations?limit=1" -H "apikey: ${ANON_KEY}" -H "Authorization: Bearer ${ANON_KEY}")"

echo ""

# Test 3: Test with service key
echo "3️⃣ Testing with Service Key..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}"

echo ""

# Test 4: Check auth endpoint
echo "4️⃣ Testing Auth Endpoint..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" \
  "${SUPABASE_URL}/auth/v1/health"

echo ""

# Test 5: List available tables (with service key)
echo "5️⃣ Listing available tables..."
curl -s \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Accept: application/vnd.pgrst.object+json" | jq '.' 2>/dev/null || echo "Unable to parse response"

echo ""
echo "================================"
echo "✅ Connection test complete!"
echo ""
echo "Expected results:"
echo "- HTTP Status 200: Connection successful"
echo "- HTTP Status 401: Authentication failed (check API keys)"
echo "- HTTP Status 404: Table not found (need to run migrations)"
echo "- Connection refused: Wrong URL or network issue"