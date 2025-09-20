'use client'

import { useRun, useRunTimeline } from '@/hooks/use-runs'
import { useOrgStore } from '@/state/org'
import { formatDateTime, formatDuration } from '@/lib/format'
import { RunStatusBadge } from '@/components/RunStatusBadge'
import { ExportActions } from '@/components/ExportButton'
import { LoadingState } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function RunDetailPage({ params }: { params: { runId: string } }) {
  const { currentOrgId } = useOrgStore()
  const { data: run, isLoading: runLoading, isError: runError } = useRun(params.runId, currentOrgId)
  const {
    data: timeline,
    isLoading: timelineLoading,
    isError: timelineError
  } = useRunTimeline(params.runId, currentOrgId)

  if (runLoading || timelineLoading) {
    return <LoadingState />
  }

  if (runError || timelineError || !run) {
    return <ErrorState message="Failed to load run details" />
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Run Details</h1>
            <p className="text-gray-600">
              {run.playbook_name} - {params.runId}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RunStatusBadge status={run.status} />
            <ExportActions runId={params.runId} />
          </div>
        </div>

        {/* Run Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Run Information</CardTitle>
            <CardDescription>Basic details about this playbook execution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Playbook</h4>
                <p className="font-medium">{run.playbook_name}</p>
                <p className="text-sm text-gray-600">Version {run.playbook_version}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Status</h4>
                <RunStatusBadge status={run.status} />
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Started</h4>
                <p>{formatDateTime(run.started_at)}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Duration</h4>
                <p>
                  {run.actual_duration_minutes
                    ? formatDuration(run.actual_duration_minutes * 60)
                    : 'In progress'}
                </p>
              </div>

              {run.completed_at && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Completed</h4>
                  <p>{formatDateTime(run.completed_at)}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Progress</h4>
                <p>{run.progress_percentage || 0}%</p>
                {run.step_count && (
                  <p className="text-sm text-gray-600">
                    {timeline?.filter(e => e.event_type === 'step_completed').length || 0} of{' '}
                    {run.step_count} steps
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context & Metadata */}
        {(run.context || run.metadata) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Context & Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              {run.context && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Context</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(run.context, null, 2)}
                  </pre>
                </div>
              )}

              {run.metadata && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-2">Metadata</h4>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(run.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Chronological events for this run</CardDescription>
          </CardHeader>
          <CardContent>
            {!timeline || timeline.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No timeline events yet</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id || index} className="border-l-2 border-gray-200 pl-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {event.event_type.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {formatDateTime(event.event_timestamp)}
                        </span>
                      </div>
                    </div>

                    {event.message && <p className="text-sm mb-2">{event.message}</p>}

                    {event.metadata && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                          View metadata
                        </summary>
                        <pre className="bg-gray-50 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      </details>
                    )}

                    {index < timeline.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
