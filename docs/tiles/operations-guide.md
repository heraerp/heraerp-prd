# HERA Universal Tile System - Operations Guide

## 🎯 Overview

This guide provides comprehensive operational procedures for deploying, monitoring, and maintaining the HERA Universal Tile System in production environments. It covers deployment strategies, performance optimization, security hardening, and troubleshooting procedures.

## 🚀 Deployment

### Pre-Deployment Checklist

Before deploying the tile system to production:

#### 1. Environment Validation
```bash
# Verify environment setup
npm run verify:prod

# Check database connectivity
npm run smoke:test

# Validate configuration
npm run config:validate
```

#### 2. Security Validation
- [ ] All environment variables configured
- [ ] JWT secrets properly set
- [ ] Database permissions validated
- [ ] API rate limits configured
- [ ] HTTPS certificates valid

#### 3. Performance Baseline
```bash
# Run load tests
npm run load:test

# Check cache configuration
npm run cache:validate

# Verify monitoring setup
npm run monitor:check
```

#### 4. Backup Preparation
```bash
# Create pre-deployment backup
npm run backup:create "Pre-deployment backup $(date)"

# Verify backup integrity
npm run backup:verify
```

### Deployment Strategies

#### Blue-Green Deployment (Recommended)

1. **Prepare Green Environment:**
   ```bash
   # Deploy to green environment
   npm run deploy:tiles:green

   # Run full verification
   npm run verify:prod -- --env=green

   # Run smoke tests
   npm run smoke:test -- --env=green
   ```

2. **Traffic Switch:**
   ```bash
   # Gradual traffic switch (10% -> 50% -> 100%)
   ./scripts/traffic-switch.sh --green-percent=10
   # Monitor for 10 minutes
   ./scripts/traffic-switch.sh --green-percent=50
   # Monitor for 10 minutes
   ./scripts/traffic-switch.sh --green-percent=100
   ```

3. **Rollback Plan:**
   ```bash
   # Quick rollback to blue if issues detected
   ./scripts/traffic-switch.sh --blue-percent=100
   ```

#### Rolling Deployment

1. **Deploy Phase by Phase:**
   ```bash
   # Deploy database changes first
   npm run deploy:database

   # Deploy API changes
   npm run deploy:api

   # Deploy frontend changes
   npm run deploy:frontend

   # Run verification after each phase
   npm run verify:prod:quick
   ```

#### Canary Deployment

1. **Deploy to Subset of Users:**
   ```bash
   # Deploy to 5% of users
   npm run deploy:canary --percentage=5

   # Monitor metrics
   npm run monitor:canary --duration=30m

   # Gradual rollout
   npm run deploy:canary --percentage=25
   npm run deploy:canary --percentage=100
   ```

### Automated Deployment Pipeline

#### Full Pipeline Execution
```bash
# Run complete deployment pipeline
npm run deploy:pipeline

# Force deployment (skip confirmations)
npm run deploy:pipeline:force

# Development environment
npm run deploy:pipeline:dev
```

#### Pipeline Stages

1. **Pre-deployment Checks** (5 minutes)
   - Environment validation
   - Security checks
   - Dependency verification

2. **Build and Quality Gates** (10 minutes)
   - TypeScript compilation
   - Linting and formatting
   - Unit test execution
   - Integration test execution

3. **Production Readiness** (5 minutes)
   - Infrastructure validation
   - Database connectivity
   - API endpoint verification

4. **Deployment Execution** (15 minutes)
   - Database migrations
   - API deployment
   - Frontend deployment
   - Cache warming

5. **Post-deployment Verification** (10 minutes)
   - Smoke tests
   - Load testing
   - Security validation

6. **Monitoring Setup** (5 minutes)
   - Health check activation
   - Performance monitoring
   - Error tracking setup

#### Pipeline Configuration

