// Verify dashboard data
const fetch = require('node-fetch');

async function verifyDashboard() {
  console.log('🔍 Verifying Readiness Dashboard Data...\n');
  
  try {
    const response = await fetch('http://localhost:3000/api/v1/readiness/sessions');
    const data = await response.json();
    
    console.log(`📊 Total sessions: ${data.data?.length || 0}\n`);
    
    if (data.data && data.data.length > 0) {
      data.data.forEach((session, idx) => {
        console.log(`Session ${idx + 1}:`);
        console.log(`  ID: ${session.id}`);
        console.log(`  Status: ${session.transaction_status}`);
        console.log(`  Score: ${session.total_amount}%`);
        console.log(`  Answers: ${session.answers?.length || 0}`);
        
        if (session.answers && session.answers.length > 0) {
          console.log(`  Sample answers:`);
          session.answers.slice(0, 3).forEach((answer, i) => {
            console.log(`    ${i + 1}. "${answer.description}"`);
            console.log(`       Answer: ${answer.line_data?.answer_value || 'N/A'}`);
            console.log(`       Category: ${answer.line_data?.category || 'N/A'}`);
            console.log(`       Score: ${answer.unit_amount}`);
          });
        }
        console.log('');
      });
    }
    
    console.log(`\n✅ Dashboard should now display the data at:`);
    console.log(`   http://localhost:3000/readiness-dashboard`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDashboard();