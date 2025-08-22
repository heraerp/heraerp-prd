/**
 * Stock Locations Management Page
 * Manage storage locations for inventory
 */

'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-types'
import { Badge } from '@/components/ui/badge'
import { MapPin, Package, Thermometer, Lock } from 'lucide-react'

export default function StockLocationsPage() {
  const locationTypes = [
    { value: 'STORAGE', label: 'Storage Room' },
    { value: 'DISPLAY', label: 'Display Area' },
    { value: 'TREATMENT', label: 'Treatment Room' },
    { value: 'RETAIL', label: 'Retail Shelf' },
    { value: 'BACKBAR', label: 'Back Bar' },
    { value: 'STATION', label: 'Styling Station' },
    { value: 'RECEPTION', label: 'Reception Area' },
    { value: 'OFFICE', label: 'Office' }
  ]

  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.STOCK_LOCATION}
        apiEndpoint="/api/v1/salon/stock-locations"
        additionalFields={[
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            defaultValue: '',
            placeholder: 'Additional details about this location'
          },
          {
            name: 'location_type',
            label: 'Location Type',
            type: 'select',
            options: locationTypes,
            required: true,
            defaultValue: 'STORAGE'
          },
          {
            name: 'capacity',
            label: 'Storage Capacity',
            type: 'number',
            defaultValue: 100,
            min: 0,
            placeholder: 'Maximum number of items',
            helpText: 'Maximum number of different products this location can hold'
          },
          {
            name: 'temperature_controlled',
            label: 'Temperature Controlled',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Location has climate control for sensitive products'
          },
          {
            name: 'temperature_range',
            label: 'Temperature Range',
            type: 'text',
            defaultValue: '',
            placeholder: 'e.g., 15-25°C',
            helpText: 'Specify if temperature controlled'
          },
          {
            name: 'restricted_access',
            label: 'Restricted Access',
            type: 'checkbox',
            defaultValue: false,
            helpText: 'Only authorized staff can access this location'
          },
          {
            name: 'manager_id',
            label: 'Location Manager',
            type: 'text',
            defaultValue: '',
            placeholder: 'Staff member responsible',
            helpText: 'Staff member responsible for this location'
          },
          {
            name: 'physical_address',
            label: 'Physical Location',
            type: 'text',
            defaultValue: '',
            placeholder: 'e.g., Room 101, Shelf A3',
            helpText: 'Specific physical location details'
          }
        ]}
        customColumns={[
          {
            key: 'type',
            header: 'Type',
            render: (item) => (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {locationTypes.find(t => t.value === item.location_type)?.label || item.location_type || 'General'}
                </span>
              </div>
            )
          },
          {
            key: 'capacity_status',
            header: 'Capacity',
            render: (item) => {
              const capacity = item.capacity || 100
              // Mock current usage
              const currentUsage = Math.floor(Math.random() * capacity)
              const percentage = (currentUsage / capacity) * 100
              
              return (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm">{currentUsage}/{capacity}</span>
                  </div>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        percentage > 90 ? 'bg-destructive' : 
                        percentage > 70 ? 'bg-amber-500' : 
                        'bg-primary'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            }
          },
          {
            key: 'features',
            header: 'Features',
            render: (item) => (
              <div className="flex gap-2">
                {item.temperature_controlled && (
                  <div className="flex items-center gap-1" title="Temperature Controlled">
                    <Thermometer className="w-3 h-3 text-blue-600" />
                    <span className="text-xs text-blue-600">{item.temperature_range || 'Controlled'}</span>
                  </div>
                )}
                {item.restricted_access && (
                  <div className="flex items-center gap-1" title="Restricted Access">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span className="text-xs text-amber-600">Restricted</span>
                  </div>
                )}
              </div>
            )
          },
          {
            key: 'location',
            header: 'Location',
            render: (item) => (
              <span className="text-sm text-muted-foreground">
                {item.physical_address || 'Not specified'}
              </span>
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Storage Overview',
          metrics: [
            {
              label: 'Total Locations',
              value: (items) => items.length
            },
            {
              label: 'Temperature Controlled',
              value: (items) => items.filter(item => item.temperature_controlled).length
            },
            {
              label: 'Restricted Access',
              value: (items) => items.filter(item => item.restricted_access).length
            }
          ]
        }}
      />
    </div>
  )
}