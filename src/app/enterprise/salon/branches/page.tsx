'use client'
// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";



// Removed force-dynamic for better client-side navigation performance

import React, { useState, useMemo, useCallback } from 'react'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { useHeraBranches } from '@/hooks/useHeraBranches'
import { BranchModal } from '@/components/salon/branches/BranchModal'
import type { BranchFormValues } from '@/components/salon/branches/BranchModal'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { PageHeader, PageHeaderSearch, PageHeaderButton } from '@/components/universal/PageHeader'
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
  ExternalLink
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
import type { BranchEntity } from '@/hooks/useHeraBranches'

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#B794F4',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  // Animation timing functions
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  ease: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
}

function SalonBranchesPageContent() {
  const { organization } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const organizationId = organization?.id

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<BranchEntity | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<BranchEntity | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch branches using Universal API v2 - always include archived for accurate KPIs
  const {
    branches: allBranches,
    isLoading,
    error,
    createBranch,
    updateBranch,
    deleteBranch,
    archiveBranch,
    restoreBranch
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

  // Calculate KPIs - now using all branches for accurate counts
  const totalBranches = allBranches?.length || 0
  const activeBranches = allBranches?.filter(b => b.status === 'active').length || 0
  const archivedBranches = allBranches?.filter(b => b.status === 'archived').length || 0

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
        console.error('Branch save error:', error)
        removeToast(loadingId)
        showError(
          editingBranch ? 'Failed to update branch' : 'Failed to create branch',
          error.message || 'Please try again or contact support'
        )
      }
    },
    [editingBranch, updateBranch, createBranch, showLoading, removeToast, showSuccess, showError]
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
      const result = await deleteBranch(branchToDelete.id)

      removeToast(loadingId)

      if (result.archived) {
        showSuccess(
          'Branch archived',
          result.message || `${branchToDelete.entity_name} has been archived`
        )
      } else {
        showSuccess(
          'Branch deleted',
          `${branchToDelete.entity_name} has been permanently removed`
        )
      }

      setDeleteDialogOpen(false)
      setBranchToDelete(null)
    } catch (error: any) {
      removeToast(loadingId)
      showError('Failed to delete branch', error.message || 'Please try again')
    } finally {
      setIsDeleting(false)
    }
  }, [branchToDelete, deleteBranch, showLoading, removeToast, showSuccess, showError])

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
        removeToast(loadingId)
        showError('Failed to archive branch', error.message || 'Please try again')
      }
    },
    [archiveBranch, showLoading, removeToast, showSuccess, showError]
  )

  const handleRestore = useCallback(
    async (branch: BranchEntity) => {
      const loadingId = showLoading('Restoring branch...', 'Please wait while we restore the branch')

      try {
        await restoreBranch(branch.id)
        removeToast(loadingId)
        showSuccess('Branch restored', `${branch.entity_name} has been restored`)
      } catch (error: any) {
        removeToast(loadingId)
        showError('Failed to restore branch', error.message || 'Please try again')
      }
    },
    [restoreBranch, showLoading, removeToast, showSuccess, showError]
  )

  const handleExport = useCallback(() => {
    showSuccess('Export started', 'Your branches will be exported shortly')
  }, [showSuccess])

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="h-full flex flex-col">
        {/* Background gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at top right, rgba(212, 175, 55, 0.15), transparent 50%), radial-gradient(ellipse at bottom left, rgba(15, 111, 92, 0.1), transparent 50%)'
          }}
        />

        {/* Main Content */}
        <div
          className="relative flex-1 overflow-auto"
          style={{
            backgroundColor: COLORS.charcoal,
            minHeight: '100vh',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3)'
          }}
        >
          <PageHeader
            title="Branches"
            breadcrumbs={[
              { label: 'HERA' },
              { label: 'SALON OS' },
              { label: 'Branches', isActive: true }
            ]}
            actions={
              <>
                <PageHeaderSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search branches..."
                />
                <PageHeaderButton
                  variant="primary"
                  icon={Plus}
                  onClick={() => {
                    setEditingBranch(null)
                    setModalOpen(true)
                  }}
                >
                  New Branch
                </PageHeaderButton>
                <PageHeaderButton variant="secondary" icon={Download} onClick={handleExport} />
              </>
            }
          />

          {/* Error Banner */}
          {error && (
            <div
              className="mx-6 mt-4 text-sm px-3 py-2 rounded-lg border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                borderColor: 'rgba(255, 0, 0, 0.3)',
                color: COLORS.lightText
              }}
            >
              <Sparkles className="h-4 w-4 animate-pulse" style={{ color: '#FF6B6B' }} />
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="mx-6 mt-6 grid grid-cols-4 gap-4">
            <div
              className="p-4 rounded-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.bronze}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '0ms',
                transition: `all 0.4s ${COLORS.spring}`,
                background: `linear-gradient(135deg, rgba(245,230,200,0.05) 0%, rgba(212,175,55,0.03) 100%)`
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.style.background = `
                  radial-gradient(circle at ${x}% ${y}%,
                    rgba(245,230,200,0.12) 0%,
                    rgba(212,175,55,0.06) 40%,
                    rgba(184,134,11,0.03) 100%
                  )
                `
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(212,175,55,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,230,200,0.05) 0%, rgba(212,175,55,0.03) 100%)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Total Branches
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.champagne }}>
                {totalBranches}
              </p>
            </div>
            <div
              className="p-4 rounded-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.emerald}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '100ms',
                transition: `all 0.4s ${COLORS.spring}`,
                background: `linear-gradient(135deg, rgba(15,111,92,0.05) 0%, rgba(15,111,92,0.02) 100%)`
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.style.background = `
                  radial-gradient(circle at ${x}% ${y}%,
                    rgba(15,111,92,0.12) 0%,
                    rgba(15,111,92,0.06) 40%,
                    rgba(15,111,92,0.02) 100%
                  )
                `
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,111,92,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(15,111,92,0.05) 0%, rgba(15,111,92,0.02) 100%)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Active Branches
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.emerald }}>
                {activeBranches}
              </p>
            </div>
            <div
              className="p-4 rounded-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.plum}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '200ms',
                transition: `all 0.4s ${COLORS.spring}`,
                background: `linear-gradient(135deg, rgba(183,148,244,0.05) 0%, rgba(183,148,244,0.02) 100%)`
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.style.background = `
                  radial-gradient(circle at ${x}% ${y}%,
                    rgba(183,148,244,0.12) 0%,
                    rgba(183,148,244,0.06) 40%,
                    rgba(183,148,244,0.02) 100%
                  )
                `
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(183,148,244,0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(183,148,244,0.05) 0%, rgba(183,148,244,0.02) 100%)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                Archived
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: COLORS.plum }}>
                {archivedBranches}
              </p>
            </div>
            <div
              className="p-4 rounded-lg cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              style={{
                backgroundColor: COLORS.charcoalLight + '95',
                border: `1px solid ${COLORS.gold}33`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                animationDelay: '300ms',
                transition: `all 0.4s ${COLORS.spring}`,
                background: `linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.02) 100%)`
              }}
              onMouseMove={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                e.currentTarget.style.background = `
                  radial-gradient(circle at ${x}% ${y}%,
                    rgba(212,175,55,0.15) 0%,
                    rgba(212,175,55,0.08) 40%,
                    rgba(184,134,11,0.03) 100%
                  )
                `
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(212,175,55,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.02) 100%)'
              }}
            >
              <p className="text-sm opacity-60" style={{ color: COLORS.lightText }}>
                GPS Locations
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Navigation className="w-5 h-5" style={{ color: COLORS.gold }} />
                <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>
                  {allBranches?.filter(b => b.gps_latitude && b.gps_longitude).length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Filters and View Options */}
          <div className="mx-6 mt-6 flex items-center justify-between">
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

          {/* Content Area with Fade-in Animation */}
          <div className="mx-6 mt-6 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
                <div className="text-center">
                  <Sparkles
                    className="w-12 h-12 mx-auto mb-3 animate-pulse"
                    style={{ color: COLORS.gold }}
                  />
                  <p style={{ color: COLORS.lightText }}>Loading branches...</p>
                </div>
              </div>
            ) : filteredBranches.length === 0 ? (
              <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
                <div className="text-center">
                  <Building2
                    className="w-12 h-12 mx-auto mb-3 opacity-30"
                    style={{ color: COLORS.gold }}
                  />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {filteredBranches.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="group relative overflow-hidden rounded-lg border animate-in fade-in slide-in-from-bottom-2"
                    style={{
                      backgroundColor: COLORS.charcoalLight + '95',
                      borderColor: branch.status === 'archived' ? `${COLORS.plum}40` : `${COLORS.bronze}40`,
                      animationDelay: `${index * 50}ms`,
                      transition: `all 0.4s ${COLORS.spring}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)',
                      background: `linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)`
                    }}
                    onMouseMove={e => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      e.currentTarget.style.background = `
                        radial-gradient(circle at ${x}% ${y}%,
                          rgba(212,175,55,0.15) 0%,
                          rgba(212,175,55,0.08) 30%,
                          rgba(245,230,200,0.05) 60%,
                          rgba(184,134,11,0.03) 100%
                        )
                      `
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)'
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                      e.currentTarget.style.borderColor = `${COLORS.gold}60`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)'
                      e.currentTarget.style.borderColor = branch.status === 'archived' ? `${COLORS.plum}40` : `${COLORS.bronze}40`
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)'
                    }}
                  >
                    {/* Status Badge */}
                    {branch.status === 'archived' && (
                      <div
                        className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium"
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
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: `${COLORS.gold}20`,
                            border: `1px solid ${COLORS.gold}40`
                          }}
                        >
                          <Building2 className="w-6 h-6" style={{ color: COLORS.gold }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-lg font-semibold truncate mb-1"
                            style={{ color: COLORS.champagne }}
                          >
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
                        <p
                          className="text-sm mb-4 line-clamp-2 opacity-80"
                          style={{ color: COLORS.lightText }}
                        >
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
                              <Navigation
                                className="w-4 h-4 flex-shrink-0"
                                style={{ color: COLORS.gold }}
                              />
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
          </div>

          {/* Modals */}
          <BranchModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingBranch(null)
            }}
            branch={editingBranch}
            onSave={handleSave}
          />

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
                  <AlertDialogTitle
                    className="text-lg font-semibold"
                    style={{ color: COLORS.champagne }}
                  >
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
                  This action cannot be undone. The branch will be permanently removed.
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
        </div>
      </div>
    </div>
  )
}

export default function SalonBranchesPage() {
  return (
    <StatusToastProvider>
      <SalonBranchesPageContent />
    </StatusToastProvider>
  )
}
