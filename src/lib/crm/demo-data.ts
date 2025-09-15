/**
 * HERA CRM Demo Data - Professional Customer Demo
 * TechVantage Solutions Success Story
 *
 * Realistic business scenario for customer presentations
 * - 4 sales reps with individual performance
 * - $1.6M total pipeline value
 * - Enterprise customers across different industries
 * - Competitive advantages vs Salesforce/HubSpot
 */

export interface DemoContact {
  id: number
  name: string
  company: string
  email: string
  phone: string
  status: 'lead' | 'prospect' | 'customer' | 'champion'
  industry: string
  lastContact: string
  value: number
  probability: number
  tags: string[]
  assignedTo: string
  source: string
  notes: string
  nextAction: string
  nextActionDate: string
}

export interface DemoOpportunity {
  id: number
  name: string
  contact: string
  contactId: number
  company: string
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  value: number
  closeDate: string
  probability: number
  assignedTo: string
  source: string
  description: string
  competitorInfo?: string
  winProbability: string
}

export interface DemoTask {
  id: number
  title: string
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow-up'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  status: 'pending' | 'completed' | 'overdue'
  contactId: number
  assignedTo: string
  notes?: string
}

export interface DemoSalesRep {
  id: string
  name: string
  email: string
  role: string
  quota: number
  achieved: number
  deals: number
  avatar: string
}

// Professional Demo Contacts - TechVantage Solutions Success Story
export const demoContacts: DemoContact[] = [
  {
    id: 1,
    name: 'Sarah Chen',
    company: 'Global Manufacturing Corp',
    email: 'sarah.chen@globalmanufacturing.com',
    phone: '+1 (555) 234-5678',
    status: 'champion',
    industry: 'Manufacturing',
    lastContact: '2024-08-05',
    value: 750000,
    probability: 85,
    tags: ['Enterprise', 'Hot Lead', 'Decision Maker', 'SAP Migration'],
    assignedTo: 'Michael Harrison',
    source: 'Referral',
    notes:
      'CFO of $500M manufacturing company. Currently struggling with SAP complexity. Looking for modern ERP solution.',
    nextAction: 'Executive Demo',
    nextActionDate: '2024-08-08'
  },
  {
    id: 2,
    name: 'Dr. James Rodriguez',
    company: 'Healthcare Systems Inc',
    email: 'j.rodriguez@healthsystems.com',
    phone: '+1 (555) 345-6789',
    status: 'customer',
    industry: 'Healthcare',
    lastContact: '2024-08-04',
    value: 450000,
    probability: 90,
    tags: ['Enterprise', 'HIPAA Compliant', 'Renewal', 'Success Story'],
    assignedTo: 'Sarah Mitchell',
    source: 'Webinar',
    notes:
      'CTO of regional healthcare network. Already using HERA for 18 months. Expanding to 5 new locations.',
    nextAction: 'Expansion Planning',
    nextActionDate: '2024-08-09'
  },
  {
    id: 3,
    name: 'Lisa Park',
    company: 'Tech Innovations Ltd',
    email: 'lisa.park@techinnovations.com',
    phone: '+1 (555) 456-7890',
    status: 'prospect',
    industry: 'Technology',
    lastContact: '2024-08-03',
    value: 125000,
    probability: 60,
    tags: ['Mid-Market', 'HubSpot Competitor', 'Fast Growth'],
    assignedTo: 'David Kim',
    source: 'LinkedIn',
    notes:
      'VP Operations at fast-growing SaaS company. Outgrowing current CRM. Needs enterprise features.',
    nextAction: 'Technical Demo',
    nextActionDate: '2024-08-07'
  },
  {
    id: 4,
    name: 'Robert Taylor',
    company: 'Financial Services Group',
    email: 'robert.taylor@fsg.com',
    phone: '+1 (555) 567-8901',
    status: 'lead',
    industry: 'Financial Services',
    lastContact: '2024-08-02',
    value: 300000,
    probability: 35,
    tags: ['Enterprise', 'Compliance Heavy', 'Oracle Migration'],
    assignedTo: 'Jennifer Wu',
    source: 'Trade Show',
    notes:
      'Director of Operations at investment firm. Evaluating Oracle alternatives. Needs SOX compliance.',
    nextAction: 'Discovery Call',
    nextActionDate: '2024-08-08'
  },
  {
    id: 5,
    name: 'Maria Gonzalez',
    company: 'Retail Excellence Chain',
    email: 'maria.gonzalez@retailexcellence.com',
    phone: '+1 (555) 678-9012',
    status: 'prospect',
    industry: 'Retail',
    lastContact: '2024-08-01',
    value: 180000,
    probability: 45,
    tags: ['Multi-Location', 'Inventory Management', 'Salesforce Competitor'],
    assignedTo: 'Michael Harrison',
    source: 'Google Ads',
    notes:
      'Operations Manager for 50-store retail chain. Current system cannot handle multi-location complexity.',
    nextAction: 'Needs Analysis',
    nextActionDate: '2024-08-09'
  }
]

