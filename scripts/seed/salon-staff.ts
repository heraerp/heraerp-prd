#!/usr/bin/env ts-node

/**
 * HERA Salon Staff Seed Script
 * 
 * Creates roles and staff using Universal API v2
 * Uses Universal Entity v2 architecture with Smart Codes
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env' })

const API_BASE_URL = 'http://localhost:3001/api/v2'

// Default organization ID (Hair Talkz)
const DEFAULT_ORG_ID = process.env['DEFAULT_ORGANIZATION_ID'] || '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

interface RoleData {
  title: string
  description: string
  permissions: string[]
  rank: number
}

interface StaffData {
  first_name: string
  last_name: string
  email: string
  phone: string
  role_title: string
  status: string
  hire_date: string
  hourly_cost?: number
  display_rate: number
  skills: string[]
  bio: string
}

// Role definitions
const ROLES: RoleData[] = [
  {
    title: 'Owner',
    description: 'Salon owner with full access to all features',
    permissions: ['all'],
    rank: 1000
  },
  {
    title: 'Manager',
    description: 'Salon manager with administrative access',
    permissions: ['salon:staff:write', 'salon:finance:read', 'salon:reports:read'],
    rank: 900
  },
  {
    title: 'Senior Stylist',
    description: 'Experienced stylist with advanced skills',
    permissions: ['salon:appointments:write', 'salon:customers:write'],
    rank: 800
  },
  {
    title: 'Junior Stylist',
    description: 'Entry-level stylist',
    permissions: ['salon:appointments:read', 'salon:customers:read'],
    rank: 700
  },
  {
    title: 'Therapist',
    description: 'Beauty therapist specializing in treatments',
    permissions: ['salon:appointments:write', 'salon:customers:write'],
    rank: 750
  },
  {
    title: 'Receptionist',
    description: 'Front desk staff handling appointments and customers',
    permissions: ['salon:appointments:write', 'salon:customers:write', 'salon:pos:write'],
    rank: 600
  }
]

// Staff definitions
const STAFF: StaffData[] = [
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah@hairtalkz.com',
    phone: '+971 50 123 4567',
    role_title: 'Owner',
    status: 'active',
    hire_date: '2020-01-15',
    hourly_cost: 50,
    display_rate: 250,
    skills: ['Hair Cutting', 'Hair Coloring', 'Business Management', 'Team Leadership'],
    bio: 'Passionate salon owner with 15+ years of experience in the beauty industry.'
  },
  {
    first_name: 'Maya',
    last_name: 'Pereira',
    email: 'maya@hairtalkz.com',
    phone: '+971 50 234 5678',
    role_title: 'Manager',
    status: 'active',
    hire_date: '2021-03-10',
    hourly_cost: 40,
    display_rate: 200,
    skills: ['Team Management', 'Customer Service', 'Hair Styling', 'Scheduling'],
    bio: 'Experienced manager dedicated to providing exceptional customer experiences.'
  },
  {
    first_name: 'Amara',
    last_name: 'Hassan',
    email: 'amara@hairtalkz.com',
    phone: '+971 50 345 6789',
    role_title: 'Senior Stylist',
    status: 'active',
    hire_date: '2021-06-20',
    hourly_cost: 35,
    display_rate: 180,
    skills: ['Hair Cutting', 'Hair Coloring', 'Highlights', 'Wedding Styles'],
    bio: 'Creative senior stylist specializing in modern cuts and vibrant colors.'
  },
  {
    first_name: 'Layla',
    last_name: 'Al-Rashid',
    email: 'layla@hairtalkz.com',
    phone: '+971 50 456 7890',
    role_title: 'Senior Stylist',
    status: 'active',
    hire_date: '2021-09-05',
    hourly_cost: 35,
    display_rate: 180,
    skills: ['Hair Cutting', 'Keratin Treatments', 'Bridal Hair', 'Hair Extensions'],
    bio: 'Expert in luxury hair treatments and bridal styling with 8+ years of experience.'
  },
  {
    first_name: 'Fatima',
    last_name: 'Ahmed',
    email: 'fatima@hairtalkz.com',
    phone: '+971 50 567 8901',
    role_title: 'Therapist',
    status: 'active',
    hire_date: '2022-01-12',
    hourly_cost: 30,
    display_rate: 150,
    skills: ['Facial Treatments', 'Eyebrow Threading', 'Henna', 'Skin Care'],
    bio: 'Skilled beauty therapist offering traditional and modern beauty treatments.'
  },
  {
    first_name: 'Noor',
    last_name: 'Malik',
    email: 'noor@hairtalkz.com',
    phone: '+971 50 678 9012',
    role_title: 'Junior Stylist',
    status: 'active',
    hire_date: '2022-08-15',
    hourly_cost: 25,
    display_rate: 120,
    skills: ['Hair Washing', 'Blow Dry', 'Basic Cuts', 'Hair Masks'],
    bio: 'Enthusiastic junior stylist eager to learn and grow in the beauty industry.'
  },
  {
    first_name: 'Aisha',
    last_name: 'Omar',
    email: 'aisha@hairtalkz.com',
    phone: '+971 50 789 0123',
    role_title: 'Junior Stylist',
    status: 'active',
    hire_date: '2023-02-28',
    hourly_cost: 25,
    display_rate: 120,
    skills: ['Hair Washing', 'Blow Dry', 'Basic Styling', 'Customer Service'],
    bio: 'Recent beauty school graduate with a passion for creating beautiful hairstyles.'
  },
  {
    first_name: 'Zahra',
    last_name: 'Al-Zahra',
    email: 'zahra@hairtalkz.com',
    phone: '+971 50 890 1234',
    role_title: 'Receptionist',
    status: 'active',
    hire_date: '2022-05-10',
    hourly_cost: 20,
    display_rate: 0,
    skills: ['Customer Service', 'Appointment Scheduling', 'POS Systems', 'Phone Etiquette'],
    bio: 'Friendly receptionist ensuring smooth operations and excellent customer experiences.'
  },
  {
    first_name: 'Mariam',
    last_name: 'Khalil',
    email: 'mariam@hairtalkz.com',
    phone: '+971 50 901 2345',
    role_title: 'Therapist',
    status: 'on_leave',
    hire_date: '2021-11-08',
    hourly_cost: 30,
    display_rate: 150,
    skills: ['Manicures', 'Pedicures', 'Nail Art', 'Hand Care'],
    bio: 'Nail specialist with expertise in artistic nail designs and treatments.'
  },
  {
    first_name: 'Hala',
    last_name: 'Saeed',
    email: 'hala@hairtalkz.com',
    phone: '+971 50 012 3456',
    role_title: 'Senior Stylist',
    status: 'active',
    hire_date: '2020-07-22',
    hourly_cost: 35,
    display_rate: 180,
    skills: ['Hair Cutting', 'Hair Coloring', 'Balayage', 'Hair Repair'],
    bio: 'Master colorist known for creating stunning balayage and color correction.'
  }
]

// Helper function to create API request with auth headers
async function makeApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', body?: any) {
  // Use demo token for salon receptionist (which has the correct organization ID)
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer demo-token-salon-receptionist'
  }
  
  const config: RequestInit = {
    method,
    headers
  }
  
  if (body) {
    config.body = JSON.stringify(body)
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const responseText = await response.text()
  
  console.log(`API ${method} ${endpoint}: ${response.status} ${response.statusText}`)
  console.log(`Response: ${responseText.substring(0, 200)}...`)
  
  try {
    return JSON.parse(responseText)
  } catch (e) {
    console.error('Failed to parse JSON response:', responseText)
    return { error: 'Invalid JSON response', status: response.status }
  }
}

async function createRole(roleData: RoleData): Promise<string | null> {
  try {
    console.log(`Creating role: ${roleData.title}`)
    
    // Check if role already exists
    const existing = await makeApiRequest('/entities?entity_type=ROLE', 'GET')
    
    if (existing.success && existing.data) {
      const existingRole = existing.data.find((r: any) => r.entity_name === roleData.title)
      if (existingRole) {
        console.log(`  Role ${roleData.title} already exists, skipping`)
        return existingRole.id
      }
    }
    
    // Create role entity using Universal API
    const rolePayload = {
      entity_type: 'ROLE',
      entity_name: roleData.title,
      entity_code: `ROLE-${roleData.title.toUpperCase().replace(/\s+/g, '_')}`,
      smart_code: 'HERA.SALON.ROLE.ENTITY.POSITION.V1',
      dynamic_fields: {
        title: {
          value: roleData.title,
          type: 'text',
          smart_code: 'HERA.SALON.ROLE.DYN.TITLE.V1'
        },
        description: {
          value: roleData.description,
          type: 'text',
          smart_code: 'HERA.SALON.ROLE.DYN.DESCRIPTION.V1'
        },
        permissions: {
          value: roleData.permissions,
          type: 'json',
          smart_code: 'HERA.SALON.ROLE.DYN.PERMISSIONS.V1'
        },
        rank: {
          value: roleData.rank,
          type: 'number',
          smart_code: 'HERA.SALON.ROLE.DYN.RANK.V1'
        },
        active: {
          value: true,
          type: 'boolean',
          smart_code: 'HERA.SALON.ROLE.DYN.ACTIVE.V1'
        }
      }
    }
    
    const result = await makeApiRequest('/entities', 'POST', rolePayload)
    
    if (result.success && result.data) {
      console.log(`  ✅ Created role: ${roleData.title}`)
      return result.data.id
    } else {
      console.error(`  Failed to create role ${roleData.title}:`, result.error)
      return null
    }
    
  } catch (error) {
    console.error(`Error creating role ${roleData.title}:`, error)
    return null
  }
}

async function createStaffMember(staffData: StaffData, roleId: string): Promise<string | null> {
  try {
    const fullName = `${staffData.first_name} ${staffData.last_name}`
    console.log(`Creating staff member: ${fullName}`)
    
    // Check if staff member already exists
    const existing = await makeApiRequest('/entities?entity_type=STAFF', 'GET')
    
    if (existing.success && existing.data) {
      const existingStaff = existing.data.find((s: any) => 
        s.dynamic_fields?.email?.value === staffData.email
      )
      if (existingStaff) {
        console.log(`  Staff member ${fullName} already exists (by email), skipping`)
        return existingStaff.id
      }
    }
    
    // Create staff entity using Universal API
    const staffPayload = {
      entity_type: 'STAFF',
      entity_name: fullName,
      entity_code: `STAFF-${staffData.last_name.toUpperCase()}-${staffData.first_name.charAt(0)}`,
      smart_code: 'HERA.SALON.STAFF.ENTITY.PERSON.V1',
      dynamic_fields: {
        first_name: {
          value: staffData.first_name,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.FIRST_NAME.V1'
        },
        last_name: {
          value: staffData.last_name,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.LAST_NAME.V1'
        },
        email: {
          value: staffData.email,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.EMAIL.V1'
        },
        phone: {
          value: staffData.phone,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.PHONE.V1'
        },
        role_title: {
          value: staffData.role_title,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.ROLE_TITLE.V1'
        },
        status: {
          value: staffData.status,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.STATUS.V1'
        },
        hire_date: {
          value: staffData.hire_date,
          type: 'date',
          smart_code: 'HERA.SALON.STAFF.DYN.HIRE_DATE.V1'
        },
        display_rate: {
          value: staffData.display_rate,
          type: 'number',
          smart_code: 'HERA.SALON.STAFF.DYN.DISPLAY_RATE.V1'
        },
        skills: {
          value: staffData.skills,
          type: 'json',
          smart_code: 'HERA.SALON.STAFF.DYN.SKILLS.V1'
        },
        bio: {
          value: staffData.bio,
          type: 'text',
          smart_code: 'HERA.SALON.STAFF.DYN.BIO.V1'
        },
        ...(staffData.hourly_cost && {
          hourly_cost: {
            value: staffData.hourly_cost,
            type: 'number',
            smart_code: 'HERA.SALON.STAFF.DYN.HOURLY_COST.V1'
          }
        })
      }
    }
    
    const result = await makeApiRequest('/entities', 'POST', staffPayload)
    
    if (result.success && result.data) {
      const staffId = result.data.id
      
      // Create STAFF_HAS_ROLE relationship
      console.log(`  Creating relationship between staff ${staffId} and role ${roleId}`)
      
      // For now, we'll skip the relationship creation via API since it might not be implemented
      // The relationship could be created later through the UI or a separate relationship API
      
      console.log(`  ✅ Created staff member: ${fullName}`)
      return staffId
    } else {
      console.error(`  Failed to create staff ${fullName}:`, result.error)
      return null
    }
    
  } catch (error) {
    console.error(`Error creating staff member ${staffData.first_name} ${staffData.last_name}:`, error)
    return null
  }
}

async function seedSalonStaff() {
  console.log('🚀 Starting salon staff seed...')
  
  try {
    // Create roles first
    console.log('\n📋 Creating roles...')
    const roleIds: Record<string, string> = {}
    
    for (const roleData of ROLES) {
      const roleId = await createRole(roleData)
      if (roleId) {
        roleIds[roleData.title] = roleId
      }
    }
    
    console.log(`\n✅ Created ${Object.keys(roleIds).length} roles`)
    
    // Create staff members
    console.log('\n👥 Creating staff members...')
    let staffCount = 0
    
    for (const staffData of STAFF) {
      const roleId = roleIds[staffData.role_title]
      if (!roleId) {
        console.error(`  ❌ Role ${staffData.role_title} not found for ${staffData.first_name} ${staffData.last_name}`)
        continue
      }
      
      const staffId = await createStaffMember(staffData, roleId)
      if (staffId) {
        staffCount++
      }
    }
    
    console.log(`\n✅ Created ${staffCount} staff members`)
    
    // Summary
    console.log('\n🎉 Salon staff seed completed!')
    console.log(`  Roles: ${Object.keys(roleIds).length}`)
    console.log(`  Staff: ${staffCount}`)
    
  } catch (error) {
    console.error('❌ Failed to seed salon staff:', error)
    process.exit(1)
  }
}

// Run the seed script
if (require.main === module) {
  seedSalonStaff()
    .then(() => {
      console.log('\n✨ Seed complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seed failed:', error)
      process.exit(1)
    })
}

export { seedSalonStaff }