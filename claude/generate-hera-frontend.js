#!/usr/bin/env node

/**
 * HERA Frontend Generator - One-Go Claude CLI
 * Generates production-ready frontends that auto-wire to HERA API v2
 * Never stubs or mocks - always connects to real backend
 */

const fs = require('fs')
const path = require('path')

// Generator configurations
const GENERATORS = {
  'master-data': {
    name: 'Master Data Page',
    template: 'master-data-generator.md',
    description: 'Generate entity management pages with CRUD operations',
    examples: ['CUSTOMER', 'PRODUCT', 'VENDOR', 'CONTACT', 'ACCOUNT']
  },
  'transaction': {
    name: 'Transaction Page', 
    template: 'transaction-generator.md',
    description: 'Generate transaction pages with GL validation',
    examples: ['SALE', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'JOURNAL']
  },
  'dashboard': {
    name: 'Dashboard Page',
    template: 'dashboard-generator.md', 
    description: 'Generate KPI dashboards with real-time data',
    examples: ['SALES', 'FINANCE', 'INVENTORY', 'CRM', 'OPERATIONS']
  }
}

// Industry and module mappings
const INDUSTRY_MODULES = {
  SALON: {
    name: 'Salon & Beauty',
    modules: ['BOOKING', 'CUSTOMERS', 'SERVICES', 'INVENTORY', 'STAFF', 'FINANCE'],
    entities: ['CUSTOMER', 'SERVICE', 'APPOINTMENT', 'STAFF', 'PRODUCT', 'PACKAGE'],
    transactions: ['BOOKING', 'SALE', 'PAYMENT', 'COMMISSION', 'EXPENSE']
  },
  RESTAURANT: {
    name: 'Restaurant',
    modules: ['MENU', 'ORDERS', 'CUSTOMERS', 'INVENTORY', 'STAFF', 'FINANCE'],
    entities: ['CUSTOMER', 'MENU_ITEM', 'ORDER', 'TABLE', 'STAFF', 'INGREDIENT'],
    transactions: ['ORDER', 'PAYMENT', 'PURCHASE', 'EXPENSE', 'WASTE']
  },
  RETAIL: {
    name: 'Retail',
    modules: ['CATALOG', 'SALES', 'CUSTOMERS', 'INVENTORY', 'STAFF', 'FINANCE'],
    entities: ['CUSTOMER', 'PRODUCT', 'CATEGORY', 'SUPPLIER', 'STAFF', 'STORE'],
    transactions: ['SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'TRANSFER']
  },
  CRM: {
    name: 'Customer Relationship Management',
    modules: ['LEADS', 'ACCOUNTS', 'CONTACTS', 'OPPORTUNITIES', 'ACTIVITIES', 'CAMPAIGNS'],
    entities: ['LEAD', 'ACCOUNT', 'CONTACT', 'OPPORTUNITY', 'ACTIVITY', 'CAMPAIGN'],
    transactions: ['LEAD_CONVERSION', 'OPPORTUNITY_UPDATE', 'ACTIVITY_LOG']
  },
  FINANCE: {
    name: 'Financial Management',
    modules: ['GL', 'AP', 'AR', 'BUDGETING', 'REPORTING', 'RECONCILIATION'],
    entities: ['GL_ACCOUNT', 'VENDOR', 'CUSTOMER', 'BUDGET', 'COST_CENTER'],
    transactions: ['JOURNAL', 'INVOICE', 'PAYMENT', 'RECEIPT', 'ADJUSTMENT']
  }
}

function showUsage() {
  console.log(`
🚀 HERA Frontend Generator - One-Go Claude CLI

USAGE:
  node claude/generate-hera-frontend.js <generator> <entity_type> [options]

GENERATORS:
  master-data    Generate entity management pages with CRUD operations
  transaction    Generate transaction pages with GL validation  
  dashboard      Generate KPI dashboards with real-time data

OPTIONS:
  --industry     Industry context (${Object.keys(INDUSTRY_MODULES).join(', ')})
  --module       Business module (depends on industry)
  --output       Output file path (default: auto-generated)
  --preview      Show generated template without writing file

EXAMPLES:
  # Generate customer management page for salon industry
  node claude/generate-hera-frontend.js master-data CUSTOMER --industry SALON --module CUSTOMERS

  # Generate sales transaction page for restaurant  
  node claude/generate-hera-frontend.js transaction SALE --industry RESTAURANT --module ORDERS

  # Generate finance dashboard for retail
  node claude/generate-hera-frontend.js dashboard FINANCE --industry RETAIL --module FINANCE

  # Preview without writing file
  node claude/generate-hera-frontend.js master-data PRODUCT --preview

INDUSTRY OPTIONS:
`)

  Object.entries(INDUSTRY_MODULES).forEach(([key, industry]) => {
    console.log(`  ${key.padEnd(12)} ${industry.name}`)
    console.log(`  ${' '.repeat(12)} Modules: ${industry.modules.join(', ')}`)
    console.log(`  ${' '.repeat(12)} Entities: ${industry.entities.join(', ')}`)
    console.log()
  })
}

function validateInputs(generator, entityType, options) {
  const errors = []

  // Validate generator
  if (!GENERATORS[generator]) {
    errors.push(`Invalid generator: ${generator}. Available: ${Object.keys(GENERATORS).join(', ')}`)
  }

  // Validate entity type
  if (!entityType || entityType.length === 0) {
    errors.push('Entity type is required')
  }

  // Validate industry
  if (options.industry && !INDUSTRY_MODULES[options.industry]) {
    errors.push(`Invalid industry: ${options.industry}. Available: ${Object.keys(INDUSTRY_MODULES).join(', ')}`)
  }

  // Validate module
  if (options.industry && options.module) {
    const industry = INDUSTRY_MODULES[options.industry]
    if (!industry.modules.includes(options.module)) {
      errors.push(`Invalid module for ${options.industry}: ${options.module}. Available: ${industry.modules.join(', ')}`)
    }
  }

  return errors
}

function generateTemplate(generator, entityType, options) {
  const templatePath = path.join(__dirname, 'tasks', GENERATORS[generator].template)
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  let templateContent = fs.readFileSync(templatePath, 'utf8')

  // Extract the actual TypeScript code from the markdown template
  const codeBlockMatch = templateContent.match(/```typescript\n([\s\S]*?)\n```/)
  if (!codeBlockMatch) {
    throw new Error(`No TypeScript code block found in template: ${templatePath}`)
  }

  let template = codeBlockMatch[1]

  // Default values
  const industry = options.industry || 'ENTERPRISE'
  const module = options.module || 'CORE'
  const entityTypeName = entityType.toUpperCase()

  // Replace placeholders
  template = template.replace(/\{\{ENTITY_TYPE\}\}/g, entityTypeName)
  template = template.replace(/\{\{TRANSACTION_TYPE\}\}/g, entityTypeName)
  template = template.replace(/\{\{INDUSTRY\}\}/g, industry)
  template = template.replace(/\{\{MODULE\}\}/g, module)
  
  // Generate page path
  const industryPath = industry.toLowerCase()
  const modulePath = module.toLowerCase()
  const entityPath = entityTypeName.toLowerCase()
  
  let defaultPagePath
  switch (generator) {
    case 'master-data':
      defaultPagePath = `/app/${industryPath}/${entityPath}/page.tsx`
      break
    case 'transaction':
      defaultPagePath = `/app/${industryPath}/${modulePath}/${entityPath}/page.tsx`
      break
    case 'dashboard':
      defaultPagePath = `/app/${industryPath}/dashboard/${entityPath}/page.tsx`
      break
    default:
      defaultPagePath = `/app/${industryPath}/${entityPath}/page.tsx`
  }

  template = template.replace(/\{\{PAGE_PATH\}\}/g, options.output || defaultPagePath)

  return {
    template,
    suggestedPath: defaultPagePath,
    metadata: {
      generator,
      entityType: entityTypeName,
      industry,
      module,
      timestamp: new Date().toISOString()
    }
  }
}

function writeGeneratedFile(content, outputPath, metadata) {
  const fullPath = path.join(process.cwd(), outputPath.startsWith('/') ? outputPath.slice(1) : outputPath)
  const directory = path.dirname(fullPath)

  // Create directory if it doesn't exist
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
    console.log(`📁 Created directory: ${directory}`)
  }

  // Add generation header
  const header = `/*
 * Generated by HERA Frontend Generator
 * Generator: ${metadata.generator}
 * Entity: ${metadata.entityType}
 * Industry: ${metadata.industry}
 * Module: ${metadata.module}
 * Generated: ${metadata.timestamp}
 * 
 * This file connects to real HERA API v2 backend - never stubs or mocks
 */

`

  const finalContent = header + content

  // Write file
  fs.writeFileSync(fullPath, finalContent, 'utf8')
  console.log(`✅ Generated: ${fullPath}`)

  return fullPath
}

