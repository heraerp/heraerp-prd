#!/bin/bash
set -e

echo "🚀 Starting Railway build process..."

# Export dummy environment variables for build
export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://dummy.supabase.co}"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-dummy-anon-key}"
export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-dummy-service-key}"

# Set Node options for memory
export NODE_OPTIONS="--max-old-space-size=4096"

# Skip environment validation
export SKIP_ENV_VALIDATION=true

echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

echo "🔧 Generating types (allowing failures)..."
npm run schema:types || echo "Schema types generation failed, continuing..."

echo "🧹 Clearing cache..."
node scripts/clear-browser-cache.js || echo "Cache clearing failed, continuing..."

echo "📝 Injecting build version..."
node scripts/inject-build-version.js || echo "Version injection failed, continuing..."

echo "🏗️ Building Next.js application..."
npx next build

echo "✅ Checking if build succeeded..."
if [ -d ".next" ]; then
    echo "✅ Build directory found!"
    ls -la .next/
else
    echo "❌ Build directory not found!"
    exit 1
fi

echo "✅ Railway build completed successfully!"