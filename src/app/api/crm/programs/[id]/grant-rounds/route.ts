import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateGrantRoundRequest, GrantRoundLite } from '@/types/crm-programs'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const orgId = request.headers.get('X-Organization-Id')

  if (!orgId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
  }

  try {
    const body: CreateGrantRoundRequest = await request.json()

    // Validate program exists
    const { data: program, error: programError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', orgId)
      .eq('entity_type', 'program')
      .single()

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // Create grant round entity
    const { data: grantRound, error: roundError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'grant_round',
        entity_name: `${program.entity_name} - ${body.round_code}`,
        entity_code: body.round_code,
        smart_code: 'HERA.CRM.PROGRAMS.GRANT_ROUND.ACTIVE.v1',
        metadata: {
          program_id: params.id,
          window_open: body.window_open,
          window_close: body.window_close
        }
      })
      .select()
      .single()

    if (roundError || !grantRound) {
      throw new Error('Failed to create grant round')
    }

    // Create relationship to program
    await supabase.from('core_relationships').insert({
      organization_id: orgId,
      from_entity_id: grantRound.id,
      to_entity_id: params.id,
      relationship_type: 'belongs_to_program',
      smart_code: 'HERA.CRM.PROGRAMS.REL.ROUND_TO_PROGRAM.v1'
    })

    // Store dynamic data
    const dynamicFields = []

    if (body.window_open) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: grantRound.id,
        field_name: 'window_open',
        field_value_date: body.window_open,
        smart_code: 'HERA.CRM.PROGRAMS.DYN.WINDOW_OPEN.v1'
      })
    }

    if (body.window_close) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: grantRound.id,
        field_name: 'window_close',
        field_value_date: body.window_close,
        smart_code: 'HERA.CRM.PROGRAMS.DYN.WINDOW_CLOSE.v1'
      })
    }

    if (body.budget !== undefined) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: grantRound.id,
        field_name: 'budget',
        field_value_number: body.budget,
        smart_code: 'HERA.CRM.PROGRAMS.DYN.BUDGET.V1'
      })
    }

    if (body.kpis && Object.keys(body.kpis).length > 0) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: grantRound.id,
        field_name: 'kpis',
        field_value_json: body.kpis,
        smart_code: 'HERA.CRM.PROGRAMS.DYN.KPIS.V1'
      })
    }

    if (dynamicFields.length > 0) {
      await supabase.from('core_dynamic_data').insert(dynamicFields)
    }

    // Log transaction
    await supabase.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'grant_round_created',
      transaction_code: `TXN-GR-${Date.now()}`,
      smart_code: 'HERA.CRM.PROGRAMS.TXN.GRANT_ROUND_CREATED.v1',
      total_amount: body.budget || 0,
      metadata: {
        program_id: params.id,
        grant_round_id: grantRound.id,
        round_code: body.round_code
      }
    })

    const response: GrantRoundLite = {
      id: grantRound.id,
      round_code: body.round_code,
      window_open: body.window_open,
      window_close: body.window_close,
      budget: body.budget,
      kpis: body.kpis
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating grant round:', error)
    return NextResponse.json({ error: 'Failed to create grant round' }, { status: 500 })
  }
}
