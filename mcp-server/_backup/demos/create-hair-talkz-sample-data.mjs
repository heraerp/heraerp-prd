import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const micheleUserId = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'

console.log('=== CREATING HAIR TALKZ SAMPLE DATA ===')

async function createSampleData() {
  try {
    console.log('1. Creating salon services...')
    
    const services = [
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'SERVICE',
        entity_name: 'Hair Cut & Style',
        entity_code: 'SVC-HAIRCUT',
        smart_code: 'HERA.SALON.SVC.HAIRCUT.STANDARD.V1',
        status: 'active',
        metadata: {
          category: 'hair_services',
          duration_minutes: 60,
          base_price: 85.00,
          description: 'Professional hair cut and styling service'
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'SERVICE',
        entity_name: 'Hair Color & Highlights',
        entity_code: 'SVC-COLOR',
        smart_code: 'HERA.SALON.SVC.COLOR.PREMIUM.V1',
        status: 'active',
        metadata: {
          category: 'color_services',
          duration_minutes: 120,
          base_price: 150.00,
          description: 'Full color service with highlights'
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'SERVICE',
        entity_name: 'Blowout & Styling',
        entity_code: 'SVC-BLOWOUT',
        smart_code: 'HERA.SALON.SVC.STYLING.EXPRESS.V1',
        status: 'active',
        metadata: {
          category: 'styling_services',
          duration_minutes: 45,
          base_price: 65.00,
          description: 'Professional blowout and styling'
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'SERVICE',
        entity_name: 'Deep Conditioning Treatment',
        entity_code: 'SVC-TREATMENT',
        smart_code: 'HERA.SALON.SVC.TREATMENT.PREMIUM.V1',
        status: 'active',
        metadata: {
          category: 'treatment_services',
          duration_minutes: 30,
          base_price: 45.00,
          description: 'Intensive hair treatment and conditioning'
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'SERVICE',
        entity_name: 'Bridal Hair & Makeup',
        entity_code: 'SVC-BRIDAL',
        smart_code: 'HERA.SALON.SVC.BRIDAL.LUXURY.V1',
        status: 'active',
        metadata: {
          category: 'special_services',
          duration_minutes: 180,
          base_price: 350.00,
          description: 'Complete bridal hair and makeup package'
        }
      }
    ]
    
    for (const service of services) {
      const { error: serviceError } = await supabase
        .from('core_entities')
        .insert(service)
      
      if (serviceError) {
        console.error(`❌ Failed to create service ${service.entity_name}:`, serviceError)
      } else {
        console.log(`✅ Created service: ${service.entity_name} (${service.metadata.base_price} AED)`)
      }
    }
    
    console.log('\\n2. Creating staff members...')
    
    const staff = [
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'STAFF',
        entity_name: 'Michele Rossi',
        entity_code: 'STAFF-MICHELE',
        smart_code: 'HERA.SALON.STAFF.OWNER.V1',
        status: 'active',
        metadata: {
          role: 'owner',
          specialties: ['color', 'cut', 'styling', 'bridal'],
          hire_date: '2024-01-01',
          phone: '+971-50-123-4567',
          email: 'michele@hairtalkz.ae',
          commission_rate: 0,
          is_owner: true
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'STAFF',
        entity_name: 'Sarah Johnson',
        entity_code: 'STAFF-SARAH',
        smart_code: 'HERA.SALON.STAFF.STYLIST.V1',
        status: 'active',
        metadata: {
          role: 'senior_stylist',
          specialties: ['cut', 'styling'],
          hire_date: '2024-02-15',
          phone: '+971-50-234-5678',
          email: 'sarah@hairtalkz.ae',
          commission_rate: 0.5,
          is_owner: false
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'STAFF',
        entity_name: 'Emma Martinez',
        entity_code: 'STAFF-EMMA',
        smart_code: 'HERA.SALON.STAFF.COLORIST.V1',
        status: 'active',
        metadata: {
          role: 'color_specialist',
          specialties: ['color', 'highlights', 'treatments'],
          hire_date: '2024-03-01',
          phone: '+971-50-345-6789',
          email: 'emma@hairtalkz.ae',
          commission_rate: 0.55,
          is_owner: false
        }
      }
    ]
    
    for (const member of staff) {
      const { error: staffError } = await supabase
        .from('core_entities')
        .insert(member)
      
      if (staffError) {
        console.error(`❌ Failed to create staff ${member.entity_name}:`, staffError)
      } else {
        console.log(`✅ Created staff: ${member.entity_name} (${member.metadata.role})`)
      }
    }
    
    console.log('\\n3. Creating sample customers...')
    
    const customers = [
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'CUSTOMER',
        entity_name: 'Fatima Al-Zahra',
        entity_code: 'CUST-FATIMA',
        smart_code: 'HERA.SALON.CUSTOMER.PREMIUM.V1',
        status: 'active',
        metadata: {
          phone: '+971-50-111-2222',
          email: 'fatima.alzahra@example.ae',
          preferred_stylist: 'Michele Rossi',
          customer_since: '2024-01-15',
          notes: 'Prefers natural hair colors, allergic to ammonia',
          total_visits: 8,
          total_spent: 1200.00
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'CUSTOMER',
        entity_name: 'Aisha Hassan',
        entity_code: 'CUST-AISHA',
        smart_code: 'HERA.SALON.CUSTOMER.REGULAR.V1',
        status: 'active',
        metadata: {
          phone: '+971-50-222-3333',
          email: 'aisha.hassan@example.ae',
          preferred_stylist: 'Sarah Johnson',
          customer_since: '2024-02-01',
          notes: 'Loves bold colors and modern cuts',
          total_visits: 5,
          total_spent: 750.00
        }
      },
      {
        id: crypto.randomUUID(),
        organization_id: hairTalkzOrgId,
        entity_type: 'CUSTOMER',
        entity_name: 'Mariam Al-Mansouri',
        entity_code: 'CUST-MARIAM',
        smart_code: 'HERA.SALON.CUSTOMER.VIP.V1',
        status: 'active',
        metadata: {
          phone: '+971-50-333-4444',
          email: 'mariam.almansouri@example.ae',
          preferred_stylist: 'Emma Martinez',
          customer_since: '2024-01-01',
          notes: 'VIP client - prefers luxury treatments',
          total_visits: 12,
          total_spent: 2100.00
        }
      }
    ]
    
    for (const customer of customers) {
      const { error: customerError } = await supabase
        .from('core_entities')
        .insert(customer)
      
      if (customerError) {
        console.error(`❌ Failed to create customer ${customer.entity_name}:`, customerError)
      } else {
        console.log(`✅ Created customer: ${customer.entity_name} (${customer.metadata.total_visits} visits)`)
      }
    }
    
    console.log('\\n4. Verification - checking created data...')
    
    const { data: serviceCount } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'SERVICE')
    
    const { data: staffCount } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'STAFF')
    
    const { data: customerCount } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', hairTalkzOrgId)
      .eq('entity_type', 'CUSTOMER')
    
    console.log('\\n📊 HAIR TALKZ SALON DATA SUMMARY:')
    console.log('================================')
    console.log(`✅ Services Created: ${serviceCount?.length || 0}`)
    console.log(`✅ Staff Members: ${staffCount?.length || 0}`)
    console.log(`✅ Customers: ${customerCount?.length || 0}`)
    console.log('')
    console.log('🎉 SAMPLE DATA CREATION COMPLETE!')
    console.log('')
    console.log('📋 Michele can now:')
    console.log('  • View and manage 5 salon services')
    console.log('  • Manage 3 staff members (including herself)')
    console.log('  • Access 3 customer profiles')
    console.log('  • Book appointments and manage the salon')
    console.log('  • See realistic business data in the dashboard')
    
  } catch (error) {
    console.error('💥 Sample data creation failed:', error)
  }
}

createSampleData().catch(console.error)