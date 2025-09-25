import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { OrgCaseRow } from '@/types/organizations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const entityId = params.id
    const searchParams = request.nextUrl.searchParams
    const isDemo = isDemoMode(orgId)

    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assigned_to')
    const overdueOnly = searchParams.get('overdue_only') === 'true'

    if (isDemo) {
      const mockCases: OrgCaseRow[] = [
        {
          id: 'case-1',
          case_code: 'CS-2024-001',
          case_title: 'Grant Application Support - CHI-2024-001',
          case_type: 'grant_support',
          status: 'in_progress',
          priority: 'high',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'Sarah Johnson',
          rag_status: 'amber',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'case-2',
          case_code: 'CS-2024-002',
          case_title: 'Partnership Agreement Review',
          case_type: 'legal_review',
          status: 'open',
          priority: 'medium',
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'Michael Chen',
          rag_status: 'green',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'case-3',
          case_code: 'CS-2023-089',
          case_title: 'Annual Report Submission',
          case_type: 'compliance',
          status: 'resolved',
          priority: 'low',
          due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_to: 'Sarah Johnson',
          rag_status: 'green',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Apply filters
      let filteredCases = mockCases
      if (status) {
        filteredCases = filteredCases.filter(c => c.status === status)
      }
      if (priority) {
        filteredCases = filteredCases.filter(c => c.priority === priority)
      }
      if (assignedTo) {
        filteredCases = filteredCases.filter(c => c.assigned_to === assignedTo)
      }
      if (overdueOnly) {
        filteredCases = filteredCases.filter(c => c.due_date && new Date(c.due_date) < new Date())
      }

      const stats = {
        total_cases: mockCases.length,
        open_cases: mockCases.filter(c => ['open', 'pending', 'in_progress'].includes(c.status))
          .length,
        overdue_cases: mockCases.filter(c => c.due_date && new Date(c.due_date) < new Date())
          .length,
        high_priority: mockCases.filter(c => c.priority === 'high').length
      }

      return NextResponse.json({
        data: filteredCases,
        stats
      })
    }

    // Production: Fetch cases related to this org
    const { data: caseRelationships } = await supabase
      .from('core_relationships')
      .select(
        `
        from_entity_id,
        from_entity:from_entity_id(
          *,
          core_dynamic_data(*)
        )
      `
      )
      .eq('to_entity_id', entityId)
      .eq('relationship_type', 'case_for_entity')
      .eq('organization_id', orgId)

    const cases: OrgCaseRow[] = []
    let openCount = 0
    let overdueCount = 0
    let highPriorityCount = 0

    for (const rel of caseRelationships || []) {
      if (!rel.from_entity) continue

      const caseEntity = rel.from_entity

      // Parse dynamic data
      const dynamicData: any = {}
      caseEntity.core_dynamic_data?.forEach((field: any) => {
        const value = field.field_value_text || field.field_value_number || field.field_value_json
        dynamicData[field.field_name] = value
      })

      // Apply filters
      if (status && dynamicData.status !== status) continue
      if (priority && dynamicData.priority !== priority) continue
      if (assignedTo && dynamicData.assigned_to !== assignedTo) continue

      const dueDate = dynamicData.due_date ? new Date(dynamicData.due_date) : null
      const isOverdue = dueDate && dueDate < new Date()

      if (overdueOnly && !isOverdue) continue

      const caseRow: OrgCaseRow = {
        id: caseEntity.id,
        case_code: caseEntity.entity_code,
        case_title: caseEntity.entity_name,
        case_type: dynamicData.case_type || 'general',
        status: dynamicData.status || 'open',
        priority: dynamicData.priority || 'medium',
        due_date: dynamicData.due_date,
        assigned_to: dynamicData.assigned_to,
        rag_status: dynamicData.rag_status,
        created_at: caseEntity.created_at
      }

      cases.push(caseRow)

      if (['open', 'pending', 'in_progress'].includes(caseRow.status)) openCount++
      if (isOverdue) overdueCount++
      if (caseRow.priority === 'high' || caseRow.priority === 'urgent') highPriorityCount++
    }

    // Sort by priority and due date
    cases.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 99
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 99

      if (aPriority !== bPriority) return aPriority - bPriority

      // Then by due date (earliest first)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return 0
    })

    const stats = {
      total_cases: cases.length,
      open_cases: openCount,
      overdue_cases: overdueCount,
      high_priority: highPriorityCount
    }

    return NextResponse.json({
      data: cases,
      stats
    })
  } catch (error) {
    console.error('Error fetching cases:', error)
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }
}
