/**
 * Organization Members API v2.3 - User Onboarding
 * Handles adding/removing members from organizations
 *
 * POST   /api/v2/organizations/members - Onboard user to organization
 * GET    /api/v2/organizations/members - List organization members
 * DELETE /api/v2/organizations/members - Remove member from organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Onboard member schema
const onboardMemberSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  role: z.string().default('member') // Can be: owner, admin, manager, employee, or custom label
})

// Remove member schema
const removeMemberSchema = z.object({
  user_id: z.string().uuid(),
  organization_id: z.string().uuid()
})

/**
 * POST /api/v2/organizations/members
 * Onboard a user to an organization
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: actorUserId } = authResult
    const body = await request.json()
    const data = onboardMemberSchema.parse(body)

    const supabase = getSupabaseService()

    console.log('👤 [ONBOARD MEMBER] Starting:', {
      actor: actorUserId,
      user_id: data.user_id,
      org_id: data.organization_id,
      role: data.role
    })

    // Check if actor has permission to onboard users (must be ORG_OWNER or ORG_ADMIN)
    const { data: actorMembership } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', actorUserId)
      .eq('organization_id', data.organization_id)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .single()

    const actorRole = actorMembership?.relationship_data?.role

    if (!actorRole || !['ORG_OWNER', 'ORG_ADMIN'].includes(actorRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization owners and admins can onboard members' },
        { status: 403 }
      )
    }

    // Call hera_onboard_user_v1 RPC
    const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: data.user_id,
      p_organization_id: data.organization_id,
      p_actor_user_id: actorUserId,
      p_role: data.role
    })

    if (onboardError) {
      console.error('❌ [ONBOARD MEMBER] Failed:', onboardError)
      return NextResponse.json(
        { error: 'Failed to onboard user', details: onboardError.message },
        { status: 500 }
      )
    }

    console.log('✅ [ONBOARD MEMBER] Success:', onboardResult)

    return NextResponse.json(
      {
        success: true,
        data: onboardResult,
        message: 'User onboarded successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ [ONBOARD MEMBER] Exception:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid onboarding data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v2/organizations/members
 * List members of an organization
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = authResult
    const { searchParams } = new URL(request.url)

    const organizationId = searchParams.get('organization_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseService()

    // Check if user is a member of this organization
    const { data: userMembership } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', userId)
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .single()

    if (!userMembership) {
      return NextResponse.json(
        { error: 'Forbidden: You are not a member of this organization' },
        { status: 403 }
      )
    }

    // Get all members
    const { data: memberships, error: memberError } = await supabase
      .from('core_relationships')
      .select(`
        from_entity_id,
        relationship_data,
        created_at,
        updated_at,
        core_entities!core_relationships_from_entity_id_fkey (
          id,
          entity_name,
          entity_code,
          metadata
        )
      `)
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (memberError) {
      console.error('Failed to fetch members:', memberError)
      return NextResponse.json(
        { error: 'Failed to fetch members', details: memberError.message },
        { status: 500 }
      )
    }

    // Transform the response
    const members = memberships?.map(m => ({
      user_id: m.from_entity_id,
      name: m.core_entities?.entity_name,
      email: m.core_entities?.metadata?.email,
      role: m.relationship_data?.role,
      label: m.relationship_data?.label,
      joined_at: m.created_at,
      updated_at: m.updated_at
    })) || []

    return NextResponse.json({
      success: true,
      data: members,
      pagination: {
        total: members.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Members list error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v2/organizations/members
 * Remove a member from an organization
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: actorUserId } = authResult
    const body = await request.json()
    const data = removeMemberSchema.parse(body)

    const supabase = getSupabaseService()

    // Check if actor has permission (must be ORG_OWNER or ORG_ADMIN)
    const { data: actorMembership } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', actorUserId)
      .eq('organization_id', data.organization_id)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .single()

    const actorRole = actorMembership?.relationship_data?.role

    if (!actorRole || !['ORG_OWNER', 'ORG_ADMIN'].includes(actorRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization owners and admins can remove members' },
        { status: 403 }
      )
    }

    // Prevent removing the last owner
    if (data.user_id !== actorUserId) {
      const { data: targetMembership } = await supabase
        .from('core_relationships')
        .select('relationship_data')
        .eq('from_entity_id', data.user_id)
        .eq('organization_id', data.organization_id)
        .eq('relationship_type', 'MEMBER_OF')
        .single()

      if (targetMembership?.relationship_data?.role === 'ORG_OWNER') {
        const { count } = await supabase
          .from('core_relationships')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', data.organization_id)
          .eq('relationship_type', 'MEMBER_OF')
          .eq('is_active', true)
          .eq('relationship_data->>role', 'ORG_OWNER')

        if (count && count <= 1) {
          return NextResponse.json(
            { error: 'Cannot remove the last owner of the organization' },
            { status: 400 }
          )
        }
      }
    }

    // Deactivate membership
    const { error: removeError } = await supabase
      .from('core_relationships')
      .update({
        is_active: false,
        updated_by: actorUserId,
        updated_at: new Date().toISOString()
      })
      .eq('from_entity_id', data.user_id)
      .eq('organization_id', data.organization_id)
      .eq('relationship_type', 'MEMBER_OF')

    if (removeError) {
      console.error('Failed to remove member:', removeError)
      return NextResponse.json(
        { error: 'Failed to remove member', details: removeError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('Remove member error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
