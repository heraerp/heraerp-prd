// HERA Audit Demo Data Factories
// Centralized data generation utilities for consistent demo scenarios

import { faker } from '@faker-js/faker'

// **Audit Firm Data Factories**

export const AuditFirmFactory = {
  // Generate basic audit firm
  create: (overrides = {}) => {
    const firmTypes = ['sole_practitioner', 'small_practice', 'mid_tier', 'big_four']
    const countries = ['Bahrain', 'UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman']
    const specializations = [
      'Statutory Audit', 'Tax Advisory', 'Management Consulting', 
      'Forensic Accounting', 'Internal Audit', 'Risk Assessment',
      'Financial Due Diligence', 'Compliance Review', 'IT Audit'
    ]
    
    return {
      full_name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'demo2025',
      phone: faker.phone.number('+973 #### ####'),
      firm_name: faker.company.name() + ' Audit Partners',
      firm_code: faker.string.alpha({ length: 3, casing: 'upper' }),
      license_number: `AUD-${faker.location.countryCode()}-${new Date().getFullYear()}-${faker.string.numeric(3)}`,
      established_year: faker.number.int({ min: 1990, max: 2020 }),
      registration_country: faker.helpers.arrayElement(countries),
      website: faker.internet.url(),
      firm_type: faker.helpers.arrayElement(firmTypes),
      partner_count: faker.number.int({ min: 1, max: 25 }),
      staff_count: faker.number.int({ min: 2, max: 150 }),
      specializations: faker.helpers.arrayElements(specializations, { min: 2, max: 4 }),
      office_locations: [faker.location.city() + ', ' + faker.helpers.arrayElement(countries)],
      ...overrides
    }
  },
  
  // Generate Big Four style firm
  createBigFour: (overrides = {}) => {
    const bigFourNames = [
      'Global Audit Excellence', 'International Audit Group', 
      'Premier Audit Worldwide', 'Elite Audit Partners'
    ]
    
    return AuditFirmFactory.create({
      firm_name: faker.helpers.arrayElement(bigFourNames),
      firm_type: 'big_four',
      partner_count: faker.number.int({ min: 15, max: 50 }),
      staff_count: faker.number.int({ min: 100, max: 500 }),
      specializations: ['Statutory Audit', 'Management Consulting', 'Risk Assessment', 'Forensic Accounting'],
      office_locations: [
        'Manama, Bahrain',
        'Dubai, UAE', 
        'Riyadh, Saudi Arabia'
      ],
      ...overrides
    })
  },
  
  // Generate boutique specialist firm
  createBoutique: (overrides = {}) => {
    const specialties = [
      { focus: 'Forensic Accounting', name: 'Forensic Audit Specialists' },
      { focus: 'IT Audit', name: 'Technology Audit Partners' },
      { focus: 'Healthcare Audit', name: 'Healthcare Audit Group' },
      { focus: 'Real Estate Audit', name: 'Property Audit Experts' }
    ]
    
    const specialty = faker.helpers.arrayElement(specialties)
    
    return AuditFirmFactory.create({
      firm_name: specialty.name,
      firm_type: 'small_practice',
      partner_count: faker.number.int({ min: 2, max: 5 }),
      staff_count: faker.number.int({ min: 8, max: 25 }),
      specializations: [specialty.focus, 'Statutory Audit'],
      ...overrides
    })
  }
}

// **Audit Client Data Factories**

