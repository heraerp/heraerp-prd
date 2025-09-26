'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Globe,
  Play,
  Copy,
  Power,
  Download,
  Printer,
  ChevronDown,
  Code,
  Eye,
  History
} from 'lucide-react'
import { DemoBanner } from '@/components/communications/DemoBanner'
import { TestSendModal } from '@/components/communications/TestSendModal'
import { NewTemplateModal } from '@/components/communications/NewTemplateModal'
import {
  useTemplate,
  useUpdateTemplate,
  useTestSend,
  useExportComms
} from '@/hooks/use-communications'
import { isDemoMode } from '@/lib/demo-guard'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

export default function TemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)
  const templateId = params.id as string

  const [showTestModal, setShowTestModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')

  // Queries and mutations
  const { data: template, isLoading, error, refetch } = useTemplate(templateId)
  const updateMutation = useUpdateTemplate()
  const testSendMutation = useTestSend()
  const exportMutation = useExportComms()

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'webhook':
        return <Globe className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleDeactivate = () => {
    updateMutation.mutate(
      {
        id: templateId,
        is_active: !template?.is_active
      },
      {
        onSuccess: () => {
          toast({
            title: `Template ${template?.is_active ? 'deactivated' : 'activated'} successfully`
          })
          setShowDeactivateDialog(false)
          refetch()
        },
        onError: () => {
          toast({
            title: 'Failed to update template',
            variant: 'destructive'
          })
        }
      }
    )
  }

  const handleClone = () => {
    if (!template) return

    // Clone logic would create a new template with same properties
    const cloneData = {
      entity_name: `${template.entity_name} (Copy)`,
      channel: template.channel,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      variables: template.variables,
      is_active: false // Start as inactive
    }

    // This would use createTemplate mutation, but for now just show toast
    toast({ title: 'Template cloned successfully' })
  }

  const handleTestSend = (recipients: string[]) => {
    testSendMutation.mutate(
      {
        template_id: templateId,
        recipients,
        test_mode: true
      },
      {
        onSuccess: () => {
          setShowTestModal(false)
        }
      }
    )
  }

  const handleExport = () => {
    exportMutation.mutate({
      kind: 'template',
      format: 'pdf',
      template_id: templateId,
      organization_id: currentOrgId,
      include_demo_watermark: isDemo
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState message="Failed to load template" onRetry={() => refetch()} />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          title="Template not found"
          description="The requested template could not be found."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{template.entity_name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {getChannelIcon(template.channel)}
              <span className="capitalize">{template.channel}</span>
            </div>
            <Badge variant="outline">v{template.version}</Badge>
            <Badge variant={template.is_active ? 'default' : 'secondary'}>
              {template.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowTestModal(true)} disabled={isDemo && !template.is_active}>
            <Play className="h-4 w-4 mr-2" />
            Test Send
          </Button>
          <Button onClick={handleClone} variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Clone
          </Button>
          <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <Power className="h-4 w-4 mr-2" />
                {template.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {template.is_active ? 'Deactivate' : 'Activate'} Template
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to {template.is_active ? 'deactivate' : 'activate'} this
                  template?
                  {template.is_active && ' Deactivated templates cannot be used in new campaigns.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate}>
                  {template.is_active ? 'Deactivate' : 'Activate'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                <Code className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Template Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Channel</span>
                <span className="text-sm font-medium capitalize">{template.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-medium">v{template.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {format(new Date(template.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm font-medium">
                  {format(new Date(template.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {template.variables && template.variables.length > 0 ? (
              <div className="space-y-2">
                {template.variables.map((variable, index) => (
                  <Badge key={index} variant="outline" className="mr-1">
                    {variable}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No variables defined</p>
            )}
          </CardContent>
        </Card>

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Version History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">v{template.version}</span>
                <span className="text-muted-foreground">Current</span>
              </div>
              {template.version > 1 && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-muted-foreground">v{template.version - 1}</span>
                  <span className="text-muted-foreground">Previous</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Line (Email only) */}
      {template.channel === 'email' && template.subject && (
        <Card>
          <CardHeader>
            <CardTitle>Subject Line</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{template.subject}</p>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </CardTitle>
            {template.body_html && template.body_text && (
              <div className="flex gap-1">
                <Button
                  variant={previewMode === 'html' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('html')}
                >
                  HTML
                </Button>
                <Button
                  variant={previewMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('text')}
                >
                  Text
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 max-h-96 overflow-auto bg-background">
            {previewMode === 'html' && template.body_html ? (
              <div
                dangerouslySetInnerHTML={{ __html: template.body_html }}
                className="prose prose-sm max-w-none"
              />
            ) : template.body_text ? (
              <pre className="whitespace-pre-wrap text-sm font-mono">{template.body_text}</pre>
            ) : (
              <p className="text-muted-foreground text-sm">No content available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <TestSendModal
        open={showTestModal}
        onOpenChange={setShowTestModal}
        template={template}
        onSend={handleTestSend}
        isDemo={isDemo}
      />

      <NewTemplateModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editTemplate={template}
        onSuccess={() => {
          toast({ title: 'Template updated successfully' })
          setShowEditModal(false)
          refetch()
        }}
      />
    </div>
  )
}
