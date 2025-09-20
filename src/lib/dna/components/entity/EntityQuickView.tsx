'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Package, 
  Users, 
  FileText, 
  Calendar, 
  DollarSign,
  ChevronRight,
  Eye,
  Edit3,
  Loader2,
  Hash,
  Clock,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'
import { formatCurrency } from '@/lib/utils/format'
import { formatDistanceToNow } from 'date-fns'

// Entity type configurations
const ENTITY_CONFIG = {
  customer: {
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    fields: ['email', 'phone', 'credit_limit', 'payment_terms'],
    label: 'Customer'
  },
  vendor: {
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    fields: ['email', 'phone', 'payment_terms', 'tax_id'],
    label: 'Vendor'
  },
  product: {
    icon: Package,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    fields: ['sku', 'price', 'cost', 'stock_quantity'],
    label: 'Product'
  },
  gl_account: {
    icon: FileText,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    fields: ['account_number', 'account_type', 'balance', 'currency'],
    label: 'GL Account'
  }
}

interface EntityData {
  id: string
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code?: string
  created_at: string
  updated_at: string
  metadata?: any
  dynamic_fields?: Record<string, any>
  recent_transactions?: Array<{
    id: string
    transaction_type: string
    total_amount: number
    transaction_date: string
  }>
  related_entities?: Array<{
    id: string
    entity_name: string
    entity_type: string
    relationship_type: string
  }>
}

export interface EntityQuickViewProps {
  // Entity identifier - can be ID or full entity object
  entity: string | Partial<EntityData>
  
  // Trigger element
  children: React.ReactElement
  
  // Delay before showing preview (ms)
  delay?: number
  
  // Custom content renderer
  renderContent?: (entity: EntityData) => React.ReactNode
  
  // Position strategy
  position?: 'auto' | 'top' | 'bottom' | 'left' | 'right'
  
  // Event callbacks
  onShow?: () => void
  onHide?: () => void
  onAction?: (action: string, entity: EntityData) => void
  
  // Style customization
  className?: string
  maxWidth?: number
  
  // Feature flags
  showTransactions?: boolean
  showRelated?: boolean
  showActions?: boolean
}

