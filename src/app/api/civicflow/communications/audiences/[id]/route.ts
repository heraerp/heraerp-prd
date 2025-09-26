import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Audience } from '@/types/communications'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params

    // Get audience entity
    const { data: entity, error } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_audience')
      .single()

    if (error) {
      throw error
    }

    if (!entity) {
      return NextResponse.json({ error: 'Audience not found' }, { status: 404 })
    }

    // Transform to Audience type
    const dynamicFields =
      entity.core_dynamic_data?.reduce((acc: any, field: any) => {
        acc[field.field_name] =
          field.field_value_text || field.field_value_number || field.field_value_json
        return acc
      }, {}) || {}

    const audience: Audience = {
      id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      definition: dynamicFields.definition || {},
      size_estimate: dynamicFields.size_estimate || 0,
      consent_policy: dynamicFields.consent_policy || 'opt_in',
      tags: dynamicFields.tags || [],
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }

    return NextResponse.json(audience)
  } catch (error) {
    console.error('Error fetching audience:', error)
    return NextResponse.json({ error: 'Failed to fetch audience' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params

    // Soft delete the audience
    const { error } = await supabase
      .from('core_entities')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_audience')

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting audience:', error)
    return NextResponse.json({ error: 'Failed to delete audience' }, { status: 500 })
  }
}
