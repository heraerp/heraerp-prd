#!/usr/bin/env node
/**
 * HERA Universal Tile System - Load Testing
 * Production load testing to verify system performance under stress
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'
import { performance } from 'perf_hooks'
import * as os from 'os'

// Types
interface LoadTestConfig {
  environment: 'development' | 'production'
  duration: number        // Test duration in seconds
  rampUp: number         // Ramp up time in seconds
  maxUsers: number       // Maximum concurrent users
  requestsPerUser: number // Requests per user per minute
  testTypes: string[]    // Types of tests to run
}

interface LoadTestMetrics {
  timestamp: string
  requestCount: number
  responseTime: {
    min: number
    max: number
    avg: number
    p95: number
    p99: number
  }
  throughput: number     // Requests per second
  errorRate: number      // Percentage
  concurrentUsers: number
  memoryUsage: number    // MB
  cpuUsage: number       // Percentage
}

interface LoadTestResult {
  testName: string
  startTime: string
  endTime: string
  duration: number
  config: LoadTestConfig
  metrics: LoadTestMetrics[]
  summary: {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    avgResponseTime: number
    maxThroughput: number
    peakUsers: number
    errorRate: number
  }
  status: 'pass' | 'fail'
  issues: string[]
}

class TileSystemLoadTester {
  private config: LoadTestConfig
  private supabase: any
  private apiBaseUrl: string
  private metrics: LoadTestMetrics[] = []
  private requests: Array<{
    startTime: number
    endTime?: number
    success: boolean
    error?: string
  }> = []

  constructor(environment: 'development' | 'production' = 'production', config: Partial<LoadTestConfig> = {}) {
    const environments = {
      development: {
        supabaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || '',
        apiBaseUrl: 'https://qqagokigwuujyeyrgdkq.supabase.co/functions/v1'
      },
      production: {
        supabaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || '',
        apiBaseUrl: 'https://awfcrncxngqwbhqapffb.supabase.co/functions/v1'
      }
    }

    const env = environments[environment]
    if (!env.supabaseKey) {
      throw new Error('SUPABASE_ANON_KEY environment variable is required')
    }

    this.config = {
      environment,
      duration: 300,        // 5 minutes default
      rampUp: 60,          // 1 minute ramp up
      maxUsers: environment === 'production' ? 100 : 25,
      requestsPerUser: 20, // 20 requests per user per minute
      testTypes: ['database', 'api', 'tiles', 'stats'],
      ...config
    }

    this.supabase = createClient(env.supabaseUrl, env.supabaseKey)
    this.apiBaseUrl = env.apiBaseUrl
  }

  async runLoadTest(): Promise<LoadTestResult> {
    console.log(`🏋️  Starting load test for ${this.config.environment} environment...`)
    console.log(`Configuration:`)
    console.log(`  Duration: ${this.config.duration}s`)
    console.log(`  Max Users: ${this.config.maxUsers}`)
    console.log(`  Requests/User/Min: ${this.config.requestsPerUser}`)
    console.log(`  Test Types: ${this.config.testTypes.join(', ')}`)
    console.log('=' * 60)

    const startTime = new Date()
    let activeUsers = 0
    let testRunning = true

    // Start metrics collection
    const metricsInterval = setInterval(() => {
      this.collectMetrics(activeUsers)
    }, 5000) // Every 5 seconds

    // Ramp up users gradually
    const rampUpUsers = async () => {
      const usersPerSecond = this.config.maxUsers / this.config.rampUp
      let currentUsers = 0

      while (currentUsers < this.config.maxUsers && testRunning) {
        const newUsers = Math.ceil(usersPerSecond)
        for (let i = 0; i < newUsers && currentUsers < this.config.maxUsers; i++) {
          this.startUserSession(currentUsers++)
          activeUsers++
        }
        await this.sleep(1000) // Wait 1 second
      }
    }

    // Start ramp up
    const rampUpPromise = rampUpUsers()

    // Stop test after duration
    setTimeout(() => {
      testRunning = false
      clearInterval(metricsInterval)
    }, this.config.duration * 1000)

    // Wait for ramp up to complete
    await rampUpPromise

    console.log(`🎯 Reached ${activeUsers} concurrent users`)

    // Wait for test to complete
    while (testRunning) {
      await this.sleep(1000)
    }

    // Wait for remaining requests to complete
    console.log('🏁 Test completed, waiting for requests to finish...')
    await this.sleep(5000)

    const endTime = new Date()
    
    return this.generateResults(startTime, endTime)
  }

  private async startUserSession(userId: number) {
    const sessionDuration = this.config.duration * 1000
    const requestInterval = (60 * 1000) / this.config.requestsPerUser // ms between requests
    
    const runUserRequests = async () => {
      const startTime = Date.now()
      
      while (Date.now() - startTime < sessionDuration) {
        // Select random test type
        const testType = this.config.testTypes[Math.floor(Math.random() * this.config.testTypes.length)]
        
        // Execute request
        await this.executeRequest(testType, userId)
        
        // Wait before next request
        await this.sleep(requestInterval + (Math.random() * 1000)) // Add some jitter
      }
    }

    // Start user session asynchronously
    runUserRequests().catch(error => {
      console.error(`User ${userId} session error:`, error.message)
    })
  }

  private async executeRequest(testType: string, userId: number): Promise<void> {
    const requestStart = performance.now()
    const requestData = {
      startTime: requestStart,
      success: false,
      error: undefined
    }

    try {
      switch (testType) {
        case 'database':
          await this.testDatabaseLoad()
          break
        case 'api':
          await this.testAPILoad()
          break
        case 'tiles':
          await this.testTileLoad()
          break
        case 'stats':
          await this.testStatsLoad()
          break
        default:
          throw new Error(`Unknown test type: ${testType}`)
      }

      requestData.success = true
    } catch (error: any) {
      requestData.success = false
      requestData.error = error.message
    }

    requestData.endTime = performance.now()
    this.requests.push(requestData)
  }

  private async testDatabaseLoad(): Promise<void> {
    // Simulate typical database operations
    const operations = [
      () => this.supabase.from('core_entities').select('id, entity_type').limit(10),
      () => this.supabase.from('core_entities').select('count(*)').eq('entity_type', 'APP_TILE_TEMPLATE'),
      () => this.supabase.from('core_dynamic_data').select('field_name, field_type').limit(5),
      () => this.supabase.from('core_relationships').select('relationship_type').limit(5)
    ]

    const operation = operations[Math.floor(Math.random() * operations.length)]
    const { error } = await operation()
    
    if (error) {
      throw new Error(`Database operation failed: ${error.message}`)
    }
  }

  private async testAPILoad(): Promise<void> {
    // Test API endpoints
    const endpoints = [
      `${this.apiBaseUrl}/api-v2/health`,
      `${this.apiBaseUrl}/api-v2`
    ]

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok && response.status !== 404 && response.status !== 405) {
      throw new Error(`API request failed: ${response.status}`)
    }
  }

  private async testTileLoad(): Promise<void> {
    // Test tile-specific operations
    const { data, error } = await this.supabase
      .from('core_entities')
      .select('id, entity_name, smart_code')
      .eq('entity_type', 'APP_TILE_TEMPLATE')
      .limit(5)

    if (error) {
      throw new Error(`Tile query failed: ${error.message}`)
    }

    // If we have tiles, test dynamic data retrieval
    if (data && data.length > 0) {
      const randomTile = data[Math.floor(Math.random() * data.length)]
      const { error: dynamicError } = await this.supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_json')
        .eq('entity_id', randomTile.id)
        .limit(3)

      // Dynamic data might not exist, so don't fail on this
    }
  }

  private async testStatsLoad(): Promise<void> {
    // Test stats queries
    const statsQueries = [
      () => this.supabase.from('core_entities').select('count(*)').eq('entity_type', 'APP_TILE_TEMPLATE'),
      () => this.supabase.from('core_entities').select('count(*)'),
      () => this.supabase.from('core_dynamic_data').select('count(*)'),
      () => this.supabase.from('core_relationships').select('count(*)')
    ]

    const query = statsQueries[Math.floor(Math.random() * statsQueries.length)]
    const { error } = await query()
    
    if (error) {
      throw new Error(`Stats query failed: ${error.message}`)
    }
  }

  private collectMetrics(activeUsers: number): void {
    const now = Date.now()
    const recentRequests = this.requests.filter(r => 
      r.endTime && (now - r.endTime) < 10000 // Last 10 seconds
    )

    if (recentRequests.length === 0) {
      return
    }

    const responseTimes = recentRequests.map(r => r.endTime! - r.startTime)
    const successfulRequests = recentRequests.filter(r => r.success)
    const failedRequests = recentRequests.filter(r => !r.success)

    responseTimes.sort((a, b) => a - b)

    const metrics: LoadTestMetrics = {
      timestamp: new Date().toISOString(),
      requestCount: recentRequests.length,
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
        p99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0
      },
      throughput: recentRequests.length / 10, // Requests per second over 10 second window
      errorRate: (failedRequests.length / recentRequests.length) * 100,
      concurrentUsers: activeUsers,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0 // Would need more complex calculation
    }

    this.metrics.push(metrics)
    
    console.log(`📊 ${activeUsers} users, ${metrics.throughput.toFixed(1)} req/s, ${metrics.responseTime.avg.toFixed(0)}ms avg, ${metrics.errorRate.toFixed(1)}% errors`)
  }

  private generateResults(startTime: Date, endTime: Date): LoadTestResult {
    const totalRequests = this.requests.length
    const successfulRequests = this.requests.filter(r => r.success).length
    const failedRequests = totalRequests - successfulRequests

    const responseTimes = this.requests
      .filter(r => r.endTime)
      .map(r => r.endTime! - r.startTime)

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0

    const maxThroughput = this.metrics.length > 0 
      ? Math.max(...this.metrics.map(m => m.throughput))
      : 0

    const peakUsers = this.metrics.length > 0
      ? Math.max(...this.metrics.map(m => m.concurrentUsers))
      : 0

    const errorRate = totalRequests > 0 
      ? (failedRequests / totalRequests) * 100 
      : 0

    // Determine if test passed or failed
    const issues: string[] = []
    let status: 'pass' | 'fail' = 'pass'

    // Performance thresholds
    const thresholds = this.config.environment === 'production' ? {
      maxAvgResponseTime: 500,    // 500ms
      maxErrorRate: 2,            // 2%
      minThroughput: 50           // 50 req/s
    } : {
      maxAvgResponseTime: 1000,   // 1s
      maxErrorRate: 5,            // 5%
      minThroughput: 20           // 20 req/s
    }

    if (avgResponseTime > thresholds.maxAvgResponseTime) {
      issues.push(`Average response time too high: ${avgResponseTime.toFixed(2)}ms (threshold: ${thresholds.maxAvgResponseTime}ms)`)
      status = 'fail'
    }

    if (errorRate > thresholds.maxErrorRate) {
      issues.push(`Error rate too high: ${errorRate.toFixed(1)}% (threshold: ${thresholds.maxErrorRate}%)`)
      status = 'fail'
    }

    if (maxThroughput < thresholds.minThroughput) {
      issues.push(`Throughput too low: ${maxThroughput.toFixed(1)} req/s (threshold: ${thresholds.minThroughput} req/s)`)
      status = 'fail'
    }

    return {
      testName: `tile_system_load_test_${this.config.environment}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: (endTime.getTime() - startTime.getTime()) / 1000,
      config: this.config,
      metrics: this.metrics,
      summary: {
        totalRequests,
        successfulRequests,
        failedRequests,
        avgResponseTime,
        maxThroughput,
        peakUsers,
        errorRate
      },
      status,
      issues
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async generateReport(result: LoadTestResult): Promise<string> {
    const statusEmoji = result.status === 'pass' ? '✅' : '❌'
    
    let report = `
# HERA Tile System - Load Test Report

**Test Name:** ${result.testName}
**Status:** ${statusEmoji} ${result.status.toUpperCase()}
**Environment:** ${result.config.environment}
**Start Time:** ${result.startTime}
**End Time:** ${result.endTime}
**Duration:** ${result.duration.toFixed(2)} seconds

## Test Configuration

- **Max Concurrent Users:** ${result.config.maxUsers}
- **Requests per User per Minute:** ${result.config.requestsPerUser}
- **Ramp Up Time:** ${result.config.rampUp}s
- **Test Types:** ${result.config.testTypes.join(', ')}

## Performance Summary

- **Total Requests:** ${result.summary.totalRequests.toLocaleString()}
- **Successful Requests:** ${result.summary.successfulRequests.toLocaleString()} (${((result.summary.successfulRequests / result.summary.totalRequests) * 100).toFixed(1)}%)
- **Failed Requests:** ${result.summary.failedRequests.toLocaleString()} (${result.summary.errorRate.toFixed(1)}%)
- **Average Response Time:** ${result.summary.avgResponseTime.toFixed(2)}ms
- **Peak Throughput:** ${result.summary.maxThroughput.toFixed(1)} requests/second
- **Peak Concurrent Users:** ${result.summary.peakUsers}

## Performance Metrics Over Time

${result.metrics.slice(0, 10).map((metric, index) => `
**Sample ${index + 1}** (${new Date(metric.timestamp).toLocaleTimeString()})
- Concurrent Users: ${metric.concurrentUsers}
- Throughput: ${metric.throughput.toFixed(1)} req/s
- Avg Response Time: ${metric.responseTime.avg.toFixed(2)}ms
- P95 Response Time: ${metric.responseTime.p95.toFixed(2)}ms
- Error Rate: ${metric.errorRate.toFixed(1)}%
- Memory Usage: ${metric.memoryUsage.toFixed(1)}MB
`).join('')}

${result.metrics.length > 10 ? `\n... and ${result.metrics.length - 10} more samples\n` : ''}

${result.issues.length > 0 ? `## ⚠️ Issues Identified

${result.issues.map(issue => `- ❌ ${issue}`).join('\n')}
` : '## ✅ Performance Benchmarks Met\n\nAll performance thresholds were satisfied during the load test.'}

## Recommendations

${result.status === 'fail' ? `
### 🚨 Performance Issues Detected

${result.summary.avgResponseTime > 500 ? '- **Response Time**: Consider database indexing, query optimization, or increased compute resources\n' : ''}${result.summary.errorRate > 2 ? '- **Error Rate**: Investigate error logs and implement better error handling and retries\n' : ''}${result.summary.maxThroughput < 50 ? '- **Throughput**: Scale horizontally with more server instances or optimize request handling\n' : ''}
- **Monitoring**: Implement real-time monitoring and alerting for production
- **Scaling**: Consider auto-scaling based on load metrics
- **Caching**: Implement caching strategies for frequently accessed data
` : `
### ✅ System Ready for Production Load

- The system performed well under the simulated load
- Continue monitoring performance in production
- Consider implementing the load testing as part of CI/CD pipeline
- Set up automated performance regression detection
`}

---
*Generated by HERA Tile System Load Tester*
    `

    return report.trim()
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const environment = (args[0] || process.env.NODE_ENV || 'production') as 'development' | 'production'
  
  const config: Partial<LoadTestConfig> = {}
  
  // Parse command line options
  if (args.includes('--quick')) {
    config.duration = 60    // 1 minute
    config.maxUsers = 10
    config.rampUp = 15
  }
  
  if (args.includes('--stress')) {
    config.duration = 600   // 10 minutes
    config.maxUsers = environment === 'production' ? 200 : 50
    config.rampUp = 120     // 2 minutes
  }

  const durationArg = args.find(arg => arg.startsWith('--duration='))
  if (durationArg) {
    config.duration = parseInt(durationArg.split('=')[1])
  }

  const usersArg = args.find(arg => arg.startsWith('--users='))
  if (usersArg) {
    config.maxUsers = parseInt(usersArg.split('=')[1])
  }

  console.log(`🏋️  Initializing load test for ${environment} environment...`)
  
  const loadTester = new TileSystemLoadTester(environment, config)

  try {
    const result = await loadTester.runLoadTest()
    
    console.log('\n' + '=' * 60)
    console.log(`🏋️  LOAD TEST RESULTS`)
    console.log('=' * 60)
    console.log(`Status: ${result.status.toUpperCase()}`)
    console.log(`Total Requests: ${result.summary.totalRequests}`)
    console.log(`Success Rate: ${((result.summary.successfulRequests / result.summary.totalRequests) * 100).toFixed(1)}%`)
    console.log(`Avg Response Time: ${result.summary.avgResponseTime.toFixed(2)}ms`)
    console.log(`Peak Throughput: ${result.summary.maxThroughput.toFixed(1)} req/s`)
    console.log(`Peak Users: ${result.summary.peakUsers}`)
    
    if (result.issues.length > 0) {
      console.log('\n🚨 ISSUES:')
      result.issues.forEach(issue => console.log(`  - ${issue}`))
    }
    
    if (args.includes('--report')) {
      const report = await loadTester.generateReport(result)
      console.log(report)
      
      // Save report to file
      const reportsDir = path.join(process.cwd(), 'reports')
      await fs.mkdir(reportsDir, { recursive: true })
      
      const filename = `load-test-${environment}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
      const filepath = path.join(reportsDir, filename)
      
      await fs.writeFile(filepath, report, 'utf8')
      console.log(`\n📄 Detailed report saved to: ${filepath}`)
    }
    
    console.log('=' * 60)

    // Exit with appropriate code
    process.exit(result.status === 'pass' ? 0 : 1)
    
  } catch (error: any) {
    console.error('💥 Load test failed:', error.message)
    process.exit(1)
  }
}

// Export for programmatic use
export { TileSystemLoadTester, type LoadTestConfig, type LoadTestResult }

// Run if called directly
if (require.main === module) {
  main()
}