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

    // Get user entity
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .or(`metadata->'auth_user_id'.eq."${user.id}",entity_code.eq.USER-${user.email}`)
      .eq('entity_type', 'user_profile')
      .single()

    if (userError || !userEntity) {
      return NextResponse.json({ 
        error: 'User entity not found',
        details: userError?.message 
      }, { status: 404 })
    }

    // Get all organization memberships for this user
    const { data: memberships, error: membershipError } = await supabase
      .from('core_relationships')
      .select(`
        id,
        organization_id,
        relationship_type,
        relationship_strength,
        metadata,
        is_active,
        created_at,
        core_organizations!core_relationships_organization_id_fkey (
          id,
          organization_name,
          organization_type,
          organization_code,
          status,
          subscription_tier,
          created_at
        )
      `)
      .eq('from_entity_id', userEntity.id)
      .eq('relationship_type', 'member_of')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (membershipError) {
      console.error('Failed to fetch memberships:', membershipError)
      return NextResponse.json(
        { error: 'Failed to fetch organization memberships' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedMemberships = memberships?.map(membership => ({
      membership_id: membership.id,
      organization: {
        id: membership.core_organizations.id,
        name: membership.core_organizations.organization_name,
        type: membership.core_organizations.organization_type,
        code: membership.core_organizations.organization_code,
        status: membership.core_organizations.status,
        subscription_tier: membership.core_organizations.subscription_tier,
        created_at: membership.core_organizations.created_at
      },
      membership: {
        role: (membership.metadata as any)?.role || 'member',
        is_primary: (membership.metadata as any)?.is_primary || false,
        permissions: (membership.metadata as any)?.permissions || [],
        joined_at: (membership.metadata as any)?.joined_at || membership.created_at,
        relationship_strength: membership.relationship_strength
      }
    })) || []

    // Identify primary organization
    const primaryOrg = formattedMemberships.find(m => m.membership.is_primary) || formattedMemberships[0]

    return NextResponse.json({
      success: true,
      user_entity_id: userEntity.id,
      total_organizations: formattedMemberships.length,
      primary_organization: primaryOrg?.organization || null,
      memberships: formattedMemberships
    })

  } catch (error) {
    console.error('User memberships error:', error)
    return NextResponse.json(
      { error: 'Failed to load user memberships' }, 
      { status: 500 }
    )
  }
}