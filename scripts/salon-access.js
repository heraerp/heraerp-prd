/**
 * Salon Dashboard Access Helper
 * Quick access script for development
 */

const { exec } = require('child_process')
const open = require('open')

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

function openSalonDashboard() {
  console.log('🚀 Opening Salon Dashboard...')
  console.log('Organization ID:', SALON_ORG_ID)
  
  // Open quick login (which redirects to salon)
  const url = 'http://localhost:3000/salon/quick-login'
  
  console.log('📱 Opening:', url)
  
  // Try to open in browser
  try {
    open(url)
    console.log('✅ Browser opened successfully')
  } catch (error) {
    console.log('⚠️  Could not auto-open browser')
    console.log('Please manually open:', url)
  }
  
  console.log('\n🎯 Safe Access URLs:')
  console.log('  Quick Login: http://localhost:3000/salon/quick-login')
  console.log('  Direct:      http://localhost:3000/salon/direct')  
  console.log('  Dashboard:   http://localhost:3000/salon/dashboard')
  console.log('  POS:         http://localhost:3000/salon/pos')
  console.log('  Calendar:    http://localhost:3000/salon/appointments/calendar')
  console.log('\n👤 Demo Credentials:')
  console.log('  Email:    michele@hairtalkz.com')
  console.log('  Password: HairTalkz2024!')
  console.log('\n💡 All URLs will use organization:', SALON_ORG_ID)
}

// Check if dev server is running
exec('curl -s http://localhost:3000 > /dev/null', (error) => {
  if (error) {
    console.log('⚠️  Development server not running')
    console.log('Please run: npm run dev')
    console.log('Then try: node scripts/salon-access.js')
  } else {
    openSalonDashboard()
  }
})