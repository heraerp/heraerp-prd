/**
 * Test script for HERA Salon Manager functionality
 */

require('dotenv').config();

// Test the salon manager chat API endpoint
async function testSalonManager() {
  console.log('🧪 Testing HERA Salon Manager Integration');
  console.log('=========================================\n');

  const baseUrl = 'http://localhost:3002';
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';

  // Test cases
  const testCases = [
    {
      name: 'Check inventory levels',
      message: 'Check blonde toner stock',
      expectedIntent: 'inventory'
    },
    {
      name: 'Book appointment',
      message: 'Book Aisha Mohammed for highlights tomorrow at 2pm with Sarah',
      expectedIntent: 'appointment'
    },
    {
      name: 'Revenue analysis',
      message: 'Show today\'s revenue',
      expectedIntent: 'revenue'
    },
    {
      name: 'Staff performance',
      message: 'Calculate Sarah Johnson\'s commission this week',
      expectedIntent: 'commission'
    },
    {
      name: 'Birthday clients',
      message: 'Show birthday clients this month',
      expectedIntent: 'birthday'
    },
    {
      name: 'Check availability',
      message: 'Who\'s available for a haircut today?',
      expectedIntent: 'availability'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Test: ${testCase.name}`);
    console.log(`📝 Message: "${testCase.message}"`);
    
    try {
      const response = await fetch(`${baseUrl}/api/v1/salon-manager/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testCase.message,
          organizationId: organizationId,
          context: {
            mode: 'chat',
            userId: 'test-user'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Success:', result.success ? 'Yes' : 'No');
      if (result.confidence) {
        console.log(`📊 Confidence: ${result.confidence}%`);
      }
      
      // Show first 200 chars of message
      const shortMessage = result.message.substring(0, 200);
      console.log(`💬 Response: ${shortMessage}${result.message.length > 200 ? '...' : ''}`);
      
      if (result.actions && result.actions.length > 0) {
        console.log(`🎯 Actions: ${result.actions.map(a => a.label).join(', ')}`);
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n========================================');
  console.log('✨ SALON MANAGER TESTS COMPLETE');
  console.log('========================================');
}

// Run tests
testSalonManager()
  .then(() => {
    console.log('\n✅ All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test runner error:', error);
    process.exit(1);
  });