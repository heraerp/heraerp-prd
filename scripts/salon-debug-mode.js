#!/usr/bin/env node
/**
 * Enable or disable salon debug mode for development
 */

console.log('🔧 Salon Debug Mode Helper')
console.log('==========================\n')

console.log('To enable debug mode (bypass role checks), run this in browser console:')
console.log('')
console.log(`localStorage.setItem('salonDebugMode', 'true')`)
console.log(`window.location.reload()`)
console.log('')

console.log('To disable debug mode:')
console.log('')
console.log(`localStorage.removeItem('salonDebugMode')`)
console.log(`window.location.reload()`)
console.log('')

console.log('Current permissions by role:')
console.log('')
console.log('Owner: Full access to all pages')
console.log('Receptionist: Dashboard, Appointments, POS, Customers')
console.log('Accountant: Dashboard, Finance, Reports, Inventory')
console.log('Admin: Full access to all pages')
console.log('')

console.log('Pages that now have broader access:')
console.log('- Staff: owner, admin, receptionist, accountant')
console.log('- Products: owner, admin, receptionist, accountant')
console.log('- Inventory: owner, admin, receptionist, accountant')
console.log('- Finance: owner, accountant, admin, receptionist')
console.log('- Appointments: owner, receptionist, admin, accountant')
console.log('- Customers: owner, receptionist, admin, accountant')