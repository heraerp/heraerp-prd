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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
