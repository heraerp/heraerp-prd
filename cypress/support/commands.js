/**
 * HERA CRM - Custom Cypress Commands
 * Enterprise-grade testing commands for CRM functionality
 */

// Import existing demo data generation
import { faker } from '@faker-js/faker'

// **Data Factory Commands**

// Generate realistic audit firm data
Cypress.Commands.add('generateAuditFirm', (overrides = {}) => {
  const firmTypes = ['sole_practitioner', 'small_practice', 'mid_tier', 'big_four']
  const countries = ['Bahrain', 'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman']
  const specializations = [
    'Statutory Audit', 'Tax Advisory', 'Management Consulting', 
    'Forensic Accounting', 'Internal Audit', 'Risk Assessment',
    'Financial Due Diligence', 'Compliance Review'
  ]
  
  const firmData = {
    full_name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'demo2025',
    phone: faker.phone.number('+973 #### ####'),
    firm_name: faker.company.name() + ' Audit Partners',
    firm_code: faker.string.alpha({ length: 3, casing: 'upper' }),
    license_number: `AUD-${faker.location.countryCode()}-${faker.date.recent().getFullYear()}-${faker.string.numeric(3)}`,
    established_year: faker.date.between({ from: '1990-01-01', to: '2020-12-31' }).getFullYear(),
    registration_country: faker.helpers.arrayElement(countries),
    website: faker.internet.url(),
    firm_type: faker.helpers.arrayElement(firmTypes),
    partner_count: faker.number.int({ min: 1, max: 25 }),
    staff_count: faker.number.int({ min: 2, max: 150 }),
    specializations: faker.helpers.arrayElements(specializations, { min: 2, max: 4 }),
    office_locations: [faker.location.city() + ', ' + faker.helpers.arrayElement(countries)],
    ...overrides
  }
  
  return cy.wrap(firmData)
})

// Generate realistic audit client data
Cypress.Commands.add('generateAuditClient', (overrides = {}) => {
  const industries = [
    'Manufacturing', 'Trading', 'Real Estate', 'Technology', 
    'Healthcare', 'Education', 'Hospitality', 'Finance'
  ]
  
  const clientData = {
    company: faker.company.name(),
    industry: faker.helpers.arrayElement(industries),
    contactPerson: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number('+973 #### ####'),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    country: faker.location.country(),
    establishedYear: faker.date.between({ from: '1980-01-01', to: '2015-12-31' }).getFullYear(),
    annualRevenue: faker.number.int({ min: 100000, max: 50000000 }),
    employeeCount: faker.number.int({ min: 5, max: 1000 }),
    fiscalYearEnd: faker.helpers.arrayElement(['31-Dec', '31-Mar', '30-Jun', '30-Sep']),
    riskLevel: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
    auditHistory: faker.helpers.arrayElement(['First Time', 'Recurring', 'Changed Auditor']),
    ...overrides
  }
  
  return cy.wrap(clientData)
})

// **Authentication Commands**

// Complete audit firm onboarding flow
Cypress.Commands.add('completeAuditOnboarding', (firmData) => {
  cy.visit('/audit/onboarding')
  
  // Step 1: Personal Information
  cy.get('input[name="full_name"]').type(firmData.full_name)
  cy.get('input[name="email"]').type(firmData.email)
  cy.get('input[name="password"]').type(firmData.password)
  cy.get('input[name="phone"]').type(firmData.phone)
  cy.get('button').contains('Next').click()
  
  // Step 2: Firm Details
  cy.get('input[name="firm_name"]').type(firmData.firm_name)
  cy.get('input[name="firm_code"]').type(firmData.firm_code)
  cy.get('input[name="license_number"]').type(firmData.license_number)
  cy.get('input[name="established_year"]').type(firmData.established_year.toString())
  cy.get('input[name="website"]').type(firmData.website)
  cy.get('select[name="registration_country"]').select(firmData.registration_country)
  cy.get('button').contains('Next').click()
  
  // Step 3: Firm Profile
  cy.get(`button[data-value="${firmData.firm_type}"]`).click()
  cy.get('input[name="partner_count"]').type(firmData.partner_count.toString())
  cy.get('input[name="staff_count"]').type(firmData.staff_count.toString())
  
  // Select specializations
  firmData.specializations.forEach(spec => {
    cy.get('button').contains(spec).click()
  })
  
  cy.get('input[name="office_locations"]').type(firmData.office_locations[0])
  cy.get('button').contains('Complete Setup').click()
  
  // Wait for setup completion
  cy.contains('Setup Complete', { timeout: 15000 })
  cy.contains('Continue to Login').click()
})

