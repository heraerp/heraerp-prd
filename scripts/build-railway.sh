#!/bin/bash
# Railway build script that ensures environment variables are available

echo "🚂 Starting Railway build..."
echo "📋 Environment check:"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+SET}"

# Ensure we're not using placeholder values
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"placeholder"* ]]; then
  echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL contains placeholder value!"
  echo "Please set the correct Supabase URL in Railway environment variables"
  exit 1
fi

# Run the actual build
npm run build:railway