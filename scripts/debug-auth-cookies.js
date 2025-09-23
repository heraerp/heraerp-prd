// Debug script to check auth cookies
// Run this in the browser console when on the services page

console.log('🍪 Checking cookies...')

// Get all cookies
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
  const [key, value] = cookie.split('=')
  acc[key] = value
  return acc
}, {})

console.log('All cookies:', cookies)

// Check specific cookies
console.log('\n📋 Auth-related cookies:')
console.log('HERA_ORG_ID:', cookies['HERA_ORG_ID'] || 'NOT FOUND')
console.log('hera-demo-session:', cookies['hera-demo-session'] ? 'FOUND' : 'NOT FOUND')

// Decode demo session if present
if (cookies['hera-demo-session']) {
  try {
    const decoded = JSON.parse(decodeURIComponent(cookies['hera-demo-session']))
    console.log('\n🔍 Demo session contents:', decoded)
    console.log('Organization ID from session:', decoded.organization_id)
  } catch (e) {
    console.error('Failed to decode demo session:', e)
  }
}

// Check localStorage
console.log('\n💾 LocalStorage:')
console.log('organizationId:', localStorage.getItem('organizationId'))
console.log('userRole:', localStorage.getItem('userRole'))
console.log('demoType:', localStorage.getItem('demoType'))

console.log('\n✅ Debug complete. If HERA_ORG_ID is missing, that\'s the issue!')