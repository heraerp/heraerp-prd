import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import { KPI, KPI_TEMPLATES } from '@/types/analytics'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const isDemo = isDemoMode(orgId)

    if (isDemo) {
      // Return demo KPIs
      const demoKPIs: KPI[] = [
        {
          id: 'demo-kpi-1',
          entity_code: 'KPI-FLOWS-FINANCE',
          entity_name: 'Flows of Finance',
          smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.FLOWS_OF_FINANCE.v1',
          organization_id: orgId,
          definition: KPI_TEMPLATES.FLOWS_OF_FINANCE.definition,
          window: { type: 'rolling', duration: 30 },
          calculation: KPI_TEMPLATES.FLOWS_OF_FINANCE.calculation,
          attribution_rules: KPI_TEMPLATES.FLOWS_OF_FINANCE.attribution_rules,
          current_value: 825000,
          target_value: 1000000,
          unit: 'USD',
          direction: 'increase',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-kpi-2',
          entity_code: 'KPI-UNDERSERVED-ENGAGEMENT',
          entity_name: 'Underserved Engagement',
          smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.UNDERSERVED_ENGAGEMENT.v1',
          organization_id: orgId,
          definition: KPI_TEMPLATES.UNDERSERVED_ENGAGEMENT.definition,
          window: { type: 'rolling', duration: 7 },
          calculation: KPI_TEMPLATES.UNDERSERVED_ENGAGEMENT.calculation,
          attribution_rules: KPI_TEMPLATES.UNDERSERVED_ENGAGEMENT.attribution_rules,
          current_value: 68,
          target_value: 75,
          unit: '%',
          direction: 'increase',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'demo-kpi-3',
          entity_code: 'KPI-PROGRAM-EFFECTIVENESS',
          entity_name: 'Program Effectiveness',
          smart_code: 'HERA.PUBLICSECTOR.CRM.KPI.PROGRAM_EFFECTIVENESS.v1',
          organization_id: orgId,
          definition: KPI_TEMPLATES.PROGRAM_EFFECTIVENESS.definition,
          window: { type: 'fixed', start_date: '2024-01-01', end_date: '2024-12-31' },
          calculation: KPI_TEMPLATES.PROGRAM_EFFECTIVENESS.calculation,
          attribution_rules: KPI_TEMPLATES.PROGRAM_EFFECTIVENESS.attribution_rules,
          current_value: 0.78,
          target_value: 0.85,
          unit: 'ratio',
          direction: 'increase',
          last_updated: new Date().toISOString(),
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      return NextResponse.json(demoKPIs)
    }

    // Fetch real KPIs from database
    const { data: kpiEntities, error } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('organization_id', orgId)
      .eq('entity_type', 'kpi')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Transform to KPI type
    const kpis: KPI[] = (kpiEntities || []).map(entity => {
      const dynamicData = entity.core_dynamic_data || []
      const getField = (name: string) => {
        const field = dynamicData.find((f: any) => f.field_name === name)
        return field?.field_value_json || field?.field_value_number || field?.field_value_text
      }

      return {
        id: entity.id,
        entity_code: entity.entity_code,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        organization_id: entity.organization_id,
        definition: getField('definition') || {
          name: entity.entity_name,
          description: '',
          category: 'operational'
        },
        window: getField('window') || { type: 'rolling', duration: 30 },
        calculation: getField('calculation') || { method: 'count' },
        attribution_rules: getField('attribution_rules') || [],
        current_value: getField('current_value'),
        target_value: getField('target_value'),
        unit: getField('unit'),
        direction: getField('direction'),
        last_updated: getField('last_updated'),
        created_at: entity.created_at,
        updated_at: entity.updated_at
      }
    })

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }
}
