import { NextRequest, NextResponse } from 'next/server'
import { createAnalyticsChatStorage } from '@/lib/analytics-chat-storage'
// import { getUserContext } from '@/lib/api-utils'; // Disabled for testing

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const storage = createAnalyticsChatStorage(organizationId)
    const { searchParams } = new URL(request.url)
    const deleteType = searchParams.get('type') || 'message'

    if (deleteType === 'session') {
      // Delete entire session
      await storage.deleteSession(resolvedParams.id)
    } else if (deleteType === 'all') {
      // Clear all history
      await storage.clearAllHistory()
    } else {
      // Delete single message
      await storage.deleteMessage(resolvedParams.id)
    }

    return NextResponse.json({
      success: true,
      deleted: resolvedParams.id,
      type: deleteType
    })
  } catch (error) {
    console.error('Failed to delete:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
