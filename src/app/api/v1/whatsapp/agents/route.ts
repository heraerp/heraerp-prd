import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Get available agents
export async function GET(request: NextRequest) {
  try {
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
    
    // Get all employees who can handle WhatsApp (agents)
    const { data: agents, error } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!entity_id(
          field_name,
          field_value_text,
          field_value_boolean
        )
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('metadata->can_handle_whatsapp', true)
      .order('entity_name')
    
    if (error) throw error
    
    // Format agent data
    const formattedAgents = agents?.map(agent => {
      const dynamicData = agent.core_dynamic_data || []
      const status = dynamicData.find((d: any) => d.field_name === 'availability_status')?.field_value_text || 'available'
      const activeChats = dynamicData.find((d: any) => d.field_name === 'active_chats')?.field_value_text || '0'
      
      return {
        id: agent.id,
        name: agent.entity_name,
        code: agent.entity_code,
        status,
        activeChats: parseInt(activeChats),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${agent.entity_name}`,
        skills: agent.metadata?.skills || [],
        languages: agent.metadata?.languages || ['en'],
        maxChats: agent.metadata?.max_concurrent_chats || 10
      }
    }) || []
    
    return NextResponse.json({
      status: 'success',
      agents: formattedAgents
    })
    
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

// Assign agent to conversation
export async function POST(request: NextRequest) {
  try {
    const { conversationId, agentId, reason } = await request.json()
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
    
    // Update conversation with agent assignment
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        metadata: supabase.rpc('jsonb_set', [
          'metadata',
          '{agent_id}',
          `"${agentId}"`,
          true
        ])
      })
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
    
    if (updateError) throw updateError
    
    // Create assignment relationship
    const { error: relError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: organizationId,
        from_entity_id: conversationId,
        to_entity_id: agentId,
        relationship_type: 'assigned_to',
        smart_code: 'HERA.WHATSAPP.AGENT.ASSIGNED.V1',
        relationship_data: {
          assigned_at: new Date().toISOString(),
          reason: reason || 'manual_assignment',
          assigned_by: request.headers.get('x-agent-id') || 'system'
        }
      })
    
    if (relError) throw relError
    
    // Create handoff audit transaction
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_handoff',
        transaction_code: `HANDOFF-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        source_entity_id: conversationId,
        target_entity_id: agentId,
        smart_code: 'HERA.WHATSAPP.HANDOFF.HUMAN.V1',
        metadata: {
          action: 'agent_assigned',
          conversation_id: conversationId,
          agent_id: agentId,
          reason,
          assigned_by: request.headers.get('x-agent-id') || 'system'
        }
      })
    
    // Send notification message to conversation
    await sendSystemMessage(conversationId, 
      `You've been connected with a human agent. They'll be with you shortly.`,
      'agent_assigned'
    )
    
    return NextResponse.json({
      status: 'success',
      message: 'Agent assigned successfully'
    })
    
  } catch (error) {
    console.error('Error assigning agent:', error)
    return NextResponse.json(
      { error: 'Failed to assign agent' },
      { status: 500 }
    )
  }
}

// Unassign agent from conversation
export async function DELETE(request: NextRequest) {
  try {
    const { conversationId } = await request.json()
    const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
    
    // Get current assignment
    const { data: conversation } = await supabase
      .from('core_entities')
      .select('metadata')
      .eq('id', conversationId)
      .single()
    
    const agentId = conversation?.metadata?.agent_id
    
    // Remove agent from conversation
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        metadata: supabase.rpc('jsonb_set', [
          'metadata',
          '{agent_id}',
          'null',
          false
        ])
      })
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
    
    if (updateError) throw updateError
    
    // Mark relationship as inactive
    if (agentId) {
      await supabase
        .from('core_relationships')
        .update({
          is_active: false,
          metadata: supabase.rpc('jsonb_set', [
            'relationship_data',
            '{ended_at}',
            `"${new Date().toISOString()}"`,
            true
          ])
        })
        .eq('from_entity_id', conversationId)
        .eq('to_entity_id', agentId)
        .eq('relationship_type', 'assigned_to')
    }
    
    // Create audit transaction
    await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_handoff',
        transaction_code: `HANDOFF-END-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        source_entity_id: conversationId,
        target_entity_id: agentId,
        smart_code: 'HERA.WHATSAPP.HANDOFF.RELEASED.V1',
        metadata: {
          action: 'agent_unassigned',
          conversation_id: conversationId,
          agent_id: agentId,
          unassigned_by: request.headers.get('x-agent-id') || 'system'
        }
      })
    
    // Send notification
    await sendSystemMessage(conversationId, 
      `The agent has ended the conversation. You can continue chatting with our automated assistant.`,
      'agent_unassigned'
    )
    
    return NextResponse.json({
      status: 'success',
      message: 'Agent unassigned successfully'
    })
    
  } catch (error) {
    console.error('Error unassigning agent:', error)
    return NextResponse.json(
      { error: 'Failed to unassign agent' },
      { status: 500 }
    )
  }
}

// Helper function to send system messages
async function sendSystemMessage(conversationId: string, text: string, type: string) {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c'
  
  await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'whatsapp_message',
      transaction_code: `SYS-MSG-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      target_entity_id: conversationId,
      smart_code: 'HERA.WHATSAPP.MSG.SYSTEM.V1',
      metadata: {
        message_id: `system_${Date.now()}`,
        text,
        direction: 'outbound',
        message_type: 'system',
        system_type: type,
        timestamp: new Date().toISOString()
      }
    })
}