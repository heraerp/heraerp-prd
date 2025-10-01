import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { TransitionStageRequest, StageTransition } from '@/types/engagement'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const body: TransitionStageRequest = await request.json()

    // Get journey
    const { data: journey, error: journeyError } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('id', body.journey_id)
      .eq('organization_id', orgId)
      .single()

    if (journeyError || !journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 })
    }

    // Extract current dynamic data
    const dynamicData = journey.core_dynamic_data || []
    const getFieldValue = (fieldName: string, type: 'text' | 'number' | 'json' = 'text') => {
      const field = dynamicData.find((d: any) => d.field_name === fieldName)
      if (!field) return undefined
      switch (type) {
        case 'number':
          return field.field_value_number
        case 'json':
          return field.field_value_json
        default:
          return field.field_value_text
      }
    }

    const currentStageId = getFieldValue('current_stage_id')
    const currentScore = getFieldValue('score', 'number') || 0
    let stageHistory = getFieldValue('stage_history', 'json') || []

    // Get current and target stages
    let currentStageName = ''
    if (currentStageId) {
      const { data: currentStage } = await supabase
        .from('core_entities')
        .select('entity_name')
        .eq('id', currentStageId)
        .single()
      if (currentStage) {
        currentStageName = currentStage.entity_name
      }
    }

    const { data: toStage, error: toStageError } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data(*)
      `
      )
      .eq('id', body.to_stage_id)
      .eq('organization_id', orgId)
      .single()

    if (toStageError || !toStage) {
      return NextResponse.json({ error: 'Target stage not found' }, { status: 404 })
    }

    // Check entry criteria if not skipping
    if (!body.skip_criteria_check) {
      const toStageDynamicData = toStage.core_dynamic_data || []
      const getToStageFieldValue = (
        fieldName: string,
        type: 'text' | 'number' | 'json' = 'text'
      ) => {
        const field = toStageDynamicData.find((d: any) => d.field_name === fieldName)
        if (!field) return undefined
        switch (type) {
          case 'number':
            return field.field_value_number
          case 'json':
            return field.field_value_json
          default:
            return field.field_value_text
        }
      }

      const entryCriteria = getToStageFieldValue('entry_criteria', 'json') as any
      if (entryCriteria) {
        // Check minimum score
        if (entryCriteria.min_score && currentScore < entryCriteria.min_score) {
          return NextResponse.json(
            {
              error: `Journey does not meet minimum score requirement (current: ${currentScore}, required: ${entryCriteria.min_score})`
            },
            { status: 400 }
          )
        }

        // Check required actions
        if (entryCriteria.required_actions && entryCriteria.required_actions.length > 0) {
          const scoreHistory = getFieldValue('score_history', 'json') || []
          const completedActions = new Set((scoreHistory as any[]).map(event => event.action))

          const missingActions = entryCriteria.required_actions.filter(
            (action: string) => !completedActions.has(action)
          )

          if (missingActions.length > 0) {
            return NextResponse.json(
              { error: `Journey missing required actions: ${missingActions.join(', ')}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Create transition record
    const transition: StageTransition = {
      from_stage_id: currentStageId,
      from_stage_name: currentStageName,
      to_stage_id: body.to_stage_id,
      to_stage_name: toStage.entity_name,
      transitioned_at: new Date().toISOString(),
      reason: body.reason,
      score_at_transition: currentScore
    }

    // Update stage history
    stageHistory = [transition, ...(stageHistory as StageTransition[])].slice(0, 50)

    // Update dynamic data for current stage
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        entity_id: body.journey_id,
        field_name: 'current_stage_id',
        field_value_text: body.to_stage_id,
        organization_id: orgId
      })
    })

    // Update entered_at time
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        entity_id: body.journey_id,
        field_name: 'entered_at',
        field_value_text: new Date().toISOString(),
        organization_id: orgId
      })
    })

    // Update stage history
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        entity_id: body.journey_id,
        field_name: 'stage_history',
        field_value_json: stageHistory,
        organization_id: orgId
      })
    })

    // Check for next best action based on new stage
    const toStageOrdinal =
      toStageDynamicData?.find((d: any) => d.field_name === 'ordinal')?.field_value_number || 0

    let nextBestAction = null
    if (toStageOrdinal === 1) {
      // Discover stage
      nextBestAction = {
        action_type: 'send_welcome_email',
        description: 'Send welcome email series',
        priority: 'high',
        suggested_at: new Date().toISOString()
      }
    } else if (toStageOrdinal === 2) {
      // Nurture stage
      nextBestAction = {
        action_type: 'invite_to_event',
        description: 'Invite to upcoming community event',
        priority: 'medium',
        suggested_at: new Date().toISOString()
      }
    } else if (toStageOrdinal === 3) {
      // Active stage
      nextBestAction = {
        action_type: 'schedule_meeting',
        description: 'Schedule one-on-one meeting',
        priority: 'high',
        suggested_at: new Date().toISOString()
      }
    }

    if (nextBestAction) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          entity_id: body.journey_id,
          field_name: 'next_best_action',
          field_value_json: nextBestAction,
          organization_id: orgId
        })
      })
    }

    // Emit transaction
    await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
      },
      body: JSON.stringify({
        smart_code: 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.STAGE.TRANSITIONED.V1',
        metadata: {
          journey_id: body.journey_id,
          from_stage_id: currentStageId,
          from_stage_name: currentStageName,
          to_stage_id: body.to_stage_id,
          to_stage_name: toStage.entity_name,
          score: currentScore,
          reason: body.reason
        }
      })
    })

    return NextResponse.json({
      success: true,
      journey_id: body.journey_id,
      from_stage: currentStageName,
      to_stage: toStage.entity_name,
      transition
    })
  } catch (error) {
    console.error('Error transitioning stage:', error)
    return NextResponse.json({ error: 'Failed to transition stage' }, { status: 500 })
  }
}