```yaml
# .github/workflows/deploy-tiles.yml
name: Deploy HERA Tile System

on:
  push:
    branches: [main]
    paths: ['src/components/tiles/**', 'src/lib/tiles/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Pre-deployment Checks
        run: npm run verify:prod
        
      - name: Run Tests
        run: |
          npm run test:tiles
          npm run test:integration
          
      - name: Build Application
        run: npm run build
        
      - name: Deploy to Production
        run: npm run deploy:tiles:prod
        env:
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          
      - name: Post-deployment Verification
        run: |
          npm run smoke:test
          npm run load:test:quick
          
      - name: Notify Success
        run: echo "Deployment successful!"
```

## 📊 Monitoring & Observability

### Health Monitoring

#### Automated Health Checks
```bash
# Start continuous health monitoring
npm run health:monitor

# Start performance monitoring
npm run perf:monitor

# Combined monitoring dashboard
npm run monitor:start
```

#### Health Check Endpoints
```bash
# Overall system health
curl https://your-domain.com/api/v2/health

# Tile system specific health
curl https://your-domain.com/api/v2/tiles/health

# Database health
curl https://your-domain.com/api/v2/health/database
```

#### Health Metrics Dashboard
Access the real-time dashboard at:
```
https://your-domain.com/admin/monitoring/dashboard
```

**Key Metrics Monitored:**
- API response times (p50, p95, p99)
- Database query performance
- Cache hit rates
- Error rates by endpoint
- Active user sessions
- Tile load times
- Memory and CPU usage

### Performance Monitoring

#### Application Performance Monitoring (APM)
```typescript
// Performance tracking in tile components
import { TilePerformanceTracker } from '@/lib/monitoring/performance'

const tracker = new TilePerformanceTracker()

// Track tile render performance
tracker.trackRender('tile_id', startTime, endTime)

// Track data load performance
tracker.trackDataLoad('tile_id', dataSource, responseTime)

// Track user interactions
tracker.trackInteraction('tile_id', 'action_id', responseTime)
```

#### Performance Alerts
Configure alerts for:
- Response time > 2 seconds (p95)
- Error rate > 2%
- Cache hit rate < 80%
- Memory usage > 80%
- CPU usage > 70%

#### Performance Optimization Commands
```bash
# Analyze performance bottlenecks
npm run perf:analyze

# Optimize cache configuration
npm run cache:optimize

# Database query optimization
npm run db:analyze-queries

# Bundle size analysis
npm run build:analyze
```

### Error Monitoring

#### Error Tracking Setup
```typescript
// Error tracking configuration
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http(),
    new Sentry.Integrations.Express()
  ],
  tracesSampleRate: 0.1
})

// Custom error tracking for tiles
export function trackTileError(tileId: string, error: Error, context: any) {
  Sentry.withScope(scope => {
    scope.setTag('component', 'tile')
    scope.setContext('tile', { id: tileId, ...context })
    Sentry.captureException(error)
  })
}
```

#### Error Resolution Workflow
1. **Error Detection** - Automated monitoring detects errors
2. **Alert Notification** - Team notified via Slack/email
3. **Impact Assessment** - Determine severity and user impact
4. **Investigation** - Use logs and monitoring to identify root cause
5. **Resolution** - Apply fix and verify resolution
6. **Post-mortem** - Document incident and prevention measures

### Logging

#### Structured Logging
```typescript
import { createLogger } from '@/lib/logging'

const logger = createLogger('tiles')

// Tile operation logging
logger.info('Tile loaded', {
  tileId: 'tile_123',
  templateId: 'template_456',
  userId: 'user_789',
  loadTime: 245,
  cacheHit: true
})

// Error logging
logger.error('Tile action failed', {
  tileId: 'tile_123',
  action: 'refresh',
  error: error.message,
  stack: error.stack,
  userId: 'user_789'
})
```

#### Log Aggregation
Logs are centralized using:
- **Development**: Console and file logs
- **Production**: Centralized logging service (CloudWatch, LogDNA, etc.)
- **Retention**: 90 days for audit compliance

