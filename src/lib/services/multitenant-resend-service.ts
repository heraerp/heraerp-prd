import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { encryptedConfigService } from '@/lib/security/encrypted-config-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
  headers?: Record<string, string>;
}

interface ResendResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

interface OrganizationConnector {
  id: string;
  status: string;
  from_email: string;
  rate_limit: number;
  encryption_enabled: boolean;
}

export class MultiTenantResendService {
  private resendClients: Map<string, Resend> = new Map();
  private connectorCache: Map<string, OrganizationConnector> = new Map();
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map();

  async getOrganizationConnector(organizationId: string): Promise<OrganizationConnector | null> {
    // Check cache first
    if (this.connectorCache.has(organizationId)) {
      return this.connectorCache.get(organizationId)!;
    }

    // Get connector configuration from database
    const { data: connector, error } = await supabase
      .from('core_entities')
      .select('id, status, core_dynamic_data(*)')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'comm_connector')
      .eq('smart_code', 'HERA.PUBLICSECTOR.COMM.CONNECTOR.RESEND.V1')
      .single();

    if (error || !connector) {
      console.error(`No Resend connector found for organization ${organizationId}`);
      return null;
    }

    // Parse dynamic data
    const dynamicData = connector.core_dynamic_data || [];
    const config: OrganizationConnector = {
      id: connector.id,
      status: connector.status,
      from_email: this.getDynamicValue(dynamicData, 'from_email') || 'noreply@heraerp.com',
      rate_limit: parseInt(this.getDynamicValue(dynamicData, 'rate_limit_per_hour') || '100'),
      encryption_enabled: this.getDynamicValue(dynamicData, 'encryption_enabled') === 'true'
    };

