// ================================================================================
// TEMPLATE FORM - WHATSAPP MESSAGE TEMPLATES
// Smart Code: HERA.UI.WHATSAPP.TEMPLATE_FORM.v1
// Production-ready template creation and editing with validation and preview
// ================================================================================

'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  MessageSquare,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Eye,
  Wand2,
  FileText,
  Image,
  MousePointer
} from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  WaTemplate,
  validateTemplateVariables,
  renderTemplate,
  HERA_MSP_CONFIG
} from '@/lib/schemas/whatsapp'

interface TemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: WaTemplate | null
  onSubmit: (template: WaTemplate) => Promise<void>
  isSubmitting: boolean
}

export function TemplateForm({
  open,
  onOpenChange,
  template,
  onSubmit,
  isSubmitting
}: TemplateFormProps) {
  const [previewVariables, setPreviewVariables] = React.useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])
  const form = useForm<WaTemplate>({
    resolver: zodResolver(WaTemplate),
    defaultValues: template || {
      name: '',
      language: 'en',
      category: 'utility',
      body: '',
      variables: [],
      sample: {}
    }
  })
  const {
    fields: variableFields,
    append: appendVariable,
    remove: removeVariable
  } = useFieldArray({
    control: form.control,
    name: 'variables'
  })

  // Reset form when template changes
  React.useEffect(() => {
    if (open) {
      if (template) {
        form.reset(template)
        // Initialize preview variables with sample data
        setPreviewVariables(template.sample || {})
      } else {
        form.reset({
          name: '',
          language: 'en',
          category: 'utility',
          body: '',
          variables: [],
          sample: {}
        })
        setPreviewVariables({})
      }
      setValidationErrors([])
    }
  }, [template, open, form])

  // Validate template variables when body or variables change
  React.useEffect(() => {
    const body = form.watch('body')
    const variables = form.watch('variables')

    if (body && variables) {
      const templateData = { ...form.getValues() }
      const validation = validateTemplateVariables(templateData)
      setValidationErrors(validation.errors)
    }
  }, [form.watch('body'), form.watch('variables')])

  // Auto-detect variables from template body
  const handleAutoDetectVariables = () => {
    const body = form.watch('body')
    if (!body) return

    const detectedVariables = Array.from(body.matchAll(/\{\{(\w+)\}\}/g))
      .map(match => match[1])
      .filter((value, index, self) => self.indexOf(value) === index) // unique

    // Clear existing variables and add detected ones
    form.setValue('variables', detectedVariables)

    // Initialize preview variables
    const newPreviewVars: Record<string, string> = {}
    detectedVariables.forEach(varName => {
      newPreviewVars[varName] = previewVariables[varName] || `{${varName}}`
    })
    setPreviewVariables(newPreviewVars)
  }

  const handleAddVariable = () => {
    const newVar = `variable_${variableFields.length + 1}`
    appendVariable(newVar)
    setPreviewVariables(prev => ({
      ...prev,
      [newVar]: `{${newVar}}`
    }))
  }

  const handleRemoveVariable = (index: number, varName: string) => {
    removeVariable(index)
    setPreviewVariables(prev => {
      const updated = { ...prev }
      delete updated[varName]
      return updated
    })
  }

  const handleVariableChange = (oldName: string, newName: string, index: number) => {
    const variables = form.getValues('variables')
    variables[index] = newName
    form.setValue('variables', variables)

    // Update preview variables
    setPreviewVariables(prev => {
      const updated = { ...prev }
      if (oldName !== newName) {
        updated[newName] = prev[oldName] || `{${newName}}`
        delete updated[oldName]
      }
      return updated
    })
  }

  const handlePreviewVariableChange = (varName: string, value: string) => {
    setPreviewVariables(prev => ({
      ...prev,
      [varName]: value
    }))
  }

  const getPreviewText = () => {
    const templateData = form.getValues()
    return renderTemplate(templateData, previewVariables)
  }

  const handleSubmit = async (data: WaTemplate) => {
    // Final validation
    const validation = validateTemplateVariables(data)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    // Add sample data for preview
    const templateWithSample = {
      ...data,
      sample: previewVariables,
      created_at: template?.created_at,
      updated_at: new Date().toISOString()
    }

    try {
      await onSubmit(templateWithSample)
    } catch (error) {
      // Error handled by parent component
    }
  }

  const isValid = validationErrors.length === 0 && form.watch('name') && form.watch('body')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            {template
              ? `Edit the WhatsApp message template "${template.name}"`
              : 'Create a new WhatsApp message template for your organization'}
            `
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Template Details</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Template Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="APPOINTMENT_REMINDER"
                      className="font-mono"
                    />
                    <p className="text-sm ink-muted">
                      Uppercase letters, numbers, and underscores only
                    </p>
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Language */}
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={form.watch('language')}
                        onValueChange={value => form.setValue('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HERA_MSP_CONFIG.SUPPORTED_LANGUAGES.map(lang => (
                            <SelectItem key={lang} value={lang}>
                              {lang.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={form.watch('category')}
                        onValueChange={(value: any) => form.setValue('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="utility">Utility</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="authentication">Authentication</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm ink-muted">Utility templates are approved faster</p>
                    </div>
                  </div>

                  {/* Template Body */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="body">Message Body *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAutoDetectVariables}
                      >
                        <Wand2 className="h-4 w-4 mr-1" />
                        Auto-detect Variables
                      </Button>
                    </div>
                    <Textarea
                      id="body"
                      {...form.register('body')}
                      placeholder="Hello {{customer_name}}, your appointment is confirmed for {{appointment_date}} at {{appointment_time}}. See you soon!"
                      rows={6}
                      maxLength={HERA_MSP_CONFIG.MAX_MESSAGE_LENGTH}
                    />
                    <div className="flex justify-between text-sm ink-muted">
                      <span>Use {`{{variable_name}}`} for dynamic content</span>
                      <span>
                        {form.watch('body')?.length || 0} / {HERA_MSP_CONFIG.MAX_MESSAGE_LENGTH}
                      </span>
                    </div>
                    {form.formState.errors.body && (
                      <p className="text-sm text-red-600">{form.formState.errors.body.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Feature Flags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Template Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Image className="h-5 w-5 text-blue-600" />
                      <div>
                        <Label>Allow Media Attachments</Label>
                        <p className="text-sm ink-muted">Enable images, documents, and media</p>
                      </div>
                    </div>
                    <Switch
                      checked={form.watch('sample')?.allow_media || false}
                      onCheckedChange={checked => form.setValue('sample.allow_media', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                    <div className="flex items-center space-x-3">
                      <MousePointer className="h-5 w-5 text-purple-600" />
                      <div>
                        <Label>Interactive Elements</Label>
                        <p className="text-sm ink-muted">Buttons and quick replies (Coming Soon)</p>
                      </div>
                    </div>
                    <Switch checked={false} disabled />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="variables" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Variables
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddVariable}
                      disabled={variableFields.length >= HERA_MSP_CONFIG.MAX_TEMPLATE_VARIABLES}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variable
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variableFields.length === 0 ? (
                    <div className="text-center py-8 ink-muted">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No variables defined</p>
                      <p className="text-sm">Variables make templates dynamic and reusable</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {variableFields.map((field, index) => {
                        const varName = form.watch(`variables.${index}`)
                        return (
                          <div key={field.id} className="flex items-center space-x-3">
                            `
                            <div className="flex-1">
                              <Input
                                placeholder="variable_name"
                                value={varName}
                                onChange={e => handleVariableChange(varName, e.target.value, index)}
                                className="font-mono"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder="Sample value for preview"
                                value={previewVariables[varName] || ''}
                                onChange={e => handlePreviewVariableChange(varName, e.target.value)}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveVariable(index, varName)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {variableFields.length >= HERA_MSP_CONFIG.MAX_TEMPLATE_VARIABLES && (
                    <Alert>
                      <AlertDescription>
                        Maximum {HERA_MSP_CONFIG.MAX_TEMPLATE_VARIABLES} variables allowed per
                        template
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {form.watch('body') ? (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          WhatsApp Message Preview
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {form.watch('language')?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm ink dark:text-gray-300 whitespace-pre-wrap">
                        {getPreviewText()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 ink-muted">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Enter template body to see preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Template validation failed:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">
                      {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Indicator */}
          {isValid && validationErrors.length === 0 && form.watch('body') && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Template validation passed! Ready to save.
              </AlertDescription>
            </Alert>
          )}
        </form>

        <Separator />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(handleSubmit)} disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
