#!/usr/bin/env node

/**
 * HERA CRUD Page Generator CLI
 * Usage: node scripts/generate-crud-page.js entity CONTACT
 */

import { generateFromCLI } from '../src/lib/generators/crud-page-generator.js'

const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('🏗️  HERA SAP Fiori CRUD Page Generator')
  console.log('')
  console.log('📖 Usage:')
  console.log('  node scripts/generate-crud-page.js entity <TYPE>')
  console.log('  node scripts/generate-crud-page.js transaction <TYPE>')
  console.log('  node scripts/generate-crud-page.js multiple <TYPE1,TYPE2>')
  console.log('')
  console.log('🔧 Options:')
  console.log('  --overwrite       - Overwrite existing files')
  console.log('')
  console.log('📋 Examples:')
  console.log('  node scripts/generate-crud-page.js entity ACCOUNT')
  console.log('  node scripts/generate-crud-page.js entity LEAD --overwrite')
  console.log('  node scripts/generate-crud-page.js multiple ACCOUNT,LEAD,PRODUCT')
  console.log('')
  console.log('🎯 This generates:')
  console.log('  ✅ Production-quality SAP Fiori page with full CRUD')
  console.log('  ✅ TypeScript-safe configuration')
  console.log('  ✅ HERA Universal Entity integration')
  console.log('  ✅ Mobile-first responsive design')
  console.log('  ✅ Sample data creation scripts')
  console.log('  ✅ Sacred Six schema compliance')
  console.log('')
  process.exit(0)
}

generateFromCLI(args)