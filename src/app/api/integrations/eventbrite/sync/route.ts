import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '@/lib/demo-guard';
import type { SyncRequest } from '@/types/integrations';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const isDemo = isDemoMode(orgId);
    const body: SyncRequest = await request.json();
    
    // Create sync job
    const jobData = {
      entity_type: 'sync_job',
      entity_name: `Eventbrite Sync - ${new Date().toISOString()}`,
      entity_code: `SYNC-EVENTBRITE-${Date.now()}`,
      smart_code: 'HERA.INTEGRATION.SYNC.JOB.v1',
      organization_id: orgId,
      metadata: {
        connector_id: body.connector_id,
        sync_type: body.sync_type,
        status: 'running',
        started_at: new Date().toISOString(),
      },
    };
    
    const jobResponse = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify(jobData),
    });
    
    if (!jobResponse.ok) {
      throw new Error('Failed to create sync job');
    }
    
    const jobResult = await jobResponse.json();
    const jobId = jobResult.data.id;
    
    // Emit SYNC_STARTED transaction
    await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId,
      },
      body: JSON.stringify({
        smart_code: 'HERA.INTEGRATION.SYNC.STARTED.v1',
        metadata: {
          job_id: jobId,
          connector_id: body.connector_id,
          vendor: 'eventbrite',
        },
      }),
    });
    
    // In demo mode, generate sample events and attendees
    if (isDemo) {
      const demoEvents = [
        {
          id: 'eb-12345',
          name: 'Annual Community Health Fair',
          description: 'Free health screenings, wellness resources, and educational workshops for the community.',
          start: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
          venue: {
            name: 'Community Recreation Center',
            address: '500 Park Avenue, Cityville',
          },
          capacity: 200,
          status: 'live',
          url: 'https://www.eventbrite.com/e/annual-community-health-fair-tickets-12345',
        },
        {
          id: 'eb-67890',
          name: 'Town Hall: Budget Planning Session',
          description: 'Join us for an interactive session on the upcoming fiscal year budget priorities.',
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          is_online: true,
          capacity: 500,
          status: 'live',
          url: 'https://www.eventbrite.com/e/town-hall-budget-planning-tickets-67890',
        },
        {
          id: 'eb-11111',
          name: 'Senior Citizens Technology Workshop',
          description: 'Learn basic computer skills and how to use smartphones and tablets.',
          start: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          venue: {
            name: 'Public Library',
            address: '100 Main Street, Cityville',
          },
          capacity: 30,
          status: 'live',
          url: 'https://www.eventbrite.com/e/senior-tech-workshop-tickets-11111',
        },
      ];
      
      let eventsCreated = 0;
      let attendeesCreated = 0;
      
      for (const ebEvent of demoEvents) {
        // Create or update event entity
        const eventData = {
          entity_type: 'event',
          entity_name: ebEvent.name,
          entity_code: `EVENT-EB-${ebEvent.id}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.v1',
          organization_id: orgId,
        };
        
        const eventResponse = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Organization-Id': orgId,
          },
          body: JSON.stringify(eventData),
        });
        
        if (eventResponse.ok) {
          const eventResult = await eventResponse.json();
          const eventId = eventResult.data.id;
          eventsCreated++;
          
          // Add dynamic data
          const fields = [
            { field_name: 'event_type', field_value_text: ebEvent.is_online ? 'webinar' : 'conference' },
            { field_name: 'description', field_value_text: ebEvent.description },
            { field_name: 'start_datetime', field_value_text: ebEvent.start.toISOString() },
            { field_name: 'end_datetime', field_value_text: ebEvent.end.toISOString() },
            { field_name: 'venue_name', field_value_text: ebEvent.venue?.name },
            { field_name: 'venue_address', field_value_text: ebEvent.venue?.address },
            { field_name: 'is_online', field_value_text: ebEvent.is_online ? 'true' : 'false' },
            { field_name: 'capacity', field_value_number: ebEvent.capacity },
            { field_name: 'external_id', field_value_text: ebEvent.id },
            { field_name: 'external_source', field_value_text: 'eventbrite' },
            { field_name: 'external_url', field_value_text: ebEvent.url },
          ];
          
          for (const field of fields) {
            if (field.field_value_text || field.field_value_number !== undefined) {
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  entity_id: eventId,
                  ...field,
                  organization_id: orgId,
                }),
              });
            }
          }
          
          // Generate demo attendees
          const attendeeCount = Math.floor(Math.random() * 20) + 5;
          const statuses = ['invited', 'registered', 'attended'];
          
          for (let i = 0; i < attendeeCount; i++) {
            const attendeeData = {
              entity_type: 'event_invite',
              entity_name: `Attendee ${i + 1} - ${ebEvent.name}`,
              entity_code: `INVITE-EB-${ebEvent.id}-${i}`,
              smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.v1',
              organization_id: orgId,
            };
            
            const inviteResponse = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Organization-Id': orgId,
              },
              body: JSON.stringify(attendeeData),
            });
            
            if (inviteResponse.ok) {
              const inviteResult = await inviteResponse.json();
              const inviteId = inviteResult.data.id;
              attendeesCreated++;
              
              // Add invite fields
              const status = statuses[Math.floor(Math.random() * statuses.length)];
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  entity_id: inviteId,
                  field_name: 'status',
                  field_value_text: status,
                  organization_id: orgId,
                }),
              });
              
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({
                  entity_id: inviteId,
                  field_name: 'ticket_number',
                  field_value_text: `TKT-EB-${ebEvent.id}-${i + 1000}`,
                  organization_id: orgId,
                }),
              });
              
              // Create relationships
              await fetch(`${request.nextUrl.origin}/api/v2/universal/relationship-upsert`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Organization-Id': orgId,
                },
                body: JSON.stringify({
                  from_entity_id: inviteId,
                  to_entity_id: eventId,
                  relationship_type: 'invite_to_event',
                  smart_code: 'HERA.PUBLICSECTOR.CRM.REL.INVITE_EVENT.v1',
                }),
              });
            }
          }
          
          // Emit EVENT.INGESTED
          await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId,
            },
            body: JSON.stringify({
              smart_code: 'HERA.PUBLICSECTOR.CRM.EVENT.REGISTRATION.INGESTED.v1',
              metadata: {
                source: 'eventbrite',
                event_id: eventId,
                external_id: ebEvent.id,
                attendee_count: attendeeCount,
              },
            }),
          });
        }
      }
      
      // Update job as completed
      await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
        },
        body: JSON.stringify({
          id: jobId,
          entity_type: 'sync_job',
          metadata: {
            status: 'completed',
            completed_at: new Date().toISOString(),
            items_processed: demoEvents.length + attendeesCreated,
            items_created: eventsCreated + attendeesCreated,
            items_updated: 0,
            items_failed: 0,
            summary: {
              events_synced: eventsCreated,
              attendees_synced: attendeesCreated,
            },
          },
        }),
      });
      
      // Emit SYNC_COMPLETED
      await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId,
        },
        body: JSON.stringify({
          smart_code: 'HERA.INTEGRATION.SYNC.COMPLETED.v1',
          metadata: {
            job_id: jobId,
            connector_id: body.connector_id,
            vendor: 'eventbrite',
            summary: {
              totalProcessed: demoEvents.length + attendeesCreated,
              created: eventsCreated + attendeesCreated,
              updated: 0,
              errors: 0,
              events_synced: eventsCreated,
              attendees_synced: attendeesCreated,
            },
          },
        }),
      });
      
      return NextResponse.json({
        job_id: jobId,
        status: 'completed',
        summary: {
          events_synced: eventsCreated,
          attendees_synced: attendeesCreated,
          errors: 0,
        },
      });
    }
    
    // Production sync would happen here
    return NextResponse.json({
      job_id: jobId,
      status: 'running',
      summary: {
        events_synced: 0,
        attendees_synced: 0,
        errors: 0,
      },
    });
  } catch (error) {
    console.error('Eventbrite sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Eventbrite data' },
      { status: 500 }
    );
  }
}