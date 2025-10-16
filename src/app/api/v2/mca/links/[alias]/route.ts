/**
 * MCA Short Link Redirect API Endpoint
 * Click tracking and analytics with UTM parameter management
 * 
 * Smart Code: HERA.CRM.MCA.API.LINK.REDIRECT.V1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { trackDeliveryEvent } from '@/lib/mca/rpc-functions'

interface RouteParams {
  params: {
    alias: string
  }
}

/**
 * GET /api/v2/mca/links/[alias]
 * Redirects to destination URL and tracks click analytics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = createRouteHandlerClient({ cookies })
  const { alias } = params
  
  try {
    // Extract click metadata
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    // Get URL parameters
    const url = new URL(request.url)
    const trackingParams = Object.fromEntries(url.searchParams.entries())

    // Look up short link by alias
    const { data: shortLink, error: linkError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        organization_id,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_number
        )
      `)
      .eq('entity_type', 'SHORT_LINK')
      .eq('status', 'active')
      .single()

    // Filter by alias in dynamic data
    const aliasField = shortLink?.core_dynamic_data?.find(
      (field: any) => field.field_name === 'alias' && field.field_value_text === alias
    )

    if (linkError || !shortLink || !aliasField) {
      console.warn(`⚠️ Short link not found: ${alias}`)
      return NextResponse.redirect(new URL('/404', request.url))
    }

    // Extract link metadata
    const dynamicData = shortLink.core_dynamic_data || []
    const destination = dynamicData.find((f: any) => f.field_name === 'destination')?.field_value_text
    const campaignId = dynamicData.find((f: any) => f.field_name === 'campaign_id')?.field_value_text
    const currentClicks = dynamicData.find((f: any) => f.field_name === 'clicks')?.field_value_number || 0

    if (!destination) {
      console.error(`❌ No destination URL for alias: ${alias}`)
      return NextResponse.redirect(new URL('/404', request.url))
    }

    // Generate unique click fingerprint
    const clickFingerprint = Buffer.from(`${ipAddress}${userAgent}${alias}${new Date().toDateString()}`).toString('base64')

    // Check if this is a unique click (same fingerprint within 24 hours)
    const { data: recentClicks } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('transaction_type', 'LINK_CLICKED')
      .eq('source_entity_id', shortLink.id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .contains('metadata', { click_fingerprint: clickFingerprint })
      .limit(1)

    const isUniqueClick = !recentClicks || recentClicks.length === 0

    // Track click event
    try {
      await trackDeliveryEvent({
        message_id: `link-${alias}-${Date.now()}`,
        provider: 'short_link',
        event_type: 'CLICK',
        timestamp: new Date().toISOString(),
        campaign_id: campaignId,
        metadata: {
          alias,
          destination,
          click_fingerprint: clickFingerprint,
          is_unique: isUniqueClick,
          user_agent: userAgent,
          referer,
          ip_address: ipAddress,
          tracking_params: trackingParams
        },
        organization_id: shortLink.organization_id
      })
    } catch (trackingError) {
      console.error('❌ Failed to track click event:', trackingError)
      // Continue with redirect even if tracking fails
    }

    // Update click counters
    const newTotalClicks = currentClicks + 1
    const newUniqueClicks = isUniqueClick ? 
      (dynamicData.find((f: any) => f.field_name === 'unique_clicks')?.field_value_number || 0) + 1 :
      (dynamicData.find((f: any) => f.field_name === 'unique_clicks')?.field_value_number || 0)

    // Update click counts in parallel (don't wait for completion)
    supabase
      .from('core_dynamic_data')
      .upsert([
        {
          entity_id: shortLink.id,
          field_name: 'clicks',
          field_type: 'number',
          field_value_number: newTotalClicks,
          smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.CLICKS.V1',
          organization_id: shortLink.organization_id
        },
        {
          entity_id: shortLink.id,
          field_name: 'unique_clicks',
          field_type: 'number',
          field_value_number: newUniqueClicks,
          smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.UNIQUE_CLICKS.V1',
          organization_id: shortLink.organization_id
        },
        {
          entity_id: shortLink.id,
          field_name: 'last_clicked',
          field_type: 'datetime',
          field_value_datetime: new Date().toISOString(),
          smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.LAST_CLICKED.V1',
          organization_id: shortLink.organization_id
        }
      ])
      .then(({ error }) => {
        if (error) console.warn('⚠️ Failed to update click counts:', error)
      })

    // Parse destination URL and append tracking parameters
    const destinationUrl = new URL(destination)
    
    // Add UTM parameters if not already present
    const utmParams = dynamicData.find((f: any) => f.field_name === 'utm_params')?.field_value_text
    if (utmParams) {
      try {
        const utm = JSON.parse(utmParams)
        Object.entries(utm).forEach(([key, value]) => {
          if (!destinationUrl.searchParams.has(key)) {
            destinationUrl.searchParams.set(key, value as string)
          }
        })
      } catch (utmError) {
        console.warn('⚠️ Failed to parse UTM parameters:', utmError)
      }
    }

    // Add click tracking parameters
    destinationUrl.searchParams.set('hera_click_id', `${shortLink.id}-${Date.now()}`)
    if (campaignId) {
      destinationUrl.searchParams.set('hera_campaign_id', campaignId)
    }

    // Perform redirect
    return NextResponse.redirect(destinationUrl.toString(), 302)

  } catch (error) {
    console.error('❌ Short link redirect error:', error)
    return NextResponse.redirect(new URL('/error', request.url))
  }
}

/**
 * POST /api/v2/mca/links/[alias]
 * Creates or updates a short link
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = createRouteHandlerClient({ cookies })
  const { alias } = params
  
  try {
    // Authentication check
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { destination, campaign_id, utm_params, organization_id } = body

    if (!destination || !organization_id) {
      return NextResponse.json(
        { error: 'Missing required fields: destination, organization_id' },
        { status: 400 }
      )
    }

    // Organization access validation
    const { data: orgAccess } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', organization_id)
      .single()

    if (!orgAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Organization access denied' },
        { status: 403 }
      )
    }

    // Check if alias already exists
    const { data: existingLink } = await supabase
      .from('core_entities')
      .select(`
        id,
        core_dynamic_data (
          field_name,
          field_value_text
        )
      `)
      .eq('entity_type', 'SHORT_LINK')
      .eq('organization_id', organization_id)
      .single()

    const existingAlias = existingLink?.core_dynamic_data?.find(
      (field: any) => field.field_name === 'alias' && field.field_value_text === alias
    )

    if (existingAlias) {
      return NextResponse.json(
        { error: 'Alias already exists' },
        { status: 409 }
      )
    }

    // Create new short link entity
    const { data: newLink, error: createError } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'SHORT_LINK',
        entity_name: `Short Link: ${alias}`,
        smart_code: 'HERA.CRM.MCA.ENTITY.SHORT_LINK.V1',
        organization_id,
        status: 'active'
      })
      .select('id')
      .single()

    if (createError || !newLink) {
      console.error('❌ Failed to create short link entity:', createError)
      return NextResponse.json(
        { error: 'Failed to create short link' },
        { status: 500 }
      )
    }

    // Add dynamic data
    const dynamicFields = [
      {
        entity_id: newLink.id,
        field_name: 'alias',
        field_type: 'text',
        field_value_text: alias,
        smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.ALIAS.V1',
        organization_id
      },
      {
        entity_id: newLink.id,
        field_name: 'destination',
        field_type: 'text',
        field_value_text: destination,
        smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.DESTINATION.V1',
        organization_id
      },
      {
        entity_id: newLink.id,
        field_name: 'clicks',
        field_type: 'number',
        field_value_number: 0,
        smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.CLICKS.V1',
        organization_id
      },
      {
        entity_id: newLink.id,
        field_name: 'unique_clicks',
        field_type: 'number',
        field_value_number: 0,
        smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.UNIQUE_CLICKS.V1',
        organization_id
      }
    ]

    if (campaign_id) {
      dynamicFields.push({
        entity_id: newLink.id,
        field_name: 'campaign_id',
        field_type: 'text',
        field_value_text: campaign_id,
        smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.CAMPAIGN_ID.V1',
        organization_id
      })
    }

    if (utm_params) {
      dynamicFields.push({
        entity_id: newLink.id,
        field_name: 'utm_params',
        field_type: 'text',
        field_value_text: JSON.stringify(utm_params),
        smart_code: 'HERA.CRM.MCA.DYN.SHORT_LINK.V1.UTM_PARAMS.V1',
        organization_id
      })
    }

    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields)

    if (dynamicError) {
      console.error('❌ Failed to create dynamic data:', dynamicError)
      return NextResponse.json(
        { error: 'Failed to create short link data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newLink.id,
        alias,
        destination,
        short_url: `${request.nextUrl.origin}/api/v2/mca/links/${alias}`,
        created_at: new Date().toISOString(),
        created_by: session.user.id
      }
    })

  } catch (error) {
    console.error('❌ Short link creation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}