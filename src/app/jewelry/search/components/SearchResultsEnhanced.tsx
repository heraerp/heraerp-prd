'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Edit,
  Award,
  FileText,
  Trash2,
  RefreshCw,
  ExternalLink,
  Package,
  Diamond,
  ShieldCheck,
  Users,
  ShoppingCart,
  Sparkles,
  Crown,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import '@/styles/jewelry-glassmorphism.css'

// Enhanced mock data with more realistic jewelry items
const MOCK_DATA = {
  JEWELRY_ITEM: [
    {
      id: '1',
      entity_id: 'jewelry_1',
      entity_name: 'Tiffany-Style Diamond Solitaire Ring',
      entity_code: 'RING-DIA-001',
      dynamic_data: {
        item_type: 'ring',
        metal_type: 'platinum',
        stone_type: 'diamond',
        carat_weight: 2.05,
        price: 28500,
        status: 'available',
        certification: 'GIA Certified',
        collection: 'Bridal Collection'
      },
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      entity_id: 'jewelry_2',
      entity_name: 'Emerald Cut Eternity Band',
      entity_code: 'RING-EMR-002',
      dynamic_data: {
        item_type: 'ring',
        metal_type: 'white_gold',
        stone_type: 'emerald',
        carat_weight: 3.2,
        price: 45000,
        status: 'reserved',
        certification: 'AGS Certified',
        collection: 'Estate Collection'
      },
      created_at: '2024-01-14T14:20:00Z',
      updated_at: '2024-01-16T09:15:00Z'
    },
    {
      id: '3',
      entity_id: 'jewelry_3',
      entity_name: 'Pearl & Diamond Necklace',
      entity_code: 'NECK-PRL-003',
      dynamic_data: {
        item_type: 'necklace',
        metal_type: 'gold',
        stone_type: 'pearl',
        carat_weight: 0.85,
        price: 12500,
        status: 'available',
        certification: 'In-house Certified',
        collection: 'Classic Collection'
      },
      created_at: '2024-01-10T16:45:00Z',
      updated_at: '2024-01-10T16:45:00Z'
    }
  ],
  GRADING_JOB: [
    {
      id: '4',
      entity_id: 'grading_1',
      entity_name: 'Ruby Ring Appraisal #2024-001',
      entity_code: 'GRADE-2024-001',
      dynamic_data: {
        status: 'graded',
        priority: 'high',
        assigned_to: 'Marcus Brilliant',
        due_date: '2024-02-01',
        item_ref: 'RING-RBY-015',
        estimated_value: 35000
      },
      created_at: '2024-01-18T09:00:00Z',
      updated_at: '2024-01-19T15:30:00Z'
    }
  ],
  CERTIFICATE: [
    {
      id: '5',
      entity_id: 'cert_1',
      entity_name: 'GIA Certificate #2159487623',
      entity_code: 'CERT-GIA-001',
      dynamic_data: {
        cert_type: 'gia',
        grade: 'excellent',
        issued_date: '2024-01-10',
        validity: 'valid',
        item_ref: 'RING-DIA-001',
        measurements: '6.45 - 6.48 x 3.98 mm'
      },
      created_at: '2024-01-10T12:00:00Z',
      updated_at: '2024-01-10T12:00:00Z'
    }
  ],
  CUSTOMER: [
    {
      id: '6',
      entity_id: 'cust_1',
      entity_name: 'Victoria Sterling',
      entity_code: 'CUST-VIP-001',
      dynamic_data: {
        customer_type: 'vip',
        loyalty_tier: 'diamond',
        total_purchases: 285000,
        member_since: '2020-03-15',
        preferred_contact: 'email',
        special_dates: ['Anniversary: June 15', 'Birthday: December 3']
      },
      created_at: '2020-03-15T10:00:00Z',
      updated_at: '2024-01-20T14:00:00Z'
    }
  ],
  ORDER: [
    {
      id: '7',
      entity_id: 'order_1',
      entity_name: 'Order #2024-0156',
      entity_code: 'ORD-2024-0156',
      dynamic_data: {
        order_status: 'confirmed',
        payment_status: 'paid',
        order_value: 45000,
        customer_ref: 'CUST-VIP-001',
        items_count: 2,
        delivery_method: 'In-Store Pickup'
      },
      created_at: '2024-01-20T11:30:00Z',
      updated_at: '2024-01-20T15:45:00Z'
    }
  ]
}

