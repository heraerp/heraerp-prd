import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body = await request.json()
    const { 
      supabase_user_id, 
      email, 
      full_name, 
      business_name, 
      business_type 
    } = body

    // Verify the JWT token
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user || user.id !== supabase_user_id) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Check if user already has a business
    const { data: existingEntity, error: checkError } = await supabaseAdmin
      .from('core_entities')
      .select('*, organization:core_organizations(*)')
      .eq('auth_user_id', supabase_user_id)
      .eq('entity_type', 'user_profile')
      .single()

    if (existingEntity && !checkError) {
      // User already has a business, return existing context
      const { data: dynamicData } = await supabaseAdmin
        .from('core_dynamic_data')
        .select('field_name, field_value')
        .eq('entity_id', existingEntity.id)
        .in('field_name', ['email', 'role'])

      const emailField = dynamicData?.find(d => d.field_name === 'email')
      const roleField = dynamicData?.find(d => d.field_name === 'role')

      return NextResponse.json({
        success: true,
        user_entity: {
          id: existingEntity.id,
          organization_id: existingEntity.organization_id,
          entity_type: existingEntity.entity_type,
          entity_name: existingEntity.entity_name,
          entity_code: existingEntity.entity_code,
          email: emailField?.field_value || email,
          role: roleField?.field_value || 'owner',
          status: existingEntity.status
        },
        organization: existingEntity.organization
      })
    }

    // Create new organization
    const { data: newOrg, error: orgError } = await supabaseAdmin
      .from('core_organizations')
      .insert({
        organization_name: business_name,
        organization_type: business_type,
        status: 'active',
        auth_provider: 'supabase',
        subscription_plan: 'starter',
        max_users: 5,
        metadata: {
          created_by: supabase_user_id,
          owner_email: email
        }
      })
      .select()
      .single()

    if (orgError || !newOrg) {
      console.error('Failed to create organization:', orgError)
      return NextResponse.json(
        { success: false, message: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Create user entity
    const entityCode = `USER-${email.substring(0, 3).toUpperCase()}-${Date.now()}`
    
    const { data: newEntity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: newOrg.id,
        entity_type: 'user_profile',
        entity_code: entityCode,
        entity_name: full_name,
        description: `User profile for ${full_name}`,
        status: 'active',
        auth_user_id: supabase_user_id,
        is_system_user: false,
        metadata: {
          email,
          role: 'owner',
          created_via: 'api'
        }
      })
      .select()
      .single()

    if (entityError || !newEntity) {
      console.error('Failed to create user entity:', entityError)
      // Should rollback organization creation here
      return NextResponse.json(
        { success: false, message: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Create dynamic data fields
    const dynamicDataInserts = [
      {
        organization_id: newOrg.id,
        entity_id: newEntity.id,
        field_name: 'email',
        field_type: 'text',
        field_value: email
      },
      {
        organization_id: newOrg.id,
        entity_id: newEntity.id,
        field_name: 'role',
        field_type: 'text',
        field_value: 'owner'
      },
      {
        organization_id: newOrg.id,
        entity_id: newEntity.id,
        field_name: 'auth_id',
        field_type: 'text',
        field_value: supabase_user_id
      }
    ]

    const { error: dynamicError } = await supabaseAdmin
      .from('core_dynamic_data')
      .insert(dynamicDataInserts)

    if (dynamicError) {
      console.error('Failed to create dynamic data:', dynamicError)
    }

    // Create user-organization relationship (FIXED: Use from/to instead of source/target)
    const { error: relError } = await supabaseAdmin
      .from('core_relationships')
      .insert({
        organization_id: newOrg.id,
        from_entity_id: newEntity.id,  // User entity
        to_entity_id: newOrg.id,       // Organization entity (as entity reference)
        relationship_type: 'member_of',
        relationship_strength: 1.0,
        is_active: true,
        metadata: {
          role: 'owner',
          is_primary: true,
          joined_at: new Date().toISOString(),
          permissions: ['full_access'],
          created_via: 'business_creation'
        }
      })

    if (relError) {
      console.error('Failed to create relationship:', relError)
    }

    // Track the registration in transactions
    const { error: transError } = await supabaseAdmin
      .from('universal_transactions')
      .insert({
        organization_id: newOrg.id,
        transaction_type: 'user_registration',
        transaction_number: `REG-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: newEntity.id,
        total_amount: 0,
        currency: 'USD',
        status: 'completed',
        metadata: {
          registration_type: 'business_owner',
          business_type,
          source: 'api'
        }
      })

    if (transError) {
      console.error('Failed to track registration:', transError)
    }

    // Return the complete context
    return NextResponse.json({
      success: true,
      user_entity: {
        id: newEntity.id,
        organization_id: newEntity.organization_id,
        entity_type: newEntity.entity_type,
        entity_name: newEntity.entity_name,
        entity_code: newEntity.entity_code,
        email,
        role: 'owner',
        status: newEntity.status
      },
      organization: {
        id: newOrg.id,
        organization_name: newOrg.organization_name,
        organization_type: newOrg.organization_type,
        status: newOrg.status,
        subscription_plan: newOrg.subscription_plan,
        max_users: newOrg.max_users
      }
    })

  } catch (error) {
    console.error('Create business error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}