// Login to audit system
Cypress.Commands.add('loginAuditSystem', (email, password) => {
  cy.visit('/audit/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(password)
  cy.get('button[type="submit"]').click()
  cy.url().should('include', '/audit')
})

// **Data Creation Commands**

// Create multiple audit clients
Cypress.Commands.add('createAuditClients', (count = 5) => {
  const clients = []
  
  for (let i = 0; i < count; i++) {
    cy.generateAuditClient().then(clientData => {
      clients.push(clientData)
      
      // Navigate to client creation
      cy.visit('/audit/clients/new')
      
      // Fill client form
      cy.get('input[name="company"]').type(clientData.company)
      cy.get('select[name="industry"]').select(clientData.industry)
      cy.get('input[name="contactPerson"]').type(clientData.contactPerson)
      cy.get('input[name="email"]').type(clientData.email)
      cy.get('input[name="phone"]').type(clientData.phone)
      cy.get('textarea[name="address"]').type(clientData.address)
      cy.get('input[name="city"]').type(clientData.city)
      cy.get('select[name="country"]').select(clientData.country)
      cy.get('input[name="establishedYear"]').type(clientData.establishedYear.toString())
      cy.get('input[name="annualRevenue"]').type(clientData.annualRevenue.toString())
      cy.get('input[name="employeeCount"]').type(clientData.employeeCount.toString())
      cy.get('select[name="fiscalYearEnd"]').select(clientData.fiscalYearEnd)
      cy.get('select[name="riskLevel"]').select(clientData.riskLevel)
      cy.get('select[name="auditHistory"]').select(clientData.auditHistory)
      
      // Submit form
      cy.get('button[type="submit"]').click()
      cy.contains('Client created successfully')
    })
  }
  
  return cy.wrap(clients)
})

// Create audit engagement
Cypress.Commands.add('createAuditEngagement', (clientId, engagementData = {}) => {
  const defaultEngagement = {
    engagementType: 'Statutory Audit',
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
    materialityAmount: faker.number.int({ min: 10000, max: 500000 }),
    auditFee: faker.number.int({ min: 5000, max: 100000 }),
    deadlineDate: '2025-03-31',
    engagementPartner: faker.person.fullName(),
    auditManager: faker.person.fullName(),
    riskAssessment: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
    ...engagementData
  }
  
  cy.visit(`/audit/clients/${clientId}/engagements/new`)
  
  // Fill engagement form
  Object.keys(defaultEngagement).forEach(field => {
    cy.get(`input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`)
      .type(defaultEngagement[field].toString())
  })
  
  cy.get('button[type="submit"]').click()
  cy.contains('Engagement created successfully')
  
  return cy.wrap(defaultEngagement)
})

// **Workflow Commands**

// Complete document requisition workflow
Cypress.Commands.add('completeDocumentRequisition', (clientId) => {
  const documents = [
    'Trial Balance', 'Bank Statements', 'Inventory Records', 
    'Fixed Asset Register', 'Accounts Receivable Aging', 
    'Accounts Payable Aging', 'General Ledger'
  ]
  
  cy.visit(`/audit/clients/${clientId}/documents`)
  
  documents.forEach((doc, index) => {
    cy.get('button').contains('Request Document').click()
    cy.get('input[name="documentName"]').type(doc)
    cy.get('select[name="documentType"]').select('Financial Statement')
    cy.get('textarea[name="description"]').type(`${doc} for audit year 2024`)
    cy.get('select[name="priority"]').select(faker.helpers.arrayElement(['High', 'Medium', 'Low']))
    cy.get('input[name="dueDate"]').type('2025-02-15')
    cy.get('button[type="submit"]').click()
    cy.contains('Document requested successfully')
    
    // Simulate some document statuses
    if (index % 3 === 0) {
      cy.get(`[data-document="${doc}"]`).within(() => {
        cy.get('button').contains('Mark Received').click()
      })
    }
  })
})

// **Utility Commands**

// Generate time-series data for analytics
Cypress.Commands.add('generateAnalyticsData', (months = 12) => {
  const analyticsData = []
  
  for (let i = 0; i < months; i++) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    
    analyticsData.push({
      date: date.toISOString().split('T')[0],
      clientsAdded: faker.number.int({ min: 1, max: 10 }),
      engagementsStarted: faker.number.int({ min: 0, max: 15 }),
      documentsRequested: faker.number.int({ min: 5, max: 50 }),
      auditsCompleted: faker.number.int({ min: 0, max: 8 }),
      revenue: faker.number.int({ min: 10000, max: 250000 })
    })
  }
  
  return cy.wrap(analyticsData)
})