// High-Value Opportunities with Realistic Pipeline
export const demoOpportunities: DemoOpportunity[] = [
  {
    id: 1,
    name: 'Global Manufacturing - ERP Transformation',
    contact: 'Sarah Chen',
    contactId: 1,
    company: 'Global Manufacturing Corp',
    stage: 'negotiation',
    value: 750000,
    closeDate: '2024-08-15',
    probability: 85,
    assignedTo: 'Michael Harrison',
    source: 'Referral',
    description:
      'Complete SAP replacement for $500M manufacturing company. 500+ users across 12 locations.',
    competitorInfo: 'Competing against Oracle and Microsoft Dynamics',
    winProbability: 'High - CFO is champion, budget approved'
  },
  {
    id: 2,
    name: 'Healthcare Systems - Multi-Location Expansion',
    contact: 'Dr. James Rodriguez',
    contactId: 2,
    company: 'Healthcare Systems Inc',
    stage: 'proposal',
    value: 450000,
    closeDate: '2024-08-25',
    probability: 90,
    assignedTo: 'Sarah Mitchell',
    source: 'Existing Customer',
    description:
      'Expanding HERA to 5 new hospital locations. HIPAA-compliant healthcare management system.',
    winProbability: 'Very High - Existing satisfied customer'
  },
  {
    id: 3,
    name: 'Financial Services - Compliance Platform',
    contact: 'Robert Taylor',
    contactId: 4,
    company: 'Financial Services Group',
    stage: 'discovery',
    value: 300000,
    closeDate: '2024-09-30',
    probability: 35,
    assignedTo: 'Jennifer Wu',
    source: 'Trade Show',
    description: 'SOX-compliant financial management system. Replacing legacy Oracle system.',
    competitorInfo: 'Oracle, SAP, and Workday in evaluation',
    winProbability: 'Medium - Early stage, strong competition'
  },
  {
    id: 4,
    name: 'Retail Excellence - Multi-Store Management',
    contact: 'Maria Gonzalez',
    contactId: 5,
    company: 'Retail Excellence Chain',
    stage: 'qualification',
    value: 180000,
    closeDate: '2024-09-15',
    probability: 45,
    assignedTo: 'Michael Harrison',
    source: 'Google Ads',
    description: 'Inventory and operations management for 50-store retail chain.',
    competitorInfo: 'Salesforce Commerce Cloud in evaluation',
    winProbability: 'Medium - Need to prove ROI'
  },
  {
    id: 5,
    name: 'Tech Innovations - Growth Platform',
    contact: 'Lisa Park',
    contactId: 3,
    company: 'Tech Innovations Ltd',
    stage: 'proposal',
    value: 125000,
    closeDate: '2024-08-20',
    probability: 60,
    assignedTo: 'David Kim',
    source: 'LinkedIn',
    description: 'Scalable business platform for fast-growing SaaS company.',
    competitorInfo: 'HubSpot and Pipedrive evaluation',
    winProbability: 'Good - Technical fit is strong'
  }
]

// Realistic Tasks for Sales Team
export const demoTasks: DemoTask[] = [
  {
    id: 1,
    title: 'Executive Demo - Global Manufacturing',
    type: 'demo',
    priority: 'urgent',
    dueDate: '2024-08-08',
    status: 'pending',
    contactId: 1,
    assignedTo: 'Michael Harrison',
    notes: 'CFO and IT Director attending. Focus on SAP migration benefits and ROI.'
  },
  {
    id: 2,
    title: 'Expansion Planning Meeting',
    type: 'meeting',
    priority: 'high',
    dueDate: '2024-08-09',
    status: 'pending',
    contactId: 2,
    assignedTo: 'Sarah Mitchell',
    notes: 'Plan rollout to 5 new hospital locations. HIPAA compliance requirements.'
  },
  {
    id: 3,
    title: 'Follow-up: Technical Demo Results',
    type: 'follow-up',
    priority: 'high',
    dueDate: '2024-08-07',
    status: 'pending',
    contactId: 3,
    assignedTo: 'David Kim',
    notes: 'Address technical questions about API integrations and scalability.'
  },
  {
    id: 4,
    title: 'Discovery Call - Financial Services',
    type: 'call',
    priority: 'medium',
    dueDate: '2024-08-08',
    status: 'pending',
    contactId: 4,
    assignedTo: 'Jennifer Wu',
    notes: 'Understand current Oracle pain points and compliance requirements.'
  },
  {
    id: 5,
    title: 'Proposal Review - Healthcare Expansion',
    type: 'proposal',
    priority: 'high',
    dueDate: '2024-08-06',
    status: 'completed',
    contactId: 2,
    assignedTo: 'Sarah Mitchell',
    notes: 'Submitted proposal for $450K expansion. Awaiting feedback from procurement.'
  }
]

