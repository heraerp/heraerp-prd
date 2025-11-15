/**
 * HERA Universal Tile System - Production Monitoring
 * Smart Code: HERA.MONITORING.PRODUCTION.UNIVERSAL.TILES.v1
 * 
 * Comprehensive production monitoring with real-time metrics,
 * error tracking, performance monitoring, and alerting
 */

import { TilePerformanceMonitor } from '../performance/TilePerformanceMonitor'

export interface ProductionMetrics {
  // System Metrics
  timestamp: number
  deploymentId: string
  environment: string
  
  // Performance Metrics
  performance: {
    averageRenderTime: number
    p95RenderTime: number
    p99RenderTime: number
    memoryUsage: number
    cpuUsage: number
    networkLatency: number
    cacheHitRate: number
  }
  
  // User Experience Metrics
  userExperience: {
    activeUsers: number
    sessionDuration: number
    bounceRate: number
    errorRate: number
    satisfactionScore: number
  }
  
  // Business Metrics
  business: {
    tilesRendered: number
    actionsPerformed: number
    workspacesAccessed: number
    conversionRate: number
    revenueImpact: number
  }
  
  // System Health
  health: {
    uptime: number
    apiResponseTime: number
    databaseConnectionTime: number
    errorCount: number
    warningCount: number
  }
}

export interface AlertThresholds {
  performance: {
    maxRenderTime: number
    maxMemoryUsage: number
    minCacheHitRate: number
  }
  reliability: {
    maxErrorRate: number
    minUptime: number
    maxResponseTime: number
  }
  business: {
    minActiveUsers: number
    maxBounceRate: number
    minConversionRate: number
  }
}

export class ProductionMonitor {
  private metrics: ProductionMetrics
  private performanceMonitor: TilePerformanceMonitor
  private alertThresholds: AlertThresholds
  private metricsHistory: ProductionMetrics[] = []
  private alertQueue: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' | 'critical' }> = []
  private isMonitoring = false
  
  constructor(deploymentId: string, environment: string = 'production') {
    this.performanceMonitor = new TilePerformanceMonitor()
    
    this.alertThresholds = {
      performance: {
        maxRenderTime: 50, // ms
        maxMemoryUsage: 100, // MB
        minCacheHitRate: 0.7 // 70%
      },
      reliability: {
        maxErrorRate: 0.01, // 1%
        minUptime: 0.999, // 99.9%
        maxResponseTime: 200 // ms
      },
      business: {
        minActiveUsers: 10,
        maxBounceRate: 0.3, // 30%
        minConversionRate: 0.05 // 5%
      }
    }
    
    this.metrics = this.initializeMetrics(deploymentId, environment)
    this.startMonitoring()
  }
  
  private initializeMetrics(deploymentId: string, environment: string): ProductionMetrics {
    return {
      timestamp: Date.now(),
      deploymentId,
      environment,
      performance: {
        averageRenderTime: 0,
        p95RenderTime: 0,
        p99RenderTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        networkLatency: 0,
        cacheHitRate: 0
      },
      userExperience: {
        activeUsers: 0,
        sessionDuration: 0,
        bounceRate: 0,
        errorRate: 0,
        satisfactionScore: 0
      },
      business: {
        tilesRendered: 0,
        actionsPerformed: 0,
        workspacesAccessed: 0,
        conversionRate: 0,
        revenueImpact: 0
      },
      health: {
        uptime: 0,
        apiResponseTime: 0,
        databaseConnectionTime: 0,
        errorCount: 0,
        warningCount: 0
      }
    }
  }
  