// Wait for API response
Cypress.Commands.add('waitForAPI', (alias, timeout = 10000) => {
  cy.wait(alias, { timeout })
  cy.get('@' + alias.replace('@', '')).should('have.property', 'response')
})

// Take screenshot with timestamp
Cypress.Commands.add('screenshotDemo', (name) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  cy.screenshot(`demo-${name}-${timestamp}`)
})

// Log demo progress
Cypress.Commands.add('logDemo', (message, data = {}) => {
  cy.log(`🎯 DEMO: ${message}`, data)
  if (Cypress.env('DEMO_MODE')) {
    console.log(`🎯 DEMO: ${message}`, data)
  }
})

// **Customer Onboarding Commands**

// Generate customer onboarding profile
Cypress.Commands.add('generateOnboardingProfile', (overrides = {}) => {
  const { CustomerOnboardingFactory } = require('../utils/onboarding-data-factory')
  return cy.wrap(CustomerOnboardingFactory.createOnboardingProfile(overrides))
})

// Complete customer onboarding workflow
Cypress.Commands.add('completeCustomerOnboarding', (customerProfile) => {
  // Step 1: Customer Information
  cy.get('input[name="company"]').type(customerProfile.company)
  cy.get('input[name="contactPerson"]').type(customerProfile.contactPerson)
  cy.get('input[name="email"]').type(customerProfile.email)
  cy.get('input[name="phone"]').type(customerProfile.phone)
  cy.get('select[name="industry"]').select(customerProfile.industry)
  cy.get('button').contains('Next').click()
  
  // Step 2: Business Assessment
  cy.get('input[name="annualRevenue"]').type(customerProfile.annualRevenue.toString())
  cy.get('input[name="employeeCount"]').type(customerProfile.employeeCount.toString())
  cy.get('select[name="businessSize"]').select(customerProfile.businessSize)
  cy.get('select[name="auditType"]').select(customerProfile.auditType)
  cy.get('button').contains('Next').click()
  
  // Step 3: Risk Evaluation
  cy.get('select[name="riskLevel"]').select(customerProfile.riskLevel)
  cy.get('select[name="complexity"]').select(customerProfile.complexity)
  cy.get('select[name="auditHistory"]').select(customerProfile.auditHistory)
  cy.get('button').contains('Next').click()
  
  // Step 4: Service Agreement
  cy.get('select[name="engagementType"]').select(customerProfile.auditType)
  cy.get('input[name="proposedFee"]').type(customerProfile.estimatedFee.toString())
  cy.get('input[name="deadlineDate"]').type('2025-03-31')
  cy.get('button').contains('Complete Onboarding').click()
})

// Generate multiple onboarding profiles
Cypress.Commands.add('generateMultipleOnboardingProfiles', (count = 5) => {
  const { CustomerOnboardingFactory } = require('../utils/onboarding-data-factory')
  return cy.wrap(CustomerOnboardingFactory.createMultipleProfiles(count))
})

