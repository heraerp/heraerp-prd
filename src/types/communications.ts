// Communications Types for CivicFlow

export type CommChannel = 'email' | 'sms' | 'webhook';
export type CommStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'opened' | 'clicked';
export type MessageDirection = 'out' | 'in';

export interface Template {
  id: string;
  entity_code: string;
  entity_name: string;
  smart_code: string;
  channel: CommChannel;
  subject?: string;
  body_html?: string;
  body_text?: string;
  variables?: string[];
  version: number;
  is_active: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface AudienceDefinition {
  entity_types?: string[];
  tags?: string[];
  program_ids?: string[];
  grant_status?: string[];
  case_rag?: ('red' | 'amber' | 'green')[];
  geography?: {
    region?: string[];
    district?: string[];
  };
  custom_flags?: Record<string, any>;
}

export interface Audience {
  id: string;
  entity_code: string;
  entity_name: string;
  smart_code: string;
  definition: AudienceDefinition;
  size_estimate: number;
  consent_policy: 'opt_in' | 'opt_out';
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  entity_code: string;
  entity_name: string;
  smart_code: string;
  channel: CommChannel;
  template_id: string;
  template_name?: string;
  audience_id: string;
  audience_name?: string;
  audience_size?: number;
  schedule_at?: string;
  throttle_per_min?: number;
  ab_variants?: {
    variant_id: string;
    name: string;
    weight: number;
    template_id?: string;
  }[];
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  status: CommStatus;
  metrics?: {
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  entity_code: string;
  smart_code: string;
  direction: MessageDirection;
  channel: CommChannel;
  to: string;
  from: string;
  subject?: string;
  body_preview?: string;
  status: MessageStatus;
  provider_ids?: Record<string, string>;
  error?: string;
  meta?: Record<string, any>;
  campaign_id?: string;
  campaign_name?: string;
  subject_id?: string;
  subject_type?: string;
  subject_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CommKpis {
  outbound_today: number;
  inbound_today: number;
  bounces_7d: number;
  opt_outs_7d: number;
  queue_size: number;
  deliverability_percent: number;
  campaigns_running: number;
  campaigns_scheduled: number;
  campaigns_completed_7d: number;
  avg_open_rate_7d: number;
}

export interface CommFilters {
  q?: string;
  channel?: CommChannel[];
  status?: string[];
  program?: string;
  round?: string;
  campaign_id?: string;
  date_from?: string;
  date_to?: string;
  errors_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface CommExportRequest {
  kind: string;
  format: 'csv' | 'pdf' | 'zip' | 'xlsx';
  organization_id: string;
  include_demo_watermark?: boolean;
  campaign_id?: string;
  template_id?: string;
  audience_id?: string;
  filters?: CommFilters;
}