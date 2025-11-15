'use client'

/**
 * Universal Workflow Page Component
 * Smart Code: HERA.UNIVERSAL.PAGE.WORKFLOW_CRUD.v1
 * 
 * Complete enterprise-grade workflow management interface with:
 * - Three-panel layout (workflows | designer/executor | properties)
 * - Workflow design and execution modes
 * - Template library and workflow catalog
 * - Real-time execution monitoring
 * - User task management
 * - Analytics and reporting
 * - Mobile-first responsive design
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  GitBranch,
  Plus,
  Play,
  Edit3,
  Copy,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  FileText,
  Folder,
  FolderOpen,
  Eye,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  BookOpen
} from 'lucide-react'
import { UniversalTransactionShell } from './UniversalTransactionShell'
import { UniversalWorkflowDesigner, WorkflowDefinition, WorkflowStep } from './UniversalWorkflowDesigner'
import { UniversalWorkflowExecutor, WorkflowExecution, WorkflowTask } from './UniversalWorkflowExecutor'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { cn } from '@/lib/utils'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: React.ComponentType<any>
  complexity: 'simple' | 'medium' | 'complex'
  estimated_setup_time: number // minutes
  features: string[]
  workflow_definition: Partial<WorkflowDefinition>
}

interface WorkflowAnalytics {
  total_workflows: number
  active_executions: number
  completed_today: number
  success_rate: number
  avg_completion_time: number // minutes
  top_workflows: Array<{
    workflow_id: string
    name: string
    execution_count: number
    success_rate: number
  }>
}

interface UniversalWorkflowPageProps {
  // Data
  initialWorkflows?: WorkflowDefinition[]
  initialExecutions?: WorkflowExecution[]
  initialTasks?: WorkflowTask[]
  
  // Behavior
  onWorkflowSave?: (workflow: WorkflowDefinition) => Promise<void>
  onWorkflowDelete?: (workflowId: string) => Promise<void>
  onExecutionAction?: (action: string, executionId: string) => Promise<void>
  onTaskAction?: (taskId: string, action: any) => Promise<void>
  
  // UI Configuration
  allowEdit?: boolean
  showAnalytics?: boolean
  defaultView?: 'list' | 'design' | 'execute'
  className?: string
}

// Sample workflow templates
const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'approval_simple',
    name: 'Simple Approval',
    description: 'Basic approval workflow with single approver',
    category: 'Approval',
    icon: CheckCircle,
    complexity: 'simple',
    estimated_setup_time: 5,
    features: ['Single Approver', 'Email Notifications', 'Auto-routing'],
    workflow_definition: {
      name: 'Simple Approval Workflow',
      description: 'Single step approval process',
      version: '1.0.0',
      status: 'draft',
      steps: [],
      triggers: [],
      variables: []
    }
  },
  {
    id: 'expense_approval',
    name: 'Expense Approval',
    description: 'Multi-level expense approval with amount thresholds',
    category: 'Finance',
    icon: BarChart3,
    complexity: 'medium',
    estimated_setup_time: 15,
    features: ['Amount Thresholds', 'Multi-level Approval', 'Receipt Validation'],
    workflow_definition: {
      name: 'Expense Approval Workflow',
      description: 'Multi-tier expense approval process',
      version: '1.0.0',
      status: 'draft',
      steps: [],
      triggers: [],
      variables: []
    }
  },
  {
    id: 'onboarding',
    name: 'Employee Onboarding',
    description: 'Complete employee onboarding process',
    category: 'HR',
    icon: Users,
    complexity: 'complex',
    estimated_setup_time: 30,
    features: ['Task Assignment', 'Document Collection', 'Training Tracking', 'IT Setup'],
    workflow_definition: {
      name: 'Employee Onboarding Workflow',
      description: 'Complete new hire onboarding process',
      version: '1.0.0',
      status: 'draft',
      steps: [],
      triggers: [],
      variables: []
    }
  }
]

// Sample data
const sampleWorkflows: WorkflowDefinition[] = [
  {
    id: 'wf_1',
    name: 'Purchase Order Approval',
    description: 'Approval workflow for purchase orders',
    version: '2.1.0',
    status: 'active',
    steps: [],
    triggers: [],
    variables: [],
    smart_code: 'HERA.WORKFLOW.PO_APPROVAL.v1'
  }
]

const sampleExecutions: WorkflowExecution[] = [
  {
    id: 'exec_1',
    workflow_id: 'wf_1',
    workflow_version: '2.1.0',
    status: 'running',
    progress: 65,
    started_at: new Date().toISOString(),
    started_by: 'user_1',
    context: {},
    step_executions: []
  }
]

export function UniversalWorkflowPage({
  initialWorkflows = sampleWorkflows,
  initialExecutions = sampleExecutions,
  initialTasks = [],
  onWorkflowSave,
  onWorkflowDelete,
  onExecutionAction,
  onTaskAction,
  allowEdit = true,
  showAnalytics = true,
  defaultView = 'list',
  className = ''
}: UniversalWorkflowPageProps) {
  const router = useRouter()
  const { user, organization } = useHERAAuth()
  
  // State
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(initialWorkflows)
  const [executions, setExecutions] = useState<WorkflowExecution[]>(initialExecutions)
  const [userTasks, setUserTasks] = useState<WorkflowTask[]>(initialTasks)
  
  const [activeView, setActiveView] = useState(defaultView)
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Analytics
  const analytics = useMemo((): WorkflowAnalytics => {
    const activeExecs = executions.filter(e => e.status === 'running').length
    const completedToday = executions.filter(e => {
      if (!e.completed_at) return false
      const today = new Date().toDateString()
      return new Date(e.completed_at).toDateString() === today
    }).length
    
    const successRate = executions.length > 0 
      ? (executions.filter(e => e.status === 'completed').length / executions.length) * 100
      : 0

    return {
      total_workflows: workflows.length,
      active_executions: activeExecs,
      completed_today: completedToday,
      success_rate: successRate,
      avg_completion_time: 45, // Mock data
      top_workflows: [
        { workflow_id: 'wf_1', name: 'PO Approval', execution_count: 25, success_rate: 94 }
      ]
    }
  }, [workflows, executions])

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    let filtered = workflows

    if (searchFilter) {
      filtered = filtered.filter(wf =>
        wf.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        wf.description?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(wf => wf.status === statusFilter)
    }

    return filtered
  }, [workflows, searchFilter, statusFilter])

  // Filter executions
  const filteredExecutions = useMemo(() => {
    let filtered = executions

    if (searchFilter) {
      const matchingWorkflows = workflows.filter(wf =>
        wf.name.toLowerCase().includes(searchFilter.toLowerCase())
      ).map(wf => wf.id)
      
      filtered = filtered.filter(exec =>
        matchingWorkflows.includes(exec.workflow_id)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(exec => exec.status === statusFilter)
    }

    return filtered
  }, [executions, workflows, searchFilter, statusFilter])

  // Handle workflow creation from template
  const handleCreateFromTemplate = useCallback((template: WorkflowTemplate) => {
    const newWorkflow: WorkflowDefinition = {
      id: `wf_${Date.now()}`,
      ...template.workflow_definition,
      name: template.workflow_definition.name || template.name,
      smart_code: `HERA.WORKFLOW.${template.id.toUpperCase()}.v1`
    } as WorkflowDefinition

    setWorkflows(prev => [...prev, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setActiveView('design')
    setShowTemplateDialog(false)
  }, [])

  // Handle workflow save
  const handleWorkflowSave = useCallback(async (workflow: WorkflowDefinition) => {
    try {
      if (onWorkflowSave) {
        await onWorkflowSave(workflow)
      }
      
      setWorkflows(prev => prev.map(wf => 
        wf.id === workflow.id ? workflow : wf
      ))
    } catch (error) {
      console.error('Failed to save workflow:', error)
    }
  }, [onWorkflowSave])

  // Handle workflow execution
  const handleStartExecution = useCallback((workflow: WorkflowDefinition) => {
    const newExecution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflow_id: workflow.id!,
      workflow_version: workflow.version,
      status: 'running',
      progress: 0,
      started_at: new Date().toISOString(),
      started_by: user?.id || 'current_user',
      context: {},
      step_executions: []
    }

    setExecutions(prev => [...prev, newExecution])
    setSelectedExecution(newExecution)
    setActiveView('execute')
  }, [user])

  // Get workflow status appearance
  const getWorkflowStatusAppearance = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600', bgColor: 'bg-green-50', label: 'Active' }
      case 'draft':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Draft' }
      case 'deprecated':
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', label: 'Deprecated' }
      default:
        return { color: 'text-slate-600', bgColor: 'bg-slate-50', label: status }
    }
  }, [])

  // Left panel content (Navigation & Filters)
  const leftPanelContent = (
    <div className="space-y-4">
      {/* Quick Stats */}
      {showAnalytics && (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 size={16} />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Workflows:</span>
                <span className="font-medium">{analytics.total_workflows}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Running:</span>
                <span className="font-medium text-blue-600">{analytics.active_executions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Completed Today:</span>
                <span className="font-medium text-green-600">{analytics.completed_today}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Success Rate:</span>
                <span className="font-medium">{Math.round(analytics.success_rate)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Selector */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm">View Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('list')}
              className="justify-start"
            >
              <FileText size={14} className="mr-2" />
              Workflows
            </Button>
            <Button
              variant={activeView === 'design' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('design')}
              className="justify-start"
            >
              <GitBranch size={14} className="mr-2" />
              Designer
            </Button>
            <Button
              variant={activeView === 'execute' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('execute')}
              className="justify-start"
            >
              <Activity size={14} className="mr-2" />
              Executions
            </Button>
            <Button
              variant={activeView === 'tasks' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('tasks')}
              className="justify-start"
            >
              <CheckCircle size={14} className="mr-2" />
              My Tasks ({userTasks.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter size={16} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Search workflows..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {allowEdit && (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setShowTemplateDialog(true)}
              >
                <Plus size={14} className="mr-2" />
                New Workflow
              </Button>
              
              <Button 
                variant="outline"
                size="sm" 
                className="w-full justify-start"
                onClick={() => setShowTemplateDialog(true)}
              >
                <BookOpen size={14} className="mr-2" />
                Templates
              </Button>
              
              <Button 
                variant="outline"
                size="sm" 
                className="w-full justify-start"
              >
                <Download size={14} className="mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Center panel content (Main view)
  const centerPanelContent = (
    <div className="h-full">
      {activeView === 'list' && (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Workflows ({filteredWorkflows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredWorkflows.map((workflow) => {
                const { color, bgColor, label } = getWorkflowStatusAppearance(workflow.status)
                const activeExecs = executions.filter(e => 
                  e.workflow_id === workflow.id && e.status === 'running'
                ).length

                return (
                  <div
                    key={workflow.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setSelectedWorkflow(workflow)
                      setActiveView('design')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{workflow.name}</h3>
                          <Badge variant="outline" className={cn("text-xs", color, bgColor)}>
                            {label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            v{workflow.version}
                          </Badge>
                          {activeExecs > 0 && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {activeExecs} running
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{workflow.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                          <span>{workflow.steps?.length || 0} steps</span>
                          <span>{workflow.triggers?.length || 0} triggers</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {workflow.status === 'active' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartExecution(workflow)
                            }}
                          >
                            <Play size={14} className="mr-1" />
                            Start
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                              <Settings size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedWorkflow(workflow)
                              setActiveView('design')
                            }}>
                              <Edit3 size={14} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const copy = { ...workflow, id: `wf_${Date.now()}`, name: `${workflow.name} (Copy)` }
                              setWorkflows(prev => [...prev, copy])
                            }}>
                              <Copy size={14} className="mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 size={14} className="mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'design' && selectedWorkflow && (
        <UniversalWorkflowDesigner
          workflow={selectedWorkflow}
          stepTypes={[]} // Would be provided from props
          onChange={handleWorkflowSave}
          readonly={!allowEdit}
          className="h-full"
        />
      )}

      {activeView === 'execute' && (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              Workflow Executions ({filteredExecutions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredExecutions.map((execution) => {
                const workflow = workflows.find(wf => wf.id === execution.workflow_id)
                const statusColor = execution.status === 'completed' ? 'text-green-600' :
                                   execution.status === 'failed' ? 'text-red-600' :
                                   execution.status === 'running' ? 'text-blue-600' : 'text-slate-600'

                return (
                  <div
                    key={execution.id}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setSelectedExecution(execution)
                      setActiveView('execute')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{workflow?.name} #{execution.id.slice(-6)}</h3>
                          <Badge variant="outline" className={cn("text-xs", statusColor)}>
                            {execution.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <Progress value={execution.progress} className="h-2" />
                          <p className="text-xs text-slate-500 mt-1">
                            {Math.round(execution.progress)}% complete
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                          <span>Started: {new Date(execution.started_at).toLocaleString()}</span>
                          <span>By: {execution.started_by}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === 'execute' && selectedExecution && (
        <UniversalWorkflowExecutor
          execution={selectedExecution}
          workflow={workflows.find(wf => wf.id === selectedExecution.workflow_id)!}
          userTasks={userTasks.filter(task => task.execution_id === selectedExecution.id)}
          currentUserId={user?.id || 'current_user'}
          onExecutionAction={onExecutionAction}
          onTaskAction={onTaskAction}
          readonly={!allowEdit}
          className="h-full"
        />
      )}

      {activeView === 'tasks' && (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={20} />
              My Tasks ({userTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userTasks.map((task) => (
                <div key={task.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {task.task_type.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant={task.priority === 'urgent' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm">Open Task</Button>
                  </div>
                </div>
              ))}
              
              {userTasks.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle className="mx-auto mb-2 text-slate-300" size={32} />
                  <p>No pending tasks</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className={cn("h-screen", className)}>
      <UniversalTransactionShell
        title="Workflow Management"
        subtitle="Design, execute, and monitor business workflows"
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Workflows' }
        ]}
        leftPanelContent={leftPanelContent}
        centerPanelContent={centerPanelContent}
        rightPanelContent={null}
        showAIPanel={false}
        onToggleAIPanel={() => {}}
        allowFullscreen={true}
        showAutoSave={false}
      />

      {/* Template Selection Dialog */}
      {showTemplateDialog && (
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Choose Workflow Template</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflowTemplates.map((template) => {
                const IconComponent = template.icon
                
                return (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <IconComponent className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="text-xs mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">{template.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Complexity:</span>
                          <Badge 
                            variant={template.complexity === 'complex' ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {template.complexity}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Setup Time:</span>
                          <span className="font-medium">{template.estimated_setup_time} min</span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-slate-500">Features:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.features.slice(0, 3).map((feature) => (
                              <Badge key={feature} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {template.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {/* Blank Template Option */}
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-slate-300"
                onClick={() => {
                  const blankWorkflow: WorkflowDefinition = {
                    id: `wf_${Date.now()}`,
                    name: 'New Workflow',
                    description: '',
                    version: '1.0.0',
                    status: 'draft',
                    steps: [],
                    triggers: [],
                    variables: [],
                    smart_code: 'HERA.WORKFLOW.CUSTOM.v1'
                  }
                  setWorkflows(prev => [...prev, blankWorkflow])
                  setSelectedWorkflow(blankWorkflow)
                  setActiveView('design')
                  setShowTemplateDialog(false)
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Plus className="text-slate-600" size={20} />
                    </div>
                    <CardTitle className="text-lg">Blank Workflow</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-slate-600">
                    Start from scratch and design your own custom workflow
                  </p>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default UniversalWorkflowPage