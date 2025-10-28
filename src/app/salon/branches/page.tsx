'use client'

// Removed force-dynamic for better client-side navigation performance

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraBranches } from '@/hooks/useHeraBranches'
import type { BranchFormValues } from '@/components/salon/branches/BranchModal'
import type { BranchEntity } from '@/hooks/useHeraBranches'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'

// 🚀 LAZY LOADING: Split code for faster initial load
const BranchModal = lazy(() =>
  import('@/components/salon/branches/BranchModal').then(module => ({ default: module.BranchModal }))
)

import {
  Plus,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  User,
  Download,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  Navigation,
  ExternalLink,
  RefreshCw,
  Users
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  rose: '#E8B4B8',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323'
}

// Loading fallback for Suspense boundaries
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <div
        className="animate-spin rounded-full h-8 w-8 border-b-2"
        style={{ borderColor: COLORS.gold }}
      />
      <span className="ml-3" style={{ color: COLORS.bronze }}>
        Loading...
      </span>
    </div>
  )
}

// Skeleton loaders for initial page load
function BranchListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-80 rounded-lg"
          style={{
            backgroundColor: COLORS.charcoalLight + '95',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <div className="p-6 space-y-4">
            <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: COLORS.gold + '20' }} />
            <div className="h-4 rounded" style={{ backgroundColor: COLORS.bronze + '30', width: '80%' }} />
            <div className="h-3 rounded" style={{ backgroundColor: COLORS.bronze + '20', width: '60%' }} />
            <div className="h-8 rounded" style={{ backgroundColor: COLORS.gold + '10' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function SalonBranchesPageContent() {
  const router = useRouter()
  const { organization } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const organizationId = organization?.id

  // 🔍 DEBUG: Log organization context
  if (process.env.NODE_ENV === 'development') {
    console.log('[SalonBranchesPage] 🏢 Organization context:', {
      organizationId,
      organizationName: organization?.entity_name
    })
  }

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchEntity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<BranchEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 🚨 ENTERPRISE ERROR LOGGING: Detailed console logs with timestamps
  // MUST be defined BEFORE any handlers that use it to avoid temporal dead zone
  const logError = useCallback(
    (context: string, error: any, additionalInfo?: any) => {
      const timestamp = new Date().toISOString()
      const errorLog = {
        timestamp,
        context,
        error: {
          message: error?.message || String(error),
          stack: error?.stack,
          code: error?.code,
          name: error?.name
        },
        additionalInfo,
        organizationId,
        user: organization?.entity_name
      }

      console.error('🚨 [HERA Branches Error]', errorLog)

      // In development, show detailed error breakdown
      if (process.env.NODE_ENV === 'development') {
        console.group('🔍 Error Details')
        console.log('Context:', context)
        console.log('Message:', error?.message)
        console.log('Stack:', error?.stack)
        console.log('Additional Info:', additionalInfo)
        console.groupEnd()
      }

      return errorLog
    },
    [organizationId, organization?.entity_name]
  )

  // ✅ PERFORMANCE FIX: Fetch branches ONCE (not twice!) with NO filters
  // Then derive both KPIs and filtered list from this single dataset
  const {
    branches: allBranches,
    isLoading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    archiveBranch,
    restoreBranch,
    isCreating,
    isUpdating,
    isDeleting: isDeletingBranch
  } = useHeraBranches({
    organizationId,
    includeArchived: true // Always fetch all for KPIs
  })

  // Filter branches based on tab selection and search - memoized for performance
  const filteredBranches = useMemo(
    () =>
      allBranches?.filter(branch => {
        if (!branch || !branch.entity_name) return false

        // Tab filter
        if (!includeArchived && branch.status === 'archived') {
          return false
        }

        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          if (
            !branch.entity_name.toLowerCase().includes(query) &&
            !branch.entity_code?.toLowerCase().includes(query) &&
            !branch.city?.toLowerCase().includes(query)
          ) {
            return false
          }
        }

        return true
      }) || [],
    [allBranches, includeArchived, searchQuery]
  )

  // Calculate global KPIs - memoized for performance
  // 🎯 ENTERPRISE DASHBOARD PATTERN: KPIs show GLOBAL metrics, independent of tab/filter
  const totalBranches = useMemo(() => allBranches?.length || 0, [allBranches])
  const activeBranches = useMemo(
    () => allBranches?.filter(b => b.status === 'active').length || 0,
    [allBranches]
  )
  const archivedBranches = useMemo(
    () => allBranches?.filter(b => b.status === 'archived').length || 0,
    [allBranches]
  )
  const gpsLocations = useMemo(
    () => allBranches?.filter(b => b.gps_latitude && b.gps_longitude).length || 0,
    [allBranches]
  )

  // CRUD handlers - memoized for performance
  const handleSave = useCallback(
    async (data: BranchFormValues) => {
      const loadingId = showLoading(
        editingBranch ? 'Updating branch...' : 'Creating branch...',
        'Please wait while we save your changes'
      )

      try {
        if (editingBranch) {
          await updateBranch(editingBranch.id, data)
          removeToast(loadingId)
          showSuccess('Branch updated successfully', `${data.name} has been updated`)
        } else {
          await createBranch(data)
          removeToast(loadingId)
          showSuccess('Branch created successfully', `${data.name} has been added`)
        }
        setModalOpen(false)
        setEditingBranch(null)
      } catch (error: any) {
        logError(editingBranch ? 'Update Branch Failed' : 'Create Branch Failed', error, {
          branchName: data.name,
          branchData: data
        })
        removeToast(loadingId)
        showError(
          editingBranch ? 'Failed to update branch' : 'Failed to create branch',
          error.message || 'Please check the console for detailed error information and try again'
        )
      }
    },
    [editingBranch, updateBranch, createBranch, showLoading, removeToast, showSuccess, showError, logError]
  )

  const handleEdit = useCallback((branch: BranchEntity) => {
    setEditingBranch(branch)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((branch: BranchEntity) => {
    setBranchToDelete(branch)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!branchToDelete) return

    const loadingId = showLoading('Deleting branch...', 'This action cannot be undone')
    setIsDeleting(true)

    try {
      // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
      const result = await deleteBranch(branchToDelete.id)

      removeToast(loadingId)

      if (result.archived) {
        // Branch was archived instead of deleted (referenced in transactions)
        showSuccess(
          'Branch archived',
          result.message || `${branchToDelete.entity_name} has been archived`
        )
      } else {
        // Branch was successfully deleted
        showSuccess('Branch deleted', `${branchToDelete.entity_name} has been permanently removed`)
      }

      setDeleteDialogOpen(false)
      setBranchToDelete(null)
    } catch (error: any) {
      logError('Delete Branch Failed', error, {
        branchId: branchToDelete.id,
        branchName: branchToDelete.entity_name
      })
      removeToast(loadingId)
      showError('Failed to delete branch', error.message || 'Please check the console for detailed error information')
    } finally {
      setIsDeleting(false)
    }
  }, [branchToDelete, deleteBranch, showLoading, removeToast, showSuccess, showError, logError])

  const handleArchive = useCallback(
    async (branch: BranchEntity) => {
      const loadingId = showLoading(
        'Archiving branch...',
        'Please wait while we update the branch status'
      )

      try {
        await archiveBranch(branch.id)
        removeToast(loadingId)
        showSuccess('Branch archived', `${branch.entity_name} has been archived`)
      } catch (error: any) {
        logError('Archive Branch Failed', error, {
          branchId: branch.id,
          branchName: branch.entity_name
        })
        removeToast(loadingId)
        showError('Failed to archive branch', error.message || 'Please check the console for detailed error information')
      }
    },
    [archiveBranch, showLoading, removeToast, showSuccess, showError, logError]
  )

  const handleRestore = useCallback(
    async (branch: BranchEntity) => {
      const loadingId = showLoading('Restoring branch...', 'Please wait while we restore the branch')

      try {
        await restoreBranch(branch.id)
        removeToast(loadingId)
        showSuccess('Branch restored', `${branch.entity_name} has been restored`)
      } catch (error: any) {
        logError('Restore Branch Failed', error, {
          branchId: branch.id,
          branchName: branch.entity_name
        })
        removeToast(loadingId)
        showError('Failed to restore branch', error.message || 'Please check the console for detailed error information')
      }
    },
    [restoreBranch, showLoading, removeToast, showSuccess, showError, logError]
  )

  const handleExport = useCallback(() => {
    showSuccess('Export started', 'Your branches will be exported shortly')
  }, [showSuccess])

  return (
    <SalonLuxePage
      title="Branches"
      description="Manage your salon branches and locations"
      maxWidth="full"
      padding="lg"
      actions={
        <>
          {/* New Branch - Gold */}
          <button
            onClick={() => {
              setEditingBranch(null)
              setModalOpen(true)
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black,
              border: `1px solid ${COLORS.gold}`
            }}
          >
            <Plus className="w-4 h-4" />
            New Branch
          </button>
          {/* Export - Bronze */}
          <button
            onClick={handleExport}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.bronze,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.bronze}`
            }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          {/* Refresh Data - Bronze (icon only, at the end) */}
          <button
            onClick={() => window.location.reload()}
            className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.charcoal,
              border: `1px solid ${COLORS.bronze}40`,
              color: COLORS.bronze
            }}
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </>
      }
    >
      {/* 📱 PREMIUM MOBILE HEADER */}
      <PremiumMobileHeader
        title="Branches"
        subtitle={`${totalBranches} locations`}
        showNotifications={false}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => {
              setEditingBranch(null)
              setModalOpen(true)
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Add new branch"
            style={{ boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)' }}
          >
            <Plus className="w-5 h-5 text-black" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="p-4 md:p-6 lg:p-8">
        {/* 🚨 ENTERPRISE ERROR BANNER - Detailed & Actionable */}
        {error && (
          <div
            className="mb-6 p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              backgroundColor: '#FF6B6B15',
              borderColor: '#FF6B6B40',
              color: COLORS.lightText
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 animate-pulse" style={{ color: '#FF6B6B' }} />
              <div className="flex-1 space-y-2">
                <p className="font-semibold" style={{ color: COLORS.champagne }}>
                  Failed to load branches
                </p>
                <p className="text-sm opacity-90">{error}</p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: COLORS.gold + '30',
                      color: COLORS.champagne,
                      border: `1px solid ${COLORS.gold}50`
                    }}
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      logError('User clicked View Details on error banner', error, { page: 'branches' })
                      console.log('📋 Full error details above')
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: COLORS.charcoal,
                      color: COLORS.bronze,
                      border: `1px solid ${COLORS.bronze}40`
                    }}
                  >
                    View Details (Console)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📊 KPI CARDS - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <SalonLuxeKPICard
            title="Total Branches"
            value={totalBranches}
            icon={Building2}
            color={COLORS.bronze}
            description="All locations"
            animationDelay={0}
          />
          <SalonLuxeKPICard
            title="Active Branches"
            value={activeBranches}
            icon={Building2}
            color={COLORS.emerald}
            description="Operational locations"
            animationDelay={100}
            percentageBadge={
              totalBranches > 0 ? `${((activeBranches / totalBranches) * 100).toFixed(0)}%` : undefined
            }
          />
          <SalonLuxeKPICard
            title="Archived"
            value={archivedBranches}
            icon={Archive}
            color={COLORS.plum}
            description="Inactive locations"
            animationDelay={200}
          />
          <SalonLuxeKPICard
            title="GPS Locations"
            value={gpsLocations}
            icon={Navigation}
            color={COLORS.gold}
            description="With coordinates"
            animationDelay={300}
          />
        </div>

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 space-y-2">
          <button
            onClick={() => {
              setEditingBranch(null)
              setModalOpen(true)
            }}
            className="w-full min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            style={{
              backgroundColor: COLORS.gold,
              color: COLORS.black
            }}
          >
            <Plus className="w-4 h-4" />
            New Branch
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.bronze,
                color: COLORS.champagne
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => window.location.reload()}
              className="min-w-[48px] min-h-[48px] rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
              style={{
                backgroundColor: COLORS.charcoal,
                border: `1px solid ${COLORS.bronze}40`,
                color: COLORS.bronze
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters and View Options - MOBILE RESPONSIVE */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Left Side: Tabs */}
          <div className="flex items-center gap-3">
            <Tabs
              value={includeArchived ? 'all' : 'active'}
              onValueChange={v => setIncludeArchived(v === 'all')}
            >
              <TabsList style={{ backgroundColor: COLORS.charcoalLight }}>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="all">All Branches</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* 🔄 MAIN CONTENT - Lazy Loaded */}
        {isLoading ? (
          <div className="space-y-4">
            <div
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: COLORS.charcoalLight + '50' }}
            >
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gold/30 border-t-gold" />
                <div>
                  <p className="font-medium" style={{ color: COLORS.champagne }}>
                    Loading branches...
                  </p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>
                    Fetching your locations
                  </p>
                </div>
              </div>
            </div>
            <BranchListSkeleton />
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: COLORS.gold }} />
              <p className="text-lg mb-1" style={{ color: COLORS.champagne }}>
                {searchQuery ? 'No branches found' : 'No branches yet'}
              </p>
              <p className="text-sm opacity-60 mb-4" style={{ color: COLORS.lightText }}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Create your first branch to start managing locations'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color: COLORS.black
                  }}
                >
                  Create Branch
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-300">
            {filteredBranches.map((branch, index) => (
              <div
                key={branch.id}
                className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:scale-[1.02] active:scale-95 animate-in fade-in slide-in-from-bottom-2"
                style={{
                  backgroundColor: COLORS.charcoalLight + '95',
                  borderColor: branch.status === 'archived' ? `${COLORS.plum}40` : `${COLORS.bronze}40`,
                  animationDelay: `${index * 50}ms`,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                {/* Hover shimmer effect - CSS only */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold}25 0%, transparent 50%)`
                  }}
                />

                {/* Status Badge */}
                {branch.status === 'archived' && (
                  <div
                    className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium z-10"
                    style={{
                      backgroundColor: `${COLORS.plum}30`,
                      color: COLORS.plum,
                      border: `1px solid ${COLORS.plum}50`
                    }}
                  >
                    Archived
                  </div>
                )}

                {/* Branch Content */}
                <div className="relative z-10 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        backgroundColor: `${COLORS.gold}20`,
                        border: `1px solid ${COLORS.gold}40`
                      }}
                    >
                      <Building2 className="w-6 h-6" style={{ color: COLORS.gold }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold truncate mb-1" style={{ color: COLORS.champagne }}>
                        {branch.entity_name}
                      </h3>
                      {branch.entity_code && (
                        <p className="text-xs opacity-60" style={{ color: COLORS.bronze }}>
                          {branch.entity_code}
                        </p>
                      )}
                    </div>
                  </div>

                  {branch.entity_description && (
                    <p className="text-sm mb-4 line-clamp-2 opacity-80" style={{ color: COLORS.lightText }}>
                      {branch.entity_description}
                    </p>
                  )}

                  {/* Branch Details */}
                  <div className="space-y-2 mb-4">
                    {branch.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.bronze }} />
                        <span style={{ color: COLORS.lightText }}>{branch.city}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.bronze }} />
                        <span style={{ color: COLORS.lightText }}>{branch.phone}</span>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.bronze }} />
                        <span style={{ color: COLORS.lightText }}>{branch.email}</span>
                      </div>
                    )}
                    {branch.manager_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.bronze }} />
                        <span style={{ color: COLORS.lightText }}>{branch.manager_name}</span>
                      </div>
                    )}
                    {(branch.opening_time || branch.closing_time) && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.bronze }} />
                        <span style={{ color: COLORS.lightText }}>
                          {branch.opening_time} - {branch.closing_time}
                        </span>
                      </div>
                    )}
                    {/* 🎯 ENTERPRISE GPS LOCATION */}
                    {branch.gps_latitude && branch.gps_longitude && (
                      <div
                        className="flex items-center justify-between gap-2 text-sm p-2 rounded-md mt-2"
                        style={{
                          backgroundColor: `${COLORS.gold}10`,
                          border: `1px solid ${COLORS.gold}30`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 flex-shrink-0" style={{ color: COLORS.gold }} />
                          <span style={{ color: COLORS.gold, fontSize: '0.75rem' }}>
                            {branch.gps_latitude.toFixed(4)}, {branch.gps_longitude.toFixed(4)}
                          </span>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${branch.gps_latitude},${branch.gps_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                          style={{ color: COLORS.gold }}
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="text-xs">Map</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: `${COLORS.bronze}30` }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(branch)}
                      className="flex-1 transition-all duration-200"
                      style={{ color: COLORS.gold }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    {branch.status === 'active' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(branch)}
                        className="flex-1 transition-all duration-200"
                        style={{ color: COLORS.plum }}
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(branch)}
                        className="flex-1 transition-all duration-200"
                        style={{ color: COLORS.emerald }}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(branch)}
                      className="transition-all duration-200 hover:text-red-400"
                      style={{ color: COLORS.lightText }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-20 md:h-0" />
      </div>

      {/* MODALS - Lazy Loaded */}
      {modalOpen && (
        <Suspense fallback={null}>
          <BranchModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingBranch(null)
            }}
            branch={editingBranch}
            onSave={handleSave}
          />
        </Suspense>
      )}

      {/* Delete Branch Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent
          className="max-w-md"
          style={{
            backgroundColor: COLORS.charcoal,
            border: `1px solid ${COLORS.bronze}40`,
            boxShadow: '0 20px 30px rgba(0,0,0,0.3)'
          }}
        >
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#FF6B6B20',
                  border: '1px solid #FF6B6B40'
                }}
              >
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <AlertDialogTitle className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                Delete Branch
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3" style={{ color: COLORS.lightText }}>
            <p className="text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold" style={{ color: COLORS.champagne }}>
                "{branchToDelete?.entity_name}"
              </span>
              ?
            </p>
            <p className="text-sm opacity-70">
              This action cannot be undone. The branch will be permanently removed from your organization.
            </p>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setBranchToDelete(null)
              }}
              disabled={isDeleting}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete Branch'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalonLuxePage>
  )
}

export default function SalonBranchesPage() {
  return (
    <StatusToastProvider>
      <SalonBranchesPageContent />
    </StatusToastProvider>
  )
}
