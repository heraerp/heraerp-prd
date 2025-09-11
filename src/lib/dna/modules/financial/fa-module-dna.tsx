'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Building,
  Truck,
  Package,
  Settings,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingDown,
  Wrench,
  Zap,
  Thermometer,
  Snowflake,
  Activity,
  BarChart3,
  Filter,
  Search,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  MapPin,
  Gauge,
  Battery,
  Shield,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

// Types
export interface FAModuleProps {
  organizationId: string
  isDarkMode?: boolean
  features?: {
    barcodeScannerIntegration?: boolean
    maintenanceScheduling?: boolean
    deprecationCalculation?: boolean
    assetTransfers?: boolean
    disposalManagement?: boolean
    revaluation?: boolean
    insuranceTracking?: boolean
  }
  industrySpecific?: {
    freezerAssetTracking?: boolean
    coldChainEquipment?: boolean
    refrigeratedVehicles?: boolean
    temperatureMonitoring?: boolean
    energyEfficiencyTracking?: boolean
    complianceCertifications?: boolean
  }
  onAssetCreated?: (assetId: string) => void
  onMaintenanceScheduled?: (maintenanceId: string) => void
  onDepreciationCalculated?: (assetId: string) => void
}

interface FixedAsset {
  id: string
  assetCode: string
  assetName: string
  assetType: 'freezer' | 'cold_room' | 'vehicle' | 'equipment' | 'building' | 'other'
  status: 'active' | 'maintenance' | 'retired' | 'disposed'
  acquisitionDate: Date
  acquisitionCost: number
  currentValue: number
  accumulatedDepreciation: number
  location?: string
  metadata?: {
    serialNumber?: string
    manufacturer?: string
    model?: string
    capacity?: string
    temperature?: number
    energyRating?: string
    lastMaintenance?: Date
    nextMaintenance?: Date
    warrantyExpiry?: Date
    placedAtCustomer?: string
    refrigerantType?: string
    compressorType?: string
  }
}

interface Maintenance {
  id: string
  assetId: string
  maintenanceType: 'preventive' | 'corrective' | 'emergency' | 'calibration'
  scheduledDate: Date
  completedDate?: Date
  cost: number
  technician?: string
  description: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  metadata?: {
    temperatureCheck?: boolean
    refrigerantLevel?: number
    energyEfficiency?: number
    partsReplaced?: string[]
  }
}

interface AssetTransfer {
  id: string
  assetId: string
  fromLocation: string
  toLocation: string
  transferDate: Date
  reason: string
  approvedBy?: string
}

interface DepreciationSchedule {
  id: string
  assetId: string
  method: 'straight_line' | 'declining_balance' | 'units_of_production'
  usefulLife: number // in months
  salvageValue: number
  monthlyDepreciation: number
}

