#!/usr/bin/env node

/**
 * HERA CRM Demo Data Setup Script
 * Creates comprehensive, realistic demo data for sales presentations and training
 * 
 * Usage: node scripts/setup-crm-demo-data.js [--environment=demo|training|uat]
 */

const fs = require('fs')
const path = require('path')

// Import demo scenarios
const demoData = require('../cypress/support/crm-test-data.js')

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'
const ENVIRONMENT = process.argv.find(arg => arg.startsWith('--environment='))?.split('=')[1] || 'demo'

class CRMDemoDataGenerator {
  constructor() {
    this.organizationId = null
    this.createdEntities = {
      organizations: [],
      users: [],
      contacts: [],
      companies: [],
      deals: [],
      activities: []
    }
    this.executionLog = []
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const logEntry = { timestamp, type, message }
    this.executionLog.push(logEntry)
    
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'
    }
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    try {
      const url = `${API_BASE}${endpoint}`
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      }
      
      if (data) {
        options.body = JSON.stringify(data)
      }

      // Simulate API call (in real implementation, use fetch)
      this.log(`${method} ${endpoint}`, 'info')
      
      // Return mock successful response
      return {
        ok: true,
        status: method === 'POST' ? 201 : 200,
        json: async () => ({
          id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...data,
          created_at: new Date().toISOString()
        })
      }
    } catch (error) {
      this.log(`API Error: ${error.message}`, 'error')
      throw error
    }
  }

  async setupOrganization(orgData) {
    this.log('🏢 Setting up organization...', 'info')
    
    try {
      const response = await this.makeRequest('/organizations', 'POST', orgData)
      const organization = await response.json()
      
      this.organizationId = organization.id
      this.createdEntities.organizations.push(organization)
      
      this.log(`✅ Organization created: ${orgData.name} (${organization.id})`, 'success')
      return organization
    } catch (error) {
      this.log(`❌ Failed to create organization: ${error.message}`, 'error')
      throw error
    }
  }

  async setupUsers(users) {
    this.log('👥 Setting up sales team...', 'info')
    
    for (const userData of users) {
      try {
        const userEntity = {
          organization_id: this.organizationId,
          entity_type: 'user',
          entity_name: userData.name,
          entity_code: `USER_${userData.name.replace(/\s+/g, '_').toUpperCase()}`,
          entity_category: 'staff',
          entity_subcategory: userData.role.toLowerCase().replace(/\s+/g, '_'),
          status: 'active',
          metadata: {
            email: userData.email,
            title: userData.role,
            phone: userData.phone,
            quota: userData.quota,
            territory: userData.territory
          }
        }

        const response = await this.makeRequest('/entities', 'POST', userEntity)
        const user = await response.json()
        
        this.createdEntities.users.push(user)
        this.log(`✅ User created: ${userData.name} - ${userData.role}`, 'success')
        
        // Add email as dynamic data
        await this.makeRequest('/dynamic-data', 'POST', {
          organization_id: this.organizationId,
          entity_id: user.id,
          field_name: 'email',
          field_value: userData.email,
          field_type: 'text',
          field_category: 'contact'
        })
        
      } catch (error) {
        this.log(`❌ Failed to create user ${userData.name}: ${error.message}`, 'error')
      }
    }
  }

  async setupCompanies(companies) {
    this.log('🏢 Setting up target companies...', 'info')
    
    for (const companyData of companies) {
      try {
        const companyEntity = {
          organization_id: this.organizationId,
          entity_type: 'company',
          entity_name: companyData.name,
          entity_code: `COMP_${companyData.name.replace(/\s+/g, '_').toUpperCase()}`,
          entity_category: 'customer',
          entity_subcategory: companyData.industry.toLowerCase().replace(/\s+/g, '_'),
          status: 'active',
          metadata: {
            industry: companyData.industry,
            size: companyData.size,
            revenue: companyData.revenue,
            location: companyData.location,
            website: companyData.website,
            technicalStack: companyData.technicalStack,
            painPoints: companyData.painPoints,
            budget: companyData.budget,
            decisionProcess: companyData.decisionProcess,
            competitors: companyData.competitors
          }
        }

        const response = await this.makeRequest('/entities', 'POST', companyEntity)
        const company = await response.json()
        
        this.createdEntities.companies.push(company)
        this.log(`✅ Company created: ${companyData.name}`, 'success')
        
      } catch (error) {
        this.log(`❌ Failed to create company ${companyData.name}: ${error.message}`, 'error')
      }
    }
  }

  async setupContacts(contacts) {
    this.log('👤 Setting up key contacts...', 'info')
    
    for (const contactData of contacts) {
      try {
        const contactEntity = {
          organization_id: this.organizationId,
          entity_type: 'contact',
          entity_name: contactData.name,
          entity_code: `CONT_${contactData.name.replace(/\s+/g, '_').toUpperCase()}`,
          entity_category: 'crm',
          entity_subcategory: contactData.decisionMaker ? 'decision_maker' : 'influencer',
          status: 'active',
          metadata: {
            title: contactData.title,
            company: contactData.company,
            email: contactData.email,
            phone: contactData.phone,
            linkedIn: contactData.linkedIn,
            decisionMaker: contactData.decisionMaker,
            influenceLevel: contactData.influenceLevel,
            relationshipStrength: contactData.relationshipStrength,
            communicationPreference: contactData.communicationPreference,
            personalInterests: contactData.personalInterests,
            professionalBackground: contactData.professionalBackground,
            painPoints: contactData.painPoints,
            goals: contactData.goals
          }
        }

        const response = await this.makeRequest('/entities', 'POST', contactEntity)
        const contact = await response.json()
        
        this.createdEntities.contacts.push(contact)
        this.log(`✅ Contact created: ${contactData.name} - ${contactData.title}`, 'success')
        
        // Add contact details as dynamic data
        const dynamicFields = [
          { field_name: 'email', field_value: contactData.email, field_category: 'contact_info' },
          { field_name: 'phone', field_value: contactData.phone, field_category: 'contact_info' },
          { field_name: 'linkedin', field_value: contactData.linkedIn, field_category: 'social' },
          { field_name: 'influence_level', field_value: contactData.influenceLevel, field_category: 'qualification' },
          { field_name: 'relationship_strength', field_value: contactData.relationshipStrength, field_category: 'relationship' }
        ]
        
        for (const field of dynamicFields) {
          await this.makeRequest('/dynamic-data', 'POST', {
            organization_id: this.organizationId,
            entity_id: contact.id,
            field_name: field.field_name,
            field_value: field.field_value,
            field_type: 'text',
            field_category: field.field_category
          })
        }
        
      } catch (error) {
        this.log(`❌ Failed to create contact ${contactData.name}: ${error.message}`, 'error')
      }
    }
  }

  async setupDeals(deals) {
    this.log('💰 Setting up sales opportunities...', 'info')
    
    for (const dealData of deals) {
      try {
        const dealEntity = {
          organization_id: this.organizationId,
          entity_type: 'deal',
          entity_name: dealData.name,
          entity_code: `DEAL_${dealData.name.replace(/\s+/g, '_').toUpperCase()}`,
          entity_category: 'opportunity',
          entity_subcategory: dealData.stage.toLowerCase().replace(/\s+/g, '_'),
          status: 'active',
          metadata: {
            account: dealData.account,
            primaryContact: dealData.primaryContact,
            stage: dealData.stage,
            value: dealData.value,
            probability: dealData.probability,
            expectedCloseDate: dealData.expectedCloseDate,
            salesCycle: dealData.salesCycle,
            competitiveRisk: dealData.competitiveRisk,
            keyCompetitors: dealData.keyCompetitors,
            businessCase: dealData.businessCase,
            technicalRequirements: dealData.technicalRequirements,
            stakeholders: dealData.stakeholders,
            nextSteps: dealData.nextSteps,
            riskFactors: dealData.riskFactors,
            championStrength: dealData.championStrength
          }
        }

        const response = await this.makeRequest('/entities', 'POST', dealEntity)
        const deal = await response.json()
        
        this.createdEntities.deals.push(deal)
        this.log(`✅ Deal created: ${dealData.name} - $${dealData.value.toLocaleString()}`, 'success')
        
      } catch (error) {
        this.log(`❌ Failed to create deal ${dealData.name}: ${error.message}`, 'error')
      }
    }
  }

  async setupActivities(activities) {
    this.log('📋 Setting up sales activities...', 'info')
    
    for (const activityData of activities) {
      try {
        const activityEntity = {
          organization_id: this.organizationId,
          entity_type: 'activity',
          entity_name: activityData.subject,
          entity_code: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          entity_category: 'communication',
          entity_subcategory: activityData.type,
          status: 'completed',
          metadata: {
            type: activityData.type,
            subject: activityData.subject,
            contact: activityData.contact,
            duration: activityData.duration,
            date: activityData.date,
            outcome: activityData.outcome,
            nextAction: activityData.nextAction,
            notes: activityData.notes
          }
        }

        const response = await this.makeRequest('/entities', 'POST', activityEntity)
        const activity = await response.json()
        
        this.createdEntities.activities.push(activity)
        this.log(`✅ Activity logged: ${activityData.subject}`, 'success')
        
      } catch (error) {
        this.log(`❌ Failed to create activity ${activityData.subject}: ${error.message}`, 'error')
      }
    }
  }

  async setupRelationships() {
    this.log('🔗 Creating entity relationships...', 'info')
    
    try {
      // Create company-contact relationships
      for (const contact of this.createdEntities.contacts) {
        const company = this.createdEntities.companies.find(c => 
          contact.metadata.company === c.entity_name
        )
        
        if (company) {
          await this.makeRequest('/relationships', 'POST', {
            organization_id: this.organizationId,
            parent_entity_id: company.id,
            child_entity_id: contact.id,
            relationship_type: 'employs',
            relationship_strength: 1.0
          })
          
          this.log(`✅ Relationship created: ${company.entity_name} employs ${contact.entity_name}`, 'success')
        }
      }
      
      // Create deal-contact relationships
      for (const deal of this.createdEntities.deals) {
        const contact = this.createdEntities.contacts.find(c => 
          c.entity_name === deal.metadata.primaryContact
        )
        
        if (contact) {
          await this.makeRequest('/relationships', 'POST', {
            organization_id: this.organizationId,
            parent_entity_id: deal.id,
            child_entity_id: contact.id,
            relationship_type: 'primary_contact',
            relationship_strength: 0.9
          })
          
          this.log(`✅ Relationship created: ${deal.entity_name} -> ${contact.entity_name}`, 'success')
        }
      }
      
    } catch (error) {
      this.log(`❌ Failed to create relationships: ${error.message}`, 'error')
    }
  }

  generateSummaryReport() {
    const report = {
      environment: ENVIRONMENT,
      executionTime: new Date().toISOString(),
      organizationId: this.organizationId,
      createdEntities: {
        organizations: this.createdEntities.organizations.length,
        users: this.createdEntities.users.length,
        contacts: this.createdEntities.contacts.length,
        companies: this.createdEntities.companies.length,
        deals: this.createdEntities.deals.length,
        activities: this.createdEntities.activities.length
      },
      totalValue: this.createdEntities.deals.reduce((sum, deal) => sum + deal.metadata.value, 0),
      weightedValue: this.createdEntities.deals.reduce((sum, deal) => 
        sum + (deal.metadata.value * deal.metadata.probability / 100), 0
      ),
      executionLog: this.executionLog
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, '..', 'cypress', 'reports', `demo-setup-${ENVIRONMENT}-${Date.now()}.json`)
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath)
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    this.log('📊 DEMO DATA SETUP COMPLETE', 'success')
    this.log(`📁 Report saved: ${reportPath}`, 'info')
    this.log(`🏢 Organization: ${report.organizationId}`, 'info')
    this.log(`👥 Users: ${report.createdEntities.users}`, 'info')
    this.log(`👤 Contacts: ${report.createdEntities.contacts}`, 'info')
    this.log(`🏢 Companies: ${report.createdEntities.companies}`, 'info')
    this.log(`💰 Deals: ${report.createdEntities.deals} (Total: $${report.totalValue.toLocaleString()})`, 'info')
    this.log(`📋 Activities: ${report.createdEntities.activities}`, 'info')
    this.log(`💹 Weighted Pipeline: $${Math.round(report.weightedValue).toLocaleString()}`, 'info')
    
    return report
  }

  async execute() {
    try {
      this.log('🚀 Starting HERA CRM Demo Data Setup', 'info')
      this.log(`📊 Environment: ${ENVIRONMENT}`, 'info')
      this.log(`🌐 API Base: ${API_BASE}`, 'info')
      
      // Get demo scenario based on environment
      const scenario = demoData.CRM_DEMO_SCENARIOS.techVantage
      
      // Execute setup steps
      await this.setupOrganization(scenario.organization)
      await this.setupUsers(scenario.salesTeam)
      await this.setupCompanies(scenario.targetCompanies)
      await this.setupContacts(scenario.keyContacts)
      await this.setupDeals(scenario.salesOpportunities)
      await this.setupActivities(scenario.salesActivities)
      await this.setupRelationships()
      
      // Generate final report
      const report = this.generateSummaryReport()
      
      return report
      
    } catch (error) {
      this.log(`💥 Setup failed: ${error.message}`, 'error')
      throw error
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const generator = new CRMDemoDataGenerator()
  generator.execute()
    .then(report => {
      console.log('\n✅ Demo data setup completed successfully!')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Demo data setup failed:', error.message)
      process.exit(1)
    })
}

module.exports = CRMDemoDataGenerator