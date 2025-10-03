#!/usr/bin/env node

/**
 * HERA Jewelry Demo Setup Script
 * 
 * This script provides the demo organization ID and user information
 * for the jewelry module demo environment.
 */

const JEWELRY_DEMO_ORG_ID = 'f8d2c5e7-9a4b-6c8d-0e1f-2a3b4c5d6e7f'

const DEMO_USERS = [
  {
    email: 'owner@jewelry-demo.com',
    fullName: 'Isabella Sterling',
    role: 'Owner',
    department: 'Executive',
    description: 'Full system access, financial oversight, strategic decisions'
  },
  {
    email: 'manager@jewelry-demo.com',
    fullName: 'Alexander Gold',
    role: 'Manager',
    department: 'Operations',
    description: 'Inventory management, staff oversight, customer relations'
  },
  {
    email: 'sales@jewelry-demo.com',
    fullName: 'Sophia Gemstone',
    role: 'Sales Associate',
    department: 'Sales',
    description: 'Customer service, transactions, product consultation'
  },
  {
    email: 'appraiser@jewelry-demo.com',
    fullName: 'Marcus Brilliant',
    role: 'Certified Appraiser',
    department: 'Appraisal',
    description: 'Jewelry appraisals, certifications, quality assessments'
  },
  {
    email: 'security@jewelry-demo.com',
    fullName: 'Victoria Noble',
    role: 'Security Manager',
    department: 'Security',
    description: 'Asset protection, vault management, insurance compliance'
  },
  {
    email: 'staff@jewelry-demo.com',
    fullName: 'Emma Precious',
    role: 'Staff Member',
    department: 'General',
    description: 'Basic access, customer assistance, inventory support'
  }
]

console.log('🏆 HERA Jewelry Demo Configuration')
console.log('=====================================')
console.log('')
console.log('Demo Organization ID:', JEWELRY_DEMO_ORG_ID)
console.log('')
console.log('Available Demo Users:')
console.log('====================')

DEMO_USERS.forEach(user => {
  console.log(`📧 ${user.email}`)
  console.log(`   Name: ${user.fullName}`)
  console.log(`   Role: ${user.role} (${user.department})`)
  console.log(`   Access: ${user.description}`)
  console.log('')
})

console.log('🔗 Quick Access URLs:')
console.log('=====================')
console.log('Demo Selection: http://localhost:3000/jewelry/demo')
console.log('Main Dashboard: http://localhost:3000/jewelry/dashboard')  
console.log('Global Search:  http://localhost:3000/jewelry/search')
console.log('')
console.log('📝 Demo Features:')
console.log('================')
console.log('✅ Role-based access control with 6 different user types')
console.log('✅ Organization isolation and context switching')
console.log('✅ Jewelry-themed glassmorphism UI with luxury aesthetics')
console.log('✅ Global search across all jewelry entities with faceted filters')
console.log('✅ Responsive design optimized for jewelry business workflows')
console.log('✅ Demo mode indicators and controlled external access')
console.log('')