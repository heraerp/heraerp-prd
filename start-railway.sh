#!/bin/sh

echo "🚀 Starting HERA ERP on Railway..."
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "Supabase URL configured: ${NEXT_PUBLIC_SUPABASE_URL:+Yes}"
echo "Supabase Key configured: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+Yes}"

# Ensure the server can bind to all interfaces
export HOSTNAME="0.0.0.0"
export PORT=${PORT:-3000}
export NODE_ENV=${NODE_ENV:-production}

# Add error logging
export NODE_OPTIONS="${NODE_OPTIONS} --trace-warnings"

# Start custom server that handles health checks
exec node server-simple.js