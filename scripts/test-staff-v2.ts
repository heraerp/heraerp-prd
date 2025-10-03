/**
 * scripts/test-staff-v2.ts
 * Quick local test for API v2 STAFF CRUD using Next route handlers directly.
 * Requires SUPABASE env configured and network access.
 *
 * Run: npx tsx scripts/test-staff-v2.ts
 */

import { NextRequest } from 'next/server'
import * as dotenv from 'dotenv'
dotenv.config()
console.log('[env] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing')
console.log('[env] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing')
console.log('[env] DEFAULT_ORG:', process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || process.env.DEFAULT_ORGANIZATION_ID || 'missing')
// Route handlers will be imported dynamically after env is loaded

async function run() {
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || process.env.DEFAULT_ORGANIZATION_ID
  if (!orgId) {
    throw new Error('Missing organization ID. Set NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID or DEFAULT_ORGANIZATION_ID')
  }

  const authHeader = 'Bearer demo-token-salon-receptionist'
  const baseHeaders = {
    'Content-Type': 'application/json',
    Authorization: authHeader,
    'x-hera-api-version': 'v2',
    'x-hera-org-id': orgId
  } as Record<string, string>

  // Dynamically import route handlers (ensures env is configured first)
  const { POST: ENTITIES_POST, GET: ENTITIES_GET, PUT: ENTITIES_PUT } = await import(
    '@/app/api/v2/entities/route'
  )
  const { DELETE: ENTITIES_DELETE } = await import('@/app/api/v2/entities/[id]/route')

  // 1) Create a STAFF entity
  const staffName = `Test Stylist ${Date.now()}`
  const createBody = {
    entity_type: 'STAFF',
    entity_name: staffName,
    smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
    dynamic_fields: {
      first_name: { value: 'Test', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1' },
      last_name: { value: 'Stylist', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1' },
      email: { value: `test-${Date.now()}@salon.com`, type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1' },
      status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1' }
    }
  }
  const createReq = new NextRequest('http://localhost:3000/api/v2/entities', {
    method: 'POST',
    headers: baseHeaders,
    body: JSON.stringify(createBody)
  })
  const createRes = await ENTITIES_POST(createReq)
  const createJson: any = await createRes.json()
  if (!createRes.ok) throw new Error(`Create failed: ${JSON.stringify(createJson)}`)
  const newId = createJson?.data?.id || createJson?.data?.entity_id
  console.log('✅ Created STAFF entity:', newId)

  // 2) Read STAFF list (should be scoped by org)
  const listReq = new NextRequest(
    `http://localhost:3000/api/v2/entities?entity_type=STAFF&include_dynamic=true&include_relationships=true`,
    { headers: baseHeaders }
  )
  const listRes = await ENTITIES_GET(listReq)
  const listJson: any = await listRes.json()
  if (!listRes.ok) throw new Error(`List failed: ${JSON.stringify(listJson)}`)
  const found = (listJson?.data || []).some((e: any) => e.id === newId)
  console.log(`✅ Listed STAFF entities (found new: ${found})`)

  // 3) Update STAFF
  const updateBody = {
    entity_id: newId,
    entity_name: `${staffName} Updated`,
    dynamic_fields: {
      status: { value: 'inactive', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1' }
    }
  }
  const updateReq = new NextRequest('http://localhost:3000/api/v2/entities', {
    method: 'PUT',
    headers: baseHeaders,
    body: JSON.stringify(updateBody)
  })
  const updateRes = await ENTITIES_PUT(updateReq)
  if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`)
  console.log('✅ Updated STAFF entity')

  // 4) Soft delete (archive)
  const delReq = new NextRequest(
    `http://localhost:3000/api/v2/entities/${newId}?hard_delete=false`,
    { method: 'DELETE', headers: baseHeaders }
  )
  const delRes = await ENTITIES_DELETE(delReq, { params: { id: newId } as any })
  if (!delRes.ok) throw new Error(`Delete failed: ${await delRes.text()}`)
  console.log('✅ Archived STAFF entity')

  console.log('\n🎉 Staff V2 CRUD smoke test passed')
}

run().catch(err => {
  console.error('❌ Test failed:', err)
  process.exitCode = 1
})
