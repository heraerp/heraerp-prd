/**
 * LinkedIn Integration Adapter for CivicFlow
 *
 * Implements OAuth2 authentication and API client for syncing:
 * - Organization profiles
 * - Events and attendees/registrations
 * - Posts and engagement metrics (v1.1)
 *
 * All data maps to HERA's Sacred Six tables without schema changes
 */

import { IntegrationAdapter, AdapterResult, VendorConnector } from '@/types/integrations'
import { DynamicFieldData } from '@/types/core'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { withRetry } from '@/lib/utils/retry'
import { logger } from '@/lib/utils/logger'

// LinkedIn API types
export interface LinkedInOrganization {
  id: string
  vanityName: string
  localizedName: string
  localizedDescription?: string
  logoV2?: {
    original: string
    cropped?: string
  }
  followersCount?: number
  websiteUrl?: string
  industries?: string[]
  staffCountRange?: {
    start: number
    end?: number
  }
}

export interface LinkedInEvent {
  id: string
  organizerUrn: string
  name: {
    text: string
  }
  description?: {
    text: string
  }
  startAt: number // Unix timestamp
  endAt?: number
  timezone: string
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  visibility: 'PUBLIC' | 'PRIVATE' | 'CONNECTIONS'
  eventUrl?: string
  attendeeCount?: number
  maxAttendees?: number
  isRegistrationRequired?: boolean
  registrationUrl?: string
  venue?: {
    address?: {
      line1: string
      line2?: string
      city: string
      country: string
      postalCode?: string
    }
  }
}

export interface LinkedInAttendee {
  memberUrn: string
  eventUrn: string
  firstName?: string
  lastName?: string
  headline?: string
  profilePictureUrl?: string
  rsvpStatus: 'ATTENDING' | 'INTERESTED' | 'NOT_ATTENDING'
  registeredAt?: number
}

export interface LinkedInPost {
  id: string
  authorUrn: string
  text: {
    text: string
  }
  createdAt: number
  lastModifiedAt: number
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN'
  lifecycleState: 'PUBLISHED' | 'DRAFT' | 'DELETED'
  engagement?: {
    likeCount: number
    commentCount: number
    shareCount: number
    clickCount?: number
    impressionCount?: number
  }
}

// Adapter configuration
interface LinkedInConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  organizationUrn?: string // LinkedIn organization URN
  syncOrganization: boolean
  syncEvents: boolean
  syncAttendees: boolean
  syncPosts: boolean
  postsLookbackDays: number
}

export class LinkedInAdapter implements IntegrationAdapter {
  private config: LinkedInConfig
  private supabase: any
  private accessToken?: string
  private tokenExpiresAt?: number
  private demoMode: boolean

  constructor(connector: VendorConnector, supabase: any) {
    this.supabase = supabase
    this.demoMode = connector.config.demo_mode || false

    this.config = {
      clientId: connector.config.client_id || '',
      clientSecret: connector.config.client_secret || '',
      redirectUri: connector.config.redirect_uri || '',
      scopes: connector.config.scopes || [
        'r_organization_admin',
        'r_organization_social',
        'r_events',
        'w_organization_social'
      ],
      organizationUrn: connector.config.organization_urn,
      syncOrganization: connector.config.sync_organization ?? true,
      syncEvents: connector.config.sync_events ?? true,
      syncAttendees: connector.config.sync_attendees ?? true,
      syncPosts: connector.config.sync_posts ?? false,
      postsLookbackDays: connector.config.posts_lookback_days || 30
    }

    this.accessToken = connector.config.access_token
    this.tokenExpiresAt = connector.config.token_expires_at
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.demoMode) {
        return { success: true }
      }

      await this.ensureAuthenticated()

      // Test with a simple API call
      const response = await this.makeApiRequest('/v2/me')

