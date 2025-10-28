#!/usr/bin/env node

/**
 * Greenworms Fleet Vehicles Seed Data Generator
 * Creates realistic vehicle data for waste management fleet
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const GREENWORMS_ORG_ID = 'd4f50007-269b-4525-b534-cb5ddeed1d7e'
const DEMO_USER_ID = 'd6118aa6-14a2-4d10-b6b2-f2ac139c8722'

// Realistic fleet vehicles for Greenworms waste management
const vehiclesSeedData = [
  {
    vehicle_name: 'Compactor Truck 001',
    vehicle_type: 'Rear Load Compactor',
    registration_no: 'DXB-C-1001',
    vin: '1HGCM82633A004352',
    make: 'Peterbilt',
    model: '320',
    year: 2022,
    fuel_type: 'Diesel',
    capacity_tons: '15.5',
    odometer: '45,250',
    license_plate: 'WM1001',
    assigned_route: 'Route A-Marina',
    assigned_driver: 'Ahmed Al-Rashid',
    status: 'active',
    last_maintenance: '2025-09-15',
    next_maintenance: '2025-12-15',
    insurance_expiry: '2026-08-30',
    gps_enabled: true,
    emissions_compliant: true
  },
  {
    vehicle_name: 'Side Loader 002',
    vehicle_type: 'Side Load Compactor',
    registration_no: 'DXB-S-1002',
    vin: '1FDXE4FS6HDC48127',
    make: 'Freightliner',
    model: 'M2 106',
    year: 2021,
    fuel_type: 'CNG',
    capacity_tons: '12.8',
    odometer: '67,890',
    license_plate: 'WM1002',
    assigned_route: 'Route B-JBR',
    assigned_driver: 'Mohammed Hassan',
    status: 'active',
    last_maintenance: '2025-08-20',
    next_maintenance: '2025-11-20',
    insurance_expiry: '2026-05-15',
    gps_enabled: true,
    emissions_compliant: true
  },
  {
    vehicle_name: 'Hook Loader 003',
    vehicle_type: 'Hook Lift Truck',
    registration_no: 'DXB-H-1003',
    vin: '1FDUF5GY8GEA42896',
    make: 'Mack',
    model: 'TerraPro',
    year: 2023,
    fuel_type: 'Diesel',
    capacity_tons: '25.0',
    odometer: '28,450',
    license_plate: 'WM1003',
    assigned_route: 'Route C-Downtown',
    assigned_driver: 'Omar Abdullah',
    status: 'maintenance',
    last_maintenance: '2025-10-01',
    next_maintenance: '2025-12-01',
    insurance_expiry: '2026-12-10',
    gps_enabled: true,
    emissions_compliant: true
  },
  {
    vehicle_name: 'Street Sweeper 004',
    vehicle_type: 'Street Sweeper',
    registration_no: 'DXB-SW-1004',
    vin: '1HTMMAAL7JH123456',
    make: 'Dulevo',
    model: '6000 Evolution',
    year: 2020,
    fuel_type: 'Diesel',
    capacity_tons: '3.5',
    odometer: '89,120',
    license_plate: 'WM1004',
    assigned_route: 'Route D-Business Bay',
    assigned_driver: 'Khalid Mahmoud',
    status: 'active',
    last_maintenance: '2025-07-10',
    next_maintenance: '2025-10-10',
    insurance_expiry: '2026-03-20',
    gps_enabled: true,
    emissions_compliant: false
  },
  {
    vehicle_name: 'Roll-off Truck 005',
    vehicle_type: 'Roll-off Container Truck',
    registration_no: 'DXB-R-1005',
    vin: '1FDUF5GY2GEB15789',
    make: 'Volvo',
    model: 'VHD',
    year: 2019,
    fuel_type: 'Diesel',
    capacity_tons: '30.0',
    odometer: '125,670',
    license_plate: 'WM1005',
    assigned_route: 'Route E-Airport',
    assigned_driver: 'Hassan Ali',
    status: 'active',
    last_maintenance: '2025-09-05',
    next_maintenance: '2025-12-05',
    insurance_expiry: '2026-01-15',
    gps_enabled: true,
    emissions_compliant: true
  },
  {
    vehicle_name: 'Recycling Truck 006',
    vehicle_type: 'Recycling Compactor',
    registration_no: 'DXB-RC-1006',
    vin: '1HTWGAZT9DJ654321',
    make: 'Peterbilt',
    model: '320',
    year: 2022,
    fuel_type: 'Electric',
    capacity_tons: '14.2',
    odometer: '35,890',
    license_plate: 'WM1006',
    assigned_route: 'Route F-Deira',
    assigned_driver: 'Abdullah Rashid',
    status: 'active',
    last_maintenance: '2025-08-28',
    next_maintenance: '2025-11-28',
    insurance_expiry: '2026-07-05',
    gps_enabled: true,
    emissions_compliant: true
  },
  {
    vehicle_name: 'Flatbed Truck 007',
    vehicle_type: 'Flatbed Truck',
    registration_no: 'DXB-F-1007',
    vin: '1FTBF2B69HEB98765',
    make: 'Ford',
    model: 'F-750',
    year: 2021,
    fuel_type: 'Diesel',
    capacity_tons: '8.5',
    odometer: '58,340',
    license_plate: 'WM1007',
    assigned_route: 'Route G-Sharjah',
    assigned_driver: 'Saeed Ahmed',
    status: 'inactive',
    last_maintenance: '2025-06-15',
    next_maintenance: '2025-09-15',
    insurance_expiry: '2026-04-10',
    gps_enabled: false,
    emissions_compliant: true
  },
  {
    vehicle_name: 'Tipper Truck 008',
    vehicle_type: 'Tipper Truck',
    registration_no: 'DXB-T-1008',
    vin: '1HTSCACL9KH456789',
    make: 'Scania',
    model: 'R450',
    year: 2023,
    fuel_type: 'Diesel',
    capacity_tons: '18.0',
    odometer: '15,120',
    license_plate: 'WM1008',
    assigned_route: 'Route H-Ajman',
    assigned_driver: 'Mahmoud Khalil',
    status: 'active',
    last_maintenance: '2025-09-30',
    next_maintenance: '2025-12-30',
    insurance_expiry: '2026-11-25',
    gps_enabled: true,
    emissions_compliant: true
  }
]

async function createVehicles() {
  console.log('🚛 Creating Greenworms fleet vehicles...')
  
  for (const vehicleData of vehiclesSeedData) {
    try {
      const entityId = randomUUID()
      
      // Create vehicle entity with dynamic fields
      const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: DEMO_USER_ID,
        p_organization_id: GREENWORMS_ORG_ID,
        p_entity: {
          entity_type: 'VEHICLE',
          entity_name: vehicleData.vehicle_name,
          smart_code: 'HERA.WASTE.FLEET.ENTITY.VEHICLE.v1',
          status: vehicleData.status
        },
        p_dynamic: {
          vehicle_type: {
            field_type: 'text',
            field_value_text: vehicleData.vehicle_type,
            smart_code: 'HERA.WASTE.FLEET.FIELD.TYPE.v1'
          },
          registration_no: {
            field_type: 'text',
            field_value_text: vehicleData.registration_no,
            smart_code: 'HERA.WASTE.FLEET.FIELD.REGISTRATION.v1'
          },
          vin: {
            field_type: 'text',
            field_value_text: vehicleData.vin,
            smart_code: 'HERA.WASTE.FLEET.FIELD.VIN.v1'
          },
          make: {
            field_type: 'text',
            field_value_text: vehicleData.make,
            smart_code: 'HERA.WASTE.FLEET.FIELD.MAKE.v1'
          },
          model: {
            field_type: 'text',
            field_value_text: vehicleData.model,
            smart_code: 'HERA.WASTE.FLEET.FIELD.MODEL.v1'
          },
          year: {
            field_type: 'number',
            field_value_number: vehicleData.year,
            smart_code: 'HERA.WASTE.FLEET.FIELD.YEAR.v1'
          },
          fuel_type: {
            field_type: 'text',
            field_value_text: vehicleData.fuel_type,
            smart_code: 'HERA.WASTE.FLEET.FIELD.FUEL.v1'
          },
          capacity_tons: {
            field_type: 'text',
            field_value_text: vehicleData.capacity_tons,
            smart_code: 'HERA.WASTE.FLEET.FIELD.CAPACITY.v1'
          },
          odometer: {
            field_type: 'text',
            field_value_text: vehicleData.odometer,
            smart_code: 'HERA.WASTE.FLEET.FIELD.ODOMETER.v1'
          },
          license_plate: {
            field_type: 'text',
            field_value_text: vehicleData.license_plate,
            smart_code: 'HERA.WASTE.FLEET.FIELD.PLATE.v1'
          },
          assigned_route: {
            field_type: 'text',
            field_value_text: vehicleData.assigned_route,
            smart_code: 'HERA.WASTE.FLEET.FIELD.ROUTE.v1'
          },
          assigned_driver: {
            field_type: 'text',
            field_value_text: vehicleData.assigned_driver,
            smart_code: 'HERA.WASTE.FLEET.FIELD.DRIVER.v1'
          },
          last_maintenance: {
            field_type: 'date',
            field_value_text: vehicleData.last_maintenance,
            smart_code: 'HERA.WASTE.FLEET.FIELD.MAINTENANCE.v1'
          },
          next_maintenance: {
            field_type: 'date',
            field_value_text: vehicleData.next_maintenance,
            smart_code: 'HERA.WASTE.FLEET.FIELD.NEXT_MAINTENANCE.v1'
          },
          insurance_expiry: {
            field_type: 'date',
            field_value_text: vehicleData.insurance_expiry,
            smart_code: 'HERA.WASTE.FLEET.FIELD.INSURANCE.v1'
          },
          gps_enabled: {
            field_type: 'boolean',
            field_value_boolean: vehicleData.gps_enabled,
            smart_code: 'HERA.WASTE.FLEET.FIELD.GPS.v1'
          },
          emissions_compliant: {
            field_type: 'boolean',
            field_value_boolean: vehicleData.emissions_compliant,
            smart_code: 'HERA.WASTE.FLEET.FIELD.EMISSIONS.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      })

      if (error) {
        console.error(`❌ Error creating vehicle ${vehicleData.vehicle_name}:`, error)
      } else {
        console.log(`✅ Created vehicle: ${vehicleData.vehicle_name}`)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 150))
      
    } catch (error) {
      console.error(`❌ Failed to create vehicle ${vehicleData.vehicle_name}:`, error)
    }
  }
  
  console.log('\n🎉 Greenworms fleet vehicles seed data creation completed!')
  console.log('🚛 Total vehicles created:', vehiclesSeedData.length)
  console.log('🌐 View at: http://localhost:3000/greenworms/fleet-management/vehicles')
}

// Run the seed data creation
createVehicles().catch(console.error)