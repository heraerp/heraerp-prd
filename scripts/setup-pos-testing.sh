#!/bin/bash

# POS Testing Setup Script
# Sets up environment for regression testing the salon POS system

echo "🧪 POS Regression Testing Setup"
echo "==============================="

# Check if required environment variables exist
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ SUPABASE_URL not set"
    echo "Please set your Supabase URL:"
    echo "export SUPABASE_URL='https://your-project.supabase.co'"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY not set" 
    echo "Please set your Supabase service role key:"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    exit 1
fi

# Check if organization and user IDs are available
if [ -z "$TEST_ORGANIZATION_ID" ]; then
    echo "⚠️  TEST_ORGANIZATION_ID not set"
    echo "Attempting to fetch from database..."
    
    # Try to get the first organization ID
    ORG_ID=$(node -e "
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient('$SUPABASE_URL', '$SUPABASE_SERVICE_ROLE_KEY');
        supabase.from('core_organizations')
            .select('id')
            .limit(1)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching organization:', error.message);
                    process.exit(1);
                }
                if (data && data.length > 0) {
                    console.log(data[0].id);
                    process.exit(0);
                }
                console.error('No organizations found');
                process.exit(1);
            });
    ")
    
    if [ $? -eq 0 ]; then
        export TEST_ORGANIZATION_ID="$ORG_ID"
        echo "✅ Found organization: $TEST_ORGANIZATION_ID"
    else
        echo "❌ Could not find organization. Please set manually:"
        echo "export TEST_ORGANIZATION_ID='your-org-uuid'"
        exit 1
    fi
fi

if [ -z "$TEST_USER_ID" ]; then
    echo "⚠️  TEST_USER_ID not set"
    echo "Attempting to fetch from database..."
    
    # Try to get a user ID (preferably a staff member)
    USER_ID=$(node -e "
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient('$SUPABASE_URL', '$SUPABASE_SERVICE_ROLE_KEY');
        supabase.from('core_entities')
            .select('id')
            .eq('entity_type', 'USER')
            .eq('organization_id', '$TEST_ORGANIZATION_ID')
            .limit(1)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching user:', error.message);
                    process.exit(1);
                }
                if (data && data.length > 0) {
                    console.log(data[0].id);
                    process.exit(0);
                }
                console.error('No users found in organization');
                process.exit(1);
            });
    ")
    
    if [ $? -eq 0 ]; then
        export TEST_USER_ID="$USER_ID"
        echo "✅ Found user: $TEST_USER_ID"
    else
        echo "❌ Could not find user. Please set manually:"
        echo "export TEST_USER_ID='your-user-uuid'"
        exit 1
    fi
fi

# Set default base URL if not provided
if [ -z "$TEST_BASE_URL" ]; then
    export TEST_BASE_URL="http://localhost:3002"
    echo "✅ Using default base URL: $TEST_BASE_URL"
fi

echo ""
echo "📋 Test Configuration:"
echo "Organization ID: $TEST_ORGANIZATION_ID"
echo "User ID: $TEST_USER_ID"
echo "Base URL: $TEST_BASE_URL"
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Create .env.test file for easy reuse
cat > .env.test << EOF
# POS Testing Environment Variables
# Generated on $(date)
SUPABASE_URL="$SUPABASE_URL"
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
TEST_ORGANIZATION_ID="$TEST_ORGANIZATION_ID"
TEST_USER_ID="$TEST_USER_ID"
TEST_BASE_URL="$TEST_BASE_URL"
EOF

echo "✅ Configuration saved to .env.test"
echo "💡 To reuse these settings later, run: source .env.test"
echo ""

# Offer to run tests immediately
read -p "🚀 Run POS regression tests now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧪 Starting POS regression test suite..."
    echo ""
    
    # Run the regression tests
    node tests/pos-regression-suite.mjs
    
    echo ""
    echo "🎯 Test completed! Check the results above."
    echo "💡 You can also run the live testing dashboard at: $TEST_BASE_URL/salon/pos-testing"
else
    echo "✅ Setup complete! You can run tests manually with:"
    echo "   source .env.test && node tests/pos-regression-suite.mjs"
    echo ""
    echo "🌐 Or use the live dashboard at: $TEST_BASE_URL/salon/pos-testing"
fi