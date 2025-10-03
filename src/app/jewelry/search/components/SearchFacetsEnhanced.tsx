'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar, 
  DollarSign, 
  Hash, 
  Type,
  X,
  Sparkles,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import '@/styles/jewelry-glassmorphism.css'

// Mock presets - in production these would come from the preset registry
const ENTITY_PRESETS = {
  JEWELRY_ITEM: {
    dynamicFields: [
      { name: 'item_type', type: 'text', label: 'Item Type', facet: true, enum: ['ring', 'necklace', 'earrings', 'bracelet', 'pendant', 'watch'] },
      { name: 'metal_type', type: 'text', label: 'Metal', facet: true, enum: ['gold', 'silver', 'platinum', 'white_gold', 'rose_gold', 'titanium'] },
      { name: 'stone_type', type: 'text', label: 'Stone Type', facet: true, enum: ['diamond', 'emerald', 'ruby', 'sapphire', 'pearl', 'none'] },
      { name: 'carat_weight', type: 'number', label: 'Carat Weight', facet: true, min: 0, max: 10 },
      { name: 'price', type: 'number', label: 'Price', facet: true, min: 0, max: 100000, roleGate: ['owner', 'manager'] },
      { name: 'status', type: 'text', label: 'Status', facet: true, enum: ['available', 'sold', 'reserved', 'repair', 'display'] },
      { name: 'created_at', type: 'date', label: 'Date Added', facet: true },
    ]
  },
  GRADING_JOB: {
    dynamicFields: [
      { name: 'status', type: 'text', label: 'Status', facet: true, enum: ['pending', 'in_progress', 'graded', 'certified'] },
      { name: 'priority', type: 'text', label: 'Priority', facet: true, enum: ['low', 'normal', 'high', 'urgent'] },
      { name: 'assigned_to', type: 'text', label: 'Assigned To', facet: true },
      { name: 'due_date', type: 'date', label: 'Due Date', facet: true },
      { name: 'created_at', type: 'date', label: 'Created', facet: true },
    ]
  },
  CERTIFICATE: {
    dynamicFields: [
      { name: 'cert_type', type: 'text', label: 'Certificate Type', facet: true, enum: ['gia', 'ags', 'ssef', 'grs', 'internal'] },
      { name: 'grade', type: 'text', label: 'Grade', facet: true, enum: ['excellent', 'very_good', 'good', 'fair', 'poor'] },
      { name: 'issued_date', type: 'date', label: 'Issue Date', facet: true },
      { name: 'validity', type: 'text', label: 'Validity', facet: true, enum: ['valid', 'expired', 'revoked'] },
    ]
  },
  CUSTOMER: {
    dynamicFields: [
      { name: 'customer_type', type: 'text', label: 'Customer Type', facet: true, enum: ['vip', 'regular', 'new', 'wholesale'] },
      { name: 'loyalty_tier', type: 'text', label: 'Loyalty Tier', facet: true, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'] },
      { name: 'total_purchases', type: 'number', label: 'Purchase Value', facet: true, min: 0, max: 1000000, roleGate: ['owner', 'manager'] },
      { name: 'created_at', type: 'date', label: 'Member Since', facet: true },
    ]
  },
  ORDER: {
    dynamicFields: [
      { name: 'order_status', type: 'text', label: 'Order Status', facet: true, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
      { name: 'payment_status', type: 'text', label: 'Payment', facet: true, enum: ['unpaid', 'partial', 'paid', 'refunded'] },
      { name: 'order_value', type: 'number', label: 'Order Value', facet: true, min: 0, max: 500000, roleGate: ['owner', 'manager', 'sales'] },
      { name: 'created_at', type: 'date', label: 'Order Date', facet: true },
    ]
  }
}

interface SearchFacetsProps {
  selectedEntities: string[]
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  organizationId: string
  userRole: string
}

// Custom styled components for jewelry theme
const FacetCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <Card className={`jewelry-glass-card border-gold-500/20 ${className}`}>
    {children}
  </Card>
)

const FacetSection = ({ 
  title, 
  icon: Icon, 
  children, 
  isExpanded,
  onToggle,
  badge
}: { 
  title: string, 
  icon?: any, 
  children: React.ReactNode,
  isExpanded: boolean,
  onToggle: () => void,
  badge?: number
}) => (
  <Collapsible open={isExpanded} onOpenChange={onToggle}>
    <CollapsibleTrigger asChild>
      <button className="w-full group">
        <div className="flex items-center justify-between p-4 hover:bg-gold-500/5 transition-colors rounded-lg">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-4 w-4 jewelry-text-gold" />}
            <span className="!text-gray-100 dark:!text-gray-100 font-medium">{title}</span>
            {badge !== undefined && badge > 0 && (
              <Badge className="bg-gold-500/20 text-gold-400 border-gold-500/30 px-2 py-0.5 text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 jewelry-text-muted group-hover:jewelry-text-gold transition-colors" />
          </motion.div>
        </div>
      </button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="px-4 pb-4">
        {children}
      </div>
    </CollapsibleContent>
  </Collapsible>
)

export function SearchFacetsEnhanced({
  selectedEntities,
  filters,
  onFiltersChange,
  organizationId,
  userRole,
}: SearchFacetsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['item_type', 'metal_type', 'status']))

  // Get available facets based on selected entities
  const availableFacets = useMemo(() => {
    const facets: any[] = []
    
    selectedEntities.forEach(entityType => {
      const preset = ENTITY_PRESETS[entityType as keyof typeof ENTITY_PRESETS]
      if (preset?.dynamicFields) {
        preset.dynamicFields.forEach(field => {
          // Skip role-gated fields if user doesn't have permission
          if (field.roleGate && !field.roleGate.includes(userRole)) {
            return
          }
          
          if (field.facet) {
            facets.push({
              key: field.name,
              type: field.type,
              label: field.label,
              icon: field.type === 'date' ? Calendar : field.type === 'number' ? DollarSign : Type,
              entityType,
              options: field.enum,
              min: field.min,
              max: field.max
            })
          }
        })
      }
    })
    
    // Remove duplicates
    const uniqueFacets = facets.reduce((acc, facet) => {
      const existing = acc.find(f => f.key === facet.key)
      if (!existing) {
        acc.push(facet)
      }
      return acc
    }, [])
    
    return uniqueFacets
  }, [selectedEntities, userRole])

  // Group facets by type
  const facetGroups = useMemo(() => {
    const groups: Record<string, typeof availableFacets> = {
      text: [],
      number: [],
      date: []
    }
    
    availableFacets.forEach(facet => {
      if (groups[facet.type]) {
        groups[facet.type].push(facet)
      }
    })
    
    return groups
  }, [availableFacets])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).reduce((count, key) => {
      const value = filters[key]
      if (Array.isArray(value) && value.length > 0) return count + 1
      if (typeof value === 'object' && (value.min || value.max || value.start || value.end)) return count + 1
      return count
    }, 0)
  }, [filters])

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...filters }
    
    if (!value || (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'object' && !value.min && !value.max && !value.start && !value.end)) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

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

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange({})
    setExpandedSections(new Set(['item_type', 'metal_type', 'status']))
  }, [onFiltersChange])

  // Render enum facet with enhanced styling
  const renderEnumFacet = (facet: typeof availableFacets[0]) => {
    const currentValues = filters[facet.key] || []
    const hasValues = currentValues.length > 0
    
    return (
      <div className="space-y-3">
        {facet.options?.map((option: string) => (
          <motion.div 
            key={option}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group"
          >
            <label 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gold-500/10 transition-all cursor-pointer"
            >
              <Checkbox
                id={`${facet.key}-${option}`}
                checked={currentValues.includes(option)}
                onCheckedChange={(checked) => {
                  const newValues = checked
                    ? [...currentValues, option]
                    : currentValues.filter((v: string) => v !== option)
                  handleFilterChange(facet.key, newValues)
                }}
                className="border-gold-500/50 data-[state=checked]:bg-gold-500 data-[state=checked]:border-gold-500"
              />
              <span className="!text-gray-100 dark:!text-gray-100 text-sm capitalize flex-1">
                {option.replace(/_/g, ' ')}
              </span>
              <Badge 
                variant="outline" 
                className="opacity-0 group-hover:opacity-100 transition-opacity jewelry-text-muted text-xs"
              >
                12
              </Badge>
            </label>
          </motion.div>
        ))}
      </div>
    )
  }

  // Render number range facet with enhanced styling
  const renderNumberFacet = (facet: typeof availableFacets[0]) => {
    const currentValue = filters[facet.key] || {}
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs !text-gray-300 dark:!text-gray-300 mb-2 block">Minimum</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 jewelry-text-muted" />
              <Input
                type="number"
                placeholder={facet.min?.toString() || '0'}
                value={currentValue.min || ''}
                onChange={(e) => {
                  const min = e.target.value ? parseFloat(e.target.value) : undefined
                  handleFilterChange(facet.key, { ...currentValue, min })
                }}
                className="pl-9 jewelry-glass-input h-10"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs !text-gray-300 dark:!text-gray-300 mb-2 block">Maximum</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 jewelry-text-muted" />
              <Input
                type="number"
                placeholder={facet.max?.toString() || 'Max'}
                value={currentValue.max || ''}
                onChange={(e) => {
                  const max = e.target.value ? parseFloat(e.target.value) : undefined
                  handleFilterChange(facet.key, { ...currentValue, max })
                }}
                className="pl-9 jewelry-glass-input h-10"
              />
            </div>
          </div>
        </div>
        
        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Under $1K', min: 0, max: 1000 },
            { label: '$1K-5K', min: 1000, max: 5000 },
            { label: '$5K-10K', min: 5000, max: 10000 },
            { label: 'Over $10K', min: 10000, max: undefined }
          ].map(range => (
            <Button
              key={range.label}
              size="sm"
              variant="outline"
              onClick={() => handleFilterChange(facet.key, { min: range.min, max: range.max })}
              className={`jewelry-btn-secondary text-xs px-3 py-1 h-7 ${
                currentValue.min === range.min && currentValue.max === range.max
                  ? 'bg-gold-500/20 border-gold-500'
                  : ''
              }`}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  // Render date range facet with enhanced styling
  const renderDateFacet = (facet: typeof availableFacets[0]) => {
    const currentValue = filters[facet.key] || {}
    
    return (
      <div className="space-y-4">
        {/* Quick date options */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Last 7 days', days: 7 },
            { label: 'Last 30 days', days: 30 },
            { label: 'Last 90 days', days: 90 },
            { label: 'Year to Date', days: 'ytd' as const }
          ].map(option => {
            const isActive = currentValue.preset === option.days
            return (
              <Button
                key={option.label}
                size="sm"
                variant="outline"
                onClick={() => {
                  if (option.days === 'ytd') {
                    const start = new Date(new Date().getFullYear(), 0, 1)
                    handleFilterChange(facet.key, {
                      start: start.toISOString().split('T')[0],
                      end: new Date().toISOString().split('T')[0],
                      preset: 'ytd'
                    })
                  } else {
                    const end = new Date()
                    const start = new Date()
                    start.setDate(start.getDate() - option.days)
                    handleFilterChange(facet.key, {
                      start: start.toISOString().split('T')[0],
                      end: end.toISOString().split('T')[0],
                      preset: option.days
                    })
                  }
                }}
                className={`jewelry-btn-secondary text-xs h-8 ${
                  isActive ? 'bg-gold-500/20 border-gold-500' : ''
                }`}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
        
        {/* Custom date range */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs !text-gray-300 dark:!text-gray-300 mb-2 block">Start Date</Label>
            <Input
              type="date"
              value={currentValue.start || ''}
              onChange={(e) => handleFilterChange(facet.key, { 
                ...currentValue, 
                start: e.target.value,
                preset: undefined 
              })}
              className="jewelry-glass-input h-10"
            />
          </div>
          <div>
            <Label className="text-xs !text-gray-300 dark:!text-gray-300 mb-2 block">End Date</Label>
            <Input
              type="date"
              value={currentValue.end || ''}
              onChange={(e) => handleFilterChange(facet.key, { 
                ...currentValue, 
                end: e.target.value,
                preset: undefined 
              })}
              className="jewelry-glass-input h-10"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full jewelry-gradient-bg">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="jewelry-heading text-xl font-bold flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 jewelry-text-gold" />
                  Search Filters
                </h2>
                <p className="!text-gray-400 dark:!text-gray-400 text-sm mt-1">
                  Refine your search results
                </p>
              </div>
              {activeFilterCount > 0 && (
                <Badge className="bg-gold-500/20 text-gold-400 border-gold-500/30 text-sm">
                  {activeFilterCount} active
                </Badge>
              )}
            </div>

            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="sm"
                className="w-full jewelry-btn-secondary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>

          <Separator className="border-gold-500/20" />

          {/* Entity selection info */}
          <div className="space-y-2">
            <Label className="text-xs !text-gray-400 dark:!text-gray-400">Searching in:</Label>
            <div className="flex flex-wrap gap-2">
              {selectedEntities.map(entity => (
                <Badge 
                  key={entity}
                  className="bg-gold-500/10 border-gold-500/30"
                  style={{ color: '#E6C200 !important' }}
                >
                  <span style={{ color: '#E6C200' }}>
                    {entity.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="border-gold-500/20" />

          {/* Facet sections */}
          <div className="space-y-2">
            {/* Text facets */}
            {facetGroups.text.length > 0 && (
              <FacetCard>
                {facetGroups.text.map(facet => {
                  const filterCount = filters[facet.key]?.length || 0
                  return (
                    <FacetSection
                      key={facet.key}
                      title={facet.label}
                      icon={facet.icon}
                      isExpanded={expandedSections.has(facet.key)}
                      onToggle={() => toggleSection(facet.key)}
                      badge={filterCount}
                    >
                      {renderEnumFacet(facet)}
                    </FacetSection>
                  )
                })}
              </FacetCard>
            )}

            {/* Number facets */}
            {facetGroups.number.length > 0 && (
              <FacetCard className="mt-4">
                <div className="p-4">
                  <h3 className="!text-gray-100 dark:!text-gray-100 font-medium mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 jewelry-text-gold" />
                    Price & Values
                  </h3>
                  <div className="space-y-6">
                    {facetGroups.number.map(facet => (
                      <div key={facet.key}>
                        <Label className="!text-gray-100 dark:!text-gray-100 text-sm font-medium mb-3 block">
                          {facet.label}
                        </Label>
                        {renderNumberFacet(facet)}
                      </div>
                    ))}
                  </div>
                </div>
              </FacetCard>
            )}

            {/* Date facets */}
            {facetGroups.date.length > 0 && (
              <FacetCard className="mt-4">
                <div className="p-4">
                  <h3 className="!text-gray-100 dark:!text-gray-100 font-medium mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 jewelry-text-gold" />
                    Date Ranges
                  </h3>
                  <div className="space-y-6">
                    {facetGroups.date.map(facet => (
                      <div key={facet.key}>
                        <Label className="!text-gray-100 dark:!text-gray-100 text-sm font-medium mb-3 block">
                          {facet.label}
                        </Label>
                        {renderDateFacet(facet)}
                      </div>
                    ))}
                  </div>
                </div>
              </FacetCard>
            )}
          </div>

          {/* Pro tip */}
          <Card className="jewelry-glass-card border-gold-500/20 p-4">
            <div className="flex gap-3">
              <Sparkles className="h-4 w-4 jewelry-text-gold mt-0.5" />
              <div>
                <p className="!text-gray-100 dark:!text-gray-100 text-sm font-medium">Pro Tip</p>
                <p className="!text-gray-400 dark:!text-gray-400 text-xs mt-1">
                  Use multiple filters to narrow down your search. Filters work together to find exactly what you need.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  )
}