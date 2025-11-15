'use client'

/**
 * Workspace Universal Workflows Component
 * Smart Code: HERA.WORKSPACE.COMPONENT.WORKFLOWS.v1
 * 
 * Workspace-aware workflow management that automatically configures
 * business processes, approval chains, and automation based on domain/section context.
 * 
 * Features:
 * - Domain-specific workflow templates and processes
 * - Automatic approval routing based on workspace context
 * - Visual workflow designer with workspace-specific steps
 * - Business rule automation and condition management
 * - Integration with Universal Workflow Engine
 * - Mobile-first responsive design with workspace theming
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Workflow,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  User,
  ArrowRight,
  GitBranch,
  Settings,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Copy,
  Trash2,
  RotateCcw,
  Timer,
  Bell,
  Target,
  Layers,
  Zap,
  BookOpen,
  FileText,
  Send,
  Check,
  X,
  Sparkles
} from 'lucide-react'
import { UniversalWorkflowEngine } from '../UniversalWorkflowEngine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWorkspaceContext, useWorkspacePermissions } from '@/lib/workspace/workspace-context'
import { cn } from '@/lib/utils'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  smart_code: string
  category: string
  domain: string
  icon: React.ComponentType<any>
  color: string
  steps: WorkflowStep[]
  triggers: WorkflowTrigger[]
  conditions: WorkflowCondition[]
  automation_level: 'manual' | 'semi_automatic' | 'automatic'
  estimated_duration: string
  complexity: 'simple' | 'moderate' | 'complex'
  requires_approval: boolean
  approval_levels: number
}

interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'approval' | 'notification' | 'automation' | 'human_task' | 'condition' | 'integration'
  assigned_to?: string
  duration_estimate?: string
  conditions?: string[]
  actions?: string[]
  required: boolean
}

interface WorkflowTrigger {
  id: string
  name: string
  description: string
  event_type: string
  conditions?: Record<string, any>
  automatic: boolean
}

interface WorkflowCondition {
  id: string
  name: string
  description: string
  expression: string
  type: 'business_rule' | 'data_validation' | 'approval_gate' | 'time_constraint'
}

interface WorkflowInstance {
  id: string
  template_id: string
  template_name: string
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  current_step: string
  current_step_name: string
  progress_percentage: number
  started_at: string
  completed_at?: string
  triggered_by: string
  entity_id: string
  entity_name: string
  entity_type: string
  assigned_users: string[]
  pending_approvals: number
  total_steps: number
  completed_steps: number
}

interface WorkspaceUniversalWorkflowsProps {
  // Data
  initialWorkflows?: WorkflowInstance[]
  
  // Configuration
  showQuickActions?: boolean
  showTemplates?: boolean
  showAnalytics?: boolean
  defaultView?: 'active' | 'templates' | 'analytics'
  
  // Callbacks
  onWorkflowStart?: (templateId: string, entityId: string) => Promise<void>
  onWorkflowAction?: (workflowId: string, action: string) => Promise<void>
  
  // UI
  className?: string
}

// Domain-specific workflow templates
const getDomainWorkflowTemplates = (domain: string, section: string): WorkflowTemplate[] => {
  const workflowConfigs: Record<string, WorkflowTemplate[]> = {
    sales: [
      {
        id: 'SALES_QUOTE_APPROVAL',
        name: 'Sales Quote Approval',
        description: 'Multi-level approval process for sales quotes',
        smart_code: 'HERA.SALES.WORKFLOW.QUOTE_APPROVAL.v1',
        category: 'approval_process',
        domain: 'sales',
        icon: FileText,
        color: 'text-blue-600 bg-blue-50',
        automation_level: 'semi_automatic',
        estimated_duration: '2-5 business days',
        complexity: 'moderate',
        requires_approval: true,
        approval_levels: 2,
        steps: [
          {
            id: 'review_quote',
            name: 'Review Quote Details',
            description: 'Initial review of quote accuracy and pricing',
            type: 'human_task',
            assigned_to: 'sales_manager',
            duration_estimate: '1-2 hours',
            required: true
          },
          {
            id: 'pricing_approval',
            name: 'Pricing Approval',
            description: 'Approve special pricing or discounts',
            type: 'approval',
            assigned_to: 'pricing_manager',
            duration_estimate: '4-8 hours',
            required: true,
            conditions: ['discount_percentage > 15']
          },
          {
            id: 'final_approval',
            name: 'Final Approval',
            description: 'Final sign-off before sending to customer',
            type: 'approval',
            assigned_to: 'sales_director',
            duration_estimate: '24 hours',
            required: true,
            conditions: ['quote_value > 50000']
          },
          {
            id: 'send_quote',
            name: 'Send to Customer',
            description: 'Automated delivery to customer',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['email_quote', 'update_crm', 'set_follow_up']
          }
        ],
        triggers: [
          {
            id: 'quote_created',
            name: 'Quote Created',
            description: 'Triggered when a new quote is created',
            event_type: 'transaction_created',
            automatic: true
          }
        ],
        conditions: [
          {
            id: 'discount_threshold',
            name: 'Discount Threshold',
            description: 'Requires additional approval for discounts over 15%',
            expression: 'discount_percentage > 15',
            type: 'business_rule'
          }
        ]
      },
      {
        id: 'CUSTOMER_ONBOARDING',
        name: 'Customer Onboarding',
        description: 'Complete customer setup and verification process',
        smart_code: 'HERA.SALES.WORKFLOW.ONBOARDING.v1',
        category: 'customer_management',
        domain: 'sales',
        icon: Users,
        color: 'text-green-600 bg-green-50',
        automation_level: 'semi_automatic',
        estimated_duration: '3-7 business days',
        complexity: 'complex',
        requires_approval: true,
        approval_levels: 1,
        steps: [
          {
            id: 'collect_documents',
            name: 'Collect Documents',
            description: 'Gather required customer documentation',
            type: 'human_task',
            assigned_to: 'sales_representative',
            duration_estimate: '1-2 days',
            required: true
          },
          {
            id: 'verify_credentials',
            name: 'Verify Credentials',
            description: 'Validate customer identity and creditworthiness',
            type: 'automation',
            duration_estimate: '2-4 hours',
            required: true,
            actions: ['credit_check', 'identity_verification']
          },
          {
            id: 'setup_account',
            name: 'Setup Account',
            description: 'Create customer account and payment terms',
            type: 'human_task',
            assigned_to: 'account_manager',
            duration_estimate: '4-8 hours',
            required: true
          },
          {
            id: 'welcome_communication',
            name: 'Welcome Communication',
            description: 'Send welcome package and account details',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['send_welcome_email', 'schedule_follow_up']
          }
        ],
        triggers: [
          {
            id: 'customer_created',
            name: 'Customer Created',
            description: 'Triggered when a new customer is added',
            event_type: 'entity_created',
            automatic: true
          }
        ],
        conditions: []
      }
    ],
    
    purchase: [
      {
        id: 'PURCHASE_ORDER_APPROVAL',
        name: 'Purchase Order Approval',
        description: 'Multi-level approval for purchase orders based on amount',
        smart_code: 'HERA.PURCHASE.WORKFLOW.PO_APPROVAL.v1',
        category: 'approval_process',
        domain: 'purchase',
        icon: CheckCircle,
        color: 'text-purple-600 bg-purple-50',
        automation_level: 'semi_automatic',
        estimated_duration: '1-3 business days',
        complexity: 'moderate',
        requires_approval: true,
        approval_levels: 3,
        steps: [
          {
            id: 'manager_review',
            name: 'Manager Review',
            description: 'Initial review by department manager',
            type: 'approval',
            assigned_to: 'department_manager',
            duration_estimate: '4-8 hours',
            required: true,
            conditions: ['amount > 1000']
          },
          {
            id: 'finance_approval',
            name: 'Finance Approval',
            description: 'Budget verification and finance approval',
            type: 'approval',
            assigned_to: 'finance_manager',
            duration_estimate: '24 hours',
            required: true,
            conditions: ['amount > 10000']
          },
          {
            id: 'executive_approval',
            name: 'Executive Approval',
            description: 'Executive approval for large purchases',
            type: 'approval',
            assigned_to: 'executive',
            duration_estimate: '48 hours',
            required: true,
            conditions: ['amount > 50000']
          },
          {
            id: 'send_po',
            name: 'Send to Vendor',
            description: 'Automatically send PO to vendor',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['email_vendor', 'update_status', 'create_receipt_tracking']
          }
        ],
        triggers: [
          {
            id: 'po_created',
            name: 'PO Created',
            description: 'Triggered when purchase order is created',
            event_type: 'transaction_created',
            automatic: true
          }
        ],
        conditions: [
          {
            id: 'amount_threshold',
            name: 'Amount Threshold',
            description: 'Different approval levels based on amount',
            expression: 'amount > threshold',
            type: 'business_rule'
          }
        ]
      }
    ],
    
    inventory: [
      {
        id: 'STOCK_REPLENISHMENT',
        name: 'Stock Replenishment',
        description: 'Automated stock replenishment workflow',
        smart_code: 'HERA.INVENTORY.WORKFLOW.REPLENISHMENT.v1',
        category: 'automation',
        domain: 'inventory',
        icon: RotateCcw,
        color: 'text-amber-600 bg-amber-50',
        automation_level: 'automatic',
        estimated_duration: '1-2 hours',
        complexity: 'simple',
        requires_approval: false,
        approval_levels: 0,
        steps: [
          {
            id: 'check_stock_levels',
            name: 'Check Stock Levels',
            description: 'Monitor current stock against minimum levels',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['query_stock_levels', 'identify_low_stock']
          },
          {
            id: 'calculate_reorder',
            name: 'Calculate Reorder Quantity',
            description: 'Calculate optimal reorder quantities',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['calculate_eoq', 'consider_lead_times']
          },
          {
            id: 'create_po',
            name: 'Create Purchase Order',
            description: 'Automatically create PO for preferred vendor',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['create_purchase_order', 'notify_purchasing']
          }
        ],
        triggers: [
          {
            id: 'stock_below_minimum',
            name: 'Stock Below Minimum',
            description: 'Triggered when stock falls below reorder point',
            event_type: 'stock_threshold',
            automatic: true
          }
        ],
        conditions: [
          {
            id: 'reorder_point',
            name: 'Reorder Point Reached',
            description: 'Stock level has reached the reorder point',
            expression: 'current_stock <= reorder_point',
            type: 'business_rule'
          }
        ]
      }
    ],
    
    finance: [
      {
        id: 'MONTH_END_CLOSING',
        name: 'Month-End Closing',
        description: 'Complete month-end financial closing process',
        smart_code: 'HERA.FINANCE.WORKFLOW.MONTH_END.v1',
        category: 'financial_process',
        domain: 'finance',
        icon: BookOpen,
        color: 'text-indigo-600 bg-indigo-50',
        automation_level: 'semi_automatic',
        estimated_duration: '5-10 business days',
        complexity: 'complex',
        requires_approval: true,
        approval_levels: 2,
        steps: [
          {
            id: 'reconcile_accounts',
            name: 'Reconcile Bank Accounts',
            description: 'Reconcile all bank and cash accounts',
            type: 'human_task',
            assigned_to: 'accountant',
            duration_estimate: '1-2 days',
            required: true
          },
          {
            id: 'review_accruals',
            name: 'Review Accruals',
            description: 'Review and post month-end accruals',
            type: 'human_task',
            assigned_to: 'senior_accountant',
            duration_estimate: '1 day',
            required: true
          },
          {
            id: 'prepare_reports',
            name: 'Prepare Financial Reports',
            description: 'Generate P&L, Balance Sheet, and Cash Flow',
            type: 'automation',
            duration_estimate: '2-4 hours',
            required: true,
            actions: ['generate_pl', 'generate_balance_sheet', 'generate_cash_flow']
          },
          {
            id: 'management_review',
            name: 'Management Review',
            description: 'Management review of financial results',
            type: 'approval',
            assigned_to: 'finance_director',
            duration_estimate: '1-2 days',
            required: true
          },
          {
            id: 'close_period',
            name: 'Close Financial Period',
            description: 'Officially close the financial period',
            type: 'automation',
            duration_estimate: 'Immediate',
            required: true,
            actions: ['lock_period', 'notify_stakeholders', 'archive_reports']
          }
        ],
        triggers: [
          {
            id: 'month_end_date',
            name: 'Month-End Date',
            description: 'Triggered automatically at month-end',
            event_type: 'scheduled_date',
            automatic: true
          }
        ],
        conditions: [
          {
            id: 'all_transactions_posted',
            name: 'All Transactions Posted',
            description: 'All transactions for the period must be posted',
            expression: 'unposted_transactions == 0',
            type: 'data_validation'
          }
        ]
      }
    ]
  }
  
  return workflowConfigs[domain] || []
}

// Sample workflow instances
const sampleWorkflows: WorkflowInstance[] = [
  {
    id: 'wf_001',
    template_id: 'SALES_QUOTE_APPROVAL',
    template_name: 'Sales Quote Approval',
    status: 'running',
    current_step: 'pricing_approval',
    current_step_name: 'Pricing Approval',
    progress_percentage: 50,
    started_at: '2024-01-15T09:00:00Z',
    triggered_by: 'john.doe@company.com',
    entity_id: 'quote_001',
    entity_name: 'Quote for ACME Corp',
    entity_type: 'QUOTE',
    assigned_users: ['pricing.manager@company.com'],
    pending_approvals: 1,
    total_steps: 4,
    completed_steps: 2
  },
  {
    id: 'wf_002',
    template_id: 'PURCHASE_ORDER_APPROVAL',
    template_name: 'Purchase Order Approval',
    status: 'completed',
    current_step: 'send_po',
    current_step_name: 'Send to Vendor',
    progress_percentage: 100,
    started_at: '2024-01-14T10:30:00Z',
    completed_at: '2024-01-15T14:20:00Z',
    triggered_by: 'purchasing@company.com',
    entity_id: 'po_001',
    entity_name: 'Office Supplies Order',
    entity_type: 'PURCHASE_ORDER',
    assigned_users: [],
    pending_approvals: 0,
    total_steps: 4,
    completed_steps: 4
  }
]

export function WorkspaceUniversalWorkflows({
  initialWorkflows = sampleWorkflows,
  showQuickActions = true,
  showTemplates = true,
  showAnalytics = true,
  defaultView = 'active',
  onWorkflowStart,
  onWorkflowAction,
  className = ''
}: WorkspaceUniversalWorkflowsProps) {
  const router = useRouter()
  const workspace = useWorkspaceContext()
  const permissions = useWorkspacePermissions()
  
  // State
  const [workflows, setWorkflows] = useState(initialWorkflows)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInstance | null>(null)
  const [currentView, setCurrentView] = useState(defaultView)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('active')
  const [isLoading, setIsLoading] = useState(false)

  // Get workspace-specific workflow templates
  const workspaceTemplates = useMemo(
    () => getDomainWorkflowTemplates(workspace.domain, workspace.section),
    [workspace.domain, workspace.section]
  )
  
  // Filter workflows based on search and status
  const filteredWorkflows = useMemo(() => {
    let filtered = workflows
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(wf =>
        wf.template_name?.toLowerCase().includes(query) ||
        wf.entity_name?.toLowerCase().includes(query) ||
        wf.triggered_by?.toLowerCase().includes(query)
      )
    }
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(wf => wf.status === selectedStatus)
    }
    
    return filtered
  }, [workflows, searchQuery, selectedStatus])

  // Handle workflow actions
  const handleStartWorkflow = useCallback(async (templateId: string, entityId?: string) => {
    setIsLoading(true)
    try {
      if (onWorkflowStart) {
        await onWorkflowStart(templateId, entityId || 'test_entity')
      }
      // In real implementation, would refresh workflows list
    } catch (error) {
      console.error('Failed to start workflow:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onWorkflowStart])
  
  const handleWorkflowAction = useCallback(async (workflowId: string, action: string) => {
    setIsLoading(true)
    try {
      if (onWorkflowAction) {
        await onWorkflowAction(workflowId, action)
      }
      // In real implementation, would refresh workflows list
    } catch (error) {
      console.error('Failed to execute workflow action:', error)
    } finally {
      setIsLoading(false)
    }
  }, [onWorkflowAction])

  // Get status appearance
  const getStatusAppearance = useCallback((status: string) => {
    const statusConfig = {
      draft: { color: 'text-slate-600 bg-slate-100', label: 'Draft', icon: FileText },
      running: { color: 'text-blue-600 bg-blue-100', label: 'Running', icon: Play },
      paused: { color: 'text-amber-600 bg-amber-100', label: 'Paused', icon: Pause },
      completed: { color: 'text-green-600 bg-green-100', label: 'Completed', icon: CheckCircle },
      failed: { color: 'text-red-600 bg-red-100', label: 'Failed', icon: XCircle },
      cancelled: { color: 'text-slate-600 bg-slate-100', label: 'Cancelled', icon: X }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }, [])

  // Render quick actions for workflow templates
  const renderQuickActions = () => {
    if (!showQuickActions || !permissions.canManageWorkflows) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Workflow Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspaceTemplates.slice(0, 6).map((template) => {
              const Icon = template.icon
              return (
                <Button
                  key={template.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-center gap-2 text-center",
                    "hover:shadow-md transition-all duration-200"
                  )}
                  onClick={() => handleStartWorkflow(template.id)}
                >
                  <Icon className="w-6 h-6" />
                  <div>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{template.estimated_duration}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render workflow analytics
  const renderAnalytics = () => {
    if (!showAnalytics) return null
    
    const stats = useMemo(() => {
      const total = filteredWorkflows.length
      const running = filteredWorkflows.filter(w => w.status === 'running').length
      const completed = filteredWorkflows.filter(w => w.status === 'completed').length
      const pending = filteredWorkflows.filter(w => w.pending_approvals > 0).length
      
      return { total, running, completed, pending }
    }, [filteredWorkflows])

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Workflow className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Running</p>
                <p className="text-2xl font-bold">{stats.running}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render active workflows list
  const renderActiveWorkflows = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Workflow className="w-5 h-5" />
            Active Workflows ({filteredWorkflows.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            {/* Filter by status */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredWorkflows.map((workflow) => {
            const statusConfig = getStatusAppearance(workflow.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <div
                key={workflow.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", statusConfig.color)}>
                    <StatusIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{workflow.template_name}</div>
                    <div className="text-sm text-muted-foreground">{workflow.entity_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Started {new Date(workflow.started_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium">{workflow.current_step_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={workflow.progress_percentage} className="w-24 h-2" />
                      <span className="text-xs text-muted-foreground">
                        {workflow.progress_percentage}%
                      </span>
                    </div>
                    {workflow.pending_approvals > 0 && (
                      <div className="text-xs text-amber-600 mt-1">
                        {workflow.pending_approvals} pending approval{workflow.pending_approvals !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <Badge variant="outline" className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedWorkflow(workflow)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {workflow.status === 'running' && permissions.canManageWorkflows && (
                        <>
                          <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'pause')}>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'approve')}>
                            <Check className="w-4 h-4 mr-2" />
                            Approve Current Step
                          </DropdownMenuItem>
                        </>
                      )}
                      {workflow.status === 'paused' && permissions.canManageWorkflows && (
                        <DropdownMenuItem onClick={() => handleWorkflowAction(workflow.id, 'resume')}>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {permissions.canManageWorkflows && (
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleWorkflowAction(workflow.id, 'cancel')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          
          {filteredWorkflows.length === 0 && (
            <div className="text-center py-12">
              <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No workflows found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : `Start your first ${workspace.displayName.toLowerCase()} workflow to automate business processes.`
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Render workflow templates
  const renderTemplates = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Workflow Templates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {workspaceTemplates.map((template) => {
            const Icon = template.icon
            
            return (
              <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", template.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-muted-foreground">{template.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {template.estimated_duration} • {template.complexity} • {template.steps.length} steps
                      {template.requires_approval && ` • ${template.approval_levels} approval level${template.approval_levels !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={template.color}>
                    {template.automation_level.replace('_', ' ')}
                  </Badge>
                  
                  {permissions.canManageWorkflows && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleStartWorkflow(template.id)}
                      disabled={isLoading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{workspace.displayName} Workflows</h2>
          <p className="text-muted-foreground">
            Manage automated business processes and workflows for your {workspace.domain} operations
          </p>
        </div>
      </div>

      {/* Workspace-specific tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-6">
          {/* Quick Actions */}
          {renderQuickActions()}
          
          {/* Analytics */}
          {renderAnalytics()}
          
          {/* Active Workflows */}
          {renderActiveWorkflows()}
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          {showTemplates && renderTemplates()}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          {showAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced workflow analytics would be rendered here</p>
                    <p className="text-sm">Performance metrics, bottleneck analysis, SLA tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WorkspaceUniversalWorkflows