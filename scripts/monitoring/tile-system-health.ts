#!/usr/bin/env node
/**
 * HERA Universal Tile System - Health Check Monitor
 * Comprehensive health monitoring and alerting for production tile system
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { performance } from 'perf_hooks'
import * as fs from 'fs/promises'
import * as path from 'path'

// Types
interface HealthCheckConfig {
  environment: 'development' | 'production'
  checks: {
    database: boolean
    api: boolean
    templates: boolean
    stats: boolean
    actions: boolean
    performance: boolean
  }
  thresholds: {
    responseTime: number // ms
    errorRate: number // percentage
    memoryUsage: number // MB
    cpuUsage: number // percentage
  }
  alerts: {
    enabled: boolean
    channels: ('console' | 'file' | 'webhook')[]
    webhookUrl?: string
  }
}

interface HealthCheckResult {
  timestamp: string
  environment: string
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, {
    status: 'pass' | 'warn' | 'fail'
    responseTime?: number
    details: string
    error?: string
  }>
  metrics: {
    responseTime: number
    errorRate: number
    throughput: number
  }
  recommendations: string[]
}

interface AlertPayload {
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: string
  environment: string
  checks: any
  metrics: any
}

// Configuration
const defaultConfig: HealthCheckConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  checks: {
    database: true,
    api: true,
    templates: true,
    stats: true,
    actions: true,
    performance: true
  },
  thresholds: {
    responseTime: 1000, // 1 second
    errorRate: 5, // 5%
    memoryUsage: 512, // 512 MB
    cpuUsage: 80 // 80%
  },
  alerts: {
    enabled: true,
    channels: ['console', 'file'],
    webhookUrl: process.env.HEALTH_CHECK_WEBHOOK_URL
  }
}

// Environment-specific configuration
const environments = {
  development: {
    supabaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    apiBaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co/functions/v1'
  },
  production: {
    supabaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY,
    apiBaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co/functions/v1'
  }
}

class TileSystemHealthMonitor {
  private config: HealthCheckConfig
  private supabase: any
  private env: any

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
    this.env = environments[this.config.environment]
    
    if (!this.env.supabaseKey) {
      throw new Error('SUPABASE_ANON_KEY environment variable is required')
    }

    this.supabase = createClient(this.env.supabaseUrl, this.env.supabaseKey)
  }

  async runHealthChecks(): Promise<HealthCheckResult> {
    const startTime = performance.now()
    const timestamp = new Date().toISOString()
    
    console.log(`🏥 Starting health checks for ${this.config.environment} environment...`)
    
    const checks: Record<string, any> = {}
    let passCount = 0
    let failCount = 0
    let warnCount = 0

    // Run all enabled health checks
    if (this.config.checks.database) {
      checks.database = await this.checkDatabase()
    }
    
    if (this.config.checks.api) {
      checks.api = await this.checkAPIEndpoints()
    }
    
    if (this.config.checks.templates) {
      checks.templates = await this.checkTileTemplates()
    }
    
    if (this.config.checks.stats) {
      checks.stats = await this.checkStatsExecution()
    }
    
    if (this.config.checks.actions) {
      checks.actions = await this.checkActionExecution()
    }
    
    if (this.config.checks.performance) {
      checks.performance = await this.checkPerformanceMetrics()
    }

    // Calculate overall health
    Object.values(checks).forEach((check: any) => {
      switch (check.status) {
        case 'pass': passCount++; break
        case 'warn': warnCount++; break
        case 'fail': failCount++; break
      }
    })

    const totalChecks = Object.keys(checks).length
    const overall = failCount > 0 ? 'unhealthy' : 
                   warnCount > totalChecks / 2 ? 'degraded' : 'healthy'

    const totalTime = performance.now() - startTime
    
    const result: HealthCheckResult = {
      timestamp,
      environment: this.config.environment,
      overall,
      checks,
      metrics: {
        responseTime: totalTime,
        errorRate: (failCount / totalChecks) * 100,
        throughput: totalChecks / (totalTime / 1000)
      },
      recommendations: this.generateRecommendations(checks, overall)
    }

    // Send alerts if needed
    await this.handleAlerts(result)

    return result
  }

  private async checkDatabase(): Promise<any> {
    const start = performance.now()
    
    try {
      // Test basic connectivity
      const { data: tables, error: tablesError } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1)

      if (tablesError) {
        return {
          status: 'fail',
          responseTime: performance.now() - start,
          details: 'Database connectivity failed',
          error: tablesError.message
        }
      }

      // Test core table availability
      const coreTablesCheck = await this.supabase
        .from('core_entities')
        .select('id')
        .limit(1)

      if (coreTablesCheck.error) {
        return {
          status: 'fail',
          responseTime: performance.now() - start,
          details: 'Core tables not accessible',
          error: coreTablesCheck.error.message
        }
      }

      // Test RPC function availability
      const { data: rpcTest, error: rpcError } = await this.supabase
        .rpc('hera_entities_crud_v1', {
          p_action: 'READ',
          p_actor_user_id: '00000000-0000-0000-0000-000000000000',
          p_organization_id: '00000000-0000-0000-0000-000000000000',
          p_entity: { entity_type: 'TEST' },
          p_dynamic: {},
          p_relationships: [],
          p_options: { limit: 1 }
        })

      const responseTime = performance.now() - start

      if (rpcError && !rpcError.message.includes('No entity found')) {
        return {
          status: 'warn',
          responseTime,
          details: 'RPC functions accessible but may have issues',
          error: rpcError.message
        }
      }

      if (responseTime > this.config.thresholds.responseTime) {
        return {
          status: 'warn',
          responseTime,
          details: `Database response time (${responseTime.toFixed(2)}ms) exceeds threshold`
        }
      }

      return {
        status: 'pass',
        responseTime,
        details: `Database healthy, response time: ${responseTime.toFixed(2)}ms`
      }

    } catch (error: any) {
      return {
        status: 'fail',
        responseTime: performance.now() - start,
        details: 'Database connection failed',
        error: error.message
      }
    }
  }

  private async checkAPIEndpoints(): Promise<any> {
    const start = performance.now()
    
    try {
      // Test API v2 health endpoint
      const healthUrl = `${this.env.apiBaseUrl}/api-v2/health`
      const response = await fetch(healthUrl)
      
      const responseTime = performance.now() - start

      if (response.status === 404) {
        // Health endpoint might not exist, try basic API endpoint
        return {
          status: 'warn',
          responseTime,
          details: 'Health endpoint not found, but API may be functional'
        }
      }

      if (!response.ok) {
        return {
          status: 'fail',
          responseTime,
          details: `API endpoint returned status: ${response.status}`,
          error: `HTTP ${response.status}`
        }
      }

      if (responseTime > this.config.thresholds.responseTime) {
        return {
          status: 'warn',
          responseTime,
          details: `API response time (${responseTime.toFixed(2)}ms) exceeds threshold`
        }
      }

      return {
        status: 'pass',
        responseTime,
        details: `API endpoints healthy, response time: ${responseTime.toFixed(2)}ms`
      }

    } catch (error: any) {
      return {
        status: 'fail',
        responseTime: performance.now() - start,
        details: 'API endpoint check failed',
        error: error.message
      }
    }
  }

  private async checkTileTemplates(): Promise<any> {
    const start = performance.now()
    
    try {
      // Query tile templates
      const { data: templates, error } = await this.supabase
        .from('core_entities')
        .select('id, entity_name, smart_code')
        .eq('entity_type', 'APP_TILE_TEMPLATE')
        .limit(10)

      const responseTime = performance.now() - start

      if (error) {
        return {
          status: 'fail',
          responseTime,
          details: 'Failed to query tile templates',
          error: error.message
        }
      }

      if (!templates || templates.length === 0) {
        return {
          status: 'fail',
          responseTime,
          details: 'No tile templates found in database'
        }
      }

      // Check for expected template types
      const expectedTemplates = ['ENTITIES', 'TRANSACTIONS', 'ANALYTICS', 'WORKFLOW', 'RELATIONSHIPS']
      const foundTemplates = templates.map((t: any) => 
        t.entity_name || t.smart_code?.split('.')[3]
      ).filter(Boolean)

      const missingTemplates = expectedTemplates.filter(expected => 
        !foundTemplates.some(found => found.includes(expected))
      )

      if (missingTemplates.length > 0) {
        return {
          status: 'warn',
          responseTime,
          details: `Missing template types: ${missingTemplates.join(', ')}. Found ${templates.length} templates total.`
        }
      }

      return {
        status: 'pass',
        responseTime,
        details: `Found ${templates.length} tile templates, all expected types present`
      }

    } catch (error: any) {
      return {
        status: 'fail',
        responseTime: performance.now() - start,
        details: 'Tile templates check failed',
        error: error.message
      }
    }
  }

  private async checkStatsExecution(): Promise<any> {
    const start = performance.now()
    
    try {
      // Test basic stats query
      const { data: statsData, error } = await this.supabase
        .from('core_entities')
        .select('count(*)')
        .eq('entity_type', 'APP_TILE_TEMPLATE')

      const responseTime = performance.now() - start

      if (error) {
        return {
          status: 'fail',
          responseTime,
          details: 'Stats query execution failed',
          error: error.message
        }
      }

      if (responseTime > this.config.thresholds.responseTime) {
        return {
          status: 'warn',
          responseTime,
          details: `Stats query response time (${responseTime.toFixed(2)}ms) exceeds threshold`
        }
      }

      return {
        status: 'pass',
        responseTime,
        details: `Stats execution healthy, response time: ${responseTime.toFixed(2)}ms`
      }

    } catch (error: any) {
      return {
        status: 'fail',
        responseTime: performance.now() - start,
        details: 'Stats execution check failed',
        error: error.message
      }
    }
  }

  private async checkActionExecution(): Promise<any> {
    const start = performance.now()
    
    try {
      // Test action-related queries
      const { data: actionData, error } = await this.supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text')
        .eq('field_name', 'actions')
        .limit(5)

      const responseTime = performance.now() - start

      if (error) {
        return {
          status: 'fail',
          responseTime,
          details: 'Action data query failed',
          error: error.message
        }
      }

      return {
        status: 'pass',
        responseTime,
        details: `Action execution check passed, response time: ${responseTime.toFixed(2)}ms`
      }

    } catch (error: any) {
      return {
        status: 'fail',
        responseTime: performance.now() - start,
        details: 'Action execution check failed',
        error: error.message
      }
    }
  }

  private async checkPerformanceMetrics(): Promise<any> {
    const start = performance.now()
    
    try {
      // Get memory usage
      const memoryUsage = process.memoryUsage()
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024

      // Simple performance test: multiple concurrent queries
      const concurrentQueries = Array.from({ length: 5 }, () =>
        this.supabase
          .from('core_entities')
          .select('count(*)')
          .limit(1)
      )

      const concurrentStart = performance.now()
      const results = await Promise.all(concurrentQueries)
      const concurrentTime = performance.now() - concurrentStart

      const responseTime = performance.now() - start

      // Check for any failed concurrent queries
      const failures = results.filter(r => r.error).length

      if (failures > 0) {
        return {
          status: 'warn',
          responseTime,
          details: `${failures}/${results.length} concurrent queries failed`
        }
      }

      if (heapUsedMB > this.config.thresholds.memoryUsage) {
        return {
          status: 'warn',
          responseTime,
          details: `High memory usage: ${heapUsedMB.toFixed(2)}MB (threshold: ${this.config.thresholds.memoryUsage}MB)`
        }
      }

      if (concurrentTime > this.config.thresholds.responseTime * 2) {
        return {
          status: 'warn',
          responseTime,
          details: `Concurrent query performance degraded: ${concurrentTime.toFixed(2)}ms`
        }
      }

      return {
        status: 'pass',
        responseTime,
        details: `Performance healthy. Memory: ${heapUsedMB.toFixed(2)}MB, Concurrent queries: ${concurrentTime.toFixed(2)}ms`
      }

    } catch (error: any) {
      return {
        status: 'fail',
        responseTime: performance.now() - start,
        details: 'Performance metrics check failed',
        error: error.message
      }
    }
  }

  private generateRecommendations(checks: Record<string, any>, overall: string): string[] {
    const recommendations: string[] = []

    // General recommendations based on overall health
    if (overall === 'unhealthy') {
      recommendations.push('🚨 CRITICAL: System requires immediate attention')
      recommendations.push('📞 Consider alerting on-call team')
    } else if (overall === 'degraded') {
      recommendations.push('⚠️ System performance is degraded')
      recommendations.push('📊 Monitor metrics closely')
    }

    // Specific recommendations based on check results
    Object.entries(checks).forEach(([checkName, result]) => {
      if (result.status === 'fail') {
        switch (checkName) {
          case 'database':
            recommendations.push('🗄️ Check database connectivity and performance')
            recommendations.push('📈 Consider scaling database resources')
            break
          case 'api':
            recommendations.push('🌐 Check API gateway and Edge Functions')
            recommendations.push('🔄 Consider redeploying Edge Functions')
            break
          case 'templates':
            recommendations.push('🧩 Verify tile template seeding script')
            recommendations.push('🔧 Re-run template creation process')
            break
          case 'performance':
            recommendations.push('⚡ Investigate performance bottlenecks')
            recommendations.push('📊 Review query optimization')
            break
        }
      } else if (result.status === 'warn') {
        switch (checkName) {
          case 'database':
            recommendations.push('🔍 Monitor database response times')
            break
          case 'api':
            recommendations.push('🌐 Monitor API response times')
            break
          case 'performance':
            recommendations.push('📊 Consider performance optimizations')
            break
        }
      }
    })

    // Add response time recommendations
    const slowChecks = Object.entries(checks).filter(([_, result]: any) => 
      result.responseTime && result.responseTime > this.config.thresholds.responseTime
    )

    if (slowChecks.length > 0) {
      recommendations.push(`⏱️ Slow response times detected in: ${slowChecks.map(([name]) => name).join(', ')}`)
    }

    return recommendations
  }

  private async handleAlerts(result: HealthCheckResult): Promise<void> {
    if (!this.config.alerts.enabled) return

    const severity = result.overall === 'unhealthy' ? 'critical' :
                    result.overall === 'degraded' ? 'warning' : 'info'

    if (severity === 'info' && result.overall === 'healthy') {
      // Don't send alerts for healthy systems unless explicitly requested
      return
    }

    const alert: AlertPayload = {
      severity,
      title: `HERA Tile System Health Check - ${result.overall.toUpperCase()}`,
      message: this.formatAlertMessage(result),
      timestamp: result.timestamp,
      environment: result.environment,
      checks: result.checks,
      metrics: result.metrics
    }

    // Send alerts through configured channels
    for (const channel of this.config.alerts.channels) {
      await this.sendAlert(channel, alert)
    }
  }

  private formatAlertMessage(result: HealthCheckResult): string {
    const emoji = result.overall === 'healthy' ? '✅' : 
                  result.overall === 'degraded' ? '⚠️' : '🚨'

    const failedChecks = Object.entries(result.checks)
      .filter(([_, check]: any) => check.status === 'fail')
      .map(([name]) => name)

    const warnChecks = Object.entries(result.checks)
      .filter(([_, check]: any) => check.status === 'warn')
      .map(([name]) => name)

    let message = `${emoji} HERA Tile System - ${result.overall.toUpperCase()}\n`
    message += `Environment: ${result.environment}\n`
    message += `Timestamp: ${result.timestamp}\n`
    message += `Response Time: ${result.metrics.responseTime.toFixed(2)}ms\n`
    message += `Error Rate: ${result.metrics.errorRate.toFixed(1)}%\n`

    if (failedChecks.length > 0) {
      message += `\n❌ FAILED CHECKS: ${failedChecks.join(', ')}\n`
    }

    if (warnChecks.length > 0) {
      message += `\n⚠️ WARNING CHECKS: ${warnChecks.join(', ')}\n`
    }

    if (result.recommendations.length > 0) {
      message += `\n📋 RECOMMENDATIONS:\n${result.recommendations.join('\n')}`
    }

    return message
  }

  private async sendAlert(channel: string, alert: AlertPayload): Promise<void> {
    try {
      switch (channel) {
        case 'console':
          console.log('\n' + '='.repeat(60))
          console.log(`🚨 ALERT: ${alert.title}`)
          console.log('='.repeat(60))
          console.log(alert.message)
          console.log('='.repeat(60) + '\n')
          break

        case 'file':
          await this.writeAlertToFile(alert)
          break

        case 'webhook':
          if (this.config.alerts.webhookUrl) {
            await this.sendWebhookAlert(alert)
          }
          break
      }
    } catch (error: any) {
      console.error(`Failed to send alert via ${channel}:`, error.message)
    }
  }

  private async writeAlertToFile(alert: AlertPayload): Promise<void> {
    const alertsDir = path.join(process.cwd(), 'logs', 'alerts')
    await fs.mkdir(alertsDir, { recursive: true })

    const filename = `tile-system-alert-${alert.timestamp.replace(/[:.]/g, '-')}.json`
    const filepath = path.join(alertsDir, filename)

    await fs.writeFile(filepath, JSON.stringify(alert, null, 2), 'utf8')
    console.log(`📄 Alert written to: ${filepath}`)
  }

  private async sendWebhookAlert(alert: AlertPayload): Promise<void> {
    if (!this.config.alerts.webhookUrl) return

    const response = await fetch(this.config.alerts.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(alert)
    })

    if (!response.ok) {
      throw new Error(`Webhook alert failed: ${response.status} ${response.statusText}`)
    }

    console.log(`🔗 Alert sent via webhook: ${response.status}`)
  }

  async generateReport(): Promise<string> {
    const result = await this.runHealthChecks()
    
    const report = `
# HERA Tile System Health Report

**Environment:** ${result.environment}
**Timestamp:** ${result.timestamp}
**Overall Status:** ${result.overall.toUpperCase()} ${result.overall === 'healthy' ? '✅' : result.overall === 'degraded' ? '⚠️' : '🚨'}

## Health Checks

${Object.entries(result.checks).map(([name, check]: any) => 
  `- **${name}**: ${check.status.toUpperCase()} ${check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌'}
  - ${check.details}
  - Response Time: ${check.responseTime?.toFixed(2) || 'N/A'}ms
  ${check.error ? `- Error: ${check.error}` : ''}
`).join('\n')}

## Metrics

- **Total Response Time:** ${result.metrics.responseTime.toFixed(2)}ms
- **Error Rate:** ${result.metrics.errorRate.toFixed(1)}%
- **Throughput:** ${result.metrics.throughput.toFixed(2)} checks/second

## Recommendations

${result.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by HERA Tile System Health Monitor*
    `

    return report.trim()
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const environment = (args[0] || process.env.NODE_ENV || 'development') as 'development' | 'production'
  
  const configOverrides: Partial<HealthCheckConfig> = {
    environment,
    alerts: {
      enabled: !args.includes('--no-alerts'),
      channels: ['console', 'file'],
      webhookUrl: process.env.HEALTH_CHECK_WEBHOOK_URL
    }
  }

  if (args.includes('--webhook-only')) {
    configOverrides.alerts!.channels = ['webhook']
  }

  const monitor = new TileSystemHealthMonitor(configOverrides)

  try {
    if (args.includes('--report')) {
      const report = await monitor.generateReport()
      console.log(report)
    } else {
      const result = await monitor.runHealthChecks()
      
      console.log('\n📊 HEALTH CHECK SUMMARY')
      console.log('='.repeat(50))
      console.log(`Overall Status: ${result.overall.toUpperCase()}`)
      console.log(`Environment: ${result.environment}`)
      console.log(`Total Time: ${result.metrics.responseTime.toFixed(2)}ms`)
      console.log(`Error Rate: ${result.metrics.errorRate.toFixed(1)}%`)
      
      const passCount = Object.values(result.checks).filter((c: any) => c.status === 'pass').length
      const warnCount = Object.values(result.checks).filter((c: any) => c.status === 'warn').length
      const failCount = Object.values(result.checks).filter((c: any) => c.status === 'fail').length
      
      console.log(`Checks: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`)
      
      if (result.recommendations.length > 0) {
        console.log('\n📋 Recommendations:')
        result.recommendations.forEach(rec => console.log(`  ${rec}`))
      }
      
      console.log('='.repeat(50))

      // Exit with non-zero code if unhealthy
      process.exit(result.overall === 'unhealthy' ? 1 : 0)
    }
  } catch (error: any) {
    console.error('❌ Health check failed:', error.message)
    process.exit(1)
  }
}

// Export for programmatic use
export { TileSystemHealthMonitor, type HealthCheckConfig, type HealthCheckResult }

// Run if called directly
if (require.main === module) {
  main()
}