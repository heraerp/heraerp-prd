#!/bin/bash

echo "=== HERA Entity Normalization SQL Application Script ==="
echo ""
echo "This script will help you apply the normalization SQL to your Supabase database."
echo ""

# Check if we're in the right directory
if [ ! -f "db/init/01_hera_entity_normalization_dna.sql" ]; then
    echo "❌ Error: Cannot find the SQL file. Please run this from the project root."
    exit 1
fi

echo "Found SQL file: ✅"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed."
    echo "Install it from: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "Supabase CLI: ✅"
echo ""

# Check if we're linked to a project
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "❌ Error: Not linked to a Supabase project."
    echo "Run: supabase link --project-ref awfcrncxngqwbhqapffb"
    exit 1
fi

PROJECT_REF=$(cat supabase/.temp/project-ref)
echo "Linked to project: $PROJECT_REF ✅"
echo ""

echo "Choose an option:"
echo "1) Apply via Supabase Dashboard (recommended)"
echo "2) Apply via migration push (requires database password)"
echo "3) Show DATABASE_URL format for manual psql"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "To apply via Supabase Dashboard:"
        echo "1. Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
        echo "2. Copy the contents of: db/init/01_hera_entity_normalization_dna.sql"
        echo "3. Paste into the SQL editor"
        echo "4. Click 'Run' to execute"
        echo ""
        echo "Opening the SQL editor in your browser..."
        open "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new" 2>/dev/null || \
        xdg-open "https://supabase.com/dashboard/project/$PROJECT_REF/sql/new" 2>/dev/null || \
        echo "Please open the URL manually"
        ;;
    
    2)
        echo ""
        echo "This will push the migration to your database."
        echo "You'll need your database password from:"
        echo "https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
        echo ""
        read -p "Do you have your database password ready? (y/n): " ready
        if [ "$ready" = "y" ] || [ "$ready" = "Y" ]; then
            echo ""
            echo "Running: supabase db push"
            supabase db push
        else
            echo ""
            echo "Get your password from the dashboard first, then run this script again."
        fi
        ;;
    
    3)
        echo ""
        echo "To use psql directly, use this DATABASE_URL format:"
        echo ""
        echo "postgresql://postgres.$PROJECT_REF:[YOUR_PASSWORD]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres"
        echo ""
        echo "Then run:"
        echo "psql \$DATABASE_URL < db/init/01_hera_entity_normalization_dna.sql"
        echo ""
        echo "Replace [YOUR_PASSWORD] with your actual database password."
        ;;
    
    *)
        echo "Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "After applying the SQL, you can test it with:"
echo "cd mcp-server && node -e \"..."
echo "const { createClient } = require('@supabase/supabase-js');"
echo "// ... test code ..."
echo "\""