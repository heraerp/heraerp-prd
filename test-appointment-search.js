// Quick test to verify searchAppointments is working
const { searchAppointments } = require('./src/lib/playbook/entities.ts');

(async () => {
  try {
    console.log('Testing searchAppointments function...');
    
    const result = await searchAppointments({
      organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
      page: 1,
      page_size: 10
    });
    
    console.log('Search result:', result);
    console.log('Number of appointments found:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('First appointment:', result.rows[0]);
    }
  } catch (error) {
    console.error('Error testing searchAppointments:', error);
  }
})();