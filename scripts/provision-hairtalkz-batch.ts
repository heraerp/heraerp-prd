/**
 * scripts/provision-hairtalkz-batch.ts
 *
 * Batch-provision HairTalkz users from a local JSON file and attach them to an org.
 * Each user:
 *  - Is created/updated in Supabase Auth (email must end with @hairtalkz.com)
 *  - Gets user_metadata { organization_id, role, apps: ['APP.SALON'] }
 *  - Re-signs in to refresh JWT with org_id
 *  - Calls /api/v2/auth/attach (creates Platform USER entity + tenant relationship)
 *  - Verifies Platform USER entity and tenant USER_MEMBER_OF_ORG relationship
 *
 * Usage:
 *   npx tsx scripts/provision-hairtalkz-batch.ts [path/to/users.json] [ORG_ID]
 *   - If ORG_ID provided, overrides each user's orgId.
 *   - File default: scripts/hairtalkz-users.local.json (not committed)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as dotenv from 'dotenv'
import { NextRequest } from 'next/server'

// Load env from .env.local first (if present), then .env
(() => {
  const cwd = process.cwd()
  const localPath = path.join(cwd, '.env.local')
  const envPath = path.join(cwd, '.env')
  if (fs.existsSync(localPath)) dotenv.config({ path: localPath })
  dotenv.config({ path: envPath })
  dotenv.config()
})()

type UserRow = {
  email: string
  password: string
  role: string
  orgId?: string
}

async function provisionOne(
  adminUrl: string,
  anonKey: string,
  serviceKey: string,
  email: string,
  password: string,
  role: string,
  orgId: string
) {
  const admin = createClient(adminUrl, serviceKey)
  const client = createClient(adminUrl, anonKey)

  // Sign-in or create
  let token: string | undefined
  let userId: string | undefined
  const signInTry = await client.auth.signInWithPassword({ email, password })
  if (signInTry.error) {
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true })
    if (created.error) throw created.error
    userId = created.data.user!.id
    const s2 = await client.auth.signInWithPassword({ email, password })
    if (s2.error) throw s2.error
    token = s2.data.session?.access_token || ''
    console.log(`✅ Created + signed in: ${email} -> ${userId}`)
  } else {
    userId = signInTry.data.user?.id
    token = signInTry.data.session?.access_token || ''
    console.log(`✅ Signed in: ${email} -> ${userId}`)
  }
  if (!userId || !token) throw new Error('sign_in_failed')

  // Update metadata
  const updated = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { organization_id: orgId, role, apps: ['APP.SALON'] }
  })
  if (updated.error) throw updated.error

  // Refresh JWT with new org
  await client.auth.signOut()
  const refreshed = await client.auth.signInWithPassword({ email, password })
  if (refreshed.error) throw refreshed.error
  token = refreshed.data.session?.access_token || ''
  if (!token) throw new Error('token_refresh_failed')

  // Attach
  const { POST: ATTACH } = await import('@/app/api/v2/auth/attach/route')
  const attachReq = new NextRequest('http://localhost:3000/api/v2/auth/attach', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  })
  const attachRes = await ATTACH(attachReq)
  const attachJson: any = await attachRes.json()
  if (!attachRes.ok || !attachJson?.ok) throw new Error(`attach_failed ${JSON.stringify(attachJson)}`)

  // Verify Platform USER entity and tenant relationship via service role
  const platformOrgId = '00000000-0000-0000-0000-000000000000'
  const { data: userEntity, error: userSelErr } = await admin
    .from('core_entities')
    .select('id')
    .eq('id', userId)
    .eq('organization_id', platformOrgId)
    .maybeSingle()
  if (userSelErr || !userEntity) throw new Error('platform_user_entity_missing')

  const { data: relRow, error: relErr } = await admin
    .from('core_relationships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('from_entity_id', userId)
    .eq('to_entity_id', orgId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .maybeSingle()
  if (relErr || !relRow) throw new Error('user_member_of_org_missing')

  return { userId }
}

async function main() {
  const fileArg = process.argv[2] || 'scripts/hairtalkz-users.local.json'
  const overrideOrg = process.argv[3]

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  const envOrg =
    process.env.HERA_SALON_ORG_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ||
    process.env.DEFAULT_ORGANIZATION_ID

  if (!url || !anon || !service || (!overrideOrg && !envOrg)) {
    console.error('[env] NEXT_PUBLIC_SUPABASE_URL:', !!url)
    console.error('[env] NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!anon)
    console.error('[env] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE:', !!service)
    console.error('[env] ORG_ID (arg/env):', !!(overrideOrg || envOrg))
    throw new Error('missing_required_env')
  }

  const abs = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg)
  if (!fs.existsSync(abs)) {
    throw new Error(`File not found: ${abs}. Create it from scripts/hairtalkz-users.example.json`) 
  }
  const list = JSON.parse(fs.readFileSync(abs, 'utf-8')) as UserRow[]
  if (!Array.isArray(list)) throw new Error('invalid_file_format: expected array')

  let ok = 0
  let fail = 0
  const failures: Array<{ email: string; error: string }> = []

  for (const row of list) {
    const orgId = overrideOrg || row.orgId || envOrg!
    try {
      await provisionOne(url!, anon!, service!, row.email, row.password, row.role, orgId)
      console.log(`✅ Provisioned: ${row.email}`)
      ok++
    } catch (e: any) {
      console.error(`❌ Failed: ${row.email}:`, e?.message || e)
      failures.push({ email: row.email, error: e?.message || String(e) })
      fail++
    }
  }

  console.log('\nSummary:')
  console.log(`  Succeeded: ${ok}`)
  console.log(`  Failed:    ${fail}`)
  if (failures.length) {
    console.log('  Failure details:')
    for (const f of failures) console.log(`   - ${f.email}: ${f.error}`)
  }
}

main().catch(err => {
  console.error('❌ Batch failed:', err)
  process.exitCode = 1
})

