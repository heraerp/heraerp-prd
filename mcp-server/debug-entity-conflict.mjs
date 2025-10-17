/**
 * Debug what's causing the duplicate key constraint
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.Hqe5XKMGP0rAPQNSBOI6NnJm6gVhXvBE8a8vLxKa1f0'
)

const userId = '2300a665-6650-4f4c-8e85-c1a7e8f2973d'
const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function debugEntityConflict() {
  console.log('🔍 Debugging entity conflict...')
  console.log('User ID:', userId)
  console.log('Org ID:', orgId)
  
  try {
    // Check ALL entities with this user ID
    console.log('\n📋 ALL ENTITIES WITH USER ID:')
    const { data: allEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userId)
    
    if (allEntities && allEntities.length > 0) {
      console.log(`Found ${allEntities.length} entities with this ID:`)
      allEntities.forEach((entity, i) => {
        console.log(`  ${i + 1}. Org: ${entity.organization_id}`)
        console.log(`     Type: ${entity.entity_type}`)
        console.log(`     Name: ${entity.entity_name}`)
        console.log(`     Smart Code: ${entity.smart_code}`)
        console.log(`     Created: ${entity.created_at}`)
        console.log('')
      })
    } else {
      console.log('No entities found with this user ID')
    }
    
    // Check specifically for tenant org
    console.log('🔍 CHECKING TENANT ORG SPECIFICALLY:')
    const { data: tenantEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', userId)
    
    if (tenantEntities && tenantEntities.length > 0) {
      console.log(`Found ${tenantEntities.length} entities in tenant org:`)
      tenantEntities.forEach((entity, i) => {
        console.log(`  ${i + 1}. Type: ${entity.entity_type}`)
        console.log(`     Name: ${entity.entity_name}`)
        console.log(`     Smart Code: ${entity.smart_code}`)
      })
    } else {
      console.log('No entities found in tenant org with this user ID')
    }
    
    // Try to create entity and see exact error
    console.log('\n🧪 TESTING ENTITY CREATION:')
    const { data: testEntity, error: testError } = await supabase
      .from('core_entities')
      .insert({
        id: userId,
        organization_id: orgId,
        entity_type: 'USER',
        entity_name: 'test_user',
        smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1',
        created_by: userId,
        updated_by: userId
      })
      .select()
    
    if (testError) {
      console.log('❌ Entity creation failed:')
      console.log('   Code:', testError.code)
      console.log('   Message:', testError.message)
      console.log('   Details:', testError.details)
      console.log('   Hint:', testError.hint)
      
      if (testError.code === '23505') {
        console.log('\n🔍 Duplicate key constraint - entity already exists somewhere')
        
        // Check if there's a non-USER entity with this ID in the tenant org
        const { data: otherEntities } = await supabase
          .from('core_entities')
          .select('*')
          .eq('id', userId)
          .eq('organization_id', orgId)
          .neq('entity_type', 'USER')
        
        if (otherEntities && otherEntities.length > 0) {
          console.log(`Found ${otherEntities.length} NON-USER entities with this ID in tenant org:`)
          otherEntities.forEach((entity, i) => {
            console.log(`  ${i + 1}. Type: ${entity.entity_type}`)
            console.log(`     Name: ${entity.entity_name}`)
            console.log(`     Smart Code: ${entity.smart_code}`)
          })
          
          // Delete these conflicting entities
          console.log('\n🗑️ Removing conflicting entities...')
          for (const entity of otherEntities) {
            console.log(`Deleting ${entity.entity_type} entity: ${entity.entity_name}`)
            
            // Delete dynamic data first
            await supabase
              .from('core_dynamic_data')
              .delete()
              .eq('entity_id', entity.id)
              .eq('organization_id', orgId)
            
            // Delete relationships
            await supabase
              .from('core_relationships')
              .delete()
              .or(`from_entity_id.eq.${entity.id},to_entity_id.eq.${entity.id}`)
              .eq('organization_id', orgId)
            
            // Delete the entity
            const { error: deleteError } = await supabase
              .from('core_entities')
              .delete()
              .eq('id', entity.id)
              .eq('organization_id', orgId)
              .eq('entity_type', entity.entity_type)
            
            if (deleteError) {
              console.log(`   ❌ Failed to delete: ${deleteError.message}`)
            } else {
              console.log('   ✅ Deleted successfully')
            }
          }
          
          // Now try to create the USER entity again
          console.log('\n🔄 Attempting to create USER entity again...')
          const { data: retryEntity, error: retryError } = await supabase
            .from('core_entities')
            .insert({
              id: userId,
              organization_id: orgId,
              entity_type: 'USER',
              entity_name: 'live',
              smart_code: 'HERA.SALON.USER.ENTITY.PERSON.V1',
              created_by: userId,
              updated_by: userId
            })
            .select()
            .single()
          
          if (retryError) {
            console.log('❌ Still failed:', retryError.message)
          } else {
            console.log('✅ USER entity created successfully!')
            console.log('   Name:', retryEntity.entity_name)
            console.log('   Type:', retryEntity.entity_type)
            
            return true
          }
        }
      }
    } else {
      console.log('✅ Test entity created successfully!')
      
      // Clean up test entity
      await supabase
        .from('core_entities')
        .delete()
        .eq('id', userId)
        .eq('organization_id', orgId)
        .eq('entity_name', 'test_user')
      
      console.log('✅ Test entity cleaned up')
    }
    
    return false
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
    return false
  }
}

// Run the debug
debugEntityConflict()
  .then(success => {
    console.log(`\n🎯 Entity conflict debug ${success ? 'RESOLVED' : 'COMPLETED'}!`)
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })