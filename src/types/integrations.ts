// Integration types for CivicFlow Connectors

export type VendorType =
  | 'mailchimp'
  | 'linkedin'
  | 'bluesky'
  | 'eventbrite'
  | 'office365'
  | 'google'
  | 'meetup'
  | 'facebook'

export type ConnectorStatus = 'active' | 'inactive' | 'error' | 'expired'

export type SyncStatus = 'idle' | 'running' | 'completed' | 'failed'

export type ChannelType = 'email' | 'sms' | 'web' | 'linkedin' | 'bluesky'

export interface Connector {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  vendor: VendorType
  status: ConnectorStatus
  // Dynamic data fields
  account_id?: string
  account_name?: string
  oauth_token?: string
  oauth_refresh_token?: string
  oauth_expires_at?: string
  scopes?: string[]
  sync_cursor?: Record<string, any>
  last_sync_at?: string
  next_sync_at?: string
  sync_schedule?: string // cron expression
  created_at: string
  updated_at: string
}

export interface SyncJob {
  id: string
  entity_code: string
  entity_name: string
  smart_code: string
  connector_id: string
  status: SyncStatus
  started_at: string
  completed_at?: string
  // Dynamic data fields
  items_processed?: number
  items_created?: number
  items_updated?: number
  items_failed?: number
  error_message?: string
  sync_cursor?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ConnectorMapping {
  id: string
  connector_id: string
  mapping_type: 'list_to_audience' | 'campaign_to_campaign' | 'event_to_program'
  source_id: string
  source_name: string
  target_id: string
  target_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OAuthConfig {
  vendor: VendorType
  client_id: string
  authorization_url: string
  token_url: string
  scopes: string[]
  redirect_uri: string
}

export interface SyncRequest {
  connector_id: string
  sync_type: 'full' | 'incremental'
  options?: {
    start_date?: string
    end_date?: string
    limit?: number
  }
}

export interface SyncResult {
  job_id: string
  status: SyncStatus
  summary: {
    messages_ingested: number
    events_ingested: number
    errors: number
  }
}

// Vendor-specific response types
export interface MailchimpList {
  id: string
  name: string
  member_count: number
  date_created: string
}

export interface MailchimpCampaign {
  id: string
  type: string
  status: string
  settings: {
    subject_line: string
    from_name: string
    reply_to: string
  }
  recipients: {
    list_id: string
    segment_text: string
  }
  send_time?: string
}

export interface LinkedInPost {
  id: string
  text: string
  created_time: string
  statistics: {
    impressions: number
    clicks: number
    reactions: number
    shares: number
    comments: number
  }
}

export interface BlueSkyPost {
  uri: string
  cid: string
  text: string
  createdAt: string
  likeCount: number
  repostCount: number
  replyCount: number
}

export interface EventbriteEvent {
  id: string
  name: {
    text: string
    html: string
  }
  description: {
    text: string
    html: string
  }
  start: {
    timezone: string
    local: string
    utc: string
  }
  end: {
    timezone: string
    local: string
    utc: string
  }
  capacity: number
  status: string
}

export interface EventbriteAttendee {
  id: string
  profile: {
    name: string
    email: string
  }
  event_id: string
  order_id: string
  created: string
  status: string
  checked_in: boolean
}

// OAuth vendor configurations
export const OAUTH_CONFIGS: Record<VendorType, Partial<OAuthConfig>> = {
  mailchimp: {
    authorization_url: 'https://login.mailchimp.com/oauth2/authorize',
    token_url: 'https://login.mailchimp.com/oauth2/token',
    scopes: ['read', 'write']
  },
  linkedin: {
    authorization_url: 'https://www.linkedin.com/oauth/v2/authorization',
    token_url: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_organization_social', 'w_organization_social', 'r_organization_admin']
  },
  bluesky: {
    // BlueSky uses app passwords, not OAuth
    authorization_url: '',
    token_url: '',
    scopes: []
  },
  eventbrite: {
    authorization_url: 'https://www.eventbrite.com/oauth/authorize',
    token_url: 'https://www.eventbrite.com/oauth/token',
    scopes: ['event:read', 'event:write', 'attendee:read']
  },
  office365: {
    authorization_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token_url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['Mail.Read', 'Calendars.Read', 'User.Read']
  },
  google: {
    authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth',
    token_url: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar.readonly'
    ]
  },
  meetup: {
    authorization_url: 'https://secure.meetup.com/oauth2/authorize',
    token_url: 'https://secure.meetup.com/oauth2/access',
    scopes: ['basic', 'event_management']
  },
  facebook: {
    authorization_url: 'https://www.facebook.com/v18.0/dialog/oauth',
    token_url: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_manage_metadata']
  }
}