export function EntityQuickView({
  entity,
  children,
  delay = 500,
  renderContent,
  position = 'auto',
  onShow,
  onHide,
  onAction,
  className,
  maxWidth = 400,
  showTransactions = true,
  showRelated = true,
  showActions = true
}: EntityQuickViewProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [entityData, setEntityData] = useState<EntityData | null>(null)
  const [viewPosition, setViewPosition] = useState({ top: 0, left: 0 })
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom')
  
  const triggerRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const touchTimerRef = useRef<NodeJS.Timeout>()
  const isTouchRef = useRef(false)

  // Fetch entity data
  const fetchEntityData = useCallback(async () => {
    setIsLoading(true)
    
    try {
      let data: EntityData
      
      // If entity is an object, use it directly
      if (typeof entity === 'object' && 'id' in entity) {
        data = entity as EntityData
        
        // Fetch dynamic fields if not present
        if (!data.dynamic_fields) {
          const dynamicFields = await universalApi.getDynamicFields(data.id)
          data.dynamic_fields = dynamicFields.reduce((acc: any, field: any) => {
            acc[field.field_name] = field.field_value_text || field.field_value_number || field.field_value_date
            return acc
          }, {})
        }
      } else if (typeof entity === 'string') {
        // Fetch entity by ID
        const entities = await universalApi.read('core_entities')
        const entityRecord = entities.find((e: any) => e.id === entity)
        
        if (!entityRecord) throw new Error('Entity not found')
        
        // Fetch dynamic fields
        const dynamicFields = await universalApi.getDynamicFields(entity)
        const dynamicFieldsMap = dynamicFields.reduce((acc: any, field: any) => {
          acc[field.field_name] = field.field_value_text || field.field_value_number || field.field_value_date
          return acc
        }, {})
        
        data = {
          ...entityRecord,
          dynamic_fields: dynamicFieldsMap
        }
      } else {
        throw new Error('Invalid entity prop')
      }
      
      // Fetch recent transactions if enabled
      if (showTransactions) {
        const transactions = await universalApi.read('universal_transactions')
        const recentTxns = transactions
          .filter((txn: any) => 
            txn.from_entity_id === data.id || 
            txn.to_entity_id === data.id
          )
          .slice(0, 3)
          .map((txn: any) => ({
            id: txn.id,
            transaction_type: txn.transaction_type,
            total_amount: txn.total_amount,
            transaction_date: txn.transaction_date
          }))
        
        data.recent_transactions = recentTxns
      }
      
      // Fetch related entities if enabled
      if (showRelated) {
        const relationships = await universalApi.read('core_relationships')
        const relatedRels = relationships
          .filter((rel: any) => 
            rel.from_entity_id === data.id || 
            rel.to_entity_id === data.id
          )
          .slice(0, 3)
        
        const entities = await universalApi.read('core_entities')
        const relatedEntities = relatedRels.map((rel: any) => {
          const relatedId = rel.from_entity_id === data.id ? rel.to_entity_id : rel.from_entity_id
          const relatedEntity = entities.find((e: any) => e.id === relatedId)
          
          return {
            id: relatedId,
            entity_name: relatedEntity?.entity_name || 'Unknown',
            entity_type: relatedEntity?.entity_type || 'unknown',
            relationship_type: rel.relationship_type
          }
        })
        
        data.related_entities = relatedEntities
      }
      
      setEntityData(data)
    } catch (error) {
      console.error('Error fetching entity data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [entity, showTransactions, showRelated])

  // Calculate position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return
    
    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const gap = 8
    
    let top = 0
    let left = 0
    let finalPlacement: typeof placement = 'bottom'
    
    // Auto position calculation
    if (position === 'auto') {
      // Try bottom first
      if (triggerRect.bottom + contentRect.height + gap < viewportHeight) {
        top = triggerRect.bottom + gap
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
        finalPlacement = 'bottom'
      }
      // Try top
      else if (triggerRect.top - contentRect.height - gap > 0) {
        top = triggerRect.top - contentRect.height - gap
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
        finalPlacement = 'top'
      }
      // Try right
      else if (triggerRect.right + contentRect.width + gap < viewportWidth) {
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        left = triggerRect.right + gap
        finalPlacement = 'right'
      }
      // Try left
      else if (triggerRect.left - contentRect.width - gap > 0) {
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
        left = triggerRect.left - contentRect.width - gap
        finalPlacement = 'left'
      }
      // Default to bottom with viewport constraints
      else {
        top = Math.min(triggerRect.bottom + gap, viewportHeight - contentRect.height - gap)
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
        finalPlacement = 'bottom'
      }
    } else {
      // Manual position
      switch (position) {
        case 'top':
          top = triggerRect.top - contentRect.height - gap
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
          finalPlacement = 'top'
          break
        case 'bottom':
          top = triggerRect.bottom + gap
          left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
          finalPlacement = 'bottom'
          break
        case 'left':
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
          left = triggerRect.left - contentRect.width - gap
          finalPlacement = 'left'
          break
        case 'right':
          top = triggerRect.top + (triggerRect.height - contentRect.height) / 2
          left = triggerRect.right + gap
          finalPlacement = 'right'
          break
      }
    }
    
    // Keep within viewport bounds
    left = Math.max(gap, Math.min(left, viewportWidth - contentRect.width - gap))
    top = Math.max(gap, Math.min(top, viewportHeight - contentRect.height - gap))
    
    setViewPosition({ top, left })
    setPlacement(finalPlacement)
  }, [position])

  // Show preview
  const showPreview = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      fetchEntityData()
      onShow?.()
    }, delay)
  }, [delay, fetchEntityData, onShow])

  // Hide preview
  const hidePreview = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
    }
    setIsVisible(false)
    onHide?.()
  }, [onHide])

  // Mouse events
  const handleMouseEnter = () => {
    if (!isTouchRef.current) {
      showPreview()
    }
  }

  const handleMouseLeave = () => {
    if (!isTouchRef.current) {
      hidePreview()
    }
  }

  // Touch events
  const handleTouchStart = () => {
    isTouchRef.current = true
    touchTimerRef.current = setTimeout(() => {
      showPreview()
    }, 500) // Long press duration
  }

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
    }
    if (isVisible) {
      hidePreview()
    }
  }

  // Keyboard support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (isVisible) {
        hidePreview()
      } else {
        showPreview()
      }
    } else if (e.key === 'Escape' && isVisible) {
      hidePreview()
    }
  }

  // Update position when visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition()
      
      // Recalculate on scroll/resize
      const handleUpdate = () => calculatePosition()
      window.addEventListener('scroll', handleUpdate, true)
      window.addEventListener('resize', handleUpdate)
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, true)
        window.removeEventListener('resize', handleUpdate)
      }
    }
  }, [isVisible, calculatePosition])

  // Render entity icon
  const renderEntityIcon = (type: string) => {
    const config = ENTITY_CONFIG[type as keyof typeof ENTITY_CONFIG] || {
      icon: FileText,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
    }
    const Icon = config.icon
    
    return (
      <div className={cn('p-2 rounded-lg', config.bgColor)}>
        <Icon className={cn('w-5 h-5', config.color)} />
      </div>
    )
  }

  // Format field value
  const formatFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined) return '-'
    
    // Special formatting based on field name
    if (field.includes('price') || field.includes('amount') || field.includes('limit')) {
      return formatCurrency(parseFloat(value))
    }
    if (field.includes('date')) {
      return new Date(value).toLocaleDateString()
    }
    if (field.includes('percent')) {
      return `${value}%`
    }
    
    return String(value)
  }

  // Render content
  const renderQuickViewContent = () => {
    if (!entityData) return null
    
    // Use custom renderer if provided
    if (renderContent) {
      return renderContent(entityData)
    }
    
    const config = ENTITY_CONFIG[entityData.entity_type as keyof typeof ENTITY_CONFIG]
    
    return (
      <>
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          {renderEntityIcon(entityData.entity_type)}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {entityData.entity_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {entityData.entity_code && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Hash className="w-3 h-3" />
                  {entityData.entity_code}
                </div>
              )}
              <span className="text-xs text-gray-500">
                {config?.label || entityData.entity_type}
              </span>
            </div>
          </div>
        </div>
        
        {/* Smart Code */}
        {entityData.smart_code && (
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded">
              {entityData.smart_code}
            </div>
          </div>
        )}
        
        {/* Key Fields */}
        <div className="p-4 space-y-2 border-b border-gray-100 dark:border-gray-800">
          {config?.fields.map((field) => {
            const value = entityData.dynamic_fields?.[field] || entityData.metadata?.[field]
            if (!value) return null
            
            return (
              <div key={field} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {field.replace(/_/g, ' ')}:
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatFieldValue(field, value)}
                </span>
              </div>
            )
          })}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Created:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDistanceToNow(new Date(entityData.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        {/* Recent Transactions */}
        {showTransactions && entityData.recent_transactions && entityData.recent_transactions.length > 0 && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Recent Transactions
            </h4>
            <div className="space-y-2">
              {entityData.recent_transactions.map((txn) => (
                <div key={txn.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {txn.transaction_type.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(txn.total_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Related Entities */}
        {showRelated && entityData.related_entities && entityData.related_entities.length > 0 && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <Users className="w-4 h-4" />
              Related Entities
            </h4>
            <div className="space-y-2">
              {entityData.related_entities.map((related) => (
                <div key={related.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {renderEntityIcon(related.entity_type)}
                    <span className="text-gray-900 dark:text-gray-100">
                      {related.entity_name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">
                    {related.relationship_type.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        {showActions && (
          <div className="p-3 flex gap-2">
            <button
              onClick={() => onAction?.('view', entityData)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
            <button
              onClick={() => onAction?.('edit', entityData)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>
        )}
      </>
    )
  }

  // Clone child element with event handlers
  const childrenWithProps = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onKeyDown: handleKeyDown,
    tabIndex: 0,
    'aria-describedby': isVisible ? 'entity-quick-view' : undefined
  })

  return (
    <>
      {childrenWithProps}
      
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              ref={contentRef}
              id="entity-quick-view"
              className={cn(
                'fixed z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-xl',
                'border border-gray-200 dark:border-gray-700',
                'backdrop-blur-xl backdrop-saturate-150',
                'overflow-hidden',
                className
              )}
              style={{
                top: viewPosition.top,
                left: viewPosition.left,
                maxWidth,
                width: 'max-content'
              }}
              initial={{ opacity: 0, scale: 0.95, y: placement === 'bottom' ? -10 : placement === 'top' ? 10 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="tooltip"
              aria-label="Entity quick view"
            >
              {isLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                renderQuickViewContent()
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

// Loading skeleton component
export function EntityQuickViewSkeleton() {
  return (
    <div className="w-full max-w-sm">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/4" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Compound component for custom layouts
export const EntityQuickViewHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
    {children}
  </div>
)

export const EntityQuickViewBody = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4">
    {children}
  </div>
)

export const EntityQuickViewFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="p-3 border-t border-gray-100 dark:border-gray-800">
    {children}
  </div>
)