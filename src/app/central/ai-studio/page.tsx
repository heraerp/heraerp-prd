
'use client'

/**
 * ================================================================================
 * HERA CENTRAL: AI Studio
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.AI.STUDIO.v1
 * ================================================================================
 * 
 * AI agent management and governance interface providing:
 * - AI agent definitions and marketplace
 * - Skills and capability management
 * - Agent deployment and configuration
 * - Usage monitoring and cost tracking
 * - Governance and compliance oversight
 * - Performance analytics and optimization
 * 
 * Second-layer navigation with AI-focused workflows
 * ================================================================================
 */

import React, { useEffect, useState } from 'react'

import { 
  Brain,
  Plus,
  Search,
  Filter,
  Zap,
  Settings,
  Play,
  Pause,
  Stop,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  Code,
  Cpu,
  Workflow,
  BarChart3,
  Shield,
  Target,
  Globe,
  Sparkles
} from 'lucide-react'
import { 
  dynamicPlatformDataService,
  type DynamicAIAgent,
  type DynamicAISkill 
} from '@/lib/central/dynamic-platform-data'

// =============================================================================
// TYPES FROM DYNAMIC DATA SERVICE
// =============================================================================

interface AISession {
  id: string
  agent_code: string
  agent_name: string
  organization_name: string
  session_type: 'API_CALL' | 'CONVERSATION' | 'AUTOMATION' | 'ANALYSIS'
  started_at: string
  ended_at?: string
  duration: number
  requests_count: number
  tokens_used: number
  cost: number
  status: 'completed' | 'running' | 'failed' | 'cancelled'
  user_id?: string
  error_message?: string
}

interface AIFilters {
  agent_type: string
  status: string
  license: string
  compliance_status: string
  search: string
}

// Dynamic data will be loaded from the platform organization

// AI component functions will be created here when needed
const SAMPLE_AI_AGENTS: AIAgent[] = [
  {
    id: '1',
    agent_code: 'DIGITAL_ACCOUNTANT',
    agent_name: 'Digital Accountant',
    version: 'v2.1.0',
    agent_type: 'FUNCTIONAL',
    status: 'active',
    description: 'Automated financial transaction processing, GL posting, and basic accounting operations',
    skills: ['post_transaction', 'validate_gl', 'generate_report', 'reconcile_accounts'],
    organizations_deployed: 23,
    total_requests_30d: 1547,
    success_rate: 98.3,
    avg_response_time: 245,
    cost_last_30d: 127.50,
    monthly_budget: 200,
    created_date: '2024-01-10',
    last_trained: '2024-01-20',
    publisher: 'HERA AI',
    license: 'COMMERCIAL',
    compliance_status: 'compliant'
  },
  {
    id: '2',
    agent_code: 'SALES_ANALYST',
    agent_name: 'Sales Intelligence Analyst',
    version: 'v1.8.2',
    agent_type: 'ANALYTICAL',
    status: 'active',
    description: 'Advanced sales analytics, forecasting, and customer behavior analysis',
    skills: ['analyze_sales_trends', 'predict_demand', 'segment_customers', 'generate_insights'],
    organizations_deployed: 18,
    total_requests_30d: 892,
    success_rate: 95.7,
    avg_response_time: 1240,
    cost_last_30d: 89.30,
    monthly_budget: 150,
    created_date: '2024-01-05',
    last_trained: '2024-01-18',
    publisher: 'HERA AI',
    license: 'ENTERPRISE',
    compliance_status: 'compliant'
  },
  {
    id: '3',
    agent_code: 'CUSTOMER_SUPPORT',
    agent_name: 'Customer Support Assistant',
    version: 'v3.0.1',
    agent_type: 'CONVERSATIONAL',
    status: 'active',
    description: 'AI-powered customer support with natural language processing and knowledge base integration',
    skills: ['answer_questions', 'escalate_issues', 'update_tickets', 'sentiment_analysis'],
    organizations_deployed: 31,
    total_requests_30d: 4567,
    success_rate: 92.1,
    avg_response_time: 580,
    cost_last_30d: 234.60,
    monthly_budget: 300,
    created_date: '2023-12-15',
    last_trained: '2024-01-22',
    publisher: 'HERA AI',
    license: 'COMMERCIAL',
    compliance_status: 'compliant'
  },
  {
    id: '4',
    agent_code: 'WORKFLOW_OPTIMIZER',
    agent_name: 'Workflow Optimization Engine',
    version: 'v0.9.1',
    agent_type: 'WORKFLOW',
    status: 'training',
    description: 'Beta workflow analysis and optimization suggestions for business process improvement',
    skills: ['analyze_workflows', 'suggest_improvements', 'automate_tasks'],
    organizations_deployed: 3,
    total_requests_30d: 127,
    success_rate: 87.4,
    avg_response_time: 2100,
    cost_last_30d: 45.20,
    monthly_budget: 100,
    created_date: '2024-01-25',
    last_trained: '2024-01-25',
    publisher: 'HERA Labs',
    license: 'FREE',
    compliance_status: 'review_required'
  }
]

