'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  Minus,
  ShoppingCart,
  User,
  Package,
  Calendar,
  CreditCard,
  Truck,
  FileText,
  Search,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  generateHeraDocumentNumber,
  useHeraDocumentNumbering,
  HERA_DNA_DOCUMENT_TYPES,
  HeraDocumentNumberDisplay
} from '@/lib/dna/components/document-numbering-dna'

interface Customer {
  id: string
  entity_name: string
  entity_code: string
  phone?: string
  email?: string
  address?: string
}

interface Product {
  id: string
  entity_name: string
  entity_code: string
  category?: string
  price?: number
  stock_quantity?: number
  description?: string
}

interface OrderLineItem {
  product: Product
  quantity: number
  unit_price: number
  line_amount: number
  notes?: string
}

interface NewSalesOrderModalProps {
  trigger?: React.ReactNode
  onOrderCreated?: (orderId: string) => void
  organizationId?: string
  organizationName?: string
}

export default function NewSalesOrderModal({
  trigger,
  onOrderCreated,
  organizationId: propOrgId,
  organizationName
}: NewSalesOrderModalProps) {
  const { organizationId: hookOrgId, orgLoading, hasOrganization } = useDemoOrganization()

  const { toast } = useToast()

  // Use prop organizationId if provided, otherwise use hook
  const organizationId = propOrgId || hookOrgId
  const hasValidOrganization = !!organizationId

  // 🧬 HERA DNA: Document Numbering Hook - only initialize if we have an organization
  const { generateNumber: generateDocNumber, isGenerating: isGeneratingDoc } =
    useHeraDocumentNumbering(hasValidOrganization ? organizationId : null, 'furniture')

  const [isOpen, setIsOpen] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isExpanded, setIsExpanded] = useState(false)

  // Form state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [newCustomerMode, setNewCustomerMode] = useState(false)

  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  const [productSearchTerm, setProductSearchTerm] = useState('')

  const [lineItems, setLineItems] = useState<OrderLineItem[]>([])

  const [orderDetails, setOrderDetails] = useState({
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: 'NET30',
    delivery_method: 'pickup',
    notes: '',
    discount_percent: 0,
    tax_percent: 5 // GST
  })

  // Data loading
  const [customers, setCustomers] = useState<Customer[]>([])

  const [products, setProducts] = useState<Product[]>([])

  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    if (isOpen && hasValidOrganization && organizationId) {
      loadData()
    }
  }, [isOpen, organizationId, hasValidOrganization])

  useEffect(() => {
    if (customerSearchTerm) {
      const filtered = customers.filter(
        customer =>
          customer.entity_name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
          customer.entity_code?.toLowerCase().includes(customerSearchTerm.toLowerCase())
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers.slice(0, 10))
    }
  }, [isOpen, organizationId, hasValidOrganization])

  useEffect(() => {
    if (productSearchTerm) {
      const filtered = products.filter(
        product =>
          product.entity_name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
          product.entity_code?.toLowerCase().includes(productSearchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    } else {
      setFilteredProducts(products.slice(0, 10))
    }
  }, [productSearchTerm, products])

  const loadData = async () => {
    try {
      if (!organizationId || !hasValidOrganization) {
        console.error('No organization ID available')
        return
      }

      universalApi.setOrganizationId(organizationId)

      // Load customers
      const customersResponse = await universalApi.read('core_entities', undefined, organizationId)
      if (customersResponse.success) {
        const customerEntities =
          customersResponse.data?.filter((e: any) => e.entity_type === 'customer') || []

        // Load dynamic data for customers
        const dynamicDataResponse = await universalApi.read(
          'core_dynamic_data',
          undefined,
          organizationId
        )
        const dynamicData = dynamicDataResponse.data || []

        const customersWithDetails = customerEntities.map((customer: any) => {
          const customerData = dynamicData.filter((d: any) => d.entity_id === customer.id)

          const phone = customerData.find((d: any) => d.field_name === 'phone')?.field_value_text

          const email = customerData.find((d: any) => d.field_name === 'email')?.field_value_text
          const address = customerData.find(
            (d: any) => d.field_name === 'address'
          )?.field_value_text

          return {
            id: customer.id,
            entity_name: customer.entity_name,
            entity_code: customer.entity_code,
            phone,
            email,
            address
          }
        })

        setCustomers(customersWithDetails)
        setFilteredCustomers(customersWithDetails.slice(0, 10))
      }

      // Load products
      const productsResponse = await universalApi.read('core_entities', undefined, organizationId)
      if (productsResponse.success) {
        const productEntities =
          productsResponse.data?.filter((e: any) => e.entity_type === 'product') || []

        // Load dynamic data for products
        const dynamicDataResponse = await universalApi.read(
          'core_dynamic_data',
          undefined,
          organizationId
        )
        const dynamicData = dynamicDataResponse.data || []

        const productsWithDetails = productEntities.map((product: any) => {
          const productData = dynamicData.filter((d: any) => d.entity_id === product.id)

          const price = productData.find((d: any) => d.field_name === 'price')?.field_value_number

          const stock_quantity = productData.find(
            (d: any) => d.field_name === 'stock_quantity'
          )?.field_value_number
          const category = productData.find(
            (d: any) => d.field_name === 'category'
          )?.field_value_text
          const description = productData.find(
            (d: any) => d.field_name === 'description'
          )?.field_value_text

          return {
            id: product.id,
            entity_name: product.entity_name,
            entity_code: product.entity_code,
            price: price || 0,
            stock_quantity: stock_quantity || 0,
            category,
            description
          }
        })

        setProducts(productsWithDetails)
        setFilteredProducts(productsWithDetails.slice(0, 10))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const addLineItem = (product: Product) => {
    const existingItemIndex = lineItems.findIndex(item => item.product.id === product.id)

    if (existingItemIndex >= 0) {
      // Increase quantity if product already exists
      const updatedItems = [...lineItems]
      updatedItems[existingItemIndex].quantity += 1
      updatedItems[existingItemIndex].line_amount =
        updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unit_price
      setLineItems(updatedItems)
    } else {
      // Add new line item
      const newItem: OrderLineItem = {
        product,
        quantity: 1,
        unit_price: product.price || 0,
        line_amount: product.price || 0
      }
      setLineItems([...lineItems, newItem])
    }

    setProductSearchTerm('')
  }

  const updateLineItem = (index: number, field: keyof OrderLineItem, value: any) => {
    const updatedItems = [...lineItems]

    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index][field] = parseFloat(value) || 0
      updatedItems[index].line_amount =
        updatedItems[index].quantity * updatedItems[index].unit_price
    } else {
      updatedItems[index][field] = value
    }

    setLineItems(updatedItems)
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_amount, 0)
    const discountAmount = subtotal * (orderDetails.discount_percent / 100)
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * (orderDetails.tax_percent / 100)
    const total = taxableAmount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      itemCount: lineItems.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  const handleCreateCustomer = async () => {
    if (!customerFormData.name.trim()) return

    // Check if we have a valid organization ID
    if (!hasValidOrganization || !organizationId) {
      toast({
        title: 'Error',
        description:
          "No organization context found. Please ensure you're logged in or in a demo mode.",
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)
      universalApi.setOrganizationId(organizationId)

      // Create customer entity
      const customerResponse = await universalApi.createEntity({
        entity_type: 'customer',
        entity_name: customerFormData.name,
        entity_code: `CUST-${Date.now()}`,
        smart_code: 'HERA.FURNITURE.CUST.ENT.PROF.V1',
        organization_id: organizationId
      })

      if (customerResponse.success) {
        const customerId = customerResponse.data.id

        // Add dynamic data
        const dynamicFields = []
        if (customerFormData.phone)
          dynamicFields.push({ field_name: 'phone', field_value_text: customerFormData.phone })
        if (customerFormData.email)
          dynamicFields.push({ field_name: 'email', field_value_text: customerFormData.email })
        if (customerFormData.address)
          dynamicFields.push({ field_name: 'address', field_value_text: customerFormData.address })

        for (const field of dynamicFields) {
          await universalApi.setDynamicField(customerId, field.field_name, field.field_value_text, {
            smart_code: 'HERA.FURNITURE.CUST.DYN.FIELD.V1'
          })
        }

        const newCustomer: Customer = {
          id: customerId,
          entity_name: customerFormData.name,
          entity_code: `CUST-${Date.now()}`,
          phone: customerFormData.phone,
          email: customerFormData.email,
          address: customerFormData.address
        }

        setSelectedCustomer(newCustomer)
        setCustomers([newCustomer, ...customers])
        setNewCustomerMode(false)
        setCustomerFormData({ name: '', phone: '', email: '', address: '' })
      }
    } catch (error) {
      console.error('Error creating customer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitOrder = async () => {
    if (!selectedCustomer || lineItems.length === 0) return

    // Check if we have a valid organization ID
    if (!hasValidOrganization || !organizationId) {
      toast({
        title: 'Error',
        description:
          "No organization context found. Please ensure you're logged in or in a demo mode.",
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)
      universalApi.setOrganizationId(organizationId)

      const totals = calculateTotals()

      // 🧬 HERA DNA: Generate professional document number
      const documentNumber = await generateDocNumber(HERA_DNA_DOCUMENT_TYPES.SALES_ORDER)
      console.log('🧬 HERA DNA Generated document number:', documentNumber)

      // Create sales order transaction
      const orderResponse = await universalApi.createTransaction({
        transaction_type: 'sales_order',
        transaction_code: documentNumber,
        transaction_date: orderDetails.order_date,
        source_entity_id: selectedCustomer.id,
        total_amount: totals.total,
        smart_code: 'HERA.FURNITURE.SALES.ORDER.V1',
        metadata: {
          delivery_date: orderDetails.delivery_date,
          payment_terms: orderDetails.payment_terms,
          delivery_method: orderDetails.delivery_method,
          notes: orderDetails.notes,
          discount_percent: orderDetails.discount_percent,
          tax_percent: orderDetails.tax_percent,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          tax_amount: totals.taxAmount,
          status: 'pending_approval',
          item_count: totals.itemCount
        },
        organization_id: organizationId
      })

      if (orderResponse.success) {
        const orderId = orderResponse.data.id

        // Create order line items
        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i]
          await universalApi.createTransactionLine({
            transaction_id: orderId,
            line_number: i + 1,
            entity_id: item.product.id,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price,
            line_amount: item.line_amount,
            smart_code: 'HERA.FURNITURE.SALES.LINE.V1',
            metadata: {
              product_name: item.product.entity_name,
              product_code: item.product.entity_code,
              notes: item.notes || ''
            },
            organization_id: organizationId
          })
        }

        // Create status relationship (pending approval)
        const statusResponse = await universalApi.createEntity({
          entity_type: 'workflow_status',
          entity_name: 'Pending Approval',
          entity_code: 'STATUS-PENDING-APPROVAL',
          smart_code: 'HERA.FURNITURE.STATUS.PENDING.V1',
          organization_id: organizationId
        })

        if (statusResponse.success) {
          await universalApi.createRelationship({
            from_entity_id: orderId,
            to_entity_id: statusResponse.data.id,
            relationship_type: 'has_status',
            smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.V1',
            relationship_data: {
              status: 'pending_approval',
              created_at: new Date().toISOString(),
              created_by: 'system'
            },
            organization_id: organizationId
          })
        }

        // 🧬 UNIVERSAL EVENT CONTRACT & FINANCE DNA INTEGRATION
        // Automatic GL Posting for Furniture Sales Order
        try {
          // 🧬 HERA DNA: Generate professional journal entry number
          const journalNumber = await generateDocNumber(HERA_DNA_DOCUMENT_TYPES.JOURNAL_ENTRY)
          const financeEvent = await universalApi.createTransaction({
            transaction_type: 'journal_entry',
            transaction_code: journalNumber,
            transaction_date: orderDetails.order_date,
            reference_entity_id: orderId,
            total_amount: totals.total,
            smart_code: 'HERA.FURNITURE.SALES.ORDER.POSTED.V1', // Universal Event Contract
            metadata: {
              source_system: 'FurnitureSales',
              origin_txn_id: orderId,
              posting_type: 'auto_journal',
              event_type: 'sales_order_posted',
              industry: 'furniture',
              ai_confidence: 0.95
            },
            organization_id: organizationId
          })

          if (financeEvent.success) {
            const journalId = financeEvent.data.id

            // Create journal entry lines following Universal Event Contract
            const journalLines = [
              {
                // DR: Accounts Receivable (Customer owes us money)
                entity_id: selectedCustomer.id,
                line_number: 1,
                quantity: '1',
                unit_price: totals.total,
                line_amount: totals.total,
                smart_code: 'HERA.FURNITURE.GL.ACCOUNTS_RECEIVABLE.V1',
                metadata: {
                  account_code: '120000',
                  account_name: 'Accounts Receivable - Trade',
                  debit_credit: 'debit',
                  role: 'Customer Receivable'
                }
              },
              {
                // CR: Furniture Sales Revenue
                line_number: 2,
                quantity: '1',
                unit_price: totals.subtotal,
                line_amount: totals.subtotal,
                smart_code: 'HERA.FURNITURE.GL.SALES_REVENUE.V1',
                metadata: {
                  account_code: '410000',
                  account_name: 'Furniture Sales Revenue',
                  debit_credit: 'credit',
                  role: 'Sales Revenue'
                }
              },
              {
                // CR: GST/VAT Payable (if tax > 0)
                line_number: 3,
                quantity: '1',
                unit_price: totals.taxAmount,
                line_amount: totals.taxAmount,
                smart_code: 'HERA.FURNITURE.GL.SALES_TAX.V1',
                metadata: {
                  account_code: '220000',
                  account_name: 'GST/VAT Payable',
                  debit_credit: 'credit',
                  role: 'Sales Tax'
                }
              }
            ]

            // Create journal lines
            for (const line of journalLines) {
              if (line.line_amount > 0) {
                // Only create lines with amounts
                await universalApi.createTransactionLine({
                  transaction_id: journalId,
                  ...line,
                  organization_id: organizationId
                })
              }
            }

            toast({
              title: '🚀 Finance DNA Integration Success!',
              description: `Sales order created and automatically posted to GL. Journal Entry: ${journalNumber}`,
              duration: 5000
            })
          }
        } catch (financeError) {
          console.error('Finance DNA Integration error:', financeError)
          toast({
            title: '⚠️ Finance Integration Notice',
            description: 'Order created successfully, but automatic GL posting needs review.',
            variant: 'destructive',
            duration: 3000
          })
        }

        // Reset form
        setSelectedCustomer(null)
        setLineItems([])
        setOrderDetails({
          order_date: new Date().toISOString().split('T')[0],
          delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_terms: 'NET30',
          delivery_method: 'pickup',
          notes: '',
          discount_percent: 0,
          tax_percent: 5
        })

        setIsOpen(false)

        toast({
          title: '✅ Sales Order Created',
          description: `Order ${documentNumber} created successfully with automatic finance integration.`,
          duration: 4000
        })

        // Callback
        if (onOrderCreated) {
          onOrderCreated(orderId)
        }
      }
    } catch (error) {
      console.error('Error creating sales order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotals()

  // Debug logging
  console.log('NewSalesOrderModal render state:', {
    organizationId,
    hasValidOrganization,
    orgLoading,
    isOpen,
    propOrgId
  })

  const handleOpenChange = (open: boolean) => {
    console.log('NewSalesOrderModal handleOpenChange:', {
      open,
      hasValidOrganization,
      organizationId,
      orgLoading
    })

    if (open && (!hasValidOrganization || !organizationId)) {
      toast({
        title: 'No Organization Context',
        description: 'Please log in or wait for demo organization to load.',
        variant: 'destructive'
      })
      return
    }

    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className="gap-2 bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-teal)] hover:to-[var(--color-accent-teal)]"
            disabled={orgLoading}
          >
            <Plus className="h-4 w-4" />
            {orgLoading ? 'Loading...' : 'New Sales Order'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          'border-[var(--color-border)]/50 shadow-2xl overflow-y-auto transition-all duration-300',
          isExpanded ? 'max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh]' : 'max-w-4xl max-h-[90vh]'
        )}
        style={{
          background: `
            linear-gradient(135deg,
              rgba(31, 41, 55, 0.95) 0%,
              rgba(17, 24, 39, 0.98) 100%
            )
          `,
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: `
            0 24px 48px rgba(0, 0, 0, 0.8),
            0 12px 24px rgba(5, 10, 48, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `
        }}
      >
        <DialogHeader className="border-b border-[var(--color-border)]/50 bg-[var(--color-body)]/30 backdrop-blur-xl p-6">
          <DialogTitle className="text-[var(--color-text-primary)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="bg-[var(--color-body)] w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `
                    linear-gradient(135deg,
                      rgba(5, 10, 48, 0.15) 0%,
                      rgba(0, 12, 102, 0.15) 100%
                    )
                  `,
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <ShoppingCart className="h-5 w-5 text-[var(--color-icon-secondary)]" />
              </div>
              <span className="text-xl font-semibold">Create New Sales Order</span>
            </div>
            <div className="bg-[var(--color-body)] flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-body)]/50"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-body)]/50"
              >
                <X className="bg-[var(--color-body)] h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Order Details */}
            <div className="bg-[var(--color-body)] lg:col-span-2 space-y-6">
              {/* Customer Selection */}
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-[var(--color-icon-secondary)]" />
                  <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">
                    Customer Information
                  </h3>
                </div>
                {!selectedCustomer && !newCustomerMode ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
                      <Input
                        placeholder="Search customers..."
                        value={customerSearchTerm}
                        onChange={e => setCustomerSearchTerm(e.target.value)}
                        className="pl-10 bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredCustomers.map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-3 bg-[var(--color-body)]/50 rounded-lg hover:bg-[var(--color-body)] cursor-pointer transition-colors"
                        >
                          <div className="flex justify-between">
                            <div>
                              <p className="font-medium text-[var(--color-text-primary)]">
                                {customer.entity_name}
                              </p>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {customer.entity_code}
                              </p>
                            </div>
                            <div className="text-right">
                              {customer.phone && (
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                  {customer.phone}
                                </p>
                              )}
                              {customer.email && (
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  {customer.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setNewCustomerMode(true)}
                      className="w-full border-[var(--color-accent-teal)] text-[var(--color-text-secondary)] hover:bg-[var(--color-body)]/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Customer
                    </Button>
                  </div>
                ) : newCustomerMode ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[var(--color-text-secondary)]">
                          Customer Name *
                        </Label>
                        <Input
                          value={customerFormData.name}
                          onChange={e =>
                            setCustomerFormData({
                              ...customerFormData,
                              name: e.target.value
                            })
                          }
                          className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <Label className="text-[var(--color-text-secondary)]">Phone</Label>
                        <Input
                          value={customerFormData.phone}
                          onChange={e =>
                            setCustomerFormData({
                              ...customerFormData,
                              phone: e.target.value
                            })
                          }
                          className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[var(--color-text-secondary)]">Email</Label>
                      <Input
                        type="email"
                        value={customerFormData.email}
                        onChange={e =>
                          setCustomerFormData({
                            ...customerFormData,
                            email: e.target.value
                          })
                        }
                        className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label className="text-[var(--color-text-secondary)]">Address</Label>
                      <Textarea
                        value={customerFormData.address}
                        onChange={e =>
                          setCustomerFormData({
                            ...customerFormData,
                            address: e.target.value
                          })
                        }
                        className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                        placeholder="Enter complete address"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateCustomer}
                        disabled={!customerFormData.name.trim() || isSubmitting}
                        className="bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-teal)] hover:to-[var(--color-accent-teal)]"
                      >
                        Create Customer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewCustomerMode(false)
                          setCustomerFormData({ name: '', phone: '', email: '', address: '' })
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {selectedCustomer.entity_name}
                      </p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {selectedCustomer.entity_code}
                      </p>
                      {selectedCustomer.phone && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>
                      <X className="bg-[var(--color-body)] h-4 w-4" />
                    </Button>
                  </div>
                )}
              </Card>

              {/* Product Selection */}
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-[var(--color-icon-secondary)]" />
                  <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">
                    Add Products
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[var(--color-text-secondary)]" />
                    <Input
                      placeholder="Search products..."
                      value={productSearchTerm}
                      onChange={e => setProductSearchTerm(e.target.value)}
                      className="pl-10 bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                    />
                  </div>
                  {productSearchTerm && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          onClick={() => addLineItem(product)}
                          className="p-3 bg-[var(--color-body)]/50 rounded-lg hover:bg-[var(--color-body)] cursor-pointer transition-colors"
                        >
                          <div className="bg-[var(--color-body)] flex justify-between">
                            <div>
                              <p className="font-medium text-[var(--color-text-primary)]">
                                {product.entity_name}
                              </p>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {product.entity_code}
                              </p>
                              {product.category && (
                                <Badge
                                  variant="outline"
                                  className="bg-[var(--color-body)] mt-1 text-xs"
                                >
                                  {product.category}
                                </Badge>
                              )}
                            </div>
                            <div className="bg-[var(--color-body)] text-right">
                              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                ₹{product.price?.toLocaleString('en-IN') || '0'}
                              </p>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                Stock: {product.stock_quantity || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* Line Items */}
              {lineItems.length > 0 && (
                <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]">
                  <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Order Items
                  </h3>
                  <div className="space-y-3">
                    {lineItems.map((item, index) => (
                      <div key={index} className="p-3 bg-[var(--color-body)]/50 rounded-lg">
                        <div className="bg-[var(--color-body)] flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-[var(--color-text-primary)]">
                              {item.product.entity_name}
                            </p>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              {item.product.entity_code}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="bg-[var(--color-body)] text-red-400 hover:text-red-300"
                          >
                            <X className="bg-[var(--color-body)] h-4 w-4" />
                          </Button>
                        </div>
                        <div className="bg-[var(--color-body)] grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs text-[var(--color-text-secondary)]">
                              Quantity
                            </Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                              className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[var(--color-text-secondary)]">
                              Unit Price
                            </Label>
                            <Input
                              type="number"
                              value={item.unit_price}
                              onChange={e => updateLineItem(index, 'unit_price', e.target.value)}
                              className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[var(--color-text-secondary)]">
                              Amount
                            </Label>
                            <Input
                              value={`₹${item.line_amount.toLocaleString('en-IN')}`}
                              disabled
                              className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-secondary)] backdrop-blur-sm"
                            />
                          </div>
                        </div>
                        <div className="bg-[var(--color-body)] mt-2">
                          <Label className="text-xs text-[var(--color-text-secondary)]">
                            Notes
                          </Label>
                          <Input
                            value={item.notes || ''}
                            onChange={e => updateLineItem(index, 'notes', e.target.value)}
                            className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                            placeholder="Add notes..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Order Summary & Details */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]">
                <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="bg-[var(--color-body)] flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">
                      Items ({totals.itemCount})
                    </span>
                    <span className="text-[var(--color-text-primary)]">
                      ₹{totals.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-[var(--color-body)] flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">
                      Discount ({orderDetails.discount_percent}%)
                    </span>
                    <span className="text-[var(--color-text-primary)]">
                      -₹{totals.discountAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="bg-[var(--color-body)] flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">
                      GST ({orderDetails.tax_percent}%)
                    </span>
                    <span className="text-[var(--color-text-primary)]">
                      ₹{totals.taxAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <Separator className="bg-[var(--color-body)]" />
                  <div className="bg-[var(--color-body)] flex justify-between font-semibold">
                    <span className="text-[var(--color-text-primary)]">Total</span>
                    <span className="text-[var(--color-text-primary)]">
                      ₹{totals.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Order Details */}
              <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">
                    Order Details
                  </h3>
                </div>
                <div className="bg-[var(--color-body)] space-y-3">
                  <div className="bg-[var(--color-body)] grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-[var(--color-text-secondary)]">Order Date</Label>
                      <Input
                        type="date"
                        value={orderDetails.order_date}
                        onChange={e =>
                          setOrderDetails({
                            ...orderDetails,
                            order_date: e.target.value
                          })
                        }
                        className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm [color-scheme:dark]"
                      />
                    </div>
                    <div>
                      <Label className="text-[var(--color-text-secondary)]">Delivery Date</Label>
                      <Input
                        type="date"
                        value={orderDetails.delivery_date}
                        onChange={e =>
                          setOrderDetails({
                            ...orderDetails,
                            delivery_date: e.target.value
                          })
                        }
                        className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[var(--color-text-secondary)]">Payment Terms</Label>
                    <Select
                      value={orderDetails.payment_terms}
                      onValueChange={value =>
                        setOrderDetails({
                          ...orderDetails,
                          payment_terms: value
                        })
                      }
                    >
                      <SelectTrigger className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NET30">NET 30 Days</SelectItem>
                        <SelectItem value="NET15">NET 15 Days</SelectItem>
                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                        <SelectItem value="ADVANCE">Advance Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[var(--color-text-secondary)]">Delivery Method</Label>
                    <Select
                      value={orderDetails.delivery_method}
                      onValueChange={value =>
                        setOrderDetails({
                          ...orderDetails,
                          delivery_method: value
                        })
                      }
                    >
                      <SelectTrigger className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pickup">Customer Pickup</SelectItem>
                        <SelectItem value="delivery">Home Delivery</SelectItem>
                        <SelectItem value="shipping">Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-[var(--color-body)] grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[var(--color-text-secondary)]">Discount %</Label>
                      <Input
                        type="number"
                        value={orderDetails.discount_percent}
                        onChange={e =>
                          setOrderDetails({
                            ...orderDetails,
                            discount_percent: parseFloat(e.target.value) || 0
                          })
                        }
                        className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label className="text-[var(--color-text-secondary)]">GST %</Label>
                      <Input
                        type="number"
                        value={orderDetails.tax_percent}
                        onChange={e =>
                          setOrderDetails({
                            ...orderDetails,
                            tax_percent: parseFloat(e.target.value) || 0
                          })
                        }
                        className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                        min="0"
                        max="30"
                        step="0.1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[var(--color-text-secondary)]">Notes</Label>
                    <Textarea
                      value={orderDetails.notes}
                      onChange={e => setOrderDetails({ ...orderDetails, notes: e.target.value })}
                      className="bg-[var(--color-body)]/50 border-[var(--color-border)]/50 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:border-[#6b6975] focus:ring-[var(--color-accent-teal)]/20 backdrop-blur-sm"
                      placeholder="Special instructions..."
                      rows={3}
                    />
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="bg-[var(--color-body)] space-y-3">
                <Button
                  onClick={handleSubmitOrder}
                  disabled={!selectedCustomer || lineItems.length === 0 || isSubmitting}
                  className="w-full bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-teal)] hover:to-[var(--color-accent-teal)] text-[var(--color-text-primary)] shadow-lg disabled:"
                >
                  {isSubmitting ? 'Creating Order...' : 'Create Sales Order'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-body)]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
