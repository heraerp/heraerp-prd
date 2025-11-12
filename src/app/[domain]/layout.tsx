/**
 * Universal Domain Layout
 * Smart Code: HERA.UNIVERSAL.DOMAIN.LAYOUT.v1
 * 
 * Dynamic domain layout that works for ANY domain
 * Provides authentication context and domain-specific styling
 */

import React from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

interface UniversalDomainLayoutProps {
  children: React.ReactNode
  params: Promise<{ domain: string }>
}

export default async function UniversalDomainLayout({ 
  children, 
  params 
}: UniversalDomainLayoutProps) {
  const { domain } = await params

  return (
    <HERAAuthProvider>
      <div className={`hera-domain hera-domain-${domain}`}>
        {children}
      </div>
    </HERAAuthProvider>
  )
}

// Generate metadata dynamically based on domain
export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  
  const domainNames = {
    retail: 'Retail & Distribution',
    wholesale: 'Wholesale & B2B Trading',
    finance: 'Finance & Accounting',
    manufacturing: 'Manufacturing & Production',
    crm: 'Customer Relationship Management'
  }

  const domainName = domainNames[domain as keyof typeof domainNames] || `${domain.charAt(0).toUpperCase()}${domain.slice(1)}`

  return {
    title: `HERA ${domainName}`,
    description: `Comprehensive ${domainName.toLowerCase()} management with enterprise-grade features and real-time operations`,
    openGraph: {
      title: `HERA ${domainName}`,
      description: `Enterprise-grade ${domainName.toLowerCase()} management system`,
      type: 'website'
    }
  }
}