#!/usr/bin/env node

/**
 * HERA Build Performance Monitor
 * Tracks and reports build performance metrics
 */

const fs = require('fs')
const path = require('path')

class BuildPerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      endTime: null,
      phases: {},
      memoryUsage: [],
      errors: [],
      warnings: []
    }
    
    this.reportPath = '.next/performance-report.json'
  }
  
  startPhase(name) {
    this.metrics.phases[name] = {
      startTime: Date.now(),
      endTime: null,
      duration: null,
      memoryUsage: process.memoryUsage()
    }
    
    console.log(`📊 Phase started: ${name}`)
  }
  
  endPhase(name) {
    if (!this.metrics.phases[name]) {
      console.warn(`⚠️ Phase ${name} was not started`)
      return
    }
    
    const phase = this.metrics.phases[name]
    phase.endTime = Date.now()
    phase.duration = phase.endTime - phase.startTime
    
    console.log(`✅ Phase completed: ${name} (${phase.duration}ms)`)
  }
  
  recordMemoryUsage() {
    const usage = process.memoryUsage()
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      ...usage
    })
  }
  
  recordError(error) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
    })
  }
  
  recordWarning(warning) {
    this.metrics.warnings.push({
      timestamp: Date.now(),
      message: warning
    })
  }
  
  finalizeBuild() {
    this.metrics.endTime = Date.now()
    this.metrics.totalDuration = this.metrics.endTime - this.metrics.startTime
    
    // Calculate phase percentages
    Object.keys(this.metrics.phases).forEach(phaseName => {
      const phase = this.metrics.phases[phaseName]
      if (phase.duration) {
        phase.percentage = ((phase.duration / this.metrics.totalDuration) * 100).toFixed(2)
      }
    })
    
    this.generateReport()
  }
  
  generateReport() {
    const report = {
      ...this.metrics,
      summary: this.generateSummary(),
      recommendations: this.generateRecommendations()
    }
    
    // Ensure .next directory exists
    if (!fs.existsSync('.next')) {
      fs.mkdirSync('.next', { recursive: true })
    }
    
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2))
    
    console.log('\n📈 Build Performance Report')
    console.log('=' .repeat(50))
    console.log(this.formatSummary(report.summary))
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach(rec => console.log(`  • ${rec}`))
    console.log(`\n📄 Full report: ${this.reportPath}`)
  }
  
  generateSummary() {
    const maxMemory = Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed))
    const avgMemory = this.metrics.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / this.metrics.memoryUsage.length
    
    return {
      totalDuration: this.metrics.totalDuration,
      slowestPhase: this.getSlowestPhase(),
      maxMemoryUsage: this.formatBytes(maxMemory),
      avgMemoryUsage: this.formatBytes(avgMemory),
      errorCount: this.metrics.errors.length,
      warningCount: this.metrics.warnings.length
    }
  }
  
  getSlowestPhase() {
    let slowest = null
    let maxDuration = 0
    
    Object.entries(this.metrics.phases).forEach(([name, phase]) => {
      if (phase.duration && phase.duration > maxDuration) {
        maxDuration = phase.duration
        slowest = { name, duration: phase.duration }
      }
    })
    
    return slowest
  }
  
  generateRecommendations() {
    const recommendations = []
    
    if (this.metrics.totalDuration > 120000) { // > 2 minutes
      recommendations.push('Build time is over 2 minutes - consider enabling incremental builds')
    }
    
    const maxMemory = Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed))
    if (maxMemory > 6 * 1024 * 1024 * 1024) { // > 6GB
      recommendations.push('High memory usage detected - consider increasing --max-old-space-size')
    }
    
    if (this.metrics.errors.length > 0) {
      recommendations.push(`${this.metrics.errors.length} errors found - fix to improve build reliability`)
    }
    
    if (this.metrics.warnings.length > 10) {
      recommendations.push(`${this.metrics.warnings.length} warnings found - consider addressing to improve build quality`)
    }
    
    const slowestPhase = this.getSlowestPhase()
    if (slowestPhase && slowestPhase.duration > 60000) { // > 1 minute
      recommendations.push(`Phase "${slowestPhase.name}" is slow (${slowestPhase.duration}ms) - investigate optimization opportunities`)
    }
    
    return recommendations
  }
  
  formatSummary(summary) {
    return `
Total Duration: ${this.formatDuration(summary.totalDuration)}
Slowest Phase: ${summary.slowestPhase ? `${summary.slowestPhase.name} (${this.formatDuration(summary.slowestPhase.duration)})` : 'N/A'}
Max Memory: ${summary.maxMemoryUsage}
Avg Memory: ${summary.avgMemoryUsage}
Errors: ${summary.errorCount}
Warnings: ${summary.warningCount}
    `.trim()
  }
  
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }
  
  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }
}

// Global monitor instance
const monitor = new BuildPerformanceMonitor()

// Monitor memory usage every 5 seconds
const memoryInterval = setInterval(() => {
  monitor.recordMemoryUsage()
}, 5000)

// Cleanup on exit
process.on('exit', () => {
  clearInterval(memoryInterval)
  monitor.finalizeBuild()
})

process.on('SIGINT', () => {
  clearInterval(memoryInterval)
  monitor.finalizeBuild()
  process.exit(1)
})

process.on('SIGTERM', () => {
  clearInterval(memoryInterval)
  monitor.finalizeBuild()
  process.exit(1)
})

module.exports = monitor