const SAMPLE_AI_SKILLS: AISkill[] = [
  {
    id: '1',
    skill_code: 'POST_TRANSACTION',
    skill_name: 'Post Financial Transaction',
    category: 'DATA_WRITE',
    description: 'Create and post financial transactions to the general ledger',
    api_endpoints: ['/api/v2/transactions', '/api/v2/entities'],
    agents_using: 2,
    execution_count_30d: 1547,
    avg_execution_time: 180,
    error_rate: 1.2,
    security_level: 'RESTRICTED',
    cost_per_execution: 0.05,
    status: 'active',
    last_updated: '2024-01-20'
  },
  {
    id: '2',
    skill_code: 'ANALYZE_SALES_TRENDS',
    skill_name: 'Analyze Sales Trends',
    category: 'ANALYSIS',
    description: 'Perform statistical analysis on sales data to identify trends and patterns',
    api_endpoints: ['/api/v2/analytics/sales', '/api/v2/reports/trends'],
    agents_using: 1,
    execution_count_30d: 892,
    avg_execution_time: 1200,
    error_rate: 2.3,
    security_level: 'CONFIDENTIAL',
    cost_per_execution: 0.12,
    status: 'active',
    last_updated: '2024-01-18'
  },
  {
    id: '3',
    skill_code: 'ANSWER_QUESTIONS',
    skill_name: 'Answer Customer Questions',
    category: 'COMMUNICATION',
    description: 'Process customer inquiries and provide appropriate responses',
    api_endpoints: ['/api/v2/chat/respond', '/api/v2/knowledge/search'],
    agents_using: 1,
    execution_count_30d: 4567,
    avg_execution_time: 320,
    error_rate: 3.1,
    security_level: 'PUBLIC',
    cost_per_execution: 0.02,
    status: 'active',
    last_updated: '2024-01-22'
  },
  {
    id: '4',
    skill_code: 'ANALYZE_WORKFLOWS',
    skill_name: 'Analyze Business Workflows',
    category: 'ANALYSIS',
    description: 'Analyze business process workflows to identify optimization opportunities',
    api_endpoints: ['/api/v2/workflows/analyze', '/api/v2/processes/metrics'],
    agents_using: 1,
    execution_count_30d: 127,
    avg_execution_time: 2100,
    error_rate: 8.7,
    security_level: 'RESTRICTED',
    cost_per_execution: 0.25,
    status: 'beta',
    last_updated: '2024-01-25'
  }
]

const SAMPLE_AI_SESSIONS: AISession[] = [
  {
    id: '1',
    agent_code: 'DIGITAL_ACCOUNTANT',
    agent_name: 'Digital Accountant',
    organization_name: 'Matrix IT World',
    session_type: 'API_CALL',
    started_at: '2024-01-25 14:30:22',
    ended_at: '2024-01-25 14:30:28',
    duration: 6.2,
    requests_count: 3,
    tokens_used: 1240,
    cost: 0.15,
    status: 'completed',
    user_id: 'user123'
  },
  {
    id: '2',
    agent_code: 'CUSTOMER_SUPPORT',
    agent_name: 'Customer Support Assistant',
    organization_name: 'Luxe Beauty Salon',
    session_type: 'CONVERSATION',
    started_at: '2024-01-25 14:25:10',
    ended_at: '2024-01-25 14:28:45',
    duration: 215,
    requests_count: 8,
    tokens_used: 2890,
    cost: 0.23,
    status: 'completed',
    user_id: 'customer456'
  },
  {
    id: '3',
    agent_code: 'SALES_ANALYST',
    agent_name: 'Sales Intelligence Analyst',
    organization_name: 'GreenTech Manufacturing',
    session_type: 'ANALYSIS',
    started_at: '2024-01-25 14:20:15',
    duration: 0,
    requests_count: 1,
    tokens_used: 0,
    cost: 0,
    status: 'failed',
    error_message: 'Data access timeout'
  }
]

