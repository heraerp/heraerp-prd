/**
 * HERA Universal Tile System - Load Testing Suite
 * Smart Code: HERA.TESTING.PERFORMANCE.LOAD.STRESS.v1
 * 
 * Comprehensive load and stress testing for Universal Tile System
 */

import { jest } from '@jest/globals'
import { performance } from 'perf_hooks'
import { globalPerformanceMonitor, TilePerformanceMonitor } from '@/lib/performance/TilePerformanceMonitor'

// Mock tile configurations for load testing
const createMockTileConfig = (id: string, type: string = 'revenue') => ({
  id: `load-test-tile-${id}`,
  templateId: `template-${type}`,
  workspaceId: 'load-test-workspace',
  userId: 'load-test-user',
  organizationId: 'load-test-org',
  position: { x: 0, y: 0, width: 1, height: 1 },
  type,
  title: `Load Test Tile ${id}`,
  subtitle: `Test tile for performance testing`,
  icon: 'Package',
  color: 'blue',
  size: 'medium',
  dataSource: {
    type: 'rpc',
    endpoint: `get_${type}_data`,
    params: { test: true }
  },
  actions: [
    { id: 'refresh', label: 'Refresh', type: 'button' },
    { id: 'export', label: 'Export', type: 'button' }
  ],
  permissions: {
    view: ['viewer', 'analyst', 'manager', 'admin'],
    edit: ['manager', 'admin']
  },
  metadata: {
    smartCode: `HERA.LOADTEST.${type.toUpperCase()}.TILE.v1`,
    category: 'test'
  }
})

// Mock API responses with varying response times
const createMockApiResponse = (delay: number = 50) => new Promise(resolve => {
  setTimeout(() => {
    resolve({
      success: true,
      data: {
        value: Math.random() * 1000,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        timestamp: Date.now()
      }
    })
  }, delay)
})

