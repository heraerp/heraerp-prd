/**
 * HERA Production Monitoring Configuration
 * Centralized configuration for monitoring system
 * Smart Code: HERA.MONITORING.CONFIG.v1
 */

export interface MonitoringConfig {
  // Email Configuration
  email: {
    enabled: boolean
    developerEmails: string[]
    organizationAdminEmails: string[]
    fromAddress: string
    replyToAddress?: string
    
    // Email throttling settings
    throttling: {
      criticalAlerts: number // minutes between critical alerts of same type
      helpRequests: number   // minutes between help requests from same user
      dailySummary: boolean  // send daily summaries
      summaryTime: string    // time to send daily summary (HH:MM format)
    }
    
    // Email content settings
    content: {
      includeFullReport: boolean
      includeScreenshots: boolean
      maxReportSize: number // in bytes
      attachmentFormats: ('json' | 'html' | 'markdown')[]
    }
  }

  // Error Detection Configuration
  errorDetection: {
    enabled: boolean
    captureConsole: boolean
    captureNetwork: boolean
    capturePerformance: boolean
    captureUserActions: boolean
    
    // Buffer settings
    maxErrors: number
    maxLogs: number
    maxNetworkRequests: number
    
    // Error classification
    severityThresholds: {
      critical: string[]     // keywords that mark errors as critical
      high: string[]         // keywords that mark errors as high priority
      medium: string[]       // keywords that mark errors as medium priority
    }
  }

  // UI Configuration
  ui: {
    helpButton: {
      enabled: boolean
      variant: 'fab' | 'button' | 'text' | 'minimal'
      position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      size: 'sm' | 'md' | 'lg'
      
      // Page-specific overrides
      pageOverrides: Record<string, Partial<MonitoringConfig['ui']['helpButton']>>
    }
    
    dashboard: {
      enabled: boolean
      autoRefreshInterval: number // seconds
      maxErrorsToDisplay: number
      defaultTimeRange: '1h' | '6h' | '24h' | '7d'
    }
  }

  // Environment-specific settings
  environment: {
    development: Partial<MonitoringConfig>
    staging: Partial<MonitoringConfig>
    production: Partial<MonitoringConfig>
  }
}

// Default configuration
const DEFAULT_CONFIG: MonitoringConfig = {
  email: {
    enabled: true,
    developerEmails: [
      'developers@heraerp.com',
      'support@heraerp.com'
    ],
    organizationAdminEmails: [],
    fromAddress: 'HERA Production Monitor <noreply@heraerp.com>',
    replyToAddress: 'support@heraerp.com',
    
    throttling: {
      criticalAlerts: 5,
      helpRequests: 2,
      dailySummary: true,
      summaryTime: '09:00'
    },
    
    content: {
      includeFullReport: true,
      includeScreenshots: false,
      maxReportSize: 10 * 1024 * 1024, // 10MB
      attachmentFormats: ['html', 'json']
    }
  },

  errorDetection: {
    enabled: true,
    captureConsole: true,
    captureNetwork: true,
    capturePerformance: true,
    captureUserActions: true,
    
    maxErrors: 100,
    maxLogs: 50,
    maxNetworkRequests: 20,
    
    severityThresholds: {
      critical: [
        'payment', 'unauthorized', 'security', 'corruption', 
        'critical', 'fatal', 'emergency', 'transaction failed'
      ],
      high: [
        'api', 'server', 'database', 'network', 'timeout',
        'error', 'failed', 'exception', 'abort'
      ],
      medium: [
        'validation', 'ui', 'component', 'warning', 'deprecated'
      ]
    }
  },

  ui: {
    helpButton: {
      enabled: true,
      variant: 'fab',
      position: 'bottom-right',
      size: 'md',
      
      pageOverrides: {
        '/salon/pos': { size: 'lg' }, // Larger button for critical POS operations
        '/pos/sale': { size: 'lg' },
        '/admin': { variant: 'button', position: 'top-right' } // Different style for admin pages
      }
    },
    
    dashboard: {
      enabled: true,
      autoRefreshInterval: 30,
      maxErrorsToDisplay: 50,
      defaultTimeRange: '24h'
    }
  },

  environment: {
    development: {
      email: {
        enabled: false, // Disable emails in development
        developerEmails: ['developer@localhost']
      },
      errorDetection: {
        maxErrors: 20, // Smaller buffers for development
        maxLogs: 20
      }
    },
    
    staging: {
      email: {
        enabled: true,
        developerEmails: ['staging-team@heraerp.com']
      },
      errorDetection: {
        maxErrors: 50
      }
    },
    
    production: {
      email: {
        enabled: true,
        throttling: {
          criticalAlerts: 10, // More conservative throttling in production
          helpRequests: 5,
          dailySummary: true,
          summaryTime: '09:00'
        }
      },
      ui: {
        dashboard: {
          enabled: false, // Disable dashboard for regular users in production
          autoRefreshInterval: 30,
          maxErrorsToDisplay: 50,
          defaultTimeRange: '24h'
        }
      }
    }
  }
}