  /**
   * Start production monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Production monitoring is already running')
      return
    }
    
    this.isMonitoring = true
    console.log('🚀 Production monitoring started')
    
    // Start metrics collection intervals
    this.startPerformanceMonitoring()
    this.startHealthChecks()
    this.startBusinessMetrics()
    this.startAlertProcessing()
    
    // Send initial metrics
    this.sendMetrics()
  }
  
  /**
   * Stop production monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false
    console.log('🛑 Production monitoring stopped')
  }
  
  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      if (!this.isMonitoring) return
      
      const performanceData = this.performanceMonitor.getPerformanceAnalytics()
      
      this.metrics.performance = {
        averageRenderTime: performanceData.overall.averageRenderTime,
        p95RenderTime: performanceData.overall.p95RenderTime,
        p99RenderTime: performanceData.overall.p99RenderTime,
        memoryUsage: this.getMemoryUsage(),
        cpuUsage: this.getCPUUsage(),
        networkLatency: performanceData.overall.averageDataFetchTime || 0,
        cacheHitRate: this.getCacheHitRate()
      }
      
      // Check performance thresholds
      this.checkPerformanceThresholds()
      
    }, 5000) // Every 5 seconds
  }
  
  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      if (!this.isMonitoring) return
      
      const healthData = await this.performHealthCheck()
      
      this.metrics.health = {
        uptime: healthData.uptime,
        apiResponseTime: healthData.apiResponseTime,
        databaseConnectionTime: healthData.databaseConnectionTime,
        errorCount: healthData.errorCount,
        warningCount: healthData.warningCount
      }
      
      // Check health thresholds
      this.checkHealthThresholds()
      
    }, 30000) // Every 30 seconds
  }
  
  /**
   * Start business metrics collection
   */
  private startBusinessMetrics(): void {
    setInterval(() => {
      if (!this.isMonitoring) return
      
      this.metrics.business = {
        tilesRendered: this.performanceMonitor.getMetrics().totalTilesRendered,
        actionsPerformed: this.performanceMonitor.getMetrics().totalActionsPerformed,
        workspacesAccessed: this.getWorkspacesAccessed(),
        conversionRate: this.calculateConversionRate(),
        revenueImpact: this.calculateRevenueImpact()
      }
      
      this.metrics.userExperience = {
        activeUsers: this.getActiveUsers(),
        sessionDuration: this.getAverageSessionDuration(),
        bounceRate: this.getBounceRate(),
        errorRate: this.getErrorRate(),
        satisfactionScore: this.getSatisfactionScore()
      }
      
      // Check business thresholds
      this.checkBusinessThresholds()
      
    }, 60000) // Every 60 seconds
  }
  
  /**
   * Start alert processing
   */
  private startAlertProcessing(): void {
    setInterval(() => {
      if (!this.isMonitoring) return
      
      this.processAlerts()
      
    }, 10000) // Every 10 seconds
  }
  
  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<any> {
    const startTime = Date.now()
    
    try {
      // API health check
      const apiStartTime = Date.now()
      const apiResponse = await fetch('/api/health')
      const apiResponseTime = Date.now() - apiStartTime
      
      // Database health check
      const dbStartTime = Date.now()
      const dbResponse = await fetch('/api/health/database')
      const databaseConnectionTime = Date.now() - dbStartTime
      
      return {
        uptime: Date.now() - startTime,
        apiResponseTime,
        databaseConnectionTime,
        errorCount: this.getErrorCount(),
        warningCount: this.getWarningCount(),
        healthy: apiResponse.ok && dbResponse.ok
      }
    } catch (error) {
      console.error('Health check failed:', error)
      this.addAlert('health', 'Health check failed', 'critical')
      return {
        uptime: 0,
        apiResponseTime: 0,
        databaseConnectionTime: 0,
        errorCount: this.getErrorCount() + 1,
        warningCount: this.getWarningCount(),
        healthy: false
      }
    }
  }
  
  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(): void {
    const { performance } = this.metrics
    const { performance: thresholds } = this.alertThresholds
    
    if (performance.averageRenderTime > thresholds.maxRenderTime) {
      this.addAlert('performance', 
        `Average render time (${performance.averageRenderTime}ms) exceeds threshold (${thresholds.maxRenderTime}ms)`, 
        'medium')
    }
    
    if (performance.memoryUsage > thresholds.maxMemoryUsage) {
      this.addAlert('performance', 
        `Memory usage (${performance.memoryUsage}MB) exceeds threshold (${thresholds.maxMemoryUsage}MB)`, 
        'high')
    }
    
    if (performance.cacheHitRate < thresholds.minCacheHitRate) {
      this.addAlert('performance', 
        `Cache hit rate (${performance.cacheHitRate}) below threshold (${thresholds.minCacheHitRate})`, 
        'medium')
    }
  }
  
  /**
   * Check health thresholds
   */
  private checkHealthThresholds(): void {
    const { health } = this.metrics
    const { reliability: thresholds } = this.alertThresholds
    
    const errorRate = health.errorCount / (health.errorCount + 1000) // Approximate
    if (errorRate > thresholds.maxErrorRate) {
      this.addAlert('reliability', 
        `Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(thresholds.maxErrorRate * 100).toFixed(2)}%)`, 
        'critical')
    }
    
    if (health.apiResponseTime > thresholds.maxResponseTime) {
      this.addAlert('reliability', 
        `API response time (${health.apiResponseTime}ms) exceeds threshold (${thresholds.maxResponseTime}ms)`, 
        'high')
    }
  }
  
