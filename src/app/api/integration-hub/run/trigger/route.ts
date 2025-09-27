import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase/client'
import { createEventbriteAdapter } from '@/lib/integration/vendors/eventbrite'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Get organization ID from header
    const orgId = request.headers.get('X-Organization-Id')
    if (!orgId) {
      return NextResponse.json({ error: 'Missing X-Organization-Id header' }, { status: 400 })
    }

    // Get request body
    const body = await request.json()
    const { vendor, domain, syncJobId } = body

    if (!vendor || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor, domain' },
        { status: 400 }
      )
    }

    // Set organization context
    universalApi.setOrganizationId(orgId)

    // Check if demo organization
    const isDemoOrg = orgId === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

    // Create sync run entity
    const syncRunId = uuidv4()
    const syncRunResult = await universalApi.createEntity({
      entity_type: 'integration_sync_run',
      entity_name: `Sync Run - ${vendor} ${domain} - ${new Date().toISOString()}`,
      entity_code: `SYNC-RUN-${syncRunId}`,
      smart_code: 'HERA.INTEGRATION.SYNC_RUN.v1',
      organization_id: orgId
    })

    if (!syncRunResult.success) {
      throw new Error('Failed to create sync run')
    }

    // Set initial sync run fields
    await Promise.all([
      universalApi.setDynamicField(syncRunResult.data.id, 'sync_job_id', syncJobId || '', 'text'),
      universalApi.setDynamicField(syncRunResult.data.id, 'vendor', vendor, 'text'),
      universalApi.setDynamicField(syncRunResult.data.id, 'domain', domain, 'text'),
      universalApi.setDynamicField(syncRunResult.data.id, 'status', 'running', 'text'),
      universalApi.setDynamicField(
        syncRunResult.data.id,
        'start_time',
        new Date().toISOString(),
        'text'
      ),
      universalApi.setDynamicField(syncRunResult.data.id, 'records_processed', 0, 'number'),
      universalApi.setDynamicField(syncRunResult.data.id, 'records_synced', 0, 'number'),
      universalApi.setDynamicField(syncRunResult.data.id, 'records_failed', 0, 'number')
    ])

    // Emit sync started transaction
    await universalApi.createTransaction({
      transaction_type: 'integration_sync',
      transaction_date: new Date(),
      total_amount: 0,
      organization_id: orgId,
      smart_code: 'HERA.INTEGRATION.SYNC.STARTED.v1',
      metadata: {
        sync_run_id: syncRunResult.data.id,
        vendor,
        domain,
        sync_job_id: syncJobId
      }
    })

    // Execute sync based on vendor/domain
    if (vendor === 'eventbrite' && domain === 'events') {
      await executeEventbritePull(orgId, syncRunResult.data.id, isDemoOrg)
    } else {
      // Other vendor implementations would go here
      throw new Error(`Unsupported vendor/domain combination: ${vendor}/${domain}`)
    }

    return NextResponse.json({
      success: true,
      syncRunId: syncRunResult.data.id,
      message: `Sync triggered for ${vendor} ${domain}`
    })
  } catch (error) {
    console.error('Sync trigger error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Sync trigger failed'
      },
      { status: 500 }
    )
  }
}

