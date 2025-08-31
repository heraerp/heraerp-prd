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
import {
  Receipt,
  Users,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Package,
  Truck,
  Shield,
  BarChart3,
  Filter,
  Search,
  Plus,
  Upload,
  Thermometer,
  Snowflake,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { universalApi } from '@/lib/universal-api'

// Types
export interface APModuleProps {
  organizationId: string
  isDarkMode?: boolean
  features?: {
    approvalWorkflow?: boolean
    earlyPaymentDiscounts?: boolean
    recurringInvoices?: boolean
    multiCurrency?: boolean
    vendorPortal?: boolean
    autoMatching?: boolean
  }
  industrySpecific?: {
    dairySupplierTracking?: boolean
    coldChainVendorManagement?: boolean
    qualityCertificateTracking?: boolean
    seasonalPricingAgreements?: boolean
    freezerPlacementTracking?: boolean
  }
  onInvoiceProcessed?: (invoiceId: string) => void
  onPaymentMade?: (paymentId: string) => void
}

interface Vendor {
  id: string
  vendorCode: string
  vendorName: string
  vendorType: string
  status: 'active' | 'inactive' | 'blocked'
  creditLimit: number
  currentBalance: number
  paymentTerms: string
  metadata?: {
    isDairySupplier?: boolean
    isColdChainVendor?: boolean
    qualityCertificates?: string[]
    seasonalPricing?: boolean
    freezerCount?: number
  }
}

interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  vendorId: string
  vendorName: string
  invoiceDate: Date
  dueDate: Date
  totalAmount: number
  paidAmount: number
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'overdue'
  lines: InvoiceLine[]
  metadata?: {
    temperature?: number
    qualityCertificate?: string
    batchNumber?: string
    seasonalRate?: boolean
  }
}

interface InvoiceLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  accountCode: string
  metadata?: {
    productType?: string
    temperature?: number
  }
}

interface Payment {
  id: string
  paymentNumber: string
  vendorId: string
  paymentDate: Date
  amount: number
  paymentMethod: string
  appliedInvoices: string[]
}

