
import React, { useEffect, useState } from 'react'
/**
 * ================================================================================
 * HERA CENTRAL: Policies & Guardrails Management
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.POLICIES.MANAGEMENT.v1
 * ================================================================================
 * 
 * Platform-wide policy and guardrail management interface providing:
 * - Policy bundle definitions and templates
 * - Guardrail rule engine configuration
 * - Compliance monitoring and enforcement
 * - Policy application across organizations
 * - Violation tracking and reporting
 * - Rule testing and validation tools
 * 
 * Second-layer navigation with policy-focused workflows
 * ================================================================================
 */

'use client'

import { 
  Shield,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Play,
  Pause,
  MoreVertical,
  FileText,
  Code,
  Users,
  TrendingUp,
  AlertCircle,
  Eye,
  Settings,
  Zap,
  Target,
  BarChart3,
  GitBranch,
  Lock
} from 'lucide-react'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface PolicyBundle {
  id: string
  bundle_code: string
  bundle_name: string
  version: string
  domain: 'FINANCE' | 'SECURITY' | 'COMPLIANCE' | 'WORKFLOW' | 'AI' | 'DATA'
  description: string
  status: 'active' | 'draft' | 'deprecated' | 'testing'
  organizations_applied: number
  rules_count: number
  violations_last_30d: number
  compliance_rate: number
  created_date: string
  last_updated: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  auto_enforcement: boolean
  created_by: string
}

