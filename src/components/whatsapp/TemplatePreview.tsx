// ================================================================================
// TEMPLATE PREVIEW - WHATSAPP MESSAGE PREVIEW
// Smart Code: HERA.UI.WHATSAPP.TEMPLATE_PREVIEW.v1
// Production-ready template preview with variable substitution
// ================================================================================

'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Eye, Smartphone, Clock, User } from 'lucide-react'
import { WaTemplate, renderTemplate } from '@/lib/schemas/whatsapp'

interface TemplatePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: WaTemplate
}

export function TemplatePreview({ open, onOpenChange, template }: TemplatePreviewProps) {
  const [substitutions, setSubstitutions] = React.useState<Record<string, string>>(
    template.sample || {}
  )

  // Initialize substitutions with sample data or defaults
  React.useEffect(() => {
    if (template.variables.length > 0) {
      const initialSubstitutions: Record<string, string> = {}

      template.variables.forEach(varName => {
        initialSubstitutions[varName] =
          template.sample?.[varName] || substitutions[varName] || getDefaultValue(varName)
      })

      setSubstitutions(initialSubstitutions)
    }
  }, [template])

  const getDefaultValue = (varName: string): string => {
    const lowerVar = varName.toLowerCase()

    // Common variable defaults
    if (lowerVar.includes('name') || lowerVar.includes('customer')) {
      return 'Sarah Johnson'
    }
    if (lowerVar.includes('date')) {
      return new Date().toLocaleDateString('en-AE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    if (lowerVar.includes('time')) {
      return '10:30 AM'
    }
    if (lowerVar.includes('amount') || lowerVar.includes('price') || lowerVar.includes('total')) {
      return 'AED 250.00'
    }
    if (lowerVar.includes('location') || lowerVar.includes('address')) {
      return 'Marina Branch'
    }
    if (lowerVar.includes('service')) {
      return 'Premium Hair Package'
    }
    if (lowerVar.includes('staff') || lowerVar.includes('stylist')) {
      return 'Maria Rodriguez'
    }

    // Generic placeholder
    return `{${varName}}`
  }

  const handleSubstitutionChange = (varName: string, value: string) => {
    setSubstitutions(prev => ({
      ...prev,
      [varName]: value
    }))
  }

  const getPreviewText = () => {
    return renderTemplate(template, substitutions)
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'utility':
        return 'text-blue-700 border-blue-300 bg-blue-50'
      case 'marketing':
        return 'text-purple-700 border-purple-300 bg-purple-50'
      case 'authentication':
        return 'text-orange-700 border-orange-300 bg-orange-50'
      default:
        return 'text-gray-700 border-gray-300 bg-gray-50'
    }
  }

  const getStatusBadge = () => {
    switch (template.status) {
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            Approved
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            Pending
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            Rejected
          </Badge>
        )
      case 'disabled':
        return (
          <Badge variant="outline" className="text-gray-700 border-gray-300 bg-gray-50">
            Disabled
          </Badge>
        )
      default:
        return <Badge variant="outline">Draft</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600" />
            Template Preview: {template.name}
          </DialogTitle>
          <DialogDescription>
            Preview how this template will look with different variable values
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Template Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Name</Label>
                  <p className="font-mono font-medium">{template.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Language</Label>
                  <p className="font-medium">{template.language.toUpperCase()}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Category</Label>
                  <div>
                    <Badge variant="outline" className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Status</Label>
                  <div>{getStatusBadge()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variable Substitutions */}
          {template.variables.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Variable Values</CardTitle>
                <p className="text-sm text-gray-600">
                  Adjust these values to see how the template renders
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {template.variables.map(varName => (
                    <div key={varName} className="space-y-2">
                      <Label htmlFor={`var_${varName}`} className="flex items-center gap-1">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                          {`{{${varName}}}`}
                        </code>
                        <span>{varName}</span>
                      </Label>
                      <Input
                        id={`var_${varName}`}
                        value={substitutions[varName] || ''}
                        onChange={e => handleSubstitutionChange(varName, e.target.value)}
                        placeholder={`Enter value for ${varName}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                WhatsApp Message Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mock WhatsApp UI */}
              <div className="bg-gradient-to-b from-green-600 to-green-700 rounded-t-lg p-4">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Your Business</p>
                    <p className="text-xs opacity-75">WhatsApp Business</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 min-h-[200px] rounded-b-lg border-l-4 border-r-4 border-b-4 border-gray-200">
                {/* Message Bubble */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border max-w-[80%] ml-auto">
                  {/* Message Header */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                    <MessageSquare className="h-3 w-3 text-green-600" />
                    <span>Template Message</span>
                    {template.hera_template_id && (
                      <Badge variant="secondary" className="text-xs">
                        MSP
                      </Badge>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap text-sm leading-relaxed">
                    {getPreviewText()}
                  </div>

                  {/* Message Footer */}
                  <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date().toLocaleTimeString('en-AE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="ml-1 text-blue-500">✓✓</span>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    This is a preview. Actual message appearance may vary.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Raw Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm">
                {template.body}
              </div>
            </CardContent>
          </Card>

          {/* Template Metadata */}
          {(template.created_at || template.hera_template_id) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                {template.created_at && (
                  <div>
                    <Label className="text-gray-600">Created</Label>
                    <p>{new Date(template.created_at).toLocaleString('en-AE')}</p>
                  </div>
                )}
                {template.hera_template_id && (
                  <div>
                    <Label className="text-gray-600">HERA MSP ID</Label>
                    <p className="font-mono">{template.hera_template_id}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
