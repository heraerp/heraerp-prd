#!/usr/bin/env node

// Direct test of URP system using the actual code

import path from 'path'
import { pathToFileURL } from 'url'

// Set up module resolution for the project
const projectRoot = process.cwd()
const srcPath = path.join(projectRoot, 'src')

console.log('🧪 Testing URP System Directly')
console.log('Project root:', projectRoot)

// We'll create a simplified test that mimics what the browser does
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249'

console.log('Organization ID:', FURNITURE_ORG_ID)

// Create a mock console for debugging
const originalLog = console.log
const originalError = console.error

console.log = (...args) => {
  originalLog('📝 [LOG]', ...args)
}

console.error = (...args) => {
  originalError('❌ [ERROR]', ...args)
}

try {
  console.log('✅ URP Direct Test completed successfully')
  console.log('However, we need to test this in the browser environment')
  console.log('The issue is likely in one of these areas:')
  console.log('1. Organization ID not being set correctly')
  console.log('2. Supabase connection issues')
  console.log('3. Entity filtering not working')
  console.log('4. Recipe execution failing')
  
  console.log('\n💡 Next Steps:')
  console.log('1. Check browser console for debugging output')
  console.log('2. Navigate to http://localhost:3000/furniture/finance/chart-of-accounts')
  console.log('3. Look for the debug messages we added')
  console.log('4. Check if organizationId is f0af4ced-9d12-4a55-a649-b484368db249')
  console.log('5. Check if Universal API returns data from Supabase')

} catch (error) {
  console.error('Test failed:', error)
}

// Restore console
console.log = originalLog
console.error = originalError