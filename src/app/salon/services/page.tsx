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
  lightText: '#E0E0E0'
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
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b"
        style={{ ...headerGradient, borderColor: COLORS.black }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Title & Breadcrumb */}
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: COLORS.charcoal, boxShadow: 'inset 0 0 0 1px #000' }}
                >
                  <Scissors className="h-5 w-5" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <div
                    className="text-xs uppercase tracking-wider"
                    style={{ color: COLORS.bronze }}
                  >
                    HERA • SALON OS
                  </div>
                  <h1 className="text-xl font-semibold" style={{ color: COLORS.champagne }}>
                    Services
                  </h1>
                </div>
              </div>
            </div>

            {/* Center: Branch Selector */}
            {/* TODO: Add branch selector component */}

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 bg-background/50 border-border"
                  style={{ color: COLORS.lightText }}
                />
              </div>

              <Button
                onClick={() => {
                  setEditingService(null)
                  setModalOpen(true)
                }}
                className="font-semibold"
                style={{
                  backgroundImage: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                  color: COLORS.black
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Service
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleExport}
                className="border-border hover:bg-muted"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="px-6 py-4 border-b"
        style={{ backgroundColor: COLORS.charcoal, borderColor: COLORS.black }}
      >
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
      <div className="px-6 py-6">
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
  )
}
