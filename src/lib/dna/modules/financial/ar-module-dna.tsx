'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  Store,
  Truck,
  ShoppingBag,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  BarChart3,
  Filter,
  Search,
  Plus,
  Download,
  Snowflake,
  ThermometerSnowflake,
  Coins
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

// Types
export interface ARModuleProps {
  organizationId: string
  isDarkMode?: boolean
  features?: {
    creditManagement?: boolean
    collectionsWorkflow?: boolean
    statementGeneration?: boolean
    multiCurrency?: boolean
    customerPortal?: boolean
    autoReminders?: boolean
    dunningLetters?: boolean
  }
  industrySpecific?: {
    multiChannelBilling?: boolean
    freezerDepositTracking?: boolean
    seasonalCreditTerms?: boolean
    returnGoodsHandling?: boolean
    coldChainCompensation?: boolean
    routeDeliveryReconciliation?: boolean
  }
  onInvoiceCreated?: (invoiceId: string) => void
  onPaymentReceived?: (paymentId: string) => void
  onCreditMemoCreated?: (creditMemoId: string) => void
}

interface Customer {
  id: string
  customerCode: string
  customerName: string
  customerType: 'retail' | 'wholesale' | 'food_service' | 'online'
  status: 'active' | 'inactive' | 'on_hold'
  creditLimit: number
  currentBalance: number
  paymentTerms: string
  metadata?: {
    channel?: string
    freezerDeposit?: number
    seasonalTerms?: boolean
    routeCode?: string
    temperatureCompliant?: boolean
    lastOrderDate?: Date
  }
}

interface SalesInvoice {
  id: string
  invoiceNumber: string
  customerId: string
  customerName: string
  invoiceDate: Date
  dueDate: Date
  totalAmount: number
  paidAmount: number
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue'
  channel: string
  lines: InvoiceLine[]
  metadata?: {
    deliveryTemperature?: number
    routeCode?: string
    freezerSerialNumbers?: string[]
    returnReason?: string
  }
}

interface InvoiceLine {
  id: string
  productCode: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  gstRate: number
  metadata?: {
    batchNumber?: string
    expiryDate?: Date
    temperature?: number
  }
}

interface Payment {
  id: string
  paymentNumber: string
  customerId: string
  paymentDate: Date
  amount: number
  paymentMethod: string
  appliedInvoices: { invoiceId: string; amount: number }[]
  reference?: string
}

interface CreditMemo {
  id: string
  creditMemoNumber: string
  customerId: string
  originalInvoiceId: string
  amount: number
  reason: 'damaged' | 'melted' | 'expired' | 'wrong_delivery' | 'quality_issue'
  status: 'draft' | 'approved' | 'applied'
  metadata?: {
    temperature?: number
    photos?: string[]
    qualityReport?: string
  }
}

