// Quick script to test the readiness dashboard data

const fetch = require('node-fetch');

async function testReadinessData() {
  console.log('🔍 Testing Readiness Dashboard Data...\n');
  
  // Test debug endpoint
  try {
    console.log('1. Checking debug endpoint...');
    const debugResponse = await fetch('http://localhost:3002/api/v1/readiness/debug');
    const debugData = await debugResponse.json();
    console.log('Debug data:', JSON.stringify(debugData, null, 2));
    console.log('\n');
  } catch (error) {
    console.error('Debug endpoint error:', error.message);
  }
  
  // Test sessions endpoint
  try {
    console.log('2. Checking sessions endpoint...');
    const sessionsResponse = await fetch('http://localhost:3002/api/v1/readiness/sessions');
    const sessionsData = await sessionsResponse.json();
    console.log('Sessions count:', sessionsData.data?.length || 0);
    
    if (sessionsData.data && sessionsData.data.length > 0) {
      const firstSession = sessionsData.data[0];
      console.log('First session:', {
        id: firstSession.id,
        status: firstSession.transaction_status,
        answers_count: firstSession.answers?.length || 0,
        metadata: firstSession.metadata
      });
    }
    console.log('\n');
  } catch (error) {
    console.error('Sessions endpoint error:', error.message);
  }
  
  // Create test data
  try {
    console.log('3. Creating test data...');
    const testResponse = await fetch('http://localhost:3002/api/v1/readiness/populate-test-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'test-' + Date.now() })
    });
    const testData = await testResponse.json();
    console.log('Test data creation:', testData);
  } catch (error) {
    console.error('Test data creation error:', error.message);
  }
}

testReadinessData();