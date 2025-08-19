#!/usr/bin/env node
/**
 * Setup Campaign Test Data for salon
 * Creates test campaign entities with all necessary fields
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupCampaignTestData() {
  console.log('🎯 Setting up Campaign Test Data for salon...\n');

  const testData = [
    {
      name: 'Sample Campaign 1',
      campaign_type: 'Sample campaign_type value',
      start_date: 'Sample start_date value',
      end_date: 'Sample end_date value',
      target_audience: 'Sample target_audience value',
      budget: 'Sample budget value',
      status: 'Sample status value',
      channel: 'Sample channel value'
    },
    {
      name: 'Sample Campaign 2',
      campaign_type: 'Another campaign_type value',
      start_date: 'Another start_date value',
      end_date: 'Another end_date value',
      target_audience: 'Another target_audience value',
      budget: 'Another budget value',
      status: 'Another status value',
      channel: 'Another channel value'
    },
    {
      name: 'Sample Campaign 3',
      campaign_type: 'Third campaign_type value',
      start_date: 'Third start_date value',
      end_date: 'Third end_date value',
      target_audience: 'Third target_audience value',
      budget: 'Third budget value',
      status: 'Third status value',
      channel: 'Third channel value'
    }
  ];

  for (const item of testData) {
    try {
      // 1. Create entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'campaign',
          entity_name: item.name,
          entity_code: `CAMPAIGN-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.CAMPAIGN.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) throw entityError;

      console.log(`✅ Created campaign: ${item.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'campaign_type', field_value_text: item.campaign_type, field_type: 'text' },
        { field_name: 'start_date', field_value_text: item.start_date, field_type: 'text' },
        { field_name: 'end_date', field_value_text: item.end_date, field_type: 'text' },
        { field_name: 'target_audience', field_value_text: item.target_audience, field_type: 'text' },
        { field_name: 'budget', field_value_text: item.budget, field_type: 'text' },
        { field_name: 'status', field_value_text: item.status, field_type: 'text' },
        { field_name: 'channel', field_value_text: item.channel, field_type: 'text' }
      ];

      for (const field of fields) {
        await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: organizationId,
            entity_id: entity.id,
            ...field,
            smart_code: `HERA.SALON.FIELD.${field.field_name.toUpperCase()}.v1`
          });
      }

      console.log(`  📝 Added ${fields.length} fields`);

    } catch (error) {
      console.error(`❌ Error creating ${item.name}:`, error.message);
    }
  }

  console.log('\n✅ Campaign test data setup complete!');
}

// Run the setup
setupCampaignTestData().catch(console.error);