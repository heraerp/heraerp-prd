'use client'

import { useState } from 'react'

import { Plus, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { FilterBar } from '@/components/civicflow/grants/FilterBar'
import { ApplicationCard } from '@/components/civicflow/grants/ApplicationCard'
import { CreateGrantModal } from '@/components/civicflow/grants/CreateGrantModal'
import { ReviewGrantModal } from '@/components/civicflow/grants/ReviewGrantModal'

import type {
  CreateGrantModalProps,
  ReviewGrantModalProps
} from '@/components/civicflow/grants/props'
import type { GrantFilters } from '@/contracts/crm-grants'
import { exact } from '@/utils/exact'
import { useGrantKpis, useGrantList, useExportGrants } from '@/hooks/use-grants'

export default function GrantsPage() {
  const [filters, setFilters] = useState<GrantFilters>({
    page: 1,
    page_size: 20
  })
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const { data: kpis, isLoading: kpisLoading } = useGrantKpis()
  const { data: grantsData, isLoading: grantsLoading } = useGrantList(filters)
  const exportGrants = useExportGrants()

  const handleExport = (format: 'csv' | 'json') => {
    exportGrants.mutate({ filters, format })
  }

  const handleReviewApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId)
    setIsReviewModalOpen(true)
  }

  const kpiCards = [
    {
      title: 'Open Rounds',
      value: kpis?.open_rounds || 0,
      color: 'text-primary'
    },
    {
      title: 'In Review',
      value: kpis?.in_review || 0,
      color: 'text-secondary'
    },
    {
      title: 'Approval Rate',
      value: kpis?.approval_rate ? `${Math.round(kpis.approval_rate * 100)}%` : '0%',
      color: 'text-accent'
    },
    {
      title: 'Average Award',
      value: kpis?.avg_award
        ? new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0
          }).format(kpis.avg_award)
        : new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0
          }).format(0),
      color: 'text-accent2'
    }
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Grant Applications</h1>
          <p className="text-text-300 mt-1">Review and manage grant applications</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportGrants.isPending}
            className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="bg-panel border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-300">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={newFilters => setFilters({ ...newFilters, page: 1 })}
      />

      {/* Applications Grid */}
      {grantsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : grantsData?.items.length === 0 ? (
        <Card className="bg-panel border-border">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold text-text-100 mb-2">No applications found</p>
            <p className="text-text-300 mb-6">
              {filters.q || filters.status || filters.tags
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first grant application.'}
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grantsData?.items.map(application => (
              <ApplicationCard
                key={application.id}
                application={application}
                onReview={() => handleReviewApplication(application.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {grantsData && grantsData.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page! - 1) }))}
                disabled={filters.page === 1}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-text-300">
                Page {filters.page} of {grantsData.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setFilters(f => ({ ...f, page: f.page! + 1 }))}
                disabled={filters.page === grantsData.total_pages}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateGrantModal
        {...exact<CreateGrantModalProps>()({
          isOpen: isCreateModalOpen,
          onClose: () => setIsCreateModalOpen(false)
        })}
      />

      {selectedApplicationId && (
        <ReviewGrantModal
          {...exact<ReviewGrantModalProps>()({
            isOpen: isReviewModalOpen,
            onClose: () => setIsReviewModalOpen(false),
            applicationId: selectedApplicationId
          })}
        />
      )}
    </div>
  )
}
