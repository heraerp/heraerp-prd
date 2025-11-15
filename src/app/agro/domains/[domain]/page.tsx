/**
 * HERA Agro Domain - Wrapper Page
 * Smart Code: HERA.AGRO.DOMAIN.WRAPPER.v1
 *
 * This is a lightweight wrapper that uses the UniversalDomainPage component
 * with Agro-specific configuration. All domain logic is centralized in the
 * universal component to eliminate code duplication.
 *
 * Configuration: /src/lib/config/apps/agro-domain.config.ts
 * Universal Component: /src/components/universal/domain/UniversalDomainPage.tsx
 */

import React, { use } from 'react'
import { UniversalDomainPage } from '@/components/universal/domain/UniversalDomainPage'
import { agroDomainConfig } from '@/lib/config/apps/agro-domain.config'

interface PageProps {
  params: Promise<{
    domain: string
  }>
}

export default function AgroDomainPage({ params }: PageProps) {
  const { domain } = use(params)
  return <UniversalDomainPage config={agroDomainConfig} domainSlug={domain} />
}
