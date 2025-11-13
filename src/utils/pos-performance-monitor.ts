/**
 * POS PERFORMANCE MONITOR
 * 
 * Real-time performance monitoring utility for POS operations
 * Tracks timing, identifies bottlenecks, and provides user experience insights
 */

interface PerformanceMetric {
  operation: string
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  context?: Record<string, any>
  error?: string
  userId?: string
  organizationId?: string
}

interface PerformanceReport {
  timeWindow: string
  operationCounts: Record<string, number>
  averageDurations: Record<string, number>
  successRates: Record<string, number>
  slowOperations: PerformanceMetric[]
  errors: PerformanceMetric[]
  userExperience: {
    fastOperations: number  // < 3s
    acceptableOperations: number  // 3-8s
    slowOperations: number  // 8-15s
    verySlowOperations: number  // > 15s
  }
  recommendations: string[]
}

class POSPerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private isEnabled = true
  private maxMetrics = 1000 // Keep last 1000 operations
  
  constructor() {
    // Auto-cleanup old metrics every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Start timing an operation
   */
  startOperation(operation: string, context?: Record<string, any>): string {
    if (!this.isEnabled) return ''
    
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      success: false,
      context: {
        id,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        ...context
      }
    }
    
    this.metrics.push(metric)
    
    console.log(`[POS Monitor] 🚀 Started: ${operation}`, context)
    return id
  }

  /**
   * Complete an operation (success)
   */
  endOperation(operationId: string, additionalContext?: Record<string, any>): void {
    if (!this.isEnabled || !operationId) return
    
    const metric = this.metrics.find(m => m.context?.id === operationId)
    if (!metric) {
      console.warn(`[POS Monitor] ⚠️ Operation not found: ${operationId}`)
      return
    }
    
    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    metric.success = true
    
    if (additionalContext) {
      metric.context = { ...metric.context, ...additionalContext }
    }
    
    const durationMs = Math.round(metric.duration)
    console.log(`[POS Monitor] ✅ Completed: ${metric.operation} in ${durationMs}ms`)
    
    // Log slow operations
    if (metric.duration > 10000) {
      console.warn(`[POS Monitor] 🐌 SLOW OPERATION: ${metric.operation} took ${durationMs}ms`)
    }
  }

  /**
   * Mark operation as failed
   */
  failOperation(operationId: string, error: string | Error, additionalContext?: Record<string, any>): void {
    if (!this.isEnabled || !operationId) return
    
    const metric = this.metrics.find(m => m.context?.id === operationId)
    if (!metric) {
      console.warn(`[POS Monitor] ⚠️ Operation not found for failure: ${operationId}`)
      return
    }
    
    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime
    metric.success = false
    metric.error = error instanceof Error ? error.message : error
    
    if (additionalContext) {
      metric.context = { ...metric.context, ...additionalContext }
    }
    
    const durationMs = Math.round(metric.duration)
    console.error(`[POS Monitor] ❌ Failed: ${metric.operation} after ${durationMs}ms - ${metric.error}`)
  }

  /**
   * Get performance report for the last N minutes
   */
  getReport(windowMinutes: number = 30): PerformanceReport {
    const windowMs = windowMinutes * 60 * 1000
    const cutoffTime = performance.now() - windowMs
    
    const recentMetrics = this.metrics.filter(
      m => m.startTime >= cutoffTime && m.endTime !== undefined
    )
    
    const operationCounts: Record<string, number> = {}
    const operationDurations: Record<string, number[]> = {}
    const operationSuccesses: Record<string, number> = {}
    
    recentMetrics.forEach(metric => {
      const { operation, duration, success } = metric
      
      operationCounts[operation] = (operationCounts[operation] || 0) + 1
      
      if (duration) {
        if (!operationDurations[operation]) {
          operationDurations[operation] = []
        }
        operationDurations[operation].push(duration)
      }
      
      if (success) {
        operationSuccesses[operation] = (operationSuccesses[operation] || 0) + 1
      }
    })
    
    // Calculate averages and success rates
    const averageDurations: Record<string, number> = {}
    const successRates: Record<string, number> = {}
    
    Object.entries(operationDurations).forEach(([operation, durations]) => {
      averageDurations[operation] = durations.reduce((sum, d) => sum + d, 0) / durations.length
    })
    
    Object.entries(operationCounts).forEach(([operation, count]) => {
      const successes = operationSuccesses[operation] || 0
      successRates[operation] = (successes / count) * 100
    })
    
    // Identify slow and failed operations
    const slowOperations = recentMetrics.filter(m => m.duration && m.duration > 8000)
    const errors = recentMetrics.filter(m => !m.success)
    
    // User experience categorization
    const userExperience = {
      fastOperations: recentMetrics.filter(m => m.duration && m.duration < 3000 && m.success).length,
      acceptableOperations: recentMetrics.filter(m => m.duration && m.duration >= 3000 && m.duration < 8000 && m.success).length,
      slowOperations: recentMetrics.filter(m => m.duration && m.duration >= 8000 && m.duration < 15000 && m.success).length,
      verySlowOperations: recentMetrics.filter(m => m.duration && m.duration >= 15000 && m.success).length
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      averageDurations,
      successRates,
      userExperience,
      errors.length
    )
    
    return {
      timeWindow: `Last ${windowMinutes} minutes`,
      operationCounts,
      averageDurations,
      successRates,
      slowOperations,
      errors,
      userExperience,
      recommendations
    }
  }

  private generateRecommendations(
    averageDurations: Record<string, number>,
    successRates: Record<string, number>,
    userExperience: any,
    errorCount: number
  ): string[] {
    const recommendations: string[] = []
    
    // Check for slow operations
    Object.entries(averageDurations).forEach(([operation, avgDuration]) => {
      if (avgDuration > 10000) {
        recommendations.push(`🔴 CRITICAL: ${operation} averaging ${Math.round(avgDuration)}ms - immediate optimization needed`)
      } else if (avgDuration > 5000) {
        recommendations.push(`🟡 WARNING: ${operation} averaging ${Math.round(avgDuration)}ms - consider optimization`)
      }
    })
    
    // Check for low success rates
    Object.entries(successRates).forEach(([operation, rate]) => {
      if (rate < 90) {
        recommendations.push(`🔴 RELIABILITY: ${operation} only ${rate.toFixed(1)}% success rate - investigate errors`)
      } else if (rate < 95) {
        recommendations.push(`🟡 RELIABILITY: ${operation} ${rate.toFixed(1)}% success rate - monitor for patterns`)
      }
    })
    
    // Check user experience distribution
    const totalOperations = userExperience.fastOperations + userExperience.acceptableOperations + 
                           userExperience.slowOperations + userExperience.verySlowOperations
    
    if (totalOperations > 0) {
      const slowPercentage = ((userExperience.slowOperations + userExperience.verySlowOperations) / totalOperations) * 100
      
      if (slowPercentage > 20) {
        recommendations.push(`🔴 UX ISSUE: ${slowPercentage.toFixed(1)}% of operations are slow (>8s) - user experience degraded`)
      } else if (slowPercentage > 10) {
        recommendations.push(`🟡 UX WARNING: ${slowPercentage.toFixed(1)}% of operations are slow (>8s) - monitor user feedback`)
      }
    }
    
    // Check error count
    if (errorCount > 5) {
      recommendations.push(`🔴 ERROR SPIKE: ${errorCount} errors detected - check logs for patterns`)
    }
    
    // Positive feedback
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance looks good! All operations within acceptable ranges.')
    }
    
    return recommendations
  }

  /**
   * Log a user experience issue (button clicks, form issues, etc.)
   */
  logUserExperience(issue: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void {
    if (!this.isEnabled) return
    
    const metric: PerformanceMetric = {
      operation: 'user_experience',
      startTime: performance.now(),
      endTime: performance.now(),
      duration: 0,
      success: severity === 'low',
      context: {
        issue,
        severity,
        timestamp: new Date().toISOString(),
        ...context
      }
    }
    
    this.metrics.push(metric)
    
    console.log(`[POS Monitor] 👤 UX Issue (${severity}): ${issue}`, context)
  }

  /**
   * Enable or disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    console.log(`[POS Monitor] ${enabled ? 'Enabled' : 'Disabled'} performance monitoring`)
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    console.log('[POS Monitor] 🗑️ Cleared all metrics')
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanup(): void {
    if (this.metrics.length > this.maxMetrics) {
      const toRemove = this.metrics.length - this.maxMetrics
      this.metrics.splice(0, toRemove)
      console.log(`[POS Monitor] 🧹 Cleaned up ${toRemove} old metrics`)
    }
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get real-time status for dashboard
   */
  getRealtimeStatus() {
    const lastMinute = this.getReport(1)
    const lastHour = this.getReport(60)
    
    return {
      isEnabled: this.isEnabled,
      totalMetrics: this.metrics.length,
      lastMinute: {
        operations: Object.values(lastMinute.operationCounts).reduce((sum, count) => sum + count, 0),
        errors: lastMinute.errors.length,
        slowOps: lastMinute.slowOperations.length
      },
      lastHour: {
        operations: Object.values(lastHour.operationCounts).reduce((sum, count) => sum + count, 0),
        avgDuration: Object.values(lastHour.averageDurations).reduce((sum, dur) => sum + dur, 0) / Object.values(lastHour.averageDurations).length || 0,
        successRate: Object.values(lastHour.successRates).reduce((sum, rate) => sum + rate, 0) / Object.values(lastHour.successRates).length || 100
      }
    }
  }
}

