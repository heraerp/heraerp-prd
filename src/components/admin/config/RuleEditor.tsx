'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Textarea } from '@/src/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Switch } from '@/src/components/ui/switch'
import {
  Save,
  X,
  Code2,
  TestTube,
  AlertTriangle,
  Info,
  Settings,
  Zap,
  Target,
  Shield,
  Database,
  Workflow,
  Plus
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { Alert, AlertDescription } from '@/src/components/ui/alert'

interface ConfigRule {
  id?: string
  name: string
  category: string
  type: 'validation' | 'transformation' | 'business_logic' | 'integration'
  scope: 'global' | 'organization' | 'entity_type' | 'specific'
  status: 'active' | 'inactive' | 'draft' | 'deprecated'
  priority: number
  description: string
  smart_code: string
  conditions: Array<{
    field: string
    operator: string
    value: string
    logic?: 'AND' | 'OR'
  }>
  actions: Array<{
    type: string
    target: string
    value: string
    parameters?: Record<string, any>
  }>
  configuration: {
    timeout_ms?: number
    retry_count?: number
    failure_action?: 'stop' | 'continue' | 'rollback'
    notification_enabled?: boolean
    logging_level?: 'none' | 'basic' | 'detailed'
  }
  validation_schema?: Record<string, any>
  organization_id?: string
}

interface RuleEditorProps {
  rule?: ConfigRule
  onSave: (rule: ConfigRule) => void
  onCancel: () => void
  className?: string
}

export function RuleEditor({ rule, onSave, onCancel, className }: RuleEditorProps) {
  const [formData, setFormData] = useState<ConfigRule>(() => ({
    name: '',
    category: '',
    type: 'validation',
    scope: 'global',
    status: 'draft',
    priority: 5,
    description: '',
    smart_code: '',
    conditions: [{ field: '', operator: '==', value: '', logic: 'AND' }],
    actions: [{ type: 'validate', target: '', value: '' }],
    configuration: {
      timeout_ms: 5000,
      retry_count: 3,
      failure_action: 'stop',
      notification_enabled: true,
      logging_level: 'basic'
    },
    ...rule
  }))

  const [activeTab, setActiveTab] = useState('basic')
  const [isValidating, setIsValidating] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Available operators for conditions
  const operators = [
    { value: '==', label: 'Equals' },
    { value: '!=', label: 'Not Equals' },
    { value: '>', label: 'Greater Than' },
    { value: '<', label: 'Less Than' },
    { value: '>=', label: 'Greater or Equal' },
    { value: '<=', label: 'Less or Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'regex', label: 'Regex Match' },
    { value: 'in', label: 'In List' },
    { value: 'not_in', label: 'Not In List' }
  ]

  // Available action types
  const actionTypes = [
    { value: 'validate', label: 'Validate', icon: Shield },
    { value: 'transform', label: 'Transform', icon: Workflow },
    { value: 'calculate', label: 'Calculate', icon: Target },
    { value: 'notify', label: 'Notify', icon: AlertTriangle },
    { value: 'log', label: 'Log', icon: Database },
    { value: 'execute', label: 'Execute', icon: Zap }
  ]

  useEffect(() => {
    // Generate smart code automatically based on form data
    if (formData.name && formData.type && formData.category) {
      const nameCode = formData.name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '.')
      const typeCode = formData.type.toUpperCase().replace('_', '.')
      const categoryCode = formData.category
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '.')

      const smartCode = `HERA.${categoryCode}.${typeCode}.${nameCode}.v1`

      if (smartCode !== formData.smart_code) {
        setFormData(prev => ({ ...prev, smart_code: smartCode }))
      }
    }
  }, [formData.name, formData.type, formData.category])

  const handleInputChange = (field: keyof ConfigRule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConditionChange = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setFormData(prev => ({ ...prev, conditions: newConditions }))
  }

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: '==', value: '', logic: 'AND' }]
    }))
  }

  const removeCondition = (index: number) => {
    if (formData.conditions.length > 1) {
      const newConditions = formData.conditions.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, conditions: newConditions }))
    }
  }

  const handleActionChange = (index: number, field: string, value: any) => {
    const newActions = [...formData.actions]
    newActions[index] = { ...newActions[index], [field]: value }
    setFormData(prev => ({ ...prev, actions: newActions }))
  }

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'validate', target: '', value: '' }]
    }))
  }

  const removeAction = (index: number) => {
    if (formData.actions.length > 1) {
      const newActions = formData.actions.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, actions: newActions }))
    }
  }

  const handleConfigurationChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      configuration: { ...prev.configuration, [field]: value }
    }))
  }

  const validateForm = () => {
    const errors: string[] = []

    if (!formData.name.trim()) errors.push('Rule name is required')
    if (!formData.category.trim()) errors.push('Category is required')
    if (!formData.description.trim()) errors.push('Description is required')
    if (!formData.smart_code.trim()) errors.push('Smart code is required')
    if (formData.priority < 1 || formData.priority > 10) {
      errors.push('Priority must be between 1 and 10')
    }

    // Validate conditions
    formData.conditions.forEach((condition, index) => {
      if (!condition.field.trim()) {
        errors.push(`Condition ${index + 1}: Field is required`)
      }
      if (!condition.value.trim()) {
        errors.push(`Condition ${index + 1}: Value is required`)
      }
    })

    // Validate actions
    formData.actions.forEach((action, index) => {
      if (!action.target.trim()) {
        errors.push(`Action ${index + 1}: Target is required`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      setActiveTab('basic') // Switch to basic tab to show errors
      return
    }

    setIsValidating(true)
    try {
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSave(formData)
    } finally {
      setIsValidating(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'validation':
        return <Shield className="w-4 h-4" />
      case 'transformation':
        return <Workflow className="w-4 h-4" />
      case 'business_logic':
        return <Target className="w-4 h-4" />
      case 'integration':
        return <Zap className="w-4 h-4" />
      default:
        return <Settings className="w-4 h-4" />
    }
  }

  return (
    <div className={cn('max-w-6xl mx-auto space-y-6', className)}>
      {/* Header */}
      <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl !text-gray-100 dark:!text-gray-100 flex items-center gap-3">
                {getTypeIcon(formData.type)}
                {rule ? 'Pencil Configuration Rule' : 'Create Configuration Rule'}
              </CardTitle>
              <CardDescription className="!text-muted-foreground dark:!text-gray-300">
                Define rules that control system behavior and business logic
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isValidating}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-foreground shadow-lg"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Rule
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            <div className="font-semibold mb-2">Please fix the following errors:</div>
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">
                  • {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-background/50 dark:bg-background/50 backdrop-blur-xl">
          <TabsTrigger
            value="basic"
            className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
          >
            Basic Info
          </TabsTrigger>
          <TabsTrigger
            value="conditions"
            className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
          >
            Conditions
          </TabsTrigger>
          <TabsTrigger
            value="actions"
            className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
          >
            Actions
          </TabsTrigger>
          <TabsTrigger
            value="config"
            className="data-[state=active]:bg-background dark:data-[state=active]:bg-muted data-[state=active]:text-primary dark:data-[state=active]:text-blue-400"
          >
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="name"
                      className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                    >
                      Rule Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Customer Credit Limit Validation"
                      className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="category"
                      className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                    >
                      Category *
                    </Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={e => handleInputChange('category', e.target.value)}
                      placeholder="e.g., Customer Management"
                      className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="type"
                        className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                      >
                        Rule Type *
                      </Label>
                      <Select
                        value={formData.type}
                        onValueChange={value => handleInputChange('type', value)}
                      >
                        <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="validation">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-500" />
                              Validation
                            </div>
                          </SelectItem>
                          <SelectItem value="transformation">
                            <div className="flex items-center gap-2">
                              <Workflow className="w-4 h-4 text-purple-500" />
                              Transformation
                            </div>
                          </SelectItem>
                          <SelectItem value="business_logic">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-cyan-500" />
                              Business Logic
                            </div>
                          </SelectItem>
                          <SelectItem value="integration">
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-orange-500" />
                              Integration
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="scope"
                        className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                      >
                        Scope *
                      </Label>
                      <Select
                        value={formData.scope}
                        onValueChange={value => handleInputChange('scope', value)}
                      >
                        <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global (All Organizations)</SelectItem>
                          <SelectItem value="organization">Organization Specific</SelectItem>
                          <SelectItem value="entity_type">Entity Type Specific</SelectItem>
                          <SelectItem value="specific">Specific Entity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="status"
                        className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                      >
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={value => handleInputChange('status', value)}
                      >
                        <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Active
                            </Badge>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <Badge className="bg-muted text-gray-200 dark:bg-muted/30 dark:text-gray-300">
                              Inactive
                            </Badge>
                          </SelectItem>
                          <SelectItem value="draft">
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                              Draft
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="priority"
                        className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                      >
                        Priority (1-10)
                      </Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={e => handleInputChange('priority', parseInt(e.target.value) || 1)}
                        className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                    >
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this rule does and when it should be applied..."
                      className="min-h-[100px] bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="smart_code"
                      className="text-sm font-medium !text-gray-100 dark:!text-gray-100"
                    >
                      Smart Code
                    </Label>
                    <Input
                      id="smart_code"
                      value={formData.smart_code}
                      onChange={e => handleInputChange('smart_code', e.target.value)}
                      placeholder="HERA.CATEGORY.TYPE.NAME.v1"
                      className="font-mono text-sm bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                    />
                    <p className="text-xs !text-muted-foreground dark:!text-muted-foreground mt-1">
                      Auto-generated based on name, type, and category
                    </p>
                  </div>

                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-primary dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-300">
                      <div className="font-semibold">Rule Priority Guide:</div>
                      <div className="text-sm mt-1">
                        • Priority 1-3: Critical system rules
                        <br />
                        • Priority 4-6: Business logic rules
                        <br />• Priority 7-10: Optional enhancement rules
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="space-y-6">
          <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 !text-gray-100 dark:!text-gray-100">
                <TestTube className="w-5 h-5" />
                Rule Conditions
              </CardTitle>
              <CardDescription className="!text-muted-foreground dark:!text-gray-300">
                Define when this rule should be triggered based on data conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="p-4 border border-white/30 dark:border-border/30 rounded-lg bg-background/30 dark:bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium !text-gray-100 dark:!text-gray-100">
                      Condition {index + 1}
                    </h4>
                    {formData.conditions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Field
                      </Label>
                      <Input
                        value={condition.field}
                        onChange={e => handleConditionChange(index, 'field', e.target.value)}
                        placeholder="entity.field_name"
                        className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Operator
                      </Label>
                      <Select
                        value={condition.operator}
                        onValueChange={value => handleConditionChange(index, 'operator', value)}
                      >
                        <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Value
                      </Label>
                      <Input
                        value={condition.value}
                        onChange={e => handleConditionChange(index, 'value', e.target.value)}
                        placeholder="comparison value"
                        className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Logic
                      </Label>
                      <Select
                        value={condition.logic}
                        onValueChange={value => handleConditionChange(index, 'logic', value)}
                      >
                        <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AND">AND</SelectItem>
                          <SelectItem value="OR">OR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addCondition}
                className="w-full border-dashed border-2 border-blue-300 dark:border-blue-700 text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-900/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-6">
          <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 !text-gray-100 dark:!text-gray-100">
                <Zap className="w-5 h-5" />
                Rule Actions
              </CardTitle>
              <CardDescription className="!text-muted-foreground dark:!text-gray-300">
                Define what happens when the rule conditions are met
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.actions.map((action, index) => (
                <div
                  key={index}
                  className="p-4 border border-white/30 dark:border-border/30 rounded-lg bg-background/30 dark:bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium !text-gray-100 dark:!text-gray-100">
                      Action {index + 1}
                    </h4>
                    {formData.actions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Action Type
                      </Label>
                      <Select
                        value={action.type}
                        onValueChange={value => handleActionChange(index, 'type', value)}
                      >
                        <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {actionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Target
                      </Label>
                      <Input
                        value={action.target}
                        onChange={e => handleActionChange(index, 'target', e.target.value)}
                        placeholder="field or method to target"
                        className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Value
                      </Label>
                      <Input
                        value={action.value}
                        onChange={e => handleActionChange(index, 'value', e.target.value)}
                        placeholder="action value or expression"
                        className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addAction}
                className="w-full border-dashed border-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Action
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card className="bg-background/50 dark:bg-background/50 backdrop-blur-xl border-border/20 dark:border-border/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 !text-gray-100 dark:!text-gray-100">
                <Settings className="w-5 h-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription className="!text-muted-foreground dark:!text-gray-300">
                Configure execution settings and error handling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Execution Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium !text-gray-100 dark:!text-gray-100">
                    Execution Settings
                  </h3>

                  <div>
                    <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                      Timeout (ms)
                    </Label>
                    <Input
                      type="number"
                      value={formData.configuration.timeout_ms || 5000}
                      onChange={e =>
                        handleConfigurationChange('timeout_ms', parseInt(e.target.value))
                      }
                      className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                      Retry Count
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.configuration.retry_count || 3}
                      onChange={e =>
                        handleConfigurationChange('retry_count', parseInt(e.target.value))
                      }
                      className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                      Failure Action
                    </Label>
                    <Select
                      value={formData.configuration.failure_action}
                      onValueChange={value => handleConfigurationChange('failure_action', value)}
                    >
                      <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stop">Stop Processing</SelectItem>
                        <SelectItem value="continue">Continue with Warning</SelectItem>
                        <SelectItem value="rollback">Rollback Transaction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Monitoring Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium !text-gray-100 dark:!text-gray-100">
                    Monitoring & Logging
                  </h3>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                        Enable Notifications
                      </Label>
                      <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                        Send notifications on rule failures
                      </p>
                    </div>
                    <Switch
                      checked={formData.configuration.notification_enabled}
                      onCheckedChange={checked =>
                        handleConfigurationChange('notification_enabled', checked)
                      }
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium !text-gray-100 dark:!text-gray-100">
                      Logging Level
                    </Label>
                    <Select
                      value={formData.configuration.logging_level}
                      onValueChange={value => handleConfigurationChange('logging_level', value)}
                    >
                      <SelectTrigger className="bg-background/70 dark:bg-muted/70 border-white/30 dark:border-border/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Logging</SelectItem>
                        <SelectItem value="basic">Basic (Errors Only)</SelectItem>
                        <SelectItem value="detailed">Detailed (All Events)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-primary dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-800 dark:text-blue-300">
                          Performance Impact
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          Detailed logging may impact performance. Use basic logging for production
                          environments unless troubleshooting specific issues.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
