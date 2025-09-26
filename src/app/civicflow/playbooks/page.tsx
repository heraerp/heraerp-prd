'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Download,
  LayoutGrid,
  List,
  Play,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { PlaybookFilterBar } from '@/components/playbooks/PlaybookFilterBar'
import { PlaybookCard } from '@/components/playbooks/PlaybookCard'
import { CreatePlaybookModal } from '@/components/playbooks/CreatePlaybookModal'
import { SeedDataButton } from '@/components/playbooks/SeedDataButton'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
// import { usePlaybookList, usePlaybookKpis, useExportPlaybooks } from '@/hooks/use-playbooks';
import { useOrgStore } from '@/state/org'
import type { PlaybookFilters, PlaybookExportFormat } from '@/types/playbooks'

const VIEW_STORAGE_KEY = 'civicflow-playbooks-view'

export default function PlaybooksPage() {
  const router = useRouter()
  const { currentOrgId } = useOrgStore()
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filters, setFilters] = useState<PlaybookFilters>({
    page: 1,
    pageSize: 20
  })

  // Removed debug logs to reduce noise

  // Load view preference
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY)
    if (savedView === 'list' || savedView === 'card') {
      setViewMode(savedView)
    }
  }, [])

  // State for data
  const [playbooks, setPlaybooks] = useState<any[]>([])
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch playbooks
  const fetchPlaybooks = useCallback(async () => {
    if (!currentOrgId) return

    console.log('📊 Fetching playbooks...')

    try {
      setLoading(true)
      const url = `/api/civicflow/playbooks?page=${filters.page}&pageSize=${filters.pageSize}`
      console.log('📊 Fetch URL:', url)

      const response = await fetch(url, {
        headers: {
          'X-Organization-Id': currentOrgId
        }
      })

      console.log('📊 Response status:', response.status)

      if (!response.ok) throw new Error('Failed to fetch playbooks')

      const data = await response.json()
      console.log('📊 Playbooks data:', data)
      setPlaybooks(data.items || [])

      // Also fetch KPIs
      const kpiResponse = await fetch('/api/civicflow/playbooks/kpis', {
        headers: {
          'X-Organization-Id': currentOrgId
        }
      })

      if (kpiResponse.ok) {
        const kpiData = await kpiResponse.json()
        setKpis(kpiData)
      }
    } catch (err) {
      console.error('Error fetching playbooks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load playbooks')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, filters.page, filters.pageSize])

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchPlaybooks()
  }, [fetchPlaybooks])

  // Mock the query objects to match the expected structure
  const kpisQuery = { data: kpis, isLoading: loading, isError: !!error }
  const playbooksQuery = {
    data: {
      items: playbooks,
      total: playbooks.length,
      page: filters.page,
      pageSize: filters.pageSize
    },
    isLoading: loading,
    isError: !!error,
    error: error ? new Error(error) : null,
    refetch: fetchPlaybooks
  }
  const exportMutation = { mutate: (params: any) => console.log('Export:', params) }

  // Update view preference
  const handleViewChange = (view: 'card' | 'list') => {
    setViewMode(view)
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: PlaybookFilters) => {
    setFilters({ ...newFilters, page: 1 }) // Reset to page 1 on filter change
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  // Export playbooks
  const handleExport = (format: PlaybookExportFormat) => {
    exportMutation.mutate({ format, filters })
  }

  // Navigate to playbook detail
  const handlePlaybookClick = (playbookId: string) => {
    router.push(`/civicflow/playbooks/${playbookId}`)
  }

  // Clear filters
  const handleClearFilters = () => {
    setFilters({ page: 1, pageSize: 20 })
  }

  // KPI Cards
  const kpiCards = [
    {
      title: 'Active Playbooks',
      value: kpisQuery.data?.active || 0,
      icon: Play,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Runs',
      value: kpisQuery.data?.total_runs || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Avg. Duration',
      value: kpisQuery.data?.avg_duration_hours ? `${kpisQuery.data.avg_duration_hours}h` : '0h',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Success Rate',
      value: `${kpisQuery.data?.success_rate || 0}%`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  if (!currentOrgId) {
    return (
      <div className="p-8">
        <ErrorState
          title="No Organization Selected"
          message="Please select an organization to view playbooks."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Playbooks</h1>
          <p className="text-muted-foreground">Automated workflows for government services</p>
        </div>
        <div className="flex items-center gap-2">
          <SeedDataButton />
          <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Playbook
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('json')}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('yaml')}>
                Export as YAML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.title === 'Active Playbooks' && kpisQuery.data && (
                  <p className="text-xs text-muted-foreground">
                    {kpisQuery.data.draft} draft, {kpisQuery.data.archived} archived
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter Bar */}
      <PlaybookFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Playbooks List */}
      <div>
        {playbooksQuery.isLoading ? (
          <Loading message="Loading playbooks..." />
        ) : playbooksQuery.isError ? (
          <ErrorState
            title="Error loading playbooks"
            message={playbooksQuery.error?.message || 'An error occurred'}
          />
        ) : !playbooksQuery.data?.items.length ? (
          <EmptyState
            title="No playbooks found"
            message={
              filters.q ? 'Try adjusting your filters' : 'Create your first playbook to get started'
            }
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Playbook
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playbooksQuery.data.items.map(playbook => (
              <PlaybookCard
                key={playbook.id}
                playbook={playbook}
                onClick={() => handlePlaybookClick(playbook.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {playbooksQuery.data && playbooksQuery.data.total > playbooksQuery.data.pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((filters.page || 1) - 1) * (filters.pageSize || 20) + 1} to{' '}
            {Math.min((filters.page || 1) * (filters.pageSize || 20), playbooksQuery.data.total)} of{' '}
            {playbooksQuery.data.total} playbooks
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((filters.page || 1) - 1)}
              disabled={(filters.page || 1) === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((filters.page || 1) + 1)}
              disabled={(filters.page || 1) * (filters.pageSize || 20) >= playbooksQuery.data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Playbook Modal */}
      <CreatePlaybookModal
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          setShowCreateDialog(false)
          playbooksQuery.refetch()
        }}
      />
    </div>
  )
}
