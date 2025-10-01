/**
 * LinkedIn Test Connection API
 * 
 * POST /api/integration-hub/vendors/linkedin/test
 * 
 * Tests LinkedIn API connectivity and authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { LinkedInAdapter } from '@/lib/integration/vendors/linkedin'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectorId } = body

    if (!connectorId) {
      return NextResponse.json(
        { error: 'Connector ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch connector configuration
    const { data: connector, error: connectorError } = await supabase
      .from('integration_connectors')
      .select('*')
      .eq('id', connectorId)
      .single()

    if (connectorError || !connector) {
      logger.error('Failed to fetch connector:', connectorError)
      return NextResponse.json(
        { error: 'Connector not found' },
        { status: 404 }
      )
    }

    // Verify connector is for LinkedIn
    if (connector.vendor_name !== 'linkedin') {
      return NextResponse.json(
        { error: 'Invalid connector vendor' },
        { status: 400 }
      )
    }

    // Create LinkedIn adapter instance
    const adapter = new LinkedInAdapter(connector, supabase)

    // Test connection
    const testResult = await adapter.testConnection()

    // Update connector status
    await supabase
      .from('integration_connectors')
      .update({
        status: testResult.success ? 'connected' : 'error',
        last_sync_at: new Date().toISOString(),
        error_message: testResult.error || null,
        metadata: {
          ...connector.metadata,
          last_test_at: new Date().toISOString(),
          test_result: testResult
        }
      })
      .eq('id', connectorId)

    return NextResponse.json({
      success: testResult.success,
      message: testResult.success 
        ? 'LinkedIn connection successful' 
        : `LinkedIn connection failed: ${testResult.error}`,
      error: testResult.error
    })

  } catch (error) {
    logger.error('LinkedIn test connection error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Test connection failed' 
      },
      { status: 500 }
    )
  }
}