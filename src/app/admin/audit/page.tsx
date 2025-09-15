'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Shield,
  AlertTriangle,
  Clock,
  User,
  Key,
  Database,
  FileText
} from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

interface AuditEvent {
  id: string
  timestamp: string
  event_type: string
  user_id: string
  user_name: string
  action: string
  resource: string
  result: 'success' | 'failure'
  ip_address: string
  smart_code: string
  details: any
}

export default function AuditStreamPage() {
  const { currentOrganization } = useMultiOrgAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [filter, setFilter] = useState({
    search: '',
    eventType: 'all',
    result: 'all',
    timeRange: '24h'
  })
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  useEffect(() => {
    if (currentOrganization?.id) {
      loadInitialEvents()
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [currentOrganization, filter])

  const loadInitialEvents = async () => {
    if (!currentOrganization?.id) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        organization_id: currentOrganization.id,
        limit: '100',
        ...filter
      })

      const response = await fetch(`/api/v1/audit/events?${params}`)
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to load audit events:', error)
    } finally {
      setLoading(false)
    }
  }

  const startStreaming = () => {
    if (!currentOrganization?.id || eventSource) return

    const params = new URLSearchParams({
      organization_id: currentOrganization.id,
      since: new Date().toISOString()
    })

    const source = new EventSource(`/api/v1/audit/stream?${params}`)

    source.onmessage = event => {
      const newEvent = JSON.parse(event.data)
      setEvents(prev => [newEvent, ...prev].slice(0, 100)) // Keep last 100
    }

    source.onerror = () => {
      source.close()
      setStreaming(false)
      setEventSource(null)
    }

    setEventSource(source)
    setStreaming(true)
  }

  const stopStreaming = () => {
    if (eventSource) {
      eventSource.close()
      setEventSource(null)
      setStreaming(false)
    }
  }

  const exportEvents = async () => {
    if (!currentOrganization?.id) return

    const params = new URLSearchParams({
      organization_id: currentOrganization.id,
      format: 'csv',
      ...filter
    })

    window.open(`/api/v1/audit/export?${params}`, '_blank')
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'auth':
        return <Key className="w-4 h-4" />
      case 'data':
        return <Database className="w-4 h-4" />
      case 'security':
        return <Shield className="w-4 h-4" />
      case 'admin':
        return <User className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getResultBadge = (result: string) => {
    return result === 'success' ? (
      <Badge className="bg-green-100 text-green-800">Success</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">Failed</Badge>
    )
  }

  const filteredEvents = events.filter(event => {
    if (
      filter.search &&
      !JSON.stringify(event).toLowerCase().includes(filter.search.toLowerCase())
    ) {
      return false
    }
    if (filter.eventType !== 'all' && !event.event_type.includes(filter.eventType)) {
      return false
    }
    if (filter.result !== 'all' && event.result !== filter.result) {
      return false
    }
    return true
  })

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Trail</h1>
          <p className="text-gray-600 mt-1">Real-time security and compliance monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          {streaming ? (
            <Button
              variant="destructive"
              onClick={stopStreaming}
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4 animate-pulse" />
              Stop Streaming
            </Button>
          ) : (
            <Button onClick={startStreaming} className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Start Live Stream
            </Button>
          )}
          <Button variant="outline" onClick={exportEvents} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={filter.search}
                onChange={e => setFilter({ ...filter, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filter.eventType}
              onValueChange={value => setFilter({ ...filter, eventType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="data">Data Access</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="admin">Admin Actions</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.result}
              onValueChange={value => setFilter({ ...filter, result: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.timeRange}
              onValueChange={value => setFilter({ ...filter, timeRange: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Audit Events</CardTitle>
            {streaming && (
              <Badge className="bg-green-100 text-green-800 animate-pulse">Live Streaming</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading audit events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>No audit events found matching your filters.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getEventIcon(event.event_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{event.action}</span>
                          {getResultBadge(event.result)}
                          <Badge variant="outline">{event.smart_code}</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{event.user_name}</span>
                          {' • '}
                          <span>{event.resource}</span>
                          {' • '}
                          <span>IP: {event.ip_address}</span>
                        </div>
                        {event.details && Object.keys(event.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
