import { NextRequest, NextResponse } from 'next/server'

/**
 * WhatsApp Webhook Simulator
 * Simulates real WhatsApp webhook payloads to test message handling
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, message, contact_name } = body

    // Create a realistic WhatsApp webhook payload
    const webhookPayload = {
      entry: [
        {
          id: '12345678901234567',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919945896033',
                  phone_number_id: '712631301940690'
                },
                contacts: [
                  {
                    profile: {
                      name: contact_name || `User ${phone}`
                    },
                    wa_id: phone.replace('+', '')
                  }
                ],
                messages: [
                  {
                    from: phone.replace('+', ''),
                    id: `wamid.${Date.now()}`,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: message
                    },
                    type: 'text'
                  }
                ]
              },
              field: 'messages'
            }
          ]
        }
      ]
    }

    console.log(
      '🔔 Simulating WhatsApp webhook with payload:',
      JSON.stringify(webhookPayload, null, 2)
    )

    // Call the actual webhook endpoint
    const origin = request.headers.get('host')?.includes('localhost')
      ? `http://localhost:3000`
      : `https://${request.headers.get('host')}`
    const webhookUrl = `${origin}/api/v1/whatsapp/webhook`

    console.log('📡 Calling webhook at:', webhookUrl)

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    })

    const result = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Webhook simulation sent successfully',
      details: {
        phone,
        message,
        webhook_response: result,
        timestamp: new Date().toISOString()
      },
      next_steps: [
        'Check /salon-data/whatsapp to see the new message',
        'The message should appear as a real WhatsApp conversation',
        'Try sending booking keywords like "BOOK haircut tomorrow"'
      ]
    })
  } catch (error) {
    console.error('Webhook simulation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method for quick testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const phone = searchParams.get('phone') || '+918883333144'
  const message = searchParams.get('message') || 'Hi, I would like to book an appointment'
  const name = searchParams.get('name') || 'Test User'

  // Simulate POST request
  return POST({
    json: async () => ({ phone, message, contact_name: name })
  } as NextRequest)
}
