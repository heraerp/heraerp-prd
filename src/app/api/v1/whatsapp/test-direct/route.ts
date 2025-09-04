/**
 * Direct WhatsApp API Test Endpoint
 * Send a message directly through Meta's WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    // Validate required environment variables
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '712631301940690'
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || 'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD'

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp API credentials not configured',
          details: {
            phoneNumberId: !!phoneNumberId,
            accessToken: !!accessToken
          }
        },
        { status: 400 }
      )
    }

    // Validate input
    if (!to || !message) {
      return NextResponse.json(
        { success: false, error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Clean phone number (remove any non-digit characters except +)
    const cleanedPhoneNumber = to.replace(/[^\d+]/g, '')
    if (!cleanedPhoneNumber.startsWith('+')) {
      return NextResponse.json(
        { success: false, error: 'Phone number must include country code (e.g., +971501234567)' },
        { status: 400 }
      )
    }

    // Prepare WhatsApp API request
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    
    const payload = {
      messaging_product: 'whatsapp',
      to: cleanedPhoneNumber.replace('+', ''), // Remove + for API call
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    }

    console.log('Sending WhatsApp message:', {
      url: whatsappApiUrl,
      to: cleanedPhoneNumber,
      message: message.substring(0, 50) + '...'
    })

    // Make API call to WhatsApp
    const whatsappResponse = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseData = await whatsappResponse.json()

    if (!whatsappResponse.ok) {
      console.error('WhatsApp API error:', responseData)
      return NextResponse.json(
        { 
          success: false, 
          error: 'WhatsApp API error',
          details: responseData
        },
        { status: whatsappResponse.status }
      )
    }

    console.log('WhatsApp API success:', responseData)

    // Extract message ID
    const messageId = responseData.messages?.[0]?.id

    return NextResponse.json({
      success: true,
      data: {
        whatsapp_message_id: messageId,
        to: cleanedPhoneNumber,
        message: message,
        api_response: responseData,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Direct WhatsApp API test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}