export const AuditClientFactory = {
  // Generate basic audit client
  create: (overrides = {}) => {
    const industries = [
      'Manufacturing', 'Trading', 'Real Estate', 'Technology', 
      'Healthcare', 'Education', 'Hospitality', 'Finance',
      'Construction', 'Retail', 'Transportation', 'Energy'
    ]
    
    const riskFactors = {
      'Low': { revenue: [100000, 2000000], employees: [5, 50] },
      'Medium': { revenue: [2000000, 15000000], employees: [50, 200] },
      'High': { revenue: [15000000, 100000000], employees: [200, 1000] }
    }
    
    const riskLevel = faker.helpers.arrayElement(['Low', 'Medium', 'High'])
    const riskProfile = riskFactors[riskLevel]
    
    return {
      company: faker.company.name(),
      industry: faker.helpers.arrayElement(industries),
      contactPerson: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+973 #### ####'),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      establishedYear: faker.number.int({ min: 1980, max: 2015 }),
      annualRevenue: faker.number.int({ min: riskProfile.revenue[0], max: riskProfile.revenue[1] }),
      employeeCount: faker.number.int({ min: riskProfile.employees[0], max: riskProfile.employees[1] }),
      fiscalYearEnd: faker.helpers.arrayElement(['31-Dec', '31-Mar', '30-Jun', '30-Sep']),
      riskLevel: riskLevel,
      auditHistory: faker.helpers.arrayElement(['First Time', 'Recurring', 'Changed Auditor']),
      ...overrides
    }
  },
  
  // Generate client for specific industry
  createByIndustry: (industry, overrides = {}) => {
    const industryProfiles = {
      'Manufacturing': {
        complexities: ['Inventory valuation', 'Fixed asset depreciation', 'Work-in-progress'],
        riskLevel: 'High',
        fiscalYearEnd: '31-Dec'
      },
      'Technology': {
        complexities: ['Revenue recognition', 'R&D capitalization', 'Stock options'],
        riskLevel: 'Medium',
        fiscalYearEnd: '31-Dec'
      },
      'Real Estate': {
        complexities: ['Property valuations', 'Development costs', 'Rental income'],
        riskLevel: 'High',
        fiscalYearEnd: '31-Dec'
      },
      'Healthcare': {
        complexities: ['Insurance receivables', 'Equipment depreciation', 'Compliance'],
        riskLevel: 'Medium',
        fiscalYearEnd: '30-Jun'
      }
    }
    
    const profile = industryProfiles[industry] || {}
    
    return AuditClientFactory.create({
      industry,
      riskLevel: profile.riskLevel || 'Medium',
      fiscalYearEnd: profile.fiscalYearEnd || '31-Dec',
      ...overrides
    })
  },
  
  // Generate high-value client
  createHighValue: (overrides = {}) => {
    return AuditClientFactory.create({
      annualRevenue: faker.number.int({ min: 25000000, max: 100000000 }),
      employeeCount: faker.number.int({ min: 300, max: 1000 }),
      riskLevel: 'High',
      auditHistory: 'Recurring',
      industry: faker.helpers.arrayElement(['Manufacturing', 'Finance', 'Energy', 'Real Estate']),
      ...overrides
    })
  }
}

// **Audit Engagement Data Factories**

export const AuditEngagementFactory = {
  create: (clientData = {}, overrides = {}) => {
    const engagementTypes = ['Statutory Audit', 'Review Engagement', 'Agreed-Upon Procedures', 'Special Purpose Audit']
    const currentYear = new Date().getFullYear()
    
    // Calculate materiality as 5% of revenue (simplified)
    const materialityAmount = Math.round((clientData.annualRevenue || 1000000) * 0.05)
    
    // Calculate audit fee as 0.1-0.3% of revenue
    const feePercentage = faker.number.float({ min: 0.001, max: 0.003 })
    const auditFee = Math.round((clientData.annualRevenue || 1000000) * feePercentage)
    
    return {
      engagementType: faker.helpers.arrayElement(engagementTypes),
      periodStart: `${currentYear - 1}-01-01`,
      periodEnd: `${currentYear - 1}-12-31`,
      materialityAmount,
      auditFee: Math.min(auditFee, 150000), // Cap at 150k
      deadlineDate: `${currentYear}-03-31`,
      engagementPartner: faker.person.fullName(),
      auditManager: faker.person.fullName(),
      riskAssessment: clientData.riskLevel || faker.helpers.arrayElement(['Low', 'Medium', 'High']),
      status: 'Planning',
      phase: 'Risk Assessment',
      completion: 0,
      ...overrides
    }
  },
  
  // Create engagement at specific stage
  createAtStage: (stage, clientData = {}, overrides = {}) => {
    const stages = {
      'Planning': { status: 'In Progress', completion: 25, phase: 'Risk Assessment' },
      'Fieldwork': { status: 'In Progress', completion: 60, phase: 'Substantive Testing' },
      'Completion': { status: 'In Progress', completion: 85, phase: 'Review & Finalization' },
      'Completed': { status: 'Completed', completion: 100, phase: 'Audit Report Issued' }
    }
    
    const stageData = stages[stage] || stages['Planning']
    
    return AuditEngagementFactory.create(clientData, {
      ...stageData,
      ...overrides
    })
  }
}

// **Audit Procedure Data Factories**

export const AuditProcedureFactory = {
  createByArea: (auditArea) => {
    const proceduresByArea = {
      'Cash & Bank': [
        'Bank confirmation procedures',
        'Bank reconciliation review',
        'Cash count verification',
        'Cut-off testing',
        'Analytical procedures'
      ],
      'Accounts Receivable': [
        'Aging analysis review',
        'Customer confirmation procedures',
        'Bad debt provision assessment',
        'Credit note testing',
        'Subsequent receipts testing'
      ],
      'Inventory': [
        'Physical count observation',
        'Cost testing procedures',
        'Net realizable value assessment',
        'Cut-off procedures',
        'Obsolete inventory review'
      ],
      'Fixed Assets': [
        'Addition testing',
        'Disposal verification',
        'Depreciation calculation review',
        'Impairment assessment',
        'Physical verification'
      ],
      'Accounts Payable': [
        'Supplier confirmation',
        'Cut-off testing',
        'Analytical procedures',
        'Search for unrecorded liabilities',
        'Subsequent payment testing'
      ]
    }
    
    const procedures = proceduresByArea[auditArea] || []
    
    return procedures.map(procedure => ({
      area: auditArea,
      procedure,
      status: faker.helpers.arrayElement(['Not Started', 'In Progress', 'Completed']),
      assignedTo: faker.person.fullName(),
      estimatedHours: faker.number.int({ min: 2, max: 16 }),
      actualHours: faker.number.int({ min: 1, max: 20 }),
      notes: faker.lorem.sentence()
    }))
  },
  
  createFullAuditProgram: () => {
    const auditAreas = [
      'Cash & Bank', 'Accounts Receivable', 'Inventory', 
      'Fixed Assets', 'Accounts Payable', 'Revenue', 
      'Expenses', 'Provisions'
    ]
    
    return auditAreas.flatMap(area => 
      AuditProcedureFactory.createByArea(area)
    )
  }
}

