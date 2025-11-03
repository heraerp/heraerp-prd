'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useCashewAuth } from '@/components/auth/CashewAuthProvider'
import { getCachedNavigation } from '@/lib/hera/navigation-resolver'
import { loadComponent } from '@/lib/hera/component-loader'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ClientWrapperProps {
  slug: string
  searchParams: Record<string, string>
}

export default function ClientWrapper({ slug, searchParams }: ClientWrapperProps) {
  const router = useRouter()
  
  // Determine which authentication to use based on the route
  const isCashewRoute = slug.startsWith('/cashew')
  
  // Use appropriate authentication based on route
  const heraAuth = useHERAAuth()
  const cashewAuth = useCashewAuth()
  
  // Select the appropriate auth context
  const { user, organization, isAuthenticated, isLoading } = isCashewRoute ? cashewAuth : heraAuth
  const [componentData, setComponentData] = useState<{
    Component: any
    resolved: any
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingComponent, setLoadingComponent] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (isCashewRoute) {
        console.log('❌ Not authenticated for cashew route, redirecting to cashew login')
        router.push('/cashew/login')
      } else {
        console.log('❌ Not authenticated for HERA route, redirecting to auth')
        router.push('/auth/login')
      }
      return
    }

    if (!isLoading && isAuthenticated && organization?.id && user?.id) {
      loadComponentData()
    }
  }, [isLoading, isAuthenticated, organization, user, slug])

  const loadComponentData = async () => {
    if (!organization?.id || !user?.id) return

    setLoadingComponent(true)
    try {
      console.log('🔍 Client-side resolving navigation for:', slug, 'org:', organization.id)
      
      // Register navigation access if this is a cashew URL and using cashew auth
      if (isCashewRoute) {
        try {
          const { registerNavigation } = await import('@/lib/auth/app-registration')
          await registerNavigation(user.id, organization.id, slug, {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          })
          console.log('📱 Navigation registered for cashew URL:', slug)
        } catch (regError) {
          console.warn('⚠️ Failed to register navigation:', regError)
        }
      }
      
      // Resolve the navigation operation
      const resolved = await getCachedNavigation(organization.id, slug)
      
      if (!resolved) {
        console.log('❌ No navigation resolved for:', slug)
        setError(`No navigation found for ${slug}`)
        return
      }
      
      console.log('✅ Resolved operation:', resolved.entity_code, 'component:', resolved.component_id)
      
      // Optional: Redirect alias hits to canonical URLs
      if (resolved.aliasHit && resolved.canonical_path && searchParams.redirect !== 'false') {
        const canonicalUrl = resolved.canonical_path + (resolved.tail ?? '')
        const queryString = new URLSearchParams(searchParams).toString()
        const fullCanonicalUrl = queryString ? `${canonicalUrl}?${queryString}` : canonicalUrl
        
        console.log('🔄 Redirecting alias to canonical:', fullCanonicalUrl)
        router.push(fullCanonicalUrl)
        return
      }
      
      // Load the appropriate component
      const Component = await loadComponent(resolved.component_id)
      
      if (!Component) {
        console.error('❌ Failed to load component:', resolved.component_id)
        setError(`Component not found: ${resolved.component_id}`)
        return
      }
      
      setComponentData({ Component, resolved })
    } catch (error) {
      console.error('❌ Error loading component:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoadingComponent(false)
    }
  }

  // Loading states
  if (isLoading || loadingComponent) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  if (!organization?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            No organization context available
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md" variant="destructive">
          <AlertDescription>
            Error: {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!componentData) {
    return <LoadingSpinner />
  }

  const { Component, resolved } = componentData

  // Render the resolved component with full context
  return (
    <Component
      resolvedOperation={resolved}
      orgId={organization.id}
      actorId={user.id}
      searchParams={searchParams}
      {...resolved.params}
    />
  )
}