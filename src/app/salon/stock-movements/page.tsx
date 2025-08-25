/**
 * Stock Movements Page
 * Manage inventory stock levels and track movements
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Package, TrendingUp, TrendingDown, RefreshCw, Search, Edit } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { universalApi } from '@/lib/universal-api'
import { StockMovementModal } from '@/components/salon/inventory/StockMovementModal'
import { Badge } from '@/components/ui/badge'
import { CurrencyDisplay } from '@/components/ui/currency-input'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function StockMovementsPage() {
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMovement, setSelectedMovement] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchData()
    }
  }, [organizationId, contextLoading])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch products for the modal
      const productsResponse = await fetch(`/api/v1/salon/products?organization_id=${organizationId}`)
      const productsData = await productsResponse.json()
      setProducts(productsData.products || [])
      
      // Fetch stock movements (using transactions)
      const { data: movementData } = await universalApi.queryUniversal({
        table: 'universal_transactions',
        filters: {
          transaction_type: 'stock_movement'
        }
      })
      
      setMovements(movementData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load stock movements',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMovement = () => {
    setSelectedMovement(null)
    setIsModalOpen(true)
  }

  const handleEditMovement = (movement: any) => {
    setSelectedMovement(movement)
    setIsModalOpen(true)
  }

  const handleSaveMovement = async (data: any) => {
    try {
      if (selectedMovement) {
        // Update existing movement
        await universalApi.updateTransaction(selectedMovement.id, data)
        toast({
          title: 'Success',
          description: 'Stock movement updated successfully'
        })
      } else {
        // Create new stock movement transaction
        const movement = {
          transaction_type: 'stock_movement',
          transaction_code: `STOCK-${Date.now()}`,
          transaction_date: new Date().toISOString(),
          reference_entity_id: data.productId,
          total_amount: data.quantity * (data.unitCost || 0),
          smart_code: data.movementType === 'in' 
            ? 'HERA.INV.STOCK.IN.v1' 
            : data.movementType === 'out' 
            ? 'HERA.INV.STOCK.OUT.v1'
            : 'HERA.INV.STOCK.ADJ.v1',
          metadata: {
            movement_type: data.movementType,
            quantity: data.quantity,
            unit_cost: data.unitCost || 0,
            reason: data.reason,
            notes: data.notes,
            location: data.location
          }
        }
        
        await universalApi.createTransaction(movement)
        
        toast({
          title: 'Success',
          description: 'Stock movement created successfully'
        })
      }
      
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving movement:', error)
      toast({
        title: 'Error',
        description: 'Failed to save stock movement',
        variant: 'destructive'
      })
    }
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="w-4 h-4" />
      case 'out':
        return <TrendingDown className="w-4 h-4" />
      case 'adjustment':
        return <RefreshCw className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <Badge className="bg-green-100 text-green-800">Stock In</Badge>
      case 'out':
        return <Badge className="bg-red-100 text-red-800">Stock Out</Badge>
      case 'adjustment':
        return <Badge className="bg-blue-100 text-blue-800">Adjustment</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  // Filter movements based on search term
  const filteredMovements = movements.filter(movement => {
    const product = products.find(p => p.id === movement.reference_entity_id)
    const searchLower = searchTerm.toLowerCase()
    return (
      movement.transaction_code?.toLowerCase().includes(searchLower) ||
      movement.metadata?.reason?.toLowerCase().includes(searchLower) ||
      product?.entity_name?.toLowerCase().includes(searchLower) ||
      product?.sku?.toLowerCase().includes(searchLower)
    )
  })

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading stock movements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage inventory stock levels
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stock Movements</CardTitle>
              <CardDescription>
                {filteredMovements.length} movement{filteredMovements.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button onClick={handleCreateMovement}>
              <Plus className="w-4 h-4 mr-2" />
              Add Stock Movement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, SKU, reference, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No stock movements found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first stock movement'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateMovement}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock Movement
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => {
                    const product = products.find(p => p.id === movement.reference_entity_id)
                    const type = movement.metadata?.movement_type || 'unknown'
                    const quantity = movement.metadata?.quantity || 0
                    const typeColorClass = type === 'in' ? 'text-green-600' : type === 'out' ? 'text-red-600' : ''

                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.transaction_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product?.entity_name || 'Unknown Product'}</p>
                            <p className="text-sm text-muted-foreground">{product?.sku || 'No SKU'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMovementIcon(type)}
                            {getMovementBadge(type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${typeColorClass}`}>
                            {type === 'in' ? '+' : type === 'out' ? '-' : ''}{quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CurrencyDisplay value={movement.total_amount || 0} />
                        </TableCell>
                        <TableCell>
                          {movement.metadata?.reason || '-'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono">{movement.transaction_code}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMovement(movement)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StockMovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMovement}
        products={products}
        movement={selectedMovement}
      />
    </div>
  )
}