/**
 * Global teardown for E2E tests
 * Runs once after all tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up test data if configured
  if (process.env.CLEANUP_TEST_DATA === 'true') {
    console.log('🗑️  Cleaning up test data...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Load auth state if available
      const authStatePath = 'tests/e2e/setup/.auth/user.json';
      try {
        await context.addCookies(require(authStatePath).cookies);
      } catch (e) {
        console.log('No auth state found, skipping authenticated cleanup');
      }
      
      // Get all test organizations
      const response = await page.request.get(`${config.use?.baseURL}/api/v1/provisioning`, {
        params: {
          subdomain_prefix: 'test-'
        }
      });
      
      if (response.ok()) {
        const { organizations } = await response.json();
        
        // Delete each test organization
        for (const org of organizations) {
          if (org.subdomain.startsWith('test-')) {
            const deleteResponse = await page.request.delete(`${config.use?.baseURL}/api/v1/provisioning`, {
              data: { organizationId: org.id }
            });
            
            if (deleteResponse.ok()) {
              console.log(`✅ Deleted test organization: ${org.subdomain}`);
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
    } finally {
      await browser.close();
    }
  }
  
  // Generate test report summary
  if (process.env.GENERATE_TEST_SUMMARY === 'true') {
    console.log('📊 Generating test summary...');
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Read test results
      const resultsPath = path.join(process.cwd(), 'tests/reports/test-results.json');
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        
        // Generate summary
        const summary = {
          runId: process.env.TEST_RUN_ID,
          timestamp: new Date().toISOString(),
          totalTests: results.stats.expected,
          passed: results.stats.expected - results.stats.unexpected,
          failed: results.stats.unexpected,
          skipped: results.stats.skipped,
          duration: results.stats.duration,
          status: results.stats.unexpected === 0 ? 'PASSED' : 'FAILED'
        };
        
        // Write summary
        const summaryPath = path.join(process.cwd(), 'tests/reports/test-summary.json');
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        
        console.log(`✅ Test summary written to ${summaryPath}`);
        console.log(`📈 Results: ${summary.passed}/${summary.totalTests} passed (${summary.failed} failed)`);
      }
      
    } catch (error) {
      console.error('❌ Error generating test summary:', error);
    }
  }
  
  console.log('✨ Global teardown completed');
}

export default globalTeardown;