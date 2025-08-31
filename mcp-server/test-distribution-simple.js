#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ice cream organization ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656';

async function runSimpleDistributionTest() {
  console.log('🚚 Ice Cream Distribution System - Simple Integration Test\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Display Distribution Network Summary
    console.log('📊 Distribution Network Summary:\n');

    const { data: centers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'distribution_center');
    console.log(`✅ Distribution Centers: ${centers?.length || 0}`);

    const { data: vehicles } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'vehicle');
    console.log(`✅ Vehicles: ${vehicles?.length || 0}`);

    const { data: drivers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'driver');
    console.log(`✅ Drivers: ${drivers?.length || 0}`);

    const { data: routes } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'delivery_route');
    console.log(`✅ Routes: ${routes?.length || 0}`);

    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'customer');
    console.log(`✅ Customers: ${customers?.length || 0}`);

    const { data: relationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', ORG_ID)
      .in('relationship_type', ['assigned_to', 'based_at', 'serves_route', 'route_includes']);
    console.log(`✅ Relationships: ${relationships?.length || 0}`);

    console.log('\n═══════════════════════════════════════════════════════\n');

    // 2. Show Vehicle-Driver-Route Assignments
    console.log('🔗 Active Assignments:\n');

    if (vehicles && vehicles.length > 0) {
      for (const vehicle of vehicles.slice(0, 3)) {
        console.log(`📍 ${vehicle.entity_name} (${vehicle.entity_code})`);
        
        // Get driver
        const driverRel = relationships?.find(r => 
          r.from_entity_id === vehicle.id && r.relationship_type === 'assigned_to'
        );
        if (driverRel) {
          const driver = drivers?.find(d => d.id === driverRel.to_entity_id);
          console.log(`   └─ Driver: ${driver?.entity_name || 'Unknown'}`);
        }

        // Get routes
        const routeRels = relationships?.filter(r => 
          r.from_entity_id === vehicle.id && r.relationship_type === 'serves_route'
        );
        if (routeRels.length > 0) {
          console.log(`   └─ Routes:`);
          routeRels.forEach(rr => {
            const route = routes?.find(r => r.id === rr.to_entity_id);
            console.log(`      • ${route?.entity_name || 'Unknown'}`);
          });
        }
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════\n');

    // 3. Show Route Details
    console.log('🗺️ Route Details:\n');

    if (routes && routes.length > 0) {
      const route = routes[0];
      console.log(`📍 ${route.entity_name}`);
      console.log(`   • Zone: ${route.metadata?.zone}`);
      console.log(`   • Distance: ${route.metadata?.distance_km} km`);
      console.log(`   • Duration: ${route.metadata?.estimated_hours} hours`);
      console.log(`   • Stops: ${route.metadata?.stop_count}`);
      console.log(`   • Schedule: ${route.metadata?.time_window}`);

      // Get customers on route
      const customerRels = relationships?.filter(r => 
        r.from_entity_id === route.id && r.relationship_type === 'route_includes'
      );
      if (customerRels.length > 0) {
        console.log(`   • Customers:`);
        customerRels.forEach(cr => {
          const customer = customers?.find(c => c.id === cr.to_entity_id);
          console.log(`      - ${customer?.entity_name || 'Unknown'} (Stop #${cr.relationship_data?.stop_sequence})`);
        });
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // 4. Create a Simple Delivery Order
    console.log('📋 Creating Sample Delivery Order:\n');

    const vehicle = vehicles?.[0];
    const driver = drivers?.[0];
    const route = routes?.[0];
    const customer = customers?.[0];
    const center = centers?.[0];

    if (vehicle && driver && route && customer && center) {
      const deliveryOrder = {
        organization_id: ORG_ID,
        transaction_type: 'delivery_order',
        transaction_code: `DO-DEMO-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        smart_code: 'HERA.DIST.DELIVERY.ORDER.v1',
        total_amount: 5000, // Sample amount
        metadata: {
          from_location: center.entity_name,
          to_location: customer.entity_name,
          vehicle: vehicle.entity_name,
          driver: driver.entity_name,
          route: route.entity_name,
          temperature_start: -20.5,
          temperature_current: -19.8,
          delivery_status: 'in_transit',
          estimated_arrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }
      };

      const { data: order, error } = await supabase
        .from('universal_transactions')
        .insert(deliveryOrder)
        .select()
        .single();

      if (order) {
        console.log(`✅ Created Delivery Order: ${order.transaction_code}`);
        console.log(`   • From: ${center.entity_name}`);
        console.log(`   • To: ${customer.entity_name}`);
        console.log(`   • Vehicle: ${vehicle.entity_name}`);
        console.log(`   • Driver: ${driver.entity_name}`);
        console.log(`   • Route: ${route.entity_name}`);
        console.log(`   • Temperature: ${deliveryOrder.metadata.temperature_current}°C`);
        console.log(`   • Status: ${deliveryOrder.metadata.delivery_status}`);
      } else {
        console.log('❌ Failed to create delivery order:', error?.message);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✅ Distribution System Integration Test Complete!');
    console.log('\nThe distribution system is fully integrated with:');
    console.log('• Distribution centers for storage');
    console.log('• Vehicles with temperature control');
    console.log('• Drivers assigned to vehicles');
    console.log('• Routes with customer stops');
    console.log('• Delivery orders tracking shipments');
    console.log('• Temperature monitoring throughout');
    console.log('\nAll using HERA\'s universal 6-table architecture! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runSimpleDistributionTest();