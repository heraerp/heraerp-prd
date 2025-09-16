import { NextRequest, NextResponse } from 'next/server'
import { createAnalyticsChatStorage } from '@/src/lib/analytics-chat-storage'
// import { getUserContext } from '@/src/lib/api-utils'; // Disabled for testing

export async function GET(request: NextRequest) {
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

    const storage = createAnalyticsChatStorage(organizationId)
    const { searchParams } = new URL(request.url)

    const session_id = searchParams.get('session_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let messages

    if (search) {
      // Search functionality
      messages = await storage.searchChatHistory(search, { limit, offset })
    } else {
      // Regular history retrieval
      messages = await storage.getChatHistory({
        session_id: session_id || undefined,
        limit,
        offset
      })
    }

    return NextResponse.json({
      success: true,
      messages,
      count: messages.length,
      hasMore: messages.length === limit
    })
  } catch (error) {
    console.error('Failed to get chat history:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
