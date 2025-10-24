/**
 * Organizations API v2.3 - Organization Management
 * Handles organization creation with automatic user onboarding
 *
 * POST   /api/v2/organizations - Create organization with onboarding
 * GET    /api/v2/organizations - List user's organizations
 * PUT    /api/v2/organizations - Update organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// Organization creation schema
const createOrgSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required'),
  organization_code: z.string().optional(),
  organization_type: z.enum(['business_unit', 'branch', 'division', 'partner']).default('business_unit'),
  industry_classification: z.string().optional(),
  parent_organization_id: z.string().uuid().optional(),
  settings: z.record(z.any()).optional(),
  status: z.string().default('active'),
  // User onboarding options
  role: z.string().default('owner'), // Role for the creator
  auto_onboard: z.boolean().default(true) // Automatically onboard creator as owner
})

// Organization update schema
const updateOrgSchema = z.object({
  id: z.string().uuid(),
  organization_name: z.string().optional(),
  organization_type: z.enum(['business_unit', 'branch', 'division', 'partner']).optional(),
  industry_classification: z.string().optional(),
  parent_organization_id: z.string().uuid().optional().nullable(),
  settings: z.record(z.any()).optional(),
  status: z.string().optional(),
  if_match_version: z.number().optional() // For optimistic concurrency control
})

/**
 * POST /api/v2/organizations
 * Create new organization with automatic user onboarding
 */
export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseService()

    // Verify the token is valid with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ [CREATE ORG] Token verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    const userId = user.id
    const email = user.email
    const body = await request.json()
    const data = createOrgSchema.parse(body)

    console.log('🏢 [CREATE ORG] Starting organization creation:', {
      user_id: userId,
      org_name: data.organization_name,
      auto_onboard: data.auto_onboard
    })

    // Generate organization code if not provided
    const orgCode = data.organization_code || 'ORG-' + Date.now().toString(36).toUpperCase()
    const orgId = crypto.randomUUID()

    // Step 1: Create organization record
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        id: orgId,
        organization_name: data.organization_name,
        organization_code: orgCode,
        organization_type: data.organization_type,
        industry_classification: data.industry_classification,
        parent_organization_id: data.parent_organization_id,
        settings: data.settings || {},
        status: data.status,
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (orgError) {
      console.error('❌ [CREATE ORG] Failed:', orgError)

      // Handle duplicate organization_code error
      if (orgError.code === '23505' && orgError.message.includes('organization_code')) {
        return NextResponse.json(
          {
            error: 'Duplicate organization code',
            details: `Organization code "${orgCode}" already exists. Please use a different code.`,
            code: 'DUPLICATE_ORG_CODE'
          },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create organization', details: orgError.message },
        { status: 500 }
      )
    }

    console.log('✅ [CREATE ORG] Organization created:', org.id)

    // Step 2: Create organization entity (required for FK constraints)
    const normalizedOrgName = data.organization_name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 15)

    const { error: orgEntityError } = await supabase
      .from('core_entities')
      .insert({
        id: orgId,
        organization_id: orgId,
        entity_type: 'ORG',
        entity_name: data.organization_name,
        entity_code: orgCode,
        smart_code: `HERA.SALON.ENTITY.ORG.${normalizedOrgName}.v1`,
        smart_code_status: 'LIVE',
        status: 'active',
        created_by: userId,
        updated_by: userId
      })

    if (orgEntityError) {
      console.error('❌ [CREATE ORG] Failed to create org entity:', orgEntityError)

      // Cleanup: delete organization record
      await supabase.from('core_organizations').delete().eq('id', orgId)

      return NextResponse.json(
        { error: 'Failed to create organization entity', details: orgEntityError.message },
        { status: 500 }
      )
    }

    console.log('✅ [CREATE ORG] Organization entity created')

    // Step 3: Onboard user if requested
    let membershipResult = null
    if (data.auto_onboard) {
      console.log('👤 [CREATE ORG] Onboarding user as:', data.role)

      const { data: onboardData, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
        p_supabase_user_id: userId,
        p_organization_id: orgId,
        p_actor_user_id: userId,
        p_role: data.role
      })

      if (onboardError) {
        console.error('⚠️  [CREATE ORG] User onboarding failed:', onboardError)
        // Don't fail the request - org is created, just warn
        membershipResult = { error: onboardError.message }
      } else {
        console.log('✅ [CREATE ORG] User onboarded successfully')
        membershipResult = onboardData
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          organization: org,
          membership: membershipResult,
          onboarded: data.auto_onboard && !membershipResult?.error
        },
        message: 'Organization created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ [CREATE ORG] Exception:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid organization data', details: error.errors },
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
 * GET /api/v2/organizations
 * List organizations where user is a member
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Missing token' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseService()

    // Verify the token is valid with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ [GET ORGS] Token verification failed:', authError)
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)

    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'active'

    console.log('📋 [GET ORGS] Fetching organizations for user:', userId)

    // Get organizations where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('core_relationships')
      .select(`
        organization_id,
        relationship_data,
        created_at,
        core_organizations!core_relationships_organization_id_fkey (
          id,
          organization_name,
          organization_code,
          organization_type,
          industry_classification,
          settings,
          status,
          created_at,
          updated_at
        )
      `)
      .eq('from_entity_id', userId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (memberError) {
      console.error('❌ [GET ORGS] Failed to fetch organizations:', memberError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: memberError.message },
        { status: 500 }
      )
    }

    // Transform the response
    const organizations = memberships?.map(m => ({
      ...m.core_organizations,
      user_role: m.relationship_data?.role,
      user_label: m.relationship_data?.label,
      joined_at: m.created_at
    })) || []

    console.log('✅ [GET ORGS] Found', organizations.length, 'organizations')

    return NextResponse.json({
      success: true,
      data: organizations,
      pagination: {
        total: organizations.length,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('❌ [GET ORGS] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v2/organizations
 * Update organization details
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: userId } = authResult
    const body = await request.json()
    const data = updateOrgSchema.parse(body)

    const supabase = getSupabaseService()

    // Check if user has permission (must be ORG_OWNER or ORG_ADMIN)
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('relationship_data')
      .eq('from_entity_id', userId)
      .eq('organization_id', data.id)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .single()

    const userRole = membership?.relationship_data?.role

    if (!userRole || !['ORG_OWNER', 'ORG_ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Only organization owners and admins can update organization details' },
        { status: 403 }
      )
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_by: userId,
      updated_at: new Date().toISOString()
    }

    if (data.organization_name) updateData.organization_name = data.organization_name
    if (data.organization_type) updateData.organization_type = data.organization_type
    if (data.industry_classification) updateData.industry_classification = data.industry_classification
    if (data.parent_organization_id !== undefined) updateData.parent_organization_id = data.parent_organization_id
    if (data.settings) updateData.settings = data.settings
    if (data.status) updateData.status = data.status

    // Update organization
    const { data: org, error: updateError } = await supabase
      .from('core_organizations')
      .update(updateData)
      .eq('id', data.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to update organization', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: org,
      message: 'Organization updated successfully'
    })
  } catch (error) {
    console.error('Organization update error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid update data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
