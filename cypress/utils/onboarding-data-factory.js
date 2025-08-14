// Customer Onboarding Data Factory
// Generates realistic customer onboarding scenarios for audit firms

import { faker } from '@faker-js/faker'

export const CustomerOnboardingFactory = {
  // Create customer onboarding profile
  createOnboardingProfile: (overrides = {}) => {
    const industries = [
      'Manufacturing', 'Trading', 'Technology', 'Real Estate', 
      'Healthcare', 'Education', 'Hospitality', 'Finance',
      'Construction', 'Retail', 'Transportation', 'Energy'
    ]
    
    const businessSizes = ['Small', 'Medium', 'Large', 'Enterprise']
    const complexityLevels = ['Low', 'Medium', 'High', 'Very High']
    const auditTypes = ['Statutory Audit', 'Review Engagement', 'Agreed-Upon Procedures', 'Special Purpose Audit']
    
    return {
      // Basic company information
      company: faker.company.name(),
      contactPerson: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number('+973 #### ####'),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      
      // Business details
      industry: faker.helpers.arrayElement(industries),
      businessSize: faker.helpers.arrayElement(businessSizes),
      annualRevenue: faker.number.int({ min: 500000, max: 100000000 }),
      employeeCount: faker.number.int({ min: 10, max: 2000 }),
      establishedYear: faker.number.int({ min: 1980, max: 2020 }),
      
      // Audit requirements
      auditType: faker.helpers.arrayElement(auditTypes),
      complexity: faker.helpers.arrayElement(complexityLevels),
      riskLevel: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
      fiscalYearEnd: faker.helpers.arrayElement(['31-Dec', '31-Mar', '30-Jun', '30-Sep']),
      auditHistory: faker.helpers.arrayElement(['First Time', 'Recurring', 'Changed Auditor']),
      
      // Onboarding specifics
      onboardingPriority: faker.helpers.arrayElement(['Standard', 'Urgent', 'VIP']),
      referralSource: faker.helpers.arrayElement(['Website', 'Referral', 'Cold Call', 'Trade Show', 'LinkedIn']),
      estimatedFee: 0, // Calculated based on revenue
      deadlineDate: faker.date.future({ days: 120 }),
      
      // Custom requirements
      specialRequirements: faker.helpers.arrayElements([
        'Multi-location audit',
        'International standards compliance',
        'Regulatory filing assistance',
        'Management letter recommendations',
        'IT systems review',
        'Environmental compliance check'
      ], { min: 0, max: 3 }),
      
      ...overrides
    }
  },
  
  // Create onboarding workflow steps
  createOnboardingWorkflow: (customerProfile) => {
    const baseSteps = [
      {
        id: 1,
        name: 'Customer Information',
        description: 'Collect basic company and contact information',
        required: true,
        estimatedTime: '5 minutes',
        automationLevel: '60%',
        status: 'pending'
      },
      {
        id: 2,
        name: 'Business Assessment',
        description: 'Evaluate business size, industry, and requirements',
        required: true,
        estimatedTime: '10 minutes',
        automationLevel: '80%',
        status: 'pending'
      },
      {
        id: 3,
        name: 'Risk Evaluation',
        description: 'Assess audit risks and complexity factors',
        required: true,
        estimatedTime: '8 minutes',
        automationLevel: '85%',
        status: 'pending'
      },
      {
        id: 4,
        name: 'Service Agreement',
        description: 'Define audit scope, timeline, and fees',
        required: true,
        estimatedTime: '12 minutes',
        automationLevel: '70%',
        status: 'pending'
      },
      {
        id: 5,
        name: 'Team Assignment',
        description: 'Assign optimal audit team based on skills and availability',
        required: false,
        estimatedTime: '3 minutes',
        automationLevel: '95%',
        status: 'pending'
      },
      {
        id: 6,
        name: 'Kickoff Scheduling',
        description: 'Schedule initial client meeting and document requests',
        required: false,
        estimatedTime: '5 minutes',
        automationLevel: '75%',
        status: 'pending'
      }
    ]
    
    // Add industry-specific steps
    const industrySteps = {
      'Manufacturing': {
        id: 7,
        name: 'Inventory Assessment',
        description: 'Special considerations for inventory count and valuation',
        required: true,
        estimatedTime: '6 minutes',
        automationLevel: '65%',
        status: 'pending'
      },
      'Technology': {
        id: 7,
        name: 'Revenue Recognition Review',
        description: 'Assess software revenue recognition complexities',
        required: true,
        estimatedTime: '8 minutes',
        automationLevel: '60%',
        status: 'pending'
      },
      'Real Estate': {
        id: 7,
        name: 'Property Valuation Planning',
        description: 'Plan for property valuation and fair value assessments',
        required: true,
        estimatedTime: '10 minutes',
        automationLevel: '50%',
        status: 'pending'
      },
      'Healthcare': {
        id: 7,
        name: 'Compliance Requirements',
        description: 'Healthcare-specific regulatory compliance review',
        required: true,
        estimatedTime: '12 minutes',
        automationLevel: '45%',
        status: 'pending'
      }
    }
    
    if (industrySteps[customerProfile.industry]) {
      baseSteps.push(industrySteps[customerProfile.industry])
    }
    
    return baseSteps
  },
  
  // Create onboarding automation tasks
  createAutomationTasks: (customerProfile) => {
    const baseTasks = [
      {
        taskId: faker.string.uuid(),
        type: 'Document Request',
        description: 'Generate and send standard audit document request list',
        automationLevel: '100%',
        executionTime: '< 5 seconds',
        status: 'pending',
        dependencies: [],
        template: 'Standard Audit Documents'
      },
      {
        taskId: faker.string.uuid(),
        type: 'Team Assignment',
        description: 'Assign optimal audit team based on industry expertise and availability',
        automationLevel: '95%',
        executionTime: '< 3 seconds',
        status: 'pending',
        dependencies: ['Customer Information'],
        algorithm: 'Skills-based matching'
      },
      {
        taskId: faker.string.uuid(),
        type: 'Risk Assessment',
        description: 'Generate preliminary risk assessment based on industry and size',
        automationLevel: '85%',
        executionTime: '< 10 seconds',
        status: 'pending',
        dependencies: ['Business Assessment'],
        aiModel: 'Risk prediction v2.1'
      },
      {
        taskId: faker.string.uuid(),
        type: 'Engagement Letter',
        description: 'Generate customized engagement letter with terms and conditions',
        automationLevel: '90%',
        executionTime: '< 15 seconds',
        status: 'pending',
        dependencies: ['Service Agreement'],
        template: 'Industry-specific engagement letter'
      },
      {
        taskId: faker.string.uuid(),
        type: 'Fee Calculation',
        description: 'Calculate recommended audit fee based on complexity and market rates',
        automationLevel: '98%',
        executionTime: '< 2 seconds',
        status: 'pending',
        dependencies: ['Business Assessment', 'Risk Evaluation'],
        algorithm: 'Dynamic pricing v3.0'
      },
      {
        taskId: faker.string.uuid(),
        type: 'Timeline Generation',
        description: 'Create optimal audit timeline based on client deadlines and team availability',
        automationLevel: '92%',
        executionTime: '< 8 seconds',
        status: 'pending',
        dependencies: ['Team Assignment', 'Service Agreement'],
        scheduler: 'Smart scheduling engine'
      }
    ]
    
    // Add industry-specific automation tasks
    const industryTasks = {
      'Manufacturing': [
        {
          taskId: faker.string.uuid(),
          type: 'Inventory Count Planning',
          description: 'Schedule and plan inventory observation procedures',
          automationLevel: '75%',
          executionTime: '< 12 seconds',
          status: 'pending',
          dependencies: ['Business Assessment'],
          template: 'Manufacturing inventory procedures'
        }
      ],
      'Technology': [
        {
          taskId: faker.string.uuid(),
          type: 'Revenue Recognition Analysis',
          description: 'Analyze software revenue streams and recognition patterns',
          automationLevel: '70%',
          executionTime: '< 20 seconds',
          status: 'pending',
          dependencies: ['Business Assessment'],
          aiModel: 'Revenue recognition classifier'
        }
      ],
      'Real Estate': [
        {
          taskId: faker.string.uuid(),
          type: 'Valuation Expert Coordination',
          description: 'Coordinate with property valuation experts',
          automationLevel: '60%',
          executionTime: '< 30 seconds',
          status: 'pending',
          dependencies: ['Risk Assessment'],
          network: 'Certified valuation partners'
        }
      ]
    }
    
    if (industryTasks[customerProfile.industry]) {
      baseTasks.push(...industryTasks[customerProfile.industry])
    }
    
    return baseTasks
  },
  
  // Create onboarding notifications
  createNotifications: (customerProfile, onboardingId) => {
    return [
      {
        id: faker.string.uuid(),
        type: 'Email',
        recipient: 'customer',
        recipientEmail: customerProfile.email,
        subject: `Welcome to ${faker.company.name()} - Your Audit Journey Begins`,
        template: 'customer_welcome',
        status: 'pending',
        scheduledTime: new Date().toISOString(),
        personalization: {
          customerName: customerProfile.contactPerson,
          companyName: customerProfile.company,
          auditType: customerProfile.auditType,
          estimatedTimeline: '6-8 weeks'
        }
      },
      {
        id: faker.string.uuid(),
        type: 'SMS',
        recipient: 'customer',
        recipientPhone: customerProfile.phone,
        message: `Welcome ${customerProfile.contactPerson}! Your audit onboarding (ID: ${onboardingId}) has started. Check your email for next steps.`,
        status: 'pending',
        scheduledTime: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes delay
      },
      {
        id: faker.string.uuid(),
        type: 'Internal',
        recipient: 'audit_team',
        subject: `New Client Onboarded: ${customerProfile.company}`,
        message: `${customerProfile.company} (${customerProfile.industry}) has been onboarded. Risk level: ${customerProfile.riskLevel}, Audit type: ${customerProfile.auditType}`,
        priority: customerProfile.onboardingPriority === 'VIP' ? 'High' : 'Normal',
        status: 'pending',
        scheduledTime: new Date().toISOString()
      },
      {
        id: faker.string.uuid(),
        type: 'Dashboard',
        recipient: 'engagement_partner',
        title: 'New Client Requires Review',
        message: `${customerProfile.company} onboarding completed. Review risk assessment and approve engagement letter.`,
        actionRequired: true,
        status: 'pending',
        scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes delay
      }
    ]
  },
  
  // Create onboarding analytics data
  createOnboardingAnalytics: (timeframe = 6) => {
    return {
      performance: {
        averageOnboardingTime: faker.number.float({ min: 2.5, max: 4.5, precision: 0.1 }),
        completionRate: faker.number.float({ min: 90, max: 98, precision: 0.1 }),
        customerSatisfaction: faker.number.float({ min: 4.2, max: 5.0, precision: 0.1 }),
        timeToFirstMeeting: faker.number.float({ min: 1.0, max: 3.0, precision: 0.1 }),
        documentCollectionRate: faker.number.float({ min: 85, max: 95, precision: 0.1 }),
        automationEfficiency: faker.number.float({ min: 88, max: 96, precision: 0.1 })
      },
      trends: Array.from({ length: timeframe }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (timeframe - 1 - i))
        
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          customersOnboarded: faker.number.int({ min: 8, max: 25 }),
          averageTime: faker.number.float({ min: 2.0, max: 5.0, precision: 0.1 }),
          satisfaction: faker.number.float({ min: 4.0, max: 5.0, precision: 0.1 }),
          automationLevel: faker.number.float({ min: 80, max: 95, precision: 0.1 }),
          dropoffRate: faker.number.float({ min: 2, max: 8, precision: 0.1 })
        }
      }),
      industryBreakdown: (() => {
        const breakdown = {
          'Manufacturing': 35,
          'Trading': 25,
          'Technology': 20,
          'Real Estate': 15,
          'Healthcare': 10,
          'Other': 5
        }
        // Ensure total equals 100
        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0)
        if (total !== 100) {
          breakdown['Other'] = 100 - (total - breakdown['Other'])
        }
        return breakdown
      })(),
      bottlenecks: [
        {
          stage: 'Document Collection',
          frequency: faker.number.int({ min: 15, max: 35 }),
          averageDelay: faker.number.float({ min: 1.5, max: 4.0, precision: 0.1 }),
          impact: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
          recommendation: 'Implement automated follow-up reminders and document portal'
        },
        {
          stage: 'Risk Assessment Review',
          frequency: faker.number.int({ min: 8, max: 20 }),
          averageDelay: faker.number.float({ min: 0.5, max: 2.0, precision: 0.1 }),
          impact: faker.helpers.arrayElement(['Low', 'Medium']),
          recommendation: 'Streamline partner approval process with digital signatures'
        },
        {
          stage: 'Engagement Letter Approval',
          frequency: faker.number.int({ min: 5, max: 15 }),
          averageDelay: faker.number.float({ min: 1.0, max: 3.0, precision: 0.1 }),
          impact: faker.helpers.arrayElement(['Medium', 'High']),
          recommendation: 'Pre-approve standard terms and automate letter generation'
        }
      ]
    }
  },
  
  // Create multiple onboarding profiles for testing
  createMultipleProfiles: (count = 10) => {
    return Array.from({ length: count }, (_, i) => {
      const profile = CustomerOnboardingFactory.createOnboardingProfile()
      
      // Calculate estimated fee based on revenue and complexity
      const baseFeeRate = 0.002 // 0.2% of revenue
      const complexityMultiplier = {
        'Low': 0.8,
        'Medium': 1.0,
        'High': 1.3,
        'Very High': 1.6
      }
      
      const feeMultiplier = complexityMultiplier[profile.complexity] || 1.0
      profile.estimatedFee = Math.round(profile.annualRevenue * baseFeeRate * feeMultiplier)
      
      // Ensure fee is within reasonable bounds
      profile.estimatedFee = Math.min(Math.max(profile.estimatedFee, 5000), 250000)
      
      return {
        ...profile,
        onboardingId: `ONB-2025-${String(i + 1).padStart(3, '0')}`,
        workflow: CustomerOnboardingFactory.createOnboardingWorkflow(profile),
        automationTasks: CustomerOnboardingFactory.createAutomationTasks(profile),
        notifications: CustomerOnboardingFactory.createNotifications(profile, `ONB-2025-${String(i + 1).padStart(3, '0')}`)
      }
    })
  }
}