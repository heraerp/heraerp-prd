'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCase, useCaseTimeline } from '@/hooks/use-cases'
import { formatDate } from '@/lib/utils/format'

export default function CasePrintPage() {
  const params = useParams()
  const caseId = params.id as string

  const { data: caseDetail, isLoading: caseLoading } = useCase(caseId)
  const { data: timeline, isLoading: timelineLoading } = useCaseTimeline(caseId)

  // Auto-print when loaded
  useEffect(() => {
    if (caseDetail && !caseLoading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [caseDetail, caseLoading])

  if (caseLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-muted-foreground mb-4">Case not found</p>
        <Link href={`/civicflow/cases/${caseId}`}>
          <Button variant="link">Back to case</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .print-break {
            page-break-before: always;
          }
        }
        @page {
          size: A4;
          margin: 20mm;
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 no-print">
          <Link href={`/civicflow/cases/${caseId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to case
            </Button>
          </Link>
          <Button onClick={() => window.print()} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        {/* Print Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Case Report</h1>
          <p className="text-sm text-muted-foreground">
            Generated on {formatDate(new Date().toISOString())}
          </p>
        </div>

        {/* Case Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{caseDetail.entity_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Case Code</p>
                <p className="font-mono">{caseDetail.entity_code}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant="outline">{caseDetail.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Priority</p>
                <p className="capitalize">{caseDetail.priority}</p>
              </div>
              <div>
                <p className="text-sm font-medium">RAG Status</p>
                <p>{caseDetail.rag}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p>{caseDetail.owner || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p>{caseDetail.due_date ? formatDate(caseDetail.due_date) : 'Not set'}</p>
              </div>
            </div>

            {caseDetail.description && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Description</p>
                <p className="text-sm whitespace-pre-wrap">{caseDetail.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm font-medium">Program: </span>
              <span className="text-sm">{caseDetail.program_name || 'Not linked'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Subject: </span>
              <span className="text-sm">{caseDetail.subject_name || 'Not linked'}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Agreement: </span>
              <span className="text-sm">{caseDetail.agreement_name || 'Not linked'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline (limited for printing) */}
        {timeline && timeline.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeline.slice(0, 10).map(event => (
                  <div key={event.id} className="flex gap-4 text-sm">
                    <div className="min-w-[120px] text-muted-foreground">
                      {formatDate(event.created_at)}
                    </div>
                    <div>
                      <p className="font-medium">{event.description}</p>
                      {event.created_by && (
                        <p className="text-muted-foreground text-xs">by {event.created_by}</p>
                      )}
                    </div>
                  </div>
                ))}
                {timeline.length > 10 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    ... and {timeline.length - 10} more events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>CivicFlow Case Management System</p>
          <p>© {new Date().getFullYear()} All rights reserved</p>
        </div>
      </div>
    </>
  )
}
