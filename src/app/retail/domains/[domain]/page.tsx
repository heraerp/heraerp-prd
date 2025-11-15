/**
 * HERA Retail Domain - Wrapper Page
 * Smart Code: HERA.RETAIL.DOMAIN.WRAPPER.v1
 *
 * This is a lightweight wrapper that uses the UniversalDomainPage component
 * with Retail-specific configuration. All domain logic is centralized in the
 * universal component to eliminate code duplication.
 *
 * Configuration: /src/lib/config/apps/retail-domain.config.ts
 * Universal Component: /src/components/universal/domain/UniversalDomainPage.tsx
 */

import React, { use } from 'react'
import { UniversalDomainPage } from '@/components/universal/domain/UniversalDomainPage'
import { retailDomainConfig } from '@/lib/config/apps/retail-domain.config'

interface PageProps {
  params: Promise<{
    domain: string
  }>
}

export default function RetailDomainPage({ params }: PageProps) {
  const { domain } = use(params)
  return <UniversalDomainPage config={retailDomainConfig} domainSlug={domain} />
}
