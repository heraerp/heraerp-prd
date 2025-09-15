import { NextRequest, NextResponse } from 'next/server'
import { BPOCommunicationEntity, BPOMessageEntity, BPOUserRole } from '@/lib/bpo/bpo-entities'

// Mock storage
let mockThreads: Array<BPOCommunicationEntity & { messages?: BPOMessageEntity[] }> = [
  {
    entity_id: 'thread-001',
    entity_type: 'bpo_communication',
    entity_name: 'INV-2024-001 Processing Query',
    smart_code: 'HERA.BPO.COMM.THREAD.v1',
    invoice_id: 'inv-001',
    thread_status: 'active',
    priority: 'medium',
    head_office_user_id: 'ho-user-1',
    back_office_user_id: 'bo-user-1',
    created_by: 'bo-user-1',
    created_at: new Date('2024-08-11T10:30:00'),
    last_message_at: new Date('2024-08-11T11:45:00'),
    message_count: 4,
    unread_count_ho: 1,
    unread_count_bo: 0,
    messages: [
      {
        entity_id: 'msg-001',
        entity_type: 'bpo_message',
        entity_name: 'Initial Query',
        smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
        thread_id: 'thread-001',
        sender_id: 'bo-user-1',
        sender_role: 'back-office',
        message_content:
          "Hi Sarah, I'm processing INV-2024-001 and noticed the PO number format is unusual. Can you confirm this is correct?",
        message_type: 'query',
        created_at: new Date('2024-08-11T10:30:00'),
        is_read: true
      },
      {
        entity_id: 'msg-002',
        entity_type: 'bpo_message',
        entity_name: 'Response',
        smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
        thread_id: 'thread-001',
        sender_id: 'ho-user-1',
        sender_role: 'head-office',
        message_content:
          "Yes, that's correct. We changed the PO numbering system in Q3 for better tracking.",
        message_type: 'response',
        created_at: new Date('2024-08-11T10:45:00'),
        is_read: true
      }
    ]
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (action === 'threads') {
      // Return all threads for user
      const userThreads = mockThreads.filter(
        thread =>
          thread.head_office_user_id === userId || thread.back_office_user_id === userId || !userId // Return all if no user filter
      )

      return NextResponse.json({
        success: true,
        data: userThreads.map(thread => ({
          ...thread,
          messages: undefined // Don't include messages in thread list
        })),
        count: userThreads.length
      })
    }

    if (threadId) {
      // Return specific thread with messages
      const thread = mockThreads.find(t => t.entity_id === threadId)
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: thread
      })
    }

    // Return all threads
    return NextResponse.json({
      success: true,
      data: mockThreads,
      count: mockThreads.length
    })
  } catch (error) {
    console.error('Error retrieving BPO communication:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve communication data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create_thread') {
      // Create new communication thread
      const newThread: BPOCommunicationEntity = {
        entity_id: `thread-${Date.now()}`,
        entity_type: 'bpo_communication',
        entity_name: data.entity_name || `${data.invoice_id} Discussion`,
        smart_code: 'HERA.BPO.COMM.THREAD.v1',
        invoice_id: data.invoice_id,
        thread_status: 'active',
        priority: data.priority || 'medium',
        head_office_user_id: data.head_office_user_id,
        back_office_user_id: data.back_office_user_id,
        created_by: data.created_by,
        created_at: new Date(),
        last_message_at: new Date(),
        message_count: 0,
        unread_count_ho: 0,
        unread_count_bo: 0
      }

      mockThreads.push({ ...newThread, messages: [] })

      return NextResponse.json({
        success: true,
        data: newThread,
        message: 'Communication thread created successfully'
      })
    }

    if (action === 'send_message') {
      // Send message to existing thread
      const {
        thread_id,
        sender_id,
        sender_role,
        message_content,
        message_type = 'text',
        attachments
      } = data

      const thread = mockThreads.find(t => t.entity_id === thread_id)
      if (!thread) {
        return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
      }

      const newMessage: BPOMessageEntity = {
        entity_id: `msg-${Date.now()}`,
        entity_type: 'bpo_message',
        entity_name: message_content.substring(0, 50) + '...',
        smart_code: 'HERA.BPO.COMM.MESSAGE.v1',
        thread_id,
        sender_id,
        sender_role: sender_role as BPOUserRole,
        message_content,
        message_type: message_type as any,
        created_at: new Date(),
        is_read: false,
        attachments: attachments || []
      }

      // Add message to thread
      if (!thread.messages) thread.messages = []
      thread.messages.push(newMessage)

      // Update thread metadata
      thread.last_message_at = new Date()
      thread.message_count = (thread.message_count || 0) + 1

      // Update unread counts
      if (sender_role === 'head-office') {
        thread.unread_count_bo = (thread.unread_count_bo || 0) + 1
      } else {
        thread.unread_count_ho = (thread.unread_count_ho || 0) + 1
      }

      return NextResponse.json({
        success: true,
        data: newMessage,
        message: 'Message sent successfully'
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 })
  } catch (error) {
    console.error('Error creating BPO communication:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create communication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { thread_id, action, data } = body

    const thread = mockThreads.find(t => t.entity_id === thread_id)
    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 })
    }

    if (action === 'mark_read') {
      // Mark messages as read
      const { user_id, user_role } = data

      if (thread.messages) {
        thread.messages.forEach(message => {
          if (message.sender_id !== user_id) {
            message.is_read = true
            message.read_at = new Date()
          }
        })
      }

      // Reset unread counts
      if (user_role === 'head-office') {
        thread.unread_count_ho = 0
      } else {
        thread.unread_count_bo = 0
      }

      return NextResponse.json({
        success: true,
        message: 'Messages marked as read'
      })
    }

    if (action === 'close_thread') {
      // Close communication thread
      thread.thread_status = 'resolved'

      return NextResponse.json({
        success: true,
        message: 'Thread closed successfully'
      })
    }

    if (action === 'update_priority') {
      // Update thread priority
      thread.priority = data.priority

      return NextResponse.json({
        success: true,
        message: 'Thread priority updated'
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 })
  } catch (error) {
    console.error('Error updating BPO communication:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update communication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const threadId = searchParams.get('threadId')
    const messageId = searchParams.get('messageId')

    if (messageId) {
      // Delete specific message
      const thread = mockThreads.find(t => t.messages?.some(m => m.entity_id === messageId))

      if (thread && thread.messages) {
        thread.messages = thread.messages.filter(m => m.entity_id !== messageId)
        thread.message_count = thread.messages.length

        return NextResponse.json({
          success: true,
          message: 'Message deleted successfully'
        })
      }
    }

    if (threadId) {
      // Delete entire thread
      const threadIndex = mockThreads.findIndex(t => t.entity_id === threadId)

      if (threadIndex > -1) {
        mockThreads.splice(threadIndex, 1)

        return NextResponse.json({
          success: true,
          message: 'Thread deleted successfully'
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'Thread or message not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error deleting BPO communication:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete communication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
