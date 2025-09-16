'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import { Switch } from '@/src/components/ui/switch'
import { Slider } from '@/src/components/ui/slider'
import { Badge } from '@/src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { useUCRMCP } from '@/src/lib/hooks/use-ucr-mcp'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/src/components/ui/use-toast'
import {
  Sparkles,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Users,
  DollarSign,
  Clock,
  MessageCircle,
  Zap,
  Settings,
  Eye,
  TestTube,
  Shield,
  Calendar,
  Percent,
  Info
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { Textarea } from '@/src/components/ui/textarea'
import { Separator } from '@/src/components/ui/separator'

interface UCRTemplateCustomizerProps {
  template: any
  onSave?: (customizedRule: any) => void
  onCancel?: () => void
}

export function UCRTemplateCustomizer({ template, onSave, onCancel }: UCRTemplateCustomizerProps) {
  const { currentOrganization } = useMultiOrgAuth()
  const { validateRule, simulateRule } = useUCRMCP()
  const { toast } = useToast()
  const [customizedRule, setCustomizedRule] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('basics')
  const [validationResult, setValidationResult] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Initialize customized rule from template
  useEffect(() => {
    if (template) {
      const customSmartCode = template.smart_code.replace(
        '.v1',
        `.${currentOrganization?.name.toUpperCase().replace(/\s+/g, '_') || 'CUSTOM'}.v1`
      )

      setCustomizedRule({
        ...template,
        smart_code: customSmartCode,
        title: `${template.title} - ${currentOrganization?.name || 'Custom'}`,
        rule_payload: JSON.parse(JSON.stringify(template.rule_payload)), // Deep clone
        metadata: {
          cloned_from: template.template_id,
          customized_at: new Date().toISOString(),
          organization_name: currentOrganization?.name
        }
      })
    }
  }, [template, currentOrganization])

  const updateDefinition = (key: string, value: any) => {
    setCustomizedRule((prev: any) => ({
      ...prev,
      rule_payload: {
        ...prev.rule_payload,
        definitions: {
          ...prev.rule_payload.definitions,
          [key]: value
        }
      }
    }))
  }

  const updateException = (index: number, field: 'if' | 'then', key: string, value: any) => {
    setCustomizedRule((prev: any) => {
      const newExceptions = [...prev.rule_payload.exceptions]
      if (field === 'if') {
        newExceptions[index] = {
          ...newExceptions[index],
          if: { ...newExceptions[index].if, [key]: value }
        }
      } else {
        newExceptions[index] = {
          ...newExceptions[index],
          then: { ...newExceptions[index].then, [key]: value }
        }
      }
      return {
        ...prev,
        rule_payload: {
          ...prev.rule_payload,
          exceptions: newExceptions
        }
      }
    })
  }

  const addException = () => {
    setCustomizedRule((prev: any) => ({
      ...prev,
      rule_payload: {
        ...prev.rule_payload,
        exceptions: [
          ...(prev.rule_payload.exceptions || []),
          { if: { customer_tier: 'new_tier' }, then: { discount_pct: 5 } }
        ]
      }
    }))
  }

  const removeException = (index: number) => {
    setCustomizedRule((prev: any) => ({
      ...prev,
      rule_payload: {
        ...prev.rule_payload,
        exceptions: prev.rule_payload.exceptions.filter((_: any, i: number) => i !== index)
      }
    }))
  }

  const handleValidate = async () => {
    if (!customizedRule || !currentOrganization) return

    try {
      const result = await validateRule({
        organization_id: currentOrganization.id,
        smart_code: customizedRule.smart_code,
        title: customizedRule.title,
        status: 'draft',
        tags: ['customized', template.module?.toLowerCase()],
        owner: currentOrganization.name,
        version: 1,
        schema_version: 1,
        rule_payload: customizedRule.rule_payload
      })

      setValidationResult(result)

      if (result.ok) {
        toast({
          title: 'Validation Passed',
          description: 'Your customized rule is valid and ready to save'
        })
      }
    } catch (err: any) {
      toast({
        title: 'Validation Failed',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // First validate
      await handleValidate()

      // Then save
      if (onSave) {
        onSave(customizedRule)
      }

      toast({
        title: 'Rule Customized Successfully',
        description: 'Your customized rule has been saved'
      })
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const renderBasicSettings = () => {
    if (!customizedRule) return null

    return (
      <div className="space-y-6">
        <div>
          <Label htmlFor="title">Rule Title</Label>
          <Input
            id="title"
            value={customizedRule.title}
            onChange={e => setCustomizedRule({ ...customizedRule, title: e.target.value })}
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">Give your rule a descriptive name</p>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={customizedRule.rule_payload.description}
            onChange={e =>
              setCustomizedRule({
                ...customizedRule,
                rule_payload: { ...customizedRule.rule_payload, description: e.target.value }
              })
            }
            className="mt-2"
            rows={3}
          />
        </div>

        <div>
          <Label>Smart Code</Label>
          <div className="mt-2 p-3 bg-muted dark:bg-muted rounded-lg">
            <code className="text-sm">{customizedRule.smart_code}</code>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically generated based on your organization
          </p>
        </div>

        <Separator />

        <Alert>
          <Info className="w-4 h-4" />
          <AlertTitle>Template Information</AlertTitle>
          <AlertDescription>
            This rule is based on the <strong>{template.title}</strong> template from the{' '}
            {template.industry} industry.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const renderCancellationSettings = () => {
    if (!customizedRule || !customizedRule.smart_code.includes('CANCEL')) return null

    const definitions = customizedRule.rule_payload.definitions || {}

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="grace_minutes">Grace Period (minutes)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="grace_minutes"
                value={[definitions.grace_minutes || 15]}
                onValueChange={([value]) => updateDefinition('grace_minutes', value)}
                max={60}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">{definitions.grace_minutes || 15}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Time after appointment start before marking as late
            </p>
          </div>

          <div>
            <Label htmlFor="no_show_fee">No-Show Fee (%)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="no_show_fee"
                value={[definitions.no_show_fee_pct || 100]}
                onValueChange={([value]) => updateDefinition('no_show_fee_pct', value)}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">
                {definitions.no_show_fee_pct || 100}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Percentage of service price charged for no-shows
            </p>
          </div>

          <div>
            <Label htmlFor="late_cancel_threshold">Late Cancel Threshold (minutes)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="late_cancel_threshold"
                value={[definitions.late_cancel_threshold_minutes || 120]}
                onValueChange={([value]) =>
                  updateDefinition('late_cancel_threshold_minutes', value)
                }
                max={480}
                step={30}
                className="flex-1"
              />
              <span className="w-16 text-right font-medium">
                {(definitions.late_cancel_threshold_minutes || 120) / 60}h
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Minimum notice required for free cancellation
            </p>
          </div>

          <div>
            <Label htmlFor="late_cancel_fee">Late Cancellation Fee (%)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="late_cancel_fee"
                value={[definitions.late_cancel_fee_pct || 50]}
                onValueChange={([value]) => updateDefinition('late_cancel_fee_pct', value)}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">
                {definitions.late_cancel_fee_pct || 50}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Fee charged for late cancellations</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-3">Calendar Effects</h4>
          <div className="flex items-center justify-between p-4 bg-muted dark:bg-muted rounded-lg">
            <div>
              <Label htmlFor="block_future">Block Future Bookings on No-Show</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Prevent repeat no-shows by blocking future appointments
              </p>
            </div>
            <Switch
              id="block_future"
              checked={
                customizedRule.rule_payload.calendar_effects?.block_future_bookings_on_no_show ||
                false
              }
              onCheckedChange={checked =>
                setCustomizedRule({
                  ...customizedRule,
                  rule_payload: {
                    ...customizedRule.rule_payload,
                    calendar_effects: {
                      ...customizedRule.rule_payload.calendar_effects,
                      block_future_bookings_on_no_show: checked
                    }
                  }
                })
              }
            />
          </div>

          {customizedRule.rule_payload.calendar_effects?.block_future_bookings_on_no_show && (
            <div className="mt-4">
              <Label htmlFor="block_days">Days to Block</Label>
              <Input
                id="block_days"
                type="number"
                value={customizedRule.rule_payload.calendar_effects?.blocks_days || 1}
                onChange={e =>
                  setCustomizedRule({
                    ...customizedRule,
                    rule_payload: {
                      ...customizedRule.rule_payload,
                      calendar_effects: {
                        ...customizedRule.rule_payload.calendar_effects,
                        blocks_days: parseInt(e.target.value) || 1
                      }
                    }
                  })
                }
                className="mt-2 w-32"
                min={1}
                max={30}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderPricingSettings = () => {
    if (!customizedRule || !customizedRule.smart_code.includes('DISCOUNT')) return null

    const definitions = customizedRule.rule_payload.definitions || {}

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="max_discount_pct">Maximum Discount (%)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="max_discount_pct"
                value={[definitions.max_discount_pct || 30]}
                onValueChange={([value]) => updateDefinition('max_discount_pct', value)}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">
                {definitions.max_discount_pct || 30}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Maximum discount allowed without approval</p>
          </div>

          <div>
            <Label htmlFor="max_discount_amount">Maximum Discount Amount (AED)</Label>
            <Input
              id="max_discount_amount"
              type="number"
              value={definitions.max_discount_amount || 500}
              onChange={e => updateDefinition('max_discount_amount', parseInt(e.target.value) || 0)}
              className="mt-2"
              min={0}
              step={50}
            />
            <p className="text-sm text-muted-foreground mt-1">Absolute maximum discount in currency</p>
          </div>

          <div>
            <Label htmlFor="requires_approval_above">Requires Approval Above (%)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                id="requires_approval_above"
                value={[definitions.requires_approval_above || 20]}
                onValueChange={([value]) => updateDefinition('requires_approval_above', value)}
                max={50}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">
                {definitions.requires_approval_above || 20}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manager approval required for discounts above this percentage
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderExceptions = () => {
    if (!customizedRule) return null

    const exceptions = customizedRule.rule_payload.exceptions || []

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Exceptions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Special rules for specific customer types or conditions
            </p>
          </div>
          <Button onClick={addException} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Exception
          </Button>
        </div>

        <div className="space-y-4">
          {exceptions.map((exception: any, index: number) => (
            <Card key={index} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary dark:text-blue-400">
                    Exception {index + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeException(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">If Customer Tier is</Label>
                    <Select
                      value={exception.if.customer_tier || ''}
                      onValueChange={value => updateException(index, 'if', 'customer_tier', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="PREMIUM">Premium</SelectItem>
                        <SelectItem value="REGULAR">Regular</SelectItem>
                        <SelectItem value="NEW">New Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {customizedRule.smart_code.includes('CANCEL') && (
                    <>
                      <div>
                        <Label className="text-sm">Then Late Cancel Fee is</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            value={exception.then.late_cancel_fee_pct || 0}
                            onChange={e =>
                              updateException(
                                index,
                                'then',
                                'late_cancel_fee_pct',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            max={100}
                            className="w-20"
                          />
                          <span>%</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">No-Show Fee is</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            type="number"
                            value={exception.then.no_show_fee_pct || 0}
                            onChange={e =>
                              updateException(
                                index,
                                'then',
                                'no_show_fee_pct',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            max={100}
                            className="w-20"
                          />
                          <span>%</span>
                        </div>
                      </div>
                    </>
                  )}

                  {customizedRule.smart_code.includes('DISCOUNT') && (
                    <div>
                      <Label className="text-sm">Then Max Discount is</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          value={exception.then.max_discount_pct || 0}
                          onChange={e =>
                            updateException(
                              index,
                              'then',
                              'max_discount_pct',
                              parseInt(e.target.value) || 0
                            )
                          }
                          min={0}
                          max={100}
                          className="w-20"
                        />
                        <span>%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {exceptions.length === 0 && (
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              No exceptions defined. Add exceptions to create special rules for VIP customers or
              specific scenarios.
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const renderValidation = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Rule Validation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check your customized rule for errors before saving
            </p>
          </div>
          <Button onClick={handleValidate} variant="outline">
            <Shield className="w-4 h-4 mr-2" />
            Validate Rule
          </Button>
        </div>

        {validationResult && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${
                validationResult.ok
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {validationResult.ok ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">
                    {validationResult.ok ? 'Validation Passed' : 'Validation Failed'}
                  </h4>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                    {validationResult.ok
                      ? 'Your rule is valid and ready to deploy'
                      : 'Please fix the errors below before saving'}
                  </p>
                </div>
              </div>
            </div>

            {validationResult.errors && validationResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600 dark:text-red-400">Errors:</h4>
                {validationResult.errors.map((error: string, index: number) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Warnings:</h4>
                {validationResult.warnings.map((warning: string, index: number) => (
                  <Alert key={index}>
                    <Info className="w-4 h-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        <div>
          <h4 className="font-medium mb-3">Rule Preview</h4>
          <div className="bg-muted dark:bg-muted rounded-lg p-4">
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(customizedRule?.rule_payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    )
  }

  if (!customizedRule) return null

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <CardTitle>Customize Template</CardTitle>
            <CardDescription>
              Personalize the {template.title} template for your salon
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Basics
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="exceptions" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Exceptions
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Validation
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="basics">{renderBasicSettings()}</TabsContent>

            <TabsContent value="rules">
              {renderCancellationSettings()}
              {renderPricingSettings()}
            </TabsContent>

            <TabsContent value="exceptions">{renderExceptions()}</TabsContent>

            <TabsContent value="validation">{renderValidation()}</TabsContent>
          </div>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCustomizedRule(JSON.parse(JSON.stringify(template)))
                toast({
                  title: 'Reset to Template',
                  description: 'All customizations have been reset'
                })
              }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !validationResult?.ok}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Customization'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