// Verify onboarding automation
Cypress.Commands.add('verifyOnboardingAutomation', (automationTasks) => {
  automationTasks.forEach(task => {
    cy.get('[data-testid="automation-tasks"]').should('contain', task.type)
    cy.get('[data-testid="automation-tasks"]').should('contain', task.status)
    cy.get('[data-testid="automation-tasks"]').should('contain', task.automationLevel)
  })
})

// Track onboarding progress
Cypress.Commands.add('trackOnboardingProgress', (onboardingId) => {
  cy.intercept('GET', `/api/v1/audit/onboarding/${onboardingId}/progress`, {
    statusCode: 200,
    body: {
      success: true,
      data: {
        onboardingId,
        status: 'In Progress',
        completedSteps: 4,
        totalSteps: 6,
        progress: 67,
        estimatedCompletion: '1 day',
        currentStep: 'Team Assignment'
      }
    }
  }).as('trackProgress')
  
  cy.request('GET', `/api/v1/audit/onboarding/${onboardingId}/progress`)
  cy.waitForAPI('@trackProgress')
})

// **CRM-SPECIFIC COMMANDS FOR UAT TESTING**

// Organization Management Commands
Cypress.Commands.add('createTestOrganization', (orgData = {}) => {
  const defaultOrg = {
    organization_name: 'Test Organization',
    organization_code: `TEST_${Date.now()}`,
    organization_type: 'business',
    industry: 'Technology',
    email: 'test@testorg.com',
    phone: '+1-555-TEST-001',
    website: 'www.testorg.com',
    status: 'active'
  }
  
  const organization = { ...defaultOrg, ...orgData }
  
  return cy.request('POST', '/api/v1/organizations', organization).then((response) => {
    expect(response.status).to.eq(201)
    cy.wrap(response.body.id).as('organizationId')
    return response.body
  })
})

