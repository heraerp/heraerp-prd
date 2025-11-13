#!/bin/bash

# HERA Enhanced Gateway Deployment Script
# Automates deployment via Supabase CLI with fallback instructions

echo "🚀 HERA Enhanced Gateway Deployment Starting..."
echo "================================================"

# Check if Supabase CLI is working
echo "📋 Checking Supabase CLI status..."
if timeout 30s supabase status --output json > /dev/null 2>&1; then
    echo "✅ Supabase CLI working - attempting automated deployment"
    
    # Try automated deployment
    echo "📦 Deploying Enhanced Gateway..."
    if timeout 120s supabase functions deploy api-v2-consolidated --project-ref ralywraqvuqgdezttfde; then
        echo "✅ Automated deployment successful!"
        
        # Test deployment
        echo "🧪 Testing deployment..."
        sleep 5
        if curl -s "https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2-consolidated/health" | grep -q "healthy"; then
            echo "✅ Gateway health check passed!"
            echo "🎉 Deployment complete and verified!"
            exit 0
        else
            echo "⚠️ Health check failed - gateway may need time to start"
        fi
    else
        echo "❌ Automated deployment failed - falling back to manual"
    fi
else
    echo "⚠️ Supabase CLI timeout - using manual deployment"
fi

echo ""
echo "📋 MANUAL DEPLOYMENT REQUIRED"
echo "============================="
echo ""
echo "1. Access Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/ralywraqvuqgdezttfde/functions"
echo ""
echo "2. Create new function:"
echo "   - Name: api-v2"
echo "   - Runtime: Deno/TypeScript"
echo ""
echo "3. Copy code from:"
echo "   $(pwd)/supabase/functions/api-v2-consolidated/index.ts"
echo ""
echo "4. Deploy function and test:"
echo "   curl 'https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2/health'"
echo ""
echo "5. Verify with test suite:"
echo "   node test-consolidated-gateway.mjs"
echo ""
echo "📞 Manual deployment guide: ENHANCED-GATEWAY-DEPLOYMENT-GUIDE.md"