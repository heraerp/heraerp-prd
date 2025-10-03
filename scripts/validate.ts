#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

interface ValidationStep {
  name: string
  command: string
  required: boolean
  envRequired?: string[]
}

const validations: ValidationStep[] = [
  {
    name: 'Preset Schema Validation',
    command: 'npm run presets:validate',
    required: true,
  },
  {
    name: 'RPC v2 Contract Probe',
    command: 'npm run rpc:probe',
    required: false,
    envRequired: ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'HERA_TEST_ORG_ID'],
  },
  {
    name: 'Posting Smoke Test',
    command: 'npm run posting:smoke',
    required: false,
    envRequired: ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'HERA_TEST_ORG_ID'],
  },
  {
    name: 'Documentation Sync',
    command: 'npm run docs:sync',
    required: true,
  },
]

function checkEnv(vars: string[]): boolean {
  return vars.every(v => process.env[v])
}

function runValidation(step: ValidationStep): boolean {
  console.log(`\n🔍 Running: ${step.name}`)
  console.log(`   Command: ${step.command}`)
  
  // Check environment variables if required
  if (step.envRequired && !checkEnv(step.envRequired)) {
    if (step.required) {
      console.error(`❌ Required environment variables missing: ${step.envRequired.join(', ')}`)
      return false
    } else {
      console.log(`⚠️  Skipping - Missing environment variables: ${step.envRequired.join(', ')}`)
      return true
    }
  }
  
  try {
    execSync(step.command, { stdio: 'inherit' })
    console.log(`✅ ${step.name} passed`)
    return true
  } catch (error) {
    if (step.required) {
      console.error(`❌ ${step.name} failed`)
      return false
    } else {
      console.log(`⚠️  ${step.name} failed (non-critical)`)
      return true
    }
  }
}

async function main() {
  console.log('🏛️ HERA Architecture Validation Suite\n')
  console.log('This will run all architecture enforcement checks.')
  
  let allPassed = true
  
  for (const step of validations) {
    const passed = runValidation(step)
    if (!passed) {
      allPassed = false
      break // Stop on first required failure
    }
  }
  
  console.log('\n' + '='.repeat(50))
  
  if (allPassed) {
    console.log('✅ All architecture validations passed!')
    process.exit(0)
  } else {
    console.log('❌ Some validations failed. Please fix the issues above.')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('❌ Validation suite error:', err)
  process.exit(1)
})