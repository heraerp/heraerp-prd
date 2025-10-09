import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/v2/identity/demo-user
 *
 * Body (JSON):
 * {
 *   "org": { "code": "KERALA-RETAIL", "name": "Kerala Laptop Retail Pvt Ltd" }  // OR: { "id": "<uuid>" }
 *   "user": {
 *     "code": "user.saanvi.cashier",
 *     "name": "Saanvi Nair",
 *     "email": "saanvi.cashier@example.com",
 *     "phone": "+91-9xxxxxxxxx",
 *     "role": "cashier"
 *   },
 *   "branch": { "name": "Kozhikode Store" },        // optional: link default branch
 *   "app": { "code": "APP.RETAIL" },                // optional; defaults to APP.RETAIL
 *   "inviteAuth": {                                 // optional: create Supabase auth user
 *     "email": "saanvi.cashier@example.com",
 *     "password": "TempPass#2025"
 *   }
 * }
 *
 * Auth:
 *  - Requires a valid Supabase access token (Authorization: Bearer …) for auditing.
 *  - Uses SERVICE ROLE to perform idempotent upserts.
 *
 * Guarantees:
 *  - No schema drift; only uses core_organizations, core_entities, core_relationships.
 *  - Idempotent: safe to call multiple times.
 */

type OrgInput = { id?: string; code?: string; name?: string }
type UserInput = { code: string; name: string; email?: string; phone?: string; role?: string }
type BranchInput = { id?: string; name?: string }
type AppInput = { code?: string }

const SVC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SVC_KEY =
  (process.env.SUPABASE_SERVICE_ROLE as string) ||
  (process.env.SUPABASE_SERVICE_ROLE_KEY as string as string) // service key required

const SC_USER = 'HERA.CORE.IDENTITY.ENTITY.USER.v1'
const SC_APP = 'HERA.CORE.APP.ENTITY.APPLICATION.v1'
const SC_REL_USER_ORG = 'HERA.CORE.REL.USER_TO_ORG.v1'
const SC_REL_USER_APP = 'HERA.RETAIL.REL.USER_APP_ACCESS.v1'
const SC_REL_USER_BRANCH = 'HERA.RETAIL.REL.USER_BRANCH_ACCESS.v1'
const SC_REL_AUTH_MAP = 'HERA.CORE.REL.AUTH_TO_ENTITY.v1'

export async function POST(req: NextRequest) {
  if (!SVC_URL || !SVC_KEY) {
    return NextResponse.json(
      { error: 'SERVER_MISCONFIGURED: missing Supabase service keys' },
      { status: 500 }
    )
  }

  const supabase = createClient(SVC_URL, SVC_KEY, { auth: { persistSession: false } })

  // Optional audit: ensure caller provided a token (not used for writes, which use service role)
  const authz = req.headers.get('authorization') || ''
  if (!authz.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 })
  }

  const body = (await req.json()) as {
    org: OrgInput
    user: UserInput
    branch?: BranchInput
    app?: AppInput
    inviteAuth?: { email: string; password: string }
  }

  const appCode = (body.app?.code ?? 'APP.RETAIL').trim()

  try {
    // 1) Resolve or create organization
    const orgId = await upsertOrg(supabase, body.org)

    // 2) Ensure APP entity exists (APP.RETAIL by default)
    const appEntityId = await ensureAppEntity(supabase, orgId, appCode)

    // 3) Upsert User entity (identity inside the Six)
    const userEntityId = await upsertUserEntity(supabase, orgId, body.user)

    // 4) Relationships
    await ensureUserOrgRel(supabase, orgId, userEntityId)
    await ensureUserAppRel(supabase, orgId, userEntityId, appEntityId, body.user.role)

    // 5) Optional: Branch link
    let branchLinked: { branch_id?: string; name?: string } | undefined
    if (body.branch?.id || body.branch?.name) {
      const branchId = await resolveBranchEntity(supabase, orgId, body.branch)
      if (branchId) {
        await ensureUserBranchRel(supabase, orgId, userEntityId, branchId, body.user.role)
        branchLinked = { branch_id: branchId, name: body.branch.name }
      }
    }

    // 6) Optional: Supabase auth user + mapping
    let authUserId: string | undefined
    if (body.inviteAuth?.email && body.inviteAuth?.password) {
      authUserId = await ensureAuthUser(supabase, body.inviteAuth.email, body.inviteAuth.password)
      await ensureAuthToEntityMap(supabase, orgId, authUserId, userEntityId)
    }

    return NextResponse.json({
      ok: true,
      organization_id: orgId,
      user_entity_id: userEntityId,
      app_entity_id: appEntityId,
      branch_linked: branchLinked ?? null,
      auth_user_id: authUserId ?? null
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'UNKNOWN' }, { status: 500 })
  }
}

// ---------- helpers ----------

async function upsertOrg(sb: any, org: OrgInput): Promise<string> {
  if (org.id) return org.id

  if (!org.code || !org.name) throw new Error('ORG_CODE_AND_NAME_REQUIRED')

  // Try find by code
  const { data: existing, error: selErr } = await sb
    .from('core_organizations')
    .select('id, code')
    .eq('code', org.code)
    .limit(1)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing?.id) return existing.id

  // Insert
  const { data: ins, error: insErr } = await sb
    .from('core_organizations')
    .insert([{ code: org.code, name: org.name }])
    .select('id')
    .single()
  if (insErr) throw insErr
  return ins.id
}