// Create global instance
const posMonitor = new POSPerformanceMonitor()

// Helper functions for easy integration
export const startPOSOperation = (operation: string, context?: Record<string, any>): string => {
  return posMonitor.startOperation(operation, context)
}

export const endPOSOperation = (operationId: string, context?: Record<string, any>): void => {
  posMonitor.endOperation(operationId, context)
}

export const failPOSOperation = (operationId: string, error: string | Error, context?: Record<string, any>): void => {
  posMonitor.failOperation(operationId, error, context)
}

export const logPOSUserExperience = (issue: string, severity: 'low' | 'medium' | 'high', context?: Record<string, any>): void => {
  posMonitor.logUserExperience(issue, severity, context)
}

export const getPOSPerformanceReport = (windowMinutes: number = 30): PerformanceReport => {
  return posMonitor.getReport(windowMinutes)
}

export const getPOSRealtimeStatus = () => {
  return posMonitor.getRealtimeStatus()
}

export { POSPerformanceMonitor, type PerformanceMetric, type PerformanceReport }

// Usage examples:
/*
// In a React component:
const checkoutId = startPOSOperation('checkout_process', { 
  itemCount: 3, 
  paymentMethod: 'card' 
})

try {
  const result = await processCheckout(data)
  endPOSOperation(checkoutId, { 
    transactionId: result.transaction_id,
    amount: result.total_amount 
  })
} catch (error) {
  failPOSOperation(checkoutId, error, { 
    step: 'payment_processing' 
  })
}

// Log user experience issues:
logPOSUserExperience('Customer complained about slow checkout', 'medium', {
  customerFeedback: 'Too many steps',
  checkoutDuration: '45 seconds'
})

// Get performance report:
const report = getPOSPerformanceReport(60) // Last hour
console.log('Performance report:', report)
*/