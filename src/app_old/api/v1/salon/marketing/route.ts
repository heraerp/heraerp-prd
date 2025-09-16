import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler } from '@/lib/api-error-handler'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// GET: Fetch marketing campaigns and analytics
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organization_id')
  const type = searchParams.get('type') // campaigns, analytics, customers

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID is required' },
      { status: 400 }
    )
  }

  try {
    const response: any = {
      success: true
    }

    // Fetch campaigns
    if (!type || type === 'campaigns') {
      const { data: campaigns, error: campaignError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'marketing_campaign')
        .order('created_at', { ascending: false })

      if (campaignError) throw campaignError
      response.campaigns = campaigns || []
    }

    // Fetch customer segments
    if (!type || type === 'segments') {
      const { data: segments, error: segmentError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'customer_segment')
        .order('entity_name')

      if (segmentError) throw segmentError
      response.segments = segments || []
    }

    // Fetch email templates
    if (!type || type === 'templates') {
      const { data: templates, error: templateError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'email_template')
        .order('created_at', { ascending: false })

      if (templateError) throw templateError
      response.templates = templates || []
    }

    // Calculate analytics
    if (!type || type === 'analytics') {
      // Get total customers
      const { count: totalCustomers } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('entity_type', 'customer')

      // Get customers with email
      const { count: emailSubscribers } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('entity_type', 'customer')
        .not('metadata->email', 'is', null)

      // Get active campaigns
      const { count: activeCampaigns } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('entity_type', 'marketing_campaign')
        .eq('metadata->status', 'active')

      response.analytics = {
        totalCustomers: totalCustomers || 0,
        emailSubscribers: emailSubscribers || 0,
        smsSubscribers: 0, // Will be implemented with SMS provider
        activeCampaigns: activeCampaigns || 0,
        campaignsSent: 0, // Will track with transaction records
        averageOpenRate: 0, // Will track with email provider
        averageClickRate: 0, // Will track with email provider
        revenue: 0 // Will calculate from campaign-attributed sales
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching marketing data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch marketing data' },
      { status: 500 }
    )
  }
})

// POST: Create campaign, segment, or template
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { organizationId, type, data } = body

  if (!organizationId || !type || !data) {
    return NextResponse.json(
      { success: false, error: 'Organization ID, type, and data are required' },
      { status: 400 }
    )
  }

  try {
    let entityType: string
    let smartCode: string

    switch (type) {
      case 'campaign':
        entityType = 'marketing_campaign'
        smartCode = 'HERA.SALON.MARKETING.CAMPAIGN.v1'
        break
      case 'segment':
        entityType = 'customer_segment'
        smartCode = 'HERA.SALON.MARKETING.SEGMENT.v1'
        break
      case 'template':
        entityType = 'email_template'
        smartCode = 'HERA.SALON.MARKETING.TEMPLATE.v1'
        break
      default:
        throw new Error('Invalid type')
    }

    const { data: result, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: entityType,
        entity_name: data.name,
        entity_code: `${type.toUpperCase()}-${Date.now()}`,
        smart_code: smartCode,
        metadata: data
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      [type]: result
    })
  } catch (error) {
    console.error('Error creating marketing item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create marketing item' },
      { status: 500 }
    )
  }
})

// PUT: Update campaign, segment, or template
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const { id, data } = body

  if (!id || !data) {
    return NextResponse.json({ success: false, error: 'ID and data are required' }, { status: 400 })
  }

  try {
    const { data: result, error } = await supabase
      .from('core_entities')
      .update({
        metadata: data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      item: result
    })
  } catch (error) {
    console.error('Error updating marketing item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update marketing item' },
      { status: 500 }
    )
  }
})

// DELETE: Delete campaign, segment, or template
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 })
  }

  try {
    const { error } = await supabase.from('core_entities').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting marketing item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete marketing item' },
      { status: 500 }
    )
  }
})
