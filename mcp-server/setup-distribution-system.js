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

async function setupDistributionSystem() {
  console.log('🚚 Setting up Ice Cream Distribution System...\n');

  try {
    // 1. Create Distribution Centers
    console.log('📦 Creating Distribution Centers...');
    const distributionCenters = [
      {
        name: 'Kochi Main Distribution Hub',
        code: 'DC-KOCHI-MAIN',
        metadata: {
          address: 'Industrial Estate, Kalamassery, Kochi - 683104',
          capacity: 10000,
          cold_storage_temp: -22,
          loading_bays: 6,
          operating_hours: '5:00 AM - 11:00 PM',
          coordinates: { lat: 10.0514, lng: 76.3199 }
        }
      },
      {
        name: 'Ernakulam Sub Distribution',
        code: 'DC-ERNAKULAM',
        metadata: {
          address: 'MG Road, Ernakulam, Kochi - 682011',
          capacity: 3000,
          cold_storage_temp: -20,
          loading_bays: 2,
          operating_hours: '6:00 AM - 10:00 PM',
          coordinates: { lat: 9.9816, lng: 76.2999 }
        }
      }
    ];

    const dcIds = {};
    for (const dc of distributionCenters) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'distribution_center',
          entity_name: dc.name,
          entity_code: dc.code,
          smart_code: 'HERA.DIST.DC.FACILITY.v1',
          metadata: dc.metadata
        })
        .select()
        .single();

      if (!error) {
        dcIds[dc.code] = data.id;
        console.log(`✅ Created: ${dc.name}`);
      }
    }

    // 2. Create Delivery Vehicles
    console.log('\n🚛 Creating Delivery Vehicles...');
    const vehicles = [
      {
        name: 'Refrigerated Truck KL-07-AB-1234',
        code: 'VEH-001',
        metadata: {
          vehicle_type: 'refrigerated_truck',
          make: 'Tata',
          model: '407 Gold',
          year: 2022,
          capacity_units: 800,
          capacity_weight: 2500, // kg
          temperature_range: '-25 to -18°C',
          fuel_type: 'diesel',
          license_plate: 'KL-07-AB-1234',
          last_maintenance: '2024-01-15',
          insurance_expiry: '2024-12-31',
          base_location: 'DC-KOCHI-MAIN'
        }
      },
      {
        name: 'Refrigerated Van KL-07-CD-5678',
        code: 'VEH-002',
        metadata: {
          vehicle_type: 'refrigerated_van',
          make: 'Ashok Leyland',
          model: 'Dost+',
          year: 2023,
          capacity_units: 400,
          capacity_weight: 1200, // kg
          temperature_range: '-25 to -18°C',
          fuel_type: 'diesel',
          license_plate: 'KL-07-CD-5678',
          last_maintenance: '2024-01-10',
          insurance_expiry: '2024-12-31',
          base_location: 'DC-KOCHI-MAIN'
        }
      },
      {
        name: 'Refrigerated Van KL-07-EF-9012',
        code: 'VEH-003',
        metadata: {
          vehicle_type: 'refrigerated_van',
          make: 'Mahindra',
          model: 'Bolero Maxi Truck',
          year: 2023,
          capacity_units: 300,
          capacity_weight: 1000, // kg
          temperature_range: '-25 to -18°C',
          fuel_type: 'diesel',
          license_plate: 'KL-07-EF-9012',
          last_maintenance: '2024-01-05',
          insurance_expiry: '2024-12-31',
          base_location: 'DC-ERNAKULAM'
        }
      }
    ];

    const vehicleIds = {};
    for (const vehicle of vehicles) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'vehicle',
          entity_name: vehicle.name,
          entity_code: vehicle.code,
          smart_code: 'HERA.DIST.VEHICLE.REFRIGERATED.v1',
          metadata: vehicle.metadata
        })
        .select()
        .single();

      if (!error) {
        vehicleIds[vehicle.code] = data.id;
        console.log(`✅ Created: ${vehicle.name}`);
        
        // Create relationship to distribution center
        const dcId = dcIds[vehicle.metadata.base_location];
        if (dcId) {
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: ORG_ID,
              from_entity_id: data.id,
              to_entity_id: dcId,
              relationship_type: 'based_at',
              smart_code: 'HERA.DIST.REL.VEHICLE.BASE.v1'
            });
        }
      }
    }

    // 3. Create Drivers
    console.log('\n👨‍✈️ Creating Drivers...');
    const drivers = [
      {
        name: 'Rajesh Kumar',
        code: 'DRV-001',
        metadata: {
          employee_id: 'EMP-2021-045',
          license_no: 'KL-2018-0012345',
          license_type: 'Heavy Vehicle',
          license_expiry: '2025-06-30',
          experience_years: 8,
          rating: 4.8,
          contact: '+91-9876543210',
          emergency_contact: '+91-9876543211',
          address: 'Kadavanthra, Kochi',
          blood_group: 'O+'
        }
      },
      {
        name: 'Suresh Menon',
        code: 'DRV-002',
        metadata: {
          employee_id: 'EMP-2022-067',
          license_no: 'KL-2019-0023456',
          license_type: 'Light Motor Vehicle',
          license_expiry: '2025-08-15',
          experience_years: 5,
          rating: 4.6,
          contact: '+91-9876543220',
          emergency_contact: '+91-9876543221',
          address: 'Kaloor, Kochi',
          blood_group: 'A+'
        }
      },
      {
        name: 'Mohammed Ali',
        code: 'DRV-003',
        metadata: {
          employee_id: 'EMP-2023-089',
          license_no: 'KL-2020-0034567',
          license_type: 'Light Motor Vehicle',
          license_expiry: '2025-12-20',
          experience_years: 3,
          rating: 4.7,
          contact: '+91-9876543230',
          emergency_contact: '+91-9876543231',
          address: 'Mattancherry, Kochi',
          blood_group: 'B+'
        }
      }
    ];

    const driverIds = {};
    for (const driver of drivers) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'driver',
          entity_name: driver.name,
          entity_code: driver.code,
          smart_code: 'HERA.DIST.DRIVER.DELIVERY.v1',
          metadata: driver.metadata
        })
        .select()
        .single();

      if (!error) {
        driverIds[driver.code] = data.id;
        console.log(`✅ Created: ${driver.name}`);
      }
    }

    // 4. Assign Vehicles to Drivers
    console.log('\n🔗 Assigning Vehicles to Drivers...');
    const assignments = [
      { vehicle: 'VEH-001', driver: 'DRV-001' },
      { vehicle: 'VEH-002', driver: 'DRV-002' },
      { vehicle: 'VEH-003', driver: 'DRV-003' }
    ];

    for (const assignment of assignments) {
      const vehicleId = vehicleIds[assignment.vehicle];
      const driverId = driverIds[assignment.driver];
      
      if (vehicleId && driverId) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: ORG_ID,
            from_entity_id: vehicleId,
            to_entity_id: driverId,
            relationship_type: 'assigned_to',
            smart_code: 'HERA.DIST.REL.VEHICLE.DRIVER.v1',
            relationship_data: {
              assignment_date: new Date().toISOString(),
              shift: 'regular',
              status: 'active'
            }
          });
        console.log(`✅ Assigned ${assignment.vehicle} to ${assignment.driver}`);
      }
    }

    // 5. Create Delivery Routes
    console.log('\n🗺️ Creating Delivery Routes...');
    const routes = [
      {
        name: 'Route 001 - Fort Kochi Circuit',
        code: 'ROUTE-001',
        metadata: {
          zone: 'Fort Kochi',
          areas: ['Fort Kochi', 'Mattancherry', 'Palluruthy'],
          distance_km: 35,
          estimated_hours: 4,
          stop_count: 15,
          priority: 'high',
          schedule: 'daily',
          time_window: '8:00 AM - 12:00 PM'
        }
      },
      {
        name: 'Route 002 - Ernakulam Central',
        code: 'ROUTE-002',
        metadata: {
          zone: 'Ernakulam',
          areas: ['MG Road', 'Marine Drive', 'Panampilly Nagar'],
          distance_km: 28,
          estimated_hours: 3.5,
          stop_count: 12,
          priority: 'high',
          schedule: 'daily',
          time_window: '9:00 AM - 12:30 PM'
        }
      },
      {
        name: 'Route 003 - Kadavanthra-Vyttila',
        code: 'ROUTE-003',
        metadata: {
          zone: 'Kadavanthra',
          areas: ['Kadavanthra', 'Vyttila', 'Palarivattom'],
          distance_km: 32,
          estimated_hours: 4,
          stop_count: 18,
          priority: 'medium',
          schedule: 'daily',
          time_window: '10:00 AM - 2:00 PM'
        }
      },
      {
        name: 'Route 004 - Kakkanad Tech Park',
        code: 'ROUTE-004',
        metadata: {
          zone: 'Kakkanad',
          areas: ['Kakkanad', 'InfoPark', 'Thrikkakara'],
          distance_km: 40,
          estimated_hours: 4.5,
          stop_count: 20,
          priority: 'high',
          schedule: 'daily',
          time_window: '11:00 AM - 3:30 PM'
        }
      }
    ];

    const routeIds = {};
    for (const route of routes) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'delivery_route',
          entity_name: route.name,
          entity_code: route.code,
          smart_code: 'HERA.DIST.ROUTE.DELIVERY.v1',
          metadata: route.metadata
        })
        .select()
        .single();

      if (!error) {
        routeIds[route.code] = data.id;
        console.log(`✅ Created: ${route.name}`);
      }
    }

    // 6. Create Sample Customers/Retailers
    console.log('\n🏪 Creating Sample Customers/Retailers...');
    const customers = [
      {
        name: 'Fresh Mart - Fort Kochi',
        code: 'CUST-FM-001',
        route: 'ROUTE-001',
        metadata: {
          type: 'supermarket',
          contact_person: 'John Thomas',
          contact_phone: '+91-9876501234',
          address: 'Princess Street, Fort Kochi',
          coordinates: { lat: 9.9658, lng: 76.2422 },
          credit_limit: 50000,
          payment_terms: 'NET30',
          delivery_preference: 'morning',
          special_instructions: 'Call before delivery'
        }
      },
      {
        name: 'ABC Stores - MG Road',
        code: 'CUST-ABC-002',
        route: 'ROUTE-002',
        metadata: {
          type: 'convenience_store',
          contact_person: 'Mary Joseph',
          contact_phone: '+91-9876502345',
          address: 'MG Road, Ernakulam',
          coordinates: { lat: 9.9847, lng: 76.2794 },
          credit_limit: 30000,
          payment_terms: 'NET15',
          delivery_preference: 'morning',
          special_instructions: 'Use back entrance'
        }
      },
      {
        name: 'Tech Park Cafeteria',
        code: 'CUST-TPC-003',
        route: 'ROUTE-004',
        metadata: {
          type: 'cafeteria',
          contact_person: 'Arun Nair',
          contact_phone: '+91-9876503456',
          address: 'InfoPark Campus, Kakkanad',
          coordinates: { lat: 10.0087, lng: 76.3642 },
          credit_limit: 75000,
          payment_terms: 'NET30',
          delivery_preference: 'before_lunch',
          special_instructions: 'Deliver to Loading Bay 2'
        }
      }
    ];

    for (const customer of customers) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORG_ID,
          entity_type: 'customer',
          entity_name: customer.name,
          entity_code: customer.code,
          smart_code: 'HERA.DIST.CUSTOMER.RETAIL.v1',
          metadata: customer.metadata
        })
        .select()
        .single();

      if (!error) {
        console.log(`✅ Created: ${customer.name}`);
        
        // Link customer to route
        const routeId = routeIds[customer.route];
        if (routeId) {
          await supabase
            .from('core_relationships')
            .insert({
              organization_id: ORG_ID,
              from_entity_id: routeId,
              to_entity_id: data.id,
              relationship_type: 'route_includes',
              smart_code: 'HERA.DIST.REL.ROUTE.CUSTOMER.v1',
              relationship_data: {
                stop_sequence: customers.indexOf(customer) + 1,
                delivery_window: customer.metadata.delivery_preference,
                active: true
              }
            });
        }
      }
    }

    // 7. Link Routes to Vehicles
    console.log('\n🔗 Assigning Routes to Vehicles...');
    const routeAssignments = [
      { route: 'ROUTE-001', vehicle: 'VEH-001' },
      { route: 'ROUTE-002', vehicle: 'VEH-002' },
      { route: 'ROUTE-003', vehicle: 'VEH-003' },
      { route: 'ROUTE-004', vehicle: 'VEH-001' } // Large truck handles 2 routes
    ];

    for (const assignment of routeAssignments) {
      const routeId = routeIds[assignment.route];
      const vehicleId = vehicleIds[assignment.vehicle];
      
      if (routeId && vehicleId) {
        await supabase
          .from('core_relationships')
          .insert({
            organization_id: ORG_ID,
            from_entity_id: vehicleId,
            to_entity_id: routeId,
            relationship_type: 'serves_route',
            smart_code: 'HERA.DIST.REL.VEHICLE.ROUTE.v1',
            relationship_data: {
              assignment_date: new Date().toISOString(),
              schedule: 'daily',
              status: 'active'
            }
          });
        console.log(`✅ Assigned ${assignment.vehicle} to ${assignment.route}`);
      }
    }

    console.log('\n✅ Distribution system setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Distribution Centers: ${distributionCenters.length}`);
    console.log(`- Vehicles: ${vehicles.length}`);
    console.log(`- Drivers: ${drivers.length}`);
    console.log(`- Routes: ${routes.length}`);
    console.log(`- Sample Customers: ${customers.length}`);

  } catch (error) {
    console.error('Error setting up distribution system:', error);
  }
}

// Run the setup
setupDistributionSystem();