/**
 * Check WhatsApp webhook configuration and status
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hera-whatsapp-webhook-2024-secure-token'
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1112225330318984'

  const status = {
    credentials: {
      hasAccessToken: !!accessToken,
      hasPhoneNumberId: !!phoneNumberId,
      hasBusinessAccountId: !!businessAccountId,
      phoneNumberId: phoneNumberId ? `${phoneNumberId.substring(0, 5)}...` : 'Not set',
      accessToken: accessToken ? 'Set (hidden)' : 'Not set'
    },
    webhook: {
      verifyToken: webhookVerifyToken,
      expectedUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/v1/whatsapp/webhook`,
      instructions: [
        '1. Go to Meta Business Manager > WhatsApp > Configuration',
        '2. Set Webhook URL to the expected URL above',
        `3. Set Verify Token to: ${webhookVerifyToken}`,
        '4. Subscribe to these webhook fields: messages, message_status',
        '5. Save and verify the webhook',
        '6. Send a test message to your WhatsApp number'
      ]
    },
    testEndpoints: [
      {
        name: 'Test Send Message',
        method: 'POST',
        url: '/api/v1/whatsapp/test-send',
        body: {
          to: '+1234567890',
          message: 'Hello from HERA!'
        }
      },
      {
        name: 'Fetch Real Messages',
        method: 'GET',
        url: '/api/v1/whatsapp/fetch-real-messages',
        description: 'Check if we can connect to WhatsApp API'
      }
    ],
    database: {
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      note: 'Without Supabase, messages cannot be stored. Only demo data will be shown.'
    }
  }

  // If access token is available, try to get phone number details
  if (accessToken && phoneNumberId) {
    try {
      const phoneResponse = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (phoneResponse.ok) {
        const phoneData = await phoneResponse.json()
        status.credentials.phoneDetails = {
          displayPhoneNumber: phoneData.display_phone_number,
          verifiedName: phoneData.verified_name,
          qualityRating: phoneData.quality_rating
        }
      } else {
        const errorData = await phoneResponse.json()
        status.credentials.apiError = errorData.error?.message || 'Unable to fetch phone details'
      }
    } catch (error) {
      status.credentials.apiError = 'Failed to connect to WhatsApp API'
    }
  }

  return NextResponse.json(status)
}