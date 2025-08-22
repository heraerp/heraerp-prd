#!/usr/bin/env node

/**
 * Configuration Generator CLI
 * Instantly create new configuration types with API and UI
 * 
 * Usage: node scripts/generate-config.js <type> <path>
 * Example: node scripts/generate-config.js CUSTOMER_TYPE crm/customer-types
 */

const fs = require('fs').promises
const path = require('path')

const TEMPLATE_API = `/**
 * {{displayName}} API
 * Auto-generated using Universal Configuration Factory
 */

import { ConfigurationFactory, CONFIG_TYPES } from '@/lib/universal-config/config-factory'

const factory = new ConfigurationFactory()
const handlers = factory.createRouteHandlers(CONFIG_TYPES.{{configType}})

export const GET = handlers.GET
export const POST = handlers.POST
export const PUT = handlers.PUT
export const DELETE = handlers.DELETE`

const TEMPLATE_PAGE = `/**
 * {{displayName}} Management Page
 * Auto-generated using Universal Configuration Manager
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'

export default function {{componentName}}Page() {
  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.{{configType}}}
        apiEndpoint="/api/v1/{{apiPath}}"
        additionalFields={[
          // Add custom fields here
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            defaultValue: ''
          }
        ]}
      />
    </div>
  )
}`

async function generateConfig(configType, targetPath) {
  // Validate config type exists
  const configTypes = [
    'SERVICE_CATEGORY', 'PRODUCT_CATEGORY', 'CUSTOMER_TYPE', 
    'PAYMENT_METHOD', 'TAX_TYPE', 'LOCATION', 'DEPARTMENT', 
    'EXPENSE_CATEGORY', 'STAFF_ROLE', 'STAFF_SKILL', 'PRODUCT_TYPE',
    'SUPPLIER', 'STOCK_LOCATION', 'COMMISSION_RULE', 'BOOKING_RULE',
    'LOYALTY_TIER', 'PACKAGE_TYPE'
  ]
  
  if (!configTypes.includes(configType)) {
    console.error(`❌ Invalid config type: ${configType}`)
    console.log(`Available types: ${configTypes.join(', ')}`)
    process.exit(1)
  }

  // Parse paths
  const apiPath = targetPath.replace(/\/$/, '')
  const pagePath = apiPath
  const componentName = targetPath
    .split('/')
    .pop()
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  // Get display name from config type
  const displayNames = {
    SERVICE_CATEGORY: 'Service Categories',
    PRODUCT_CATEGORY: 'Product Categories',
    CUSTOMER_TYPE: 'Customer Types',
    PAYMENT_METHOD: 'Payment Methods',
    TAX_TYPE: 'Tax Types',
    LOCATION: 'Locations',
    DEPARTMENT: 'Departments',
    EXPENSE_CATEGORY: 'Expense Categories',
    STAFF_ROLE: 'Staff Roles',
    STAFF_SKILL: 'Staff Skills',
    PRODUCT_TYPE: 'Product Types',
    SUPPLIER: 'Suppliers',
    STOCK_LOCATION: 'Stock Locations',
    COMMISSION_RULE: 'Commission Rules',
    BOOKING_RULE: 'Booking Rules',
    LOYALTY_TIER: 'Loyalty Tiers',
    PACKAGE_TYPE: 'Package Types'
  }
  
  const displayName = displayNames[configType]

  // Generate API route
  const apiDir = path.join(process.cwd(), 'src/app/api/v1', apiPath)
  const apiFile = path.join(apiDir, 'route.ts')
  
  await fs.mkdir(apiDir, { recursive: true })
  await fs.writeFile(
    apiFile,
    TEMPLATE_API
      .replace(/{{configType}}/g, configType)
      .replace(/{{displayName}}/g, displayName)
  )
  
  console.log(`✅ Created API: ${apiFile}`)

  // Generate UI page
  const pageDir = path.join(process.cwd(), 'src/app', pagePath)
  const pageFile = path.join(pageDir, 'page.tsx')
  
  await fs.mkdir(pageDir, { recursive: true })
  await fs.writeFile(
    pageFile,
    TEMPLATE_PAGE
      .replace(/{{configType}}/g, configType)
      .replace(/{{displayName}}/g, displayName)
      .replace(/{{componentName}}/g, componentName)
      .replace(/{{apiPath}}/g, apiPath)
  )
  
  console.log(`✅ Created Page: ${pageFile}`)

  console.log(`
🚀 Configuration generated successfully!

API Endpoint: /api/v1/${apiPath}
Page URL: /${pagePath}

Next steps:
1. Customize additional fields in the page component
2. Add custom columns if needed
3. Implement onItemClick handler for navigation

Example customization:
- Add color picker for visual categories
- Add parent/child relationships
- Add custom validation rules
- Add bulk import/export features
`)
}

// Main execution
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.log(`
Universal Configuration Generator
=================================

Usage: node scripts/generate-config.js <type> <path>

Available Types:
- SERVICE_CATEGORY    : Service categories (salon, spa, etc.)
- PRODUCT_CATEGORY    : Product categories for inventory
- CUSTOMER_TYPE       : Customer classifications
- PAYMENT_METHOD      : Payment method configurations
- TAX_TYPE           : Tax configurations
- LOCATION           : Business locations/branches
- DEPARTMENT         : Organizational departments
- EXPENSE_CATEGORY   : Expense categorization

Examples:
  node scripts/generate-config.js PRODUCT_CATEGORY inventory/product-categories
  node scripts/generate-config.js CUSTOMER_TYPE crm/customer-types
  node scripts/generate-config.js PAYMENT_METHOD settings/payment-methods
`)
  process.exit(1)
}

generateConfig(args[0], args[1]).catch(console.error)