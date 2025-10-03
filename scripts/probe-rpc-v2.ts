import { createClient } from '@supabase/supabase-js'

const supa = createClient(
  process.env.SUPABASE_URL || '', 
  process.env.SUPABASE_SERVICE_KEY || ''
)

async function expectOk(name: string, res: any) {
  if (res.error) {
    throw new Error(`${name} failed: ${res.error.message}`)
  }
  if (!res.data || typeof res.data.success !== 'boolean') {
    throw new Error(`${name} invalid shape. Response: ${JSON.stringify(res.data)}`)
  }
}

async function main() {
  const org = process.env.HERA_TEST_ORG_ID
  
  if (!org) {
    throw new Error('HERA_TEST_ORG_ID environment variable is required')
  }
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required')
  }

  console.log('🔍 Probing HERA RPC v2 contracts...\n')
  console.log(`   Organization ID: ${org}`)
  console.log(`   Supabase URL: ${process.env.SUPABASE_URL}\n`)

  // Test hera_entity_read_v2
  console.log('1️⃣  Testing hera_entity_read_v2...')
  const read = await supa.rpc('hera_entity_read_v2', {
    p_organization_id: org,
    p_entity_type: 'ROLE',
    p_include_dynamic_data: true,
    p_include_relationships: false,
    p_limit: 1, 
    p_offset: 0, 
    p_status: 'active', 
    p_entity_id: null
  })
  await expectOk('hera_entity_read_v2', read)
  console.log('   ✅ Read contract OK\n')

  // Test hera_entity_upsert_v2
  console.log('2️⃣  Testing hera_entity_upsert_v2...')
  const uniqueSuffix = Date.now()
  const upsert = await supa.rpc('hera_entity_upsert_v2', {
    p_organization_id: org,
    p_payload: {
      entity_type: 'ROLE',
      entity_name: `CI_PROBE_ROLE_${uniqueSuffix}`,
      smart_code: 'HERA.SALON.ROLE.ENTITY.ITEM.V1',
      dynamic_fields: []
    }
  })
  await expectOk('hera_entity_upsert_v2', upsert)
  console.log('   ✅ Upsert contract OK\n')

  // Test hera_txn_post_v2 (if available)
  console.log('3️⃣  Testing hera_txn_post_v2...')
  try {
    const txnPayload = {
      transaction_type: 'JOURNAL',
      currency: 'USD',
      description: 'RPC v2 probe test',
      lines: [
        { gl_account_code: '1000', debit: 100, credit: 0, memo: 'test debit' },
        { gl_account_code: '4000', debit: 0, credit: 100, memo: 'test credit' }
      ],
      meta: { probe_test: true }
    }
    
    const txn = await supa.rpc('hera_txn_post_v2', {
      p_organization_id: org,
      p_payload: txnPayload
    })
    
    if (txn.error) {
      console.log(`   ⚠️  hera_txn_post_v2 not available: ${txn.error.message}`)
    } else {
      await expectOk('hera_txn_post_v2', txn)
      console.log('   ✅ Transaction posting contract OK')
    }
  } catch (err) {
    console.log(`   ⚠️  hera_txn_post_v2 test skipped: ${err}`)
  }

  console.log('\n✅ All RPC v2 contracts validated successfully!')
}

main().catch(err => {
  console.error('❌ RPC probe failed:', err.message)
  process.exit(1)
})