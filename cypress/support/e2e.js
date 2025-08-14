// Cypress support file for demo data generation
import './commands'
import 'cypress-real-events'

// Global configuration for demo data generation
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  // This is useful for demo environments where some errors might be expected
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  return true
})

// Before all tests - setup demo environment
before(() => {
  if (Cypress.env('DEMO_MODE')) {
    cy.log('🚀 Starting HERA Demo Data Generation System')
    
    // Initialize demo environment
    cy.task('connectToDatabase')
    
    // Log demo configuration
    cy.log('Demo scenarios enabled:', Cypress.env('DEMO_SCENARIOS'))
  }
})

// After all tests - generate report
after(() => {
  if (Cypress.env('DEMO_MODE')) {
    cy.log('✅ Demo Data Generation Complete')
    
    // Generate data generation report
    cy.task('generateDataReport', {
      timestamp: new Date().toISOString(),
      scenarios: Cypress.env('DEMO_SCENARIOS'),
      dataGenerated: true
    })
  }
})

// Global error handling for demo data generation
Cypress.on('fail', (error, runnable) => {
  if (Cypress.env('DEMO_MODE')) {
    cy.log('❌ Demo data generation error:', error.message)
    
    // Continue execution for demo purposes
    if (error.message.includes('demo')) {
      return false
    }
  }
  
  throw error
})