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

async function setupMultiTenantResendConnector(organizationId, options = {}) {
  console.log(`Setting up Resend connector for organization: ${organizationId}`);

  try {
    // Check if connector already exists for this organization
    const { data: existing } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_connector')
      .eq('smart_code', 'HERA.PUBLICSECTOR.COMM.CONNECTOR.RESEND.V1')
      .single();

    if (existing) {
      console.log('✅ Resend connector already exists for this organization');
      return existing;
    }

    // Create organization-specific connector entity
    const { data: connector, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'comm_connector',
        entity_name: `${options.orgName || 'Organization'} - Resend Email Service`,
        entity_code: `CONNECTOR-RESEND-${organizationId.slice(0, 8).toUpperCase()}`,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONNECTOR.RESEND.V1',
        status: 'pending_configuration',
        metadata: {
          provider: 'resend',
          description: 'Organization-specific Resend email service configuration',
          capabilities: ['send_email', 'track_delivery', 'webhooks', 'templates'],
          version: '1.0.0',
          multi_tenant: true,
          organization_id: organizationId
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating connector entity:', error);
      throw error;
    }

    console.log('✅ Created organization-specific Resend connector entity:', connector.id);

    // Add dynamic configuration data (without API key initially)
    const dynamicData = [
      {
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'provider',
        field_value_text: 'resend',
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.PROVIDER.V1'
      },
      {
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'status',
        field_value_text: 'pending_configuration',
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.STATUS.V1'
      },
      {
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'from_email',
        field_value_text: options.fromEmail || `noreply@${options.domain || 'example.com'}`,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.FROM_EMAIL.V1'
      },
      {
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'webhook_endpoint',
        field_value_text: `/api/webhooks/resend/${organizationId}`,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.WEBHOOK.V1'
      },
      {
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'rate_limit_per_hour',
        field_value_number: options.rateLimit || 100,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.RATE_LIMIT.V1'
      },
      {
        organization_id: organizationId,
        entity_id: connector.id,
        field_name: 'encryption_enabled',
        field_value_boolean: true,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.ENCRYPTION.V1'
      }
    ];

    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicData);

    if (dynamicError) {
      console.error('Error adding dynamic data:', dynamicError);
      throw dynamicError;
    }

    console.log('✅ Added organization-specific connector configuration');

    // Create configuration instructions transaction
    const { data: instructionTxn } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'configuration_instruction',
        transaction_code: `RESEND-CONFIG-${Date.now()}`,
        smart_code: 'HERA.PUBLICSECTOR.COMM.CONFIG.INSTRUCTION.V1',
        reference_entity_id: connector.id,
        total_amount: 0,
        metadata: {
          connector_type: 'resend',
          configuration_steps: [
            'Add RESEND_API_KEY to organization settings',
            'Verify domain in Resend dashboard',
            'Configure webhook endpoint',
            'Test email sending capability'
          ],
          instructions_url: `/organizations/${organizationId}/integrations/resend/setup`
        }
      })
      .select()
      .single();

    console.log('\n📧 Multi-tenant Resend connector setup complete!');
    console.log(`Organization: ${organizationId}`);
    console.log(`Connector ID: ${connector.id}`);
    console.log('\n🔧 Next steps for this organization:');
    console.log('1. Organization admin needs to add their Resend API key via UI');
    console.log('2. Configure domain verification in Resend dashboard');
    console.log(`3. Set up webhook: https://your-domain.com/api/webhooks/resend/${organizationId}`);
    console.log(`4. Access configuration UI: /organizations/${organizationId}/integrations/resend`);

    return connector;

  } catch (error) {
    console.error('❌ Failed to setup multi-tenant Resend connector:', error);
    throw error;
  }
}

// Setup for all organizations or specific organization
async function setupForAllOrganizations() {
  try {
    // Get all active organizations
    const { data: organizations, error } = await supabase
      .from('core_organizations')
      .select('id, name, subdomain')
      .eq('status', 'active');

    if (error) {
      throw error;
    }

    console.log(`Found ${organizations.length} organizations`);

    for (const org of organizations) {
      try {
        await setupMultiTenantResendConnector(org.id, {
          orgName: org.name,
          domain: `${org.subdomain}.heraerp.com`
        });
        console.log(`✅ Setup complete for ${org.name}`);
      } catch (error) {
        console.error(`❌ Failed setup for ${org.name}:`, error.message);
      }
    }

    console.log('\n🎉 Multi-tenant Resend setup complete for all organizations!');
  } catch (error) {
    console.error('❌ Failed to setup for all organizations:', error);
  }
}

// Command line usage
const args = process.argv.slice(2);
const command = args[0];
const organizationId = args[1];

if (command === 'all') {
  setupForAllOrganizations();
} else if (command === 'single' && organizationId) {
  setupMultiTenantResendConnector(organizationId);
} else {
  console.log('Usage:');
  console.log('  node setup-multitenant-resend-connector.js all');
  console.log('  node setup-multitenant-resend-connector.js single <organization-id>');
}