const AGENT_TYPE_OPTIONS = [
  { value: '', label: 'All Agent Types' },
  { value: 'FUNCTIONAL', label: 'Functional' },
  { value: 'ANALYTICAL', label: 'Analytical' },
  { value: 'CONVERSATIONAL', label: 'Conversational' },
  { value: 'WORKFLOW', label: 'Workflow' }
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'training', label: 'Training' },
  { value: 'error', label: 'Error' }
]

const LICENSE_OPTIONS = [
  { value: '', label: 'All Licenses' },
  { value: 'FREE', label: 'Free' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'ENTERPRISE', label: 'Enterprise' }
]

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function AIAgentCard({ agent }: { agent: AIAgent }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'gray'
      case 'training': return 'yellow'
      case 'error': return 'red'
      default: return 'gray'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FUNCTIONAL': return 'blue'
      case 'ANALYTICAL': return 'purple'
      case 'CONVERSATIONAL': return 'green'
      case 'WORKFLOW': return 'orange'
      default: return 'gray'
    }
  }

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'green'
      case 'review_required': return 'yellow'
      case 'non_compliant': return 'red'
      default: return 'gray'
    }
  }

  const statusColor = getStatusColor(agent.status)
  const typeColor = getTypeColor(agent.agent_type)
  const complianceColor = getComplianceColor(agent.compliance_status)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br from-${typeColor}-400 to-${typeColor}-600 rounded-lg flex items-center justify-center`}>
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{agent.agent_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{agent.version}</span>
              <span className="text-slate-400">•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${typeColor}-100 text-${typeColor}-800`}>
                {agent.agent_type}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {agent.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full bg-${complianceColor}-500`} title={`Compliance: ${agent.compliance_status}`}></div>
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{agent.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{agent.organizations_deployed}</div>
          <div className="text-xs text-slate-600">Deployed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{agent.total_requests_30d.toLocaleString()}</div>
          <div className="text-xs text-slate-600">Requests</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${agent.success_rate >= 95 ? 'text-green-600' : agent.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {agent.success_rate}%
          </div>
          <div className="text-xs text-slate-600">Success</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{agent.avg_response_time}ms</div>
          <div className="text-xs text-slate-600">Response</div>
        </div>
      </div>

      {/* Cost and Budget */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-slate-500">Cost: </span>
            <span className="font-medium text-slate-900">${agent.cost_last_30d.toFixed(2)}</span>
            <span className="text-slate-500"> / ${agent.monthly_budget}</span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (agent.cost_last_30d / agent.monthly_budget) > 0.8 ? 'bg-red-500' :
                  (agent.cost_last_30d / agent.monthly_budget) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{width: `${Math.min((agent.cost_last_30d / agent.monthly_budget) * 100, 100)}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 font-medium mb-2">Skills</div>
        <div className="flex flex-wrap gap-1">
          {agent.skills.slice(0, 3).map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-xs text-blue-700 rounded border border-blue-200">
              {skill}
            </span>
          ))}
          {agent.skills.length > 3 && (
            <span className="px-2 py-1 bg-slate-100 text-xs text-slate-700 rounded">
              +{agent.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200">
          <Eye className="w-4 h-4 mr-2" />
          Monitor
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Settings className="w-4 h-4" />
        </button>
        <button 
          className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            agent.status === 'active' 
              ? 'text-red-700 bg-red-50 hover:bg-red-100' 
              : 'text-green-700 bg-green-50 hover:bg-green-100'
          }`}
        >
          {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function AISkillCard({ skill }: { skill: AISkill }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'DATA_READ': return 'blue'
      case 'DATA_WRITE': return 'red'
      case 'ANALYSIS': return 'purple'
      case 'AUTOMATION': return 'green'
      case 'COMMUNICATION': return 'orange'
      default: return 'gray'
    }
  }

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'PUBLIC': return 'green'
      case 'RESTRICTED': return 'yellow'
      case 'CONFIDENTIAL': return 'red'
      default: return 'gray'
    }
  }

  const categoryColor = getCategoryColor(skill.category)
  const securityColor = getSecurityColor(skill.security_level)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br from-${categoryColor}-400 to-${categoryColor}-600 rounded-lg flex items-center justify-center`}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-md font-semibold text-slate-900">{skill.skill_name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-600">{skill.skill_code}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium bg-${categoryColor}-100 text-${categoryColor}-800`}>
                {skill.category}
              </span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium bg-${securityColor}-100 text-${securityColor}-800`}>
          {skill.security_level}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{skill.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{skill.agents_using}</div>
          <div className="text-xs text-slate-500">Agents</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{skill.execution_count_30d}</div>
          <div className="text-xs text-slate-500">Executions</div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-bold ${skill.error_rate < 2 ? 'text-green-600' : skill.error_rate < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
            {skill.error_rate}%
          </div>
          <div className="text-xs text-slate-500">Error Rate</div>
        </div>
      </div>

      {/* Performance & Cost */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
        <span>{skill.avg_execution_time}ms avg</span>
        <span>${skill.cost_per_execution} per exec</span>
      </div>

      {/* APIs */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 font-medium mb-1">API Endpoints</div>
        <div className="text-xs text-slate-700 bg-slate-50 border rounded p-2">
          {skill.api_endpoints.slice(0, 2).join(', ')}
          {skill.api_endpoints.length > 2 && ' ...'}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          skill.status === 'active' ? 'bg-green-100 text-green-800' :
          skill.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {skill.status}
        </span>
        <span className="text-xs text-slate-500">Updated {new Date(skill.last_updated).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function AISessionRow({ session }: { session: AISession }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green'
      case 'running': return 'blue'
      case 'failed': return 'red'
      case 'cancelled': return 'gray'
      default: return 'gray'
    }
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'API_CALL': return Code
      case 'CONVERSATION': return Brain
      case 'AUTOMATION': return Workflow
      case 'ANALYSIS': return BarChart3
      default: return Activity
    }
  }

  const statusColor = getStatusColor(session.status)
  const TypeIcon = getSessionTypeIcon(session.session_type)

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <TypeIcon className="w-4 h-4 text-slate-400" />
          <div>
            <div className="text-sm font-medium text-slate-900">{session.agent_name}</div>
            <div className="text-xs text-slate-500">{session.organization_name}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
          {session.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-900">{session.session_type}</td>
      <td className="px-4 py-3 text-sm text-slate-900">
        {session.status === 'running' ? 
          `${Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)}s` :
          session.duration ? `${session.duration}s` : '-'
        }
      </td>
      <td className="px-4 py-3 text-sm text-slate-900">{session.requests_count}</td>
      <td className="px-4 py-3 text-sm text-slate-900">${session.cost.toFixed(3)}</td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {new Date(session.started_at).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View
        </button>
      </td>
    </tr>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AIStudioPage() {
  const [aiAgents, setAiAgents] = useState<DynamicAIAgent[]>([])
  const [aiSkills, setAiSkills] = useState<DynamicAISkill[]>([])
  const [filteredAgents, setFilteredAgents] = useState<DynamicAIAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AIFilters>({
    agent_type: '',
    status: '',
    license: '',
    compliance_status: '',
    search: ''
  })
  const [activeTab, setActiveTab] = useState<'agents' | 'skills'>('agents')
  const [showFilters, setShowFilters] = useState(false)

  // Load dynamic data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        console.log('[AIStudio] 🔄 Loading dynamic AI platform data...')
        
        const [agentsData, skillsData] = await Promise.all([
          dynamicPlatformDataService.getAIAgents(),
          dynamicPlatformDataService.getAISkills()
        ])
        
        console.log(`[AIStudio] ✅ Loaded ${agentsData.length} AI agents and ${skillsData.length} skills`)
        setAiAgents(agentsData)
        setAiSkills(skillsData)
        setFilteredAgents(agentsData)
        
      } catch (error) {
        console.error('[AIStudio] ❌ Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = aiAgents

    if (filters.search) {
      filtered = filtered.filter(agent => 
        agent.entity_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        agent.dynamic_data.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        agent.dynamic_data.agent_code.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.agent_type) {
      filtered = filtered.filter(agent => agent.dynamic_data.agent_type === filters.agent_type)
    }

    if (filters.status) {
      filtered = filtered.filter(agent => agent.status === filters.status)
    }

    if (filters.license) {
      filtered = filtered.filter(agent => agent.dynamic_data.license === filters.license)
    }

    if (filters.compliance_status) {
      filtered = filtered.filter(agent => agent.dynamic_data.compliance_status === filters.compliance_status)
    }

    setFilteredAgents(filtered)
  }, [filters, aiAgents])

  const updateFilter = (key: keyof AIFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      agent_type: '',
      status: '',
      license: '',
      compliance_status: '',
      search: ''
    })
  }

  // Calculate totals
  const totalCost = aiAgents.reduce((sum, agent) => sum + agent.cost_last_30d, 0)
  const totalRequests = aiAgents.reduce((sum, agent) => sum + agent.total_requests_30d, 0)
  const avgSuccessRate = aiAgents.reduce((sum, agent) => sum + agent.success_rate, 0) / aiAgents.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Studio</h1>
          <p className="text-slate-600 mt-1">
            AI agent management and governance ({filteredAgents.length} agents, {aiSkills.length} skills, ${totalCost.toFixed(2)} monthly cost)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700">
            <Code className="w-4 h-4 mr-2" />
            Create Skill
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Deploy Agent
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Brain className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{aiAgents.length}</div>
              <div className="text-sm text-slate-600">Active Agents</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{aiSkills.length}</div>
              <div className="text-sm text-slate-600">Available Skills</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{totalRequests.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Monthly Requests</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">${totalCost.toFixed(0)}</div>
              <div className="text-sm text-slate-600">Monthly Cost</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-emerald-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{avgSuccessRate.toFixed(1)}%</div>
              <div className="text-sm text-slate-600">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('agents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'agents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>AI Agents</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {filteredAgents.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'skills'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Skills & Capabilities</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {aiSkills.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Active Sessions</span>
                <span className="bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                  {SAMPLE_AI_SESSIONS.filter(s => s.status === 'running').length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {showFilters && activeTab === 'agents' && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={filters.agent_type}
                  onChange={(e) => updateFilter('agent_type', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {AGENT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={filters.license}
                  onChange={(e) => updateFilter('license', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {LICENSE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={filters.compliance_status}
                  onChange={(e) => updateFilter('compliance_status', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Compliance</option>
                  <option value="compliant">Compliant</option>
                  <option value="review_required">Review Required</option>
                  <option value="non_compliant">Non-Compliant</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'agents' && (
        <div>
          {filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAgents.map((agent) => (
                <AIAgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No AI agents found</h3>
              <p className="text-slate-600 mb-6">
                {filters.search || filters.agent_type || filters.status || filters.license
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by deploying your first AI agent.'
                }
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Deploy AI Agent
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'skills' && (
        <div>
          {aiSkills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiSkills.map((skill) => (
                <AISkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No AI skills found</h3>
              <p className="text-slate-600 mb-6">
                Skills will appear here once AI agents are configured with capabilities.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Agent / Organization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Started At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {SAMPLE_AI_SESSIONS.map((session) => (
                  <AISessionRow key={session.id} session={session} />
                ))}
              </tbody>
            </table>
          </div>
          
          {SAMPLE_AI_SESSIONS.length === 0 && (
            <div className="p-12 text-center">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No active sessions</h3>
              <p className="text-slate-600">
                AI agent sessions will appear here when they are running.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}