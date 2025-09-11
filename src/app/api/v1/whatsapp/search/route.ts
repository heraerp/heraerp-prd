import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const conversationId = searchParams.get('conversationId')
  const type = searchParams.get('type') || 'all' // all, starred, media
  
  if (!query && type === 'all') {
    return NextResponse.json(
      { error: 'Search query required' },
      { status: 400 }
    )
  }
  
  try {
    let messagesQuery = supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
    
    // Filter by conversation if specified
    if (conversationId) {
      messagesQuery = messagesQuery.or(
        `source_entity_id.eq.${conversationId},target_entity_id.eq.${conversationId}`
      )
    }
    
    // Search in message text
    if (query) {
      messagesQuery = messagesQuery.ilike('metadata->>text', `%${query}%`)
    }
    
    // Filter by type
    if (type === 'media') {
      messagesQuery = messagesQuery.in(
        'metadata->>message_type', 
        ['image', 'video', 'document', 'audio']
      )
    }
    
    // Exclude deleted messages
    messagesQuery = messagesQuery.or(
      'metadata->>deleted.is.null,metadata->>deleted.eq.false'
    )
    
    const { data: messages, error: msgError } = await messagesQuery
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (msgError) throw msgError
    
    // Get starred messages if needed
    let starredMessageIds: string[] = []
    if (type === 'starred' || type === 'all') {
      const { data: starredRelations } = await supabase
        .from('core_relationships')
        .select('from_entity_id')
        .eq('organization_id', organizationId)
        .eq('relationship_type', 'starred_message')
      
      starredMessageIds = starredRelations?.map(r => r.from_entity_id) || []
    }
    
    // Filter starred messages if type is 'starred'
    let filteredMessages = messages || []
    if (type === 'starred') {
      filteredMessages = filteredMessages.filter(msg => 
        starredMessageIds.includes(msg.id)
      )
    }
    
    // Get conversation details
    const conversationIds = new Set<string>()
    filteredMessages.forEach(msg => {
      if (msg.source_entity_id) conversationIds.add(msg.source_entity_id)
      if (msg.target_entity_id) conversationIds.add(msg.target_entity_id)
    })
    
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .in('id', Array.from(conversationIds))
    
    // Enhance messages with conversation and star data
    const enhancedMessages = filteredMessages.map(msg => {
      const conversation = conversations?.find(conv => 
        conv.id === msg.source_entity_id || conv.id === msg.target_entity_id
      )
      
      return {
        id: msg.id,
        text: (msg.metadata as any)?.text,
        direction: msg.source_entity_id === conversation?.id ? 'inbound' : 'outbound',
        created_at: msg.created_at,
        conversation: conversation ? {
          id: conversation.id,
          name: conversation.entity_name,
          phone: (conversation.metadata as any)?.phone
        } : null,
        isStarred: starredMessageIds.includes(msg.id),
        messageType: (msg.metadata as any)?.message_type,
        mediaUrl: (msg.metadata as any)?.media_url,
        status: (msg.metadata as any)?.status
      }
    })
    
    // Group by conversation for better UX
    const groupedResults: { [key: string]: any } = {}
    enhancedMessages.forEach(msg => {
      const convId = msg.conversation?.id || 'unknown'
      if (!groupedResults[convId]) {
        groupedResults[convId] = {
          conversation: msg.conversation,
          messages: []
        }
      }
      groupedResults[convId].messages.push(msg)
    })
    
    return NextResponse.json({
      status: 'success',
      data: {
        totalResults: enhancedMessages.length,
        results: type === 'all' || type === 'media' 
          ? enhancedMessages 
          : Object.values(groupedResults),
        query,
        type
      }
    })
    
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}