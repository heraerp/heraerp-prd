#!/usr/bin/env node

/**
 * HERA MVP Generator CLI
 * Smart Code: HERA.LIB.MVP_GENERATOR.CLI.v1
 * 
 * Command line interface for the MVP generator
 */

import { MVPGenerator } from './index'
import path from 'path'
import fs from 'fs/promises'

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    showUsage()
    return
  }

  const command = args[0]
  
  switch (command) {
    case 'generate':
      await handleGenerate(args.slice(1))
      break
    case 'validate':
      await handleValidate(args.slice(1))
      break
    case 'demo':
      await handleDemo()
      break
    default:
      console.error(`Unknown command: ${command}`)
      showUsage()
  }
}

function showUsage() {
  console.log('HERA MVP Generator CLI')
  console.log('')
  console.log('Usage:')
  console.log('  npm run mvp:generate <app-pack.json> [output-dir]  # Generate app from pack')
  console.log('  npm run mvp:validate <app-pack.json>              # Validate app pack')
  console.log('  npm run mvp:demo                                  # Generate demo app')
  console.log('')
  console.log('Examples:')
  console.log('  npm run mvp:generate demo-dealer-ops.json ./generated')
  console.log('  npm run mvp:validate my-app-pack.json')
  console.log('  npm run mvp:demo')
}

async function handleGenerate(args: string[]) {
  if (args.length === 0) {
    console.error('Error: App pack file is required')
    showUsage()
    return
  }

  const appPackPath = path.resolve(args[0])
  const outputDir = path.resolve(args[1] || './generated')

  try {
    console.log('🚀 HERA MVP Generator')
    console.log(`📦 App Pack: ${appPackPath}`)
    console.log(`📁 Output: ${outputDir}`)
    console.log('')

    const generator = new MVPGenerator()
    
    // Load and validate app pack
    console.log('📋 Loading app pack...')
    await generator.loadAppPack(appPackPath)
    
    // Merge config (no overlay for now)
    console.log('🔄 Merging configuration...')
    generator.mergeConfig()
    
    // Validate smart codes
    console.log('🛡️ Validating smart codes...')
    const smartCodeErrors = generator.validateSmartCodes()
    if (smartCodeErrors.length > 0) {
      console.error('❌ Smart code validation failed:')
      smartCodeErrors.forEach(error => console.error(`  - ${error}`))
      return
    }
    console.log('✅ Smart codes valid')
    
    // Generate application
    console.log('⚡ Generating application...')
    const output = await generator.generate(outputDir)
    
    console.log('')
    console.log('✅ Generation complete!')
    console.log(`📊 Generated ${output.pages.length} pages`)
    console.log(`🔌 Generated ${output.apis.length} API handlers`)
    console.log(`🌱 Generated ${output.seeds.length} seed files`)
    console.log(`🧪 Generated ${output.tests.length} test files`)
    console.log(`📚 Generated ${output.lib.length} library files`)
    console.log(`🔧 Generated ${output.middleware.length} middleware files`)
    console.log('')
    console.log(`📁 Output directory: ${outputDir}`)
    
  } catch (error: any) {
    console.error('💥 Generation failed:', error.message)
    process.exit(1)
  }
}

async function handleValidate(args: string[]) {
  if (args.length === 0) {
    console.error('Error: App pack file is required')
    showUsage()
    return
  }

  const appPackPath = path.resolve(args[0])

  try {
    console.log('🔍 Validating app pack...')
    console.log(`📦 File: ${appPackPath}`)
    console.log('')

    const generator = new MVPGenerator()
    
    // Load app pack
    await generator.loadAppPack(appPackPath)
    
    // Merge config
    const config = generator.mergeConfig()
    
    // Validate smart codes
    const smartCodeErrors = generator.validateSmartCodes()
    
    console.log('📊 Validation Results:')
    console.log(`  App: ${config.app.name} v${config.app.version}`)
    console.log(`  Entities: ${config.entities.length}`)
    console.log(`  Transactions: ${config.transactions.length}`)
    console.log(`  Smart Code Errors: ${smartCodeErrors.length}`)
    
    if (smartCodeErrors.length > 0) {
      console.log('')
      console.log('❌ Smart Code Errors:')
      smartCodeErrors.forEach(error => console.log(`  - ${error}`))
      process.exit(1)
    } else {
      console.log('')
      console.log('✅ Validation passed!')
    }
    
  } catch (error: any) {
    console.error('💥 Validation failed:', error.message)
    process.exit(1)
  }
}

