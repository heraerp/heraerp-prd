/**
 * scripts/provision-hairtalkz-user.ts
 *
 * Creates (or updates) a real Supabase Auth user whose email ends with @hairtalkz.com,
 * assigns organization_id to the HairTalkz salon org, and attaches the user in HERA
 * (USER entity + USER_MEMBER_OF_ORG relationship).
 *
 * Env required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - HERA_SALON_ORG_ID (target org UUID)
 *
 * Usage:
 *   npx tsx scripts/provision-hairtalkz-user.ts user@somedomain@hairtalkz.com TempPass#2025 receptionist [ORG_ID]
 *   # role is optional (defaults to 'receptionist'); ORG_ID overrides env org if provided
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as dotenv from 'dotenv'

// Load env from .env.local first (if present), then .env
(() => {
  const cwd = process.cwd()
  const localPath = path.join(cwd, '.env.local')
  const envPath = path.join(cwd, '.env')
  if (fs.existsSync(localPath)) dotenv.config({ path: localPath })
  dotenv.config({ path: envPath })
  // Fallback to default .env loading as well
  dotenv.config()
})()
import { NextRequest } from 'next/server'

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const role = process.argv[4] || 'receptionist'
  const overrideOrgId = process.argv[5]

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/provision-hairtalkz-user.ts <email@hairtalkz.com> <password> [role]')
    process.exit(1)
  }
  if (!email.endsWith('@hairtalkz.com')) {
    throw new Error('Email must end with @hairtalkz.com')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  const orgId =
    overrideOrgId ||
    process.env.HERA_SALON_ORG_ID ||
    process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID ||
    process.env.DEFAULT_ORGANIZATION_ID

  if (!url || !anon || !service || !orgId) {
    console.error('[env] NEXT_PUBLIC_SUPABASE_URL:', !!url)
    console.error('[env] NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!anon)
    console.error('[env] SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE:', !!service)
    console.error(
      '[env] HERA_SALON_ORG_ID or NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID or DEFAULT_ORGANIZATION_ID:',
      !!orgId
    )
    throw new Error(
      'Missing required env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE), HERA_SALON_ORG_ID (or NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID, DEFAULT_ORGANIZATION_ID)'
    )
  }

  // Clients
  const admin = createClient(url, service)
  const client = createClient(url, anon)

  // 1) Try sign-in first (user may already exist)
  let userId: string | undefined
  let token: string | undefined
  const trySignIn = await client.auth.signInWithPassword({ email, password })
  if (trySignIn.error) {
    // 1a) Create user via admin
    console.log('ℹ️ Sign-in failed, creating user via Admin API:', trySignIn.error.message)
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (created.error) throw created.error
    userId = created.data.user!.id
    console.log('✅ Created Supabase user:', userId)

    // Sign in again
    const signedIn = await client.auth.signInWithPassword({ email, password })
    if (signedIn.error) throw signedIn.error
    token = signedIn.data.session?.access_token || ''
  } else {
    userId = trySignIn.data.user?.id
    token = trySignIn.data.session?.access_token || ''
    console.log('✅ Signed in; user exists:', userId)
  }

  if (!userId || !token) throw new Error('Failed to obtain user id/token')

  // 2) Assign organization_id + role + apps in metadata (idempotent)
  const updated = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      organization_id: orgId,
      role,
      apps: ['APP.SALON']
    }
  })
  if (updated.error) throw updated.error
  console.log('✅ Updated user metadata with organization_id and role')

  // IMPORTANT: Re-sign in to get fresh JWT with updated organization_id
  await client.auth.signOut()
  const refreshed = await client.auth.signInWithPassword({ email, password })
  if (refreshed.error) throw refreshed.error
  token = refreshed.data.session?.access_token || ''

  // 4) Call /api/v2/auth/attach to upsert USER entity + relationship
  const { POST: ATTACH } = await import('@/app/api/v2/auth/attach/route')
  const attachReq = new NextRequest('http://localhost:3000/api/v2/auth/attach', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  const attachRes = await ATTACH(attachReq)
  const attachJson: any = await attachRes.json()
  if (!attachRes.ok || !attachJson?.ok) {
    throw new Error(`Attach failed: ${attachRes.status} ${JSON.stringify(attachJson)}`)
  }
  console.log('✅ Attached user to HERA org:', attachJson.organization_id)

  // 5) Verify USER entity exists in Platform org via service role
  const adminVerify = createClient(url, service)
  const platformOrgId = '00000000-0000-0000-0000-000000000000'
  const { data: userEntity, error: userSelErr } = await adminVerify
    .from('core_entities')
    .select('id, organization_id, entity_type')
    .eq('id', userId)
    .eq('organization_id', platformOrgId)
    .maybeSingle()
  if (userSelErr) throw userSelErr
  if (!userEntity) throw new Error('USER entity not found in Platform org after attach')
  console.log('✅ USER entity exists in Platform org')

  // 6) Verify USER_MEMBER_OF_ORG relationship via service role (tenant org scope)
  const { data: relRow, error: relErr } = await adminVerify
    .from('core_relationships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('from_entity_id', userId)
    .eq('to_entity_id', orgId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .maybeSingle()
  if (relErr) throw relErr
  if (!relRow) throw new Error('USER_MEMBER_OF_ORG relationship not found')
  console.log('✅ USER_MEMBER_OF_ORG relationship exists')

  console.log('\n🎉 Provision + Attach test passed for', email)
}

main().catch(err => {
  console.error('❌ Test failed:', err)
  process.exitCode = 1
})
