#!/usr/bin/env node

/**
 * HERA Progressive System Test Suite
 * Validates the complete progressive PWA generation system
 * Smart Code: HERA.PROGRESSIVE.TEST.SUITE.v1
 */

const chalk = require('chalk')
const ora = require('ora')

// Mock environment for testing
global.crypto = {
  randomUUID: () => 'test-' + Math.random().toString(36).substr(2, 9)
}

global.indexedDB = {
  open: () => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: () => ({
        createIndex: () => {}
      }),
      transaction: () => ({
        objectStore: () => ({
          add: () => ({ onsuccess: null, onerror: null }),
          getAll: () => ({ onsuccess: null, onerror: null })
        })
      }),
      close: () => {}
    }
  }),
  deleteDatabase: () => ({ onsuccess: null, onerror: null, onblocked: null })
}

global.IDBKeyRange = {
  bound: () => ({}),
  upperBound: () => ({})
}

// Navigator mock
global.navigator = {
  storage: {
    estimate: async () => ({ usage: 1024 * 1024, quota: 100 * 1024 * 1024 })
  }
}

async function runTests() {
  console.log(chalk.blue.bold('\n🧬 HERA Progressive System Test Suite\n'))
  
  let passed = 0
  let failed = 0
  
  // Test 1: IndexedDB Schema
  await runTest('📊 IndexedDB Schema Creation', async () => {
    const { HERAIndexedDBSchema, createHERASchema } = require('../src/lib/progressive/indexeddb-schema')
    
    // Test schema configuration
    const config = HERAIndexedDBSchema.getConfig()
    
    if (!config.stores.core_entities) {
      throw new Error('core_entities store not found in schema')
    }
    
    if (!config.stores.universal_transactions) {
      throw new Error('universal_transactions store not found in schema')
    }
    
    // Test utility functions
    const org = require('../src/lib/progressive/indexeddb-schema').HERASchemaUtils.createOrganization(
      'Test Org', 'TEST-ORG'
    )
    
    if (!org.id || !org.expires_at) {
      throw new Error('Organization creation failed')
    }
    
    console.log(chalk.gray(`     ✓ Schema has ${Object.keys(config.stores).length} stores`))
    console.log(chalk.gray(`     ✓ Organization created with ID: ${org.id.substring(0, 8)}...`))
    
    return true
  })
  
  // Test 2: Progressive DNA Adapter
  await runTest('🧬 Progressive DNA Adapter', async () => {
    const { HeraProgressiveAdapter, IndexedDBAdapter } = require('../src/lib/progressive/dna-adapter')
    
    // Create adapter instance
    const adapter = new HeraProgressiveAdapter()
    
    // Test DNA pattern application
    const pattern = await adapter.applyDNAPattern('HERA.UI.GLASS.PANEL.v1', 'progressive')
    
    if (!pattern.storage_config || pattern.storage_config.backend !== 'indexeddb') {
      throw new Error('Progressive storage configuration failed')
    }
    
    console.log(chalk.gray(`     ✓ DNA pattern configured for: ${pattern.storage_config.backend}`))
    console.log(chalk.gray(`     ✓ Expiry set to: ${pattern.storage_config.expiry}`))
    
    return true
  })
  
  // Test 3: Trial System
  await runTest('⏰ Trial System', async () => {
    const { HERATrialSystem } = require('../src/lib/progressive/trial-system')
    
    // Mock IndexedDB adapter
    const mockAdapter = {
      getStorageStats: async () => ({ usage: 1024 * 1024, quota: 100 * 1024 * 1024 }),
      getEntities: async () => [{ id: 'test1' }, { id: 'test2' }],
      getTransactions: async () => [{ id: 'txn1' }],
      exportAllData: async () => ({
        organizations: [{ id: 'org1' }],
        entities: [{ id: 'ent1' }, { id: 'ent2' }],
        dynamicData: [],
        relationships: [],
        transactions: [{ id: 'txn1' }],
        transactionLines: []
      }),
      schema: {
        getDatabase: () => ({
          transaction: () => ({
            objectStore: () => ({
              put: () => ({ onsuccess: null, onerror: null }),
              get: () => ({ onsuccess: null, onerror: null, result: {
                data: {
                  start_date: new Date(),
                  expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                  status: 'active',
                  feature_usage: { dashboard: 5, entities: 10 }
                }
              }})
            })
          })
        })
      }
    }
    
    const trialSystem = new HERATrialSystem(mockAdapter)
    
    // Test trial initialization
    const trialStatus = await trialSystem.initializeTrial('test-org', 'restaurant')
    
    if (!trialStatus || !trialStatus.expiryDate) {
      throw new Error('Trial initialization failed')
    }
    
    // Test validation
    const validation = await trialSystem.validateForMigration('test-org')
    
    if (!Array.isArray(validation)) {
      throw new Error('Migration validation failed')
    }
    
    console.log(chalk.gray(`     ✓ Trial initialized with ${trialStatus.daysRemaining} days remaining`))
    console.log(chalk.gray(`     ✓ Migration validation returned ${validation.length} results`))
    
    return true
  })
  
  // Test 4: PWA Generator Components
  await runTest('📱 PWA Generator Components', async () => {
    const fs = require('fs/promises')
    const path = require('path')
    
    // Check that PWA generator file exists and has correct structure
    const generatorPath = path.join(__dirname, '../src/lib/progressive/pwa-generator.ts')
    const generatorContent = await fs.readFile(generatorPath, 'utf8')
    
    if (!generatorContent.includes('class ProgressivePWAGenerator')) {
      throw new Error('ProgressivePWAGenerator class not found')
    }
    
    if (!generatorContent.includes('generatePWA')) {
      throw new Error('generatePWA method not found')
    }
    
    if (!generatorContent.includes('generateManifest')) {
      throw new Error('generateManifest method not found')
    }
    
    console.log(chalk.gray(`     ✓ PWA Generator class structure validated`))
    console.log(chalk.gray(`     ✓ Core generation methods present`))
    
    return true
  })
  
  // Test 5: CLI Command Structure
  await runTest('⚡ CLI Command Structure', async () => {
    const fs = require('fs/promises')
    const path = require('path')
    
    // Check CLI script
    const cliPath = path.join(__dirname, 'generate-progressive-pwa.js')
    const cliContent = await fs.readFile(cliPath, 'utf8')
    
    if (!cliContent.includes('program.command(\'create\')')) {
      throw new Error('Create command not found in CLI')
    }
    
    if (!cliContent.includes('program.command(\'restaurant')) {
      throw new Error('Restaurant command not found in CLI')
    }
    
    if (!cliContent.includes('program.command(\'demo\')')) {
      throw new Error('Demo command not found in CLI')
    }
    
    // Check package.json has the scripts
    const packagePath = path.join(__dirname, '../package.json')
    const packageContent = await fs.readFile(packagePath, 'utf8')
    const packageJson = JSON.parse(packageContent)
    
    if (!packageJson.scripts['generate-progressive-pwa']) {
      throw new Error('generate-progressive-pwa script not found in package.json')
    }
    
    if (!packageJson.scripts['demo-progressive']) {
      throw new Error('demo-progressive script not found in package.json')
    }
    
    console.log(chalk.gray(`     ✓ CLI commands structure validated`))
    console.log(chalk.gray(`     ✓ Package.json scripts configured`))
    
    return true
  })
  
  // Summary
  console.log(chalk.cyan('\n📊 Test Results Summary:'))
  console.log(chalk.green(`   ✓ Passed: ${passed}`))
  console.log(chalk.red(`   ✗ Failed: ${failed}`))
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n🎉 All tests passed! Progressive system is ready.'))
    console.log(chalk.cyan('\n🚀 Try it out:'))
    console.log(chalk.white('   npm run demo-progressive'))
    console.log(chalk.white('   npm run generate-restaurant-pwa "Mario\'s Pizza"'))
    console.log(chalk.white('   npm run generate-progressive-pwa --interactive'))
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed. Please check the issues above.'))
    process.exit(1)
  }
  
  async function runTest(name, testFn) {
    const spinner = ora(name).start()
    
    try {
      await testFn()
      spinner.succeed(chalk.green(name))
      passed++
    } catch (error) {
      spinner.fail(chalk.red(`${name}: ${error.message}`))
      failed++
    }
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error(chalk.red('\nTest suite failed:'), error)
    process.exit(1)
  })
}

module.exports = { runTests }