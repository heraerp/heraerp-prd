# HERA Universal Tile System - Monitoring & Health Checks

## Overview

The HERA Universal Tile System includes comprehensive monitoring and health check capabilities to ensure optimal performance and reliability in production environments.

## 🏥 Health Checks

### Quick Health Check
```bash
# Single health check
npm run health:check

# Production environment
npm run health:check:prod

# Generate detailed report
npm run health:check:report
```

### Continuous Monitoring
```bash
# Start continuous health monitoring (30s intervals)
npm run health:monitor

# Custom interval monitoring
npx tsx scripts/monitoring/tile-system-health.ts --continuous --interval=60
```

### Health Check Components

The system monitors:
- **Database Connectivity**: Connection time, query performance, RPC availability
- **API Endpoints**: Response times, error rates, throughput
- **Tile Templates**: Template availability and integrity
- **Stats Execution**: Query performance and error handling
- **Action Execution**: Action handling and processing
- **Performance Metrics**: Memory usage, response times, concurrent load

## 📊 Performance Metrics

### Performance Monitoring
```bash
# Single metrics snapshot
npm run perf:metrics

# Production environment
npm run perf:metrics:prod

# Generate performance report
npm run perf:report

# Continuous monitoring
npm run perf:monitor
```

### Metrics Collected

**System Metrics**:
- Memory usage (heap, RSS)
- CPU usage
- Process uptime

**Database Performance**:
- Connection time
- Query execution time
- Transaction performance
- Error rates

**API Performance**:
- Response times
- Throughput (requests/second)
- Error rates
- Concurrent users

**Tile System Specific**:
- Templates loaded count
- Workspace tiles count
- Average render time
- Stats executions
- Action executions

## 🚨 Alerting System

### Alert Levels
- **Normal**: All systems operating within thresholds
- **Warning**: Performance degradation detected
- **Critical**: System issues requiring immediate attention

### Alert Channels
- **Console**: Real-time console output
- **File**: JSON alert logs in `logs/alerts/`
- **Webhook**: HTTP webhook notifications (configurable)

### Configuring Alerts
```typescript
// Environment variables
HEALTH_CHECK_WEBHOOK_URL=https://your-webhook.com/alerts

// Custom configuration
const monitor = new TileSystemHealthMonitor({
  environment: 'production',
  thresholds: {
    responseTime: 500,    // 500ms threshold
    errorRate: 2,         // 2% error rate
    memoryUsage: 1024,    // 1GB memory
    cpuUsage: 85          // 85% CPU
  },
  alerts: {
    enabled: true,
    channels: ['console', 'file', 'webhook'],
    webhookUrl: process.env.HEALTH_CHECK_WEBHOOK_URL
  }
})
```

## 📈 Dashboard

### Web Dashboard
```bash
# Open monitoring dashboard
npm run monitor:dashboard
```

The dashboard provides:
- Real-time system status
- Performance metrics visualization
- Alert history
- Trend analysis
- Health check results

### Features
- **Auto-refresh**: Updates every 30 seconds
- **Responsive design**: Works on desktop and mobile
- **Interactive charts**: Click to refresh individual metrics
- **Alert notifications**: Real-time alert display
- **Performance trends**: Historical data visualization

## 🔧 Configuration

### Environment-Specific Settings

**Development**:
- More lenient thresholds
- Console + file logging
- 30-second check intervals

**Production**:
- Strict performance thresholds
- Webhook alerting enabled
- 15-second check intervals
- Enhanced security monitoring

### Customizing Thresholds

```typescript
// Development thresholds
const devThresholds = {
  database: { connectionTime: 200, queryTime: 1000, errorRate: 5 },
  api: { responseTime: 500, errorRate: 5 },
  memory: { heapUsed: 256 * 1024 * 1024, rss: 512 * 1024 * 1024 },
  cpu: { usage: 90 }
}

// Production thresholds
const prodThresholds = {
  database: { connectionTime: 100, queryTime: 500, errorRate: 1 },
  api: { responseTime: 200, errorRate: 1 },
  memory: { heapUsed: 512 * 1024 * 1024, rss: 1024 * 1024 * 1024 },
  cpu: { usage: 80 }
}
```

