/**
 * LinkedIn Sync API
 *
 * POST /api/integration-hub/vendors/linkedin/sync
 *
 * Triggers manual sync of LinkedIn data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { LinkedInAdapter } from '@/lib/integration/vendors/linkedin'
import { LinkedInMapper } from '@/lib/integration/mappers/linkedin'
import { SyncEngine } from '@/lib/integration-hub/sync-engine'
import { universalApi } from '@/lib/universal-api'
import { logger } from '@/lib/utils/logger'
import { SmartCode } from '@/types/core'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { connectorId, syncOptions } = body

    if (!connectorId) {
      return NextResponse.json({ error: 'Connector ID is required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Connector not found' }, { status: 404 })
    }

    // Verify connector is for LinkedIn
    if (connector.vendor_name !== 'linkedin') {
      return NextResponse.json({ error: 'Invalid connector vendor' }, { status: 400 })
    }

    // Update connector status to syncing
    await supabase
      .from('integration_connectors')
      .update({
        status: 'syncing',
        metadata: {
          ...connector.metadata,
          sync_started_at: new Date().toISOString()
        }
      })
      .eq('id', connectorId)

    // Initialize components
    const adapter = new LinkedInAdapter(connector, supabase)
    const mapper = new LinkedInMapper(connector.organization_id)
    const syncEngine = new SyncEngine(supabase)

    // Set universal API context
    universalApi.setOrganizationId(connector.organization_id)

    // Perform sync
    const syncResult = await adapter.sync()

    if (!syncResult.success) {
      // Update connector with error
      await supabase
        .from('integration_connectors')
        .update({
          status: 'error',
          error_message: syncResult.errors?.[0]?.error || 'Sync failed',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', connectorId)

      return NextResponse.json({
        success: false,
        error: 'Sync failed',
        errors: syncResult.errors,
        stats: syncResult.stats
      })
    }

    // Process entities
    const createdEntities: string[] = []
    const updatedEntities: string[] = []
    const entityIdMap = new Map<string, string>()

    for (const entity of syncResult.entities) {
      try {
        // Check if entity exists
        const existing = await universalApi.getEntityByCode(entity.entity_code)

        let entityId: string
        if (existing) {
          // Update existing entity
          await universalApi.updateEntity(existing.id, entity)
          entityId = existing.id
          updatedEntities.push(entityId)
        } else {
          // Create new entity
          const created = await universalApi.createEntity(entity)
          entityId = created.id
          createdEntities.push(entityId)
        }

        entityIdMap.set(entity.entity_code, entityId)

        // Process dynamic fields
        const dynamicFieldsForEntity = syncResult.dynamicData.filter(
          df => df.entity_id === '' || df.entity_id === entity.entity_code
        )

        for (const field of dynamicFieldsForEntity) {
          field.entity_id = entityId
          await universalApi.setDynamicField(
            entityId,
            field.field_name,
            field.field_value_text || field.field_value_number || field.field_value_json,
            {
              field_type: field.field_type,
              smart_code: field.smart_code
            }
          )
        }
      } catch (error) {
        logger.error('Error processing entity:', error)
      }
    }

    // Process relationships
    for (const rel of syncResult.relationships) {
      try {
        // Resolve entity IDs
        const fromId = entityIdMap.get(rel.from_entity_id) || rel.from_entity_id
        const toId = entityIdMap.get(rel.to_entity_id) || rel.to_entity_id

        await universalApi.createRelationship({
          from_entity_id: fromId,
          to_entity_id: toId,
          relationship_type: rel.relationship_type,
          smart_code: rel.smart_code,
          metadata: rel.metadata
        })
      } catch (error) {
        logger.error('Error creating relationship:', error)
      }
    }

    // Create sync transaction for audit trail
    const stats = {
      events_created: createdEntities.filter(
        id =>
          syncResult.entities.find(e => entityIdMap.get(e.entity_code) === id)?.entity_type ===
          'event'
      ).length,
      events_updated: updatedEntities.filter(
        id =>
          syncResult.entities.find(e => entityIdMap.get(e.entity_code) === id)?.entity_type ===
          'event'
      ).length,
      attendees_created: createdEntities.filter(
        id =>
          syncResult.entities.find(e => entityIdMap.get(e.entity_code) === id)?.entity_type ===
          'event_invite'
      ).length,
      attendees_updated: updatedEntities.filter(
        id =>
          syncResult.entities.find(e => entityIdMap.get(e.entity_code) === id)?.entity_type ===
          'event_invite'
      ).length,
      posts_created: createdEntities.filter(
        id =>
          syncResult.entities.find(e => entityIdMap.get(e.entity_code) === id)?.entity_type ===
          'post'
      ).length,
      posts_updated: updatedEntities.filter(
        id =>
          syncResult.entities.find(e => entityIdMap.get(e.entity_code) === id)?.entity_type ===
          'post'
      ).length,
      errors: syncResult.errors || []
    }

    const { transaction, lines } = mapper.createSyncTransaction(stats)

    try {
      await universalApi.createTransaction({
        ...transaction,
        line_items: lines as any
      })
    } catch (error) {
      logger.error('Error creating sync transaction:', error)
    }

    // Update connector status
    await supabase
      .from('integration_connectors')
      .update({
        status: 'connected',
        last_sync_at: new Date().toISOString(),
        error_message: null,
        metadata: {
          ...connector.metadata,
          last_sync_stats: stats,
          sync_completed_at: new Date().toISOString()
        }
      })
      .eq('id', connectorId)

    return NextResponse.json({
      success: true,
      stats: {
        total_created: createdEntities.length,
        total_updated: updatedEntities.length,
        ...stats
      },
      message: 'LinkedIn sync completed successfully'
    })
  } catch (error) {
    logger.error('LinkedIn sync error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      },
      { status: 500 }
    )
  }
}
