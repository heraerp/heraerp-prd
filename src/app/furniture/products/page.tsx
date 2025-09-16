'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Package, ClipboardList, Ruler, Calculator, Plus } from 'lucide-react'
import Link from 'next/link'
import { useMultiOrgAuth } from '@/src/components/auth/MultiOrgAuthProvider'
import { getDemoOrganizationInfo } from '@/src/lib/demo-org-resolver'
import { usePathname } from 'next/navigation'


export default function FurnitureProducts() {
  const pathname = usePathname()

const { currentOrganization, isLoadingOrgs, isAuthenticated } = useMultiOrgAuth()

const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)
  
  // Use authenticated org if available, otherwise use demo org, fallback to Kerala Furniture Works
  const organizationId = currentOrganization?.id || demoOrg?.id || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
  const organizationName = currentOrganization?.organization_name || demoOrg?.name || 'Furniture Enterprise (Demo)'
  const orgLoading = isAuthenticated ? isLoadingOrgs : false
  
  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
          console.log('Demo organization loaded:', orgInfo)
        }
      }
    }
    
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])
  
  // Show loading state while organization is loading
  if (orgLoading) {
    
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-[var(--color-accent-indigo)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[var(--color-text-secondary)]">Loading organization...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-900 dark:to-gray-300 bg-clip-text text-transparent">
              Products & BOM
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              {organizationName} • Managing products, BOMs, routing, and costing
            </p>
          </div>
          <Link href="/furniture/products/catalog/new">
            <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
              <Plus className="h-4 w-4" />
              New Product
            </Button>
          </Link>
        </div>

        {/* Product Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/furniture/products/catalog">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/70 bg-[var(--color-body)]/70 backdrop-blur-sm">
              <Package className="h-10 w-10 text-[var(--color-text-primary)] mb-3" />
              <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-2">Product Catalog</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Manage furniture products</p>
            </Card>
          </Link>
          
          <Link href="/furniture/products/bom">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/70 bg-[var(--color-body)]/70 backdrop-blur-sm">
              <ClipboardList className="h-10 w-10 text-[var(--color-text-primary)] mb-3" />
              <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-2">Bill of Materials</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Define product components</p>
            </Card>
          </Link>
          
          <Link href="/furniture/products/routing">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/70 bg-[var(--color-body)]/70 backdrop-blur-sm">
              <Ruler className="h-10 w-10 text-[var(--color-text-primary)] mb-3" />
              <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-2">Production Routing</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Define manufacturing steps</p>
            </Card>
          </Link>
          
          <Link href="/furniture/products/costing">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 hover:scale-105 transition-transform cursor-pointer bg-[var(--color-body)]/70 bg-[var(--color-body)]/70 backdrop-blur-sm">
              <Calculator className="h-10 w-10 text-green-500 mb-3" />
              <h3 className="bg-[var(--color-body)] text-lg font-semibold mb-2">Product Costing</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Calculate product costs</p>
            </Card>
          </Link>
        </div>
      </div>
      </div>
    )
}