## 📋 Monitoring Commands Reference

| Command | Description |
|---------|-------------|
| `npm run health:check` | Single health check snapshot |
| `npm run health:check:prod` | Production environment health check |
| `npm run health:check:report` | Generate detailed health report |
| `npm run health:monitor` | Continuous health monitoring |
| `npm run perf:metrics` | Single performance metrics snapshot |
| `npm run perf:metrics:prod` | Production performance metrics |
| `npm run perf:monitor` | Continuous performance monitoring |
| `npm run perf:report` | Generate performance report |
| `npm run monitor:start` | Start both health and performance monitoring |
| `npm run monitor:dashboard` | Open web dashboard |

## 🚀 Integration with CI/CD

### Pre-Deployment Health Checks
```bash
# Add to deployment pipeline
npm run health:check:prod
npm run perf:metrics:prod

# Verify system is ready for deployment
if [ $? -eq 0 ]; then
  echo "✅ System healthy, proceeding with deployment"
else
  echo "❌ System unhealthy, aborting deployment"
  exit 1
fi
```

### Post-Deployment Verification
```bash
# Wait for deployment to settle
sleep 30

# Run comprehensive health check
npm run health:check:report

# Monitor for 5 minutes post-deployment
timeout 300 npm run health:monitor
```

## 📊 Metrics Storage

### Log Files
- **Health Checks**: `logs/alerts/tile-system-alert-*.json`
- **Performance Metrics**: `logs/performance/tile-system-metrics-*.jsonl`
- **Rotation**: Automatic cleanup of logs older than 30 days

### Metrics Format
```json
{
  "timestamp": "2024-01-20T15:30:00Z",
  "environment": "production",
  "system": {
    "memoryUsage": { "heapUsed": 268435456, "rss": 402653184 },
    "uptime": 7200
  },
  "database": {
    "connectionTime": 45.2,
    "queryTime": 123.5,
    "errorRate": 0.5
  },
  "api": {
    "responseTime": 180.3,
    "throughput": 45.6,
    "errorRate": 0.8,
    "concurrentUsers": 25
  },
  "tiles": {
    "templatesLoaded": 5,
    "workspaceTiles": 18,
    "avgRenderTime": 67.4
  },
  "alerts": {
    "level": "normal",
    "messages": []
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**High Memory Usage**:
```bash
# Check memory trends
npm run perf:report --hours=24

# Look for memory leaks
npm run perf:monitor | grep "High memory usage"
```

**Slow Database Queries**:
```bash
# Monitor database performance
npm run health:check | grep "Database"

# Check query optimization
psql $DATABASE_URL -c "EXPLAIN ANALYZE SELECT ..."
```

**API Response Times**:
```bash
# Monitor API performance
npm run perf:metrics | grep "Response Time"

# Check for bottlenecks
npm run health:check:report
```

### Alert Investigation

When alerts are triggered:
1. Check the dashboard for visual indicators
2. Review recent performance trends
3. Examine log files for detailed error information
4. Run targeted health checks for specific components
5. Verify system resources and network connectivity

## 🔒 Security Considerations

- Health check endpoints do not expose sensitive data
- Metrics are aggregated to prevent information leakage
- Alert webhooks use HTTPS and can include authentication
- Log files are stored securely with appropriate permissions
- Database health checks use read-only operations where possible

## 📚 Additional Resources

- **Health Check Script**: `scripts/monitoring/tile-system-health.ts`
- **Performance Monitor**: `scripts/monitoring/performance-metrics.ts`
- **Dashboard**: `scripts/monitoring/system-dashboard.html`
- **Configuration Examples**: See script headers for detailed options