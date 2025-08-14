// Foundation Test: Audit Firm Onboarding Demo Data Generation
// Creates multiple audit firms with varied characteristics for demonstration

describe('🏢 Audit Firm Onboarding - Foundation Demo Data', () => {
  const auditFirms = []
  
  before(() => {
    cy.logDemo('Starting audit firm onboarding demo data generation')
  })
  
  it('should create diverse audit firms for demo scenarios', () => {
    // Generate 5 different types of audit firms
    const firmProfiles = [
      {
        type: 'big_four',
        name: 'Global Audit Excellence',
        specialization: ['Statutory Audit', 'Management Consulting', 'Risk Assessment'],
        size: { partners: 15, staff: 120 }
      },
      {
        type: 'mid_tier', 
        name: 'Regional Audit Partners',
        specialization: ['Statutory Audit', 'Tax Advisory', 'Internal Audit'],
        size: { partners: 8, staff: 45 }
      },
      {
        type: 'small_practice',
        name: 'Boutique Audit Services',
        specialization: ['Statutory Audit', 'Forensic Accounting'],
        size: { partners: 3, staff: 12 }
      },
      {
        type: 'sole_practitioner',
        name: 'Independent Audit Consultant',
        specialization: ['Statutory Audit', 'Compliance Review'],
        size: { partners: 1, staff: 2 }
      },
      {
        type: 'small_practice',
        name: 'Tech Audit Specialists',
        specialization: ['Statutory Audit', 'IT Audit', 'Cybersecurity Review'],
        size: { partners: 4, staff: 18 }
      }
    ]
    
    firmProfiles.forEach((profile, index) => {
      cy.logDemo(`Creating ${profile.type} audit firm: ${profile.name}`)
      
      cy.generateAuditFirm({
        firm_name: profile.name,
        firm_type: profile.type,
        specializations: profile.specialization,
        partner_count: profile.size.partners,
        staff_count: profile.size.staff,
        email: `demo.firm${index + 1}@heraaudit.com`,
        firm_code: `DEMO${index + 1}`
      }).then(firmData => {
        auditFirms.push(firmData)
        
        // Complete onboarding process
        cy.completeAuditOnboarding(firmData)
        
        // Verify successful registration
        cy.url().should('include', '/audit/login')
        cy.contains('Registration completed successfully')
        
        // Take screenshot for demo purposes
        cy.screenshotDemo(`audit-firm-${profile.type}-onboarding`)
        
        cy.logDemo(`✅ Created audit firm: ${firmData.firm_name} (${firmData.firm_code})`)
      })
    })
  })
  
  it('should verify audit firm login and dashboard access', () => {
    // Test login for the first created firm
    if (auditFirms.length > 0) {
      const testFirm = auditFirms[0]
      
      cy.logDemo(`Testing login for: ${testFirm.firm_name}`)
      
      cy.loginAuditSystem(testFirm.email, testFirm.password)
      
      // Verify dashboard loads with firm data
      cy.contains(testFirm.firm_name)
      cy.contains(testFirm.firm_code)
      
      // Check navigation elements
      cy.get('[data-testid="audit-sidebar"]').should('be.visible')
      cy.get('[data-testid="firm-header"]').should('contain', testFirm.firm_name)
      
      // Verify empty state for new firm
      cy.contains('No clients yet')
      cy.contains('Get started by adding your first client')
      
      cy.screenshotDemo('audit-dashboard-empty-state')
      
      cy.logDemo(`✅ Verified dashboard access for: ${testFirm.firm_name}`)
    }
  })
  
  after(() => {
    cy.logDemo('Audit firm onboarding demo data generation completed', {
      firmsCreated: auditFirms.length,
      firms: auditFirms.map(f => ({ name: f.firm_name, code: f.firm_code, type: f.firm_type }))
    })
  })
})