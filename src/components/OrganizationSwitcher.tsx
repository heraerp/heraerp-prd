'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus,
  Loader2,
  AlertCircle 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Organization {
  id: string
  name: string
  role: string
  type?: string
}

export function OrganizationSwitcher() {
  const { supabaseUser } = useAuth()
  const { 
    organizationId, 
    userContext, 
    switchOrganization,
    loading: contextLoading 
  } = useUserContext()
  const router = useRouter()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (supabaseUser?.id) {
      fetchUserOrganizations()
    }
  }, [supabaseUser?.id])

  const fetchUserOrganizations = async () => {
    if (!supabaseUser?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/users/${supabaseUser.id}/organizations`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch organizations')
      }

      const data = await response.json()
      setOrganizations(data.organizations || [])
    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchOrganization = async (orgId: string) => {
    if (orgId === organizationId || switching) return

    try {
      setSwitching(true)
      setError(null)

      // Call the switch organization function from context
      const success = await switchOrganization(orgId)

      if (success) {
        // Refresh the page to ensure all data is reloaded with new context
        router.refresh()
      } else {
        setError('Failed to switch organization')
      }
    } catch (err) {
      console.error('Error switching organization:', err)
      setError('Failed to switch organization')
    } finally {
      setSwitching(false)
    }
  }

  const handleCreateOrganization = () => {
    router.push('/onboarding')
  }

  if (contextLoading || loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-xs">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const currentOrg = organizations.find(org => org.id === organizationId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="min-w-[200px] justify-between"
          disabled={switching}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {switching ? 'Switching...' : (currentOrg?.name || 'Select Organization')}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.length === 0 ? (
          <div className="py-4 px-2 text-center">
            <p className="text-sm text-gray-500 mb-3">No organizations found</p>
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleCreateOrganization}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        ) : (
          <>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSwitchOrganization(org.id)}
                className={cn(
                  "cursor-pointer",
                  org.id === organizationId && "bg-gray-100"
                )}
                disabled={switching}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-gray-500">{org.role}</p>
                    </div>
                  </div>
                  {org.id === organizationId && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleCreateOrganization}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Organization
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}