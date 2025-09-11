import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  
  try {
    // Get conversations with enhanced metadata
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
    
    if (convError) throw convError
    
    // Get all messages
    const { data: messages, error: msgError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (msgError) throw msgError
    
    // Get conversation states (pinned, archived, etc.) from relationships
    const { data: convStates, error: stateError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .in('relationship_type', ['pinned_conversation', 'archived_conversation'])
    
    // Get starred messages
    const { data: starredMessages, error: starError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('relationship_type', 'starred_message')
    
    // Process conversations with all metadata
    const enhancedConversations = conversations?.map(conv => {
      const convMessages = messages?.filter(msg => 
        msg.source_entity_id === conv.id || msg.target_entity_id === conv.id
      ) || []
      
      // Get unread count (inbound messages without read status)
      const unreadCount = convMessages.filter(msg => 
        msg.source_entity_id === conv.id && // inbound
        (!(msg.metadata as any)?.status || msg.metadata.status !== 'read')
      ).length
      
      // Get conversation states
      const isPinned = convStates?.some(state => 
        state.from_entity_id === conv.id && state.relationship_type === 'pinned_conversation'
      )
      const isArchived = convStates?.some(state => 
        state.from_entity_id === conv.id && state.relationship_type === 'archived_conversation'
      )
      
      // Add starred status to messages
      const messagesWithStars = convMessages.map(msg => ({
        ...msg,
        isStarred: starredMessages?.some(star => star.from_entity_id === msg.id)
      }))
      
      return {
        id: conv.id,
        entity_name: conv.entity_name,
        entity_code: conv.entity_code,
        metadata: {
          ...conv.metadata,
          is_online: Math.random() > 0.7, // Mock online status
          last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          about: (conv.metadata as any)?.about || 'Hey there! I am using WhatsApp.'
        },
        lastMessage: messagesWithStars[0] || null,
        messages: messagesWithStars,
        unreadCount,
        isPinned,
        isArchived,
        updated_at: convMessages[0]?.created_at || conv.created_at
      }
    }) || []
    
    // Sort by last message time
    enhancedConversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    
    return NextResponse.json({
      status: 'success',
      data: {
        conversations: enhancedConversations,
        totalConversations: enhancedConversations.length,
        totalMessages: messages?.length || 0
      }
    })
    
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  
  try {
    const body = await request.json()
    const { conversationId, action, value } = body
    
    switch (action) {
      case 'pin':
      case 'unpin':
        if (action === 'pin') {
          // Create pin relationship
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: organizationId,
              from_entity_id: conversationId,
              to_entity_id: conversationId, // self-referencing for state
              relationship_type: 'pinned_conversation',
              smart_code: 'HERA.WHATSAPP.CONV.PINNED.v1',
              metadata: { pinned_at: new Date().toISOString() }
            })
        } else {
          // Remove pin relationship
          await supabase
            .from('core_relationships')
            .delete()
            .eq('from_entity_id', conversationId)
            .eq('relationship_type', 'pinned_conversation')
            .eq('organization_id', organizationId)
        }
        break
        
      case 'archive':
      case 'unarchive':
        if (action === 'archive') {
          // Create archive relationship
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: organizationId,
              from_entity_id: conversationId,
              to_entity_id: conversationId,
              relationship_type: 'archived_conversation',
              smart_code: 'HERA.WHATSAPP.CONV.ARCHIVED.v1',
              metadata: { archived_at: new Date().toISOString() }
            })
        } else {
          // Remove archive relationship
          await supabase
            .from('core_relationships')
            .delete()
            .eq('from_entity_id', conversationId)
            .eq('relationship_type', 'archived_conversation')
            .eq('organization_id', organizationId)
        }
        break
    }
    
    return NextResponse.json({ status: 'success' })
    
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}