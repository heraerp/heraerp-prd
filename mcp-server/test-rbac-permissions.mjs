/**
 * Test RBAC Permissions
 *
 * Verifies role-based access control configuration
 * Tests permission checks for all roles and common pages
 */

// Simulated RBAC functions (copy from salon-rbac.ts)
const SALON_PAGE_ACCESS = [
  { path: '/salon/dashboard', allowedRoles: ['owner'], description: 'Owner Dashboard' },
  { path: '/salon/finance', allowedRoles: ['owner', 'accountant'], description: 'Finance' },
  { path: '/salon/reports', allowedRoles: ['owner', 'manager', 'accountant'], description: 'Reports' },
  { path: '/salon/settings', allowedRoles: ['owner', 'manager'], description: 'Settings' },
  { path: '/salon/pos', allowedRoles: ['owner', 'manager', 'receptionist'], description: 'POS' },
  { path: '/salon/appointments', allowedRoles: ['owner', 'manager', 'receptionist'], description: 'Appointments' },
  { path: '/salon/customers', allowedRoles: ['owner', 'manager', 'receptionist'], description: 'Customers' },
  { path: '/salon/receptionist', allowedRoles: ['owner', 'manager', 'receptionist', 'accountant'], description: 'Receptionist' },
]

function hasPageAccess(role, path) {
  if (role === 'owner') return true

  const normalizedPath = path.split('?')[0].replace(/\/$/, '')
  const exactMatch = SALON_PAGE_ACCESS.find(rule => rule.path === normalizedPath)

  if (exactMatch) {
    return exactMatch.allowedRoles.includes(role)
  }

  // Check parent path
  const pathSegments = normalizedPath.split('/').filter(Boolean)
  for (let i = pathSegments.length; i > 0; i--) {
    const parentPath = '/' + pathSegments.slice(0, i).join('/')
    const parentMatch = SALON_PAGE_ACCESS.find(rule => rule.path === parentPath)
    if (parentMatch) {
      return parentMatch.allowedRoles.includes(role)
    }
  }

  return false
}

function testRolePermissions() {
  console.log('🛡️ RBAC Permission Testing\n')
  console.log('=' .repeat(70))

  const roles = ['owner', 'manager', 'receptionist', 'accountant']
  const testPages = [
    '/salon/dashboard',
    '/salon/finance',
    '/salon/reports',
    '/salon/settings',
    '/salon/pos',
    '/salon/appointments',
    '/salon/customers',
    '/salon/receptionist',
  ]

  // Test each role
  for (const role of roles) {
    console.log(`\n👤 Role: ${role.toUpperCase()}`)
    console.log('-'.repeat(70))

    let accessibleCount = 0
    let restrictedCount = 0

    for (const page of testPages) {
      const canAccess = hasPageAccess(role, page)
      const status = canAccess ? '✅ ALLOW' : '❌ DENY'
      const pageRule = SALON_PAGE_ACCESS.find(r => r.path === page)
      const description = pageRule ? pageRule.description : 'Unknown'

      console.log(`  ${status}  ${page.padEnd(30)} (${description})`)

      if (canAccess) accessibleCount++
      else restrictedCount++
    }

    console.log(`\n  Summary: ${accessibleCount} accessible, ${restrictedCount} restricted`)
  }

  console.log('\n' + '=' .repeat(70))

  // Test specific scenarios
  console.log('\n🧪 Specific Test Scenarios\n')

  // Scenario 1: Owner should access everything
  console.log('Test 1: Owner should access all pages')
  const ownerTests = testPages.every(page => hasPageAccess('owner', page))
  console.log(`  Result: ${ownerTests ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 2: Receptionist should NOT access dashboard
  console.log('Test 2: Receptionist should NOT access dashboard')
  const receptionistDashboard = !hasPageAccess('receptionist', '/salon/dashboard')
  console.log(`  Result: ${receptionistDashboard ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 3: Receptionist should NOT access reports
  console.log('Test 3: Receptionist should NOT access reports')
  const receptionistReports = !hasPageAccess('receptionist', '/salon/reports')
  console.log(`  Result: ${receptionistReports ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 4: Receptionist should NOT access finance
  console.log('Test 4: Receptionist should NOT access finance')
  const receptionistFinance = !hasPageAccess('receptionist', '/salon/finance')
  console.log(`  Result: ${receptionistFinance ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 5: Receptionist SHOULD access POS
  console.log('Test 5: Receptionist SHOULD access POS')
  const receptionistPOS = hasPageAccess('receptionist', '/salon/pos')
  console.log(`  Result: ${receptionistPOS ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 6: Receptionist SHOULD access appointments
  console.log('Test 6: Receptionist SHOULD access appointments')
  const receptionistAppointments = hasPageAccess('receptionist', '/salon/appointments')
  console.log(`  Result: ${receptionistAppointments ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 7: Accountant should access finance
  console.log('Test 7: Accountant SHOULD access finance')
  const accountantFinance = hasPageAccess('accountant', '/salon/finance')
  console.log(`  Result: ${accountantFinance ? '✅ PASS' : '❌ FAIL'}\n`)

  // Scenario 8: Accountant should NOT access POS
  console.log('Test 8: Accountant should NOT access POS')
  const accountantPOS = !hasPageAccess('accountant', '/salon/pos')
  console.log(`  Result: ${accountantPOS ? '✅ PASS' : '❌ FAIL'}\n`)

  // Summary
  const allTests = [
    ownerTests,
    receptionistDashboard,
    receptionistReports,
    receptionistFinance,
    receptionistPOS,
    receptionistAppointments,
    accountantFinance,
    accountantPOS
  ]

  const passedTests = allTests.filter(t => t).length
  const totalTests = allTests.length

  console.log('=' .repeat(70))
  console.log(`\n🎯 Test Summary: ${passedTests}/${totalTests} tests passed\n`)

  if (passedTests === totalTests) {
    console.log('✅ All RBAC permission tests PASSED!')
  } else {
    console.log(`⚠️ ${totalTests - passedTests} test(s) FAILED`)
  }

  console.log('\n')
}

testRolePermissions()
