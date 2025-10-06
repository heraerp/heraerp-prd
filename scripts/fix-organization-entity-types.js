const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Your organization ID (from the earlier logs)
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

  console.log('🔍 Checking entity types for your organization:', orgId, '\n');

  // Get all entity types in your org
  const { data: entities } = await supabase
    .from('core_entities')
    .select('entity_type')
    .eq('organization_id', orgId);

  const types = {};
  entities.forEach(e => {
    types[e.entity_type] = (types[e.entity_type] || 0) + 1;
  });

  console.log('📊 Current entity types in your organization:\n');
  Object.entries(types).sort().forEach(([type, count]) => {
    const isUpper = type === type.toUpperCase();
    const icon = isUpper ? '✅' : '⚠️';
    console.log(`${icon} ${type.padEnd(20)} → ${count} entities`);
  });

  // Find lowercase types that need conversion
  const needsUpdate = Object.keys(types).filter(t => t !== t.toUpperCase());

  if (needsUpdate.length === 0) {
    console.log('\n✅ All entity types are already uppercase!');
    return;
  }

  console.log('\n🔄 Converting to uppercase...\n');

  let totalUpdated = 0;
  for (const oldType of needsUpdate) {
    const newType = oldType.toUpperCase();
    console.log(`🔄 ${oldType} → ${newType}`);

    const { data, error } = await supabase
      .from('core_entities')
      .update({ entity_type: newType })
      .eq('organization_id', orgId)
      .eq('entity_type', oldType)
      .select();

    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   Will try to fix and retry...');

      // If it's a smart_code error, fix the smart_codes first
      if (error.message.includes('smart_code')) {
        const { data: invalidEntities } = await supabase
          .from('core_entities')
          .select('id, entity_name, smart_code')
          .eq('organization_id', orgId)
          .eq('entity_type', oldType);

        console.log(`   Found ${invalidEntities?.length || 0} entities to fix`);

        for (const entity of invalidEntities || []) {
          // Fix smart_code if invalid
          if (!entity.smart_code || entity.smart_code.split('.').length < 6) {
            const fixedSmartCode = `HERA.SALON.${oldType.toUpperCase()}.ENTITY.STANDARD.V1`;
            await supabase
              .from('core_entities')
              .update({
                smart_code: fixedSmartCode,
                entity_type: newType
              })
              .eq('id', entity.id);
            console.log(`   ✅ Fixed: ${entity.entity_name}`);
          } else {
            // Just update entity_type
            await supabase
              .from('core_entities')
              .update({ entity_type: newType })
              .eq('id', entity.id);
          }
        }
        totalUpdated += invalidEntities?.length || 0;
        console.log(`   ✅ Fixed and updated ${invalidEntities?.length || 0} entities`);
      }
    } else {
      const count = data?.length || 0;
      totalUpdated += count;
      console.log(`   ✅ Updated ${count} entities`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Total entities updated: ${totalUpdated}`);
  console.log('='.repeat(50));

  // Verify final state
  const { data: finalEntities } = await supabase
    .from('core_entities')
    .select('entity_type')
    .eq('organization_id', orgId);

  const finalTypes = {};
  finalEntities.forEach(e => {
    finalTypes[e.entity_type] = (finalTypes[e.entity_type] || 0) + 1;
  });

  console.log('\n📊 Final entity types:\n');
  Object.entries(finalTypes).sort().forEach(([type, count]) => {
    const isUpper = type === type.toUpperCase();
    const icon = isUpper ? '✅' : '❌';
    console.log(`${icon} ${type.padEnd(20)} → ${count} entities`);
  });

  const allUpper = Object.keys(finalTypes).every(t => t === t.toUpperCase());
  if (allUpper) {
    console.log('\n✅ SUCCESS: All entity types are now uppercase!');
  } else {
    console.log('\n⚠️  Some entity types are still lowercase');
  }
})();
