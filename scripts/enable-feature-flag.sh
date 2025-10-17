#!/bin/bash

# Enable HERA Feature Flag
# ========================

set -e

FEATURE_FLAG=$1

if [ -z "$FEATURE_FLAG" ]; then
    echo "❌ Usage: $0 <feature_flag_name>"
    echo ""
    echo "Available flags:"
    echo "  - actor_resolution_enabled"
    echo "  - actor_stamping_enabled" 
    echo "  - membership_enforcement_enabled"
    echo "  - hardening_triggers_enabled"
    exit 1
fi

# Load environment variables
if [ -f .env ]; then
    source .env
fi

echo "🚀 Enabling feature flag: $FEATURE_FLAG"

# Enable via environment variable (for immediate effect)
export "HERA_${FEATURE_FLAG^^}=true"

# Update feature flags table (if exists)
if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "
    INSERT INTO feature_flags (flag_name, enabled, description, updated_at)
    VALUES ('$FEATURE_FLAG', true, 'HERA v2.2 Actor Migration', NOW())
    ON CONFLICT (flag_name) DO UPDATE SET
        enabled = true,
        updated_at = NOW();
    "
else
    node -e "
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    (async () => {
        const { error } = await supabase
            .from('feature_flags')
            .upsert({
                flag_name: '$FEATURE_FLAG',
                enabled: true,
                description: 'HERA v2.2 Actor Migration',
                updated_at: new Date().toISOString()
            });
        
        if (error) {
            console.error('Error:', error);
            process.exit(1);
        }
        
        console.log('✅ Feature flag enabled in database');
    })();
    "
fi

echo "✅ Feature flag '$FEATURE_FLAG' enabled successfully"

# Show current status
echo ""
echo "📊 Current Feature Flag Status:"
echo "================================"

if [ -n "$DATABASE_URL" ]; then
    psql "$DATABASE_URL" -c "
    SELECT 
        flag_name,
        enabled,
        description,
        updated_at
    FROM feature_flags 
    WHERE flag_name LIKE '%actor%' OR flag_name LIKE '%hardening%'
    ORDER BY flag_name;
    "
fi