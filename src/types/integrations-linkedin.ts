/**
 * LinkedIn Integration Types
 * 
 * Comprehensive type definitions for LinkedIn API integration
 * and HERA Universal Architecture mapping
 */

import { CoreEntity, CoreRelationship, DynamicFieldData, SmartCode } from '@/types/core'
import { AdapterResult } from '@/types/integrations'

// LinkedIn API Response Types
export interface LinkedInOrganization {
  id: string
  vanityName: string
  localizedName: string
  localizedDescription?: string
  logoV2?: {
    original: string
    cropped?: string
    "600x600": string
  }
  followersCount?: number
  websiteUrl?: string
  industries?: string[]
  staffCountRange?: {
    start: number
    end?: number
  }
  locations?: Array<{
    country: string
    city?: string
    postalCode?: string
  }>
  founded?: {
    year: number
  }
  specialties?: string[]
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
  startAt: number // Unix timestamp ms
  endAt?: number
  timezone: string
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID'
  visibility: 'PUBLIC' | 'PRIVATE' | 'CONNECTIONS'
  format?: 'CONFERENCE' | 'WORKSHOP' | 'MEETUP' | 'WEBINAR'
  eventUrl?: string
  attendeeCount?: number
  maxAttendees?: number
  isRegistrationRequired?: boolean
  registrationUrl?: string
  venue?: {
    name?: string
    address?: {
      line1: string
      line2?: string
      city: string
      country: string
      postalCode?: string
    }
  }
  onlineEventInfo?: {
    broadcastUrl?: string
    eventPlatform?: string
  }
  status?: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED'
}

export interface LinkedInMember {
  id: string
  firstName: {
    localized: Record<string, string>
    preferredLocale: {
      country: string
      language: string
    }
  }
  lastName: {
    localized: Record<string, string>
    preferredLocale: {
      country: string
      language: string
    }
  }
  headline?: {
    localized: Record<string, string>
  }
  profilePicture?: {
    displayImage: string
  }
  vanityName?: string
}

export interface LinkedInAttendee {
  memberUrn: string
  eventUrn: string
  firstName?: string
  lastName?: string
  headline?: string
  profilePictureUrl?: string
  rsvpStatus: 'ATTENDING' | 'INTERESTED' | 'NOT_ATTENDING' | 'PENDING'
  registeredAt?: number
  checkedIn?: boolean
  checkedInAt?: number
}

export interface LinkedInPost {
  id: string
  authorUrn: string
  text: {
    text: string
  }
  createdAt: number // Unix timestamp ms
  lastModifiedAt: number
  visibility: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN'
  lifecycleState: 'PUBLISHED' | 'DRAFT' | 'DELETED'
  distribution?: {
    feedDistribution: 'NONE' | 'MAIN_FEED'
    targetedEntities?: string[]
  }
  content?: {
    media?: Array<{
      id: string
      mediaType: 'IMAGE' | 'VIDEO' | 'ARTICLE'
      url: string
      title?: string
      description?: string
    }>
  }
  engagement?: {
    likeCount: number
    commentCount: number
    shareCount: number
    clickCount?: number
    impressionCount?: number
    engagementRate?: number
  }
}

export interface LinkedInComment {
  id: string
  postUrn: string
  authorUrn: string
  parentCommentUrn?: string
  text: {
    text: string
  }
  createdAt: number
  likeCount?: number
}

// HERA Normalized Types
export interface LinkedInNormalizedEntity extends Partial<CoreEntity> {
  entity_type: 'organization_profile' | 'event' | 'event_invite' | 'person' | 'post' | 'engagement_metric'
  smart_code: SmartCode
  source_vendor: 'linkedin'
}

export interface LinkedInRelationshipMapping {
  type: 'ORGANIZATION_HAS_EVENT' | 'EVENT_HAS_ATTENDEE' | 'PERSON_FOLLOWS_ORG' | 'POST_BELONGS_TO_ORG' | 'COMMENT_ON_POST'
  smart_code: SmartCode
  from: {
    entity_type: string
    resolve_by: string
  }
  to: {
    entity_type: string
    resolve_by: string
  }
}

// Sync Configuration
export interface LinkedInSyncConfig {
  organizationUrn?: string
  syncOrganization: boolean
  syncEvents: boolean
  syncAttendees: boolean
  syncPosts: boolean
  syncComments: boolean
  syncEngagement: boolean
  eventsLookbackDays: number
  postsLookbackDays: number
  batchSize: number
  rateLimitPerMinute: number
}

