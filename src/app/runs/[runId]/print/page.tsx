

'use client';

import { api } from '@/lib/api-client'
import { formatDateTime } from '@/lib/format'
import { RunStatusBadge } from '@/components/RunStatusBadge'
import { Button } from '@/components/ui/button'
import type { RunHeader, TimelineEvent } from '@/types/runs'
import { useEffect, useState } from 'react'

// This is a client component for print-optimized rendering
export default function RunPrintPage({ params }: { params: { runId: string } }) {
  const [run, setRun] = useState<RunHeader | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [runData, timelineData] = await Promise.all([
          api.runs.get(params.runId),
          api.runs.timeline(params.runId)
        ])
        setRun(runData)
        setTimeline(timelineData)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.runId])

  if (loading) {
    return (
      <div className="print-page">
        <h1>Loading...</h1>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="print-page error">
        <h1>Error Loading Run</h1>
        <p>Failed to load run data: {error || 'Unknown error'}</p>
      </div>
    )
  }

  const completedSteps = timeline.filter(e => e.event_type === 'step_completed').length
  const totalSteps = run.step_count || 0

  const eventCounts = timeline.reduce(
    (acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <>
      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-page {
            max-width: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          .print-header {
            border-bottom: 2px solid #000;
            padding-bottom: 10mm;
            margin-bottom: 10mm;
          }
          .print-section {
            margin-bottom: 8mm;
            page-break-inside: avoid;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #ccc;
            padding: 4mm;
            text-align: left;
          }
          .print-table th {
            background-color: #f5f5f5;
          }
        }
        @page {
          size: A4;
          margin: 20mm;
        }
      `}</style>

      <div className="print-page max-w-4xl mx-auto p-8">
        {/* Print Button - Hidden in print */}
        <div className="no-print mb-6">
          <Button onClick={() => window.print()} className="mb-4">
            Print This Page
          </Button>
        </div>

        {/* Header */}
        <div className="print-header">
          <h1 className="text-3xl font-bold mb-4">HERA Playbook Run Report</h1>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Generated:</strong> {formatDateTime(new Date())}
            </div>
            <div>
              <strong>Run ID:</strong> {run.id}
            </div>
          </div>
        </div>

        {/* Run Information */}
        <div className="print-section">
          <h2 className="text-xl font-semibold mb-4">Run Information</h2>
          <table className="print-table">
            <tbody>
              <tr>
                <td>
                  <strong>Playbook Name</strong>
                </td>
                <td>{run.playbook_name}</td>
              </tr>
              <tr>
                <td>
                  <strong>Version</strong>
                </td>
                <td>{run.playbook_version}</td>
              </tr>
              <tr>
                <td>
                  <strong>Status</strong>
                </td>
                <td>
                  <RunStatusBadge status={run.status} />
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Orchestrator</strong>
                </td>
                <td>{run.orchestrator_name}</td>
              </tr>
              <tr>
                <td>
                  <strong>Started</strong>
                </td>
                <td>{formatDateTime(run.started_at)}</td>
              </tr>
              {run.completed_at && (
                <tr>
                  <td>
                    <strong>Completed</strong>
                  </td>
                  <td>{formatDateTime(run.completed_at)}</td>
                </tr>
              )}
              <tr>
                <td>
                  <strong>Organization ID</strong>
                </td>
                <td>{run.organization_id}</td>
              </tr>
              <tr>
                <td>
                  <strong>Progress</strong>
                </td>
                <td>
                  {completedSteps} of {totalSteps} steps completed
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Event Summary */}
        <div className="print-section">
          <h2 className="text-xl font-semibold mb-4">Event Summary</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(eventCounts).map(([type, count]) => (
                <tr key={type}>
                  <td>{type.replace(/_/g, ' ').toUpperCase()}</td>
                  <td>{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timeline */}
        <div className="print-section">
          <h2 className="text-xl font-semibold mb-4">Execution Timeline</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Event Type</th>
                <th>Step</th>
                <th>Result</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map(event => (
                <tr key={event.event_id}>
                  <td>{formatDateTime(event.event_time)}</td>
                  <td>{event.event_type.replace(/_/g, ' ')}</td>
                  <td>{event.step_name || '-'}</td>
                  <td>{event.result || '-'}</td>
                  <td>
                    {event.error && (
                      <div>
                        <strong>Error:</strong> {event.error}
                      </div>
                    )}
                    {event.output && (
                      <pre className="text-xs">{JSON.stringify(event.output, null, 2)}</pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="print-section text-center text-sm text-gray-500 mt-8">
          <p>Generated by HERA Playbook Engine v1.0</p>
          <p>© {new Date().getFullYear()} HERA Enterprise Resource Architecture</p>
        </div>
      </div>
    </>
  )
}
