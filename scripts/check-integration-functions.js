// Check HERA Integration Runtime Functions
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkIntegrationFunctions() {
  console.log('🔍 Checking HERA Integration Runtime Functions...')
  console.log('===================================================')
  
  try {
    // Check if integration RPC functions exist
    const { data: functions, error } = await supabase.rpc('hera_integration_event_in_v1', {
      p_actor_user_id: '00000000-0000-0000-0000-000000000001',
      p_organization_id: '00000000-0000-0000-0000-000000000000', 
      p_event_source: 'test',
      p_event_type: 'test',
      p_event_data: { test: true },
      p_connector_code: 'test',
      p_idempotency_key: 'test-123',
      p_smart_code: 'HERA.TEST.EVENT.v1',
      p_options: {}
    })
    
    if (error) {
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('❌ Integration functions not yet deployed')
        console.log('   Run: supabase db push to apply migrations')
      } else {
        console.log('✅ Integration functions exist but test failed:', error.message)
      }
    } else {
      console.log('✅ Integration runtime functions are working!')
      console.log('   Test result:', functions)
    }

    // Check for connector definitions
    const { data: entities, error: entError } = await supabase
      .from('core_entities')
      .select('entity_code, entity_name, created_at')
      .eq('entity_type', 'INTEGRATION_CONNECTOR_DEF')
      .order('entity_code')
      
    if (entError) {
      console.log('❌ Error checking connector definitions:', entError.message)
    } else {
      console.log(`\n📊 Found ${entities.length} connector definitions:`)
      entities.forEach(conn => {
        console.log(`   • ${conn.entity_code}: ${conn.entity_name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkIntegrationFunctions()