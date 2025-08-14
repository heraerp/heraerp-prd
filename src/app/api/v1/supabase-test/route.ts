import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * HERA-Supabase Integration Test API
 * Tests the complete auth and entity creation flow
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json({ 
        error: 'Failed to get session', 
        details: sessionError.message 
      }, { status: 401 })
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'No active session' 
      }, { status: 401 })
    }

    const userId = session.user.id

    // Test 1: Check if user entity exists
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_type,
        entity_name,
        entity_code,
        smart_code,
        organization_id,
        status
      `)
      .eq('id', userId)
      .eq('entity_type', 'user')
      .single()

    // Test 2: Get user organization
    let organization = null
    if (userEntity) {
      const { data: orgData, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', userEntity.organization_id)
        .single()
      
      if (!orgError) {
        organization = orgData
      }
    }

    // Test 3: Get user membership
    const { data: membership, error: memberError } = await supabase
      .from('core_memberships')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Test 4: Get user dynamic data
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userId)

    // Test 5: Get user context using function
    const { data: userContext, error: contextError } = await supabase
      .rpc('get_user_context')

    return NextResponse.json({
      success: true,
      message: 'HERA-Supabase integration test results',
      data: {
        user: {
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata
        },
        userEntity: userEntity || null,
        organization: organization || null,
        membership: membership || null,
        dynamicData: dynamicData || [],
        userContext: userContext || null,
        errors: {
          entityError: entityError?.message || null,
          memberError: memberError?.message || null,
          dynamicError: dynamicError?.message || null,
          contextError: contextError?.message || null
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Supabase test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'create_test_entity':
        // Create a test entity using HERA universal structure
        const { data: entity, error: createError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: data.organization_id,
            entity_type: data.entity_type || 'test_entity',
            entity_name: data.entity_name || 'Test Entity',
            entity_code: `TEST-${Date.now()}`,
            smart_code: data.smart_code || 'HERA.TEST.ENTITY.v1',
            description: data.description || 'Test entity created via API',
            status: 'active',
            created_by: session.user.id
          })
          .select()
          .single()

        if (createError) {
          return NextResponse.json({ 
            error: 'Failed to create entity', 
            details: createError.message 
          }, { status: 400 })
        }

        // Add dynamic data if provided
        if (data.dynamic_data) {
          const dynamicInserts = Object.entries(data.dynamic_data).map(([key, value]) => ({
            entity_id: entity.id,
            field_name: key,
            field_value_text: String(value),
            created_by: session.user.id
          }))

          await supabase
            .from('core_dynamic_data')
            .insert(dynamicInserts)
        }

        return NextResponse.json({
          success: true,
          message: 'Test entity created successfully',
          entity
        })

      case 'create_test_transaction':
        // Create a test transaction
        const { data: transaction, error: txnError } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: data.organization_id,
            transaction_type: data.transaction_type || 'test_transaction',
            transaction_number: `TXN-${Date.now()}`,
            reference_entity_id: data.reference_entity_id,
            total_amount: data.total_amount || 0,
            smart_code: data.smart_code || 'HERA.TEST.TXN.v1',
            description: data.description || 'Test transaction via API',
            status: 'completed',
            created_by: session.user.id
          })
          .select()
          .single()

        if (txnError) {
          return NextResponse.json({ 
            error: 'Failed to create transaction', 
            details: txnError.message 
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Test transaction created successfully',
          transaction
        })

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Supabase test POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}