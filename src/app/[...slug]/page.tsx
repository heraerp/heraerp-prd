/**
 * HERA Dynamic Catch-All Route
 * Smart Code: HERA.PLATFORM.ROUTE.DYNAMIC.v1
 * 
 * Handles all dynamic URL patterns and resolves them to canonical components
 * Supports alias mapping, industry contexts, and zero-duplication architecture
 */

import { Suspense } from 'react'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import { CashewAuthProvider } from '@/components/auth/CashewAuthProvider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import ClientWrapper from './client-wrapper'

interface DynamicPageProps {
  params: { slug?: string[] }
  searchParams: Record<string, string>
}

/**
 * Dynamic Page Component - Dual authentication approach
 * Supports both HERA multi-tenant auth and simplified cashew auth
 */
export default async function DynamicPage({ params, searchParams }: DynamicPageProps) {
  // Await params for Next.js 15 compatibility
  const resolvedParams = await params
  
  // Construct the requested path
  const slug = '/' + (resolvedParams.slug?.join('/') ?? '')
  
  console.log('🔍 Dynamic route requested:', slug)
  
  return (
    <HERAAuthProvider>
      <CashewAuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <ClientWrapper slug={slug} searchParams={searchParams} />
        </Suspense>
      </CashewAuthProvider>
    </HERAAuthProvider>
  )
}

/**
 * Generate metadata for dynamic pages
 */
export async function generateMetadata({ params }: DynamicPageProps) {
  // Await params for Next.js 15 compatibility
  const resolvedParams = await params
  const slug = '/' + (resolvedParams.slug?.join('/') ?? '')
  
  // Simple metadata generation without server-side auth
  const entityName = slug.split('/').pop()?.replace('-', ' ') || 'Page'
  
  return {
    title: `${entityName} | HERA Enterprise`,
    description: `${entityName} page in HERA Enterprise platform`
  }
}