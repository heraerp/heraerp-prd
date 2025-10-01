import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const checks = {
      environment: {
        SUPABASE_URL: !!supabaseUrl,
        SUPABASE_ANON_KEY: !!supabaseAnonKey,
        SUPABASE_SERVICE_KEY: !!supabaseServiceKey,
        URL_VALUE: supabaseUrl ? 'Set' : 'Not set'
      },
      tests: {
        anon_client: false,
        service_client: false,
        table_access: false,
        insert_test: false
      },
      errors: [] as string[]
    }

    // Test 1: Anon client
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const anonClient = createClient(supabaseUrl, supabaseAnonKey)
        const { data, error } = await anonClient.from('core_organizations').select('id').limit(1)

        if (error) {
          checks.errors.push(`Anon client error: ${error.message}`)
        } else {
          checks.tests.anon_client = true
        }
      } catch (e: any) {
        checks.errors.push(`Anon client exception: ${e.message}`)
      }
    }

    // Test 2: Service client
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        const { data, error } = await serviceClient
          .from('core_organizations')
          .select('id')
          .eq('id', CIVICFLOW_ORG_ID)
          .single()

        if (error) {
          checks.errors.push(`Service client error: ${error.message}`)
        } else {
          checks.tests.service_client = true
        }
      } catch (e: any) {
        checks.errors.push(`Service client exception: ${e.message}`)
      }
    }

    // Test 3: Table access
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Check if tables exist
        const tables = ['core_entities', 'core_dynamic_data', 'universal_transactions']
        for (const table of tables) {
          const { count, error } = await serviceClient
            .from(table)
            .select('*', { count: 'exact', head: true })

          if (error) {
            checks.errors.push(`Table ${table} error: ${error.message}`)
          } else {
            checks.tests.table_access = true
          }
        }
      } catch (e: any) {
        checks.errors.push(`Table access exception: ${e.message}`)
      }
    }

    // Test 4: Simple insert test (in a transaction that we'll rollback)
    if (supabaseUrl && supabaseServiceKey && checks.tests.service_client) {
      try {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        // Try to insert and then delete a test entity
        const testEntity = {
          organization_id: CIVICFLOW_ORG_ID,
          entity_type: 'test_connector',
          entity_name: 'Test Connector',
          entity_code: `TEST-${Date.now()}`,
          smart_code: 'HERA.TEST.CONNECTOR.TYPE.NAME.V1',
          status: 'active'
        }

        const { data: inserted, error: insertError } = await serviceClient
          .from('core_entities')
          .insert(testEntity)
          .select()
          .single()

        if (insertError) {
          checks.errors.push(`Insert test error: ${insertError.message}`)
        } else {
          checks.tests.insert_test = true

          // Clean up - delete the test entity
          if (inserted?.id) {
            await serviceClient.from('core_entities').delete().eq('id', inserted.id)
          }
        }
      } catch (e: any) {
        checks.errors.push(`Insert test exception: ${e.message}`)
      }
    }

    return NextResponse.json({
      success: Object.values(checks.tests).every(v => v),
      ...checks,
      recommendations: generateRecommendations(checks)
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Supabase test failed',
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

function generateRecommendations(checks: any): string[] {
  const recommendations = []

  if (!checks.environment.SUPABASE_URL) {
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_URL in .env.local')
  }
  if (!checks.environment.SUPABASE_ANON_KEY) {
    recommendations.push('Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  }
  if (!checks.environment.SUPABASE_SERVICE_KEY) {
    recommendations.push('Set SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  if (!checks.tests.anon_client) {
    recommendations.push('Check Supabase project URL and anon key are correct')
  }
  if (!checks.tests.service_client) {
    recommendations.push('Check service role key has proper permissions')
  }
  if (!checks.tests.table_access) {
    recommendations.push('Ensure HERA tables are created in your Supabase project')
  }
  if (!checks.tests.insert_test) {
    recommendations.push('Check RLS policies allow inserts with service role')
  }

  return recommendations
}
