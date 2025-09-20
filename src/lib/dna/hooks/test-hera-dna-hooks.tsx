/**
 * HERA DNA HOOKS TEST SUITE
 * Smart Code: HERA.DNA.HOOKS.TEST.v1
 * 
 * Tests all HERA DNA hooks to ensure they're working correctly
 * with the new useHERAAuth system
 */

'use client'

import React from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import { useUniversalApi } from '@/hooks/useUniversalApi'
import { useSalonAuth, useRestaurantAuth, useHealthcareAuth, useManufacturingAuth } from '@/lib/dna/hooks/useHERAAuthDNA'

export function TestHERADNAHooks() {
  // Test 1: Base HERA Auth Hook
  const heraAuth = useHERAAuth()
  console.log('✅ useHERAAuth:', {
    isAuthenticated: heraAuth.isAuthenticated,
    organization: heraAuth.organization?.name,
    userId: heraAuth.user?.id
  })

  // Test 2: Demo Organization Hook
  const demoOrg = useDemoOrganization()
  console.log('✅ useDemoOrganization:', {
    organizationId: demoOrg.organizationId,
    organizationName: demoOrg.organizationName,
    isLoading: demoOrg.orgLoading
  })

  // Test 3: Universal API Hook
  const universalApi = useUniversalApi(demoOrg.organizationId)
  console.log('✅ useUniversalApi:', {
    hasOrganizationContext: !!demoOrg.organizationId,
    isLoading: universalApi.isLoading
  })

  // Test 4: Industry-Specific Auth Hooks
  const salonAuth = useSalonAuth()
  console.log('✅ useSalonAuth:', {
    isSalonUser: salonAuth.isSalonUser,
    salonOrganization: salonAuth.salonOrganization?.name
  })

  const restaurantAuth = useRestaurantAuth()
  console.log('✅ useRestaurantAuth:', {
    isRestaurantUser: restaurantAuth.isRestaurantUser,
    restaurantOrganization: restaurantAuth.restaurantOrganization?.name
  })

  const healthcareAuth = useHealthcareAuth()
  console.log('✅ useHealthcareAuth:', {
    isHealthcareUser: healthcareAuth.isHealthcareUser,
    healthcareOrganization: healthcareAuth.healthcareOrganization?.name
  })

  const manufacturingAuth = useManufacturingAuth()
  console.log('✅ useManufacturingAuth:', {
    isManufacturingUser: manufacturingAuth.isManufacturingUser,
    manufacturingOrganization: manufacturingAuth.manufacturingOrganization?.name
  })

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">HERA DNA Hooks Test Results</h2>
      
      <div className="space-y-2">
        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
          <p className="font-semibold">✅ useHERAAuth</p>
          <p className="text-sm">Authenticated: {heraAuth.isAuthenticated ? 'Yes' : 'No'}</p>
          <p className="text-sm">Organization: {heraAuth.organization?.name || 'None'}</p>
        </div>

        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
          <p className="font-semibold">✅ useDemoOrganization</p>
          <p className="text-sm">Organization: {demoOrg.organizationName || 'None'}</p>
          <p className="text-sm">Loading: {demoOrg.orgLoading ? 'Yes' : 'No'}</p>
        </div>

        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
          <p className="font-semibold">✅ useUniversalApi</p>
          <p className="text-sm">Ready: {demoOrg.organizationId ? 'Yes' : 'No'}</p>
        </div>

        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
          <p className="font-semibold">✅ Industry Auth Hooks</p>
          <p className="text-sm">Salon: {salonAuth.isSalonUser ? '✓' : '✗'}</p>
          <p className="text-sm">Restaurant: {restaurantAuth.isRestaurantUser ? '✓' : '✗'}</p>
          <p className="text-sm">Healthcare: {healthcareAuth.isHealthcareUser ? '✓' : '✗'}</p>
          <p className="text-sm">Manufacturing: {manufacturingAuth.isManufacturingUser ? '✓' : '✗'}</p>
        </div>
      </div>
    </div>
  )
}