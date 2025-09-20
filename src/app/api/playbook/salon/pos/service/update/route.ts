import { NextRequest, NextResponse } from 'next/server'
import { ServiceUpdateSchema } from '../../_schemas'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ServiceUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { orgId, smart_code, actor_user_id, service } = parsed.data
    const supabase = createClient()

    // Verify service exists and belongs to org
    const { data: existingEntity, error: fetchError } = await supabase
      .from('core_entities')
      .select('id, entity_name, status')
      .eq('id', service.id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'salon_service')
      .single()

    if (fetchError || !existingEntity) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Track what changed for audit
    const changes: Record<string, any> = {}

    // 1) Update entity if name or status changed
    if (service.entity_name || service.status) {
      const entityUpdate: any = {}
      if (service.entity_name) {
        entityUpdate.entity_name = service.entity_name
        changes.entity_name = { from: existingEntity.entity_name, to: service.entity_name }
      }
      if (service.status) {
        entityUpdate.status = service.status
        changes.status = { from: existingEntity.status, to: service.status }
      }

      const { error: updateError } = await supabase
        .from('core_entities')
        .update(entityUpdate)
        .eq('id', service.id)
        .eq('organization_id', orgId)

      if (updateError) {
        console.error('Failed to update service entity:', updateError)
        return NextResponse.json(
          { error: 'Failed to update service', details: updateError.message },
          { status: 500 }
        )
      }
    }

    // 2) Update dynamic fields
    const fieldsToUpdate = [
      { field: 'price', value: service.price, type: 'number' },
      { field: 'duration', value: service.duration, type: 'number' },
      { field: 'tax_code', value: service.tax_code, type: 'text' },
      { field: 'category', value: service.category, type: 'text' },
      { field: 'description', value: service.description, type: 'text' }
    ].filter(f => f.value !== undefined)

    for (const field of fieldsToUpdate) {
      const fieldData: any = {
        organization_id: orgId,
        entity_id: service.id,
        field_name: field.field,
        field_type: field.type,
        smart_code: `${smart_code}.FIELD.${field.field.toUpperCase()}`
      }

      if (field.type === 'number') {
        fieldData.field_value_number = field.value
        fieldData.field_value_text = null
      } else {
        fieldData.field_value_text = field.value
        fieldData.field_value_number = null
      }

      // Upsert the field
      const { error: upsertError } = await supabase.from('core_dynamic_data').upsert(fieldData, {
        onConflict: 'organization_id,entity_id,field_name'
      })

      if (upsertError) {
        console.error(`Failed to update field ${field.field}:`, upsertError)
      } else {
        changes[field.field] = field.value
      }
    }

    // 3) Create audit transaction
    if (actor_user_id && Object.keys(changes).length > 0) {
      await supabase.from('universal_transactions').insert({
        organization_id: orgId,
        transaction_type: 'CATALOG_EVENT',
        smart_code,
        source_entity_id: actor_user_id,
        target_entity_id: service.id,
        total_amount: 0,
        transaction_status: 'completed',
        business_context: {
          action: 'update',
          entity_type: 'salon_service',
          changes
        }
      })
    }

    // 4) Fetch and return updated service
    const { data: dynamicData } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_number')
      .eq('organization_id', orgId)
      .eq('entity_id', service.id)
      .in('field_name', ['price', 'duration', 'tax_code', 'category', 'description'])

    const dynamicFields =
      dynamicData?.reduce(
        (acc, row) => {
          if (row.field_name === 'price' || row.field_name === 'duration') {
            acc[row.field_name] = row.field_value_number
          } else {
            acc[row.field_name] = row.field_value_text
          }
          return acc
        },
        {} as Record<string, any>
      ) || {}

    return NextResponse.json({
      id: service.id,
      entity_name: service.entity_name || existingEntity.entity_name,
      entity_type: 'salon_service',
      status: service.status || existingEntity.status,
      ...dynamicFields
    })
  } catch (error) {
    console.error('Unexpected error in service update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
