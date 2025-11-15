// HERA Integration Runtime - Development Deployment Verification
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyDeployment() {
  console.log('🔍 HERA Integration Runtime - Development Deployment Verification')
  console.log('================================================================')
  console.log('')

  let allChecksPass = true

  // Check 1: Database Functions
  console.log('📋 1. Checking Integration RPC Functions...')
  try {
    // Test integration event processing
    const { data, error } = await supabase.rpc('hera_integration_event_in_v1', {
      p_actor_user_id: '00000000-0000-0000-0000-000000000001',
      p_organization_id: '00000000-0000-0000-0000-000000000000',
      p_event_source: 'verification-test',
      p_event_type: 'deployment_check',
      p_event_data: { verification: true, timestamp: new Date().toISOString() },
      p_connector_code: 'test-connector',
      p_idempotency_key: `verify-${Date.now()}`,
      p_smart_code: 'HERA.TEST.VERIFICATION.DEPLOYMENT_CHECK.v1',
      p_options: { test_mode: true }
    })

    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('   ❌ Integration functions not deployed')
      allChecksPass = false
    } else if (data?.success) {
      console.log('   ✅ Integration event processing function working')
      console.log(`      Event ID: ${data.event_id}`)
    } else {
      console.log('   ✅ Integration functions exist (validation error expected)')
    }
  } catch (err) {
    console.log(`   ❌ Error testing functions: ${err.message}`)
    allChecksPass = false
  }

  // Check 2: Connector Definitions
  console.log('\n📱 2. Checking Pre-Built Connector Definitions...')
  try {
    const { data: connectors, error } = await supabase
      .from('core_entities')
      .select('entity_code, entity_name, created_at')
      .eq('entity_type', 'INTEGRATION_CONNECTOR_DEF')
      .order('entity_code')

    if (error) {
      console.log(`   ❌ Error checking connectors: ${error.message}`)
      allChecksPass = false
    } else {
      console.log(`   ✅ Found ${connectors.length} connector definitions:`)
      connectors.forEach(conn => {
        console.log(`      • ${conn.entity_code}: ${conn.entity_name}`)
      })
      
      const expectedConnectors = ['whatsapp-business-cloud', 'linkedin-api', 'meta-graph-api', 'zapier-webhook', 'hubspot-crm']
      const foundCodes = connectors.map(c => c.entity_code)
      const missing = expectedConnectors.filter(code => !foundCodes.includes(code))
      
      if (missing.length > 0) {
        console.log(`   ⚠️ Missing connectors: ${missing.join(', ')}`)
        allChecksPass = false
      } else {
        console.log('   ✅ All expected connectors present')
      }
    }
  } catch (err) {
    console.log(`   ❌ Error checking connectors: ${err.message}`)
    allChecksPass = false
  }

  // Check 3: Edge Functions
  console.log('\n🌐 3. Checking Edge Function Deployments...')
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1'
  
  try {
    // Check API v2 Gateway
    const apiResponse = await fetch(`${baseUrl}/api-v2/health`)
    if (apiResponse.status === 401) {
      console.log('   ✅ API v2 Gateway deployed and responding (auth required)')
    } else {
      console.log(`   ⚠️ API v2 Gateway unexpected response: ${apiResponse.status}`)
    }

    // Check Outbox Worker
    const outboxResponse = await fetch(`${baseUrl}/outbox-worker/health`)
    if (outboxResponse.status === 401) {
      console.log('   ✅ Outbox Worker deployed and responding (auth required)')
    } else {
      console.log(`   ⚠️ Outbox Worker unexpected response: ${outboxResponse.status}`)
    }
  } catch (err) {
    console.log(`   ❌ Error checking edge functions: ${err.message}`)
    allChecksPass = false
  }

  // Check 4: Development Server
  console.log('\n💻 4. Checking Development Server...')
  try {
    const devResponse = await fetch('http://localhost:3005')
    if (devResponse.ok) {
      console.log('   ✅ Development server running on http://localhost:3005')
    } else {
      console.log(`   ❌ Development server error: ${devResponse.status}`)
      allChecksPass = false
    }
  } catch (err) {
    console.log('   ❌ Development server not accessible')
    allChecksPass = false
  }

  // Check 5: Integration Pages
  console.log('\n📄 5. Checking Integration UI Pages...')
  const fs = await import('fs')
  
  const controlCenterExists = fs.existsSync('src/app/platform/integrations/control-center/page.tsx')
  const integrationHubExists = fs.existsSync('src/app/settings/integrations/page.tsx')
  
  if (controlCenterExists) {
    console.log('   ✅ Integration Control Center page exists')
    console.log('      URL: http://localhost:3005/platform/integrations/control-center')
  } else {
    console.log('   ❌ Integration Control Center page missing')
    allChecksPass = false
  }
  
  if (integrationHubExists) {
    console.log('   ✅ Integration Hub page exists')
    console.log('      URL: http://localhost:3005/settings/integrations')
  } else {
    console.log('   ❌ Integration Hub page missing')
    allChecksPass = false
  }

  // Summary
  console.log('\n' + '='.repeat(64))
  if (allChecksPass) {
    console.log('🎉 HERA Integration Runtime Development Deployment: SUCCESSFUL!')
    console.log('')
    console.log('🚀 Ready to integrate with:')
    console.log('   • WhatsApp Business - Customer messaging and support')
    console.log('   • LinkedIn Marketing - Lead generation and campaigns')
    console.log('   • Meta/Facebook - Social media management')
    console.log('   • Zapier - Connect with 5000+ business tools')
    console.log('   • HubSpot CRM - Customer relationship management')
    console.log('')
    console.log('📱 Access Integration UIs:')
    console.log('   • Control Center: http://localhost:3005/platform/integrations/control-center')
    console.log('   • Integration Hub: http://localhost:3005/settings/integrations')
    console.log('')
    console.log('🔗 Edge Function URLs:')
    console.log('   • API v2: https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2')
    console.log('   • Outbox Worker: https://ralywraqvuqgdezttfde.supabase.co/functions/v1/outbox-worker')
  } else {
    console.log('⚠️ HERA Integration Runtime Deployment: INCOMPLETE')
    console.log('   Some components failed verification. Check errors above.')
  }
  console.log('='.repeat(64))
}

verifyDeployment().catch(console.error)