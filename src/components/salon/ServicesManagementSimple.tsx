'use client'
/**
 * Simple Services Management Component
 * Smart Code: HERA.SALON.SERVICES.MANAGEMENT.SIMPLE.v1
 */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2, Scissors, DollarSign, Clock } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  active: boolean
}

export default function ServicesManagementSimple() {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Premium Cut & Style',
      description: 'Professional haircut with styling',
      duration: 60,
      price: 150,
      active: true
    },
    {
      id: '2',
      name: 'Brazilian Blowout',
      description: 'Smooth and straight hair treatment',
      duration: 180,
      price: 450,
      active: true
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 px-6 py-4 backdrop-blur-xl bg-background/80 dark:bg-background/80 border-b border-border dark:border-gray-800 shadow-sm">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Services Management
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground mt-2">
            Manage your salon services and pricing
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <Card className="max-w-[1600px] mx-auto">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle className="text-xl">Services</CardTitle>

              <div className="flex gap-3 items-center w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 sm:w-64"
                  />
                </div>

                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map(service => (
                <div
                  key={service.id}
                  className="group relative bg-background dark:bg-muted border border-border dark:border-border rounded-lg p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-foreground text-lg">
                      {service.name}
                    </h3>
                    {service.active && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-xs">
                        Active
                      </Badge>
                    )}
                  </div>

                  <p className="text-muted-foreground dark:text-muted-foreground text-sm mb-4">
                    {service.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration}m</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-gray-900 dark:text-foreground">
                        AED {service.price}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <Scissors className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">
                  No services found
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Create your first service to get started'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Simple Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <Card className="w-full max-w-md m-4">
            <CardHeader>
              <CardTitle>Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <Input placeholder="e.g., Premium Cut & Style" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (min)</label>
                  <Input type="number" placeholder="60" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Price (AED)</label>
                  <Input type="number" placeholder="150" />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Add Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
