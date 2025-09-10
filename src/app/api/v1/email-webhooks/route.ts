import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import crypto from 'crypto'

/**
 * HERA Email Engagement Webhook Receiver
 * Universal Architecture for Real-time Email Tracking → Lead Conversion
 * 
 * Features:
 * - Receives webhooks from email service providers (Resend, SendGrid, etc.)
 * - Real-time email engagement tracking (opens, clicks, bounces)
 * - Automatic lead scoring and conversion evaluation
 * - Universal transaction logging for all email interactions
 * - Smart code classification for email engagement analysis
 */

interface EmailEngagementEvent {
  // Universal event structure that works with any email provider
  email_id: string
  message_id: string
  recipient_email: string
  campaign_id?: string
  event_type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed'
  timestamp: string
  
  // Provider-specific data
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'generic'
  provider_data?: any
  
  // Event context
  user_agent?: string
  ip_address?: string
  geo_location?: {
    country?: string
    region?: string
    city?: string
  }
  
  // Click-specific data
  click_data?: {
    url: string
    link_index?: number
    link_text?: string
  }
  
  // Bounce-specific data
  bounce_data?: {
    reason: string
    bounce_type: 'hard' | 'soft'
    diagnostic_code?: string
  }
}

// Provider-specific webhook parsers
const webhookParsers = {
  resend: (payload: any): EmailEngagementEvent => ({
    email_id: payload.data?.email_id || payload.data?.message_id,
    message_id: payload.data?.message_id,
    recipient_email: payload.data?.to?.[0] || payload.data?.email,
    campaign_id: payload.data?.tags?.campaign_id,
    event_type: mapResendEvent(payload.type),
    timestamp: payload.created_at || new Date().toISOString(),
    provider: 'resend',
    provider_data: payload.data,
    user_agent: payload.data?.user_agent,
    ip_address: payload.data?.ip,
    click_data: payload.type === 'email.clicked' ? {
      url: payload.data?.click?.url,
      link_index: payload.data?.click?.index
    } : undefined,
    bounce_data: payload.type === 'email.bounced' ? {
      reason: payload.data?.bounce?.reason || 'Unknown',
      bounce_type: payload.data?.bounce?.type || 'hard'
    } : undefined
  }),

  sendgrid: (payload: any): EmailEngagementEvent => ({
    email_id: payload.sg_message_id,
    message_id: payload.sg_message_id,
    recipient_email: payload.email,
    campaign_id: payload.category?.[0],
    event_type: mapSendGridEvent(payload.event),
    timestamp: new Date(payload.timestamp * 1000).toISOString(),
    provider: 'sendgrid',
    provider_data: payload,
    user_agent: payload.useragent,
    ip_address: payload.ip,
    click_data: payload.event === 'click' ? {
      url: payload.url
    } : undefined,
    bounce_data: payload.event === 'bounce' ? {
      reason: payload.reason,
      bounce_type: payload.type || 'hard'
    } : undefined
  }),

  mailgun: (payload: any): EmailEngagementEvent => ({
    email_id: payload['message-id'],
    message_id: payload['message-id'],
    recipient_email: payload.recipient,
    campaign_id: payload.tag,
    event_type: mapMailgunEvent(payload.event),
    timestamp: new Date(payload.timestamp * 1000).toISOString(),
    provider: 'mailgun',
    provider_data: payload,
    user_agent: payload['user-agent'],
    ip_address: payload['client-info']?.['client-ip'],
    geo_location: {
      country: payload['client-info']?.['client-cc'],
      region: payload['client-info']?.['client-region'],
      city: payload['client-info']?.['client-city']
    },
    click_data: payload.event === 'clicked' ? {
      url: payload.url
    } : undefined,
    bounce_data: payload.event === 'failed' ? {
      reason: payload.reason,
      bounce_type: payload.severity === 'permanent' ? 'hard' : 'soft'
    } : undefined
  }),

  generic: (payload: any): EmailEngagementEvent => payload
}

// Event mapping functions
function mapResendEvent(eventType: string): EmailEngagementEvent['event_type'] {
  const eventMap: Record<string, EmailEngagementEvent['event_type']> = {
    'email.sent': 'delivered',
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained'
  }
  return eventMap[eventType] || 'delivered'
}

function mapSendGridEvent(eventType: string): EmailEngagementEvent['event_type'] {
  const eventMap: Record<string, EmailEngagementEvent['event_type']> = {
    'delivered': 'delivered',
    'open': 'opened',
    'click': 'clicked',
    'bounce': 'bounced',
    'dropped': 'bounced',
    'spamreport': 'complained',
    'unsubscribe': 'unsubscribed'
  }
  return eventMap[eventType] || 'delivered'
}

function mapMailgunEvent(eventType: string): EmailEngagementEvent['event_type'] {
  const eventMap: Record<string, EmailEngagementEvent['event_type']> = {
    'accepted': 'delivered',
    'delivered': 'delivered',
    'opened': 'opened',
    'clicked': 'clicked',
    'failed': 'bounced',
    'complained': 'complained',
    'unsubscribed': 'unsubscribed'
  }
  return eventMap[eventType] || 'delivered'
}

