'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { universalApi } from '@/lib/universal-api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/date-utils'
;

interface InventoryLevel {
  item_id: string;
  item_name: string;
  item_code: string;
  location_id: string;
  location_name: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  last_updated: string;
}

interface MovementHistory {
  id: string;
  transaction_code: string;
  movement_type: string;
  from_location: string;
  to_location: string;
  item_name: string;
  quantity: number;
  reason: string;
  created_at: string;
  status: string;
}

export function InventoryMovementTracker() {
  const [locations, setLocations] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [movementHistory, setMovementHistory] = useState<MovementHistory[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New Movement Form State
  const [movementForm, setMovementForm] = useState({
    movementType: 'transfer',
    fromLocation: '',
    toLocation: '',
    itemId: '',
    quantity: 1,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadInventoryLevels(selectedLocation);
    }
  }, [selectedLocation]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load warehouse locations
      const locationsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'warehouse' }
      });
      setLocations(locationsData.data || []);
      
      // Load items (products and materials)
      const productsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_product' }
      });
      
      const materialsData = await universalApi.read({
        table: 'core_entities',
        filter: { entity_type: 'furniture_material' }
      });
      
      setItems([...(productsData.data || []), ...(materialsData.data || [])]);
      
      // Load movement history
      await loadMovementHistory();
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryLevels = async (locationId: string) => {
    try {
      const levels: InventoryLevel[] = [];
      
      // For each item, get its inventory level at this location
      for (const item of items) {
        const inventoryData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: {
            entity_id: item.id,
            field_name: `inventory_${locationId}`
          }
        });
        
        const quantity = inventoryData.data?.[0]?.field_value_number || 0;
        
        // Get reserved quantity (for orders)
        const reservedData = await universalApi.read({
          table: 'core_dynamic_data',
          filter: {
            entity_id: item.id,
            field_name: `reserved_${locationId}`
          }
        });
        
        const reservedQuantity = reservedData.data?.[0]?.field_value_number || 0;
        
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
          });
        }
      }
      
      setInventoryLevels(levels);
    } catch (err) {
      console.error('Error loading inventory levels:', err);
    }
  };

  const loadMovementHistory = async () => {
    try {
      const movementsData = await universalApi.read({
        table: 'universal_transactions',
        filter: { transaction_type: 'inventory_movement' }
      });
      
      const history: MovementHistory[] = [];
      
      for (const movement of movementsData.data || []) {
        // Get location names
        const fromLocation = movement.from_entity_id ? 
          locations.find(l => l.id === movement.from_entity_id)?.entity_name : 'External';
        const toLocation = movement.to_entity_id ? 
          locations.find(l => l.id === movement.to_entity_id)?.entity_name : 'External';
        
        // Get line items
        const linesData = await universalApi.read({
          table: 'universal_transaction_lines',
          filter: { transaction_id: movement.id }
        });
        
        for (const line of linesData.data || []) {
          const item = items.find(i => i.id === line.line_entity_id);
          
          history.push({
            id: movement.id,
            transaction_code: movement.transaction_code,
            movement_type: movement.metadata?.movement_type || 'transfer',
            from_location: fromLocation || '',
            to_location: toLocation || '',
            item_name: item?.entity_name || 'Unknown Item',
            quantity: line.quantity,
            reason: movement.metadata?.reason || '',
            created_at: movement.created_at,
            status: movement.metadata?.status || 'completed'
          });
        }
      }
      
      setMovementHistory(history.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      console.error('Error loading movement history:', err);
    }
  };

  const handleCreateMovement = async () => {
    setError('');
    
    // Validate form
    if (!movementForm.itemId || !movementForm.quantity || !movementForm.reason) {
      setError('Please fill in all required fields');
      return;
    }
    
    if (movementForm.movementType === 'transfer' && (!movementForm.fromLocation || !movementForm.toLocation)) {
      setError('Please select both source and destination locations for transfer');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create inventory movement transaction
      const transaction = await universalApi.createTransaction({
        transaction_type: 'inventory_movement',
        transaction_code: `IM-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        from_entity_id: movementForm.fromLocation || null,
        to_entity_id: movementForm.toLocation || null,
        smart_code: 'HERA.IND.FURN.TXN.INVENTORYMOVE.V1',
        metadata: {
          movement_type: movementForm.movementType,
          reason: movementForm.reason,
          status: 'completed'
        },
        line_items: [{
          line_number: 1,
          entity_id: movementForm.itemId,
          quantity: movementForm.quantity,
          smart_code: 'HERA.IND.FURN.TXN.INVENTORYMOVE.LINE.V1',
          metadata: {
            item_name: items.find(i => i.id === movementForm.itemId)?.entity_name,
            movement_reason: movementForm.reason
          }
        }]
      });
      
      // Reset form
      setMovementForm({
        movementType: 'transfer',
        fromLocation: '',
        toLocation: '',
        itemId: '',
        quantity: 1,
        reason: ''
      });
      
      // Reload data
      await loadMovementHistory();
      if (selectedLocation) {
        await loadInventoryLevels(selectedLocation);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to create inventory movement');
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'receipt':
        return <Badge variant="success">Receipt</Badge>;
      case 'issue':
        return <Badge variant="secondary">Issue</Badge>;
      case 'transfer':
        return <Badge variant="outline">Transfer</Badge>;
      case 'adjustment':
        return <Badge variant="default">Adjustment</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStockLevelIndicator = (available: number, total: number) => {
    const percentage = total > 0 ? (available / total) * 100 : 0;
    
    if (percentage > 50) {
      return { color: 'bg-green-500', status: 'Healthy' };
    } else if (percentage > 20) {
      return { color: 'bg-yellow-500', status: 'Low' };
    } else {
      return { color: 'bg-red-500', status: 'Critical' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Warehouse className="w-4 h-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active warehouses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryLevels.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Stocked items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TruckIcon className="w-4 h-4" />
              Movements Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {movementHistory.filter(m => 
                formatDate(new Date(m.created_at), 'PP') === formatDate(new Date(), 'PP')
              ).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Inventory transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED 425K</div>
            <p className="text-xs text-muted-foreground mt-1">Total inventory value</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="current">Current Stock</TabsTrigger>
              <TabsTrigger value="movements">Movement History</TabsTrigger>
              <TabsTrigger value="new">New Movement</TabsTrigger>
            </TabsList>
            
            {/* Current Stock Tab */}
            <TabsContent value="current" className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Select Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a warehouse location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedLocation && inventoryLevels.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Total Quantity</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryLevels.map(level => {
                      const stockIndicator = getStockLevelIndicator(level.available_quantity, level.quantity);
                      return (
                        <TableRow key={`${level.item_id}-${level.location_id}`}>
                          <TableCell className="font-mono text-sm">
                            {level.item_code}
                          </TableCell>
                          <TableCell>{level.item_name}</TableCell>
                          <TableCell className="font-medium">{level.quantity}</TableCell>
                          <TableCell>{level.reserved_quantity}</TableCell>
                          <TableCell>
                            <span className="font-medium">{level.available_quantity}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${stockIndicator.color}`}
                                  style={{ width: `${(level.available_quantity / level.quantity) * 100}%` }}
                                />
                              </div>
                              <Badge variant={
                                stockIndicator.status === 'Healthy' ? 'success' :
                                stockIndicator.status === 'Low' ? 'secondary' : 'destructive'
                              }>
                                {stockIndicator.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(new Date(level.last_updated), 'PP')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : selectedLocation ? (
                <div className="text-center py-8 text-muted-foreground">
                  No inventory found at this location
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a location to view inventory levels
                </div>
              )}
            </TabsContent>
            
            {/* Movement History Tab */}
            <TabsContent value="movements">
              {movementHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movementHistory.map(movement => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-mono text-sm">
                          {movement.transaction_code}
                        </TableCell>
                        <TableCell>
                          {getMovementTypeBadge(movement.movement_type)}
                        </TableCell>
                        <TableCell>{movement.item_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {movement.movement_type === 'receipt' && (
                              <Plus className="w-3 h-3 text-green-600" />
                            )}
                            {movement.movement_type === 'issue' && (
                              <Minus className="w-3 h-3 text-red-600" />
                            )}
                            {movement.movement_type === 'transfer' && (
                              <ArrowRight className="w-3 h-3 text-blue-600" />
                            )}
                            <span className="font-medium">{movement.quantity}</span>
                          </div>
                        </TableCell>
                        <TableCell>{movement.from_location || '-'}</TableCell>
                        <TableCell>{movement.to_location || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {movement.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(new Date(movement.created_at), 'PP')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  No movement history found
                </div>
              )}
            </TabsContent>
            
            {/* New Movement Tab */}
            <TabsContent value="new">
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Movement Type</Label>
                    <Select 
                      value={movementForm.movementType} 
                      onValueChange={(value) => setMovementForm({...movementForm, movementType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receipt">Receipt (Inbound)</SelectItem>
                        <SelectItem value="issue">Issue (Outbound)</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Item</Label>
                    <Select 
                      value={movementForm.itemId} 
                      onValueChange={(value) => setMovementForm({...movementForm, itemId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map(item => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.entity_name} ({item.entity_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(movementForm.movementType === 'issue' || movementForm.movementType === 'transfer') && (
                    <div className="space-y-2">
                      <Label>From Location</Label>
                      <Select 
                        value={movementForm.fromLocation} 
                        onValueChange={(value) => setMovementForm({...movementForm, fromLocation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.entity_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {(movementForm.movementType === 'receipt' || movementForm.movementType === 'transfer') && (
                    <div className="space-y-2">
                      <Label>To Location</Label>
                      <Select 
                        value={movementForm.toLocation} 
                        onValueChange={(value) => setMovementForm({...movementForm, toLocation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.entity_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={movementForm.quantity}
                      onChange={(e) => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label>Reason / Notes</Label>
                    <Input
                      value={movementForm.reason}
                      onChange={(e) => setMovementForm({...movementForm, reason: e.target.value})}
                      placeholder="Enter reason for this movement..."
                    />
                  </div>
                </div>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMovementForm({
                    movementType: 'transfer',
                    fromLocation: '',
                    toLocation: '',
                    itemId: '',
                    quantity: 1,
                    reason: ''
                  })}>
                    Reset
                  </Button>
                  <Button onClick={handleCreateMovement} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Movement'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}