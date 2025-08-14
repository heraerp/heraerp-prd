const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Test environment configuration
    env: {
      // Demo data generation settings
      DEMO_MODE: true,
      PERSIST_DATA: true,
      
      // Database configuration for demo environment
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      
      // API endpoints
      API_BASE_URL: 'http://localhost:3000/api/v1',
      
      // Demo scenarios
      DEMO_SCENARIOS: {
        sales_demo: true,
        technical_demo: true,
        audit_workflow_demo: true,
        client_onboarding_demo: true,
        crm_uat_demo: true,
        performance_testing: true
      },
      
      // UAT Testing Configuration
      UAT_MODE: true,
      PERFORMANCE_TESTING: true,
      MOBILE_TESTING: true,
      ACCESSIBILITY_TESTING: true
    },
    
    // Test execution settings
    setupNodeEvents(on, config) {
      // Data generation tasks
      on('task', {
        // Database connection tasks
        connectToDatabase() {
          return { connected: true }
        },
        
        // Data cleanup tasks  
        cleanupDemoData(options) {
          console.log('Cleaning up demo data:', options)
          return null
        },
        
        // Report generation
        generateDataReport(data) {
          console.log('Generated demo data:', data)
          return null
        },
        
        // UAT-specific tasks
        generateTestReport(data) {
          const fs = require('fs')
          const path = require('path')
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const reportPath = path.join(__dirname, 'cypress', 'reports', `uat-report-${timestamp}.json`)
          
          // Ensure reports directory exists
          const reportsDir = path.dirname(reportPath)
          if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true })
          }
          
          fs.writeFileSync(reportPath, JSON.stringify(data, null, 2))
          
          console.log('📊 UAT Report generated:', reportPath)
          return reportPath
        },
        
        // Performance measurement
        measurePerformance(data) {
          console.log(`⚡ Performance: ${data.page} loaded in ${data.loadTime}ms`)
          return null
        },
        
        // Log demo progress
        logDemo(message) {
          console.log(`🎯 DEMO: ${message}`)
          return null
        }
      })
      
      return config
    },
    
    // Test file patterns
    specPattern: [
      'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
      'cypress/demo/**/*.cy.{js,jsx,ts,tsx}'
    ],
    
    // Test execution settings
    video: true,
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    
    // Performance settings
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Browser settings
    chromeWebSecurity: false,
    
    // Test isolation
    testIsolation: false // Allow data persistence between tests
  },
  
  // Component testing configuration
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})