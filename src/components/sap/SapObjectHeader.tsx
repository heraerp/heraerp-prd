'use client'

import React from 'react'

export interface KeyFigure {
  value: string | number
  currency?: string
  label?: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export interface ObjectAttribute {
  label: string
  value: string
}

export interface SapObjectHeaderProps {
  title: string
  subtitle?: string
  attributes?: ObjectAttribute[]
  keyFigures?: KeyFigure[]
  className?: string
}

export function SapObjectHeader({
  title,
  subtitle,
  attributes = [],
  keyFigures = [],
  className = ''
}: SapObjectHeaderProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Title and Subtitle */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-gray-600">{subtitle}</p>
        )}
      </div>

      {/* Attributes Grid */}
      {attributes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4 border-t border-gray-200">
          {attributes.map((attr, index) => (
            <div key={index} className="space-y-1">
              <span className="text-sm font-medium text-gray-500">{attr.label}</span>
              <span className="text-sm text-gray-900 block">{attr.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Key Figures */}
      {keyFigures.length > 0 && (
        <div className="flex flex-wrap gap-6 pt-4 border-t border-gray-200">
          {keyFigures.map((figure, index) => (
            <div key={index} className="text-center">
              <div className="flex items-baseline justify-center space-x-1">
                {figure.currency && (
                  <span className="text-sm font-medium text-gray-500">{figure.currency}</span>
                )}
                <span className="text-2xl font-bold text-gray-900">
                  {typeof figure.value === 'number' 
                    ? figure.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                    : figure.value
                  }
                </span>
              </div>
              {figure.label && (
                <span className="text-xs text-gray-600 block mt-1">{figure.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}