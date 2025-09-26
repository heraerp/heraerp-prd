import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Resend webhook signing secret (set this in your environment variables)
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!RESEND_WEBHOOK_SECRET) {
    console.warn('RESEND_WEBHOOK_SECRET not set, skipping signature verification')
    return true // Skip verification in development
  }

  const expectedSignature = crypto
    .createHmac('sha256', RESEND_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}

// Map Resend event types to CivicFlow smart codes
function getSmartCodeForEvent(eventType: string): string {
  const eventMap: Record<string, string> = {
    'email.sent': 'HERA.PUBLICSECTOR.COMM.EMAIL.SENT.V1',
    'email.delivered': 'HERA.PUBLICSECTOR.COMM.EMAIL.DELIVERED.V1',
    'email.delivery_delayed': 'HERA.PUBLICSECTOR.COMM.EMAIL.DELAYED.V1',
    'email.complained': 'HERA.PUBLICSECTOR.COMM.EMAIL.COMPLAINED.V1',
    'email.bounced': 'HERA.PUBLICSECTOR.COMM.EMAIL.BOUNCED.V1',
    'email.failed': 'HERA.PUBLICSECTOR.COMM.EMAIL.FAILED.V1',
    'email.opened': 'HERA.PUBLICSECTOR.COMM.EMAIL.OPENED.V1',
    'email.clicked': 'HERA.PUBLICSECTOR.COMM.EMAIL.CLICKED.V1'
  }

  return eventMap[eventType] || 'HERA.PUBLICSECTOR.COMM.EMAIL.EVENT.V1'
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('resend-signature') || ''

    // Verify webhook signature
    if (RESEND_WEBHOOK_SECRET && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody)
    console.log('Resend webhook received:', payload.type)

    // Extract event data
    const { type: eventType, created_at, data } = payload

    // Extract email data
    const {
      email_id,
      from,
      to,
      subject,
      html,
      text,
      tag, // Can be used to link to organization/constituent
      metadata
    } = data

    // Extract organization ID from metadata or tag
    const organizationId =
      metadata?.organization_id ||
      tag?.split(':')[0] || // Format: "org_id:constituent_id"
      null

    if (!organizationId) {
      console.warn('No organization ID found in webhook, using default')
    }

    // Create a transaction record for this email event
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId || '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77', // Default to CivicFlow org
        transaction_type: 'communication',
        transaction_code: `EMAIL-${email_id}`,
        smart_code: getSmartCodeForEvent(eventType),
        transaction_date: created_at,
        status: 'completed',
        metadata: {
          resend_email_id: email_id,
          event_type: eventType,
          from_email: from,
          to_emails: to,
          subject: subject,
          has_html: !!html,
          has_text: !!text,
          tag: tag,
          resend_metadata: metadata,
          // Track email status changes
          email_status: eventType.replace('email.', ''),
          // For opened/clicked events
          opened_at: eventType === 'email.opened' ? new Date().toISOString() : undefined,
          clicked_at: eventType === 'email.clicked' ? new Date().toISOString() : undefined,
          clicked_link: eventType === 'email.clicked' ? data.link : undefined,
          // For bounce/complaint events
          bounce_type: eventType === 'email.bounced' ? data.bounce_type : undefined,
          complaint_type: eventType === 'email.complained' ? data.complaint_type : undefined
        }
      })
      .select()
      .single()

    if (txnError) {
      console.error('Failed to create transaction:', txnError)
      return NextResponse.json({ error: 'Failed to record email event' }, { status: 500 })
    }

    // If there's a constituent ID in the tag, create a relationship
    if (tag && tag.includes(':')) {
      const [orgId, constituentId] = tag.split(':')

      if (constituentId) {
        await supabase.from('core_relationships').insert({
          organization_id: orgId,
          from_entity_id: transaction.id,
          to_entity_id: constituentId,
          relationship_type: 'communication_to_constituent',
          smart_code: 'HERA.PUBLICSECTOR.CRM.REL.COMM.CONSTITUENT.V1',
          metadata: {
            communication_type: 'email',
            event_type: eventType
          }
        })
      }
    }

    // Handle specific events
    switch (eventType) {
      case 'email.bounced':
        // Update constituent email status if needed
        console.log('Email bounced:', data.bounce_type)
        // You could update constituent dynamic data to mark email as invalid
        break

      case 'email.complained':
        // Handle spam complaints
        console.log('Spam complaint received for:', to)
        // You could add the email to a suppression list
        break

      case 'email.opened':
        // Track engagement
        console.log('Email opened by:', to)
        break

      case 'email.clicked':
        // Track link clicks
        console.log('Link clicked:', data.link)
        break
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Email event ${eventType} processed`,
      transaction_id: transaction.id
    })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 })
  }
}

// Optional: GET endpoint to verify webhook is working
export async function GET() {
  return NextResponse.json({
    status: 'Resend webhook endpoint is active',
    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/api/webhooks/resend`,
    supported_events: [
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.complained',
      'email.bounced',
      'email.failed',
      'email.opened',
      'email.clicked'
    ],
    instructions: {
      1: 'Add RESEND_WEBHOOK_SECRET to your environment variables',
      2: 'Configure this URL in your Resend webhook settings',
      3: 'Select the events you want to track',
      4: 'Use tags in format "org_id:constituent_id" to link emails to entities'
    }
  })
}
