import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UpdateScoreRequest, ScoreEvent } from '@/types/engagement'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Default scoring values
const DEFAULT_SCORES = {
  email_open: 5,
  email_click: 10,
  email_bounce: -5,
  email_unsubscribe: -20,
  event_register: 20,
  event_attend: 30,
  event_no_show: -10,
  social_like: 3,
  social_share: 8,
  social_comment: 5,
  form_submit: 15,
  phone_call: 25,
  meeting_scheduled: 25
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const body: UpdateScoreRequest = await request.json()

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

    // Get current score and history
    let currentScore = getFieldValue('score', 'number') || 0
    let scoreHistory = getFieldValue('score_history', 'json') || []
    const currentStageId = getFieldValue('current_stage_id')

    // Calculate points
    const points = body.points !== undefined ? body.points : DEFAULT_SCORES[body.action] || 0

    // Update score
    const newScore = Math.max(0, currentScore + points)

    // Create score event
    const scoreEvent: ScoreEvent = {
      timestamp: new Date().toISOString(),
      action: body.action,
      points,
      metadata: body.metadata
    }

    // Update score history (keep last 100 events)
    scoreHistory = [scoreEvent, ...(scoreHistory as ScoreEvent[])].slice(0, 100)

    // Update dynamic data for score
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
        field_name: 'score',
        field_value_number: newScore,
        organization_id: orgId
      })
    })

    // Update score history
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
        field_name: 'score_history',
        field_value_json: scoreHistory,
        organization_id: orgId
      })
    })

    // Check if stage transition is needed
    if (currentStageId) {
      // Get all stages
      const { data: stages } = await supabase
        .from('core_entities')
        .select(
          `
          *,
          core_dynamic_data(*)
        `
        )
        .eq('organization_id', orgId)
        .eq('entity_type', 'engagement_stage')
        .order('created_at', { ascending: true })

      // Check for stage transitions based on score
      if (stages && stages.length > 0) {
        for (const stage of stages) {
          const stageDynamicData = stage.core_dynamic_data || []
          const getStageFieldValue = (
            fieldName: string,
            type: 'text' | 'number' | 'json' = 'text'
          ) => {
            const field = stageDynamicData.find((d: any) => d.field_name === fieldName)
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

          const entryCriteria = getStageFieldValue('entry_criteria', 'json') as any
          const ordinal = getStageFieldValue('ordinal', 'number') || 0

          // Check if journey qualifies for this stage
          if (entryCriteria && entryCriteria.min_score && newScore >= entryCriteria.min_score) {
            // Check if this is a higher stage than current
            const { data: currentStage } = await supabase
              .from('core_entities')
              .select('*, core_dynamic_data(*)')
              .eq('id', currentStageId)
              .single()

            if (currentStage) {
              const currentOrdinal =
                currentStage.core_dynamic_data?.find((d: any) => d.field_name === 'ordinal')
                  ?.field_value_number || 0

              if (ordinal > currentOrdinal) {
                // Transition to new stage
                await fetch(`${request.nextUrl.origin}/api/engagement/transition`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Organization-Id': orgId
                  },
                  body: JSON.stringify({
                    journey_id: body.journey_id,
                    to_stage_id: stage.id,
                    reason: `Score reached ${newScore} (threshold: ${entryCriteria.min_score})`
                  })
                })
                break
              }
            }
          }
        }
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
        smart_code: 'HERA.PUBLICSECTOR.CRM.ENGAGEMENT.SCORE.UPDATED.v1',
        metadata: {
          journey_id: body.journey_id,
          action: body.action,
          points,
          old_score: currentScore,
          new_score: newScore,
          ...body.metadata
        }
      })
    })

    return NextResponse.json({
      success: true,
      journey_id: body.journey_id,
      old_score: currentScore,
      new_score: newScore,
      points
    })
  } catch (error) {
    console.error('Error updating score:', error)
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 })
  }
}
