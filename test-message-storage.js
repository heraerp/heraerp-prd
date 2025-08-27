const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hsumtzuqzoqccpjiaikh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDU5MTU2MiwiZXhwIjoyMDQwMTY3NTYyfQ.WJCDQdKVHVHWK8rN7B9dxLvkHCDEGa0zlLwCsYdQdNw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessageStorage() {
  console.log('🧪 Testing WhatsApp Message Storage\n');
  
  const organizationId = '44d2d8f8-167d-46a7-a704-c0e5435863d6';
  const conversationId = '266b8042-f932-4faf-8cc5-4df8a65d9418'; // Your conversation
  
  console.log('Organization ID:', organizationId);
  console.log('Conversation ID:', conversationId);
  console.log('');
  
  // Try to store a test message
  const testMessage = {
    organization_id: organizationId,
    transaction_type: 'whatsapp_message',
    transaction_code: `MSG-TEST-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    total_amount: 0,
    source_entity_id: conversationId,
    target_entity_id: null,
    smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
    metadata: {
      message_id: 'test_msg_' + Date.now(),
      text: 'Test message for debugging',
      direction: 'inbound',
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('Attempting to store message...\n');
  console.log('Message data:', JSON.stringify(testMessage, null, 2));
  console.log('');
  
  try {
    const { data, error } = await supabase
      .from('universal_transactions')
      .insert(testMessage)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Storage failed!');
      console.log('Error details:', error);
      console.log('\nPossible issues:');
      console.log('1. Missing required fields');
      console.log('2. Data type mismatch');
      console.log('3. RLS (Row Level Security) blocking insert');
      console.log('4. Invalid foreign key reference');
    } else {
      console.log('✅ Message stored successfully!');
      console.log('Stored message ID:', data.id);
      console.log('\nThis means the storage logic is correct.');
      console.log('The issue might be in the webhook processor.');
    }
  } catch (error) {
    console.log('❌ Exception occurred:', error);
  }
  
  // Check if we can read messages
  console.log('\n\nChecking if we can read messages...');
  try {
    const { data: messages, error: readError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .limit(5);
    
    if (readError) {
      console.log('❌ Cannot read messages:', readError);
    } else {
      console.log(`✅ Found ${messages?.length || 0} WhatsApp messages`);
      if (messages && messages.length > 0) {
        console.log('Latest message:', messages[0]);
      }
    }
  } catch (error) {
    console.log('❌ Read exception:', error);
  }
}

// Run the test
testMessageStorage();