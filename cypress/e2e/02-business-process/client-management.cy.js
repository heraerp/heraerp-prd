// Business Process Test: Client Management Demo Data Generation
// Creates comprehensive client portfolios for audit firms

describe('👥 Client Management - Business Process Demo Data', () => {
  let demoFirm
  const clients = []
  
  before(() => {
    cy.logDemo('Starting client management demo data generation')
    
    // Create a demo firm for client testing
    cy.generateAuditFirm({
      firm_name: 'Demo Client Management Firm',
      firm_code: 'DCM',
      email: 'demo.clientmgmt@heraaudit.com',
      firm_type: 'mid_tier',
      partner_count: 6,
      staff_count: 35
    }).then(firmData => {
      demoFirm = firmData
      cy.completeAuditOnboarding(firmData)
    })
  })
  
  it('should create diverse audit clients across industries', () => {
    // Login to demo firm
    cy.loginAuditSystem(demoFirm.email, demoFirm.password)
    
    // Define client scenarios for comprehensive demo
    const clientScenarios = [
      {
        industry: 'Manufacturing',
        riskLevel: 'High',
        auditHistory: 'First Time',
        size: 'Large'
      },
      {
        industry: 'Trading',
        riskLevel: 'Medium', 
        auditHistory: 'Recurring',
        size: 'Medium'
      },
      {
        industry: 'Real Estate',
        riskLevel: 'High',
        auditHistory: 'Changed Auditor',
        size: 'Large'
      },
      {
        industry: 'Technology',
        riskLevel: 'Medium',
        auditHistory: 'Recurring',
        size: 'Small'
      },
      {
        industry: 'Healthcare',
        riskLevel: 'Low',
        auditHistory: 'Recurring',
        size: 'Medium'
      },
      {
        industry: 'Education',
        riskLevel: 'Low',
        auditHistory: 'First Time',
        size: 'Small'
      },
      {
        industry: 'Hospitality',
        riskLevel: 'Medium',
        auditHistory: 'Changed Auditor',
        size: 'Large'
      },
      {
        industry: 'Finance',
        riskLevel: 'High',
        auditHistory: 'Recurring',
        size: 'Large'
      }
    ]
    
    clientScenarios.forEach((scenario, index) => {
      cy.logDemo(`Creating ${scenario.industry} client - ${scenario.riskLevel} risk`)
      
      cy.generateAuditClient({
        industry: scenario.industry,
        riskLevel: scenario.riskLevel,
        auditHistory: scenario.auditHistory,
        annualRevenue: scenario.size === 'Large' ? 25000000 : 
                      scenario.size === 'Medium' ? 5000000 : 1000000,
        employeeCount: scenario.size === 'Large' ? 500 : 
                      scenario.size === 'Medium' ? 100 : 25
      }).then(clientData => {
        clients.push(clientData)
        
        // Navigate to client creation if not already there
        if (index === 0) {
          cy.get('[data-testid="add-client-button"]').click()
        }
        
        // Mock client creation API call
        cy.intercept('POST', '/api/v1/audit/clients', {
          statusCode: 200,
          body: {
            success: true,
            data: {
              id: `client_${index + 1}`,
              ...clientData,
              organization_id: `${clientData.company.toLowerCase().replace(/\s+/g, '_')}_org`
            }
          }
        }).as('createClient')
        
        // Fill client form (simplified for demo)
        cy.get('input[name="company"]').clear().type(clientData.company)
        cy.get('input[name="contactPerson"]').clear().type(clientData.contactPerson)
        cy.get('input[name="email"]').clear().type(clientData.email)
        cy.get('input[name="phone"]').clear().type(clientData.phone)
        
        // Submit form
        cy.get('button[type="submit"]').click()
        
        // Wait for API response
        cy.waitForAPI('@createClient')
        
        // Verify client appears in list
        cy.get('[data-testid="client-list"]').should('contain', clientData.company)
        
        cy.logDemo(`✅ Created client: ${clientData.company} (${scenario.industry})`)
      })
    })
  })
  
  it('should create audit engagements for clients', () => {
    // Create engagements for first 4 clients
    clients.slice(0, 4).forEach((client, index) => {
      cy.logDemo(`Creating engagement for: ${client.company}`)
      
      // Mock engagement creation
      cy.intercept('POST', `/api/v1/audit/clients/client_${index + 1}/engagements`, {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: `engagement_${index + 1}`,
            clientId: `client_${index + 1}`,
            engagementType: 'Statutory Audit',
            status: 'Planning',
            year: 2024
          }
        }
      }).as(`createEngagement${index}`)
      
      cy.createAuditEngagement(`client_${index + 1}`, {
        engagementType: 'Statutory Audit',
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
        materialityAmount: client.annualRevenue * 0.05, // 5% of revenue
        auditFee: Math.min(client.annualRevenue * 0.002, 100000), // 0.2% of revenue, max 100k
        riskAssessment: client.riskLevel
      })
      
      cy.waitForAPI(`@createEngagement${index}`)
      
      cy.logDemo(`✅ Created engagement for: ${client.company}`)
    })
  })
  
  it('should generate document requisitions for active engagements', () => {
    // Create document requisitions for first 2 clients
    clients.slice(0, 2).forEach((client, index) => {
      cy.logDemo(`Creating document requisitions for: ${client.company}`)
      
      // Mock document requisition APIs
      cy.intercept('GET', `/api/v1/audit/clients/client_${index + 1}/documents`, {
        statusCode: 200,
        body: { success: true, data: { documents: [] } }
      }).as(`getDocuments${index}`)
      
      cy.intercept('POST', `/api/v1/audit/clients/client_${index + 1}/documents`, {
        statusCode: 200,
        body: { success: true, data: { id: `doc_${index + 1}` } }
      }).as(`createDocument${index}`)
      
      cy.completeDocumentRequisition(`client_${index + 1}`)
      
      cy.logDemo(`✅ Created document requisitions for: ${client.company}`)
    })
  })
  
  it('should verify client dashboard and data visibility', () => {
    // Navigate to client dashboard
    cy.visit('/audit/clients')
    
    // Verify client list displays all created clients
    clients.forEach(client => {
      cy.get('[data-testid="client-list"]').should('contain', client.company)
      cy.get('[data-testid="client-list"]').should('contain', client.industry)
      cy.get('[data-testid="client-list"]').should('contain', client.riskLevel)
    })
    
    // Test client filtering
    cy.get('[data-testid="industry-filter"]').select('Manufacturing')
    cy.get('[data-testid="client-list"]').should('contain', 'Manufacturing')
    cy.get('[data-testid="client-list"]').should('not.contain', 'Technology')
    
    // Reset filter
    cy.get('[data-testid="industry-filter"]').select('All Industries')
    
    // Test risk level filtering
    cy.get('[data-testid="risk-filter"]').select('High')
    cy.get('[data-testid="client-list"]').should('contain', 'High')
    
    // Take screenshot of client management dashboard
    cy.screenshotDemo('client-management-dashboard')
    
    cy.logDemo('✅ Verified client management dashboard functionality')
  })
  
  after(() => {
    cy.logDemo('Client management demo data generation completed', {
      clientsCreated: clients.length,
      clients: clients.map(c => ({ 
        company: c.company, 
        industry: c.industry, 
        riskLevel: c.riskLevel,
        auditHistory: c.auditHistory
      }))
    })
  })
})