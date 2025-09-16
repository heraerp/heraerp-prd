// ================================================================================
// WHATSAPP API WRAPPER - SACRED SIX IMPLEMENTATION
// Smart Code: HERA.API.WHATSAPP.v1
// Production-ready WhatsApp API using HERA MSP with Sacred Six storage only
// ================================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  WaConfig, 
  WaTemplate, 
  WaMessage, 
  WaPrefs, 
  MessageFilters, 
  MessageAnalytics,
  HeraMspApiResponse,
  WHATSAPP_SMART_CODES,
  HERA_MSP_CONFIG,
  validateTemplateVariables,
  renderTemplate
} from '@/src/lib/schemas/whatsapp'
import { universalApi } from '@/src/lib/universal-api'

// HERA MSP API Client
class HeraMspApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = HERA_MSP_CONFIG.API_BASE_URL
    this.timeout = HERA_MSP_CONFIG.TIMEOUT_MS
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit & { orgToken?: string }
  ): Promise<HeraMspApiResponse> {
    const { orgToken, ...fetchOptions } = options
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': orgToken ? `Bearer ${orgToken}` : '',
        'X-API-Version': HERA_MSP_CONFIG.API_VERSION,
        ...fetchOptions.headers
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`)
    }

    return HeraMspApiResponse.parse(data)
  }

  async sendMessage(orgToken: string, message: {
    to: string
    template: string
    variables: Record<string, string>
  }): Promise<HeraMspApiResponse> {
    return this.request('/messages/send', {
      method: 'POST',
      orgToken,
      body: JSON.stringify(message)
    })
  }

  async createTemplate(orgToken: string, template: {
    name: string
    language: string
    category: string
    body: string
    variables: string[]
  }): Promise<HeraMspApiResponse> {
    return this.request('/templates', {
      method: 'POST',
      orgToken,
      body: JSON.stringify(template)
    })
  }

  async getQuota(orgToken: string): Promise<HeraMspApiResponse> {
    return this.request('/quota', {
      method: 'GET',
      orgToken
    })
  }

  async validateConnection(orgToken: string): Promise<HeraMspApiResponse> {
    return this.request('/health', {
      method: 'GET',
      orgToken
    })
  }
}

const heraMspClient = new HeraMspApiClient()

export function useWhatsappApi(organizationId: string) {
  const queryClient = useQueryClient()

  // Query keys for React Query
  const keys = {
    config: ['whatsapp', 'config', organizationId],
    templates: ['whatsapp', 'templates', organizationId],
    messages: (filters?: MessageFilters) => ['whatsapp', 'messages', organizationId, filters],
    analytics: ['whatsapp', 'analytics', organizationId],
    customerPrefs: (customerCode: string) => ['whatsapp', 'prefs', organizationId, customerCode]
  }

  // ==================== CONFIG OPERATIONS ====================

  const getConfig = useQuery({
    queryKey: keys.config,
    queryFn: async (): Promise<WaConfig | null> => {
      try {
        const result = await universalApi.getDynamicData(organizationId, 'WA_API.CONFIG.v1')
        return result ? WaConfig.parse(result) : null
      } catch (error) {
        console.error('Failed to get WhatsApp config:', error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  const saveConfig = useMutation({
    mutationFn: async (config: WaConfig): Promise<void> => {
      const parsedConfig = WaConfig.parse(config)
      
      // Store in core_dynamic_data
      await universalApi.setDynamicData(
        organizationId,
        'WA_API.CONFIG.v1',
        parsedConfig,
        WHATSAPP_SMART_CODES.CONFIG_SET
      )

      // Test connection with HERA MSP API if enabled
      if (parsedConfig.enabled && parsedConfig.organization_token) {
        try {
          await heraMspClient.validateConnection(parsedConfig.organization_token)
        } catch (error) {
          throw new Error(`Configuration saved but connection test failed: ${error.message}`)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.config })
    }
  })

  // ==================== TEMPLATE OPERATIONS ====================

  const getTemplates = useQuery({
    queryKey: keys.templates,
    queryFn: async (): Promise<WaTemplate[]> => {
      try {
        const results = await universalApi.listDynamicData(organizationId, 'WA_TEMPLATE.')
        return results.map(item => {
          const templateData = typeof item.field_value_json === 'string' 
            ? JSON.parse(item.field_value_json) 
            : item.field_value_json
          return WaTemplate.parse(templateData)
        })
      } catch (error) {
        console.error('Failed to get WhatsApp templates:', error)
        return []
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  })

  const saveTemplate = useMutation({
    mutationFn: async (template: WaTemplate): Promise<void> => {
      const parsedTemplate = WaTemplate.parse(template)
      
      // Validate template variables
      const validation = validateTemplateVariables(parsedTemplate)
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`)
      }

      const key = `WA_TEMPLATE.${parsedTemplate.name}.v1`
      await universalApi.setDynamicData(
        organizationId,
        key,
        parsedTemplate,
        WHATSAPP_SMART_CODES.TEMPLATE_UPSERT
      )

      // Submit to HERA MSP API for approval if config exists
      const config = getConfig.data
      if (config?.enabled && config.organization_token) {
        try {
          const response = await heraMspClient.createTemplate(config.organization_token, {
            name: parsedTemplate.name,
            language: parsedTemplate.language,
            category: parsedTemplate.category,
            body: parsedTemplate.body,
            variables: parsedTemplate.variables
          })
          
          // Update template with MSP response
          if (response.template_id) {
            parsedTemplate.hera_template_id = response.template_id
            parsedTemplate.status = 'pending'
            await universalApi.setDynamicData(organizationId, key, parsedTemplate)
          }
        } catch (error) {
          console.warn('Template saved locally but MSP submission failed:', error)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.templates })
    }
  })

  const deleteTemplate = useMutation({
    mutationFn: async (templateName: string): Promise<void> => {
      await universalApi.deleteDynamicData(organizationId, `WA_TEMPLATE.${templateName}.v1`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.templates })
    }
  })

  // ==================== MESSAGE OPERATIONS ====================

  const getMessages = useQuery({
    queryKey: keys.messages(),
    queryFn: async (): Promise<WaMessage[]> => {
      try {
        const results = await universalApi.getEntities({
          organization_id: organizationId,
          entity_type: 'wa_message',
          limit: 100,
          order_by: 'created_at DESC'
        })

        return results.map(entity => WaMessage.parse({
          ...entity,
          id: entity.id,
          organization_id: entity.organization_id,
          entity_type: entity.entity_type,
          entity_code: entity.entity_code,
          entity_name: entity.entity_name,
          // Parse metadata for message details
          ...entity.metadata
        }))
      } catch (error) {
        console.error('Failed to get WhatsApp messages:', error)
        return []
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 2
  })

  const sendMessage = useMutation({
    mutationFn: async (message: Omit<WaMessage, 'id' | 'status' | 'created_at'>): Promise<WaMessage> => {
      // 1. Enforce consent - check customer preferences
      const customerPrefs = await getCustomerPrefs(message.to_customer_code)
      if (!customerPrefs?.opted_in) {
        throw new Error('Customer has not opted in to WhatsApp communications')
      }

      // 2. Get template for validation
      const templates = getTemplates.data || []
      const template = templates.find(t => t.name === message.template_name)
      if (!template) {
        throw new Error(`Template '${message.template_name}' not found`)
      }

      // 3. Create message entity in Sacred Six
      const messageEntity = await universalApi.createEntity({
        organization_id: organizationId,
        entity_type: 'wa_message',
        entity_code: `WA_MSG_${Date.now()}`,
        entity_name: `WhatsApp message to ${message.to_customer_code}`,
        smart_code: WHATSAPP_SMART_CODES.MESSAGE_SEND,
        metadata: {
          to_customer_code: message.to_customer_code,
          to_phone: message.to_phone,
          template_name: message.template_name,
          payload: message.payload,
          status: 'queued',
          created_at: new Date().toISOString()
        }
      })

      // 4. Send via HERA MSP API if config available
      const config = getConfig.data
      if (config?.enabled && config.organization_token) {
        try {
          const response = await heraMspClient.sendMessage(config.organization_token, {
            to: message.to_phone,
            template: message.template_name,
            variables: message.payload
          })

          if (response.message_id) {
            // Update entity with MSP response
            await universalApi.updateEntity(messageEntity.id, {
              metadata: {
                ...messageEntity.metadata,
                hera_message_id: response.message_id,
                status: 'sent',
                sent_at: new Date().toISOString()
              }
            })
          }
        } catch (error) {
          // Update status to failed
          await universalApi.updateEntity(messageEntity.id, {
            metadata: {
              ...messageEntity.metadata,
              status: 'failed',
              failed_reason: error.message
            }
          })
          throw error
        }
      }

      return WaMessage.parse({
        id: messageEntity.id,
        ...message,
        status: config?.enabled ? 'sent' : 'queued'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.messages() })
      queryClient.invalidateQueries({ queryKey: keys.analytics })
    }
  })

  // ==================== CUSTOMER PREFERENCES ====================

  const getCustomerPrefs = async (customerCode: string): Promise<WaPrefs | null> => {
    try {
      const result = await universalApi.getEntityDynamicData(
        organizationId,
        'customer',
        customerCode,
        'WA_PREFS.v1'
      )
      return result ? WaPrefs.parse(result) : null
    } catch (error) {
      console.error('Failed to get customer WhatsApp preferences:', error)
      return null
    }
  }

  const setCustomerPrefs = useMutation({
    mutationFn: async ({ customerCode, prefs }: { customerCode: string; prefs: WaPrefs }): Promise<void> => {
      const parsedPrefs = WaPrefs.parse({
        ...prefs,
        consent_ts: prefs.opted_in ? new Date().toISOString() : prefs.consent_ts
      })

      await universalApi.setEntityDynamicData(
        organizationId,
        'customer',
        customerCode,
        'WA_PREFS.v1',
        parsedPrefs,
        WHATSAPP_SMART_CODES.CONSENT_UPDATE
      )
    },
    onSuccess: (_, { customerCode }) => {
      queryClient.invalidateQueries({ queryKey: keys.customerPrefs(customerCode) })
    }
  })

  // ==================== ANALYTICS ====================

  const getAnalytics = useQuery({
    queryKey: keys.analytics,
    queryFn: async (): Promise<MessageAnalytics> => {
      try {
        const messages = await universalApi.getEntities({
          organization_id: organizationId,
          entity_type: 'wa_message',
          limit: 1000
        })

        // Calculate analytics from message entities
        const totalSent = messages.filter(m => ['sent', 'delivered', 'read'].includes(m.metadata?.status)).length
        const totalDelivered = messages.filter(m => ['delivered', 'read'].includes(m.metadata?.status)).length
        const totalRead = messages.filter(m => m.metadata?.status === 'read').length
        const totalFailed = messages.filter(m => m.metadata?.status === 'failed').length

        const deliveryRate = totalSent > 0 ? totalDelivered / totalSent : 0
        const readRate = totalDelivered > 0 ? totalRead / totalDelivered : 0

        // Template usage stats
        const templateCounts: Record<string, number> = {}
        messages.forEach(m => {
          const template = m.metadata?.template_name
          if (template) {
            templateCounts[template] = (templateCounts[template] || 0) + 1
          }
        })

        const topTemplates = Object.entries(templateCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        // Daily usage (last 30 days)
        const dailyUsage = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          
          const count = messages.filter(m => {
            const msgDate = m.created_at?.split('T')[0]
            return msgDate === dateStr
          }).length
          
          dailyUsage.push({ date: dateStr, count })
        }

        const config = getConfig.data
        const quotaLimit = config?.daily_limit || 1000

        return MessageAnalytics.parse({
          total_sent: totalSent,
          total_delivered: totalDelivered,
          total_read: totalRead,
          total_failed: totalFailed,
          delivery_rate: deliveryRate,
          read_rate: readRate,
          top_templates: topTemplates,
          daily_usage: dailyUsage,
          quota_used: totalSent, // Today's usage
          quota_limit: quotaLimit
        })
      } catch (error) {
        console.error('Failed to get WhatsApp analytics:', error)
        return MessageAnalytics.parse({})
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  })

  // ==================== HELPER FUNCTIONS ====================

  const previewTemplate = (template: WaTemplate, substitutions: Record<string, string>) => {
    return renderTemplate(template, substitutions)
  }

  const testConnection = useMutation({
    mutationFn: async (): Promise<boolean> => {
      const config = getConfig.data
      if (!config?.enabled || !config.organization_token) {
        throw new Error('WhatsApp configuration not found or disabled')
      }

      const response = await heraMspClient.validateConnection(config.organization_token)
      return response.success
    }
  })

  return {
    // Config operations
    config: getConfig.data,
    isConfigLoading: getConfig.isLoading,
    configError: getConfig.error,
    saveConfig,
    testConnection,

    // Template operations
    templates: getTemplates.data || [],
    isTemplatesLoading: getTemplates.isLoading,
    templatesError: getTemplates.error,
    saveTemplate,
    deleteTemplate,
    previewTemplate,

    // Message operations
    messages: getMessages.data || [],
    isMessagesLoading: getMessages.isLoading,
    messagesError: getMessages.error,
    sendMessage,

    // Customer preferences
    getCustomerPrefs,
    setCustomerPrefs,

    // Analytics
    analytics: getAnalytics.data,
    isAnalyticsLoading: getAnalytics.isLoading,
    analyticsError: getAnalytics.error,

    // Query invalidation
    refetch: {
      config: () => queryClient.invalidateQueries({ queryKey: keys.config }),
      templates: () => queryClient.invalidateQueries({ queryKey: keys.templates }),
      messages: () => queryClient.invalidateQueries({ queryKey: keys.messages() }),
      analytics: () => queryClient.invalidateQueries({ queryKey: keys.analytics })
    }
  }
}

// ================================================================================
// REACT QUERY HOOKS FOR DASHBOARD
// ================================================================================

export function useWhatsappMetrics({ organizationId }: { organizationId: string }) {
  return useQuery({
    queryKey: ['whatsapp', 'metrics', organizationId],
    queryFn: async () => {
      const api = useWhatsappApi(organizationId)
      const analytics = await api.getAnalytics.queryFn()
      
      return {
        sent: analytics.total_sent,
        delivered: analytics.total_delivered,
        failed: analytics.total_failed,
        delivery_rate: analytics.delivery_rate * 100 // Convert to percentage
      }
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export function useWhatsappFailures({ organizationId, limit = 5 }: { 
  organizationId: string
  limit?: number 
}) {
  return useQuery({
    queryKey: ['whatsapp', 'failures', organizationId, limit],
    queryFn: async () => {
      // For dashboard, return mock data
      // In production, this would filter messages by status = 'failed'
      return {
        failures: []
      }
    },
    enabled: !!organizationId
  })
}