import { NextRequest, NextResponse } from 'next/server'
import { createAnalyticsChatStorage } from '@/lib/analytics-chat-storage'
// import { getUserContext } from '@/lib/api-utils'; // Disabled for testing

export async function POST(request: NextRequest) {
  try {
    // const userContext = await getUserContext(request);
    // For testing - using default organization ID
    const organizationId = '550e8400-e29b-41d4-a716-446655440000'

    /*
    if (!userContext || !userContext.organizationId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    */

    const body = await request.json()
    const { session_id, message_type, content, metadata } = body

    if (!session_id || !message_type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, message_type, content' },
        { status: 400 }
      )
    }

    const storage = createAnalyticsChatStorage(organizationId)

    const messageId = await storage.saveMessage({
      session_id,
      message_type,
      content,
      timestamp: new Date().toISOString(),
      metadata: {
        user_id: 'test-user', // userContext.userId - commented for testing
        ...metadata
      }
    })

    return NextResponse.json({
      success: true,
      messageId
    })
  } catch (error) {
    console.error('Failed to save chat message:', error)
    return NextResponse.json(
      {
        error: 'Failed to save message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