// Webhook signature verification
function verifyWebhookSignature(
  payload: string, 
  signature: string, 
  secret: string, 
  provider: string
): boolean {
  if (!secret || !signature) return false
  
  try {
    let expectedSignature = ''
    
    switch (provider) {
      case 'resend':
        // Resend uses HMAC SHA-256
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(payload)
          .digest('hex')
        return signature === expectedSignature
        
      case 'sendgrid':
        // SendGrid signature verification
        const timestamp = signature.split(',')[0]?.split('=')[1]
        const sig = signature.split(',')[1]?.split('=')[1]
        if (!timestamp || !sig) return false
        
        const signedPayload = timestamp + payload
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(signedPayload, 'utf8')
          .digest('base64')
        return sig === expectedSignature
        
      case 'mailgun':
        // Mailgun signature verification
        const token = signature.split('.')[0]
        const timestamp_mg = signature.split('.')[1]
        const signature_mg = signature.split('.')[2]
        
        expectedSignature = crypto
          .createHmac('sha256', secret)
          .update(timestamp_mg + token)
          .digest('hex')
        return signature_mg === expectedSignature
        
      default:
        return true // Allow generic webhooks for development
    }
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') || 'generic'
    const organizationId = request.headers.get('x-organization-id') || 
                          searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    console.log(`🔔 Email Webhook: Receiving ${provider} event for org ${organizationId}`)

    // Get request body and headers
    const body = await request.text()
    const signature = request.headers.get('webhook-signature') || 
                     request.headers.get('x-signature') || ''

    // Get webhook secret from organization config (stored in core_dynamic_data)
    universalApi.setOrganizationId(organizationId)
    
    // For now, we'll skip signature verification in development
    // In production, retrieve webhook secrets from organization settings
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET
    
    if (webhookSecret && process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(body, signature, webhookSecret, provider)
      if (!isValid) {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Parse webhook payload
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('❌ Invalid JSON payload:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Handle batch events (some providers send multiple events)
    const events = Array.isArray(webhookData) ? webhookData : [webhookData]
    const processedEvents = []

    for (const eventData of events) {
      try {
        // Parse event using provider-specific parser
        const parser = webhookParsers[provider as keyof typeof webhookParsers] || webhookParsers.generic
        const engagement = parser(eventData)

        // Store engagement event in HERA universal tables
        const engagementId = await processEmailEngagement(engagement, organizationId)
        processedEvents.push({
          engagement_id: engagementId,
          event_type: engagement.event_type,
          recipient_email: engagement.recipient_email
        })

        console.log(`✅ Processed ${engagement.event_type} event for ${engagement.recipient_email}`)
        
      } catch (eventError) {
        console.error('❌ Error processing individual event:', eventError)
        // Continue processing other events
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email engagement events processed successfully',
      processed_events: processedEvents.length,
      events: processedEvents
    })

  } catch (error) {
    console.error('❌ Email webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process individual email engagement event
async function processEmailEngagement(
  engagement: EmailEngagementEvent, 
  organizationId: string
): Promise<string> {
  
  // Create engagement transaction in universal_transactions
  const engagementTransaction = await universalApi.createTransaction({
    organization_id: organizationId,
    transaction_type: `email_${engagement.event_type}`,
    transaction_code: `ENG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transaction_date: new Date(engagement.timestamp).toISOString().split('T')[0],
    reference_number: engagement.message_id,
    total_amount: getEngagementScore(engagement.event_type),
    status: 'completed',
    description: `Email ${engagement.event_type} - ${engagement.recipient_email}`,
    metadata: {
      // Email identifiers
      email_id: engagement.email_id,
      message_id: engagement.message_id,
      campaign_id: engagement.campaign_id,
      
      // Recipient information
      recipient_email: engagement.recipient_email,
      
      // Event details
      event_type: engagement.event_type,
      timestamp: engagement.timestamp,
      provider: engagement.provider,
      
      // Technical details
      user_agent: engagement.user_agent,
      ip_address: engagement.ip_address,
      geo_location: JSON.stringify(engagement.geo_location || {}),
      
      // Event-specific data
      click_url: engagement.click_data?.url,
      bounce_reason: engagement.bounce_data?.reason,
      bounce_type: engagement.bounce_data?.bounce_type,
      
      // Provider-specific data for debugging
      provider_data: JSON.stringify(engagement.provider_data)
    }
  })

  // Update campaign metrics if this is a campaign email
  if (engagement.campaign_id) {
    await updateCampaignMetrics(engagement.campaign_id, engagement.event_type, organizationId)
  }

  // Evaluate lead conversion for high-value engagements
  if (['clicked', 'opened'].includes(engagement.event_type)) {
    await evaluateLeadConversion(
      engagement.recipient_email, 
      engagement.campaign_id, 
      engagement.event_type,
      organizationId
    )
  }

  // Update contact engagement score
  await updateContactEngagementScore(
    engagement.recipient_email,
    engagement.event_type,
    organizationId
  )

  return engagementTransaction.id
}

// Helper function to assign score values to different engagement types
function getEngagementScore(eventType: EmailEngagementEvent['event_type']): number {
  const scoreMap: Record<EmailEngagementEvent['event_type'], number> = {
    'delivered': 1,
    'opened': 5,
    'clicked': 15,
    'bounced': -10,
    'complained': -25,
    'unsubscribed': -50
  }
  return scoreMap[eventType] || 0
}

// Update campaign metrics based on engagement
async function updateCampaignMetrics(
  campaignId: string, 
  eventType: EmailEngagementEvent['event_type'],
  organizationId: string
) {
  try {
    // Get current metric count
    const currentCount = await universalApi.getDynamicField(campaignId, `emails_${eventType}`) || '0'
    const newCount = parseInt(currentCount) + 1
    
    // Update the metric
    await universalApi.setDynamicField(campaignId, `emails_${eventType}`, String(newCount))
    
    // Update engagement rate calculations
    if (eventType === 'clicked') {
      const opensCount = parseInt(await universalApi.getDynamicField(campaignId, 'emails_opened') || '0')
      const clickThroughRate = opensCount > 0 ? (newCount / opensCount * 100).toFixed(2) : '0'
      await universalApi.setDynamicField(campaignId, 'click_through_rate', clickThroughRate)
    }
    
  } catch (error) {
    console.error('Error updating campaign metrics:', error)
  }
}

// Evaluate if recipient should be converted to lead
async function evaluateLeadConversion(
  email: string, 
  campaignId: string | undefined, 
  eventType: string,
  organizationId: string
) {
  try {
    // Check if contact already exists
    const existingContacts = await universalApi.getEntities('contact', {
      filters: { email }
    })

    let leadScore = eventType === 'clicked' ? 25 : 10 // Base scoring
    
    if (existingContacts.length === 0) {
      // Create new lead from email engagement
      const leadEntity = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'lead',
        entity_name: `Lead from ${email}`,
        entity_code: `LEAD-EMAIL-${Date.now()}`,
        status: 'new',
        metadata: {
          lead_source: 'email_engagement',
          source_campaign_id: campaignId,
          engagement_type: eventType,
          created_from_webhook: true
        }
      })
      
      // Store lead contact information and scoring
      await universalApi.setDynamicField(leadEntity.id, 'email', email)
      await universalApi.setDynamicField(leadEntity.id, 'lead_score', String(leadScore))
      await universalApi.setDynamicField(leadEntity.id, 'lead_source', 'email_campaign')
      await universalApi.setDynamicField(leadEntity.id, 'engagement_level', eventType)
      
      if (campaignId) {
        await universalApi.setDynamicField(leadEntity.id, 'source_campaign_id', campaignId)
        
        // Update campaign lead count
        const currentLeads = await universalApi.getDynamicField(campaignId, 'leads_generated') || '0'
        const newLeadCount = parseInt(currentLeads) + 1
        await universalApi.setDynamicField(campaignId, 'leads_generated', String(newLeadCount))
      }
      
      console.log(`🎯 New lead created from ${eventType} engagement: ${email}`)
    } else {
      // Update existing contact's engagement score
      const contact = existingContacts[0]
      const currentScore = parseInt(await universalApi.getDynamicField(contact.id, 'engagement_score') || '0')
      const newScore = currentScore + leadScore
      
      await universalApi.setDynamicField(contact.id, 'engagement_score', String(newScore))
      await universalApi.setDynamicField(contact.id, 'last_engagement_type', eventType)
      await universalApi.setDynamicField(contact.id, 'last_engagement_date', new Date().toISOString())
      
      console.log(`📈 Updated engagement score for ${email}: ${currentScore} → ${newScore}`)
    }
    
  } catch (error) {
    console.error('Error evaluating lead conversion:', error)
  }
}

// Update contact engagement scoring
async function updateContactEngagementScore(
  email: string, 
  eventType: string, 
  organizationId: string
) {
  try {
    // Find existing contact or create engagement record
    const contacts = await universalApi.getEntities('contact', {
      filters: { email }
    })
    
    if (contacts.length > 0) {
      const contact = contacts[0]
      const scoreIncrement = getEngagementScore(eventType as EmailEngagementEvent['event_type'])
      const currentScore = parseInt(await universalApi.getDynamicField(contact.id, 'email_engagement_score') || '0')
      const newScore = Math.max(0, currentScore + scoreIncrement) // Don't allow negative scores
      
      await universalApi.setDynamicField(contact.id, 'email_engagement_score', String(newScore))
      await universalApi.setDynamicField(contact.id, 'last_email_engagement', new Date().toISOString())
      await universalApi.setDynamicField(contact.id, 'last_engagement_type', eventType)
    }
    
  } catch (error) {
    console.error('Error updating contact engagement score:', error)
  }
}

// GET endpoint for webhook verification (some providers require this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  const verify_token = searchParams.get('verify_token')
  
  // Return challenge for webhook verification
  if (challenge) {
    console.log('✅ Email webhook verification successful')
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Email engagement webhook endpoint active',
    supported_providers: ['resend', 'sendgrid', 'mailgun', 'generic']
  })
}