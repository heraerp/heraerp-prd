'use client';

import { useState, useEffect } from 'react';
// import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'; // Not needed for demo
import { universalApi } from '@/lib/universal-api-v2';
import { Plus, Package, TrendingDown, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { UniversalInlineLoading } from '@/components/universal/ui/UniversalLoadingStates';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Hardcoded organization ID from the SQL setup
const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b';

interface InventoryItem {
  id: string;
  entity_name: string;
  entity_code: string;
  metadata?: any;
  dynamic_data?: Record<string, any>;
  status: string;
}

interface StockMovement {
  id: string;
  transaction_type: string;
  total_amount: number;
  transaction_date: string;
  metadata?: any;
}

interface InventoryStats {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export default function InventoryManagementPage() {
  // Demo mode - no auth needed
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isRecordingMovement, setIsRecordingMovement] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'hair_care',
    sku: '',
    current_stock: '',
    min_stock: '',
    unit_cost: '',
    unit_price: ''
  });
  const [movementForm, setMovementForm] = useState({
    item_id: '',
    movement_type: 'purchase',
    quantity: '',
    unit_cost: '',
    notes: ''
  });

  const organizationId = SALON_ORG_ID;

  useEffect(() => {
    if (!organizationId) return;
    loadInventory();
    loadMovements();
  }, [organizationId]);

  const loadInventory = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      universalApi.setOrganizationId(organizationId);
      
      // Load inventory entities
      const inventoryData = await universalApi.read('core_entities', {
        filter: `entity_type:inventory_item`
      });

      // Load dynamic data for each item
      const inventoryWithDetails = await Promise.all(
        inventoryData.map(async (item: any) => {
          const dynamicData = await universalApi.read('core_dynamic_data', {
            filter: `entity_id:${item.id}`
          });
          
          const dynamicDataMap = dynamicData.reduce((acc: any, dd: any) => {
            acc[dd.field_name] = dd.field_value_text || dd.field_value_number || dd.field_value_boolean;
            return acc;
          }, {});
          
          return { ...item, dynamic_data: dynamicDataMap };
        })
      );

      // Calculate stats
      let lowStock = 0;
      let outOfStock = 0;
      let totalValue = 0;

      inventoryWithDetails.forEach(item => {
        const currentStock = item.dynamic_data?.current_stock || 0;
        const minStock = item.dynamic_data?.min_stock || 10;
        const unitCost = item.dynamic_data?.unit_cost || 0;
        
        if (currentStock === 0) outOfStock++;
        else if (currentStock < minStock) lowStock++;
        
        totalValue += currentStock * unitCost;
      });

      setInventory(inventoryWithDetails);
      setStats({
        totalItems: inventoryWithDetails.length,
        lowStock,
        outOfStock,
        totalValue
      });
    } catch (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    if (!organizationId) return;
    
    try {
      universalApi.setOrganizationId(organizationId);
      
      // Load stock movement transactions
      const movementsData = await universalApi.read('universal_transactions', {
        filter: `transaction_type:stock_movement`
      });

      setMovements(movementsData.slice(0, 10)); // Last 10 movements
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  };

  const handleAddItem = async () => {
    if (!organizationId || !itemForm.name) return;

    try {
      setIsAddingItem(true);
      universalApi.setOrganizationId(organizationId);

      // Create inventory item entity
      const itemEntity = await universalApi.createEntity({
        entity_type: 'inventory_item',
        entity_name: itemForm.name,
        entity_code: itemForm.sku || `SKU-${Date.now()}`,
        smart_code: 'HERA.SALON.INVENTORY.ITEM.v1',
        metadata: { category: itemForm.category }
      });

      // Add dynamic fields
      const fields = [
        { field_name: 'category', value: itemForm.category },
        { field_name: 'sku', value: itemForm.sku },
        { field_name: 'current_stock', value: parseFloat(itemForm.current_stock) || 0 },
        { field_name: 'min_stock', value: parseFloat(itemForm.min_stock) || 10 },
        { field_name: 'unit_cost', value: parseFloat(itemForm.unit_cost) || 0 },
        { field_name: 'unit_price', value: parseFloat(itemForm.unit_price) || 0 }
      ];

      for (const field of fields) {
        if (field.value !== undefined) {
          await universalApi.setDynamicField(itemEntity.id, field.field_name, field.value);
        }
      }

      toast({
        title: 'Success',
        description: 'Inventory item added successfully'
      });

      // Reset form and reload
      setItemForm({
        name: '',
        category: 'hair_care',
        sku: '',
        current_stock: '',
        min_stock: '',
        unit_cost: '',
        unit_price: ''
      });
      loadInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add inventory item',
        variant: 'destructive'
      });
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleRecordMovement = async () => {
    if (!organizationId || !movementForm.item_id || !movementForm.quantity) return;

    try {
      setIsRecordingMovement(true);
      universalApi.setOrganizationId(organizationId);

      const quantity = parseFloat(movementForm.quantity);
      const unitCost = parseFloat(movementForm.unit_cost) || 0;
      const totalAmount = Math.abs(quantity * unitCost);

      // Create stock movement transaction
      const movement = await universalApi.createTransaction({
        transaction_type: 'stock_movement',
        smart_code: `HERA.SALON.INVENTORY.${movementForm.movement_type.toUpperCase()}.v1`,
        total_amount: totalAmount,
        from_entity_id: movementForm.item_id,
        metadata: {
          movement_type: movementForm.movement_type,
          quantity: movementForm.movement_type === 'usage' ? -quantity : quantity,
          unit_cost: unitCost,
          notes: movementForm.notes
        }
      });

      // Update current stock
      const item = inventory.find(i => i.id === movementForm.item_id);
      if (item) {
        const currentStock = item.dynamic_data?.current_stock || 0;
        const newStock = movementForm.movement_type === 'usage' 
          ? currentStock - quantity 
          : currentStock + quantity;
        
        await universalApi.setDynamicField(movementForm.item_id, 'current_stock', Math.max(0, newStock));
      }

      toast({
        title: 'Success',
        description: 'Stock movement recorded successfully'
      });

      // Reset form and reload
      setMovementForm({
        item_id: '',
        movement_type: 'purchase',
        quantity: '',
        unit_cost: '',
        notes: ''
      });
      loadInventory();
      loadMovements();
    } catch (error) {
      console.error('Error recording movement:', error);
      toast({
        title: 'Error',
        description: 'Failed to record stock movement',
        variant: 'destructive'
      });
    } finally {
      setIsRecordingMovement(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.dynamic_data?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.dynamic_data?.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Demo mode - no checks needed

  const getStockStatus = (current: number, min: number) => {
    if (current === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (current < min) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Inventory Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Track products and supplies</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Record Movement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Stock Movement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item">Item</Label>
                  <select
                    id="item"
                    className="w-full px-3 py-2 border rounded-md"
                    value={movementForm.item_id}
                    onChange={(e) => setMovementForm({ ...movementForm, item_id: e.target.value })}
                  >
                    <option value="">Select item...</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.entity_name} (Current: {item.dynamic_data?.current_stock || 0})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="movement_type">Movement Type</Label>
                  <select
                    id="movement_type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={movementForm.movement_type}
                    onChange={(e) => setMovementForm({ ...movementForm, movement_type: e.target.value })}
                  >
                    <option value="purchase">Purchase (In)</option>
                    <option value="usage">Usage (Out)</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={movementForm.quantity}
                      onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_cost">Unit Cost (AED)</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      value={movementForm.unit_cost}
                      onChange={(e) => setMovementForm({ ...movementForm, unit_cost: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={movementForm.notes}
                    onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                    placeholder="Optional notes..."
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleRecordMovement}
                  disabled={isRecordingMovement || !movementForm.item_id || !movementForm.quantity}
                >
                  {isRecordingMovement ? 'Recording...' : 'Record Movement'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g., Professional Hair Shampoo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      className="w-full px-3 py-2 border rounded-md"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    >
                      <option value="hair_care">Hair Care</option>
                      <option value="skin_care">Skin Care</option>
                      <option value="nail_care">Nail Care</option>
                      <option value="tools">Tools & Equipment</option>
                      <option value="consumables">Consumables</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={itemForm.sku}
                      onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={itemForm.current_stock}
                      onChange={(e) => setItemForm({ ...itemForm, current_stock: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min_stock">Minimum Stock</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={itemForm.min_stock}
                      onChange={(e) => setItemForm({ ...itemForm, min_stock: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unit_cost">Unit Cost (AED)</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      value={itemForm.unit_cost}
                      onChange={(e) => setItemForm({ ...itemForm, unit_cost: e.target.value })}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit_price">Selling Price (AED)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      value={itemForm.unit_price}
                      onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleAddItem}
                  disabled={isAddingItem || !itemForm.name}
                >
                  {isAddingItem ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">Items to reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AED {stats.totalValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Total value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          {loading ? (
            <UniversalInlineLoading text="Loading inventory data..." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const currentStock = item.dynamic_data?.current_stock || 0;
                      const minStock = item.dynamic_data?.min_stock || 10;
                      const unitCost = item.dynamic_data?.unit_cost || 0;
                      const stockStatus = getStockStatus(currentStock, minStock);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.entity_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.dynamic_data?.category || 'Uncategorized'}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.dynamic_data?.sku || item.entity_code}</TableCell>
                          <TableCell>
                            <span className={currentStock === 0 ? 'text-red-600 font-medium' : ''}>
                              {currentStock}
                            </span>
                          </TableCell>
                          <TableCell>{minStock}</TableCell>
                          <TableCell>AED {unitCost.toFixed(2)}</TableCell>
                          <TableCell>AED {(currentStock * unitCost).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.transaction_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {movement.metadata?.movement_type || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {inventory.find(i => i.id === movement.metadata?.item_id)?.entity_name || 'Unknown Item'}
                      </TableCell>
                      <TableCell>
                        <span className={movement.metadata?.quantity < 0 ? 'text-red-600' : 'text-green-600'}>
                          {movement.metadata?.quantity > 0 ? '+' : ''}{movement.metadata?.quantity || 0}
                        </span>
                      </TableCell>
                      <TableCell>AED {movement.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{movement.metadata?.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}