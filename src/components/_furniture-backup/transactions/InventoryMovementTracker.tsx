'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Package, 
  ArrowRight, 
  Warehouse, 
  TruckIcon, 
  AlertCircle, 
  CheckCircle, 
  Plus, 
  Minus, 
  History, 
  BarChart 
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'

interface InventoryLevel {
  item_id: string
  item_name: string
  item_code: string
  location_id: string
  location_name: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  last_updated: string
}

interface MovementHistory {
  id: string
  transaction_code: string
  movement_type: string
  from_location: string
  to_location: string
  item_name: string
  quantity: number
  reason: string
  created_at: string
}

interface InventoryMovementTrackerProps {
  organizationId: string
}

export default function InventoryMovementTracker({ organizationId }: InventoryMovementTrackerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([])
  const [movementHistory, setMovementHistory] = useState<MovementHistory[]>([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  // Movement form state
  const [movementForm, setMovementForm] = useState({
    item_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: 0,
    movement_type: 'transfer',
    reason: ''
  })

  useEffect(() => {
    if (organizationId) {
      loadData()
    }
  }, [organizationId])

  useEffect(() => {
    if (selectedLocation && items.length > 0) {
      loadInventoryLevels(selectedLocation)
    }
  }, [selectedLocation, items])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      universalApi.setOrganizationId(organizationId)

      // Load locations
      const locationsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'warehouse_location' }
      })
      setLocations(locationsData.data || [])

      // Load items (products and materials)
      const productsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'product' }
      })

      const materialsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_material' }
      })

      setItems([...(productsData.data || []), ...(materialsData.data || [])])

      // Load movement history
      await loadMovementHistory()
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadInventoryLevels = async (locationId: string) => {
    try {
      const levels: InventoryLevel[] = []

      // For each item, get its inventory level at this location
      for (const item of items) {
        const inventoryData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: {
            entity_id: item.id,
            field_name: `inventory_${locationId}`
          }
        })

        const quantity = inventoryData.data?.[0]?.field_value_number || 0

        // Get reserved quantity (for orders)
        const reservedData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: {
            entity_id: item.id,
            field_name: `reserved_${locationId}`
          }
        })

        const reservedQuantity = reservedData.data?.[0]?.field_value_number || 0

        if (quantity > 0 || reservedQuantity > 0) {
          levels.push({
            item_id: item.id,
            item_name: item.entity_name,
            item_code: item.entity_code,
            location_id: locationId,
            location_name: locations.find(l => l.id === locationId)?.entity_name || 'Unknown',
            quantity: quantity,
            reserved_quantity: reservedQuantity,
            available_quantity: quantity - reservedQuantity,
            last_updated: inventoryData.data?.[0]?.updated_at || new Date().toISOString()
          })
        }
      }

      setInventoryLevels(levels)
    } catch (err) {
      console.error('Error loading inventory levels:', err)
      setError('Failed to load inventory levels')
    }
  }

  const loadMovementHistory = async () => {
    try {
      const historyData = await universalApi.read({
        table: 'core_transactions',
        filter: { transaction_type: 'inventory_movement' },
        limit: 50,
        orderBy: 'created_at DESC'
      })

      const movements: MovementHistory[] = (historyData.data || []).map((transaction: any) => ({
        id: transaction.id,
        transaction_code: transaction.transaction_code,
        movement_type: transaction.metadata?.movement_type || 'transfer',
        from_location: transaction.metadata?.from_location_name || 'Unknown',
        to_location: transaction.metadata?.to_location_name || 'Unknown',
        item_name: transaction.description || 'Unknown Item',
        quantity: transaction.total_amount || 0,
        reason: transaction.metadata?.reason || '',
        created_at: transaction.created_at
      }))

      setMovementHistory(movements)
    } catch (err) {
      console.error('Error loading movement history:', err)
    }
  }

  const handleMovement = async () => {
    if (!movementForm.item_id || !movementForm.quantity) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const item = items.find(i => i.id === movementForm.item_id)

      const transactionData = {
        organization_id: organizationId,
        transaction_type: 'inventory_movement',
        transaction_code: `INV-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: movementForm.from_location_id || null,
        target_entity_id: movementForm.to_location_id || null,
        total_amount: movementForm.quantity,
        description: `${movementForm.movement_type} - ${item?.entity_name}`,
        smart_code: 'HERA.FURNITURE.INV.MOVEMENT.V1',
        metadata: {
          movement_type: movementForm.movement_type,
          from_location_name: locations.find(l => l.id === movementForm.from_location_id)?.entity_name,
          to_location_name: locations.find(l => l.id === movementForm.to_location_id)?.entity_name,
          reason: movementForm.reason,
          item_id: movementForm.item_id,
          item_name: item?.entity_name
        }
      }

      const result = await universalApi.create({
        table: 'core_transactions',
        data: transactionData
      })

      if (result.success) {
        // Update inventory levels
        await updateInventoryLevels()
        await loadMovementHistory()
        if (selectedLocation) {
          await loadInventoryLevels(selectedLocation)
        }

        // Reset form
        setMovementForm({
          item_id: '',
          from_location_id: '',
          to_location_id: '',
          quantity: 0,
          movement_type: 'transfer',
          reason: ''
        })

        setError('')
      } else {
        throw new Error(result.error || 'Failed to record movement')
      }
    } catch (err) {
      console.error('Error recording movement:', err)
      setError('Failed to record inventory movement')
    } finally {
      setLoading(false)
    }
  }

  const updateInventoryLevels = async () => {
    const { item_id, from_location_id, to_location_id, quantity, movement_type } = movementForm

    try {
      if (movement_type === 'transfer' && from_location_id && to_location_id) {
        // Decrease from source location
        await updateLocationInventory(item_id, from_location_id, -quantity)
        // Increase at target location
        await updateLocationInventory(item_id, to_location_id, quantity)
      } else if (movement_type === 'in' && to_location_id) {
        // Increase at target location
        await updateLocationInventory(item_id, to_location_id, quantity)
      } else if (movement_type === 'out' && from_location_id) {
        // Decrease from source location
        await updateLocationInventory(item_id, from_location_id, -quantity)
      }
    } catch (err) {
      console.error('Error updating inventory levels:', err)
    }
  }

  const updateLocationInventory = async (itemId: string, locationId: string, quantityChange: number) => {
    try {
      // Get current inventory level
      const currentData = await universalApi.read({
        table: 'core_dynamic_data',
        filter: {
          entity_id: itemId,
          field_name: `inventory_${locationId}`
        }
      })

      const currentQuantity = currentData.data?.[0]?.field_value_number || 0
      const newQuantity = Math.max(0, currentQuantity + quantityChange)

      // Update or create inventory record
      await universalApi.setDynamicField(
        itemId,
        `inventory_${locationId}`,
        newQuantity,
        `HERA.FURNITURE.INV.LEVEL.${locationId.toUpperCase()}.V1`
      )
    } catch (err) {
      console.error('Error updating location inventory:', err)
    }
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'bg-green-100 text-green-800'
      case 'out': return 'bg-red-100 text-red-800'
      case 'transfer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockLevelColor = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0
    if (percentage < 20) return 'text-red-600'
    if (percentage < 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading inventory data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Inventory Movement Tracker
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage inventory movements across locations
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="movement">Record Movement</TabsTrigger>
          <TabsTrigger value="history">Movement History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5" />
                Inventory Levels by Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location-select">Select Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a location to view inventory" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLocation && (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Total Qty</TableHead>
                          <TableHead>Reserved</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryLevels.map((level) => (
                          <TableRow key={level.item_id}>
                            <TableCell className="font-medium">{level.item_name}</TableCell>
                            <TableCell>{level.item_code}</TableCell>
                            <TableCell>{level.quantity}</TableCell>
                            <TableCell>{level.reserved_quantity}</TableCell>
                            <TableCell className={getStockLevelColor(level.available_quantity, level.quantity)}>
                              {level.available_quantity}
                            </TableCell>
                            <TableCell>
                              <Badge variant={level.available_quantity > 0 ? 'default' : 'destructive'}>
                                {level.available_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {inventoryLevels.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No inventory items found at this location
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TruckIcon className="h-5 w-5" />
                Record Inventory Movement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="movement-type">Movement Type</Label>
                  <Select
                    value={movementForm.movement_type}
                    onValueChange={(value) => setMovementForm({ ...movementForm, movement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stock In</SelectItem>
                      <SelectItem value="out">Stock Out</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="item">Item</Label>
                  <Select
                    value={movementForm.item_id}
                    onValueChange={(value) => setMovementForm({ ...movementForm, item_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.entity_name} ({item.entity_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(movementForm.movement_type === 'out' || movementForm.movement_type === 'transfer') && (
                  <div>
                    <Label htmlFor="from-location">From Location</Label>
                    <Select
                      value={movementForm.from_location_id}
                      onValueChange={(value) => setMovementForm({ ...movementForm, from_location_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(movementForm.movement_type === 'in' || movementForm.movement_type === 'transfer') && (
                  <div>
                    <Label htmlFor="to-location">To Location</Label>
                    <Select
                      value={movementForm.to_location_id}
                      onValueChange={(value) => setMovementForm({ ...movementForm, to_location_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    value={movementForm.reason}
                    onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                    placeholder="Reason for movement (optional)"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleMovement} disabled={loading}>
                  {loading ? 'Processing...' : 'Record Movement'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Movement History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementHistory.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">{movement.transaction_code}</TableCell>
                      <TableCell>
                        <Badge className={getMovementTypeColor(movement.movement_type)}>
                          {movement.movement_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.item_name}</TableCell>
                      <TableCell>{movement.from_location || '-'}</TableCell>
                      <TableCell>{movement.to_location || '-'}</TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{new Date(movement.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {movementHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No movement history found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}