'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Calendar, DollarSign, Hash, Type, X } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Mock presets - in production these would come from the preset registry
const ENTITY_PRESETS = {
  JEWELRY_ITEM: {
    dynamicFields: [
      {
        name: 'item_type',
        type: 'text',
        label: 'Item Type',
        facet: true,
        enum: ['ring', 'necklace', 'earrings', 'bracelet', 'pendant']
      },
      {
        name: 'metal_type',
        type: 'text',
        label: 'Metal',
        facet: true,
        enum: ['gold', 'silver', 'platinum', 'white_gold', 'rose_gold']
      },
      {
        name: 'stone_type',
        type: 'text',
        label: 'Stone Type',
        facet: true,
        enum: ['diamond', 'emerald', 'ruby', 'sapphire', 'none']
      },
      { name: 'carat_weight', type: 'number', label: 'Carat Weight', facet: true, min: 0, max: 10 },
      {
        name: 'price',
        type: 'number',
        label: 'Price',
        facet: true,
        min: 0,
        max: 100000,
        roleGate: ['owner', 'manager']
      },
      {
        name: 'status',
        type: 'text',
        label: 'Status',
        facet: true,
        enum: ['available', 'sold', 'reserved', 'repair']
      },
      { name: 'created_at', type: 'date', label: 'Date Added', facet: true }
    ]
  },
  GRADING_JOB: {
    dynamicFields: [
      {
        name: 'status',
        type: 'text',
        label: 'Status',
        facet: true,
        enum: ['pending', 'in_progress', 'graded', 'certified']
      },
      {
        name: 'priority',
        type: 'text',
        label: 'Priority',
        facet: true,
        enum: ['low', 'normal', 'high', 'urgent']
      },
      { name: 'assigned_to', type: 'text', label: 'Assigned To', facet: true },
      { name: 'due_date', type: 'date', label: 'Due Date', facet: true },
      { name: 'created_at', type: 'date', label: 'Created', facet: true }
    ]
  },
  CERTIFICATE: {
    dynamicFields: [
      {
        name: 'cert_type',
        type: 'text',
        label: 'Certificate Type',
        facet: true,
        enum: ['gia', 'ags', 'ssef', 'grs', 'internal']
      },
      {
        name: 'grade',
        type: 'text',
        label: 'Grade',
        facet: true,
        enum: ['excellent', 'very_good', 'good', 'fair', 'poor']
      },
      { name: 'issue_date', type: 'date', label: 'Issue Date', facet: true },
      { name: 'expiry_date', type: 'date', label: 'Expiry Date', facet: true },
      {
        name: 'status',
        type: 'text',
        label: 'Status',
        facet: true,
        enum: ['valid', 'expired', 'revoked']
      }
    ]
  },
  CUSTOMER: {
    dynamicFields: [
      {
        name: 'customer_type',
        type: 'text',
        label: 'Type',
        facet: true,
        enum: ['retail', 'wholesale', 'vip']
      },
      {
        name: 'region',
        type: 'text',
        label: 'Region',
        facet: true,
        enum: ['uae', 'saudi', 'qatar', 'kuwait', 'other']
      },
      { name: 'signup_date', type: 'date', label: 'Signup Date', facet: true }
    ]
  },
  ORDER: {
    dynamicFields: [
      {
        name: 'order_status',
        type: 'text',
        label: 'Status',
        facet: true,
        enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
      },
      {
        name: 'order_type',
        type: 'text',
        label: 'Type',
        facet: true,
        enum: ['sale', 'custom', 'repair', 'appraisal']
      },
      {
        name: 'total_amount',
        type: 'number',
        label: 'Total Amount',
        facet: true,
        min: 0,
        max: 100000,
        roleGate: ['owner', 'manager']
      },
      { name: 'order_date', type: 'date', label: 'Order Date', facet: true }
    ]
  }
}

interface SearchFilters {
  [key: string]: any
}

interface SearchFacetsProps {
  selectedEntities: string[]
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  organizationId: string
  userRole: string
}

