import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/src/lib/universal-api'

/**
 * HERA Email Campaign Management API
 * Universal Architecture for Marketing Email Campaigns → CRM Lead Conversion
 *
 * Features:
 * - Campaign creation and management using universal tables
 * - Email list segmentation and targeting
 * - Campaign analytics and performance tracking
 * - Integration with CRM lead conversion pipeline
 * - Smart code classification for all campaign activities
 */

interface EmailCampaign {
  id: string
  entity_name: string
  entity_code: string
  campaign_type: 'newsletter' | 'promotional' | 'nurture' | 'welcome' | 'abandoned_cart'
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'completed'
  target_audience: string
  email_template_id: string
  scheduled_send_date?: string
  organizationId: string

  // Campaign metrics (stored in core_dynamic_data)
  total_recipients?: number
  emails_sent?: number
  emails_delivered?: number
  emails_opened?: number
  emails_clicked?: number
  leads_generated?: number
  opportunities_created?: number
  revenue_attributed?: number
}

interface CampaignAnalytics {
  campaign_id: string
  delivery_rate: number
  open_rate: number
  click_rate: number
  lead_conversion_rate: number
  opportunity_conversion_rate: number
  revenue_per_email: number
  roi: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const organizationId = request.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (action) {
      case 'list_campaigns':
        return await listEmailCampaigns(searchParams)

      case 'get_campaign':
        const campaignId = searchParams.get('campaign_id')
        if (!campaignId) {
          return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
        }
        return await getCampaignDetails(campaignId)

      case 'get_analytics':
        const analyticsId = searchParams.get('campaign_id')
        if (!analyticsId) {
          return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })
        }
        return await getCampaignAnalytics(analyticsId)

      case 'list_templates':
        return await listEmailTemplates()

      case 'get_audience_segments':
        return await getAudienceSegments()

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Email Campaigns API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'create_campaign':
        return await createEmailCampaign(data, organizationId)

      case 'send_campaign':
        return await sendEmailCampaign(data)

      case 'create_template':
        return await createEmailTemplate(data, organizationId)

      case 'create_audience_segment':
        return await createAudienceSegment(data, organizationId)

      case 'schedule_campaign':
        return await scheduleCampaign(data)

      case 'track_engagement':
        return await trackEmailEngagement(data, organizationId)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Email Campaigns API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'update_campaign':
        return await updateEmailCampaign(data)

      case 'pause_campaign':
        return await pauseCampaign(data.campaign_id)

      case 'resume_campaign':
        return await resumeCampaign(data.campaign_id)

      case 'update_campaign_status':
        return await updateCampaignStatus(data)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Email Campaigns API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Campaign Management Functions

async function listEmailCampaigns(searchParams: URLSearchParams) {
  const status = searchParams.get('status')
  const campaignType = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  // Get all email campaigns from core_entities
  const campaigns = await universalApi.getEntities('email_campaign', {
    status,
    limit,
    offset,
    filters: campaignType ? { campaign_type: campaignType } : undefined
  })

  // Enrich with campaign metrics from core_dynamic_data
  const enrichedCampaigns = await Promise.all(
    campaigns.map(async campaign => {
      const metrics = await universalApi.getDynamicData(campaign.id)
      return {
        ...campaign,
        ...metrics
      }
    })
  )

  return NextResponse.json({
    success: true,
    data: {
      campaigns: enrichedCampaigns,
      total_count: campaigns.length,
      has_more: campaigns.length === limit
    }
  })
}

async function getCampaignDetails(campaignId: string) {
  // Get campaign entity
  const campaign = await universalApi.getEntity(campaignId)
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // Get campaign metrics and configuration
  const campaignData = await universalApi.getDynamicData(campaignId)

  // Get campaign activities from universal_transactions
  const activities = await universalApi.getTransactions({
    filters: { related_entity_id: campaignId },
    limit: 100
  })

  return NextResponse.json({
    success: true,
    data: {
      campaign: { ...campaign, ...campaignData },
      activities,
      performance_summary: await calculateCampaignPerformance(campaignId)
    }
  })
}

