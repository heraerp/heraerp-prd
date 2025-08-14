/**
 * HERA Progressive Professional Services Template
 * Complete professional services management system for consultants, agencies, and service providers
 * Smart Code: HERA.PROGRESSIVE.TEMPLATE.SERVICES.v1
 */

export interface ServicesBusinessRequirements {
  business_name: string
  service_type: 'consulting' | 'marketing_agency' | 'law_firm' | 'accounting_firm' | 'it_services' | 'creative_agency' | 'engineering_services'
  business_size: 'solo' | 'small_team' | 'medium_firm' | 'large_enterprise'
  billing_model: ('hourly' | 'project_based' | 'retainer' | 'value_based')[]
  specializations?: string[]
  target_industries?: string[]
  team_size?: number
  location?: {
    address: string
    city: string
    state: string
    zip: string
    office_type?: 'physical' | 'virtual' | 'hybrid'
  }
}

export interface ServiceOffering {
  id: string
  service_code: string
  name: string
  description: string
  category: string
  billing_type: 'hourly' | 'fixed_price' | 'retainer' | 'value_based'
  standard_rate: number
  estimated_hours?: number
  deliverables: string[]
  prerequisites?: string[]
  skill_requirements: string[]
  profit_margin_target: number
}

export interface Project {
  id: string
  project_number: string
  client_id: string
  project_name: string
  description: string
  project_type: 'consulting' | 'implementation' | 'audit' | 'strategy' | 'development' | 'campaign'
  status: 'proposal' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  budget: {
    estimated_hours: number
    hourly_rate: number
    fixed_fee?: number
    expenses_budget: number
    total_budget: number
  }
  timeline: {
    start_date: Date
    end_date: Date
    milestones: ProjectMilestone[]
  }
  team_assignments: TeamAssignment[]
  deliverables: ProjectDeliverable[]
}

export interface ProjectMilestone {
  id: string
  name: string
  description: string
  due_date: Date
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  completion_percentage: number
  dependencies?: string[]
}

export interface TeamAssignment {
  employee_id: string
  role: string
  allocation_percentage: number
  hourly_rate: number
  start_date: Date
  end_date?: Date
}

export interface ProjectDeliverable {
  id: string
  name: string
  description: string
  type: 'document' | 'presentation' | 'system' | 'training' | 'analysis'
  due_date: Date
  status: 'not_started' | 'in_progress' | 'review' | 'completed' | 'delivered'
  assigned_to: string[]
}

export interface Client {
  id: string
  client_number: string
  company_info: {
    company_name: string
    industry: string
    company_size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
    annual_revenue?: number
    website?: string
  }
  primary_contact: {
    name: string
    title: string
    email: string
    phone: string
  }
  additional_contacts?: ClientContact[]
  relationship_info: {
    client_since: Date
    relationship_manager: string
    client_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    lifetime_value: number
    payment_terms: string
  }
  preferences: {
    communication_method: 'email' | 'phone' | 'video' | 'in_person'
    meeting_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
    reporting_requirements: string[]
  }
}

export interface ClientContact {
  name: string
  title: string
  email: string
  phone: string
  role: 'decision_maker' | 'project_manager' | 'end_user' | 'technical_contact'
}

export interface TimeEntry {
  id: string
  employee_id: string
  project_id: string
  task_description: string
  date: Date
  hours: number
  billable: boolean
  billing_rate: number
  status: 'draft' | 'submitted' | 'approved' | 'billed'
  activity_type: 'meeting' | 'analysis' | 'development' | 'documentation' | 'travel' | 'admin'
}

export class ServicesTemplate {
  
  /**
   * Generate comprehensive professional services demo data
   */
  static generateDemoData(requirements: ServicesBusinessRequirements): any {
    const organizationId = crypto.randomUUID()
    
    return {
      organization: this.createServicesOrganization(organizationId, requirements),
      entities: [
        ...this.generateClients(organizationId, requirements.service_type),
        ...this.generateTeamMembers(organizationId, requirements.team_size || 8),
        ...this.generateServiceOfferings(organizationId, requirements.service_type),
        ...this.generateProjects(organizationId),
        ...this.generateVendors(organizationId),
        ...this.generateAssets(organizationId)
      ],
      transactions: [
        ...this.generateTimeEntries(organizationId),
        ...this.generateInvoices(organizationId),
        ...this.generateExpenses(organizationId),
        ...this.generatePayrollTransactions(organizationId)
      ],
      relationships: this.generateRelationships(organizationId),
      dynamicData: this.generateDynamicData(organizationId)
    }
  }