async function handleDemo() {
  console.log('🎯 Generating demo dealer operations app...')
  
  // Create demo app pack
  const demoAppPack = {
    app: {
      id: 'dealer-ops',
      name: 'Dealer Operations',
      version: '1.0.0',
      description: 'Complete dealer management system with inventory and sales',
      smart_code: 'HERA.DEALER.OPS.APPLICATION.MAIN.v1'
    },
    entities: [
      {
        entity_type: 'DEALER',
        entity_name: 'Dealer',
        description: 'Authorized dealer entity',
        smart_code: 'HERA.DEALER.OPS.DEALER.ENTITY.v1',
        icon: 'building',
        fields: [
          {
            name: 'dealer_code',
            type: 'text' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.DEALER.FIELD.CODE.v1'
          },
          {
            name: 'dealer_name',
            type: 'text' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.DEALER.FIELD.NAME.v1'
          },
          {
            name: 'region',
            type: 'text' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.DEALER.FIELD.REGION.v1'
          },
          {
            name: 'credit_limit',
            type: 'number' as const,
            required: false,
            smart_code: 'HERA.DEALER.OPS.DEALER.FIELD.CREDIT_LIMIT.v1'
          }
        ],
        relationships: []
      },
      {
        entity_type: 'VEHICLE',
        entity_name: 'Vehicle',
        description: 'Vehicle inventory item',
        smart_code: 'HERA.DEALER.OPS.VEHICLE.ENTITY.v1',
        icon: 'car',
        fields: [
          {
            name: 'vin',
            type: 'text' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.VEHICLE.FIELD.VIN.v1'
          },
          {
            name: 'make',
            type: 'text' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.VEHICLE.FIELD.MAKE.v1'
          },
          {
            name: 'model',
            type: 'text' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.VEHICLE.FIELD.MODEL.v1'
          },
          {
            name: 'year',
            type: 'number' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.VEHICLE.FIELD.YEAR.v1'
          },
          {
            name: 'price',
            type: 'number' as const,
            required: true,
            smart_code: 'HERA.DEALER.OPS.VEHICLE.FIELD.PRICE.v1'
          }
        ],
        relationships: []
      }
    ],
    transactions: [
      {
        transaction_type: 'VEHICLE_SALE',
        transaction_name: 'Vehicle Sale',
        description: 'Sale of vehicle to customer',
        smart_code: 'HERA.DEALER.OPS.TXN.VEHICLE_SALE.MAIN.v1',
        category: 'sales',
        lines: [
          {
            name: 'Vehicle Line',
            description: 'Vehicle being sold',
            required: true,
            smart_code: 'HERA.DEALER.OPS.TXN.LINE.VEHICLE.v1',
            line_type: 'PRODUCT' as const
          },
          {
            name: 'Cash Payment',
            description: 'Cash received',
            required: false,
            smart_code: 'HERA.DEALER.OPS.TXN.LINE.CASH.v1',
            line_type: 'GL' as const,
            account_type: 'ASSET',
            side: 'DR' as const
          },
          {
            name: 'Sales Revenue',
            description: 'Revenue recognition',
            required: true,
            smart_code: 'HERA.DEALER.OPS.TXN.LINE.REVENUE.v1',
            line_type: 'GL' as const,
            account_type: 'REVENUE',
            side: 'CR' as const
          }
        ]
      }
    ],
    ui: {
      dashboard: {
        title: 'Dealer Operations Dashboard',
        widgets: [
          {
            type: 'metric' as const,
            title: 'Total Dealers',
            entity: 'DEALER',
            calculation: 'count' as const,
            color: 'blue'
          },
          {
            type: 'metric' as const,
            title: 'Vehicles in Stock',
            entity: 'VEHICLE',
            calculation: 'count' as const,
            color: 'green'
          }
        ]
      },
      navigation: [
        {
          section: 'Management',
          items: [
            {
              label: 'Dealers',
              entity: 'DEALER',
              view: 'list' as const,
              icon: 'building'
            },
            {
              label: 'Vehicles',
              entity: 'VEHICLE',
              view: 'list' as const,
              icon: 'car'
            }
          ]
        }
      ]
    },
    deployment: {
      api: {
        base_path: '/api/v2',
        version: '2.0'
      },
      permissions: {
        roles: [
          {
            role: 'dealer_manager',
            permissions: ['create', 'read', 'update'],
            entities: ['DEALER', 'VEHICLE']
          }
        ]
      }
    }
  }
  
  // Write demo app pack
  const demoPath = path.resolve('./demo-dealer-ops.json')
  await fs.writeFile(demoPath, JSON.stringify(demoAppPack, null, 2))
  console.log(`📝 Created demo app pack: ${demoPath}`)
  
  // Generate demo app
  await handleGenerate([demoPath, './demo-generated'])
}

// Run CLI if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 CLI Error:', error.message)
    process.exit(1)
  })
}