// FA Module DNA Component
export function FAModule({
  organizationId,
  isDarkMode = false,
  features = {
    barcodeScannerIntegration: true,
    maintenanceScheduling: true,
    deprecationCalculation: true,
    assetTransfers: true,
    disposalManagement: true,
    revaluation: false,
    insuranceTracking: true
  },
  industrySpecific = {},
  onAssetCreated,
  onMaintenanceScheduled,
  onDepreciationCalculated
}: FAModuleProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'maintenance' | 'depreciation' | 'transfers' | 'reports'>('assets')
  const [assets, setAssets] = useState<FixedAsset[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<Maintenance[]>([])
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  
  // Asset Form State
  const [assetForm, setAssetForm] = useState<Partial<FixedAsset>>({
    acquisitionDate: new Date(),
    assetType: 'freezer',
    status: 'active'
  })

  // Maintenance Form State
  const [maintenanceForm, setMaintenanceForm] = useState<Partial<Maintenance>>({
    maintenanceType: 'preventive',
    scheduledDate: new Date(),
    status: 'scheduled'
  })

  // Load assets
  useEffect(() => {
    loadAssets()
  }, [organizationId])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await universalApi.query('core_entities', {
        filters: {
          organization_id: organizationId,
          entity_type: 'fixed_asset'
        }
      })
      
      if (response.data) {
        setAssets(response.data.map((asset: any) => ({
          id: asset.id,
          assetCode: asset.entity_code,
          assetName: asset.entity_name,
          assetType: (asset.metadata as any)?.asset_type || 'equipment',
          status: (asset.metadata as any)?.status || 'active',
          acquisitionDate: new Date((asset.metadata as any)?.acquisition_date || Date.now()),
          acquisitionCost: (asset.metadata as any)?.acquisition_cost || 0,
          currentValue: (asset.metadata as any)?.current_value || 0,
          accumulatedDepreciation: (asset.metadata as any)?.accumulated_depreciation || 0,
          location: (asset.metadata as any)?.location,
          metadata: asset.metadata
        })))
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create Asset
  const createAsset = async () => {
    if (!assetForm.assetName || !assetForm.assetCode) {
      alert('Please provide asset name and code')
      return
    }

    try {
      setLoading(true)
      
      // Create fixed asset entity
      const asset = await universalApi.createEntity({
        entity_type: 'fixed_asset',
        entity_code: assetForm.assetCode,
        entity_name: assetForm.assetName!,
        organization_id: organizationId,
        smart_code: `HERA.FIN.FA.${assetForm.assetType?.toUpperCase()}.v1`,
        metadata: {
          asset_type: assetForm.assetType,
          status: assetForm.status,
          acquisition_date: assetForm.acquisitionDate,
          acquisition_cost: assetForm.acquisitionCost,
          current_value: assetForm.acquisitionCost,
          accumulated_depreciation: 0,
          location: assetForm.location,
          ...assetForm.metadata
        }
      })

      // If it's a freezer placed at customer, create relationship
      if (assetForm.assetType === 'freezer' && (assetForm.metadata as any)?.placedAtCustomer) {
        await universalApi.createRelationship({
          from_entity_id: asset.id,
          to_entity_id: assetForm.metadata.placedAtCustomer,
          relationship_type: 'placed_at',
          smart_code: 'HERA.FIN.FA.REL.PLACEMENT.v1',
          metadata: {
            placement_date: new Date(),
            deposit_amount: assetForm.metadata.freezerDeposit || 0
          }
        })
      }

      // Clear form
      setAssetForm({
        acquisitionDate: new Date(),
        assetType: 'freezer',
        status: 'active'
      })

      // Notify parent
      if (onAssetCreated) {
        onAssetCreated(asset.id)
      }

      // Reload data
      loadAssets()
      
    } catch (error) {
      console.error('Failed to create asset:', error)
      alert('Failed to create asset')
    } finally {
      setLoading(false)
    }
  }

  // Schedule Maintenance
  const scheduleMaintenance = async () => {
    if (!maintenanceForm.assetId || !maintenanceForm.description) {
      alert('Please select asset and provide description')
      return
    }

    try {
      setLoading(true)
      
      // Create maintenance transaction
      const maintenance = await universalApi.createTransaction({
        transaction_type: 'asset_maintenance',
        transaction_date: maintenanceForm.scheduledDate || new Date(),
        organization_id: organizationId,
        from_entity_id: maintenanceForm.assetId,
        total_amount: maintenanceForm.cost || 0,
        smart_code: 'HERA.FIN.FA.TXN.MAINT.v1',
        metadata: {
          maintenance_type: maintenanceForm.maintenanceType,
          status: maintenanceForm.status,
          technician: maintenanceForm.technician,
          description: maintenanceForm.description,
          ...maintenanceForm.metadata
        }
      })

      // Clear form
      setMaintenanceForm({
        maintenanceType: 'preventive',
        scheduledDate: new Date(),
        status: 'scheduled'
      })

      // Notify parent
      if (onMaintenanceScheduled) {
        onMaintenanceScheduled(maintenance.id)
      }

      // Reload data
      loadAssets()
      
    } catch (error) {
      console.error('Failed to schedule maintenance:', error)
      alert('Failed to schedule maintenance')
    } finally {
      setLoading(false)
    }
  }

  // Calculate depreciation
  const calculateDepreciation = (asset: FixedAsset): number => {
    // Simplified straight-line depreciation
    const usefulLife = asset.assetType === 'freezer' ? 84 : // 7 years
                       asset.assetType === 'vehicle' ? 60 : // 5 years
                       asset.assetType === 'cold_room' ? 180 : // 15 years
                       120 // 10 years default
    
    const monthlyDepreciation = (asset.acquisitionCost - (asset.acquisitionCost * 0.1)) / usefulLife
    return monthlyDepreciation
  }

  // Calculate asset metrics
  const calculateMetrics = () => {
    const metrics = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
      freezerCount: assets.filter(a => a.assetType === 'freezer').length,
      vehicleCount: assets.filter(a => a.assetType === 'vehicle').length,
      maintenanceDue: assets.filter(a => (a.metadata as any)?.nextMaintenance && 
        new Date(a.metadata.nextMaintenance) <= new Date()).length,
      avgEnergyRating: 0
    }
    
    // Calculate average energy rating for freezers
    const freezers = assets.filter(a => a.assetType === 'freezer' && (a.metadata as any)?.energyRating)
    if (freezers.length > 0) {
      const ratings = freezers.map(f => {
        const rating = (f.metadata as any)?.energyRating || 'D'
        return rating === 'A++' ? 7 : rating === 'A+' ? 6 : rating === 'A' ? 5 :
               rating === 'B' ? 4 : rating === 'C' ? 3 : rating === 'D' ? 2 : 1
      })
      metrics.avgEnergyRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
    }
    
    return metrics
  }

  return (
    <div className={cn("min-h-screen", isDarkMode && "dark")}>
      <Card className={cn(
        "shadow-lg",
        isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : "bg-white border-gray-200"
      )}>
        <CardHeader className={cn(
          "border-b",
          isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "text-xl flex items-center gap-2",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              <Building className="h-5 w-5" />
              Fixed Assets Module
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {calculateMetrics().totalAssets} Assets
              </Badge>
              <Badge variant="outline" className="gap-1">
                <DollarSign className="h-3 w-3" />
                ₹{calculateMetrics().totalValue.toLocaleString()}
              </Badge>
              {industrySpecific.freezerAssetTracking && (
                <Badge variant="outline" className="gap-1">
                  <Snowflake className="h-3 w-3" />
                  {calculateMetrics().freezerCount} Freezers
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className={cn(
              "grid w-full grid-cols-5",
              isDarkMode ? "bg-[#292929]" : "bg-gray-100"
            )}>
              <TabsTrigger value="assets" className="gap-1">
                <Building className="h-4 w-4" />
                Assets
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="gap-1">
                <Wrench className="h-4 w-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="depreciation" className="gap-1">
                <TrendingDown className="h-4 w-4" />
                Depreciation
              </TabsTrigger>
              <TabsTrigger value="transfers" className="gap-1">
                <Truck className="h-4 w-4" />
                Transfers
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>
            
            {/* Assets Tab */}
            <TabsContent value="assets" className="space-y-4 mt-4">
              {/* Asset Registration Form */}
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Register New Asset</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Asset Type</Label>
                      <Select 
                        value={assetForm.assetType} 
                        onValueChange={(value) => setAssetForm(prev => ({ ...prev, assetType: value as any }))}
                      >
                        <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freezer">Freezer</SelectItem>
                          <SelectItem value="cold_room">Cold Room</SelectItem>
                          <SelectItem value="vehicle">Refrigerated Vehicle</SelectItem>
                          <SelectItem value="equipment">Equipment</SelectItem>
                          <SelectItem value="building">Building</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Asset Code</Label>
                      <Input
                        placeholder="FA-2024-001"
                        value={assetForm.assetCode}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, assetCode: e.target.value }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                    <div>
                      <Label>Asset Name</Label>
                      <Input
                        placeholder="Commercial Freezer Unit"
                        value={assetForm.assetName}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, assetName: e.target.value }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Acquisition Date</Label>
                      <Input
                        type="date"
                        value={assetForm.acquisitionDate?.toISOString().split('T')[0]}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, acquisitionDate: new Date(e.target.value) }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                    <div>
                      <Label>Acquisition Cost</Label>
                      <Input
                        type="number"
                        placeholder="25000"
                        value={assetForm.acquisitionCost}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, acquisitionCost: parseFloat(e.target.value) || 0 }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        placeholder="Main Warehouse"
                        value={assetForm.location}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, location: e.target.value }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                  </div>
                  
                  {/* Ice Cream Specific Fields */}
                  {assetForm.assetType === 'freezer' && industrySpecific.freezerAssetTracking && (
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Serial Number</Label>
                        <Input
                          placeholder="SN123456"
                          onChange={(e) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, serialNumber: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      <div>
                        <Label>Capacity (Liters)</Label>
                        <Input
                          placeholder="500"
                          onChange={(e) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, capacity: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      <div>
                        <Label>Energy Rating</Label>
                        <Select
                          onValueChange={(value) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, energyRating: value }
                          }))}
                        >
                          <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A++">A++ (Most Efficient)</SelectItem>
                            <SelectItem value="A+">A+</SelectItem>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Refrigerant Type</Label>
                        <Select
                          onValueChange={(value) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, refrigerantType: value }
                          }))}
                        >
                          <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="R404A">R404A</SelectItem>
                            <SelectItem value="R507A">R507A</SelectItem>
                            <SelectItem value="R290">R290 (Propane)</SelectItem>
                            <SelectItem value="R744">R744 (CO2)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {assetForm.assetType === 'vehicle' && industrySpecific.refrigeratedVehicles && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Vehicle Registration</Label>
                        <Input
                          placeholder="DXB-A-12345"
                          onChange={(e) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, vehicleRegistration: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      <div>
                        <Label>Cooling Capacity</Label>
                        <Input
                          placeholder="-25°C to +5°C"
                          onChange={(e) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, coolingCapacity: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      <div>
                        <Label>Cargo Volume (m³)</Label>
                        <Input
                          placeholder="15"
                          onChange={(e) => setAssetForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, cargoVolume: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setAssetForm({
                        acquisitionDate: new Date(),
                        assetType: 'freezer',
                        status: 'active'
                      })}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={createAsset}
                      disabled={loading || !assetForm.assetName || !assetForm.assetCode}
                      className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                    >
                      Register Asset
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Asset List */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search assets..."
                      className={cn(
                        "pl-10 w-[300px]",
                        isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                      )}
                    />
                  </div>
                  {industrySpecific.freezerAssetTracking && (
                    <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                      <SelectTrigger className={cn(
                        "w-[200px]",
                        isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assets</SelectItem>
                        <SelectItem value="freezer">Freezers Only</SelectItem>
                        <SelectItem value="cold_room">Cold Rooms</SelectItem>
                        <SelectItem value="vehicle">Vehicles</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {assets
                  .filter(asset => selectedAssetType === 'all' || asset.assetType === selectedAssetType)
                  .map(asset => (
                  <Card key={asset.id} className={cn(
                    isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{asset.assetName}</h3>
                            <Badge variant={asset.status === 'active' ? 'default' : 
                                           asset.status === 'maintenance' ? 'secondary' : 'outline'}>
                              {asset.status}
                            </Badge>
                            {asset.assetType === 'freezer' && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Snowflake className="h-3 w-3 mr-1" />
                                Freezer
                              </Badge>
                            )}
                            {(asset.metadata as any)?.energyRating && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Zap className="h-3 w-3 mr-1" />
                                {asset.metadata.energyRating}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Code:</span> {asset.assetCode}
                            </div>
                            <div>
                              <span className="text-gray-500">Location:</span> {asset.location || 'N/A'}
                            </div>
                            <div>
                              <span className="text-gray-500">Age:</span> {
                                Math.floor((Date.now() - asset.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
                              } years
                            </div>
                            <div>
                              <span className="text-gray-500">Depreciation:</span> ₹{asset.accumulatedDepreciation.toLocaleString()}
                            </div>
                          </div>
                          {(asset.metadata as any)?.nextMaintenance && (
                            <div className="mt-2">
                              <Alert className={cn(
                                "py-2",
                                new Date(asset.metadata.nextMaintenance) <= new Date() ?
                                "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
                                "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                              )}>
                                <Wrench className="h-3 w-3" />
                                <AlertDescription className="text-xs">
                                  Next maintenance: {new Date(asset.metadata.nextMaintenance).toLocaleDateString()}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold">
                            ₹{asset.currentValue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Current Value</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Cost: ₹{asset.acquisitionCost.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-4 mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Schedule Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Asset</Label>
                      <Select 
                        value={maintenanceForm.assetId}
                        onValueChange={(value) => setMaintenanceForm(prev => ({ ...prev, assetId: value }))}
                      >
                        <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map(asset => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.assetCode} - {asset.assetName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Maintenance Type</Label>
                      <Select
                        value={maintenanceForm.maintenanceType}
                        onValueChange={(value) => setMaintenanceForm(prev => ({ ...prev, maintenanceType: value as any }))}
                      >
                        <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="preventive">Preventive</SelectItem>
                          <SelectItem value="corrective">Corrective</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="calibration">Calibration</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Scheduled Date</Label>
                      <Input
                        type="date"
                        value={maintenanceForm.scheduledDate?.toISOString().split('T')[0]}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduledDate: new Date(e.target.value) }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                    <div>
                      <Label>Estimated Cost</Label>
                      <Input
                        type="number"
                        placeholder="5000"
                        value={maintenanceForm.cost}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                    <div>
                      <Label>Technician</Label>
                      <Input
                        placeholder="John Doe"
                        value={maintenanceForm.technician}
                        onChange={(e) => setMaintenanceForm(prev => ({ ...prev, technician: e.target.value }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Maintenance work description..."
                      value={maintenanceForm.description}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                      className={cn(
                        "min-h-[100px]",
                        isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""
                      )}
                    />
                  </div>
                  
                  {/* Ice Cream Specific Maintenance Fields */}
                  {industrySpecific.temperatureMonitoring && (
                    <div className="space-y-2">
                      <Label>Temperature Checks</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            onCheckedChange={(checked) => setMaintenanceForm(prev => ({
                              ...prev,
                              metadata: { ...prev.metadata, temperatureCheck: !!checked }
                            }))}
                          />
                          <label className="text-sm">Perform temperature calibration</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox />
                          <label className="text-sm">Check door seals</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox />
                          <label className="text-sm">Verify alarm systems</label>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setMaintenanceForm({
                        maintenanceType: 'preventive',
                        scheduledDate: new Date(),
                        status: 'scheduled'
                      })}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={scheduleMaintenance}
                      disabled={loading || !maintenanceForm.assetId || !maintenanceForm.description}
                      className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                    >
                      Schedule Maintenance
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Upcoming Maintenance */}
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {calculateMetrics().maintenanceDue} assets have maintenance due
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    {assets
                      .filter(asset => (asset.metadata as any)?.nextMaintenance && 
                        new Date(asset.metadata.nextMaintenance) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                      .map(asset => (
                        <div key={asset.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{asset.assetName}</h4>
                              <p className="text-sm text-gray-500">
                                Due: {(asset.metadata as any)?.nextMaintenance && 
                                  new Date(asset.metadata.nextMaintenance).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={new Date((asset.metadata as any)?.nextMaintenance!) <= new Date() ? 
                              'destructive' : 'secondary'}>
                              {new Date((asset.metadata as any)?.nextMaintenance!) <= new Date() ? 
                                'Overdue' : 'Scheduled'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Depreciation Tab */}
            <TabsContent value="depreciation" className="mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Depreciation Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={cn(
                          "border-b",
                          isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
                        )}>
                          <th className="text-left py-2">Asset</th>
                          <th className="text-right py-2">Cost</th>
                          <th className="text-right py-2">Monthly Dep.</th>
                          <th className="text-right py-2">Accumulated</th>
                          <th className="text-right py-2">Book Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map(asset => {
                          const monthlyDep = calculateDepreciation(asset)
                          return (
                            <tr key={asset.id} className={cn(
                              "border-b",
                              isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
                            )}>
                              <td className="py-2">
                                <div>
                                  <div className="font-medium">{asset.assetCode}</div>
                                  <div className="text-xs text-gray-500">{asset.assetName}</div>
                                </div>
                              </td>
                              <td className="py-2 text-right">₹{asset.acquisitionCost.toLocaleString()}</td>
                              <td className="py-2 text-right">₹{monthlyDep.toFixed(2)}</td>
                              <td className="py-2 text-right">₹{asset.accumulatedDepreciation.toLocaleString()}</td>
                              <td className="py-2 text-right font-semibold">₹{asset.currentValue.toLocaleString()}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        if (onDepreciationCalculated) {
                          onDepreciationCalculated('batch')
                        }
                      }}
                      className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Calculate Monthly Depreciation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Transfers Tab */}
            <TabsContent value="transfers" className="mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Asset Transfers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4">
                    <Truck className="h-4 w-4" />
                    <AlertDescription>
                      Track asset movements between locations and customer placements
                    </AlertDescription>
                  </Alert>
                  
                  {industrySpecific.freezerAssetTracking && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-3">Customer Placed Freezers</h3>
                      <div className="space-y-2">
                        {assets
                          .filter(asset => asset.assetType === 'freezer' && (asset.metadata as any)?.placedAtCustomer)
                          .map(asset => (
                            <div key={asset.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{asset.assetCode}</span>
                                  <span className="text-sm text-gray-500 ml-2">at Customer Location</span>
                                </div>
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  Placed
                                </Badge>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Reports Tab */}
            <TabsContent value="reports" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-semibold">Asset Register</h3>
                        <p className="text-sm text-gray-500">Complete asset listing</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className={cn(
                  "cursor-pointer hover:shadow-md transition-shadow",
                  isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-semibold">Depreciation Report</h3>
                        <p className="text-sm text-gray-500">Asset value analysis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {industrySpecific.energyEfficiencyTracking && (
                  <Card className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                  )}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Zap className="h-8 w-8 text-yellow-500" />
                        <div>
                          <h3 className="font-semibold">Energy Efficiency</h3>
                          <p className="text-sm text-gray-500">Freezer energy analysis</p>
                        </div>
                      </div>
                      {calculateMetrics().avgEnergyRating > 0 && (
                        <div className="mt-3">
                          <Progress 
                            value={(calculateMetrics().avgEnergyRating / 7) * 100} 
                            className="h-2" 
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Average Rating: {calculateMetrics().avgEnergyRating.toFixed(1)}/7
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {industrySpecific.temperatureMonitoring && (
                  <Card className={cn(
                    "cursor-pointer hover:shadow-md transition-shadow",
                    isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                  )}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Thermometer className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="font-semibold">Cold Chain Assets</h3>
                        <p className="text-sm text-gray-500">Temperature compliance</p>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Export as HERA DNA Component
export const FA_MODULE_DNA = {
  id: 'HERA.FIN.FA.MODULE.v1',
  name: 'Fixed Assets Module',
  description: 'Complete fixed asset management with registration, maintenance, depreciation, and transfers',
  component: FAModule,
  category: 'financial',
  subcategory: 'fixed_assets',
  tags: ['fa', 'assets', 'depreciation', 'maintenance', 'financial'],
  version: '1.0.0',
  author: 'HERA Team',
  features: [
    'Asset registration and tracking',
    'Depreciation calculation methods',
    'Maintenance scheduling and tracking',
    'Asset transfer management',
    'Disposal and revaluation',
    'Insurance tracking',
    'Barcode scanner integration',
    'Energy efficiency monitoring',
    'Industry-specific adaptations'
  ],
  industryAdaptations: {
    iceCream: {
      freezerAssetTracking: true,
      coldChainEquipment: true,
      refrigeratedVehicles: true,
      temperatureMonitoring: true,
      energyEfficiencyTracking: true,
      complianceCertifications: true,
      features: [
        'Freezer fleet management with customer placement',
        'Cold room temperature monitoring',
        'Refrigerated vehicle tracking',
        'Energy consumption per freezer',
        'Refrigerant type compliance',
        'Freezer capacity management',
        'Preventive maintenance for cold chain',
        'Temperature excursion tracking',
        'Energy rating analysis'
      ]
    },
    restaurant: {
      features: [
        'Kitchen equipment tracking',
        'Food safety compliance',
        'Equipment warranty management',
        'Service contract tracking'
      ]
    },
    healthcare: {
      features: [
        'Medical equipment tracking',
        'Calibration scheduling',
        'Regulatory compliance',
        'Equipment utilization analysis'
      ]
    },
    manufacturing: {
      features: [
        'Production line equipment',
        'Tool and die management',
        'Preventive maintenance',
        'OEE tracking'
      ]
    }
  },
  dependencies: [
    'universalApi',
    'Asset master data',
    'GL account setup for depreciation',
    'Vendor management for maintenance',
    'Organization context'
  ],
  smartCodes: [
    'HERA.FIN.FA.FREEZER.v1',
    'HERA.FIN.FA.COLD_ROOM.v1',
    'HERA.FIN.FA.VEHICLE.v1',
    'HERA.FIN.FA.EQUIPMENT.v1',
    'HERA.FIN.FA.TXN.MAINT.v1',
    'HERA.FIN.FA.REL.PLACEMENT.v1',
    'HERA.FIN.FA.DEP.*',
    'HERA.FIN.FA.VAL.*'
  ]
}