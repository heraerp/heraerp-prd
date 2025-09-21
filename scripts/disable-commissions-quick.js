#!/usr/bin/env node
const { config } = require('dotenv')
const path = require('path')

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') })

// Import after env is loaded
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function disableCommissions(organizationId) {
  log('\n🔧 Disabling Commission Mode...', 'blue')
  
  try {
    // Get current settings
    const { data: org, error: fetchError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, settings')
      .eq('id', organizationId)
      .single()
    
    if (fetchError) {
      throw new Error(`Failed to fetch organization: ${fetchError.message}`)
    }
    
    if (!org) {
      throw new Error('Organization not found')
    }
    
    log(`\nOrganization: ${org.organization_name}`, 'cyan')
    log(`ID: ${org.id}`, 'cyan')
    
    const currentSettings = org.settings || {}
    const currentCommissionStatus = currentSettings?.salon?.commissions?.enabled ?? true
    
    log(`Current commission status: ${currentCommissionStatus ? 'ON' : 'OFF'}`, currentCommissionStatus ? 'yellow' : 'green')
    
    if (!currentCommissionStatus) {
      log('\n✅ Commissions are already disabled!', 'green')
      return
    }
    
    // Update settings to disable commissions
    const updatedSettings = {
      ...currentSettings,
      salon: {
        ...currentSettings.salon,
        commissions: {
          ...currentSettings.salon?.commissions,
          enabled: false
        }
      }
    }
    
    const { error: updateError } = await supabase
      .from('core_organizations')
      .update({ settings: updatedSettings })
      .eq('id', organizationId)
    
    if (updateError) {
      throw new Error(`Failed to update settings: ${updateError.message}`)
    }
    
    log('\n✅ SUCCESS: Commissions have been DISABLED!', 'green')
    log('\nPOS Mode: Simple POS - No stylist requirement', 'green')
    log('- Services can be sold without stylist assignment', 'cyan')
    log('- No commission tracking or calculations', 'cyan')
    log('- Faster, simpler checkout process', 'cyan')
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red')
    return false
  }
  
  return true
}

async function findOrganizations() {
  log('\n🔍 Finding organizations...', 'blue')
  
  try {
    const { data: orgs, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name, settings')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    if (!orgs || orgs.length === 0) {
      log('No organizations found', 'yellow')
      return []
    }
    
    log(`\nFound ${orgs.length} organizations:`, 'cyan')
    orgs.forEach((org, index) => {
      const commissionStatus = org.settings?.salon?.commissions?.enabled ?? true
      log(`${index + 1}. ${org.organization_name} (${org.id}) - Commissions: ${commissionStatus ? 'ON' : 'OFF'}`, 
        commissionStatus ? 'yellow' : 'green')
    })
    
    return orgs
  } catch (error) {
    log(`Error finding organizations: ${error.message}`, 'red')
    return []
  }
}

// Main execution
async function main() {
  log('\n🚀 POS Commission Mode Manager', 'blue')
  log('================================', 'blue')
  
  // Get organization ID from command line or env
  const orgId = process.argv[2] || process.env.DEFAULT_ORGANIZATION_ID
  
  if (!orgId) {
    // Show available organizations
    const orgs = await findOrganizations()
    
    if (orgs.length > 0) {
      log('\n📌 To disable commissions, run:', 'cyan')
      log(`node scripts/disable-commissions-quick.js <organization-id>`, 'yellow')
      log('\nExample:', 'cyan')
      log(`node scripts/disable-commissions-quick.js ${orgs[0].id}`, 'yellow')
    }
    return
  }
  
  // Disable commissions for the specified organization
  const success = await disableCommissions(orgId)
  
  if (success) {
    log('\n🎉 Next steps:', 'cyan')
    log('1. Go to your POS system', 'cyan')
    log('2. You should see "Commissions OFF — Simple POS" badge', 'cyan')
    log('3. Services can now be sold without stylist assignment', 'cyan')
  }
}

// Run the script
main().catch(error => {
  log(`\n❌ Fatal error: ${error}`, 'red')
  process.exit(1)
})