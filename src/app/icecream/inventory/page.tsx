'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useDemoOrg } from '@/components/providers/DemoOrgProvider'
// TODO: Re-enable once React 18 onboarding is ready
// import { useOnboarding } from '@/lib/onboarding'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { StatCardDNA, StatCardGrid } from '@/lib/dna/components/ui/stat-card-dna'
import { 
  Package, 
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Download,
  Snowflake,
  Thermometer,
  Calendar,
  MapPin,
  Plus,
  ArrowRightLeft,
  Trash2,
  Factory,
  ClipboardCheck,
  HelpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InventoryItem {
  id: string
  entity_name: string
  entity_code: string
  entity_type: string
  metadata: any
  dynamic_data?: any[]
  relationships?: any[]
}

interface StockLevel {
  product_id: string
  product_name: string
  product_code: string
  location_id: string
  location_name: string
  quantity: number
  unit: string
  value: number
  expiry_date?: string
  batch_no?: string
  temperature?: number
}

export default function InventoryPage() {
  const { organizationId, organizationName, loading: orgLoading } = useDemoOrg()
  // TODO: Re-enable once React 18 onboarding is ready
  // const { startTour, isActive } = useOnboarding()
  const isActive = false // temporary placeholder
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  
  // Dialog states
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
  const [showProductionDialog, setShowProductionDialog] = useState(false)
  
  // Form states
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [transferQuantity, setTransferQuantity] = useState<number>(0)
  const [fromLocation, setFromLocation] = useState<string>('')
  const [toLocation, setToLocation] = useState<string>('')
  const [adjustmentReason, setAdjustmentReason] = useState<string>('')
  const [productionQuantity, setProductionQuantity] = useState<number>(0)

  useEffect(() => {
    if (organizationId && !orgLoading) {
      fetchInventoryData()
    }
  }, [organizationId, orgLoading])

  // Handle stock transfer
  async function handleStockTransfer() {
    if (!selectedProduct || !fromLocation || !toLocation || transferQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive"
      })
      return
    }

    try {
      const product = inventory.find(p => p.id === selectedProduct)
      if (!product) return

      // Create inventory transfer transaction
      const { data: transaction, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'inventory_transfer',
          transaction_date: new Date().toISOString(),
          transaction_code: `TRNF-${Date.now()}`,
          smart_code: 'HERA.MFG.TXN.INVENTORY.TRANSFER.v1',
          total_amount: transferQuantity * (product.metadata?.cost_per_unit || 0),
          transaction_status: 'completed',
          metadata: {
            from_location_id: fromLocation,
            to_location_id: toLocation,
            transfer_reason: 'stock_movement'
          }
        })
        .select()
        .single()

      if (txnError) throw txnError

      // Create transaction line
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: organizationId,
          transaction_id: transaction.id,
          line_number: 1,
          entity_id: selectedProduct,
          line_type: 'product',
          description: `Transfer of ${product.entity_name}`,
          quantity: transferQuantity,
          unit_amount: product.metadata?.cost_per_unit || 0,
          line_amount: transferQuantity * (product.metadata?.cost_per_unit || 0),
          smart_code: 'HERA.MFG.TXN.LINE.TRANSFER.v1'
        })

      toast({
        title: "Success",
        description: `Transferred ${transferQuantity} units successfully`
      })

      setShowTransferDialog(false)
      setSelectedProduct('')
      setTransferQuantity(0)
      setFromLocation('')
      setToLocation('')
      fetchInventoryData()

    } catch (error) {
      console.error('Transfer error:', error)
      toast({
        title: "Error",
        description: "Failed to transfer stock",
        variant: "destructive"
      })
    }
  }

  // Handle inventory adjustment (damage, expiry, etc)
  async function handleInventoryAdjustment() {
    if (!selectedProduct || !selectedLocation || !adjustmentReason || transferQuantity === 0) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive"
      })
      return
    }

    try {
      const product = inventory.find(p => p.id === selectedProduct)
      if (!product) return

      // Create adjustment transaction
      const { data: transaction, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'inventory_adjustment',
          transaction_date: new Date().toISOString(),
          transaction_code: `ADJ-${Date.now()}`,
          smart_code: 'HERA.MFG.TXN.INVENTORY.ADJUSTMENT.v1',
          total_amount: Math.abs(transferQuantity) * (product.metadata?.cost_per_unit || 0),
          transaction_status: 'completed',
          metadata: {
            location_id: selectedLocation,
            adjustment_reason: adjustmentReason,
            adjustment_type: transferQuantity < 0 ? 'decrease' : 'increase'
          }
        })
        .select()
        .single()

      if (txnError) throw txnError

      // Create transaction line
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: organizationId,
          transaction_id: transaction.id,
          line_number: 1,
          entity_id: selectedProduct,
          line_type: 'product',
          description: `Adjustment: ${adjustmentReason}`,
          quantity: transferQuantity,
          unit_amount: product.metadata?.cost_per_unit || 0,
          line_amount: Math.abs(transferQuantity) * (product.metadata?.cost_per_unit || 0),
          smart_code: 'HERA.MFG.TXN.LINE.ADJUSTMENT.v1'
        })

      toast({
        title: "Success",
        description: `Inventory adjusted successfully`
      })

      setShowAdjustmentDialog(false)
      setSelectedProduct('')
      setTransferQuantity(0)
      setSelectedLocation('all')
      setAdjustmentReason('')
      fetchInventoryData()

    } catch (error) {
      console.error('Adjustment error:', error)
      toast({
        title: "Error",
        description: "Failed to adjust inventory",
        variant: "destructive"
      })
    }
  }

  // Handle new production
  async function handleNewProduction() {
    if (!selectedProduct || productionQuantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive"
      })
      return
    }

    try {
      const product = inventory.find(p => p.id === selectedProduct)
      const plantLocation = locations.find(l => l.entity_code === 'LOC-PLANT')
      if (!product || !plantLocation) return

      // Create production batch transaction
      const { data: transaction, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'production_batch',
          transaction_date: new Date().toISOString(),
          transaction_code: `PROD-${Date.now()}`,
          smart_code: 'HERA.MFG.TXN.PRODUCTION.BATCH.v1',
          total_amount: productionQuantity * (product.metadata?.cost_per_unit || 0),
          transaction_status: 'completed',
          metadata: {
            batch_no: `BATCH-${Date.now()}`,
            production_date: new Date().toISOString(),
            expiry_date: new Date(Date.now() + (product.metadata?.shelf_life_days || 180) * 24 * 60 * 60 * 1000).toISOString(),
            location_id: plantLocation.id,
            location_name: plantLocation.entity_name,
            quality_status: 'passed'
          }
        })
        .select()
        .single()

      if (txnError) throw txnError

      // Create transaction line
      await supabase
        .from('universal_transaction_lines')
        .insert({
          organization_id: organizationId,
          transaction_id: transaction.id,
          line_number: 1,
          entity_id: selectedProduct,
          line_type: 'product',
          description: `Production of ${product.entity_name}`,
          quantity: productionQuantity,
          unit_amount: product.metadata?.cost_per_unit || 0,
          line_amount: productionQuantity * (product.metadata?.cost_per_unit || 0),
          smart_code: 'HERA.MFG.TXN.LINE.PRODUCTION.v1'
        })

      toast({
        title: "Success",
        description: `Produced ${productionQuantity} units successfully`
      })

      setShowProductionDialog(false)
      setSelectedProduct('')
      setProductionQuantity(0)
      fetchInventoryData()

    } catch (error) {
      console.error('Production error:', error)
      toast({
        title: "Error",
        description: "Failed to create production batch",
        variant: "destructive"
      })
    }
  }

  async function fetchInventoryData() {
    if (!organizationId) return
    
    try {
      // Fetch all products and raw materials
      const { data: products } = await supabase
        .from('core_entities')
        .select(`
          *,
          core_dynamic_data (*)
        `)
        .eq('organization_id', organizationId)
        .in('entity_type', ['product', 'raw_material'])

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'location')

      // Fetch inventory transactions to calculate stock levels
      // First get the transactions
      const { data: txns } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .in('transaction_type', ['inventory_transfer', 'production_batch', 'pos_sale'])
      
      // Then get the transaction lines for those transactions
      const txnIds = txns?.map(t => t.id) || []
      const { data: lines } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .in('transaction_id', txnIds)
      
      // Combine the data
      const transactions = lines?.map(line => ({
        ...line,
        universal_transactions: txns?.find(t => t.id === line.transaction_id)
      }))

      // Calculate stock levels
      const stockMap = new Map<string, StockLevel>()
      
      // Initialize stock for each product at each location
      products?.forEach(product => {
        locationsData?.forEach(location => {
          const key = `${product.id}-${location.id}`
          stockMap.set(key, {
            product_id: product.id,
            product_name: product.entity_name,
            product_code: product.entity_code,
            location_id: location.id,
            location_name: location.entity_name,
            quantity: 0,
            unit: product.metadata?.unit || 'units',
            value: 0,
            temperature: location.metadata?.current_temperature || -20
          })
        })
      })

      // Process transactions to update stock levels
      transactions?.forEach(line => {
        const txn = line.universal_transactions
        if (line.entity_id && line.quantity) {
          // For transfers, update both source and destination
          if (txn.transaction_type === 'inventory_transfer') {
            const fromKey = `${line.entity_id}-${txn.metadata?.from_location_id}`
            const toKey = `${line.entity_id}-${txn.metadata?.to_location_id}`
            
            if (stockMap.has(fromKey)) {
              const stock = stockMap.get(fromKey)!
              stock.quantity -= Math.abs(line.quantity)
            }
            
            if (stockMap.has(toKey)) {
              const stock = stockMap.get(toKey)!
              stock.quantity += Math.abs(line.quantity)
              stock.batch_no = txn.metadata?.batch_no
              stock.expiry_date = txn.metadata?.expiry_date
            }
          }
          // For production, add to plant location
          else if (txn.transaction_type === 'production_batch') {
            const plantLocation = locationsData?.find(l => l.entity_code === 'LOC-PLANT')
            if (plantLocation) {
              const key = `${line.entity_id}-${plantLocation.id}`
              if (stockMap.has(key)) {
                const stock = stockMap.get(key)!
                stock.quantity += line.quantity
                stock.batch_no = txn.metadata?.batch_no
              }
            }
          }
          // For sales, deduct from outlet
          else if (txn.transaction_type === 'pos_sale') {
            const outletId = txn.metadata?.outlet_id
            if (outletId) {
              const key = `${line.entity_id}-${outletId}`
              if (stockMap.has(key)) {
                const stock = stockMap.get(key)!
                stock.quantity -= Math.abs(line.quantity)
              }
            }
          }
        }
      })

      // Convert map to array and filter out zero quantities
      const stockArray = Array.from(stockMap.values()).filter(s => s.quantity !== 0)
      
      // Calculate values based on cost
      stockArray.forEach(stock => {
        const product = products?.find(p => p.id === stock.product_id)
        const costPerUnit = product?.metadata?.cost_per_unit || 0
        stock.value = stock.quantity * costPerUnit
      })

      setInventory(products || [])
      setStockLevels(stockArray)
      setLocations(locationsData || [])
    } catch (error) {
      console.error('Error fetching inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter stock levels
  const filteredStock = stockLevels.filter(stock => {
    const matchesSearch = stock.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.product_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = selectedLocation === 'all' || stock.location_id === selectedLocation
    return matchesSearch && matchesLocation
  })

  // Calculate summary stats
  const totalValue = filteredStock.reduce((sum, item) => sum + item.value, 0)
  const lowStockItems = filteredStock.filter(item => item.quantity < 10).length
  const expiringItems = filteredStock.filter(item => {
    if (!item.expiry_date) return false
    const daysUntilExpiry = Math.floor((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7
  }).length

  // Show loading state while org is being resolved
  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-t-2 border-gray-300 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading demo organization...</p>
        </div>
      </div>
    )
  }

  // Show error if no org found
  if (!organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">No organization found for this demo route</p>
          <p className="text-gray-400 text-sm">Please check the demo configuration</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between" data-testid="inventory-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track stock levels across all locations with FEFO management
          </p>
        </div>
        <div className="flex items-center space-x-2" data-testid="inventory-actions">
          {/* TODO: Re-enable once React 18 onboarding is ready */}
          {/* <Button
            onClick={() => startTour('HERA.UI.ONBOARD.ICECREAM.INVENTORY.v1')}
            variant="outline"
            size="sm"
            disabled={isActive}
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {isActive ? 'Tour Running...' : 'Help'}
          </Button> */}
          
          <Dialog open={showProductionDialog} onOpenChange={setShowProductionDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-200 hover:bg-green-50" data-testid="new-production-button">
                <Factory className="w-4 h-4 mr-2" />
                New Production
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Production Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Product</Label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Product</option>
                    {inventory.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.entity_name} ({product.entity_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={productionQuantity}
                    onChange={(e) => setProductionQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity to produce"
                  />
                </div>
                <Button onClick={handleNewProduction} className="w-full">
                  Create Production Batch
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white" data-testid="stock-transfer-button">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Stock Transfer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Stock Between Locations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Product</Label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Product</option>
                    {inventory.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.entity_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>From Location</Label>
                  <select
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Source</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.entity_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>To Location</Label>
                  <select
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Destination</option>
                    {locations.filter(l => l.id !== fromLocation).map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.entity_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity to transfer"
                  />
                </div>
                <Button onClick={handleStockTransfer} className="w-full">
                  Transfer Stock
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-orange-200 hover:bg-orange-50">
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inventory Adjustment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Product</Label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Product</option>
                    {inventory.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.entity_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Location</Label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.entity_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Adjustment Reason</Label>
                  <select
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Reason</option>
                    <option value="damage">Damage</option>
                    <option value="expiry">Expiry</option>
                    <option value="theft">Theft/Loss</option>
                    <option value="quality_issue">Quality Issue</option>
                    <option value="count_correction">Count Correction</option>
                  </select>
                </div>
                <div>
                  <Label>Quantity (use negative for decrease)</Label>
                  <Input
                    type="number"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 0)}
                    placeholder="e.g., -10 for loss, 5 for found"
                  />
                </div>
                <Button onClick={handleInventoryAdjustment} className="w-full">
                  Submit Adjustment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <StatCardGrid columns={4} data-testid="inventory-summary">
        <StatCardDNA
          title="Total Inventory Value"
          value={`₹${totalValue.toLocaleString()}`}
          change="+12.5% from last month"
          changeType="positive"
          icon={TrendingUp}
          iconGradient="from-green-500 to-emerald-500"
        />
        
        <StatCardDNA
          title="Total SKUs"
          value={inventory.length}
          change={`${inventory.filter(i => i.entity_type === 'product').length} active products`}
          changeType="neutral"
          icon={Package}
          iconGradient="from-blue-500 to-purple-500"
        />
        
        <StatCardDNA
          title="Low Stock Alerts"
          value={lowStockItems}
          change="Requires attention"
          changeType="negative"
          icon={AlertCircle}
          iconGradient="from-yellow-500 to-orange-500"
        />
        
        <StatCardDNA
          title="Expiring Soon"
          value={expiringItems}
          change="Within 7 days"
          changeType="negative"
          icon={Calendar}
          iconGradient="from-red-500 to-pink-500"
        />
      </StatCardGrid>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4" data-testid="inventory-filters">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="inventory-search"
          />
        </div>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800"
        >
          <option value="all">All Locations</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>{loc.entity_name}</option>
          ))}
        </select>
      </div>

      {/* Stock Table */}
      <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-cyan-200/50 dark:border-cyan-800/50 shadow-xl" data-testid="stock-table">
        <CardHeader className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Current Stock Levels</CardTitle>
            <Button variant="outline" size="sm" className="text-gray-600 dark:text-gray-400">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Product</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Location</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Quantity</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Value</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Temp</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Expiry</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Status</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8">
                      <div className="animate-pulse">Loading inventory data...</div>
                    </td>
                  </tr>
                ) : filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-500">
                      No stock found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item, idx) => {
                    const isLowStock = item.quantity < 10
                    const daysUntilExpiry = item.expiry_date ? 
                      Math.floor((new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7
                    
                    return (
                      <tr 
                        key={idx} 
                        className={`
                          border-b border-gray-200 dark:border-gray-700/50 
                          transition-all duration-150 
                          ${idx % 2 === 0 
                            ? '' 
                            : 'bg-gray-50/30 dark:bg-gray-800/20'
                          }
                          hover:bg-cyan-100/50 dark:hover:bg-cyan-950/30
                          hover:shadow-sm
                        `}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                              <Snowflake className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{item.product_name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{item.product_code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{item.location_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={cn(
                            "font-bold text-lg",
                            isLowStock ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
                          )}>
                            {item.quantity.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">₹{item.value.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                            <Thermometer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{item.temperature}°C</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {item.expiry_date ? (
                            <div className={cn(
                              "text-sm",
                              isExpiringSoon ? "text-red-600 dark:text-red-400 font-bold" : "text-gray-700 dark:text-gray-300"
                            )}>
                              {new Date(item.expiry_date).toLocaleDateString()}
                              {isExpiringSoon && (
                                <p className="text-xs font-semibold">({daysUntilExpiry}d left)</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isLowStock && (
                            <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-semibold">Low Stock</Badge>
                          )}
                          {isExpiringSoon && (
                            <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-semibold">Expiring</Badge>
                          )}
                          {!isLowStock && !isExpiringSoon && (
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 font-semibold">Optimal</Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedProduct(item.product_id)
                                setFromLocation(item.location_id)
                                setShowTransferDialog(true)
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedProduct(item.product_id)
                                setSelectedLocation(item.location_id)
                                setShowAdjustmentDialog(true)
                              }}
                              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/30"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}