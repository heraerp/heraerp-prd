#!/usr/bin/env node
/**
 * Deploy the correct hera_entities_crud_v1 function to Supabase
 * This fixes the "cr.source_entity_id does not exist" error
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function deployFunction() {
  console.log('🚀 Deploying hera_entities_crud_v1 function fix...\n')

  // Read the SQL file with the function definition
  const sqlPath = join(__dirname, 'hera_entities_crud_v1_fixed.sql')

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`)
    console.log('\n📝 Please save the correct SQL function definition to:')
    console.log(`   ${sqlPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('📄 SQL file loaded')
  console.log(`   File: ${sqlPath}`)
  console.log(`   Size: ${sql.length} bytes\n`)

  // Execute the SQL to create/replace the function
  console.log('⚙️  Executing SQL...')

  const { data, error } = await supabase.rpc('exec_sql', {
    query: sql
  })

  if (error) {
    console.error('❌ Deployment failed:', error)
    console.log('\n💡 Alternative: Copy and paste the SQL directly into Supabase SQL Editor')
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
    process.exit(1)
  }

  console.log('✅ Function deployed successfully!\n')

  // Test the function
  console.log('🧪 Testing the deployed function...\n')

  // Get test data
  const { data: orgs } = await supabase
    .from('core_entities')
    .select('id, organization_id')
    .eq('entity_type', 'ORGANIZATION')
    .limit(1)

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found for testing')
    process.exit(1)
  }

  const orgId = orgs[0].organization_id
  console.log(`Using organization: ${orgId}`)

  // Get a user from that org
  const { data: users } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'USER')
    .eq('organization_id', orgId)
    .limit(1)

  if (!users || users.length === 0) {
    console.error('❌ No users found for testing')
    process.exit(1)
  }

  const userId = users[0].id
  console.log(`Using user: ${userId}\n`)

  // Test READ operation
  const { data: testResult, error: testError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: userId,
    p_organization_id: orgId,
    p_entity: {
      entity_type: 'SERVICE'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      limit: 5,
      include_dynamic: true,
      include_relationships: true
    }
  })

  if (testError) {
    console.error('❌ Test failed:', testError)
    process.exit(1)
  }

  console.log('📊 Test Results:')
  console.log('   Success:', testResult?.success)
  console.log('   Error:', testResult?.error || 'None')

  const items = testResult?.data?.list || testResult?.items || []
  console.log('   Items returned:', items.length)

  if (testResult?.error) {
    console.error('\n❌ Function still has errors:', testResult.error)
    process.exit(1)
  }

  if (testResult?.success === false) {
    console.error('\n❌ Function returned success=false')
    console.log('Full response:', JSON.stringify(testResult, null, 2))
    process.exit(1)
  }

  console.log('\n✅ All tests passed! Services should now load correctly.\n')
  console.log('🌐 Visit http://localhost:3000/salon/services to verify\n')
}

deployFunction().catch(error => {
  console.error('❌ Deployment script error:', error)
  process.exit(1)
})
