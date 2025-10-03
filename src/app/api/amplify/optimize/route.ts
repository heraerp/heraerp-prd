import { NextRequest, NextResponse } from 'next/server'
import { apiV2 } from '@/lib/client/fetchV2'

export async function POST(req: NextRequest) {
  try {
    const { contentId, organizationId } = await req.json()

    // 1) Create optimization task
    const taskResult = await apiV2.post('entities', {
      entity_type: 'AMPLIFY_TASK',
      entity_name: `Optimize: Content ${contentId}`,
      smart_code: 'HERA.AMPLIFY.TASK.ENTITY.V1',
      organization_id: organizationId
    })

    const task = taskResult.data

    await apiV2.post('entities/dynamic-data', {
      entity_id: task.entity_id,
      organization_id: organizationId,
      fields: [
        {
          field_name: 'kind',
          field_value: 'optimize',
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

    // 2) Get content
    const contentResult = await apiV2.get(`entities/${contentId}`, {
      include_dynamic: true,
      organization_id: organizationId
    })

    const content = contentResult.data

    // 3) TODO: AI-powered optimization
    // For now, generate mock SEO data
    const optimizations = {
      seo_title: content.dynamic_data?.title?.slice(0, 70) ?? 'Optimized Title',
      meta_description:
        `${content.dynamic_data?.title} - Learn more about this topic in our comprehensive guide.`.slice(
          0,
          155
        ),
      keywords: ['amplify', 'marketing', 'content', 'seo'],
      schema_jsonld: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: content.dynamic_data?.title,
        description: content.dynamic_data?.body?.slice(0, 160)
      },
      internal_links: [],
      external_links: []
    }

    // 4) Update content with optimizations
    await apiV2.post('entities/dynamic-data', {
      entity_id: contentId,
      organization_id: organizationId,
      fields: [
        {
          field_name: 'seo_title',
          field_value: optimizations.seo_title,
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.SEO_TITLE.V1'
        },
        {
          field_name: 'meta_description',
          field_value: optimizations.meta_description,
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.META_DESCRIPTION.V1'
        },
        {
          field_name: 'keywords',
          field_value: JSON.stringify(optimizations.keywords),
          field_type: 'json',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.KEYWORDS.V1'
        },
        {
          field_name: 'schema_jsonld',
          field_value: JSON.stringify(optimizations.schema_jsonld),
          field_type: 'json',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.SCHEMA_JSONLD.V1'
        },
        {
          field_name: 'status',
          field_value: 'optimized',
          field_type: 'text',
          smart_code: 'HERA.AMPLIFY.CONTENT.DYN.STATUS.V1'
        }
      ]
    })

    // 5) Complete task
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
          field_value: JSON.stringify({
            contentId,
            optimizations: Object.keys(optimizations)
          }),
          field_type: 'json',
          smart_code: 'HERA.AMPLIFY.TASK.DYN.TRACE.V1'
        }
      ]
    })

    return NextResponse.json({
      success: true,
      optimizations,
      task
    })
  } catch (error) {
    console.error('Error in amplify/optimize:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
