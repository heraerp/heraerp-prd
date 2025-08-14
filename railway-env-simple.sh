#!/bin/bash

echo "Adding Supabase URL to Railway..."

# Try to add the environment variable
railway variables --set "NEXT_PUBLIC_SUPABASE_URL=https://hsumtzuqzoqccpjiaikh.supabase.co" --set "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA3ODcsImV4cCI6MjA2OTE3Njc4N30.MeQGn3wi7WFDLfw_DNUKzvfOYle9vGX9BEN67wuSTLQ" --set "NODE_ENV=production"

echo "Environment variables added to Railway!"