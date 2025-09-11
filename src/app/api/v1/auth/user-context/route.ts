import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Verify token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user entity (ENHANCED: Support both user and user_profile types)
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .or(`entity_type.eq.user,entity_type.eq.user_profile`)
      .or(`entity_code.eq.USER-${user.email},metadata->'auth_user_id'.eq."${user.id}"`)
      .single()

    if (entityError || !userEntity) {
      return NextResponse.json({ 
        error: 'User profile not found',
        details: entityError?.message 
      }, { status: 404 })
    }

    // Get user's current organization context
    // 1. Check for explicit organization_id from request context
    // 2. Check user metadata for current organization
    // 3. Get primary organization from relationships
    const requestedOrgId = request.nextUrl.searchParams.get('organization_id')
    
    let currentOrganizationId = requestedOrgId || 
                               (userEntity.metadata as any)?.current_organization_id ||
                               user.user_metadata?.organization_id

    // If no current org specified, get user's primary organization
    if (!currentOrganizationId) {
      const { data: primaryMembership } = await supabase
        .from('core_relationships')
        .select('organization_id, metadata')
        .eq('from_entity_id', userEntity.id)
        .eq('relationship_type', 'member_of')
        .eq('is_active', true)
        .order('created_at', { ascending: true }) // First joined = primary
        .limit(1)
        .single()

      currentOrganizationId = primaryMembership?.organization_id
    }

    // Validate user has access to the requested organization
    let userMembership = null
    if (currentOrganizationId) {
      const { data: membership, error: membershipError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', userEntity.id)
        .eq('organization_id', currentOrganizationId)
        .eq('relationship_type', 'member_of')
        .eq('is_active', true)
        .single()

      if (membershipError || !membership) {
        // User doesn't have access to this organization
        return NextResponse.json({ 
          error: 'Access denied to organization',
          code: 'ORGANIZATION_ACCESS_DENIED'
        }, { status: 403 })
      }
      
      userMembership = membership
    }

    // Get dynamic fields for the user
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userEntity.id)
      .eq('organization_id', currentOrganizationId || userEntity.organization_id)

    // Get organization details
    let organizationData = null
    if (currentOrganizationId) {
      const { data: org } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', currentOrganizationId)
        .single()
      
      organizationData = org

      // Verify organization is active
      if (org && org.status !== 'active') {
        return NextResponse.json({ 
          error: 'Organization is not active',
          code: 'ORGANIZATION_INACTIVE'
        }, { status: 403 })
      }
    }

    // Build enhanced user context with membership information
    const userRole = userMembership?.metadata?.role || 
                    dynamicFields?.find(f => f.field_name === 'role')?.field_value_text || 
                    'user'
    
    const userPermissions = userMembership?.metadata?.permissions || 
                           ['entities:read', 'entities:write', 'transactions:read', 'transactions:write']

    const userContext = {
      user_entity: {
        id: userEntity.id,
        email: user.email || '',
        entity_name: userEntity.entity_name,
        entity_type: userEntity.entity_type,
        role: userRole,
        metadata: userEntity.metadata || {}
      },
      organization: organizationData ? {
        id: organizationData.id,
        organization_name: organizationData.organization_name,
        organization_type: organizationData.organization_type,
        organization_code: organizationData.organization_code,
        subscription_tier: organizationData.subscription_tier,
        status: organizationData.status
      } : null,
      membership: userMembership ? {
        membership_id: userMembership.id,
        role: userRole,
        permissions: userPermissions,
        is_primary: (userMembership.metadata as any)?.is_primary || false,
        joined_at: (userMembership.metadata as any)?.joined_at || userMembership.created_at,
        relationship_strength: userMembership.relationship_strength
      } : null,
      permissions: userPermissions,
      context: {
        current_organization_id: currentOrganizationId,
        has_multiple_organizations: false, // Will be set below
        context_validated_at: new Date().toISOString()
      }
    }

    // Check if user has multiple organization memberships
    const { count: orgCount } = await supabase
      .from('core_relationships')
      .select('id', { count: 'exact' })
      .eq('from_entity_id', userEntity.id)
      .eq('relationship_type', 'member_of')
      .eq('is_active', true)

    if (orgCount && orgCount > 1) {
      userContext.context.has_multiple_organizations = true
    }

    return NextResponse.json(userContext)

  } catch (error) {
    console.error('User context error:', error)
    return NextResponse.json(
      { error: 'Failed to load user context' }, 
      { status: 500 }
    )
  }
}