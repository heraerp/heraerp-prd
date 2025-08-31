import { NextRequest, NextResponse } from 'next/server';
import { createAnalyticsChatStorage } from '@/lib/analytics-chat-storage';
// import { getUserContext } from '@/lib/api-utils'; // Disabled for testing

export async function GET(request: NextRequest) {
  try {
    // const userContext = await getUserContext(request);
    // For testing - using default organization ID
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    /*
    if (!userContext || !userContext.organizationId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    */

    const storage = createAnalyticsChatStorage(organizationId);
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const sessions = await storage.getChatSessions({ limit, offset });

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
      hasMore: sessions.length === limit
    });
  } catch (error) {
    console.error('Failed to get chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve sessions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // const userContext = await getUserContext(request);
    // For testing - using default organization ID
    const organizationId = '550e8400-e29b-41d4-a716-446655440000';
    
    /*
    if (!userContext || !userContext.organizationId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    */

    const storage = createAnalyticsChatStorage(organizationId);
    const sessionId = await storage.startSession();

    return NextResponse.json({
      success: true,
      sessionId
    });
  } catch (error) {
    console.error('Failed to start session:', error);
    return NextResponse.json(
      { error: 'Failed to start session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}