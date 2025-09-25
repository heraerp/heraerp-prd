import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_STAGES } from '@/types/engagement'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const createdStages = []

    for (const stage of DEFAULT_STAGES) {
      // Create stage entity
      const stageData = {
        entity_type: 'engagement_stage',
        entity_name: stage.entity_name,
        entity_code: `STAGE-${stage.entity_name?.toUpperCase().replace(/\s/g, '_')}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.STAGE.v1',
        organization_id: orgId
      }

      const stageResponse = await fetch(
        `${request.nextUrl.origin}/api/v2/universal/entity-upsert`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId
          },
          body: JSON.stringify(stageData)
        }
      )

      if (!stageResponse.ok) {
        throw new Error(`Failed to create stage: ${stage.entity_name}`)
      }

      const stageResult = await stageResponse.json()
      const stageId = stageResult.data.id

      // Add dynamic data fields
      const dynamicFields = [
        { field_name: 'ordinal', field_value_number: stage.ordinal },
        { field_name: 'description', field_value_text: stage.description },
        { field_name: 'color', field_value_text: stage.color },
        { field_name: 'icon', field_value_text: stage.icon },
        { field_name: 'entry_criteria', field_value_json: stage.entry_criteria },
        { field_name: 'exit_criteria', field_value_json: stage.exit_criteria },
        { field_name: 'scoring_rules', field_value_json: stage.scoring_rules },
        { field_name: 'status', field_value_text: 'active' }
      ]

      // Use Supabase client for dynamic data
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

      for (const field of dynamicFields) {
        if (
          field.field_value_text ||
          field.field_value_number !== undefined ||
          field.field_value_json
        ) {
          await fetch(`${supabaseUrl}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              entity_id: stageId,
              field_name: field.field_name,
              field_value_text: field.field_value_text,
              field_value_number: field.field_value_number,
              field_value_json: field.field_value_json,
              organization_id: orgId
            })
          })
        }
      }

      // Emit transaction
      await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.STAGE.CREATED.v1',
          metadata: {
            stage_id: stageId,
            stage_name: stage.entity_name,
            ordinal: stage.ordinal
          }
        })
      })

      createdStages.push({
        id: stageId,
        name: stage.entity_name,
        ordinal: stage.ordinal
      })
    }

    return NextResponse.json({
      success: true,
      stages: createdStages
    })
  } catch (error) {
    console.error('Error creating default stages:', error)
    return NextResponse.json({ error: 'Failed to create default stages' }, { status: 500 })
  }
}
