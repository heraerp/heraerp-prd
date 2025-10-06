/**
 * scripts/test-auth-attach.ts
 *
 * Verifies automatic generation + linking of HERA USER from Supabase Auth user via /api/v2/auth/attach.
 * Uses demo salon token to avoid real sign-in, and calls route handlers in-process.
 *
 * Run: npx tsx scripts/test-auth-attach.ts
 */

import { NextRequest } from 'next/server'

async function main() {
  const DEMO_TOKEN = 'demo-token-salon-receptionist'
  const DEMO_SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

  const headers = {
    Authorization: `Bearer ${DEMO_TOKEN}`,
    'Content-Type': 'application/json'
  } as Record<string, string>

  // 1) Attach user → ensures USER entity + ORG entity + USER_MEMBER_OF_ORG
  const { POST: ATTACH } = await import('@/app/api/v2/auth/attach/route')
  const attachReq = new NextRequest('http://localhost:3000/api/v2/auth/attach', {
    method: 'POST',
    headers
  })
  const attachRes = await ATTACH(attachReq)
  const attachJson: any = await attachRes.json()
  if (!attachRes.ok || !attachJson?.ok) {
    throw new Error(`Attach failed: ${attachRes.status} ${JSON.stringify(attachJson)}`)
  }
  console.log('✅ Attached user to HERA org:', attachJson.organization_id)

  // 2) Verify USER entity exists via v2 entities GET (org injected by withHERAAuth)
  const { GET: ENTITIES_GET } = await import('@/app/api/v2/entities/route')
  const listReq = new NextRequest(
    'http://localhost:3000/api/v2/entities?entity_type=USER&include_dynamic=false&limit=50',
    { headers }
  )
  const listRes = await ENTITIES_GET(listReq)
  const listJson: any = await listRes.json()
  if (!listRes.ok) throw new Error(`List users failed: ${JSON.stringify(listJson)}`)
  const hasUser = (listJson?.data || []).some((e: any) => e.id === DEMO_USER_ID)
  if (!hasUser) throw new Error('USER entity not found after attach')
  console.log('✅ USER entity exists with expected id')

  // 3) Verify USER_MEMBER_OF_ORG relationship via universal relationship-query
  const { POST: REL_QUERY } = await import(
    '@/app/api/v2/universal/relationship-query/route'
  )
  const relBody = {
    organization_id: DEMO_SALON_ORG_ID, // validated but ignored for RPC; org comes from JWT
    entity_id: DEMO_USER_ID,
    side: 'from',
    relationship_type: 'USER_MEMBER_OF_ORG',
    limit: 10
  }
  const relReq = new NextRequest('http://localhost:3000/api/v2/universal/relationship-query', {
    method: 'POST',
    headers,
    body: JSON.stringify(relBody)
  })
  const relRes = await REL_QUERY(relReq)
  const relJson: any = await relRes.json()
  if (!relRes.ok) throw new Error(`Relationship query failed: ${JSON.stringify(relJson)}`)
  const rels = relJson?.data || relJson?.relationships || []
  if (!rels || rels.length === 0) throw new Error('USER_MEMBER_OF_ORG relationship not found')
  console.log('✅ USER_MEMBER_OF_ORG relationship exists')

  console.log('\n🎉 Auth attach end-to-end test passed')
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exitCode = 1
})

