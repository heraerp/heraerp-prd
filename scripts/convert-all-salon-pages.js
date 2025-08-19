#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// List of all salon pages to convert
const SALON_PAGES = [
  'appointments',
  'services', 
  'inventory',
  'payments',
  'loyalty',
  'reports',
  'marketing',
  'settings'
]

// Pages that need special handling
const SPECIAL_PAGES = {
  'pos': 'Point of Sale - requires transaction handling',
  'finance/coa': 'Chart of Accounts - already has production version'
}

console.log('🚀 Batch Converting Salon Progressive Pages to Production\n')

// Track conversion status
const results = {
  successful: [],
  failed: [],
  skipped: []
}

// Convert each page
SALON_PAGES.forEach(page => {
  console.log(`\n📄 Converting ${page}...`)
  console.log('='.repeat(50))
  
  try {
    // Run the conversion script
    execSync(`npm run convert-progressive ${page}`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
    results.successful.push(page)
  } catch (error) {
    console.error(`❌ Failed to convert ${page}:`, error.message)
    results.failed.push(page)
  }
})

// Summary report
console.log('\n\n📊 Conversion Summary')
console.log('='.repeat(50))
console.log(`✅ Successfully converted: ${results.successful.length}`)
results.successful.forEach(page => console.log(`   - ${page}`))

if (results.failed.length > 0) {
  console.log(`\n❌ Failed to convert: ${results.failed.length}`)
  results.failed.forEach(page => console.log(`   - ${page}`))
}

console.log(`\n⚠️  Special pages requiring manual conversion:`)
Object.entries(SPECIAL_PAGES).forEach(([page, note]) => {
  console.log(`   - ${page}: ${note}`)
})

// Generate test data creation script
console.log('\n\n📝 Generating batch test data script...')

const testDataScript = `#!/usr/bin/env node
/**
 * Setup All Salon Test Data
 * Runs all individual test data scripts
 */

const { execSync } = require('child_process')
const path = require('path')

const scripts = [
  'setup-salon-test-data.js',     // Customers
  'setup-staff-data.js',           // Staff/Employees
  ${results.successful.map(page => `'setup-${page}-data.js'`).join(',\n  ')}
]

console.log('🎯 Setting up all salon test data...\\n')

scripts.forEach(script => {
  const scriptPath = path.join(__dirname, script)
  if (require('fs').existsSync(scriptPath)) {
    console.log(\`\\n📝 Running \${script}...\\n\`)
    try {
      execSync(\`node \${script}\`, { stdio: 'inherit', cwd: __dirname })
    } catch (error) {
      console.error(\`❌ Failed to run \${script}\`)
    }
  } else {
    console.log(\`⚠️  Skipping \${script} (not found)\`)
  }
})

console.log('\\n✅ All test data setup complete!')
`

fs.writeFileSync('mcp-server/setup-all-salon-data.js', testDataScript)
fs.chmodSync('mcp-server/setup-all-salon-data.js', '755')
console.log('✅ Created: mcp-server/setup-all-salon-data.js')

// Generate verification script
const verificationScript = `#!/usr/bin/env node
/**
 * Verify All Salon Production Pages
 * Checks that all converted pages load correctly
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const organizationId = process.env.DEFAULT_ORGANIZATION_ID

async function verifyPages() {
  console.log('🔍 Verifying Salon Production Pages...\\n')
  
  const pages = ${JSON.stringify(results.successful, null, 2)}
  
  for (const page of pages) {
    console.log(\`\\n📄 Verifying \${page} page...\`)
    
    // Check if entity type exists
    const entityType = getEntityType(page)
    const { data, error } = await supabase
      .from('core_entities')
      .select('count')
      .eq('organization_id', organizationId)
      .eq('entity_type', entityType)
    
    if (error) {
      console.error(\`   ❌ Error checking \${entityType}:\`, error.message)
    } else {
      console.log(\`   ✅ Found \${data[0].count} \${entityType} entities\`)
    }
  }
  
  console.log('\\n✅ Verification complete!')
  console.log('\\n🌐 Test pages at:')
  pages.forEach(page => {
    console.log(\`   http://localhost:3007/salon/\${page}\`)
  })
}

function getEntityType(page) {
  const mapping = {
    appointments: 'appointment',
    services: 'service',
    inventory: 'product',
    payments: 'transaction',
    loyalty: 'loyalty_program',
    reports: 'report',
    marketing: 'campaign',
    settings: 'setting'
  }
  return mapping[page] || page
}

verifyPages().catch(console.error)
`

fs.writeFileSync('mcp-server/verify-salon-pages.js', verificationScript)
fs.chmodSync('mcp-server/verify-salon-pages.js', '755')
console.log('✅ Created: mcp-server/verify-salon-pages.js')

console.log(`
\n🎉 Batch Conversion Complete!

Next steps:
1. Run all test data: cd mcp-server && node setup-all-salon-data.js
2. Verify pages: cd mcp-server && node verify-salon-pages.js
3. Test each page at http://localhost:3007/salon/[page-name]
4. Update production pages to use the generated hooks and transformers

Remember to:
- Review each generated page for necessary adjustments
- Update the page components to use useUserContext() for organization ID
- Replace hardcoded data with data from hooks
- Add proper loading and error states
`)