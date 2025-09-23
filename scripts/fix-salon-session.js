#!/usr/bin/env node
/**
 * Fix salon session issues by clearing and resetting auth state
 */

console.log('🔧 Salon Session Fix Script')
console.log('===========================\n')

console.log('Run these commands in your browser console:')
console.log('')
console.log('// 1. Clear all auth data')
console.log(`localStorage.clear()`)
console.log(`sessionStorage.clear()`)
console.log('')
console.log('// 2. Set HairTalkz organization')
console.log(`localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')`)
console.log('')
console.log('// 3. Refresh the page')
console.log(`window.location.reload()`)
console.log('')
console.log('// 4. Login with one of these users:')
console.log('//    owner@hairtalkz.ae')
console.log('//    receptionist@hairtalkz.ae')
console.log('//    accountant@hairtalkz.ae')
console.log('//    admin@hairtalkz.ae')
console.log('')
console.log('// 5. If still having issues, run this to force logout:')
console.log(`(async () => {
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
  const supabase = createClient('${process.env.NEXT_PUBLIC_SUPABASE_URL}', '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}')
  await supabase.auth.signOut()
  localStorage.clear()
  window.location.href = '/salon/auth'
})()`)
console.log('')
console.log('✨ This should fix any session persistence issues!')