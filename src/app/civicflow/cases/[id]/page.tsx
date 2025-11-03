

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  FileText,
  Download,
  Printer,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaseTimeline } from '@/components/cases/CaseTimeline'
import { CaseActions } from '@/components/cases/CaseActions'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { useCase, useCaseTimeline, useExportCases } from '@/hooks/use-cases'
import { useOrgStore } from '@/state/org'
import type { CaseStatus, CasePriority, CaseRag } from '@/types/cases'

const statusColors: Record<CaseStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-gray-100 text-gray-800',
  breach: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-800'
}

const priorityColors: Record<CasePriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const ragColors: Record<CaseRag, string> = {
  R: 'bg-red-500 text-white',
  A: 'bg-amber-500 text-white',
  G: 'bg-green-500 text-white'
}

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string
  const { currentOrgId } = useOrgStore()

  const caseQuery = useCase(caseId)
  const timelineQuery = useCaseTimeline(caseId)
  const exportMutation = useExportCases()

  const handleExport = () => {
    exportMutation.mutate({
      format: 'pdf',
      filters: { q: caseId },
      include_timeline: true
    })
  }

  const handlePrint = () => {
    router.push(`/civicflow/cases/${caseId}/print`)
  }

  if (!currentOrgId) {
    return (
      <div className="p-8">
        <ErrorState
          title="No Organization Selected"
          message="Please select an organization to view case details."
        />
      </div>
    )
  }

  if (caseQuery.isLoading) {
    return <Loading message="Loading case details..." />
  }

  if (caseQuery.isError) {
    return (
      <ErrorState
        title="Error loading case"
        message={caseQuery.error?.message || 'Failed to load case details'}
      />
    )
  }

  const caseData = caseQuery.data
  if (!caseData) {
    return <ErrorState title="Case not found" message="The requested case could not be found" />
  }

  const isOverdue = caseData.due_date && new Date(caseData.due_date) < new Date()

  // Extract commonly used dynamic fields
  const dynamicFields = caseData.attributes || {}
  const description = dynamicFields['HERA.PUBLICSECTOR.CRM.CASE.DESCRIPTION.V1'] as string
  const sla = dynamicFields['HERA.PUBLICSECTOR.CRM.CASE.SLA.V1'] as number
  const category = dynamicFields['HERA.PUBLICSECTOR.CRM.CASE.CATEGORY.V1'] as string

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl font-bold">{caseData.entity_name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className={statusColors[caseData.status]}>
                {caseData.status.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className={priorityColors[caseData.priority]}>
                Priority: {caseData.priority}
              </Badge>
              {caseData.rag && (
                <Badge variant="secondary" className={ragColors[caseData.rag]}>
                  RAG: {caseData.rag}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <p className="text-sm">
                    {format(new Date(caseData.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h4>
                  <p className="text-sm">
                    {format(new Date(caseData.updated_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>

                {caseData.due_date && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
                    <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                      {format(new Date(caseData.due_date), 'MMM d, yyyy')}
                      {isOverdue && ' (Overdue)'}
                    </p>
                  </div>
                )}

                {sla && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">SLA</h4>
                    <p className="text-sm">{sla} days</p>
                  </div>
                )}

                {category && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                    <p className="text-sm">{category}</p>
                  </div>
                )}

                {caseData.owner && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Owner</h4>
                    <p className="text-sm flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {caseData.owner}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Relationships Card */}
          <Card>
            <CardHeader>
              <CardTitle>Relationships</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {caseData.relationships.program && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Program</h4>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{caseData.relationships.program.name}</span>
                  </div>
                </div>
              )}

              {caseData.relationships.subject && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Subject</h4>
                  <div className="flex items-center gap-2">
                    {caseData.relationships.subject.type === 'ps_org' ? (
                      <Building className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm">{caseData.relationships.subject.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {caseData.relationships.subject.type === 'ps_org'
                        ? 'Organization'
                        : 'Individual'}
                    </Badge>
                  </div>
                </div>
              )}

              {caseData.relationships.agreement && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Agreement</h4>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Signed{' '}
                      {caseData.relationships.agreement.signed_at
                        ? format(
                            new Date(caseData.relationships.agreement.signed_at),
                            'MMM d, yyyy'
                          )
                        : 'Not signed'}
                    </span>
                  </div>
                </div>
              )}

              {!caseData.relationships.program &&
                !caseData.relationships.subject &&
                !caseData.relationships.agreement && (
                  <p className="text-sm text-muted-foreground">No relationships established</p>
                )}
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseActions
                caseId={caseId}
                status={caseData.status}
                onActionComplete={() => {
                  caseQuery.refetch()
                  timelineQuery.refetch()
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <Card className="h-[600px] overflow-hidden">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto h-[calc(100%-5rem)]">
              <CaseTimeline events={timelineQuery.data || []} loading={timelineQuery.isLoading} />
            </CardContent>
          </Card>

          {/* Quick Info */}
          {caseData.tags && caseData.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {caseData.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          {isOverdue && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">
                  This case is overdue. Due date was{' '}
                  {caseData.due_date && format(new Date(caseData.due_date), 'MMM d, yyyy')}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
