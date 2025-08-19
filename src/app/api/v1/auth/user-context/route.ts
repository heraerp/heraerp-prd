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
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_code', `USER-${user.email}`)
      .single()

    if (entityError || !userEntities) {
      return NextResponse.json({ 
        error: 'User profile not found',
        details: entityError?.message 
      }, { status: 404 })
    }

    // Get organization from user metadata
    const organizationId = userEntities.metadata?.organization_id || 
                          user.user_metadata?.organization_id ||
                          process.env.DEFAULT_ORGANIZATION_ID

    const organizationName = userEntities.metadata?.organization_name || 
                            'Default Organization'

    // Get dynamic fields
    const { data: dynamicFields } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', userEntities.id)

    // Build user context
    const userContext = {
      user: {
        id: userEntities.id,
        email: user.email,
        name: userEntities.entity_name,
        supabase_id: user.id,
        role: dynamicFields?.find(f => f.field_name === 'role')?.field_value_text || 'user',
        department: dynamicFields?.find(f => f.field_name === 'department')?.field_value_text,
        phone: dynamicFields?.find(f => f.field_name === 'phone')?.field_value_text
      },
      organization: {
        id: organizationId,
        name: organizationName
      },
      permissions: ['entities:read', 'entities:write', 'transactions:read', 'transactions:write']
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