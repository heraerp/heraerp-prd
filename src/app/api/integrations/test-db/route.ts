import { NextRequest, NextResponse } from 'next/server'
import { selectValue } from '@/lib/db'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check if we can connect to the database
    const testQuery = await selectValue<string>('SELECT current_database() as db')
    
    // Test 2: Check if the organization exists
    const orgCheck = await selectValue<boolean>(
      'SELECT EXISTS(SELECT 1 FROM core_organizations WHERE id = $1) as exists',
      [CIVICFLOW_ORG_ID]
    )
    
    // Test 3: Check if the function exists
    const functionCheck = await selectValue<boolean>(`
      SELECT EXISTS(
        SELECT 1 FROM pg_proc 
        WHERE proname = 'hera_entity_upsert_v1'
      ) as exists
    `)
    
    // Test 4: Try to create a test entity
    let testEntity = null
    let testError = null
    
    try {
      testEntity = await selectValue<string>(`
        SELECT hera_entity_upsert_v1(
          $1::uuid, $2::text, $3::text, $4::text,
          null::uuid, null::text, null::text, null::uuid, 
          'active'::text, null::text[], 'DRAFT'::text, 
          '{}'::jsonb, '{}'::jsonb, 0::numeric, 
          null::text, '{}'::jsonb, '{}'::jsonb, null::uuid
        ) as entity_id
      `, [
        CIVICFLOW_ORG_ID,
        'test_entity',
        'Test Entity',
        'HERA.TEST.ENTITY.TYPE.NAME.V1'
      ])
    } catch (e: any) {
      testError = e.message
    }
    
    return NextResponse.json({
      database: {
        connected: !!testQuery,
        name: testQuery
      },
      organization: {
        id: CIVICFLOW_ORG_ID,
        exists: orgCheck
      },
      function: {
        name: 'hera_entity_upsert_v1',
        exists: functionCheck
      },
      testEntity: {
        success: !!testEntity,
        entityId: testEntity,
        error: testError
      },
      environment: {
        SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        NODE_ENV: process.env.NODE_ENV
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Database test failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}