'use client'

// Removed force-dynamic for better client-side navigation performance

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { useSecuredSalonContext } from '../SecuredSalonProvider'
import { useHeraServices } from '@/hooks/useHeraServices'
import { useHeraServiceCategories } from '@/hooks/useHeraServiceCategories'
import { StatusToastProvider, useSalonToast } from '@/components/salon/ui/StatusToastProvider'
import { Service, ServiceFormValues } from '@/types/salon-service'
import { ServiceCategory, ServiceCategoryFormValues } from '@/types/salon-service'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { PremiumMobileHeader } from '@/components/salon/mobile/PremiumMobileHeader'
// ✅ SSR FIX: Dynamically import xlsx only when needed (browser-only library)
// import * as XLSX from 'xlsx' // REMOVED - causes SSR crash

// 🚀 LAZY LOADING: Split code for faster initial load
const ServiceList = lazy(() =>
  import('@/components/salon/services/ServiceList').then(module => ({ default: module.ServiceList }))
)
const ServiceModal = lazy(() =>
  import('@/components/salon/services/ServiceModal').then(module => ({ default: module.ServiceModal }))
)
const ServiceCategoryModal = lazy(() =>
  import('@/components/salon/services/ServiceCategoryModal').then(module => ({
    default: module.ServiceCategoryModal
  }))
)
import {
  Plus,
  Grid3X3,
  List,
  Sparkles,
  Search,
  Download,
  Upload,
  Filter,
  X,
  Tag,
  FolderPlus,
  AlertTriangle,
  Clock,
  Building2,
  MapPin,
  RefreshCw,
  DollarSign
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
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
function ServiceListSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-lg"
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

  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-lg"
          style={{ backgroundColor: COLORS.charcoalLight + '95' }}
        />
      ))}
    </div>
  )
}

