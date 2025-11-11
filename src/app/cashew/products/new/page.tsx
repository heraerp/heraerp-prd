/**
 * New Cashew Product Page
 * Smart Code: HERA.CASHEW.PRODUCTS.NEW.v1
 * 
 * Create new cashew kernel products using the universal EntityWizard
 */

'use client'

import { useCashewAuth } from '@/components/auth/CashewAuthProvider'
import { EntityWizard } from '@/components/universal/EntityWizard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Mock resolved operation for the EntityWizard
const mockResolvedOperation = {
  component_id: 'EntityWizard',
  entity_code: 'PRODUCT',
  scenario: 'create',
  smart_code: 'HERA.CASHEW.PRODUCT.ENTITY.CREATE.v1',
  canonical_path: '/cashew/products',
  params: {
    module: 'cashew',
    area: 'products',
    operation: 'create'
  },
  aliasHit: false
}

export default function NewCashewProductPage() {
  const { user, organization, isAuthenticated, isLoading } = useCashewAuth()

  // Authentication guard
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading new product form...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <Button onClick={() => window.location.href = '/cashew/login'}>
              Login to Cashew ERP
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!organization?.id) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">No Organization Context</h1>
            <p className="text-muted-foreground">
              Please ensure you're logged into the correct organization.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Use the Universal EntityWizard component with PRODUCT entity type */}
      <EntityWizard
        resolvedOperation={mockResolvedOperation}
        orgId={organization.id}
        actorId={user?.id || ''}
        entityType="PRODUCT"
        searchParams={{}}
      />
    </div>
  )
}