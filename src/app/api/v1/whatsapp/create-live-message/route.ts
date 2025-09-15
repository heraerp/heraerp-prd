import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone') || '+447515668004'
    const message = searchParams.get('message') || 'Hello, I need a haircut appointment'
    const direction = searchParams.get('direction') || 'inbound'

    const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Hair Talkz
    const waId = phone.replace(/[^\d]/g, '') // Remove non-digits

    console.log('📱 Creating live WhatsApp message:', {
      phone,
      message,
      direction,
      waId
    })

    // Create WhatsApp message transaction
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `WA-MSG-${Date.now()}`,
        smart_code:
          direction === 'inbound'
            ? 'HERA.CRM.MSG.WHATSAPP.INBOUND.v1'
            : 'HERA.CRM.MSG.WHATSAPP.OUTBOUND.v1',
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        metadata: {
          direction,
          text: message,
          content: message,
          message: message,
          from: waId,
          wa_id: waId,
          phone: phone,
          message_id: `wamid.${Date.now()}`,
          timestamp: new Date().toISOString(),
          is_live: true,
          created_via: 'api_simulator'
        }
      })
      .select()
      .single()

    if (txnError) {
      console.error('Transaction creation error:', txnError)
      throw txnError
    }

    console.log('✅ Message created:', transaction.id)

    // Also ensure we have a customer for this phone
    const { data: existingCustomer } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .like('metadata->>wa_id', `%${waId}%`)
      .single()

    let customer = existingCustomer

    if (!customer) {
      console.log('Creating new customer for:', waId)
      const { data: newCustomer, error: custError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'customer',
          entity_name: phone.includes('447515668004')
            ? 'UK User'
            : phone.includes('918883333144')
              ? 'India User'
              : `WhatsApp User ${waId}`,
          entity_code: `CUST-WA-${waId}`,
          metadata: {
            wa_id: waId,
            phone: phone,
            source: 'whatsapp'
          }
        })
        .select()
        .single()

      if (custError) {
        console.error('Customer creation error:', custError)
      } else {
        customer = newCustomer
      }
    }

    // Ensure we have a conversation
    const { data: existingConv } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .like('metadata->>wa_id', `%${waId}%`)
      .single()

    let conversation = existingConv

    if (!conversation) {
      console.log('Creating new conversation for:', waId)
      const { data: newConv, error: convError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'whatsapp_conversation',
          entity_name: `Chat with ${customer?.entity_name || waId}`,
          entity_code: `CONV-WA-${waId}`,
          metadata: {
            wa_id: waId,
            phone: phone,
            status: 'active',
            window_state: 'open'
          }
        })
        .select()
        .single()

      if (convError) {
        console.error('Conversation creation error:', convError)
      } else {
        conversation = newConv
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Live WhatsApp message created successfully',
      data: {
        transaction_id: transaction.id,
        customer_id: customer?.id,
        conversation_id: conversation?.id,
        phone,
        message,
        direction
      },
      next_steps: [
        'Refresh /salon-data/whatsapp to see the message',
        'The message should appear immediately',
        'You can create more messages by changing the phone/message parameters'
      ]
    })
  } catch (error) {
    console.error('Failed to create live message:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
