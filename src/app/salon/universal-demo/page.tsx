'use client'
import React from 'react'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { Trash2, Plus, Package, Users, Briefcase, Scissors } from 'lucide-react'

/**
 * DEMO: Using the Universal API to manage ANY entity type
 * This single page can handle products, services, customers, vendors - anything!
 */
export default function UniversalDemoPage() {
  const { toast } = useToast()

  // Different entity configurations - same hook!
  const products = useUniversalEntity({ entity_type: 'product' })
  const services = useUniversalEntity({ entity_type: 'service' })
  const customers = useUniversalEntity({ entity_type: 'customer' })
  const vendors = useUniversalEntity({ entity_type: 'vendor' })

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    brand: ''
  })

  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration: '',
    price: ''
  })

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: ''
  })

  // Create product
  const handleCreateProduct = async () => {
    try {
      await products.create({
        entity_type: 'product',
        entity_name: productForm.name,
        smart_code: 'HERA.SALON.CATALOG.PRODUCT.RETAIL.V1',
        dynamic_fields: {
          price: {
            value: parseFloat(productForm.price),
            type: 'number',
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.PRICE.V1'
          },
          brand: {
            value: productForm.brand,
            type: 'text',
            smart_code: 'HERA.SALON.CATALOG.PRODUCT.FIELD.BRAND.V1'
          }
        }
      })

      toast({ title: 'Product created!', description: `${productForm.name} added successfully` })
      setProductForm({ name: '', price: '', brand: '' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Create service
  const handleCreateService = async () => {
    try {
      await services.create({
        entity_type: 'service',
        entity_name: serviceForm.name,
        smart_code: 'HERA.SALON.CATALOG.SERVICE.CHAIRTIME.V1',
        dynamic_fields: {
          duration_minutes: {
            value: parseInt(serviceForm.duration),
            type: 'number',
            smart_code: 'HERA.SALON.CATALOG.SERVICE.FIELD.DURATION.V1'
          },
          price: {
            value: parseFloat(serviceForm.price),
            type: 'number',
            smart_code: 'HERA.SALON.CATALOG.SERVICE.FIELD.PRICE.V1'
          }
        }
      })

      toast({ title: 'Service created!', description: `${serviceForm.name} added successfully` })
      setServiceForm({ name: '', duration: '', price: '' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  // Create customer
  const handleCreateCustomer = async () => {
    try {
      await customers.create({
        entity_type: 'customer',
        entity_name: customerForm.name,
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        dynamic_fields: {
          email: {
            value: customerForm.email,
            type: 'text',
            smart_code: 'HERA.SALON.CRM.CUSTOMER.FIELD.EMAIL.V1'
          },
          phone: {
            value: customerForm.phone,
            type: 'text',
            smart_code: 'HERA.SALON.CRM.CUSTOMER.FIELD.PHONE.V1'
          }
        }
      })

      toast({ title: 'Customer created!', description: `${customerForm.name} added successfully` })
      setCustomerForm({ name: '', email: '', phone: '' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Universal Entity Management</h1>
        <p className="text-muted-foreground mt-2">
          One API, One Hook, Infinite Possibilities - Build ANY entity type with the same pattern!
        </p>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="services">
            <Scissors className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="customers">
            <Users className="h-4 w-4 mr-2" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Briefcase className="h-4 w-4 mr-2" />
            Vendors
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Add and manage salon products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="product-name">Product Name</Label>
                    <Input
                      id="product-name"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Professional Shampoo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-price">Price (AED)</Label>
                    <Input
                      id="product-price"
                      type="number"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="89.99"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product-brand">Brand</Label>
                    <Input
                      id="product-brand"
                      value={productForm.brand}
                      onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                      placeholder="HERA Professional"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateProduct}
                  disabled={!productForm.name || products.isCreating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {products.isCreating ? 'Creating...' : 'Add Product'}
                </Button>

                <div className="mt-6 space-y-2">
                  {products.isLoading ? (
                    <p className="text-muted-foreground">Loading products...</p>
                  ) : products.entities.length === 0 ? (
                    <p className="text-muted-foreground">No products yet. Create one above!</p>
                  ) : (
                    products.entities.map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <h4 className="font-medium">{product.entity_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {product.entity_code} • AED {product.dynamic_data?.price || 0}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => products.archive(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Management</CardTitle>
              <CardDescription>Add and manage salon services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      value={serviceForm.name}
                      onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="Hair Cut & Style"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-duration">Duration (minutes)</Label>
                    <Input
                      id="service-duration"
                      type="number"
                      value={serviceForm.duration}
                      onChange={e => setServiceForm({ ...serviceForm, duration: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-price">Price (AED)</Label>
                    <Input
                      id="service-price"
                      type="number"
                      value={serviceForm.price}
                      onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateService}
                  disabled={!serviceForm.name || services.isCreating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {services.isCreating ? 'Creating...' : 'Add Service'}
                </Button>

                <div className="mt-6 space-y-2">
                  {services.isLoading ? (
                    <p className="text-muted-foreground">Loading services...</p>
                  ) : services.entities.length === 0 ? (
                    <p className="text-muted-foreground">No services yet. Create one above!</p>
                  ) : (
                    services.entities.map((service: any) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <h4 className="font-medium">{service.entity_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.dynamic_data?.duration_minutes || 0} min • AED{' '}
                            {service.dynamic_data?.price || 0}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => services.archive(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
              <CardDescription>Add and manage salon customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input
                      id="customer-name"
                      value={customerForm.name}
                      onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-email">Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerForm.email}
                      onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer-phone">Phone</Label>
                    <Input
                      id="customer-phone"
                      value={customerForm.phone}
                      onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      placeholder="+971 50 123 4567"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleCreateCustomer}
                  disabled={!customerForm.name || customers.isCreating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {customers.isCreating ? 'Creating...' : 'Add Customer'}
                </Button>

                <div className="mt-6 space-y-2">
                  {customers.isLoading ? (
                    <p className="text-muted-foreground">Loading customers...</p>
                  ) : customers.entities.length === 0 ? (
                    <p className="text-muted-foreground">No customers yet. Create one above!</p>
                  ) : (
                    customers.entities.map((customer: any) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <h4 className="font-medium">{customer.entity_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {customer.dynamic_data?.email} • {customer.dynamic_data?.phone}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => customers.archive(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
              <CardDescription>Coming soon - Same pattern, different entity type!</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The beauty of the universal API - adding vendor support is just a matter of defining
                the entity type and smart codes!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🚀 The Power of Universal Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">One API for Everything</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Same endpoint handles products, services, customers, vendors</li>
                <li>• No need to create separate APIs for each entity type</li>
                <li>• Dynamic fields mean no schema changes ever</li>
                <li>• Smart codes provide business context automatically</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Build 10x Faster</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• One React hook works for ANY entity type</li>
                <li>• Copy-paste UI components between features</li>
                <li>• No backend changes needed for new fields</li>
                <li>• Production-ready with built-in multi-tenancy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
