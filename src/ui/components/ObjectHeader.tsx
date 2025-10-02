// src/ui/components/ObjectHeader.tsx
import React from 'react'

export function ObjectHeader({
  title,
  subtitle,
  tags = [],
  right
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  tags?: string[]
  right?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-gray-600">{subtitle}</div>}
        {tags?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map(t => (
              <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