// Entity type icons for visual distinction
const ENTITY_ICONS = {
  JEWELRY_ITEM: Diamond,
  GRADING_JOB: ShieldCheck,
  CERTIFICATE: Award,
  CUSTOMER: Users,
  ORDER: ShoppingCart
}

// Status color mapping with jewelry theme
const STATUS_COLORS = {
  available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  sold: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  repair: 'bg-red-500/20 text-red-400 border-red-500/30',
  display: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  graded: 'bg-green-500/20 text-green-400 border-green-500/30',
  certified: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  vip: 'bg-gold-500/20 text-gold-400 border-gold-500/30',
  diamond: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

interface SearchResultsProps {
  selectedEntities: string[]
  searchQuery: string
  filters: Record<string, any>
  sortBy: string
  sortOrder: 'asc' | 'desc'
  viewMode: 'table' | 'grid'
  organizationId: string
  userRole: string
  onOpenDetails: (entityId: string) => void
  onSortChange: (field: string, order: 'asc' | 'desc') => void
}

export function SearchResultsEnhanced({
  selectedEntities,
  searchQuery,
  filters,
  sortBy,
  sortOrder,
  viewMode,
  organizationId,
  userRole,
  onOpenDetails,
  onSortChange,
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Get mock data for selected entities
  const allResults = useMemo(() => {
    let results: any[] = []
    
    selectedEntities.forEach(entityType => {
      const entityData = MOCK_DATA[entityType as keyof typeof MOCK_DATA] || []
      results = [...results, ...entityData.map(item => ({ ...item, entity_type: entityType }))]
    })
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(item => 
        item.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.entity_code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Apply other filters (simplified for demo)
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        results = results.filter(item => 
          value.includes(item.dynamic_data?.[key])
        )
      }
    })
    
    // Sort results
    results.sort((a, b) => {
      const aVal = a.dynamic_data?.[sortBy] || a[sortBy] || ''
      const bVal = b.dynamic_data?.[sortBy] || b[sortBy] || ''
      const comparison = aVal > bVal ? 1 : -1
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return results
  }, [selectedEntities, searchQuery, filters, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(allResults.length / itemsPerPage)
  const paginatedResults = allResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }, [])

  // Format date
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [])

  // Get actions based on entity type and role
  const getEntityActions = useCallback((entity: any) => {
    const actions: any[] = [
      { label: 'View Details', icon: Eye, onClick: () => onOpenDetails(entity.entity_id) }
    ]

    switch (entity.entity_type) {
      case 'JEWELRY_ITEM':
        if (['owner', 'manager', 'sales'].includes(userRole)) {
          actions.push({ label: 'Edit Item', icon: Edit })
        }
        if (['owner', 'manager'].includes(userRole)) {
          actions.push({ label: 'Create Certificate', icon: Award })
        }
        break
      case 'GRADING_JOB':
        if (userRole === 'appraiser' || userRole === 'manager' || userRole === 'owner') {
          actions.push({ label: 'Update Status', icon: RefreshCw })
        }
        if (['owner', 'manager'].includes(userRole)) {
          actions.push({ label: 'Issue Certificate', icon: FileText })
        }
        break
      case 'CERTIFICATE':
        actions.push({ label: 'Download PDF', icon: FileText })
        if (['owner', 'manager'].includes(userRole)) {
          actions.push({ label: 'Revoke Certificate', icon: Trash2 })
        }
        break
      case 'CUSTOMER':
        if (['owner', 'manager', 'sales'].includes(userRole)) {
          actions.push({ label: 'Edit Customer', icon: Edit })
          actions.push({ label: 'View Orders', icon: ShoppingCart })
        }
        break
      case 'ORDER':
        if (['owner', 'manager', 'sales'].includes(userRole)) {
          actions.push({ label: 'Edit Order', icon: Edit })
        }
        actions.push({ label: 'View Invoice', icon: FileText })
        break
    }

    return actions
  }, [userRole, onOpenDetails])

  // Render table header
  const renderTableHeader = () => {
    const columns = [
      { key: 'entity_name', label: 'Name', sortable: true },
      { key: 'entity_code', label: 'Code', sortable: true },
      { key: 'entity_type', label: 'Type', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'created_at', label: 'Created', sortable: true },
      { key: 'actions', label: 'Actions', sortable: false },
    ]

    return (
      <TableHeader>
        <TableRow className="border-b border-gold-500/20 bg-gray-900/50">
          {columns.map(col => (
            <TableHead 
              key={col.key}
              className={`text-gold-400 font-semibold ${
                col.sortable ? 'cursor-pointer hover:text-gold-300' : ''
              }`}
              onClick={() => {
                if (col.sortable) {
                  const newOrder = sortBy === col.key && sortOrder === 'asc' ? 'desc' : 'asc'
                  onSortChange(col.key, newOrder)
                }
              }}
            >
              <div className="flex items-center gap-2">
                {col.label}
                {col.sortable && sortBy === col.key && (
                  sortOrder === 'asc' ? 
                    <ArrowUp className="h-4 w-4" /> : 
                    <ArrowDown className="h-4 w-4" />
                )}
                {col.sortable && sortBy !== col.key && (
                  <ArrowUpDown className="h-4 w-4 opacity-30" />
                )}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
    )
  }

  // Render grid item
  const renderGridItem = (item: any) => {
    const Icon = ENTITY_ICONS[item.entity_type as keyof typeof ENTITY_ICONS] || Package
    const actions = getEntityActions(item)
    const status = item.dynamic_data?.status || item.dynamic_data?.validity || 
                   item.dynamic_data?.customer_type || item.dynamic_data?.order_status
    
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="jewelry-glass-card border-gold-500/20 overflow-hidden group cursor-pointer"
              onClick={() => onOpenDetails(item.entity_id)}>
          {/* Card Header */}
          <div className="p-5 border-b border-gold-500/10">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="jewelry-glass-card p-3 rounded-xl">
                  <Icon className="h-6 w-6 jewelry-text-gold" />
                </div>
                <div>
                  <h3 className="jewelry-text-high-contrast font-semibold line-clamp-1">
                    {item.entity_name}
                  </h3>
                  <p className="jewelry-text-muted text-sm">{item.entity_code}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="jewelry-glass-card">
                  <DropdownMenuLabel className="jewelry-text-luxury">Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator className="border-gold-500/20" />
                  {actions.map((action, idx) => (
                    <DropdownMenuItem 
                      key={idx}
                      className="jewelry-text-luxury hover:bg-gold-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick?.()
                      }}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {status && (
              <Badge className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || ''} border`}>
                <span style={{ color: 'inherit' }}>
                  {status.replace(/_/g, ' ')}
                </span>
              </Badge>
            )}
          </div>
          
          {/* Card Body */}
          <div className="p-5 space-y-3">
            {/* Dynamic data display */}
            {item.dynamic_data?.price && ['owner', 'manager', 'sales'].includes(userRole) && (
              <div className="flex justify-between items-center">
                <span className="jewelry-text-muted text-sm">Price</span>
                <span className="jewelry-text-gold font-bold text-lg">
                  {formatCurrency(item.dynamic_data.price)}
                </span>
              </div>
            )}
            
            {item.dynamic_data?.carat_weight && (
              <div className="flex justify-between items-center">
                <span className="jewelry-text-muted text-sm">Carat Weight</span>
                <span className="jewelry-text-luxury font-medium">
                  {item.dynamic_data.carat_weight} ct
                </span>
              </div>
            )}
            
            {item.dynamic_data?.certification && (
              <div className="flex justify-between items-center">
                <span className="jewelry-text-muted text-sm">Certification</span>
                <span className="jewelry-text-luxury font-medium">
                  {item.dynamic_data.certification}
                </span>
              </div>
            )}
            
            {item.dynamic_data?.total_purchases && ['owner', 'manager'].includes(userRole) && (
              <div className="flex justify-between items-center">
                <span className="jewelry-text-muted text-sm">Total Purchases</span>
                <span className="jewelry-text-gold font-bold">
                  {formatCurrency(item.dynamic_data.total_purchases)}
                </span>
              </div>
            )}
          </div>
          
          {/* Card Footer */}
          <div className="px-5 py-3 bg-gray-900/30 border-t border-gold-500/10">
            <div className="flex items-center justify-between text-xs jewelry-text-muted">
              <span>Created {formatDate(item.created_at)}</span>
              <span className="capitalize" style={{ color: '#E6C200' }}>
                {item.entity_type.replace(/_/g, ' ').toLowerCase()}
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Results Header */}
      <div className="jewelry-glass-card border-b border-gold-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="jewelry-text-high-contrast font-semibold text-lg">
              {allResults.length} Results
            </h3>
            {searchQuery && (
              <Badge 
                className="bg-gold-500/10 border-gold-500/30"
                style={{ color: '#E6C200' }}
              >
                <span style={{ color: '#E6C200' }}>
                  Searching: "{searchQuery}"
                </span>
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Pagination Info */}
            <span className="jewelry-text-muted text-sm">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-
              {Math.min(currentPage * itemsPerPage, allResults.length)} of {allResults.length}
            </span>
            
            <Separator orientation="vertical" className="h-5 border-gold-500/20" />
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 ${
                  viewMode === 'table' 
                    ? 'bg-gold-500/20 text-gold-400' 
                    : 'text-gray-400 hover:text-gold-400'
                }`}
                onClick={() => {/* Handle view mode change */}}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={`h-8 w-8 ${
                  viewMode === 'grid' 
                    ? 'bg-gold-500/20 text-gold-400' 
                    : 'text-gray-400 hover:text-gold-400'
                }`}
                onClick={() => {/* Handle view mode change */}}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Content */}
      <div className="flex-1 overflow-auto p-6">
        {allResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="jewelry-glass-card p-12 text-center">
              <Sparkles className="h-12 w-12 jewelry-text-gold mx-auto mb-4" />
              <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
                No results found
              </h3>
              <p className="jewelry-text-muted max-w-sm">
                Try adjusting your search criteria or clearing some filters to see more results.
              </p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="jewelry-glass-card rounded-xl overflow-hidden">
            <Table>
              {renderTableHeader()}
              <TableBody>
                <AnimatePresence>
                  {paginatedResults.map((item, index) => {
                    const Icon = ENTITY_ICONS[item.entity_type as keyof typeof ENTITY_ICONS] || Package
                    const actions = getEntityActions(item)
                    const status = item.dynamic_data?.status || item.dynamic_data?.validity || 
                                 item.dynamic_data?.customer_type || item.dynamic_data?.order_status
                    
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-gold-500/10 hover:bg-gold-500/5 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="jewelry-glass-card p-2 rounded-lg">
                              <Icon className="h-4 w-4 jewelry-text-gold" />
                            </div>
                            <div>
                              <p className="jewelry-text-high-contrast font-medium line-clamp-1">
                                {item.entity_name}
                              </p>
                              {item.dynamic_data?.collection && (
                                <p className="jewelry-text-muted text-xs">
                                  {item.dynamic_data.collection}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="jewelry-text-luxury">
                          {item.entity_code}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="border-gold-500/30"
                            style={{ color: '#E6C200' }}
                          >
                            <span style={{ color: '#E6C200' }}>
                              {item.entity_type.replace(/_/g, ' ').toLowerCase()}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {status && (
                            <Badge className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS] || ''} border`}>
                              {status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="jewelry-text-muted text-sm">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="jewelry-glass-card">
                              <DropdownMenuLabel className="jewelry-text-luxury">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator className="border-gold-500/20" />
                              {actions.map((action, idx) => (
                                <DropdownMenuItem 
                                  key={idx}
                                  className="jewelry-text-luxury hover:bg-gold-500/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    action.onClick?.()
                                  }}
                                >
                                  <action.icon className="h-4 w-4 mr-2" />
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedResults.map(item => renderGridItem(item))}
          </div>
        )}
      </div>
      
      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="jewelry-glass-card border-t border-gold-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="jewelry-btn-secondary"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={pageNum === currentPage 
                      ? 'bg-gold-500/20 text-gold-400 border-gold-500' 
                      : 'jewelry-btn-secondary'
                    }
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="jewelry-text-muted">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    className="jewelry-btn-secondary"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="jewelry-btn-secondary"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}