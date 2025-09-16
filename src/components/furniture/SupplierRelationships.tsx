'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Package, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { universalApi } from '@/src/lib/universal-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Badge } from '@/src/components/ui/badge'
import { Progress } from '@/src/components/ui/progress'
import { Skeleton } from '@/src/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'

interface SupplierInfo {
  id: string
  name: string
  code: string
  products: Array<{
    id: string
    name: string
    code: string
    type: string
    leadTime: number
    unitPrice: number
    priceUnit: string
    minOrderQty: number
    qualityRating?: number
  }>
  totalProducts: number
  avgLeadTime: number
  totalSpend?: number
  paymentTerms?: string
}

interface SupplierRelationshipsProps {
  organizationId: string
  className?: string
  productId?: string
}

export function SupplierRelationships({ organizationId, className, productId }: SupplierRelationshipsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)

  useEffect(() => {
    loadSupplierData()
  }, [organizationId])

  const loadSupplierData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all entities
      const { data: entities } = await universalApi.read({ 
        table: 'core_entities', 
        organizationId 
      })
      
      // Get all relationships
      const { data: relationships } = await universalApi.read({ 
        table: 'core_relationships', 
        organizationId 
      })
      
      // Filter suppliers
      const supplierEntities = entities?.filter((e: any) => e.entity_type === 'supplier') || []
      
      // Build supplier info
      const supplierData: SupplierInfo[] = []
      
      for (const supplier of supplierEntities) {
        // Find all products this supplier sources
        const supplierRels = relationships?.filter(
          (r: any) => r.from_entity_id === supplier.id && r.relationship_type === 'sources'
        ) || []
        
        const products = []
        let totalLeadTime = 0
        
        for (const rel of supplierRels) {
          const product = entities?.find((e: any) => e.id === rel.to_entity_id)
          if (product) {
            const leadTime = rel.relationship_data?.lead_time_days || 0
            totalLeadTime += leadTime
            products.push({
              id: product.id,
              name: product.entity_name,
              code: product.entity_code,
              type: product.entity_type,
              leadTime,
              unitPrice: rel.relationship_data?.unit_price || 0,
              priceUnit: rel.relationship_data?.price_unit || 'EA',
              minOrderQty: rel.relationship_data?.minimum_order_quantity || 1,
              qualityRating: (supplier.metadata as any)?.quality_rating
            })
          }
        }

        if (products.length > 0) {
          supplierData.push({
            id: supplier.id,
            name: supplier.entity_name,
            code: supplier.entity_code,
            products,
            totalProducts: products.length,
            avgLeadTime: Math.round(totalLeadTime / products.length),
            paymentTerms: (supplier.metadata as any)?.payment_terms || 'NET30'
          })
        }
      }

      setSuppliers(supplierData)
      if (supplierData.length > 0 && !selectedSupplier) {
        setSelectedSupplier(supplierData[0].id)
      }
    } catch (err) {
      console.error('Error loading supplier data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load supplier data')
    } finally {
      setLoading(false)
    }
  }

  const getQualityColor = (rating?: number) => {
    if (!rating) return 'text-[var(--color-text-secondary)]'
    if (rating >= 4.5) return 'text-green-500'
    if (rating >= 3.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getLeadTimeColor = (days: number) => {
    if (days <= 7) return 'text-green-500'
    if (days <= 14) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return (
      <div className={cn('grid gap-6', className)}>
        <Card className="bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <CardHeader>
            <CardTitle>Supplier Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className={cn('bg-[var(--color-body)]/50 border-[var(--color-border)]', className)}>
        <CardHeader>
          <CardTitle>Supplier Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-[var(--color-text-secondary)]">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier)

  return (
    <div className={cn('grid gap-6', className)}>
      {/* Supplier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => (
          <Card
            key={supplier.id}
            className={cn(
              'bg-[var(--color-body)]/50 border-[var(--color-border)] cursor-pointer transition-all hover:scale-[1.02]',
              selectedSupplier === supplier.id && 'ring-2 ring-amber-500'
            )}
            onClick={() => setSelectedSupplier(supplier.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#37353E]" />
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)]">{supplier.name}</h4>
                    <p className="text-xs text-[var(--color-text-secondary)]">{supplier.code}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {supplier.paymentTerms}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--color-text-secondary)]">Products</p>
                  <p className="font-semibold text-[var(--color-text-primary)]">{supplier.totalProducts}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-secondary)]">Avg Lead Time</p>
                  <p className={cn('font-semibold', getLeadTimeColor(supplier.avgLeadTime))}>
                    {supplier.avgLeadTime} days
                  </p>
                </div>
              </div>
              {supplier.products[0]?.qualityRating && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--color-text-secondary)]">Quality Rating</span>
                    <span className={cn(
                      'font-semibold',
                      getQualityColor(supplier.products[0].qualityRating)
                    )}>
                      {supplier.products[0].qualityRating}/5
                    </span>
                  </div>
                  <Progress value={supplier.products[0].qualityRating * 20} className="h-2 bg-muted-foreground/10" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier Details */}
      {selectedSupplierData && (
        <Card className="bg-[var(--color-body)]/50 border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products from {selectedSupplierData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto furniture-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-[var(--color-border)]">
                    <TableHead className="text-[var(--color-text-secondary)]">Product</TableHead>
                    <TableHead className="text-[var(--color-text-secondary)]">Type</TableHead>
                    <TableHead className="text-[var(--color-text-secondary)]">Lead Time</TableHead>
                    <TableHead className="text-[var(--color-text-secondary)]">Unit Price</TableHead>
                    <TableHead className="text-[var(--color-text-secondary)]">Min Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSupplierData.products.map(product => (
                    <TableRow key={product.id} className="border-[var(--color-border)]">
                      <TableCell>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">{product.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{product.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-[#37353E]" />
                          <span className={getLeadTimeColor(product.leadTime)}>
                            {product.leadTime} days
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-[#37353E]" />
                          <span>
                            ₹{product.unitPrice.toLocaleString()}/{product.priceUnit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.minOrderQty} {product.priceUnit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Supplier Insights */}
            <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
              <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Supplier Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-[var(--color-body)]/50 rounded-lg p-3">
                  <p className="text-[var(--color-text-secondary)] mb-1">Total Products Sourced</p>
                  <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {selectedSupplierData.totalProducts}
                  </p>
                </div>
                <div className="bg-[var(--color-body)]/50 rounded-lg p-3">
                  <p className="text-[var(--color-text-secondary)] mb-1">Average Lead Time</p>
                  <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {selectedSupplierData.avgLeadTime} days
                  </p>
                </div>
                <div className="bg-[var(--color-body)]/50 rounded-lg p-3">
                  <p className="text-[var(--color-text-secondary)] mb-1">Payment Terms</p>
                  <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                    {selectedSupplierData.paymentTerms}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}