import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '44d2d8f8-167d-46a7-a704-c0e5435863d6'
  
  try {
    // Step 1: Get all WhatsApp conversations
    const { data: conversations, error: convError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'whatsapp_conversation')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    
    if (convError) throw convError
    
    // Step 2: Get all WhatsApp messages (transactions)
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .limit(100)
    
    if (txnError) throw txnError
    
    // Step 3: Get transaction IDs
    const transactionIds = transactions?.map(t => t.id) || []
    
    // Step 4: Get all dynamic data for these transactions
    const { data: dynamicData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_type', 'transaction')
      .in('entity_id', transactionIds)
    
    if (dynError) throw dynError
    
    // Step 5: Get all relationships for these transactions
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .or(`from_entity_id.in.(${transactionIds.join(',')}),to_entity_id.in.(${transactionIds.join(',')})`)
    
    if (relError) throw relError
    
    // Step 6: Get all customers referenced in relationships
    const customerIds = new Set<string>()
    relationships?.forEach(rel => {
      if (rel.relationship_type === 'message_from') {
        customerIds.add(rel.to_entity_id)
      }
    })
    
    const { data: customers, error: custError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'customer')
      .in('id', Array.from(customerIds))
    
    if (custError) throw custError
    
    // Step 7: Build message objects
    const messages = transactions?.map(txn => {
      // Get dynamic data for this transaction
      const txnDynamicData = dynamicData?.filter(d => d.entity_id === txn.id) || []
      const dynamicFields: Record<string, any> = {}
      txnDynamicData.forEach(d => {
        dynamicFields[d.field_name] = d.field_value_text || d.field_value_json
      })
      
      // Get relationships for this transaction
      const txnRelationships = relationships?.filter(r => 
        r.from_entity_id === txn.id || r.to_entity_id === txn.id
      ) || []
      
      // Find customer
      const customerRel = txnRelationships.find(r => r.relationship_type === 'message_from')
      const customerId = customerRel?.to_entity_id
      const customer = customers?.find(c => c.id === customerId)
      
      // Find conversation
      const convRel = txnRelationships.find(r => r.relationship_type === 'message_in')
      const conversationId = convRel?.to_entity_id
      const conversation = conversations?.find(c => c.id === conversationId)
      
      // Determine direction from smart code
      const direction = txn.smart_code?.includes('RECEIVED') ? 'inbound' : 'outbound'
      
      return {
        id: txn.id,
        text: dynamicFields.text || '',
        direction,
        wa_id: dynamicFields.wa_id || customer?.metadata?.wa_id || '',
        phone: customer?.metadata?.phone || '',
        customerName: customer?.entity_name || 'Unknown',
        conversationId,
        conversationName: conversation?.entity_name || '',
        waba_message_id: dynamicFields.waba_message_id || txn.external_id,
        created_at: txn.created_at,
        occurred_at: txn.occurred_at,
        smart_code: txn.smart_code,
        metadata: {
          ...txn.metadata,
          ...dynamicFields
        }
      }
    }) || []
    
    // Step 8: Group messages by conversation
    const conversationsWithMessages = conversations?.map(conv => {
      const convMessages = messages.filter(msg => msg.conversationId === conv.id)
      
      return {
        conversation: {
          id: conv.id,
          entity_code: conv.entity_code,
          entity_name: conv.entity_name,
          metadata: conv.metadata,
          created_at: conv.created_at
        },
        messages: convMessages,
        messageCount: convMessages.length,
        lastMessage: convMessages[0] || null
      }
    }) || []
    
    return NextResponse.json({
      status: 'success',
      data: {
        totalConversations: conversations?.length || 0,
        totalMessages: messages.length,
        conversationsWithMessages,
        allMessages: messages
      }
    })
    
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}