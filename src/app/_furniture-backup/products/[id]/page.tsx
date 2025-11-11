

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, Edit, MoreVertical, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { universalApi } from '@/lib/universal-api'
import { BOMExplorer } from '@/components/furniture/BOMExplorer'
import { SupplierRelationships } from '@/components/furniture/SupplierRelationships'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function ProductDetailPage() {
  const params = useParams()

  const router = useRouter()

  const productId = params.id as string
  const { currentOrganization } = useHERAAuth()

  const [loading, setLoading] = useState(true)

  const [product, setProduct] = useState<any>(null)

  const [dynamicData, setDynamicData] = useState<any[]>([])

  useEffect(() => {
    if (currentOrganization?.id && productId) {
      loadProductData()
    }
  }, [currentOrganization?.id, productId])

  const loadProductData = async () => {
    try {
      setLoading(true)
      // Get product details
      const { data: entities } = await universalApi.read({
        table: 'core_entities',
        organizationId: currentOrganization!.id
      })

      const productData = entities?.find((e: any) => e.id === productId)
      if (!productData) throw new Error('Product not found')
      setProduct(productData)

      // Get dynamic data
      const { data: dynamicFields } = await universalApi.read({
        table: 'core_dynamic_data',
        organizationId: currentOrganization!.id
      })

      const productFields = dynamicFields?.filter((f: any) => f.entity_id === productId) || []
      setDynamicData(productFields)
    } catch (err) {
      console.error('Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-1" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-[var(--color-text-secondary)] mx-auto mb-4" />
          <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)] mb-2">
            Product Not Found
          </h2>
          <Button onClick={() => router.push('/furniture/products')}>Back to Products</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/furniture/products')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="bg-[var(--color-body)] text-2xl font-bold text-[var(--color-text-primary)]">
                {product.entity_name}
              </h1>
              <p className="text-[var(--color-text-secondary)]">{product.entity_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 hover:bg-[var(--color-hover)]">
              <Edit className="h-4 w-4" />
              Edit Product
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
                <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Image & Info */}
          <div className="space-y-6">
            {/* Product Image */}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]">
              <CardContent className="p-6">
                <div className="aspect-square bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-24 w-24 text-[var(--color-icon-secondary)]" />
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]">
              <CardHeader>
                <CardTitle className="text-lg">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Product Type</p>
                  <Badge variant="secondary" className="bg-[var(--color-body)] mt-1">
                    {product.entity_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Smart Code</p>
                  <p className="text-sm font-mono text-[var(--color-text-primary)] mt-1">
                    {product.smart_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Status</p>
                  <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/50">
                    {product.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Fields */}
            {dynamicData.length > 0 && (
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]">
                <CardHeader>
                  <CardTitle className="text-lg">Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dynamicData.map(field => (
                    <div key={field.id}>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {field.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-[var(--color-text-primary)] mt-1">
                        {field.field_value_text ||
                          field.field_value_number ||
                          field.field_value_json}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="bom" className="bg-[var(--color-body)] w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[var(--color-body)]/50">
                <TabsTrigger value="bom" className="data-[state=active]:bg-muted-foreground/10">
                  Bill of Materials
                </TabsTrigger>
                <TabsTrigger
                  value="suppliers"
                  className="data-[state=active]:bg-muted-foreground/10"
                >
                  Suppliers
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  className="data-[state=active]:bg-muted-foreground/10"
                >
                  Inventory
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bom" className="bg-[var(--color-body)] mt-6">
                <BOMExplorer productId={productId} organizationId={currentOrganization!.id} />
              </TabsContent>

              <TabsContent value="suppliers" className="bg-[var(--color-body)] mt-6">
                <SupplierRelationships
                  productId={productId}
                  organizationId={currentOrganization!.id}
                />
              </TabsContent>

              <TabsContent value="inventory" className="bg-[var(--color-body)] mt-6">
                <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]">
                  <CardHeader>
                    <CardTitle>Inventory Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-[var(--color-text-secondary)]">
                      <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p>Inventory tracking will be available soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
