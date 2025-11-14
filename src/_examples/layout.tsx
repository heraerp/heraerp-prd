'use client'

// app/examples/layout.tsx - Example layout showing HeraProvider usage
import React from 'react'
import { HeraProvider } from '@/ui'

export default function ExamplesLayout({ children }: { children: React.ReactNode }) {
  // In production, get orgId from session/auth context
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'demo-org-id'

  return (
    <HeraProvider orgId={orgId}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-lg font-semibold">HERA UI Examples</h1>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </HeraProvider>
  )
}
