'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Loader2 } from 'lucide-react'

export default function AuthHubPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, organizations } = useMultiOrgAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        router.push('/auth/login')
      } else if (organizations.length === 0) {
        // Authenticated but no organizations, redirect to create one
        router.push('/auth/organizations/new')
      } else if (organizations.length === 1) {
        // Single organization, redirect directly
        const org = organizations[0]
        if (process.env.NODE_ENV === 'production') {
          window.location.href = `https://${org.subdomain}.heraerp.com`
        } else {
          router.push(`/~${org.subdomain}`)
        }
      } else {
        // Multiple organizations, show selector
        router.push('/auth/organizations')
      }
    }
  }, [isAuthenticated, isLoading, organizations, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  )
}