'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Plus, Trash2, Package, Calendar, User, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import { useUniversalData } from '@/lib/dna/patterns/universal-api-loading-pattern'

interface OrderLine {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export default function NewProductionOrderPage() {
  const router = useRouter()
  const { organizationId, orgLoading } = useDemoOrganization()

  const [formData, setFormData] = useState({
    customerId: '',
    deliveryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    priority: 'normal',
    notes: ''
  })

  const [orderLines, setOrderLines] = useState<OrderLine[]>([])

  // Load customers
  const { data: customers } = useUniversalData({
    table: 'core_entities',
    filter: item => item.entity_type === 'customer' && item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Load products
  const { data: products } = useUniversalData({
    table: 'core_entities',
    filter: item => item.entity_type === 'product' && item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const addOrderLine = () => {
    const newLine: OrderLine = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      lineTotal: 0
    }
    setOrderLines([...orderLines, newLine])
  }

  const removeOrderLine = (id: string) => {
    setOrderLines(orderLines.filter(line => line.id !== id))
  }

  const updateOrderLine = (id: string, field: keyof OrderLine, value: any) => {
    setOrderLines(
      orderLines.map(line => {
        if (line.id === id) {
          const updatedLine = { ...line, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updatedLine.lineTotal = updatedLine.quantity * updatedLine.unitPrice
          }
          return updatedLine
        }
        return line
      })
    )
  }

  const totalAmount = orderLines.reduce((sum, line) => sum + line.lineTotal, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Creating production order:', { formData, orderLines, totalAmount })
    router.push('/furniture/production/orders')
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-body)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-indigo)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/furniture/production/orders"
            className="p-2 hover:bg-[var(--color-body)] rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--color-icon-secondary)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              New Production Order
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Create a new production order for customer
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6">
          <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-4">
            Order Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.customerId}
                onValueChange={value => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={formData.deliveryDate}
                onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Special instructions or notes for this order..."
              />
            </div>
          </div>
        </Card>

        {/* Order Lines */}
        <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Order Items</h3>
            <Button type="button" onClick={addOrderLine}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {orderLines.length === 0 ? (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                No items added yet. Click "Add Item" to start building your order.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {orderLines.map(line => (
                <div key={line.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-4">
                    <Label>Product</Label>
                    <Select
                      value={line.productId}
                      onValueChange={value => {
                        const product = products?.find(p => p.id === value)
                        updateOrderLine(line.id, 'productId', value)
                        updateOrderLine(line.id, 'productName', product?.entity_name || '')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.entity_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={line.quantity}
                      onChange={e =>
                        updateOrderLine(line.id, 'quantity', parseInt(e.target.value) || 0)
                      }
                      min="1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      value={line.unitPrice}
                      onChange={e =>
                        updateOrderLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Line Total</Label>
                    <Input
                      type="text"
                      value={`₹${line.lineTotal.toFixed(2)}`}
                      readOnly
                      className="bg-[var(--color-body)]"
                    />
                  </div>

                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOrderLine(line.id)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!formData.customerId || orderLines.length === 0}
            className="bg-[var(--color-accent-indigo)] hover:bg-amber-700"
          >
            Create Production Order
          </Button>
        </div>
      </form>
    </div>
  )
}
