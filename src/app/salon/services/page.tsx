'use client'

import React from 'react'
import { useSalonContext } from '../SalonProvider'
import { useServicesPlaybook } from '@/hooks/useServicesPlaybook'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Loader2 } from 'lucide-react'
import { LUXE_COLORS } from '@/lib/constants/salon'

export default function SalonServicesPage() {
  const { organizationId, role, isLoading: authLoading, isAuthenticated } = useSalonContext()
  const [searchQuery, setSearchQuery] = React.useState('')

  // Fetch services data
  const {
    items: services,
    isLoading,
    error
  } = useServicesPlaybook({
    organizationId,
    query: searchQuery,
    status: 'active',
    page: 1,
    pageSize: 50
  })

  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: LUXE_COLORS.charcoal }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: LUXE_COLORS.gold }} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: LUXE_COLORS.charcoal }}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light mb-2" style={{ color: LUXE_COLORS.gold }}>
            Services
          </h1>
          <p className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
            Manage your salon services and pricing
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
              style={{ color: LUXE_COLORS.bronze }}
            />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                backgroundColor: LUXE_COLORS.charcoalLight,
                border: `1px solid ${LUXE_COLORS.bronze}30`,
                color: LUXE_COLORS.champagne
              }}
            />
          </div>

          <Button
            className="gap-2"
            style={{
              backgroundColor: LUXE_COLORS.gold,
              color: LUXE_COLORS.black
            }}
          >
            <Plus className="h-4 w-4" />
            New Service
          </Button>
        </div>

        {/* Services List */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: LUXE_COLORS.charcoalLight,
            border: `1px solid ${LUXE_COLORS.bronze}30`
          }}
        >
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2
                className="h-8 w-8 animate-spin mx-auto"
                style={{ color: LUXE_COLORS.gold }}
              />
            </div>
          ) : error ? (
            <div className="p-8 text-center" style={{ color: LUXE_COLORS.bronze }}>
              Error loading services
            </div>
          ) : services.length === 0 ? (
            <div className="p-8 text-center" style={{ color: LUXE_COLORS.bronze }}>
              No services found
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: `${LUXE_COLORS.bronze}20` }}>
              {services.map(service => (
                <div
                  key={service.id}
                  className="p-4 hover:bg-black/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium" style={{ color: LUXE_COLORS.champagne }}>
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm mt-1" style={{ color: LUXE_COLORS.bronze }}>
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium" style={{ color: LUXE_COLORS.gold }}>
                        AED {service.price?.toFixed(2)}
                      </div>
                      <div className="text-sm" style={{ color: LUXE_COLORS.bronze }}>
                        {service.duration} min
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 text-sm" style={{ color: LUXE_COLORS.bronze }}>
          Organization: {organizationId} • Role: {role}
        </div>
      </div>
    </div>
  )
}
