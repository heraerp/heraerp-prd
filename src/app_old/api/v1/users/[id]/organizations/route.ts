import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user entity based on supabase auth id
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .or(`metadata->'auth_user_id'.eq."${userId}"`)
      .eq('entity_type', 'user')
      .single()

    if (userError || !userEntity) {
      return NextResponse.json(
        {
          error: 'User not found',
          details: userError?.message
        },
        { status: 404 }
      )
    }

    // Get user's organizations through relationships
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select(
        `
        id,
        organization_id,
        relationship_data,
        is_active,
        core_organizations!inner(
          id,
          organization_name,
          organization_type,
          organization_code,
          status,
          settings
        )
      `
      )
      .eq('from_entity_id', userEntity.id)
      .eq('relationship_type', 'member_of')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (relError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch organizations',
          details: relError.message
        },
        { status: 500 }
      )
    }

    // Transform the data
    const organizations =
      relationships?.map(rel => ({
        id: rel.organization_id,
        name: rel.core_organizations.organization_name,
        type: rel.core_organizations.organization_type,
        role: rel.relationship_data?.role || 'member',
        permissions: rel.relationship_data?.permissions || [],
        is_primary: rel.relationship_data?.is_primary || false,
        status: rel.core_organizations.status,
        subscription_tier: rel.core_organizations.settings?.subscription_tier || 'free'
      })) || []

    return NextResponse.json({
      organizations,
      count: organizations.length
    })
  } catch (error) {
    console.error('Error fetching user organizations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
