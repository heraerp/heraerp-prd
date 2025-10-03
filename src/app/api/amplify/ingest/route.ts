import { NextRequest, NextResponse } from 'next/server'
import { apiV2 } from '@/lib/client/fetchV2'

export async function POST(req: NextRequest) {
  try {
    const { campaignId, personaId, topicOrDraft, organizationId } = await req.json()

    // 1) Create task audit
    const taskResult = await apiV2.post('entities', {
      entity_type: 'AMPLIFY_TASK',
      entity_name: `Ingest: ${topicOrDraft?.title ?? topicOrDraft?.slice(0,40) ?? 'Topic'}`,
      smart_code: 'HERA.AMPLIFY.TASK.ENTITY.V1',
      organization_id: organizationId,
      metadata: {}
    })

    if (!taskResult.success || !taskResult.data) {
      throw new Error('Failed to create task')
    }

    const task = taskResult.data

    // Set task initial fields
    await apiV2.post('entities/dynamic-data', {
      entity_id: task.entity_id,
      organization_id: organizationId,
      fields: [
        {
          field_name: 'kind',
          field_value: 'ingestion',
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.TASK.DYN.KIND.V1'
        },
        {
          field_name: 'status',
          field_value: 'running',
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.TASK.DYN.STATUS.V1'
        }
      ]
    })

    // 2) TODO: Persona-aware drafting (would delegate to AI service)
    const draft = {
      title: topicOrDraft?.title ?? 'Generated Content',
      body: topicOrDraft?.body ?? 'Content generated from topic...',
      source_type: topicOrDraft?.source_type ?? 'topic'
    }

    // 3) Create AMPLIFY_CONTENT
    const contentResult = await apiV2.post('entities', {
      entity_type: 'AMPLIFY_CONTENT',
      entity_name: draft.title,
      smart_code: 'HERA.AMPLIFY.CONTENT.ENTITY.V1',
      organization_id: organizationId
    })

    if (!contentResult.success || !contentResult.data) {
      throw new Error('Failed to create content')
    }

    const content = contentResult.data

    // Set content fields
    await apiV2.post('entities/dynamic-data', {
      entity_id: content.entity_id,
      organization_id: organizationId,
      fields: [
        {
          field_name: 'source_type',
          field_value: draft.source_type,
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.SOURCE_TYPE.V1'
        },
        {
          field_name: 'title',
          field_value: draft.title,
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.TITLE.V1'
        },
        {
          field_name: 'body',
          field_value: draft.body,
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.BODY.V1'
        },
        {
          field_name: 'status',
          field_value: 'ingested',
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.STATUS.V1'
        }
      ]
    })

    // 4) Link to campaign if provided
    if (campaignId) {
      await apiV2.post('relationships', {
        from_entity_id: campaignId,
        to_entity_id: content.entity_id,
        relationship_type: 'CAMPAIGN_HAS_CONTENT',
        smart_code: 'HERA.AMPLIFY.CAMPAIGN.REL.HAS_CONTENT.V1',
        organization_id: organizationId
      })
    }

    // 5) Finalize task
    await apiV2.post('entities/dynamic-data', {
      entity_id: task.entity_id,
      organization_id: organizationId,
      fields: [
        {
          field_name: 'status',
          field_value: 'done',
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.TASK.DYN.STATUS.V1'
        },
        {
          field_name: 'trace',
          field_value: JSON.stringify({ contentId: content.entity_id }),
          field_type: 'json',
          smart_code: 'HERA.AMPLIFY.TASK.DYN.TRACE.V1'
        }
      ]
    })

    return NextResponse.json({ 
      success: true,
      content,
      task
    })

  } catch (error) {
    console.error('Error in amplify/ingest:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}