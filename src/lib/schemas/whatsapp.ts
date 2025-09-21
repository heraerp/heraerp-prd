// ================================================================================
// WHATSAPP SCHEMAS - ZOD VALIDATION
// Smart Code: HERA.SCHEMAS.WHATSAPP.v1
// Production-ready schemas for WhatsApp messaging system via HERA MSP API
// ================================================================================

import { z } from 'zod'

export const WaConfig = z.object({
  // HERA MSP Configuration - uses HERA's managed WhatsApp API
  hera_api_endpoint: z
    .string()
    .url()
    .default(process.env.NEXT_PUBLIC_HERA_WA_API || 'https://wa-api.heraerp.com'),
  organization_token: z.string().min(20, 'Organization token must be at least 20 characters'),
  sender_name: z.string().min(2, 'Sender name must be at least 2 characters'),
  webhook_secret: z.string().min(16, 'Webhook secret must be at least 16 characters').optional(),
  enabled: z.boolean().default(false),
  daily_limit: z.number().min(1).max(10000).default(1000),
  rate_limit_per_minute: z.number().min(1).max(100).default(20),
  sandbox: z.boolean().default(true), // HERA sandbox vs production
  features: z
    .object({
      templates: z.boolean().default(true),
      media: z.boolean().default(true),
      interactive: z.boolean().default(false),
      webhooks: z.boolean().default(true)
    })
    .default({})
})
export type WaConfig = z.infer<typeof WaConfig>

export const WaTemplate = z.object({
  name: z
    .string()
    .min(3, 'Template name must be at least 3 characters')
    .regex(/^[A-Z_]+$/, 'Template name must be uppercase with underscores only'),
  language: z.string().min(2, 'Language code required').default('en'),
  category: z.enum(['marketing', 'utility', 'authentication']).default('utility'),
  body: z.string().min(10, 'Template body must be at least 10 characters'),
  variables: z.array(z.string()).default([]),
  sample: z.record(z.string()).optional(), // for preview substitution
  status: z.enum(['pending', 'approved', 'rejected', 'disabled']).default('pending'),
  hera_template_id: z.string().optional(), // ID from HERA MSP API
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  approved_at: z.string().optional()
})
export type WaTemplate = z.infer<typeof WaTemplate>

export const WaMessage = z.object({
  id: z.string().optional(),
  organization_id: z.string().uuid('Invalid organization ID'),
  entity_type: z.literal('wa_message'),
  entity_code: z.string().min(1, 'Message code required'),
  entity_name: z.string().min(1, 'Message name required'),
  to_customer_code: z.string().min(1, 'Customer code required'),
  to_phone: z.string().min(10, 'Valid phone number required'),
  template_name: z.string().min(1, 'Template name required'),
  payload: z.record(z.any()).default({}),
  status: z.enum(['queued', 'sent', 'delivered', 'read', 'failed']).default('queued'),
  smart_code: z.string().startsWith('HERA.', 'Smart code must start with HERA.'),
  hera_message_id: z.string().optional(), // ID from HERA MSP API
  webhook_data: z.record(z.any()).optional(), // Status updates from HERA API
  created_at: z.string().optional(),
  sent_at: z.string().optional(),
  delivered_at: z.string().optional(),
  read_at: z.string().optional(),
  failed_reason: z.string().optional(),
  retry_count: z.number().min(0).max(3).default(0)
})
export type WaMessage = z.infer<typeof WaMessage>

export const WaPrefs = z.object({
  opted_in: z.boolean(),
  channel: z.enum(['whatsapp', 'sms', 'none']).default('whatsapp'),
  consent_ts: z.string().optional(), // ISO timestamp
  phone_number: z.string().optional(),
  consent_method: z.enum(['explicit', 'implicit', 'imported']).default('explicit'),
  updated_by: z.string().optional(),
  double_opt_in: z.boolean().default(false), // For compliance
  opt_out_keywords: z.array(z.string()).default(['STOP', 'UNSUBSCRIBE'])
})
export type WaPrefs = z.infer<typeof WaPrefs>

export const MessageFilters = z.object({
  organization_id: z.string().uuid(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  status: z.enum(['queued', 'sent', 'delivered', 'read', 'failed']).optional(),
  customer_code: z.string().optional(),
  template_name: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
})
export type MessageFilters = z.infer<typeof MessageFilters>

export const TemplatePreview = z.object({
  template: WaTemplate,
  substitutions: z.record(z.string()),
  rendered_body: z.string()
})
export type TemplatePreview = z.infer<typeof TemplatePreview>

export const MessageAnalytics = z.object({
  total_sent: z.number().default(0),
  total_delivered: z.number().default(0),
  total_read: z.number().default(0),
  total_failed: z.number().default(0),
  delivery_rate: z.number().min(0).max(1).default(0),
  read_rate: z.number().min(0).max(1).default(0),
  median_delivery_time: z.number().optional(), // seconds
  top_templates: z
    .array(
      z.object({
        name: z.string(),
        count: z.number()
      })
    )
    .default([]),
  daily_usage: z
    .array(
      z.object({
        date: z.string(),
        count: z.number()
      })
    )
    .default([]),
  quota_used: z.number().default(0),
  quota_limit: z.number().default(1000)
})
export type MessageAnalytics = z.infer<typeof MessageAnalytics>

// HERA MSP API Response schemas
export const HeraMspApiResponse = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message_id: z.string().optional(),
  template_id: z.string().optional(),
  quota_remaining: z.number().optional()
})
export type HeraMspApiResponse = z.infer<typeof HeraMspApiResponse>

// Template validation helpers
export const validateTemplateVariables = (
  template: WaTemplate
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Extract variables from template body using regex
  const bodyVariables = Array.from(template.body.matchAll(/\{\{(\w+)\}\}/g))
    .map(match => match[1])
    .filter((value, index, self) => self.indexOf(value) === index) // unique

  // Check if all body variables are declared
  for (const bodyVar of bodyVariables) {
    if (!template.variables.includes(bodyVar)) {
      errors.push(`Variable '${bodyVar}' used in template body but not declared in variables array`)
    }
  }

  // Check if declared variables are used
  for (const declaredVar of template.variables) {
    if (!bodyVariables.includes(declaredVar)) {
      errors.push(`Variable '${declaredVar}' declared but not used in template body`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const renderTemplate = (
  template: WaTemplate,
  substitutions: Record<string, string>
): string => {
  let rendered = template.body

  for (const [variable, value] of Object.entries(substitutions)) {
    const regex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g')
    rendered = rendered.replace(regex, value || `{{${variable}}}`)
  }

  return rendered
}

// Smart code constants for HERA MSP
export const WHATSAPP_SMART_CODES = {
  CONFIG_SET: 'HERA.MSP.WA.CONFIG.SET.V1',
  TEMPLATE_UPSERT: 'HERA.MSP.WA.TEMPLATE.UPSERT.V1',
  MESSAGE_SEND: 'HERA.MSP.WA.MESSAGE.SEND.V1',
  CONSENT_UPDATE: 'HERA.MSP.WA.CONSENT.UPDATE.V1',
  WEBHOOK_RECEIVED: 'HERA.MSP.WA.WEBHOOK.RECEIVED.V1'
} as const

// HERA MSP Configuration
export const HERA_MSP_CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_HERA_WA_API || 'https://wa-api.heraerp.com/v1',
  API_VERSION: 'v1',
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  DEFAULT_LANGUAGE: 'en',
  SUPPORTED_LANGUAGES: ['en', 'ar', 'es', 'fr'],
  MAX_MESSAGE_LENGTH: 4096,
  MAX_TEMPLATE_VARIABLES: 10
} as const