interface GuardrailRule {
  id: string
  rule_code: string
  rule_name: string
  domain: string
  category: 'VALIDATION' | 'LIMIT' | 'APPROVAL' | 'NOTIFICATION' | 'BLOCK'
  description: string
  expression: string
  action: 'WARN' | 'BLOCK' | 'REQUIRE_APPROVAL' | 'LOG' | 'NOTIFY'
  status: 'active' | 'inactive' | 'testing'
  organizations_count: number
  triggered_last_30d: number
  success_rate: number
  avg_execution_time: number
  last_triggered: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

interface ComplianceViolation {
  id: string
  organization_id: string
  organization_name: string
  rule_code: string
  rule_name: string
  violation_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  occurred_at: string
  resolved_at?: string
  status: 'open' | 'investigating' | 'resolved' | 'false_positive'
  assigned_to?: string
  resolution_notes?: string
}

interface PolicyFilters {
  domain: string
  status: string
  severity: string
  search: string
}

// =============================================================================
// MOCK DATA (In production, this would come from platform APIs)
// =============================================================================

const SAMPLE_POLICY_BUNDLES: PolicyBundle[] = [
  {
    id: '1',
    bundle_code: 'FICO_RETAIL_BASIC',
    bundle_name: 'Financial Retail Basic Policies',
    version: 'v2.1.0',
    domain: 'FINANCE',
    description: 'Essential financial policies for retail organizations including DR/CR balance, GL validation, and tax compliance',
    status: 'active',
    organizations_applied: 23,
    rules_count: 12,
    violations_last_30d: 8,
    compliance_rate: 97.2,
    created_date: '2024-01-15',
    last_updated: '2024-01-20',
    severity: 'HIGH',
    auto_enforcement: true,
    created_by: 'Platform Admin'
  },
  {
    id: '2',
    bundle_code: 'SECURITY_STANDARD',
    bundle_name: 'Security Standard Policies',
    version: 'v1.8.3',
    domain: 'SECURITY',
    description: 'Standard security policies including password requirements, session management, and access controls',
    status: 'active',
    organizations_applied: 47,
    rules_count: 18,
    violations_last_30d: 23,
    compliance_rate: 94.8,
    created_date: '2024-01-08',
    last_updated: '2024-01-18',
    severity: 'CRITICAL',
    auto_enforcement: true,
    created_by: 'Security Team'
  },
  {
    id: '3',
    bundle_code: 'GDPR_COMPLIANCE',
    bundle_name: 'GDPR Compliance Policies',
    version: 'v1.2.1',
    domain: 'COMPLIANCE',
    description: 'EU GDPR compliance policies for data protection, consent management, and privacy rights',
    status: 'active',
    organizations_applied: 12,
    rules_count: 8,
    violations_last_30d: 2,
    compliance_rate: 99.1,
    created_date: '2024-01-12',
    last_updated: '2024-01-22',
    severity: 'CRITICAL',
    auto_enforcement: false,
    created_by: 'Compliance Officer'
  },
  {
    id: '4',
    bundle_code: 'AI_GOVERNANCE_BETA',
    bundle_name: 'AI Governance Beta Policies',
    version: 'v0.5.2',
    domain: 'AI',
    description: 'Beta AI governance policies for agent usage limits, cost controls, and ethical guidelines',
    status: 'testing',
    organizations_applied: 3,
    rules_count: 6,
    violations_last_30d: 0,
    compliance_rate: 100.0,
    created_date: '2024-01-25',
    last_updated: '2024-01-25',
    severity: 'MEDIUM',
    auto_enforcement: false,
    created_by: 'AI Team'
  }
]

const SAMPLE_GUARDRAIL_RULES: GuardrailRule[] = [
  {
    id: '1',
    rule_code: 'DRCR_BALANCE',
    rule_name: 'Debit Credit Balance Check',
    domain: 'FINANCE',
    category: 'VALIDATION',
    description: 'Ensures all financial transactions have balanced DR and CR amounts',
    expression: 'sum(lines.DR.amount) == sum(lines.CR.amount)',
    action: 'BLOCK',
    status: 'active',
    organizations_count: 47,
    triggered_last_30d: 156,
    success_rate: 98.7,
    avg_execution_time: 12.5,
    last_triggered: '2024-01-25 14:30:22',
    severity: 'CRITICAL'
  },
  {
    id: '2',
    rule_code: 'LARGE_TRANSACTION',
    rule_name: 'Large Transaction Approval',
    domain: 'FINANCE',
    category: 'APPROVAL',
    description: 'Requires approval for transactions above specified thresholds',
    expression: 'transaction.total_amount > organization.approval_limit',
    action: 'REQUIRE_APPROVAL',
    status: 'active',
    organizations_count: 34,
    triggered_last_30d: 89,
    success_rate: 95.2,
    avg_execution_time: 8.7,
    last_triggered: '2024-01-25 11:15:33',
    severity: 'HIGH'
  },
  {
    id: '3',
    rule_code: 'PASSWORD_STRENGTH',
    rule_name: 'Password Strength Validation',
    domain: 'SECURITY',
    category: 'VALIDATION',
    description: 'Enforces minimum password complexity requirements',
    expression: 'password.length >= 12 && password.hasSpecialChars && password.hasNumbers',
    action: 'BLOCK',
    status: 'active',
    organizations_count: 47,
    triggered_last_30d: 234,
    success_rate: 99.1,
    avg_execution_time: 2.1,
    last_triggered: '2024-01-25 16:42:18',
    severity: 'HIGH'
  },
  {
    id: '4',
    rule_code: 'AI_COST_LIMIT',
    rule_name: 'AI Agent Cost Limit',
    domain: 'AI',
    category: 'LIMIT',
    description: 'Prevents AI agent costs from exceeding monthly budgets',
    expression: 'agent.monthly_cost + request.cost <= agent.monthly_budget',
    action: 'WARN',
    status: 'testing',
    organizations_count: 5,
    triggered_last_30d: 12,
    success_rate: 100.0,
    avg_execution_time: 4.2,
    last_triggered: '2024-01-25 09:23:45',
    severity: 'MEDIUM'
  }
]

const SAMPLE_VIOLATIONS: ComplianceViolation[] = [
  {
    id: '1',
    organization_id: '1',
    organization_name: 'Matrix IT World',
    rule_code: 'LARGE_TRANSACTION',
    rule_name: 'Large Transaction Approval',
    violation_type: 'APPROVAL_BYPASS',
    severity: 'HIGH',
    description: 'Transaction of $15,000 processed without required approval',
    occurred_at: '2024-01-25 14:30:22',
    status: 'investigating',
    assigned_to: 'Compliance Team'
  },
  {
    id: '2',
    organization_id: '2',
    organization_name: 'Luxe Beauty Salon',
    rule_code: 'PASSWORD_STRENGTH',
    rule_name: 'Password Strength Validation',
    violation_type: 'WEAK_PASSWORD',
    severity: 'MEDIUM',
    description: 'User created password not meeting complexity requirements',
    occurred_at: '2024-01-25 11:15:33',
    resolved_at: '2024-01-25 12:00:00',
    status: 'resolved',
    resolution_notes: 'User updated password to meet requirements'
  },
  {
    id: '3',
    organization_id: '3',
    organization_name: 'GreenTech Manufacturing',
    rule_code: 'GDPR_CONSENT',
    rule_name: 'GDPR Consent Required',
    violation_type: 'MISSING_CONSENT',
    severity: 'CRITICAL',
    description: 'Personal data processed without explicit user consent',
    occurred_at: '2024-01-25 09:45:12',
    status: 'open',
    assigned_to: 'Data Protection Officer'
  }
]

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'COMPLIANCE', label: 'Compliance' },
  { value: 'WORKFLOW', label: 'Workflow' },
  { value: 'AI', label: 'AI Governance' },
  { value: 'DATA', label: 'Data Management' }
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'testing', label: 'Testing' },
  { value: 'deprecated', label: 'Deprecated' }
]

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' }
]

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function PolicyBundleCard({ bundle }: { bundle: PolicyBundle }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'draft': return 'gray'
      case 'testing': return 'yellow'
      case 'deprecated': return 'red'
      default: return 'gray'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'green'
      case 'MEDIUM': return 'yellow'
      case 'HIGH': return 'orange'
      case 'CRITICAL': return 'red'
      default: return 'gray'
    }
  }

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'FINANCE': return 'blue'
      case 'SECURITY': return 'red'
      case 'COMPLIANCE': return 'purple'
      case 'WORKFLOW': return 'green'
      case 'AI': return 'orange'
      case 'DATA': return 'indigo'
      default: return 'gray'
    }
  }

  const statusColor = getStatusColor(bundle.status)
  const severityColor = getSeverityColor(bundle.severity)
  const domainColor = getDomainColor(bundle.domain)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br from-${domainColor}-400 to-${domainColor}-600 rounded-lg flex items-center justify-center`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{bundle.bundle_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{bundle.version}</span>
              <span className="text-slate-400">•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${domainColor}-100 text-${domainColor}-800`}>
                {bundle.domain}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {bundle.status.charAt(0).toUpperCase() + bundle.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded text-xs font-medium bg-${severityColor}-100 text-${severityColor}-800`}>
            {bundle.severity}
          </span>
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{bundle.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{bundle.organizations_applied}</div>
          <div className="text-xs text-slate-600">Organizations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{bundle.rules_count}</div>
          <div className="text-xs text-slate-600">Rules</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{bundle.violations_last_30d}</div>
          <div className="text-xs text-slate-600">Violations</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${bundle.compliance_rate >= 95 ? 'text-green-600' : bundle.compliance_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {bundle.compliance_rate}%
          </div>
          <div className="text-xs text-slate-600">Compliance</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {bundle.auto_enforcement ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-xs text-slate-600">
              {bundle.auto_enforcement ? 'Auto-enforced' : 'Manual enforcement'}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Updated {new Date(bundle.last_updated).toLocaleDateString()}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          by {bundle.created_by}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200">
          <Eye className="w-4 h-4 mr-2" />
          View Rules
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Edit className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Play className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function GuardrailRuleCard({ rule }: { rule: GuardrailRule }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'VALIDATION': return 'blue'
      case 'LIMIT': return 'yellow'
      case 'APPROVAL': return 'purple'
      case 'NOTIFICATION': return 'green'
      case 'BLOCK': return 'red'
      default: return 'gray'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'WARN': return 'yellow'
      case 'BLOCK': return 'red'
      case 'REQUIRE_APPROVAL': return 'purple'
      case 'LOG': return 'blue'
      case 'NOTIFY': return 'green'
      default: return 'gray'
    }
  }

  const categoryColor = getCategoryColor(rule.category)
  const actionColor = getActionColor(rule.action)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br from-${categoryColor}-400 to-${categoryColor}-600 rounded-lg flex items-center justify-center`}>
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-md font-semibold text-slate-900">{rule.rule_name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-600">{rule.rule_code}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium bg-${categoryColor}-100 text-${categoryColor}-800`}>
                {rule.category}
              </span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium bg-${actionColor}-100 text-${actionColor}-800`}>
          {rule.action}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{rule.description}</p>

      {/* Expression */}
      <div className="mb-3">
        <div className="text-xs text-slate-500 font-medium mb-1">Rule Expression</div>
        <div className="bg-slate-50 border border-slate-200 rounded p-2">
          <code className="text-xs text-slate-800 font-mono">{rule.expression}</code>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{rule.organizations_count}</div>
          <div className="text-xs text-slate-500">Orgs</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{rule.triggered_last_30d}</div>
          <div className="text-xs text-slate-500">Triggers</div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-bold ${rule.success_rate >= 95 ? 'text-green-600' : rule.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {rule.success_rate}%
          </div>
          <div className="text-xs text-slate-500">Success</div>
        </div>
      </div>

      {/* Performance */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{rule.avg_execution_time.toFixed(1)}ms avg</span>
        <span>Last: {new Date(rule.last_triggered).toLocaleString()}</span>
      </div>
    </div>
  )
}

