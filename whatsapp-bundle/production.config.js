// WhatsApp Enterprise Production Configuration
// This file contains production-ready settings for deployment

module.exports = {
  // WhatsApp Business API Configuration
  whatsapp: {
    apiVersion: 'v18.0',
    baseUrl: 'https://graph.facebook.com',
    webhookPath: '/api/v1/whatsapp/webhook',
    messageTypes: ['text', 'image', 'document', 'audio', 'video', 'location'],
    maxFileSize: 16 * 1024 * 1024, // 16MB
    allowedFileTypes: {
      image: ['jpeg', 'jpg', 'png', 'webp'],
      document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
      video: ['mp4', 'mpeg', 'webm'],
      audio: ['aac', 'mp3', 'ogg', 'amr']
    }
  },

  // Rate Limiting Configuration
  rateLimits: {
    messages: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // per user
      message: 'Too many messages sent. Please try again later.'
    },
    webhooks: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10000,
      message: 'Webhook rate limit exceeded'
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // per IP
      message: 'Too many requests from this IP'
    }
  },

  // Auto-Refresh Configuration
  autoRefresh: {
    enabled: true,
    interval: 5000, // 5 seconds
    maxRetries: 3,
    retryDelay: 1000
  },

  // 24-Hour Window Configuration
  customerServiceWindow: {
    hours: 24,
    warningThreshold: 20, // Show warning at 20 hours
    templateRequired: true,
    allowedOutsideWindow: ['template', 'interactive']
  },

  // Message Status Configuration
  messageStatus: {
    trackingEnabled: true,
    statusTypes: ['sent', 'delivered', 'read', 'failed'],
    retentionDays: 30,
    webhookTimeout: 30000 // 30 seconds
  },

  // Security Configuration
  security: {
    webhookSignatureVerification: true,
    encryptSensitiveData: true,
    sanitizeUserInput: true,
    maxMessageLength: 4096,
    allowedOrigins: [
      'https://app.heraerp.com',
      'https://*.heraerp.com'
    ]
  },

  // Performance Configuration
  performance: {
    enableCaching: true,
    cacheTimeout: {
      conversations: 5 * 60 * 1000, // 5 minutes
      messages: 2 * 60 * 1000, // 2 minutes
      templates: 60 * 60 * 1000 // 1 hour
    },
    pagination: {
      conversations: 50,
      messages: 100,
      defaultLimit: 20
    }
  },

  // Monitoring Configuration
  monitoring: {
    enableMetrics: true,
    enableLogging: true,
    logLevel: 'info', // error, warn, info, debug
    errorReporting: true,
    performanceTracking: true,
    customDimensions: {
      organizationId: true,
      messageType: true,
      statusType: true
    }
  },

  // Feature Flags
  features: {
    voiceMessages: false, // Coming soon
    videoCall: false, // Coming soon
    groupChat: false, // Coming soon
    broadcastLists: true,
    interactiveMessages: true,
    templateMessages: true,
    mediaMessages: true,
    statusUpdates: true,
    agentAssignment: true,
    autoJournalPosting: true
  },

  // HERA Integration
  hera: {
    enforceUniversalArchitecture: true,
    smartCodePrefix: 'HERA.WHATSAPP',
    auditTrailEnabled: true,
    multiTenantIsolation: true,
    organizationIdRequired: true
  },

  // Error Messages
  errorMessages: {
    OUTSIDE_WINDOW: 'Cannot send message: Outside 24-hour customer service window. Please use a template message.',
    RATE_LIMIT: 'Message rate limit exceeded. Please wait before sending more messages.',
    INVALID_PHONE: 'Invalid WhatsApp phone number format.',
    TEMPLATE_NOT_FOUND: 'Message template not found or not approved.',
    WEBHOOK_FAILED: 'Failed to process WhatsApp webhook.',
    UNAUTHORIZED: 'Unauthorized access to WhatsApp resources.',
    SERVER_ERROR: 'An error occurred processing your request. Please try again.'
  },

  // Template Categories
  templateCategories: {
    TRANSACTIONAL: ['appointment_confirmation', 'appointment_reminder', 'order_update'],
    MARKETING: ['promotional_offer', 'feedback_request', 'survey'],
    UTILITY: ['service_message', 'account_update', 'verification']
  }
};