import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CaseListItem, CaseListResponse } from '@/types/cases'

export async function GET(request: NextRequest) {
  try {
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id')

    if (!orgId) {
      return NextResponse.json({ error: 'X-Organization-Id header required' }, { status: 400 })
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q')
    const statusParams = searchParams.getAll('status')
    const priorityParams = searchParams.getAll('priority')
    const ragParams = searchParams.getAll('rag')
    const owner = searchParams.get('owner')
    const programId = searchParams.get('programId')
    const due_from = searchParams.get('due_from')
    const due_to = searchParams.get('due_to')
    const tags = searchParams.getAll('tags')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build query
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner (
          field_name,
          field_value_text,
          field_value_number,
          field_value_boolean,
          field_value_json,
          field_value_date
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'case')
      .order('created_at', { ascending: false })

    // Apply filters
    if (q) {
      query = query.or(`entity_name.ilike.%${q}%,entity_code.ilike.%${q}%`)
    }

    // Apply status filters
    if (statusParams.length > 0) {
      // Status is stored in core_dynamic_data
      const { data: statusEntities } = await supabase
        .from('core_dynamic_data')
        .select('entity_id')
        .eq('organization_id', orgId)
        .eq('field_name', 'status')
        .in('field_value_text', statusParams)

      if (statusEntities && statusEntities.length > 0) {
        const statusEntityIds = statusEntities.map(e => e.entity_id)
        query = query.in('id', statusEntityIds)
      }
    }

    // Execute query with pagination
    const offset = (page - 1) * pageSize
    const { data: cases, error, count } = await query.range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Cases query error:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    // Transform cases to match expected format
    const transformedCases: CaseListItem[] = (cases || []).map(entity => {
      // Extract dynamic fields
      const dynamicData = entity.core_dynamic_data || []
      const getDynamicField = (fieldName: string) => {
        const field = dynamicData.find((d: any) => d.field_name === fieldName)
        return (
          field?.field_value_text ||
          field?.field_value_number ||
          field?.field_value_boolean ||
          field?.field_value_date ||
          field?.field_value_json ||
          null
        )
      }

      return {
        id: entity.id,
        entity_code: entity.entity_code || '',
        entity_name: entity.entity_name || '',
        smart_code: entity.smart_code || '',
        status: (getDynamicField('status') as any) || 'new',
        priority: (getDynamicField('priority') as any) || 'medium',
        rag: (getDynamicField('rag') as any) || 'G',
        due_date: getDynamicField('due_date') as string | null,
        owner: getDynamicField('owner') as string | null,
        tags: (getDynamicField('tags') as string[]) || [],
        program_id: getDynamicField('program_id') as string | null,
        program_name: getDynamicField('program_name') as string | null,
        subject_id: getDynamicField('subject_id') as string | null,
        subject_name: getDynamicField('subject_name') as string | null,
        subject_type: (getDynamicField('subject_type') as any) || null,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
        last_action_at: getDynamicField('last_action_at') as string | null,
        last_action_type: getDynamicField('last_action_type') as string | null
      }
    })

    const response: CaseListResponse = {
      items: transformedCases,
      total: count || 0,
      page,
      pageSize
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Cases API error:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id')

    if (!orgId) {
      return NextResponse.json({ error: 'X-Organization-Id header required' }, { status: 400 })
    }

    const body = await request.json()

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Generate case number
    const caseNumber = `CASE-${Date.now()}`

    // Create case entity
    const { data: newCase, error: caseError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'case',
        entity_code: caseNumber,
        entity_name: body.entity_name,
        smart_code: 'HERA.PUBLICSECTOR.CRM.CASE.STANDARD.V1',
        status: 'active',
        created_by: null, // Would come from auth
        updated_by: null
      })
      .select()
      .single()

    if (caseError) {
      console.error('Create case error:', caseError)
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
    }

    // Insert dynamic fields
    const dynamicFields = [
      { field_name: 'status', field_value_text: 'new' },
      { field_name: 'priority', field_value_text: body.priority },
      { field_name: 'rag', field_value_text: body.rag },
      { field_name: 'due_date', field_value_date: body.due_date },
      { field_name: 'owner', field_value_text: body.owner },
      { field_name: 'description', field_value_text: body.description || null },
      { field_name: 'tags', field_value_json: body.tags || [] },
      { field_name: 'program_id', field_value_text: body.program_id || null },
      { field_name: 'subject_id', field_value_text: body.subject_id || null }
    ].filter(
      field =>
        field.field_value_text !== undefined ||
        field.field_value_date !== undefined ||
        field.field_value_json !== undefined
    )

    if (dynamicFields.length > 0) {
      const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(
        dynamicFields.map(field => ({
          organization_id: orgId,
          entity_id: newCase.id,
          smart_code: `HERA.PUBLICSECTOR.CRM.CASE.${field.field_name.toUpperCase()}.V1`,
          ...field
        }))
      )

      if (dynamicError) {
        console.error('Dynamic data error:', dynamicError)
        // Continue anyway
      }
    }

    // Create initial transaction for audit trail
    const { error: txnError } = await supabase.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'case_created',
      transaction_code: `TXN-${caseNumber}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.PUBLICSECTOR.CRM.CASE.CREATED.V1',
      total_amount: 0,
      currency_code: 'USD',
      reference_entity_id: newCase.id,
      metadata: {
        case_id: newCase.id,
        case_number: caseNumber,
        created_by: body.owner,
        initial_status: 'new'
      },
      status: 'completed',
      created_by: null,
      updated_by: null
    })

    if (txnError) {
      console.error('Transaction error:', txnError)
      // Continue anyway
    }

    return NextResponse.json(
      {
        success: true,
        case_id: newCase.id,
        case_number: caseNumber
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create case API error:', error)
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }
}
