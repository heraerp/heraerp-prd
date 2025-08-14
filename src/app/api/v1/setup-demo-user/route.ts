import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
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
    const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Check if this is a demo user
    const demoUsers = {
      'mario@restaurant.com': {
        entity_id: 'user_mario_rossi',
        organization_id: 'org_marios_bistro',
        entity_name: 'Mario Rossi',
        entity_code: 'USR_MARIO',
        email: 'mario@restaurant.com',
        role: 'owner',
        permissions: ['all']
      },
      'advisor@wellington.com': {
        entity_id: 'user_advisor_wellington',
        organization_id: 'org_wellington_wealth',
        entity_name: 'Sarah Wellington',
        entity_code: 'USR_ADVISOR',
        email: 'advisor@wellington.com',
        role: 'advisor',
        permissions: ['clients', 'portfolios', 'reports', 'compliance', 'admin']
      },
      'cpa@sterling.com': {
        entity_id: 'user_cpa_sterling',
        organization_id: 'org_sterling_cpa',
        entity_name: 'Michael Sterling CPA',
        entity_code: 'USR_CPA',
        email: 'cpa@sterling.com',
        role: 'partner',
        permissions: ['clients', 'tax_prep', 'audits', 'payroll', 'compliance', 'admin']
      }
    }

    const demoUserConfig = demoUsers[user.email as keyof typeof demoUsers]
    if (!demoUserConfig) {
      return NextResponse.json(
        { success: false, message: 'This endpoint is only for demo user setup' },
        { status: 403 }
      )
    }

    // Check if user entity already exists
    const { data: existingEntity } = await getSupabaseAdmin()
      .from('core_entities')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('entity_type', 'user_profile')
      .single()

    if (existingEntity) {
      return NextResponse.json({
        success: true,
        message: 'User profile already exists',
        entity_id: existingEntity.id
      })
    }

    // Check if demo entity exists without auth_user_id
    const { data: demoEntity } = await getSupabaseAdmin()
      .from('core_entities')
      .select('id')
      .eq('id', demoUserConfig.entity_id)
      .eq('entity_type', 'user_profile')
      .single()

    if (demoEntity) {
      // Link the existing demo entity to the auth user
      const { error: updateError } = await getSupabaseAdmin()
        .from('core_entities')
        .update({ auth_user_id: user.id })
        .eq('id', demoUserConfig.entity_id)

      if (updateError) {
        console.error('Error linking demo user:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to link demo user' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Demo user linked successfully',
        entity_id: demoUserConfig.entity_id
      })
    }

    // Create new user entity if none exists
    const { data: newEntity, error: createError } = await getSupabaseAdmin()
      .from('core_entities')
      .insert({
        id: demoUserConfig.entity_id,
        organization_id: demoUserConfig.organization_id,
        entity_type: 'user_profile',
        entity_name: demoUserConfig.entity_name,
        entity_code: demoUserConfig.entity_code,
        status: 'active',
        auth_user_id: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating user entity:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // Add user properties
    const properties = [
      { entity_id: demoUserConfig.entity_id, field_name: 'email', field_value: demoUserConfig.email, field_type: 'text' },
      { entity_id: demoUserConfig.entity_id, field_name: 'role', field_value: demoUserConfig.role, field_type: 'text' },
      { entity_id: demoUserConfig.entity_id, field_name: 'permissions', field_value: JSON.stringify(demoUserConfig.permissions), field_type: 'json' }
    ]

    await getSupabaseAdmin()
      .from('core_dynamic_data')
      .insert(properties)

    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      entity_id: newEntity.id
    })

  } catch (error) {
    console.error('Setup demo user error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}