// Professional Sales Team
export const demoSalesReps: DemoSalesRep[] = [
  {
    id: 'michael-harrison',
    name: 'Michael Harrison',
    email: 'michael.harrison@techvantage.com',
    role: 'Senior Enterprise Account Executive',
    quota: 2000000,
    achieved: 1680000,
    deals: 8,
    avatar: 'MH'
  },
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    email: 'sarah.mitchell@techvantage.com',
    role: 'Healthcare Specialist',
    quota: 1500000,
    achieved: 1350000,
    deals: 6,
    avatar: 'SM'
  },
  {
    id: 'david-kim',
    name: 'David Kim',
    email: 'david.kim@techvantage.com',
    role: 'Mid-Market Account Executive',
    quota: 1200000,
    achieved: 980000,
    deals: 12,
    avatar: 'DK'
  },
  {
    id: 'jennifer-wu',
    name: 'Jennifer Wu',
    email: 'jennifer.wu@techvantage.com',
    role: 'Financial Services Specialist',
    quota: 1800000,
    achieved: 1245000,
    deals: 5,
    avatar: 'JW'
  }
]

// Demo Analytics Data
export const demoAnalytics = {
  totalPipelineValue: 1805000,
  weightedPipeline: 1297500,
  averageDealSize: 361000,
  conversionRate: 68,
  averageSalesCycle: 127, // days
  quarterlyTarget: 6000000,
  quarterlyAchieved: 4255000,

  stageMetrics: [
    { stage: 'discovery', count: 1, value: 300000 },
    { stage: 'qualification', count: 1, value: 180000 },
    { stage: 'proposal', count: 2, value: 575000 },
    { stage: 'negotiation', count: 1, value: 750000 }
  ],

  industryBreakdown: [
    { industry: 'Manufacturing', value: 750000, deals: 1 },
    { industry: 'Healthcare', value: 450000, deals: 1 },
    { industry: 'Financial Services', value: 300000, deals: 1 },
    { industry: 'Retail', value: 180000, deals: 1 },
    { industry: 'Technology', value: 125000, deals: 1 }
  ]
}

// Demo Success Stories for presentations
export const demoSuccessStories = [
  {
    company: 'Global Manufacturing Corp',
    industry: 'Manufacturing',
    challenge: 'SAP system too complex and expensive',
    solution: 'HERA ERP with 48-hour implementation',
    results: ['90% cost reduction vs SAP', '500% faster implementation', '95% user satisfaction'],
    testimonial:
      'HERA delivered enterprise power with consumer simplicity. Our team is finally productive.'
  },
  {
    company: 'Healthcare Systems Inc',
    industry: 'Healthcare',
    challenge: 'Multiple systems, no integration',
    solution: 'HERA unified platform with HIPAA compliance',
    results: [
      '6 systems consolidated to 1',
      '40% operational efficiency gain',
      '100% compliance score'
    ],
    testimonial:
      'HERA thinks like a doctor. First time software actually helped instead of hindered.'
  }
]

// Demo Competitive Advantages
export const demoCompetitiveAdvantages = {
  vsOracle: {
    implementation: '48 hours vs 18+ months',
    cost: '90% less expensive',
    usability: 'Consumer-grade vs enterprise complexity',
    maintenance: 'Zero vs constant consulting needed'
  },
  vsSalesforce: {
    features: 'ERP + CRM vs CRM only',
    pricing: 'Transparent vs hidden fees',
    customization: 'No-code vs expensive development',
    support: 'Personal vs tiered support'
  },
  vsHubSpot: {
    scalability: 'Enterprise-ready vs SMB focused',
    integration: 'Native ERP vs bolt-on solutions',
    reporting: 'Real-time vs batch processing',
    security: 'Enterprise-grade vs basic'
  }
}
