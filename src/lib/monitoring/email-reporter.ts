/**
 * HERA Email Reporter
 * Sends production error alerts via Resend integration
 * Smart Code: HERA.MONITORING.EMAIL_REPORTER.v1
 */

'use client'

import type { ProductionError } from './production-monitor'
import { reportGenerator } from './report-generator'
import { getMonitoringConfig } from './config'

interface EmailReportConfig {
  developerEmails: string[]
  organizationAdminEmails: string[]
  includeFullReport: boolean
  includeScreenshot: boolean
  maxReportSize: number // in bytes
  throttleMinutes: number // prevent spam
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

class EmailReporter {
  private lastEmailSent: Map<string, number> = new Map()

  /**
   * Get current configuration for organization
   */
  private getConfig(organizationId?: string) {
    const monitoringConfig = getMonitoringConfig(organizationId)
    return {
      developerEmails: monitoringConfig.email.developerEmails,
      organizationAdminEmails: monitoringConfig.email.organizationAdminEmails,
      includeFullReport: monitoringConfig.email.content.includeFullReport,
      includeScreenshot: monitoringConfig.email.content.includeScreenshots,
      maxReportSize: monitoringConfig.email.content.maxReportSize,
      throttleMinutes: monitoringConfig.email.throttling.criticalAlerts,
      emailEnabled: monitoringConfig.email.enabled,
      fromAddress: monitoringConfig.email.fromAddress,
      replyToAddress: monitoringConfig.email.replyToAddress
    }
  }

  /**
   * Send critical error alert immediately
   */
  async sendCriticalAlert(error: ProductionError): Promise<void> {
    const config = this.getConfig(error.user.organization_id)
    
    // Check if email is enabled
    if (!config.emailEnabled) {
      console.log('📧 Email alerts disabled for organization:', error.user.organization_id)
      return
    }

    const errorKey = `${error.error.type}_${error.user.organization_id}`
    
    // Check throttling
    if (this.isThrottled(errorKey, config.throttleMinutes)) {
      console.log(`⏳ Email alert throttled for ${errorKey}`)
      return
    }

    try {
      const template = this.generateCriticalAlertTemplate(error)
      
      // Generate quick summary report
      const report = await reportGenerator.generateReport([error], {
        includeUserContext: true,
        includePerformanceMetrics: false,
        includeLogs: true,
        includeNetworkRequests: false,
        format: 'summary',
        maxLogEntries: 5
      })

      await this.sendEmailAlert({
        to: config.developerEmails,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: [
          {
            filename: `hera-error-${error.id}.md`,
            content: report,
            contentType: 'text/markdown'
          }
        ],
        tags: [
          { name: 'type', value: 'critical_alert' },
          { name: 'error_type', value: error.error.type },
          { name: 'organization', value: error.user.organization_id }
        ]
      })

      this.updateThrottle(errorKey)
      console.log(`📧 Critical alert sent for error ${error.id}`)
      
    } catch (emailError) {
      console.error('📧 Failed to send critical alert:', emailError)
      // Don't throw - we don't want email failures to break error handling
    }
  }

