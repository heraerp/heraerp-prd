/**
 * Seed salon staff using API v2
 * This uses the same pattern that worked for customers
 */

import { apiV2 } from '@/lib/client/fetchV2'

// Set up the auth token for michele@hairtalkz.com
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDliMGI5MmEtZDc5Ny00ODllLWJjMDMtNWNhMGE2MjcyNjc0IiwiZW1haWwiOiJtaWNoZWxlQGhhaXJ0YWxrei5jb20iLCJvcmdhbml6YXRpb25faWQiOiIwZmQwOWUzMS1kMjU3LTQzMjktOTdlYi03ZDdmNTIyZWQ2ZjAiLCJyb2xlcyI6W10sInBlcm1pc3Npb25zIjpbXX0._example_'

// Override fetch to include auth header
const originalFetch = global.fetch
global.fetch = async (url: string | Request, options?: RequestInit) => {
  const newOptions = {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${AUTH_TOKEN}`
    }
  }
  return originalFetch(url, newOptions)
}

async function seedSalonStaff() {
  console.log('🚀 Starting salon staff seed using API v2...\n')

  const results = {
    roles: [] as any[],
    staff: [] as any[],
    errors: [] as any[]
  }

  try {
    // Step 1: Create roles
    console.log('📋 Creating roles using API v2...')
    const roleDefinitions = [
      { name: 'Owner', code: 'ROLE-OWNER', permissions: ['all'] },
      { name: 'Manager', code: 'ROLE-MANAGER', permissions: ['manage_staff', 'manage_services', 'view_reports'] },
      { name: 'Senior Stylist', code: 'ROLE-SENIOR', permissions: ['perform_services', 'manage_appointments'] },
      { name: 'Junior Stylist', code: 'ROLE-JUNIOR', permissions: ['perform_services'] },
      { name: 'Therapist', code: 'ROLE-THERAPIST', permissions: ['perform_spa_services'] },
      { name: 'Receptionist', code: 'ROLE-RECEPTIONIST', permissions: ['manage_appointments', 'manage_customers'] }
    ]

    for (const roleDef of roleDefinitions) {
      try {
        const { data, error } = await apiV2.post('entities', {
          entity_type: 'ROLE',
          entity_name: roleDef.name,
          entity_code: roleDef.code,
          smart_code: `HERA.SALON.ROLE.ENTITY.${roleDef.name.replace(/\s+/g, '_').toUpperCase()}.V1`,
          metadata: { permissions: roleDef.permissions }
        })

        if (error) {
          console.error(`❌ Failed to create role ${roleDef.name}:`, error)
          results.errors.push({ role: roleDef.name, error })
        } else {
          console.log(`✅ Created role: ${roleDef.name}`)
          results.roles.push(data)
        }
      } catch (err) {
        console.error(`❌ Exception creating role ${roleDef.name}:`, err)
        results.errors.push({ role: roleDef.name, error: err })
      }
    }

    console.log(`\n✅ Created ${results.roles.length} roles`)

    // Step 2: Create staff members
    console.log('\n👥 Creating staff members using API v2...')
    
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
      }
    ]

    for (const staffDef of staffDefinitions) {
      try {
        const { data, error } = await apiV2.post('entities', {
          entity_type: 'STAFF',
          entity_name: staffDef.name,
          entity_code: staffDef.code,
          smart_code: 'HERA.SALON.STAFF.ENTITY.MEMBER.V1',
          metadata: {
            email: staffDef.email,
            role: staffDef.role
          },
          dynamic_fields: {
            first_name: {
              value: staffDef.name.split(' ')[0],
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1'
            },
            last_name: {
              value: staffDef.name.split(' ').slice(1).join(' '),
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1'
            },
            email: {
              value: staffDef.email,
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1'
            },
            phone: {
              value: staffDef.phone,
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1'
            },
            status: {
              value: 'active',
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1'
            },
            hire_date: {
              value: '2024-01-01',
              type: 'date',
              smart_code: 'HERA.SALON.STAFF.DYN.HIRE_DATE.V1'
            },
            hourly_cost: {
              value: staffDef.hourly_cost,
              type: 'number',
              smart_code: 'HERA.SALON.STAFF.DYN.HOURLY_COST.V1'
            },
            skills: {
              value: staffDef.skills,
              type: 'json',
              smart_code: 'HERA.SALON.STAFF.DYN.SKILLS.V1'
            },
            bio: {
              value: staffDef.bio,
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.BIO.V1'
            },
            role_title: {
              value: staffDef.role,
              type: 'text',
              smart_code: 'HERA.SALON.STAFF.DYN.ROLE_TITLE.V1'
            }
          }
        })

        if (error) {
          console.error(`❌ Failed to create staff ${staffDef.name}:`, error)
          results.errors.push({ staff: staffDef.name, error })
        } else {
          console.log(`✅ Created staff: ${staffDef.name}`)
          results.staff.push(data)
        }
      } catch (err) {
        console.error(`❌ Exception creating staff ${staffDef.name}:`, err)
        results.errors.push({ staff: staffDef.name, error: err })
      }
    }

    console.log(`\n✅ Created ${results.staff.length} staff members`)

    // Summary
    console.log('\n🎉 Salon staff seed summary:')
    console.log(`  Roles: ${results.roles.length}`)
    console.log(`  Staff: ${results.staff.length}`)
    console.log(`  Errors: ${results.errors.length}`)

    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:')
      results.errors.forEach(err => {
        console.log(`  - ${JSON.stringify(err)}`)
      })
    }

  } catch (error) {
    console.error('❌ Seed failed:', error)
  }
}

// Run the seed when this file is executed directly
if (require.main === module) {
  seedSalonStaff().catch(console.error)
}

export { seedSalonStaff }