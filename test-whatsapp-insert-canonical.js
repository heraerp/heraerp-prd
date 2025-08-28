require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestMessage() {
  console.log('🚀 Inserting test WhatsApp message using canonical structure...\n');
  
  try {
    // 1. Create/ensure Channel entity
    const channelCode = 'WABA-117606954726963';
    let { data: channel } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'channel')
      .eq('entity_code', channelCode)
      .single();
    
    if (!channel) {
      const { data: newChannel, error: channelError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'channel',
          entity_name: 'WhatsApp Business 117606954726963',
          entity_code: channelCode,
          smart_code: 'HERA.BEAUTY.COMMS.CHANNEL.WHATSAPP.V1',
          metadata: {
            phone_number_id: '117606954726963',
            channel_type: 'whatsapp_business'
          }
        })
        .select()
        .single();
      
      if (channelError) throw channelError;
      channel = newChannel;
      console.log('✅ Created Channel entity:', channel.entity_name);
    } else {
      console.log('✅ Found existing Channel:', channel.entity_name);
    }
    
    // 2. Create Customer entity
    const waId = '971501234567';
    const customerCode = `WA-${waId}`;
    
    let { data: customer } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .eq('entity_code', customerCode)
      .single();
    
    if (!customer) {
      const { data: newCustomer, error: custError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'customer',
          entity_name: `WhatsApp User ${waId}`,
          entity_code: customerCode,
          smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.PERSON.V1',
          metadata: {
            wa_id: waId,
            phone: waId,
            source: 'whatsapp'
          }
        })
        .select()
        .single();
      
      if (custError) throw custError;
      customer = newCustomer;
      console.log('✅ Created Customer entity:', customer.entity_name);
      
      // Add phone to dynamic data
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: organizationId,
          entity_id: customer.id,
          field_name: 'phone',
          field_value_text: waId,
          smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.DYN.PHONE.V1'
        });
    } else {
      console.log('✅ Found existing Customer:', customer.entity_name);
    }
    
    // 3. Create Conversation entity
    const conversationCode = `CONV-${waId}-${new Date().toISOString().split('T')[0]}`;
    
    const { data: conversation, error: convError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'conversation',
        entity_name: `WhatsApp Chat with ${waId}`,
        entity_code: conversationCode,
        smart_code: 'HERA.BEAUTY.COMMS.CONVERSATION.WHATSAPP.V1',
        metadata: {
          wa_id: waId,
          customer_id: customer.id,
          channel_id: channel.id,
          status: 'active',
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (convError) throw convError;
    console.log('✅ Created Conversation:', conversation.entity_name);
    
    // 4. Create Message Transaction
    const messageId = `wamid.TEST_CANONICAL_${Date.now()}`;
    const messageText = "Hello! I'd like to book an appointment for a haircut tomorrow at 3 PM.";
    
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `WA-MSG-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        external_reference: messageId,
        smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.RECEIVED.V1',
        metadata: {
          direction: 'inbound',
          message_type: 'text',
          wa_id: waId
        }
      })
      .select()
      .single();
    
    if (txnError) throw txnError;
    console.log('✅ Created Message Transaction:', transaction.transaction_code);
    
    // 5. Skip transaction lines for now (schema mismatch)
    console.log('⏭️  Skipping Transaction Lines (schema needs update)');
    
    // 6. Store message text in transaction metadata instead
    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        metadata: {
          ...transaction.metadata,
          text: messageText,
          waba_message_id: messageId,
          wa_id: waId
        }
      })
      .eq('id', transaction.id);
    
    if (updateError) throw updateError;
    console.log('✅ Updated transaction metadata with message details');
    
    // 7. Create Relationships
    const relationships = [
      {
        organization_id: organizationId,
        from_entity_id: transaction.id,
        to_entity_id: customer.id,
        relationship_type: 'message_from',
        smart_code: 'HERA.BEAUTY.COMMS.LINK.SENDER.V1',
        relationship_data: { link_type: 'sender' }
      },
      {
        organization_id: organizationId,
        from_entity_id: transaction.id,
        to_entity_id: channel.id,
        relationship_type: 'message_via',
        smart_code: 'HERA.BEAUTY.COMMS.LINK.CHANNEL.V1',
        relationship_data: { link_type: 'channel' }
      },
      {
        organization_id: organizationId,
        from_entity_id: transaction.id,
        to_entity_id: conversation.id,
        relationship_type: 'message_in',
        smart_code: 'HERA.BEAUTY.COMMS.LINK.CONVERSATION.V1',
        relationship_data: { link_type: 'conversation' }
      }
    ];
    
    const { error: relError } = await supabase
      .from('core_relationships')
      .insert(relationships);
    
    if (relError) throw relError;
    console.log('✅ Created Relationships (3 links)');
    
    console.log('\n🎉 Success! Test message inserted using canonical structure.');
    console.log('\n📊 Summary:');
    console.log('- Customer:', customer.entity_name);
    console.log('- Conversation:', conversation.entity_name);
    console.log('- Message ID:', messageId);
    console.log('- Message Text:', messageText);
    console.log('\n🌐 View at: http://localhost:3000/salon/whatsapp-canonical');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

insertTestMessage();