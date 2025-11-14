'use client'

import React from 'react'
import { HeraProvider } from '@/lib/hera-react-provider'

// Default HERA config for GL journals
const defaultHeraConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2',
  defaultOrganizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'default-org',
  environment: process.env.NODE_ENV as 'development' | 'production' | 'test'
}

export default function GLJournalsLayout({ children }: PropsWithChildren) {
  return (
    <HeraProvider config={defaultHeraConfig}>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </HeraProvider>
  )
}