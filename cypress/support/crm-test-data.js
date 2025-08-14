/**
 * HERA CRM Test Data Generator
 * Creates realistic enterprise-grade test data for sales demos and training
 */

export const CRM_DEMO_SCENARIOS = {
  // Enterprise Technology Company
  techVantage: {
    organization: {
      name: 'TechVantage Solutions',
      code: 'TECHVANT001',
      type: 'corporation',
      industry: 'Enterprise Software',
      email: 'info@techvantage.com',
      phone: '+1-555-TECH-001',
      website: 'www.techvantage.com',
      employees: '500-1000',
      revenue: '$50M-100M'
    },
    salesTeam: [
      {
        name: 'Sarah Mitchell',
        email: 'sarah.mitchell@techvantage.com',
        role: 'VP of Sales',
        phone: '+1-555-001-0001',
        quota: 2000000,
        territory: 'Enterprise East'
      },
      {
        name: 'David Rodriguez',
        email: 'david.rodriguez@techvantage.com',
        role: 'Senior Account Executive',
        phone: '+1-555-001-0002',
        quota: 1200000,
        territory: 'Mid-Market West'
      },
      {
        name: 'Emma Chen',
        email: 'emma.chen@techvantage.com',
        role: 'Sales Development Manager',
        phone: '+1-555-001-0003',
        quota: 800000,
        territory: 'SMB National'
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus.johnson@techvantage.com',
        role: 'Account Executive',
        phone: '+1-555-001-0004',
        quota: 900000,
        territory: 'Enterprise Central'
      }
    ],
    targetCompanies: [
      {
        name: 'Global Manufacturing Corp',
        industry: 'Manufacturing',
        size: '5000+',
        revenue: '$2B+',
        location: 'Detroit, MI',
        website: 'www.globalmanuf.com',
        technicalStack: ['SAP', 'Oracle', 'Microsoft'],
        painPoints: ['Legacy system integration', 'Data silos', 'Manual processes'],
        budget: '$500K-1M',
        decisionProcess: '6-12 months',
        competitors: ['Salesforce', 'Microsoft Dynamics', 'Oracle CX']
      },
      {
        name: 'InnovateAI Startup',
        industry: 'Artificial Intelligence',
        size: '50-100',
        revenue: '$10M-25M',
        location: 'San Francisco, CA',
        website: 'www.innovateai.com',
        technicalStack: ['Python', 'TensorFlow', 'AWS'],
        painPoints: ['Scaling customer operations', 'Data management', 'Integration complexity'],
        budget: '$100K-250K',
        decisionProcess: '2-4 months',
        competitors: ['HubSpot', 'Pipedrive', 'Freshworks']
      },
      {
        name: 'Healthcare Systems LLC',
        industry: 'Healthcare Technology',
        size: '1000-2000',
        revenue: '$500M-1B',
        location: 'Boston, MA',
        website: 'www.healthsys.com',
        technicalStack: ['Epic', 'Cerner', 'Azure'],
        painPoints: ['HIPAA compliance', 'Patient data security', 'Interoperability'],
        budget: '$300K-750K',
        decisionProcess: '9-18 months',
        competitors: ['Epic', 'Cerner', 'Allscripts']
      },
      {
        name: 'RetailTech Innovations',
        industry: 'Retail Technology',
        size: '200-500',
        revenue: '$100M-250M',
        location: 'Austin, TX',
        website: 'www.retailtech.com',
        technicalStack: ['Shopify', 'Magento', 'GCP'],
        painPoints: ['Omnichannel management', 'Inventory optimization', 'Customer analytics'],
        budget: '$150K-400K',
        decisionProcess: '3-6 months',
        competitors: ['Shopify Plus', 'BigCommerce', 'Adobe Commerce']
      }
    ],
    keyContacts: [
      {
        name: 'Michael Thompson',
        title: 'Chief Technology Officer',
        company: 'Global Manufacturing Corp',
        email: 'michael.thompson@globalmanuf.com',
        phone: '+1-313-555-0101',
        linkedIn: 'linkedin.com/in/michael-thompson-cto',
        decisionMaker: true,
        influenceLevel: 'High',
        relationshipStrength: 'Warm',
        communicationPreference: 'Email + Phone',
        personalInterests: ['Golf', 'Technology Innovation', 'Sustainability'],
        professionalBackground: '15+ years in manufacturing technology',
        painPoints: ['System integration complexity', 'Legacy modernization'],
        goals: ['Digital transformation', 'Operational efficiency', 'Cost reduction']
      },
      {
        name: 'Lisa Park',
        title: 'VP of Operations',
        company: 'InnovateAI Startup',
        email: 'lisa.park@innovateai.com',
        phone: '+1-415-555-0202',
        linkedIn: 'linkedin.com/in/lisa-park-operations',
        decisionMaker: true,
        influenceLevel: 'High',
        relationshipStrength: 'Cold',
        communicationPreference: 'Video calls',
        personalInterests: ['Machine Learning', 'Startups', 'Hiking'],
        professionalBackground: '10+ years in AI/ML operations',
        painPoints: ['Rapid scaling challenges', 'Process standardization'],
        goals: ['Streamline operations', 'Scale team efficiency', 'Improve customer experience']
      },
      {
        name: 'Dr. James Wilson',
        title: 'Chief Medical Officer',
        company: 'Healthcare Systems LLC',
        email: 'james.wilson@healthsys.com',
        phone: '+1-617-555-0303',
        linkedIn: 'linkedin.com/in/dr-james-wilson',
        decisionMaker: false,
        influenceLevel: 'Medium',
        relationshipStrength: 'Warm',
        communicationPreference: 'In-person meetings',
        personalInterests: ['Healthcare Innovation', 'Medical Research', 'Tennis'],
        professionalBackground: '20+ years in healthcare administration',
        painPoints: ['Regulatory compliance', 'Patient data security', 'System interoperability'],
        goals: ['Improve patient outcomes', 'Ensure compliance', 'Reduce administrative burden']
      },
      {
        name: 'Jennifer Martinez',
        title: 'Director of IT',
        company: 'RetailTech Innovations',
        email: 'jennifer.martinez@retailtech.com',
        phone: '+1-512-555-0404',
        linkedIn: 'linkedin.com/in/jennifer-martinez-it',
        decisionMaker: true,
        influenceLevel: 'High',
        relationshipStrength: 'New',
        communicationPreference: 'Slack + Email',
        personalInterests: ['Retail Technology', 'E-commerce', 'Music'],
        professionalBackground: '12+ years in retail technology',
        painPoints: ['Technology stack complexity', 'Data integration', 'Performance optimization'],
        goals: ['Modernize tech stack', 'Improve system performance', 'Enable data-driven decisions']
      }
    ],
    salesOpportunities: [
      {
        name: 'Global Manufacturing - Digital Transformation Initiative',
        account: 'Global Manufacturing Corp',
        primaryContact: 'Michael Thompson',
        stage: 'Proposal',
        value: 750000,
        probability: 85,
        expectedCloseDate: '2024-03-15',
        actualCloseDate: null,
        salesCycle: '8 months',
        competitiveRisk: 'Medium',
        keyCompetitors: ['Salesforce Manufacturing Cloud', 'Microsoft Dynamics 365'],
        businessCase: 'Modernize legacy manufacturing systems, improve operational efficiency by 25%, reduce manual processes by 60%',
        technicalRequirements: ['API integrations with SAP', 'Real-time dashboard', 'Mobile access', 'Advanced analytics'],
        stakeholders: ['CTO', 'VP Manufacturing', 'IT Director', 'Plant Managers'],
        nextSteps: ['Technical presentation', 'POC deployment', 'Executive buy-in meeting'],
        riskFactors: ['Budget approval timing', 'Change management resistance'],
        championStrength: 'Strong - CTO is advocate'
      },
      {
        name: 'InnovateAI - ML Platform Integration',
        account: 'InnovateAI Startup',
        primaryContact: 'Lisa Park',
        stage: 'Discovery',
        value: 125000,
        probability: 45,
        expectedCloseDate: '2024-04-30',
        actualCloseDate: null,
        salesCycle: '4 months',
        competitiveRisk: 'High',
        keyCompetitors: ['HubSpot', 'Pipedrive', 'Custom build'],
        businessCase: 'Accelerate customer onboarding, improve data analytics capabilities, support 3x growth',
        technicalRequirements: ['ML model integration', 'Real-time data processing', 'API-first architecture'],
        stakeholders: ['VP Operations', 'CTO', 'Head of Customer Success'],
        nextSteps: ['Product demo', 'Technical deep-dive', 'Reference customer call'],
        riskFactors: ['Startup budget constraints', 'Build vs buy decision'],
        championStrength: 'Medium - Building relationship'
      },
      {
        name: 'Healthcare Systems - HIPAA Compliance Suite',
        account: 'Healthcare Systems LLC',
        primaryContact: 'Dr. James Wilson',
        stage: 'Negotiation',
        value: 450000,
        probability: 90,
        expectedCloseDate: '2024-02-28',
        actualCloseDate: null,
        salesCycle: '12 months',
        competitiveRisk: 'Low',
        keyCompetitors: ['Epic MyChart', 'Cerner PowerChart'],
        businessCase: 'Ensure HIPAA compliance, improve patient data security, streamline healthcare workflows',
        technicalRequirements: ['HIPAA compliance', 'HL7 FHIR integration', 'Audit trails', 'Role-based access'],
        stakeholders: ['CMO', 'CISO', 'Compliance Officer', 'IT Director'],
        nextSteps: ['Contract negotiation', 'Security audit', 'Implementation planning'],
        riskFactors: ['Regulatory approval process', 'Integration complexity'],
        championStrength: 'Very Strong - CMO committed'
      },
      {
        name: 'RetailTech - Omnichannel Customer Platform',
        account: 'RetailTech Innovations', 
        primaryContact: 'Jennifer Martinez',
        stage: 'Qualification',
        value: 275000,
        probability: 60,
        expectedCloseDate: '2024-05-15',
        actualCloseDate: null,
        salesCycle: '6 months',
        competitiveRisk: 'Medium',
        keyCompetitors: ['Shopify Plus', 'Adobe Commerce Cloud'],
        businessCase: 'Unify customer experience across channels, improve conversion rates by 15%, reduce cart abandonment',
        technicalRequirements: ['E-commerce integration', 'Real-time inventory', 'Customer analytics', 'Mobile optimization'],
        stakeholders: ['IT Director', 'VP Marketing', 'Head of E-commerce'],
        nextSteps: ['Technical architecture review', 'ROI analysis', 'Pilot program proposal'],
        riskFactors: ['Holiday season timing', 'Integration downtime concerns'],
        championStrength: 'Good - IT Director engaged'
      }
    ],
    salesActivities: [
      {
        type: 'call',
        subject: 'Discovery Call - Global Manufacturing',
        contact: 'Michael Thompson',
        duration: 45,
        date: '2024-01-15',
        outcome: 'Qualified opportunity, identified key pain points',
        nextAction: 'Send technical proposal',
        notes: 'CTO confirmed $750K budget for digital transformation. Main pain points: legacy system integration, manual processes, data silos. Interested in API-first architecture and real-time analytics.'
      },
      {
        type: 'email',
        subject: 'InnovateAI Product Demo Follow-up',
        contact: 'Lisa Park',
        date: '2024-01-18',
        outcome: 'Positive response, requested technical deep-dive',
        nextAction: 'Schedule technical presentation',
        notes: 'VP Operations impressed with ML integration capabilities. Requested architecture review and ROI analysis. Mentioned competing with HubSpot and internal build option.'
      },
      {
        type: 'meeting',
        subject: 'Healthcare Systems Security Review',
        contact: 'Dr. James Wilson',
        duration: 90,
        date: '2024-01-20',
        outcome: 'Security requirements validated, moving to negotiation',
        nextAction: 'Contract review with legal',
        notes: 'Comprehensive security audit completed. HIPAA compliance requirements fully addressed. CMO ready to proceed with implementation. Legal review scheduled for next week.'
      },
      {
        type: 'demo',
        subject: 'RetailTech Platform Demonstration',
        contact: 'Jennifer Martinez',
        duration: 60,
        date: '2024-01-22',
        outcome: 'Strong interest in omnichannel features',
        nextAction: 'Prepare ROI analysis',
        notes: 'IT Director and VP Marketing attended demo. Particularly interested in real-time inventory and customer analytics. Requested ROI analysis for board presentation.'
      }
    ],
    quarterlyTargets: {
      Q1_2024: {
        revenue: 1800000,
        newDeals: 12,
        pipelineGeneration: 3600000,
        keyFocusAreas: ['Enterprise expansion', 'Manufacturing vertical', 'Competitive displacement']
      },
      Q2_2024: {
        revenue: 2100000,
        newDeals: 15,
        pipelineGeneration: 4200000,
        keyFocusAreas: ['Healthcare compliance', 'AI/ML integrations', 'Channel partnerships']
      }
    }
  },

  // Financial Services Demo Scenario
  finServicesDemo: {
    organization: {
      name: 'FinTech Solutions Group',
      code: 'FINTECH001',
      type: 'llc',
      industry: 'Financial Services',
      email: 'contact@fintechsolutions.com',
      phone: '+1-212-555-FINTECH',
      website: 'www.fintechsolutions.com'
    },
    keyAccounts: [
      {
        name: 'Regional Community Bank',
        type: 'Traditional Banking',
        assets: '$2.5B',
        branches: 45,
        employees: 800
      },
      {
        name: 'Digital Credit Union',
        type: 'Credit Union',
        assets: '$800M',
        members: 65000,
        employees: 200
      }
    ]
  }
}

