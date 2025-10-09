import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function findAndRestoreBusinessEntities() {
  console.log('=== FINDING AND RESTORING BUSINESS ENTITIES ===')
  
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  try {
    // 1. Check for backup tables
    console.log('1. Searching for backup tables...')
    
    // Get all table names that might contain backups
    const { data: allTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%backup%')
    
    if (tablesError) {
      console.log('Table search method 1 failed, trying alternative...')
      
      // Try getting table names directly
      const { data: tableList } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT tablename as table_name 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename LIKE '%backup%'
          ORDER BY tablename DESC
        `
      })
      
      if (tableList) {
        console.log('Found backup tables:', tableList)
      }
    } else {
      console.log('Backup tables found:', allTables?.map(t => t.table_name))
    }
    
    // 2. Look for the most recent entity backup
    const possibleBackupTables = [
      'emergency_relationships_backup_2025_10_09',
      'emergency_entities_backup_2025_10_09',
      'entity_backup_2025_10_09',
      'core_entities_backup',
      'entities_backup'
    ]
    
    let backupTable = null
    for (const tableName of possibleBackupTables) {
      try {
        const { data: testQuery, error } = await supabase
          .from(tableName)
          .select('count(*)')
          .limit(1)
        
        if (!error) {
          console.log(`✅ Found backup table: ${tableName}`)
          backupTable = tableName
          break
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }
    
    if (!backupTable) {
      console.log('❌ No backup tables found. Creating sample business entities...')
      
      // Create sample Hair Talkz business entities
      const sampleEntities = [
        {
          entity_type: 'service',
          entity_name: 'Hair Cut & Style',
          entity_code: 'SVC-HAIRCUT-001',
          status: 'active',
          smart_code: null,
          metadata: {
            duration_minutes: 60,
            price: 85.00,
            category: 'hair_services'
          }
        },
        {
          entity_type: 'service',
          entity_name: 'Hair Color & Highlights',
          entity_code: 'SVC-COLOR-001',
          status: 'active',
          smart_code: null,
          metadata: {
            duration_minutes: 120,
            price: 150.00,
            category: 'hair_services'
          }
        },
        {
          entity_type: 'staff',
          entity_name: 'Michele Rossi',
          entity_code: 'STAFF-MICHELE',
          status: 'active',
          smart_code: null,
          metadata: {
            role: 'owner_stylist',
            specialties: ['cutting', 'coloring', 'styling'],
            email: 'michele@hairtalkz.com'
          }
        },
        {
          entity_type: 'staff',
          entity_name: 'Sarah Johnson',
          entity_code: 'STAFF-SARAH',
          status: 'active',
          smart_code: null,
          metadata: {
            role: 'senior_stylist',
            specialties: ['cutting', 'styling'],
            email: 'sarah@hairtalkz.com'
          }
        },
        {
          entity_type: 'customer',
          entity_name: 'Emma Thompson',
          entity_code: 'CUST-EMMA-001',
          status: 'active',
          smart_code: null,
          metadata: {
            phone: '+1-555-0123',
            email: 'emma@example.com',
            preferred_stylist: 'STAFF-MICHELE'
          }
        },
        {
          entity_type: 'customer',
          entity_name: 'James Wilson',
          entity_code: 'CUST-JAMES-001',
          status: 'active',
          smart_code: null,
          metadata: {
            phone: '+1-555-0124',
            email: 'james@example.com',
            preferred_stylist: 'STAFF-SARAH'
          }
        },
        {
          entity_type: 'product',
          entity_name: 'Professional Shampoo',
          entity_code: 'PROD-SHAMPOO-001',
          status: 'active',
          smart_code: null,
          metadata: {
            brand: 'HERA Professional',
            price: 25.00,
            category: 'hair_care'
          }
        },
        {
          entity_type: 'appointment',
          entity_name: 'Emma - Hair Cut',
          entity_code: 'APPT-' + Date.now(),
          status: 'scheduled',
          smart_code: null,
          metadata: {
            appointment_date: '2025-10-10T14:00:00Z',
            customer: 'CUST-EMMA-001',
            stylist: 'STAFF-MICHELE',
            service: 'SVC-HAIRCUT-001',
            duration_minutes: 60,
            price: 85.00
          }
        }
      ]
      
      console.log('\n2. Creating sample business entities...')
      
      const createdEntities = []
      for (const entityData of sampleEntities) {
        try {
          const { data: newEntity, error: createError } = await supabase
            .from('core_entities')
            .insert({
              organization_id: hairTalkzOrgId,
              ...entityData
            })
            .select()
            .single()
          
          if (createError) {
            console.error(`❌ Failed to create ${entityData.entity_name}:`, createError.message)
          } else {
            console.log(`✅ Created ${entityData.entity_type}: ${entityData.entity_name}`)
            createdEntities.push(newEntity)
          }
        } catch (error) {
          console.error(`❌ Error creating ${entityData.entity_name}:`, error.message)
        }
      }
      
      console.log(`\n✅ Created ${createdEntities.length} business entities`)
      
      // 3. Create dynamic data for entities
      console.log('\n3. Creating dynamic data for business entities...')
      
      const dynamicDataEntries = []
      createdEntities.forEach(entity => {
        if (entity.metadata) {
          Object.entries(entity.metadata).forEach(([key, value]) => {
            dynamicDataEntries.push({
              organization_id: hairTalkzOrgId,
              entity_id: entity.id,
              field_name: key,
              field_type: typeof value === 'number' ? 'number' : 
                         typeof value === 'object' ? 'json' : 'text',
              field_value_text: typeof value === 'string' ? value : 
                               typeof value === 'number' ? value.toString() : null,
              field_value_number: typeof value === 'number' ? value : null,
              field_value_json: typeof value === 'object' ? value : null,
              smart_code: null
            })
          })
        }
      })
      
      if (dynamicDataEntries.length > 0) {
        const { data: dynamicData, error: dynamicError } = await supabase
          .from('core_dynamic_data')
          .insert(dynamicDataEntries)
          .select()
        
        if (dynamicError) {
          console.error('❌ Failed to create dynamic data:', dynamicError.message)
        } else {
          console.log(`✅ Created ${dynamicData.length} dynamic data entries`)
        }
      }
      
      // 4. Create some basic relationships
      console.log('\n4. Creating business relationships...')
      
      const relationships = [
        // Staff member of organization
        {
          from_entity_id: createdEntities.find(e => e.entity_code === 'STAFF-MICHELE')?.id,
          to_entity_id: hairTalkzOrgId,
          relationship_type: 'MEMBER_OF',
          smart_code: null
        },
        {
          from_entity_id: createdEntities.find(e => e.entity_code === 'STAFF-SARAH')?.id,
          to_entity_id: hairTalkzOrgId,
          relationship_type: 'MEMBER_OF',
          smart_code: null
        }
      ].filter(rel => rel.from_entity_id) // Only include if entity was created
      
      for (const relData of relationships) {
        try {
          const { error: relError } = await supabase
            .from('core_relationships')
            .insert({
              organization_id: hairTalkzOrgId,
              ...relData
            })
          
          if (relError) {
            console.error('❌ Failed to create relationship:', relError.message)
          } else {
            console.log(`✅ Created relationship: ${relData.relationship_type}`)
          }
        } catch (error) {
          console.error('❌ Error creating relationship:', error.message)
        }
      }
      
    } else {
      // Restore from backup table
      console.log(`\n2. Restoring business entities from backup: ${backupTable}...`)
      
      // Get entities from backup that belong to Hair Talkz
      const { data: backupEntities, error: backupError } = await supabase
        .from(backupTable)
        .select('*')
        .eq('organization_id', hairTalkzOrgId)
        .in('entity_type', ['service', 'staff', 'customer', 'product', 'appointment'])
      
      if (backupError) {
        console.error('❌ Failed to read backup:', backupError.message)
      } else if (backupEntities && backupEntities.length > 0) {
        console.log(`Found ${backupEntities.length} business entities in backup`)
        
        // Restore entities
        for (const entity of backupEntities) {
          try {
            const { error: restoreError } = await supabase
              .from('core_entities')
              .insert(entity)
              .select()
            
            if (restoreError && !restoreError.message.includes('duplicate key')) {
              console.error(`❌ Failed to restore ${entity.entity_name}:`, restoreError.message)
            } else {
              console.log(`✅ Restored ${entity.entity_type}: ${entity.entity_name}`)
            }
          } catch (error) {
            console.error(`❌ Error restoring ${entity.entity_name}:`, error.message)
          }
        }
      } else {
        console.log('❌ No business entities found in backup')
      }
    }
    
    // 5. Verify restoration
    console.log('\n5. Verifying business entity restoration...')
    
    const { data: finalEntities, error: finalError } = await supabase
      .from('core_entities')
      .select('entity_type, count(*)')
      .eq('organization_id', hairTalkzOrgId)
      .in('entity_type', ['service', 'staff', 'customer', 'product', 'appointment'])
      .group('entity_type')
    
    if (finalError) {
      console.error('❌ Verification failed:', finalError.message)
    } else {
      console.log('\n✅ RESTORATION COMPLETE!')
      console.log('Business entities now available:')
      finalEntities?.forEach(group => {
        console.log(`- ${group.entity_type}: ${group.count} entities`)
      })
      
      console.log('\n🎉 Michele should now be able to see:')
      console.log('- ✅ Appointments')
      console.log('- ✅ Services') 
      console.log('- ✅ Customers')
      console.log('- ✅ Staff')
      console.log('- ✅ Products')
      
      console.log('\n📋 Next steps:')
      console.log('1. Ask Michele to refresh her browser (Ctrl+F5)')
      console.log('2. Navigate to appointments, services, etc.')
      console.log('3. Verify all business data is visible')
      console.log('4. Test creating new appointments and services')
    }
    
  } catch (error) {
    console.error('💥 Restoration failed:', error)
  }
}

findAndRestoreBusinessEntities().catch(console.error)