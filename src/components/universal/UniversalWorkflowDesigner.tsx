'use client'

/**
 * Universal Workflow Designer Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.WORKFLOW_DESIGNER.v1
 * 
 * Visual workflow designer with drag-and-drop interface:
 * - Node-based workflow builder
 * - Drag & drop workflow steps
 * - Connection management between steps
 * - Step configuration and validation
 * - Conditional logic and branching
 * - Mobile-first responsive design
 * - Real-time validation and preview
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { 
  Play,
  Pause,
  Square,
  GitBranch,
  Settings,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  ArrowDown,
  Diamond,
  Circle,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Mail,
  Webhook,
  Database,
  Zap,
  Filter,
  RotateCcw,
  Save,
  Eye,
  Code,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export interface WorkflowStep {
  id: string
  type: string
  name: string
  description?: string
  position: { x: number; y: number }
  config: Record<string, any>
  connections: Array<{
    to_step_id: string
    condition?: string
    label?: string
  }>
  validation_errors?: string[]
  metadata?: Record<string, any>
}

export interface WorkflowDefinition {
  id?: string
  name: string
  description?: string
  version: string
  status: 'draft' | 'active' | 'deprecated'
  steps: WorkflowStep[]
  triggers: Array<{
    type: string
    config: Record<string, any>
  }>
  variables: Array<{
    name: string
    type: string
    default_value?: any
    required: boolean
  }>
  smart_code: string
  metadata?: Record<string, any>
}

interface WorkflowStepType {
  id: string
  name: string
  category: string
  icon: React.ComponentType<any>
  color: string
  description: string
  config_schema: Array<{
    field: string
    type: string
    label: string
    required?: boolean
    options?: string[]
    default?: any
  }>
  supports_conditions: boolean
  max_connections: number
}

interface UniversalWorkflowDesignerProps {
  workflow: WorkflowDefinition
  stepTypes: WorkflowStepType[]
  onChange: (workflow: WorkflowDefinition) => void
  onValidation?: (errors: string[]) => void
  readonly?: boolean
  showValidation?: boolean
  className?: string
}

const defaultStepTypes: WorkflowStepType[] = [
  {
    id: 'start',
    name: 'Start',
    category: 'Control',
    icon: Play,
    color: 'bg-green-500',
    description: 'Workflow entry point',
    config_schema: [],
    supports_conditions: false,
    max_connections: 1
  },
  {
    id: 'end',
    name: 'End',
    category: 'Control',
    icon: Square,
    color: 'bg-red-500',
    description: 'Workflow completion point',
    config_schema: [],
    supports_conditions: false,
    max_connections: 0
  },
  {
    id: 'user_task',
    name: 'User Task',
    category: 'Human',
    icon: User,
    color: 'bg-blue-500',
    description: 'Task requiring human interaction',
    config_schema: [
      { field: 'assignee', type: 'select', label: 'Assignee', required: true },
      { field: 'form_id', type: 'text', label: 'Form ID' },
      { field: 'due_date', type: 'date', label: 'Due Date' }
    ],
    supports_conditions: true,
    max_connections: 3
  },
  {
    id: 'approval',
    name: 'Approval',
    category: 'Human',
    icon: CheckCircle,
    color: 'bg-purple-500',
    description: 'Approval decision point',
    config_schema: [
      { field: 'approver', type: 'select', label: 'Approver', required: true },
      { field: 'approval_type', type: 'select', label: 'Type', options: ['simple', 'multi-level'], default: 'simple' }
    ],
    supports_conditions: true,
    max_connections: 2
  },
  {
    id: 'condition',
    name: 'Decision',
    category: 'Logic',
    icon: Diamond,
    color: 'bg-yellow-500',
    description: 'Conditional branching point',
    config_schema: [
      { field: 'condition_expression', type: 'textarea', label: 'Condition', required: true },
      { field: 'condition_type', type: 'select', label: 'Type', options: ['javascript', 'rule'], default: 'rule' }
    ],
    supports_conditions: true,
    max_connections: 5
  },
  {
    id: 'notification',
    name: 'Notification',
    category: 'Communication',
    icon: Mail,
    color: 'bg-cyan-500',
    description: 'Send notification to users',
    config_schema: [
      { field: 'recipients', type: 'text', label: 'Recipients', required: true },
      { field: 'template', type: 'select', label: 'Template' },
      { field: 'channel', type: 'select', label: 'Channel', options: ['email', 'sms', 'push'], default: 'email' }
    ],
    supports_conditions: false,
    max_connections: 1
  },
  {
    id: 'api_call',
    name: 'API Call',
    category: 'Integration',
    icon: Webhook,
    color: 'bg-orange-500',
    description: 'Call external API',
    config_schema: [
      { field: 'url', type: 'text', label: 'API URL', required: true },
      { field: 'method', type: 'select', label: 'Method', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'POST' },
      { field: 'headers', type: 'textarea', label: 'Headers (JSON)' },
      { field: 'payload', type: 'textarea', label: 'Request Body' }
    ],
    supports_conditions: true,
    max_connections: 2
  },
  {
    id: 'data_transform',
    name: 'Data Transform',
    category: 'Processing',
    icon: Database,
    color: 'bg-indigo-500',
    description: 'Transform or process data',
    config_schema: [
      { field: 'input_fields', type: 'textarea', label: 'Input Fields', required: true },
      { field: 'transform_script', type: 'textarea', label: 'Transform Script', required: true },
      { field: 'output_fields', type: 'textarea', label: 'Output Fields' }
    ],
    supports_conditions: false,
    max_connections: 1
  }
]

export function UniversalWorkflowDesigner({
  workflow,
  stepTypes = defaultStepTypes,
  onChange,
  onValidation,
  readonly = false,
  showValidation = true,
  className = ''
}: UniversalWorkflowDesignerProps) {
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  const [draggedStepType, setDraggedStepType] = useState<WorkflowStepType | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [connectionMode, setConnectionMode] = useState<{ from: string } | null>(null)
  const [showStepConfig, setShowStepConfig] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Validate workflow
  const validationErrors = useMemo(() => {
    const errors: string[] = []

    // Check for start step
    const startSteps = workflow.steps.filter(step => step.type === 'start')
    if (startSteps.length === 0) {
      errors.push('Workflow must have a start step')
    } else if (startSteps.length > 1) {
      errors.push('Workflow can only have one start step')
    }

    // Check for end step
    const endSteps = workflow.steps.filter(step => step.type === 'end')
    if (endSteps.length === 0) {
      errors.push('Workflow must have at least one end step')
    }

    // Check for orphaned steps
    const connectedStepIds = new Set<string>()
    workflow.steps.forEach(step => {
      step.connections.forEach(conn => {
        connectedStepIds.add(conn.to_step_id)
      })
    })

    const orphanedSteps = workflow.steps.filter(step => 
      step.type !== 'start' && !connectedStepIds.has(step.id)
    )
    if (orphanedSteps.length > 0) {
      errors.push(`${orphanedSteps.length} orphaned step(s) found`)
    }

    // Check for invalid connections
    workflow.steps.forEach(step => {
      step.connections.forEach(conn => {
        const targetStep = workflow.steps.find(s => s.id === conn.to_step_id)
        if (!targetStep) {
          errors.push(`Invalid connection from ${step.name} to non-existent step`)
        }
      })
    })

    // Check step configurations
    workflow.steps.forEach(step => {
      const stepType = stepTypes.find(st => st.id === step.type)
      if (stepType) {
        stepType.config_schema.forEach(field => {
          if (field.required && !step.config[field.field]) {
            errors.push(`${step.name}: ${field.label} is required`)
          }
        })
      }
    })

    return errors
  }, [workflow.steps, stepTypes])

  // Update validation errors
  React.useEffect(() => {
    onValidation?.(validationErrors)
  }, [validationErrors, onValidation])

  // Add new step to canvas
  const addStep = useCallback((stepType: WorkflowStepType, position: { x: number; y: number }) => {
    if (readonly) return

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: stepType.id,
      name: `${stepType.name} ${workflow.steps.length + 1}`,
      position,
      config: {},
      connections: []
    }

    // Set default config values
    stepType.config_schema.forEach(field => {
      if (field.default !== undefined) {
        newStep.config[field.field] = field.default
      }
    })

    const updatedWorkflow = {
      ...workflow,
      steps: [...workflow.steps, newStep]
    }

    onChange(updatedWorkflow)
  }, [workflow, onChange, readonly])

  // Update step
  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    if (readonly) return

    const updatedWorkflow = {
      ...workflow,
      steps: workflow.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }

    onChange(updatedWorkflow)
  }, [workflow, onChange, readonly])

  // Delete step
  const deleteStep = useCallback((stepId: string) => {
    if (readonly) return

    const updatedWorkflow = {
      ...workflow,
      steps: workflow.steps
        .filter(step => step.id !== stepId)
        .map(step => ({
          ...step,
          connections: step.connections.filter(conn => conn.to_step_id !== stepId)
        }))
    }

    onChange(updatedWorkflow)
    setSelectedStep(null)
  }, [workflow, onChange, readonly])

  // Add connection between steps
  const addConnection = useCallback((fromStepId: string, toStepId: string, condition?: string) => {
    if (readonly) return

    const fromStep = workflow.steps.find(step => step.id === fromStepId)
    const stepType = stepTypes.find(st => st.id === fromStep?.type)
    
    if (!fromStep || !stepType) return
    if (fromStep.connections.length >= stepType.max_connections) return

    const updatedWorkflow = {
      ...workflow,
      steps: workflow.steps.map(step =>
        step.id === fromStepId
          ? {
              ...step,
              connections: [...step.connections, {
                to_step_id: toStepId,
                condition,
                label: condition ? 'Yes' : undefined
              }]
            }
          : step
      )
    }

    onChange(updatedWorkflow)
    setConnectionMode(null)
  }, [workflow, stepTypes, onChange, readonly])

  // Handle canvas drop
  const handleCanvasDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    
    if (!draggedStepType || readonly || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const position = {
      x: (event.clientX - rect.left - panOffset.x) / zoom,
      y: (event.clientY - rect.top - panOffset.y) / zoom
    }

    addStep(draggedStepType, position)
    setDraggedStepType(null)
  }, [draggedStepType, readonly, panOffset, zoom, addStep])

  // Handle canvas drag over
  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  // Handle step click
  const handleStepClick = useCallback((step: WorkflowStep) => {
    if (connectionMode) {
      if (connectionMode.from !== step.id) {
        addConnection(connectionMode.from, step.id)
      }
    } else {
      setSelectedStep(step)
      setShowStepConfig(true)
    }
  }, [connectionMode, addConnection])

  // Get step icon and color
  const getStepAppearance = useCallback((stepTypeId: string) => {
    const stepType = stepTypes.find(st => st.id === stepTypeId)
    return {
      Icon: stepType?.icon || Circle,
      color: stepType?.color || 'bg-gray-500'
    }
  }, [stepTypes])

  // Render workflow step
  const renderStep = useCallback((step: WorkflowStep) => {
    const { Icon, color } = getStepAppearance(step.type)
    const isSelected = selectedStep?.id === step.id
    const hasErrors = step.validation_errors && step.validation_errors.length > 0

    return (
      <div
        key={step.id}
        className={cn(
          "absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group",
          isSelected && "z-10"
        )}
        style={{
          left: step.position.x * zoom + panOffset.x,
          top: step.position.y * zoom + panOffset.y,
          transform: `translate(-50%, -50%) scale(${zoom})`
        }}
        onClick={() => handleStepClick(step)}
      >
        <div
          className={cn(
            "relative p-4 rounded-xl shadow-lg border-2 transition-all",
            "min-w-[120px] text-center",
            isSelected ? "border-blue-500 shadow-xl" : "border-white",
            hasErrors ? "border-red-500" : "",
            connectionMode ? "hover:border-green-500" : "hover:border-blue-300",
            color
          )}
        >
          {/* Step Icon */}
          <div className="flex justify-center mb-2">
            <Icon className="text-white" size={24} />
          </div>

          {/* Step Name */}
          <div className="text-white font-medium text-sm mb-1">
            {step.name}
          </div>

          {/* Step Type */}
          <div className="text-white/80 text-xs">
            {stepTypes.find(st => st.id === step.type)?.name}
          </div>

          {/* Error Indicator */}
          {hasErrors && (
            <div className="absolute -top-2 -right-2">
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-white" size={12} />
              </div>
            </div>
          )}

          {/* Connection Indicator */}
          {connectionMode?.from === step.id && (
            <div className="absolute -top-2 -left-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <ArrowRight className="text-white" size={12} />
              </div>
            </div>
          )}

          {/* Context Menu */}
          {!readonly && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-6 h-6 p-0 bg-white/20 hover:bg-white/40">
                    <Settings size={12} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setConnectionMode({ from: step.id })}>
                    <ArrowRight size={14} className="mr-2" />
                    Connect
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const newStep = { ...step, id: `step_${Date.now()}`, position: { x: step.position.x + 100, y: step.position.y + 50 } }
                    const updatedWorkflow = { ...workflow, steps: [...workflow.steps, newStep] }
                    onChange(updatedWorkflow)
                  }}>
                    <Copy size={14} className="mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => deleteStep(step.id)}
                    className="text-red-600"
                  >
                    <Trash2 size={14} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    )
  }, [
    selectedStep,
    connectionMode,
    stepTypes,
    zoom,
    panOffset,
    handleStepClick,
    readonly,
    deleteStep,
    workflow,
    onChange,
    getStepAppearance
  ])

  // Render connections
  const renderConnections = useCallback(() => {
    return workflow.steps.flatMap(step =>
      step.connections.map((connection, index) => {
        const fromStep = step
        const toStep = workflow.steps.find(s => s.id === connection.to_step_id)
        
        if (!toStep) return null

        const startX = fromStep.position.x * zoom + panOffset.x
        const startY = fromStep.position.y * zoom + panOffset.y
        const endX = toStep.position.x * zoom + panOffset.x
        const endY = toStep.position.y * zoom + panOffset.y

        // Calculate arrow path
        const deltaX = endX - startX
        const deltaY = endY - startY
        const controlX1 = startX + deltaX * 0.5
        const controlY1 = startY
        const controlX2 = startX + deltaX * 0.5
        const controlY2 = endY

        const pathData = `M ${startX} ${startY} C ${controlX1} ${controlY1} ${controlX2} ${controlY2} ${endX} ${endY}`

        return (
          <g key={`${step.id}-${connection.to_step_id}-${index}`}>
            {/* Connection Path */}
            <path
              d={pathData}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="transition-colors hover:stroke-blue-700"
            />
            
            {/* Connection Label */}
            {connection.label && (
              <text
                x={(startX + endX) / 2}
                y={(startY + endY) / 2 - 10}
                textAnchor="middle"
                className="text-xs fill-slate-600 font-medium bg-white"
                style={{ paintOrder: 'stroke fill', stroke: 'white', strokeWidth: '3px' }}
              >
                {connection.label}
              </text>
            )}
          </g>
        )
      })
    ).filter(Boolean)
  }, [workflow.steps, zoom, panOffset])

  return (
    <div className={cn("flex h-full bg-slate-50", className)}>
      {/* Step Palette */}
      <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="p-4">
          <h3 className="font-medium text-slate-900 mb-4">Workflow Steps</h3>
          
          {Object.entries(
            stepTypes.reduce((acc, stepType) => {
              if (!acc[stepType.category]) acc[stepType.category] = []
              acc[stepType.category].push(stepType)
              return acc
            }, {} as Record<string, WorkflowStepType[]>)
          ).map(([category, types]) => (
            <div key={category} className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 mb-2">{category}</h4>
              <div className="space-y-1">
                {types.map((stepType) => {
                  const Icon = stepType.icon
                  return (
                    <div
                      key={stepType.id}
                      draggable={!readonly}
                      onDragStart={() => setDraggedStepType(stepType)}
                      onDragEnd={() => setDraggedStepType(null)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer",
                        "hover:bg-slate-100 active:bg-slate-200",
                        readonly && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className={cn("p-2 rounded-lg", stepType.color)}>
                        <Icon className="text-white" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{stepType.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {stepType.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setZoom(zoom * 1.2)}>
            <Plus size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(zoom * 0.8)}>
            <ArrowDown size={14} />
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setZoom(1)
            setPanOffset({ x: 0, y: 0 })
          }}>
            <RotateCcw size={14} />
          </Button>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            {Math.round(zoom * 100)}%
          </Badge>
        </div>

        {/* Validation Status */}
        {showValidation && validationErrors.length > 0 && (
          <div className="absolute top-4 right-4 z-20">
            <Alert className="w-80 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-1">Validation Issues:</div>
                <ul className="text-xs space-y-1">
                  {validationErrors.slice(0, 3).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {validationErrors.length > 3 && (
                    <li>• ...and {validationErrors.length - 3} more</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Connection Mode Indicator */}
        {connectionMode && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <Alert className="border-green-200 bg-green-50">
              <ArrowRight className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Select a target step to create connection
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setConnectionMode(null)}
                  className="ml-2 h-6 px-2"
                >
                  Cancel
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(0,0,0,0.1) 1px, transparent 0)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
          }}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {/* SVG for connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
            </defs>
            {renderConnections()}
          </svg>

          {/* Workflow Steps */}
          {workflow.steps.map(renderStep)}

          {/* Empty State */}
          {workflow.steps.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <GitBranch className="mx-auto mb-4 text-slate-300" size={64} />
                <h3 className="text-lg font-medium mb-2">Start Building Your Workflow</h3>
                <p className="text-sm">
                  Drag steps from the palette to begin designing your workflow
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Configuration Dialog */}
      {selectedStep && showStepConfig && (
        <Dialog open={showStepConfig} onOpenChange={setShowStepConfig}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure Step: {selectedStep.name}</DialogTitle>
            </DialogHeader>
            <WorkflowStepConfigForm
              step={selectedStep}
              stepType={stepTypes.find(st => st.id === selectedStep.type)!}
              onSave={(updatedStep) => {
                updateStep(selectedStep.id, updatedStep)
                setShowStepConfig(false)
                setSelectedStep(null)
              }}
              onCancel={() => {
                setShowStepConfig(false)
                setSelectedStep(null)
              }}
              readonly={readonly}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Step Configuration Form Component
interface WorkflowStepConfigFormProps {
  step: WorkflowStep
  stepType: WorkflowStepType
  onSave: (step: WorkflowStep) => void
  onCancel: () => void
  readonly: boolean
}

function WorkflowStepConfigForm({
  step,
  stepType,
  onSave,
  onCancel,
  readonly
}: WorkflowStepConfigFormProps) {
  const [formData, setFormData] = useState(step)

  const handleSave = () => {
    onSave(formData)
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }))
  }

  const updateBasicField = (field: keyof WorkflowStep, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="font-medium">Basic Information</h3>
        
        <div>
          <Label htmlFor="step_name">Step Name</Label>
          <Input
            id="step_name"
            value={formData.name}
            onChange={(e) => updateBasicField('name', e.target.value)}
            disabled={readonly}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="step_description">Description</Label>
          <Textarea
            id="step_description"
            value={formData.description || ''}
            onChange={(e) => updateBasicField('description', e.target.value)}
            disabled={readonly}
            className="mt-1"
            rows={3}
          />
        </div>
      </div>

      {/* Step-Specific Configuration */}
      {stepType.config_schema.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Configuration</h3>
          
          {stepType.config_schema.map((field) => (
            <div key={field.field}>
              <Label htmlFor={field.field}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {field.type === 'text' && (
                <Input
                  id={field.field}
                  value={formData.config[field.field] || ''}
                  onChange={(e) => updateField(field.field, e.target.value)}
                  disabled={readonly}
                  className="mt-1"
                />
              )}
              
              {field.type === 'textarea' && (
                <Textarea
                  id={field.field}
                  value={formData.config[field.field] || ''}
                  onChange={(e) => updateField(field.field, e.target.value)}
                  disabled={readonly}
                  className="mt-1"
                  rows={4}
                />
              )}
              
              {field.type === 'select' && field.options && (
                <Select
                  value={formData.config[field.field] || ''}
                  onValueChange={(value) => updateField(field.field, value)}
                  disabled={readonly}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {field.type === 'date' && (
                <Input
                  id={field.field}
                  type="date"
                  value={formData.config[field.field] || ''}
                  onChange={(e) => updateField(field.field, e.target.value)}
                  disabled={readonly}
                  className="mt-1"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        {!readonly && (
          <Button onClick={handleSave}>
            <Save size={16} className="mr-1" />
            Save Configuration
          </Button>
        )}
      </div>
    </div>
  )
}

export default UniversalWorkflowDesigner