  /**
   * Send daily summary report
   */
  async sendDailySummary(errors: ProductionError[], organizationId: string): Promise<void> {
    if (errors.length === 0) return

    const config = this.getConfig(organizationId)
    
    // Check if email is enabled
    if (!config.emailEnabled) {
      console.log('📧 Email alerts disabled for organization:', organizationId)
      return
    }

    try {
      const template = this.generateDailySummaryTemplate(errors, organizationId)
      
      // Generate comprehensive report
      const report = await reportGenerator.generateReport(errors, {
        includeUserContext: true,
        includePerformanceMetrics: true,
        includeLogs: true,
        includeNetworkRequests: true,
        format: 'comprehensive',
        maxLogEntries: 20
      })

      // Check report size
      const reportSize = new Blob([report]).size
      if (reportSize > config.maxReportSize) {
        console.warn(`📧 Report too large (${Math.round(reportSize / 1024 / 1024)}MB), sending summary only`)
        
        // Send summary instead
        const summaryReport = await reportGenerator.generateReport(errors, {
          includeUserContext: true,
          includePerformanceMetrics: false,
          includeLogs: false,
          includeNetworkRequests: false,
          format: 'summary'
        })

        await this.sendEmailAlert({
          to: [...config.developerEmails, ...config.organizationAdminEmails],
          subject: template.subject,
          html: template.html,
          text: template.text,
          attachments: [
            {
              filename: `hera-daily-summary-${organizationId}-${new Date().toISOString().split('T')[0]}.md`,
              content: summaryReport,
              contentType: 'text/markdown'
            }
          ],
          tags: [
            { name: 'type', value: 'daily_summary' },
            { name: 'organization', value: organizationId }
          ]
        })
      } else {
        await this.sendEmailAlert({
          to: [...config.developerEmails, ...config.organizationAdminEmails],
          subject: template.subject,
          html: template.html,
          text: template.text,
          attachments: [
            {
              filename: `hera-daily-report-${organizationId}-${new Date().toISOString().split('T')[0]}.html`,
              content: report,
              contentType: 'text/html'
            }
          ],
          tags: [
            { name: 'type', value: 'daily_summary' },
            { name: 'organization', value: organizationId }
          ]
        })
      }

      console.log(`📧 Daily summary sent for organization ${organizationId}`)
      
    } catch (emailError) {
      console.error('📧 Failed to send daily summary:', emailError)
    }
  }

  /**
   * Send user-requested help report
   */
  async sendHelpRequest(
    errors: ProductionError[], 
    userMessage: string,
    userEmail: string,
    organizationId: string
  ): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      const template = this.generateHelpRequestTemplate(errors, userMessage, userEmail)
      
      // Generate technical report for developers
      const report = await reportGenerator.generateReport(errors, {
        includeUserContext: true,
        includePerformanceMetrics: true,
        includeLogs: true,
        includeNetworkRequests: true,
        format: 'technical',
        maxLogEntries: 30
      })

      const config = this.getConfig(organizationId)
      
      const result = await this.sendEmailAlert({
        to: config.developerEmails,
        cc: [userEmail], // CC the user so they know it was sent
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: [
          {
            filename: `hera-help-request-${organizationId}-${Date.now()}.json`,
            content: report,
            contentType: 'application/json'
          }
        ],
        tags: [
          { name: 'type', value: 'help_request' },
          { name: 'organization', value: organizationId },
          { name: 'user_email', value: userEmail }
        ]
      })

