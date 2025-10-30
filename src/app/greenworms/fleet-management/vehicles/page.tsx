'use client'

/**
 * Greenworms ERP - Fleet Vehicles Management
 * Modern SAP S/4HANA inspired design with real HERA data
 * 
 * Module: FLEET_MANAGEMENT
 * Entity: VEHICLE
 * Smart Code: HERA.WASTE.FLEET.ENTITY.VEHICLE.v1
 * Description: Comprehensive fleet vehicle management with enterprise-grade design
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import GreenwormNavbar from '@/components/greenworms/GreenwormNavbar'
import { 
  AlertCircle,
  ChevronDown,
  Download,
  Edit2,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Trash2,
  Truck,
  Upload,
  X,
  CheckCircle,
  Clock,
  Wrench,
  MapPin,
  User,
  Calendar,
  Fuel,
  Gauge,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react'

/**
 * Vehicle Entity Interface with Dynamic Fields
 */
interface Vehicle {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  
  // Dynamic fields from core_dynamic_data
  vehicle_type?: string
  registration_no?: string
  vin?: string
  make?: string
  model?: string
  year?: number
  fuel_type?: string
  capacity_tons?: string
  odometer?: string
  license_plate?: string
  assigned_route?: string
  assigned_driver?: string
  last_maintenance?: string
  next_maintenance?: string
  insurance_expiry?: string
  gps_enabled?: boolean
  emissions_compliant?: boolean
}

/**
 * Vehicle Type Icons and Colors
 */
const getVehicleTypeConfig = (type: string) => {
  const configs = {
    'Rear Load Compactor': { icon: Truck, color: '#dc2626', bg: 'bg-red-50' },
    'Side Load Compactor': { icon: Truck, color: '#ea580c', bg: 'bg-orange-50' },
    'Hook Lift Truck': { icon: Truck, color: '#0891b2', bg: 'bg-cyan-50' },
    'Street Sweeper': { icon: Truck, color: '#7c3aed', bg: 'bg-purple-50' },
    'Roll-off Container Truck': { icon: Truck, color: '#059669', bg: 'bg-emerald-50' },
    'Recycling Compactor': { icon: Truck, color: '#16a34a', bg: 'bg-green-50' },
    'Flatbed Truck': { icon: Truck, color: '#0f766e', bg: 'bg-teal-50' },
    'Tipper Truck': { icon: Truck, color: '#4338ca', bg: 'bg-indigo-50' },
    'default': { icon: Truck, color: '#6b7280', bg: 'bg-gray-50' }
  }
  return configs[type as keyof typeof configs] || configs.default
}

/**
 * Status Badge Colors
 */
const getStatusBadge = (status: string) => {
  const styles = {
    active: 'bg-green-100 text-green-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800'
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.inactive}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  )
}

/**
 * Greenworms Fleet Vehicles - Modern SAP Style
 */
