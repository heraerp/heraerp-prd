import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Template } from '@/types/communications'

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

    // Get template entity
    const { data: entity, error } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_template')
      .single()

    if (error) {
      throw error
    }

    if (!entity) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Transform to Template type
    const dynamicFields =
      entity.core_dynamic_data?.reduce((acc: any, field: any) => {
        acc[field.field_name] =
          field.field_value_text ||
          field.field_value_number ||
          field.field_value_boolean ||
          field.field_value_json
        return acc
      }, {}) || {}

    const template: Template = {
      id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      channel: dynamicFields.channel || 'email',
      version: dynamicFields.version || 1,
      is_active: dynamicFields.is_active !== false,
      subject: dynamicFields.subject,
      body_text: dynamicFields.body_text,
      body_html: dynamicFields.body_html,
      variables: dynamicFields.variables || [],
      tags: dynamicFields.tags || [],
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params
    const body = await request.json()

    // Update is_active status
    if (typeof body.is_active === 'boolean') {
      await supabase.from('core_dynamic_data').upsert({
        entity_id: id,
        field_name: 'is_active',
        field_value_boolean: body.is_active,
        smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.TEMPLATE.ACTIVE.V1'
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params

    // Soft delete the template
    const { error } = await supabase
      .from('core_entities')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_template')

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}