async function executeEventbritePull(orgId: string, syncRunId: string, isDemoMode: boolean) {
  const stats = {
    eventsProcessed: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    attendeesProcessed: 0,
    attendeesCreated: 0,
    attendeesUpdated: 0,
    checkins: 0,
    errors: 0
  }

  try {
    // Get connector configuration
    const connectorsResult = await universalApi.read({
      table: 'core_entities',
      filters: {
        entity_type: 'integration_connector',
        organization_id: orgId
      }
    })

    const eventbriteConnector = connectorsResult.data?.find(c => {
      // Check vendor in metadata or dynamic fields
      return c.metadata?.vendor === 'eventbrite'
    })

    if (!eventbriteConnector && !isDemoMode) {
      throw new Error('Eventbrite connector not configured')
    }

    let config = { apiToken: '' }

    if (!isDemoMode && eventbriteConnector) {
      // Get configuration from dynamic fields
      const fieldsResult = await universalApi.read({
        table: 'core_dynamic_data',
        filters: {
          entity_id: eventbriteConnector.id,
          organization_id: orgId
        }
      })

      const configField = fieldsResult.data?.find(f => f.field_name === 'configuration')
      if (configField?.field_value_text) {
        config = JSON.parse(configField.field_value_text)
      }
    }

    // Get last sync cursor if exists
    let sinceCursor: string | undefined
    if (eventbriteConnector) {
      const cursorField = await universalApi.read({
        table: 'core_dynamic_data',
        filters: {
          entity_id: eventbriteConnector.id,
          field_name: 'last_sync_cursor',
          organization_id: orgId
        }
      })

      if (cursorField.data?.[0]?.field_value_text) {
        sinceCursor = cursorField.data[0].field_value_text
      }
    }

    // Create adapter and pull data
    const adapter = createEventbriteAdapter(config)
    const { events, invites } = await adapter.getNormalizedData({
      orgId,
      config,
      sinceCursor,
      demoMode: isDemoMode
    })

    // Process events
    for (const event of events) {
      stats.eventsProcessed++

      try {
        // Make idempotency key
        const idempotencyKey = `${orgId}-eventbrite-event-${event.dynamic_data['EVENT.SOURCE.V1'].provider_id}-upsert`

        // Check if event exists
        const existingEvent = await universalApi.read({
          table: 'core_entities',
          filters: {
            entity_type: 'event',
            entity_code: event.entity_code,
            organization_id: orgId
          }
        })

        const isNew = !existingEvent.data || existingEvent.data.length === 0

        // Upsert event
        const eventResult = await universalApi.createEntity({
          ...event,
          organization_id: orgId,
          metadata: {
            idempotency_key: idempotencyKey
          }
        })

        if (eventResult.success) {
          if (isNew) {
            stats.eventsCreated++

            // Emit event created transaction
            await universalApi.createTransaction({
              transaction_type: 'event_lifecycle',
              transaction_date: new Date(),
              total_amount: 0,
              organization_id: orgId,
              smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.CREATED.v1',
              metadata: {
                event_id: eventResult.data.id,
                provider_id: event.dynamic_data['EVENT.SOURCE.V1'].provider_id,
                sync_run_id: syncRunId
              }
            })
          } else {
            stats.eventsUpdated++

            // Emit event updated transaction
            await universalApi.createTransaction({
              transaction_type: 'event_lifecycle',
              transaction_date: new Date(),
              total_amount: 0,
              organization_id: orgId,
              smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.UPDATED.v1',
              metadata: {
                event_id: eventResult.data.id,
                provider_id: event.dynamic_data['EVENT.SOURCE.V1'].provider_id,
                sync_run_id: syncRunId
              }
            })
          }

          // Store event mapping for relationship creation
          const eventProviderId = event.dynamic_data['EVENT.SOURCE.V1'].provider_id

          // Process invites for this event
          const eventInvites = invites.filter(
            invite =>
              // Match by event provider ID (would be set during normalization)
              true // For now process all invites
          )

          for (const invite of eventInvites) {
            stats.attendeesProcessed++

            try {
              // Make idempotency key
              const inviteIdempotencyKey = `${orgId}-eventbrite-invite-${invite.dynamic_data['INVITE.SOURCE.V1'].provider_id}-upsert`

              // Check if invite exists
              const existingInvite = await universalApi.read({
                table: 'core_entities',
                filters: {
                  entity_type: 'event_invite',
                  entity_code: invite.entity_code,
                  organization_id: orgId
                }
              })

              const isNewInvite = !existingInvite.data || existingInvite.data.length === 0

              // Upsert invite
              const inviteResult = await universalApi.createEntity({
                ...invite,
                organization_id: orgId,
                metadata: {
                  idempotency_key: inviteIdempotencyKey
                }
              })

              if (inviteResult.success) {
                if (isNewInvite) {
                  stats.attendeesCreated++
                } else {
                  stats.attendeesUpdated++
                }

                // Create relationship between invite and event
                await universalApi.createRelationship({
                  from_entity_id: inviteResult.data.id,
                  to_entity_id: eventResult.data.id,
                  relationship_type: 'belongs_to',
                  smart_code: 'INVITE.REL.EVENT.V1',
                  organization_id: orgId
                })

                // Emit registration ingested transaction
                await universalApi.createTransaction({
                  transaction_type: 'event_registration',
                  transaction_date: new Date(),
                  total_amount: 0,
                  organization_id: orgId,
                  smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.REGISTRATION.INGESTED.v1',
                  metadata: {
                    invite_id: inviteResult.data.id,
                    event_id: eventResult.data.id,
                    email: invite.dynamic_data['INVITE.META.V1'].email,
                    sync_run_id: syncRunId
                  }
                })

                // If checked in, emit checkin transaction
                if (invite.dynamic_data['INVITE.META.V1'].checked_in) {
                  stats.checkins++

                  await universalApi.createTransaction({
                    transaction_type: 'event_checkin',
                    transaction_date: new Date(),
                    total_amount: 0,
                    organization_id: orgId,
                    smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.CHECKIN.RECORDED.v1',
                    metadata: {
                      invite_id: inviteResult.data.id,
                      event_id: eventResult.data.id,
                      checkin_time: invite.dynamic_data['INVITE.META.V1'].checkin_time,
                      sync_run_id: syncRunId
                    }
                  })
                }

                // Try to link to existing constituent by email
                const email = invite.dynamic_data['INVITE.META.V1'].email
                if (email) {
                  const constituentSearch = await universalApi.read({
                    table: 'core_dynamic_data',
                    filters: {
                      field_name: 'email',
                      field_value_text: email,
                      organization_id: orgId
                    }
                  })

                  if (constituentSearch.data && constituentSearch.data.length > 0) {
                    const constituentEntityId = constituentSearch.data[0].entity_id

                    // Create relationship between invite and constituent
                    await universalApi.createRelationship({
                      from_entity_id: inviteResult.data.id,
                      to_entity_id: constituentEntityId,
                      relationship_type: 'for_constituent',
                      smart_code: 'INVITE.REL.SUBJECT.V1',
                      organization_id: orgId
                    })
                  }
                }
              }
            } catch (inviteError) {
              stats.errors++
              console.error('Error processing invite:', inviteError)
            }
          }
        }
      } catch (eventError) {
        stats.errors++
        console.error('Error processing event:', eventError)
      }
    }

    // Update sync run with completion
    await Promise.all([
      universalApi.setDynamicField(
        syncRunId,
        'status',
        stats.errors === 0 ? 'success' : 'partial_success',
        'text'
      ),
      universalApi.setDynamicField(syncRunId, 'end_time', new Date().toISOString(), 'text'),
      universalApi.setDynamicField(
        syncRunId,
        'records_processed',
        stats.eventsProcessed + stats.attendeesProcessed,
        'number'
      ),
      universalApi.setDynamicField(
        syncRunId,
        'records_synced',
        stats.eventsCreated + stats.eventsUpdated + stats.attendeesCreated + stats.attendeesUpdated,
        'number'
      ),
      universalApi.setDynamicField(syncRunId, 'records_failed', stats.errors, 'number'),
      universalApi.setDynamicField(syncRunId, 'stats', JSON.stringify(stats), 'text')
    ])

    // Emit sync completed transaction
    await universalApi.createTransaction({
      transaction_type: 'integration_sync',
      transaction_date: new Date(),
      total_amount: 0,
      organization_id: orgId,
      smart_code:
        stats.errors === 0
          ? 'HERA.INTEGRATION.SYNC.COMPLETED.v1'
          : 'HERA.INTEGRATION.SYNC.FAILED.v1',
      metadata: {
        sync_run_id: syncRunId,
        vendor: 'eventbrite',
        domain: 'events',
        stats
      }
    })

    // Update connector's last sync cursor if available
    if (eventbriteConnector) {
      const newCursor = new Date().toISOString()
      await universalApi.setDynamicField(
        eventbriteConnector.id,
        'last_sync_cursor',
        newCursor,
        'text'
      )
      await universalApi.setDynamicField(eventbriteConnector.id, 'last_sync_at', newCursor, 'text')
    }
  } catch (error) {
    stats.errors++

    // Update sync run as failed
    await Promise.all([
      universalApi.setDynamicField(syncRunId, 'status', 'failed', 'text'),
      universalApi.setDynamicField(syncRunId, 'end_time', new Date().toISOString(), 'text'),
      universalApi.setDynamicField(
        syncRunId,
        'error',
        error instanceof Error ? error.message : 'Unknown error',
        'text'
      ),
      universalApi.setDynamicField(syncRunId, 'stats', JSON.stringify(stats), 'text')
    ])

    // Emit sync failed transaction
    await universalApi.createTransaction({
      transaction_type: 'integration_sync',
      transaction_date: new Date(),
      total_amount: 0,
      organization_id: orgId,
      smart_code: 'HERA.INTEGRATION.SYNC.FAILED.v1',
      metadata: {
        sync_run_id: syncRunId,
        vendor: 'eventbrite',
        domain: 'events',
        error: error instanceof Error ? error.message : 'Unknown error',
        stats
      }
    })

    throw error
  }
}
