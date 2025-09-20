const jwt = require('jsonwebtoken');
require('dotenv').config();

// This script shows how to create a proper JWT for demo sessions
async function createDemoJWT() {
  console.log('🔐 Creating demo JWT token with proper claims...\n');
  
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'; // Hair Talkz
  const userEntityId = '25cc0186-d20f-4ce9-a55a-9dba639cf1bc'; // Demo user entity ID
  
  // JWT payload following Supabase's structure
  const payload = {
    // Standard JWT claims
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    iat: Math.floor(Date.now() / 1000),
    iss: process.env.NEXT_PUBLIC_SUPABASE_URL + '/auth/v1',
    sub: 'demo-salon-receptionist', // Demo user ID
    
    // Custom claims for HERA
    organization_id: organizationId,
    entity_id: userEntityId,
    role: 'receptionist',
    
    // App metadata (alternative location for claims)
    app_metadata: {
      organization_id: organizationId,
      entity_id: userEntityId,
      provider: 'demo'
    },
    
    // User metadata
    user_metadata: {
      demo: true,
      type: 'salon-receptionist'
    }
  };
  
  // Sign with Supabase JWT secret
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  
  if (!jwtSecret) {
    console.error('❌ SUPABASE_JWT_SECRET not found in environment');
    console.log('💡 Add it to your .env file from your Supabase dashboard');
    return;
  }
  
  const token = jwt.sign(payload, jwtSecret, {
    algorithm: 'HS256'
  });
  
  console.log('✅ Demo JWT created successfully!\n');
  console.log('📋 Token claims:');
  console.log(`- organization_id: ${organizationId}`);
  console.log(`- entity_id: ${userEntityId}`);
  console.log(`- role: receptionist`);
  console.log(`- expires: ${new Date(payload.exp * 1000).toLocaleString()}`);
  
  console.log('\n🔑 JWT Token:');
  console.log(token);
  
  console.log('\n💡 To use this token:');
  console.log('1. Set it as Authorization header: Bearer ' + token);
  console.log('2. Or use supabase.auth.setSession({ access_token: token, refresh_token: token })');
  
  // Decode to verify
  const decoded = jwt.decode(token);
  console.log('\n🔍 Decoded token:');
  console.log(JSON.stringify(decoded, null, 2));
}

createDemoJWT().catch(console.error);