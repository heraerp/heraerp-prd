const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkEmail() {
  const { data: users } = await supabase.auth.admin.listUsers()
  const santhosh = users.users.find(u => u.email === 'santhoshlal@gmail.com')
  
  console.log('Email status for santhoshlal@gmail.com:')
  console.log('- Email confirmed:', santhosh.email_confirmed_at ? 'YES' : 'NO')
  console.log('- Created:', santhosh.created_at)
  console.log('- Last sign in:', santhosh.last_sign_in_at || 'Never')
  
  if (!santhosh.email_confirmed_at) {
    console.log('')
    console.log('⚠️  Email needs confirmation!')
    console.log('1. Check your email inbox for confirmation link')
    console.log('2. Or confirm manually in Supabase dashboard')
  } else {
    console.log('')
    console.log('✅ Email is confirmed! Ready to sign in.')
  }
}

checkEmail()