#!/usr/bin/env node
/**
 * Fix Salon Relationships
 * Creates missing relationships for loyalty tiers and favorite services
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function fixSalonRelationships() {
  console.log('🔧 Fixing Salon Relationships...\n');

  // First, let's create the loyalty tier statuses
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const tierColors = {
    Bronze: '#f97316',
    Silver: '#6b7280',
    Gold: '#eab308',
    Platinum: '#9333ea'
  };

  console.log('Creating loyalty tier statuses...');
  const tierStatusMap = {};

  for (const tier of tiers) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `LOYALTY-${tier.toUpperCase()}`)
        .single();

      if (existing) {
        tierStatusMap[tier] = existing.id;
        console.log(`  ✓ Found existing ${tier} tier status`);
      } else {
        // Create new
        const { data: newStatus, error } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'workflow_status',
            entity_name: `${tier} Loyalty Status`,
            entity_code: `LOYALTY-${tier.toUpperCase()}`,
            smart_code: 'HERA.SALON.LOYALTY.STATUS.v1',
            metadata: {
              tier_name: tier,
              color_code: tierColors[tier],
              is_loyalty_tier: true
            },
            status: 'active'
          })
          .select()
          .single();

        if (error) {
          console.error(`  ❌ Error creating ${tier} status:`, error.message);
        } else {
          tierStatusMap[tier] = newStatus.id;
          console.log(`  ✅ Created ${tier} tier status`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error with ${tier} status:`, error.message);
    }
  }

  // Customer data with their loyalty tiers and favorite services
  const customerData = [
    {
      name: 'Sarah Johnson',
      loyaltyTier: 'Gold',
      favoriteServices: ['Haircut & Style', 'Hair Color']
    },
    {
      name: 'Mike Chen',
      loyaltyTier: 'Silver',
      favoriteServices: ['Beard Trim', 'Quick Cut']
    },
    {
      name: 'Lisa Wang',
      loyaltyTier: 'Platinum',
      favoriteServices: ['Hair Color', 'Styling', 'Treatment']
    },
    {
      name: 'Emma Thompson',
      loyaltyTier: 'Gold',
      favoriteServices: ['Keratin Treatment', 'Deep Conditioning']
    },
    {
      name: 'James Wilson',
      loyaltyTier: 'Silver',
      favoriteServices: ['Classic Cut', 'Hot Towel Shave']
    }
  ];

  // Get all customers
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'customer')
    .in('entity_name', customerData.map(c => c.name));

  console.log(`\nFound ${customers?.length || 0} salon customers to fix`);

  // Get all services
  const { data: services } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'service');

  const serviceMap = {};
  services?.forEach(service => {
    serviceMap[service.entity_name] = service.id;
  });

  // Process each customer
  for (const customer of customers || []) {
    const customerInfo = customerData.find(c => c.name === customer.entity_name);
    if (!customerInfo) continue;

    console.log(`\nProcessing ${customer.entity_name}...`);

    // 1. Assign loyalty tier
    if (tierStatusMap[customerInfo.loyaltyTier]) {
      try {
        // Check if relationship already exists
        const { data: existingRel } = await supabase
          .from('core_relationships')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('from_entity_id', customer.id)
          .eq('to_entity_id', tierStatusMap[customerInfo.loyaltyTier])
          .eq('relationship_type', 'has_status')
          .single();

        if (!existingRel) {
          const { error } = await supabase
            .from('core_relationships')
            .insert({
              organization_id: organizationId,
              from_entity_id: customer.id,
              to_entity_id: tierStatusMap[customerInfo.loyaltyTier],
              relationship_type: 'has_status',
              smart_code: 'HERA.SALON.REL.HAS_STATUS.v1',
              relationship_data: {
                status_type: 'loyalty_tier',
                status_name: customerInfo.loyaltyTier,
                assigned_at: new Date().toISOString()
              }
            });

          if (error) {
            console.error(`  ❌ Failed to assign ${customerInfo.loyaltyTier} tier:`, error.message);
          } else {
            console.log(`  ✅ Assigned ${customerInfo.loyaltyTier} tier`);
          }
        } else {
          console.log(`  ✓ Already has ${customerInfo.loyaltyTier} tier`);
        }
      } catch (error) {
        console.error(`  ❌ Error with loyalty tier:`, error.message);
      }
    }

    // 2. Create favorite service relationships
    for (const serviceName of customerInfo.favoriteServices) {
      if (serviceMap[serviceName]) {
        try {
          // Check if relationship already exists
          const { data: existingRel } = await supabase
            .from('core_relationships')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('from_entity_id', customer.id)
            .eq('to_entity_id', serviceMap[serviceName])
            .eq('relationship_type', 'favorite_service')
            .single();

          if (!existingRel) {
            const { error } = await supabase
              .from('core_relationships')
              .insert({
                organization_id: organizationId,
                from_entity_id: customer.id,
                to_entity_id: serviceMap[serviceName],
                relationship_type: 'favorite_service',
                smart_code: 'HERA.SALON.REL.FAVORITE.v1',
                relationship_data: {
                  service_name: serviceName
                }
              });

            if (error) {
              console.error(`  ❌ Failed to add favorite service ${serviceName}:`, error.message);
            } else {
              console.log(`  ✅ Added favorite service: ${serviceName}`);
            }
          } else {
            console.log(`  ✓ Already has favorite service: ${serviceName}`);
          }
        } catch (error) {
          console.error(`  ❌ Error with favorite service:`, error.message);
        }
      }
    }
  }

  // Verify relationships were created
  console.log('\n📊 Verifying relationships...');
  const { data: relationships, count } = await supabase
    .from('core_relationships')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .in('relationship_type', ['has_status', 'favorite_service']);

  console.log(`\n✅ Total relationships created: ${count || 0}`);

  // Show summary by type
  const byType = {};
  relationships?.forEach(rel => {
    byType[rel.relationship_type] = (byType[rel.relationship_type] || 0) + 1;
  });

  console.log('\nRelationships by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\n✅ Salon relationships fix complete!');
}

// Run the fix
fixSalonRelationships().catch(console.error);