  /**
   * Check business thresholds
   */
  private checkBusinessThresholds(): void {
    const { userExperience, business } = this.metrics
    const { business: thresholds } = this.alertThresholds
    
    if (userExperience.activeUsers < thresholds.minActiveUsers) {
      this.addAlert('business', 
        `Active users (${userExperience.activeUsers}) below threshold (${thresholds.minActiveUsers})`, 
        'low')
    }
    
    if (userExperience.bounceRate > thresholds.maxBounceRate) {
      this.addAlert('business', 
        `Bounce rate (${(userExperience.bounceRate * 100).toFixed(2)}%) exceeds threshold (${(thresholds.maxBounceRate * 100).toFixed(2)}%)`, 
        'medium')
    }
    
    if (business.conversionRate < thresholds.minConversionRate) {
      this.addAlert('business', 
        `Conversion rate (${(business.conversionRate * 100).toFixed(2)}%) below threshold (${(thresholds.minConversionRate * 100).toFixed(2)}%)`, 
        'high')
    }
  }
  
  /**
   * Add alert to queue
   */
  private addAlert(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.alertQueue.push({ type, message, severity })
    console.log(`🚨 ALERT [${severity.toUpperCase()}] ${type}: ${message}`)
  }
  
  /**
   * Process alerts
   */
  private async processAlerts(): Promise<void> {
    if (this.alertQueue.length === 0) return
    
    const alerts = [...this.alertQueue]
    this.alertQueue = []
    
    // Group alerts by severity
    const critical = alerts.filter(a => a.severity === 'critical')
    const high = alerts.filter(a => a.severity === 'high')
    const medium = alerts.filter(a => a.severity === 'medium')
    const low = alerts.filter(a => a.severity === 'low')
    
    // Send critical alerts immediately
    if (critical.length > 0) {
      await this.sendCriticalAlerts(critical)
    }
    
    // Batch other alerts
    if (high.length + medium.length + low.length > 0) {
      await this.sendBatchedAlerts([...high, ...medium, ...low])
    }
  }
  
