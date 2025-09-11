import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get auth token from headers
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('core_relationships')
      .select('*')
      .match({
        relationship_type: 'member_of',
        to_entity_id: id
      })
      .eq('from_entity_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get organization entity for additional metadata
    const { data: orgEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', id)
      .eq('entity_type', 'organization')
      .single()

    // Get installed apps
    const { data: apps } = await supabase
      .from('core_relationships')
      .select(`
        *,
        app:to_entity_id(
          entity_name,
          entity_code,
          metadata
        )
      `)
      .eq('from_entity_id', id)
      .eq('relationship_type', 'has_installed')

    return NextResponse.json({
      organization: {
        ...org,
        subdomain: orgEntity?.metadata?.subdomain,
        settings: orgEntity?.metadata?.settings
      },
      membership: {
        role: (membership.metadata as any)?.role,
        permissions: (membership.metadata as any)?.permissions,
        joined_at: (membership.metadata as any)?.joined_at
      },
      installed_apps: apps?.map(app => ({
        id: app.to_entity_id,
        name: app.app?.entity_name,
        code: app.app?.entity_code,
        status: (app.metadata as any)?.status,
        installed_at: (app.metadata as any)?.installed_at,
        config: (app.metadata as any)?.config
      })) || []
    })

  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get auth token from headers
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user has admin/owner access to this organization
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('metadata')
      .match({
        relationship_type: 'member_of',
        to_entity_id: id
      })
      .eq('from_entity_id', user.id)
      .single()

    const userRole = membership?.metadata?.role
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const updates: any = {}

    // Update organization table
    if (body.organization_name) updates.organization_name = body.organization_name
    if (body.organization_type) updates.organization_type = body.organization_type
    if (body.subscription_plan) updates.subscription_plan = body.subscription_plan

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      
      const { error: updateError } = await supabase
        .from('core_organizations')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        throw updateError
      }
    }

    // Update entity metadata if settings provided
    if (body.settings) {
      const { data: entity } = await supabase
        .from('core_entities')
        .select('metadata')
        .eq('id', id)
        .single()

      const updatedMetadata = {
        ...entity?.metadata,
        settings: {
          ...entity?.metadata?.settings,
          ...body.settings
        }
      }

      const { error: entityError } = await supabase
        .from('core_entities')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (entityError) {
        throw entityError
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully'
    })

  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}