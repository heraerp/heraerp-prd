import { NextRequest, NextResponse } from 'next/server'

// Simple webhook logger to debug incoming webhooks
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook test endpoint',
    instructions: 'Send POST requests to test webhook reception'
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log the entire webhook payload
    console.log('🔔 WEBHOOK TEST - Received at:', new Date().toISOString())
    console.log('📦 Headers:', Object.fromEntries(request.headers.entries()))
    console.log('📦 Body:', JSON.stringify(body, null, 2))

    // Check if it's a WhatsApp webhook
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    if (messages && messages.length > 0) {
      const message = messages[0]
      console.log('💬 WhatsApp Message Detected:')
      console.log('   From:', message.from)
      console.log('   Text:', message.text?.body)
      console.log('   Type:', message.type)
      console.log('   ID:', message.id)

      // Check if it contains "BOOK"
      if (message.text?.body?.toUpperCase().includes('BOOK')) {
        console.log('🎯 BOOK MESSAGE DETECTED!')
      }
    }

    // Always return 200 OK to WhatsApp
    return NextResponse.json({
      status: 'ok',
      received: true,
      timestamp: new Date().toISOString(),
      message_found: !!messages?.length,
      contains_book: messages?.[0]?.text?.body?.toUpperCase().includes('BOOK') || false
    })
  } catch (error) {
    console.error('❌ Webhook test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    ) // Still return 200 to prevent WhatsApp retries
  }
}