async function createEmailCampaign(data: any, organizationId: string) {
  const {
    campaign_name,
    campaign_type,
    email_template_id,
    target_audience_id,
    scheduled_send_date,
    subject_line,
    sender_name,
    sender_email
  } = data

  // Create campaign entity
  const campaignEntity = {
    entity_type: 'email_campaign' as const,
    entity_name: campaign_name,
    entity_code: `CAMP-${Date.now()}`,
    organizationId: organizationId,
    status: 'draft' as const,
    metadata: {
      campaign_type,
      created_date: new Date().toISOString(),
      created_by: 'system'
    }
  }

  const createdCampaign = await universalApi.createEntity(campaignEntity)

  // Store campaign configuration in core_dynamic_data
  const campaignConfig = {
    email_template_id,
    target_audience_id,
    scheduled_send_date,
    subject_line,
    sender_name,
    sender_email,
    campaign_type,
    total_recipients: 0,
    emails_sent: 0,
    emails_delivered: 0,
    emails_opened: 0,
    emails_clicked: 0,
    leads_generated: 0
  }

  for (const [key, value] of Object.entries(campaignConfig)) {
    await universalApi.setDynamicField(createdCampaign.id, key, String(value))
  }

  // Create campaign creation transaction
  await universalApi.createTransaction({
    transaction_type: 'email_campaign_created',
    organizationId: organizationId,
    reference_number: createdCampaign.entity_code,
    smart_code: 'HERA.EMAIL.CAMPAIGN.CREATE.v1',
    metadata: {
      campaign_id: createdCampaign.id,
      campaign_name,
      campaign_type,
      created_at: new Date().toISOString()
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      campaign_id: createdCampaign.id,
      campaign_code: createdCampaign.entity_code,
      message: 'Email campaign created successfully'
    }
  })
}

async function sendEmailCampaign(data: any) {
  const { campaign_id, send_immediately = false, test_send = false } = data

  // Get campaign details
  const campaign = await universalApi.getEntity(campaign_id)
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const campaignData = await universalApi.getDynamicData(campaign_id)

  if (test_send) {
    // Send test email to campaign creator
    await sendTestEmail(campaign, campaignData)

    return NextResponse.json({
      success: true,
      data: { message: 'Test email sent successfully' }
    })
  }

  // Update campaign status to sending
  await universalApi.updateEntity(campaign_id, { status: 'sending' })
  await universalApi.setDynamicField(campaign_id, 'send_started_at', new Date().toISOString())

  // Get target audience
  const audienceId = campaignData.target_audience_id
  const recipients = await getAudienceRecipients(audienceId)

  // Send emails via Resend/configured email service
  const sendResults = await sendCampaignEmails(campaign, campaignData, recipients)

  // Update campaign metrics
  await universalApi.setDynamicField(campaign_id, 'total_recipients', String(recipients.length))
  await universalApi.setDynamicField(campaign_id, 'emails_sent', String(sendResults.sent_count))
  await universalApi.setDynamicField(campaign_id, 'emails_failed', String(sendResults.failed_count))

  // Update campaign status
  await universalApi.updateEntity(campaign_id, {
    status: sendResults.failed_count === 0 ? 'sent' : 'partially_sent'
  })

  // Create campaign send transaction
  await universalApi.createTransaction({
    transaction_type: 'email_campaign_sent',
    organizationId: campaign.organizationId,
    reference_number: campaign.entity_code,
    smart_code: 'HERA.EMAIL.CAMPAIGN.SEND.v1',
    total_amount: recipients.length,
    metadata: {
      campaign_id,
      sent_count: sendResults.sent_count,
      failed_count: sendResults.failed_count,
      sent_at: new Date().toISOString()
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      message: 'Email campaign sent successfully',
      sent_count: sendResults.sent_count,
      failed_count: sendResults.failed_count,
      total_recipients: recipients.length
    }
  })
}

