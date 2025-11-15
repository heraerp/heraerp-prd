'use client'

import React, { useState } from 'react'
import { Search, Filter, ChevronDown, Calendar } from 'lucide-react'

export interface FilterField {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'search'
  placeholder?: string
  options?: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  icon?: React.ReactNode
}

export interface MobileFiltersProps {
  title?: string
  fields: FilterField[]
  onApply?: () => void
  onAdaptFilters?: () => void
  className?: string
  collapsible?: boolean
}

export function MobileFilters({
  title = "Standard",
  fields,
  onApply,
  onAdaptFilters,
  className = '',
  collapsible = false
}: MobileFiltersProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const renderField = (field: FilterField) => {
    const baseClasses = "w-full border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white touch-manipulation focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
    
    switch (field.type) {
      case 'search':
        return (
          <div className="relative">
            <input
              type="text"
              value={field.value || ''}
              onChange={(e) => field.onChange?.(e.target.value)}
              placeholder={field.placeholder}
              className={`${baseClasses} pr-10`}
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
          </div>
        )
      
      case 'select':
        return (
          <div className="relative">
            <select
              value={field.value || ''}
              onChange={(e) => field.onChange?.(e.target.value)}
              className={`${baseClasses} appearance-none pr-10`}
            >
              <option value="">{field.placeholder || `Select ${field.label}`}</option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        )
      
      case 'date':
        return (
          <div className="relative">
            <input
              type="date"
              value={field.value || ''}
              onChange={(e) => field.onChange?.(e.target.value)}
              className={`${baseClasses} pr-10`}
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        )
      
      default:
        return (
          <input
            type="text"
            value={field.value || ''}
            onChange={(e) => field.onChange?.(e.target.value)}
            placeholder={field.placeholder}
            className={baseClasses}
          />
        )
    }
  }

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-3 sm:px-6 py-4">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium text-gray-900">{title}</span>
            {collapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Fields */}
        {(!collapsible || !isCollapsed) && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-600 font-medium">
                    {field.label}:
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
              {onAdaptFilters && (
                <button 
                  onClick={onAdaptFilters}
                  className="text-blue-600 text-sm flex items-center justify-center gap-1 hover:text-blue-800 py-2 px-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Adapt Filters
                </button>
              )}
              {onApply && (
                <button 
                  onClick={onApply}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}