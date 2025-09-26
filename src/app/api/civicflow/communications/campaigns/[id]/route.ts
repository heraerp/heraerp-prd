import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Campaign } from '@/types/communications'

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

    // Get campaign entity
    const { data: entity, error } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_campaign')
      .single()

    if (error) {
      throw error
    }

    if (!entity) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Transform to Campaign type
    const dynamicFields =
      entity.core_dynamic_data?.reduce((acc: any, field: any) => {
        acc[field.field_name] =
          field.field_value_text || field.field_value_number || field.field_value_json
        return acc
      }, {}) || {}

    const campaign: Campaign = {
      id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      channel: dynamicFields.channel || 'email',
      template_id: dynamicFields.template_id,
      template_name: dynamicFields.template_name,
      audience_id: dynamicFields.audience_id,
      audience_name: dynamicFields.audience_name,
      audience_size: dynamicFields.audience_size || 0,
      schedule_at: dynamicFields.schedule_at,
      throttle_per_min: dynamicFields.throttle_per_min,
      ab_variants: dynamicFields.ab_variants,
      utm: dynamicFields.utm,
      status: dynamicFields.status || entity.status || 'draft',
      metrics: dynamicFields.metrics || {
        sent: 0,
        delivered: 0,
        bounced: 0,
        failed: 0,
        opened: 0,
        clicked: 0
      },
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params
    const body = await request.json()

    // Update campaign status (e.g., cancel)
    if (body.action === 'cancel' && body.status === 'cancelled') {
      // Update entity status
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', orgId)

      if (updateError) {
        throw updateError
      }

      // Update status in dynamic data
      await supabase
        .from('core_dynamic_data')
        .update({ field_value_text: 'cancelled' })
        .eq('entity_id', id)
        .eq('field_name', 'status')

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const { id } = params

    // Soft delete the campaign
    const { error } = await supabase
      .from('core_entities')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'comm_campaign')

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
