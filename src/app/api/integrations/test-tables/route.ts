import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function GET(request: NextRequest) {
  try {
    const results = {
      supabase_configured: true,
      tables: {} as Record<string, any>,
      organization_exists: false,
      can_insert: false
    }
    
    // Test 1: Check if tables exist and count records
    const tables = [
      'core_organizations',
      'core_entities', 
      'core_relationships',
      'core_dynamic_data',
      'universal_transactions',
      'universal_transaction_lines'
    ]
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        results.tables[table] = {
          exists: !error,
          count: count || 0,
          error: error?.message
        }
      } catch (e: any) {
        results.tables[table] = {
          exists: false,
          error: e.message
        }
      }
    }
    
    // Test 2: Check if CivicFlow organization exists
    try {
      const { data, error } = await supabase
        .from('core_organizations')
        .select('id, organization_name')
        .eq('id', CIVICFLOW_ORG_ID)
        .single()
      
      if (data) {
        results.organization_exists = true
        results.tables['civicflow_org'] = {
          id: data.id,
          name: data.organization_name
        }
      }
    } catch (e) {
      // Organization doesn't exist
    }
    
    // Test 3: Try to insert a test record (we'll delete it)
    try {
      const testData = {
        organization_id: CIVICFLOW_ORG_ID,
        entity_type: 'test_entity',
        entity_name: 'Test Entity',
        entity_code: `TEST-${Date.now()}`,
        smart_code: 'HERA.TEST.ENTITY.TYPE.NAME.V1',
        status: 'active'
      }
      
      const { data, error } = await supabase
        .from('core_entities')
        .insert(testData)
        .select()
        .single()
      
      if (data) {
        results.can_insert = true
        
        // Clean up
        await supabase
          .from('core_entities')
          .delete()
          .eq('id', data.id)
      } else if (error) {
        results.tables['insert_test'] = {
          error: error.message,
          code: error.code
        }
      }
    } catch (e: any) {
      results.tables['insert_test'] = {
        error: e.message
      }
    }
    
    return NextResponse.json({
      success: results.can_insert,
      ...results,
      recommendations: generateRecommendations(results)
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Table test failed',
      message: error.message
    }, { status: 500 })
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations = []
  
  // Check if all tables exist
  const missingTables = Object.entries(results.tables)
    .filter(([table, info]: [string, any]) => !info.exists && !table.includes('_'))
    .map(([table]) => table)
  
  if (missingTables.length > 0) {
    recommendations.push(`Create missing tables: ${missingTables.join(', ')}`)
    recommendations.push('Run the HERA schema migration in Supabase SQL editor')
  }
  
  if (!results.organization_exists) {
    recommendations.push('Create the CivicFlow demo organization or update CIVICFLOW_ORG_ID')
  }
  
  if (!results.can_insert) {
    recommendations.push('Check RLS policies allow inserts for your auth method')
    recommendations.push('Consider disabling RLS for initial testing')
  }
  
  if (results.tables.core_entities?.error?.includes('permission')) {
    recommendations.push('Grant INSERT permission on core_entities table')
  }
  
  return recommendations
}