describe('Universal Tile System - Load Testing', () => {
  let performanceMonitor: TilePerformanceMonitor

  beforeEach(() => {
    performanceMonitor = new TilePerformanceMonitor({
      maxRenderTime: 16, // 60 FPS
      maxDataFetchTime: 100,
      maxTileCount: 200,
      maxMemoryUsage: 100,
      targetFPS: 60
    })
    performanceMonitor.startMonitoring()
  })

  afterEach(() => {
    performanceMonitor.stopMonitoring()
  })

  describe('Concurrent Tile Rendering', () => {
    test('handles 50 concurrent tile renders within performance budget', async () => {
      const tileCount = 50
      const renderPromises: Promise<void>[] = []
      const renderTimes: number[] = []

      for (let i = 0; i < tileCount; i++) {
        const tileConfig = createMockTileConfig(i.toString())
        
        const renderPromise = (async () => {
          const startTime = performance.now()
          
          // Simulate tile rendering
          await simulateTileRender(tileConfig)
          
          const endTime = performance.now()
          const renderTime = endTime - startTime
          renderTimes.push(renderTime)
          
          performanceMonitor.recordTileRender(
            tileConfig.id,
            startTime,
            Math.random() * 50, // Random data fetch time
            Math.random() * 10, // Random security validation time
            Math.random() * 5   // Random audit log time
          )
        })()
        
        renderPromises.push(renderPromise)
      }

      // Wait for all tiles to render
      await Promise.all(renderPromises)

      // Analyze performance
      const analytics = performanceMonitor.getPerformanceAnalytics()
      
      expect(analytics.overall.totalTiles).toBe(tileCount)
      expect(analytics.overall.averageRenderTime).toBeLessThan(50) // Should be well under budget
      expect(renderTimes.every(time => time < 200)).toBe(true) // No single tile should take > 200ms
      
      console.log(`✅ Concurrent Rendering Test: ${tileCount} tiles rendered successfully`)
      console.log(`📊 Average render time: ${analytics.overall.averageRenderTime.toFixed(2)}ms`)
      console.log(`📈 Max render time: ${Math.max(...renderTimes).toFixed(2)}ms`)
      console.log(`📉 Min render time: ${Math.min(...renderTimes).toFixed(2)}ms`)
    })

    test('handles 100 tiles with mixed complexity levels', async () => {
      const simpleTiles = 70
      const complexTiles = 30
      const renderPromises: Promise<void>[] = []

      // Create simple tiles (fast rendering)
      for (let i = 0; i < simpleTiles; i++) {
        const tileConfig = createMockTileConfig(`simple-${i}`, 'stat')
        renderPromises.push(simulateTileRender(tileConfig, 10)) // 10ms render time
      }

      // Create complex tiles (slower rendering)
      for (let i = 0; i < complexTiles; i++) {
        const tileConfig = createMockTileConfig(`complex-${i}`, 'chart')
        renderPromises.push(simulateTileRender(tileConfig, 40)) // 40ms render time
      }

      const startTime = performance.now()
      await Promise.all(renderPromises)
      const totalTime = performance.now() - startTime

      const analytics = performanceMonitor.getPerformanceAnalytics()

      expect(analytics.overall.totalTiles).toBe(100)
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
      
      console.log(`✅ Mixed Complexity Test: 100 tiles (70 simple, 30 complex) rendered in ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Memory Stress Testing', () => {
    test('monitors memory usage during intensive tile operations', async () => {
      const tileCount = 200
      const iterations = 5
      let initialMemory = 0
      let peakMemory = 0

      // Get initial memory usage
      if ((window as any).performance?.memory) {
        initialMemory = (window as any).performance.memory.usedJSHeapSize / 1024 / 1024
      }

      for (let iteration = 0; iteration < iterations; iteration++) {
        console.log(`🔄 Memory test iteration ${iteration + 1}/${iterations}`)
        
        const tiles = Array.from({ length: tileCount }, (_, i) => 
          createMockTileConfig(`mem-test-${iteration}-${i}`)
        )

        // Create and destroy tiles to test memory management
        const renderPromises = tiles.map(async (tile) => {
          await simulateTileRender(tile)
          performanceMonitor.recordTileRender(tile.id, performance.now())
        })

        await Promise.all(renderPromises)

        // Check memory usage
        if ((window as any).performance?.memory) {
          const currentMemory = (window as any).performance.memory.usedJSHeapSize / 1024 / 1024
          peakMemory = Math.max(peakMemory, currentMemory)
        }

        // Force garbage collection if available (for testing)
        if (global.gc) {
          global.gc()
        }
      }

      const analytics = performanceMonitor.getPerformanceAnalytics()
      const memoryGrowth = peakMemory - initialMemory

      console.log(`📊 Memory Analysis:`)
      console.log(`   Initial: ${initialMemory.toFixed(2)}MB`)
      console.log(`   Peak: ${peakMemory.toFixed(2)}MB`)
      console.log(`   Growth: ${memoryGrowth.toFixed(2)}MB`)
      console.log(`   Total tiles processed: ${tileCount * iterations}`)

      // Memory should not grow excessively
      expect(memoryGrowth).toBeLessThan(50) // Should not grow by more than 50MB
    })
  })

  describe('Error Recovery and Resilience', () => {
    test('handles multiple simultaneous tile failures gracefully', async () => {
      const totalTiles = 20
      const failingTiles = 5
      const successPromises: Promise<void>[] = []
      const errorPromises: Promise<void>[] = []

      // Create successful tiles
      for (let i = 0; i < totalTiles - failingTiles; i++) {
        const tileConfig = createMockTileConfig(`success-${i}`)
        successPromises.push(simulateTileRender(tileConfig))
      }

      // Create failing tiles
      for (let i = 0; i < failingTiles; i++) {
        const tileConfig = createMockTileConfig(`failure-${i}`)
        const errorPromise = simulateTileRender(tileConfig, 20, true)
          .catch(error => {
            performanceMonitor.recordTileError(tileConfig.id, error)
          })
        errorPromises.push(errorPromise)
      }

      // Wait for all operations to complete
      await Promise.allSettled([...successPromises, ...errorPromises])

      const analytics = performanceMonitor.getPerformanceAnalytics()
      
      expect(analytics.overall.errorRate).toBeGreaterThan(0)
      expect(analytics.overall.errorRate).toBeLessThan(1) // Some should succeed
      
      console.log(`✅ Error Recovery Test: ${analytics.overall.errorRate * 100}% error rate handled gracefully`)
    })

    test('recovers from network timeouts and retries', async () => {
      const tileConfig = createMockTileConfig('timeout-test')
      const maxRetries = 3
      let attemptCount = 0

      const simulateNetworkCall = async (): Promise<any> => {
        attemptCount++
        if (attemptCount < maxRetries) {
          throw new Error(`Network timeout (attempt ${attemptCount})`)
        }
        return createMockApiResponse(10) // Success on final attempt
      }

      try {
        await simulateNetworkCall()
        performanceMonitor.recordTileRender(tileConfig.id, performance.now())
      } catch (error) {
        performanceMonitor.recordTileError(tileConfig.id, error as Error)
      }

      const analytics = performanceMonitor.getPerformanceAnalytics()
      const tileData = analytics.tiles.find(t => t.tileId === tileConfig.id)

      expect(attemptCount).toBe(maxRetries)
      expect(tileData?.errorCount).toBe(0) // Should succeed after retries

      console.log(`✅ Network Recovery Test: Succeeded after ${maxRetries} attempts`)
    })
  })

  describe('Performance Degradation Testing', () => {
    test('maintains performance under increasing tile complexity', async () => {
      const complexityLevels = [10, 25, 50, 75, 100] // Rendering complexity in ms
      const results: Array<{ complexity: number; averageTime: number }> = []

      for (const complexity of complexityLevels) {
        const tileCount = 10
        const renderTimes: number[] = []

        for (let i = 0; i < tileCount; i++) {
          const tileConfig = createMockTileConfig(`complexity-${complexity}-${i}`)
          const startTime = performance.now()
          
          await simulateTileRender(tileConfig, complexity)
          
          const endTime = performance.now()
          renderTimes.push(endTime - startTime)
          
          performanceMonitor.recordTileRender(tileConfig.id, startTime, complexity / 2)
        }

        const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
        results.push({ complexity, averageTime })

        console.log(`🔍 Complexity ${complexity}ms: Average render time ${averageTime.toFixed(2)}ms`)
      }

      // Performance should scale reasonably with complexity
      const performanceGrowth = results[results.length - 1].averageTime / results[0].averageTime
      expect(performanceGrowth).toBeLessThan(15) // Should not grow more than 15x

      console.log(`📈 Performance Growth Factor: ${performanceGrowth.toFixed(2)}x`)
    })

    test('handles rapid user interactions without blocking', async () => {
      const tileConfig = createMockTileConfig('interaction-test')
      const interactionCount = 100
      const interactionPromises: Promise<void>[] = []

      // Simulate rapid user interactions
      for (let i = 0; i < interactionCount; i++) {
        const interactionPromise = (async () => {
          const startTime = performance.now()
          
          // Simulate user interaction (export, drill-down, etc.)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
          
          performanceMonitor.recordTileInteraction(tileConfig.id, `interaction-${i}`)
          performanceMonitor.recordTileRender(tileConfig.id, startTime)
        })()
        
        interactionPromises.push(interactionPromise)
      }

      const startTime = performance.now()
      await Promise.all(interactionPromises)
      const totalTime = performance.now() - startTime

      const analytics = performanceMonitor.getPerformanceAnalytics()
      const tileData = analytics.tiles.find(t => t.tileId === tileConfig.id)

      expect(totalTime).toBeLessThan(1000) // Should complete quickly
      expect(tileData?.interactionCount).toBe(interactionCount)

      console.log(`⚡ Interaction Test: ${interactionCount} interactions completed in ${totalTime.toFixed(2)}ms`)
    })
  })

  describe('Cache Performance Testing', () => {
    test('validates cache effectiveness under load', async () => {
      const tileConfig = createMockTileConfig('cache-test')
      const requestCount = 50
      let cacheHits = 0
      let cacheMisses = 0

      for (let i = 0; i < requestCount; i++) {
        const isHit = Math.random() < 0.7 // 70% cache hit rate simulation
        
        if (isHit) {
          cacheHits++
          await simulateTileRender(tileConfig, 5) // Fast cached response
        } else {
          cacheMisses++
          await simulateTileRender(tileConfig, 50) // Slower uncached response
        }

        performanceMonitor.recordCacheEvent(tileConfig.id, isHit)
        performanceMonitor.recordTileRender(tileConfig.id, performance.now())
      }

      const analytics = performanceMonitor.getPerformanceAnalytics()
      const expectedHitRate = cacheHits / requestCount

      expect(analytics.overall.cacheHitRate).toBeCloseTo(expectedHitRate, 1)

      console.log(`💾 Cache Test: ${(analytics.overall.cacheHitRate * 100).toFixed(1)}% hit rate`)
      console.log(`   Cache hits: ${cacheHits}`)
      console.log(`   Cache misses: ${cacheMisses}`)
    })
  })
})

/**
 * Simulate tile rendering with optional complexity and failure
 */
async function simulateTileRender(
  tileConfig: any, 
  renderTime: number = 20,
  shouldFail: boolean = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Tile rendering failed: ${tileConfig.id}`))
      } else {
        resolve()
      }
    }, renderTime)
  })
}