function SalonServicesPageContent() {
  const router = useRouter()
  const {
    organization,
    currency,
    selectedBranchId,
    availableBranches,
    setSelectedBranchId,
    isLoadingBranches
  } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()
  const organizationId = organization?.id

  // 🔍 DEBUG: Log organization context
  if (process.env.NODE_ENV === 'development') {
    console.log('[SalonServicesPage] 🏢 Organization context:', {
      organizationId,
      organizationName: organization?.entity_name,
      branchCount: availableBranches?.length
    })
  }

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('name_asc')
  // Local branch filter state (separate from global context)
  const [localBranchFilter, setLocalBranchFilter] = useState<string | null>(null)

  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [categoryDeleteDialogOpen, setCategoryDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<ServiceCategory | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importResults, setImportResults] = useState<{
    total: number
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  // 🚨 ENTERPRISE ERROR LOGGING: Detailed console logs with timestamps
  // MUST be defined BEFORE any handlers that use it to avoid temporal dead zone
  const logError = useCallback((context: string, error: any, additionalInfo?: any) => {
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

    console.error('🚨 [HERA Services Error]', errorLog)

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
  }, [organizationId, organization?.entity_name])

  // ✅ PERFORMANCE FIX: Fetch services ONCE (not twice!) with NO filters
  // Then derive both KPIs and filtered list from this single dataset
  // This cuts API calls in HALF and makes initial load much faster
  const {
    services: allServices,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    archiveService,
    restoreService
  } = useHeraServices({
    organizationId,
    filters: {
      // Fetch ALL services (no filters) - we'll filter in memory
      branch_id: undefined,
      category_id: undefined,
      status: undefined, // Get everything - filtering happens client-side
      limit: 20 // ✅ FIXED: Reduced limit for faster load (typical salon has 5-20 services)
    }
  })

  // Derive filtered services for display (client-side filtering is fast)
  const services = useMemo(() => {
    if (!allServices) return []

    return allServices.filter(service => {
      // Apply tab filter (active vs all)
      if (!includeArchived && service.status === 'archived') return false

      // Apply branch filter (if selected)
      if (localBranchFilter) {
        const availableAt = service.relationships?.available_at || service.relationships?.AVAILABLE_AT
        if (!availableAt) return false

        if (Array.isArray(availableAt)) {
          const hasMatch = availableAt.some(
            rel => rel.to_entity?.id === localBranchFilter || rel.to_entity_id === localBranchFilter
          )
          if (!hasMatch) return false
        } else {
          if (availableAt.to_entity?.id !== localBranchFilter && availableAt.to_entity_id !== localBranchFilter) {
            return false
          }
        }
      }

      // Apply category filter (if selected)
      if (categoryFilter && service.category !== categoryFilter) return false

      return true
    })
  }, [allServices, includeArchived, localBranchFilter, categoryFilter])

  // KPIs always use ALL services (unfiltered) for accurate totals
  const allServicesForKPIs = allServices

  // Fetch categories using Universal API v2
  const {
    categories: serviceCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    archiveCategory,
    isCreating: isCreatingCategory,
    isUpdating: isUpdatingCategory
  } = useHeraServiceCategories({
    organizationId,
    includeArchived: false
  })

  // Memoized computed values for performance
  const categories = useMemo(
    () => serviceCategories.filter(cat => cat && cat.entity_name).map(cat => cat.entity_name),
    [serviceCategories]
  )

  // Filter and sort services - memoized for performance
  const filteredServices = useMemo(() => {
    // First, filter the services
    let filtered = services.filter(service => {
      if (!service || !service.entity_name) return false

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !service.entity_name.toLowerCase().includes(query) &&
          !service.entity_code?.toLowerCase().includes(query)
        ) {
          return false
        }
      }

      // Branch filter is handled in useHeraServices hook via AVAILABLE_AT relationships
      // No additional filtering needed here

      // Category filter
      if (categoryFilter && service.category !== categoryFilter) {
        return false
      }

      return true
    })

    // Then, apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return (a.entity_name || '').localeCompare(b.entity_name || '')
        case 'name_desc':
          return (b.entity_name || '').localeCompare(a.entity_name || '')
        case 'price_asc':
          return (a.price_market || a.price || 0) - (b.price_market || b.price || 0)
        case 'price_desc':
          return (b.price_market || b.price || 0) - (a.price_market || a.price || 0)
        case 'duration_asc':
          return (a.duration_min || a.duration_minutes || 0) - (b.duration_min || b.duration_minutes || 0)
        case 'duration_desc':
          return (b.duration_min || b.duration_minutes || 0) - (a.duration_min || a.duration_minutes || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [services, searchQuery, categoryFilter, sortBy])

  // CRUD handlers - memoized for performance
  const handleSave = useCallback(
    async (data: ServiceFormValues) => {
      const loadingId = showLoading(
        editingService ? 'Updating service...' : 'Creating service...',
        'Please wait while we save your changes'
      )

      try {
        // CRITICAL: If no branches are selected, default to ALL branches
        // This ensures the service is visible regardless of branch filter
        const branchesToLink =
          data.branch_ids && data.branch_ids.length > 0
            ? data.branch_ids
            : availableBranches.map(b => b.id) // Default to ALL branches

        // Map form data to hook's expected format
        const serviceData = {
          name: data.name,
          price_market: data.price || 0,
          duration_min: data.duration_minutes || 0,
          commission_rate: 0.5, // Default commission rate
          description: data.description || '',
          active: data.status === 'active',
          requires_booking: data.requires_booking || false,
          category_id: data.category || undefined,
          branch_ids: branchesToLink, // Always link to at least one branch
          // 🎯 CRITICAL FIX: Pass status for BOTH create and edit (not conditional)
          // This allows status dropdown to work properly in the modal
          status: data.status
        }

        if (editingService) {
          await updateService(editingService.id, serviceData)
          removeToast(loadingId)
          showSuccess('Service updated successfully', `${data.name} has been updated`)
        } else {
          await createService(serviceData)
          removeToast(loadingId)
          showSuccess('Service created successfully', `${data.name} has been added`)
        }
        setModalOpen(false)
        setEditingService(null)
      } catch (error: any) {
        logError(editingService ? 'Update Service Failed' : 'Create Service Failed', error, {
          serviceName: data.name,
          serviceData: { ...data, branch_ids: branchesToLink }
        })
        removeToast(loadingId)
        showError(
          editingService ? 'Failed to update service' : 'Failed to create service',
          error.message || 'Please check the console for detailed error information and try again'
        )
      }
    },
    [
      editingService,
      availableBranches,
      updateService,
      createService,
      showLoading,
      removeToast,
      showSuccess,
      showError,
      logError
    ]
  )

  const handleEdit = useCallback((service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }, [])

  const handleDelete = useCallback((service: Service) => {
    setServiceToDelete(service)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!serviceToDelete) return

    const loadingId = showLoading('Deleting service...', 'This action cannot be undone')
    setIsDeleting(true)

    try {
      // 🎯 ENTERPRISE PATTERN: Smart delete with automatic fallback to archive
      // Try hard delete first, but if service is referenced, archive instead
      const result = await deleteService(serviceToDelete.id)

      removeToast(loadingId)

      if (result.archived) {
        // Service was archived instead of deleted (referenced in appointments/transactions)
        showSuccess(
          'Service archived',
          result.message || `${serviceToDelete.entity_name} has been archived`
        )
      } else {
        // Service was successfully deleted
        showSuccess(
          'Service deleted',
          `${serviceToDelete.entity_name} has been permanently removed`
        )
      }

      setDeleteDialogOpen(false)
      setServiceToDelete(null)
    } catch (error: any) {
      logError('Delete Service Failed', error, {
        serviceId: serviceToDelete.id,
        serviceName: serviceToDelete.entity_name
      })
      removeToast(loadingId)
      showError('Failed to delete service', error.message || 'Please check the console for detailed error information')
    } finally {
      setIsDeleting(false)
    }
  }, [serviceToDelete, deleteService, showLoading, removeToast, showSuccess, showError, logError])

  const handleArchive = useCallback(
    async (service: Service) => {
      const loadingId = showLoading(
        'Archiving service...',
        'Please wait while we update the service status'
      )

      try {
        await archiveService(service.id)
        removeToast(loadingId)
        showSuccess('Service archived', `${service.entity_name} has been archived`)
      } catch (error: any) {
        logError('Archive Service Failed', error, {
          serviceId: service.id,
          serviceName: service.entity_name
        })
        removeToast(loadingId)
        showError('Failed to archive service', error.message || 'Please check the console for detailed error information')
      }
    },
    [archiveService, showLoading, removeToast, showSuccess, showError, logError]
  )

  const handleRestore = useCallback(
    async (service: Service) => {
      const loadingId = showLoading(
        'Restoring service...',
        'Please wait while we restore the service'
      )

      try {
        await restoreService(service.id)
        removeToast(loadingId)
        showSuccess('Service restored', `${service.entity_name} has been restored`)
      } catch (error: any) {
        logError('Restore Service Failed', error, {
          serviceId: service.id,
          serviceName: service.entity_name
        })
        removeToast(loadingId)
        showError('Failed to restore service', error.message || 'Please check the console for detailed error information')
      }
    },
    [restoreService, showLoading, removeToast, showSuccess, showError, logError]
  )

  // 📊 EXCEL TEMPLATE: Enterprise-grade with formatting and instructions
  const handleDownloadTemplate = useCallback(async () => {
    try {
      // ✅ SSR FIX: Dynamically import xlsx (browser-only)
      const XLSX = await import('xlsx')

      // Create workbook
      const wb = XLSX.utils.book_new()

      // ===== INSTRUCTIONS SHEET =====
      const instructionsData = [
        ['HERA Services Import Template'],
        [''],
        ['⚠️ IMPORTANT: CREATE CATEGORIES & BRANCHES FIRST'],
        ['If you need a category or branch that doesn\'t exist in the lists below,'],
        ['please create it in the system FIRST, then download a fresh template before uploading.'],
        [''],
        ['INSTRUCTIONS:'],
        ['1. Fill in the "Services Data" sheet with your services'],
        ['2. Required field: Name (marked with * in header)'],
        ['3. Optional fields: Code, Category, Price, Duration, Status, Branches, Description, Requires Booking'],
        ['4. Category must match existing category names exactly (case-insensitive)'],
        ['5. Branch names must match existing branch names exactly (case-insensitive)'],
        ['6. Multiple branches: Separate with semicolon (e.g., "Main Branch; Downtown")'],
        ['7. Status: Enter "active" or "archived" (defaults to active)'],
        ['8. Requires Booking: Enter "Yes" or "No" (defaults to No)'],
        ['9. Save and upload the file to import'],
        [''],
        ['AVAILABLE CATEGORIES:'],
        ...serviceCategories.map(cat => [cat.entity_name]),
        [''],
        ['AVAILABLE BRANCHES:'],
        ...availableBranches.map(branch => [branch.entity_name]),
        [''],
        ['EXAMPLE SERVICE (for reference only):'],
        ['Name*', 'Code', 'Category', 'Price', 'Duration (min)', 'Status', 'Branches', 'Description', 'Requires Booking'],
        [
          'Premium Cut & Style',
          'SVC-001',
          serviceCategories[0]?.entity_name || 'Hair',
          150,
          60,
          'active',
          availableBranches.map(b => b.entity_name).join('; ') || 'All Branches',
          'Professional haircut with styling consultation',
          'Yes'
        ]
      ]

      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)

      // Style the instructions sheet with wider columns
      instructionsSheet['!cols'] = [
        { wch: 25 }, // Name
        { wch: 12 }, // Code
        { wch: 15 }, // Category
        { wch: 10 }, // Price
        { wch: 15 }, // Duration
        { wch: 10 }, // Status
        { wch: 30 }, // Branches
        { wch: 40 }, // Description
        { wch: 18 }  // Requires Booking
      ]

      XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions')

      // ===== DATA SHEET (Headers only - no example row) =====
      const headers = [
        'Name*',
        'Code',
        'Category',
        'Price',
        'Duration (min)',
        'Status',
        'Branches',
        'Description',
        'Requires Booking'
      ]

      const dataSheet = XLSX.utils.aoa_to_sheet([headers])

      // Set column widths for better readability
      dataSheet['!cols'] = [
        { wch: 25 }, // Name
        { wch: 12 }, // Code
        { wch: 15 }, // Category
        { wch: 10 }, // Price
        { wch: 15 }, // Duration
        { wch: 10 }, // Status
        { wch: 30 }, // Branches
        { wch: 40 }, // Description
        { wch: 18 }  // Requires Booking
      ]

      XLSX.utils.book_append_sheet(wb, dataSheet, 'Services Data')

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      // Download
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `services-import-template.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showSuccess('Template downloaded', 'Fill in the Excel template with your services and import it back')
    } catch (error: any) {
      logError('Template Download Failed', error, {
        categoryCount: serviceCategories.length,
        branchCount: availableBranches.length
      })
      showError('Template download failed', error.message || 'Please check the console for detailed error information')
    }
  }, [serviceCategories, availableBranches, showSuccess, showError, logError])

  // 📊 EXCEL/CSV IMPORT: Supports both file formats with smart parsing
  const handleImport = useCallback(async (file: File) => {
    setIsImporting(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      let headers: string[] = []
      let rows: any[][] = []

      // Detect file type and parse accordingly
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

      if (isExcel) {
        // ✅ SSR FIX: Dynamically import xlsx (browser-only)
        const XLSX = await import('xlsx')

        // ===== EXCEL PARSING =====
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })

        // Read from "Services Data" sheet or first sheet
        const sheetName = workbook.SheetNames.includes('Services Data')
          ? 'Services Data'
          : workbook.SheetNames[0]

        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][]

        if (jsonData.length === 0) {
          throw new Error('Excel file appears to be empty. Please add headers and data.')
        }

        headers = jsonData[0].map((h: any) => String(h || ''))
        rows = jsonData.slice(1).filter(row => row.some(cell => cell !== '' && cell !== null))

        // ✅ ENTERPRISE UX: Allow empty template uploads with friendly warning
        if (rows.length === 0) {
          console.log('📋 [HERA Services Import] Empty template uploaded (Excel)', {
            fileName: file.name,
            sheetName,
            headers: headers.length
          })
          setImportProgress(100)
          setImportResults({
            total: 0,
            success: 0,
            failed: 0,
            errors: []
          })
          showSuccess(
            'Template validated successfully',
            'No service data found. Fill in the "Services Data" sheet and upload again to import services.'
          )
          setIsImporting(false)
          return
        }

        setImportProgress(5)
      } else {
        // ===== CSV PARSING =====
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'))

        if (lines.length === 0) {
          throw new Error('CSV file appears to be empty. Please add headers and data.')
        }

        setImportProgress(5)

        // Parse CSV (handles quotes and commas)
        const parseLine = (line: string): string[] => {
          const result: string[] = []
          let current = ''
          let inQuotes = false

          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
              } else {
                inQuotes = !inQuotes
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }

        headers = parseLine(lines[0])
        rows = lines.slice(1).map(parseLine)

        // ✅ ENTERPRISE UX: Allow empty CSV template uploads with friendly warning
        if (rows.length === 0 || rows.every(row => row.every(cell => !cell))) {
          console.log('📋 [HERA Services Import] Empty template uploaded (CSV)', {
            fileName: file.name,
            headers: headers.length
          })
          setImportProgress(100)
          setImportResults({
            total: 0,
            success: 0,
            failed: 0,
            errors: []
          })
          showSuccess(
            'Template validated successfully',
            'No service data found. Fill in the CSV with your services and upload again.'
          )
          setIsImporting(false)
          return
        }
      }

      // Find column indexes (works for both Excel and CSV)
      const nameIdx = headers.findIndex(h => String(h).toLowerCase().includes('name'))
      const codeIdx = headers.findIndex(h => String(h).toLowerCase().includes('code'))
      const categoryIdx = headers.findIndex(h => String(h).toLowerCase().includes('category'))
      const priceIdx = headers.findIndex(h => String(h).toLowerCase().includes('price'))
      const durationIdx = headers.findIndex(h => String(h).toLowerCase().includes('duration'))
      const statusIdx = headers.findIndex(h => String(h).toLowerCase().includes('status'))
      const branchesIdx = headers.findIndex(h => String(h).toLowerCase().includes('branch'))
      const descIdx = headers.findIndex(h => String(h).toLowerCase().includes('description'))
      const bookingIdx = headers.findIndex(h => String(h).toLowerCase().includes('booking'))

      if (nameIdx === -1) {
        throw new Error('File must include a "Name" column')
      }

      setImportProgress(10)

      // Process rows and create services
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const rowNum = i + 2 // +2 because index starts at 0 and we skip header

        // Update progress (10% to 90%)
        const progress = 10 + Math.floor((i / rows.length) * 80)
        setImportProgress(progress)

        try {
          // Convert to string and trim (handles both Excel numbers and CSV strings)
          const name = String(row[nameIdx] || '').trim()
          if (!name) {
            errors.push(`Row ${rowNum}: Service name is required`)
            errorCount++
            continue
          }

          // Parse category - find category ID by name
          let categoryId: string | undefined
          if (categoryIdx !== -1 && row[categoryIdx]) {
            const categoryName = String(row[categoryIdx]).trim()
            const category = serviceCategories.find(
              c => c.entity_name?.toLowerCase() === categoryName.toLowerCase()
            )
            categoryId = category?.id
          }

          // Parse branches - find branch IDs by names
          let branchIds: string[] = []
          if (branchesIdx !== -1 && row[branchesIdx]) {
            const branchNames = String(row[branchesIdx]).split(';').map(b => b.trim())
            branchIds = branchNames
              .map(bName => availableBranches.find(b => b.entity_name?.toLowerCase() === bName.toLowerCase())?.id)
              .filter((id): id is string => !!id)
          }

          // Default to all branches if none specified
          if (branchIds.length === 0) {
            branchIds = availableBranches.map(b => b.id)
          }

          await createService({
            name,
            code: codeIdx !== -1 && row[codeIdx] ? String(row[codeIdx]).trim() : undefined,
            price_market: priceIdx !== -1 ? parseFloat(String(row[priceIdx] || '0')) || 0 : 0,
            duration_min: durationIdx !== -1 ? parseInt(String(row[durationIdx] || '0')) || 0 : 0,
            description: descIdx !== -1 && row[descIdx] ? String(row[descIdx]).trim() : '',
            status: statusIdx !== -1 && String(row[statusIdx]).toLowerCase() === 'archived' ? 'archived' : 'active',
            requires_booking: bookingIdx !== -1 ? String(row[bookingIdx]).toLowerCase() === 'yes' : false,
            category_id: categoryId,
            branch_ids: branchIds
          })

          successCount++
        } catch (error: any) {
          errors.push(`Row ${rowNum} (${row[nameIdx]}): ${error.message}`)
          errorCount++
        }
      }

      setImportProgress(100)

      // Set results
      setImportResults({
        total: rows.length,
        success: successCount,
        failed: errorCount,
        errors: errors.slice(0, 10) // Limit to first 10 errors
      })

      // Show results
      if (successCount > 0 && errorCount === 0) {
        showSuccess(
          'Import successful',
          `Imported ${successCount} service${successCount > 1 ? 's' : ''}`
        )
      } else if (successCount > 0 && errorCount > 0) {
        showSuccess(
          'Import partially successful',
          `Imported ${successCount} service${successCount > 1 ? 's' : ''}. ${errorCount} failed.`
        )
      } else {
        showError('Import failed', errors[0] || 'All services failed to import')
      }
    } catch (error: any) {
      logError('Import Services Failed', error, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      setImportResults({
        total: 0,
        success: 0,
        failed: 0,
        errors: [error.message || 'Import failed - check console for details']
      })
      showError('Import failed', error.message || 'Please check the console for detailed error information')
    } finally {
      setIsImporting(false)
    }
  }, [serviceCategories, availableBranches, createService, showSuccess, showError, logError])

  // 📊 EXCEL EXPORT: Professional export with formatting
  const handleExport = useCallback(async () => {
    if (!allServicesForKPIs || allServicesForKPIs.length === 0) {
      showError('No services to export', 'Please add some services first')
      return
    }

    try {
      // ✅ SSR FIX: Dynamically import xlsx (browser-only)
      const XLSX = await import('xlsx')

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Headers
      const headers = [
        'Name',
        'Code',
        'Category',
        'Price',
        'Duration (min)',
        'Status',
        'Branches',
        'Description',
        'Requires Booking'
      ]

      // Data rows
      const rows = allServicesForKPIs.map(service => {
        // Extract branch names from relationships
        const availableAt = service.relationships?.available_at || service.relationships?.AVAILABLE_AT || []
        const branchNames = Array.isArray(availableAt)
          ? availableAt
              .map(rel => {
                const branchId = rel.to_entity_id || rel.to_entity?.id
                return availableBranches.find(b => b.id === branchId)?.entity_name || ''
              })
              .filter(Boolean)
              .join('; ')
          : ''

        return [
          service.entity_name || '',
          service.entity_code || '',
          service.category || '',
          service.price_market || service.price || 0,
          service.duration_min || service.duration_minutes || 0,
          service.status || 'active',
          branchNames,
          service.description || '',
          service.requires_booking ? 'Yes' : 'No'
        ]
      })

      // Create worksheet from array of arrays
      const wsData = [headers, ...rows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Set column widths for better readability
      ws['!cols'] = [
        { wch: 25 }, // Name
        { wch: 12 }, // Code
        { wch: 15 }, // Category
        { wch: 10 }, // Price
        { wch: 15 }, // Duration
        { wch: 10 }, // Status
        { wch: 30 }, // Branches
        { wch: 40 }, // Description
        { wch: 18 }  // Requires Booking
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Services Export')

      // Generate Excel file
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      // Download
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `services-export-${new Date().toISOString().split('T')[0]}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showSuccess('Export successful', `Exported ${allServicesForKPIs.length} services to Excel`)
    } catch (error: any) {
      logError('Export Services Failed', error, {
        serviceCount: allServicesForKPIs?.length || 0
      })
      showError('Export failed', error.message || 'Please check the console for detailed error information')
    }
  }, [allServicesForKPIs, availableBranches, showSuccess, showError, logError])

  // Category CRUD handlers - memoized for performance
  const handleSaveCategory = useCallback(
    async (data: ServiceCategoryFormValues) => {
      const loadingId = showLoading(
        editingCategory ? 'Updating category...' : 'Creating category...',
        'Please wait while we save your changes'
      )

      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, data)
          removeToast(loadingId)
          showSuccess('Category updated successfully', `${data.name} has been updated`)
        } else {
          await createCategory(data)
          removeToast(loadingId)
          showSuccess('Category created successfully', `${data.name} has been added`)
        }
        setCategoryModalOpen(false)
        setEditingCategory(null)
      } catch (error: any) {
        logError(editingCategory ? 'Update Category Failed' : 'Create Category Failed', error, {
          categoryName: data.name,
          categoryData: data
        })
        removeToast(loadingId)
        showError(
          editingCategory ? 'Failed to update category' : 'Failed to create category',
          error.message || 'Please check the console for detailed error information and try again'
        )
      }
    },
    [
      editingCategory,
      updateCategory,
      createCategory,
      showLoading,
      removeToast,
      showSuccess,
      showError,
      logError
    ]
  )

  const handleEditCategory = useCallback((category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }, [])

  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return

    const loadingId = showLoading('Deleting category...', 'This action cannot be undone')
    setIsDeletingCategory(true)

    try {
      await deleteCategory(categoryToDelete.id)
      removeToast(loadingId)
      showSuccess('Category deleted', `${categoryToDelete.entity_name} has been removed`)
      setCategoryDeleteDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      logError('Delete Category Failed', error, {
        categoryId: categoryToDelete.id,
        categoryName: categoryToDelete.entity_name,
        serviceCount: categoryToDelete.service_count
      })
      removeToast(loadingId)
      showError('Failed to delete category', error.message || 'Please check the console for detailed error information')
    } finally {
      setIsDeletingCategory(false)
    }
  }, [categoryToDelete, deleteCategory, showLoading, removeToast, showSuccess, showError, logError])

  // Calculate global KPIs - memoized for performance
  // 🎯 ENTERPRISE DASHBOARD PATTERN: KPIs show GLOBAL metrics, independent of tab/filter
  // Tab selection controls the LIST below, not the dashboard metrics
  // This is standard enterprise UX where KPIs = "big picture", Filters = "drill-down"

  const totalServicesCount = useMemo(() => allServicesForKPIs?.length || 0, [allServicesForKPIs])

  const activeCount = useMemo(
    () => allServicesForKPIs?.filter(s => s && s.status === 'active').length || 0,
    [allServicesForKPIs]
  )

  const totalRevenue = useMemo(
    () =>
      allServicesForKPIs
        ?.filter(s => s && s.status === 'active')
        .reduce((sum, service) => sum + (service.price_market || service.price || 0), 0) || 0,
    [allServicesForKPIs]
  )

  const avgDuration = useMemo(() => {
    const validServices =
      allServicesForKPIs?.filter(s => s && (s.duration_min !== undefined || s.duration_minutes !== undefined)) || []
    return validServices.length > 0
      ? validServices.reduce((sum, service) => sum + (service.duration_min || service.duration_minutes || 0), 0) /
          validServices.length
      : 0
  }, [allServicesForKPIs])

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
    if (hours > 0) return `${hours}h`
    return `${mins}m`
  }, [])

  return (
    <SalonLuxePage
      title="Services"
      description="Manage your service catalog and pricing"
      actions={
        <>
          {/* New Category - Emerald */}
          <button
            onClick={() => {
              setEditingCategory(null)
              setCategoryModalOpen(true)
            }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.emerald,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.emerald}`
            }}
          >
            <FolderPlus className="w-4 h-4" />
            New Category
          </button>
          {/* New Service - Gold */}
          <button
            onClick={() => {
              setEditingService(null)
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
            New Service
          </button>
          {/* Import - Bronze */}
          <button
            onClick={() => setImportModalOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.bronze,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.bronze}`
            }}
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          {/* Export - Plum */}
          <button
            onClick={handleExport}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: COLORS.plum,
              color: COLORS.champagne,
              border: `1px solid ${COLORS.plum}`
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
        title="Services"
        subtitle={`${totalServicesCount} services`}
        showNotifications={false}
        shrinkOnScroll
        rightAction={
          <button
            onClick={() => {
              setEditingService(null)
              setModalOpen(true)
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#D4AF37] active:scale-90 transition-transform duration-200 shadow-lg"
            aria-label="Add new service"
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
                <p className="font-semibold" style={{ color: COLORS.champagne }}>Failed to load services</p>
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
                      logError('User clicked View Details on error banner', error, { page: 'services' })
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

        {/* Categories Section */}
        {serviceCategories.length > 0 && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag
                  className="w-4 h-4 transition-transform duration-200 hover:scale-110"
                  style={{ color: COLORS.gold }}
                />
                <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
                  Categories ({serviceCategories.length})
                </h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceCategories.map((category, index) => (
                <div
                  key={category.id}
                  className="group relative px-3 py-1.5 rounded-lg border transition-all duration-200 hover:scale-105 hover:shadow-md animate-in fade-in slide-in-from-left-2"
                  style={{
                    backgroundColor: category.color + '15',
                    borderColor: category.color + '40',
                    animationDelay: `${index * 50}ms`,
                    color: COLORS.champagne
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      <Tag className="w-3 h-3" style={{ color: category.color }} />
                      <span className="text-xs font-medium">{category.entity_name}</span>
                      {category.service_count > 0 && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: category.color + '30',
                            color: COLORS.champagne
                          }}
                        >
                          {category.service_count}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setCategoryToDelete(category)
                        setCategoryDeleteDialogOpen(true)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-400"
                      title="Delete category"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 📊 KPI CARDS - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
          <SalonLuxeKPICard
            title="Total Services"
            value={totalServicesCount}
            icon={Sparkles}
            color={COLORS.bronze}
            description="Across all categories"
            animationDelay={0}
          />
          <SalonLuxeKPICard
            title="Active Services"
            value={activeCount}
            icon={Sparkles}
            color={COLORS.emerald}
            description="Ready to book"
            animationDelay={100}
            badge={
              totalServicesCount > 0
                ? `${((activeCount / totalServicesCount) * 100).toFixed(0)}%`
                : undefined
            }
          />
          <SalonLuxeKPICard
            title="Revenue Potential"
            value={`${currency || 'AED'} ${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            color={COLORS.gold}
            description="Total catalog value"
            animationDelay={200}
            highlight
          />
          <SalonLuxeKPICard
            title="Avg Duration"
            value={formatDuration(avgDuration)}
            icon={Clock}
            color={COLORS.plum}
            description="Per service"
            animationDelay={300}
          />
        </div>

        {/* 📱 MOBILE QUICK ACTIONS */}
        <div className="md:hidden mb-6 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingCategory(null)
                setCategoryModalOpen(true)
              }}
              className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.emerald,
                color: COLORS.champagne
              }}
            >
              <FolderPlus className="w-4 h-4" />
              New Category
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
          <div className="flex gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.bronze,
                color: COLORS.champagne
              }}
            >
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
            <button
              onClick={handleExport}
              className="flex-1 min-h-[48px] rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: COLORS.plum,
                color: COLORS.champagne
              }}
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filters and View Options - MOBILE RESPONSIVE */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          {/* Left Side: Tabs, Filters, Badges */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex items-center gap-3">
              <Tabs
                value={includeArchived ? 'all' : 'active'}
                onValueChange={v => setIncludeArchived(v === 'all')}
              >
                <TabsList style={{ backgroundColor: COLORS.charcoalLight }}>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="all">All Services</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="transition-all duration-200 hover:scale-105"
                style={{
                  color: showFilters ? COLORS.gold : COLORS.lightText,
                  backgroundColor: showFilters ? `${COLORS.gold}20` : 'transparent'
                }}
              >
                <Filter className="h-4 w-4 mr-1" />
                <span className="font-medium hidden md:inline">Filters</span>
              </Button>
            </div>

            {/* Filter Badges - Wrap on mobile */}
            <div className="flex flex-wrap items-center gap-2">
              {localBranchFilter && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2"
                  style={{
                    backgroundColor: COLORS.gold + '20',
                    borderColor: COLORS.gold + '40',
                    color: COLORS.champagne
                  }}
                >
                  <Building2 className="h-3 w-3" style={{ color: COLORS.gold }} />
                  <span className="text-xs md:text-sm">
                    {availableBranches.find(b => b.id === localBranchFilter)?.entity_name ||
                      'Branch'}
                  </span>
                  <button
                    onClick={() => setLocalBranchFilter(null)}
                    className="ml-1 hover:scale-110 active:scale-95 transition-all duration-200 rounded-full p-0.5 hover:bg-gold/20"
                    aria-label="Clear branch filter"
                  >
                    <X className="h-3 w-3" style={{ color: COLORS.gold }} />
                  </button>
                </div>
              )}
              {categoryFilter && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-left-2"
                  style={{
                    backgroundColor: COLORS.gold + '20',
                    borderColor: COLORS.gold + '40',
                    color: COLORS.champagne
                  }}
                >
                  <Tag className="h-3 w-3" style={{ color: COLORS.gold }} />
                  <span className="text-xs md:text-sm">{categoryFilter}</span>
                  <button
                    onClick={() => setCategoryFilter('')}
                    className="ml-1 hover:scale-110 active:scale-95 transition-all duration-200 rounded-full p-0.5 hover:bg-gold/20"
                    aria-label="Clear category filter"
                  >
                    <X className="h-3 w-3" style={{ color: COLORS.gold }} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Sort and View Toggle - Full width on mobile */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger
                className="flex-1 md:w-48 transition-all duration-200 hover:scale-105 hover:border-gold/50"
                style={{
                  backgroundColor: COLORS.charcoalLight + '80',
                  borderColor: COLORS.bronze + '40',
                  color: COLORS.champagne
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="name_asc" className="hera-select-item">
                  Name (A-Z)
                </SelectItem>
                <SelectItem value="name_desc" className="hera-select-item">
                  Name (Z-A)
                </SelectItem>
                <SelectItem value="duration_asc" className="hera-select-item">
                  Duration (Shortest)
                </SelectItem>
                <SelectItem value="duration_desc" className="hera-select-item">
                  Duration (Longest)
                </SelectItem>
                <SelectItem value="price_asc" className="hera-select-item">
                  Price (Low to High)
                </SelectItem>
                <SelectItem value="price_desc" className="hera-select-item">
                  Price (High to Low)
                </SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={() => setViewMode('grid')}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
              style={{
                backgroundColor: viewMode === 'grid' ? `${COLORS.gold}20` : 'transparent',
                border: `1px solid ${viewMode === 'grid' ? COLORS.gold + '50' : COLORS.bronze + '30'}`,
                color: viewMode === 'grid' ? COLORS.gold : COLORS.lightText
              }}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 shrink-0"
              style={{
                backgroundColor: viewMode === 'list' ? `${COLORS.gold}20` : 'transparent',
                border: `1px solid ${viewMode === 'list' ? COLORS.gold + '50' : COLORS.bronze + '30'}`,
                color: viewMode === 'list' ? COLORS.gold : COLORS.lightText
              }}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Filters with Soft Animation */}
        {showFilters && (
          <div
            className="mb-6 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300"
            style={{ borderColor: COLORS.bronze + '30' }}
          >
            <div className="flex items-center gap-4">
              {/* Branch Filter - Compact & Enterprise-Grade */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium uppercase tracking-wider opacity-70 shrink-0"
                  style={{ color: COLORS.bronze }}
                >
                  Location
                </span>
                <Select
                  value={localBranchFilter || '__ALL__'}
                  onValueChange={value => setLocalBranchFilter(value === '__ALL__' ? null : value)}
                >
                  <SelectTrigger
                    className="w-[180px] h-9 text-sm transition-all duration-200 hover:border-gold/50"
                    style={{
                      backgroundColor: COLORS.charcoalLight + '80',
                      borderColor: COLORS.bronze + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="__ALL__" className="hera-select-item">
                      All branches
                    </SelectItem>
                    {availableBranches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id} className="hera-select-item">
                        {branch.entity_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter - Compact & Enterprise-Grade */}
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium uppercase tracking-wider opacity-70 shrink-0"
                  style={{ color: COLORS.bronze }}
                >
                  Category
                </span>
                <Select
                  value={categoryFilter || '__ALL__'}
                  onValueChange={value => setCategoryFilter(value === '__ALL__' ? '' : value)}
                >
                  <SelectTrigger
                    className="w-[180px] h-9 text-sm transition-all duration-200 hover:border-gold/50"
                    style={{
                      backgroundColor: COLORS.charcoalLight + '80',
                      borderColor: COLORS.bronze + '40',
                      color: COLORS.champagne
                    }}
                  >
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem value="__ALL__" className="hera-select-item">
                      All categories
                    </SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="hera-select-item">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* 🔄 MAIN CONTENT - Lazy Loaded */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: COLORS.charcoalLight + '50' }}>
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gold/30 border-t-gold" />
                <div>
                  <p className="font-medium" style={{ color: COLORS.champagne }}>Loading services...</p>
                  <p className="text-xs" style={{ color: COLORS.bronze }}>Fetching your service catalog</p>
                </div>
              </div>
            </div>
            <ServiceListSkeleton viewMode={viewMode} />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex items-center justify-center h-64 animate-in fade-in duration-300">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: COLORS.gold }} />
              <p className="text-lg mb-1" style={{ color: COLORS.champagne }}>
                {searchQuery || categoryFilter || localBranchFilter ? 'No services found' : 'No services yet'}
              </p>
              <p className="text-sm opacity-60 mb-4" style={{ color: COLORS.lightText }}>
                {searchQuery || categoryFilter || localBranchFilter
                  ? 'Try adjusting your search or filters'
                  : 'Create your first service to start building your catalog'}
              </p>
              {!searchQuery && !categoryFilter && !localBranchFilter && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                    color: COLORS.black
                  }}
                >
                  Create Service
                </button>
              )}
            </div>
          </div>
        ) : (
          <Suspense fallback={<TabLoader />}>
            <div
              key={`${localBranchFilter}-${categoryFilter}-${searchQuery}`}
              className="animate-in fade-in duration-300"
            >
              <ServiceList
                services={filteredServices}
                loading={isLoading}
                viewMode={viewMode}
                currency={currency}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onRestore={handleRestore}
              />
            </div>
          </Suspense>
        )}

        {/* 📱 BOTTOM SPACING - Mobile scroll comfort */}
        <div className="h-20 md:h-0" />
      </div>

      {/* MODALS - Lazy Loaded */}
      {modalOpen && (
        <Suspense fallback={null}>
          <ServiceModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false)
              setEditingService(null)
            }}
            service={editingService}
            onSave={handleSave}
          />
        </Suspense>
      )}

      {categoryModalOpen && (
        <Suspense fallback={null}>
          <ServiceCategoryModal
            open={categoryModalOpen}
            onClose={() => {
              setCategoryModalOpen(false)
              setEditingCategory(null)
            }}
            category={editingCategory}
            onSave={handleSaveCategory}
          />
        </Suspense>
      )}

      {/* Delete Service Dialog */}
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
                Delete Service
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3" style={{ color: COLORS.lightText }}>
            <p className="text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold" style={{ color: COLORS.champagne }}>
                "{serviceToDelete?.entity_name}"
              </span>
              ?
            </p>
            <p className="text-sm opacity-70">
              This action cannot be undone. The service will be permanently removed from your catalog.
            </p>
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setServiceToDelete(null)
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
              {isDeleting ? 'Deleting...' : 'Delete Service'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Modal */}
      <AlertDialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <AlertDialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
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
                  backgroundColor: COLORS.bronze + '20',
                  border: `1px solid ${COLORS.bronze}40`
                }}
              >
                <Upload className="w-5 h-5" style={{ color: COLORS.bronze }} />
              </div>
              <AlertDialogTitle className="text-lg font-semibold" style={{ color: COLORS.champagne }}>
                Import Services
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="space-y-4" style={{ color: COLORS.lightText }}>
            {/* Instructions */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.charcoalDark + '80',
                borderColor: COLORS.gold + '30'
              }}
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2" style={{ color: COLORS.gold }}>
                <Sparkles className="w-4 h-4" />
                Import Instructions
              </h3>
              <ul className="text-sm space-y-1.5 ml-6 list-disc">
                <li>Download the template to see the correct format</li>
                <li><span className="font-semibold" style={{ color: COLORS.champagne }}>Required field:</span> Name*</li>
                <li><span className="font-semibold" style={{ color: COLORS.champagne }}>Optional fields:</span> Code, Category, Price, Duration, Status, Branches, Description, Requires Booking</li>
                <li>Category and Branch names must match existing entries exactly</li>
                <li>Status: "active" or "archived" (defaults to active)</li>
                <li>Requires Booking: "Yes" or "No" (defaults to No)</li>
                <li>Multiple branches: Separate with semicolon (;)</li>
              </ul>
            </div>

            {/* Download Template Button */}
            <button
              onClick={handleDownloadTemplate}
              className="w-full min-h-[48px] rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-102"
              style={{
                backgroundColor: COLORS.gold + '20',
                border: `1px solid ${COLORS.gold}50`,
                color: COLORS.champagne
              }}
            >
              <Download className="w-4 h-4" />
              Download Import Template
            </button>

            {/* File Upload */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center"
              style={{ borderColor: COLORS.bronze + '40' }}
            >
              <input
                id="import-file-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImport(file)
                    e.target.value = ''
                  }
                }}
                disabled={isImporting}
              />
              <label
                htmlFor="import-file-input"
                className={`cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.bronze }} />
                <p className="font-semibold mb-1" style={{ color: COLORS.champagne }}>
                  {isImporting ? 'Importing...' : 'Click to select Excel or CSV file'}
                </p>
                <p className="text-sm opacity-70">Supports .xlsx, .xls, and .csv formats</p>
              </label>
            </div>

            {/* Progress Bar */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: COLORS.champagne }}>Import Progress</span>
                  <span style={{ color: COLORS.gold }}>{importProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.charcoalDark }}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${importProgress}%`,
                      backgroundColor: COLORS.gold,
                      boxShadow: `0 0 10px ${COLORS.gold}80`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {importResults && (
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.charcoalDark + '80',
                  borderColor:
                    importResults.total === 0 ? COLORS.gold + '50' :
                    importResults.failed > 0 ? '#FFA500' :
                    COLORS.emerald + '50'
                }}
              >
                <h3 className="font-semibold mb-3" style={{ color: COLORS.champagne }}>
                  Import Results
                </h3>

                {/* ✅ ENTERPRISE UX: Special handling for empty uploads */}
                {importResults.total === 0 && importResults.errors.length === 0 ? (
                  <div className="text-center py-4">
                    <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: COLORS.gold }} />
                    <p className="font-medium mb-2" style={{ color: COLORS.champagne }}>
                      Template validated successfully
                    </p>
                    <p className="text-sm opacity-70 mb-4">
                      No service data found in the file. Add your services to the "Services Data" sheet and upload again to import them.
                    </p>
                    <button
                      onClick={() => {
                        setImportModalOpen(false)
                        setImportProgress(0)
                        setImportResults(null)
                      }}
                      className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        backgroundColor: COLORS.gold,
                        color: COLORS.black
                      }}
                    >
                      OK, Got It
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
                      <div>
                        <p className="opacity-70">Total</p>
                        <p className="text-lg font-bold" style={{ color: COLORS.champagne }}>{importResults.total}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Success</p>
                        <p className="text-lg font-bold" style={{ color: COLORS.emerald }}>{importResults.success}</p>
                      </div>
                      <div>
                        <p className="opacity-70">Failed</p>
                        <p className="text-lg font-bold" style={{ color: '#FF6B6B' }}>{importResults.failed}</p>
                      </div>
                    </div>
                    {importResults.errors.length > 0 && (
                      <div className="space-y-1 mb-4">
                        <p className="text-xs font-semibold" style={{ color: '#FFA500' }}>First {Math.min(importResults.errors.length, 10)} errors:</p>
                        <div className="max-h-32 overflow-y-auto text-xs space-y-0.5">
                          {importResults.errors.map((error, idx) => (
                            <p key={idx} className="opacity-80">{error}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ✅ ENTERPRISE UX: Clear success message with action button */}
                    <div className="text-center pt-3 border-t" style={{ borderColor: COLORS.bronze + '30' }}>
                      {importResults.success > 0 && importResults.failed === 0 ? (
                        <>
                          <p className="text-sm font-medium mb-3" style={{ color: COLORS.emerald }}>
                            ✓ All services imported successfully!
                          </p>
                          <button
                            onClick={() => {
                              setImportModalOpen(false)
                              setImportProgress(0)
                              setImportResults(null)
                              // Refresh services list
                              window.location.reload()
                            }}
                            className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: COLORS.emerald,
                              color: COLORS.champagne
                            }}
                          >
                            Done
                          </button>
                        </>
                      ) : importResults.success > 0 && importResults.failed > 0 ? (
                        <>
                          <p className="text-sm font-medium mb-3" style={{ color: '#FFA500' }}>
                            ⚠ {importResults.success} imported, {importResults.failed} failed
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setImportModalOpen(false)
                                setImportProgress(0)
                                setImportResults(null)
                                window.location.reload()
                              }}
                              className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                              style={{
                                backgroundColor: COLORS.emerald,
                                color: COLORS.champagne
                              }}
                            >
                              Done
                            </button>
                            <button
                              onClick={() => {
                                setImportProgress(0)
                                setImportResults(null)
                              }}
                              className="px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                              style={{
                                backgroundColor: COLORS.bronze + '30',
                                color: COLORS.champagne,
                                border: `1px solid ${COLORS.bronze}50`
                              }}
                            >
                              Try Again
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium mb-3" style={{ color: '#FF6B6B' }}>
                            ✗ Import failed - please fix the errors and try again
                          </p>
                          <button
                            onClick={() => {
                              setImportProgress(0)
                              setImportResults(null)
                            }}
                            className="px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: COLORS.gold + '30',
                              color: COLORS.champagne,
                              border: `1px solid ${COLORS.gold}50`
                            }}
                          >
                            Try Again
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              onClick={() => {
                setImportModalOpen(false)
                setImportProgress(0)
                setImportResults(null)
              }}
              disabled={isImporting}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              {importResults ? 'Close' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog open={categoryDeleteDialogOpen} onOpenChange={setCategoryDeleteDialogOpen}>
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
                Delete Category
              </AlertDialogTitle>
            </div>
          </AlertDialogHeader>

          <div className="space-y-3" style={{ color: COLORS.lightText }}>
            <p className="text-sm">
              Are you sure you want to delete{' '}
              <span className="font-semibold" style={{ color: COLORS.champagne }}>
                "{categoryToDelete?.entity_name}"
              </span>
              ?
            </p>
            {categoryToDelete && categoryToDelete.service_count > 0 ? (
              <div
                className="p-3 rounded-lg border flex items-start gap-2"
                style={{
                  backgroundColor: '#FFA50020',
                  borderColor: '#FFA50040'
                }}
              >
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#FFA500' }} />
                <p className="text-sm">
                  This category has{' '}
                  <span className="font-semibold">{categoryToDelete.service_count} service(s)</span>. Please
                  reassign or delete those services first.
                </p>
              </div>
            ) : (
              <p className="text-sm opacity-70">This action cannot be undone.</p>
            )}
          </div>

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              onClick={() => {
                setCategoryDeleteDialogOpen(false)
                setCategoryToDelete(null)
              }}
              disabled={isDeletingCategory}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              disabled={isDeletingCategory || (categoryToDelete && categoryToDelete.service_count > 0)}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              {isDeletingCategory ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SalonLuxePage>
  )
}

export default function SalonServicesPage() {
  return (
    <StatusToastProvider>
      <SalonServicesPageContent />
    </StatusToastProvider>
  )
}
