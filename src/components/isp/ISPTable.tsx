'use client'

import React from 'react'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'

interface Column {
  key: string
  label: string
  render?: (item: any) => React.ReactNode
  className?: string
}

interface ISPTableProps {
  data: any[]
  columns: Column[]
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  searchPlaceholder?: string
  className?: string
}

export function ISPTable({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete,
  className = ''
}: ISPTableProps) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC]/20 via-[#E91E63]/20 to-[#FFD700]/20 rounded-2xl blur opacity-40" />
      
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`text-left px-6 py-4 text-sm font-semibold text-[#F5E6C8] uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="text-right px-6 py-4 text-sm font-semibold text-[#F5E6C8] uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} 
                    className="text-center px-6 py-8 text-slate-400"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((item, rowIndex) => (
                  <tr 
                    key={item.id || rowIndex}
                    className="border-b border-border/50 hover:bg-muted/5 transition-colors duration-200"
                  >
                    {columns.map((column) => (
                      <td 
                        key={column.key} 
                        className={`px-6 py-4 ${column.className || ''}`}
                      >
                        {column.render ? column.render(item) : item[column.key]}
                      </td>
                    ))}
                    
                    {(onEdit || onDelete) && (
                      <td className="text-right px-6 py-4">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {openMenuId === item.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                                {onEdit && (
                                  <button
                                    onClick={() => {
                                      onEdit(item)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Edit</span>
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => {
                                      onDelete(item)
                                      setOpenMenuId(null)
                                    }}
                                    className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </>
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
      </div>
    </div>
  )
}