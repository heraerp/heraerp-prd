'use client'

import { useState } from 'react'
import { Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
  width?: string
}

interface ISPTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  searchPlaceholder?: string
  itemsPerPage?: number
}

export function ISPTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  searchPlaceholder = 'Search...',
  itemsPerPage = 10
}: ISPTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter data based on search term
  const filteredData = data.filter(item => {
    const searchStr = searchTerm.toLowerCase()
    return Object.values(item).some(value => String(value).toLowerCase().includes(searchStr))
  })

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-foreground/40" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 bg-background/5 border border-border/10 rounded-xl 
                   text-foreground placeholder-white/40 focus:outline-none focus:ring-2 
                   focus:ring-[#00DDFF]/50 focus:border-[#00DDFF]/50 transition-all duration-300"
        />
      </div>

      {/* Table */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00DDFF]/10 via-[#0049B7]/10 to-[#ff1d58]/10 opacity-50" />
        <div className="relative bg-background/5 backdrop-blur-xl border border-border/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/10">
                  {columns.map((column, index) => (
                    <th
                      key={String(column.key)}
                      className={`px-6 py-4 text-left text-sm font-semibold text-foreground/80 ${
                        column.width || ''
                      }`}
                    >
                      {column.label}
                    </th>
                  ))}
                  {(onEdit || onDelete) && (
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground/80 w-32">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                      className="px-6 py-12 text-center text-foreground/40"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-white/5 hover:bg-background/5 transition-colors duration-200"
                    >
                      {columns.map(column => (
                        <td key={String(column.key)} className="px-6 py-4 text-sm text-foreground/70">
                          {column.render
                            ? column.render(item)
                            : String(item[column.key as keyof T] || '-')}
                        </td>
                      ))}
                      {(onEdit || onDelete) && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="p-2 rounded-lg bg-[#00DDFF]/10 hover:bg-[#00DDFF]/20 
                                         text-[#00DDFF] transition-all duration-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(item)}
                                className="p-2 rounded-lg bg-[#ff1d58]/10 hover:bg-[#ff1d58]/20 
                                         text-[#ff1d58] transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/10">
              <div className="text-sm text-foreground/60">
                Showing {startIndex + 1} to{' '}
                {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}{' '}
                entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-background/5 hover:bg-background/10 disabled:opacity-50 
                           disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground/60" />
                </button>
                <span className="px-4 py-2 text-sm text-foreground/80">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-background/5 hover:bg-background/10 disabled:opacity-50 
                           disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronRight className="h-4 w-4 text-foreground/60" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