async function trackEmailEngagement(data: any, organizationId: string) {
  const {
    email_id,
    campaign_id,
    recipient_email,
    engagement_type, // 'open', 'click', 'unsubscribe', 'bounce'
    engagement_data
  } = data

  // Create engagement transaction
  const transaction = await universalApi.createTransaction({
    transaction_type: `email_${engagement_type}`,
    organizationId,
    reference_number: `ENG-${Date.now()}`,
    smart_code: `HERA.EMAIL.INTERACTION.${engagement_type.toUpperCase()}.v1`,
    metadata: {
      email_id,
      campaign_id,
      recipient_email,
      engagement_type,
      engagement_data,
      timestamp: new Date().toISOString(),
      user_agent: engagement_data?.user_agent,
      ip_address: engagement_data?.ip_address
    }
  })

  // Update campaign metrics
  if (campaign_id) {
    const currentCount =
      (await universalApi.getDynamicField(campaign_id, `emails_${engagement_type}d`)) || '0'
    const newCount = parseInt(currentCount) + 1
    await universalApi.setDynamicField(campaign_id, `emails_${engagement_type}d`, String(newCount))
  }

  // Check if recipient should be converted to lead
  if (engagement_type === 'click') {
    await evaluateLeadConversion(recipient_email, campaign_id, organizationId)
  }

  return NextResponse.json({
    success: true,
    data: {
      engagement_id: transaction.id,
      message: `Email ${engagement_type} tracked successfully`
    }
  })
}

// Helper Functions

async function calculateCampaignPerformance(campaignId: string): Promise<CampaignAnalytics> {
  const campaignData = await universalApi.getDynamicData(campaignId)

  const sent = parseInt(campaignData.emails_sent || '0')
  const delivered = parseInt(campaignData.emails_delivered || '0')
  const opened = parseInt(campaignData.emails_opened || '0')
  const clicked = parseInt(campaignData.emails_clicked || '0')
  const leads = parseInt(campaignData.leads_generated || '0')
  const opportunities = parseInt(campaignData.opportunities_created || '0')
  const revenue = parseFloat(campaignData.revenue_attributed || '0')

  return {
    campaign_id: campaignId,
    delivery_rate: delivered > 0 ? (delivered / sent) * 100 : 0,
    open_rate: delivered > 0 ? (opened / delivered) * 100 : 0,
    click_rate: delivered > 0 ? (clicked / delivered) * 100 : 0,
    lead_conversion_rate: delivered > 0 ? (leads / delivered) * 100 : 0,
    opportunity_conversion_rate: leads > 0 ? (opportunities / leads) * 100 : 0,
    revenue_per_email: delivered > 0 ? revenue / delivered : 0,
    roi: revenue > 0 ? ((revenue - 100) / 100) * 100 : 0 // Assuming $100 campaign cost
  }
}

async function getCampaignAnalytics(campaignId: string) {
  const analytics = await calculateCampaignPerformance(campaignId)

  return NextResponse.json({
    success: true,
    data: analytics
  })
}

async function listEmailTemplates() {
  const templates = await universalApi.getEntities('email_template')

  return NextResponse.json({
    success: true,
    data: { templates }
  })
}

async function createEmailTemplate(data: any, organizationId: string) {
  const { template_name, subject, html_content, text_content, category } = data

  const templateEntity = {
    entity_type: 'email_template' as const,
    entity_name: template_name,
    entity_code: `TMPL-${Date.now()}`,
    organizationId: organizationId,
    status: 'active' as const,
    metadata: { category, created_at: new Date().toISOString() }
  }

  const createdTemplate = await universalApi.createEntity(templateEntity)

  // Store template content
  await universalApi.setDynamicField(createdTemplate.id, 'subject', subject)
  await universalApi.setDynamicField(createdTemplate.id, 'html_content', html_content)
  await universalApi.setDynamicField(createdTemplate.id, 'text_content', text_content)
  await universalApi.setDynamicField(createdTemplate.id, 'category', category)

  return NextResponse.json({
    success: true,
    data: {
      template_id: createdTemplate.id,
      message: 'Email template created successfully'
    }
  })
}

async function getAudienceSegments() {
  const segments = await universalApi.getEntities('email_audience')

  return NextResponse.json({
    success: true,
    data: { segments }
  })
}

