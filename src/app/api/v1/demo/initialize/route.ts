import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Demo user configuration following HERA Authorization DNA
const DEMO_USERS = {
  'salon-receptionist': {
    supabase_user_id: 'demo|salon-receptionist',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0', // Hair Talkz Salon
    redirect_path: '/salon/dashboard',
    session_duration: 30 * 60 * 1000, // 30 minutes
    role: 'HERA.SEC.ROLE.RECEPTIONIST.DEMO.V1',
    scopes: [
      'read:HERA.SALON.SERVICE.APPOINTMENT',
      'write:HERA.SALON.SERVICE.APPOINTMENT',
      'read:HERA.SALON.CRM.CUSTOMER',
      'write:HERA.SALON.CRM.CUSTOMER',
      'read:HERA.SALON.SERVICE.CATALOG',
      'read:HERA.SALON.INVENTORY.PRODUCT'
    ]
  }
} as const

type DemoUserType = keyof typeof DEMO_USERS

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { demoType } = await request.json()

    if (!demoType || !DEMO_USERS[demoType as DemoUserType]) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid demo type'
        },
        { status: 400 }
      )
    }

    const demoConfig = DEMO_USERS[demoType as DemoUserType]

    // Create Supabase client with service role for RLS bypass
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the demo user entity using Identity Bridge Pattern
    // Note: Use order by created_at desc and limit 1 to get the most recent demo user
    const { data: userEntities, error: userError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000') // Platform org
      .eq('entity_type', 'user')
      .eq('metadata->>supabase_user_id', demoConfig.supabase_user_id)
      .order('created_at', { ascending: false })
      .limit(1)

    const userEntity = userEntities?.[0]

    if (userError || !userEntity) {
      console.error('❌ Demo user entity not found:', {
        demoType,
        supabase_user_id: demoConfig.supabase_user_id,
        error: userError
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Demo user not found. Please run: node hera-auth-dna-generator.js generate salon'
        },
        { status: 404 }
      )
    }

    // Find the organization anchor and membership
    const { data: membership, error: membershipError } = await supabase
      .from('core_relationships')
      .select('*, to_entity:core_entities!core_relationships_to_entity_id_fkey(*)')
      .eq('from_entity_id', userEntity.id)
      .eq('organization_id', demoConfig.organization_id)
      .eq('relationship_type', 'membership')
      .eq('is_active', true)
      .single()

    if (membershipError || !membership) {
      console.error('❌ Demo membership not found:', {
        demoType,
        user_entity_id: userEntity.id,
        organization_id: demoConfig.organization_id,
        error: membershipError
      })
      return NextResponse.json(
        {
          success: false,
          error:
            'Demo membership not found. Please run: node hera-auth-dna-generator.js generate salon'
        },
        { status: 404 }
      )
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', demoConfig.organization_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        {
          success: false,
          error: 'Demo organization not found'
        },
        { status: 404 }
      )
    }

    // Check if membership is still valid (not expired)
    const now = new Date()
    const expiryTime = membership.expiration_date ? new Date(membership.expiration_date) : null

    if (expiryTime && expiryTime <= now) {
      // Extend the membership expiry for a new demo session
      console.log('⏰ Demo membership expired, extending for new session...')

      const newExpiryDate = new Date(Date.now() + demoConfig.session_duration)
      const { error: updateError } = await supabase
        .from('core_relationships')
        .update({
          expiration_date: newExpiryDate.toISOString()
        })
        .eq('id', membership.id)

      if (updateError) {
        console.error('❌ Failed to extend membership:', updateError)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to extend demo session'
          },
          { status: 500 }
        )
      }

      // Update the membership object with new expiry
      membership.expiration_date = newExpiryDate.toISOString()
      console.log('✅ Demo membership extended until:', newExpiryDate.toISOString())
    }

    // Create response with user and organization data
    const response = {
      success: true,
      user: {
        id: userEntity.id,
        entity_id: userEntity.id,
        organization_id: demoConfig.organization_id,
        role: demoConfig.role,
        scopes: demoConfig.scopes,
        expires_at: membership.expiration_date
      },
      organization: {
        id: organization.id,
        name: organization.organization_name,
        type: organization.organization_type
      },
      redirect_url: demoConfig.redirect_path
    }

    // Set session cookie for client-side access
    const sessionCookie = {
      user_id: userEntity.id,
      entity_id: userEntity.id,
      organization_id: demoConfig.organization_id,
      role: demoConfig.role,
      scopes: demoConfig.scopes,
      session_type: 'demo',
      expires_at: membership.expiration_date
    }

    const cookieResponse = NextResponse.json(response)

    // Set secure session cookie
    cookieResponse.cookies.set('hera-demo-session', JSON.stringify(sessionCookie), {
      httpOnly: false, // Allow client-side access for demo
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: demoConfig.session_duration / 1000, // Convert to seconds
      path: '/'
    })

    console.log('✅ Demo session created successfully:', {
      demoType,
      user_id: userEntity.id,
      organization_id: demoConfig.organization_id,
      expires_at: membership.expiration_date
    })

    return cookieResponse
  } catch (error) {
    console.error('💥 Demo initialization error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
