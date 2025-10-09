#!/usr/bin/env node

/**
 * HERA Development Auth Fix
 * Fixes common authentication issues in development environment
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 HERA Development Auth Fix\n')

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json')
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Please run this script from the project root directory')
  process.exit(1)
}

// Instructions for fixing auth issues
console.log('📋 Quick fixes for development auth issues:\n')

console.log('1️⃣  Clear browser storage (RECOMMENDED):')
console.log('   • Open browser dev tools (F12)')
console.log('   • Go to Console tab') 
console.log('   • Paste this code and press Enter:')
console.log('   localStorage.removeItem("hera-supabase-auth"); sessionStorage.clear(); location.reload();')
console.log('')

console.log('2️⃣  Or use this JavaScript snippet:')
console.log('   • Add this to any page temporarily:')
console.log('   <script>')
console.log('     localStorage.removeItem("hera-supabase-auth");')
console.log('     sessionStorage.clear();')
console.log('     console.log("Auth storage cleared!");')
console.log('   </script>')
console.log('')

console.log('3️⃣  Restart development server:')
console.log('   npm run dev')
console.log('')

console.log('4️⃣  If issue persists, check environment:')
console.log('   • Verify .env file has correct NEXT_PUBLIC_SUPABASE_URL')
console.log('   • Verify .env file has correct NEXT_PUBLIC_SUPABASE_ANON_KEY')
console.log('   • Both should point to awfcrncxngqwbhqapffb.supabase.co')
console.log('')

// Check environment variables
const envPath = path.join(process.cwd(), '.env')
const envLocalPath = path.join(process.cwd(), '.env.local')

let envContent = ''
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

if (fs.existsSync(envLocalPath)) {
  const localContent = fs.readFileSync(envLocalPath, 'utf8')
  envContent += '\n' + localContent
}

const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL')
const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const hasCorrectProject = envContent.includes('awfcrncxngqwbhqapffb')

console.log('🔍 Environment Check:')
console.log(`   ✅ Has Supabase URL: ${hasSupabaseUrl}`)
console.log(`   ✅ Has Supabase Key: ${hasSupabaseKey}`)
console.log(`   ✅ Correct Project: ${hasCorrectProject}`)

if (!hasSupabaseUrl || !hasSupabaseKey || !hasCorrectProject) {
  console.log('\n❌ Environment issues detected!')
  console.log('   Make sure your .env file contains:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
}

console.log('\n✅ After applying fixes, the "Invalid Refresh Token" error should be resolved!')
console.log('💡 This is a common development issue when tokens expire or become corrupted.')