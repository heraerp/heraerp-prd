/**
 * Stock Movements Page
 * Manage inventory stock levels and track movements
 */

'use client'

import React, { useState, useEffect } from 'react'
import { UniversalTable } from '@/components/universal/UniversalTable'
import { Button } from '@/components/ui/button'
import { Plus, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { universalApi } from '@/lib/universal-api'
import { StockMovementModal } from '@/components/salon/inventory/StockMovementModal'
import { Badge } from '@/components/ui/badge'
import { CurrencyDisplay } from '@/components/ui/currency-input'

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

  const columns = [
    {
      key: 'transaction_date',
      header: 'Date',
      render: (item: any) => new Date(item.transaction_date).toLocaleDateString()
    },
    {
      key: 'product',
      header: 'Product',
      render: (item: any) => {
        const product = products.find(p => p.id === item.reference_entity_id)
        return (
          <div>
            <p className="font-medium">{product?.entity_name || 'Unknown Product'}</p>
            <p className="text-sm text-muted-foreground">{product?.sku || 'No SKU'}</p>
          </div>
        )
      }
    },
    {
      key: 'movement_type',
      header: 'Type',
      render: (item: any) => {
        const type = item.metadata?.movement_type || 'unknown'
        return (
          <div className="flex items-center gap-2">
            {getMovementIcon(type)}
            {getMovementBadge(type)}
          </div>
        )
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (item: any) => {
        const quantity = item.metadata?.quantity || 0
        const type = item.metadata?.movement_type || 'unknown'
        const colorClass = type === 'in' ? 'text-green-600' : type === 'out' ? 'text-red-600' : ''
        return (
          <span className={`font-medium ${colorClass}`}>
            {type === 'in' ? '+' : type === 'out' ? '-' : ''}{quantity}
          </span>
        )
      }
    },
    {
      key: 'value',
      header: 'Value',
      render: (item: any) => <CurrencyDisplay value={item.total_amount || 0} />
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item: any) => item.metadata?.reason || '-'
    },
    {
      key: 'transaction_code',
      header: 'Reference',
      render: (item: any) => (
        <code className="text-xs font-mono">{item.transaction_code}</code>
      )
    }
  ]

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

      <UniversalTable
        data={movements}
        columns={columns}
        searchKeys={['transaction_code', 'metadata.reason']}
        actions={[
          {
            label: 'Add Stock Movement',
            onClick: handleCreateMovement,
            icon: <Plus className="w-4 h-4" />,
            variant: 'default' as const
          }
        ]}
        onEdit={handleEditMovement}
        emptyState={{
          icon: <Package className="w-12 h-12" />,
          title: 'No stock movements',
          description: 'Start by adding your first stock movement',
          action: {
            label: 'Add Stock Movement',
            onClick: handleCreateMovement
          }
        }}
      />

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