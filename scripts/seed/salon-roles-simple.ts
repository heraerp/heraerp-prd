#!/usr/bin/env ts-node

/**
 * Simple script to create salon roles using the Universal API
 */

const API_BASE_URL = 'http://localhost:3000/api/v2'

// Role definitions
const ROLES = [
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

async function createRole(role: typeof ROLES[0]) {
  const response = await fetch(`${API_BASE_URL}/entities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer demo-token-salon-receptionist'
    },
    body: JSON.stringify({
      entity_type: 'ROLE',
      entity_name: role.title,
      entity_code: `ROLE-${role.title.toUpperCase().replace(/\s+/g, '_')}`,
      smart_code: 'HERA.SALON.ROLE.ENTITY.POSITION.V1',
      dynamic_fields: {
        title: {
          value: role.title,
          type: 'text',
          smart_code: 'HERA.SALON.ROLE.DYN.TITLE.V1'
        },
        description: {
          value: role.description,
          type: 'text',
          smart_code: 'HERA.SALON.ROLE.DYN.DESCRIPTION.V1'
        },
        permissions: {
          value: role.permissions,
          type: 'json',
          smart_code: 'HERA.SALON.ROLE.DYN.PERMISSIONS.V1'
        },
        rank: {
          value: role.rank,
          type: 'number',
          smart_code: 'HERA.SALON.ROLE.DYN.RANK.V1'
        },
        active: {
          value: true,
          type: 'boolean',
          smart_code: 'HERA.SALON.ROLE.DYN.ACTIVE.V1'
        }
      }
    })
  })
  
  const result = await response.json()
  
  if (response.ok && result.success) {
    console.log(`✅ Created role: ${role.title}`)
    return result.data.id
  } else {
    console.error(`❌ Failed to create role ${role.title}:`, result.error || result)
    return null
  }
}

async function main() {
  console.log('🚀 Creating salon roles...\n')
  
  for (const role of ROLES) {
    await createRole(role)
  }
  
  console.log('\n✨ Done!')
}

// Run the script
main().catch(console.error)