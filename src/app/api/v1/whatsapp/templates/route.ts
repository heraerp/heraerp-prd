import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  registerTemplate,
  createCampaign,
  sendCampaignMessage
} from '@/lib/mcp/whatsapp-six-tables-mcp'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization ID from user's entities
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('entity_type', 'user')
      .eq('entity_code', user.id)
      .single()

    if (!userEntity?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const organizationId = userEntity.organization_id
    const body = await request.json()
    const { action, ...params } = body

    let result: any

    switch (action) {
      case 'registerTemplate':
        result = await registerTemplate(organizationId, {
          name: params.name,
          language: params.language || 'en',
          body: params.body,
          variables: params.variables,
          category: params.category
        })
        break

      case 'createCampaign':
        result = await createCampaign(organizationId, {
          name: params.name,
          templateEntityId: params.templateEntityId,
          audienceQuery: params.audienceQuery,
          scheduleAt: params.scheduleAt
        })
        break

      case 'sendCampaignMessage':
        result = await sendCampaignMessage(
          organizationId,
          params.campaignId,
          params.recipientEntityId,
          params.templateEntityId
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action', available_actions: [
            'registerTemplate',
            'createCampaign',
            'sendCampaignMessage'
          ]},
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { status: 'error', error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      action,
      ...result
    })

  } catch (error) {
    console.error('WhatsApp Templates API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization ID from user's entities
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('organization_id')
      .eq('entity_type', 'user')
      .eq('entity_code', user.id)
      .single()

    if (!userEntity?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const organizationId = userEntity.organization_id

    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'msg_template')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (templatesError) throw templatesError

    // Format templates
    const formattedTemplates = templates?.map(template => {
      const bodyField = template.core_dynamic_data?.find((d: any) => d.field_name === 'body')
      const variablesField = template.core_dynamic_data?.find((d: any) => d.field_name === 'variables')
      
      return {
        id: template.id,
        name: template.entity_name,
        language: template.business_rules?.language || 'en',
        category: template.business_rules?.category || 'marketing',
        body: bodyField?.field_value_text || '',
        variables: variablesField?.field_value_json || [],
        created_at: template.created_at
      }
    }) || []

    return NextResponse.json({
      status: 'success',
      data: {
        templates: formattedTemplates,
        total: formattedTemplates.length
      }
    })

  } catch (error) {
    console.error('WhatsApp Templates API error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}