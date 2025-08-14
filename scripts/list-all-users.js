/**
 * List all users in the Supabase system
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYwMDc4NywiZXhwIjoyMDY5MTc2Nzg3fQ.fMuyCMNmHY4jKy8JyYEkC8KM5BCWSlDS35OQDfZWhPc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listAllUsers() {
  console.log('\n👥 All Users in HERA System')
  console.log('===========================\n')

  try {
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error listing users:', error.message)
      return
    }

    console.log(`Total users: ${users.users.length}\n`)

    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log(`   Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
      
      if (user.user_metadata?.business_name) {
        console.log(`   Business: ${user.user_metadata.business_name}`)
      }
      if (user.user_metadata?.full_name) {
        console.log(`   Name: ${user.user_metadata.full_name}`)
      }
      
      console.log('   ---')
    })

    console.log('\n📝 Summary:')
    console.log(`   Total Users: ${users.users.length}`)
    console.log(`   Confirmed: ${users.users.filter(u => u.email_confirmed_at).length}`)
    console.log(`   Unconfirmed: ${users.users.filter(u => !u.email_confirmed_at).length}`)
    
    // Group by business type
    const businessTypes = {}
    users.users.forEach(user => {
      const type = user.user_metadata?.business_type || 'unknown'
      businessTypes[type] = (businessTypes[type] || 0) + 1
    })
    
    console.log('\n🏢 By Business Type:')
    Object.entries(businessTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} users`)
    })

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

// List all users
listAllUsers().catch(console.error)