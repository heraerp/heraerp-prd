'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export default function SalonDirectAccess() {
  const router = useRouter()
  const { organizations, currentOrganization, switchOrganization, isLoading, isAuthenticated } = useMultiOrgAuth()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('SalonDirect - Auth state:', { isAuthenticated, isLoading, orgCount: organizations.length })
    console.log('SalonDirect - Organizations:', organizations)
    console.log('SalonDirect - Current Org:', currentOrganization)
  }, [isAuthenticated, isLoading, organizations, currentOrganization])

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/auth/login')
      return
    }

    if (!isLoading && !processing && organizations.length > 0) {
      setProcessing(true)
      
      // Find the salon organization
      const salonOrg = organizations.find(org => 
        org.type === 'salon' || org.name?.toLowerCase().includes('salon') || org.name === 'hera2'
      )
      
      console.log('SalonDirect - Found salon org:', salonOrg)
      
      if (salonOrg) {
        // If already the current org, just redirect
        if (currentOrganization?.id === salonOrg.id) {
          router.push('/org/salon')
        } else {
          // Switch to salon organization and redirect
          switchOrganization(salonOrg.id).then(() => {
            router.push('/org/salon')
          }).catch(err => {
            console.error('Failed to switch organization:', err)
            setError('Failed to switch to salon organization')
            setProcessing(false)
          })
        }
      } else {
        // No salon organization found
        setError('No salon organization found. Please create one first.')
        setTimeout(() => {
          router.push('/auth/organizations/new')
        }, 2000)
      }
    } else if (!isLoading && !processing && organizations.length === 0 && process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID) {
      // No organizations but we have a default - the MultiOrgAuthProvider should handle this
      console.log('Waiting for default organization to load...')
    }
  }, [organizations, currentOrganization, isLoading, isAuthenticated, processing, switchOrganization, router])

  if (!isAuthenticated && !isLoading) {
    return null // Will redirect to login
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/auth/organizations')}>
            Go to Organizations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <h2 className="text-xl font-semibold mb-2">Loading Salon...</h2>
        <p className="text-gray-600 mb-4">Setting up your salon dashboard</p>
        {organizations.length === 0 && !isLoading && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">No organizations found</p>
            <Button onClick={() => router.push('/auth/organizations/new')}>
              Create Organization
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}