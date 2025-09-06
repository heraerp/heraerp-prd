#!/usr/bin/env node

/**
 * Query WhatsApp messages with corrected column names
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

const PHONE_NUMBERS = [
  '+447515668004',
  '+918883333144',
  '447515668004',  
  '918883333144',  
];

const HAIR_TALKZ_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function queryAllWhatsAppMessages() {
  console.log('🔍 Comprehensive WhatsApp message search...\n');
  
  // Query 1: All WhatsApp messages for the organization
  console.log('📊 Querying ALL WhatsApp messages for Hair Talkz...');
  try {
    const { data: allMessages, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${allMessages?.length || 0} total WhatsApp messages\n`);
      
      if (allMessages && allMessages.length > 0) {
        // Look for our phone numbers in the messages
        let foundMessages = false;
        
        allMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          const text = metadata.text || metadata.content || '';
          const waId = metadata.wa_id || '';
          
          // Check if this message is related to our phone numbers
          const isRelevant = PHONE_NUMBERS.some(phone => {
            const cleanPhone = phone.replace('+', '');
            return waId.includes(cleanPhone) || 
                   text.includes(phone) || 
                   (msg.transaction_code && msg.transaction_code.includes(cleanPhone));
          });
          
          if (isRelevant || index < 5) { // Show first 5 messages regardless
            if (isRelevant) {
              console.log('✅ FOUND RELEVANT MESSAGE:');
              foundMessages = true;
            } else {
              console.log(`Message ${index + 1}:`);
            }
            console.log(`  ID: ${msg.id}`);
            console.log(`  Transaction Code: ${msg.transaction_code}`);
            console.log(`  Source Entity: ${msg.source_entity_id || 'N/A'}`);
            console.log(`  Target Entity: ${msg.target_entity_id || 'N/A'}`);
            console.log(`  Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
            console.log(`  WhatsApp ID: ${waId}`);
            console.log(`  Direction: ${metadata.direction || 'N/A'}`);
            console.log(`  Message Type: ${metadata.message_type || 'N/A'}`);
            console.log(`  Created: ${msg.created_at}`);
            console.log(`  Smart Code: ${msg.smart_code}`);
            console.log('-'.repeat(80));
          }
        });
        
        if (!foundMessages) {
          console.log('\n❌ No messages found from the specified phone numbers');
          console.log('   Showing sample of existing messages above for reference\n');
        }
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query 2: Messages by source/target entity
  console.log('\n📊 Querying messages by customer entity IDs...');
  try {
    const { data: entityMessages, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('transaction_type', 'whatsapp_message')
      .or(`source_entity_id.in.(${CUSTOMER_IDS.join(',')}),target_entity_id.in.(${CUSTOMER_IDS.join(',')})`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
    } else {
      console.log(`Found ${entityMessages?.length || 0} messages related to customer entities`);
      
      if (entityMessages && entityMessages.length > 0) {
        entityMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          console.log(`\nMessage ${index + 1}:`);
          console.log(`  ID: ${msg.id}`);
          console.log(`  Source Entity: ${msg.source_entity_id}`);
          console.log(`  Target Entity: ${msg.target_entity_id}`);
          console.log(`  Text: ${(metadata.text || metadata.content || '').substring(0, 100)}`);
          console.log(`  Created: ${msg.created_at}`);
        });
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query 3: Check for any messages that might have the phone numbers in different fields
  console.log('\n\n📊 Searching metadata for phone numbers...');
  try {
    // Search in metadata fields
    const queries = PHONE_NUMBERS.map(async (phone) => {
      const cleanPhone = phone.replace('+', '');
      
      // Try different metadata field searches
      const { data, error } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', HAIR_TALKZ_ORG_ID)
        .eq('transaction_type', 'whatsapp_message')
        .or(`metadata->wa_id.ilike.%${cleanPhone}%,metadata->phone.ilike.%${cleanPhone}%,metadata->from.ilike.%${cleanPhone}%`)
        .limit(10);
        
      return { phone, data, error };
    });
    
    const results = await Promise.all(queries);
    
    results.forEach(({ phone, data, error }) => {
      if (error) {
        console.error(`Error searching for ${phone}:`, error);
      } else if (data && data.length > 0) {
        console.log(`\n✅ Found ${data.length} messages related to ${phone}:`);
        data.forEach((msg) => {
          const metadata = msg.metadata || {};
          console.log(`  - ${msg.id}: ${(metadata.text || '').substring(0, 50)}...`);
        });
      }
    });
  } catch (error) {
    console.error('Metadata search error:', error);
  }

  console.log('\n\n✅ Comprehensive search complete!');
  console.log('\nSummary:');
  console.log('- Customers found: ✅ (Supriya: 918883333144, WhatsApp User: 447515668004)');
  console.log('- Conversations found: ✅ (Both phone numbers have active conversations)');
  console.log('- Messages in transactions: Need to check if messages are being stored correctly');
  console.log('\nNote: Messages may not be stored yet if the webhook hasn\'t received any actual messages.');
}

// Run the query
queryAllWhatsAppMessages().catch(console.error);