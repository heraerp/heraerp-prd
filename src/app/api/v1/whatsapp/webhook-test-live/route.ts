import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

/**
 * Test endpoint to simulate a live WhatsApp webhook message
 * This creates a message that should show up immediately in the dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, direction = 'inbound', organizationId } = body

    const orgId =
      organizationId ||
      process.env.DEFAULT_ORGANIZATION_ID ||
      'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'

    console.log('🧪 Creating live webhook test message:', {
      phone,
      message,
      direction,
      organizationId: orgId
    })

    // Set organization context
    universalApi.setOrganizationId(orgId)

    // Create a live WhatsApp message transaction
    const messageTransaction = await universalApi.createTransaction({
      transaction_type: direction === 'inbound' ? 'whatsapp_inbound' : 'whatsapp_outbound',
      transaction_code: `LIVE-WA-${Date.now()}`,
      smart_code:
        direction === 'inbound'
          ? 'HERA.COMMS.WHATSAPP.MSG.INBOUND.V1'
          : 'HERA.COMMS.WHATSAPP.MSG.OUTBOUND.V1',
      total_amount: 0,
      metadata: {
        direction,
        text: message,
        from: phone,
        wa_id: phone,
        phone: phone,
        message_id: `live_${Date.now()}`,
        timestamp: new Date().toISOString(),
        contact_name: `Test Contact ${phone}`,
        is_test: true,
        is_live: true,
        webhook_timestamp: new Date().toISOString(),
        provider: 'test_webhook',
        cost_usd: 0
      }
    })

    console.log('✅ Live message created:', messageTransaction.id)

    return NextResponse.json({
      success: true,
      message: 'Live WhatsApp message created successfully',
      transaction_id: messageTransaction.id,
      details: {
        phone,
        message,
        direction,
        organizationId: orgId,
        timestamp: new Date().toISOString()
      },
      next_steps: [
        'Refresh the WhatsApp dashboard to see the new message',
        'Check /api/v1/whatsapp/universal-messages for the latest data',
        'This message should appear as a live conversation'
      ]
    })
  } catch (error) {
    console.error('Failed to create live webhook test message:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method to create a sample message quickly
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const phone = searchParams.get('phone') || '+1234567890'
  const message =
    searchParams.get('message') || 'Hello! This is a live test message from the webhook.'
  const direction = searchParams.get('direction') || 'inbound'
  const organizationId = searchParams.get('org_id') || process.env.DEFAULT_ORGANIZATION_ID

  // Create a test message using POST logic
  const testData = { phone, message, direction, organizationId }
  const mockRequest = { json: async () => testData } as any

  return POST(mockRequest)
}
