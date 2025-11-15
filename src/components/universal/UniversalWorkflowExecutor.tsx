'use client'

/**
 * Universal Workflow Executor Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.WORKFLOW_EXECUTOR.v1
 * 
 * Workflow execution and monitoring interface with:
 * - Real-time execution tracking
 * - Step-by-step progress visualization
 * - User task completion interface
 * - Approval workflow handling
 * - Error handling and retry mechanisms
 * - Execution history and audit trail
 * - Mobile-first responsive design
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { 
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Calendar,
  Timer,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckSquare,
  XCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { WorkflowDefinition, WorkflowStep } from './UniversalWorkflowDesigner'
import { cn } from '@/lib/utils'

export interface WorkflowExecution {
  id: string
  workflow_id: string
  workflow_version: string
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled'
  progress: number
  started_at: string
  completed_at?: string
  started_by: string
  context: Record<string, any>
  current_step_id?: string
  step_executions: StepExecution[]
  error_message?: string
  metadata?: Record<string, any>
}

export interface StepExecution {
  id: string
  step_id: string
  step_name: string
  step_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  started_at?: string
  completed_at?: string
  assignee_id?: string
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  error_message?: string
  retry_count: number
  user_actions?: UserAction[]
  metadata?: Record<string, any>
}

export interface UserAction {
  id: string
  action_type: 'approve' | 'reject' | 'comment' | 'submit' | 'request_changes'
  user_id: string
  user_name: string
  comment?: string
  data?: Record<string, any>
  created_at: string
}

export interface WorkflowTask {
  id: string
  execution_id: string
  step_execution_id: string
  task_type: 'user_task' | 'approval' | 'review'
  title: string
  description: string
  assignee_id: string
  due_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  form_data?: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'urgent'
  metadata?: Record<string, any>
}

interface UniversalWorkflowExecutorProps {
  execution: WorkflowExecution
  workflow: WorkflowDefinition
  userTasks?: WorkflowTask[]
  currentUserId: string
  onExecutionAction?: (action: 'start' | 'pause' | 'resume' | 'cancel' | 'retry', executionId: string) => Promise<void>
  onTaskAction?: (taskId: string, action: UserAction) => Promise<void>
  onRefresh?: () => Promise<void>
  readonly?: boolean
  showExecutionHistory?: boolean
  className?: string
}

export function UniversalWorkflowExecutor({
  execution,
  workflow,
  userTasks = [],
  currentUserId,
  onExecutionAction,
  onTaskAction,
  onRefresh,
  readonly = false,
  showExecutionHistory = true,
  className = ''
}: UniversalWorkflowExecutorProps) {
  const [selectedStep, setSelectedStep] = useState<StepExecution | null>(null)
  const [activeTask, setActiveTask] = useState<WorkflowTask | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['progress']))

  // Get current user's tasks
  const myTasks = useMemo(() => {
    return userTasks.filter(task => task.assignee_id === currentUserId)
  }, [userTasks, currentUserId])

  // Get execution statistics
  const executionStats = useMemo(() => {
    const total = execution.step_executions.length
    const completed = execution.step_executions.filter(s => s.status === 'completed').length
    const failed = execution.step_executions.filter(s => s.status === 'failed').length
    const running = execution.step_executions.filter(s => s.status === 'running').length
    const pending = execution.step_executions.filter(s => s.status === 'pending').length

    const duration = execution.completed_at 
      ? new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()
      : Date.now() - new Date(execution.started_at).getTime()

    return {
      total,
      completed,
      failed,
      running,
      pending,
      duration: Math.floor(duration / 1000), // seconds
      success_rate: total > 0 ? (completed / total) * 100 : 0
    }
  }, [execution])

  // Handle execution actions
  const handleExecutionAction = useCallback(async (action: 'start' | 'pause' | 'resume' | 'cancel' | 'retry') => {
    if (!onExecutionAction) return
    
    try {
      await onExecutionAction(action, execution.id)
    } catch (error) {
      console.error('Execution action failed:', error)
    }
  }, [onExecutionAction, execution.id])

  // Handle task action
  const handleTaskAction = useCallback(async (task: WorkflowTask, actionType: UserAction['action_type'], comment?: string, data?: Record<string, any>) => {
    if (!onTaskAction) return

    const action: UserAction = {
      id: `action_${Date.now()}`,
      action_type: actionType,
      user_id: currentUserId,
      user_name: 'Current User', // Should be resolved from user context
      comment,
      data,
      created_at: new Date().toISOString()
    }

    try {
      await onTaskAction(task.id, action)
      setActiveTask(null)
    } catch (error) {
      console.error('Task action failed:', error)
    }
  }, [onTaskAction, currentUserId])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return

    setIsRefreshing(true)
    try {
      await onRefresh()
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }, [])

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }, [])

  // Get status color and icon
  const getStatusAppearance = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle }
      case 'running':
        return { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Activity }
      case 'failed':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle }
      case 'paused':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Pause }
      case 'cancelled':
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: Square }
      case 'pending':
        return { color: 'text-slate-600', bgColor: 'bg-slate-50', icon: Clock }
      default:
        return { color: 'text-slate-600', bgColor: 'bg-slate-50', icon: Clock }
    }
  }, [])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Execution Header */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={20} className="text-blue-600" />
                  {workflow.name} - Execution #{execution.id.slice(-6)}
                </CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Started {new Date(execution.started_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  className={cn(
                    "px-3 py-1",
                    getStatusAppearance(execution.status).color,
                    getStatusAppearance(execution.status).bgColor
                  )}
                >
                  {React.createElement(getStatusAppearance(execution.status).icon, { size: 14, className: "mr-1" })}
                  {execution.status.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  v{execution.workflow_version}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
              </Button>
              
              {!readonly && execution.status === 'running' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecutionAction('pause')}
                >
                  <Pause size={14} className="mr-1" />
                  Pause
                </Button>
              )}
              
              {!readonly && execution.status === 'paused' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecutionAction('resume')}
                >
                  <Play size={14} className="mr-1" />
                  Resume
                </Button>
              )}
              
              {!readonly && execution.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExecutionAction('retry')}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Progress Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">{executionStats.total}</div>
              <div className="text-xs text-slate-600">Total Steps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{executionStats.completed}</div>
              <div className="text-xs text-slate-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{executionStats.running}</div>
              <div className="text-xs text-slate-600">Running</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{executionStats.failed}</div>
              <div className="text-xs text-slate-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">{formatDuration(executionStats.duration)}</div>
              <div className="text-xs text-slate-600">Duration</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Overall Progress</span>
              <span className="font-medium">{Math.round(execution.progress)}%</span>
            </div>
            <Progress value={execution.progress} className="h-3" />
          </div>

          {/* Error Message */}
          {execution.error_message && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {execution.error_message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* My Tasks */}
      {myTasks.length > 0 && (
        <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
          <CardHeader>
            <Collapsible 
              open={expandedSections.has('tasks')} 
              onOpenChange={() => toggleSection('tasks')}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center gap-2">
                  <User size={20} className="text-purple-600" />
                  My Tasks ({myTasks.length})
                </CardTitle>
                {expandedSections.has('tasks') ? 
                  <ChevronDown size={20} /> : 
                  <ChevronRight size={20} />
                }
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => setActiveTask(task)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{task.title}</h4>
                              <Badge 
                                variant={task.priority === 'urgent' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {task.task_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                <Calendar size={12} />
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              Open Task
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      )}

      {/* Step Execution Timeline */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <Collapsible 
            open={expandedSections.has('progress')} 
            onOpenChange={() => toggleSection('progress')}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                Step Progress ({executionStats.completed}/{executionStats.total})
              </CardTitle>
              {expandedSections.has('progress') ? 
                <ChevronDown size={20} /> : 
                <ChevronRight size={20} />
              }
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {execution.step_executions.map((stepExecution, index) => {
                    const workflowStep = workflow.steps.find(s => s.id === stepExecution.step_id)
                    const isSelected = selectedStep?.id === stepExecution.id
                    const { color, bgColor, icon: StatusIcon } = getStatusAppearance(stepExecution.status)

                    return (
                      <div
                        key={stepExecution.id}
                        className={cn(
                          "relative p-4 border rounded-lg transition-all cursor-pointer",
                          isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:border-slate-300",
                          stepExecution.status === 'failed' && "border-red-200 bg-red-50"
                        )}
                        onClick={() => setSelectedStep(stepExecution)}
                      >
                        {/* Connection Line */}
                        {index < execution.step_executions.length - 1 && (
                          <div className="absolute left-6 bottom-0 w-0.5 h-4 bg-slate-200 transform translate-y-full" />
                        )}

                        <div className="flex items-center gap-4">
                          {/* Status Icon */}
                          <div className={cn("p-2 rounded-lg", bgColor)}>
                            <StatusIcon className={color} size={20} />
                          </div>

                          {/* Step Information */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-slate-900">{stepExecution.step_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {stepExecution.step_type.replace('_', ' ')}
                              </Badge>
                              {stepExecution.retry_count > 0 && (
                                <Badge variant="outline" className="text-xs text-amber-600">
                                  Retry #{stepExecution.retry_count}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                              {stepExecution.started_at && (
                                <div className="flex items-center gap-1">
                                  <Clock size={12} />
                                  Started: {new Date(stepExecution.started_at).toLocaleTimeString()}
                                </div>
                              )}
                              
                              {stepExecution.completed_at && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  Completed: {new Date(stepExecution.completed_at).toLocaleTimeString()}
                                </div>
                              )}
                              
                              {stepExecution.assignee_id && (
                                <div className="flex items-center gap-1">
                                  <User size={12} />
                                  Assigned to user
                                </div>
                              )}
                            </div>

                            {/* Error Message */}
                            {stepExecution.error_message && (
                              <div className="text-sm text-red-600 mt-2">
                                <AlertTriangle size={12} className="inline mr-1" />
                                {stepExecution.error_message}
                              </div>
                            )}

                            {/* User Actions */}
                            {stepExecution.user_actions && stepExecution.user_actions.length > 0 && (
                              <div className="mt-2">
                                <div className="text-xs text-slate-500 mb-1">User Actions:</div>
                                <div className="space-y-1">
                                  {stepExecution.user_actions.slice(-2).map((action) => (
                                    <div key={action.id} className="text-xs bg-slate-100 rounded p-2">
                                      <span className="font-medium">{action.user_name}</span>
                                      <span className="ml-1 text-slate-600">{action.action_type}</span>
                                      {action.comment && (
                                        <div className="text-slate-700 mt-1">"{action.comment}"</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Duration */}
                          <div className="text-right text-sm text-slate-600">
                            {stepExecution.started_at && stepExecution.completed_at && (
                              <div>
                                {formatDuration(
                                  Math.floor(
                                    (new Date(stepExecution.completed_at).getTime() - 
                                     new Date(stepExecution.started_at).getTime()) / 1000
                                  )
                                )}
                              </div>
                            )}
                            {stepExecution.status === 'running' && stepExecution.started_at && (
                              <div className="text-blue-600">
                                {formatDuration(
                                  Math.floor(
                                    (Date.now() - new Date(stepExecution.started_at).getTime()) / 1000
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Task Action Dialog */}
      {activeTask && (
        <Dialog open={!!activeTask} onOpenChange={() => setActiveTask(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{activeTask.title}</DialogTitle>
            </DialogHeader>
            <WorkflowTaskForm
              task={activeTask}
              onAction={handleTaskAction}
              onCancel={() => setActiveTask(null)}
              readonly={readonly}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Task Form Component
interface WorkflowTaskFormProps {
  task: WorkflowTask
  onAction: (task: WorkflowTask, action: UserAction['action_type'], comment?: string, data?: Record<string, any>) => Promise<void>
  onCancel: () => void
  readonly: boolean
}

function WorkflowTaskForm({ task, onAction, onCancel, readonly }: WorkflowTaskFormProps) {
  const [comment, setComment] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>(task.form_data || {})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAction = useCallback(async (actionType: UserAction['action_type']) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAction(task, actionType, comment || undefined, formData)
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [task, onAction, comment, formData, isSubmitting])

  return (
    <div className="space-y-6">
      {/* Task Information */}
      <div>
        <div className="text-sm text-slate-600 mb-2">Task Description:</div>
        <div className="p-3 bg-slate-50 rounded-lg">
          {task.description}
        </div>
      </div>

      {/* Form Fields */}
      {task.task_type === 'user_task' && (
        <div className="space-y-4">
          <h3 className="font-medium">Required Information</h3>
          
          {/* Example form fields - would be dynamic based on task configuration */}
          <div>
            <Label htmlFor="task_response">Response</Label>
            <Textarea
              id="task_response"
              value={formData.response || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
              placeholder="Enter your response..."
              disabled={readonly}
              className="mt-1"
              rows={4}
            />
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <Label htmlFor="comment">Comments (optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any additional comments..."
          disabled={readonly}
          className="mt-1"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        {!readonly && (
          <>
            {task.task_type === 'approval' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleAction('reject')}
                  disabled={isSubmitting}
                  className="text-red-600 hover:text-red-700"
                >
                  {isSubmitting ? (
                    <RefreshCw size={16} className="mr-1 animate-spin" />
                  ) : (
                    <ThumbsDown size={16} className="mr-1" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={() => handleAction('approve')}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <RefreshCw size={16} className="mr-1 animate-spin" />
                  ) : (
                    <ThumbsUp size={16} className="mr-1" />
                  )}
                  Approve
                </Button>
              </>
            )}
            
            {task.task_type === 'user_task' && (
              <Button
                onClick={() => handleAction('submit')}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <RefreshCw size={16} className="mr-1 animate-spin" />
                ) : (
                  <CheckSquare size={16} className="mr-1" />
                )}
                Submit
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UniversalWorkflowExecutor