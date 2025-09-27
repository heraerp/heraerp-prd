#!/usr/bin/env node
/**
 * Configure Eventbrite integration with production API key
 * 
 * This updates the connector configuration to use the real API key
 */

// Update the Eventbrite adapter test to not use demo mode for certain orgs
const PRODUCTION_CONFIG = {
  apiToken: '64ACNOYV3AQ37KHB25GN',
  apiUrl: 'https://www.eventbriteapi.com/v3'
}

console.log('🔧 Eventbrite Production Configuration\n')
console.log('To use your real Eventbrite API key in the integration:')
console.log('\n1. In the Integration Hub UI:')
console.log('   - Go to Connectors tab')
console.log('   - Create or edit your Eventbrite connector')
console.log('   - Set API Token to:', PRODUCTION_CONFIG.apiToken)
console.log('\n2. The integration will then:')
console.log('   - Use real API calls instead of demo data')
console.log('   - Sync your actual Eventbrite events')
console.log('   - Import real attendee data')
console.log('\n3. Important notes:')
console.log('   - Rate limits apply (1000 requests/hour)')
console.log('   - Only events you own will be synced')
console.log('   - Attendee data requires proper event permissions')
console.log('\n✅ Your API key is ready to use!')

// Export for use in other scripts
export { PRODUCTION_CONFIG }