import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log the received webhook data
    console.log('TEST WEBHOOK RECEIVED:', JSON.stringify(body, null, 2))
    
    // Check if it's a WhatsApp message
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages
    
    if (messages && messages.length > 0) {
      const message = messages[0]
      console.log('MESSAGE DETAILS:', {
        from: message.from,
        text: message.text?.body,
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString()
      })
      
      // If it's a BOOK message, log it specially
      if (message.text?.body?.toUpperCase().includes('BOOK')) {
        console.log('🎯 BOOK MESSAGE RECEIVED FROM:', message.from)
      }
    }
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Webhook received (test endpoint)',
      hasMessages: !!(messages && messages.length > 0)
    })
  } catch (error) {
    console.error('TEST WEBHOOK ERROR:', error)
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/v1/whatsapp/test-webhook',
    purpose: 'Test webhook without database',
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  })
}