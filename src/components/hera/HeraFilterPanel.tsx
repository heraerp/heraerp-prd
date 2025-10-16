'use client'

import React from 'react'
import { 
  Filter, X, ChevronDown, ChevronUp, 
  Search, Calendar, Hash, Type, ToggleLeft,
  RefreshCcw, Trash2, Save
} from 'lucide-react'
import { useHeraFilterStore } from '@/hooks/useHeraFilterStore'

export interface FilterFieldConfig {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean'
  options?: { value: any; label: string }[]
  placeholder?: string
  min?: number
  max?: number
  operators?: string[]
}

export interface HeraFilterPanelProps {
  entityType: string
  fields: FilterFieldConfig[]
  isOpen?: boolean
  onToggle?: (open: boolean) => void
  className?: string
}

export function HeraFilterPanel({
  entityType,
  fields,
  isOpen: controlledOpen,
  onToggle,
  className = ''
}: HeraFilterPanelProps) {
  const store = useHeraFilterStore()
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['search']))
  const isOpen = controlledOpen ?? store.isFilterPanelOpen

  // Set entity type when component mounts
  React.useEffect(() => {
    if (entityType) {
      store.setEntityType(entityType)
    }
  }, [entityType, store])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleToggle = () => {
    const newOpen = !isOpen
    onToggle?.(newOpen)
    if (!onToggle) {
      store.setFilterPanelOpen(newOpen)
    }
  }

  const getFieldIcon = (type: FilterFieldConfig['type']) => {
    switch (type) {
      case 'text': return Type
      case 'number': return Hash
      case 'date': return Calendar
      case 'boolean': return ToggleLeft
      default: return Filter
    }
  }

  const renderFilterField = (fieldConfig: FilterFieldConfig) => {
    const { field, label, type, options, placeholder, min, max } = fieldConfig
    const filter = store.filters[field]
    const IconComponent = getFieldIcon(type)

    const updateFilterValue = (value: any, operator: string = 'eq') => {
      if (value === '' || value === null || value === undefined) {
        store.removeFilter(field)
      } else {
        store.addFilter(field, {
          field,
          value: { value, operator, label },
          type
        })
      }
    }

    return (
      <div key={field} className="space-y-2">
        <div className="flex items-center gap-2">
          <IconComponent className="w-4 h-4 text-gray-500" />
          <label className="hera-filter-title text-sm">{label}</label>
          {filter && (
            <button
              onClick={() => store.removeFilter(field)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {type === 'text' && (
          <input
            type="text"
            value={filter?.value?.value || ''}
            onChange={e => updateFilterValue(e.target.value, 'like')}
            placeholder={placeholder || `Search ${label.toLowerCase()}...`}
            className="hera-input w-full"
          />
        )}

        {type === 'number' && (
          <div className="space-y-2">
            <input
              type="number"
              value={filter?.value?.value || ''}
              onChange={e => updateFilterValue(Number(e.target.value))}
              placeholder={placeholder || `Enter ${label.toLowerCase()}`}
              min={min}
              max={max}
              className="hera-input w-full"
            />
          </div>
        )}

        {type === 'date' && (
          <input
            type="date"
            value={filter?.value?.value || ''}
            onChange={e => updateFilterValue(e.target.value)}
            className="hera-input w-full"
          />
        )}

        {type === 'select' && options && (
          <select
            value={filter?.value?.value || ''}
            onChange={e => updateFilterValue(e.target.value)}
            className="hera-input w-full"
          >
            <option value="">All {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {type === 'multiselect' && options && (
          <div className="space-y-2">
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
              {options.map(option => {
                const isSelected = filter?.value?.value?.includes(option.value)
                return (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        const currentValues = filter?.value?.value || []
                        const newValues = e.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter((v: any) => v !== option.value)
                        updateFilterValue(newValues, 'in')
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm hera-font-primary">{option.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {type === 'boolean' && (
          <div className="flex gap-2">
            <button
              onClick={() => updateFilterValue(true)}
              className={`hera-chip ${filter?.value?.value === true ? 'hera-chip-active' : 'hera-chip-inactive'}`}
            >
              Yes
            </button>
            <button
              onClick={() => updateFilterValue(false)}
              className={`hera-chip ${filter?.value?.value === false ? 'hera-chip-active' : 'hera-chip-inactive'}`}
            >
              No
            </button>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={handleToggle}
        className="hera-btn-surface flex items-center gap-2 mb-4"
      >
        <Filter className="w-4 h-4" />
        Show Filters
        {store.activeFilters.length > 0 && (
          <span className="hera-chip-active text-xs px-2 py-1">
            {store.activeFilters.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className={`hera-filter-panel ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900 hera-font-primary">Filters</h3>
          {store.activeFilters.length > 0 && (
            <span className="hera-chip-active text-xs px-2 py-1">
              {store.activeFilters.length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {store.activeFilters.length > 0 && (
            <button
              onClick={store.clearAllFilters}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Clear all filters"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleToggle}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="hera-filter-section">
        <button
          onClick={() => toggleSection('search')}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <span className="hera-filter-title">Search</span>
          </div>
          {expandedSections.has('search') ? 
            <ChevronUp className="w-4 h-4 text-gray-400" /> : 
            <ChevronDown className="w-4 h-4 text-gray-400" />
          }
        </button>
        
        {expandedSections.has('search') && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={store.searchQuery}
                onChange={e => store.setSearchQuery(e.target.value)}
                placeholder={`Search ${entityType.toLowerCase()}...`}
                className="hera-input w-full pl-10"
              />
              {store.searchQuery && (
                <button
                  onClick={() => store.setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Filter Fields */}
      {fields.map(fieldConfig => {
        const sectionKey = `field-${fieldConfig.field}`
        const hasValue = store.filters[fieldConfig.field]?.active
        
        return (
          <div key={fieldConfig.field} className="hera-filter-section">
            <button
              onClick={() => toggleSection(sectionKey)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                {React.createElement(getFieldIcon(fieldConfig.type), { 
                  className: `w-4 h-4 ${hasValue ? 'text-indigo-600' : 'text-gray-500'}` 
                })}
                <span className={`hera-filter-title ${hasValue ? 'text-indigo-600 font-medium' : ''}`}>
                  {fieldConfig.label}
                </span>
                {hasValue && (
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                )}
              </div>
              {expandedSections.has(sectionKey) ? 
                <ChevronUp className="w-4 h-4 text-gray-400" /> : 
                <ChevronDown className="w-4 h-4 text-gray-400" />
              }
            </button>
            
            {expandedSections.has(sectionKey) && (
              <div className="mt-3">
                {renderFilterField(fieldConfig)}
              </div>
            )}
          </div>
        )
      })}

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={store.clearAllFilters}
          className="hera-btn-surface flex items-center gap-2 flex-1"
          disabled={store.activeFilters.length === 0}
        >
          <RefreshCcw className="w-4 h-4" />
          Clear All
        </button>
        <button
          onClick={handleToggle}
          className="hera-btn-primary flex items-center gap-2 flex-1"
        >
          <Filter className="w-4 h-4" />
          Apply
        </button>
      </div>
    </div>
  )
}