#!/usr/bin/env node

/**
 * Query WhatsApp messages for specific customer IDs
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Customer and conversation IDs from previous query
const CUSTOMER_IDS = [
  'b4503010-6743-4b47-bfc0-87f084555b58', // Supriya (918883333144)
  '7feb1c18-98a4-4608-92d2-ec258082bd7d'  // WhatsApp User (447515668004)
];

const CONVERSATION_IDS = [
  'e2df7f9a-f882-4707-8271-b3882bd50d3e', // Conversation with 918883333144
  'a3e2d1d2-f08a-40a6-aac8-97d5c82d1edf'  // Conversation with 447515668004
];

async function queryCustomerMessages() {
  console.log('🔍 Searching for messages from specific customers...\n');
  
  // Query messages by customer ID (from_entity_id)
  console.log('📊 Querying messages FROM customers...');
  try {
    const { data: fromMessages, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .in('from_entity_id', CUSTOMER_IDS)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${fromMessages?.length || 0} messages FROM customers`);
      
      if (fromMessages && fromMessages.length > 0) {
        fromMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          console.log(`\nMessage ${index + 1} (FROM customer):`);
          console.log(`  ID: ${msg.id}`);
          console.log(`  From Entity: ${msg.from_entity_id}`);
          console.log(`  To Entity: ${msg.to_entity_id}`);
          console.log(`  Text: ${metadata.text || metadata.content || 'No text'}`);
          console.log(`  WhatsApp ID: ${metadata.wa_id || 'N/A'}`);
          console.log(`  Direction: ${metadata.direction || 'N/A'}`);
          console.log(`  Created: ${msg.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query messages TO customers
  console.log('\n\n📊 Querying messages TO customers...');
  try {
    const { data: toMessages, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .in('to_entity_id', CUSTOMER_IDS)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${toMessages?.length || 0} messages TO customers`);
      
      if (toMessages && toMessages.length > 0) {
        toMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          console.log(`\nMessage ${index + 1} (TO customer):`);
          console.log(`  ID: ${msg.id}`);
          console.log(`  From Entity: ${msg.from_entity_id}`);
          console.log(`  To Entity: ${msg.to_entity_id}`);
          console.log(`  Text: ${metadata.text || metadata.content || 'No text'}`);
          console.log(`  WhatsApp ID: ${metadata.wa_id || 'N/A'}`);
          console.log(`  Direction: ${metadata.direction || 'N/A'}`);
          console.log(`  Created: ${msg.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query messages related to conversations
  console.log('\n\n📊 Querying messages related to conversations...');
  try {
    const { data: convMessages, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .or(`from_entity_id.in.(${CONVERSATION_IDS.join(',')}),to_entity_id.in.(${CONVERSATION_IDS.join(',')})`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${convMessages?.length || 0} messages related to conversations`);
      
      if (convMessages && convMessages.length > 0) {
        convMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          console.log(`\nMessage ${index + 1} (Conversation):`);
          console.log(`  ID: ${msg.id}`);
          console.log(`  From Entity: ${msg.from_entity_id}`);
          console.log(`  To Entity: ${msg.to_entity_id}`);
          console.log(`  Text: ${metadata.text || metadata.content || 'No text'}`);
          console.log(`  WhatsApp ID: ${metadata.wa_id || 'N/A'}`);
          console.log(`  Direction: ${metadata.direction || 'N/A'}`);
          console.log(`  Created: ${msg.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Check metadata for conversation_id
  console.log('\n\n📊 Querying by conversation_id in metadata...');
  try {
    const { data: metaMessages, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .filter('metadata->>conversation_id', 'in', `(${CONVERSATION_IDS.map(id => `"${id}"`).join(',')})`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${metaMessages?.length || 0} messages with conversation_id in metadata`);
      
      if (metaMessages && metaMessages.length > 0) {
        metaMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          console.log(`\nMessage ${index + 1} (via metadata):`);
          console.log(`  ID: ${msg.id}`);
          console.log(`  Conversation ID: ${metadata.conversation_id}`);
          console.log(`  Text: ${metadata.text || metadata.content || 'No text'}`);
          console.log(`  WhatsApp ID: ${metadata.wa_id || 'N/A'}`);
          console.log(`  Direction: ${metadata.direction || 'N/A'}`);
          console.log(`  Created: ${msg.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  console.log('\n\n✅ Query complete!');
}

// Run the query
queryCustomerMessages().catch(console.error);