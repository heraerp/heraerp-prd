import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

// Use service role key to bypass RLS
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

async function investigateMicheleBusinessAccess() {
  console.log('=== INVESTIGATING MICHELE BUSINESS ACCESS ===')
  
  const micheleUserId = '09b0b92a-d797-489e-bc03-5ca0a6272674'
  const hairTalkzOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  
  try {
    // 1. Check Michele's current authentication status
    console.log('1. Checking Michele\'s authentication relationships...')
    const { data: authRelationships, error: authError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', micheleUserId)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    console.log('Auth relationships:', { 
      count: authRelationships?.length || 0,
      data: authRelationships,
      error: authError 
    })
    
    // 2. Check business entities in Hair Talkz organization
    console.log('\n2. Checking business entities in Hair Talkz...')
    const { data: businessEntities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, entity_code, status, created_at')
      .eq('organization_id', hairTalkzOrgId)
      .in('entity_type', ['appointment', 'service', 'customer', 'staff', 'product'])
      .order('entity_type', { ascending: true })
    
    console.log('Business entities in Hair Talkz:', { 
      count: businessEntities?.length || 0,
      error: entitiesError 
    })
    
    if (businessEntities && businessEntities.length > 0) {
      console.log('\nEntities by type:')
      const entityGroups = businessEntities.reduce((groups, entity) => {
        const type = entity.entity_type
        if (!groups[type]) groups[type] = []
        groups[type].push(entity)
        return groups
      }, {})
      
      Object.entries(entityGroups).forEach(([type, entities]) => {
        console.log(`- ${type}: ${entities.length} entities`)
        entities.slice(0, 3).forEach(entity => {
          console.log(`  • ${entity.entity_name} (${entity.entity_code}) - ${entity.status}`)
        })
        if (entities.length > 3) {
          console.log(`  • ... and ${entities.length - 3} more`)
        }
      })
    } else {
      console.log('❌ NO BUSINESS ENTITIES FOUND! This explains why Michele can\'t see anything.')
    }
    
    // 3. Check relationships for business entities
    console.log('\n3. Checking business entity relationships...')
    const { data: businessRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('id, from_entity_id, to_entity_id, relationship_type, organization_id')
      .eq('organization_id', hairTalkzOrgId)
      .neq('relationship_type', 'USER_MEMBER_OF_ORG')
      .limit(10)
    
    console.log('Business relationships:', { 
      count: businessRelationships?.length || 0,
      error: relError 
    })
    
    if (businessRelationships && businessRelationships.length > 0) {
      businessRelationships.forEach(rel => {
        console.log(`- ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`)
      })
    }
    
    // 4. Check dynamic data for business entities
    console.log('\n4. Checking dynamic data for business operations...')
    const { data: businessDynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('entity_id, field_name, field_value_text, field_type')
      .eq('organization_id', hairTalkzOrgId)
      .neq('entity_id', micheleUserId) // Exclude Michele's user data
      .limit(10)
    
    console.log('Business dynamic data:', { 
      count: businessDynamicData?.length || 0,
      error: dynamicError 
    })
    
    // 5. Check transactions (appointments, sales, etc.)
    console.log('\n5. Checking business transactions...')
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, transaction_code, total_amount, created_at')
      .eq('organization_id', hairTalkzOrgId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    console.log('Business transactions:', { 
      count: transactions?.length || 0,
      error: txnError 
    })
    
    if (transactions && transactions.length > 0) {
      console.log('\nRecent transactions:')
      transactions.forEach(txn => {
        console.log(`- ${txn.transaction_type}: ${txn.transaction_code} ($${txn.total_amount || 0}) - ${txn.created_at}`)
      })
    }
    
    // 6. Check for backup tables with business data
    console.log('\n6. Checking for backup tables with business data...')
    const { data: backupTables, error: backupError } = await supabase
      .rpc('exec_sql_query', {
        query: `
          SELECT table_name, 
                 to_regclass(table_name)::text as exists_check
          FROM information_schema.tables 
          WHERE table_name LIKE '%backup%' 
          AND table_schema = 'public'
          ORDER BY table_name DESC
          LIMIT 10
        `
      })
    
    if (backupError) {
      console.log('Backup table check failed:', backupError.message)
    } else if (backupTables && backupTables.length > 0) {
      console.log('Found backup tables:')
      backupTables.forEach(table => {
        console.log(`- ${table.table_name}`)
      })
    } else {
      console.log('No backup tables found')
    }
    
    // 7. Comprehensive diagnosis
    console.log('\n=== DIAGNOSIS ===')
    
    const hasAuth = authRelationships && authRelationships.length > 0
    const hasBusinessData = businessEntities && businessEntities.length > 0
    const hasTransactions = transactions && transactions.length > 0
    
    console.log('Authentication:', hasAuth ? '✅ Working' : '❌ Broken')
    console.log('Business Entities:', hasBusinessData ? '✅ Present' : '❌ Missing')
    console.log('Business Transactions:', hasTransactions ? '✅ Present' : '❌ Missing')
    
    if (hasAuth && !hasBusinessData) {
      console.log('\n🔍 ROOT CAUSE: Authentication works but business data was deleted!')
      console.log('SOLUTION: Restore business entities and relationships from backup')
    } else if (!hasAuth) {
      console.log('\n🔍 ROOT CAUSE: Authentication still broken')
      console.log('SOLUTION: Fix authentication first')
    } else if (hasAuth && hasBusinessData) {
      console.log('\n🔍 POTENTIAL CAUSE: RLS policies blocking business data access')
      console.log('SOLUTION: Check RLS policies for business entity tables')
    }
    
  } catch (error) {
    console.error('💥 Investigation failed:', error)
  }
}

investigateMicheleBusinessAccess().catch(console.error)