async function ensureAppEntity(sb: any, orgId: string, appCode: string): Promise<string> {
  // Find by code within org
  const { data: existing, error: selErr } = await sb
    .from('core_entities')
    .select('id, code')
    .eq('organization_id', orgId)
    .eq('code', appCode)
    .limit(1)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing?.id) return existing.id

  // Upsert app as an entity
  const { data: ins, error: insErr } = await sb
    .from('core_entities')
    .insert([
      {
        organization_id: orgId,
        code: appCode,
        name: 'HERA Retail',
        smart_code: SC_APP,
        status: 'active'
      }
    ])
    .select('id')
    .single()
  if (insErr) throw insErr
  return ins.id
}

async function upsertUserEntity(sb: any, orgId: string, user: UserInput): Promise<string> {
  if (!user.code || !user.name) throw new Error('USER_CODE_AND_NAME_REQUIRED')

  const { data: existing, error: selErr } = await sb
    .from('core_entities')
    .select('id, code')
    .eq('organization_id', orgId)
    .eq('code', user.code)
    .limit(1)
    .maybeSingle()
  if (selErr) throw selErr
  if (existing?.id) return existing.id

  const { data: ins, error: insErr } = await sb
    .from('core_entities')
    .insert([
      {
        organization_id: orgId,
        code: user.code,
        name: user.name,
        smart_code: SC_USER,
        status: 'active',
        dynamic: {
          EMAIL: user.email ?? null,
          PHONE: user.phone ?? null,
          ROLE: user.role ?? null
        }
      }
    ])
    .select('id')
    .single()
  if (insErr) throw insErr
  return ins.id
}

async function ensureUserOrgRel(sb: any, orgId: string, userEntityId: string) {
  const { data: exists, error } = await sb
    .from('core_relationships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('smart_code', SC_REL_USER_ORG)
    .eq('from_entity_id', userEntityId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (exists?.id) return

  const { error: insErr } = await sb.from('core_relationships').insert([
    {
      organization_id: orgId,
      smart_code: SC_REL_USER_ORG,
      from_entity_id: userEntityId,
      to_organization_id: orgId,
      dynamic: { MEMBERSHIP_STATUS: 'active' }
    }
  ])
  if (insErr) throw insErr
}

async function ensureUserAppRel(
  sb: any,
  orgId: string,
  userEntityId: string,
  appEntityId: string,
  role?: string
) {
  const { data: exists, error } = await sb
    .from('core_relationships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('smart_code', SC_REL_USER_APP)
    .eq('from_entity_id', userEntityId)
    .eq('to_entity_id', appEntityId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (exists?.id) return

  const { error: insErr } = await sb.from('core_relationships').insert([
    {
      organization_id: orgId,
      smart_code: SC_REL_USER_APP,
      from_entity_id: userEntityId,
      to_entity_id: appEntityId,
      dynamic: {
        SCOPES: ['pos', 'inventory', 'sales'],
        ROLE: role ?? 'cashier'
      }
    }
  ])
  if (insErr) throw insErr
}

async function resolveBranchEntity(
  sb: any,
  orgId: string,
  branch: BranchInput
): Promise<string | null> {
  if (branch.id) return branch.id

  if (!branch.name) return null
  const { data, error } = await sb
    .from('core_entities')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('name', branch.name)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

async function ensureUserBranchRel(
  sb: any,
  orgId: string,
  userEntityId: string,
  branchEntityId: string,
  role?: string
) {
  const { data: exists, error } = await sb
    .from('core_relationships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('smart_code', SC_REL_USER_BRANCH)
    .eq('from_entity_id', userEntityId)
    .eq('to_entity_id', branchEntityId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (exists?.id) return

  const { error: insErr } = await sb.from('core_relationships').insert([
    {
      organization_id: orgId,
      smart_code: SC_REL_USER_BRANCH,
      from_entity_id: userEntityId,
      to_entity_id: branchEntityId,
      dynamic: { DEFAULT: true, ROLE: role ?? 'cashier' }
    }
  ])
  if (insErr) throw insErr
}

async function ensureAuthUser(sb: any, email: string, password: string): Promise<string> {
  // Create or find a Supabase auth user (Admin API)
  const { data, error } = await sb.auth.admin.getUserByEmail(email)
  if (error && error.message !== 'User not found') throw error

  if (data?.user?.id) return data.user.id

  const created = await sb.auth.admin.createUser({ email, password, email_confirm: true })
  if (created.error) throw created.error
  return created.data.user!.id
}

async function ensureAuthToEntityMap(
  sb: any,
  orgId: string,
  authUserId: string,
  entityUserId: string
) {
  // Use external_ref inside dynamic to avoid extra tables
  const { data: exists, error } = await sb
    .from('core_relationships')
    .select('id')
    .eq('organization_id', orgId)
    .eq('smart_code', SC_REL_AUTH_MAP)
    .eq('to_entity_id', entityUserId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (exists?.id) return

  const { error: insErr } = await sb.from('core_relationships').insert([
    {
      organization_id: orgId,
      smart_code: SC_REL_AUTH_MAP,
      from_external_ref: { provider: 'supabase', auth_user_id: authUserId },
      to_entity_id: entityUserId,
      dynamic: { PRIMARY: true }
    }
  ])
  if (insErr) throw insErr
}
