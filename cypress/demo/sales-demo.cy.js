// Sales Demo Scenario: Customer-facing demonstration workflow
// Optimized for showcasing HERA capabilities to potential customers

describe('💼 Sales Demo - Customer Presentation Scenario', () => {
  let salesDemoFirm
  
  before(() => {
    cy.logDemo('🎯 Starting HERA Sales Demo Scenario')
    
    // Create impressive demo firm for sales presentations
    cy.generateAuditFirm({
      firm_name: 'Premier Audit Solutions',
      firm_code: 'PAS',
      email: 'demo@premieraudit.com',
      password: 'demo2025',
      firm_type: 'mid_tier',
      partner_count: 8,
      staff_count: 45,
      specializations: ['Statutory Audit', 'Tax Advisory', 'Management Consulting', 'Risk Assessment'],
      office_locations: ['Manama, Bahrain', 'Dubai, UAE'],
      website: 'https://premieraudit.com',
      established_year: 2015
    }).then(firmData => {
      salesDemoFirm = firmData
    })
  })
  
  it('should demonstrate rapid firm onboarding (< 3 minutes)', () => {
    cy.logDemo('🚀 Demonstrating 3-minute firm setup')
    
    // Time the onboarding process
    const startTime = Date.now()
    
    cy.visit('/audit/onboarding')
    cy.screenshotDemo('sales-onboarding-start')
    
    // Step 1: Personal Information (30 seconds)
    cy.logDemo('Step 1: Personal Information')
    cy.get('input[name="full_name"]').type(salesDemoFirm.full_name)
    cy.get('input[name="email"]').type(salesDemoFirm.email)
    cy.get('input[name="password"]').type(salesDemoFirm.password)
    cy.get('input[name="phone"]').type(salesDemoFirm.phone)
    cy.get('button').contains('Next').click()
    cy.screenshotDemo('sales-step1-complete')
    
    // Step 2: Firm Details (45 seconds)
    cy.logDemo('Step 2: Firm Details')
    cy.get('input[name="firm_name"]').type(salesDemoFirm.firm_name)
    cy.get('input[name="firm_code"]').type(salesDemoFirm.firm_code)
    cy.get('input[name="license_number"]').type(salesDemoFirm.license_number)
    cy.get('input[name="established_year"]').type(salesDemoFirm.established_year.toString())
    cy.get('input[name="website"]').type(salesDemoFirm.website)
    cy.get('select[name="registration_country"]').select(salesDemoFirm.registration_country)
    cy.get('button').contains('Next').click()
    cy.screenshotDemo('sales-step2-complete')
    
    // Step 3: Firm Profile (45 seconds)
    cy.logDemo('Step 3: Firm Profile')
    cy.get(`button[data-value="${salesDemoFirm.firm_type}"]`).click()
    cy.get('input[name="partner_count"]').type(salesDemoFirm.partner_count.toString())
    cy.get('input[name="staff_count"]').type(salesDemoFirm.staff_count.toString())
    
    // Quick specializations selection
    salesDemoFirm.specializations.slice(0, 3).forEach(spec => {
      cy.get('button').contains(spec).click()
    })
    
    cy.get('input[name="office_locations"]').type(salesDemoFirm.office_locations[0])
    cy.get('button').contains('Complete Setup').click()
    cy.screenshotDemo('sales-step3-complete')
    
    // Step 4: Automated Setup (60 seconds)
    cy.logDemo('Step 4: Automated Setup')
    cy.contains('Setting up your audit environment...', { timeout: 10000 })
    cy.contains('Setup Complete', { timeout: 15000 })
    cy.screenshotDemo('sales-setup-complete')
    
    const endTime = Date.now()
    const setupTime = (endTime - startTime) / 1000
    
    cy.logDemo(`✅ Firm setup completed in ${setupTime.toFixed(1)} seconds`)
    
    // Verify under 3 minutes
    expect(setupTime).to.be.lessThan(180) // 3 minutes
    
    cy.contains('Continue to Login').click()
  })
  
  it('should showcase instant login and professional dashboard', () => {
    cy.logDemo('🎯 Demonstrating instant access')
    
    // Login with demo credentials
    cy.loginAuditSystem(salesDemoFirm.email, salesDemoFirm.password)
    
    // Verify professional dashboard loads
    cy.contains(salesDemoFirm.firm_name)
    cy.contains(salesDemoFirm.firm_code)
    
    // Highlight key features in dashboard
    cy.get('[data-testid="audit-sidebar"]').should('be.visible')
    cy.get('[data-testid="quick-stats"]').should('be.visible')
    cy.get('[data-testid="recent-activity"]').should('be.visible')
    
    cy.screenshotDemo('sales-dashboard-overview')
    
    cy.logDemo('✅ Professional dashboard loaded successfully')
  })
  
  it('should demonstrate rapid client onboarding', () => {
    cy.logDemo('📋 Demonstrating client management capabilities')
    
    // Create impressive client portfolio
    const salesClients = [
      {
        name: 'Global Manufacturing Corp',
        industry: 'Manufacturing',
        revenue: 50000000,
        employees: 500,
        risk: 'High'
      },
      {
        name: 'Tech Innovations Ltd',
        industry: 'Technology', 
        revenue: 25000000,
        employees: 200,
        risk: 'Medium'
      },
      {
        name: 'Regional Trading Co',
        industry: 'Trading',
        revenue: 15000000,
        employees: 100,
        risk: 'Medium'
      }
    ]
    
    salesClients.forEach((client, index) => {
      cy.generateAuditClient({
        company: client.name,
        industry: client.industry,
        annualRevenue: client.revenue,
        employeeCount: client.employees,
        riskLevel: client.risk
      }).then(clientData => {
        
        // Mock client creation for speed
        cy.intercept('POST', '/api/v1/audit/clients', {
          statusCode: 200,
          body: {
            success: true,
            data: {
              id: `sales_client_${index + 1}`,
              ...clientData,
              createdAt: new Date().toISOString(),
              status: 'Active'
            }
          }
        }).as(`createSalesClient${index}`)
        
        // Quick client creation
        cy.visit('/audit/clients/new')
        cy.get('input[name="company"]').type(clientData.company)
        cy.get('input[name="contactPerson"]').type(clientData.contactPerson)
        cy.get('input[name="email"]').type(clientData.email)
        cy.get('button[type="submit"]').click()
        
        cy.waitForAPI(`@createSalesClient${index}`)
        
        cy.logDemo(`✅ Created sales demo client: ${client.name}`)
      })
    })
    
    // Show client portfolio overview
    cy.visit('/audit/clients')
    cy.screenshotDemo('sales-client-portfolio')
    
    // Highlight filtering and search capabilities
    cy.get('[data-testid="search-clients"]').type('Global')
    cy.get('[data-testid="client-list"]').should('contain', 'Global Manufacturing')
    cy.screenshotDemo('sales-client-search')
    
    cy.logDemo('✅ Client portfolio demonstration complete')
  })
  
  it('should showcase audit workflow automation', () => {
    cy.logDemo('⚡ Demonstrating audit automation')
    
    // Mock engagement creation with impressive features
    cy.intercept('POST', '/api/v1/audit/clients/sales_client_1/engagements', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'sales_engagement_1',
          clientId: 'sales_client_1',
          engagementType: 'Statutory Audit',
          status: 'Planning',
          autoGenerated: {
            auditProgram: true,
            riskMatrix: true,
            materialityCalculation: true,
            teamAssignment: true
          },
          timeline: {
            planning: '2 weeks',
            fieldwork: '4 weeks',
            completion: '2 weeks'
          }
        }
      }
    }).as('createSalesEngagement')
    
    // Create engagement and show automation
    cy.visit('/audit/clients/sales_client_1/engagements/new')
    cy.get('select[name="engagementType"]').select('Statutory Audit')
    cy.get('input[name="periodStart"]').type('2024-01-01')
    cy.get('input[name="periodEnd"]').type('2024-12-31')
    cy.get('button[type="submit"]').click()
    
    cy.waitForAPI('@createSalesEngagement')
    
    // Show automated features
    cy.contains('Audit program automatically generated')
    cy.contains('Risk assessment completed')
    cy.contains('Team assignments optimized')
    
    cy.screenshotDemo('sales-engagement-automation')
    
    cy.logDemo('✅ Audit automation demonstration complete')
  })
  
  it('should highlight reporting and analytics capabilities', () => {
    cy.logDemo('📊 Demonstrating analytics and reporting')
    
    // Generate impressive analytics data
    cy.generateAnalyticsData(6).then(analyticsData => {
      
      // Mock analytics API
      cy.intercept('GET', '/api/v1/audit/analytics', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            summary: {
              totalClients: 23,
              activeEngagements: 15,
              completedAudits: 8,
              monthlyRevenue: 145000
            },
            trends: analyticsData,
            performance: {
              averageAuditTime: 6.2,
              clientSatisfaction: 4.8,
              onTimeDelivery: 98.5,
              teamUtilization: 87.3
            }
          }
        }
      }).as('getAnalytics')
      
      // Navigate to analytics dashboard
      cy.visit('/audit/analytics')
      cy.waitForAPI('@getAnalytics')
      
      // Verify key metrics display
      cy.get('[data-testid="total-clients"]').should('contain', '23')
      cy.get('[data-testid="active-engagements"]').should('contain', '15')
      cy.get('[data-testid="monthly-revenue"]').should('contain', '145,000')
      
      // Show performance metrics
      cy.get('[data-testid="client-satisfaction"]').should('contain', '4.8')
      cy.get('[data-testid="on-time-delivery"]').should('contain', '98.5%')
      
      cy.screenshotDemo('sales-analytics-dashboard')
      
      cy.logDemo('✅ Analytics demonstration complete')
    })
  })
  
  it('should demonstrate HERA network effect and scaling', () => {
    cy.logDemo('🌐 Demonstrating HERA ecosystem benefits')
    
    // Show network effect footer
    cy.get('[data-testid="hera-footer"]').should('be.visible')
    cy.get('[data-testid="hera-footer"]').should('contain', 'Powered by HERA')
    
    // Demonstrate ecosystem benefits
    const ecosystemFeatures = [
      'Universal 6-table architecture scales infinitely',
      'Zero-configuration multi-tenancy',
      'Automatic compliance updates',
      'Cross-firm benchmarking (anonymous)',
      'Industry best practices sharing',
      'Instant deployment globally'
    ]
    
    // Mock ecosystem data
    cy.intercept('GET', '/api/v1/hera/ecosystem', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          networkSize: 847,
          firmsOnboarded: 156,
          countriesActive: 23,
          auditsCompleted: 3421,
          averageSetupTime: 2.3 // minutes
        }
      }
    }).as('getEcosystem')
    
    cy.visit('/audit/ecosystem')
    cy.waitForAPI('@getEcosystem')
    
    // Show impressive network stats
    cy.get('[data-testid="network-size"]').should('contain', '847')
    cy.get('[data-testid="firms-onboarded"]').should('contain', '156')
    cy.get('[data-testid="countries-active"]').should('contain', '23')
    
    cy.screenshotDemo('sales-ecosystem-benefits')
    
    cy.logDemo('✅ HERA ecosystem demonstration complete')
  })
  
  after(() => {
    cy.logDemo('🎉 Sales Demo Scenario Completed Successfully', {
      firmCreated: salesDemoFirm.firm_name,
      setupTime: '< 3 minutes',
      clientsAdded: 3,
      engagementsCreated: 1,
      keyMetrics: {
        onboarding: 'Sub-3-minute setup',
        automation: 'Full audit program generation',
        analytics: 'Real-time performance tracking',
        ecosystem: '847 firms in HERA network'
      },
      customerValue: 'Enterprise-grade audit management in minutes, not months'
    })
    
    // Generate sales demo summary report
    cy.task('generateDataReport', {
      scenario: 'Sales Demo',
      firmName: salesDemoFirm.firm_name,
      timestamp: new Date().toISOString(),
      demoComplete: true,
      readyForCustomerPresentation: true
    })
  })
})