// Organization-specific configurations
const ORGANIZATION_CONFIGS: Record<string, Partial<MonitoringConfig>> = {
  // Hair Salon configuration
  'hair-salon-demo': {
    email: {
      organizationAdminEmails: ['manager@hairsalon.com'],
      throttling: {
        criticalAlerts: 2, // Faster alerts for customer-facing business
        helpRequests: 1,
        dailySummary: true,
        summaryTime: '09:00'
      }
    },
    errorDetection: {
      severityThresholds: {
        critical: [
          'payment', 'pos', 'appointment', 'customer', 'booking',
          ...DEFAULT_CONFIG.errorDetection.severityThresholds.critical
        ],
        high: DEFAULT_CONFIG.errorDetection.severityThresholds.high,
        medium: DEFAULT_CONFIG.errorDetection.severityThresholds.medium
      }
    }
  },

  // General business configuration
  'demo-org': {
    email: {
      organizationAdminEmails: ['admin@business.com'],
    }
  }
}

/**
 * Get monitoring configuration for current environment and organization
 */
export function getMonitoringConfig(organizationId?: string): MonitoringConfig {
  const env = process.env.NODE_ENV || 'development'
  
  // Start with default configuration
  let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as MonitoringConfig
  
  // Apply environment overrides
  if (config.environment[env as keyof typeof config.environment]) {
    config = mergeConfig(config, config.environment[env as keyof typeof config.environment])
  }
  
  // Apply organization-specific overrides
  if (organizationId && ORGANIZATION_CONFIGS[organizationId]) {
    config = mergeConfig(config, ORGANIZATION_CONFIGS[organizationId])
  }
  
  return config
}

/**
 * Deep merge two configuration objects
 */
function mergeConfig(base: any, override: any): any {
  const result = { ...base }
  
  for (const key in override) {
    if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
      result[key] = mergeConfig(base[key] || {}, override[key])
    } else {
      result[key] = override[key]
    }
  }
  
  return result
}

/**
 * Update email configuration for organization
 */
export function updateOrganizationEmailConfig(
  organizationId: string, 
  emailConfig: Partial<MonitoringConfig['email']>
): void {
  if (!ORGANIZATION_CONFIGS[organizationId]) {
    ORGANIZATION_CONFIGS[organizationId] = {}
  }
  
  if (!ORGANIZATION_CONFIGS[organizationId].email) {
    ORGANIZATION_CONFIGS[organizationId].email = {}
  }
  
  Object.assign(ORGANIZATION_CONFIGS[organizationId].email!, emailConfig)
}

/**
 * Get current configuration as JSON (for admin dashboard)
 */
export function getConfigurationSummary(organizationId?: string): any {
  const config = getMonitoringConfig(organizationId)
  
  return {
    environment: process.env.NODE_ENV || 'development',
    organizationId: organizationId || 'none',
    emailEnabled: config.email.enabled,
    developerEmails: config.email.developerEmails,
    helpButtonEnabled: config.ui.helpButton.enabled,
    errorDetectionEnabled: config.errorDetection.enabled,
    dashboardEnabled: config.ui.dashboard.enabled,
    throttling: config.email.throttling,
    bufferSizes: {
      maxErrors: config.errorDetection.maxErrors,
      maxLogs: config.errorDetection.maxLogs,
      maxNetworkRequests: config.errorDetection.maxNetworkRequests
    }
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<MonitoringConfig>): string[] {
  const errors: string[] = []
  
  if (config.email?.enabled && (!config.email.developerEmails || config.email.developerEmails.length === 0)) {
    errors.push('Developer emails are required when email is enabled')
  }
  
  if (config.email?.developerEmails) {
    config.email.developerEmails.forEach(email => {
      if (!email.includes('@')) {
        errors.push(`Invalid email format: ${email}`)
      }
    })
  }
  
  if (config.errorDetection?.maxErrors && config.errorDetection.maxErrors < 1) {
    errors.push('Max errors must be at least 1')
  }
  
  if (config.email?.throttling?.criticalAlerts && config.email.throttling.criticalAlerts < 0) {
    errors.push('Critical alert throttling cannot be negative')
  }
  
  return errors
}

export default {
  getMonitoringConfig,
  updateOrganizationEmailConfig,
  getConfigurationSummary,
  validateConfig,
  DEFAULT_CONFIG
}