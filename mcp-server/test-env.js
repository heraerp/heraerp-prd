require('dotenv').config(); 
console.log('SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL); 
console.log('ANON_KEY:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); 
console.log('SERVICE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);