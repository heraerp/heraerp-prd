#!/usr/bin/env node

/**
 * HERA Furniture Module - Phase 8: Performance Monitoring System
 * 
 * Tracks response times, query performance, resource usage,
 * and provides alerts for performance degradation.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { EventEmitter } = require('events');
const os = require('os');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class PerformanceMonitor extends EventEmitter {
  constructor(organizationId) {
    super();
    this.organizationId = organizationId;
    this.metrics = {
      api: new Map(),
      database: new Map(),
      system: [],
      alerts: []
    };
    this.thresholds = {
      apiResponseTime: 1000, // 1 second
      dbQueryTime: 500, // 500ms
      cpuUsage: 80, // 80%
      memoryUsage: 85, // 85%
      errorRate: 5 // 5%
    };
    this.monitoring = false;
    this.intervalId = null;
  }

  /**
   * Start monitoring
   */
  start(intervalMs = 60000) { // Default 1 minute
    if (this.monitoring) return;
    
    this.monitoring = true;
    console.log('🚀 Performance monitoring started');
    
    // Initial collection
    this.collectSystemMetrics();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.collectSystemMetrics();
      this.analyzePerformance();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoring = false;
    console.log('🛑 Performance monitoring stopped');
  }

  /**
   * Record API endpoint performance
   */
  recordApiMetric(endpoint, method, duration, statusCode, error = null) {
    const key = `${method}:${endpoint}`;
    
    if (!this.metrics.api.has(key)) {
      this.metrics.api.set(key, {
        endpoint,
        method,
        calls: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0,
        lastError: null,
        statusCodes: new Map()
      });
    }

    const metric = this.metrics.api.get(key);
    metric.calls++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.calls;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);

    // Track status codes
    const statusCount = metric.statusCodes.get(statusCode) || 0;
    metric.statusCodes.set(statusCode, statusCount + 1);

    if (error) {
      metric.errors++;
      metric.lastError = {
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }

    // Check for performance degradation
    if (duration > this.thresholds.apiResponseTime) {
      this.createAlert('api_slow', {
        endpoint: key,
        duration,
        threshold: this.thresholds.apiResponseTime
      });
    }

    // Check error rate
    const errorRate = (metric.errors / metric.calls) * 100;
    if (errorRate > this.thresholds.errorRate) {
      this.createAlert('high_error_rate', {
        endpoint: key,
        errorRate: errorRate.toFixed(2),
        threshold: this.thresholds.errorRate
      });
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseMetric(query, duration, rowCount = 0, error = null) {
    const queryType = this.extractQueryType(query);
    const table = this.extractTableName(query);
    const key = `${queryType}:${table}`;

    if (!this.metrics.database.has(key)) {
      this.metrics.database.set(key, {
        queryType,
        table,
        calls: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalRows: 0,
        avgRows: 0,
        errors: 0,
        slowQueries: []
      });
    }

    const metric = this.metrics.database.get(key);
    metric.calls++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.calls;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.totalRows += rowCount;
    metric.avgRows = metric.totalRows / metric.calls;

    if (error) {
      metric.errors++;
    }

    // Track slow queries
    if (duration > this.thresholds.dbQueryTime) {
      metric.slowQueries.push({
        query: query.substring(0, 100) + '...',
        duration,
        rowCount,
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 slow queries
      if (metric.slowQueries.length > 10) {
        metric.slowQueries.shift();
      }

      this.createAlert('slow_query', {
        table,
        queryType,
        duration,
        threshold: this.thresholds.dbQueryTime
      });
    }
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    const metric = {
      timestamp: new Date().toISOString(),
      cpu: this.getCpuUsage(),
      memory: this.getMemoryUsage(),
      uptime: process.uptime(),
      pid: process.pid
    };

    this.metrics.system.push(metric);

    // Keep only last hour of metrics (60 data points at 1-minute intervals)
    if (this.metrics.system.length > 60) {
      this.metrics.system.shift();
    }

    // Check system thresholds
    if (metric.cpu.percentage > this.thresholds.cpuUsage) {
      this.createAlert('high_cpu', {
        usage: metric.cpu.percentage.toFixed(2),
        threshold: this.thresholds.cpuUsage
      });
    }

    if (metric.memory.percentage > this.thresholds.memoryUsage) {
      this.createAlert('high_memory', {
        usage: metric.memory.percentage.toFixed(2),
        threshold: this.thresholds.memoryUsage
      });
    }

    return metric;
  }

  /**
   * Get CPU usage
   */
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return {
      percentage: usage,
      cores: cpus.length,
      model: cpus[0].model
    };
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const percentage = (usedMem / totalMem) * 100;

    return {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      percentage,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal
    };
  }

  /**
   * Extract query type from SQL
   */
  extractQueryType(query) {
    const normalizedQuery = query.trim().toUpperCase();
    if (normalizedQuery.startsWith('SELECT')) return 'SELECT';
    if (normalizedQuery.startsWith('INSERT')) return 'INSERT';
    if (normalizedQuery.startsWith('UPDATE')) return 'UPDATE';
    if (normalizedQuery.startsWith('DELETE')) return 'DELETE';
    return 'OTHER';
  }

  /**
   * Extract table name from query
   */
  extractTableName(query) {
    const matches = query.match(/(?:from|into|update|delete from)\s+`?(\w+)`?/i);
    return matches ? matches[1] : 'unknown';
  }

  /**
   * Create performance alert
   */
  createAlert(type, data) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this.getAlertSeverity(type),
      message: this.getAlertMessage(type, data),
      data,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.metrics.alerts.push(alert);
    this.emit('alert', alert);

    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts.shift();
    }

    return alert;
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      high_cpu: 'critical',
      high_memory: 'critical',
      api_slow: 'warning',
      slow_query: 'warning',
      high_error_rate: 'error'
    };
    return severityMap[type] || 'info';
  }

  /**
   * Get alert message
   */
  getAlertMessage(type, data) {
    const messages = {
      high_cpu: `CPU usage is ${data.usage}% (threshold: ${data.threshold}%)`,
      high_memory: `Memory usage is ${data.usage}% (threshold: ${data.threshold}%)`,
      api_slow: `API endpoint ${data.endpoint} took ${data.duration}ms (threshold: ${data.threshold}ms)`,
      slow_query: `Database query on ${data.table} took ${data.duration}ms (threshold: ${data.threshold}ms)`,
      high_error_rate: `Error rate for ${data.endpoint} is ${data.errorRate}% (threshold: ${data.threshold}%)`
    };
    return messages[type] || 'Unknown alert';
  }

  /**
   * Analyze overall performance
   */
  analyzePerformance() {
    const analysis = {
      timestamp: new Date().toISOString(),
      api: this.analyzeApiPerformance(),
      database: this.analyzeDatabasePerformance(),
      system: this.analyzeSystemPerformance(),
      health: 'healthy'
    };

    // Determine overall health
    const issues = [];
    if (analysis.api.avgResponseTime > this.thresholds.apiResponseTime) issues.push('Slow API');
    if (analysis.database.avgQueryTime > this.thresholds.dbQueryTime) issues.push('Slow DB');
    if (analysis.system.avgCpu > this.thresholds.cpuUsage) issues.push('High CPU');
    if (analysis.system.avgMemory > this.thresholds.memoryUsage) issues.push('High Memory');

    if (issues.length >= 3) {
      analysis.health = 'critical';
    } else if (issues.length >= 1) {
      analysis.health = 'warning';
    }

    this.emit('analysis', analysis);
    return analysis;
  }

  /**
   * Analyze API performance
   */
  analyzeApiPerformance() {
    let totalCalls = 0;
    let totalDuration = 0;
    let totalErrors = 0;
    const slowEndpoints = [];

    this.metrics.api.forEach((metric, key) => {
      totalCalls += metric.calls;
      totalDuration += metric.totalDuration;
      totalErrors += metric.errors;

      if (metric.avgDuration > this.thresholds.apiResponseTime) {
        slowEndpoints.push({
          endpoint: key,
          avgDuration: metric.avgDuration,
          calls: metric.calls
        });
      }
    });

    return {
      totalCalls,
      avgResponseTime: totalCalls > 0 ? totalDuration / totalCalls : 0,
      errorRate: totalCalls > 0 ? (totalErrors / totalCalls) * 100 : 0,
      slowEndpoints: slowEndpoints.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5)
    };
  }

  /**
   * Analyze database performance
   */
  analyzeDatabasePerformance() {
    let totalQueries = 0;
    let totalDuration = 0;
    const slowTables = [];

    this.metrics.database.forEach((metric, key) => {
      totalQueries += metric.calls;
      totalDuration += metric.totalDuration;

      if (metric.avgDuration > this.thresholds.dbQueryTime) {
        slowTables.push({
          table: key,
          avgDuration: metric.avgDuration,
          calls: metric.calls
        });
      }
    });

    return {
      totalQueries,
      avgQueryTime: totalQueries > 0 ? totalDuration / totalQueries : 0,
      slowTables: slowTables.sort((a, b) => b.avgDuration - a.avgDuration).slice(0, 5)
    };
  }

  /**
   * Analyze system performance
   */
  analyzeSystemPerformance() {
    if (this.metrics.system.length === 0) {
      return { avgCpu: 0, avgMemory: 0, uptime: 0 };
    }

    const totalCpu = this.metrics.system.reduce((sum, m) => sum + m.cpu.percentage, 0);
    const totalMemory = this.metrics.system.reduce((sum, m) => sum + m.memory.percentage, 0);
    const latestMetric = this.metrics.system[this.metrics.system.length - 1];

    return {
      avgCpu: totalCpu / this.metrics.system.length,
      avgMemory: totalMemory / this.metrics.system.length,
      currentCpu: latestMetric.cpu.percentage,
      currentMemory: latestMetric.memory.percentage,
      uptime: latestMetric.uptime
    };
  }

  /**
   * Get performance report
   */
  getReport() {
    const analysis = this.analyzePerformance();
    const activeAlerts = this.metrics.alerts.filter(a => !a.resolved);
    
    return {
      summary: {
        health: analysis.health,
        monitoring: this.monitoring,
        timestamp: analysis.timestamp
      },
      api: {
        ...analysis.api,
        endpoints: Array.from(this.metrics.api.entries()).map(([key, metric]) => ({
          key,
          ...metric,
          statusCodes: Array.from(metric.statusCodes.entries())
        }))
      },
      database: {
        ...analysis.database,
        queries: Array.from(this.metrics.database.entries()).map(([key, metric]) => ({
          key,
          ...metric
        }))
      },
      system: {
        ...analysis.system,
        history: this.metrics.system.slice(-10) // Last 10 data points
      },
      alerts: {
        active: activeAlerts.length,
        total: this.metrics.alerts.length,
        recent: this.metrics.alerts.slice(-10).reverse()
      },
      thresholds: this.thresholds
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics.api.clear();
    this.metrics.database.clear();
    this.metrics.system = [];
    this.metrics.alerts = [];
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

// Simulate performance metrics for testing
async function simulateMetrics(monitor) {
  console.log('📊 Simulating performance metrics...\n');

  // Simulate API calls
  const endpoints = [
    { path: '/api/furniture/products', method: 'GET', avgTime: 150 },
    { path: '/api/furniture/orders', method: 'GET', avgTime: 200 },
    { path: '/api/furniture/orders', method: 'POST', avgTime: 300 },
    { path: '/api/furniture/inventory', method: 'GET', avgTime: 1200 }, // Slow endpoint
    { path: '/api/furniture/customers', method: 'GET', avgTime: 180 }
  ];

  for (const endpoint of endpoints) {
    for (let i = 0; i < 10; i++) {
      const duration = endpoint.avgTime + (Math.random() - 0.5) * 100;
      const statusCode = Math.random() > 0.95 ? 500 : 200;
      const error = statusCode === 500 ? new Error('Server error') : null;
      
      monitor.recordApiMetric(
        endpoint.path,
        endpoint.method,
        duration,
        statusCode,
        error
      );
    }
  }

  // Simulate database queries
  const queries = [
    { query: 'SELECT * FROM core_entities WHERE entity_type = ?', table: 'core_entities', avgTime: 50 },
    { query: 'SELECT * FROM universal_transactions ORDER BY created_at', table: 'universal_transactions', avgTime: 800 }, // Slow query
    { query: 'INSERT INTO core_dynamic_data VALUES (?)', table: 'core_dynamic_data', avgTime: 30 },
    { query: 'UPDATE core_entities SET status = ? WHERE id = ?', table: 'core_entities', avgTime: 40 }
  ];

  for (const queryInfo of queries) {
    for (let i = 0; i < 5; i++) {
      const duration = queryInfo.avgTime + (Math.random() - 0.5) * 50;
      const rowCount = Math.floor(Math.random() * 100);
      
      monitor.recordDatabaseMetric(
        queryInfo.query,
        duration,
        rowCount
      );
    }
  }
}

// CLI interface
async function main() {
  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
  const monitor = new PerformanceMonitor(organizationId);

  // Set up event listeners
  monitor.on('alert', alert => {
    console.log(`\n🚨 Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
  });

  monitor.on('analysis', analysis => {
    console.log(`\n📈 Performance Analysis - Health: ${analysis.health.toUpperCase()}`);
  });

  const command = process.argv[2];

  try {
    switch (command) {
      case 'monitor':
        console.log('Starting performance monitoring...\n');
        monitor.start(5000); // Check every 5 seconds for demo
        
        // Simulate some metrics
        await simulateMetrics(monitor);

        // Keep monitoring for 30 seconds
        setTimeout(() => {
          const report = monitor.getReport();
          console.log('\n📋 Final Performance Report:');
          console.log(JSON.stringify(report, null, 2));
          monitor.stop();
          process.exit(0);
        }, 30000);
        break;

      case 'simulate':
        await simulateMetrics(monitor);
        const report = monitor.getReport();
        console.log('\n📋 Performance Report:');
        console.log(JSON.stringify(report, null, 2));
        break;

      case 'thresholds':
        console.log('Current thresholds:');
        console.log(JSON.stringify(monitor.thresholds, null, 2));
        break;

      default:
        console.log(`
HERA Furniture Performance Monitoring System

Usage:
  node furniture-phase8-performance-monitor.js <command>

Commands:
  monitor     Start real-time performance monitoring
  simulate    Run performance simulation and generate report
  thresholds  Show current performance thresholds

Examples:
  node furniture-phase8-performance-monitor.js monitor
  node furniture-phase8-performance-monitor.js simulate
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = { PerformanceMonitor };

// Run CLI if called directly
if (require.main === module) {
  main();
}