function generateHERAFrontend() {
  const args = process.argv.slice(2)
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage()
    return
  }

  // Parse arguments
  const generator = args[0]
  const entityType = args[1]
  
  const options = {}
  for (let i = 2; i < args.length; i += 2) {
    const flag = args[i]
    const value = args[i + 1]
    
    switch (flag) {
      case '--industry':
        options.industry = value?.toUpperCase()
        break
      case '--module':
        options.module = value?.toUpperCase()
        break
      case '--output':
        options.output = value
        break
      case '--preview':
        options.preview = true
        i-- // No value for this flag
        break
      case '--skip-validation':
        options.skipValidation = true
        i-- // No value for this flag
        break
    }
  }

  try {
    // Validate inputs
    const errors = validateInputs(generator, entityType, options)
    if (errors.length > 0) {
      console.error('❌ Validation errors:')
      errors.forEach(error => console.error(`  - ${error}`))
      console.log('\nRun with --help for usage information')
      process.exit(1)
    }

    console.log(`🚀 Generating ${GENERATORS[generator].name}...`)
    console.log(`   Entity: ${entityType}`)
    console.log(`   Industry: ${options.industry || 'ENTERPRISE'}`)
    console.log(`   Module: ${options.module || 'CORE'}`)

    // Generate template
    const result = generateTemplate(generator, entityType, options)

    if (options.preview) {
      console.log('\n📋 Generated Template Preview:')
      console.log('=' .repeat(50))
      console.log(result.template.slice(0, 2000) + '...')
      console.log('=' .repeat(50))
      console.log(`\n📁 Suggested path: ${result.suggestedPath}`)
    } else {
      const outputPath = options.output || result.suggestedPath
      const filePath = writeGeneratedFile(result.template, outputPath, result.metadata)
      
      console.log('\n✅ Generation complete!')
      console.log(`📁 File: ${filePath}`)
      console.log(`🔗 Industry: ${result.metadata.industry}`)
      console.log(`📦 Module: ${result.metadata.module}`)
      
      console.log('\n🎯 Next steps:')
      console.log('1. Review the generated code')
      console.log('2. Customize entity-specific fields')
      console.log('3. Test with real HERA backend')
      console.log('4. Run quality gates: npm run ci:quality')
      
      // Show relevant commands
      console.log('\n🔧 Development commands:')
      console.log('  npm run dev              # Start development server')
      console.log('  npm run build            # Production build')
      console.log('  npm run test:enterprise  # Run enterprise tests')
      console.log('  npm run predeploy        # Pre-deployment checks')
      
      // Automatic build validation (Claude's requirement)
      if (!options.skipValidation) {
        console.log('\n🔍 Running automatic build validation...')
        try {
          const { execSync } = require('child_process')
          
          // Extract the target directory from outputPath
          const targetDir = path.dirname(outputPath).replace(/^\//, '')
          
          // Production build validation - this is the most reliable test
          console.log('Testing Next.js production build...')
          execSync('npm run build', { 
            stdio: 'pipe',
            timeout: 120000 // 2 minutes max
          })
          
          console.log('✅ Build compilation successful')
          console.log('✅ Generated code validation passed - code is production ready!')
          console.log(`✅ Page available at: http://localhost:3000${outputPath.replace('/app', '').replace('/page.tsx', '')}`)
        } catch (error) {
          console.log('\n❌ Build validation failed')
          console.log('Error details:', error.stderr?.slice(0, 500) || error.stdout?.slice(0, 500) || error.message)
          console.log('\n🔧 Troubleshooting steps:')
          console.log('1. Check the generated file for syntax errors')
          console.log('2. Ensure all imports are available')
          console.log('3. Verify HERA providers are configured correctly')
          console.log('4. Use --skip-validation flag for development builds')
          process.exit(1)
        }
      } else {
        console.log('\n⚠️  Build validation skipped (--skip-validation flag used)')
        console.log('Remember to run build validation before deploying to production')
      }
    }

  } catch (error) {
    console.error('❌ Generation failed:', error.message)
    process.exit(1)
  }
}

// Main execution
if (require.main === module) {
  generateHERAFrontend()
}

module.exports = {
  generateTemplate,
  GENERATORS,
  INDUSTRY_MODULES
}