export function SearchFacets({
  selectedEntities,
  filters,
  onFiltersChange,
  organizationId,
  userRole
}: SearchFacetsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['entity_types', 'common_filters'])
  )

  // Get available facets from selected entity presets
  const availableFacets = useMemo(() => {
    const facets: Array<{
      key: string
      label: string
      type: string
      options?: string[]
      min?: number
      max?: number
      entityTypes: string[]
      roleGate?: string[]
    }> = []

    selectedEntities.forEach(entityType => {
      const preset = ENTITY_PRESETS[entityType as keyof typeof ENTITY_PRESETS]
      if (preset) {
        preset.dynamicFields
          .filter(field => field.facet)
          .forEach(field => {
            // Check role gate
            if (field.roleGate && !field.roleGate.includes(userRole)) {
              return
            }

            const existingFacet = facets.find(f => f.key === field.name)
            if (existingFacet) {
              existingFacet.entityTypes.push(entityType)
            } else {
              facets.push({
                key: field.name,
                label: field.label,
                type: field.type,
                options: field.enum,
                min: field.min,
                max: field.max,
                entityTypes: [entityType],
                roleGate: field.roleGate
              })
            }
          })
      }
    })

    return facets
  }, [selectedEntities, userRole])

  // Handle filter change
  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      const newFilters = { ...filters }

      if (
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete newFilters[key]
      } else {
        newFilters[key] = value
      }

      onFiltersChange(newFilters)
    },
    [filters, onFiltersChange]
  )

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }, [])

  // Render enum facet
  const renderEnumFacet = (facet: (typeof availableFacets)[0]) => {
    const currentValues = filters[facet.key] || []

    return (
      <div className="space-y-2">
        {facet.options?.map(option => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${facet.key}-${option}`}
              checked={currentValues.includes(option)}
              onCheckedChange={checked => {
                const newValues = checked
                  ? [...currentValues, option]
                  : currentValues.filter((v: string) => v !== option)
                handleFilterChange(facet.key, newValues)
              }}
            />
            <Label htmlFor={`${facet.key}-${option}`} className="text-sm text-gray-300 capitalize">
              {option.replace('_', ' ')}
            </Label>
          </div>
        ))}
      </div>
    )
  }

  // Render number range facet
  const renderNumberFacet = (facet: (typeof availableFacets)[0]) => {
    const currentValue = filters[facet.key] || {}

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-gray-400">Min</Label>
            <Input
              type="number"
              placeholder={facet.min?.toString()}
              value={currentValue.min || ''}
              onChange={e => {
                const min = e.target.value ? parseFloat(e.target.value) : undefined
                handleFilterChange(facet.key, { ...currentValue, min })
              }}
              className="h-8 bg-gray-800/50 border-gray-600 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">Max</Label>
            <Input
              type="number"
              placeholder={facet.max?.toString()}
              value={currentValue.max || ''}
              onChange={e => {
                const max = e.target.value ? parseFloat(e.target.value) : undefined
                handleFilterChange(facet.key, { ...currentValue, max })
              }}
              className="h-8 bg-gray-800/50 border-gray-600 text-gray-100"
            />
          </div>
        </div>
      </div>
    )
  }

  // Render date range facet
  const renderDateFacet = (facet: (typeof availableFacets)[0]) => {
    const currentValue = filters[facet.key] || {}

    return (
      <div className="space-y-2">
        {/* Quick date options */}
        <div className="flex flex-wrap gap-1">
          {[
            { label: '7d', days: 7 },
            { label: '30d', days: 30 },
            { label: '90d', days: 90 },
            { label: 'YTD', days: 'ytd' as const }
          ].map(option => (
            <Button
              key={option.label}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs border-gray-600 text-gray-400"
              onClick={() => {
                const today = new Date()
                let fromDate: Date

                if (option.days === 'ytd') {
                  fromDate = new Date(today.getFullYear(), 0, 1)
                } else {
                  fromDate = new Date(today.getTime() - option.days * 24 * 60 * 60 * 1000)
                }

                handleFilterChange(facet.key, {
                  from: fromDate.toISOString().split('T')[0],
                  to: today.toISOString().split('T')[0]
                })
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label className="text-xs text-gray-400">From</Label>
            <Input
              type="date"
              value={currentValue.from || ''}
              onChange={e => {
                handleFilterChange(facet.key, { ...currentValue, from: e.target.value })
              }}
              className="h-8 bg-gray-800/50 border-gray-600 text-gray-100"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-400">To</Label>
            <Input
              type="date"
              value={currentValue.to || ''}
              onChange={e => {
                handleFilterChange(facet.key, { ...currentValue, to: e.target.value })
              }}
              className="h-8 bg-gray-800/50 border-gray-600 text-gray-100"
            />
          </div>
        </div>
      </div>
    )
  }

  // Get active filter count
  const activeFilterCount = Object.keys(filters).length

  return (
    <Card className="h-full glass-card border-yellow-500/30 rounded-none border-l-0">
      <div className="p-4 border-b border-yellow-500/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-yellow-400">Search Filters</h3>
          {activeFilterCount > 0 && (
            <Badge className="bg-yellow-500/20 text-yellow-400">{activeFilterCount}</Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Entity Types */}
        <Collapsible
          open={expandedSections.has('entity_types')}
          onOpenChange={() => toggleSection('entity_types')}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-800/50 rounded">
            <span className="font-medium text-gray-300">Entity Types</span>
            {expandedSections.has('entity_types') ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2">
            <div className="space-y-2">
              {selectedEntities.map(entityType => (
                <Badge
                  key={entityType}
                  className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                >
                  {entityType.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Dynamic Facets */}
        {availableFacets.map(facet => (
          <Collapsible
            key={facet.key}
            open={expandedSections.has(facet.key)}
            onOpenChange={() => toggleSection(facet.key)}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-800/50 rounded">
              <div className="flex items-center gap-2">
                {facet.type === 'text' && <Type className="h-4 w-4 text-gray-400" />}
                {facet.type === 'number' && <Hash className="h-4 w-4 text-gray-400" />}
                {facet.type === 'date' && <Calendar className="h-4 w-4 text-gray-400" />}
                <span className="font-medium text-gray-300">{facet.label}</span>
                {filters[facet.key] && (
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">Active</Badge>
                )}
              </div>
              {expandedSections.has(facet.key) ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pt-2">
              {facet.type === 'text' && facet.options && renderEnumFacet(facet)}
              {facet.type === 'number' && renderNumberFacet(facet)}
              {facet.type === 'date' && renderDateFacet(facet)}

              {/* Clear this filter */}
              {filters[facet.key] && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFilterChange(facet.key, null)}
                  className="mt-2 h-6 px-2 text-xs text-red-400 hover:text-red-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {availableFacets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Select entity types to see available filters</p>
          </div>
        )}
      </div>
    </Card>
  )
}
