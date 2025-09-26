#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupResendConnector() {
  console.log('Setting up Resend connector in HERA...');

  try {
    // Check if connector already exists
    const { data: existing } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'connector')
      .eq('smart_code', 'HERA.INTEGRATION.CONNECTOR.RESEND.V1')
      .single();

    if (existing) {
      console.log('✅ Resend connector already exists');
      return existing;
    }

    // Create the connector entity
    const { data: connector, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: process.env.DEFAULT_ORGANIZATION_ID,
        entity_type: 'connector',
        entity_name: 'Resend Email Service',
        entity_code: 'CONNECTOR-RESEND-001',
        smart_code: 'HERA.INTEGRATION.CONNECTOR.RESEND.V1',
        status: 'active',
        metadata: {
          provider: 'resend',
          description: 'Email service provider for transactional and marketing emails',
          capabilities: ['send_email', 'track_delivery', 'webhooks', 'templates'],
          version: '1.0.0'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connector entity:', error);
      throw error;
    }

    console.log('✅ Created Resend connector entity:', connector.id);

    // Add dynamic data for connector configuration
    const dynamicData = [
      {
        organization_id: process.env.DEFAULT_ORGANIZATION_ID,
        entity_id: connector.id,
        field_name: 'provider',
        field_value_text: 'resend',
        smart_code: 'HERA.INTEGRATION.CONFIG.PROVIDER.V1'
      },
      {
        organization_id: process.env.DEFAULT_ORGANIZATION_ID,
        entity_id: connector.id,
        field_name: 'api_key_ref',
        field_value_text: 'RESEND_API_KEY',
        smart_code: 'HERA.INTEGRATION.CONFIG.API_KEY_REF.V1'
      },
      {
        organization_id: process.env.DEFAULT_ORGANIZATION_ID,
        entity_id: connector.id,
        field_name: 'status',
        field_value_text: process.env.RESEND_API_KEY ? 'connected' : 'pending',
        smart_code: 'HERA.INTEGRATION.CONFIG.STATUS.V1'
      },
      {
        organization_id: process.env.DEFAULT_ORGANIZATION_ID,
        entity_id: connector.id,
        field_name: 'from_email',
        field_value_text: 'noreply@heraerp.com',
        smart_code: 'HERA.INTEGRATION.CONFIG.FROM_EMAIL.V1'
      },
      {
        organization_id: process.env.DEFAULT_ORGANIZATION_ID,
        entity_id: connector.id,
        field_name: 'webhook_endpoint',
        field_value_text: '/api/webhooks/resend',
        smart_code: 'HERA.INTEGRATION.CONFIG.WEBHOOK.V1'
      }
    ];

    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicData);

    if (dynamicError) {
      console.error('Error adding dynamic data:', dynamicError);
      throw dynamicError;
    }

    console.log('✅ Added connector configuration to dynamic data');
    console.log('\n📧 Resend connector setup complete!');
    console.log('\nNext steps:');
    console.log('1. Add RESEND_API_KEY to your .env file');
    console.log('2. Configure webhook in Resend dashboard: https://resend.com/webhooks');
    console.log('3. Use the API endpoint: POST /api/integrations/resend/send');

    return connector;

  } catch (error) {
    console.error('❌ Failed to setup Resend connector:', error);
    process.exit(1);
  }
}

// Run setup
setupResendConnector();