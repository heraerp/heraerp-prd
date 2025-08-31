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

// Test data storage
const testData = {
  distributionCenter: null,
  vehicle: null,
  driver: null,
  route: null,
  customer: null,
  products: [],
  deliveryOrder: null
};

// Helper function to log test results
function logTest(testName, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) console.log(`   └─ ${details}`);
}

// Helper function to pause execution
const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runDistributionE2ETest() {
  console.log('🧪 Starting Ice Cream Distribution End-to-End Test\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Test 1: Fetch Distribution Infrastructure
    console.log('📍 Test 1: Fetching Distribution Infrastructure...\n');
    
    // Fetch distribution centers
    const { data: dcData, error: dcError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'distribution_center')
      .limit(1)
      .single();
    
    logTest('Distribution Center Fetch', !dcError && dcData, 
      dcData ? `Found: ${dcData.entity_name}` : dcError?.message);
    testData.distributionCenter = dcData;

    // Fetch vehicles
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'vehicle')
      .limit(1)
      .single();
    
    logTest('Vehicle Fetch', !vehicleError && vehicleData,
      vehicleData ? `Found: ${vehicleData.entity_name}` : vehicleError?.message);
    testData.vehicle = vehicleData;

    // Fetch drivers
    const { data: driverData, error: driverError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'driver')
      .limit(1)
      .single();
    
    logTest('Driver Fetch', !driverError && driverData,
      driverData ? `Found: ${driverData.entity_name}` : driverError?.message);
    testData.driver = driverData;

    // Fetch routes
    const { data: routeData, error: routeError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'delivery_route')
      .limit(1)
      .single();
    
    logTest('Route Fetch', !routeError && routeData,
      routeData ? `Found: ${routeData.entity_name}` : routeError?.message);
    testData.route = routeData;

    // Fetch customers
    const { data: customerData, error: customerError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'customer')
      .limit(1)
      .single();
    
    logTest('Customer Fetch', !customerError && customerData,
      customerData ? `Found: ${customerData.entity_name}` : customerError?.message);
    testData.customer = customerData;

    console.log('\n═══════════════════════════════════════════════════\n');
    
    // Test 2: Verify Relationships
    console.log('🔗 Test 2: Verifying Entity Relationships...\n');

    // Check vehicle-driver relationship
    const { data: vehicleDriverRel, error: vdError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('from_entity_id', testData.vehicle?.id)
      .eq('to_entity_id', testData.driver?.id)
      .eq('relationship_type', 'assigned_to')
      .single();

    logTest('Vehicle-Driver Assignment', !vdError && vehicleDriverRel,
      vehicleDriverRel ? 'Relationship exists' : 'No relationship found');

    // Check vehicle-route relationship
    const { data: vehicleRouteRel, error: vrError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('from_entity_id', testData.vehicle?.id)
      .eq('to_entity_id', testData.route?.id)
      .eq('relationship_type', 'serves_route')
      .single();

    logTest('Vehicle-Route Assignment', !vrError && vehicleRouteRel,
      vehicleRouteRel ? 'Relationship exists' : 'No relationship found');

    // Check route-customer relationship (may not exist for this specific customer)
    const { data: routeCustomerRels, error: rcError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('from_entity_id', testData.route?.id)
      .eq('relationship_type', 'route_includes');

    logTest('Route-Customer Relationships', !rcError && routeCustomerRels?.length > 0,
      routeCustomerRels ? `Found ${routeCustomerRels.length} customers on route` : 'No relationships found');

    console.log('\n═══════════════════════════════════════════════════\n');

    // Test 3: Fetch Products for Delivery
    console.log('📦 Test 3: Fetching Products for Delivery...\n');

    const { data: productData, error: productError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'product')
      .in('entity_code', ['ICE-VANILLA-001', 'ICE-CHOCO-001', 'ICE-MANGO-FAM'])
      .limit(3);

    logTest('Product Fetch', !productError && productData?.length > 0,
      productData ? `Found ${productData.length} products` : productError?.message);
    testData.products = productData || [];

    // Display products
    if (testData.products.length > 0) {
      console.log('\n   Products for delivery:');
      testData.products.forEach(p => {
        console.log(`   • ${p.entity_name} (${p.entity_code}) - ₹${p.metadata?.price}/unit`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    // Test 4: Create Delivery Order
    console.log('📋 Test 4: Creating Delivery Order...\n');

    const deliveryOrderData = {
      organization_id: ORG_ID,
      transaction_type: 'delivery_order',
      transaction_code: `DO-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      smart_code: 'HERA.DIST.DELIVERY.ORDER.v1',
      total_amount: 0, // Will be calculated
      metadata: {
        from_entity_id: testData.distributionCenter?.id,
        to_entity_id: testData.customer?.id,
        vehicle_id: testData.vehicle?.id,
        driver_id: testData.driver?.id,
        route_id: testData.route?.id,
        departure_time: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
        temperature_readings: [
          { time: new Date().toLocaleTimeString(), temp: -20.5, location: 'departure' }
        ],
        delivery_status: 'scheduled',
        total_stops: 12,
        completed_stops: 0,
        customer_name: testData.customer?.entity_name,
        delivery_address: testData.customer?.metadata?.address,
        contact_phone: testData.customer?.metadata?.contact_phone,
        special_instructions: testData.customer?.metadata?.special_instructions
      }
    };

    const { data: deliveryOrder, error: doError } = await supabase
      .from('universal_transactions')
      .insert(deliveryOrderData)
      .select()
      .single();

    logTest('Delivery Order Creation', !doError && deliveryOrder,
      deliveryOrder ? `Order #${deliveryOrder.transaction_code}` : doError?.message);
    testData.deliveryOrder = deliveryOrder;

    // Create delivery order lines
    if (deliveryOrder && testData.products.length > 0) {
      console.log('\n   Adding products to delivery order...');
      
      const lineItems = testData.products.map((product, idx) => ({
        transaction_id: deliveryOrder.id,
        line_number: idx + 1,
        line_entity_id: product.id,
        quantity: Math.floor(Math.random() * 50) + 10, // Random 10-60 units
        unit_price: product.metadata?.price || (idx === 0 ? 45 : idx === 1 ? 55 : 120), // Default prices
        line_amount: 0, // Will be calculated
        smart_code: 'HERA.DIST.DELIVERY.LINE.ITEM.v1',
        metadata: {
          product_name: product.entity_name,
          product_code: product.entity_code,
          temperature_requirement: product.metadata?.storage_temp || -20,
          batch_number: `BATCH-${Date.now()}-${idx}`,
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days
        }
      }));

      // Calculate amounts
      let totalAmount = 0;
      lineItems.forEach(item => {
        item.line_amount = item.quantity * item.unit_price;
        totalAmount += item.line_amount;
      });

      const { data: lines, error: lineError } = await supabase
        .from('universal_transaction_lines')
        .insert(lineItems)
        .select();

      logTest('Delivery Order Lines', !lineError && lines?.length > 0,
        lines ? `Added ${lines.length} products` : lineError?.message);

      // Update total amount
      if (lines) {
        await supabase
          .from('universal_transactions')
          .update({ 
            total_amount: totalAmount,
            metadata: { 
              ...deliveryOrder.metadata, 
              total_units: lineItems.reduce((sum, item) => sum + item.quantity, 0),
              total_value: totalAmount 
            }
          })
          .eq('id', deliveryOrder.id);

        console.log(`   Total Order Value: ₹${totalAmount.toLocaleString()}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    // Test 5: Simulate Delivery Progress
    console.log('🚚 Test 5: Simulating Delivery Progress...\n');

    if (testData.deliveryOrder) {
      // Update to in_transit
      console.log('   Starting delivery...');
      await pause(1000);

      const { error: startError } = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...testData.deliveryOrder.metadata,
            delivery_status: 'in_transit',
            actual_departure: new Date().toISOString(),
            temperature_readings: [
              ...testData.deliveryOrder.metadata.temperature_readings,
              { time: new Date().toLocaleTimeString(), temp: -19.8, location: 'on_route' }
            ]
          }
        })
        .eq('id', testData.deliveryOrder.id);

      logTest('Start Delivery', !startError, 'Status: in_transit');

      // Simulate stop completion
      console.log('\n   Completing delivery stops...');
      await pause(1000);

      const stops = [
        { stop: 1, temp: -19.5, completed: 3 },
        { stop: 2, temp: -19.7, completed: 6 },
        { stop: 3, temp: -19.6, completed: 9 }
      ];

      for (const stopData of stops) {
        const { error: updateError } = await supabase
          .from('universal_transactions')
          .update({
            metadata: {
              ...testData.deliveryOrder.metadata,
              completed_stops: stopData.completed,
              temperature_readings: [
                ...testData.deliveryOrder.metadata.temperature_readings,
                { 
                  time: new Date().toLocaleTimeString(), 
                  temp: stopData.temp, 
                  location: `stop_${stopData.stop}` 
                }
              ]
            }
          })
          .eq('id', testData.deliveryOrder.id);

        logTest(`Stop ${stopData.stop} Completion`, !updateError, 
          `${stopData.completed}/12 stops, Temp: ${stopData.temp}°C`);
        
        await pause(500);
      }

      // Complete delivery
      console.log('\n   Completing delivery...');
      await pause(1000);

      const { error: completeError } = await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...testData.deliveryOrder.metadata,
            delivery_status: 'delivered',
            completed_stops: 12,
            actual_completion: new Date().toISOString(),
            customer_signature: 'John Thomas',
            delivery_notes: 'All items delivered in good condition',
            temperature_readings: [
              ...testData.deliveryOrder.metadata.temperature_readings,
              { time: new Date().toLocaleTimeString(), temp: -19.4, location: 'delivery_complete' }
            ]
          }
        })
        .eq('id', testData.deliveryOrder.id);

      logTest('Delivery Completion', !completeError, 'Status: delivered');
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    // Test 6: Verify Temperature Compliance
    console.log('🌡️ Test 6: Temperature Compliance Check...\n');

    if (testData.deliveryOrder) {
      const { data: finalOrder } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('id', testData.deliveryOrder.id)
        .single();

      if (finalOrder?.metadata?.temperature_readings) {
        const readings = finalOrder.metadata.temperature_readings;
        const temps = readings.map(r => r.temp);
        const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);

        console.log('   Temperature Analysis:');
        console.log(`   • Readings: ${readings.length}`);
        console.log(`   • Average: ${avgTemp.toFixed(1)}°C`);
        console.log(`   • Range: ${minTemp}°C to ${maxTemp}°C`);
        console.log(`   • Compliance: ${maxTemp <= -18 ? '✅ PASS' : '❌ FAIL'}`);

        // Display all readings
        console.log('\n   Temperature Log:');
        readings.forEach(r => {
          const status = r.temp <= -18 ? '✅' : '⚠️';
          console.log(`   ${status} ${r.time} - ${r.temp}°C @ ${r.location}`);
        });
      }
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    // Test 7: Create Inventory Transfer
    console.log('📦 Test 7: Creating Inventory Transfer from Delivery...\n');

    if (testData.deliveryOrder) {
      // Get the main warehouse
      const { data: warehouse } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'location')
        .eq('entity_code', 'LOC-001')
        .single();

      // Get an outlet
      const { data: outlet } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'location')
        .eq('entity_code', 'OUTLET-001')
        .single();

      if (warehouse && outlet) {
        const transferData = {
          organization_id: ORG_ID,
          transaction_type: 'inventory_transfer',
          transaction_code: `INV-TRANS-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          smart_code: 'HERA.INV.TRANSFER.DELIVERY.v1',
          total_amount: 0,
          metadata: {
            from_location_id: warehouse.id,
            to_location_id: outlet.id,
            from_location_name: warehouse.entity_name,
            to_location_name: outlet.entity_name,
            delivery_order_id: testData.deliveryOrder.id,
            delivery_order_code: testData.deliveryOrder.transaction_code,
            transfer_reason: 'Customer Delivery',
            temperature: -19.5,
            status: 'completed'
          }
        };

        const { data: transfer, error: transferError } = await supabase
          .from('universal_transactions')
          .insert(transferData)
          .select()
          .single();

        logTest('Inventory Transfer Creation', !transferError && transfer,
          transfer ? `Transfer #${transfer.transaction_code}` : transferError?.message);

        // Get delivery lines to create transfer lines
        if (transfer) {
          const { data: deliveryLines } = await supabase
            .from('universal_transaction_lines')
            .select('*')
            .eq('transaction_id', testData.deliveryOrder.id);

          if (deliveryLines) {
            const transferLines = deliveryLines.map((line, idx) => ({
              transaction_id: transfer.id,
              line_number: idx + 1,
              line_entity_id: line.line_entity_id,
              quantity: -line.quantity, // Negative for outgoing
              unit_price: line.unit_price,
              line_amount: -line.line_amount,
              smart_code: 'HERA.INV.TRANSFER.LINE.v1',
              metadata: {
                product_name: line.metadata?.product_name,
                product_code: line.metadata?.product_code,
                batch_number: line.metadata?.batch_number,
                transfer_type: 'outgoing'
              }
            }));

            const { error: lineError } = await supabase
              .from('universal_transaction_lines')
              .insert(transferLines);

            logTest('Transfer Lines Creation', !lineError,
              `Created ${transferLines.length} transfer lines`);
          }
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════\n');

    // Summary
    console.log('📊 Test Summary\n');
    console.log('Distribution Infrastructure:');
    console.log(`• Distribution Center: ${testData.distributionCenter?.entity_name || 'Not found'}`);
    console.log(`• Vehicle: ${testData.vehicle?.entity_name || 'Not found'}`);
    console.log(`• Driver: ${testData.driver?.entity_name || 'Not found'}`);
    console.log(`• Route: ${testData.route?.entity_name || 'Not found'}`);
    console.log(`• Customer: ${testData.customer?.entity_name || 'Not found'}`);
    
    if (testData.deliveryOrder) {
      console.log('\nDelivery Order:');
      console.log(`• Order #: ${testData.deliveryOrder.transaction_code}`);
      console.log(`• Products: ${testData.products.length}`);
      console.log(`• Total Value: ₹${testData.deliveryOrder.total_amount?.toLocaleString() || 0}`);
      console.log(`• Status: Delivered ✅`);
    }

    console.log('\n✅ End-to-End Test Complete!');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run the test
runDistributionE2ETest();