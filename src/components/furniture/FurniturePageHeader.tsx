'use client'

import React from 'react'

interface FurniturePageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function FurniturePageHeader({
  title,
  subtitle,
  actions
}: FurniturePageHeaderProps) {
  return (
    <div className="bg-[var(--color-body)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {' '}
      <div>
        {' '}
        <h1 className="bg-[var(--color-body)] text-3xl font-bold text-[var(--color-text-primary)]">
          {title}
        </h1>{' '}
        {subtitle && <p className="text-[var(--color-text-secondary)] mt-1">{subtitle}</p>}{' '}
      </div>{' '}
      {actions && <div className="flex items-center gap-2">{actions}</div>}{' '}
    </div>
  )
}
