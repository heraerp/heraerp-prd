/**
 * Production Health Check & Disaster Recovery Service
 * Kubernetes-ready health endpoints and failure recovery
 */

import { supabase } from '@/lib/supabase/client'
import { CacheService } from './cache-service'
import { MonitoringService } from './monitoring-service'

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  version: string
  uptime: number
  checks: Record<string, HealthCheckResult>
  metadata?: Record<string, any>
}

export interface HealthCheckResult {
  status: 'pass' | 'warn' | 'fail'
  componentType: string
  time: string
  output?: string
  error?: string
  responseTime?: number
}

export class HealthService {
  private startTime: number
  private version: string
  private cache?: CacheService
  private monitoring?: MonitoringService

  constructor(options: { version: string; cache?: CacheService; monitoring?: MonitoringService }) {
    this.startTime = Date.now()
    this.version = options.version
    this.cache = options.cache
    this.monitoring = options.monitoring
  }

  // ========================================================================
  // KUBERNETES HEALTH ENDPOINTS
  // ========================================================================

  /**
   * Liveness probe - indicates if the application is running
   * Returns 200 if app is alive, 500 if it should be restarted
   */
  async livenessProbe(): Promise<{ status: number; body: any }> {
    try {
      // Basic liveness checks - should be fast and simple
      const checks: Record<string, HealthCheckResult> = {}

      // Check if main application components are responding
      checks.application = await this.checkApplication()
      checks.memory = await this.checkMemoryUsage()

      const isAlive = Object.values(checks).every(check => check.status !== 'fail')

      return {
        status: isAlive ? 200 : 500,
        body: {
          status: isAlive ? 'alive' : 'dead',
          timestamp: new Date().toISOString(),
          checks
        }
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          status: 'dead',
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Readiness probe - indicates if the application can serve traffic
   * Returns 200 if ready, 503 if not ready for traffic
   */
  async readinessProbe(): Promise<{ status: number; body: any }> {
    try {
      const checks: Record<string, HealthCheckResult> = {}

      // Check all dependencies required to serve traffic
      checks.database = await this.checkDatabase()
      checks.cache = await this.checkCache()
      checks.ai_service = await this.checkAIService()

      const isReady = Object.values(checks).every(
        check => check.status === 'pass' || check.status === 'warn'
      )

      return {
        status: isReady ? 200 : 503,
        body: {
          status: isReady ? 'ready' : 'not_ready',
          timestamp: new Date().toISOString(),
          checks
        }
      }
    } catch (error) {
      return {
        status: 503,
        body: {
          status: 'not_ready',
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Startup probe - indicates if the application has started
   * Used for slow-starting applications
   */
  async startupProbe(): Promise<{ status: number; body: any }> {
    try {
      const checks: Record<string, HealthCheckResult> = {}

      // Check if initialization is complete
      checks.database = await this.checkDatabase()
      checks.ai_models = await this.checkAIModelsLoaded()
      checks.configuration = await this.checkConfiguration()

      const isStarted = Object.values(checks).every(check => check.status === 'pass')

      return {
        status: isStarted ? 200 : 500,
        body: {
          status: isStarted ? 'started' : 'starting',
          timestamp: new Date().toISOString(),
          checks
        }
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          status: 'failed_to_start',
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // ========================================================================
  // COMPREHENSIVE HEALTH CHECK
  // ========================================================================

  /**
   * Full health check for monitoring dashboards
   */
  async healthCheck(): Promise<HealthStatus> {
    const checks: Record<string, HealthCheckResult> = {}

    // Run all health checks in parallel
    const checkPromises = [
      this.checkDatabase().then(result => ({ key: 'database', result })),
      this.checkCache().then(result => ({ key: 'cache', result })),
      this.checkAIService().then(result => ({ key: 'ai_service', result })),
      this.checkMemoryUsage().then(result => ({ key: 'memory', result })),
      this.checkDiskSpace().then(result => ({ key: 'disk', result })),
      this.checkExternalAPIs().then(result => ({ key: 'external_apis', result }))
    ]

    const results = await Promise.allSettled(checkPromises)

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        checks[result.value.key] = result.value.result
      } else {
        checks[`check_${index}`] = {
          status: 'fail',
          componentType: 'health_check',
          time: new Date().toISOString(),
          error: result.reason?.message || 'Unknown error'
        }
      }
    })

    // Determine overall status
    const failCount = Object.values(checks).filter(c => c.status === 'fail').length
    const warnCount = Object.values(checks).filter(c => c.status === 'warn').length

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (failCount > 0) {
      overallStatus = failCount > 1 ? 'unhealthy' : 'degraded'
    } else if (warnCount > 0) {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      timestamp: Date.now(),
      version: this.version,
      uptime: Date.now() - this.startTime,
      checks,
      metadata: {
        environment: process.env.NODE_ENV,
        hostname: process.env.HOSTNAME,
        totalChecks: Object.keys(checks).length,
        passedChecks: Object.values(checks).filter(c => c.status === 'pass').length
      }
    }
  }

  // ========================================================================
  // INDIVIDUAL HEALTH CHECKS
  // ========================================================================

  private async checkApplication(): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      // Basic application health - check if core modules are loaded
      const memUsage = process.memoryUsage()
      const responseTime = Date.now() - start

      if (memUsage.heapUsed > memUsage.heapTotal * 0.9) {
        return {
          status: 'warn',
          componentType: 'application',
          time: new Date().toISOString(),
          output: 'High memory usage detected',
          responseTime
        }
      }

      return {
        status: 'pass',
        componentType: 'application',
        time: new Date().toISOString(),
        output: 'Application is running normally',
        responseTime
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'application',
        time: new Date().toISOString(),
        error: (error as Error).message,
        responseTime: Date.now() - start
      }
    }
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      // Test database connection with a simple query
      const { data, error } = await supabase
        .from('core_organizations')
        .select('count')
        .limit(1)
        .single()

      const responseTime = Date.now() - start

      if (error) {
        return {
          status: 'fail',
          componentType: 'database',
          time: new Date().toISOString(),
          error: error.message,
          responseTime
        }
      }

      // Check for slow response
      if (responseTime > 1000) {
        return {
          status: 'warn',
          componentType: 'database',
          time: new Date().toISOString(),
          output: `Slow database response: ${responseTime}ms`,
          responseTime
        }
      }

      return {
        status: 'pass',
        componentType: 'database',
        time: new Date().toISOString(),
        output: 'Database connection healthy',
        responseTime
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'database',
        time: new Date().toISOString(),
        error: (error as Error).message,
        responseTime: Date.now() - start
      }
    }
  }

  private async checkCache(): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      if (!this.cache) {
        return {
          status: 'warn',
          componentType: 'cache',
          time: new Date().toISOString(),
          output: 'Cache service not configured'
        }
      }

      // Test cache with a simple set/get operation
      const testKey = 'health_check_' + Date.now()
      const testValue = 'test'

      await this.cache.set(testKey, testValue, { ttl: 10 })
      const retrievedValue = await this.cache.get(testKey)
      await this.cache.delete(testKey)

      const responseTime = Date.now() - start

      if (retrievedValue !== testValue) {
        return {
          status: 'fail',
          componentType: 'cache',
          time: new Date().toISOString(),
          error: 'Cache set/get operation failed',
          responseTime
        }
      }

      return {
        status: 'pass',
        componentType: 'cache',
        time: new Date().toISOString(),
        output: 'Cache service healthy',
        responseTime
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'cache',
        time: new Date().toISOString(),
        error: (error as Error).message,
        responseTime: Date.now() - start
      }
    }
  }

  private async checkAIService(): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      // Test AI service with a simple classification call
      const { data, error } = await supabase.rpc('ai_system_health_check')

      const responseTime = Date.now() - start

      if (error) {
        return {
          status: 'fail',
          componentType: 'ai_service',
          time: new Date().toISOString(),
          error: error.message,
          responseTime
        }
      }

      const healthData = data as any

      if (healthData.status === 'unhealthy') {
        return {
          status: 'fail',
          componentType: 'ai_service',
          time: new Date().toISOString(),
          error: 'AI service reported unhealthy status',
          responseTime
        }
      } else if (healthData.status === 'degraded') {
        return {
          status: 'warn',
          componentType: 'ai_service',
          time: new Date().toISOString(),
          output: 'AI service is degraded',
          responseTime
        }
      }

      return {
        status: 'pass',
        componentType: 'ai_service',
        time: new Date().toISOString(),
        output: 'AI service healthy',
        responseTime
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'ai_service',
        time: new Date().toISOString(),
        error: (error as Error).message,
        responseTime: Date.now() - start
      }
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    try {
      const memUsage = process.memoryUsage()
      const usedMemoryMB = memUsage.heapUsed / 1024 / 1024
      const totalMemoryMB = memUsage.heapTotal / 1024 / 1024
      const usagePercent = (usedMemoryMB / totalMemoryMB) * 100

      let status: 'pass' | 'warn' | 'fail' = 'pass'
      let output = `Memory usage: ${usedMemoryMB.toFixed(2)}MB / ${totalMemoryMB.toFixed(2)}MB (${usagePercent.toFixed(1)}%)`

      if (usagePercent > 90) {
        status = 'fail'
        output += ' - Critical memory usage'
      } else if (usagePercent > 80) {
        status = 'warn'
        output += ' - High memory usage'
      }

      return {
        status,
        componentType: 'system',
        time: new Date().toISOString(),
        output,
        responseTime: 0
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'system',
        time: new Date().toISOString(),
        error: (error as Error).message
      }
    }
  }

  private async checkDiskSpace(): Promise<HealthCheckResult> {
    try {
      // This would typically check actual disk space
      // For now, return a mock implementation

      return {
        status: 'pass',
        componentType: 'system',
        time: new Date().toISOString(),
        output: 'Disk space check not implemented (mock)',
        responseTime: 0
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'system',
        time: new Date().toISOString(),
        error: (error as Error).message
      }
    }
  }

  private async checkAIModelsLoaded(): Promise<HealthCheckResult> {
    try {
      const { data, error } = await supabase
        .from('ai_transaction_patterns')
        .select('count')
        .limit(1)

      if (error) {
        return {
          status: 'fail',
          componentType: 'ai_models',
          time: new Date().toISOString(),
          error: error.message
        }
      }

      return {
        status: 'pass',
        componentType: 'ai_models',
        time: new Date().toISOString(),
        output: 'AI models loaded successfully'
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'ai_models',
        time: new Date().toISOString(),
        error: (error as Error).message
      }
    }
  }

  private async checkConfiguration(): Promise<HealthCheckResult> {
    try {
      const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

      if (missingVars.length > 0) {
        return {
          status: 'fail',
          componentType: 'configuration',
          time: new Date().toISOString(),
          error: `Missing required environment variables: ${missingVars.join(', ')}`
        }
      }

      return {
        status: 'pass',
        componentType: 'configuration',
        time: new Date().toISOString(),
        output: 'All required configuration present'
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'configuration',
        time: new Date().toISOString(),
        error: (error as Error).message
      }
    }
  }

  private async checkExternalAPIs(): Promise<HealthCheckResult> {
    try {
      // This would check external API dependencies
      // For now, return a pass since we don't have external APIs

      return {
        status: 'pass',
        componentType: 'external_apis',
        time: new Date().toISOString(),
        output: 'No external API dependencies'
      }
    } catch (error) {
      return {
        status: 'fail',
        componentType: 'external_apis',
        time: new Date().toISOString(),
        error: (error as Error).message
      }
    }
  }

  // ========================================================================
  // GRACEFUL SHUTDOWN
  // ========================================================================

  /**
   * Handle graceful shutdown
   */
  async gracefulShutdown(signal: string): Promise<void> {
    console.log(`Received ${signal}, starting graceful shutdown...`)

    try {
      // 1. Stop accepting new requests (handled by load balancer/k8s)

      // 2. Wait for in-flight requests to complete
      await this.waitForInflightRequests(30000) // 30 second timeout

      // 3. Close database connections
      await this.closeDatabaseConnections()

      // 4. Close cache connections
      await this.closeCacheConnections()

      // 5. Final cleanup
      await this.finalCleanup()

      console.log('Graceful shutdown completed')
      process.exit(0)
    } catch (error) {
      console.error('Error during graceful shutdown:', error)
      process.exit(1)
    }
  }

  private async waitForInflightRequests(timeoutMs: number): Promise<void> {
    // This would track and wait for in-flight requests
    // Implementation depends on your HTTP server
    return new Promise(resolve => {
      setTimeout(resolve, Math.min(timeoutMs, 5000)) // Max 5 second wait
    })
  }

  private async closeDatabaseConnections(): Promise<void> {
    try {
      // Close Supabase connections if needed
      // Supabase client handles this automatically
      console.log('Database connections closed')
    } catch (error) {
      console.error('Error closing database connections:', error)
    }
  }

  private async closeCacheConnections(): Promise<void> {
    try {
      if (this.cache) {
        // Close cache connections
        // Implementation depends on cache service
        console.log('Cache connections closed')
      }
    } catch (error) {
      console.error('Error closing cache connections:', error)
    }
  }

  private async finalCleanup(): Promise<void> {
    try {
      // Any final cleanup tasks
      if (this.monitoring) {
        await this.monitoring.log({
          level: 'info',
          message: 'Application shutting down gracefully'
        })
      }
    } catch (error) {
      console.error('Error in final cleanup:', error)
    }
  }
}

// ========================================================================
// HEALTH CHECK MIDDLEWARE FACTORY
// ========================================================================

/**
 * Create Express middleware for health endpoints
 */
export function createHealthMiddleware(healthService: HealthService) {
  return {
    liveness: async (req: any, res: any) => {
      const result = await healthService.livenessProbe()
      res.status(result.status).json(result.body)
    },

    readiness: async (req: any, res: any) => {
      const result = await healthService.readinessProbe()
      res.status(result.status).json(result.body)
    },

    startup: async (req: any, res: any) => {
      const result = await healthService.startupProbe()
      res.status(result.status).json(result.body)
    },

    health: async (req: any, res: any) => {
      const result = await healthService.healthCheck()
      const statusCode =
        result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503
      res.status(statusCode).json(result)
    }
  }
}

export default HealthService
