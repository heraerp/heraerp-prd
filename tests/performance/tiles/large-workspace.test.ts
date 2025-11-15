/**
 * HERA Universal Tile System - Large Workspace Performance Tests
 * Performance testing for workspaces with many tiles and high concurrency
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { performance } from 'perf_hooks'

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  // API Response Times (ms)
  resolvedTiles: {
    small: 200,    // < 10 tiles
    medium: 500,   // 10-50 tiles
    large: 1000,   // 50-100 tiles
    xlarge: 2000   // 100+ tiles
  },
  
  // Stats execution times (ms)
  statsExecution: {
    single: 100,
    parallel: 300,
    batch: 1000
  },
  
  // Component render times (ms)
  componentRender: {
    singleTile: 50,
    workspace: 200,
    largeWorkspace: 1000
  },
  
  // Memory usage (MB)
  memoryUsage: {
    baseline: 100,
    maxIncrease: 500
  },
  
  // Concurrent requests
  concurrency: {
    maxUsers: 100,
    requestsPerUser: 10
  }
}

// Mock data generators
function generateMockTile(index: number, templateType: string = 'ENTITIES') {
  return {
    tileId: `tile-${index}`,
    workspaceId: 'large-workspace',
    templateId: `template-${templateType.toLowerCase()}`,
    tileType: templateType,
    operationCategory: 'data_management',
    enabled: true,
    
    ui: {
      title: `${templateType} Tile ${index}`,
      subtitle: `Generated tile for performance testing`,
      icon: 'Database',
      color: '#3B82F6'
    },
    
    layout: {
      size: ['small', 'medium', 'large'][index % 3],
      position: index
    },
    
    conditions: index % 5 === 0 ? [
      {
        field: 'user.role',
        operator: 'equals',
        value: 'admin'
      }
    ] : [],
    
    stats: [
      {
        statId: `stat-${index}-total`,
        label: `Total Records ${index}`,
        query: {
          table: 'core_entities',
          operation: 'count',
          conditions: [
            { field: 'entity_type', operator: 'equals', value: templateType }
          ]
        },
        format: 'number',
        isPrivate: false
      },
      {
        statId: `stat-${index}-recent`,
        label: `Recent Records ${index}`,
        query: {
          table: 'core_entities',
          operation: 'count',
          conditions: [
            { field: 'entity_type', operator: 'equals', value: templateType },
            { field: 'created_at', operator: 'date_after', value: '{{last_7_days}}' }
          ]
        },
        format: 'number',
        isPrivate: false
      }
    ],
    
    actions: [
      {
        actionId: `action-${index}-view`,
        label: 'View All',
        icon: 'Eye',
        actionType: 'NAVIGATE',
        isPrimary: true,
        requiresConfirmation: false,
        requiresPermission: index % 3 === 0,
        route: `/${templateType.toLowerCase()}`,
        parameters: { filter: `type-${index}` }
      },
      {
        actionId: `action-${index}-create`,
        label: 'Create New',
        icon: 'Plus',
        actionType: 'MODAL',
        isPrimary: false,
        requiresConfirmation: false,
        requiresPermission: true,
        route: '',
        parameters: { modalType: `${templateType.toLowerCase()}-form` }
      }
    ]
  }
}

function generateMockWorkspace(tileCount: number) {
  const tileTypes = ['ENTITIES', 'TRANSACTIONS', 'ANALYTICS', 'WORKFLOW', 'RELATIONSHIPS']
  
  return Array.from({ length: tileCount }, (_, index) => 
    generateMockTile(index, tileTypes[index % tileTypes.length])
  )
}

// Performance measurement utilities
class PerformanceProfiler {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()
  
  mark(name: string) {
    this.marks.set(name, performance.now())
  }
  
  measure(name: string, startMark?: string) {
    const endTime = performance.now()
    const startTime = startMark ? this.marks.get(startMark) || 0 : 0
    const duration = endTime - startTime
    this.measures.set(name, duration)
    return duration
  }
  
  getDuration(name: string): number {
    return this.measures.get(name) || 0
  }
  
  getAllMeasures(): Record<string, number> {
    return Object.fromEntries(this.measures)
  }
  
  clear() {
    this.marks.clear()
    this.measures.clear()
  }
}

// Memory usage measurement
function getMemoryUsage(): NodeJS.MemoryUsage {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage()
  }
  
  // Browser fallback
  return {
    rss: 0,
    heapTotal: (performance as any).memory?.totalJSHeapSize || 0,
    heapUsed: (performance as any).memory?.usedJSHeapSize || 0,
    external: 0,
    arrayBuffers: 0
  }
}

function bytesToMB(bytes: number): number {
  return bytes / 1024 / 1024
}

// Mock API functions for performance testing
async function mockResolvedTilesAPI(workspaceId: string, tileCount: number): Promise<any> {
  const tiles = generateMockWorkspace(tileCount)
  
  // Simulate database query time based on tile count
  const queryTime = Math.max(50, tileCount * 2) // 2ms per tile minimum
  await new Promise(resolve => setTimeout(resolve, queryTime))
  
  return {
    success: true,
    tiles,
    metadata: {
      workspaceId,
      totalTiles: tileCount,
      enabledTiles: tileCount,
      executionTime: queryTime
    }
  }
}

async function mockStatsAPI(tileId: string, statsCount: number): Promise<any> {
  // Simulate parallel stats execution
  const statPromises = Array.from({ length: statsCount }, async (_, index) => {
    const executionTime = 20 + Math.random() * 30 // 20-50ms per stat
    await new Promise(resolve => setTimeout(resolve, executionTime))
    
    return {
      statId: `stat-${index}`,
      value: Math.floor(Math.random() * 10000),
      formattedValue: (Math.floor(Math.random() * 10000)).toLocaleString(),
      label: `Stat ${index}`,
      format: 'number',
      executionTime,
      error: null
    }
  })
  
  const stats = await Promise.all(statPromises)
  
  return {
    success: true,
    stats,
    metadata: {
      tileId,
      totalStats: statsCount,
      successfulStats: statsCount,
      failedStats: 0
    }
  }
}

describe('Large Workspace Performance Tests', () => {
  const profiler = new PerformanceProfiler()
  let baselineMemory: NodeJS.MemoryUsage
  
  beforeAll(() => {
    // Establish memory baseline
    baselineMemory = getMemoryUsage()
  })
  
  beforeEach(() => {
    profiler.clear()
  })
  
  afterAll(() => {
    // Final memory check
    const finalMemory = getMemoryUsage()
    const memoryIncrease = bytesToMB(finalMemory.heapUsed - baselineMemory.heapUsed)
    
    console.log('Performance Test Summary:')
    console.log(`Memory Usage Increase: ${memoryIncrease.toFixed(2)} MB`)
    console.log(`Baseline Heap: ${bytesToMB(baselineMemory.heapUsed).toFixed(2)} MB`)
    console.log(`Final Heap: ${bytesToMB(finalMemory.heapUsed).toFixed(2)} MB`)
    
    expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage.maxIncrease)
  })

  describe('Resolved Tiles API Performance', () => {
    const testSizes = [
      { name: 'small', count: 5, threshold: PERFORMANCE_THRESHOLDS.resolvedTiles.small },
      { name: 'medium', count: 25, threshold: PERFORMANCE_THRESHOLDS.resolvedTiles.medium },
      { name: 'large', count: 75, threshold: PERFORMANCE_THRESHOLDS.resolvedTiles.large },
      { name: 'xlarge', count: 150, threshold: PERFORMANCE_THRESHOLDS.resolvedTiles.xlarge }
    ]

    testSizes.forEach(({ name, count, threshold }) => {
      it(`handles ${name} workspace (${count} tiles) within ${threshold}ms`, async () => {
        profiler.mark('api-start')
        
        const result = await mockResolvedTilesAPI('test-workspace', count)
        
        const duration = profiler.measure('api-total', 'api-start')
        
        expect(result.success).toBe(true)
        expect(result.tiles).toHaveLength(count)
        expect(duration).toBeLessThan(threshold)
        
        console.log(`${name} workspace (${count} tiles): ${duration.toFixed(2)}ms`)
      })
    })

    it('maintains linear performance scaling with tile count', async () => {
      const counts = [10, 20, 40, 80]
      const durations: number[] = []
      
      for (const count of counts) {
        profiler.mark(`scaling-${count}`)
        await mockResolvedTilesAPI('test-workspace', count)
        durations.push(profiler.measure(`scaling-${count}`, `scaling-${count}`))
      }
      
      // Check that performance scales roughly linearly (not exponentially)
      const firstHalf = durations.slice(0, 2)
      const secondHalf = durations.slice(2)
      
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length
      
      // Second half should not be more than 3x the first half (allowing for some overhead)
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 3)
      
      console.log('Scaling durations:', durations.map(d => `${d.toFixed(2)}ms`).join(', '))
    })
  })

  describe('Stats Execution Performance', () => {
    it('executes single tile stats within threshold', async () => {
      profiler.mark('stats-single-start')
      
      const result = await mockStatsAPI('test-tile', 2)
      
      const duration = profiler.measure('stats-single', 'stats-single-start')
      
      expect(result.success).toBe(true)
      expect(result.stats).toHaveLength(2)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.statsExecution.single)
      
      console.log(`Single tile stats: ${duration.toFixed(2)}ms`)
    })

    it('executes multiple tile stats in parallel efficiently', async () => {
      const tileCount = 10
      
      profiler.mark('stats-parallel-start')
      
      const promises = Array.from({ length: tileCount }, (_, index) =>
        mockStatsAPI(`tile-${index}`, 2)
      )
      
      const results = await Promise.all(promises)
      
      const duration = profiler.measure('stats-parallel', 'stats-parallel-start')
      
      expect(results).toHaveLength(tileCount)
      expect(results.every(r => r.success)).toBe(true)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.statsExecution.parallel)
      
      console.log(`Parallel stats (${tileCount} tiles): ${duration.toFixed(2)}ms`)
    })

    it('handles large batch stats requests efficiently', async () => {
      const largeBatch = Array.from({ length: 50 }, (_, index) => ({
        tileId: `batch-tile-${index}`,
        statsCount: 3
      }))
      
      profiler.mark('stats-batch-start')
      
      // Simulate batch processing with some parallelization
      const batchSize = 10
      const batches: Promise<any>[][] = []
      
      for (let i = 0; i < largeBatch.length; i += batchSize) {
        const batch = largeBatch.slice(i, i + batchSize).map(({ tileId, statsCount }) =>
          mockStatsAPI(tileId, statsCount)
        )
        batches.push(batch)
      }
      
      const results = await Promise.all(
        batches.map(batch => Promise.all(batch))
      )
      
      const duration = profiler.measure('stats-batch', 'stats-batch-start')
      
      const flatResults = results.flat()
      expect(flatResults).toHaveLength(50)
      expect(flatResults.every(r => r.success)).toBe(true)
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.statsExecution.batch)
      
      console.log(`Batch stats (50 tiles): ${duration.toFixed(2)}ms`)
    })
  })

  describe('Memory Usage Performance', () => {
    it('maintains reasonable memory usage with large tile sets', async () => {
      const initialMemory = getMemoryUsage()
      
      // Create large datasets
      const largeTilesets = [
        generateMockWorkspace(100),
        generateMockWorkspace(100),
        generateMockWorkspace(100)
      ]
      
      const afterCreationMemory = getMemoryUsage()
      const creationIncrease = bytesToMB(afterCreationMemory.heapUsed - initialMemory.heapUsed)
      
      console.log(`Memory increase after creating 300 tiles: ${creationIncrease.toFixed(2)} MB`)
      
      // Process the datasets
      for (let i = 0; i < largeTilesets.length; i++) {
        const tileset = largeTilesets[i]
        
        // Simulate processing each tile
        for (const tile of tileset) {
          // Simulate condition evaluation
          if (tile.conditions.length > 0) {
            // Mock condition evaluation
          }
          
          // Simulate stats calculation
          tile.stats.forEach(stat => {
            // Mock stats calculation
          })
        }
      }
      
      const afterProcessingMemory = getMemoryUsage()
      const totalIncrease = bytesToMB(afterProcessingMemory.heapUsed - initialMemory.heapUsed)
      
      console.log(`Total memory increase: ${totalIncrease.toFixed(2)} MB`)
      expect(totalIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage.maxIncrease)
    })

    it('cleans up memory after processing large datasets', async () => {
      const initialMemory = getMemoryUsage()
      
      // Create and process large dataset
      let largeTileset = generateMockWorkspace(200)
      
      // Process the dataset
      largeTileset.forEach(tile => {
        // Simulate heavy processing
        tile.stats.forEach(stat => {
          // Create temporary objects that should be garbage collected
          const tempData = {
            processed: true,
            calculations: Array.from({ length: 100 }, (_, i) => i * 2),
            metadata: { timestamp: Date.now() }
          }
          // Simulate using the temporary data
          tempData.calculations.reduce((sum, val) => sum + val, 0)
        })
      })
      
      const beforeCleanupMemory = getMemoryUsage()
      
      // Clear references to allow garbage collection
      largeTileset = null as any
      
      // Force garbage collection if available
      if (typeof global !== 'undefined' && global.gc) {
        global.gc()
      }
      
      // Wait a bit for garbage collection
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const afterCleanupMemory = getMemoryUsage()
      
      const beforeCleanupIncrease = bytesToMB(beforeCleanupMemory.heapUsed - initialMemory.heapUsed)
      const afterCleanupIncrease = bytesToMB(afterCleanupMemory.heapUsed - initialMemory.heapUsed)
      
      console.log(`Before cleanup: ${beforeCleanupIncrease.toFixed(2)} MB increase`)
      console.log(`After cleanup: ${afterCleanupIncrease.toFixed(2)} MB increase`)
      
      // Memory should decrease after cleanup (or at least not increase significantly)
      expect(afterCleanupIncrease).toBeLessThanOrEqual(beforeCleanupIncrease * 1.1)
    })
  })

  describe('Concurrency Performance', () => {
    it('handles concurrent API requests efficiently', async () => {
      const concurrentRequests = 20
      const tilesPerRequest = 25
      
      profiler.mark('concurrency-start')
      
      // Simulate concurrent users requesting resolved tiles
      const promises = Array.from({ length: concurrentRequests }, (_, index) =>
        mockResolvedTilesAPI(`workspace-${index}`, tilesPerRequest)
      )
      
      const results = await Promise.all(promises)
      
      const duration = profiler.measure('concurrency-total', 'concurrency-start')
      
      expect(results).toHaveLength(concurrentRequests)
      expect(results.every(r => r.success)).toBe(true)
      
      // Should not take much longer than a single request
      const singleRequestEstimate = tilesPerRequest * 2 // 2ms per tile
      expect(duration).toBeLessThan(singleRequestEstimate * 3) // Allow 3x overhead
      
      console.log(`Concurrent requests (${concurrentRequests}x${tilesPerRequest} tiles): ${duration.toFixed(2)}ms`)
    })

    it('maintains performance under sustained load', async () => {
      const loadDuration = 2000 // 2 seconds
      const requestInterval = 100 // Every 100ms
      
      const requests: Promise<any>[] = []
      const startTime = performance.now()
      
      profiler.mark('sustained-load-start')
      
      const intervalId = setInterval(() => {
        if (performance.now() - startTime > loadDuration) {
          clearInterval(intervalId)
          return
        }
        
        requests.push(mockResolvedTilesAPI('load-test-workspace', 20))
      }, requestInterval)
      
      // Wait for load test to complete
      await new Promise(resolve => setTimeout(resolve, loadDuration + 500))
      
      // Wait for all requests to complete
      const results = await Promise.all(requests)
      
      const duration = profiler.measure('sustained-load', 'sustained-load-start')
      
      expect(results.length).toBeGreaterThan(15) // Should have made multiple requests
      expect(results.every(r => r.success)).toBe(true)
      
      const avgRequestTime = duration / results.length
      expect(avgRequestTime).toBeLessThan(200) // Average request should be fast
      
      console.log(`Sustained load (${results.length} requests over ${loadDuration}ms): avg ${avgRequestTime.toFixed(2)}ms per request`)
    })
  })

  describe('Data Processing Performance', () => {
    it('efficiently processes large condition sets', async () => {
      const largeConditionSets = Array.from({ length: 1000 }, (_, index) => ({
        field: `field_${index % 50}`,
        operator: ['equals', 'not_equals', 'contains', 'greater_than'][index % 4],
        value: `value_${index}`
      }))
      
      profiler.mark('conditions-start')
      
      // Simulate condition evaluation
      const results = largeConditionSets.map(condition => {
        // Mock evaluation logic
        return condition.operator === 'equals' && condition.value.includes('1')
      })
      
      const duration = profiler.measure('conditions-total', 'conditions-start')
      
      expect(results).toHaveLength(1000)
      expect(duration).toBeLessThan(50) // Should be very fast
      
      console.log(`Large condition evaluation (1000 conditions): ${duration.toFixed(2)}ms`)
    })

    it('efficiently merges template and workspace tile data', async () => {
      const templates = generateMockWorkspace(50)
      const workspaceTiles = templates.map((template, index) => ({
        tileId: `workspace-${index}`,
        workspaceId: 'test-workspace',
        templateId: template.templateId,
        enabled: true,
        
        // Override some properties
        ui: {
          title: `Custom ${template.ui.title}`,
          subtitle: `Custom subtitle ${index}`
        },
        
        layout: {
          size: 'large',
          position: index * 2
        },
        
        // Add extra stats
        stats: [
          ...template.stats,
          {
            statId: `custom-stat-${index}`,
            label: `Custom Stat ${index}`,
            query: {
              table: 'core_entities',
              operation: 'count',
              conditions: []
            },
            format: 'number',
            isPrivate: false
          }
        ]
      }))
      
      profiler.mark('merge-start')
      
      // Simulate merging process
      const mergedTiles = templates.map((template, index) => {
        const workspaceTile = workspaceTiles[index]
        
        // Mock merge logic (simplified)
        return {
          ...template,
          ...workspaceTile,
          ui: { ...template.ui, ...workspaceTile.ui },
          layout: { ...template.layout, ...workspaceTile.layout },
          stats: workspaceTile.stats // Use workspace stats (includes template stats)
        }
      })
      
      const duration = profiler.measure('merge-total', 'merge-start')
      
      expect(mergedTiles).toHaveLength(50)
      expect(mergedTiles[0].stats).toHaveLength(3) // Original 2 + custom 1
      expect(duration).toBeLessThan(100)
      
      console.log(`Template merging (50 tiles): ${duration.toFixed(2)}ms`)
    })
  })

  describe('Real-world Scenario Performance', () => {
    it('simulates typical enterprise workspace load', async () => {
      // Simulate a large enterprise workspace
      const enterpriseScenario = {
        tiles: 85,
        statsPerTile: 3,
        actionsPerTile: 4,
        conditionsPerTile: 2,
        concurrentUsers: 25
      }
      
      profiler.mark('enterprise-scenario-start')
      
      // Phase 1: Load workspace tiles
      profiler.mark('enterprise-load-start')
      const workspaceTiles = await mockResolvedTilesAPI(
        'enterprise-workspace',
        enterpriseScenario.tiles
      )
      const loadDuration = profiler.measure('enterprise-load', 'enterprise-load-start')
      
      // Phase 2: Load stats for all tiles in parallel
      profiler.mark('enterprise-stats-start')
      const statsPromises = workspaceTiles.tiles.map((tile: any) =>
        mockStatsAPI(tile.tileId, enterpriseScenario.statsPerTile)
      )
      const allStats = await Promise.all(statsPromises)
      const statsDuration = profiler.measure('enterprise-stats', 'enterprise-stats-start')
      
      // Phase 3: Simulate user interactions
      profiler.mark('enterprise-interactions-start')
      const interactionPromises = Array.from({ length: enterpriseScenario.concurrentUsers }, async (_, userIndex) => {
        // Each user interacts with a few tiles
        const userTiles = workspaceTiles.tiles.slice(userIndex * 3, (userIndex * 3) + 3)
        
        for (const tile of userTiles) {
          // Simulate action execution delay
          await new Promise(resolve => setTimeout(resolve, 10))
        }
        
        return { userId: userIndex, interactionsCount: userTiles.length }
      })
      const interactions = await Promise.all(interactionPromises)
      const interactionsDuration = profiler.measure('enterprise-interactions', 'enterprise-interactions-start')
      
      const totalDuration = profiler.measure('enterprise-scenario', 'enterprise-scenario-start')
      
      // Assertions
      expect(workspaceTiles.success).toBe(true)
      expect(workspaceTiles.tiles).toHaveLength(enterpriseScenario.tiles)
      expect(allStats).toHaveLength(enterpriseScenario.tiles)
      expect(interactions).toHaveLength(enterpriseScenario.concurrentUsers)
      
      // Performance assertions
      expect(loadDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.resolvedTiles.xlarge)
      expect(statsDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.statsExecution.parallel * 2)
      expect(totalDuration).toBeLessThan(5000) // Total scenario under 5 seconds
      
      console.log('Enterprise Scenario Performance:')
      console.log(`  Load ${enterpriseScenario.tiles} tiles: ${loadDuration.toFixed(2)}ms`)
      console.log(`  Load ${enterpriseScenario.tiles * enterpriseScenario.statsPerTile} stats: ${statsDuration.toFixed(2)}ms`)
      console.log(`  Handle ${enterpriseScenario.concurrentUsers} user interactions: ${interactionsDuration.toFixed(2)}ms`)
      console.log(`  Total scenario: ${totalDuration.toFixed(2)}ms`)
    })

    it('validates performance requirements under stress', async () => {
      const stressScenario = {
        tiles: 200,
        statsPerTile: 5,
        concurrentUsers: 50,
        requestsPerUser: 10
      }
      
      profiler.mark('stress-test-start')
      
      // Create stress load
      const stressPromises = Array.from({ length: stressScenario.concurrentUsers }, async (_, userIndex) => {
        const userRequests = Array.from({ length: stressScenario.requestsPerUser }, async (_, requestIndex) => {
          const workspaceTiles = await mockResolvedTilesAPI(
            `stress-workspace-${userIndex}-${requestIndex}`,
            20 // Smaller per request but many concurrent
          )
          
          // Load some stats
          const randomTile = workspaceTiles.tiles[Math.floor(Math.random() * workspaceTiles.tiles.length)]
          const stats = await mockStatsAPI(randomTile.tileId, 2)
          
          return { workspaceTiles, stats }
        })
        
        return Promise.all(userRequests)
      })
      
      const results = await Promise.all(stressPromises)
      
      const duration = profiler.measure('stress-test', 'stress-test-start')
      
      // Verify all requests succeeded
      const flatResults = results.flat()
      expect(flatResults).toHaveLength(stressScenario.concurrentUsers * stressScenario.requestsPerUser)
      expect(flatResults.every(r => r.workspaceTiles.success && r.stats.success)).toBe(true)
      
      // Performance should still be reasonable under stress
      const avgRequestTime = duration / flatResults.length
      expect(avgRequestTime).toBeLessThan(500) // Average request under 500ms during stress
      
      console.log(`Stress Test (${stressScenario.concurrentUsers} users, ${stressScenario.requestsPerUser} req/user):`)
      console.log(`  Total time: ${duration.toFixed(2)}ms`)
      console.log(`  Average per request: ${avgRequestTime.toFixed(2)}ms`)
      console.log(`  Total requests: ${flatResults.length}`)
    })
  })
})