  /**
   * Create professional services organization entity
   */
  private static createServicesOrganization(id: string, requirements: ServicesBusinessRequirements): any {
    return {
      id,
      organization_name: requirements.business_name,
      organization_code: `SVC-${requirements.business_name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}`,
      organization_type: 'professional_services',
      industry_classification: requirements.service_type,
      ai_insights: {
        service_type: requirements.service_type,
        business_size: requirements.business_size,
        billing_models: requirements.billing_model,
        target_industries: requirements.target_industries || ['Technology', 'Healthcare', 'Finance'],
        specializations: requirements.specializations || [],
        growth_potential: 'high',
        utilization_target: 75,
        profitability_score: 'good'
      },
      settings: {
        operating_hours: {
          monday: { open: '08:00', close: '18:00' },
          tuesday: { open: '08:00', close: '18:00' },
          wednesday: { open: '08:00', close: '18:00' },
          thursday: { open: '08:00', close: '18:00' },
          friday: { open: '08:00', close: '17:00' },
          saturday: { closed: true },
          sunday: { closed: true }
        },
        billing_settings: {
          default_hourly_rate: 150,
          invoice_terms: 'Net 30',
          late_fee_percentage: 1.5,
          time_tracking_required: true,
          expense_markup: 0.10,
          currency: 'USD'
        },
        project_settings: {
          default_project_buffer: 0.15,
          milestone_approval_required: true,
          time_approval_workflow: true,
          client_portal_access: true,
          automatic_status_updates: true
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Generate professional services clients
   */
  private static generateClients(organizationId: string, serviceType: string): any[] {
    const clientTemplates = {
      consulting: [
        {
          company: 'TechStart Innovations', industry: 'Technology', size: 'startup',
          contact: 'Sarah Johnson', title: 'CEO', tier: 'gold', value: 85000
        },
        {
          company: 'Global Manufacturing Corp', industry: 'Manufacturing', size: 'large',
          contact: 'Michael Chen', title: 'VP Operations', tier: 'platinum', value: 250000
        },
        {
          company: 'HealthCare Solutions Inc', industry: 'Healthcare', size: 'medium',
          contact: 'Dr. Emily Rodriguez', title: 'Chief Medical Officer', tier: 'silver', value: 120000
        }
      ],
      marketing_agency: [
        {
          company: 'Fashion Forward Boutique', industry: 'Retail', size: 'small',
          contact: 'Lisa Martinez', title: 'Marketing Director', tier: 'gold', value: 65000
        },
        {
          company: 'Urban Real Estate Group', industry: 'Real Estate', size: 'medium',
          contact: 'David Thompson', title: 'Sales Manager', tier: 'silver', value: 45000
        },
        {
          company: 'Gourmet Restaurant Chain', industry: 'Food Service', size: 'large',
          contact: 'Chef Maria Gonzalez', title: 'Brand Manager', tier: 'platinum', value: 180000
        }
      ],
      it_services: [
        {
          company: 'Financial Services Group', industry: 'Finance', size: 'large',
          contact: 'Robert Kim', title: 'CTO', tier: 'platinum', value: 320000
        },
        {
          company: 'Education Technology Inc', industry: 'Education', size: 'medium',
          contact: 'Jennifer Adams', title: 'IT Director', tier: 'gold', value: 95000
        },
        {
          company: 'Legal Partners LLC', industry: 'Legal', size: 'small',
          contact: 'James Wilson', title: 'Managing Partner', tier: 'silver', value: 55000
        }
      ]
    }

    const clientData = clientTemplates[serviceType] || clientTemplates.consulting

    return clientData.map(client => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'client',
      entity_name: client.company,
      smart_code: 'HERA.SVC.CLIENT.CORPORATE.v1',
      metadata: {
        client_number: `CLT-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        company_info: {
          company_name: client.company,
          industry: client.industry,
          company_size: client.size,
          annual_revenue: this.getEstimatedRevenue(client.size),
          website: `www.${client.company.toLowerCase().replace(/\s+/g, '')}.com`
        },
        primary_contact: {
          name: client.contact,
          title: client.title,
          email: `${client.contact.toLowerCase().replace(/\s+/g, '.')}@${client.company.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        },
        relationship_info: {
          client_since: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
          relationship_manager: 'Account Manager',
          client_tier: client.tier,
          lifetime_value: client.value,
          payment_terms: 'Net 30',
          contract_type: 'Ongoing'
        },
        preferences: {
          communication_method: 'email',
          meeting_frequency: 'monthly',
          reporting_requirements: ['Weekly status reports', 'Monthly analytics', 'Quarterly reviews'],
          preferred_project_methodology: 'Agile'
        },
        project_history: {
          total_projects: 3 + Math.floor(Math.random() * 8),
          active_projects: 1 + Math.floor(Math.random() * 3),
          success_rate: 90 + Math.random() * 10,
          average_project_value: client.value / 4
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Get estimated revenue based on company size
   */
  private static getEstimatedRevenue(size: string): number {
    const ranges = {
      startup: 100000 + Math.random() * 400000,
      small: 1000000 + Math.random() * 4000000,
      medium: 10000000 + Math.random() * 40000000,
      large: 100000000 + Math.random() * 400000000,
      enterprise: 1000000000 + Math.random() * 4000000000
    }
    return Math.round(ranges[size] || ranges.medium)
  }

  /**
   * Generate team members
   */
  private static generateTeamMembers(organizationId: string, teamSize: number): any[] {
    const teamRoles = [
      { name: 'Alexandra Chen', role: 'managing_partner', hourly_rate: 350, experience: 15 },
      { name: 'Michael Rodriguez', role: 'senior_consultant', hourly_rate: 225, experience: 8 },
      { name: 'Sarah Thompson', role: 'project_manager', hourly_rate: 150, experience: 6 },
      { name: 'David Kim', role: 'business_analyst', hourly_rate: 125, experience: 4 },
      { name: 'Emily Davis', role: 'consultant', hourly_rate: 175, experience: 5 },
      { name: 'James Wilson', role: 'research_analyst', hourly_rate: 95, experience: 3 },
      { name: 'Lisa Martinez', role: 'account_manager', hourly_rate: 110, experience: 4 },
      { name: 'Robert Johnson', role: 'technical_specialist', hourly_rate: 165, experience: 7 }
    ]

    return teamRoles.slice(0, teamSize).map(member => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'employee',
      entity_name: member.name,
      smart_code: 'HERA.SVC.EMPLOYEE.CONSULTANT.v1',
      metadata: {
        employee_id: `EMP-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`,
        role: member.role,
        employment_details: {
          hire_date: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
          employment_type: 'full_time',
          hourly_rate: member.hourly_rate,
          annual_salary: member.hourly_rate * 2080,
          utilization_target: 75,
          status: 'active'
        },
        professional_info: {
          years_experience: member.experience,
          specializations: this.getSpecializations(member.role),
          certifications: this.getCertifications(member.role),
          education: this.getEducation(member.role),
          skills: this.getSkills(member.role)
        },
        performance: {
          utilization_rate: 70 + Math.random() * 25,
          client_satisfaction: 4.2 + Math.random() * 0.8,
          project_success_rate: 85 + Math.random() * 15,
          revenue_generated_ytd: member.hourly_rate * 1500 * (0.8 + Math.random() * 0.4)
        },
        contact_info: {
          email: `${member.name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          office_location: 'Main Office'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Get specializations based on role
   */
  private static getSpecializations(role: string): string[] {
    const specializations = {
      'managing_partner': ['Strategy', 'Business Development', 'Client Relations'],
      'senior_consultant': ['Process Improvement', 'Change Management', 'Digital Transformation'],
      'project_manager': ['Agile Methodology', 'Risk Management', 'Stakeholder Management'],
      'business_analyst': ['Requirements Analysis', 'Process Mapping', 'Data Analysis'],
      'consultant': ['Market Research', 'Financial Analysis', 'Operations'],
      'research_analyst': ['Market Intelligence', 'Competitive Analysis', 'Data Research'],
      'account_manager': ['Client Relations', 'Business Development', 'Contract Management'],
      'technical_specialist': ['Systems Integration', 'Technical Architecture', 'Implementation']
    }
    return specializations[role] || ['General Consulting']
  }

  /**
   * Get certifications based on role
   */
  private static getCertifications(role: string): string[] {
    const certs = {
      'managing_partner': ['MBA', 'CPA'],
      'senior_consultant': ['PMP', 'Six Sigma Black Belt'],
      'project_manager': ['PMP', 'Agile Certified'],
      'business_analyst': ['CBAP', 'Six Sigma Green Belt'],
      'technical_specialist': ['CISSP', 'AWS Certified']
    }
    return certs[role] || []
  }

  /**
   * Get education based on role
   */
  private static getEducation(role: string): string {
    const education = {
      'managing_partner': 'MBA, Harvard Business School',
      'senior_consultant': 'MS Business Administration',
      'project_manager': 'BS Project Management',
      'business_analyst': 'BS Business Administration',
      'technical_specialist': 'MS Computer Science'
    }
    return education[role] || 'BS Business'
  }

  /**
   * Get skills based on role
   */
  private static getSkills(role: string): string[] {
    const skills = {
      'managing_partner': ['Leadership', 'Strategic Planning', 'Business Development', 'P&L Management'],
      'senior_consultant': ['Analysis', 'Presentation', 'Client Management', 'Problem Solving'],
      'project_manager': ['Planning', 'Coordination', 'Risk Management', 'Communication'],
      'business_analyst': ['Data Analysis', 'Process Mapping', 'Requirements Gathering', 'Documentation'],
      'technical_specialist': ['Systems Design', 'Integration', 'Technical Documentation', 'Testing']
    }
    return skills[role] || ['Analysis', 'Communication']
  }

  /**
   * Generate service offerings
   */
  private static generateServiceOfferings(organizationId: string, serviceType: string): any[] {
    const serviceTemplates = {
      consulting: [
        {
          name: 'Strategic Planning', category: 'Strategy', rate: 300, hours: 160,
          description: 'Comprehensive strategic planning and roadmap development'
        },
        {
          name: 'Process Optimization', category: 'Operations', rate: 225, hours: 120,
          description: 'Business process analysis and optimization recommendations'
        },
        {
          name: 'Digital Transformation', category: 'Technology', rate: 275, hours: 200,
          description: 'Digital strategy and technology implementation planning'
        },
        {
          name: 'Change Management', category: 'Organizational', rate: 200, hours: 80,
          description: 'Change management planning and implementation support'
        }
      ],
      marketing_agency: [
        {
          name: 'Brand Strategy', category: 'Strategy', rate: 175, hours: 100,
          description: 'Brand positioning, messaging, and identity development'
        },
        {
          name: 'Digital Marketing Campaign', category: 'Digital', rate: 125, hours: 160,
          description: 'Multi-channel digital marketing campaign development and management'
        },
        {
          name: 'Content Marketing', category: 'Content', rate: 95, hours: 120,
          description: 'Content strategy, creation, and distribution planning'
        },
        {
          name: 'Marketing Analytics', category: 'Analytics', rate: 150, hours: 60,
          description: 'Marketing performance analysis and optimization recommendations'
        }
      ],
      it_services: [
        {
          name: 'System Integration', category: 'Integration', rate: 185, hours: 240,
          description: 'Enterprise system integration and architecture design'
        },
        {
          name: 'Cybersecurity Assessment', category: 'Security', rate: 225, hours: 80,
          description: 'Comprehensive cybersecurity audit and risk assessment'
        },
        {
          name: 'Cloud Migration', category: 'Cloud', rate: 165, hours: 200,
          description: 'Cloud strategy and migration planning and implementation'
        },
        {
          name: 'IT Infrastructure Audit', category: 'Infrastructure', rate: 145, hours: 60,
          description: 'IT infrastructure assessment and optimization recommendations'
        }
      ]
    }

    const services = serviceTemplates[serviceType] || serviceTemplates.consulting

    return services.map(service => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'service_offering',
      entity_name: service.name,
      smart_code: 'HERA.SVC.SERVICE.OFFERING.v1',
      metadata: {
        service_code: `SVC-${service.name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}`,
        category: service.category,
        description: service.description,
        billing_type: 'hourly',
        standard_rate: service.rate,
        estimated_hours: service.hours,
        deliverables: this.getServiceDeliverables(service.name),
        skill_requirements: this.getServiceSkills(service.category),
        profit_margin_target: 65 + Math.random() * 20,
        typical_timeline_weeks: Math.ceil(service.hours / 40),
        pricing_tiers: {
          basic: service.rate * 0.8,
          standard: service.rate,
          premium: service.rate * 1.3
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Get service deliverables
   */
  private static getServiceDeliverables(serviceName: string): string[] {
    const deliverables = {
      'Strategic Planning': ['Strategic Plan Document', 'SWOT Analysis', 'Implementation Roadmap', 'KPI Framework'],
      'Process Optimization': ['Current State Analysis', 'Future State Design', 'Gap Analysis', 'Implementation Plan'],
      'Digital Transformation': ['Digital Strategy', 'Technology Roadmap', 'ROI Analysis', 'Change Management Plan'],
      'Brand Strategy': ['Brand Guidelines', 'Messaging Framework', 'Brand Audit', 'Implementation Guide'],
      'Digital Marketing Campaign': ['Campaign Strategy', 'Creative Assets', 'Performance Dashboard', 'Optimization Reports'],
      'System Integration': ['Integration Architecture', 'Technical Specifications', 'Implementation Guide', 'Testing Plan']
    }
    return deliverables[serviceName] || ['Project Report', 'Recommendations', 'Implementation Plan']
  }

  /**
   * Get service skills
   */
  private static getServiceSkills(category: string): string[] {
    const skills = {
      'Strategy': ['Strategic Thinking', 'Analysis', 'Planning', 'Facilitation'],
      'Operations': ['Process Analysis', 'Lean Methodology', 'Performance Measurement'],
      'Technology': ['Technical Architecture', 'Systems Analysis', 'Project Management'],
      'Digital': ['Digital Marketing', 'Analytics', 'Campaign Management'],
      'Security': ['Cybersecurity', 'Risk Assessment', 'Compliance']
    }
    return skills[category] || ['Analysis', 'Communication', 'Problem Solving']
  }

  /**
   * Generate projects
   */
  private static generateProjects(organizationId: string): any[] {
    const projects = []
    const projectStatuses = ['active', 'active', 'active', 'completed', 'proposal']
    
    for (let i = 0; i < 8; i++) {
      const status = projectStatuses[Math.floor(Math.random() * projectStatuses.length)]
      const startDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
      const duration = 30 + Math.random() * 120 // 30-150 days
      const estimatedHours = 80 + Math.random() * 320
      const hourlyRate = 150 + Math.random() * 150
      
      projects.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        entity_type: 'project',
        entity_name: `${this.getProjectNames()[i % this.getProjectNames().length]}`,
        smart_code: 'HERA.SVC.PROJECT.ENGAGEMENT.v1',
        metadata: {
          project_number: `PRJ-${String(i + 1).padStart(4, '0')}`,
          client_id: crypto.randomUUID(),
          project_type: this.getProjectTypes()[Math.floor(Math.random() * this.getProjectTypes().length)],
          status: status,
          priority: ['normal', 'normal', 'high', 'low', 'urgent'][Math.floor(Math.random() * 5)],
          budget: {
            estimated_hours: Math.round(estimatedHours),
            hourly_rate: Math.round(hourlyRate),
            total_budget: Math.round(estimatedHours * hourlyRate),
            expenses_budget: Math.round(estimatedHours * hourlyRate * 0.1),
            contingency: Math.round(estimatedHours * hourlyRate * 0.15)
          },
          timeline: {
            start_date: startDate,
            end_date: new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000),
            actual_start: status !== 'proposal' ? startDate : null,
            completion_percentage: status === 'completed' ? 100 : Math.floor(Math.random() * 85)
          },
          team_assignments: this.generateTeamAssignments(),
          milestones: this.generateProjectMilestones(),
          financial_summary: {
            hours_logged: status !== 'proposal' ? Math.floor(estimatedHours * (0.3 + Math.random() * 0.7)) : 0,
            amount_billed: status !== 'proposal' ? Math.floor(estimatedHours * hourlyRate * (0.3 + Math.random() * 0.5)) : 0,
            expenses_incurred: status !== 'proposal' ? Math.floor(estimatedHours * hourlyRate * 0.05 * Math.random()) : 0
          }
        },
        status: 'active',
        created_at: startDate,
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return projects
  }

  /**
   * Get project names
   */
  private static getProjectNames(): string[] {
    return [
      'Strategic Digital Transformation',
      'Process Optimization Initiative',
      'Brand Repositioning Campaign',
      'System Integration Project',
      'Market Entry Strategy',
      'Operational Excellence Program',
      'Customer Experience Enhancement',
      'Technology Modernization'
    ]
  }

  /**
   * Get project types
   */
  private static getProjectTypes(): string[] {
    return ['consulting', 'implementation', 'audit', 'strategy', 'development', 'campaign']
  }

  /**
   * Generate team assignments
   */
  private static generateTeamAssignments(): any[] {
    return [
      {
        role: 'Project Manager',
        allocation_percentage: 50,
        hourly_rate: 150,
        responsibilities: ['Project coordination', 'Client communication', 'Timeline management']
      },
      {
        role: 'Senior Consultant',
        allocation_percentage: 75,
        hourly_rate: 225,
        responsibilities: ['Strategic analysis', 'Recommendations', 'Client presentations']
      },
      {
        role: 'Business Analyst',
        allocation_percentage: 60,
        hourly_rate: 125,
        responsibilities: ['Data analysis', 'Process mapping', 'Documentation']
      }
    ]
  }

  /**
   * Generate project milestones
   */
  private static generateProjectMilestones(): any[] {
    return [
      {
        name: 'Project Kickoff',
        description: 'Initial client meeting and project setup',
        status: 'completed',
        completion_percentage: 100
      },
      {
        name: 'Discovery Phase',
        description: 'Requirements gathering and current state analysis',
        status: 'completed',
        completion_percentage: 100
      },
      {
        name: 'Analysis & Recommendations',
        description: 'Strategic analysis and solution development',
        status: 'in_progress',
        completion_percentage: 65
      },
      {
        name: 'Final Deliverables',
        description: 'Final report and presentation to client',
        status: 'pending',
        completion_percentage: 0
      }
    ]
  }

  /**
   * Generate time entries
   */
  private static generateTimeEntries(organizationId: string): any[] {
    const entries = []
    
    // Generate time entries for last 30 days
    for (let day = 0; day < 30; day++) {
      const entriesForDay = 3 + Math.floor(Math.random() * 8)
      
      for (let i = 0; i < entriesForDay; i++) {
        const entryDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000)
        const hours = 1 + Math.random() * 7
        const billableRate = 125 + Math.random() * 125
        
        entries.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: 'time_entry',
          transaction_number: `TM-${String(entries.length + 1).padStart(6, '0')}`,
          transaction_date: entryDate,
          smart_code: 'HERA.SVC.TIME.BILLABLE.v1',
          description: `Time entry - ${this.getActivityTypes()[Math.floor(Math.random() * this.getActivityTypes().length)]}`,
          total_amount: hours * billableRate,
          currency_code: 'USD',
          status: 'confirmed',
          metadata: {
            employee_id: crypto.randomUUID(),
            project_id: crypto.randomUUID(),
            task_description: this.getTaskDescriptions()[Math.floor(Math.random() * this.getTaskDescriptions().length)],
            hours: Math.round(hours * 100) / 100,
            billable: Math.random() > 0.15, // 85% billable
            billing_rate: Math.round(billableRate),
            activity_type: this.getActivityTypes()[Math.floor(Math.random() * this.getActivityTypes().length)],
            approval_status: day < 7 ? 'approved' : 'submitted',
            client_billable: Math.random() > 0.1
          },
          created_at: entryDate,
          updated_at: entryDate,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    return entries
  }

  /**
   * Get activity types
   */
  private static getActivityTypes(): string[] {
    return ['meeting', 'analysis', 'development', 'documentation', 'research', 'presentation', 'travel', 'admin']
  }

  /**
   * Get task descriptions
   */
  private static getTaskDescriptions(): string[] {
    return [
      'Client stakeholder meeting',
      'Strategic analysis and research',
      'Documentation development',
      'Data analysis and modeling',
      'Presentation preparation',
      'Requirements gathering session',
      'Process mapping workshop',
      'Report writing and review'
    ]
  }

  /**
   * Generate invoices
   */
  private static generateInvoices(organizationId: string): any[] {
    const invoices = []
    
    // Generate monthly invoices for last 6 months
    for (let month = 0; month < 6; month++) {
      const invoiceDate = new Date(Date.now() - month * 30 * 24 * 60 * 60 * 1000)
      const invoicesForMonth = 2 + Math.floor(Math.random() * 4)
      
      for (let i = 0; i < invoicesForMonth; i++) {
        const subtotal = 5000 + Math.random() * 25000
        const tax = subtotal * 0.08
        const expenses = subtotal * 0.05 * Math.random()
        
        invoices.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: 'client_invoice',
          transaction_number: `INV-${String(invoices.length + 1).padStart(5, '0')}`,
          transaction_date: invoiceDate,
          smart_code: 'HERA.SVC.INVOICE.CLIENT.v1',
          description: 'Professional services invoice',
          total_amount: subtotal + tax + expenses,
          currency_code: 'USD',
          status: month < 2 ? 'confirmed' : 'pending',
          metadata: {
            client_id: crypto.randomUUID(),
            project_id: crypto.randomUUID(),
            invoice_period: {
              start: new Date(invoiceDate.getTime() - 30 * 24 * 60 * 60 * 1000),
              end: invoiceDate
            },
            line_items: {
              professional_services: Math.round(subtotal),
              expenses: Math.round(expenses),
              tax: Math.round(tax)
            },
            payment_terms: 'Net 30',
            due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            payment_status: month < 2 ? 'paid' : month < 4 ? 'overdue' : 'outstanding',
            billable_hours: Math.round(subtotal / 175), // Avg rate $175
            discount_applied: Math.random() > 0.9 ? 0.05 : 0
          },
          created_at: invoiceDate,
          updated_at: invoiceDate,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    return invoices
  }

  /**
   * Generate expenses
   */
  private static generateExpenses(organizationId: string): any[] {
    const expenses = []
    
    // Generate weekly expense reports
    for (let week = 0; week < 12; week++) {
      const expenseDate = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
      const expensesForWeek = 3 + Math.floor(Math.random() * 8)
      
      for (let i = 0; i < expensesForWeek; i++) {
        const amount = 25 + Math.random() * 500
        const expenseTypes = ['travel', 'meals', 'accommodation', 'software', 'materials', 'communications']
        const expenseType = expenseTypes[Math.floor(Math.random() * expenseTypes.length)]
        
        expenses.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: 'expense',
          transaction_number: `EXP-${String(expenses.length + 1).padStart(5, '0')}`,
          transaction_date: expenseDate,
          smart_code: 'HERA.SVC.EXPENSE.BUSINESS.v1',
          description: `Business expense - ${expenseType}`,
          total_amount: Math.round(amount * 100) / 100,
          currency_code: 'USD',
          status: 'confirmed',
          metadata: {
            employee_id: crypto.randomUUID(),
            project_id: Math.random() > 0.2 ? crypto.randomUUID() : null,
            expense_category: expenseType,
            client_billable: Math.random() > 0.3,
            approval_status: week < 2 ? 'approved' : 'submitted',
            receipt_provided: Math.random() > 0.1,
            reimbursement_status: week < 2 ? 'reimbursed' : 'pending',
            business_purpose: this.getBusinessPurpose(expenseType)
          },
          created_at: expenseDate,
          updated_at: expenseDate,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    return expenses
  }

  /**
   * Get business purpose for expense type
   */
  private static getBusinessPurpose(expenseType: string): string {
    const purposes = {
      'travel': 'Client site visit',
      'meals': 'Client business meal',
      'accommodation': 'Project travel accommodation',
      'software': 'Project software tools',
      'materials': 'Project materials and supplies',
      'communications': 'Project communication costs'
    }
    return purposes[expenseType] || 'Business expense'
  }

  /**
   * Generate payroll transactions
   */
  private static generatePayrollTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate bi-weekly payroll for last 6 months
    for (let period = 0; period < 12; period++) {
      const payrollDate = new Date(Date.now() - period * 14 * 24 * 60 * 60 * 1000)
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'payroll',
        transaction_number: `PR-${String(period + 1).padStart(4, '0')}`,
        transaction_date: payrollDate,
        smart_code: 'HERA.SVC.PAYROLL.BIWEEKLY.v1',
        description: 'Bi-weekly payroll - professional staff',
        total_amount: 45000 + Math.random() * 15000,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          pay_period: {
            start: new Date(payrollDate.getTime() - 14 * 24 * 60 * 60 * 1000),
            end: payrollDate
          },
          employees_count: 8,
          total_hours: 640 + Math.floor(Math.random() * 160),
          billable_hours: 480 + Math.floor(Math.random() * 120),
          utilization_rate: 75 + Math.random() * 20,
          benefits_cost: 8000 + Math.random() * 2000
        },
        created_at: payrollDate,
        updated_at: payrollDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Generate vendors
   */
  private static generateVendors(organizationId: string): any[] {
    const vendors = [
      { name: 'Office Supplies Plus', category: 'office_supplies', contact: 'orders@officesupplies.com' },
      { name: 'TechCloud Solutions', category: 'software', contact: 'sales@techcloud.com' },
      { name: 'Professional Travel Services', category: 'travel', contact: 'bookings@protravel.com' },
      { name: 'Business Legal Advisors', category: 'legal_services', contact: 'info@bizlegal.com' }
    ]

    return vendors.map(vendor => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'vendor',
      entity_name: vendor.name,
      smart_code: 'HERA.SVC.VENDOR.SERVICE.v1',
      metadata: {
        category: vendor.category,
        contact_info: {
          email: vendor.contact,
          phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        },
        terms: {
          payment_terms: 'Net 30',
          service_level_agreement: true,
          contract_type: 'Annual'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate assets
   */
  private static generateAssets(organizationId: string): any[] {
    const assets = [
      { name: 'MacBook Pro 16"', category: 'computer_equipment', value: 2500 },
      { name: 'Office Furniture Set', category: 'furniture', value: 1500 },
      { name: 'Conference Room Display', category: 'av_equipment', value: 800 },
      { name: 'Professional Software Licenses', category: 'software', value: 5000 }
    ]

    return assets.map(asset => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'asset',
      entity_name: asset.name,
      smart_code: 'HERA.SVC.ASSET.EQUIPMENT.v1',
      metadata: {
        category: asset.category,
        purchase_value: asset.value,
        current_value: asset.value * (0.6 + Math.random() * 0.3),
        purchase_date: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
        depreciation_method: 'straight_line',
        useful_life_years: 3 + Math.floor(Math.random() * 4)
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate relationships between entities
   */
  private static generateRelationships(organizationId: string): any[] {
    return []
  }

  /**
   * Generate dynamic data fields
   */
  private static generateDynamicData(organizationId: string): any[] {
    return []
  }

  /**
   * Generate professional services component structure
   */
  static generateComponentStructure(): any {
    return {
      pages: [
        {
          name: 'ServicesDashboard',
          path: '/dashboard',
          components: ['GlassPanel', 'UtilizationChart', 'RevenueMetrics', 'ProjectStatus', 'TeamPerformance']
        },
        {
          name: 'ProjectManagement',
          path: '/projects',
          components: ['GlassPanel', 'ProjectList', 'GanttChart', 'ResourcePlanning', 'MilestoneTracking']
        },
        {
          name: 'ClientPortal',
          path: '/clients',
          components: ['GlassPanel', 'ClientList', 'RelationshipManager', 'ContractManagement', 'ClientReports']
        },
        {
          name: 'TimeTracking',
          path: '/time',
          components: ['GlassPanel', 'TimeEntryForm', 'TimesheetApproval', 'UtilizationReports', 'BillableHours']
        },
        {
          name: 'InvoicingBilling',
          path: '/billing',
          components: ['GlassPanel', 'InvoiceGenerator', 'PaymentTracking', 'ExpenseManagement', 'ProfitabilityAnalysis']
        },
        {
          name: 'TeamManagement',
          path: '/team',
          components: ['GlassPanel', 'EmployeeProfiles', 'SkillsMatrix', 'PerformanceTracking', 'ResourceAllocation']
        },
        {
          name: 'BusinessDevelopment',
          path: '/business-dev',
          components: ['GlassPanel', 'OpportunityPipeline', 'ProposalManagement', 'WinLossAnalysis', 'MarketingROI']
        },
        {
          name: 'ReportsAnalytics',
          path: '/reports',
          components: ['GlassPanel', 'RevenueAnalytics', 'ProjectProfitability', 'ClientAnalytics', 'OperationalMetrics']
        }
      ],
      specialized_components: [
        'UtilizationChart',
        'ProjectList',
        'GanttChart',
        'TimeEntryForm',
        'TimesheetApproval',
        'InvoiceGenerator',
        'ResourcePlanning',
        'ClientList',
        'SkillsMatrix',
        'OpportunityPipeline',
        'ProposalManagement',
        'MilestoneTracking'
      ]
    }
  }
}

/**
 * Professional services template factory function
 */
export function createServicesTemplate(requirements: ServicesBusinessRequirements): any {
  return {
    demoData: ServicesTemplate.generateDemoData(requirements),
    componentStructure: ServicesTemplate.generateComponentStructure(),
    businessLogic: {
      projectWorkflow: ['proposal', 'active', 'on_hold', 'completed', 'cancelled'],
      timeTracking: true,
      expenseManagement: true,
      invoiceGeneration: true,
      clientPortal: true,
      resourcePlanning: true,
      profitabilityTracking: true,
      proposalManagement: true,
      contractManagement: true,
      knowledgeManagement: true
    },
    smartCodes: [
      'HERA.SVC.CLIENT.CORPORATE.v1',
      'HERA.SVC.PROJECT.ENGAGEMENT.v1',
      'HERA.SVC.TIME.BILLABLE.v1',
      'HERA.SVC.INVOICE.CLIENT.v1',
      'HERA.SVC.EXPENSE.BUSINESS.v1',
      'HERA.SVC.EMPLOYEE.CONSULTANT.v1',
      'HERA.SVC.SERVICE.OFFERING.v1',
      'HERA.SVC.VENDOR.SERVICE.v1'
    ]
  }
}