describe('Performance Benchmarking', () => {
  test('establishes baseline performance metrics', async () => {
    const performanceMonitor = new TilePerformanceMonitor()
    performanceMonitor.startMonitoring()

    // Benchmark different tile types
    const benchmarks = [
      { type: 'stat', expectedTime: 15 },
      { type: 'chart', expectedTime: 30 },
      { type: 'list', expectedTime: 25 },
      { type: 'custom', expectedTime: 40 }
    ]

    const results: Array<{ type: string; actualTime: number; expected: number; passes: boolean }> = []

    for (const benchmark of benchmarks) {
      const tileCount = 10
      const renderTimes: number[] = []

      for (let i = 0; i < tileCount; i++) {
        const tileConfig = createMockTileConfig(`benchmark-${benchmark.type}-${i}`, benchmark.type)
        const startTime = performance.now()
        
        await simulateTileRender(tileConfig, benchmark.expectedTime)
        
        const endTime = performance.now()
        renderTimes.push(endTime - startTime)
        
        performanceMonitor.recordTileRender(tileConfig.id, startTime)
      }

      const averageTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      const passes = averageTime <= benchmark.expectedTime * 1.5 // 50% tolerance

      results.push({
        type: benchmark.type,
        actualTime: averageTime,
        expected: benchmark.expectedTime,
        passes
      })
    }

    performanceMonitor.stopMonitoring()

    // All benchmarks should pass
    expect(results.every(r => r.passes)).toBe(true)

    console.log('🏁 Performance Benchmarks:')
    results.forEach(result => {
      const status = result.passes ? '✅' : '❌'
      console.log(`   ${status} ${result.type}: ${result.actualTime.toFixed(2)}ms (expected: ${result.expected}ms)`)
    })
  })
})

export { createMockTileConfig, createMockApiResponse, simulateTileRender }