#### Log Analysis
```bash
# Search logs for specific errors
npm run logs:search "tile action failed" --last=24h

# Analyze performance trends
npm run logs:analyze-performance --period=7d

# Generate error report
npm run logs:error-report --format=csv --period=30d
```

## 🔧 Maintenance

### Regular Maintenance Tasks

#### Daily Tasks
```bash
# Health check verification
npm run health:check

# Performance metrics review
npm run perf:review

# Error rate analysis
npm run monitor:errors --period=24h

# Cache performance check
npm run cache:analyze
```

#### Weekly Tasks
```bash
# Database maintenance
npm run db:maintenance

# Performance optimization
npm run perf:optimize

# Security scan
npm run security:scan

# Backup verification
npm run backup:verify
```

#### Monthly Tasks
```bash
# Full security audit
npm run security:audit

# Performance benchmarking
npm run perf:benchmark

# Capacity planning analysis
npm run capacity:analyze

# Documentation updates
npm run docs:update
```

### Database Maintenance

#### Index Optimization
```sql
-- Analyze tile query performance
EXPLAIN ANALYZE SELECT * FROM core_entities 
WHERE entity_type = 'APP_TILE_TEMPLATE' 
AND organization_id = $1;

-- Index maintenance for tile tables
REINDEX TABLE core_entities;
REINDEX TABLE core_dynamic_data;
REINDEX TABLE core_relationships;

-- Update table statistics
ANALYZE core_entities;
ANALYZE core_dynamic_data;
ANALYZE core_relationships;
```

#### Database Cleanup
```bash
# Clean up old tile data
npm run db:cleanup:tiles --older-than=90d

# Remove orphaned dynamic data
npm run db:cleanup:orphans

# Vacuum and analyze tables
npm run db:vacuum
```

#### Backup Maintenance
```bash
# Automated backup creation
npm run backup:create:scheduled

# Backup retention cleanup
npm run backup:cleanup

# Backup integrity verification
npm run backup:verify:all

# Test backup restoration
npm run backup:test-restore
```

### Cache Management

#### Cache Optimization
```bash
# Analyze cache performance
npm run cache:analyze

# Clear cache selectively
npm run cache:clear --pattern="tiles:*"

# Warm up cache
npm run cache:warmup

# Configure cache policies
npm run cache:configure
```

#### Cache Monitoring
```typescript
// Cache performance monitoring
interface CacheMetrics {
  hitRate: number      // Percentage of cache hits
  missRate: number     // Percentage of cache misses
  evictionRate: number // Rate of cache evictions
  avgResponseTime: number // Average cache response time
}

// Monitor cache health
async function monitorCacheHealth(): Promise<CacheMetrics> {
  const redis = getRedisClient()
  const stats = await redis.info('stats')
  
  return {
    hitRate: calculateHitRate(stats),
    missRate: calculateMissRate(stats),
    evictionRate: calculateEvictionRate(stats),
    avgResponseTime: await measureResponseTime()
  }
}
```

### Security Maintenance

#### Security Updates
```bash
# Check for security vulnerabilities
npm audit

# Update dependencies
npm update

# Security patch deployment
npm run security:patch

# Vulnerability scanning
npm run security:scan
```

#### Access Control Review
```bash
# Review user permissions
npm run admin:audit-permissions

# Check for stale access
npm run admin:stale-access --threshold=90d

# Generate security report
npm run admin:security-report
```

#### Security Hardening
```bash
# Enable security headers
npm run security:headers

# Configure rate limiting
npm run security:rate-limits

# SSL/TLS configuration
npm run security:ssl-check
```

## 🔒 Security Operations

### Security Incident Response

#### Incident Categories
1. **Data Breach** - Unauthorized access to sensitive data
2. **Service Disruption** - DDoS or availability attacks
3. **Privilege Escalation** - Unauthorized permission elevation
4. **Malicious Code** - Injection attacks or malware

