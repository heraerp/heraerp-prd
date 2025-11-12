/**
 * Salon Luxury Pagination Component
 * Enterprise-grade pagination with SAP Fiori patterns
 * Mobile-responsive with touch-friendly targets
 */

'use client'

import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

const COLORS = {
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  gold: '#D4AF37',
  champagne: '#F5E6C8',
  bronze: '#8C7853'
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  itemsName?: string // e.g., "customers", "products"
}

export function SalonPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [25, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemsName = 'items'
}: PaginationProps) {
  // Calculate displayed items range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5 // Maximum page numbers to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage > 3) {
        pages.push('...')
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push('...')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-6 rounded-xl"
      style={{
        backgroundColor: COLORS.charcoal + 'f5',
        border: `1px solid ${COLORS.bronze}30`
      }}
    >
      {/* Left: Items count and page size selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        {/* Items count */}
        <p className="text-sm whitespace-nowrap" style={{ color: COLORS.champagne }}>
          Showing <span className="font-semibold" style={{ color: COLORS.gold }}>{startItem}-{endItem}</span> of{' '}
          <span className="font-semibold" style={{ color: COLORS.gold }}>{totalItems}</span> {itemsName}
        </p>

        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: COLORS.bronze }}>
            Per page:
          </span>
          <Select value={pageSize.toString()} onValueChange={(val) => onPageSizeChange(Number(val))}>
            <SelectTrigger
              className="w-20 h-9"
              style={{
                backgroundColor: COLORS.charcoalLight,
                borderColor: COLORS.bronze + '40',
                color: COLORS.champagne
              }}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="hera-select-content">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()} className="hera-select-item">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}40`,
            color: currentPage === 1 ? COLORS.bronze : COLORS.champagne
          }}
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}40`,
            color: currentPage === 1 ? COLORS.bronze : COLORS.champagne
          }}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="min-w-[36px] h-[36px] flex items-center justify-center"
                  style={{ color: COLORS.bronze }}
                >
                  ...
                </span>
              )
            }

            const isCurrentPage = page === currentPage
            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] rounded-lg transition-all duration-200 font-medium text-sm hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: isCurrentPage ? COLORS.gold : COLORS.charcoalLight,
                  border: `1px solid ${isCurrentPage ? COLORS.gold : COLORS.bronze + '40'}`,
                  color: isCurrentPage ? COLORS.charcoal : COLORS.champagne,
                  boxShadow: isCurrentPage ? `0 0 20px ${COLORS.gold}40` : 'none'
                }}
                aria-label={`Page ${page}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}40`,
            color: currentPage === totalPages ? COLORS.bronze : COLORS.champagne
          }}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="min-w-[40px] min-h-[40px] md:min-w-[36px] md:min-h-[36px] flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          style={{
            backgroundColor: COLORS.charcoalLight,
            border: `1px solid ${COLORS.bronze}40`,
            color: currentPage === totalPages ? COLORS.bronze : COLORS.champagne
          }}
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
