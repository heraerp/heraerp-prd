#!/bin/sh

echo "Starting HERA ERP..."
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: ${NODE_ENV:-production}"
echo "Supabase URL configured: ${NEXT_PUBLIC_SUPABASE_URL:+Yes}"
echo "Supabase Key configured: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+Yes}"

# Ensure the server can bind to all interfaces
export HOSTNAME="0.0.0.0"

# Start Next.js
exec npm start