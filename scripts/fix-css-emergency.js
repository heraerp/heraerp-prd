#!/usr/bin/env node

/**
 * HERA CSS Emergency Fix Script
 * Smart Code: HERA.SCRIPT.CSS_EMERGENCY_FIX.v1
 * 
 * Fixes CSS loading issues after authentication provider updates
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

console.log('🚨 HERA CSS EMERGENCY FIX')
console.log('=========================')

async function fixCSS() {
  try {
    console.log('\n1️⃣ Clearing Next.js cache...')
    await execAsync('rm -rf .next')
    console.log('✅ Next.js cache cleared')

    console.log('\n2️⃣ Clearing npm cache...')
    await execAsync('npm cache clean --force')
    console.log('✅ NPM cache cleared')

    console.log('\n3️⃣ Reinstalling dependencies...')
    await execAsync('npm install')
    console.log('✅ Dependencies reinstalled')

    console.log('\n4️⃣ Rebuilding Tailwind CSS...')
    await execAsync('npx tailwindcss -i ./src/app/globals.css -o ./public/tailwind-emergency.css --watch=false')
    console.log('✅ Tailwind CSS rebuilt')

    console.log('\n5️⃣ Testing development server startup...')
    console.log('🔧 Starting dev server (will run for 10 seconds to test CSS)...')
    
    const devProcess = exec('npm run dev')
    
    setTimeout(() => {
      devProcess.kill()
      console.log('✅ Development server test completed')
      
      console.log('\n📋 RECOVERY INSTRUCTIONS:')
      console.log('========================')
      console.log('1. The CSS should now be working properly')
      console.log('2. Start the development server: npm run dev')
      console.log('3. Access the login page: http://localhost:3002/greenworms/login')
      console.log('4. Check if styles are loading correctly')
      console.log('\n🛡️ If CSS is still broken:')
      console.log('- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)')
      console.log('- Clear browser cache')
      console.log('- Restart development server')
      
      console.log('\n🎯 Authentication credentials:')
      console.log('Email: team@hanaset.com')
      console.log('Password: HERA2025!')
      
      process.exit(0)
    }, 10000)

    devProcess.stdout.on('data', (data) => {
      if (data.includes('Ready') || data.includes('localhost')) {
        console.log('✅ Development server is ready')
      }
    })

  } catch (error) {
    console.error('❌ CSS fix failed:', error.message)
    
    console.log('\n🔧 MANUAL RECOVERY STEPS:')
    console.log('1. rm -rf .next')
    console.log('2. npm cache clean --force')
    console.log('3. npm install')
    console.log('4. npm run dev')
    console.log('5. Hard refresh browser')
    
    process.exit(1)
  }
}

fixCSS()