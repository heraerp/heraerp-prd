#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { UNIVERSAL_PAGE_CONFIGS, SMART_CODE_PATTERNS } = require('./universal-conversion-config')

// Industry page mappings based on actual progressive directories
const INDUSTRY_PAGES = {
  salon: [
    'appointments', 'services', 'staff', 'inventory', 
    'payments', 'loyalty', 'reports', 'marketing', 'settings'
  ],
  healthcare: [
    'appointments', 'patients', 'prescriptions', 'billing', 'reports'
  ],
  restaurant: [
    'menu', 'kitchen', 'delivery', 'inventory', 'pos'
  ],
  jewelry: [
    'appointments', 'customers', 'inventory', 'repair', 
    'analytics', 'reports', 'settings'
  ],
  audit: [
    'clients', 'engagements', 'working-papers', 'teams', 
    'documents', 'planning', 'onboarding'
  ],
  airline: [
    'bookings', 'check-in', 'loyalty', 'search'
  ],
  crm: [
    'deals', 'calls', 'analytics', 'settings'
  ],
  'enterprise-retail': [
    'customers', 'inventory', 'merchandising', 
    'procurement', 'promotions', 'analytics'
  ],
  bpo: [
    'queue', 'analytics', 'audit', 'communication', 'upload'
  ],
  manufacturing: [
    'inventory', 'procurement', 'fixed-assets', 'reports'
  ],
  financial: [
    'budgets', 'fixed-assets', 'reports'
  ]
}

function convertIndustry(industry) {
  console.log(`🏭 Converting ${industry} Progressive to Production\n`)
  
  const pages = INDUSTRY_PAGES[industry]
  if (!pages) {
    console.error(`❌ No pages configured for industry: ${industry}`)
    console.log('Available industries:', Object.keys(INDUSTRY_PAGES).join(', '))
    return
  }

  const results = {
    successful: [],
    failed: [],
    skipped: []
  }

  // Create industry directory
  const industryDir = `src/app/${industry}`
  if (!fs.existsSync(industryDir)) {
    fs.mkdirSync(industryDir, { recursive: true })
  }

  // Convert each page
  pages.forEach(page => {
    console.log(`\n📄 Converting ${industry}/${page}...`)
    console.log('='.repeat(50))
    
    try {
      // Check if page config exists
      const config = UNIVERSAL_PAGE_CONFIGS[page]
      if (!config) {
        console.log(`⚠️  No configuration for ${page}, skipping...`)
        results.skipped.push(page)
        return
      }

      // Check if valid for this industry
      if (config.industries && !config.industries.includes(industry) && !config.industries.includes('all')) {
        console.log(`⚠️  Page ${page} not configured for ${industry}, skipping...`)
        results.skipped.push(page)
        return
      }

      // Run the conversion
      execSync(`npm run convert-universal ${industry} ${page}`, { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      })
      
      results.successful.push(page)
    } catch (error) {
      console.error(`❌ Failed to convert ${page}:`, error.message)
      results.failed.push(page)
    }
  })

  // Generate industry layout
  generateIndustryLayout(industry)

  // Generate batch test data script
  generateBatchTestScript(industry, results.successful)

  // Summary report
  console.log(`\n\n📊 ${industry} Conversion Summary`)
  console.log('='.repeat(50))
  console.log(`✅ Successfully converted: ${results.successful.length}`)
  results.successful.forEach(page => console.log(`   - ${page}`))

  if (results.skipped.length > 0) {
    console.log(`\n⚠️  Skipped: ${results.skipped.length}`)
    results.skipped.forEach(page => console.log(`   - ${page}`))
  }

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`)
    results.failed.forEach(page => console.log(`   - ${page}`))
  }

  console.log(`
\n🎉 ${industry} Conversion Complete!

Next steps:
1. Run test data: cd mcp-server && node setup-all-${industry}-data.js
2. Start dev server: npm run dev
3. Login: http://localhost:3007/auth/login
4. Visit dashboard: http://localhost:3007/${industry}
`)
}

function generateIndustryLayout(industry) {
  const layoutPath = `src/app/${industry}/layout.tsx`
  if (fs.existsSync(layoutPath)) {
    console.log(`⚠️  Layout already exists: ${layoutPath}`)
    return
  }

  const layoutContent = `export default function ${capitalize(industry)}Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}`

  fs.writeFileSync(layoutPath, layoutContent)
  console.log(`✅ Created layout: ${layoutPath}`)
}

function generateBatchTestScript(industry, pages) {
  const scriptPath = `mcp-server/setup-all-${industry}-data.js`
  
  const scriptContent = `#!/usr/bin/env node
/**
 * Setup All ${capitalize(industry)} Test Data
 * Runs all test data scripts for ${industry}
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const scripts = [
  ${pages.map(page => `'setup-${industry}-${page}-data.js'`).join(',\n  ')}
]

console.log('🎯 Setting up all ${industry} test data...\\n')

scripts.forEach(script => {
  const scriptPath = path.join(__dirname, script)
  if (fs.existsSync(scriptPath)) {
    console.log(\`\\n📝 Running \${script}...\\n\`)
    try {
      execSync(\`node \${script}\`, { stdio: 'inherit', cwd: __dirname })
    } catch (error) {
      console.error(\`❌ Failed to run \${script}: \${error.message}\`)
    }
  } else {
    console.log(\`⚠️  Script not found: \${script}\`)
  }
})

console.log('\\n✅ All ${industry} test data setup complete!')
`

  fs.writeFileSync(scriptPath, scriptContent)
  fs.chmodSync(scriptPath, '755')
  console.log(`✅ Created batch test script: ${scriptPath}`)
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ')
}

// Parse command line arguments
const industry = process.argv[2]

if (!industry) {
  console.log(`
Usage: npm run convert-industry [industry-name]

Available industries:
${Object.keys(INDUSTRY_PAGES).map(i => `  - ${i}`).join('\n')}

Example: npm run convert-industry healthcare

This will convert all pages for the specified industry to production.
`)
} else {
  convertIndustry(industry)
}