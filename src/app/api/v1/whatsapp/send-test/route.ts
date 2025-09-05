/**
 * Send a test WhatsApp message
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message } = body
    
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '712631301940690'
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'WhatsApp access token not configured' },
        { status: 500 }
      )
    }
    
    // Format phone number - remove + and spaces
    const formattedPhone = to.replace(/[+\s]/g, '')
    
    // Send text message via WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: {
            body: message || 'Hello from HERA Salon! This is a test message.'
          }
        })
      }
    )
    
    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: 'Failed to send message',
          details: result.error || result
        },
        { status: response.status }
      )
    }
    
    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
      to: formattedPhone,
      message: 'Test message sent successfully!'
    })
    
  } catch (error) {
    console.error('Send test message error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}