// ================================================================================
// HERA POS SERVICE SELECTOR
// Smart Code: HERA.UI.POS.SERVICE_SELECTOR.v1
// Service selection with categories and search
// ================================================================================

'use client'

import { useState } from 'react'
import { Search, Clock } from 'lucide-react'
import { useCartStore } from '@/lib/hooks/usePos'
import { ServicePrice } from '@/lib/schemas/pos'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ServiceSelectorProps {
  services: ServicePrice[]
}

export function ServiceSelector({ services }: ServiceSelectorProps) {
  const [search, setSearch] = useState('')
  const addService = useCartStore(state => state.addService)

  // Group services by category
  const categories = Array.from(new Set(services.map(s => s.category || 'Other')))
  const servicesByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = services.filter(s => (s.category || 'Other') === category)
      return acc
    },
    {} as Record<string, ServicePrice[]>
  )

  // Filter services by search
  const filteredServices = (categoryServices: ServicePrice[]) => {
    if (!search) return categoryServices
    return categoryServices.filter(
      service =>
        service.service_name.toLowerCase().includes(search.toLowerCase()) ||
        service.service_code.toLowerCase().includes(search.toLowerCase())
    )
  }

  const handleAddService = (service: ServicePrice) => {
    addService({
      kind: 'service',
      service_code: service.service_code,
      service_name: service.service_name,
      qty: 1,
      unit_price: service.price,
      duration_min: service.duration_min
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`
  }

  const ServiceCard = ({ service }: { service: ServicePrice }) => (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleAddService(service)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-800">{service.service_name}</h4>
        <Badge variant="secondary" className="bg-primary text-white">
          AED {service.price}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-sm ink-muted">
        <span className="font-mono">{service.service_code}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(service.duration_min)}</span>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 ink-muted h-4 w-4" />
        <Input
          type="search"
          placeholder="Search services..."
          className="pl-10"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {search ? (
        // Show all filtered results when searching
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services
            .filter(
              service =>
                service.service_name.toLowerCase().includes(search.toLowerCase()) ||
                service.service_code.toLowerCase().includes(search.toLowerCase())
            )
            .map(service => (
              <ServiceCard key={service.service_code} service={service} />
            ))}
          {services.filter(
            service =>
              service.service_name.toLowerCase().includes(search.toLowerCase()) ||
              service.service_code.toLowerCase().includes(search.toLowerCase())
          ).length === 0 && (
            <p className="ink-muted col-span-2 text-center py-8">
              No services found matching "{search}"
            </p>
          )}
        </div>
      ) : (
        // Show categorized view when not searching
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList
            className="grid w-full"
            style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
          >
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map(category => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {servicesByCategory[category].map(service => (
                  <ServiceCard key={service.service_code} service={service} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
