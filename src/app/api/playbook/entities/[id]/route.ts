import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

function getOrgFromRequest(req: NextRequest) {
  // Prefer what your auth layer resolved (cookie/claims). As a fallback, accept query param.
  const org =
    req.nextUrl.searchParams.get('organization_id') ||
    req.headers.get('x-hera-org') ||
    req.cookies.get('HERA_ORG_ID')?.value ||
    req.cookies.get('hera-organization-id')?.value ||
    null
  return org && /^[0-9a-f-]{36}$/i.test(org) ? org : null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: entityId } = await params
    const orgId = getOrgFromRequest(req)

    if (!orgId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    if (!entityId || !/^[0-9a-f-]{36}$/i.test(entityId)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    const body = await req.json()

    // Build update payload with proper field mapping
    const updatePayload: any = {}

    // Map common aliases
    if (body.name !== undefined) updatePayload.entity_name = body.name
    if (body.entity_name !== undefined) updatePayload.entity_name = body.entity_name
    if (body.code !== undefined) updatePayload.entity_code = body.code
    if (body.entity_code !== undefined) updatePayload.entity_code = body.entity_code
    if (body.status !== undefined) updatePayload.status = body.status
    if (body.metadata !== undefined) updatePayload.metadata = body.metadata
    if (body.tags !== undefined) updatePayload.tags = body.tags
    if (body.business_rules !== undefined) updatePayload.business_rules = body.business_rules

    // Check if we have either entity updates or dynamic data updates
    const hasDynamicUpdates =
      body.price !== undefined || body.duration_mins !== undefined || body.category !== undefined

    if (Object.keys(updatePayload).length === 0 && !hasDynamicUpdates) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Get the entity to determine its type
    const { data: existingEntity, error: fetchError } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .single()

    if (fetchError || !existingEntity) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    // Update entity if there are entity fields to update
    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await supabase
        .from('core_entities')
        .update(updatePayload)
        .eq('id', entityId)
        .eq('organization_id', orgId) // Critical: ensure org isolation
        .select('*')
        .single()

      if (error) {
        console.error('[Playbook Entities] Update error:', error)
        throw error
      }

      if (!data) {
        return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
      }

      console.log(`[Playbook Entities] Updated entity ${entityId} for org ${orgId}`)
    }

    // Update dynamic data fields if provided
    if (hasDynamicUpdates) {
      console.log(`[Playbook Entities] Updating dynamic data for entity ${entityId}`)

      // Price update
      if (body.price !== undefined) {
        const priceData = {
          organization_id: orgId,
          entity_id: entityId,
          field_name: 'service.base_price',
          field_type: 'json',
          field_value_json: {
            amount: body.price,
            currency_code: body.currency || 'AED',
            tax_inclusive: false
          },
          smart_code: 'HERA.SALON.SERVICE.CATALOG.PRICE.v1'
        }

        const { error: priceError } = await supabase.from('core_dynamic_data').upsert(priceData, {
          onConflict: 'organization_id,entity_id,field_name'
        })

        if (priceError) {
          console.error('[Playbook Entities] Price update error:', priceError)
        }
      }

      // Duration update
      if (body.duration_mins !== undefined) {
        const durationData = {
          organization_id: orgId,
          entity_id: entityId,
          field_name: 'service.duration_min',
          field_type: 'number',
          field_value_number: body.duration_mins,
          smart_code: 'HERA.SALON.SERVICE.CATALOG.DURATION.v1'
        }

        const { error: durationError } = await supabase
          .from('core_dynamic_data')
          .upsert(durationData, {
            onConflict: 'organization_id,entity_id,field_name'
          })

        if (durationError) {
          console.error('[Playbook Entities] Duration update error:', durationError)
        }
      }

      // Category update
      if (body.category !== undefined) {
        const categoryData = {
          organization_id: orgId,
          entity_id: entityId,
          field_name: 'service.category',
          field_type: 'text',
          field_value_text: body.category,
          smart_code: 'HERA.SALON.SERVICE.CATALOG.CATEGORY.v1'
        }

        const { error: categoryError } = await supabase
          .from('core_dynamic_data')
          .upsert(categoryData, {
            onConflict: 'organization_id,entity_id,field_name'
          })

        if (categoryError) {
          console.error('[Playbook Entities] Category update error:', categoryError)
        }
      }
    }

    // Fetch the updated entity and its dynamic data
    const { data: updatedEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .single()

    // Fetch dynamic data
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_number, field_value_json')
      .eq('entity_id', entityId)
      .eq('organization_id', orgId)
      .in('field_name', ['service.base_price', 'service.duration_min', 'service.category'])

    // Transform response to match playbook format
    const response = {
      id: updatedEntity.id,
      organization_id: updatedEntity.organization_id,
      type: updatedEntity.entity_type,
      name: updatedEntity.entity_name,
      code: updatedEntity.entity_code,
      description: updatedEntity.entity_description || '',
      status: updatedEntity.status,
      updated_at: updatedEntity.updated_at,
      metadata: updatedEntity.metadata,
      business_rules: updatedEntity.business_rules,
      tags: updatedEntity.tags
    }

    // Add dynamic data to response
    if (dynamicData) {
      dynamicData.forEach(field => {
        if (field.field_name === 'service.base_price' && field.field_value_json) {
          response.price = field.field_value_json.amount
          response.currency = field.field_value_json.currency_code
        } else if (field.field_name === 'service.duration_min') {
          response.duration_mins = field.field_value_number
        } else if (field.field_name === 'service.category') {
          response.category = field.field_value_text
        }
      })
    }

    return NextResponse.json(response, { status: 200 })
  } catch (e: any) {
    console.error('[Playbook Entities] Update error:', e)
    return NextResponse.json({ error: e?.message || 'update entity failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: entityId } = await params
    const orgId = getOrgFromRequest(req)

    if (!orgId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    if (!entityId || !/^[0-9a-f-]{36}$/i.test(entityId)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    // Soft delete by setting status to 'deleted'
    const { data, error } = await supabase
      .from('core_entities')
      .update({ status: 'deleted' })
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .select('id')
      .single()

    if (error) {
      console.error('[Playbook Entities] Delete error:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    console.log(`[Playbook Entities] Deleted entity ${entityId} for org ${orgId}`)

    return NextResponse.json({ success: true, id: entityId }, { status: 200 })
  } catch (e: any) {
    console.error('[Playbook Entities] Delete error:', e)
    return NextResponse.json({ error: e?.message || 'delete entity failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: entityId } = await params
    const orgId = getOrgFromRequest(req)

    if (!orgId) {
      return NextResponse.json({ error: 'organization_id required' }, { status: 400 })
    }

    if (!entityId || !/^[0-9a-f-]{36}$/i.test(entityId)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', entityId)
      .eq('organization_id', orgId)
      .single()

    if (error) {
      console.error('[Playbook Entities] Get error:', error)
      throw error
    }

    if (!data) {
      return NextResponse.json({ error: 'Entity not found or access denied' }, { status: 404 })
    }

    // Transform response to match playbook format
    const response = {
      id: data.id,
      organization_id: data.organization_id,
      type: data.entity_type,
      name: data.entity_name,
      code: data.entity_code,
      description: data.entity_description || '',
      status: data.status,
      updated_at: data.updated_at,
      metadata: data.metadata,
      business_rules: data.business_rules,
      tags: data.tags
    }

    return NextResponse.json(response, { status: 200 })
  } catch (e: any) {
    console.error('[Playbook Entities] Get error:', e)
    return NextResponse.json({ error: e?.message || 'get entity failed' }, { status: 500 })
  }
}
