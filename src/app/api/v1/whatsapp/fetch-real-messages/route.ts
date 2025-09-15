/**
 * Fetch Real WhatsApp Messages from Meta API
 * This endpoint attempts to fetch actual message history from WhatsApp
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '712631301940690'
    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN ||
      'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD'
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1112225330318984'

    const results: any = {
      phoneInfo: null,
      conversations: null,
      messages: null,
      webhooks: null,
      note: ''
    }

    // 1. Get Phone Number Info
    try {
      const phoneResponse = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      const phoneData = await phoneResponse.json()
      results.phoneInfo = phoneData

      if (phoneData.error) {
        throw new Error(phoneData.error.message)
      }
    } catch (error) {
      console.error('Phone info error:', error)
    }

    // 2. Try to get conversations (Note: This endpoint may not be available)
    try {
      const conversationsResponse = await fetch(
        `https://graph.facebook.com/v20.0/${businessAccountId}/conversations?fields=id,updated_time,messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      const conversationsData = await conversationsResponse.json()
      results.conversations = conversationsData
    } catch (error) {
      console.error('Conversations error:', error)
      results.conversations = {
        error: 'Conversations endpoint not available',
        note: 'WhatsApp Business API does not provide message history directly'
      }
    }

    // 3. Try to get message templates (these are available)
    try {
      const templatesResponse = await fetch(
        `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      const templatesData = await templatesResponse.json()
      results.templates = templatesData
    } catch (error) {
      console.error('Templates error:', error)
    }

    // 4. Important notes about WhatsApp Business API
    results.note = `
IMPORTANT: WhatsApp Business API Limitations

1. MESSAGE HISTORY: WhatsApp Business API does NOT provide endpoints to fetch message history.
   
2. HOW TO GET REAL MESSAGES:
   a) Set up webhook URL in Meta Business Manager
   b) WhatsApp will send new messages to your webhook
   c) Messages are then stored in your database
   
3. WEBHOOK SETUP:
   - URL: https://yourdomain.com/api/v1/whatsapp/webhook
   - Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hera-whatsapp-webhook-2024-secure-token'}
   - Subscribe to: messages, message_status
   
4. TESTING LOCALLY:
   - Use ngrok to expose local webhook: ngrok http 3002
   - Set webhook URL to: https://your-ngrok-url.ngrok.io/api/v1/whatsapp/webhook
   
5. CURRENT STATUS:
   - Phone Number: ${results.phoneInfo?.display_phone_number || 'Unknown'}
   - Business Name: ${results.phoneInfo?.verified_name || 'Unknown'}
   - Quality Rating: ${results.phoneInfo?.quality_rating || 'Unknown'}
`

    return NextResponse.json({
      success: true,
      data: results,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/v1/whatsapp/webhook`,
      setupInstructions: [
        '1. Go to Meta Business Manager > WhatsApp > Configuration',
        '2. Set Webhook URL (use ngrok for local testing)',
        '3. Set Verify Token: ' +
          (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hera-whatsapp-webhook-2024-secure-token'),
        '4. Subscribe to: messages, message_status',
        '5. Save and verify webhook',
        '6. Send a test message to your WhatsApp number',
        '7. Check /whatsapp-messages to see it appear'
      ]
    })
  } catch (error) {
    console.error('Fetch real messages error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch from WhatsApp API',
        details: error.message,
        note: 'WhatsApp Business API requires webhook setup to receive messages'
      },
      { status: 500 }
    )
  }
}