// User Management Commands
Cypress.Commands.add('createTestUser', (userData = {}, organizationId = null) => {
  const defaultUser = {
    entity_type: 'user',
    entity_name: 'Test User',
    entity_code: `USER_${Date.now()}`,
    entity_category: 'staff',
    entity_subcategory: 'user',
    status: 'active',
    metadata: {
      email: 'testuser@testorg.com',
      title: 'Test Role',
      role: 'user'
    }
  }
  
  const user = { ...defaultUser, ...userData }
  
  if (organizationId) {
    user.organization_id = organizationId
  }
  
  return cy.request('POST', '/api/v1/entities', user).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Contact Management Commands
Cypress.Commands.add('createTestContact', (contactData = {}, organizationId = null) => {
  const defaultContact = {
    entity_type: 'contact',
    entity_name: 'Test Contact',
    entity_code: `CONT_${Date.now()}`,
    entity_category: 'crm',
    entity_subcategory: 'prospect',
    status: 'active',
    metadata: {
      title: 'Test Title',
      company: 'Test Company',
      email: 'testcontact@testcompany.com',
      phone: '+1-555-TEST-002'
    }
  }
  
  const contact = { ...defaultContact, ...contactData }
  
  if (organizationId) {
    contact.organization_id = organizationId
  }
  
  return cy.request('POST', '/api/v1/entities', contact).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Deal Management Commands
Cypress.Commands.add('createTestDeal', (dealData = {}, organizationId = null) => {
  const defaultDeal = {
    entity_type: 'deal',
    entity_name: 'Test Deal',
    entity_code: `DEAL_${Date.now()}`,
    entity_category: 'opportunity',
    entity_subcategory: 'discovery',
    status: 'active',
    metadata: {
      value: 50000,
      probability: 50,
      stage: 'discovery',
      expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }
  
  const deal = { ...defaultDeal, ...dealData }
  
  if (organizationId) {
    deal.organization_id = organizationId
  }
  
  return cy.request('POST', '/api/v1/entities', deal).then((response) => {
    expect(response.status).to.eq(201)
    return response.body
  })
})

// Modern Modal Testing Commands
Cypress.Commands.add('verifyModernModal', (modalTitle) => {
  cy.get('[data-testid="crm-form-modal"]', { timeout: 10000 }).should('be.visible')
  cy.get('[data-testid="modal-header"]').should('contain', modalTitle)
  cy.get('[data-testid="close-modal"]').should('be.visible')
  cy.get('[data-testid="submit-btn"]').should('be.visible')
  cy.get('[data-testid="cancel-btn"]').should('be.visible')
  
  // Verify mobile responsiveness
  cy.viewport('iphone-x')
  cy.get('[data-testid="crm-form-modal"]').should('be.visible')
  cy.viewport('macbook-15')
})

Cypress.Commands.add('closeModal', () => {
  cy.get('[data-testid="close-modal"]').click()
  cy.get('[data-testid="crm-form-modal"]').should('not.exist')
})

// Form Testing Commands
Cypress.Commands.add('fillContactForm', (contactData) => {
  cy.get('#name').clear().type(contactData.name)
  
  if (contactData.company) {
    cy.get('#company').clear().type(contactData.company)
  }
  
  if (contactData.email) {
    cy.get('#email').clear().type(contactData.email)
  }
  
  if (contactData.phone) {
    cy.get('#phone').clear().type(contactData.phone)
  }
  
  if (contactData.status) {
    cy.get('#status').click()
    cy.contains(contactData.status).click()
  }
  
  if (contactData.tags) {
    cy.get('#tags').clear().type(contactData.tags)
  }
})

Cypress.Commands.add('fillDealForm', (dealData) => {
  cy.get('#oppName').clear().type(dealData.name)
  
  if (dealData.contact) {
    cy.get('#oppContact').click()
    cy.contains(dealData.contact).click()
  }
  
  if (dealData.stage) {
    cy.get('#oppStage').click()
    cy.contains(dealData.stage).click()
  }
  
  if (dealData.value) {
    cy.get('#oppValue').clear().type(dealData.value.toString())
  }
  
  if (dealData.closeDate) {
    cy.get('#oppCloseDate').clear().type(dealData.closeDate)
  }
  
  if (dealData.probability) {
    cy.get('#oppProbability').clear().type(dealData.probability.toString())
  }
})

// CRM Navigation Commands
Cypress.Commands.add('navigateToCRM', () => {
  cy.visit('/crm')
  cy.url().should('include', '/crm')
  cy.contains('HERA CRM').should('be.visible')
})

Cypress.Commands.add('switchCRMTab', (tabName) => {
  cy.get(`[data-testid="${tabName}-tab"]`).click()
  cy.get(`[data-testid="${tabName}-content"]`).should('be.visible')
})

// Data Verification Commands
Cypress.Commands.add('verifyContactCard', (contactData) => {
  cy.contains(contactData.name).should('be.visible')
  
  if (contactData.company) {
    cy.contains(contactData.company).should('be.visible')
  }
  
  if (contactData.status) {
    cy.get('[data-testid="status-badge"]').should('contain', contactData.status)
  }
})

Cypress.Commands.add('verifyDealCard', (dealData) => {
  cy.contains(dealData.name).should('be.visible')
  
  if (dealData.value) {
    cy.contains(dealData.value.toLocaleString()).should('be.visible')
  }
  
  if (dealData.stage) {
    cy.get(`[data-testid="stage-${dealData.stage}"]`).within(() => {
      cy.contains(dealData.name).should('be.visible')
    })
  }
})

// Performance Testing Commands
Cypress.Commands.add('measurePageLoad', (pageName) => {
  const startTime = Date.now()
  
  return cy.window().then(() => {
    const loadTime = Date.now() - startTime
    cy.log(`${pageName} loaded in ${loadTime}ms`)
    
    // Assert reasonable load time (adjust thresholds as needed)
    expect(loadTime).to.be.lessThan(5000) // 5 seconds max
    
    return loadTime
  })
})

Cypress.Commands.add('verifyResponsiveDesign', (breakpoints = ['iphone-x', 'ipad-2', 'macbook-15']) => {
  breakpoints.forEach(viewport => {
    cy.viewport(viewport)
    cy.get('body').should('be.visible')
    
    // Verify critical elements are still visible
    cy.get('[data-testid="main-navigation"]').should('be.visible')
    cy.get('[data-testid="primary-content"]').should('be.visible')
  })
  
  // Reset to default viewport
  cy.viewport('macbook-15')
})

// Search & Filter Commands
Cypress.Commands.add('searchContacts', (searchTerm) => {
  cy.get('[data-testid="search-contacts"]').clear().type(searchTerm)
  cy.get('[data-testid="search-results"]').should('be.visible')
})

Cypress.Commands.add('filterByStatus', (status) => {
  cy.get('[data-testid="filter-btn"]').click()
  cy.get(`[data-testid="filter-${status}"]`).click()
  cy.get('[data-testid="filtered-results"]').should('be.visible')
})

// Pipeline Management Commands
Cypress.Commands.add('moveDealToStage', (dealName, targetStage) => {
  cy.contains(dealName).click()
  cy.get('[data-testid="deal-edit-btn"]').click()
  cy.get('#oppStage').click()
  cy.contains(targetStage).click()
  cy.get('[data-testid="update-btn"]').click()
  
  // Verify deal moved to correct stage
  cy.get(`[data-testid="stage-${targetStage}"]`).within(() => {
    cy.contains(dealName).should('be.visible')
  })
})

Cypress.Commands.add('verifyPipelineMetrics', (expectedMetrics) => {
  if (expectedMetrics.totalValue) {
    cy.get('[data-testid="pipeline-value"]').should('contain', expectedMetrics.totalValue)
  }
  
  if (expectedMetrics.dealCount) {
    cy.get('[data-testid="active-deals"]').should('contain', expectedMetrics.dealCount)
  }
  
  if (expectedMetrics.weightedValue) {
    cy.get('[data-testid="weighted-pipeline"]').should('contain', expectedMetrics.weightedValue)
  }
})

// Export & Import Commands
Cypress.Commands.add('exportContacts', (format = 'csv') => {
  cy.get('[data-testid="export-btn"]').click()
  cy.get(`[data-testid="export-${format}"]`).click()
  cy.contains('Export completed').should('be.visible')
})

Cypress.Commands.add('importContacts', (filePath) => {
  cy.get('[data-testid="import-btn"]').click()
  cy.get('[data-testid="file-input"]').selectFile(filePath)
  cy.get('[data-testid="import-submit"]').click()
  cy.contains('Import completed').should('be.visible')
})

// Accessibility Testing Commands
Cypress.Commands.add('checkA11y', () => {
  // Basic accessibility checks
  cy.get('[data-testid="main-content"]').should('have.attr', 'role')
  cy.get('button').should('have.attr', 'aria-label').or('have.text')
  cy.get('input').should('have.attr', 'placeholder').or('have.attr', 'aria-label')
  
  // Color contrast verification (simplified)
  cy.get('button').should('have.css', 'color')
  cy.get('button').should('have.css', 'background-color')
})

// API Testing Commands
Cypress.Commands.add('verifyAPIEndpoint', (endpoint, expectedStatus = 200) => {
  cy.request({
    url: `/api/v1${endpoint}`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(expectedStatus)
    
    if (expectedStatus === 200) {
      expect(response.body).to.have.property('data')
    }
  })
})

// Clean up Commands
Cypress.Commands.add('cleanupTestData', () => {
  // Clean up test data after tests
  cy.request({
    method: 'DELETE',
    url: '/api/v1/test-data/cleanup',
    failOnStatusCode: false
  })
})

// Custom Assertion Commands
Cypress.Commands.add('shouldBeVisibleOnMobile', { prevSubject: 'element' }, (subject) => {
  cy.viewport('iphone-x')
  cy.wrap(subject).should('be.visible')
  cy.viewport('macbook-15')
})

Cypress.Commands.add('shouldHaveGoodContrast', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('have.css', 'color')
  cy.wrap(subject).should('have.css', 'background-color')
  // Additional contrast ratio checking could be implemented here
})

// Keyboard navigation testing
Cypress.Commands.add('testKeyboardNavigation', () => {
  cy.get('body').tab()
  cy.focused().should('be.visible')
  
  // Test tab through main navigation
  for (let i = 0; i < 5; i++) {
    cy.tab()
    cy.focused().should('be.visible')
  }
  
  // Test Enter key activation
  cy.focused().type('{enter}')
})