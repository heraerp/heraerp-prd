'use client'

import React from 'react'
import { MoreHorizontal, ExternalLink } from 'lucide-react'

export interface MobileCardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  padding?: 'none' | 'small' | 'medium' | 'large'
  shadow?: boolean
  border?: boolean
  actions?: React.ReactNode
  onMoreClick?: () => void
  href?: string
}

export function MobileCard({
  children,
  title,
  subtitle,
  className = '',
  padding = 'medium',
  shadow = true,
  border = true,
  actions,
  onMoreClick,
  href
}: MobileCardProps) {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  }

  const Card = ({ children: cardChildren }: { children: React.ReactNode }) => (
    <div 
      className={`
        bg-white rounded-lg 
        ${shadow ? 'shadow-sm hover:shadow-md' : ''} 
        ${border ? 'border border-gray-200' : ''} 
        transition-all duration-200 
        ${href ? 'cursor-pointer hover:bg-gray-50' : ''}
        ${className}
      `}
      onClick={href ? () => window.location.href = href : undefined}
    >
      {cardChildren}
    </div>
  )

  return (
    <Card>
      {/* Header */}
      {(title || subtitle || actions || onMoreClick) && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              {title && (
                <h3 className="font-medium text-gray-900 text-lg flex items-center gap-2">
                  {title}
                  {href && <ExternalLink className="w-4 h-4 text-gray-400" />}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {actions}
              {onMoreClick && (
                <button 
                  onClick={onMoreClick}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={title || subtitle || actions || onMoreClick ? paddingClasses[padding] : paddingClasses[padding]}>
        {children}
      </div>
    </Card>
  )
}