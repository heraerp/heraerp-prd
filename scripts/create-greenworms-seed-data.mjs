#!/usr/bin/env node

/**
 * Greenworms Seed Data Generator
 * Creates realistic customer data for waste management business
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

// Realistic customer data for Greenworms waste management
const customersSeedData = [
  {
    customer_name: 'Green Valley Apartments',
    customer_type: 'Residential Complex',
    billing_email: 'admin@greenvalley.com',
    phone: '+971-4-555-0101',
    contract_type: 'Monthly Collection',
    billing_terms: 'Net 30',
    geo_location: 'Dubai Marina',
    service_level: 'Premium',
    route_code: 'DM-001',
    units: 150,
    monthly_waste: '12.5 tons'
  },
  {
    customer_name: 'Emirates Mall',
    customer_type: 'Commercial',
    billing_email: 'facilities@emiratesmall.ae',
    phone: '+971-4-555-0102',
    contract_type: 'Daily Collection',
    billing_terms: 'Net 15',
    geo_location: 'Sheikh Zayed Road',
    service_level: 'Enterprise',
    route_code: 'SZR-002',
    units: 1,
    monthly_waste: '45.2 tons'
  },
  {
    customer_name: 'Al Barsha Villas Community',
    customer_type: 'Residential Community',
    billing_email: 'community@albarsha.ae',
    phone: '+971-4-555-0103',
    contract_type: 'Bi-weekly Collection',
    billing_terms: 'Net 30',
    geo_location: 'Al Barsha',
    service_level: 'Standard',
    route_code: 'AB-003',
    units: 89,
    monthly_waste: '8.9 tons'
  },
  {
    customer_name: 'Dubai Municipality',
    customer_type: 'Government',
    billing_email: 'procurement@dm.gov.ae',
    phone: '+971-4-555-0104',
    contract_type: 'Annual Contract',
    billing_terms: 'Net 45',
    geo_location: 'Downtown Dubai',
    service_level: 'Municipal',
    route_code: 'DD-004',
    units: 5,
    monthly_waste: '125.8 tons'
  },
  {
    customer_name: 'Business Bay Towers',
    customer_type: 'Commercial Complex',
    billing_email: 'management@bbtowers.com',
    phone: '+971-4-555-0105',
    contract_type: 'Daily Collection',
    billing_terms: 'Net 30',
    geo_location: 'Business Bay',
    service_level: 'Premium',
    route_code: 'BB-005',
    units: 25,
    monthly_waste: '28.3 tons'
  },
  {
    customer_name: 'Jumeirah Beach Residence',
    customer_type: 'Residential Complex',
    billing_email: 'facilities@jbr.ae',
    phone: '+971-4-555-0106',
    contract_type: 'Daily Collection',
    billing_terms: 'Net 15',
    geo_location: 'JBR',
    service_level: 'Premium',
    route_code: 'JBR-006',
    units: 680,
    monthly_waste: '89.4 tons'
  },
  {
    customer_name: 'ADCB Bank HQ',
    customer_type: 'Commercial Office',
    billing_email: 'facilities@adcb.com',
    phone: '+971-4-555-0107',
    contract_type: 'Weekly Collection',
    billing_terms: 'Net 30',
    geo_location: 'DIFC',
    service_level: 'Corporate',
    route_code: 'DF-007',
    units: 1,
    monthly_waste: '5.2 tons'
  },
  {
    customer_name: 'Deira City Centre',
    customer_type: 'Shopping Mall',
    billing_email: 'operations@dcc.ae',
    phone: '+971-4-555-0108',
    contract_type: 'Daily Collection',
    billing_terms: 'Net 15',
    geo_location: 'Deira',
    service_level: 'Enterprise',
    route_code: 'DE-008',
    units: 1,
    monthly_waste: '78.6 tons'
  },
  {
    customer_name: 'The Springs Community',
    customer_type: 'Residential Community',
    billing_email: 'community@thesprings.ae',
    phone: '+971-4-555-0109',
    contract_type: 'Bi-weekly Collection',
    billing_terms: 'Net 30',
    geo_location: 'Emirates Hills',
    service_level: 'Premium',
    route_code: 'EH-009',
    units: 120,
    monthly_waste: '15.8 tons'
  },
  {
    customer_name: 'Dubai International Airport',
    customer_type: 'Airport/Transport',
    billing_email: 'procurement@dubaiairport.com',
    phone: '+971-4-555-0110',
    contract_type: 'Annual Contract',
    billing_terms: 'Net 60',
    geo_location: 'Al Garhoud',
    service_level: 'Critical Infrastructure',
    route_code: 'AG-010',
    units: 3,
    monthly_waste: '245.7 tons'
  },
  {
    customer_name: 'Ibn Battuta Mall',
    customer_type: 'Shopping Mall',
    billing_email: 'facilities@ibnbattutamall.com',
    phone: '+971-4-555-0111',
    contract_type: 'Daily Collection',
    billing_terms: 'Net 15',
    geo_location: 'Jebel Ali',
    service_level: 'Enterprise',
    route_code: 'JA-011',
    units: 1,
    monthly_waste: '67.3 tons'
  },
  {
    customer_name: 'Silicon Oasis Residential',
    customer_type: 'Residential Complex',
    billing_email: 'management@dso.ae',
    phone: '+971-4-555-0112',
    contract_type: 'Weekly Collection',
    billing_terms: 'Net 30',
    geo_location: 'Dubai Silicon Oasis',
    service_level: 'Standard',
    route_code: 'SO-012',
    units: 250,
    monthly_waste: '22.1 tons'
  }
]

async function createCustomers() {
  console.log('🌱 Creating Greenworms seed customers...')
  
  for (const customerData of customersSeedData) {
    try {
      const entityId = randomUUID()
      
      // Create entity with dynamic fields
      const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: DEMO_USER_ID,
        p_organization_id: GREENWORMS_ORG_ID,
        p_entity: {
          entity_type: 'CUSTOMER',
          entity_name: customerData.customer_name,
          smart_code: 'HERA.WASTE.MASTER.ENTITY.CUSTOMER.v1'
        },
        p_dynamic: {
          customer_type: {
            field_type: 'text',
            field_value_text: customerData.customer_type,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.TYPE.v1'
          },
          billing_email: {
            field_type: 'email',
            field_value_text: customerData.billing_email,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.EMAIL.v1'
          },
          phone: {
            field_type: 'text',
            field_value_text: customerData.phone,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.PHONE.v1'
          },
          contract_type: {
            field_type: 'text',
            field_value_text: customerData.contract_type,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.CONTRACT.v1'
          },
          billing_terms: {
            field_type: 'text',
            field_value_text: customerData.billing_terms,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.BILLING.v1'
          },
          geo_location: {
            field_type: 'text',
            field_value_text: customerData.geo_location,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.LOCATION.v1'
          },
          service_level: {
            field_type: 'text',
            field_value_text: customerData.service_level,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.SERVICE.v1'
          },
          route_code: {
            field_type: 'text',
            field_value_text: customerData.route_code,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.ROUTE.v1'
          },
          units: {
            field_type: 'number',
            field_value_number: customerData.units,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.UNITS.v1'
          },
          monthly_waste: {
            field_type: 'text',
            field_value_text: customerData.monthly_waste,
            smart_code: 'HERA.WASTE.CUSTOMER.FIELD.WASTE.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      })

      if (error) {
        console.error(`❌ Error creating customer ${customerData.customer_name}:`, error)
      } else {
        console.log(`✅ Created customer: ${customerData.customer_name}`)
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Failed to create customer ${customerData.customer_name}:`, error)
    }
  }
  
  console.log('\n🎉 Greenworms seed data creation completed!')
  console.log('📊 Total customers created:', customersSeedData.length)
  console.log('🌐 View at: http://localhost:3000/customers')
}

// Run the seed data creation
createCustomers().catch(console.error)