import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Resend webhook event schema
const webhookEventSchema = z.object({
  type: z.enum([
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked'
  ]),
  created_at: z.string(),
  data: z.object({
    email_id: z.string(),
    from: z.string().email(),
    to: z.array(z.string().email()),
    subject: z.string(),
    created_at: z.string(),
    last_event: z.string().optional(),
    // Additional fields vary by event type
    bounce: z
      .object({
        bounce_type: z.string()
      })
      .optional(),
    complaint: z
      .object({
        complaint_type: z.string()
      })
      .optional(),
    click: z
      .object({
        link: z.string(),
        timestamp: z.number(),
        user_agent: z.string().optional(),
        ip_address: z.string().optional()
      })
      .optional()
  })
})

// Map Resend event types to HERA status
const eventStatusMap: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delayed',
  'email.complained': 'complained',
  'email.bounced': 'bounced',
  'email.opened': 'opened',
  'email.clicked': 'clicked'
}

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return signature === `sha256=${expectedSignature}`
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text()
    
    // Verify webhook signature
    const signature = req.headers.get('svix-signature') || req.headers.get('webhook-signature')
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      console.error('RESEND_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse and validate event
    const event = webhookEventSchema.parse(JSON.parse(rawBody))
    const status = eventStatusMap[event.type]
    
    if (!status) {
      console.warn(`Unknown event type: ${event.type}`)
      return NextResponse.json({ received: true })
    }

    // Find transaction by message_id
    const { data: transactions, error: searchError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('smart_code', 'HERA.COMMS.EMAIL.SEND.V1')
      .contains('metadata', { message_id: event.data.email_id })
      .limit(1)

    if (searchError) {
      console.error('Error searching for transaction:', searchError)
      return NextResponse.json(
        { error: 'Failed to find transaction' },
        { status: 500 }
      )
    }

    if (!transactions || transactions.length === 0) {
      console.warn(`No transaction found for message_id: ${event.data.email_id}`)
      // Still return success to prevent Resend from retrying
      return NextResponse.json({ received: true })
    }

    const transaction = transactions[0]

    // Update transaction status and metadata
    const updatedMetadata = {
      ...transaction.metadata,
      last_event: event.type,
      last_event_at: event.created_at,
      [`${event.type}_at`]: event.created_at
    }

    // Add event-specific metadata
    if (event.type === 'email.bounced' && event.data.bounce) {
      updatedMetadata.bounce_type = event.data.bounce.bounce_type
    } else if (event.type === 'email.complained' && event.data.complaint) {
      updatedMetadata.complaint_type = event.data.complaint.complaint_type
    } else if (event.type === 'email.clicked' && event.data.click) {
      updatedMetadata.clicked_links = [
        ...(updatedMetadata.clicked_links || []),
        {
          link: event.data.click.link,
          timestamp: event.data.click.timestamp,
          user_agent: event.data.click.user_agent,
          ip_address: event.data.click.ip_address
        }
      ]
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        status,
        metadata: updatedMetadata
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    // Create an event record in core_dynamic_data for audit trail
    const { error: eventError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: transaction.organization_id,
        entity_id: transaction.id,
        field_name: `email_event_${event.type}`,
        field_type: 'json',
        field_value_text: JSON.stringify({
          type: event.type,
          timestamp: event.created_at,
          data: event.data
        }),
        smart_code: 'HERA.COMMS.EMAIL.EVENT.V1'
      })

    if (eventError) {
      console.error('Error creating event record:', eventError)
      // Don't fail the webhook for audit trail errors
    }

    return NextResponse.json({ 
      received: true,
      transactionId: transaction.id,
      status: status
    })

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    
    // Return success to prevent retries for non-retryable errors
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        received: true,
        error: 'Invalid event format' 
      })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}