      if (response.ok) {
        return { success: true }
      } else {
        const error = await response.text()
        return { success: false, error: `LinkedIn API error: ${error}` }
      }
    } catch (error) {
      logger.error('LinkedIn connection test failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      }
    }
  }

  async sync(): Promise<AdapterResult> {
    const startTime = Date.now()
    const entities: any[] = []
    const relationships: any[] = []
    const dynamicData: DynamicFieldData[] = []
    const errors: Array<{ entity: string; error: string }> = []

    try {
      if (this.demoMode) {
        return this.generateDemoData()
      }

      await this.ensureAuthenticated()

      // 1. Sync Organization Profile
      if (this.config.syncOrganization && this.config.organizationUrn) {
        try {
          const orgResult = await this.syncOrganizationProfile()
          entities.push(...orgResult.entities)
          dynamicData.push(...orgResult.dynamicData)
        } catch (error) {
          errors.push({
            entity: 'organization',
            error: error instanceof Error ? error.message : 'Failed to sync organization'
          })
        }
      }

      // 2. Sync Events
      if (this.config.syncEvents && this.config.organizationUrn) {
        try {
          const eventsResult = await this.syncEvents()
          entities.push(...eventsResult.entities)
          relationships.push(...eventsResult.relationships)
          dynamicData.push(...eventsResult.dynamicData)
        } catch (error) {
          errors.push({
            entity: 'events',
            error: error instanceof Error ? error.message : 'Failed to sync events'
          })
        }
      }

      // 3. Sync Attendees (if available)
      if (this.config.syncAttendees) {
        // LinkedIn API has limited access to attendee data
        // This would require additional permissions and may not be available
        // for all event types
      }

      // 4. Sync Posts (v1.1)
      if (this.config.syncPosts && this.config.organizationUrn) {
        try {
          const postsResult = await this.syncPosts()
          entities.push(...postsResult.entities)
          relationships.push(...postsResult.relationships)
          dynamicData.push(...postsResult.dynamicData)
        } catch (error) {
          errors.push({
            entity: 'posts',
            error: error instanceof Error ? error.message : 'Failed to sync posts'
          })
        }
      }

      const duration = Date.now() - startTime

      return {
        success: errors.length === 0,
        entities,
        relationships,
        dynamicData,
        stats: {
          totalRecords: entities.length,
          created: entities.filter(e => e.isNew).length,
          updated: entities.filter(e => !e.isNew).length,
          errors: errors.length,
          duration
        },
        errors: errors.length > 0 ? errors : undefined
      }
    } catch (error) {
      logger.error('LinkedIn sync failed:', error)
      return {
        success: false,
        entities: [],
        relationships: [],
        dynamicData: [],
        stats: {
          totalRecords: 0,
          created: 0,
          updated: 0,
          errors: 1,
          duration: Date.now() - startTime
        },
        errors: [
          {
            entity: 'sync',
            error: error instanceof Error ? error.message : 'Sync failed'
          }
        ]
      }
    }
  }

  private async syncOrganizationProfile(): Promise<{
    entities: any[]
    dynamicData: DynamicFieldData[]
  }> {
    const org = await this.fetchOrganization(this.config.organizationUrn!)

    const entity = {
      entity_type: 'organization_profile',
      entity_name: org.localizedName,
      entity_code: `li:${org.id}`,
      smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.SYNC.V1',
      business_rules: {
        source: 'linkedin',
        vanity_name: org.vanityName,
        visibility: 'PUBLIC'
      },
      metadata: {
        external_id: org.id,
        linkedin_urn: this.config.organizationUrn,
        last_synced: new Date().toISOString()
      },
      isNew: false // Will be determined during actual sync
    }

    const dynamicFields: DynamicFieldData[] = [
      {
        entity_id: '', // Will be set during sync
        field_name: 'description',
        field_type: 'text',
        field_value_text: org.localizedDescription || '',
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.DESC.V1'
      },
      {
        entity_id: '',
        field_name: 'followers_count',
        field_type: 'number',
        field_value_number: org.followersCount || 0,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.FOLLOWERS.V1'
      },
      {
        entity_id: '',
        field_name: 'website_url',
        field_type: 'text',
        field_value_text: org.websiteUrl || '',
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.WEBSITE.V1'
      },
      {
        entity_id: '',
        field_name: 'industries',
        field_type: 'json',
        field_value_json: org.industries || [],
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.INDUSTRIES.V1'
      }
    ]

    if (org.logoV2) {
      dynamicFields.push({
        entity_id: '',
        field_name: 'logo_url',
        field_type: 'text',
        field_value_text: org.logoV2.original,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.LOGO.V1'
      })
    }

    return { entities: [entity], dynamicData: dynamicFields }
  }

  private async syncEvents(): Promise<{
    entities: any[]
    relationships: any[]
    dynamicData: DynamicFieldData[]
  }> {
    const events = await this.fetchEvents(this.config.organizationUrn!)
    const entities: any[] = []
    const relationships: any[] = []
    const dynamicData: DynamicFieldData[] = []

    for (const event of events) {
      const entity = {
        entity_type: 'event',
        entity_name: event.name.text,
        entity_code: `li:event:${event.id}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.SYNC.V1',
        business_rules: {
          source: 'linkedin',
          visibility: event.visibility,
          mode: event.mode,
          is_registration_required: event.isRegistrationRequired
        },
        metadata: {
          external_id: event.id,
          event_url: event.eventUrl,
          last_synced: new Date().toISOString()
        },
        isNew: false
      }

      entities.push(entity)

      // Create relationship to organization
      relationships.push({
        from_entity_id: '', // Org entity ID (will be resolved during sync)
        to_entity_id: '', // Event entity ID (will be resolved during sync)
        relationship_type: 'ORGANIZATION_HAS_EVENT',
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.ORG_EVENT.v1',
        metadata: {
          created_at: new Date().toISOString()
        }
      })

      // Add dynamic fields
      const eventFields: DynamicFieldData[] = [
        {
          entity_id: '',
          field_name: 'start_date',
          field_type: 'timestamp',
          field_value_timestamp: new Date(event.startAt).toISOString(),
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.START.V1'
        },
        {
          entity_id: '',
          field_name: 'timezone',
          field_type: 'text',
          field_value_text: event.timezone,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.TZ.V1'
        }
      ]

      if (event.endAt) {
        eventFields.push({
          entity_id: '',
          field_name: 'end_date',
          field_type: 'timestamp',
          field_value_timestamp: new Date(event.endAt).toISOString(),
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.END.V1'
        })
      }

      if (event.description) {
        eventFields.push({
          entity_id: '',
          field_name: 'description',
          field_type: 'text',
          field_value_text: event.description.text,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.DESC.V1'
        })
      }

      if (event.venue?.address) {
        eventFields.push({
          entity_id: '',
          field_name: 'venue_address',
          field_type: 'json',
          field_value_json: event.venue.address,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.VENUE.V1'
        })
      }

      dynamicData.push(...eventFields)
    }

    return { entities, relationships, dynamicData }
  }

  private async syncPosts(): Promise<{
    entities: any[]
    relationships: any[]
    dynamicData: DynamicFieldData[]
  }> {
    const posts = await this.fetchRecentPosts(this.config.organizationUrn!)
    const entities: any[] = []
    const relationships: any[] = []
    const dynamicData: DynamicFieldData[] = []

    for (const post of posts) {
      const entity = {
        entity_type: 'post',
        entity_name: post.text.text.substring(0, 100) + '...',
        entity_code: `li:post:${post.id}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.SYNC.V1',
        business_rules: {
          source: 'linkedin',
          visibility: post.visibility,
          lifecycle_state: post.lifecycleState
        },
        metadata: {
          external_id: post.id,
          author_urn: post.authorUrn,
          created_at: new Date(post.createdAt).toISOString()
        },
        isNew: false
      }

      entities.push(entity)

      // Create relationship to organization
      relationships.push({
        from_entity_id: '', // Post entity ID
        to_entity_id: '', // Org entity ID
        relationship_type: 'POST_BELONGS_TO_ORG',
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.POST_ORG.v1',
        metadata: {
          created_at: new Date().toISOString()
        }
      })

      // Add dynamic fields
      const postFields: DynamicFieldData[] = [
        {
          entity_id: '',
          field_name: 'content',
          field_type: 'text',
          field_value_text: post.text.text,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.CONTENT.V1'
        }
      ]

      if (post.engagement) {
        postFields.push({
          entity_id: '',
          field_name: 'engagement_metrics',
          field_type: 'json',
          field_value_json: post.engagement,
          smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.ENGAGEMENT.V1'
        })

        // Also store as individual metrics for easier querying
        postFields.push(
          {
            entity_id: '',
            field_name: 'like_count',
            field_type: 'number',
            field_value_number: post.engagement.likeCount,
            smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.LIKES.V1'
          },
          {
            entity_id: '',
            field_name: 'comment_count',
            field_type: 'number',
            field_value_number: post.engagement.commentCount,
            smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.COMMENTS.V1'
          },
          {
            entity_id: '',
            field_name: 'share_count',
            field_type: 'number',
            field_value_number: post.engagement.shareCount,
            smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.SHARES.V1'
          }
        )
      }

      dynamicData.push(...postFields)
    }

    return { entities, relationships, dynamicData }
  }

  // API Helper Methods
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || Date.now() >= this.tokenExpiresAt) {
      throw new Error('LinkedIn access token expired or missing. Please reconnect.')
    }
  }

  private async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const baseUrl = 'https://api.linkedin.com'

    return withRetry(
      async () => {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
            ...options.headers
          }
        })

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000
          await new Promise(resolve => setTimeout(resolve, delay))
          throw new Error('Rate limited')
        }

        return response
      },
      {
        maxAttempts: 3,
        delayMs: 1000,
        backoff: 'exponential'
      }
    )
  }

  private async fetchOrganization(urn: string): Promise<LinkedInOrganization> {
    const response = await this.makeApiRequest(
      `/v2/organizations/${encodeURIComponent(urn)}?projection=(id,vanityName,localizedName,localizedDescription,logoV2,followersCount,websiteUrl,industries,staffCountRange)`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch organization: ${response.statusText}`)
    }

    return response.json()
  }

  private async fetchEvents(organizationUrn: string): Promise<LinkedInEvent[]> {
    const events: LinkedInEvent[] = []
    let start = 0
    const count = 50

    while (true) {
      const response = await this.makeApiRequest(
        `/v2/events?q=organizer&organizer=${encodeURIComponent(organizationUrn)}&start=${start}&count=${count}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`)
      }

      const data = await response.json()
      events.push(...(data.elements || []))

      if (!data.paging || data.elements.length < count) {
        break
      }

      start += count
    }

    return events
  }

  private async fetchRecentPosts(organizationUrn: string): Promise<LinkedInPost[]> {
    const posts: LinkedInPost[] = []
    const sinceTimestamp = Date.now() - this.config.postsLookbackDays * 24 * 60 * 60 * 1000

    // LinkedIn's UGC Posts API
    const response = await this.makeApiRequest(
      `/v2/ugcPosts?q=authors&authors=List(${encodeURIComponent(organizationUrn)})&sortBy=CREATED&count=50`
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }

    const data = await response.json()
    const recentPosts = (data.elements || []).filter(
      (post: any) => post.created.time >= sinceTimestamp
    )

    // Transform to our format
    for (const post of recentPosts) {
      posts.push({
        id: post.id,
        authorUrn: post.author,
        text: {
          text: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || ''
        },
        createdAt: post.created.time,
        lastModifiedAt: post.lastModified?.time || post.created.time,
        visibility: post.visibility?.['com.linkedin.ugc.MemberNetworkVisibility'] || 'PUBLIC',
        lifecycleState: post.lifecycleState,
        engagement: {
          likeCount: 0, // Would need separate API call
          commentCount: 0,
          shareCount: 0
        }
      })
    }

    return posts
  }

  // Demo data generator
  private generateDemoData(): AdapterResult {
    const entities: any[] = []
    const relationships: any[] = []
    const dynamicData: DynamicFieldData[] = []

    // Demo organization
    const org = {
      entity_type: 'organization_profile',
      entity_name: 'Demo Innovation Hub',
      entity_code: 'li:demo-org',
      smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.SYNC.V1',
      business_rules: {
        source: 'linkedin',
        vanity_name: 'demo-innovation-hub',
        visibility: 'PUBLIC'
      },
      metadata: {
        external_id: 'demo-org-123',
        demo: true
      },
      isNew: true
    }
    entities.push(org)

    // Demo organization dynamic data
    dynamicData.push(
      {
        entity_id: 'temp-org-id',
        field_name: 'description',
        field_type: 'text',
        field_value_text: 'Fostering civic innovation through technology and community engagement.',
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.DESC.V1'
      },
      {
        entity_id: 'temp-org-id',
        field_name: 'followers_count',
        field_type: 'number',
        field_value_number: 1250,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.FOLLOWERS.V1'
      }
    )

    // Demo events
    const demoEvents = [
      {
        name: 'Civic Tech Summit 2025',
        id: 'demo-event-1',
        startAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        mode: 'HYBRID' as const,
        visibility: 'PUBLIC' as const
      },
      {
        name: 'AI in Government Workshop',
        id: 'demo-event-2',
        startAt: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
        mode: 'ONLINE' as const,
        visibility: 'PUBLIC' as const
      }
    ]

    for (const eventData of demoEvents) {
      const event = {
        entity_type: 'event',
        entity_name: eventData.name,
        entity_code: `li:event:${eventData.id}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.SYNC.V1',
        business_rules: {
          source: 'linkedin',
          visibility: eventData.visibility,
          mode: eventData.mode
        },
        metadata: {
          external_id: eventData.id,
          demo: true
        },
        isNew: true
      }
      entities.push(event)

      relationships.push({
        from_entity_id: 'temp-org-id',
        to_entity_id: `temp-event-${eventData.id}`,
        relationship_type: 'ORGANIZATION_HAS_EVENT',
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.ORG_EVENT.v1',
        metadata: { demo: true }
      })

      dynamicData.push({
        entity_id: `temp-event-${eventData.id}`,
        field_name: 'start_date',
        field_type: 'timestamp',
        field_value_timestamp: new Date(eventData.startAt).toISOString(),
        smart_code: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.START.V1'
      })
    }

    return {
      success: true,
      entities,
      relationships,
      dynamicData,
      stats: {
        totalRecords: entities.length,
        created: entities.length,
        updated: 0,
        errors: 0,
        duration: 100
      }
    }
  }
}