#### Response Procedures

1. **Immediate Containment:**
   ```bash
   # Enable maintenance mode
   npm run admin:maintenance --enable
   
   # Block suspicious IPs
   npm run security:block-ips --file=suspicious_ips.txt
   
   # Revoke compromised API keys
   npm run security:revoke-keys --keys=COMPROMISED_KEYS
   ```

2. **Investigation:**
   ```bash
   # Analyze access logs
   npm run security:analyze-logs --period=24h
   
   # Check for unusual patterns
   npm run security:anomaly-detection
   
   # Generate incident report
   npm run security:incident-report --id=INCIDENT_ID
   ```

3. **Recovery:**
   ```bash
   # Apply security patches
   npm run security:patch:emergency
   
   # Reset compromised credentials
   npm run security:reset-credentials
   
   # Verify system integrity
   npm run security:integrity-check
   ```

### Compliance

#### GDPR Compliance
```bash
# Data export for user requests
npm run privacy:export-data --user=USER_ID

# Data deletion for user requests
npm run privacy:delete-data --user=USER_ID --confirm

# Generate privacy report
npm run privacy:report
```

#### SOC 2 Compliance
```bash
# Access control audit
npm run compliance:access-audit

# System availability report
npm run compliance:availability-report

# Security controls verification
npm run compliance:security-controls
```

## 🚨 Troubleshooting

### Common Issues

#### Tile Loading Issues

**Problem:** Tiles not loading or showing errors

**Diagnostic Commands:**
```bash
# Check tile configuration
npm run debug:tile-config --id=TILE_ID

# Test data source connectivity
npm run debug:data-source --tile=TILE_ID

# Verify user permissions
npm run debug:permissions --user=USER_ID --tile=TILE_ID
```

**Resolution Steps:**
1. Check network connectivity to data sources
2. Verify user has required permissions
3. Check for data source errors in logs
4. Validate tile configuration

#### Performance Issues

**Problem:** Slow tile loading or timeouts

**Diagnostic Commands:**
```bash
# Performance analysis
npm run debug:performance --tile=TILE_ID

# Database query analysis
npm run debug:queries --slow --period=1h

# Cache analysis
npm run debug:cache --pattern="tiles:*"
```

**Resolution Steps:**
1. Optimize database queries
2. Increase cache timeout
3. Reduce data payload size
4. Scale infrastructure resources

#### Permission Errors

**Problem:** Users can't access tiles they should be able to

**Diagnostic Commands:**
```bash
# Check user roles
npm run debug:user-roles --user=USER_ID

# Verify organization membership
npm run debug:org-membership --user=USER_ID

# Test permission evaluation
npm run debug:permissions --user=USER_ID --resource=TILE_ID
```

### Emergency Procedures

#### Emergency Rollback
```bash
# Quick rollback to previous version
npm run rollback:emergency

# Rollback specific component
npm run rollback:component --component=tiles

# Verify rollback success
npm run verify:rollback
```

#### Emergency Maintenance
```bash
# Enable emergency maintenance mode
npm run admin:emergency-maintenance

# Broadcast maintenance message
npm run admin:broadcast --message="Emergency maintenance in progress"

# Monitor during maintenance
npm run monitor:emergency
```

#### Disaster Recovery
```bash
# Execute disaster recovery plan
npm run disaster:execute --scenario=complete-failure

# Verify recovery
npm run disaster:verify

# Generate recovery report
npm run disaster:report
```

### Debug Tools

#### Tile Debug Mode
```typescript
// Enable debug mode for specific tiles
localStorage.setItem('hera:tiles:debug', 'true')

// Debug specific tile
import { debugTile } from '@/lib/debug/tiles'
debugTile('tile_id_here')

// Performance profiling
import { profileTilePerformance } from '@/lib/debug/performance'
profileTilePerformance('tile_id_here')
```

