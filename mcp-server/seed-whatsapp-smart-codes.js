#!/usr/bin/env node
/**
 * Seed WhatsApp Smart Codes Catalog
 * Inserts all WhatsApp smart codes as entities for validation and documentation
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// System organization ID
const SYSTEM_ORG_ID = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944';

// WhatsApp smart codes catalog
const SMART_CODES = [
  // Thread/Conversation
  {
    code: 'HERA.WHATSAPP.INBOX.THREAD.v1',
    name: 'WhatsApp Thread Create',
    description: 'Creates a WhatsApp conversation thread',
    category: 'conversation',
    metadata: {
      entity_type_used: 'transaction',
      table: 'universal_transactions',
      transaction_type: 'MESSAGE_THREAD'
    }
  },
  {
    code: 'HERA.WHATSAPP.INBOX.ASSIGN.v1',
    name: 'WhatsApp Thread Assign',
    description: 'Assigns conversation to agent',
    category: 'conversation',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'INBOX_ACTION'
    }
  },
  
  // Messages
  {
    code: 'HERA.WHATSAPP.MESSAGE.TEXT.v1',
    name: 'WhatsApp Text Message',
    description: 'Plain text message',
    category: 'message',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'MESSAGE'
    }
  },
  {
    code: 'HERA.WHATSAPP.MESSAGE.MEDIA.v1',
    name: 'WhatsApp Media Message',
    description: 'Image, video, or document message',
    category: 'message',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'MESSAGE',
      supports: ['image', 'video', 'document', 'audio']
    }
  },
  {
    code: 'HERA.WHATSAPP.MESSAGE.INTERACTIVE.v1',
    name: 'WhatsApp Interactive Message',
    description: 'Buttons, lists, or quick replies',
    category: 'message',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'MESSAGE',
      supports: ['buttons', 'list', 'quick_reply']
    }
  },
  
  // Templates
  {
    code: 'HERA.WHATSAPP.TEMPLATE.REGISTER.v1',
    name: 'WhatsApp Template Registration',
    description: 'Register HSM template',
    category: 'template',
    metadata: {
      entity_type_used: 'entity',
      table: 'core_entities',
      entity_type: 'msg_template'
    }
  },
  {
    code: 'HERA.WHATSAPP.TEMPLATE.BODY.v1',
    name: 'WhatsApp Template Body',
    description: 'Template body content',
    category: 'template',
    metadata: {
      entity_type_used: 'dynamic_data',
      table: 'core_dynamic_data',
      field_name: 'body'
    }
  },
  
  // Campaign
  {
    code: 'HERA.WHATSAPP.CAMPAIGN.OUTBOUND.v1',
    name: 'WhatsApp Campaign',
    description: 'Outbound campaign header',
    category: 'campaign',
    metadata: {
      entity_type_used: 'transaction',
      table: 'universal_transactions',
      transaction_type: 'CAMPAIGN'
    }
  },
  {
    code: 'HERA.WHATSAPP.CAMPAIGN.DELIVERY.v1',
    name: 'WhatsApp Campaign Delivery',
    description: 'Campaign message to recipient',
    category: 'campaign',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'CAMPAIGN_DELIVERY'
    }
  },
  
  // Payments
  {
    code: 'HERA.AR.PAYMENT.LINK.SHARE.v1',
    name: 'Payment Link Share',
    description: 'Share payment link via WhatsApp',
    category: 'payment',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'PAYMENT_LINK'
    }
  },
  {
    code: 'HERA.AR.PAYMENT.COLLECTION.WHATSAPP.v1',
    name: 'Payment Collection',
    description: 'Payment received via WhatsApp',
    category: 'payment',
    metadata: {
      entity_type_used: 'transaction',
      table: 'universal_transactions',
      transaction_type: 'PAYMENT'
    }
  },
  
  // Customer
  {
    code: 'HERA.CRM.CUSTOMER.WHATSAPP.v1',
    name: 'WhatsApp Customer',
    description: 'Customer via WhatsApp channel',
    category: 'customer',
    metadata: {
      entity_type_used: 'entity',
      table: 'core_entities',
      entity_type: 'customer'
    }
  },
  
  // Notes
  {
    code: 'HERA.WHATSAPP.NOTE.INTERNAL.v1',
    name: 'Internal Note',
    description: 'Internal note on conversation',
    category: 'note',
    metadata: {
      entity_type_used: 'transaction_line',
      table: 'universal_transaction_lines',
      line_type: 'INTERNAL_NOTE'
    }
  }
];

async function seedSmartCodes() {
  console.log('🌱 Seeding WhatsApp Smart Codes Catalog\n');
  console.log(`📍 System Organization ID: ${SYSTEM_ORG_ID}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const smartCode of SMART_CODES) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', SYSTEM_ORG_ID)
        .eq('entity_type', 'smart_code')
        .eq('entity_code', smartCode.code)
        .single();
      
      if (existing) {
        console.log(`⏭️  Skipping ${smartCode.code} (already exists)`);
        continue;
      }
      
      // Insert smart code entity
      const { error } = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          organization_id: SYSTEM_ORG_ID,
          entity_type: 'smart_code',
          entity_name: smartCode.name,
          entity_code: smartCode.code,
          description: smartCode.description,
          smart_code: 'HERA.SYSTEM.SMART_CODE.CATALOG.v1',
          metadata: {
            ...smartCode.metadata,
            category: smartCode.category,
            module: 'whatsapp'
          },
          business_rules: {
            regex_pattern: '^HERA\\.[A-Z]+(\.[A-Z0-9]+)*\\.v\\d+$',
            required_fields: smartCode.metadata.required_fields || []
          }
        });
      
      if (error) throw error;
      
      console.log(`✅ Seeded ${smartCode.code}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error seeding ${smartCode.code}:`, error.message);
      errorCount++;
    }
  }
  
  // Also add smart code field definitions
  const fieldDefinitions = [
    {
      field_name: 'channel_msg_id',
      field_type: 'text',
      description: 'WhatsApp message ID for idempotency',
      smart_code: 'HERA.SYSTEM.FIELD.WHATSAPP.CHANNEL_MSG_ID.v1'
    },
    {
      field_name: 'phone_number',
      field_type: 'text',
      description: 'WhatsApp phone number with country code',
      smart_code: 'HERA.SYSTEM.FIELD.WHATSAPP.PHONE.v1'
    },
    {
      field_name: 'template_variables',
      field_type: 'json',
      description: 'Template variable values',
      smart_code: 'HERA.SYSTEM.FIELD.WHATSAPP.TEMPLATE_VARS.v1'
    }
  ];
  
  console.log('\n🌱 Seeding Field Definitions\n');
  
  for (const field of fieldDefinitions) {
    try {
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', SYSTEM_ORG_ID)
        .eq('entity_type', 'field_definition')
        .eq('entity_code', field.field_name)
        .single();
      
      if (existing) {
        console.log(`⏭️  Skipping field ${field.field_name} (already exists)`);
        continue;
      }
      
      const { error } = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          organization_id: SYSTEM_ORG_ID,
          entity_type: 'field_definition',
          entity_name: field.field_name,
          entity_code: field.field_name,
          description: field.description,
          smart_code: field.smart_code,
          metadata: {
            field_type: field.field_type,
            module: 'whatsapp'
          }
        });
      
      if (error) throw error;
      
      console.log(`✅ Seeded field ${field.field_name}`);
      successCount++;
      
    } catch (error) {
      console.error(`❌ Error seeding field ${field.field_name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total Smart Codes: ${SMART_CODES.length}`);
  console.log(`📋 Total Field Definitions: ${fieldDefinitions.length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All WhatsApp smart codes seeded successfully!');
  } else {
    console.log('\n⚠️ Some errors occurred during seeding.');
  }
}

// Run if called directly
if (require.main === module) {
  seedSmartCodes().catch(console.error);
}

module.exports = { SMART_CODES, seedSmartCodes };