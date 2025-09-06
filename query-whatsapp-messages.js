#!/usr/bin/env node

/**
 * Query WhatsApp messages from specific phone numbers
 * This script searches for messages stored in the HERA database
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Phone numbers to search for
const PHONE_NUMBERS = [
  '+447515668004',
  '+918883333144',
  '447515668004',  // Without +
  '918883333144',  // Without +
];

// Organization ID (Hair Talkz)
const HAIR_TALKZ_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function queryMessages() {
  console.log('🔍 Searching for WhatsApp messages...\n');
  console.log('Phone numbers to search:', PHONE_NUMBERS);
  console.log('Organization:', HAIR_TALKZ_ORG_ID);
  console.log('='.repeat(80));

  // Query 1: Check universal_transactions for WhatsApp messages
  console.log('\n📊 Querying universal_transactions table...');
  try {
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error querying transactions:', error);
    } else {
      console.log(`Found ${transactions?.length || 0} WhatsApp messages in transactions`);
      
      // Filter for specific phone numbers
      const relevantMessages = transactions?.filter(tx => {
        const metadata = tx.metadata || {};
        const waId = metadata.wa_id || '';
        const text = metadata.text || metadata.content || '';
        
        return PHONE_NUMBERS.some(phone => 
          waId.includes(phone.replace('+', '')) || 
          text.includes(phone)
        );
      }) || [];

      if (relevantMessages.length > 0) {
        console.log(`\n✅ Found ${relevantMessages.length} messages from specified numbers:\n`);
        
        relevantMessages.forEach((msg, index) => {
          const metadata = msg.metadata || {};
          console.log(`Message ${index + 1}:`);
          console.log(`  ID: ${msg.id}`);
          console.log(`  From: ${metadata.wa_id || 'Unknown'}`);
          console.log(`  Text: ${metadata.text || metadata.content || 'No text'}`);
          console.log(`  Direction: ${metadata.direction || 'Unknown'}`);
          console.log(`  Timestamp: ${msg.created_at}`);
          console.log(`  Smart Code: ${msg.smart_code}`);
          console.log('-'.repeat(60));
        });
      } else {
        console.log('\n❌ No messages found from the specified phone numbers');
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query 2: Check core_entities for customers with these phone numbers
  console.log('\n\n📊 Querying core_entities for customers...');
  try {
    const { data: customers, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .eq('entity_type', 'customer')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying customers:', error);
    } else {
      console.log(`Found ${customers?.length || 0} total customers`);
      
      // Filter for phone numbers in metadata
      const relevantCustomers = customers?.filter(customer => {
        const metadata = customer.metadata || {};
        const waId = metadata.wa_id || '';
        const phone = metadata.phone || '';
        const entityCode = customer.entity_code || '';
        
        return PHONE_NUMBERS.some(searchPhone => 
          waId.includes(searchPhone.replace('+', '')) || 
          phone.includes(searchPhone.replace('+', '')) ||
          entityCode.includes(searchPhone.replace('+', ''))
        );
      }) || [];

      if (relevantCustomers.length > 0) {
        console.log(`\n✅ Found ${relevantCustomers.length} customers with specified numbers:\n`);
        
        relevantCustomers.forEach((customer, index) => {
          const metadata = customer.metadata || {};
          console.log(`Customer ${index + 1}:`);
          console.log(`  ID: ${customer.id}`);
          console.log(`  Name: ${customer.entity_name}`);
          console.log(`  Code: ${customer.entity_code}`);
          console.log(`  WhatsApp ID: ${metadata.wa_id || 'N/A'}`);
          console.log(`  Phone: ${metadata.phone || 'N/A'}`);
          console.log(`  Created: ${customer.created_at}`);
          console.log('-'.repeat(60));
        });
      } else {
        console.log('\n❌ No customers found with the specified phone numbers');
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query 3: Check conversations
  console.log('\n\n📊 Querying conversations...');
  try {
    const { data: conversations, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .eq('entity_type', 'whatsapp_conversation')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying conversations:', error);
    } else {
      console.log(`Found ${conversations?.length || 0} total conversations`);
      
      // Filter for phone numbers
      const relevantConversations = conversations?.filter(conv => {
        const metadata = conv.metadata || {};
        const waId = metadata.wa_id || '';
        const entityName = conv.entity_name || '';
        
        return PHONE_NUMBERS.some(searchPhone => 
          waId.includes(searchPhone.replace('+', '')) || 
          entityName.includes(searchPhone)
        );
      }) || [];

      if (relevantConversations.length > 0) {
        console.log(`\n✅ Found ${relevantConversations.length} conversations with specified numbers:\n`);
        
        relevantConversations.forEach((conv, index) => {
          const metadata = conv.metadata || {};
          console.log(`Conversation ${index + 1}:`);
          console.log(`  ID: ${conv.id}`);
          console.log(`  Name: ${conv.entity_name}`);
          console.log(`  WhatsApp ID: ${metadata.wa_id || 'N/A'}`);
          console.log(`  Status: ${metadata.status || 'N/A'}`);
          console.log(`  Last Message: ${metadata.last_message_text || 'N/A'}`);
          console.log(`  Created: ${conv.created_at}`);
          console.log('-'.repeat(60));
        });
      } else {
        console.log('\n❌ No conversations found with the specified phone numbers');
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  // Query 4: Check dynamic data for phone numbers
  console.log('\n\n📊 Querying core_dynamic_data for phone numbers...');
  try {
    const { data: dynamicData, error } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', HAIR_TALKZ_ORG_ID)
      .eq('field_name', 'phone')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error querying dynamic data:', error);
    } else {
      console.log(`Found ${dynamicData?.length || 0} phone number entries`);
      
      // Filter for specific phone numbers
      const relevantPhones = dynamicData?.filter(entry => {
        const phoneValue = entry.field_value_text || '';
        
        return PHONE_NUMBERS.some(searchPhone => 
          phoneValue.includes(searchPhone.replace('+', ''))
        );
      }) || [];

      if (relevantPhones.length > 0) {
        console.log(`\n✅ Found ${relevantPhones.length} entries with specified phone numbers:\n`);
        
        for (const entry of relevantPhones) {
          console.log(`Phone Entry:`);
          console.log(`  Entity ID: ${entry.entity_id}`);
          console.log(`  Phone: ${entry.field_value_text}`);
          console.log(`  Created: ${entry.created_at}`);
          
          // Lookup the entity
          const { data: entity } = await supabase
            .from('core_entities')
            .select('*')
            .eq('id', entry.entity_id)
            .single();
            
          if (entity) {
            console.log(`  Entity Name: ${entity.entity_name}`);
            console.log(`  Entity Type: ${entity.entity_type}`);
          }
          console.log('-'.repeat(60));
        }
      } else {
        console.log('\n❌ No dynamic data entries found with the specified phone numbers');
      }
    }
  } catch (error) {
    console.error('Query error:', error);
  }

  console.log('\n\n✅ Query complete!');
}

// Run the query
queryMessages().catch(console.error);