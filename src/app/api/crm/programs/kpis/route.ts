import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || DEMO_ORG_ID

    // Get total programs
    const { count: totalPrograms } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('entity_type', 'program')

    // Get active grant rounds
    const now = new Date().toISOString()
    const { data: activeRounds } = await supabase
      .from('core_entities')
      .select(
        `
        id,
        core_dynamic_data!inner(
          field_code,
          field_value_text
        )
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'grant_round')
      .or(
        `core_dynamic_data.field_code.eq.HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_OPEN.v1,core_dynamic_data.field_code.eq.HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_CLOSE.v1`
      )

    // Count active rounds based on window dates
    let activeRoundCount = 0
    const roundWindows = new Map<string, { open?: string; close?: string }>()

    activeRounds?.forEach(round => {
      const dynamicData = round.core_dynamic_data as any[]
      dynamicData.forEach(data => {
        if (!roundWindows.has(round.id)) {
          roundWindows.set(round.id, {})
        }
        const window = roundWindows.get(round.id)!
        if (data.field_code === 'HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_OPEN.v1') {
          window.open = data.field_value_text
        } else if (data.field_code === 'HERA.PUBLICSECTOR.CRM.GRANT_ROUND.WINDOW_CLOSE.v1') {
          window.close = data.field_value_text
        }
      })
    })

    roundWindows.forEach(window => {
      if (window.open && window.close && now >= window.open && now <= window.close) {
        activeRoundCount++
      }
    })

    // Get average budget
    const { data: budgetData } = await supabase
      .from('core_dynamic_data')
      .select('field_value_number')
      .eq('organization_id', orgId)
      .eq('field_code', 'HERA.PUBLICSECTOR.CRM.PROGRAM.BUDGET.V1')
      .not('field_value_number', 'is', null)

    const avgBudget = budgetData?.length
      ? budgetData.reduce((sum, b) => sum + (b.field_value_number || 0), 0) / budgetData.length
      : 0

    // Get programs created this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: newThisMonth } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('entity_type', 'program')
      .gte('created_at', startOfMonth.toISOString())

    return NextResponse.json({
      total_programs: totalPrograms || 0,
      active_rounds: activeRoundCount,
      avg_budget: Math.round(avgBudget),
      new_this_month: newThisMonth || 0,
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching program KPIs:', error)
    return NextResponse.json({ error: 'Failed to fetch program KPIs' }, { status: 500 })
  }
}
