// deno-lint-ignore-file no-explicit-any
// HERA Edge Function: auth-sync-hairtalkz
// Purpose: On auth events, ensure all users with @hairtalkz.com are assigned to the Salon org
// and have app scope metadata for APP.SALON. Optionally, can trigger /api/v2/auth/attach later.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type AuthEvent = {
  type?: string
  user?: {
    id: string
    email?: string
    user_metadata?: Record<string, any>
  }
}

function ok(body: any, init?: number | ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: typeof init === 'number' ? init : init?.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init as any)?.headers }
  })
}

function err(message: string, status = 400) {
  return ok({ ok: false, error: message }, status)
}

function getEnv(name: string, optional = false) {
  const v = Deno.env.get(name)
  if (!v && !optional) throw new Error(`Missing env: ${name}`)
  return v!
}

async function assignHairtalkzUser(userId: string, email: string, role: string) {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const svc = getEnv('SUPABASE_SERVICE_ROLE_KEY')
  const orgId = getEnv('HERA_SALON_ORG_ID')
  const admin = createClient(url, svc)

  // Merge apps array with APP.SALON
  const apps = ['APP.SALON']

  const { error } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      organization_id: orgId,
      role: role || 'receptionist',
      apps
    }
  })
  if (error) throw error
  return { organization_id: orgId }
}

function inferRoleFromEmail(email: string): string {
  // Simple heuristic: map mailbox to role; defaults to receptionist
  const local = email.split('@')[0]
  if (local.includes('owner')) return 'owner'
  if (local.includes('manager')) return 'manager'
  if (local.includes('admin')) return 'admin'
  if (local.includes('account')) return 'accountant'
  if (local.includes('stylist')) return 'stylist'
  return 'receptionist'
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return err('method_not_allowed', 405)

    const payload = (await req.json()) as AuthEvent
    const evtType = payload.type || 'unknown'
    const user = payload.user

    if (!user?.id || !user?.email) {
      return err('invalid_payload')
    }

    // Only process HairTalkz mailboxes
    if (!user.email.endsWith('@hairtalkz.com')) {
      return ok({ ok: true, skipped: true, reason: 'non_hairtalkz_domain', type: evtType })
    }

    const role = inferRoleFromEmail(user.email)
    const assigned = await assignHairtalkzUser(user.id, user.email, role)

    return ok({ ok: true, type: evtType, user_id: user.id, email: user.email, ...assigned })
  } catch (e) {
    console.error('[auth-sync-hairtalkz] error', e)
    return err(e?.message || 'internal_error', 500)
  }
})

