import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { target_organization_id } = await request.json()

    if (!target_organization_id) {
      return NextResponse.json({ error: 'target_organization_id is required' }, { status: 400 })
    }
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Verify current token
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
        error: 'User entity not found' 
      }, { status: 404 })
    }

    // Verify user has membership in target organization
    const { data: membership, error: membershipError } = await supabase
      .from('core_relationships')
      .select(`
        id,
        metadata,
        core_organizations!core_relationships_organization_id_fkey (
          id,
          organization_name,
          organization_type,
          status
        )
      `)
      .eq('from_entity_id', userEntity.id)
      .eq('organization_id', target_organization_id)
      .eq('relationship_type', 'member_of')
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ 
        error: 'User is not a member of the target organization',
        details: membershipError?.message
      }, { status: 403 })
    }

    // Verify target organization is active
    const org = membership.core_organizations as any
    if (org?.status !== 'active') {
      return NextResponse.json({ 
        error: 'Target organization is not active'
      }, { status: 403 })
    }

    // Log the organization switch for audit trail
    const { error: auditError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: target_organization_id,
        transaction_type: 'organization_switch',
        transaction_code: `ORGSWITCH-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        from_entity_id: userEntity.id,
        total_amount: 0,
        currency: 'USD',
        status: 'completed',
        metadata: {
          user_entity_id: userEntity.id,
          previous_organization_id: user.user_metadata?.organization_id,
          target_organization_id,
          user_role: (membership.metadata as any)?.role,
          switch_timestamp: new Date().toISOString(),
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })

    if (auditError) {
      console.error('Failed to log organization switch:', auditError)
    }

    // Get user's role and permissions in the target organization
    const userRole = (membership.metadata as any)?.role || 'member'
    const userPermissions = (membership.metadata as any)?.permissions || ['basic_access']

    // Create enhanced user context for the new organization
    const newContext = {
      user_entity: {
        id: userEntity.id,
        email: user.email,
        entity_name: userEntity.entity_name,
        entity_type: 'user_profile',
        role: userRole,
        permissions: userPermissions
      },
      organization: {
        id: org.id,
        organization_name: org.organization_name,
        organization_type: org.organization_type,
        status: org.status
      },
      membership: {
        membership_id: membership.id,
        role: userRole,
        permissions: userPermissions,
        is_primary: (membership.metadata as any)?.is_primary || false
      },
      switched_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Organization context switched successfully',
      context: newContext,
      // Include refresh instructions for the client
      refresh_required: true
    })

  } catch (error) {
    console.error('Organization switch error:', error)
    return NextResponse.json(
      { error: 'Failed to switch organization context' }, 
      { status: 500 }
    )
  }
}