'use client'

import { usePathname } from 'next/navigation'
import { PropsWithChildren } from 'react'
import { MatrixITWorldBrandingProvider } from '@/components/retail/MatrixITWorldBrandingProvider'
import { HeraProvider } from '@/lib/hera-react-provider'

// Default HERA config for retail
const defaultHeraConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v2',
  defaultOrganizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'default-org',
  environment: process.env.NODE_ENV as 'development' | 'production' | 'test'
}

export default function RetailLayout({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const isMatrixITWorldPage = pathname?.includes('matrixitworld')

  // Use dedicated branding provider for MatrixIT World pages with HERA context
  if (isMatrixITWorldPage) {
    return (
      <HeraProvider config={defaultHeraConfig}>
        <MatrixITWorldBrandingProvider>
          {children}
        </MatrixITWorldBrandingProvider>
      </HeraProvider>
    )
  }

  // Default layout for other retail pages with HERA context
  return (
    <HeraProvider config={defaultHeraConfig}>
      <div className="min-h-screen bg-white">
        {children}
      </div>
    </HeraProvider>
  )
}