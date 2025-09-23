import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/service-client'

// Quick test endpoint to verify schema
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient()

    // Test query to check basic schema
    const { data: tables, error } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to query',
          details: error.message,
          hint: 'Check if the table exists and has proper permissions'
        },
        { status: 500 }
      )
    }

    // Get column names from the result
    const columns = tables && tables.length > 0 ? Object.keys(tables[0]) : []

    return NextResponse.json({
      success: true,
      table: 'universal_transaction_lines',
      columns,
      sample: tables?.[0] || null
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
