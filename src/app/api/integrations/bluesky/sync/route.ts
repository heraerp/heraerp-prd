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
      entity_name: `BlueSky Sync - ${new Date().toISOString()}`,
      entity_code: `SYNC-BLUESKY-${Date.now()}`,
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
          vendor: 'bluesky'
        }
      })
    })

    // In demo mode, generate sample BlueSky posts
    if (isDemo) {
      const demoPosts = [
        {
          uri: 'at://did:plc:demo123/app.bsky.feed.post/abc123',
          cid: 'bafyreihj7fxl',
          text: 'Just launched our new community feedback portal! Check it out and share your ideas for improving our town. #CivicTech #OpenGov',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 24,
          repostCount: 5,
          replyCount: 8
        },
        {
          uri: 'at://did:plc:demo123/app.bsky.feed.post/def456',
          cid: 'bafyreihk8gyl',
          text: "Community garden project update: We've planted over 200 seedlings! Thanks to all volunteers who made this possible 🌱",
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          likeCount: 42,
          repostCount: 12,
          replyCount: 15
        }
      ]

      let created = 0

      for (const post of demoPosts) {
        // Create message entity
        const messageData = {
          entity_type: 'comm_message',
          entity_name: post.text.substring(0, 50) + '...',
          entity_code: `MSG-BSKY-${post.cid}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.BLUESKY.v1',
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
              field_value_text: 'bluesky',
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
              field_value_json: {
                likes: post.likeCount,
                reposts: post.repostCount,
                replies: post.replyCount
              },
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
              smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.INGESTED.v1',
              metadata: {
                source: 'bluesky',
                post_uri: post.uri,
                channel: 'bluesky'
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
          smart_code: 'HERA.INTEGRATION.SYNC.COMPLETED.v1',
          metadata: {
            job_id: jobId,
            connector_id: body.connector_id,
            vendor: 'bluesky',
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
    console.error('BlueSky sync error:', error)
    return NextResponse.json({ error: 'Failed to sync BlueSky data' }, { status: 500 })
  }
}
