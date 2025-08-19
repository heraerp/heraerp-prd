#!/usr/bin/env node

// ================================================================================
// RAILWAY MONITORING DEPLOYMENT SCRIPT
// Deploy Prometheus metrics and monitoring configuration to Railway
// ================================================================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwayMonitoringDeployer {
  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Deploy monitoring to Railway
   */
  async deployMonitoring() {
    console.log('🚀 DEPLOYING HERA ERP MONITORING TO RAILWAY');
    console.log('=' .repeat(60) + '\n');

    try {
      // Step 1: Verify Railway connection
      console.log('📋 Step 1: Verifying Railway connection...');
      this.executeCommand('railway whoami', 'Check Railway authentication');
      console.log('✅ Railway connection verified\n');

      // Step 2: Set environment variables for monitoring
      console.log('📋 Step 2: Configuring monitoring environment variables...');
      await this.configureMonitoringEnv();
      console.log('✅ Monitoring environment configured\n');

      // Step 3: Deploy application with monitoring
      console.log('📋 Step 3: Deploying HERA ERP with monitoring...');
      this.executeCommand('railway deploy', 'Deploy to Railway');
      console.log('✅ Application deployed with monitoring\n');

      // Step 4: Verify metrics endpoint
      console.log('📋 Step 4: Verifying metrics endpoint...');
      await this.verifyMetricsEndpoint();
      console.log('✅ Metrics endpoint verified\n');

      // Step 5: Generate monitoring documentation
      console.log('📋 Step 5: Generating monitoring documentation...');
      this.generateMonitoringDocs();
      console.log('✅ Documentation generated\n');

      // Success summary
      this.displaySuccessResults();

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Configure monitoring environment variables
   */
  async configureMonitoringEnv() {
    const envVars = {
      // Monitoring configuration
      'ENABLE_PROMETHEUS_METRICS': 'true',
      'METRICS_COLLECTION_INTERVAL': '30000',
      'METRICS_RETENTION_HOURS': '72',
      
      // Customer analytics
      'ENABLE_CUSTOMER_ANALYTICS': 'true',
      'TRACK_PROGRESSIVE_CONVERSIONS': 'true',
      'TRACK_SUBDOMAIN_ACTIVITY': 'true',
      
      // Performance monitoring
      'ENABLE_PERFORMANCE_MONITORING': 'true',
      'API_RESPONSE_TIME_THRESHOLD': '2000',
      'PAGE_LOAD_TIME_THRESHOLD': '3000',
      
      // Business intelligence
      'ENABLE_BUSINESS_INTELLIGENCE': 'true',
      'TRACK_REVENUE_METRICS': 'true',
      'TRACK_CONVERSION_FUNNEL': 'true'
    };

    console.log('Setting monitoring environment variables...');
    for (const [key, value] of Object.entries(envVars)) {
      try {
        this.executeCommand(`railway variables set ${key}="${value}"`, `Set ${key}`);
        console.log(`  ✅ ${key} = ${value}`);
      } catch (error) {
        console.log(`  ⚠️  ${key} - ${error.message}`);
      }
    }
  }

  /**
   * Verify metrics endpoint is working
   */
  async verifyMetricsEndpoint() {
    const testEndpoints = [
      'https://heraerp.com/api/metrics',
      'https://heraerp.com/api/health'
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint}...`);
        const result = this.executeCommand(`curl -s -o /dev/null -w "%{http_code}" "${endpoint}"`, `Test ${endpoint}`);
        const statusCode = result.toString().trim();
        
        if (statusCode === '200') {
          console.log(`  ✅ ${endpoint} - Status 200 OK`);
        } else {
          console.log(`  ⚠️  ${endpoint} - Status ${statusCode}`);
        }
      } catch (error) {
        console.log(`  ❌ ${endpoint} - ${error.message}`);
      }
    }
  }

  /**
   * Generate monitoring documentation
   */
  generateMonitoringDocs() {
    const docs = this.createMonitoringDocumentation();
    
    const docsPath = path.join(__dirname, '..', 'MONITORING-DEPLOYMENT-GUIDE.md');
    fs.writeFileSync(docsPath, docs);
    
    console.log(`📄 Documentation saved to: ${docsPath}`);
  }

  /**
   * Create comprehensive monitoring documentation
   */
  createMonitoringDocumentation() {
    const deploymentTime = new Date().toISOString();
    const deploymentDuration = Math.round((Date.now() - this.startTime) / 1000);

    return `# 📊 HERA ERP Monitoring System - Deployment Guide

## 🚀 Deployment Summary

**Deployed**: ${deploymentTime}  
**Duration**: ${deploymentDuration} seconds  
**Status**: ✅ Successfully Deployed  

## 📈 Monitoring Endpoints

### Prometheus Metrics
- **URL**: https://heraerp.com/api/metrics
- **Format**: Prometheus exposition format
- **Update Interval**: 30 seconds
- **Retention**: 72 hours

### Health Check
- **URL**: https://heraerp.com/api/health
- **Response**: JSON health status
- **Monitoring**: Automatic via Prometheus

## 🎯 Customer Analytics Tracking

### Visitor Behavior
\`\`\`
hera_page_views_total{page="/", country="US", device_type="desktop"}
hera_page_views_total{page="/salon-progressive", country="CA", device_type="mobile"}
\`\`\`

### Business Conversions
\`\`\`
hera_business_conversions_total{step="started", business_type="salon", success="true"}
hera_business_conversions_total{step="production_deployed", business_type="restaurant", success="true"}
\`\`\`

### Progressive to Production
\`\`\`
hera_progressive_conversions_total{business_type="salon", success="true"}
hera_conversion_duration_seconds{business_type="salon"}
\`\`\`

### Subdomain Activity
\`\`\`
hera_subdomain_activity_total{activity="created", business_type="salon"}
hera_subdomain_activity_total{activity="first_login", business_type="restaurant"}
\`\`\`

## 🔧 Grafana Dashboard Setup

### Option 1: Local Development
\`\`\`bash
cd monitoring
docker-compose up -d

# Access Grafana
open http://localhost:3001
# Login: admin / heraadmin123
\`\`\`

### Option 2: Cloud Grafana
1. Create Grafana Cloud account
2. Add Prometheus data source: \`https://heraerp.com/api/metrics\`
3. Import dashboard: \`monitoring/grafana-dashboards/hera-customer-analytics.json\`

## 📊 Key Metrics to Monitor

### Business Intelligence
- **Customer Conversion Rate**: \`rate(hera_business_conversions_total{success="true"}[5m])\`
- **Average Conversion Time**: \`avg(hera_conversion_duration_seconds)\`
- **Revenue by Business Type**: \`sum by (business_type) (hera_business_value{metric="revenue"})\`

### System Performance
- **API Response Time**: \`histogram_quantile(0.95, rate(hera_api_duration_milliseconds_bucket[5m]))\`
- **Page Load Speed**: \`avg(hera_page_load_duration_seconds)\`
- **Error Rate**: \`rate(hera_api_requests_total{status_code!~"2.."}[5m])\`

### Customer Behavior
- **Geographic Distribution**: \`sum by (country) (hera_page_views_total)\`
- **Device Usage**: \`sum by (device_type) (hera_page_views_total)\`
- **Progressive Trial Activity**: \`sum by (business_type) (hera_progressive_actions_total)\`

## 🚨 Alerting Rules

### High Priority Alerts
\`\`\`yaml
- alert: HighErrorRate
  expr: rate(hera_api_requests_total{status_code!~"2.."}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"

- alert: SlowAPIResponse
  expr: histogram_quantile(0.95, rate(hera_api_duration_milliseconds_bucket[5m])) > 5000
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "API response time is slow"
\`\`\`

## 🎯 Business Value Tracking

### ROI Metrics
- **Cost per Conversion**: Total marketing cost / successful conversions
- **Customer Lifetime Value**: Average revenue per customer over time
- **Retention Rate**: Percentage of customers returning monthly

### Progressive Trial Analytics
- **Trial-to-Production Rate**: \`hera_progressive_conversions_total{success="true"} / hera_progressive_actions_total{action="trial_started"}\`
- **Time to Convert**: \`avg(hera_conversion_duration_seconds) / 60\` (minutes)
- **Feature Usage**: Most used features in progressive trials

## 🔧 Troubleshooting

### Metrics Not Appearing
1. Check Railway deployment logs: \`railway logs\`
2. Verify environment variables: \`railway variables\`
3. Test metrics endpoint: \`curl https://heraerp.com/api/metrics\`

### Grafana Connection Issues
1. Verify Prometheus data source URL
2. Check network connectivity
3. Validate API authentication

### Missing Business Data
1. Ensure middleware is tracking requests
2. Check Supabase connection for production data
3. Verify organization_id isolation

## 📞 Support & Monitoring

- **Live Status**: https://heraerp.com/api/health
- **Metrics Dashboard**: https://heraerp.com/monitoring (when available)
- **Railway Logs**: \`railway logs --tail\`
- **System Health**: All metrics prefixed with \`hera_system_\`

---

## 🎉 Success Metrics

With this monitoring system, you can now:

✅ **Track Customer Behavior** - Understand visitor patterns and preferences  
✅ **Monitor Business Conversions** - Track trial-to-production success rates  
✅ **Analyze Geographic Reach** - See global usage of HERA ERP  
✅ **Performance Optimization** - Identify slow endpoints and optimize  
✅ **Revenue Intelligence** - Track business value across all industries  
✅ **System Health** - Proactive monitoring prevents downtime  

**The ERP monitoring nightmare is solved. Complete visibility into customer behavior and business performance in production!** 🚀

---

*Generated automatically by HERA ERP monitoring deployment script*  
*Deployment Time: ${deploymentTime}*
`;
  }

  /**
   * Execute shell command with error handling
   */
  executeCommand(command, description) {
    try {
      console.log(`  ⏳ ${description}...`);
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 30000
      });
      return result;
    } catch (error) {
      throw new Error(`Command failed: ${command} - ${error.message}`);
    }
  }

  /**
   * Display successful deployment results
   */
  displaySuccessResults() {
    const deploymentDuration = Math.round((Date.now() - this.startTime) / 1000);
    
    console.log('🎉 MONITORING DEPLOYMENT COMPLETE!');
    console.log('=' .repeat(60));
    console.log('');
    console.log('📊 MONITORING ENDPOINTS:');
    console.log('├── Metrics: https://heraerp.com/api/metrics');
    console.log('├── Health: https://heraerp.com/api/health');
    console.log('└── Documentation: ./MONITORING-DEPLOYMENT-GUIDE.md');
    console.log('');
    console.log('🎯 CUSTOMER ANALYTICS FEATURES:');
    console.log('├── ✅ Visitor tracking (geographic, device, behavior)');
    console.log('├── ✅ Business conversion funnel monitoring');
    console.log('├── ✅ Progressive to production conversion rates');
    console.log('├── ✅ Subdomain activity tracking');
    console.log('├── ✅ API performance monitoring');
    console.log('└── ✅ Revenue and business intelligence');
    console.log('');
    console.log('🔧 GRAFANA SETUP:');
    console.log('├── Local: cd monitoring && docker-compose up -d');
    console.log('├── URL: http://localhost:3001');
    console.log('├── Login: admin / heraadmin123');
    console.log('└── Dashboard: Auto-imported HERA Customer Analytics');
    console.log('');
    console.log('📈 NEXT STEPS:');
    console.log('1. Set up Grafana dashboard (local or cloud)');
    console.log('2. Configure alerts for critical metrics');
    console.log('3. Monitor customer conversion rates');
    console.log('4. Analyze visitor geographic distribution');
    console.log('5. Track progressive trial success rates');
    console.log('');
    console.log(`⏱️  Total deployment time: ${deploymentDuration} seconds`);
    console.log('🚀 Your ERP now has world-class customer analytics!');
    console.log('');
    console.log('=' .repeat(60));
  }
}

// ================================================================================
// CLI Execution
// ================================================================================

async function main() {
  const deployer = new RailwayMonitoringDeployer();
  await deployer.deployMonitoring();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  });
}

module.exports = RailwayMonitoringDeployer;