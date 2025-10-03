import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Organization ID for Hair Talkz
const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674' // michele@hairtalkz.com

async function seedSalonStaff() {
  console.log('🚀 Starting salon staff seed with direct database inserts...\n')

  const results = {
    roles: [],
    staff: [],
    dynamicData: [],
    relationships: []
  }

  try {
    // Step 1: Create roles
    console.log('📋 Creating roles...')
    const roleDefinitions = [
      { name: 'Owner', code: 'ROLE-OWNER', permissions: ['all'] },
      { name: 'Manager', code: 'ROLE-MANAGER', permissions: ['manage_staff', 'manage_services', 'view_reports'] },
      { name: 'Senior Stylist', code: 'ROLE-SENIOR', permissions: ['perform_services', 'manage_appointments'] },
      { name: 'Junior Stylist', code: 'ROLE-JUNIOR', permissions: ['perform_services'] },
      { name: 'Therapist', code: 'ROLE-THERAPIST', permissions: ['perform_spa_services'] },
      { name: 'Receptionist', code: 'ROLE-RECEPTIONIST', permissions: ['manage_appointments', 'manage_customers'] }
    ]

    for (const roleDef of roleDefinitions) {
      const { data: role, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'ROLE',
          entity_name: roleDef.name,
          entity_code: roleDef.code,
          smart_code: `HERA.SALON.ROLE.ENTITY.${roleDef.name.replace(/\s+/g, '_').toUpperCase()}.V1`,
          metadata: { permissions: roleDef.permissions },
          created_by: USER_ID,
          updated_by: USER_ID
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ Failed to create role ${roleDef.name}:`, error.message)
      } else {
        console.log(`✅ Created role: ${roleDef.name}`)
        results.roles.push(role)
      }
    }

    console.log(`\n✅ Created ${results.roles.length} roles`)

    // Step 2: Create staff members
    console.log('\n👥 Creating staff members...')
    
    // Map role names to their IDs
    const roleMap = {}
    for (const role of results.roles) {
      roleMap[role.entity_name] = role.id
    }

    const staffDefinitions = [
      {
        name: 'Sarah Johnson',
        code: 'STAFF-001',
        role: 'Owner',
        email: 'sarah@hairtalkz.com',
        phone: '+971 50 123 4567',
        skills: ['Business Management', 'Advanced Color', 'Hair Extensions'],
        bio: 'Founder and owner of Hair Talkz with 20 years of industry experience.',
        hourly_cost: 150
      },
      {
        name: 'Maya Pereira',
        code: 'STAFF-002',
        role: 'Manager',
        email: 'maya@hairtalkz.com',
        phone: '+971 55 234 5678',
        skills: ['Team Management', 'Customer Service', 'Inventory Management'],
        bio: 'Operations manager ensuring smooth daily operations and exceptional customer experiences.',
        hourly_cost: 80
      },
      {
        name: 'Amara Hassan',
        code: 'STAFF-003',
        role: 'Senior Stylist',
        email: 'amara@hairtalkz.com',
        phone: '+971 52 345 6789',
        skills: ['Precision Cutting', 'Balayage', 'Keratin Treatment', 'Bridal Styling'],
        bio: 'Award-winning stylist specializing in modern cuts and color techniques.',
        hourly_cost: 100
      },
      {
        name: 'Layla Al-Rashid',
        code: 'STAFF-004',
        role: 'Senior Stylist',
        email: 'layla@hairtalkz.com',
        phone: '+971 54 456 7890',
        skills: ['Creative Color', 'Japanese Straightening', 'Hair Extensions', 'Updos'],
        bio: 'Color specialist with expertise in creative and corrective color services.',
        hourly_cost: 100
      },
      {
        name: 'Fatima Ahmed',
        code: 'STAFF-005',
        role: 'Therapist',
        email: 'fatima@hairtalkz.com',
        phone: '+971 56 567 8901',
        skills: ['Deep Tissue Massage', 'Hot Stone Therapy', 'Aromatherapy', 'Reflexology'],
        bio: 'Licensed massage therapist with holistic approach to wellness and relaxation.',
        hourly_cost: 75
      },
      {
        name: 'Noor Malik',
        code: 'STAFF-006',
        role: 'Junior Stylist',
        email: 'noor@hairtalkz.com',
        phone: '+971 58 678 9012',
        skills: ['Blow Dry', 'Basic Color', 'Men\'s Cuts', 'Beard Grooming'],
        bio: 'Enthusiastic junior stylist with fresh ideas and dedication to learning.',
        hourly_cost: 50
      },
      {
        name: 'Aisha Omar',
        code: 'STAFF-007',
        role: 'Junior Stylist',
        email: 'aisha@hairtalkz.com',
        phone: '+971 50 789 0123',
        skills: ['Hair Washing', 'Basic Styling', 'Braiding', 'Children\'s Cuts'],
        bio: 'Talented junior stylist with a gentle touch, especially loved by young clients.',
        hourly_cost: 50
      },
      {
        name: 'Zahra Al-Zahra',
        code: 'STAFF-008',
        role: 'Receptionist',
        email: 'zahra@hairtalkz.com',
        phone: '+971 52 890 1234',
        skills: ['Appointment Management', 'Customer Service', 'POS Systems', 'Multi-lingual'],
        bio: 'Friendly face of Hair Talkz, fluent in Arabic, English, and Hindi.',
        hourly_cost: 35
      },
      {
        name: 'Mariam Khalil',
        code: 'STAFF-009',
        role: 'Therapist',
        email: 'mariam@hairtalkz.com',
        phone: '+971 54 901 2345',
        skills: ['Facials', 'Microdermabrasion', 'Chemical Peels', 'Eyebrow Threading'],
        bio: 'Skincare specialist with expertise in advanced facial treatments.',
        hourly_cost: 70
      },
      {
        name: 'Hala Saeed',
        code: 'STAFF-010',
        role: 'Senior Stylist',
        email: 'hala@hairtalkz.com',
        phone: '+971 56 012 3456',
        skills: ['Vintage Styling', 'Pin-up Hair', 'Victory Rolls', 'Finger Waves'],
        bio: 'Specialist in vintage and retro hairstyles, perfect for special occasions.',
        hourly_cost: 90
      }
    ]

    for (const staffDef of staffDefinitions) {
      // Create staff entity
      const { data: staff, error: staffError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: ORGANIZATION_ID,
          entity_type: 'STAFF',
          entity_name: staffDef.name,
          entity_code: staffDef.code,
          smart_code: 'HERA.SALON.STAFF.ENTITY.MEMBER.V1',
          metadata: {
            email: staffDef.email,
            role: staffDef.role
          },
          created_by: USER_ID,
          updated_by: USER_ID
        })
        .select()
        .single()

      if (staffError) {
        console.error(`❌ Failed to create staff ${staffDef.name}:`, staffError.message)
        continue
      }

      console.log(`✅ Created staff: ${staffDef.name}`)
      results.staff.push(staff)

      // Add dynamic data fields
      const dynamicFields = [
        { name: 'first_name', value: staffDef.name.split(' ')[0], type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1' },
        { name: 'last_name', value: staffDef.name.split(' ').slice(1).join(' '), type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1' },
        { name: 'email', value: staffDef.email, type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1' },
        { name: 'phone', value: staffDef.phone, type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1' },
        { name: 'status', value: 'active', type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1' },
        { name: 'hire_date', value: '2024-01-01', type: 'date', smart_code: 'HERA.SALON.STAFF.DYN.HIRE_DATE.V1' },
        { name: 'hourly_cost', value: staffDef.hourly_cost, type: 'number', smart_code: 'HERA.SALON.STAFF.DYN.HOURLY_COST.V1' },
        { name: 'skills', value: staffDef.skills, type: 'json', smart_code: 'HERA.SALON.STAFF.DYN.SKILLS.V1' },
        { name: 'bio', value: staffDef.bio, type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.BIO.V1' },
        { name: 'role_title', value: staffDef.role, type: 'text', smart_code: 'HERA.SALON.STAFF.DYN.ROLE_TITLE.V1' }
      ]

      for (const field of dynamicFields) {
        const dynamicData = {
          organization_id: ORGANIZATION_ID,
          entity_id: staff.id,
          field_name: field.name,
          field_type: field.type,
          smart_code: field.smart_code,
          created_by: USER_ID,
          updated_by: USER_ID
        }

        // Set the appropriate value field
        if (field.type === 'text') {
          dynamicData.field_value_text = field.value
        } else if (field.type === 'number') {
          dynamicData.field_value_number = field.value
        } else if (field.type === 'date') {
          dynamicData.field_value_date = field.value
        } else if (field.type === 'json') {
          dynamicData.field_value_json = field.value
        }

        const { data, error: dynError } = await supabase
          .from('core_dynamic_data')
          .insert(dynamicData)
          .select()

        if (dynError) {
          console.error(`   ❌ Failed to set ${field.name}:`, dynError.message)
        } else {
          results.dynamicData.push(data[0])
        }
      }

      // Create relationship to role
      const roleId = roleMap[staffDef.role]
      if (roleId) {
        const { data: rel, error: relError } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: ORGANIZATION_ID,
            from_entity_id: staff.id,
            to_entity_id: roleId,
            relationship_type: 'HAS_ROLE',
            smart_code: 'HERA.SALON.STAFF.REL.HAS_ROLE.V1',
            created_by: USER_ID,
            updated_by: USER_ID
          })
          .select()

        if (relError) {
          console.error(`   ❌ Failed to assign role:`, relError.message)
        } else {
          results.relationships.push(rel[0])
        }
      }
    }

    console.log(`\n✅ Created ${results.staff.length} staff members`)
    console.log(`✅ Set ${results.dynamicData.length} dynamic fields`)
    console.log(`✅ Created ${results.relationships.length} relationships`)

    // Summary
    console.log('\n🎉 Salon staff seed completed!')
    console.log(`  Roles: ${results.roles.length}`)
    console.log(`  Staff: ${results.staff.length}`)
    console.log(`  Dynamic Fields: ${results.dynamicData.length}`)
    console.log(`  Relationships: ${results.relationships.length}`)

  } catch (error) {
    console.error('❌ Seed failed:', error)
  }
}

seedSalonStaff().catch(console.error)