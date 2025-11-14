/**
 * HERA Universal Tile System - Performance Monitor
 * Smart Code: HERA.PERFORMANCE.MONITORING.TILES.OPTIMIZATION.v1
 * 
 * Comprehensive performance monitoring and optimization for Universal Tile System
 */

export interface PerformanceMetrics {
  renderTime: number
  dataFetchTime: number
  securityValidationTime: number
  auditLogTime: number
  totalTime: number
  memoryUsage?: number
  tileCount: number
  timestamp: number
}

export interface TilePerformanceData {
  tileId: string
  renderCount: number
  averageRenderTime: number
  lastRenderTime: number
  errorCount: number
  cacheHitRate: number
  interactionCount: number
}

export interface PerformanceBudget {
  maxRenderTime: number // milliseconds
  maxDataFetchTime: number // milliseconds
  maxTileCount: number
  maxMemoryUsage: number // MB
  targetFPS: number
}

/**
 * Performance Monitor Class
 * Tracks and optimizes Universal Tile System performance
 */
export class TilePerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private tilePerformance: Map<string, TilePerformanceData> = new Map()
  private performanceBudget: PerformanceBudget
  private observers: PerformanceObserver[] = []
  private isMonitoring: boolean = false

  constructor(budget?: Partial<PerformanceBudget>) {
    this.performanceBudget = {
      maxRenderTime: 16, // 60 FPS target
      maxDataFetchTime: 100,
      maxTileCount: 100,
      maxMemoryUsage: 50,
      targetFPS: 60,
      ...budget
    }

    this.initializePerformanceObservers()
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    
    // Start frame rate monitoring
    this.startFPSMonitoring()
    
    // Monitor memory usage
    this.startMemoryMonitoring()
    
    console.log('🚀 Tile Performance Monitor started')
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    
    console.log('⏹️ Tile Performance Monitor stopped')
  }

  /**
   * Record tile render performance
   */
  public recordTileRender(
    tileId: string,
    renderStartTime: number,
    dataFetchTime?: number,
    securityValidationTime?: number,
    auditLogTime?: number
  ): void {
    const renderEndTime = performance.now()
    const renderTime = renderEndTime - renderStartTime
    
    // Update tile-specific performance data
    const existing = this.tilePerformance.get(tileId)
    if (existing) {
      existing.renderCount++
      existing.averageRenderTime = (existing.averageRenderTime * (existing.renderCount - 1) + renderTime) / existing.renderCount
      existing.lastRenderTime = renderTime
    } else {
      this.tilePerformance.set(tileId, {
        tileId,
        renderCount: 1,
        averageRenderTime: renderTime,
        lastRenderTime: renderTime,
        errorCount: 0,
        cacheHitRate: 0,
        interactionCount: 0
      })
    }

    // Record overall performance metrics
    const metric: PerformanceMetrics = {
      renderTime,
      dataFetchTime: dataFetchTime || 0,
      securityValidationTime: securityValidationTime || 0,
      auditLogTime: auditLogTime || 0,
      totalTime: renderTime + (dataFetchTime || 0) + (securityValidationTime || 0) + (auditLogTime || 0),
      tileCount: this.tilePerformance.size,
      timestamp: Date.now()
    }

    // Add memory usage if available
    if (this.isMemoryAPIAvailable()) {
      metric.memoryUsage = this.getCurrentMemoryUsage()
    }

    this.metrics.push(metric)
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics.shift()
    }

    // Check performance budget violations
    this.checkPerformanceBudget(metric, tileId)

    // Log performance warnings
    this.logPerformanceWarnings(metric, tileId)
  }

  /**
   * Record tile interaction
   */
  public recordTileInteraction(tileId: string, interactionType: string): void {
    const tileData = this.tilePerformance.get(tileId)
    if (tileData) {
      tileData.interactionCount++
    }

    console.log(`📊 Tile Interaction: ${tileId} - ${interactionType}`)
  }

  /**
   * Record tile error
   */
  public recordTileError(tileId: string, error: Error): void {
    const tileData = this.tilePerformance.get(tileId)
    if (tileData) {
      tileData.errorCount++
    }

    console.error(`❌ Tile Error: ${tileId}`, error)
  }

  /**
   * Record cache hit/miss
   */
  public recordCacheEvent(tileId: string, isHit: boolean): void {
    const tileData = this.tilePerformance.get(tileId)
    if (tileData) {
      const totalEvents = tileData.renderCount
      const currentHits = tileData.cacheHitRate * totalEvents
      const newHits = currentHits + (isHit ? 1 : 0)
      tileData.cacheHitRate = newHits / (totalEvents + 1)
    }
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(): {
    overall: {
      averageRenderTime: number
      averageDataFetchTime: number
      averageTotalTime: number
      totalTiles: number
      errorRate: number
      cacheHitRate: number
    }
    tiles: TilePerformanceData[]
    recentMetrics: PerformanceMetrics[]
    budgetViolations: string[]
  } {
    const recentMetrics = this.metrics.slice(-100)
    
    const overall = {
      averageRenderTime: this.calculateAverage(recentMetrics, 'renderTime'),
      averageDataFetchTime: this.calculateAverage(recentMetrics, 'dataFetchTime'),
      averageTotalTime: this.calculateAverage(recentMetrics, 'totalTime'),
      totalTiles: this.tilePerformance.size,
      errorRate: this.calculateErrorRate(),
      cacheHitRate: this.calculateOverallCacheHitRate()
    }

    const tiles = Array.from(this.tilePerformance.values())
      .sort((a, b) => b.averageRenderTime - a.averageRenderTime)

    const budgetViolations = this.getBudgetViolations()

    return {
      overall,
      tiles,
      recentMetrics: recentMetrics.slice(-10),
      budgetViolations
    }
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): Array<{
    type: 'critical' | 'warning' | 'info'
    title: string
    description: string
    action: string
  }> {
    const recommendations: Array<{
      type: 'critical' | 'warning' | 'info'
      title: string
      description: string
      action: string
    }> = []

    const analytics = this.getPerformanceAnalytics()

    // Check render time violations
    if (analytics.overall.averageRenderTime > this.performanceBudget.maxRenderTime) {
      recommendations.push({
        type: 'critical',
        title: 'High Render Time',
        description: `Average render time ${analytics.overall.averageRenderTime.toFixed(2)}ms exceeds budget ${this.performanceBudget.maxRenderTime}ms`,
        action: 'Consider implementing tile virtualization or lazy loading'
      })
    }

    // Check high error rate
    if (analytics.overall.errorRate > 0.05) {
      recommendations.push({
        type: 'critical',
        title: 'High Error Rate',
        description: `Error rate ${(analytics.overall.errorRate * 100).toFixed(1)}% is above acceptable threshold`,
        action: 'Review error logs and implement better error handling'
      })
    }

    // Check low cache hit rate
    if (analytics.overall.cacheHitRate < 0.7) {
      recommendations.push({
        type: 'warning',
        title: 'Low Cache Hit Rate',
        description: `Cache hit rate ${(analytics.overall.cacheHitRate * 100).toFixed(1)}% could be improved`,
        action: 'Review caching strategy and increase cache duration'
      })
    }

    // Check for slow tiles
    const slowTiles = analytics.tiles.filter(tile => tile.averageRenderTime > this.performanceBudget.maxRenderTime * 2)
    if (slowTiles.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Slow Tiles Detected',
        description: `${slowTiles.length} tiles have render times significantly above budget`,
        action: `Optimize tiles: ${slowTiles.map(t => t.tileId).join(', ')}`
      })
    }

    // Check tile count
    if (analytics.overall.totalTiles > this.performanceBudget.maxTileCount) {
      recommendations.push({
        type: 'warning',
        title: 'High Tile Count',
        description: `${analytics.overall.totalTiles} tiles exceed recommended maximum ${this.performanceBudget.maxTileCount}`,
        action: 'Implement tile pagination or virtualization'
      })
    }

    return recommendations
  }

  /**
   * Initialize performance observers
   */
  private initializePerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not available')
      return
    }

    // Observe long tasks that block the main thread
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`, entry)
          }
        })
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    } catch (error) {
      console.warn('Failed to setup long task observer:', error)
    }

    // Observe layout shift
    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (entry.value > 0.1) { // CLS threshold
            console.warn(`📐 Layout shift detected: ${entry.value.toFixed(3)}`, entry)
          }
        })
      })

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(layoutShiftObserver)
    } catch (error) {
      console.warn('Failed to setup layout shift observer:', error)
    }
  }

  /**
   * Start FPS monitoring
   */
  private startFPSMonitoring(): void {
    let lastTime = performance.now()
    let frameCount = 0

    const measureFPS = () => {
      if (!this.isMonitoring) return

      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) { // Every second
        const fps = frameCount
        frameCount = 0
        lastTime = currentTime

        if (fps < this.performanceBudget.targetFPS * 0.8) { // 20% below target
          console.warn(`⚡ Low FPS detected: ${fps} (target: ${this.performanceBudget.targetFPS})`)
        }
      }

      requestAnimationFrame(measureFPS)
    }

    requestAnimationFrame(measureFPS)
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!this.isMemoryAPIAvailable()) return

    const checkMemory = () => {
      if (!this.isMonitoring) return

      const memoryUsage = this.getCurrentMemoryUsage()
      if (memoryUsage > this.performanceBudget.maxMemoryUsage) {
        console.warn(`🧠 High memory usage: ${memoryUsage.toFixed(2)}MB (budget: ${this.performanceBudget.maxMemoryUsage}MB)`)
      }

      setTimeout(checkMemory, 5000) // Check every 5 seconds
    }

    setTimeout(checkMemory, 1000)
  }

  /**
   * Check if memory API is available
   */
  private isMemoryAPIAvailable(): boolean {
    return !!(window as any).performance?.memory
  }

  /**
   * Get current memory usage in MB
   */
  private getCurrentMemoryUsage(): number {
    if (!this.isMemoryAPIAvailable()) return 0
    
    const memory = (window as any).performance.memory
    return memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
  }

  /**
   * Calculate average of metrics
   */
  private calculateAverage(metrics: PerformanceMetrics[], field: keyof PerformanceMetrics): number {
    if (metrics.length === 0) return 0
    
    const total = metrics.reduce((sum, metric) => sum + (metric[field] as number), 0)
    return total / metrics.length
  }

  /**
   * Calculate overall error rate
   */
  private calculateErrorRate(): number {
    const totalErrors = Array.from(this.tilePerformance.values())
      .reduce((sum, tile) => sum + tile.errorCount, 0)
    const totalRenders = Array.from(this.tilePerformance.values())
      .reduce((sum, tile) => sum + tile.renderCount, 0)
    
    return totalRenders > 0 ? totalErrors / totalRenders : 0
  }

  /**
   * Calculate overall cache hit rate
   */
  private calculateOverallCacheHitRate(): number {
    const tiles = Array.from(this.tilePerformance.values())
    if (tiles.length === 0) return 0
    
    const totalHitRate = tiles.reduce((sum, tile) => sum + tile.cacheHitRate, 0)
    return totalHitRate / tiles.length
  }

  /**
   * Check performance budget violations
   */
  private checkPerformanceBudget(metric: PerformanceMetrics, tileId: string): void {
    const violations: string[] = []

    if (metric.renderTime > this.performanceBudget.maxRenderTime) {
      violations.push(`Render time ${metric.renderTime.toFixed(2)}ms exceeds budget ${this.performanceBudget.maxRenderTime}ms`)
    }

    if (metric.dataFetchTime > this.performanceBudget.maxDataFetchTime) {
      violations.push(`Data fetch time ${metric.dataFetchTime.toFixed(2)}ms exceeds budget ${this.performanceBudget.maxDataFetchTime}ms`)
    }

    if (metric.tileCount > this.performanceBudget.maxTileCount) {
      violations.push(`Tile count ${metric.tileCount} exceeds budget ${this.performanceBudget.maxTileCount}`)
    }

    if (metric.memoryUsage && metric.memoryUsage > this.performanceBudget.maxMemoryUsage) {
      violations.push(`Memory usage ${metric.memoryUsage.toFixed(2)}MB exceeds budget ${this.performanceBudget.maxMemoryUsage}MB`)
    }

    if (violations.length > 0) {
      console.warn(`🚨 Performance Budget Violations for ${tileId}:`, violations)
    }
  }

  /**
   * Log performance warnings
   */
  private logPerformanceWarnings(metric: PerformanceMetrics, tileId: string): void {
    if (metric.renderTime > 50) {
      console.warn(`🐌 Slow tile render: ${tileId} took ${metric.renderTime.toFixed(2)}ms`)
    }

    if (metric.dataFetchTime > 200) {
      console.warn(`🌐 Slow data fetch: ${tileId} took ${metric.dataFetchTime.toFixed(2)}ms`)
    }

    if (metric.totalTime > 100) {
      console.warn(`⏱️ Slow total time: ${tileId} took ${metric.totalTime.toFixed(2)}ms total`)
    }
  }

  /**
   * Get current budget violations
   */
  private getBudgetViolations(): string[] {
    const violations: string[] = []
    const analytics = this.getPerformanceAnalytics()

    if (analytics.overall.averageRenderTime > this.performanceBudget.maxRenderTime) {
      violations.push(`Average render time exceeds budget`)
    }

    if (analytics.overall.averageDataFetchTime > this.performanceBudget.maxDataFetchTime) {
      violations.push(`Average data fetch time exceeds budget`)
    }

    if (analytics.overall.totalTiles > this.performanceBudget.maxTileCount) {
      violations.push(`Total tile count exceeds budget`)
    }

    return violations
  }

  /**
   * Export performance data for analysis
   */
  public exportPerformanceData(): {
    metrics: PerformanceMetrics[]
    tiles: TilePerformanceData[]
    budget: PerformanceBudget
    analytics: ReturnType<typeof this.getPerformanceAnalytics>
    recommendations: ReturnType<typeof this.getOptimizationRecommendations>
    exportedAt: string
  } {
    return {
      metrics: this.metrics,
      tiles: Array.from(this.tilePerformance.values()),
      budget: this.performanceBudget,
      analytics: this.getPerformanceAnalytics(),
      recommendations: this.getOptimizationRecommendations(),
      exportedAt: new Date().toISOString()
    }
  }
}

/**
 * Global performance monitor instance
 */
export const globalPerformanceMonitor = new TilePerformanceMonitor()

/**
 * React Hook for Performance Monitoring
 */
export function usePerformanceMonitor() {
  return {
    recordTileRender: globalPerformanceMonitor.recordTileRender.bind(globalPerformanceMonitor),
    recordTileInteraction: globalPerformanceMonitor.recordTileInteraction.bind(globalPerformanceMonitor),
    recordTileError: globalPerformanceMonitor.recordTileError.bind(globalPerformanceMonitor),
    recordCacheEvent: globalPerformanceMonitor.recordCacheEvent.bind(globalPerformanceMonitor),
    getAnalytics: globalPerformanceMonitor.getPerformanceAnalytics.bind(globalPerformanceMonitor),
    getRecommendations: globalPerformanceMonitor.getOptimizationRecommendations.bind(globalPerformanceMonitor),
    exportData: globalPerformanceMonitor.exportPerformanceData.bind(globalPerformanceMonitor),
    startMonitoring: globalPerformanceMonitor.startMonitoring.bind(globalPerformanceMonitor),
    stopMonitoring: globalPerformanceMonitor.stopMonitoring.bind(globalPerformanceMonitor)
  }
}

/**
 * Performance measurement decorator for tile functions
 */
export function measureTilePerformance(tileId: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now()
      
      try {
        const result = await method.apply(this, args)
        
        globalPerformanceMonitor.recordTileRender(
          tileId,
          startTime
        )
        
        return result
      } catch (error) {
        globalPerformanceMonitor.recordTileError(tileId, error as Error)
        throw error
      }
    }
  }
}

export default TilePerformanceMonitor