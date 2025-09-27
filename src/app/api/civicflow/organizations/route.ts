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
    const type = searchParams.get('type')
    const stage = searchParams.get('stage')
    const limit = searchParams.get('limit') || '100'

    // Build query using Supabase directly
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(field_name, field_value_text, field_value_json)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'organization')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit))

    if (search) {
      query = query.ilike('entity_name', `%${search}%`)
    }

    const { data: organizations, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Transform to include dynamic data
    let transformedOrganizations = (organizations || []).map((organization: any) => {
      const dynamicData = organization.core_dynamic_data || []
      const email = dynamicData.find((d: any) => d.field_name === 'email')?.field_value_text
      const tags = dynamicData.find((d: any) => d.field_name === 'tags')?.field_value_json || []

      return {
        id: organization.id,
        entity_name: organization.entity_name,
        email,
        tags,
        metadata: organization.metadata || {}
      }
    })

    // Apply client-side filtering for type and stage
    if (type) {
      transformedOrganizations = transformedOrganizations.filter(
        (org: any) => org.metadata?.type === type
      )
    }

    if (stage) {
      transformedOrganizations = transformedOrganizations.filter(
        (org: any) => org.metadata?.engagement_stage === stage
      )
    }

    return NextResponse.json({
      items: transformedOrganizations,
      total: transformedOrganizations.length
    })
  } catch (error) {
    console.error('Error fetching organizations:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
