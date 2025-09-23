const { UniversalApi } = require('./lib/universal-api');
require('dotenv').config({ path: '../.env' });

async function verifyHairtalkzCOA() {
    const api = new UniversalApi({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseKey: process.env.SUPABASE_SERVICE_KEY
    });

    const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    
    try {
        // Get GL accounts for this organization
        const { data: accounts, error } = await api.read('core_entities', {
            filter: {
                organization_id: orgId,
                entity_type: 'gl_account'
            }
        });

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log(`\n✅ Chart of Accounts for Hairtalkz (${orgId})`);
        console.log(`Total GL Accounts: ${accounts?.length || 0}`);
        
        if (accounts && accounts.length > 0) {
            console.log('\nSample Accounts:');
            // Group by account code prefix
            const byType = {};
            accounts.forEach(acc => {
                const prefix = acc.entity_code?.substring(0, 1) || '?';
                if (!byType[prefix]) byType[prefix] = [];
                byType[prefix].push(acc);
            });

            // Show a few from each category
            Object.entries(byType).sort().forEach(([prefix, accs]) => {
                const typeNames = {
                    '1': 'Assets',
                    '2': 'Liabilities', 
                    '3': 'Equity',
                    '4': 'Revenue',
                    '5': 'Expenses'
                };
                console.log(`\n${typeNames[prefix] || 'Other'} (${prefix}xxx):`);
                accs.slice(0, 3).forEach(acc => {
                    console.log(`  ${acc.entity_code} - ${acc.entity_name}`);
                });
                if (accs.length > 3) {
                    console.log(`  ... and ${accs.length - 3} more`);
                }
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyHairtalkzCOA();