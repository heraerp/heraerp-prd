// Check Supabase session in browser console
// Paste this into the browser console to check the current Supabase session

(async function checkSupabaseSession() {
  console.log('🔍 Checking Supabase session...')
  
  try {
    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQwMTkyMjQsImV4cCI6MjAzOTU5NTIyNH0.5D8r9_qEwsV8NeF-Zu0E_f5yQM7SsP6DTFM9o-zONgM'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Error getting session:', error)
      return
    }
    
    if (session) {
      console.log('✅ Active Supabase session found:')
      console.log('   User ID:', session.user.id)
      console.log('   Email:', session.user.email)
      console.log('   Expires at:', new Date(session.expires_at * 1000))
    } else {
      console.log('🚫 No active Supabase session')
      console.log('\n💡 You need to sign in with the demo user:')
      console.log('   Email: owner@hairtalkz-demo.com')
      console.log('   Password: demo123')
    }
    
  } catch (error) {
    console.error('💥 Error:', error)
  }
})()

console.log('Copy and paste this entire script into the browser console')