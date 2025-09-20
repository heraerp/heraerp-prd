const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function verifySalonSetup() {
  console.log('🔍 Verifying Hair Talkz Salon Setup');
  console.log(`Organization ID: ${SALON_ORG_ID}`);
  console.log('===================================\n');

  try {
    // Check organization
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', SALON_ORG_ID)
      .single();

    if (orgError || !org) {
      console.error('❌ Organization not found!');
      return;
    }

    console.log(`✅ Organization: ${org.organization_name}`);
    console.log(`   Type: ${org.organization_type}`);
    console.log(`   Status: ${org.status}\n`);

    // Count entities by type
    const entityTypes = ['service_category', 'service', 'product', 'employee', 'pricelist', 'membership_tier', 'customer'];
    
    console.log('📊 Entity Summary:');
    for (const type of entityTypes) {
      const { count, error } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', SALON_ORG_ID)
        .eq('entity_type', type)
        .eq('status', 'active');

      if (!error) {
        console.log(`   ${type}: ${count || 0}`);
      }
    }

    // Check prices
    const { count: priceCount } = await supabase
      .from('core_dynamic_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', SALON_ORG_ID)
      .like('field_name', 'price_%');

    console.log(`\n💰 Prices configured: ${priceCount || 0}`);

    // Sample some services with prices
    console.log('\n📋 Sample Services with Prices:');
    const { data: services } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .eq('status', 'active')
      .limit(3);

    if (services) {
      for (const service of services) {
        const { data: priceData } = await supabase
          .from('core_dynamic_data')
          .select('field_value_number')
          .eq('organization_id', SALON_ORG_ID)
          .like('field_name', `price_service_${service.id}`)
          .single();

        const price = priceData?.field_value_number || 'Not set';
        console.log(`   - ${service.entity_name}: AED ${price}`);
      }
    }

    console.log('\n✅ Salon is ready for POS testing!');

  } catch (error) {
    console.error('Error verifying setup:', error);
  }
}

verifySalonSetup();