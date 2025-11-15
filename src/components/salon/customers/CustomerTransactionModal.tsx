'use client'

/**
 * CustomerTransactionModal Component
 *
 * Full-screen modal displaying complete customer transaction history
 * with filtering, sorting, and pagination
 *
 * Features:
 * - Date range filter (Last 30/90/365 days, Custom)
 * - Transaction table with sorting
 * - Pagination (25/50/100 per page)
 * - Mobile-optimized card view
 * - LUXE glassmorphism theme
 */

import React, { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { subDays } from 'date-fns'
import {
  X,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Loader2,
  AlertCircle,
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'
import { useHeraStaff } from '@/hooks/useHeraStaff'
import { useHeraServices } from '@/hooks/useHeraServices'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C'
}

interface CustomerTransactionModalProps {
  open: boolean
  onClose: () => void
  customerId: string
  customerName: string
  organizationId: string
}

type DateRangeOption = 'last_30' | 'last_90' | 'last_365' | 'all'

export function CustomerTransactionModal({
  open,
  onClose,
  customerId,
  customerName,
  organizationId
}: CustomerTransactionModalProps) {
  const [dateRange, setDateRange] = useState<DateRangeOption>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // 🔧 FETCH STAFF ENTITIES: To resolve target_entity_id to staff names
  const { staff: staffEntities } = useHeraStaff({
    organizationId,
    includeArchived: false,
    filters: {
      include_dynamic: false, // Don't need full dynamic fields, just names
      include_relationships: false
    }
  })

  // 🔧 FETCH SERVICE ENTITIES: To resolve service entity_id to service names
  const { services: serviceEntities } = useHeraServices({
    organizationId,
    filters: {
      include_dynamic: false, // Don't need full dynamic fields, just names
      include_relationships: false
    }
  })

  // 🗺️ CREATE LOOKUP MAPS: For fast entity ID → name resolution
  const staffMap = useMemo(() => {
    const map = new Map<string, string>()
    staffEntities?.forEach(staff => {
      if (staff.id && staff.entity_name) {
        map.set(staff.id, staff.entity_name)
      }
    })
    return map
  }, [staffEntities])

  const serviceMap = useMemo(() => {
    const map = new Map<string, string>()
    serviceEntities?.forEach(service => {
      if (service.id && service.entity_name) {
        map.set(service.id, service.entity_name)
      }
    })
    return map
  }, [serviceEntities])

  // Calculate date filters based on selection
  const { dateFrom, dateTo } = useMemo(() => {
    const today = new Date()
    switch (dateRange) {
      case 'last_30':
        return {
          dateFrom: subDays(today, 30).toISOString(),
          dateTo: today.toISOString()
        }
      case 'last_90':
        return {
          dateFrom: subDays(today, 90).toISOString(),
          dateTo: today.toISOString()
        }
      case 'last_365':
        return {
          dateFrom: subDays(today, 365).toISOString(),
          dateTo: today.toISOString()
        }
      default:
        return { dateFrom: undefined, dateTo: undefined }
    }
  }, [dateRange])

  // 🚀 ENTERPRISE: Fetch ALL transactions for customer (not just SALE type)
  console.log('🔍 [CustomerTransactionModal] Fetching transactions with filter:', {
    customerId,
    customerName,
    organizationId,
    dateFrom,
    dateTo
  })

  const {
    transactions: rawTransactions,
    isLoading,
    error
  } = useUniversalTransactionV1({
    organizationId: organizationId,
    filters: {
      source_entity_id: customerId, // Filter by customer
      include_lines: true,
      date_from: dateFrom,
      date_to: dateTo
    }
  })

  // 🔍 DEBUG: Verify customer filtering is working
  React.useEffect(() => {
    console.log('🔍 [CustomerTransactionModal] Raw transactions received:', {
      customerId,
      customerName,
      totalTransactions: rawTransactions?.length || 0,
      rawTransactions: rawTransactions || 'No data yet'
    })

    // 🔍 DEBUG: Staff and Service entity resolution
    console.log('🗺️ [CustomerTransactionModal] Entity lookup maps:', {
      staffMapSize: staffMap.size,
      serviceMapSize: serviceMap.size,
      staffEntities: staffEntities?.length || 0,
      serviceEntities: serviceEntities?.length || 0,
      sampleStaff: Array.from(staffMap.entries()).slice(0, 3),
      sampleServices: Array.from(serviceMap.entries()).slice(0, 3)
    })

    if (rawTransactions && rawTransactions.length > 0) {
      const uniqueCustomers = [...new Set(rawTransactions.map(t => t.source_entity_id))]
      const isFiltered = rawTransactions.every(t => t.source_entity_id === customerId)

      console.log('🔍 [CustomerTransactionModal] FILTERING ANALYSIS:', {
        expectedCustomerId: customerId,
        totalTransactions: rawTransactions.length,
        uniqueCustomers: uniqueCustomers,
        uniqueCustomerCount: uniqueCustomers.length,
        isFilteredCorrectly: isFiltered,
        firstTransaction: {
          id: rawTransactions[0].id,
          source_entity_id: rawTransactions[0].source_entity_id,
          transaction_code: rawTransactions[0].transaction_code,
          total_amount: rawTransactions[0].total_amount
        },
        allSourceEntityIds: rawTransactions.map(t => ({
          txn_id: t.id?.slice(0, 8),
          source_entity_id: t.source_entity_id?.slice(0, 8),
          matches: t.source_entity_id === customerId
        }))
      })

      if (!isFiltered) {
        console.error('❌ FILTERING FAILED: Transactions from multiple customers!', {
          expectedCustomerId: customerId,
          actualCustomers: uniqueCustomers
        })
      } else {
        console.log('✅ FILTERING SUCCESS: All transactions belong to correct customer')
      }

      // 🔍 DEBUG: Transaction line details
      const firstTxn = rawTransactions[0]

      // Log each line separately for clarity
      firstTxn.lines?.forEach((line, idx) => {
        console.log(`🔍 [Line ${idx + 1}]:`, {
          line_type: line.line_type,
          line_type_uppercase: (line.line_type || '').toUpperCase(),
          entity_id: line.entity_id,
          entity_id_in_serviceMap: line.entity_id ? serviceMap.has(line.entity_id) : false,
          service_name_from_map: line.entity_id && serviceMap.has(line.entity_id) ? serviceMap.get(line.entity_id) : 'NOT IN MAP',
          description: line.description,
          line_data: line.line_data,
          line_data_description: line.line_data?.description,
          FULL_LINE_OBJECT: line
        })
      })

      console.log('🔍 [CustomerTransactionModal] First transaction summary:', {
        id: firstTxn.id,
        target_entity_id: firstTxn.target_entity_id,
        target_staff_name: firstTxn.target_entity_id && staffMap.has(firstTxn.target_entity_id)
          ? staffMap.get(firstTxn.target_entity_id)
          : 'NOT IN STAFF MAP',
        business_context: firstTxn.business_context,
        total_lines: firstTxn.lines?.length || 0,
        service_lines_count: firstTxn.lines?.filter(line => {
          const lineType = (line.line_type || '').toUpperCase()
          return lineType === 'SERVICE' || lineType === 'PRODUCT' || line.entity_id
        }).length || 0
      })
    }
  }, [rawTransactions, customerId, customerName, staffMap, serviceMap, staffEntities, serviceEntities])

  // Extract transactions array
  const transactions = useMemo(() => {
    return rawTransactions || []
  }, [rawTransactions])

  // 📊 CALCULATE KPIS: Lifetime value, visit count, avg order
  const kpis = useMemo(() => {
    const completedTransactions = transactions.filter(
      t => t.transaction_status === 'completed'
    )

    const lifetimeValue = completedTransactions.reduce(
      (sum, t) => sum + (t.total_amount || 0),
      0
    )

    const visitCount = completedTransactions.length
    const avgOrderValue = visitCount > 0 ? lifetimeValue / visitCount : 0

    const lastVisit = transactions.length > 0
      ? transactions.sort(
          (a, b) =>
            new Date(b.transaction_date).getTime() -
            new Date(a.transaction_date).getTime()
        )[0]?.transaction_date
      : null

    return {
      lifetimeValue,
      visitCount,
      avgOrderValue,
      lastVisit,
      totalCount: transactions.length
    }
  }, [transactions])

  // 💰 FORMAT CURRENCY: AED format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount)
  }

  // Paginate transactions
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return transactions.slice(startIndex, endIndex)
  }, [transactions, currentPage, pageSize])

  const totalPages = Math.ceil(transactions.length / pageSize)

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, pageSize])

  return (
    <SalonLuxeModal
      open={open}
      onClose={onClose}
      title="Transaction History"
      description={`Complete transaction history for ${customerName}`}
      icon={<ShoppingBag className="w-6 h-6" />}
      size="xl"
      className="max-h-[90vh]"
    >

        {/* Filters Bar */}
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 items-start md:items-center justify-between" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
          {/* Date Range Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Calendar className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
            <Select value={dateRange} onValueChange={(value: DateRangeOption) => setDateRange(value)}>
              <SelectTrigger
                className="w-full md:w-[200px] min-h-[44px]"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="last_90">Last 90 Days</SelectItem>
                <SelectItem value="last_365">Last 365 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: `${LUXE_COLORS.gold}15`,
                border: `1px solid ${LUXE_COLORS.gold}40`
              }}
            >
              <ShoppingBag className="w-4 h-4" style={{ color: LUXE_COLORS.gold }} />
              <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                {transactions.length} transactions
              </span>
            </div>
            <div
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: `${LUXE_COLORS.emerald}15`,
                border: `1px solid ${LUXE_COLORS.emerald}40`
              }}
            >
              <DollarSign className="w-4 h-4" style={{ color: LUXE_COLORS.emerald }} />
              <span className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                {formatCurrency(kpis.lifetimeValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
              <span className="ml-3" style={{ color: LUXE_COLORS.champagne }}>
                Loading transactions...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-8 h-8" style={{ color: '#F87171' }} />
              <span className="ml-3" style={{ color: LUXE_COLORS.champagne }}>
                Error loading transactions
              </span>
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                style={{
                  backgroundColor: `${LUXE_COLORS.gold}10`,
                  border: `2px solid ${LUXE_COLORS.gold}30`
                }}
              >
                <ShoppingBag className="w-10 h-10" style={{ color: LUXE_COLORS.gold }} />
              </div>
              <p className="text-xl font-semibold mb-2" style={{ color: LUXE_COLORS.champagne }}>
                No transactions found
              </p>
              <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                {customerName} hasn't made any transactions yet
              </p>
            </div>
          )}

          {!isLoading && !error && paginatedTransactions.length > 0 && (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {paginatedTransactions.map(transaction => {
                  // 🔧 EXTRACT SERVICES: Separate services and products
                  const services = transaction.lines
                    ?.filter(line => {
                      const lineType = (line.line_type || '').toUpperCase()
                      return lineType === 'SERVICE'
                    })
                    ?.map(line => {
                      // Priority 1: Resolve entity_id to service name from serviceMap
                      if (line.entity_id && serviceMap.has(line.entity_id)) {
                        return serviceMap.get(line.entity_id)
                      }
                      // Priority 2: Use description field if available
                      if (line.description) {
                        return line.description
                      }
                      // Priority 3: Look in line_data for service info
                      if (line.line_data?.service_name) {
                        return line.line_data.service_name
                      }
                      if (line.line_data?.description) {
                        return line.line_data.description
                      }
                      // Fallback: Generic service indicator
                      return line.line_amount ? `Service (${formatCurrency(line.line_amount)})` : 'Service'
                    })
                    .filter(Boolean)
                    .join(', ') || 'No services'

                  // 🔧 EXTRACT PRODUCTS: Separate from services
                  const products = transaction.lines
                    ?.filter(line => {
                      const lineType = (line.line_type || '').toUpperCase()
                      return lineType === 'PRODUCT'
                    })
                    ?.map(line => {
                      if (line.entity_id && serviceMap.has(line.entity_id)) {
                        return serviceMap.get(line.entity_id)
                      }
                      if (line.description) {
                        return line.description
                      }
                      return line.line_amount ? `Product (${formatCurrency(line.line_amount)})` : 'Product'
                    })
                    .filter(Boolean)
                    .join(', ') || 'No products'

                  // 🔧 EXTRACT HAIRSTYLIST: Multiple data sources for staff names
                  let hairstylist = 'Not assigned'

                  // Priority 1: Resolve target_entity_id from staffMap
                  if (transaction.target_entity_id && staffMap.has(transaction.target_entity_id)) {
                    hairstylist = staffMap.get(transaction.target_entity_id)!
                  }
                  // Priority 2: Look in business_context
                  else if (transaction.business_context?.staff_name) {
                    hairstylist = transaction.business_context.staff_name
                  }
                  else if (transaction.business_context?.stylist) {
                    hairstylist = transaction.business_context.stylist
                  }
                  // Priority 3: Check first service line for stylist info
                  else {
                    const firstServiceLine = transaction.lines?.find(line =>
                      (line.line_type || '').toUpperCase() === 'SERVICE'
                    )
                    if (firstServiceLine?.line_data?.stylist_name) {
                      hairstylist = firstServiceLine.line_data.stylist_name
                    } else if (firstServiceLine?.line_data?.stylist_id && staffMap.has(firstServiceLine.line_data.stylist_id)) {
                      hairstylist = staffMap.get(firstServiceLine.line_data.stylist_id)!
                    }
                  }

                  return (
                    <div
                      key={transaction.id}
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${LUXE_COLORS.gold}20`
                      }}
                    >
                      {/* Date Visited */}
                      <div className="mb-3">
                        <p className="text-xs mb-1" style={{ color: LUXE_COLORS.bronze }}>
                          Date Visited
                        </p>
                        <p className="text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                          {format(new Date(transaction.transaction_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>

                      {/* Services Done */}
                      <div className="mb-3">
                        <p className="text-xs mb-1" style={{ color: LUXE_COLORS.bronze }}>
                          Services
                        </p>
                        <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                          {services}
                        </p>
                      </div>

                      {/* Products */}
                      {products !== 'No products' && (
                        <div className="mb-3">
                          <p className="text-xs mb-1" style={{ color: LUXE_COLORS.bronze }}>
                            Products
                          </p>
                          <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                            {products}
                          </p>
                        </div>
                      )}

                      {/* Hairstylist */}
                      <div className="mb-3">
                        <p className="text-xs mb-1" style={{ color: LUXE_COLORS.bronze }}>
                          Hairstylist
                        </p>
                        <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                          {hairstylist}
                        </p>
                      </div>

                      {/* Payment */}
                      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: `${LUXE_COLORS.gold}20` }}>
                        <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                          Payment
                        </p>
                        <p className="text-lg font-bold" style={{ color: LUXE_COLORS.emerald }}>
                          {formatCurrency(transaction.total_amount || 0)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}20` }}>
                      <th className="text-left p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Date Visited
                      </th>
                      <th className="text-left p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Services
                      </th>
                      <th className="text-left p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Products
                      </th>
                      <th className="text-left p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Hairstylist
                      </th>
                      <th className="text-right p-3 text-sm font-semibold" style={{ color: LUXE_COLORS.champagne }}>
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map(transaction => {
                      // 🔧 EXTRACT SERVICES: Separate services and products
                      const services = transaction.lines
                        ?.filter(line => {
                          const lineType = (line.line_type || '').toUpperCase()
                          return lineType === 'SERVICE'
                        })
                        ?.map(line => {
                          if (line.entity_id && serviceMap.has(line.entity_id)) {
                            return serviceMap.get(line.entity_id)
                          }
                          if (line.description) {
                            return line.description
                          }
                          if (line.line_data?.service_name) {
                            return line.line_data.service_name
                          }
                          if (line.line_data?.description) {
                            return line.line_data.description
                          }
                          return line.line_amount ? `Service (${formatCurrency(line.line_amount)})` : 'Service'
                        })
                        .filter(Boolean)
                        .join(', ') || 'No services'

                      // 🔧 EXTRACT PRODUCTS: Separate from services
                      const products = transaction.lines
                        ?.filter(line => {
                          const lineType = (line.line_type || '').toUpperCase()
                          return lineType === 'PRODUCT'
                        })
                        ?.map(line => {
                          if (line.entity_id && serviceMap.has(line.entity_id)) {
                            return serviceMap.get(line.entity_id)
                          }
                          if (line.description) {
                            return line.description
                          }
                          return line.line_amount ? `Product (${formatCurrency(line.line_amount)})` : 'Product'
                        })
                        .filter(Boolean)
                        .join(', ') || 'No products'

                      // 🔧 EXTRACT HAIRSTYLIST: Multiple data sources for staff names
                      let hairstylist = 'Not assigned'

                      // Priority 1: Resolve target_entity_id from staffMap
                      if (transaction.target_entity_id && staffMap.has(transaction.target_entity_id)) {
                        hairstylist = staffMap.get(transaction.target_entity_id)!
                      }
                      // Priority 2: Look in business_context
                      else if (transaction.business_context?.staff_name) {
                        hairstylist = transaction.business_context.staff_name
                      }
                      else if (transaction.business_context?.stylist) {
                        hairstylist = transaction.business_context.stylist
                      }
                      // Priority 3: Check first service line for stylist info
                      else {
                        const firstServiceLine = transaction.lines?.find(line =>
                          (line.line_type || '').toUpperCase() === 'SERVICE'
                        )
                        if (firstServiceLine?.line_data?.stylist_name) {
                          hairstylist = firstServiceLine.line_data.stylist_name
                        } else if (firstServiceLine?.line_data?.stylist_id && staffMap.has(firstServiceLine.line_data.stylist_id)) {
                          hairstylist = staffMap.get(firstServiceLine.line_data.stylist_id)!
                        }
                      }

                      return (
                        <tr
                          key={transaction.id}
                          className="hover:bg-opacity-40 transition-all"
                          style={{ borderBottom: `1px solid ${LUXE_COLORS.gold}10` }}
                        >
                          {/* Date Visited */}
                          <td className="p-3">
                            <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                              {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs" style={{ color: LUXE_COLORS.bronze }}>
                              {format(new Date(transaction.transaction_date), 'h:mm a')}
                            </p>
                          </td>

                          {/* Services */}
                          <td className="p-3">
                            <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                              {services}
                            </p>
                          </td>

                          {/* Products */}
                          <td className="p-3">
                            <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                              {products}
                            </p>
                          </td>

                          {/* Hairstylist */}
                          <td className="p-3">
                            <p className="text-sm" style={{ color: LUXE_COLORS.champagne }}>
                              {hairstylist}
                            </p>
                          </td>

                          {/* Payment */}
                          <td className="p-3 text-right">
                            <p className="text-sm font-bold" style={{ color: LUXE_COLORS.emerald }}>
                              {formatCurrency(transaction.total_amount || 0)}
                            </p>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer with Pagination */}
        {!isLoading && paginatedTransactions.length > 0 && (
          <div
            className="p-4 border-t flex flex-col md:flex-row items-center justify-between gap-4"
            style={{
              backgroundColor: `${LUXE_COLORS.charcoalLight}80`,
              borderColor: `${LUXE_COLORS.gold}20`
            }}
          >
            {/* Page Size Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                Show:
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={value => setPageSize(parseInt(value))}
              >
                <SelectTrigger
                  className="w-[100px] min-h-[44px]"
                  style={{
                    backgroundColor: LUXE_COLORS.charcoalLight,
                    borderColor: `${LUXE_COLORS.gold}40`,
                    color: LUXE_COLORS.champagne
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: LUXE_COLORS.charcoalLight }}>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="min-w-[44px] min-h-[44px] rounded-lg active:scale-95"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <span className="text-sm px-4" style={{ color: LUXE_COLORS.champagne }}>
                Page {currentPage} of {totalPages}
              </span>

              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="min-w-[44px] min-h-[44px] rounded-lg active:scale-95"
                style={{
                  backgroundColor: LUXE_COLORS.charcoalLight,
                  borderColor: `${LUXE_COLORS.gold}40`,
                  color: LUXE_COLORS.champagne
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
    </SalonLuxeModal>
  )
}
