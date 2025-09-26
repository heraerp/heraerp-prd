import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from '@/lib/demo-guard'
import type { SyncRequest, MailchimpCampaign, MailchimpList } from '@/types/integrations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const isDemo = isDemoMode(orgId)
    const body: SyncRequest = await request.json()

    // Create sync job
    const jobData = {
      entity_type: 'sync_job',
      entity_name: `Mailchimp Sync - ${new Date().toISOString()}`,
      entity_code: `SYNC-MAILCHIMP-${Date.now()}`,
      smart_code: 'HERA.INTEGRATION.SYNC.JOB.v1',
      organization_id: orgId,
      metadata: {
        connector_id: body.connector_id,
        sync_type: body.sync_type,
        status: 'running',
        started_at: new Date().toISOString()
      }
    }

    const jobResponse = await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
      },
      body: JSON.stringify(jobData)
    })

    if (!jobResponse.ok) {
      throw new Error('Failed to create sync job')
    }

    const jobResult = await jobResponse.json()
    const jobId = jobResult.data.id

    // Emit SYNC_STARTED transaction
    await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-Id': orgId
      },
      body: JSON.stringify({
        smart_code: 'HERA.INTEGRATION.SYNC.STARTED.v1',
        metadata: {
          job_id: jobId,
          connector_id: body.connector_id,
          vendor: 'mailchimp'
        }
      })
    })

    // In demo mode, generate sample data
    if (isDemo) {
      const demoResults = await generateDemoMailchimpData(orgId, body.connector_id)

      // Update job with results
      await updateSyncJob(request.nextUrl.origin, orgId, jobId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        items_processed: demoResults.totalProcessed,
        items_created: demoResults.created,
        items_updated: demoResults.updated
      })

      // Emit SYNC_COMPLETED
      await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.INTEGRATION.SYNC.COMPLETED.v1',
          metadata: {
            job_id: jobId,
            connector_id: body.connector_id,
            vendor: 'mailchimp',
            summary: demoResults
          }
        })
      })

      return NextResponse.json({
        job_id: jobId,
        status: 'completed',
        summary: demoResults
      })
    }

    // Production sync would happen here
    // For now, return in-progress status
    return NextResponse.json({
      job_id: jobId,
      status: 'running',
      summary: {
        messages_ingested: 0,
        events_ingested: 0,
        errors: 0
      }
    })
  } catch (error) {
    console.error('Mailchimp sync error:', error)
    return NextResponse.json({ error: 'Failed to sync Mailchimp data' }, { status: 500 })
  }
}

async function generateDemoMailchimpData(orgId: string, connectorId: string) {
  const created = 0
  const updated = 0
  let totalProcessed = 0

  // Generate demo campaigns
  const demoCampaigns = [
    {
      id: 'demo_campaign_1',
      type: 'regular',
      status: 'sent',
      settings: {
        subject_line: 'Spring Newsletter - Community Updates',
        from_name: 'CivicFlow Team',
        reply_to: 'hello@civicflow.demo'
      },
      recipients: {
        list_id: 'demo_list_1',
        segment_text: 'All subscribers'
      },
      send_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'demo_campaign_2',
      type: 'regular',
      status: 'sent',
      settings: {
        subject_line: 'Town Hall Meeting Reminder',
        from_name: "Mayor's Office",
        reply_to: 'mayor@civicflow.demo'
      },
      recipients: {
        list_id: 'demo_list_1',
        segment_text: 'District residents'
      },
      send_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]

  // Create demo messages from campaigns
  for (const campaign of demoCampaigns) {
    const messageData = {
      entity_type: 'comm_message',
      entity_name: campaign.settings.subject_line,
      entity_code: `MSG-MC-${campaign.id}`,
      smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.EMAIL.v1',
      organization_id: orgId
    }

    const messageResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_entities`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(messageData)
      }
    )

    if (messageResponse.ok) {
      const messageResult = await messageResponse.json()

      // Add dynamic data
      await supabase.from('core_dynamic_data').insert({
        entity_id: messageResult[0].id,
        field_name: 'channel',
        field_value_text: 'email',
        organization_id: orgId
      })

      await supabase.from('core_dynamic_data').insert({
        entity_id: messageResult[0].id,
        field_name: 'provider_id',
        field_value_text: campaign.id,
        organization_id: orgId
      })

      await supabase.from('core_dynamic_data').insert({
        entity_id: messageResult[0].id,
        field_name: 'metrics',
        field_value_json: {
          sent: Math.floor(Math.random() * 1000) + 500,
          opened: Math.floor(Math.random() * 400) + 200,
          clicked: Math.floor(Math.random() * 100) + 50
        },
        organization_id: orgId
      })

      // Create relationship to connector
      await supabase.from('core_relationships').insert({
        from_entity_id: messageResult[0].id,
        to_entity_id: connectorId,
        relationship_type: 'imported_from',
        organization_id: orgId
      })

      // Emit MESSAGE.INGESTED transaction
      await supabase.from('universal_transactions').insert({
        transaction_type: 'comm_message_ingested',
        transaction_code: `TXN-INGEST-${Date.now()}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.INGESTED.v1',
        organization_id: orgId,
        from_entity_id: connectorId,
        to_entity_id: messageResult[0].id,
        total_amount: 0,
        metadata: {
          source: 'mailchimp',
          campaign_id: campaign.id
        }
      })

      totalProcessed++
    }
  }

  return {
    totalProcessed,
    created: totalProcessed,
    updated: 0,
    errors: 0
  }
}

async function updateSyncJob(origin: string, orgId: string, jobId: string, updates: any) {
  await fetch(`${origin}/api/v2/universal/entity-upsert`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Organization-Id': orgId
    },
    body: JSON.stringify({
      id: jobId,
      entity_type: 'sync_job',
      metadata: updates
    })
  })
}
