import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Helper to get organization context
function getOrganizationId(request: NextRequest): string | null {
  return request.headers.get('X-Organization-Id')
}

// POST /api/v1/relationships - Create relationship
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const organizationId = getOrganizationId(request)
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization context required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { from_entity_id, to_entity_id, relationship_type, smart_code, note } = body

    // Create relationship
    const { data, error } = await supabaseAdmin
      .from('core_relationships')
      .insert({
        organization_id: organizationId,
        from_entity_id,
        to_entity_id,
        relationship_type,
        smart_code,
        metadata: note ? { note } : undefined,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Create relationship error:', error)
      return NextResponse.json(
        { error: 'Failed to create relationship' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Relationship API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}