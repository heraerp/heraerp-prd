'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, ShoppingCart, User } from 'lucide-react'

interface SalesOrderLine {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface SalesOrderFormProps {
  onSubmit: (data: any) => void
  loading?: boolean
}

export function SalesOrderForm({ onSubmit, loading = false }: SalesOrderFormProps) {
  const [customerCode, setCustomerCode] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [lines, setLines] = useState<SalesOrderLine[]>([])

  const addLine = () => {
    const newLine: SalesOrderLine = {
      id: Date.now().toString(),
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    }
    setLines([...lines, newLine])
  }

  const removeLine = (lineId: string) => {
    setLines(lines.filter(line => line.id !== lineId))
  }

  const updateLine = (lineId: string, field: keyof SalesOrderLine, value: any) => {
    setLines(lines.map(line => {
      if (line.id === lineId) {
        const updatedLine = { ...line, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updatedLine.totalPrice = updatedLine.quantity * updatedLine.unitPrice
        }
        return updatedLine
      }
      return line
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = {
      customerCode,
      orderDate,
      lines,
      totalAmount: lines.reduce((sum, line) => sum + line.totalPrice, 0)
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Sales Order Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select onValueChange={setCustomerCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUST001">Customer 1</SelectItem>
                  <SelectItem value="CUST002">Customer 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="orderDate">Order Date</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button type="button" onClick={addLine} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Line
            </Button>

            {lines.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Input
                          placeholder="Product name"
                          value={line.productName}
                          onChange={(e) => updateLine(line.id, 'productName', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(line.id, 'unitPrice', Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{line.totalPrice.toFixed(2)} AED</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeLine(line.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Sales Order'}
        </Button>
      </div>
    </form>
  )
}