export default function VehiclesPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedVehicles, setSelectedVehicles] = useState(new Set<string>())
  const [showFilters, setShowFilters] = useState(false)
  const [sortConfig, setSortConfig] = useState({ key: 'entity_name', direction: 'asc' })
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Redirect to Greenworms login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/greenworms/login')
    }
  }, [isAuthenticated, router])

  // Use the universal entity hook
  const {
    entities: vehicles,
    loading,
    error,
    refresh
  } = useUniversalEntity({
    entityType: 'VEHICLE',
    organizationId: currentOrganization?.id,
    includeRelationships: false,
    includeDynamicData: true
  }) as { entities: Vehicle[], loading: boolean, error: any, refresh: () => void }

  // Filter and sort vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles.filter(v => {
      const matchesSearch = 
        v.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.registration_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.make?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter
      const matchesType = typeFilter === 'all' || v.vehicle_type === typeFilter
      
      return matchesSearch && matchesStatus && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      let aVal = (a as any)[sortConfig.key] || ''
      let bVal = (b as any)[sortConfig.key] || ''
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [vehicles, searchTerm, statusFilter, typeFilter, sortConfig])

  // Get unique vehicle types for filter dropdown
  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.vehicle_type).filter(Boolean)))

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const handleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicles.length) {
      setSelectedVehicles(new Set())
    } else {
      setSelectedVehicles(new Set(filteredVehicles.map(v => v.id)))
    }
  }

  const handleSelectVehicle = (id: string) => {
    const newSelected = new Set(selectedVehicles)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVehicles(newSelected)
  }

  // Calculate stats
  const stats = {
    total: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    inactive: vehicles.filter(v => v.status === 'inactive').length
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Redirecting to Login</h2>
          <p className="text-gray-600">Please wait while we redirect you to the Greenworms login page.</p>
        </div>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Required</h2>
          <p className="text-gray-600">Please select an organization to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enterprise Navigation */}
      <GreenwormNavbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                Fleet Vehicles
              </h1>
              <p className="text-sm text-gray-500 mt-1">Master Data Management • Waste Management Fleet</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={20} />
              <span>Add Vehicle</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-sm text-blue-600">Total Vehicles</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-900">{stats.active}</div>
              <div className="text-sm text-green-600">Active</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-900">{stats.maintenance}</div>
              <div className="text-sm text-yellow-600">In Maintenance</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by vehicle name, license plate, registration, or VIN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Types</option>
              {vehicleTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
            </button>

            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={20} />
            </button>

            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Upload size={20} />
            </button>

            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Selection toolbar */}
        {selectedVehicles.size > 0 && (
          <div className="px-6 py-3 bg-green-50 border-t border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-green-900">
                {selectedVehicles.size} vehicle{selectedVehicles.size > 1 ? 's' : ''} selected
              </span>
              <button className="text-sm text-green-600 hover:text-green-800">
                Export Selected
              </button>
              <button className="text-sm text-green-600 hover:text-green-800">
                Bulk Update
              </button>
              <button className="text-sm text-red-600 hover:text-red-800">
                Delete Selected
              </button>
            </div>
            <button
              onClick={() => setSelectedVehicles(new Set())}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading vehicles...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700">Error loading vehicles: {error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="p-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedVehicles.size === filteredVehicles.length && filteredVehicles.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('registration_no')}
                    >
                      Registration {sortConfig.key === 'registration_no' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('entity_name')}
                    >
                      Vehicle {sortConfig.key === 'entity_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      License Plate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Make/Model
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned Route
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVehicles.map((vehicle) => {
                    const typeConfig = getVehicleTypeConfig(vehicle.vehicle_type || '')
                    const TypeIcon = typeConfig.icon

                    return (
                      <tr key={vehicle.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedVehicles.has(vehicle.id)}
                            onChange={() => handleSelectVehicle(vehicle.id)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-green-600">{vehicle.registration_no}</div>
                          <div className="text-xs text-gray-500">{vehicle.id}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeConfig.bg}`}>
                              <TypeIcon size={16} style={{ color: typeConfig.color }} />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{vehicle.entity_name}</div>
                              <div className="text-xs text-gray-500">VIN: {vehicle.vin}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {vehicle.vehicle_type}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-mono text-gray-900">{vehicle.license_plate}</div>
                          <div className="text-xs text-gray-500">{vehicle.fuel_type}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {vehicle.make} {vehicle.model}
                          <div className="text-xs text-gray-500">Year: {vehicle.year}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {vehicle.capacity_tons} tons
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(vehicle.status || '')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{vehicle.assigned_route}</div>
                          <div className="text-xs text-gray-500">{vehicle.assigned_driver}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500">
                          {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedVehicle(vehicle)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredVehicles.length}</span> of{' '}
                <span className="font-medium">{vehicles.length}</span> vehicles
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                  Previous
                </button>
                <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">1</button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredVehicles.length === 0 && (
        <div className="p-6">
          <div className="text-center py-12">
            <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by adding your first vehicle.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Add Vehicle
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedVehicle.entity_name}</h2>
                <p className="text-sm text-gray-500">{selectedVehicle.registration_no}</p>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg ${
                selectedVehicle.status === 'active' ? 'bg-green-50' :
                selectedVehicle.status === 'maintenance' ? 'bg-yellow-50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Vehicle Status</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedVehicle.status === 'active' && 'Vehicle is operational and ready for routes'}
                      {selectedVehicle.status === 'maintenance' && 'Vehicle is currently under maintenance'}
                      {selectedVehicle.status === 'inactive' && 'Vehicle is not in service'}
                    </div>
                  </div>
                  {getStatusBadge(selectedVehicle.status || '')}
                </div>
              </div>

              {/* Vehicle Information Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Vehicle Type</div>
                      <div className="text-sm font-medium text-gray-900">{selectedVehicle.vehicle_type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">License Plate</div>
                      <div className="text-sm font-medium font-mono text-gray-900">{selectedVehicle.license_plate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">VIN</div>
                      <div className="text-sm font-medium font-mono text-gray-900">{selectedVehicle.vin}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Make & Model</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedVehicle.make} {selectedVehicle.model}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Year</div>
                      <div className="text-sm font-medium text-gray-900">{selectedVehicle.year}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Specifications</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500">Fuel Type</div>
                      <div className="text-sm font-medium text-gray-900">{selectedVehicle.fuel_type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Capacity</div>
                      <div className="text-sm font-medium text-gray-900">{selectedVehicle.capacity_tons} tons</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Odometer</div>
                      <div className="text-sm font-medium text-gray-900">{selectedVehicle.odometer} km</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">GPS Enabled</div>
                      <div className="flex items-center gap-1">
                        {selectedVehicle.gps_enabled ? (
                          <Wifi className="w-4 h-4 text-green-600" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {selectedVehicle.gps_enabled ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">Emissions Compliant</div>
                      <div className="flex items-center gap-1">
                        {selectedVehicle.emissions_compliant ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          {selectedVehicle.emissions_compliant ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Assignment</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Assigned Route</div>
                        <div className="text-sm font-medium text-gray-900">{selectedVehicle.assigned_route}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Assigned Driver</div>
                        <div className="text-sm font-medium text-gray-900">{selectedVehicle.assigned_driver}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Maintenance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Last Maintenance</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedVehicle.last_maintenance ? new Date(selectedVehicle.last_maintenance).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Next Maintenance</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedVehicle.next_maintenance ? new Date(selectedVehicle.next_maintenance).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Insurance Expiry</div>
                        <div className="text-sm font-medium text-gray-900">
                          {selectedVehicle.insurance_expiry ? new Date(selectedVehicle.insurance_expiry).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Trail (HERA v2.2) */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Audit Trail</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">Created By</div>
                    <div className="font-medium text-gray-900">User {selectedVehicle.created_by}</div>
                    <div className="text-xs text-gray-500">
                      {selectedVehicle.created_at ? new Date(selectedVehicle.created_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Last Updated By</div>
                    <div className="font-medium text-gray-900">User {selectedVehicle.updated_by}</div>
                    <div className="text-xs text-gray-500">
                      {selectedVehicle.updated_at ? new Date(selectedVehicle.updated_at).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Smart Code (HERA v2.2) */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Smart Code DNA</h3>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {selectedVehicle.smart_code}
                </code>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Edit Vehicle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Spacing for Mobile */}
      <div className="h-24 md:h-0" />
    </div>
  )
}