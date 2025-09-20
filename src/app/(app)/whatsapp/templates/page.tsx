// ================================================================================
// WHATSAPP TEMPLATES PAGE - MESSAGE TEMPLATE MANAGER
// Smart Code: HERA.UI.WHATSAPP.TEMPLATES.v1
// Production-ready template manager with validation and live preview
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useWhatsappApi } from '@/lib/api/whatsapp'
import { TemplateForm } from '@/components/whatsapp/TemplateForm'
import { TemplatePreview } from '@/components/whatsapp/TemplatePreview'
import { WaTemplate } from '@/lib/schemas/whatsapp'
import { useToast } from '@/components/ui/use-toast'

export default function WhatsAppTemplatesPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedTemplate, setSelectedTemplate] = React.useState<WaTemplate | null>(null)
  const [formMode, setFormMode] = React.useState<'create' | 'edit' | null>(null)
  const [previewTemplate, setPreviewTemplate] = React.useState<WaTemplate | null>(null)

  const { templates, isTemplatesLoading, templatesError, saveTemplate, deleteTemplate, config } =
    useWhatsappApi(currentOrganization?.id || '')

  // Filter templates based on search
  const filteredTemplates = React.useMemo(() => {
    if (!searchTerm.trim()) return templates

    const search = searchTerm.toLowerCase()
    return templates.filter(
      template =>
        template.name.toLowerCase().includes(search) ||
        template.body.toLowerCase().includes(search) ||
        template.category.toLowerCase().includes(search)
    )
  }, [templates, searchTerm])

  const handleCreateTemplate = () => {
    setSelectedTemplate(null)
    setFormMode('create')
  }

  const handleEditTemplate = (template: WaTemplate) => {
    setSelectedTemplate(template)
    setFormMode('edit')
  }

  const handleDeleteTemplate = async (template: WaTemplate) => {
    if (!window.confirm(`Are you sure you want to delete template "${template.name}"?`)) {
      return
    }

    try {
      await deleteTemplate.mutateAsync(template.name)
      toast({
        title: 'Template Deleted',
        description: `Template "${template.name}" has been deleted successfully.`,
        variant: 'default'
      })
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete template',
        variant: 'destructive'
      })
    }
  }

  const handleFormClose = () => {
    setFormMode(null)
    setSelectedTemplate(null)
  }

  const handleFormSubmit = async (template: WaTemplate) => {
    try {
      await saveTemplate.mutateAsync(template)
      toast({
        title: formMode === 'create' ? 'Template Created' : 'Template Updated',
        description: `Template "${template.name}" has been ${formMode === 'create' ? 'created' : 'updated'} successfully.`,
        variant: 'default'
      })
      handleFormClose()
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save template',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (template: WaTemplate) => {
    switch (template.status) {
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
            <AlertCircle className="h-3 w-3 mr-1" />
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

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to manage WhatsApp templates.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-green-600" />
            WhatsApp Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage message templates for {currentOrganization.name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-violet-700 border-violet-300">
              {currentOrganization.name}
            </Badge>
            <Badge variant="outline">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleCreateTemplate} disabled={!config?.enabled}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* WhatsApp Not Configured Warning */}
      {!config?.enabled && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            WhatsApp integration is not enabled.
            <Button variant="link" className="px-2 h-auto font-normal underline">
              Configure WhatsApp settings
            </Button>
            to create and manage templates.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates by name, content, or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      {isTemplatesLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading templates...</span>
            </div>
          </CardContent>
        </Card>
      ) : templatesError ? (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load templates: {templatesError.message}
          </AlertDescription>
        </Alert>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm ? 'No templates found' : 'No templates yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'Create your first WhatsApp message template to get started.'}
              </p>
              {!searchTerm && config?.enabled && (
                <Button onClick={handleCreateTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTemplates.map(template => (
            <Card key={template.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getCategoryColor(template.category)}>
                        {template.category}
                      </Badge>
                      {getStatusBadge(template)}
                      <Badge variant="outline" className="text-gray-600">
                        {template.language.toUpperCase()}
                      </Badge>
                      {template.variables.length > 0 && (
                        <Badge variant="outline">
                          {template.variables.length} variable
                          {template.variables.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Template Body:</p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                      {template.body}
                    </div>
                  </div>

                  {template.variables.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map(variable => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Created:{' '}
                      {template.created_at
                        ? new Date(template.created_at).toLocaleDateString()
                        : 'Unknown'}
                    </span>
                    {template.hera_template_id && <span>MSP ID: {template.hera_template_id}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Form Dialog */}
      {formMode && (
        <TemplateForm
          open={!!formMode}
          onOpenChange={handleFormClose}
          template={selectedTemplate}
          onSubmit={handleFormSubmit}
          isSubmitting={saveTemplate.isPending}
        />
      )}

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <TemplatePreview
          open={!!previewTemplate}
          onOpenChange={() => setPreviewTemplate(null)}
          template={previewTemplate}
        />
      )}
    </div>
  )
}
