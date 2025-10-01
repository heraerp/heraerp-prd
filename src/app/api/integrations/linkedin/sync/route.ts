import { NextRequest, NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/demo-guard'
import type { SyncRequest } from '@/types/integrations'

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID
    const isDemo = isDemoMode(orgId)
    const body: SyncRequest = await request.json()

    // Create sync job
    const jobData = {
      entity_type: 'sync_job',
      entity_name: `LinkedIn Sync - ${new Date().toISOString()}`,
      entity_code: `SYNC-LINKEDIN-${Date.now()}`,
      smart_code: 'HERA.INTEGRATION.SYNC.JOB.V1',
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
        smart_code: 'HERA.INTEGRATION.SYNC.STARTED.V1',
        metadata: {
          job_id: jobId,
          connector_id: body.connector_id,
          vendor: 'linkedin'
        }
      })
    })

    // In demo mode, generate sample LinkedIn posts
    if (isDemo) {
      const demoPosts = [
        {
          id: 'urn:li:share:demo1',
          text: 'Excited to announce our new community engagement initiative! Join us in making a difference. #CivicEngagement #Community',
          created_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          statistics: {
            impressions: 1250,
            clicks: 89,
            reactions: 45,
            shares: 12,
            comments: 8
          }
        },
        {
          id: 'urn:li:share:demo2',
          text: "Thank you to everyone who attended our town hall meeting. Your feedback shapes our community's future!",
          created_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          statistics: {
            impressions: 890,
            clicks: 56,
            reactions: 32,
            shares: 8,
            comments: 15
          }
        }
      ]

      let created = 0

      for (const post of demoPosts) {
        // Create message entity
        const messageData = {
          entity_type: 'comm_message',
          entity_name: post.text.substring(0, 50) + '...',
          entity_code: `MSG-LI-${post.id}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.LINKEDIN.V1',
          organization_id: orgId
        }

        const msgResponse = await fetch(
          `${request.nextUrl.origin}/api/v2/universal/entity-upsert`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            },
            body: JSON.stringify(messageData)
          }
        )

        if (msgResponse.ok) {
          const msgResult = await msgResponse.json()
          const messageId = msgResult.data.id

          // Add dynamic data
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              entity_id: messageId,
              field_name: 'channel',
              field_value_text: 'linkedin',
              organization_id: orgId
            })
          })

          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/core_dynamic_data`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              entity_id: messageId,
              field_name: 'metrics',
              field_value_json: post.statistics,
              organization_id: orgId
            })
          })

          // Emit MESSAGE.INGESTED
          await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Organization-Id': orgId
            },
            body: JSON.stringify({
              smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.INGESTED.V1',
              metadata: {
                source: 'linkedin',
                post_id: post.id,
                channel: 'linkedin'
              }
            })
          })

          created++
        }
      }

      // Update job as completed
      await fetch(`${request.nextUrl.origin}/api/v2/universal/entity-upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          id: jobId,
          entity_type: 'sync_job',
          metadata: {
            status: 'completed',
            completed_at: new Date().toISOString(),
            items_processed: demoPosts.length,
            items_created: created,
            items_updated: 0,
            items_failed: 0
          }
        })
      })

      // Emit SYNC_COMPLETED
      await fetch(`${request.nextUrl.origin}/api/v2/universal/txn-emit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': orgId
        },
        body: JSON.stringify({
          smart_code: 'HERA.INTEGRATION.SYNC.COMPLETED.V1',
          metadata: {
            job_id: jobId,
            connector_id: body.connector_id,
            vendor: 'linkedin',
            summary: {
              totalProcessed: demoPosts.length,
              created,
              updated: 0,
              errors: 0
            }
          }
        })
      })

      return NextResponse.json({
        job_id: jobId,
        status: 'completed',
        summary: {
          messages_ingested: created,
          events_ingested: 0,
          errors: 0
        }
      })
    }

    // Production sync would happen here
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
    console.error('LinkedIn sync error:', error)
    return NextResponse.json({ error: 'Failed to sync LinkedIn data' }, { status: 500 })
  }
}
