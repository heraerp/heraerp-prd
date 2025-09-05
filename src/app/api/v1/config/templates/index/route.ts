import { NextRequest, NextResponse } from 'next/server'
import { ucrTemplateIndex } from '@/lib/ucr/template-index-service'
import { getSupabase } from '@/lib/supabase/client'

/**
 * GET /api/v1/config/templates/index
 * Fetch the UCR template catalog or search templates
 */
export async function GET(request: NextRequest) {
  // Check if this is a search request
  if (request.url.includes('/search')) {
    try {
      const { searchParams } = new URL(request.url)
      const organizationId = searchParams.get('organization_id')
      const query = searchParams.get('q')

      if (!organizationId || !query) {
        return NextResponse.json(
          { error: 'organization_id and q (query) are required' },
          { status: 400 }
        )
      }

      const results = await ucrTemplateIndex.searchTemplates(organizationId, query)

      return NextResponse.json({
        success: true,
        query,
        results,
        count: results.length
      })
    } catch (error) {
      console.error('Error searching UCR templates:', error)
      return NextResponse.json(
        { error: 'Failed to search templates' },
        { status: 500 }
      )
    }
  }

  // Regular GET request for template index
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const industry = searchParams.get('industry')
    const ruleFamily = searchParams.get('rule_family')
    const status = searchParams.get('status')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Verify organization exists
    const supabase = getSupabase()
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Invalid organization_id' },
        { status: 404 }
      )
    }

    const filters = {
      ...(industry && { industry }),
      ...(ruleFamily && { rule_family: ruleFamily }),
      ...(status && { status })
    }

    const index = await ucrTemplateIndex.getTemplateIndex(organizationId, filters)

    return NextResponse.json({
      success: true,
      data: index,
      meta: {
        total_templates: index.templates.length,
        industries: [...new Set(index.templates.map(t => t.industry))],
        rule_families: [...new Set(index.templates.flatMap(t => t.rule_families))]
      }
    })
  } catch (error) {
    console.error('Error fetching UCR template index:', error)
    return NextResponse.json(
      { error: 'Failed to fetch template index' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/config/templates/index
 * Add or update a template in the index
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, template } = body

    if (!organization_id || !template) {
      return NextResponse.json(
        { error: 'organization_id and template are required' },
        { status: 400 }
      )
    }

    // Validate template structure
    const requiredFields = ['template_id', 'industry', 'name', 'rule_families', 'smart_code']
    for (const field of requiredFields) {
      if (!template[field]) {
        return NextResponse.json(
          { error: `Template missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    await ucrTemplateIndex.upsertTemplate(organization_id, {
      ...template,
      status: template.status || 'draft',
      version: template.version || '1.0.0'
    })

    return NextResponse.json({
      success: true,
      message: 'Template added/updated successfully',
      template_id: template.template_id
    })
  } catch (error) {
    console.error('Error updating UCR template index:', error)
    return NextResponse.json(
      { error: 'Failed to update template index' },
      { status: 500 }
    )
  }
}

