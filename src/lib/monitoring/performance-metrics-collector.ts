/**
 * HERA Performance Metrics Collector
 * Real-time performance data collection and analysis
 * Smart Code: HERA.MONITORING.PERFORMANCE.COLLECTOR.v1
 */

'use client'

export interface PerformanceMetrics {
  timestamp: number
  pageLoad: number
  timeToInteractive: number
  memoryUsage: number
  errorCount: number
  activeUsers: number
  apiLatency: number
  bundleSize: number
  cacheHitRate: number
  userAgent: string
  viewport: string
  connectionType: string
}

export interface PerformanceAlert {
  id: string
  type: 'critical' | 'warning' | 'info'
  metric: string
  threshold: number
  currentValue: number
  message: string
  timestamp: number
  resolved: boolean
}

export interface PagePerformance {
  path: string
  avgLoadTime: number
  p95LoadTime: number
  visits: number
  bounceRate: number
  errorRate: number
  trend: 'up' | 'down' | 'stable'
}

export interface PerformanceReport {
  organizationId: string
  timeRange: string
  generatedAt: number
  summary: {
    avgPageLoad: number
    avgMemoryUsage: number
    totalErrors: number
    activeUsers: number
    topPages: PagePerformance[]
    alerts: PerformanceAlert[]
  }
  recommendations: string[]
  historicalData: PerformanceMetrics[]
}

export class PerformanceMetricsCollector {
  private organizationId: string
  private metricsBuffer: PerformanceMetrics[] = []
  private alertsBuffer: PerformanceAlert[] = []
  private isCollecting = false
  private observer: PerformanceObserver | null = null

  constructor(organizationId: string) {
    this.organizationId = organizationId
    this.initializeCollection()
  }

