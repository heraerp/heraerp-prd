import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

  try {
    // Query 1: Check if any entities exist for this org
    const { data: allEntities, error: error1 } = await supabase
      .from('core_entities')
      .select('entity_type, count')
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .limit(10)

    // Query 2: Check specifically for playbooks
    const { data: playbooks, error: error2 } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .eq('entity_type', 'playbook')
      .limit(5)

    // Query 3: Get all entity types for this org
    const { data: entityTypes, error: error3 } = await supabase
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', CIVICFLOW_ORG_ID)
      .limit(20)

    const uniqueTypes = [...new Set(entityTypes?.map(e => e.entity_type) || [])]

    return NextResponse.json({
      debug: true,
      organization_id: CIVICFLOW_ORG_ID,
      all_entities_sample: allEntities,
      all_entities_error: error1?.message,
      playbooks_found: playbooks?.length || 0,
      playbooks_sample: playbooks?.[0],
      playbooks_error: error2?.message,
      entity_types_found: uniqueTypes,
      entity_types_error: error3?.message
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Debug query failed'
      },
      { status: 500 }
    )
  }
}
