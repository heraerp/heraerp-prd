/**
 * scripts/test-org-scope.ts
 * Proves org-scoped access for API v2 using in-process route handlers.
 *
 * Run: npx tsx scripts/test-org-scope.ts
 */

import { NextRequest } from 'next/server'

async function main() {
  const salonToken = 'demo-token-salon-receptionist'
  const jewelryToken = 'demo-token-jewelry-admin'

  const baseHeaders = (token: string) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'x-hera-api-version': 'v2'
  }) as Record<string, string>

  // Import handlers dynamically
  const { GET: ENTITIES_GET } = await import('@/app/api/v2/entities/route')

  // A) List STAFF in salon org
  {
    const req = new NextRequest(
      'http://localhost:3000/api/v2/entities?entity_type=STAFF&include_dynamic=true&limit=50',
      { headers: baseHeaders(salonToken) }
    )
    const res = await ENTITIES_GET(req)
    const json: any = await res.json()
    if (!res.ok) throw new Error(`Salon list failed: ${JSON.stringify(json)}`)
    const count = (json?.data || []).length
    console.log(`✅ Salon STAFF list returned ${count} rows (org-scoped)`) 
  }

  // Prepare a STAFF id from jewelry org
  let jewelryStaffId: string | undefined
  {
    const req = new NextRequest(
      'http://localhost:3000/api/v2/entities?entity_type=STAFF&limit=1',
      { headers: baseHeaders(jewelryToken) }
    )
    const res = await ENTITIES_GET(req)
    const json: any = await res.json()
    if (!res.ok) throw new Error(`Jewelry list failed: ${JSON.stringify(json)}`)
    jewelryStaffId = json?.data?.[0]?.id
    if (!jewelryStaffId) {
      console.warn('⚠️ No jewelry STAFF found to test cross-org read; skipping B)')
      return
    }
  }

  // B) Cross-org access attempt: salon token reading jewelry entity_id
  {
    const req = new NextRequest(
      `http://localhost:3000/api/v2/entities?entity_type=STAFF&entity_id=${jewelryStaffId}`,
      { headers: baseHeaders(salonToken) }
    )
    const res = await ENTITIES_GET(req)
    const json: any = await res.json()
    if (!res.ok) throw new Error(`Cross-org read failed (unexpected error): ${JSON.stringify(json)}`)
    const found = (json?.data || []).some((e: any) => e.id === jewelryStaffId)
    if (found) throw new Error('Cross-org read returned a foreign entity!')
    console.log('✅ Cross-org read blocked (no foreign rows returned)')
  }

  console.log('\n🎉 Org-scope smoke test passed')
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exitCode = 1
})