async function createAudienceSegment(data: any, organizationId: string) {
  const { segment_name, description, criteria, estimated_size } = data

  const segmentEntity = {
    entity_type: 'email_audience' as const,
    entity_name: segment_name,
    entity_code: `AUD-${Date.now()}`,
    organizationId: organizationId,
    status: 'active' as const,
    metadata: {
      description,
      estimated_size,
      created_at: new Date().toISOString()
    }
  }

  const createdSegment = await universalApi.createEntity(segmentEntity)

  // Store segmentation criteria
  await universalApi.setDynamicField(createdSegment.id, 'criteria', JSON.stringify(criteria))
  await universalApi.setDynamicField(createdSegment.id, 'description', description)
  await universalApi.setDynamicField(createdSegment.id, 'estimated_size', String(estimated_size))

  return NextResponse.json({
    success: true,
    data: {
      segment_id: createdSegment.id,
      message: 'Audience segment created successfully'
    }
  })
}

async function scheduleCampaign(data: any) {
  const { campaign_id, scheduled_date } = data

  await universalApi.updateEntity(campaign_id, { status: 'scheduled' })
  await universalApi.setDynamicField(campaign_id, 'scheduled_send_date', scheduled_date)

  return NextResponse.json({
    success: true,
    data: { message: 'Campaign scheduled successfully' }
  })
}

async function updateEmailCampaign(data: any) {
  const { campaign_id, updates } = data

  if (updates.entity_updates) {
    await universalApi.updateEntity(campaign_id, updates.entity_updates)
  }

  if (updates.dynamic_fields) {
    for (const [key, value] of Object.entries(updates.dynamic_fields)) {
      await universalApi.setDynamicField(campaign_id, key, String(value))
    }
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Campaign updated successfully' }
  })
}

async function pauseCampaign(campaignId: string) {
  await universalApi.updateEntity(campaignId, { status: 'paused' })

  return NextResponse.json({
    success: true,
    data: { message: 'Campaign paused successfully' }
  })
}

async function resumeCampaign(campaignId: string) {
  await universalApi.updateEntity(campaignId, { status: 'sending' })

  return NextResponse.json({
    success: true,
    data: { message: 'Campaign resumed successfully' }
  })
}

async function updateCampaignStatus(data: any) {
  const { campaign_id, status, reason } = data

  await universalApi.updateEntity(campaign_id, { status })

  if (reason) {
    await universalApi.setDynamicField(campaign_id, 'status_reason', reason)
  }

  return NextResponse.json({
    success: true,
    data: { message: 'Campaign status updated successfully' }
  })
}

// Mock implementations for email sending
async function sendTestEmail(campaign: any, campaignData: any) {
  // Mock test email sending
  console.log('Sending test email for campaign:', campaign.entity_name)
  return { success: true }
}

async function getAudienceRecipients(audienceId: string) {
  // Mock audience recipients
  return [
    { email: 'test1@example.com', name: 'Test User 1' },
    { email: 'test2@example.com', name: 'Test User 2' }
  ]
}

async function sendCampaignEmails(campaign: any, campaignData: any, recipients: any[]) {
  // Mock campaign email sending
  return {
    sent_count: recipients.length,
    failed_count: 0
  }
}

async function evaluateLeadConversion(email: string, campaignId: string, organizationId: string) {
  // Check if email already exists as contact/lead
  const existingContacts = await universalApi.getEntities('contact', {
    filters: { email }
  })

  if (existingContacts.length === 0) {
    // Create new lead from email engagement
    const leadEntity = {
      entity_type: 'lead' as const,
      entity_name: `Lead from ${email}`,
      entity_code: `LEAD-${Date.now()}`,
      organizationId: organizationId,
      status: 'new' as const,
      metadata: {
        lead_source: 'email_campaign',
        campaign_id: campaignId,
        created_from_engagement: true,
        created_at: new Date().toISOString()
      }
    }

    const createdLead = await universalApi.createEntity(leadEntity)

    // Store lead contact information
    await universalApi.setDynamicField(createdLead.id, 'email', email)
    await universalApi.setDynamicField(createdLead.id, 'lead_score', '10') // Initial score for email click
    await universalApi.setDynamicField(createdLead.id, 'lead_source', 'email_campaign')
    await universalApi.setDynamicField(createdLead.id, 'source_campaign_id', campaignId)

    // Update campaign lead count
    const currentLeads = (await universalApi.getDynamicField(campaignId, 'leads_generated')) || '0'
    const newLeadCount = parseInt(currentLeads) + 1
    await universalApi.setDynamicField(campaignId, 'leads_generated', String(newLeadCount))

    console.log(`New lead created from email engagement: ${email}`)
  }
}
