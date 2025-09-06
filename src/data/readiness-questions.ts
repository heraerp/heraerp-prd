export interface ReadinessQuestion {
  id: string;
  text: string;
  category: string;
  section: string;
  weight: number;
  helpText?: string;
}

export const readinessQuestions: ReadinessQuestion[] = [
  // Business Strategy & Planning (7 questions)
  {
    id: 'q1',
    text: 'Does your organization have a clearly defined business strategy and objectives?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 3,
    helpText: 'A well-defined strategy ensures ERP alignment with business goals'
  },
  {
    id: 'q2',
    text: 'Are your key performance indicators (KPIs) clearly defined and measurable?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 3,
    helpText: 'Clear KPIs help measure ERP success and ROI'
  },
  {
    id: 'q3',
    text: 'Do you have a documented digital transformation roadmap?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 2,
    helpText: 'A roadmap ensures phased and structured implementation'
  },
  {
    id: 'q4',
    text: 'Have you conducted a comprehensive business process assessment?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 3,
    helpText: 'Understanding current processes is crucial for ERP design'
  },
  {
    id: 'q5',
    text: 'Is there alignment between IT strategy and business strategy?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 3,
    helpText: 'IT-business alignment ensures technology serves business needs'
  },
  {
    id: 'q6',
    text: 'Have you defined success criteria for the ERP implementation?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 3,
    helpText: 'Clear success criteria guide implementation decisions'
  },
  {
    id: 'q7',
    text: 'Do you have a risk management strategy for the ERP project?',
    category: 'strategy',
    section: 'Business Strategy & Planning',
    weight: 2,
    helpText: 'Risk management prevents project derailment'
  },

  // Process Management (8 questions)
  {
    id: 'q8',
    text: 'Are your core business processes documented and standardized?',
    category: 'process',
    section: 'Process Management',
    weight: 3,
    helpText: 'Documented processes facilitate ERP configuration'
  },
  {
    id: 'q9',
    text: 'Have you identified process improvement opportunities?',
    category: 'process',
    section: 'Process Management',
    weight: 2,
    helpText: 'ERP implementation is ideal for process optimization'
  },
  {
    id: 'q10',
    text: 'Do you have cross-functional process visibility?',
    category: 'process',
    section: 'Process Management',
    weight: 2,
    helpText: 'Cross-functional visibility prevents silos'
  },
  {
    id: 'q11',
    text: 'Are process owners clearly identified for each business process?',
    category: 'process',
    section: 'Process Management',
    weight: 3,
    helpText: 'Process owners ensure accountability and decision-making'
  },
  {
    id: 'q12',
    text: 'Do you regularly measure process performance and efficiency?',
    category: 'process',
    section: 'Process Management',
    weight: 2,
    helpText: 'Metrics help quantify ERP benefits'
  },
  {
    id: 'q13',
    text: 'Have you mapped interdependencies between processes?',
    category: 'process',
    section: 'Process Management',
    weight: 2,
    helpText: 'Understanding dependencies prevents integration issues'
  },
  {
    id: 'q14',
    text: 'Are your processes compliant with industry regulations?',
    category: 'process',
    section: 'Process Management',
    weight: 3,
    helpText: 'Compliance requirements shape ERP configuration'
  },
  {
    id: 'q15',
    text: 'Do you have standard operating procedures (SOPs) in place?',
    category: 'process',
    section: 'Process Management',
    weight: 2,
    helpText: 'SOPs ensure consistent execution and training'
  },

  // Technology Infrastructure (7 questions)
  {
    id: 'q16',
    text: 'Is your IT infrastructure cloud-ready or cloud-native?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 3,
    helpText: 'Cloud readiness enables modern ERP deployment'
  },
  {
    id: 'q17',
    text: 'Do you have adequate network bandwidth and reliability?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 3,
    helpText: 'Network quality impacts ERP performance'
  },
  {
    id: 'q18',
    text: 'Are your security policies and infrastructure up to date?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 3,
    helpText: 'Security is critical for ERP data protection'
  },
  {
    id: 'q19',
    text: 'Do you have a disaster recovery and business continuity plan?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 3,
    helpText: 'DR/BC ensures ERP availability'
  },
  {
    id: 'q20',
    text: 'Is your data architecture well-defined and documented?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 2,
    helpText: 'Clear data architecture facilitates migration'
  },
  {
    id: 'q21',
    text: 'Do you have integration capabilities (APIs, middleware)?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 2,
    helpText: 'Integration capabilities enable ecosystem connectivity'
  },
  {
    id: 'q22',
    text: 'Are your current systems well-maintained and documented?',
    category: 'technology',
    section: 'Technology Infrastructure',
    weight: 2,
    helpText: 'System documentation aids migration planning'
  },

  // Data Management (6 questions)
  {
    id: 'q23',
    text: 'Do you have a master data management strategy?',
    category: 'data',
    section: 'Data Management',
    weight: 3,
    helpText: 'MDM ensures data consistency across ERP'
  },
  {
    id: 'q24',
    text: 'Is your data quality regularly assessed and maintained?',
    category: 'data',
    section: 'Data Management',
    weight: 3,
    helpText: 'Clean data is essential for ERP success'
  },
  {
    id: 'q25',
    text: 'Do you have data governance policies and procedures?',
    category: 'data',
    section: 'Data Management',
    weight: 3,
    helpText: 'Data governance ensures proper data handling'
  },
  {
    id: 'q26',
    text: 'Have you identified data migration requirements and challenges?',
    category: 'data',
    section: 'Data Management',
    weight: 2,
    helpText: 'Understanding migration needs prevents delays'
  },
  {
    id: 'q27',
    text: 'Do you have data retention and archival policies?',
    category: 'data',
    section: 'Data Management',
    weight: 2,
    helpText: 'Retention policies impact ERP data volume'
  },
  {
    id: 'q28',
    text: 'Is there a single source of truth for critical business data?',
    category: 'data',
    section: 'Data Management',
    weight: 3,
    helpText: 'Single source prevents data conflicts'
  },

  // People & Change Management (8 questions)
  {
    id: 'q29',
    text: 'Do you have executive sponsorship and commitment for the ERP project?',
    category: 'people',
    section: 'People & Change Management',
    weight: 3,
    helpText: 'Executive support is critical for success'
  },
  {
    id: 'q30',
    text: 'Is there a formal change management program in place?',
    category: 'people',
    section: 'People & Change Management',
    weight: 3,
    helpText: 'Change management reduces resistance'
  },
  {
    id: 'q31',
    text: 'Have you assessed organizational readiness for change?',
    category: 'people',
    section: 'People & Change Management',
    weight: 2,
    helpText: 'Understanding readiness helps plan adoption'
  },
  {
    id: 'q32',
    text: 'Do you have a training and skill development plan?',
    category: 'people',
    section: 'People & Change Management',
    weight: 3,
    helpText: 'Training ensures user competency'
  },
  {
    id: 'q33',
    text: 'Is there a communication strategy for the ERP project?',
    category: 'people',
    section: 'People & Change Management',
    weight: 2,
    helpText: 'Communication maintains stakeholder engagement'
  },
  {
    id: 'q34',
    text: 'Have you identified and engaged key stakeholders?',
    category: 'people',
    section: 'People & Change Management',
    weight: 3,
    helpText: 'Stakeholder engagement ensures buy-in'
  },
  {
    id: 'q35',
    text: 'Do employees understand the benefits of the new ERP system?',
    category: 'people',
    section: 'People & Change Management',
    weight: 2,
    helpText: 'Understanding benefits increases adoption'
  },
  {
    id: 'q36',
    text: 'Is there a plan for managing resistance to change?',
    category: 'people',
    section: 'People & Change Management',
    weight: 2,
    helpText: 'Resistance management prevents project delays'
  },

  // Financial Readiness (6 questions)
  {
    id: 'q37',
    text: 'Have you established a realistic budget for the ERP project?',
    category: 'financial',
    section: 'Financial Readiness',
    weight: 3,
    helpText: 'Realistic budgets prevent cost overruns'
  },
  {
    id: 'q38',
    text: 'Do you understand the total cost of ownership (TCO)?',
    category: 'financial',
    section: 'Financial Readiness',
    weight: 3,
    helpText: 'TCO awareness ensures long-term sustainability'
  },
  {
    id: 'q39',
    text: 'Have you secured funding for the entire project lifecycle?',
    category: 'financial',
    section: 'Financial Readiness',
    weight: 3,
    helpText: 'Full funding prevents project interruption'
  },
  {
    id: 'q40',
    text: 'Is there a budget for post-implementation support and optimization?',
    category: 'financial',
    section: 'Financial Readiness',
    weight: 2,
    helpText: 'Post-implementation budget ensures continuous improvement'
  },
  {
    id: 'q41',
    text: 'Have you calculated expected ROI and payback period?',
    category: 'financial',
    section: 'Financial Readiness',
    weight: 2,
    helpText: 'ROI calculations justify investment'
  },
  {
    id: 'q42',
    text: 'Do you have contingency funds for unexpected costs?',
    category: 'financial',
    section: 'Financial Readiness',
    weight: 2,
    helpText: 'Contingency prevents budget crisis'
  },

  // Project Management (6 questions)
  {
    id: 'q43',
    text: 'Do you have experienced project management resources?',
    category: 'project',
    section: 'Project Management',
    weight: 3,
    helpText: 'Experienced PM ensures project control'
  },
  {
    id: 'q44',
    text: 'Have you defined a realistic project timeline?',
    category: 'project',
    section: 'Project Management',
    weight: 3,
    helpText: 'Realistic timelines prevent rushed implementations'
  },
  {
    id: 'q45',
    text: 'Is there a governance structure for decision-making?',
    category: 'project',
    section: 'Project Management',
    weight: 3,
    helpText: 'Clear governance accelerates decisions'
  },
  {
    id: 'q46',
    text: 'Do you have a project management methodology in place?',
    category: 'project',
    section: 'Project Management',
    weight: 2,
    helpText: 'Methodology ensures structured approach'
  },
  {
    id: 'q47',
    text: 'Have you identified project dependencies and constraints?',
    category: 'project',
    section: 'Project Management',
    weight: 2,
    helpText: 'Understanding constraints prevents delays'
  },
  {
    id: 'q48',
    text: 'Is there a quality assurance and testing strategy?',
    category: 'project',
    section: 'Project Management',
    weight: 3,
    helpText: 'QA ensures system meets requirements'
  }
];

export const categoryDetails = {
  strategy: {
    name: 'Business Strategy & Planning',
    description: 'Alignment of ERP with business objectives and strategic planning',
    icon: 'Target'
  },
  process: {
    name: 'Process Management',
    description: 'Business process documentation, standardization, and optimization',
    icon: 'Activity'
  },
  technology: {
    name: 'Technology Infrastructure',
    description: 'IT infrastructure, cloud readiness, and technical capabilities',
    icon: 'Cpu'
  },
  data: {
    name: 'Data Management',
    description: 'Data quality, governance, and migration readiness',
    icon: 'Database'
  },
  people: {
    name: 'People & Change Management',
    description: 'Organizational readiness, training, and change management',
    icon: 'Users'
  },
  financial: {
    name: 'Financial Readiness',
    description: 'Budget, funding, and financial planning for ERP',
    icon: 'DollarSign'
  },
  project: {
    name: 'Project Management',
    description: 'Project governance, timeline, and management capabilities',
    icon: 'Briefcase'
  }
};