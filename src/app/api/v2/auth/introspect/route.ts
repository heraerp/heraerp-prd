import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth/verify-auth'
import { getSupabaseService } from '@/lib/supabase-service'

/**
 * GET /api/v2/auth/introspect
 * Canonical auth introspection endpoint.
 * - Verifies JWT and derives organization strictly from token
 * - Resolves roles/permissions from Sacred 6 via service client
 * - Returns a stable payload used by HERAAuthProvider
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth || !auth.id || !auth.organizationId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseService()

    // 1) Find USER entity mapped to this auth user
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, metadata')
      .in('entity_type', ['USER', 'user'])
      .contains('metadata', { auth_user_id: auth.id })

    if (entityError) {
      // On error, still return minimal payload derived from JWT
      return NextResponse.json(
        {
          user_id: auth.id,
          email: auth.email || '',
          organization_id: auth.organizationId,
          roles: auth.roles || [],
          permissions: auth.permissions || [],
          source: 'server|minimal'
        },
        { status: 200 }
      )
    }

    // Select the entity matching the JWT org if available
    const userEntity =
      (userEntities || []).find(e => e.organization_id === auth.organizationId) ||
      (userEntities && userEntities[0])

    let resolvedRole: string | undefined
    let resolvedPermissions: string[] = []

    if (userEntity) {
      // 2) Read dynamic fields for this user within the JWT-derived organization
      const { data: dynamicRows, error: dynErr } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_json, field_type')
        .eq('entity_id', userEntity.id)
        .eq('organization_id', auth.organizationId)

      if (!dynErr && dynamicRows) {
        const map: Record<string, any> = {}
        for (const f of dynamicRows) {
          const value = f.field_type === 'json' ? f.field_value_json : f.field_value_text
          map[f.field_name] = value
        }
        const salonRole = map['salon_role']
        const permissionsValue = map['permissions']
        if (typeof salonRole === 'string') resolvedRole = salonRole
        if (Array.isArray(permissionsValue)) resolvedPermissions = permissionsValue.filter(Boolean)
      }
    }

    // Prefer JWT roles if present; otherwise use resolved role
    const roles =
      auth.roles && auth.roles.length > 0 ? auth.roles : resolvedRole ? [resolvedRole] : []

    const permissions =
      auth.permissions && auth.permissions.length > 0 ? auth.permissions : resolvedPermissions

    return NextResponse.json(
      {
        user_id: auth.id,
        email: auth.email || '',
        organization_id: auth.organizationId,
        roles,
        permissions,
        source: 'server'
      },
      { status: 200 }
    )
  } catch (e: any) {
    console.error('[auth/introspect] error', e)
    return NextResponse.json({ error: 'internal_error', message: e?.message }, { status: 500 })
  }
}
