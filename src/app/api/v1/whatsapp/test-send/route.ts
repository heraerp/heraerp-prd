/**
 * Test endpoint for sending WhatsApp messages
 * This allows testing the WhatsApp API integration directly
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body

    if (!to || !message) {
      return NextResponse.json({
        success: false,
        error: 'Please provide "to" (phone number) and "message" fields'
      }, { status: 400 })
    }

    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp credentials not configured',
        details: {
          hasAccessToken: !!accessToken,
          hasPhoneNumberId: !!phoneNumberId
        }
      }, { status: 500 })
    }

    // Clean phone number (remove non-digits)
    const cleanPhone = to.replace(/\D/g, '')

    console.log('Sending WhatsApp message:', {
      to: cleanPhone,
      message: message.substring(0, 50) + '...',
      phoneNumberId
    })

    // Send message via WhatsApp API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    )

    const result = await whatsappResponse.json()

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', result)
      return NextResponse.json({
        success: false,
        error: 'WhatsApp API error',
        details: result
      }, { status: 500 })
    }

    console.log('WhatsApp message sent successfully:', result)

    return NextResponse.json({
      success: true,
      data: {
        messageId: result.messages?.[0]?.id,
        status: 'sent',
        to: cleanPhone
      }
    })
  } catch (error) {
    console.error('Error sending test message:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send test message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}