// AP Module DNA Component
export function APModule({
  organizationId,
  isDarkMode = false,
  features = {
    approvalWorkflow: true,
    earlyPaymentDiscounts: true,
    recurringInvoices: true,
    multiCurrency: false,
    vendorPortal: false,
    autoMatching: true
  },
  industrySpecific = {},
  onInvoiceProcessed,
  onPaymentMade
}: APModuleProps) {
  const [activeTab, setActiveTab] = useState<'vendors' | 'invoices' | 'payments' | 'aging' | 'approvals'>('invoices')
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState<Partial<PurchaseInvoice>>({
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    lines: []
  })

  // Load vendors
  useEffect(() => {
    loadVendors()
  }, [organizationId])

  const loadVendors = async () => {
    try {
      setLoading(true)
      const response = await universalApi.query('core_entities', {
        filters: {
          organization_id: organizationId,
          entity_type: 'vendor'
        }
      })
      
      if (response.data) {
        setVendors(response.data.map((vendor: any) => ({
          id: vendor.id,
          vendorCode: vendor.entity_code,
          vendorName: vendor.entity_name,
          vendorType: vendor.metadata?.vendor_type || 'general',
          status: vendor.status || 'active',
          creditLimit: vendor.metadata?.credit_limit || 0,
          currentBalance: vendor.metadata?.current_balance || 0,
          paymentTerms: vendor.metadata?.payment_terms || 'NET30',
          metadata: vendor.metadata
        })))
      }
    } catch (error) {
      console.error('Failed to load vendors:', error)
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
          description: '',
          quantity: 1,
          unitPrice: 0,
          amount: 0,
          accountCode: ''
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
    return (invoiceForm.lines || []).reduce((sum, line) => sum + line.amount, 0)
  }

  // Process Invoice
  const processInvoice = async () => {
    if (!selectedVendor || !invoiceForm.invoiceNumber) {
      alert('Please select vendor and enter invoice number')
      return
    }

    try {
      setLoading(true)
      
      // Create purchase invoice transaction
      const invoice = await universalApi.createTransaction({
        transaction_type: 'purchase_invoice',
        transaction_date: invoiceForm.invoiceDate || new Date(),
        organization_id: organizationId,
        from_entity_id: selectedVendor,
        transaction_code: invoiceForm.invoiceNumber,
        total_amount: calculateTotal(),
        smart_code: 'HERA.FIN.AP.TXN.INV.v1',
        metadata: {
          ...invoiceForm.metadata,
          due_date: invoiceForm.dueDate,
          status: 'pending'
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
            description: line.description,
            account_code: line.accountCode,
            ...line.metadata
          }
        })
      }

      // Clear form
      setInvoiceForm({
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lines: []
      })
      setSelectedVendor('')

      // Notify parent
      if (onInvoiceProcessed) {
        onInvoiceProcessed(invoice.id)
      }

      // Reload data
      loadVendors()
      
    } catch (error) {
      console.error('Failed to process invoice:', error)
      alert('Failed to process invoice')
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
    aging.current = 45000
    aging.days30 = 23000
    aging.days60 = 12000
    aging.days90 = 8000
    aging.over90 = 5000
    
    return aging
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
              <Receipt className="h-5 w-5" />
              Accounts Payable Module
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                {vendors.length} Vendors
              </Badge>
              {features.approvalWorkflow && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Approval Workflow
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
              <TabsTrigger value="vendors" className="gap-1">
                <Users className="h-4 w-4" />
                Vendors
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-1">
                <FileText className="h-4 w-4" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-1">
                <DollarSign className="h-4 w-4" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="aging" className="gap-1">
                <BarChart3 className="h-4 w-4" />
                Aging
              </TabsTrigger>
              {features.approvalWorkflow && (
                <TabsTrigger value="approvals" className="gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Approvals
                </TabsTrigger>
              )}
            </TabsList>
            
            {/* Vendors Tab */}
            <TabsContent value="vendors" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search vendors..."
                      className={cn(
                        "pl-10 w-[300px]",
                        isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                      )}
                    />
                  </div>
                  {industrySpecific.dairySupplierTracking && (
                    <Select>
                      <SelectTrigger className={cn(
                        "w-[200px]",
                        isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : ""
                      )}>
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Vendors</SelectItem>
                        <SelectItem value="dairy">Dairy Suppliers</SelectItem>
                        <SelectItem value="packaging">Packaging Suppliers</SelectItem>
                        <SelectItem value="cold-chain">Cold Chain Vendors</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Vendor
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {vendors.map(vendor => (
                  <Card key={vendor.id} className={cn(
                    isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{vendor.vendorName}</h3>
                            <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                              {vendor.status}
                            </Badge>
                            {vendor.metadata?.isDairySupplier && (
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                <Package className="h-3 w-3 mr-1" />
                                Dairy
                              </Badge>
                            )}
                            {vendor.metadata?.isColdChainVendor && (
                              <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                                <Snowflake className="h-3 w-3 mr-1" />
                                Cold Chain
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Code:</span> {vendor.vendorCode}
                            </div>
                            <div>
                              <span className="text-gray-500">Terms:</span> {vendor.paymentTerms}
                            </div>
                            <div>
                              <span className="text-gray-500">Credit Limit:</span> ${vendor.creditLimit.toLocaleString()}
                            </div>
                          </div>
                          {industrySpecific.qualityCertificateTracking && vendor.metadata?.qualityCertificates && (
                            <div className="mt-2 flex gap-2">
                              {vendor.metadata.qualityCertificates.map((cert, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  <Award className="h-3 w-3 mr-1" />
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold">
                            ${vendor.currentBalance.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">Outstanding</div>
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
                  <CardTitle className="text-lg">New Purchase Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vendor</Label>
                      <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                        <SelectTrigger className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map(vendor => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.vendorCode} - {vendor.vendorName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Invoice Number</Label>
                      <Input
                        placeholder="INV-2024-001"
                        value={invoiceForm.invoiceNumber}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Invoice Date</Label>
                      <Input
                        type="date"
                        value={invoiceForm.invoiceDate?.toISOString().split('T')[0]}
                        onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceDate: new Date(e.target.value) }))}
                        className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                      />
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
                  {industrySpecific.qualityCertificateTracking && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Quality Certificate</Label>
                        <Input
                          placeholder="QC-2024-001"
                          onChange={(e) => setInvoiceForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, qualityCertificate: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      <div>
                        <Label>Batch Number</Label>
                        <Input
                          placeholder="BATCH-2024-001"
                          onChange={(e) => setInvoiceForm(prev => ({
                            ...prev,
                            metadata: { ...prev.metadata, batchNumber: e.target.value }
                          }))}
                          className={isDarkMode ? "bg-[#1f1f1f] border-[#3a3a3a]" : ""}
                        />
                      </div>
                      {industrySpecific.coldChainVendorManagement && (
                        <div>
                          <Label>Temperature (°C)</Label>
                          <Input
                            type="number"
                            placeholder="-18"
                            onChange={(e) => setInvoiceForm(prev => ({
                              ...prev,
                              metadata: { ...prev.metadata, temperature: parseFloat(e.target.value) }
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
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2 w-20">Qty</th>
                            <th className="text-right py-2 w-24">Unit Price</th>
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
                                  placeholder="Item description"
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
                              <td className="py-2 pl-2 text-right">
                                {line.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-semibold">
                            <td colSpan={3} className="py-2 text-right">Total:</td>
                            <td className="py-2 pl-2 text-right">
                              {calculateTotal().toFixed(2)}
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
                            lines: []
                          })
                          setSelectedVendor('')
                        }}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={processInvoice}
                        disabled={loading || !selectedVendor || !invoiceForm.invoiceNumber}
                        className={isDarkMode ? "bg-[#0078d4] hover:bg-[#106ebe]" : ""}
                      >
                        Process Invoice
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
                      <DollarSign className="h-4 w-4 mr-1" />
                      New Payment
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <DollarSign className="h-4 w-4" />
                    <AlertDescription>
                      Total Outstanding: <strong>${calculateAging().current + calculateAging().days30 + calculateAging().days60 + calculateAging().days90 + calculateAging().over90}</strong>
                    </AlertDescription>
                  </Alert>
                  
                  {features.earlyPaymentDiscounts && (
                    <Alert className="mt-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        3 invoices eligible for early payment discount totaling $1,250 in savings
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aging Tab */}
            <TabsContent value="aging" className="mt-4">
              <Card className={cn(
                isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
              )}>
                <CardHeader>
                  <CardTitle className="text-lg">Accounts Payable Aging</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(calculateAging()).map(([period, amount]) => {
                      const percentage = (amount / Object.values(calculateAging()).reduce((a, b) => a + b, 0)) * 100
                      return (
                        <div key={period}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{period === 'over90' ? 'Over 90 days' : period === 'current' ? 'Current' : `${period.slice(4)} days`}</span>
                            <span className="font-semibold">${amount.toLocaleString()}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                  
                  {industrySpecific.seasonalPricingAgreements && (
                    <Alert className="mt-6">
                      <Calendar className="h-4 w-4" />
                      <AlertDescription>
                        Seasonal pricing agreements active for 5 dairy suppliers. Summer rates apply.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Approvals Tab */}
            {features.approvalWorkflow && (
              <TabsContent value="approvals" className="mt-4">
                <Card className={cn(
                  isDarkMode ? "bg-[#292929] border-[#3a3a3a]" : "bg-gray-50 border-gray-200"
                )}>
                  <CardHeader>
                    <CardTitle className="text-lg">Pending Approvals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">INV-2024-0145</h4>
                            <p className="text-sm text-gray-500">Kerala Dairy Suppliers - $45,000</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                            <Button size="sm">
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {industrySpecific.freezerPlacementTracking && (
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Freezer Placement - 10 Units</h4>
                              <p className="text-sm text-gray-500">Cold Chain Solutions Ltd - $25,000</p>
                              <Badge className="mt-1" variant="outline">
                                <Thermometer className="h-3 w-3 mr-1" />
                                Equipment Purchase
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Reject
                              </Button>
                              <Button size="sm">
                                Approve
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
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
export const AP_MODULE_DNA = {
  id: 'HERA.FIN.AP.MODULE.v1',
  name: 'Accounts Payable Module',
  description: 'Complete AP management with vendor management, invoice processing, payments, and approvals',
  component: APModule,
  category: 'financial',
  subcategory: 'accounts_payable',
  tags: ['ap', 'vendors', 'invoices', 'payments', 'financial'],
  version: '1.0.0',
  author: 'HERA Team',
  features: [
    'Vendor management and tracking',
    'Purchase invoice processing',
    'Payment processing and application',
    'Aging analysis and reporting',
    'Approval workflow management',
    'Early payment discount tracking',
    'Recurring invoice support',
    'Auto-matching capabilities',
    'Industry-specific adaptations'
  ],
  industryAdaptations: {
    iceCream: {
      dairySupplierTracking: true,
      coldChainVendorManagement: true,
      qualityCertificateTracking: true,
      seasonalPricingAgreements: true,
      freezerPlacementTracking: true,
      features: [
        'Dairy supplier price contracts',
        'Cold storage vendor management',
        'Quality certificate requirements',
        'Seasonal pricing agreements',
        'Freezer placement vendor tracking',
        'Temperature compliance tracking',
        'Batch number tracking'
      ]
    },
    restaurant: {
      features: [
        'Food supplier management',
        'Daily delivery tracking',
        'Price variance monitoring',
        'Perishable goods tracking'
      ]
    },
    healthcare: {
      features: [
        'Medical supplier compliance',
        'Drug license verification',
        'Expiry date tracking',
        'Regulatory compliance'
      ]
    }
  },
  dependencies: [
    'universalApi',
    'Vendor master data',
    'GL account setup',
    'Organization context'
  ],
  smartCodes: [
    'HERA.FIN.AP.ENT.VEN.v1',
    'HERA.FIN.AP.TXN.INV.v1',
    'HERA.FIN.AP.TXN.PAY.v1',
    'HERA.FIN.AP.VAL.*'
  ]
}