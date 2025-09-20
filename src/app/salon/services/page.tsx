'use client'

import React, { useState, useCallback } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useServicesPlaybook } from '@/hooks/useServicesPlaybook'
import { ServiceList } from '@/components/salon/services/ServiceList'
import { ServiceModal } from '@/components/salon/services/ServiceModal'
import { BulkActionsBar } from '@/components/salon/services/BulkActionsBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ServiceForm, ServiceWithDynamicData } from '@/schemas/service'
import { Plus, Search, Scissors, Download, Building2, Filter, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

export default function SalonServicesPage() {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id || ''

  // UI State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('updated_at:desc')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<ServiceWithDynamicData | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Fetch services data
  const {
    items: services,
    total,
    isLoading,
    createOne,
    updateOne,
    archiveMany,
    restoreMany,
    exportCSV
  } = useServicesPlaybook({
    organizationId,
    branchId: undefined, // TODO: Add branch selector
    query: searchQuery,
    status: statusFilter,
    categoryId: categoryFilter,
    page,
    pageSize: 25,
    sort: sortBy
  })

  // Get unique categories from services
  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean))) as string[]

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(services.map(s => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }

  // CRUD handlers
  const handleSave = async (data: ServiceForm) => {
    if (editingService) {
      await updateOne(editingService.id, data)
    } else {
      await createOne(data)
    }
    setModalOpen(false)
    setEditingService(null)
  }

  const handleEdit = (service: ServiceWithDynamicData) => {
    setEditingService(service)
    setModalOpen(true)
  }

  const handleDuplicate = (service: ServiceWithDynamicData) => {
    const duplicated = { ...service, name: `${service.name} (Copy)`, code: undefined }
    setEditingService(duplicated)
    setModalOpen(true)
  }

  const handleBulkArchive = async () => {
    const ids = Array.from(selectedIds)
    await archiveMany(ids)
    setSelectedIds(new Set())
  }

  const handleBulkRestore = async () => {
    const ids = Array.from(selectedIds)
    await restoreMany(ids)
    setSelectedIds(new Set())
  }

  const handleExport = () => {
    exportCSV()
  }

  // Header gradient style
  const headerGradient = { backgroundColor: COLORS.charcoal } as React.CSSProperties

  return (
    <div className="min-h-[100dvh]" style={{ backgroundColor: COLORS.black }}>
      {/* Main content wrapper with charcoal background for depth */}
      <div className="relative" style={{ minHeight: '100vh' }}>
        {/* Subtle gradient overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 80%, ${COLORS.gold}08 0%, transparent 50%),
                           radial-gradient(circle at 80% 20%, ${COLORS.bronze}05 0%, transparent 50%),
                           radial-gradient(circle at 40% 40%, ${COLORS.plum}03 0%, transparent 50%)`
          }}
        />

        {/* Content container */}
        <div
          className="container mx-auto px-6 py-8 relative"
          style={{
            backgroundColor: COLORS.charcoal,
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <PageHeader
            title="Services"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Services', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search services..."
                />
                <PageHeaderButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingService(null)
                    setModalOpen(true)
                  }}
                >
                  New Service
                </PageHeaderButton>
                <PageHeaderButton variant="secondary" icon={Download} onClick={handleExport} />
              </>
            }
          />

          {/* Filters */}
          <div className="py-4 border-b" style={{ borderColor: `${COLORS.bronze}33` }}>
            <div className="flex items-center gap-4">
              {/* Status Tabs */}
              <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                <TabsList className="bg-background/30">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Filter Chips */}
              <div className="flex items-center gap-2 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? 'text-foreground' : 'text-muted-foreground'}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filters
                </Button>

                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1 bg-muted/50">
                    {categoryFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setCategoryFilter('')} />
                  </Badge>
                )}
              </div>

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-background/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name:asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name:desc">Name (Z-A)</SelectItem>
                  <SelectItem value="updated_at:desc">Updated (Newest)</SelectItem>
                  <SelectItem value="updated_at:asc">Updated (Oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48 bg-background/30 border-border">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="py-6">
            <ServiceList
              services={services}
              loading={isLoading}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onSelectOne={handleSelectOne}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onArchive={archiveMany}
              onRestore={restoreMany}
            />
          </div>

          {/* Bulk Actions */}
          <BulkActionsBar
            selectedCount={selectedIds.size}
            onArchive={handleBulkArchive}
            onRestore={handleBulkRestore}
            onExport={handleExport}
            onClear={() => setSelectedIds(new Set())}
            showRestore={statusFilter === 'archived'}
          />

          {/* Service Modal */}
          <ServiceModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingService(null)
            }}
            service={editingService}
            onSave={handleSave}
            categories={categories}
          />
        </div>
      </div>
    </div>
  )
}
