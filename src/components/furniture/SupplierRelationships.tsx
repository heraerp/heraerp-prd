'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Package, Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
}

export function SupplierRelationships({ organizationId, className }: SupplierRelationshipsProps) {
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
      const supplierEntities = entities?.filter((e: any) => 
        e.entity_type === 'supplier'
      ) || []

      // Build supplier info
      const supplierData: SupplierInfo[] = []

      for (const supplier of supplierEntities) {
        // Find all products this supplier sources
        const supplierRels = relationships?.filter((r: any) => 
          r.from_entity_id === supplier.id && r.relationship_type === 'sources'
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
    if (!rating) return 'text-gray-400'
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
      <div className={cn("grid gap-6", className)}>
        <Card className="bg-gray-800/50 border-gray-700">
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
      <Card className={cn("bg-gray-800/50 border-gray-700", className)}>
        <CardHeader>
          <CardTitle>Supplier Relationships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-400">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedSupplierData = suppliers.find(s => s.id === selectedSupplier)

  return (
    <div className={cn("grid gap-6", className)}>
      {/* Supplier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map(supplier => (
          <Card
            key={supplier.id}
            className={cn(
              "bg-gray-800/50 border-gray-700 cursor-pointer transition-all hover:scale-[1.02]",
              selectedSupplier === supplier.id && "ring-2 ring-amber-500"
            )}
            onClick={() => setSelectedSupplier(supplier.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  <div>
                    <h4 className="font-medium text-white">{supplier.name}</h4>
                    <p className="text-xs text-gray-400">{supplier.code}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {supplier.paymentTerms}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Products</p>
                  <p className="font-semibold text-white">{supplier.totalProducts}</p>
                </div>
                <div>
                  <p className="text-gray-400">Avg Lead Time</p>
                  <p className={cn("font-semibold", getLeadTimeColor(supplier.avgLeadTime))}>
                    {supplier.avgLeadTime} days
                  </p>
                </div>
              </div>

              {supplier.products[0]?.qualityRating && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Quality Rating</span>
                    <span className={cn("font-semibold", getQualityColor(supplier.products[0].qualityRating))}>
                      {supplier.products[0].qualityRating}/5
                    </span>
                  </div>
                  <Progress 
                    value={supplier.products[0].qualityRating * 20} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Supplier Details */}
      {selectedSupplierData && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Products from {selectedSupplierData.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-400">Product</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Lead Time</TableHead>
                    <TableHead className="text-gray-400">Unit Price</TableHead>
                    <TableHead className="text-gray-400">Min Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSupplierData.products.map(product => (
                    <TableRow key={product.id} className="border-gray-700">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {product.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className={getLeadTimeColor(product.leadTime)}>
                            {product.leadTime} days
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>₹{product.unitPrice.toLocaleString()}/{product.priceUnit}</span>
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
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Supplier Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Total Products Sourced</p>
                  <p className="text-xl font-semibold text-white">
                    {selectedSupplierData.totalProducts}
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Average Lead Time</p>
                  <p className="text-xl font-semibold text-white">
                    {selectedSupplierData.avgLeadTime} days
                  </p>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <p className="text-gray-400 mb-1">Payment Terms</p>
                  <p className="text-xl font-semibold text-white">
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