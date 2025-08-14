// Basic Setup Verification Test
// Validates that Cypress is working with HERA application

describe('🔧 Basic Setup Verification', () => {
  
  it('should connect to HERA application', () => {
    // Simple connectivity test
    cy.visit('/')
    cy.get('body').should('be.visible')
    
    // Log basic verification
    cy.log('✅ HERA application is accessible')
  })
  
  it('should generate basic test data using Faker', () => {
    // Test data factories work
    cy.generateAuditFirm({
      firm_name: 'Test Firm',
      firm_code: 'TEST'
    }).then(firmData => {
      expect(firmData).to.have.property('firm_name', 'Test Firm')
      expect(firmData).to.have.property('firm_code', 'TEST')
      expect(firmData).to.have.property('email')
      expect(firmData).to.have.property('phone')
      
      cy.log('✅ Data factories working correctly')
    })
  })
  
  it('should handle demo environment setup', () => {
    // Test demo manager functionality
    cy.initDemo({
      environment: 'test',
      persistData: false,
      monitoringEnabled: false
    }).then(config => {
      expect(config).to.have.property('environment', 'test')
      expect(config).to.have.property('persistData', false)
      
      cy.log('✅ Demo environment initialized')
    })
  })
  
  it('should verify audit login page accessibility', () => {
    // Test specific audit pages
    cy.visit('/audit/login')
    
    // Check for key elements
    cy.contains('Audit Portal').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
    
    cy.log('✅ Audit login page accessible')
  })
  
  it('should verify onboarding page accessibility', () => {
    // Test onboarding page (no sidebar)
    cy.visit('/audit/onboarding')
    
    // Should load without sidebar
    cy.get('body').should('be.visible')
    cy.contains('Personal Information').should('be.visible')
    
    // Verify no sidebar
    cy.get('[data-testid="audit-sidebar"]').should('not.exist')
    
    cy.log('✅ Onboarding page accessible without sidebar')
  })
})