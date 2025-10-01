import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || DEMO_ORG_ID
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q') || ''
    const status = searchParams.get('status')?.split(',') || []
    const tags = searchParams.get('tags')?.split(',') || []
    const sponsorOrgId = searchParams.get('sponsor_org_id') || ''
    const budgetMin = searchParams.get('budget_min')
    const budgetMax = searchParams.get('budget_max')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    // Base query for programs
    let query = supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_name,
        entity_code,
        smart_code,
        created_at,
        core_dynamic_data (
          field_code,
          field_value_text,
          field_value_number,
          field_value_json
        ),
        core_relationships!from_entity_id (
          to_entity_id,
          relationship_type,
          smart_code
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'program')

    // Apply search filter
    if (q) {
      query = query.or(`entity_name.ilike.%${q}%,entity_code.ilike.%${q}%`)
    }

    // Get the data with pagination
    const {
      data: programs,
      count,
      error
    } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    // Transform the data
    const transformedPrograms = await Promise.all(
      (programs || []).map(async program => {
        // Parse dynamic data
        const dynamicData = (program.core_dynamic_data as any[]) || []
        const programData: any = {
          id: program.id,
          code: '',
          title: '',
          status: 'active',
          tags: [],
          budget: null,
          sponsor_org_name: null,
          sponsor_org_id: null,
          rounds_count: 0,
          next_window: null,
          smart_code: program.smart_code,
          created_at: program.created_at
        }

        // Extract program data from dynamic fields
        dynamicData.forEach(field => {
          switch (field.field_code) {
            case 'HERA.PUBLICSECTOR.CRM.PROGRAM.CODE.V1':
              programData.code = field.field_value_text
              break
            case 'HERA.PUBLICSECTOR.CRM.PROGRAM.TITLE.V1':
              programData.title = field.field_value_text
              break
            case 'HERA.PUBLICSECTOR.CRM.PROGRAM.STATUS.V1':
              programData.status = field.field_value_text
              break
            case 'HERA.PUBLICSECTOR.CRM.PROGRAM.TAGS.V1':
              programData.tags = field.field_value_json || []
              break
            case 'HERA.PUBLICSECTOR.CRM.PROGRAM.BUDGET.V1':
              programData.budget = field.field_value_number
              break
            case 'HERA.PUBLICSECTOR.CRM.PROGRAM.SPONSOR_ORG_ID.v1':
              programData.sponsor_org_id = field.field_value_text
              break
          }
        })

        // Get grant rounds count and next window
        const relationships = (program.core_relationships as any[]) || []
        const grantRoundIds = relationships
          .filter(rel => rel.smart_code === 'HERA.PUBLICSECTOR.CRM.PROGRAM.HAS_GRANT_ROUND')
          .map(rel => rel.to_entity_id)

        programData.rounds_count = grantRoundIds.length

        // Get sponsor org name if we have an ID
        if (programData.sponsor_org_id) {
          const { data: sponsorOrg } = await supabase
            .from('core_entities')
            .select('entity_name')
            .eq('id', programData.sponsor_org_id)
            .single()

          if (sponsorOrg) {
            programData.sponsor_org_name = sponsorOrg.entity_name
          }
        }

        // Get next window from grant rounds
        if (grantRoundIds.length > 0) {
          const now = new Date().toISOString()
          const { data: roundWindows } = await supabase
            .from('core_dynamic_data')
            .select('entity_id, field_code, field_value_text')
            .in('entity_id', grantRoundIds)
            .in('field_code', [
              'HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_OPEN.v1',
              'HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_CLOSE.v1'
            ])

          // Find the next upcoming window
          const windows = new Map<string, { open?: string; close?: string }>()
          roundWindows?.forEach(field => {
            if (!windows.has(field.entity_id)) {
              windows.set(field.entity_id, {})
            }
            const window = windows.get(field.entity_id)!
            if (field.field_code === 'HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_OPEN.v1') {
              window.open = field.field_value_text
            } else {
              window.close = field.field_value_text
            }
          })

          let nextWindow = null
          windows.forEach(window => {
            if (window.open && window.close && window.open > now) {
              if (!nextWindow || window.open < nextWindow.open) {
                nextWindow = window
              }
            }
          })

          programData.next_window = nextWindow
        }

        return programData
      })
    )

    // Apply post-transform filters
    let filteredPrograms = transformedPrograms

    if (status.length > 0) {
      filteredPrograms = filteredPrograms.filter(p => status.includes(p.status))
    }

    if (tags.length > 0) {
      filteredPrograms = filteredPrograms.filter(p => tags.some(tag => p.tags.includes(tag)))
    }

    if (sponsorOrgId) {
      filteredPrograms = filteredPrograms.filter(p => p.sponsor_org_id === sponsorOrgId)
    }

    if (budgetMin) {
      filteredPrograms = filteredPrograms.filter(p => p.budget >= parseFloat(budgetMin))
    }

    if (budgetMax) {
      filteredPrograms = filteredPrograms.filter(p => p.budget <= parseFloat(budgetMax))
    }

    return NextResponse.json({
      items: filteredPrograms,
      total: count || 0,
      page,
      page_size: pageSize,
      total_pages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || DEMO_ORG_ID
    const data = await request.json()

    // Create program entity
    const { data: program, error: programError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'program',
        entity_name: `${data.code} – ${data.title}`,
        entity_code: data.code,
        smart_code: 'HERA.PUBLICSECTOR.CRM.ENTITY.PROGRAM.V1'
      })
      .select()
      .single()

    if (programError) throw programError

    // Create dynamic data fields
    const dynamicFields = []

    if (data.code) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.CODE.V1',
        field_value_text: data.code,
        field_type: 'text'
      })
    }

    if (data.title) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.TITLE.V1',
        field_value_text: data.title,
        field_type: 'text'
      })
    }

    if (data.description) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.DESCRIPTION.V1',
        field_value_text: data.description,
        field_type: 'text'
      })
    }

    if (data.status) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.STATUS.V1',
        field_value_text: data.status,
        field_type: 'text'
      })
    }

    if (data.budget !== undefined && data.budget !== null) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.BUDGET.V1',
        field_value_number: data.budget,
        field_type: 'number'
      })
    }

    if (data.tags && data.tags.length > 0) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.TAGS.V1',
        field_value_json: data.tags,
        field_type: 'json'
      })
    }

    if (data.sponsor_org_id) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.SPONSOR_ORG_ID.v1',
        field_value_text: data.sponsor_org_id,
        field_type: 'text'
      })
    }

    if (data.eligibility_rules) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: program.id,
        field_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.ELIGIBILITY_RULES.v1',
        field_value_json: data.eligibility_rules,
        field_type: 'json'
      })
    }

    // Insert dynamic fields
    if (dynamicFields.length > 0) {
      const { error: dynamicError } = await supabase.from('core_dynamic_data').insert(dynamicFields)

      if (dynamicError) throw dynamicError
    }

    // Log transaction
    await supabase.from('universal_transactions').insert({
      organization_id: orgId,
      transaction_type: 'program_created',
      smart_code: 'HERA.PUBLICSECTOR.CRM.PROGRAM.CREATED.V1',
      reference_entity_id: program.id,
      metadata: {
        program_code: data.code,
        program_title: data.title,
        created_by: request.headers.get('X-User-Id') || 'system'
      }
    })

    return NextResponse.json({
      id: program.id,
      ...data,
      smart_code: program.smart_code,
      created_at: program.created_at
    })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json({ error: 'Failed to create program' }, { status: 500 })
  }
}
