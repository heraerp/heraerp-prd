'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TruckIcon,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Thermometer,
  Route,
  Calendar,
  ArrowRight,
  Warehouse,
  User,
  Activity,
  Navigation,
  MapPinned,
  Store,
  Phone,
  CreditCard,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Kochi Ice Cream Org ID
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

interface Transfer {
  id: string
  transaction_code: string
  transaction_date: string
  metadata: any
  universal_transaction_lines: any[]
}

interface Entity {
  id: string
  entity_type: string
  entity_name: string
  entity_code: string
  metadata: any
}

interface Relationship {
  id: string
  from_entity_id: string
  to_entity_id: string
  relationship_type: string
  relationship_data: any
}

export default function DistributionPage() {
  const [loading, setLoading] = useState(true)
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [distributionCenters, setDistributionCenters] = useState<Entity[]>([])
  const [vehicles, setVehicles] = useState<Entity[]>([])
  const [drivers, setDrivers] = useState<Entity[]>([])
  const [routes, setRoutes] = useState<Entity[]>([])
  const [customers, setCustomers] = useState<Entity[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled' | 'completed'>('active')

  useEffect(() => {
    fetchDistributionData()
  }, [])

  async function fetchDistributionData() {
    try {
      // Fetch inventory transfers
      const { data: transferData } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          universal_transaction_lines (*)
        `)
        .eq('organization_id', ORG_ID)
        .eq('transaction_type', 'inventory_transfer')
        .order('created_at', { ascending: false })

      // Fetch locations
      const { data: locationData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'location')

      // Fetch distribution centers
      const { data: dcData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'distribution_center')

      // Fetch vehicles
      const { data: vehicleData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'vehicle')

      // Fetch drivers
      const { data: driverData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'driver')

      // Fetch routes
      const { data: routeData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'delivery_route')

      // Fetch customers
      const { data: customerData } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', ORG_ID)
        .eq('entity_type', 'customer')

      // Fetch all relationships
      const { data: relationshipData } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', ORG_ID)
        .in('relationship_type', ['assigned_to', 'based_at', 'serves_route', 'route_includes'])

      setTransfers(transferData || [])
      setLocations(locationData || [])
      setDistributionCenters(dcData || [])
      setVehicles(vehicleData || [])
      setDrivers(driverData || [])
      setRoutes(routeData || [])
      setCustomers(customerData || [])
      setRelationships(relationshipData || [])
    } catch (error) {
      console.error('Error fetching distribution data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeTransfers = transfers.filter(t => t.metadata?.status === 'in_transit')
  const scheduledTransfers = transfers.filter(t => t.metadata?.status === 'scheduled')
  const completedTransfers = transfers.filter(t => t.metadata?.status === 'delivered' || !t.metadata?.status)

  const currentTransfers = 
    activeTab === 'active' ? activeTransfers :
    activeTab === 'scheduled' ? scheduledTransfers :
    completedTransfers

  function getLocationName(locationId: string) {
    const location = locations.find(l => l.id === locationId)
    return location?.entity_name || 'Unknown'
  }

  function getTemperatureStatus(temp: number) {
    if (temp <= -20) return { color: 'text-green-600', status: 'Optimal' }
    if (temp <= -18) return { color: 'text-yellow-600', status: 'Warning' }
    return { color: 'text-red-600', status: 'Critical' }
  }

  // Helper function to get entity by ID
  function getEntityById(entityId: string, entities: Entity[]) {
    return entities.find(e => e.id === entityId)
  }

  // Helper function to get relationships for an entity
  function getRelationshipsForEntity(entityId: string, relationshipType?: string) {
    return relationships.filter(r => 
      (r.from_entity_id === entityId || r.to_entity_id === entityId) &&
      (!relationshipType || r.relationship_type === relationshipType)
    )
  }

  // Get driver for a vehicle
  function getDriverForVehicle(vehicleId: string) {
    const rel = relationships.find(r => 
      r.from_entity_id === vehicleId && r.relationship_type === 'assigned_to'
    )
    return rel ? getEntityById(rel.to_entity_id, drivers) : null
  }

  // Get vehicles for a route
  function getVehiclesForRoute(routeId: string) {
    const rels = relationships.filter(r => 
      r.to_entity_id === routeId && r.relationship_type === 'serves_route'
    )
    return rels.map(r => getEntityById(r.from_entity_id, vehicles)).filter(Boolean)
  }

  // Get customers for a route
  function getCustomersForRoute(routeId: string) {
    const rels = relationships.filter(r => 
      r.from_entity_id === routeId && r.relationship_type === 'route_includes'
    )
    return rels.map(r => ({
      customer: getEntityById(r.to_entity_id, customers),
      sequence: r.relationship_data?.stop_sequence || 0
    })).filter(item => item.customer).sort((a, b) => a.sequence - b.sequence)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Distribution Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete distribution network with vehicles, routes, and deliveries
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white">
          <TruckIcon className="w-4 h-4 mr-2" />
          New Delivery Order
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Centers</p>
                <p className="text-2xl font-bold mt-1">{distributionCenters.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Warehouse className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vehicles</p>
                <p className="text-2xl font-bold mt-1">{vehicles.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <TruckIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Drivers</p>
                <p className="text-2xl font-bold mt-1">{drivers.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Routes</p>
                <p className="text-2xl font-bold mt-1">{routes.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Route className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Customers</p>
                <p className="text-2xl font-bold mt-1">{customers.length}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Temperature</p>
                <p className="text-2xl font-bold mt-1">-19.5°C</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <Thermometer className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-300">Overview</TabsTrigger>
          <TabsTrigger value="vehicles" className="data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-300">Vehicles</TabsTrigger>
          <TabsTrigger value="routes" className="data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-300">Routes</TabsTrigger>
          <TabsTrigger value="transfers" className="data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-300">Transfers</TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-300">Customers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribution Centers */}
            <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-blue-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="w-5 h-5" />
                  Distribution Centers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {distributionCenters.map((dc) => (
                  <div key={dc.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold">{dc.entity_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dc.metadata?.address}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>Capacity: {dc.metadata?.capacity} units</span>
                      <span>Temp: {dc.metadata?.cold_storage_temp}°C</span>
                      <span>{dc.metadata?.loading_bays} bays</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Active Deliveries Summary */}
            <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-blue-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Deliveries</span>
                    <span className="font-semibold">{activeTransfers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled</span>
                    <span className="font-semibold">{scheduledTransfers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Completed Today</span>
                    <span className="font-semibold">{completedTransfers.filter(t => 
                      new Date(t.transaction_date).toDateString() === new Date().toDateString()
                    ).length}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Distance</span>
                      <span className="font-semibold">135 km</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Fuel Efficiency</span>
                      <span className="font-semibold text-green-600">Good</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => {
              const driver = getDriverForVehicle(vehicle.id)
              const vehicleRoutes = routes.filter(route => 
                getVehiclesForRoute(route.id).some(v => v?.id === vehicle.id)
              )
              
              return (
                <Card key={vehicle.id} className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-blue-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <TruckIcon className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline" className={vehicle.metadata?.vehicle_type === 'refrigerated_truck' ? 'bg-blue-50' : 'bg-purple-50'}>
                        {vehicle.metadata?.vehicle_type === 'refrigerated_truck' ? 'Truck' : 'Van'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{vehicle.entity_code}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {vehicle.metadata?.make} {vehicle.metadata?.model} ({vehicle.metadata?.year})
                    </p>
                    
                    {driver && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{driver.entity_name}</span>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Capacity</span>
                        <span className="font-medium">{vehicle.metadata?.capacity_units} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Temperature</span>
                        <span className="font-medium">{vehicle.metadata?.temperature_range}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Routes</span>
                        <span className="font-medium">{vehicleRoutes.length} assigned</span>
                      </div>
                    </div>

                    {vehicleRoutes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Assigned Routes:</p>
                        {vehicleRoutes.map(route => (
                          <Badge key={route.id} variant="secondary" className="text-xs mr-1">
                            {route.entity_code}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Routes Tab */}
        <TabsContent value="routes" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {routes.map((route) => {
              const routeVehicles = getVehiclesForRoute(route.id) as Entity[]
              const routeCustomers = getCustomersForRoute(route.id)
              
              return (
                <Card key={route.id} className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-blue-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Route className="w-5 h-5 text-orange-500" />
                          {route.entity_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Zone: {route.metadata?.zone} | {route.metadata?.areas?.join(', ')}
                        </p>
                      </div>
                      <Badge className={
                        route.metadata?.priority === 'high' ? 'bg-red-500 text-white' : 
                        route.metadata?.priority === 'medium' ? 'bg-yellow-500 text-white' :
                        'bg-gray-500 text-white'
                      }>
                        {route.metadata?.priority} priority
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Distance</p>
                        <p className="font-semibold">{route.metadata?.distance_km} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                        <p className="font-semibold">{route.metadata?.estimated_hours} hours</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Stops</p>
                        <p className="font-semibold">{route.metadata?.stop_count} stops</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Schedule</p>
                        <p className="font-semibold">{route.metadata?.time_window}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {routeVehicles.length > 0 && (
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2">Assigned Vehicles</p>
                          <div className="flex gap-2">
                            {routeVehicles.map(vehicle => (
                              <Badge key={vehicle.id} variant="outline">
                                <TruckIcon className="w-3 h-3 mr-1" />
                                {vehicle.entity_code}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {routeCustomers.length > 0 && (
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2">Customers ({routeCustomers.length})</p>
                          <div className="space-y-1">
                            {routeCustomers.slice(0, 3).map(({ customer, sequence }) => customer && (
                              <div key={customer.id} className="text-sm flex items-center gap-2">
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                  #{sequence}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {customer.entity_name}
                                </span>
                              </div>
                            ))}
                            {routeCustomers.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{routeCustomers.length - 3} more customers
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit mb-4">
            {(['active', 'scheduled', 'completed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-md font-medium text-sm transition-all",
                  activeTab === tab
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className="ml-2 text-xs">
                  ({tab === 'active' ? activeTransfers.length : 
                    tab === 'scheduled' ? scheduledTransfers.length : 
                    completedTransfers.length})
                </span>
              </button>
            ))}
          </div>

          {loading ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
              <CardContent className="p-12 text-center">
                <div className="animate-pulse">Loading transfer data...</div>
              </CardContent>
            </Card>
          ) : currentTransfers.length === 0 ? (
            <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-blue-200/50 dark:border-blue-800/50">
              <CardContent className="p-12 text-center">
                <TruckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No {activeTab} transfers found</p>
              </CardContent>
            </Card>
          ) : (
            currentTransfers.map((transfer) => {
              const fromLocation = getLocationName(transfer.metadata?.from_location_id)
              const toLocation = getLocationName(transfer.metadata?.to_location_id)
              const temperature = transfer.metadata?.temperature || -19.5
              const tempStatus = getTemperatureStatus(temperature)
              
              return (
                <Card 
                  key={transfer.id}
                  className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <TruckIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{transfer.transaction_code}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{fromLocation}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span>{toLocation}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {activeTab === 'active' && (
                          <Badge className="bg-blue-500 text-white">In Transit</Badge>
                        )}
                        {activeTab === 'scheduled' && (
                          <Badge className="bg-yellow-500 text-white">Scheduled</Badge>
                        )}
                        {activeTab === 'completed' && (
                          <Badge className="bg-green-500 text-white">Delivered</Badge>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items</p>
                      <div className="space-y-1">
                        {transfer.universal_transaction_lines?.slice(0, 3).map((line: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {line.metadata?.product_name || 'Product'}
                            </span>
                            <span className="font-medium">{Math.abs(line.quantity)} units</span>
                          </div>
                        ))}
                        {transfer.universal_transaction_lines?.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{transfer.universal_transaction_lines.length - 3} more items
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Date</p>
                        <p className="text-sm font-medium mt-1">
                          {new Date(transfer.transaction_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Temperature</p>
                        <p className={cn("text-sm font-medium mt-1", tempStatus.color)}>
                          {temperature}°C ({tempStatus.status})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
                        <p className="text-sm font-medium mt-1">
                          {transfer.universal_transaction_lines?.length || 0} SKUs
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Value</p>
                        <p className="text-sm font-medium mt-1">
                          ₹{transfer.metadata?.total_value || '0'}
                        </p>
                      </div>
                    </div>

                    {activeTab === 'active' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Delivery Progress</span>
                          <span className="font-medium">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((customer) => {
              const customerRoute = routes.find(route => 
                getCustomersForRoute(route.id).some(({ customer: c }) => c?.id === customer.id)
              )
              
              return (
                <Card key={customer.id} className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-blue-200/50 dark:border-blue-800/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline">
                        {customer.metadata?.type || 'retail'}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1">{customer.entity_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {customer.metadata?.address}
                    </p>
                    
                    {customer.metadata?.contact_person && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{customer.metadata.contact_person}</span>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{customer.metadata?.contact_phone}</span>
                      </div>
                      {customerRoute && (
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-gray-500" />
                          <span>{customerRoute.entity_code}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span>Credit: ₹{customer.metadata?.credit_limit?.toLocaleString()}</span>
                      </div>
                    </div>

                    {customer.metadata?.special_instructions && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-yellow-500 mt-0.5" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {customer.metadata.special_instructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}