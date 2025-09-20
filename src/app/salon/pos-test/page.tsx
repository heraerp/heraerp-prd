'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { createSalonPOSApi, type ServiceResponse } from '@/lib/playbook/salon-pos-api'
import { toast } from 'sonner'

export default function POSTestPage() {
  const { organization, isAuthenticated } = useHERAAuth()
  const [services, setServices] = useState<ServiceResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const api = organization?.id ? createSalonPOSApi(organization.id) : null

  useEffect(() => {
    if (api) {
      loadServices()
    }
  }, [organization?.id])

  const loadServices = async () => {
    if (!api) return
    setLoading(true)
    try {
      const result = await api.listServices({ status: 'active' })
      setServices(result.items)
    } catch (error) {
      toast.error('Failed to load services')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!api || !newServiceName || !newServicePrice) return

    setLoading(true)
    try {
      const service = await api.createService({
        entity_name: newServiceName,
        price: parseFloat(newServicePrice),
        duration: 60,
        tax_code: 'VAT5',
        category: 'Test Services'
      })
      toast.success(`Created service: ${service.entity_name}`)
      setNewServiceName('')
      setNewServicePrice('')
      loadServices()
    } catch (error) {
      toast.error('Failed to create service')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, newPrice: number) => {
    if (!api) return

    try {
      await api.updateService(id, { price: newPrice })
      toast.success('Updated service price')
      loadServices()
    } catch (error) {
      toast.error('Failed to update service')
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!api) return

    try {
      await api.deleteService(id)
      toast.success('Service archived')
      loadServices()
    } catch (error) {
      toast.error('Failed to archive service')
      console.error(error)
    }
  }

  const handleSearch = async () => {
    if (!api || !searchQuery) {
      loadServices()
      return
    }

    setLoading(true)
    try {
      const results = await api.searchServices(searchQuery)
      setServices(results)
    } catch (error) {
      toast.error('Search failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <div className="p-8">Please log in to test POS CRUD operations</div>
  }

  if (!organization) {
    return <div className="p-8">No organization selected</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Salon POS CRUD Test</h1>
      <p className="text-muted-foreground">Organization: {organization.name}</p>

      {/* Create Service */}
      <Card>
        <CardHeader>
          <CardTitle>Create Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Service name"
              value={newServiceName}
              onChange={e => setNewServiceName(e.target.value)}
            />
            <Input
              placeholder="Price (AED)"
              type="number"
              value={newServicePrice}
              onChange={e => setNewServicePrice(e.target.value)}
            />
            <Button onClick={handleCreate} disabled={loading}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
            <Button variant="outline" onClick={loadServices} disabled={loading}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({services.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : services.length === 0 ? (
            <div className="text-muted-foreground">No services found</div>
          ) : (
            <div className="space-y-2">
              {services.map(service => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <div className="font-medium">{service.entity_name}</div>
                    <div className="text-sm text-muted-foreground">
                      AED {service.price} • {service.duration} min • {service.tax_code}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newPrice = prompt('New price:', String(service.price))
                        if (newPrice) handleUpdate(service.id, parseFloat(newPrice))
                      }}
                    >
                      Update
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Archive this service?')) handleDelete(service.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Test Commands</CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-sm space-y-2">
          <div># Run the test script:</div>
          <div className="bg-muted p-2 rounded">./scripts/test-salon-pos-crud.sh</div>
          <div># Or use curl directly:</div>
          <div className="bg-muted p-2 rounded whitespace-pre">
            {`curl -X POST http://localhost:3000/api/playbook/salon/pos/service/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "orgId": "${organization.id}",
    "smart_code": "HERA.SALON.POS.SERVICE.CREATE.v1",
    "service": {
      "entity_name": "Test Service",
      "price": 100,
      "duration": 60
    }
  }'`}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
