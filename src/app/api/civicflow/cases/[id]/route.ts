import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CaseDetail } from '@/types/cases'
import { differenceInDays, parseISO } from 'date-fns'

const DEMO_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
    const caseId = params.id

    // Get organization ID from header
    const orgId =
      request.headers.get('X-Organization-Id') ||
      (request.nextUrl.pathname.startsWith('/civicflow') ? DEMO_ORG_ID : null)

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get case entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .select(
        `
        id,
        entity_code,
        entity_name,
        smart_code,
        created_at,
        updated_at
      `
      )
      .eq('id', caseId)
      .eq('organization_id', orgId)
      .eq('entity_type', 'case')
      .single()

    if (entityError || !entity) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get all dynamic fields
    const { data: dynamicFields, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_number, field_value_date')
      .eq('entity_id', caseId)

    if (dynamicError) throw dynamicError

    // Get relationships
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select(
        `
        to_entity_id,
        relationship_type,
        to_entity:core_entities!to_entity_id(
          id,
          entity_name,
          entity_type,
          entity_code
        )
      `
      )
      .eq('from_entity_id', caseId)
      .in('relationship_type', ['case_to_program', 'case_to_subject', 'case_to_agreement'])

    if (relError) throw relError

    // Get last action
    const { data: lastAction, error: actionError } = await supabase
      .from('universal_transactions')
      .select(
        `
        transaction_type,
        smart_code,
        created_at
      `
      )
      .eq('source_entity_id', caseId)
      .like('smart_code', 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Build field map
    const fieldMap =
      dynamicFields?.reduce(
        (acc, field) => {
          acc[field.field_name] =
            field.field_value_text || field.field_value_number || field.field_value_date || null
          return acc
        },
        {} as Record<string, any>
      ) || {}

    // Get relationship entities
    const program = relationships?.find(r => r.relationship_type === 'case_to_program')
    const subject = relationships?.find(r => r.relationship_type === 'case_to_subject')
    const agreement = relationships?.find(r => r.relationship_type === 'case_to_agreement')

    // Parse tags
    let tags: string[] = []
    try {
      if (fieldMap.tags) {
        tags = JSON.parse(fieldMap.tags)
      }
    } catch {}

    // Parse attachments
    let attachments: any[] = []
    try {
      if (fieldMap.attachments) {
        attachments = JSON.parse(fieldMap.attachments)
      }
    } catch {}

    // Calculate derived fields
    const now = new Date()
    const createdDate = parseISO(entity.created_at)
    const age_days = differenceInDays(now, createdDate)

    let is_overdue = false
    let time_to_due = null

    if (fieldMap.due_date) {
      const dueDate = parseISO(fieldMap.due_date)
      const daysUntilDue = differenceInDays(dueDate, now)

      if (daysUntilDue < 0) {
        is_overdue = true
        time_to_due = `overdue by ${Math.abs(daysUntilDue)} days`
      } else if (daysUntilDue === 0) {
        time_to_due = 'due today'
      } else {
        time_to_due = `${daysUntilDue} days`
      }
    }

    const caseDetail: CaseDetail = {
      id: entity.id,
      entity_code: entity.entity_code,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      status: fieldMap.status || 'new',
      priority: fieldMap.priority || 'medium',
      rag: fieldMap.rag || 'G',
      due_date: fieldMap.due_date,
      owner: fieldMap.owner,
      tags,
      program_id: program?.to_entity_id || null,
      program_name: program?.to_entity?.entity_name || null,
      subject_id: subject?.to_entity_id || null,
      subject_name: subject?.to_entity?.entity_name || null,
      subject_type: (subject?.to_entity?.entity_type as any) || null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      last_action_at: lastAction?.created_at || null,
      last_action_type: lastAction?.transaction_type || null,

      // Additional detail fields
      description: fieldMap.description,
      resolution_notes: fieldMap.resolution_notes,
      attachments,
      agreement_id: agreement?.to_entity_id || null,
      agreement_name: agreement?.to_entity?.entity_name || null,

      // Computed fields
      age_days,
      is_overdue,
      time_to_due
    }

    return NextResponse.json(caseDetail)
  } catch (error) {
    console.error('Case detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch case details' }, { status: 500 })
  }
}
