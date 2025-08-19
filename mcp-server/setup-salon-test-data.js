#!/usr/bin/env node
/**
 * Setup Salon Test Data
 * Creates test customers with all necessary fields for production testing
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function setupSalonTestData() {
  console.log('🎯 Setting up Salon Test Data...\n');

  // Test customers data
  const customers = [
    {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      address: '123 Main St, City, ST 12345',
      dateOfBirth: '1992-05-15',
      preferences: 'Prefers Emma as stylist, allergic to sulfates',
      notes: 'Regular customer, always books monthly appointments',
      loyaltyTier: 'Gold',
      favoriteServices: ['Haircut & Style', 'Hair Color']
    },
    {
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      phone: '(555) 987-6543',
      address: '456 Oak Ave, City, ST 12345',
      dateOfBirth: '1988-09-22',
      preferences: 'Quick service, prefers David',
      notes: 'Busy schedule, likes early morning appointments',
      loyaltyTier: 'Silver',
      favoriteServices: ['Beard Trim', 'Quick Cut']
    },
    {
      name: 'Lisa Wang',
      email: 'lisa.wang@email.com',
      phone: '(555) 456-7890',
      address: '789 Pine St, City, ST 12345',
      dateOfBirth: '1995-12-08',
      preferences: 'Loves trying new colors, experimental styles',
      notes: 'Social media influencer, takes lots of photos',
      loyaltyTier: 'Platinum',
      favoriteServices: ['Hair Color', 'Styling', 'Treatment']
    },
    {
      name: 'Emma Thompson',
      email: 'emma.thompson@email.com',
      phone: '(555) 234-5678',
      address: '321 Elm St, City, ST 12345',
      dateOfBirth: '1985-03-22',
      preferences: 'Natural products only, sensitive scalp',
      notes: 'Monthly keratin treatments, book 2 hours',
      loyaltyTier: 'Gold',
      favoriteServices: ['Keratin Treatment', 'Deep Conditioning']
    },
    {
      name: 'James Wilson',
      email: 'james.wilson@email.com',
      phone: '(555) 345-6789',
      address: '654 Maple Ave, City, ST 12345',
      dateOfBirth: '1990-11-10',
      preferences: 'Classic cuts, no products',
      notes: 'Comes every 3 weeks, tip generously',
      loyaltyTier: 'Silver',
      favoriteServices: ['Classic Cut', 'Hot Towel Shave']
    }
  ];

  // Create loyalty tier status entities first
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const tierColors = {
    Bronze: '#f97316',
    Silver: '#6b7280',
    Gold: '#eab308',
    Platinum: '#9333ea'
  };

  console.log('Creating loyalty tier statuses...');
  for (const tier of tiers) {
    const { data: existing } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', `LOYALTY-${tier.toUpperCase()}`)
      .single();

    if (!existing) {
      const { error } = await supabase
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
        });

      if (!error) {
        console.log(`  ✅ Created ${tier} tier status`);
      }
    }
  }

  // Create service entities
  console.log('\nCreating service entities...');
  const allServices = new Set();
  customers.forEach(c => c.favoriteServices.forEach(s => allServices.add(s)));

  for (const serviceName of allServices) {
    const { data: existing } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'service')
      .eq('entity_name', serviceName)
      .single();

    if (!existing) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'service',
          entity_name: serviceName,
          entity_code: `SERVICE-${serviceName.replace(/\s+/g, '-').toUpperCase()}`,
          smart_code: 'HERA.SALON.SERVICE.v1',
          status: 'active'
        });

      if (!error) {
        console.log(`  ✅ Created service: ${serviceName}`);
      }
    }
  }

  // Create customers
  console.log('\nCreating customers...');
  for (const customer of customers) {
    try {
      // 1. Create customer entity
      const { data: entity, error: entityError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          smart_code: 'HERA.SALON.CUSTOMER.CREATE.v1',
          status: 'active'
        })
        .select()
        .single();

      if (entityError) {
        console.error(`❌ Failed to create customer ${customer.name}:`, entityError);
        continue;
      }

      console.log(`✅ Created customer: ${customer.name}`);

      // 2. Add dynamic fields
      const fields = [
        { field_name: 'email', field_value_text: customer.email, field_type: 'text' },
        { field_name: 'phone', field_value_text: customer.phone, field_type: 'text' },
        { field_name: 'address', field_value_text: customer.address, field_type: 'text' },
        { field_name: 'date_of_birth', field_value_date: customer.dateOfBirth, field_type: 'date' },
        { field_name: 'preferences', field_value_text: customer.preferences, field_type: 'text' },
        { field_name: 'notes', field_value_text: customer.notes, field_type: 'text' }
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

      // 3. Assign loyalty tier
      const { data: tierStatus } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', `LOYALTY-${customer.loyaltyTier.toUpperCase()}`)
        .single();

      if (tierStatus) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: organizationId,
            from_entity_id: entity.id,
            to_entity_id: tierStatus.id,
            relationship_type: 'has_status',
            smart_code: 'HERA.SALON.REL.HAS_STATUS.v1',
            metadata: {
              status_type: 'loyalty_tier',
              status_name: customer.loyaltyTier,
              assigned_at: new Date().toISOString()
            }
          });
      }

      // 4. Create favorite service relationships
      for (const serviceName of customer.favoriteServices) {
        const { data: service } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'service')
          .eq('entity_name', serviceName)
          .single();

        if (service) {
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: organizationId,
              from_entity_id: entity.id,
              to_entity_id: service.id,
              relationship_type: 'favorite_service',
              smart_code: 'HERA.SALON.REL.FAVORITE.v1',
              metadata: {
                service_name: serviceName
              }
            });
        }
      }

      // 5. Create sample transactions
      const transactionCount = Math.floor(Math.random() * 5) + 3;
      for (let i = 0; i < transactionCount; i++) {
        const amount = Math.floor(Math.random() * 200) + 50;
        const daysAgo = Math.floor(Math.random() * 180);
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - daysAgo);

        await supabase
          .from('universal_transactions')
          .insert({
            organization_id: organizationId,
            transaction_type: 'salon_service',
            transaction_code: `SALE-${Date.now()}-${i}`,
            transaction_date: transactionDate.toISOString(),
            total_amount: amount,
            smart_code: 'HERA.SALON.SALE.TXN.v1',
            metadata: {
              customer_id: entity.id,
              customer_name: customer.name,
              services: customer.favoriteServices[Math.floor(Math.random() * customer.favoriteServices.length)]
            }
          });
      }

      console.log(`  📝 Added fields, relationships, and transactions`);

    } catch (error) {
      console.error(`❌ Error setting up ${customer.name}:`, error);
    }
  }

  console.log('\n✅ Salon test data setup complete!');
}

// Run the setup
setupSalonTestData().catch(console.error);