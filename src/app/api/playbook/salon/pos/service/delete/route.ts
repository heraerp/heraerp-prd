import { NextRequest, NextResponse } from 'next/server'
import { ServiceDeleteSchema } from '../../_schemas'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ServiceDeleteSchema.safeParse(body)

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

    // Check if already archived
    if (existingEntity.status === 'archived') {
      return NextResponse.json({
        id: service.id,
        deleted: true,
        message: 'Service already archived'
      })
    }

    // Soft delete by setting status to archived
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({ status: 'archived' })
      .eq('id', service.id)
      .eq('organization_id', orgId)

    if (updateError) {
      console.error('Failed to archive service:', updateError)
      return NextResponse.json(
        { error: 'Failed to archive service', details: updateError.message },
        { status: 500 }
      )
    }

    // Create audit transaction
    if (actor_user_id) {
      await supabase.from('universal_transactions').insert({
        organization_id: orgId,
        transaction_type: 'CATALOG_EVENT',
        smart_code,
        source_entity_id: actor_user_id,
        target_entity_id: service.id,
        total_amount: 0,
        transaction_status: 'completed',
        business_context: {
          action: 'delete',
          entity_type: 'salon_service',
          entity_name: existingEntity.entity_name
        }
      })
    }

    return NextResponse.json({
      id: service.id,
      deleted: true
    })
  } catch (error) {
    console.error('Unexpected error in service deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