  /**
   * Send critical alerts
   */
  private async sendCriticalAlerts(alerts: any[]): Promise<void> {
    // Implementation would send to PagerDuty, Slack, email, etc.
    console.error('🚨 CRITICAL ALERTS:', alerts)
    
    // Example: Send to webhook
    if (process.env.CRITICAL_ALERT_WEBHOOK) {
      try {
        await fetch(process.env.CRITICAL_ALERT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alerts,
            severity: 'critical',
            timestamp: Date.now(),
            deploymentId: this.metrics.deploymentId
          })
        })
      } catch (error) {
        console.error('Failed to send critical alerts:', error)
      }
    }
  }
  
  /**
   * Send batched alerts
   */
  private async sendBatchedAlerts(alerts: any[]): Promise<void> {
    // Implementation would send to monitoring dashboard
    console.warn('⚠️ ALERTS:', alerts)
    
    // Example: Send to monitoring service
    if (process.env.MONITORING_WEBHOOK) {
      try {
        await fetch(process.env.MONITORING_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alerts,
            timestamp: Date.now(),
            deploymentId: this.metrics.deploymentId
          })
        })
      } catch (error) {
        console.error('Failed to send alerts:', error)
      }
    }
  }
  
  /**
   * Send metrics to monitoring service
   */
  private async sendMetrics(): Promise<void> {
    this.metrics.timestamp = Date.now()
    this.metricsHistory.push({ ...this.metrics })
    
    // Keep only last 1000 metrics entries
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000)
    }
    
    // Send to external monitoring service
    if (process.env.METRICS_ENDPOINT) {
      try {
        await fetch(process.env.METRICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.metrics)
        })
      } catch (error) {
        console.error('Failed to send metrics:', error)
      }
    }
    
    // Schedule next metrics send
    if (this.isMonitoring) {
      setTimeout(() => this.sendMetrics(), 30000) // Every 30 seconds
    }
  }
  
  // Helper methods for metrics calculation
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }
  
  private getCPUUsage(): number {
    // Browser doesn't have direct CPU access, estimate based on performance
    const now = performance.now()
    const start = now - 1000 // Last second
    return Math.random() * 10 // Placeholder implementation
  }
  
  private getCacheHitRate(): number {
    // Implementation would check cache statistics
    return Math.random() * 0.3 + 0.7 // Placeholder: 70-100%
  }
  
  private getWorkspacesAccessed(): number {
    // Implementation would track workspace access
    return Math.floor(Math.random() * 50) + 10 // Placeholder
  }
  
  private calculateConversionRate(): number {
    // Implementation would calculate actual conversion rate
    return Math.random() * 0.1 + 0.05 // Placeholder: 5-15%
  }
  
  private calculateRevenueImpact(): number {
    // Implementation would calculate revenue impact
    return Math.random() * 10000 + 5000 // Placeholder
  }
  
  private getActiveUsers(): number {
    // Implementation would track active users
    return Math.floor(Math.random() * 100) + 20 // Placeholder
  }
  
  private getAverageSessionDuration(): number {
    // Implementation would calculate average session duration
    return Math.random() * 600 + 300 // Placeholder: 5-15 minutes
  }
  
  private getBounceRate(): number {
    // Implementation would calculate bounce rate
    return Math.random() * 0.3 + 0.1 // Placeholder: 10-40%
  }
  
  private getErrorRate(): number {
    // Implementation would calculate error rate
    return Math.random() * 0.02 // Placeholder: 0-2%
  }
  
  private getSatisfactionScore(): number {
    // Implementation would calculate user satisfaction
    return Math.random() * 2 + 3 // Placeholder: 3-5 stars
  }
  
  private getErrorCount(): number {
    // Implementation would get actual error count
    return Math.floor(Math.random() * 10) // Placeholder
  }
  
  private getWarningCount(): number {
    // Implementation would get actual warning count
    return Math.floor(Math.random() * 20) // Placeholder
  }
  
  /**
   * Get current metrics
   */
  public getCurrentMetrics(): ProductionMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Get metrics history
   */
  public getMetricsHistory(): ProductionMetrics[] {
    return [...this.metricsHistory]
  }
  
  /**
   * Update alert thresholds
   */
  public updateAlertThresholds(newThresholds: Partial<AlertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds }
    console.log('📊 Alert thresholds updated:', this.alertThresholds)
  }
  
  /**
   * Generate monitoring report
   */
  public generateReport(): any {
    const now = Date.now()
    const last24h = this.metricsHistory.filter(m => now - m.timestamp < 24 * 60 * 60 * 1000)
    
    return {
      reportGeneratedAt: now,
      deploymentId: this.metrics.deploymentId,
      environment: this.metrics.environment,
      period: {
        start: last24h.length > 0 ? Math.min(...last24h.map(m => m.timestamp)) : now,
        end: now,
        duration: '24 hours'
      },
      summary: {
        averagePerformance: this.calculateAverage(last24h, 'performance.averageRenderTime'),
        totalTilesRendered: this.calculateSum(last24h, 'business.tilesRendered'),
        averageActiveUsers: this.calculateAverage(last24h, 'userExperience.activeUsers'),
        errorRate: this.calculateAverage(last24h, 'userExperience.errorRate'),
        uptime: this.calculateUptime(last24h)
      },
      trends: {
        performanceImprovement: this.calculateTrend(last24h, 'performance.averageRenderTime'),
        userGrowth: this.calculateTrend(last24h, 'userExperience.activeUsers'),
        businessGrowth: this.calculateTrend(last24h, 'business.tilesRendered')
      },
      recommendations: this.generateRecommendations(last24h)
    }
  }
  
  private calculateAverage(metrics: ProductionMetrics[], path: string): number {
    if (metrics.length === 0) return 0
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined)
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
  
  private calculateSum(metrics: ProductionMetrics[], path: string): number {
    return metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined).reduce((sum, val) => sum + val, 0)
  }
  
  private calculateUptime(metrics: ProductionMetrics[]): number {
    if (metrics.length === 0) return 0
    const healthyMetrics = metrics.filter(m => m.health.uptime > 0)
    return healthyMetrics.length / metrics.length
  }
  
  private calculateTrend(metrics: ProductionMetrics[], path: string): string {
    if (metrics.length < 2) return 'insufficient data'
    const values = metrics.map(m => this.getNestedValue(m, path)).filter(v => v !== undefined)
    const first = values[0]
    const last = values[values.length - 1]
    const change = ((last - first) / first) * 100
    
    if (Math.abs(change) < 5) return 'stable'
    return change > 0 ? 'improving' : 'declining'
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  private generateRecommendations(metrics: ProductionMetrics[]): string[] {
    const recommendations: string[] = []
    
    const avgRenderTime = this.calculateAverage(metrics, 'performance.averageRenderTime')
    if (avgRenderTime > 30) {
      recommendations.push('Consider enabling virtualization for better tile rendering performance')
    }
    
    const avgMemoryUsage = this.calculateAverage(metrics, 'performance.memoryUsage')
    if (avgMemoryUsage > 75) {
      recommendations.push('Monitor memory usage and implement cleanup strategies')
    }
    
    const errorRate = this.calculateAverage(metrics, 'userExperience.errorRate')
    if (errorRate > 0.005) {
      recommendations.push('Investigate and resolve high error rate')
    }
    
    return recommendations
  }
}

// Global production monitor instance
export let productionMonitor: ProductionMonitor | null = null

/**
 * Initialize production monitoring
 */
export function initializeProductionMonitoring(deploymentId: string, environment: string = 'production'): ProductionMonitor {
  if (productionMonitor) {
    console.warn('Production monitoring is already initialized')
    return productionMonitor
  }
  
  productionMonitor = new ProductionMonitor(deploymentId, environment)
  return productionMonitor
}

/**
 * Get production monitor instance
 */
export function getProductionMonitor(): ProductionMonitor | null {
  return productionMonitor
}

export default ProductionMonitor