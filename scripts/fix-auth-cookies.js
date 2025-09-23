// Fix auth cookies for demo session
// Run this in the browser console if you're having issues with organization not loading

console.log('🔧 Fixing auth cookies...')

// The Hair Talkz organization ID from your logs
const HAIR_TALKZ_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// Set the HERA_ORG_ID cookie
document.cookie = `HERA_ORG_ID=${HAIR_TALKZ_ORG_ID}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`

console.log('✅ Set HERA_ORG_ID cookie to:', HAIR_TALKZ_ORG_ID)

// Also check if we have a demo session
const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
  const [key, value] = cookie.split('=')
  acc[key] = value
  return acc
}, {})

if (cookies['hera-demo-session']) {
  console.log('✅ Demo session cookie found')
  try {
    const session = JSON.parse(decodeURIComponent(cookies['hera-demo-session']))
    console.log('📋 Session org ID:', session.organization_id)
    
    if (session.organization_id !== HAIR_TALKZ_ORG_ID) {
      console.warn('⚠️  Session org ID mismatch!')
    }
  } catch (e) {
    console.error('Failed to parse session:', e)
  }
} else {
  console.warn('⚠️  No demo session cookie found. You may need to go to /demo first.')
}

console.log('\n🎯 Now try refreshing the page!')
console.log('If you still have issues, try:')
console.log('1. Go to /demo')
console.log('2. Click on Hair Talkz Salon')
console.log('3. Then navigate to /salon/services')