// Adapter Configuration
export interface LinkedInConnectorConfig {
  client_id: string
  client_secret: string
  redirect_uri: string
  access_token?: string
  refresh_token?: string
  token_expires_at?: number
  organization_urn?: string
  scopes: string[]
  sync_config: LinkedInSyncConfig
  demo_mode?: boolean
}

// Mapping Configuration
export interface LinkedInFieldMapping {
  source: string
  target: string
  field_type: 'text' | 'number' | 'boolean' | 'timestamp' | 'json'
  transform?: 'unix_to_iso' | 'truncate' | 'lowercase' | 'uppercase'
  smart_code: SmartCode
  required?: boolean
  default_value?: any
}

export interface LinkedInEntityMapping {
  target_type: string
  identifier_field: string
  code_prefix: string
  name_field: string
  name_template?: string
  smart_code: SmartCode
  business_rules: Record<string, any>
  field_mappings: LinkedInFieldMapping[]
  dynamic_fields: LinkedInFieldMapping[]
}

// Sync Results
export interface LinkedInSyncStats {
  organizations_synced: number
  events_created: number
  events_updated: number
  attendees_created: number
  attendees_updated: number
  posts_created: number
  posts_updated: number
  comments_created: number
  relationships_created: number
  errors: Array<{
    entity: string
    error: string
    timestamp: string
  }>
}

export interface LinkedInSyncResult extends AdapterResult {
  stats: LinkedInSyncStats
  sync_transaction?: {
    id: string
    smart_code: SmartCode
  }
}

// OAuth Types
export interface LinkedInOAuthTokens {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: 'Bearer'
}

export interface LinkedInOAuthError {
  error: string
  error_description: string
}

// Smart Code Constants
export const LINKEDIN_SMART_CODES = {
  // Organization
  ORG_SYNC: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.SYNC.V1',
  ORG_UPDATE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ORG.UPDATE.V1',
  
  // Events
  EVENT_SYNC: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.SYNC.V1',
  EVENT_CREATE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.CREATE.V1',
  EVENT_UPDATE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.UPDATE.V1',
  EVENT_CANCEL: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.EVENT.CANCEL.V1',
  
  // Attendees/RSVPs
  RSVP_UPSERT: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.RSVP.UPSERT.V1',
  RSVP_CHECKIN: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.RSVP.CHECKIN.V1',
  
  // Posts
  POST_SYNC: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.SYNC.V1',
  POST_CREATE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.CREATE.V1',
  POST_UPDATE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.UPDATE.V1',
  POST_DELETE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.POST.DELETE.V1',
  
  // Engagement
  ENGAGEMENT_SYNC: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ENGAGEMENT.SYNC.V1',
  ENGAGEMENT_LIKE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ENGAGEMENT.LIKE.V1',
  ENGAGEMENT_COMMENT: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ENGAGEMENT.COMMENT.V1',
  ENGAGEMENT_SHARE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.ENGAGEMENT.SHARE.V1',
  
  // Relationships
  REL_ORG_EVENT: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.ORG_EVENT.v1',
  REL_EVENT_ATTENDEE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.EVENT_ATTENDEE.v1',
  REL_POST_ORG: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.POST_ORG.v1',
  REL_COMMENT_POST: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.REL.COMMENT_POST.v1',
  
  // Sync Operations
  SYNC_START: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.START.V1',
  SYNC_COMPLETE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.COMPLETE.V1',
  SYNC_ERROR: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.SYNC.ERROR.V1',
  
  // Dynamic Fields
  FIELD_DESC: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.FIELD.DESC.V1',
  FIELD_FOLLOWERS: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.FIELD.FOLLOWERS.V1',
  FIELD_WEBSITE: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.FIELD.WEBSITE.V1',
  FIELD_INDUSTRIES: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.FIELD.INDUSTRIES.V1',
  FIELD_LOGO: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.FIELD.LOGO.V1',
  FIELD_ENGAGEMENT: 'HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.FIELD.ENGAGEMENT.V1'
} as const

// Type guard functions
export function isLinkedInOrganization(data: any): data is LinkedInOrganization {
  return data && typeof data.id === 'string' && typeof data.localizedName === 'string'
}

export function isLinkedInEvent(data: any): data is LinkedInEvent {
  return data && typeof data.id === 'string' && data.name && typeof data.startAt === 'number'
}

export function isLinkedInPost(data: any): data is LinkedInPost {
  return data && typeof data.id === 'string' && data.text && typeof data.createdAt === 'number'
}