    // Cache the configuration
    this.connectorCache.set(organizationId, config);
    return config;
  }

  private getDynamicValue(dynamicData: any[], fieldName: string): string | null {
    const field = dynamicData.find(d => d.field_name === fieldName);
    return field?.field_value_text || field?.field_value_number?.toString() || field?.field_value_boolean?.toString() || null;
  }

  async getResendClient(organizationId: string): Promise<Resend | null> {
    // Check if client already exists
    if (this.resendClients.has(organizationId)) {
      return this.resendClients.get(organizationId)!;
    }

    // Get encrypted API key
    const apiKey = await encryptedConfigService.getResendApiKey(organizationId);
    
    if (!apiKey) {
      console.error(`No Resend API key configured for organization ${organizationId}`);
      return null;
    }

    // Create and cache the Resend client
    const resendClient = new Resend(apiKey);
    this.resendClients.set(organizationId, resendClient);
    
    return resendClient;
  }

  async checkRateLimit(organizationId: string, connector: OrganizationConnector): Promise<boolean> {
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    
    if (!this.rateLimitTracker.has(organizationId)) {
      this.rateLimitTracker.set(organizationId, { count: 0, resetTime: now + hourMs });
      return true;
    }

    const tracker = this.rateLimitTracker.get(organizationId)!;
    
    // Reset if hour has passed
    if (now > tracker.resetTime) {
      tracker.count = 0;
      tracker.resetTime = now + hourMs;
    }

    // Check if rate limit exceeded
    if (tracker.count >= connector.rate_limit) {
      return false;
    }

    return true;
  }

  async sendEmail(organizationId: string, emailOptions: EmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      // Get organization connector configuration
      const connector = await this.getOrganizationConnector(organizationId);
      if (!connector) {
        return {
          success: false,
          error: 'Resend connector not configured for organization'
        };
      }

      // Check connector status
      if (connector.status !== 'active') {
        return {
          success: false,
          error: `Resend connector status is ${connector.status}. Please activate the connector.`
        };
      }

      // Check rate limit
      const rateLimitOk = await this.checkRateLimit(organizationId, connector);
      if (!rateLimitOk) {
        return {
          success: false,
          error: `Rate limit exceeded. Maximum ${connector.rate_limit} emails per hour.`
        };
      }

      // Get Resend client
      const resendClient = await this.getResendClient(organizationId);
      if (!resendClient) {
        return {
          success: false,
          error: 'Resend API key not configured for organization'
        };
      }

      // Prepare email data
      const emailData = {
        ...emailOptions,
        from: emailOptions.from || connector.from_email,
        tags: [
          ...( emailOptions.tags || []),
          { name: 'organization_id', value: organizationId },
          { name: 'source', value: 'hera_multitenant' }
        ]
      };

      // Send email
      const result = await resendClient.emails.send(emailData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Update rate limit tracker
      const tracker = this.rateLimitTracker.get(organizationId)!;
      tracker.count++;

      // Log successful email
      await this.logEmailEvent(organizationId, {
        event_type: 'email_sent',
        message_id: result.data?.id,
        recipient: Array.isArray(emailOptions.to) ? emailOptions.to : [emailOptions.to],
        subject: emailOptions.subject,
        from: emailData.from,
        connector_id: connector.id
      });

      return {
        success: true,
        messageId: result.data?.id
      };

    } catch (error: any) {
      console.error('Error sending email:', error);

      // Log failed email
      await this.logEmailEvent(organizationId, {
        event_type: 'email_failed',
        error: error.message,
        recipient: Array.isArray(emailOptions.to) ? emailOptions.to : [emailOptions.to],
        subject: emailOptions.subject
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  private async logEmailEvent(organizationId: string, eventData: any): Promise<void> {
    try {
      await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'email_event',
          transaction_code: `EMAIL-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.COMM.EMAIL.EVENT.V1',
          total_amount: 0,
          metadata: {
            ...eventData,
            timestamp: new Date().toISOString(),
            service: 'resend'
          }
        });
    } catch (error) {
      console.error('Failed to log email event:', error);
    }
  }

  async validateConfiguration(organizationId: string): Promise<{
    valid: boolean;
    issues: string[];
    connector?: OrganizationConnector;
  }> {
    const issues: string[] = [];

    // Check if connector exists
    const connector = await this.getOrganizationConnector(organizationId);
    if (!connector) {
      issues.push('Resend connector not found for organization');
      return { valid: false, issues };
    }

    // Check connector status
    if (connector.status !== 'active') {
      issues.push(`Connector status is ${connector.status}, should be active`);
    }

    // Check API key
    const apiKey = await encryptedConfigService.getResendApiKey(organizationId);
    if (!apiKey) {
      issues.push('Resend API key not configured');
    } else if (!apiKey.startsWith('re_')) {
      issues.push('Invalid Resend API key format');
    }

    // Check from email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(connector.from_email)) {
      issues.push('Invalid from email address format');
    }

    return {
      valid: issues.length === 0,
      issues,
      connector: issues.length === 0 ? connector : undefined
    };
  }

  async testConnection(organizationId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      // Validate configuration
      const validation = await this.validateConfiguration(organizationId);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Configuration validation failed',
          details: { issues: validation.issues }
        };
      }

      // Get Resend client and test with a simple API call
      const resendClient = await this.getResendClient(organizationId);
      if (!resendClient) {
        return {
          success: false,
          message: 'Failed to initialize Resend client'
        };
      }

      // Test by getting account details (doesn't send an email)
      const accountResult = await resendClient.domains.list();
      
      return {
        success: true,
        message: 'Connection test successful',
        details: {
          domains: accountResult.data?.data?.length || 0,
          connector: validation.connector
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Connection test failed',
        details: { error: error.message }
      };
    }
  }

  // Clear cached client when API key is updated
  async invalidateClient(organizationId: string): Promise<void> {
    this.resendClients.delete(organizationId);
    this.connectorCache.delete(organizationId);
  }

  // Get email statistics for organization
  async getEmailStatistics(organizationId: string, days: number = 7): Promise<{
    totalSent: number;
    totalFailed: number;
    successRate: number;
    rateLimitHits: number;
  }> {
    const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString();

    const { data: events } = await supabase
      .from('universal_transactions')
      .select('metadata')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'email_event')
      .gte('created_at', since);

    const stats = {
      totalSent: 0,
      totalFailed: 0,
      successRate: 0,
      rateLimitHits: 0
    };

    events?.forEach(event => {
      const metadata = event.metadata;
      if (metadata.event_type === 'email_sent') {
        stats.totalSent++;
      } else if (metadata.event_type === 'email_failed') {
        stats.totalFailed++;
        if (metadata.error?.includes('rate limit')) {
          stats.rateLimitHits++;
        }
      }
    });

    const total = stats.totalSent + stats.totalFailed;
    stats.successRate = total > 0 ? (stats.totalSent / total) * 100 : 0;

    return stats;
  }
}

// Export singleton instance
export const multiTenantResendService = new MultiTenantResendService();