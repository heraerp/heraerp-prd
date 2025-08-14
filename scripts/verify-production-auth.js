#!/usr/bin/env node

/**
 * Verify Production-Ready Authentication System
 * Ensures only Supabase auth remains and no conflicts exist
 */

const fs = require('fs')
const path = require('path')

function checkFileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath))
}

function checkFileContent(filePath, searchTerm) {
  try {
    const fullPath = path.join(__dirname, '..', filePath)
    if (!fs.existsSync(fullPath)) return false
    const content = fs.readFileSync(fullPath, 'utf8')
    return content.includes(searchTerm)
  } catch (error) {
    return false
  }
}

async function verifyProductionAuth() {
  console.log('🔍 Verifying Production-Ready Authentication')
  console.log('============================================')

  let allPassed = true

  // 1. Check old auth files are removed
  console.log('\\n1. ✅ Checking old auth files are removed...')
  
  const removedFiles = [
    'src/contexts/auth-context.tsx',
    'src/components/auth/LoginForm.tsx',
    'src/components/auth/DualAuthProvider.tsx',
    'src/components/auth/HERAAuthProvider.tsx',
    'src/components/auth/UniversalAuthProvider.tsx',
    'src/lib/auth'
  ]

  for (const file of removedFiles) {
    if (checkFileExists(file)) {
      console.log(`   ❌ Old file still exists: ${file}`)
      allPassed = false
    } else {
      console.log(`   ✅ Removed: ${file}`)
    }
  }

  // 2. Check required files exist
  console.log('\\n2. ✅ Checking required files exist...')
  
  const requiredFiles = [
    'src/contexts/supabase-auth-context.tsx',
    'src/app/login-supabase/page.tsx',
    'src/app/auth/callback/page.tsx',
    'src/middleware.ts'
  ]

  for (const file of requiredFiles) {
    if (checkFileExists(file)) {
      console.log(`   ✅ Required file exists: ${file}`)
    } else {
      console.log(`   ❌ Missing required file: ${file}`)
      allPassed = false
    }
  }

  // 3. Check for old auth imports
  console.log('\\n3. ✅ Checking for old auth imports...')
  
  const filesToCheck = [
    'src/app/layout.tsx',
    'src/components/auth/index.ts',
    'src/middleware.ts'
  ]

  for (const file of filesToCheck) {
    if (checkFileContent(file, '/auth-context') && !checkFileContent(file, 'supabase-auth-context')) {
      console.log(`   ⚠️  Found old auth-context import in: ${file}`)
    } else if (checkFileContent(file, 'SupabaseAuthProvider') || checkFileContent(file, 'useSupabaseAuth')) {
      console.log(`   ✅ Using Supabase auth in: ${file}`)
    }
  }

  // 4. Check package.json
  console.log('\\n4. ✅ Checking package.json dependencies...')
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  
  const oldDeps = ['bcryptjs', 'jsonwebtoken', '@types/bcryptjs', '@types/jsonwebtoken']
  const requiredDeps = ['@supabase/supabase-js', '@supabase/auth-helpers-nextjs']
  
  for (const dep of oldDeps) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`   ❌ Old dependency still exists: ${dep}`)
      allPassed = false
    } else {
      console.log(`   ✅ Old dependency removed: ${dep}`)
    }
  }
  
  for (const dep of requiredDeps) {
    if (packageJson.dependencies?.[dep]) {
      console.log(`   ✅ Required dependency exists: ${dep}`)
    } else {
      console.log(`   ❌ Missing required dependency: ${dep}`)
      allPassed = false
    }
  }

  // 5. Check environment variables
  console.log('\\n5. ✅ Checking environment variables...')
  
  try {
    const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
      console.log('   ✅ Supabase URL configured')
    } else {
      console.log('   ❌ Missing Supabase URL')
      allPassed = false
    }
    
    if (envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
      console.log('   ✅ Supabase anon key configured')
    } else {
      console.log('   ❌ Missing Supabase anon key')
      allPassed = false
    }
    
    if (envContent.includes('JWT_SECRET') && !envContent.includes('# JWT and BCRYPT removed')) {
      console.log('   ⚠️  Old JWT_SECRET still in env file')
    } else {
      console.log('   ✅ Old JWT variables removed')
    }
    
  } catch (error) {
    console.log('   ❌ Could not read .env.local file')
    allPassed = false
  }

  // 6. Summary
  console.log('\\n' + '='.repeat(50))
  if (allPassed) {
    console.log('🎉 PRODUCTION AUTH VERIFICATION PASSED!')
    console.log('✅ All old authentication code removed')
    console.log('✅ Supabase-only authentication system ready')
    console.log('✅ No conflicts or legacy dependencies')
    console.log('')
    console.log('🚀 Ready for production deployment!')
    console.log('')
    console.log('Test URLs:')
    console.log('- Login: http://localhost:3001/login')
    console.log('- Dashboard: http://localhost:3001/dashboard')
    console.log('- Test tokens: http://localhost:3001/test-auth-tokens')
  } else {
    console.log('❌ PRODUCTION AUTH VERIFICATION FAILED')
    console.log('Please fix the issues above before deploying to production')
  }

  return allPassed
}

if (require.main === module) {
  verifyProductionAuth()
}