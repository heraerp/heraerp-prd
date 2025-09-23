/**
 * Test script for Phase 3 salon services API
 */

const BASE_URL = 'http://localhost:3002/api/playbook/salon/services';

async function testPhase3() {
  console.log('🧪 Testing Phase 3 Salon Services API...\n');

  // Test 1: Basic request
  console.log('1️⃣ Testing basic request (no filters)...');
  try {
    const res = await fetch(BASE_URL, {
      headers: {
        'Authorization': 'Bearer demo-token-salon-receptionist'
      }
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Response:', {
        itemCount: data.items?.length || 0,
        totalCount: data.total_count,
        limit: data.limit,
        offset: data.offset,
        firstItem: data.items?.[0] ? {
          id: data.items[0].id,
          name: data.items[0].entity_name,
          status: data.items[0].status
        } : 'No items'
      });
    } else {
      console.log('❌ Error:', await res.text());
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  // Test 2: Status filter
  console.log('\n2️⃣ Testing status filter (status=active)...');
  try {
    const res = await fetch(`${BASE_URL}?status=active`, {
      headers: {
        'Authorization': 'Bearer demo-token-salon-receptionist'
      }
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Active services:', data.total_count);
      console.log('✅ All items active?', 
        data.items?.every(item => item.status === 'active') || 'No items'
      );
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  // Test 3: Search filter
  console.log('\n3️⃣ Testing search filter (q=hair)...');
  try {
    const res = await fetch(`${BASE_URL}?q=hair`, {
      headers: {
        'Authorization': 'Bearer demo-token-salon-receptionist'
      }
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Search results:', {
        totalCount: data.total_count,
        matches: data.items?.slice(0, 3).map(s => s.entity_name) || []
      });
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  // Test 4: Branch filter (if you have a valid branch UUID)
  const testBranchId = '550e8400-e29b-41d4-a716-446655440000'; // Replace with actual branch ID
  console.log(`\n4️⃣ Testing branch filter (branch_id=${testBranchId})...`);
  try {
    const res = await fetch(`${BASE_URL}?branch_id=${testBranchId}`, {
      headers: {
        'Authorization': 'Bearer demo-token-salon-receptionist'
      }
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Branch filtered results:', {
        totalCount: data.total_count,
        itemCount: data.items?.length || 0,
        message: data.total_count === 0 ? 
          'No services linked to this branch (expected if no relationships exist)' : 
          'Services found for branch'
      });
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  // Test 5: Combined filters
  console.log('\n5️⃣ Testing combined filters (status=active&q=cut&limit=5)...');
  try {
    const res = await fetch(`${BASE_URL}?status=active&q=cut&limit=5`, {
      headers: {
        'Authorization': 'Bearer demo-token-salon-receptionist'
      }
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Combined filter results:', {
        totalCount: data.total_count,
        returnedCount: data.items?.length || 0,
        limit: data.limit,
        services: data.items?.map(s => s.entity_name) || []
      });
    }
  } catch (err) {
    console.error('❌ Network error:', err.message);
  }

  console.log('\n✅ Phase 3 API testing complete!');
}

// Run test
testPhase3().catch(console.error);