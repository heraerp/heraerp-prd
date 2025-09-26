import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { runId: string } }
) {
  try {
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id')
    if (!orgId) {
      return NextResponse.json(
        { error: 'Missing X-Organization-Id header' },
        { status: 400 }
      )
    }

    const { runId } = params
    if (!runId) {
      return NextResponse.json(
        { error: 'Missing runId parameter' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(orgId)

    // Fetch sync run entity
    const runResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        id: runId,
        entity_type: 'integration_sync_run',
        organization_id: orgId
      }
    })

    if (!runResult.success || !runResult.data || runResult.data.length === 0) {
      return NextResponse.json(
        { error: 'Sync run not found' },
        { status: 404 }
      )
    }

    const syncRun = runResult.data[0]

    // Get dynamic fields
    const fieldsResult = await universalApi.read({
      table: 'core_dynamic_data',
      filters: {
        entity_id: runId,
        organization_id: orgId
      }
    })

    const fields = fieldsResult.data || []
    
    // Extract field values
    const getFieldValue = (name: string) => 
      fields.find(f => f.field_name === name)?.field_value_text || ''
    const getFieldNumber = (name: string) => 
      fields.find(f => f.field_name === name)?.field_value_number || 0

    const status = getFieldValue('status')
    const startTime = getFieldValue('start_time')
    const endTime = getFieldValue('end_time')
    const recordsProcessed = getFieldNumber('records_processed')
    const recordsSynced = getFieldNumber('records_synced')
    const recordsFailed = getFieldNumber('records_failed')
    const error = getFieldValue('error')
    const statsJson = getFieldValue('stats')
    const vendor = getFieldValue('vendor')
    const domain = getFieldValue('domain')
    const syncJobId = getFieldValue('sync_job_id')

    let stats = null
    try {
      if (statsJson) {
        stats = JSON.parse(statsJson)
      }
    } catch (e) {
      // Invalid JSON, ignore
    }

    return NextResponse.json({
      id: syncRun.id,
      name: syncRun.entity_name,
      status,
      vendor,
      domain,
      syncJobId,
      startTime,
      endTime,
      duration: startTime && endTime ? 
        new Date(endTime).getTime() - new Date(startTime).getTime() : 
        null,
      records_processed: recordsProcessed,
      records_synced: recordsSynced,
      records_failed: recordsFailed,
      error,
      stats,
      createdAt: syncRun.created_at,
      updatedAt: syncRun.updated_at
    })

  } catch (error) {
    console.error('Get sync run error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get sync run' 
      },
      { status: 500 }
    )
  }
}