export const PERFORMANCE_BENCHMARKS = {
  pageLoad: {
    dashboard: '< 2 seconds',
    contacts: '< 1.5 seconds',
    pipeline: '< 3 seconds'
  },
  apiResponse: {
    createContact: '< 500ms',
    searchContacts: '< 200ms',
    loadDeals: '< 800ms'
  },
  scalability: {
    maxContacts: 10000,
    maxDealsPerStage: 100,
    concurrentUsers: 50
  }
}

export const UAT_SCENARIOS = [
  {
    id: 'UAT-001',
    name: 'Organization Setup',
    priority: 'Critical',
    estimatedTime: '15 minutes',
    steps: [
      'Create organization',
      'Configure settings',
      'Add users and roles',
      'Verify permissions'
    ]
  },
  {
    id: 'UAT-002', 
    name: 'Contact Management Workflow',
    priority: 'Critical',
    estimatedTime: '25 minutes',
    steps: [
      'Import contacts',
      'Create new contacts',
      'Update contact information',
      'Merge duplicate contacts',
      'Export contact list'
    ]
  },
  {
    id: 'UAT-003',
    name: 'Sales Pipeline Management',
    priority: 'Critical',
    estimatedTime: '30 minutes',
    steps: [
      'Create opportunities',
      'Progress deals through stages',
      'Update deal values and probabilities',
      'Generate pipeline reports',
      'Close deals (won/lost)'
    ]
  },
  {
    id: 'UAT-004',
    name: 'Mobile Responsiveness',
    priority: 'High',
    estimatedTime: '20 minutes',
    steps: [
      'Test on smartphone',
      'Test on tablet',
      'Verify touch interactions',
      'Check modal responsiveness'
    ]
  },
  {
    id: 'UAT-005',
    name: 'Performance & Scalability',
    priority: 'High',
    estimatedTime: '35 minutes',
    steps: [
      'Load test with 1000+ records',
      'Measure page load times',
      'Test concurrent user access',
      'Verify data integrity'
    ]
  }
]

export default { CRM_DEMO_SCENARIOS, PERFORMANCE_BENCHMARKS, UAT_SCENARIOS }