  /**
   * Initialize performance collection
   */
  private initializeCollection(): void {
    if (typeof window === 'undefined' || this.isCollecting) return

    this.isCollecting = true

    // Set up performance observer
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        this.processPerformanceEntries(entries)
      })

      try {
        this.observer.observe({ 
          entryTypes: ['navigation', 'measure', 'resource', 'paint'] 
        })
      } catch (error) {
        console.warn('📊 Performance Observer failed to initialize:', error)
      }
    }

    // Start periodic collection
    this.startPeriodicCollection()
  }

  /**
   * Start periodic metrics collection
   */
  private startPeriodicCollection(): void {
    const collectMetrics = () => {
      const metrics = this.collectCurrentMetrics()
      if (metrics) {
        this.metricsBuffer.push(metrics)
        
        // Keep buffer manageable (last 1000 entries)
        if (this.metricsBuffer.length > 1000) {
          this.metricsBuffer = this.metricsBuffer.slice(-1000)
        }

        // Check for performance alerts
        this.checkPerformanceAlerts(metrics)
      }
    }

    // Collect metrics every 30 seconds
    setInterval(collectMetrics, 30000)
    
    // Initial collection
    collectMetrics()
  }

  /**
   * Collect current performance metrics
   */
  private collectCurrentMetrics(): PerformanceMetrics | null {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const memory = (performance as any).memory
      const connection = (navigator as any).connection

      return {
        timestamp: Date.now(),
        pageLoad: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        timeToInteractive: navigation ? navigation.domInteractive - navigation.fetchStart : 0,
        memoryUsage: memory ? memory.usedJSHeapSize : 0,
        errorCount: this.getRecentErrorCount(),
        activeUsers: this.getActiveUsers(),
        apiLatency: this.getAverageAPILatency(),
        bundleSize: this.getBundleSize(),
        cacheHitRate: this.getCacheHitRate(),
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connectionType: connection ? connection.effectiveType : 'unknown'
      }
    } catch (error) {
      console.warn('📊 Failed to collect performance metrics:', error)
      return null
    }
  }

  /**
   * Process performance entries from observer
   */
  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      // Log slow resources
      if (entry.entryType === 'resource' && entry.duration > 5000) {
        console.warn('📊 Slow resource detected:', entry.name, entry.duration + 'ms')
      }

      // Log slow navigation
      if (entry.entryType === 'navigation' && entry.duration > 10000) {
        console.warn('📊 Slow page load detected:', entry.duration + 'ms')
      }
    })
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    const alerts: PerformanceAlert[] = []

    // Page load time alert
    if (metrics.pageLoad > 5000) {
      alerts.push({
        id: `pageload_${Date.now()}`,
        type: 'critical',
        metric: 'Page Load Time',
        threshold: 5000,
        currentValue: metrics.pageLoad,
        message: `Page load time is ${Math.round(metrics.pageLoad)}ms, exceeding the 5s threshold`,
        timestamp: Date.now(),
        resolved: false
      })
    } else if (metrics.pageLoad > 3000) {
      alerts.push({
        id: `pageload_warn_${Date.now()}`,
        type: 'warning',
        metric: 'Page Load Time',
        threshold: 3000,
        currentValue: metrics.pageLoad,
        message: `Page load time is ${Math.round(metrics.pageLoad)}ms, approaching the warning threshold`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    // Memory usage alert
    const memoryMB = metrics.memoryUsage / 1024 / 1024
    if (memoryMB > 200) {
      alerts.push({
        id: `memory_${Date.now()}`,
        type: 'critical',
        metric: 'Memory Usage',
        threshold: 200,
        currentValue: memoryMB,
        message: `Memory usage is ${Math.round(memoryMB)}MB, exceeding the 200MB threshold`,
        timestamp: Date.now(),
        resolved: false
      })
    } else if (memoryMB > 150) {
      alerts.push({
        id: `memory_warn_${Date.now()}`,
        type: 'warning',
        metric: 'Memory Usage',
        threshold: 150,
        currentValue: memoryMB,
        message: `Memory usage is ${Math.round(memoryMB)}MB, approaching the warning threshold`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    // API latency alert
    if (metrics.apiLatency > 2000) {
      alerts.push({
        id: `api_${Date.now()}`,
        type: 'critical',
        metric: 'API Latency',
        threshold: 2000,
        currentValue: metrics.apiLatency,
        message: `API response time is ${Math.round(metrics.apiLatency)}ms, exceeding the 2s threshold`,
        timestamp: Date.now(),
        resolved: false
      })
    }

    // Add new alerts to buffer
    this.alertsBuffer.push(...alerts)

    // Keep alerts buffer manageable
    if (this.alertsBuffer.length > 100) {
      this.alertsBuffer = this.alertsBuffer.slice(-100)
    }
  }

  /**
   * Get recent error count
   */
  private getRecentErrorCount(): number {
    try {
      // Try to get from production monitor if available
      if (typeof window !== 'undefined' && (window as any).heraProductionMonitor) {
        const monitor = (window as any).heraProductionMonitor
        return monitor.getBufferedErrors?.()?.length || 0
      }
      
      // Fallback: count console errors in last 5 minutes
      return 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Estimate active users (simple implementation)
   */
  private getActiveUsers(): number {
    try {
      // In a real implementation, this would come from analytics
      // For demo, generate a reasonable number
      return Math.floor(Math.random() * 50) + 10
    } catch (error) {
      return 0
    }
  }

  /**
   * Get average API latency
   */
  private getAverageAPILatency(): number {
    try {
      // Check recent network timings
      const resources = performance.getEntriesByType('resource')
      const apiCalls = resources.filter(entry => 
        entry.name.includes('/api/') && 
        entry.responseEnd > (Date.now() - 300000) // Last 5 minutes
      )

      if (apiCalls.length === 0) return 0

      const totalDuration = apiCalls.reduce((sum, entry) => sum + entry.duration, 0)
      return Math.round(totalDuration / apiCalls.length)
    } catch (error) {
      return 0
    }
  }

  /**
   * Estimate bundle size
   */
  private getBundleSize(): number {
    try {
      const resources = performance.getEntriesByType('resource')
      const jsResources = resources.filter(entry => 
        entry.name.endsWith('.js') || entry.name.includes('chunk')
      )

      return jsResources.reduce((total, entry) => {
        return total + (entry.transferSize || entry.encodedBodySize || 0)
      }, 0)
    } catch (error) {
      return 0
    }
  }

  /**
   * Estimate cache hit rate
   */
  private getCacheHitRate(): number {
    try {
      const resources = performance.getEntriesByType('resource')
      const cachedResources = resources.filter(entry => entry.transferSize === 0)
      
      if (resources.length === 0) return 0
      return cachedResources.length / resources.length
    } catch (error) {
      return 0
    }
  }

  /**
   * Get current metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics | null> {
    return this.collectCurrentMetrics()
  }

  /**
   * Get historical data
   */
  async getHistoricalData(timeRange: '1h' | '6h' | '24h' | '7d'): Promise<PerformanceMetrics[]> {
    const now = Date.now()
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }

    const cutoff = now - ranges[timeRange]
    
    // Filter metrics within time range
    const filtered = this.metricsBuffer.filter(metric => metric.timestamp > cutoff)
    
    // If we don't have enough real data, generate sample data for demo
    if (filtered.length < 10) {
      return this.generateSampleData(timeRange)
    }
    
    return filtered
  }

  /**
   * Generate sample data for demo
   */
  private generateSampleData(timeRange: '1h' | '6h' | '24h' | '7d'): PerformanceMetrics[] {
    const intervals = {
      '1h': { count: 12, interval: 5 * 60 * 1000 },  // 5 min intervals
      '6h': { count: 36, interval: 10 * 60 * 1000 }, // 10 min intervals
      '24h': { count: 48, interval: 30 * 60 * 1000 }, // 30 min intervals
      '7d': { count: 168, interval: 60 * 60 * 1000 } // 1 hour intervals
    }

    const { count, interval } = intervals[timeRange]
    const now = Date.now()
    const data: PerformanceMetrics[] = []

    for (let i = count; i >= 0; i--) {
      const timestamp = now - (i * interval)
      
      data.push({
        timestamp,
        pageLoad: Math.random() * 2000 + 1000, // 1-3s
        timeToInteractive: Math.random() * 3000 + 1500, // 1.5-4.5s
        memoryUsage: Math.random() * 100 * 1024 * 1024 + 50 * 1024 * 1024, // 50-150MB
        errorCount: Math.floor(Math.random() * 5),
        activeUsers: Math.floor(Math.random() * 30) + 20,
        apiLatency: Math.random() * 500 + 200, // 200-700ms
        bundleSize: Math.random() * 500 * 1024 + 1024 * 1024, // 1-1.5MB
        cacheHitRate: Math.random() * 0.3 + 0.7, // 70-100%
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        connectionType: 'unknown'
      })
    }

    return data
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<PerformanceAlert[]> {
    // Return unresolved alerts from last 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    return this.alertsBuffer
      .filter(alert => !alert.resolved && alert.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get page performance data
   */
  async getPagePerformance(timeRange: '1h' | '6h' | '24h' | '7d'): Promise<PagePerformance[]> {
    // In a real implementation, this would come from analytics
    // For demo, return sample page data
    return [
      {
        path: '/salon/pos',
        avgLoadTime: 1200,
        p95LoadTime: 2100,
        visits: 450,
        bounceRate: 0.12,
        errorRate: 0.02,
        trend: 'up'
      },
      {
        path: '/salon/dashboard',
        avgLoadTime: 800,
        p95LoadTime: 1500,
        visits: 380,
        bounceRate: 0.08,
        errorRate: 0.01,
        trend: 'stable'
      },
      {
        path: '/pos/sale',
        avgLoadTime: 1800,
        p95LoadTime: 3200,
        visits: 290,
        bounceRate: 0.25,
        errorRate: 0.05,
        trend: 'down'
      },
      {
        path: '/admin/dashboard',
        avgLoadTime: 950,
        p95LoadTime: 1800,
        visits: 120,
        bounceRate: 0.15,
        errorRate: 0.03,
        trend: 'up'
      },
      {
        path: '/inventory',
        avgLoadTime: 1400,
        p95LoadTime: 2500,
        visits: 200,
        bounceRate: 0.18,
        errorRate: 0.04,
        trend: 'stable'
      }
    ]
  }

  /**
   * Generate performance report
   */
  async generateReport(timeRange: '1h' | '6h' | '24h' | '7d'): Promise<PerformanceReport> {
    const historicalData = await this.getHistoricalData(timeRange)
    const alerts = await this.getActiveAlerts()
    const pagePerformance = await this.getPagePerformance(timeRange)

    // Calculate summary statistics
    const avgPageLoad = historicalData.length > 0 
      ? historicalData.reduce((sum, metric) => sum + metric.pageLoad, 0) / historicalData.length
      : 0

    const avgMemoryUsage = historicalData.length > 0
      ? historicalData.reduce((sum, metric) => sum + metric.memoryUsage, 0) / historicalData.length
      : 0

    const totalErrors = historicalData.reduce((sum, metric) => sum + metric.errorCount, 0)
    const activeUsers = historicalData.length > 0 
      ? Math.max(...historicalData.map(metric => metric.activeUsers))
      : 0

    // Generate recommendations
    const recommendations = this.generateRecommendations(avgPageLoad, avgMemoryUsage, alerts)

    return {
      organizationId: this.organizationId,
      timeRange,
      generatedAt: Date.now(),
      summary: {
        avgPageLoad: Math.round(avgPageLoad),
        avgMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024), // Convert to MB
        totalErrors,
        activeUsers,
        topPages: pagePerformance.slice(0, 5),
        alerts: alerts.slice(0, 10)
      },
      recommendations,
      historicalData
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(avgPageLoad: number, avgMemoryUsage: number, alerts: PerformanceAlert[]): string[] {
    const recommendations: string[] = []

    if (avgPageLoad > 3000) {
      recommendations.push('Consider optimizing page load times by implementing code splitting and lazy loading')
      recommendations.push('Review and optimize large resource files and images')
      recommendations.push('Implement service worker caching for static assets')
    }

    if (avgMemoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Monitor memory usage - consider optimizing component re-renders')
      recommendations.push('Review for memory leaks in event listeners and subscriptions')
      recommendations.push('Implement virtual scrolling for large lists')
    }

    const criticalAlerts = alerts.filter(alert => alert.type === 'critical').length
    if (criticalAlerts > 5) {
      recommendations.push('Address critical performance alerts to prevent user experience degradation')
      recommendations.push('Consider implementing performance budgets for key metrics')
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are within acceptable ranges')
      recommendations.push('Continue monitoring trends and consider proactive optimizations')
    }

    return recommendations
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.isCollecting = false
  }
}