// **Analytics Data Factories**

export const AnalyticsDataFactory = {
  createTimeSeriesData: (months = 12) => {
    const data = []
    const baseDate = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1)
      
      data.push({
        date: date.toISOString().split('T')[0],
        clientsAdded: faker.number.int({ min: 1, max: 12 }),
        engagementsStarted: faker.number.int({ min: 0, max: 20 }),
        auditsCompleted: faker.number.int({ min: 0, max: 15 }),
        revenue: faker.number.int({ min: 50000, max: 300000 }),
        billableHours: faker.number.int({ min: 200, max: 800 }),
        teamUtilization: faker.number.float({ min: 65, max: 95, precision: 0.1 })
      })
    }
    
    return data
  },
  
  createPerformanceMetrics: () => {
    return {
      averageAuditTime: faker.number.float({ min: 4.5, max: 8.2, precision: 0.1 }),
      clientSatisfaction: faker.number.float({ min: 4.2, max: 5.0, precision: 0.1 }),
      onTimeDelivery: faker.number.float({ min: 92, max: 99.5, precision: 0.1 }),
      teamUtilization: faker.number.float({ min: 78, max: 92, precision: 0.1 }),
      revenuePerPartner: faker.number.int({ min: 800000, max: 1500000 }),
      profitMargin: faker.number.float({ min: 18, max: 35, precision: 0.1 })
    }
  }
}

// **Audit Finding Data Factories**

export const AuditFindingFactory = {
  create: (severity = null) => {
    const severityLevels = ['Low', 'Medium', 'High']
    const selectedSeverity = severity || faker.helpers.arrayElement(severityLevels)
    
    const findingsByCategory = {
      'Internal Controls': [
        'Segregation of duties weakness',
        'Inadequate authorization procedures',
        'Insufficient documentation',
        'Lack of independent review'
      ],
      'Financial Reporting': [
        'Classification errors',
        'Cut-off issues',
        'Valuation concerns',
        'Disclosure inadequacies'
      ],
      'Compliance': [
        'Regulatory filing delays',
        'License renewal issues',
        'Tax compliance gaps',
        'Environmental compliance'
      ]
    }
    
    const category = faker.helpers.objectKey(findingsByCategory)
    const findingText = faker.helpers.arrayElement(findingsByCategory[category])
    
    return {
      category,
      severity: selectedSeverity,
      finding: findingText + ' identified during audit procedures',
      recommendation: 'Management should implement enhanced controls and procedures',
      managementResponse: faker.helpers.arrayElement([
        'Agreed. Will implement by quarter end.',
        'Partially agreed. Will review with legal team.',
        'Agreed. Implementation in progress.',
        'Noted. Will discuss with board.'
      ]),
      status: faker.helpers.arrayElement(['Open', 'In Progress', 'Resolved']),
      identifiedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  },
  
  createMultiple: (count = 5, severityDistribution = null) => {
    const findings = []
    
    for (let i = 0; i < count; i++) {
      let severity = null
      if (severityDistribution) {
        severity = faker.helpers.arrayElement(severityDistribution)
      }
      findings.push(AuditFindingFactory.create(severity))
    }
    
    return findings
  }
}

// **Utility Functions**

export const DemoDataUtils = {
  // Generate demo scenario configurations
  createDemoScenario: (scenarioType) => {
    const scenarios = {
      'sales_demo': {
        firmCount: 1,
        clientCount: 5,
        engagementCount: 3,
        duration: '15 minutes',
        focus: 'impressive_capabilities'
      },
      'technical_demo': {
        firmCount: 2,
        clientCount: 8,
        engagementCount: 6,
        duration: '30 minutes',
        focus: 'technical_features'
      },
      'customer_pilot': {
        firmCount: 1,
        clientCount: 15,
        engagementCount: 10,
        duration: '2 hours',
        focus: 'realistic_data'
      }
    }
    
    return scenarios[scenarioType] || scenarios['sales_demo']
  },
  
  // Generate consistent demo timestamps
  createDemoTimeline: (startDate, durationDays) => {
    const start = new Date(startDate)
    const milestones = []
    
    for (let i = 0; i <= durationDays; i += Math.ceil(durationDays / 10)) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      milestones.push(date.toISOString().split('T')[0])
    }
    
    return milestones
  }
}