#!/bin/bash

# Simple script to deploy organization functions to Supabase

echo "🚀 Deploying organization management functions to Supabase..."
echo ""

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    echo "Please set DATABASE_URL environment variable or add it to .env file"
    exit 1
fi

# Deploy the organization management functions
echo "📄 Deploying organization-management.sql..."
psql "$DATABASE_URL" -f database/functions/organizations/organization-management.sql

if [ $? -eq 0 ]; then
    echo "✅ Organization functions deployed successfully!"
    echo ""
    
    # Test the functions
    echo "🧪 Testing deployed functions..."
    
    # Test check_subdomain_availability
    echo "Testing check_subdomain_availability function..."
    psql "$DATABASE_URL" -c "SELECT check_subdomain_availability('test-subdomain');"
    
    # List all functions
    echo ""
    echo "📋 Listing organization-related functions:"
    psql "$DATABASE_URL" -c "SELECT proname FROM pg_proc WHERE proname LIKE '%organization%' OR proname LIKE '%subdomain%';"
    
else
    echo "❌ Failed to deploy organization functions"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"