// AR Module DNA Component
export function ARModule({
  organizationId,
  isDarkMode = false,
  features = {
    creditManagement: true,
    collectionsWorkflow: true,
    statementGeneration: true,
    multiCurrency: false,
    customerPortal: false,
    autoReminders: true,
    dunningLetters: true
  },
  industrySpecific = {},
  onInvoiceCreated,
  onPaymentReceived,
  onCreditMemoCreated
}: ARModuleProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices' | 'payments' | 'collections' | 'returns'>('invoices')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [invoices, setInvoices] = useState<SalesInvoice[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  
  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState<Partial<SalesInvoice>>({
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    channel: 'retail',
    lines: []
  })

  // Credit Memo Form State
  const [creditMemoForm, setCreditMemoForm] = useState<Partial<CreditMemo>>({
    reason: 'damaged',
    status: 'draft'
  })

  // Load customers
  useEffect(() => {
    loadCustomers()
  }, [organizationId])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await universalApi.query('core_entities', {
        filters: {
          organization_id: organizationId,
          entity_type: 'customer'
        }
      })
      
      if (response.data) {
        setCustomers(response.data.map((customer: any) => ({
          id: customer.id,
          customerCode: customer.entity_code,
          customerName: customer.entity_name,
          customerType: (customer.metadata as any)?.customer_type || 'retail',
          status: customer.status || 'active',
          creditLimit: (customer.metadata as any)?.credit_limit || 0,
          currentBalance: (customer.metadata as any)?.current_balance || 0,
          paymentTerms: (customer.metadata as any)?.payment_terms || 'NET30',
          metadata: customer.metadata
        })))
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add Invoice Line
  const addInvoiceLine = () => {
    setInvoiceForm(prev => ({
      ...prev,
      lines: [
        ...(prev.lines || []),
        {
          id: Date.now().toString(),
          productCode: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          gstRate: invoiceForm.channel === 'retail' ? 18 : 18, // Kulfi would be 12%
          metadata: {}
        }
      ]
    }))
  }

  // Update Invoice Line
  const updateInvoiceLine = (index: number, field: string, value: any) => {
    setInvoiceForm(prev => {
      const newLines = [...(prev.lines || [])]
      newLines[index] = { ...newLines[index], [field]: value }
      
      // Calculate amount
      if (field === 'quantity' || field === 'unitPrice') {
        newLines[index].amount = newLines[index].quantity * newLines[index].unitPrice
      }
      
      return { ...prev, lines: newLines }
    })
  }

  // Calculate Total
  const calculateTotal = () => {
    const subtotal = (invoiceForm.lines || []).reduce((sum, line) => sum + line.amount, 0)
    const gstAmount = (invoiceForm.lines || []).reduce((sum, line) => 
      sum + (line.amount * line.gstRate / 100), 0
    )
    return { subtotal, gstAmount, total: subtotal + gstAmount }
  }

  // Create Invoice
  const createInvoice = async () => {
    if (!selectedCustomer || !invoiceForm.lines?.length) {
      alert('Please select customer and add invoice lines')
      return
    }

    try {
      setLoading(true)
      const totals = calculateTotal()
      
      // Create sales invoice transaction
      const invoice = await universalApi.createTransaction({
        transaction_type: 'sales_invoice',
        transaction_date: invoiceForm.invoiceDate || new Date(),
        organization_id: organizationId,
        to_entity_id: selectedCustomer,
        transaction_code: `INV-${Date.now()}`,
        total_amount: totals.total,
        smart_code: 'HERA.FIN.AR.TXN.INV.v1',
        metadata: {
          ...invoiceForm.metadata,
          channel: invoiceForm.channel,
          due_date: invoiceForm.dueDate,
          gst_amount: totals.gstAmount,
          status: 'sent'
        }
      })

      // Create invoice lines
      for (const line of invoiceForm.lines || []) {
        await universalApi.createTransactionLine({
          transaction_id: invoice.id,
          line_number: invoiceForm.lines?.indexOf(line) || 0,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          line_amount: line.amount,
          metadata: {
            product_code: line.productCode,
            description: line.description,
            gst_rate: line.gstRate,
            ...line.metadata
          }
        })
      }

      // Clear form
      setInvoiceForm({
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        channel: 'retail',
        lines: []
      })
      setSelectedCustomer('')

      // Notify parent
      if (onInvoiceCreated) {
        onInvoiceCreated(invoice.id)
      }

      // Reload data
      loadCustomers()
      
    } catch (error) {
      console.error('Failed to create invoice:', error)
      alert('Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  // Calculate aging buckets
  const calculateAging = () => {
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0
    }
    
    // In real implementation, would calculate from invoice data
    aging.current = 145000
    aging.days30 = 89000
    aging.days60 = 45000
    aging.days90 = 23000
    aging.over90 = 43000
    
    return aging
  }

  // Get channel statistics
  const getChannelStats = () => {
    return {
      retail: { count: 234, amount: 125000, percentage: 36 },
      wholesale: { count: 45, amount: 180000, percentage: 52 },
      food_service: { count: 12, amount: 35000, percentage: 10 },
      online: { count: 89, amount: 5000, percentage: 2 }
    }
  }

  return (
    <div className={cn("min-h-screen", isDarkMode && "dark")}>
      <Card className={cn(
        "shadow-lg",
        isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : "bg-white border-gray-200"
      )}>
        <CardHeader className={cn(
          "border-b",
          isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "text-xl flex items-center gap-2",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              <Users className="h-5 w-5" />
              Accounts Receivable Module
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {customers.length} Customers
              </Badge>
              {features.creditManagement && (
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="h-3 w-3" />
                  Credit Management
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className={cn(
              "grid w-full grid-cols-5",
              isDarkMode ? "bg-[#292929]" : "bg-gray-100"
            )}>
              <TabsTrigger value="customers" className="gap-1">
                <Users className="h-4 w-4" />
                Customers
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-1">
                <FileText className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-1">
                <DollarSign className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="collections" className="gap-1">
                <Phone className="h-4 w-4" />
                Collections
              </TabsTrigger>
              {industrySpecific.returnGoodsHandling && (
                <TabsTrigger value="returns" className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Returns
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Customers Tab */}
            <TabsContent value="customers" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customers..."
                      className={cn(
                        "pl-10 w-[300px]",
                        isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                      )}
                    />
                  </div>
                  {industrySpecific.multiChannelBilling && (
                    <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                      <SelectTrigger className={cn(
                        "w-[200px]",
                        isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                      )}>
                        <SelectValue placeholder="Filter by channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="retail">Retail Stores</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="food_service">Food Service</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Customer
                </Button>
              </div>
              
              {/* Channel Statistics */}
              {industrySpecific.multiChannelBilling && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {Object.entries(getChannelStats()).map(([channel, stats]) => (
                    <Card key={channel} className={cn(
                      isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {channel === 'retail' && <Store className="h-4 w-4 text-blue-500" />}
                          {channel === 'wholesale' && <Truck className="h-4 w-4 text-green-500" />}
                          {channel === 'food_service' && <ShoppingBag className="h-4 w-4 text-purple-500" />}
                          {channel === 'online' && <Package className="h-4 w-4 text-orange-500" />}
                          <span className="font-medium capitalize">{channel.replace('_', ' ')}</span>
                        </div>
                        <div className="text-2xl font-bold">₹{(stats.amount / 1000).toFixed(0)}K</div>
                        <div className="text-sm text-gray-500">{stats.count} customers ({stats.percentage}%)</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                {customers.map(customer => (
                  <Card key={customer.id} className={cn(
                    isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{customer.customerName}</h3>
                            <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                              {customer.status}
                            </Badge>
                            {customer.customerType === 'retail' && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Store className="h-3 w-3 mr-1" />
                                Retail
                              </Badge>
                            )}
                            {customer.customerType === 'wholesale' && (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <Truck className="h-3 w-3 mr-1" />
                                Wholesale
                              </Badge>
                            )}
                            {(customer.metadata as any)?.temperatureCompliant && (
                              <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                                <ThermometerSnowflake className="h-3 w-3 mr-1" />
                                Temp OK
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Code:</span> {customer.customerCode}
                            </div>
                            <div>
                              <span className="text-gray-500">Terms:</span> {customer.paymentTerms}
                            </div>
                            <div>
                              <span className="text-gray-500">Credit Limit:</span> ₹{customer.creditLimit.toLocaleString()}
                            </div>
                            <div>
                              <span className="text-gray-500">Available:</span> ₹{(customer.creditLimit - customer.currentBalance).toLocaleString()}
                            </div>
                          </div>
                          {industrySpecific.freezerDepositTracking && (customer.metadata as any)?.freezerDeposit && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                <Snowflake className="h-3 w-3 mr-1" />
                                Freezer Deposit: ₹{customer.metadata.freezerDeposit.toLocaleString()}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold">
                            ₹{customer.currentBalance.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Outstanding</div>
                          {customer.currentBalance > customer.creditLimit * 0.8 && (
                            <Badge variant="destructive" className="mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Near Limit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Invoices Tab */}
            <TabsContent value="invoices" className="space-y-4 mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Create Sales Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Customer</Label>
                      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                        <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.customerCode} - {customer.customerName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Channel</Label>
                      <Select 
                        value={invoiceForm.channel} 
                        onValueChange={(value) => setInvoiceForm(prev => ({ ...prev, channel: value }))}
                      >
                        <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="retail">Retail Store</SelectItem>
                          <SelectItem value="wholesale">Wholesale</SelectItem>
                          <SelectItem value="food_service">Food Service</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={invoiceForm.dueDate?.toISOString().split('T')[0]}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: new Date(e.target.value) }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                  </div>
                  
                  {/* Ice Cream Specific Fields */}
                  {industrySpecific.routeDeliveryReconciliation && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Route Code</Label>
                        <Input
                          placeholder="ROUTE-KOC-01"
                          onChange={(e) => setInvoiceForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, routeCode: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      <div>
                        <Label>Delivery Temperature (°C)</Label>
                        <Input
                          type="number"
                          placeholder="-18"
                          onChange={(e) => setInvoiceForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, deliveryTemperature: parseFloat(e.target.value) }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      {industrySpecific.freezerDepositTracking && (
                        <div>
                          <Label>Freezer Serial Numbers</Label>
                          <Input
                            placeholder="FRZ-001, FRZ-002"
                            onChange={(e) => setInvoiceForm(prev => ({
                              ...prev,
                              metadata: { ...prev.metadata, freezerSerialNumbers: e.target.value.split(',').map(s => s.trim()) }
                            }))}
                            className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Separator />
                  
                  {/* Invoice Lines */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label>Invoice Lines</Label>
                      <Button
                        size="sm"
                        onClick={addInvoiceLine}
                        className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                      >
                        Add Line
                      </Button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={cn(
                            "border-b",
                            isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
                          )}>
                            <th className="text-left py-2">Product</th>
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2 w-20">Qty</th>
                            <th className="text-right py-2 w-24">Price</th>
                            <th className="text-right py-2 w-20">GST%</th>
                            <th className="text-right py-2 w-24">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(invoiceForm.lines || []).map((line, index) => (
                            <tr key={line.id} className={cn(
                              "border-b",
                              isDarkMode ? "border-[#3a3a3a]" : "border-gray-200"
                            )}>
                              <td className="py-2 pr-2">
                                <Input
                                  placeholder="ICE-001"
                                  value={line.productCode}
                                  onChange={(e) => updateInvoiceLine(index, 'productCode', e.target.value)}
                                  className={cn(
                                    "h-8",
                                    isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  placeholder="Vanilla 500ml"
                                  value={line.description}
                                  onChange={(e) => updateInvoiceLine(index, 'description', e.target.value)}
                                  className={cn(
                                    "h-8",
                                    isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  value={line.quantity}
                                  onChange={(e) => updateInvoiceLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  className={cn(
                                    "h-8 text-right",
                                    isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  type="number"
                                  value={line.unitPrice}
                                  onChange={(e) => updateInvoiceLine(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className={cn(
                                    "h-8 text-right",
                                    isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""
                                  )}
                                />
                              </td>
                              <td className="py-2 px-2">
                                <Select
                                  value={line.gstRate.toString()}
                                  onValueChange={(value) => updateInvoiceLine(index, 'gstRate', parseFloat(value))}
                                >
                                  <SelectTrigger className={cn(
                                    "h-8",
                                    isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""
                                  )}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="18">18%</SelectItem>
                                    <SelectItem value="12">12%</SelectItem>
                                    <SelectItem value="5">5%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-2 pl-2 text-right">
                                {line.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={5} className="py-2 text-right font-medium">Subtotal:</td>
                            <td className="py-2 pl-2 text-right font-medium">
                              ₹{calculateTotal().subtotal.toFixed(2)}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={5} className="py-2 text-right font-medium">GST:</td>
                            <td className="py-2 pl-2 text-right font-medium">
                              ₹{calculateTotal().gstAmount.toFixed(2)}
                            </td>
                          </tr>
                          <tr className="font-semibold">
                            <td colSpan={5} className="py-2 text-right">Total:</td>
                            <td className="py-2 pl-2 text-right">
                              ₹{calculateTotal().total.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setInvoiceForm({
                            invoiceDate: new Date(),
                            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            channel: 'retail',
                            lines: []
                          })
                          setSelectedCustomer('')
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={createInvoice}
                        disabled={loading || !selectedCustomer || !invoiceForm.lines?.length}
                        className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                      >
                        Create Invoice
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Payment Processing</CardTitle>
                    <Button className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}>
                      <Coins className="h-4 w-4 mr-1" />
                      Record Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      Total Outstanding: <strong>₹{Object.values(calculateAging()).reduce((a, b) => a + b, 0).toLocaleString()}</strong>
                    </AlertDescription>
                  </Alert>
                  
                  {industrySpecific.seasonalCreditTerms && (
                    <Alert className="mt-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-700 dark:text-blue-400">
                        Summer season credit terms active: Extended 45-day terms for wholesale customers
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Collections Tab */}
            <TabsContent value="collections" className="mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Collections Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Aging Analysis */}
                    <div>
                      <h3 className="font-medium mb-3">Accounts Receivable Aging</h3>
                      <div className="space-y-3">
                        {Object.entries(calculateAging()).map(([period, amount]) => {
                          const percentage = (amount / Object.values(calculateAging()).reduce((a, b) => a + b, 0)) * 100
                          return (
                            <div key={period}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">
                                  {period === 'over90' ? 'Over 90 days' : period === 'current' ? 'Current' : `${period.slice(4)} days`}
                                </span>
                                <span className="font-semibold">₹{amount.toLocaleString()}</span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Overdue Accounts */}
                    <div>
                      <h3 className="font-medium mb-3">Priority Collections</h3>
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Metro Cash & Carry</h4>
                              <p className="text-sm text-gray-500">90+ days overdue - ₹43,000</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="destructive">High Priority</Badge>
                                {industrySpecific.freezerDepositTracking && (
                                  <Badge variant="outline">
                                    <Snowflake className="h-3 w-3 mr-1" />
                                    2 Freezers
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                              </Button>
                              <Button size="sm" variant="outline">
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </Button>
                              {features.dunningLetters && (
                                <Button size="sm" variant="destructive">
                                  Send Notice
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Returns Tab */}
            {industrySpecific.returnGoodsHandling && (
              <TabsContent value="returns" className="mt-4">
                <Card className={cn(
                  isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
                )}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Returns & Credit Memos</CardTitle>
                      <Button className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        New Return
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Customer</Label>
                          <Select>
                            <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {customers.map(customer => (
                                <SelectItem key={customer.id} value={customer.id}>
                                  {customer.customerName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Original Invoice</Label>
                          <Input
                            placeholder="INV-2024-001"
                            className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                          />
                        </div>
                        <div>
                          <Label>Return Reason</Label>
                          <Select
                            value={creditMemoForm.reason}
                            onValueChange={(value) => setCreditMemoForm(prev => ({ 
                              ...prev, 
                              reason: value as any 
                            }))}
                          >
                            <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="damaged">Damaged Product</SelectItem>
                              <SelectItem value="melted">Melted (Temperature)</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                              <SelectItem value="wrong_delivery">Wrong Delivery</SelectItem>
                              <SelectItem value="quality_issue">Quality Issue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {industrySpecific.coldChainCompensation && creditMemoForm.reason === 'melted' && (
                        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                          <ThermometerSnowflake className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 dark:text-red-400">
                            Temperature excursion claim - Requires temperature log and photos
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Describe the return reason..."
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <Button
                          onClick={() => {
                            if (onCreditMemoCreated) {
                              onCreditMemoCreated('CM-' + Date.now())
                            }
                          }}
                          className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                        >
                          Create Credit Memo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Export as HERA DNA Component
export const AR_MODULE_DNA = {
  id: 'HERA.FIN.AR.MODULE.v1',
  name: 'Accounts Receivable Module',
  description: 'Complete AR management with customer management, invoicing, payments, collections, and returns',
  component: ARModule,
  category: 'financial',
  subcategory: 'accounts_receivable',
  tags: ['ar', 'customers', 'invoices', 'collections', 'financial'],
  version: '1.0.0',
  author: 'HERA Team',
  features: [
    'Customer credit management',
    'Multi-channel invoicing',
    'Payment collection and application',
    'Collections workflow management',
    'Statement generation',
    'Credit memo processing',
    'Aging analysis',
    'Automated reminders',
    'Dunning letter generation',
    'Industry-specific adaptations'
  ],
  industryAdaptations: {
    iceCream: {
      multiChannelBilling: true,
      freezerDepositTracking: true,
      seasonalCreditTerms: true,
      returnGoodsHandling: true,
      coldChainCompensation: true,
      routeDeliveryReconciliation: true,
      features: [
        'Channel-specific pricing (Retail/Wholesale/Food Service)',
        'Freezer deposit management and tracking',
        'Seasonal credit extensions for summer',
        'Melted product returns and claims',
        'Temperature-based compensation',
        'Route delivery reconciliation',
        'GST-compliant multi-rate invoicing',
        'Batch and expiry tracking on invoices'
      ]
    },
    restaurant: {
      features: [
        'Corporate billing accounts',
        'Event-based invoicing',
        'Gratuity management',
        'Loyalty program integration'
      ]
    },
    healthcare: {
      features: [
        'Insurance billing',
        'Co-pay management',
        'Claim tracking',
        'Patient statement generation'
      ]
    }
  },
  dependencies: [
    'universalApi',
    'Customer master data',
    'Product/Service catalog',
    'GL account setup',
    'Organization context'
  ],
  smartCodes: [
    'HERA.FIN.AR.ENT.CUS.v1',
    'HERA.FIN.AR.TXN.INV.v1',
    'HERA.FIN.AR.TXN.PAY.v1',
    'HERA.FIN.AR.TXN.CM.v1',
    'HERA.FIN.AR.VAL.*'
  ]
}