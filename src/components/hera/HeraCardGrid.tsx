'use client'

import React from 'react'
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'

export interface CardField {
  key: string
  label?: string
  render?: (value: any, record: any) => React.ReactNode
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'status'
  show?: (record: any) => boolean
}

export interface CardAction {
  label: string
  icon?: React.ComponentType<any>
  onClick: (record: any) => void
  variant?: 'default' | 'primary' | 'danger'
  show?: (record: any) => boolean
}

export interface HeraCardGridProps {
  data: any[]
  title?: (record: any) => string
  subtitle?: (record: any) => string
  image?: (record: any) => string | React.ReactNode
  fields?: CardField[]
  actions?: CardAction[]
  loading?: boolean
  selectable?: boolean
  selectedCards?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onCardClick?: (record: any) => void
  className?: string
  cardClassName?: string
  emptyMessage?: string
  emptyIcon?: React.ComponentType<any>
  rowKey?: string
  columns?: number
}

export function HeraCardGrid({
  data,
  title = (record) => record.entity_name || record.name || 'Untitled',
  subtitle = (record) => record.entity_code || record.code || record.id,
  image,
  fields = [],
  actions = [],
  loading = false,
  selectable = false,
  selectedCards = [],
  onSelectionChange,
  onCardClick,
  className = '',
  cardClassName = '',
  emptyMessage = 'No items found',
  emptyIcon: EmptyIcon,
  rowKey = 'id',
  columns
}: HeraCardGridProps) {
  const [expandedActions, setExpandedActions] = React.useState<Set<string>>(new Set())

  const handleSelectCard = (id: string, checked: boolean) => {
    if (!onSelectionChange) return
    
    if (checked) {
      onSelectionChange([...selectedCards, id])
    } else {
      onSelectionChange(selectedCards.filter(cardId => cardId !== id))
    }
  }

  const toggleActions = (recordId: string) => {
    const newExpanded = new Set(expandedActions)
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId)
    } else {
      newExpanded.add(recordId)
    }
    setExpandedActions(newExpanded)
  }

  const renderFieldValue = (field: CardField, record: any) => {
    const value = record[field.key]
    
    if (field.render) {
      return field.render(value, record)
    }
    
    if (value === null || value === undefined) {
      return <span className="text-gray-400">—</span>
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={`hera-status ${value ? 'hera-status-success' : 'hera-status-error'}`}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }
    
    if (typeof value === 'number') {
      return (
        <span className="font-mono text-sm font-medium">
          {value.toLocaleString()}
        </span>
      )
    }
    
    return <span>{String(value)}</span>
  }

  const getFieldVariantClass = (variant: CardField['variant']) => {
    switch (variant) {
      case 'primary': return 'text-indigo-600 font-medium'
      case 'secondary': return 'text-gray-600'
      case 'accent': return 'text-amber-600 font-medium'
      case 'status': return 'font-medium'
      default: return 'text-gray-900'
    }
  }

  if (loading) {
    return (
      <div className={`hera-grid ${className}`} style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="hera-skeleton h-48 rounded-xl"></div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        {EmptyIcon && <EmptyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />}
        <p className="text-gray-500 hera-font-primary text-lg font-medium mb-2">
          {emptyMessage}
        </p>
        <p className="text-gray-400 hera-font-primary text-sm">
          Try adjusting your search criteria or filters
        </p>
      </div>
    )
  }

  return (
    <div 
      className={`hera-grid ${className}`}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {data.map((record, index) => {
        const recordId = record[rowKey]
        const isSelected = selectedCards.includes(recordId)
        const showActions = expandedActions.has(recordId)
        const cardTitle = title(record)
        const cardSubtitle = subtitle(record)
        const cardImage = image?.(record)
        
        return (
          <div
            key={recordId}
            className={`hera-grid-card group ${isSelected ? 'ring-2 ring-indigo-500' : ''} ${cardClassName}`}
            onClick={() => onCardClick?.(record)}
          >
            {/* Selection Checkbox */}
            {selectable && (
              <div className="absolute top-3 left-3 z-10">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={e => {
                    e.stopPropagation()
                    handleSelectCard(recordId, e.target.checked)
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Actions Menu */}
            {actions.length > 0 && (
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={e => {
                    e.stopPropagation()
                    toggleActions(recordId)
                  }}
                  className="p-1.5 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {showActions && (
                  <>
                    <div 
                      className="fixed inset-0 z-30"
                      onClick={() => setExpandedActions(new Set())}
                    />
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg border border-gray-200 shadow-lg z-40 hera-animate-scale-in">
                      <div className="p-1">
                        {actions
                          .filter(action => !action.show || action.show(record))
                          .map((action, actionIndex) => {
                            const IconComponent = action.icon
                            const buttonClass = action.variant === 'danger' 
                              ? 'text-red-600 hover:bg-red-50'
                              : action.variant === 'primary'
                              ? 'text-indigo-600 hover:bg-indigo-50'
                              : 'text-gray-700 hover:bg-gray-50'
                            
                            return (
                              <button
                                key={actionIndex}
                                onClick={e => {
                                  e.stopPropagation()
                                  action.onClick(record)
                                  setExpandedActions(new Set())
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hera-font-primary ${buttonClass}`}
                              >
                                {IconComponent && <IconComponent className="w-4 h-4" />}
                                {action.label}
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Card Image */}
            {cardImage && (
              <div className="mb-4">
                {typeof cardImage === 'string' ? (
                  <img
                    src={cardImage}
                    alt={cardTitle}
                    className="w-full h-32 object-cover rounded-lg bg-gray-100"
                    onError={e => {
                      const target = e.target as HTMLImageElement
                      target.src = `data:image/svg+xml,${encodeURIComponent(`
                        <svg viewBox="0 0 200 128" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100%" height="100%" fill="#f3f4f6"/>
                          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="sans-serif" font-size="14">
                            No Image
                          </text>
                        </svg>
                      `)}`
                    }}
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center rounded-lg bg-gray-100">
                    {cardImage}
                  </div>
                )}
              </div>
            )}

            {/* Card Header */}
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 hera-font-primary text-base leading-tight mb-1 line-clamp-2">
                {cardTitle}
              </h3>
              {cardSubtitle && (
                <p className="text-sm text-gray-500 hera-font-primary truncate">
                  {cardSubtitle}
                </p>
              )}
            </div>

            {/* Card Fields */}
            {fields.length > 0 && (
              <div className="space-y-2 flex-1">
                {fields
                  .filter(field => !field.show || field.show(record))
                  .map(field => (
                    <div key={field.key} className="flex justify-between items-center">
                      {field.label && (
                        <span className="text-xs text-gray-500 hera-font-primary uppercase tracking-wider">
                          {field.label}
                        </span>
                      )}
                      <span className={`text-sm hera-font-primary ${getFieldVariantClass(field.variant)}`}>
                        {renderFieldValue(field, record)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* Card Footer - Status or Additional Info */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-xs text-gray-400 hera-font-primary">
                {record.updated_at ? 
                  `Updated ${new Date(record.updated_at).toLocaleDateString()}` :
                  record.created_at ? 
                    `Created ${new Date(record.created_at).toLocaleDateString()}` :
                    ''
                }
              </div>
              {record.status && (
                <span className={`hera-status ${
                  record.status === 'active' ? 'hera-status-success' :
                  record.status === 'inactive' ? 'hera-status-error' :
                  record.status === 'pending' ? 'hera-status-warning' :
                  'hera-status-info'
                }`}>
                  {record.status}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}