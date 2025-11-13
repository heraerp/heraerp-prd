import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAgroIssue() {
  console.log('🔍 AGRO DOMAIN CONTAMINATION ANALYSIS');
  console.log('=====================================\n');

  try {
    // Get all APPs first
    const appsQuery = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata, created_at')
      .eq('entity_type', 'APP')
      .order('created_at');
    
    const apps = appsQuery.data;
    
    // Get all APP_DOMAINs
    const domainsQuery = await supabase
      .from('core_entities')  
      .select('id, entity_name, metadata, created_at')
      .eq('entity_type', 'APP_DOMAIN')
      .order('created_at');
    
    const domains = domainsQuery.data;
    
    // Get all relationships
    const relationshipsQuery = await supabase
      .from('core_relationships')
      .select('id, from_entity_id, to_entity_id, relationship_type, created_at')
      .eq('relationship_type', 'APP_HAS_DOMAIN')
      .order('created_at');
    
    const relationships = relationshipsQuery.data;

    console.log('📊 CURRENT STATE:');
    console.log('==================');
    console.log(`• Total Apps: ${apps.length}`);
    console.log(`• Total Domains: ${domains.length}`);
    console.log(`• Total APP_HAS_DOMAIN relationships: ${relationships.length}\n`);

    // Identify retail vs agro domains
    const retailDomains = [
      'Retail Operations', 'Wholesale Distribution', 'Inventory & Warehouse', 
      'Planning & Replenishment', 'Finance', 'Customer & Loyalty', 
      'Analytics & Dashboards', 'Admin', 'Merchandise & Pricing'
    ];
    
    const agroDomains = [
      'Procurement', 'Processing', 'Inventory', 'Logistics', 
      'Sales', 'Labour', 'Dashboard', 'Reports'
    ];

    console.log('🛍️ RETAIL DOMAINS:');
    console.log('==================');
    domains.filter(d => retailDomains.includes(d.entity_name)).forEach(domain => {
      const rel = relationships.find(r => r.to_entity_id === domain.id);
      const linkedApp = rel ? apps.find(a => a.id === rel.from_entity_id)?.entity_name : 'UNLINKED';
      console.log(`• ${domain.entity_name} → ${linkedApp}`);
    });

    console.log('\n🌾 AGRO DOMAINS:');
    console.log('================');
    domains.filter(d => agroDomains.includes(d.entity_name)).forEach(domain => {
      const rel = relationships.find(r => r.to_entity_id === domain.id);
      const linkedApp = rel ? apps.find(a => a.id === rel.from_entity_id)?.entity_name : 'UNLINKED';
      console.log(`• ${domain.entity_name} → ${linkedApp}`);
    });

    console.log('\n🚨 PROBLEM ANALYSIS:');
    console.log('=====================');
    
    const unlinkedAgroDomains = domains.filter(d => 
      agroDomains.includes(d.entity_name) && 
      !relationships.find(r => r.to_entity_id === d.id)
    );
    
    const retailApp = apps.find(a => a.entity_name === 'HERA Retail');
    const cashewApp = apps.find(a => a.entity_name.includes('Cashew'));

    console.log(`• Retail App Found: ${retailApp ? '✅ ' + retailApp.entity_name : '❌ Not Found'}`);
    console.log(`• Agro/Cashew App Found: ${cashewApp ? '✅ ' + cashewApp.entity_name : '❌ Not Found'}`);
    console.log(`• Unlinked Agro Domains: ${unlinkedAgroDomains.length}`);
    
    if (unlinkedAgroDomains.length > 0) {
      console.log('\n❌ ISSUE IDENTIFIED:');
      console.log('The following agro domains exist but are not linked to any app:');
      unlinkedAgroDomains.forEach(domain => {
        console.log(`  • ${domain.entity_name} (ID: ${domain.id})`);
      });
      console.log('\nThis means they might be showing up in retail dashboard due to missing relationships.');
    }

    console.log('\n💡 LIKELY CAUSE:');
    console.log('================');
    console.log('When agro domains were created, they were not properly linked to the agro app.');
    console.log('The retail dashboard might be showing ALL domains instead of just linked ones.');
    console.log('This would cause agro domains to appear in retail dashboard.');

    console.log('\n🔧 SOLUTION OPTIONS:');
    console.log('====================');
    console.log('1. Create proper APP_HAS_DOMAIN relationships linking agro domains to cashew app');
    console.log('2. Fix the dashboard query to only show domains linked to the current app');
    console.log('3. Delete orphaned agro domains if they were created incorrectly');
    
    if (cashewApp && unlinkedAgroDomains.length > 0) {
      console.log('\n📝 SUGGESTED FIX COMMANDS:');
      console.log('===========================');
      unlinkedAgroDomains.forEach(domain => {
        console.log(`INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type) VALUES ('${cashewApp.id}', '${domain.id}', 'APP_HAS_DOMAIN');`);
      });
    }

    // Check what is making domains appear in retail dashboard
    console.log('\n🔍 DASHBOARD QUERY ANALYSIS:');
    console.log('=============================');
    console.log('The retail dashboard is likely showing all APP_DOMAIN entities instead of filtering by APP_HAS_DOMAIN relationships.');
    console.log('This would explain why unlinked agro domains appear in the retail dashboard.');

  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

findAgroIssue();