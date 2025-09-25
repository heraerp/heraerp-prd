import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { CaseKpis } from '@/types/cases'
import { startOfWeek, endOfWeek, isWithinInterval, differenceInDays, parseISO } from 'date-fns'

const DEMO_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944'

export async function GET(request: NextRequest) {
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

    // Get organization ID from header
    const orgId =
      request.headers.get('X-Organization-Id') ||
      (request.nextUrl.pathname.startsWith('/civicflow') ? DEMO_ORG_ID : null)

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get all case entities
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, created_at')
      .eq('organization_id', orgId)
      .eq('entity_type', 'case')

    if (entitiesError) throw entitiesError

    if (!entities || entities.length === 0) {
      return NextResponse.json({
        open: 0,
        due_this_week: 0,
        breaches: 0,
        total: 0,
        avg_resolution_days: 0,
        on_time_pct: 0
      })
    }

    const caseIds = entities.map(e => e.id)

    // Get dynamic fields for status, rag, due_date
    const { data: dynamicFields, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_value_date')
      .in('entity_id', caseIds)
      .in('field_name', ['status', 'rag', 'due_date'])

    if (dynamicError) throw dynamicError

    // Get close actions to calculate resolution times
    const { data: closeActions, error: closeError } = await supabase
      .from('universal_transactions')
      .select('source_entity_id, created_at')
      .in('source_entity_id', caseIds)
      .eq('smart_code', 'HERA.PUBLICSECTOR.CRM.CASE.ACTION.CLOSE.V1')

    if (closeError) throw closeError

    // Build case data map
    const caseDataMap = new Map()
    entities.forEach(entity => {
      caseDataMap.set(entity.id, {
        id: entity.id,
        created_at: entity.created_at,
        status: 'new',
        rag: 'G',
        due_date: null,
        closed_at: null
      })
    })

    // Apply dynamic fields
    dynamicFields?.forEach(field => {
      const caseData = caseDataMap.get(field.entity_id)
      if (caseData) {
        if (field.field_name === 'status') {
          caseData.status = field.field_value_text || 'new'
        } else if (field.field_name === 'rag') {
          caseData.rag = field.field_value_text || 'G'
        } else if (field.field_name === 'due_date') {
          caseData.due_date = field.field_value_date
        }
      }
    })

    // Apply close dates
    closeActions?.forEach(action => {
      const caseData = caseDataMap.get(action.source_entity_id)
      if (caseData) {
        caseData.closed_at = action.created_at
      }
    })

    // Calculate KPIs
    const now = new Date()
    const weekStart = startOfWeek(now)
    const weekEnd = endOfWeek(now)

    let open = 0
    let due_this_week = 0
    let breaches = 0
    let total = entities.length
    let total_resolution_days = 0
    let resolved_count = 0
    let on_time_closed = 0
    let total_closed = 0

    for (const [_, caseData] of caseDataMap) {
      // Count open cases
      if (['new', 'in_review', 'active', 'on_hold'].includes(caseData.status)) {
        open++
      }

      // Count breaches (RAG = R)
      if (caseData.rag === 'R') {
        breaches++
      }

      // Count due this week
      if (caseData.due_date) {
        const dueDate = parseISO(caseData.due_date)
        if (isWithinInterval(dueDate, { start: weekStart, end: weekEnd })) {
          due_this_week++
        }
      }

      // Calculate resolution days for closed cases
      if (caseData.status === 'closed' && caseData.closed_at) {
        resolved_count++
        const createdDate = parseISO(caseData.created_at)
        const closedDate = parseISO(caseData.closed_at)
        const resolutionDays = differenceInDays(closedDate, createdDate)
        total_resolution_days += resolutionDays

        // Check if closed on time
        total_closed++
        if (caseData.due_date) {
          const dueDate = parseISO(caseData.due_date)
          if (closedDate <= dueDate) {
            on_time_closed++
          }
        }
      }
    }

    const avg_resolution_days =
      resolved_count > 0 ? Math.round(total_resolution_days / resolved_count) : 0

    const on_time_pct = total_closed > 0 ? Math.round((on_time_closed / total_closed) * 100) : 100

    const kpis: CaseKpis = {
      open,
      due_this_week,
      breaches,
      total,
      avg_resolution_days,
      on_time_pct
    }

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Cases KPIs error:', error)
    return NextResponse.json({ error: 'Failed to calculate KPIs' }, { status: 500 })
  }
}