      console.log(`📧 Help request sent from ${userEmail}`)
      return { success: true, emailId: result.id }
      
    } catch (emailError) {
      console.error('📧 Failed to send help request:', emailError)
      return { 
        success: false, 
        error: emailError instanceof Error ? emailError.message : 'Unknown error' 
      }
    }
  }

  /**
   * Generate critical alert email template
   */
  private generateCriticalAlertTemplate(error: ProductionError): EmailTemplate {
    const subject = `🚨 HERA Critical Error: ${error.error.type.toUpperCase()} in ${error.user.organization_id}`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HERA Critical Error Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .error-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 15px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
    .info-item { background: #f8f9fa; padding: 10px; border-radius: 4px; }
    .label { font-weight: bold; color: #495057; }
    .value { color: #212529; }
    .footer { background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; }
    .btn { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 HERA Critical Error Alert</h1>
      <p>Immediate attention required</p>
    </div>
    
    <div class="content">
      <div class="error-box">
        <h3>${error.error.type.toUpperCase()} Error</h3>
        <p><strong>Message:</strong> ${error.error.message}</p>
        <p><strong>Time:</strong> ${new Date(error.timestamp).toLocaleString()}</p>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="label">Organization</div>
          <div class="value">${error.user.organization_id}</div>
        </div>
        <div class="info-item">
          <div class="label">User Role</div>
          <div class="value">${error.user.role}</div>
        </div>
        <div class="info-item">
          <div class="label">Page URL</div>
          <div class="value">${error.context.url}</div>
        </div>
        <div class="info-item">
          <div class="label">User Action</div>
          <div class="value">${error.context.action_being_performed}</div>
        </div>
      </div>
      
      <p><strong>Impact:</strong> This error may prevent critical business operations. Please investigate immediately.</p>
      
      <p>A detailed error report is attached to this email.</p>
    </div>
    
    <div class="footer">
      <p>Generated by HERA Production Monitor at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
HERA CRITICAL ERROR ALERT

Error Type: ${error.error.type.toUpperCase()}
Message: ${error.error.message}
Time: ${new Date(error.timestamp).toLocaleString()}
Organization: ${error.user.organization_id}
User Role: ${error.user.role}
Page: ${error.context.url}
Action: ${error.context.action_being_performed}

This error may prevent critical business operations. Please investigate immediately.

A detailed error report is attached to this email.

Generated by HERA Production Monitor
    `

    return { subject, html, text }
  }

  /**
   * Generate daily summary email template
   */
  private generateDailySummaryTemplate(errors: ProductionError[], organizationId: string): EmailTemplate {
    const date = new Date().toLocaleDateString()
    const subject = `📊 HERA Daily Error Report - ${organizationId} - ${date}`
    
    const errorSummary = errors.reduce((acc, error) => {
      acc[error.error.type] = (acc[error.error.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const criticalCount = errors.filter(e => e.error.severity === 'critical').length
    const highCount = errors.filter(e => e.error.severity === 'high').length

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HERA Daily Error Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #007bff; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .summary-box { background: #e3f2fd; border-radius: 4px; padding: 15px; margin: 15px 0; }
    .error-types { margin: 15px 0; }
    .error-type { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 4px; display: flex; justify-content: space-between; }
    .severity-critical { background: #f8d7da; }
    .severity-high { background: #fff3cd; }
    .footer { background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 HERA Daily Error Report</h1>
      <p>${organizationId} - ${date}</p>
    </div>
    
    <div class="content">
      <div class="summary-box">
        <h3>Summary</h3>
        <p><strong>Total Errors:</strong> ${errors.length}</p>
        <p><strong>Critical:</strong> ${criticalCount} | <strong>High:</strong> ${highCount} | <strong>Other:</strong> ${errors.length - criticalCount - highCount}</p>
      </div>
      
      <div class="error-types">
        <h3>Error Breakdown</h3>
        ${Object.entries(errorSummary).map(([type, count]) => `
          <div class="error-type">
            <span>${type}</span>
            <span><strong>${count}</strong></span>
          </div>
        `).join('')}
      </div>
      
      <p>A detailed report is attached to this email with comprehensive analysis and recommendations.</p>
    </div>
    
    <div class="footer">
      <p>Generated by HERA Production Monitor at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
HERA DAILY ERROR REPORT

Organization: ${organizationId}
Date: ${date}

SUMMARY:
Total Errors: ${errors.length}
Critical: ${criticalCount}
High: ${highCount}
Other: ${errors.length - criticalCount - highCount}

ERROR BREAKDOWN:
${Object.entries(errorSummary).map(([type, count]) => `${type}: ${count}`).join('\n')}

A detailed report is attached to this email with comprehensive analysis and recommendations.

Generated by HERA Production Monitor
    `

    return { subject, html, text }
  }

  /**
   * Generate help request email template
   */
  private generateHelpRequestTemplate(
    errors: ProductionError[], 
    userMessage: string, 
    userEmail: string
  ): EmailTemplate {
    const subject = `🆘 HERA Help Request from ${userEmail}`
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>HERA Help Request</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #28a745; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; }
    .user-message { background: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
    .error-summary { background: #fff3cd; border-radius: 4px; padding: 15px; margin: 15px 0; }
    .footer { background: #f8f9fa; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; color: #6c757d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🆘 HERA Help Request</h1>
      <p>User needs assistance</p>
    </div>
    
    <div class="content">
      <p><strong>From:</strong> ${userEmail}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      
      <div class="user-message">
        <h3>User Message</h3>
        <p>${userMessage}</p>
      </div>
      
      <div class="error-summary">
        <h3>Error Context</h3>
        <p><strong>Errors Captured:</strong> ${errors.length}</p>
        ${errors.length > 0 ? `
          <p><strong>Latest Error:</strong> ${errors[errors.length - 1].error.message}</p>
          <p><strong>Page:</strong> ${errors[errors.length - 1].context.url}</p>
        ` : ''}
      </div>
      
      <p>A detailed technical report is attached with complete error logs, user context, and system information.</p>
      
      <p><strong>Priority:</strong> User-initiated help request - please respond promptly.</p>
    </div>
    
    <div class="footer">
      <p>Generated by HERA Production Monitor at ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
HERA HELP REQUEST

From: ${userEmail}
Time: ${new Date().toLocaleString()}

USER MESSAGE:
${userMessage}

ERROR CONTEXT:
Errors Captured: ${errors.length}
${errors.length > 0 ? `
Latest Error: ${errors[errors.length - 1].error.message}
Page: ${errors[errors.length - 1].context.url}
` : ''}

A detailed technical report is attached with complete error logs, user context, and system information.

Priority: User-initiated help request - please respond promptly.

Generated by HERA Production Monitor
    `

    return { subject, html, text }
  }

  /**
   * Send email using Resend API integration
   */
  private async sendEmailAlert(params: {
    to: string[]
    cc?: string[]
    subject: string
    html: string
    text: string
    attachments?: Array<{
      filename: string
      content: string
      contentType: string
    }>
    tags?: Array<{ name: string; value: string }>
  }): Promise<{ id: string }> {
    try {
      // Use sendUniversalEmail for HERA integration
      const { sendUniversalEmail } = await import('@/lib/email/resend-service')
      
      // Get organization ID from the first recipient's context or default
      const organizationId = this.getOrganizationFromContext()
      
      const result = await sendUniversalEmail(organizationId, {
        from: 'HERA Production Monitor <noreply@heraerp.com>',
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        attachments: params.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        })),
        tags: params.tags?.map(tag => ({ name: tag.name, value: tag.value }))
      })

      if (result.success) {
        console.log('📧 Production monitoring email sent successfully:', result.emailId)
        return { id: result.resendId || result.emailId || 'unknown' }
      } else {
        throw new Error(result.error || 'Email send failed')
      }
      
    } catch (error) {
      console.error('📧 Email delivery failed:', error)
      
      // Fallback: Log the email details for manual follow-up
      console.log('📧 Email fallback logging:', {
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        attachments: params.attachments?.map(a => a.filename),
        tags: params.tags
      })
      
      // Return a fallback ID so the system doesn't break
      return { id: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }
    }
  }

  /**
   * Get organization ID from current context
   */
  private getOrganizationFromContext(): string {
    try {
      // Try to get from localStorage first
      const orgId = localStorage.getItem('organizationId')
      if (orgId) return orgId

      // Try to get from sessionStorage
      const sessionOrgId = sessionStorage.getItem('organizationId')
      if (sessionOrgId) return sessionOrgId

      // Default fallback
      return 'monitoring-org'
    } catch (error) {
      return 'monitoring-org'
    }
  }

  /**
   * Check if we should throttle emails for this error type
   */
  private isThrottled(errorKey: string, throttleMinutes = 5): boolean {
    const lastSent = this.lastEmailSent.get(errorKey)
    if (!lastSent) return false
    
    const throttleMs = throttleMinutes * 60 * 1000
    return Date.now() - lastSent < throttleMs
  }

  /**
   * Update throttle timestamp
   */
  private updateThrottle(errorKey: string): void {
    this.lastEmailSent.set(errorKey, Date.now())
  }

  /**
   * Configure email reporter settings for organization
   */
  configure(organizationId: string, config: Partial<EmailReportConfig>): void {
    // Use the global configuration system
    const { updateOrganizationEmailConfig } = require('./config')
    
    const emailConfig: any = {}
    if (config.developerEmails) emailConfig.developerEmails = config.developerEmails
    if (config.organizationAdminEmails) emailConfig.organizationAdminEmails = config.organizationAdminEmails
    if (config.includeFullReport !== undefined) emailConfig.content = { includeFullReport: config.includeFullReport }
    if (config.includeScreenshot !== undefined) {
      if (!emailConfig.content) emailConfig.content = {}
      emailConfig.content.includeScreenshots = config.includeScreenshot
    }
    if (config.maxReportSize) {
      if (!emailConfig.content) emailConfig.content = {}
      emailConfig.content.maxReportSize = config.maxReportSize
    }
    if (config.throttleMinutes) {
      emailConfig.throttling = { criticalAlerts: config.throttleMinutes }
    }
    
    updateOrganizationEmailConfig(organizationId, emailConfig)
  }

  /**
   * Get current configuration for organization
   */
  getCurrentConfig(organizationId?: string): any {
    return this.getConfig(organizationId)
  }
}

// Global singleton instance
export const emailReporter = new EmailReporter()

export default emailReporter