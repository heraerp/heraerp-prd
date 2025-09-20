import { NextRequest, NextResponse } from 'next/server'
import { ServiceCreateSchema } from '../../_schemas'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ServiceCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { orgId, smart_code, actor_user_id, service } = parsed.data
    const supabase = createClient()

    // 1) Create entity in core_entities
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'salon_service',
        entity_name: service.entity_name,
        smart_code,
        status: 'active'
      })
      .select()
      .single()

    if (entityError) {
      console.error('Failed to create service entity:', entityError)
      return NextResponse.json(
        { error: 'Failed to create service', details: entityError.message },
        { status: 500 }
      )
    }

    // 2) Create dynamic data fields
    const dynamicFields = [
      { field_name: 'price', field_type: 'number', field_value_number: service.price },
      { field_name: 'duration', field_type: 'number', field_value_number: service.duration },
      { field_name: 'tax_code', field_type: 'text', field_value_text: service.tax_code }
    ]

    // Add optional fields
    if (service.category) {
      dynamicFields.push({
        field_name: 'category',
        field_type: 'text',
        field_value_text: service.category
      })
    }

    if (service.description) {
      dynamicFields.push({
        field_name: 'description',
        field_type: 'text',
        field_value_text: service.description
      })
    }

    const dynamicRows = dynamicFields.map(field => ({
      ...field,
      organization_id: orgId,
      entity_id: entity.id,
      smart_code: `${smart_code}.FIELD.${field.field_name.toUpperCase()}`
    }))

    const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(dynamicRows)

    if (dynamicError) {
      console.error('Failed to create dynamic fields:', dynamicError)
      // Note: We don't rollback the entity creation here for simplicity
      // In production, you'd want a transaction or cleanup logic
    }

    // 3) Create audit transaction
    if (actor_user_id) {
      await supabase.from('universal_transactions').insert({
        organization_id: orgId,
        transaction_type: 'CATALOG_EVENT',
        smart_code,
        source_entity_id: actor_user_id,
        target_entity_id: entity.id,
        total_amount: 0,
        transaction_status: 'completed',
        business_context: {
          action: 'create',
          entity_type: 'salon_service',
          entity_name: service.entity_name
        }
      })
    }

    // 4) Return the created service
    return NextResponse.json(
      {
        id: entity.id,
        entity_name: entity.entity_name,
        entity_type: 'salon_service',
        ...service,
        status: 'active',
        created_at: entity.created_at,
        updated_at: entity.updated_at
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in service creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
