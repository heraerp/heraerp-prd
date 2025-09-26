import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner(field_name, field_value_text, field_value_json)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'organization')

    if (search) {
      query = query.ilike('entity_name', `%${search}%`)
    }

    query = query.limit(100)

    const { data: organizations, count, error } = await query

    if (error) {
      throw error
    }

    // Transform to include dynamic data
    const transformedOrganizations = (organizations || []).map(organization => {
      const dynamicData = organization.core_dynamic_data || []
      const email = dynamicData.find((d: any) => d.field_name === 'email')?.field_value_text
      const tags = dynamicData.find((d: any) => d.field_name === 'tags')?.field_value_json || []

      return {
        id: organization.id,
        entity_name: organization.entity_name,
        email,
        tags
      }
    })

    return NextResponse.json({
      items: transformedOrganizations,
      total: count || 0
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