#### Log Analysis Tools
```bash
# Real-time log monitoring
npm run logs:tail --filter="tiles"

# Log analysis for specific time period
npm run logs:analyze --from="2024-01-01" --to="2024-01-02"

# Error pattern detection
npm run logs:patterns --type=errors
```

## 📈 Capacity Planning

### Resource Monitoring

#### Infrastructure Metrics
- **CPU Usage**: Target < 70% average
- **Memory Usage**: Target < 80% average  
- **Database Connections**: Monitor pool utilization
- **Cache Memory**: Monitor Redis memory usage
- **Network Bandwidth**: Monitor data transfer rates

#### Application Metrics
- **Concurrent Users**: Track peak and average
- **Tiles per User**: Monitor workspace complexity
- **API Requests/Second**: Track load patterns
- **Database Queries/Second**: Monitor query load

### Scaling Strategies

#### Horizontal Scaling
```yaml
# Kubernetes scaling configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hera-tiles-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: tiles-api
        image: hera-tiles:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"  
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: hera-tiles-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: hera-tiles-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### Database Scaling
```sql
-- Read replica configuration
-- Primary: Write operations
-- Replicas: Read operations for tile stats

-- Connection pooling optimization
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

#### Cache Scaling
```bash
# Redis cluster configuration
redis-cli --cluster create \
  127.0.0.1:7000 \
  127.0.0.1:7001 \
  127.0.0.1:7002 \
  --cluster-replicas 1
```

### Performance Benchmarks

#### Target Performance Metrics
- **Tile Load Time**: < 500ms (p95)
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Cache Hit Rate**: > 85%
- **Error Rate**: < 0.5%
- **Uptime**: > 99.9%

#### Load Testing
```bash
# Regular load testing
npm run load:test:weekly

# Stress testing
npm run load:test:stress --users=1000 --duration=10m

# Capacity testing
npm run load:test:capacity --target-rps=500
```

## 📋 Runbooks

### Production Deployment Runbook

1. **Pre-deployment** (30 minutes)
   - [ ] Create deployment backup
   - [ ] Run pre-deployment checks
   - [ ] Notify stakeholders
   - [ ] Prepare rollback plan

2. **Deployment** (45 minutes)
   - [ ] Deploy to staging and verify
   - [ ] Deploy to production
   - [ ] Run smoke tests
   - [ ] Monitor for 15 minutes

3. **Post-deployment** (15 minutes)
   - [ ] Verify all systems operational
   - [ ] Check performance metrics
   - [ ] Confirm user functionality
   - [ ] Update documentation

### Incident Response Runbook

1. **Detection** (5 minutes)
   - [ ] Alert received and acknowledged
   - [ ] Initial impact assessment
   - [ ] Assign incident commander
   - [ ] Create incident channel

2. **Investigation** (15 minutes)
   - [ ] Gather diagnostic information
   - [ ] Identify root cause
   - [ ] Assess impact scope
   - [ ] Determine resolution strategy

3. **Resolution** (30 minutes)
   - [ ] Apply fix or workaround
   - [ ] Monitor fix effectiveness
   - [ ] Verify system stability
   - [ ] Close incident

4. **Post-incident** (60 minutes)
   - [ ] Document incident details
   - [ ] Conduct post-mortem
   - [ ] Identify prevention measures
   - [ ] Update procedures

### Maintenance Runbook

1. **Scheduled Maintenance**
   - [ ] Schedule maintenance window
   - [ ] Notify users in advance
   - [ ] Create maintenance backup
   - [ ] Execute maintenance tasks
   - [ ] Verify system health
   - [ ] Notify completion

2. **Emergency Maintenance**
   - [ ] Assess urgency and impact
   - [ ] Enable maintenance mode
   - [ ] Notify stakeholders immediately
   - [ ] Execute emergency procedures
   - [ ] Monitor resolution
   - [ ] Document emergency response

---

*This operations guide provides the foundation for reliable production operation of the HERA Universal Tile System. Regular updates and team training ensure operational excellence.*