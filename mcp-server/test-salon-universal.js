// Test the universal salon handler
const fetch = require('node-fetch');

async function testSalonQueries() {
  const baseUrl = 'http://localhost:3006/api/salon/chat';
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';
  
  const testQueries = [
    'Check hair color stock',
    'Book Emma for highlights tomorrow at 2pm',
    'Who is available now?',
    'Show blonde toner stock'
  ];
  
  console.log('🧪 Testing Universal Salon Handler\n');
  
  for (const query of testQueries) {
    console.log(`📝 Query: "${query}"`);
    
    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          organizationId
        })
      });
      
      const data = await response.json();
      console.log(`✅ Success: ${data.success}`);
      console.log(`📤 Response: ${data.response}`);
      console.log('---\n');
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n---\n`);
    }
  }
}

// Run tests
testSalonQueries();