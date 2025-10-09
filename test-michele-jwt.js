require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testMicheleJWT() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzM3MzY1NjYyLCJpYXQiOjE3MzcyNzkyNjIsImlzcyI6Imh0dHBzOi8vYXdmY3JuY3huZ3F3YmhxYXBmZmIuc3VwYWJhc2UuY28vYXV0aC92MSIsInN1YiI6IjA5YjBiOTJhLWQ3OTctNDg5ZS1iYzAzLTVjYTBhNjI3MjY3NCIsImVtYWlsIjoibWljaGVsZXNodWxlQGdtYWlsLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnt9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzM3Mjc5MjYyfV0sInNlc3Npb25faWQiOiI5Yzc0ZTkzMy05ZjUzLTQ4ODQtOWE3MS1jMzQyNDgzNGE1OGEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.LkB7fQJvA1ztxAi1xXLyYjLrKCQWMh6o4PHvNPf78Io';
  
  // Test with Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('🔍 Testing Michele\'s JWT token validation...');
  
  try {
    const { data: user, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('❌ Token validation failed:', error);
      return;
    }
    
    if (!user?.user) {
      console.error('❌ No user found in token');
      return;
    }
    
    console.log('✅ Token is valid!');
    console.log('User ID:', user.user.id);
    console.log('Email:', user.user.email);
    console.log('User metadata:', JSON.stringify(user.user.user_metadata, null, 2));
    
    // Check if we can find USER_MEMBER_OF_ORG relationship
    console.log('\n🔍 Looking for existing relationship...');
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', user.user.id)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle();
    
    if (relError) {
      console.error('❌ Error checking relationship:', relError);
    } else if (relationship) {
      console.log('✅ Found USER_MEMBER_OF_ORG relationship:', relationship);
      console.log('Organization ID:', relationship.to_entity_id);
    } else {
      console.log('⚠️  No USER_MEMBER_OF_ORG relationship found');
    }
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

testMicheleJWT();