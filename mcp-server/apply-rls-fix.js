#!/usr/bin/env node

// ================================================================================
// APPLY RLS FIX - Remove app.current_org Dependencies
// Smart Code: HERA.FIX.RLS.APP.CURRENT.ORG.v1
// Executes SQL to fix the "unrecognized configuration parameter" error
// ================================================================================

const fs = require('fs')
const path = require('path')

console.log('🔧 HERA RLS Fix - Removing app.current_org Dependencies')
console.log('=' .repeat(60))

// Check if we're in the right directory
const sqlFile = path.join(__dirname, 'simple-rls-fix.sql')
if (!fs.existsSync(sqlFile)) {
  console.error('❌ Error: simple-rls-fix.sql not found')
  console.error('   Make sure you are in the mcp-server directory')
  process.exit(1)
}

// Read the SQL file
const sqlContent = fs.readFileSync(sqlFile, 'utf8')

console.log('📋 Instructions to fix the RLS issue:')
console.log('')
console.log('1. 🌐 Go to your Supabase Dashboard')
console.log('   https://supabase.com/dashboard/project/[your-project-id]')
console.log('')
console.log('2. 📝 Navigate to SQL Editor')
console.log('   Click "SQL Editor" in the left sidebar')
console.log('')
console.log('3. 📋 Copy and paste this SQL code:')
console.log('')
console.log('   ' + '='.repeat(50))
console.log('')

// Output the SQL with line numbers for easy copying
const lines = sqlContent.split('\n')
lines.forEach((line, index) => {
  const lineNum = (index + 1).toString().padStart(3, ' ')
  console.log(`   ${lineNum} | ${line}`)
})

console.log('')
console.log('   ' + '='.repeat(50))
console.log('')
console.log('4. ▶️  Click "Run" to execute the SQL')
console.log('')
console.log('5. ✅ You should see: "Simple RLS policies created. The app.current_org error should be resolved."')
console.log('')
console.log('6. 🔄 Refresh your browser and the 400 Bad Request errors should be gone')
console.log('')

console.log('🔍 What this fix does:')
console.log('  • Removes all RLS policies that reference app.current_org')
console.log('  • Drops problematic functions like hera_current_org_id()')
console.log('  • Creates simple policies that allow authenticated access')
console.log('  • Maintains organization filtering at the application level')
console.log('')

console.log('🛡️  Security Note:')
console.log('  Organization isolation is maintained by your Universal API')
console.log('  which passes organization_id filters in all queries.')
console.log('')

console.log('⚡ Alternative: If you have Supabase CLI access, run:')
console.log('   supabase db reset --linked')
console.log('   # Then re-run your migrations without the app.current_org dependencies')
console.log('')

console.log('🎯 Once applied, your salon appointment system should work without errors!')