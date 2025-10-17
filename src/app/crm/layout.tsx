'use client'

import { PropsWithChildren } from 'react'

export default function CRMLayout({ children }: PropsWithChildren) {
  // Use the same enterprise layout pattern as retail - clean full-screen
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}