function ViolationRow({ violation }: { violation: ComplianceViolation }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'green'
      case 'MEDIUM': return 'yellow'
      case 'HIGH': return 'orange'
      case 'CRITICAL': return 'red'
      default: return 'gray'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'red'
      case 'investigating': return 'yellow'
      case 'resolved': return 'green'
      case 'false_positive': return 'blue'
      default: return 'gray'
    }
  }

  const severityColor = getSeverityColor(violation.severity)
  const statusColor = getStatusColor(violation.status)

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full bg-${severityColor}-500`}></div>
          <div>
            <div className="text-sm font-medium text-slate-900">{violation.organization_name}</div>
            <div className="text-xs text-slate-500">{violation.rule_name}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${severityColor}-100 text-${severityColor}-800`}>
          {violation.severity}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-slate-900">{violation.description}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
          {violation.status.replace('_', ' ')}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {new Date(violation.occurred_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {violation.assigned_to || '-'}
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

export default function PoliciesPage() {
  const [policyBundles, setPolicyBundles] = useState<PolicyBundle[]>(SAMPLE_POLICY_BUNDLES)
  const [guardrailRules, setGuardrailRules] = useState<GuardrailRule[]>(SAMPLE_GUARDRAIL_RULES)
  const [violations, setViolations] = useState<ComplianceViolation[]>(SAMPLE_VIOLATIONS)
  const [filteredPolicies, setFilteredPolicies] = useState<PolicyBundle[]>(SAMPLE_POLICY_BUNDLES)
  const [filters, setFilters] = useState<PolicyFilters>({
    domain: '',
    status: '',
    severity: '',
    search: ''
  })
  const [activeTab, setActiveTab] = useState<'policies' | 'guardrails' | 'violations'>('policies')
  const [showFilters, setShowFilters] = useState(false)

  // Apply filters
  useEffect(() => {
    let filtered = policyBundles

    if (filters.search) {
      filtered = filtered.filter(policy => 
        policy.bundle_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        policy.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        policy.bundle_code.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.domain) {
      filtered = filtered.filter(policy => policy.domain === filters.domain)
    }

    if (filters.status) {
      filtered = filtered.filter(policy => policy.status === filters.status)
    }

    if (filters.severity) {
      filtered = filtered.filter(policy => policy.severity === filters.severity)
    }

    setFilteredPolicies(filtered)
  }, [filters, policyBundles])

  const updateFilter = (key: keyof PolicyFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      domain: '',
      status: '',
      severity: '',
      search: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policies & Guardrails</h1>
          <p className="text-slate-600 mt-1">
            Manage platform-wide policies and enforcement rules ({filteredPolicies.length} bundles, {guardrailRules.length} rules, {violations.filter(v => v.status === 'open').length} open violations)
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
            Create Rule
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Policy
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{policyBundles.length}</div>
              <div className="text-sm text-slate-600">Policy Bundles</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{guardrailRules.length}</div>
              <div className="text-sm text-slate-600">Active Rules</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {violations.filter(v => v.status === 'open').length}
              </div>
              <div className="text-sm text-slate-600">Open Violations</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {policyBundles.reduce((sum, p) => sum + p.organizations_applied, 0)}
              </div>
              <div className="text-sm text-slate-600">Org Applications</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {(policyBundles.reduce((sum, p) => sum + p.compliance_rate, 0) / policyBundles.length).toFixed(1)}%
              </div>
              <div className="text-sm text-slate-600">Avg Compliance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('policies')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'policies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Policy Bundles</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {filteredPolicies.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('guardrails')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'guardrails'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Guardrail Rules</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {guardrailRules.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('violations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'violations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Violations</span>
                <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {violations.filter(v => v.status === 'open').length}
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

          {showFilters && activeTab === 'policies' && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.domain}
                  onChange={(e) => updateFilter('domain', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DOMAIN_OPTIONS.map(option => (
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
                  value={filters.severity}
                  onChange={(e) => updateFilter('severity', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SEVERITY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
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
      {activeTab === 'policies' && (
        <div>
          {filteredPolicies.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPolicies.map((policy) => (
                <PolicyBundleCard key={policy.id} bundle={policy} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No policy bundles found</h3>
              <p className="text-slate-600 mb-6">
                {filters.search || filters.domain || filters.status || filters.severity
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first policy bundle.'
                }
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Policy Bundle
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'guardrails' && (
        <div>
          {guardrailRules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guardrailRules.map((rule) => (
                <GuardrailRuleCard key={rule.id} rule={rule} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No guardrail rules found</h3>
              <p className="text-slate-600 mb-6">
                Rules will appear here once policy bundles are configured.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'violations' && (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Organization / Rule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {violations.map((violation) => (
                  <ViolationRow key={violation.id} violation={violation} />
                ))}
              </tbody>
            </table>
          </div>
          
          {violations.length === 0 && (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No violations found</h3>
              <p className="text-slate-600">
                All policies are being followed correctly across organizations.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}