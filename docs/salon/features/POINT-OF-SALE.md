# Point of Sale (POS) Feature Guide

**Version**: 2.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURE.POS.v1`

> **Complete reference for the Salon Point of Sale system with catalog, cart management, payment processing, and receipt printing**

---

## 📋 Overview

### Purpose
The Point of Sale (POS) system provides a comprehensive transaction processing interface with:
- **Dual-pane layout**: Service/product catalog + shopping cart
- **Appointment integration**: Load appointments from kanban board with one click
- **Bill setup workflow**: Branch, customer, stylist selection before first item
- **Multi-payment support**: Cash, card, bank transfer, voucher
- **GL Journal posting**: Automatic double-entry accounting (Finance DNA v2)
- **Receipt printing**: Thermal-ready PDF receipts
- **Commission tracking**: Automatic stylist commission calculation

### User Roles
- **Owner/Admin**: Full access to all POS features
- **Receptionist**: Can process sales, cannot modify pricing
- **Manager**: Full access with reporting capabilities

### Related Features
- [Appointments](/docs/salon/features/APPOINTMENTS.md) - Load appointments for payment
- [Dashboard](/docs/salon/features/DASHBOARD.md) - Revenue analytics from sales
- [Reports](/docs/salon/features/REPORTS.md) - Sales reports and analytics
- [Finance Integration](/docs/salon/features/FINANCE.md) - GL Journal posting

---

## 🏗️ Architecture

### Data Model

**Sacred Six Tables Used:**
1. **universal_transactions**
   - **SALE** transactions (`transaction_type: 'SALE'`)
     - Contains service/product line items
     - Links to customer (source_entity_id) and branch (target_entity_id)
     - Smart Code: `HERA.SALON.POS.TXN.SALE.v1`

   - **GL_JOURNAL** transactions (`transaction_type: 'GL_JOURNAL'`)
     - Double-entry accounting records
     - Posted from SALE transactions
     - Smart Codes: `HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1` (legacy), `HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2` (enhanced)

2. **universal_transaction_lines**
   - Service lines (`line_type: 'service'`)
   - Product lines (`line_type: 'product'`)
   - Discount lines (`line_type: 'discount'`)
   - Tip lines (`line_type: 'tip'`)
   - GL lines (`line_type: 'gl'`) for double-entry accounting

3. **core_entities**
   - Customers (`entity_type: 'CUSTOMER'`)
   - Services (`entity_type: 'SERVICE'`)
   - Products (`entity_type: 'PRODUCT'`)
   - Staff (`entity_type: 'STAFF'`)

4. **core_relationships**
   - Customer-to-Appointment relationships
   - Staff-to-Service assignments

**Smart Codes:**
```typescript
// Transactions
'HERA.SALON.POS.TXN.SALE.v1'                      // Sale transaction
'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1'      // GL Journal (legacy)
'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2'      // GL Journal (enhanced with payment_methods)

// Transaction Lines
'HERA.SALON.POS.SALE.LINE.SERVICE.v1'            // Service line
'HERA.SALON.POS.SALE.LINE.PRODUCT.v1'            // Product line
'HERA.SALON.POS.SALE.LINE.DISCOUNT.v1'           // Discount line
'HERA.SALON.POS.SALE.LINE.TIP.v1'                // Tip line

// Cart Persistence (optional)
'HERA.SALON.POS.ENTITY.CART.v1'                  // Persistent cart entity
'HERA.SALON.POS.CART.DYN.LINE_ITEMS.v1'          // Cart line items
'HERA.SALON.POS.CART.DYN.DISCOUNTS.v1'           // Cart discounts
'HERA.SALON.POS.CART.DYN.TIPS.v1'                // Cart tips
```

### Component Hierarchy

```
SalonPOSPage (Guard Wrapper)
  └── SimpleSalonGuard
        └── POSContent (Main Component)
              ├── PremiumMobileHeader (Mobile only)
              ├── Desktop Header
              ├── Two-Pane Layout
              │     ├── CatalogPane (Left/Top) - 60% width desktop, full width mobile
              │     │     ├── Branch Selector
              │     │     ├── Search Bar
              │     │     ├── Category Tabs (Services/Products/All)
              │     │     └── Item Grid (Services + Products)
              │     │
              │     └── CartSidebar (Right/Bottom) - 420px width desktop, full width mobile
              │           ├── Customer Search
              │           ├── Line Items List
              │           ├── Discount/Tip Controls
              │           ├── Transaction Date Selector (old bill entry)
              │           ├── Totals Summary
              │           └── Payment Button
              │
              └── Modals
                    ├── BillSetupModal - Branch, Customer, Stylist selection
                    ├── PaymentDialog - Payment method and amount
                    ├── Receipt - Printable receipt modal
                    ├── TicketDetailsModal - Full ticket editor
                    └── ValidationWarningModal - Validation errors
```

### State Management

**usePosTicket Hook** (Central state manager):
```typescript
const {
  ticket,                      // Current ticket state
  addLineItem,                 // Add service/product
  updateLineItem,             // Update quantity/price
  removeLineItem,             // Remove item
  addDiscount,                // Add discount (cart or item level)
  removeDiscount,             // Remove discount
  addTip,                     // Add tip (general or per-stylist)
  removeTip,                  // Remove tip
  updateTicketInfo,           // Update customer/branch/appointment
  clearTicket,                // Clear entire ticket
  calculateTotals,            // Get subtotal, tax, total
  validateTicket,             // Check if ticket is valid
  checkout                    // Create SALE transaction
} = usePosTicket({ organizationId })
```

**Ticket Structure**:
```typescript
interface PosTicket {
  lineItems: LineItem[]        // Services and products
  discounts: Discount[]        // Cart-level or item-level discounts
  tips: Tip[]                  // General or per-stylist tips
  customer_id?: string         // Selected customer
  customer_name?: string
  appointment_id?: string      // Linked appointment
  branch_id?: string           // Selected branch
  branch_name?: string
  transaction_date?: string    // Custom date for old bill entry
}

interface LineItem {
  id: string                   // Unique line ID
  entity_id: string            // Service or product entity ID
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number          // quantity * unit_price
  stylist_id?: string          // Required for services
  stylist_name?: string
  appointment_id?: string      // If from appointment
  discount_percent?: number
  discount_amount?: number
}
```

### API Integration

**RPC Functions Used:**
- `hera_entities_crud_v1` - Fetch services, products, customers, staff
- `hera_txn_crud_v1` - Create SALE and GL_JOURNAL transactions
- `hera_finance_post_gl_v1` - Post GL entries for sales

**Universal API v2 Endpoints:**
- `/api/v2/entities` - Entity CRUD (services, products, customers)
- `/api/v2/transactions` - Transaction CRUD (sales, appointments)
- `/api/v2/finance/post-gl` - GL posting endpoint

---

## 🔧 Key Components

### 1. Main POS Page
**File**: `/src/app/salon/pos/page.tsx` (1132 lines)

**Purpose**: Entry point with authentication guard and appointment loading logic

**Key Features**:
- **Appointment Loading**:
  - Primary method: sessionStorage (from kanban board)
  - Fallback: URL parameter `?appointment=<id>`
- **Auto-validation**: Branch, customer, stylist checks before payment
- **Keyboard shortcuts**: Ctrl/Cmd+T for ticket details, Ctrl/Cmd+Plus for search
- **Mobile-first responsive layout**

**Appointment Loading Logic**:
```typescript
// Priority 1: Load from sessionStorage (kanban integration)
const storedAppointment = sessionStorage.getItem('pos_appointment')
if (storedAppointment) {
  const appointmentData = JSON.parse(storedAppointment)

  // Add customer
  addCustomerToTicket({
    customer_id: appointmentData.customer_id,
    customer_name: appointmentData.customer_name
  })

  // Set default stylist
  setDefaultStylistId(appointmentData.stylist_id)
  setDefaultStylistName(appointmentData.stylist_name)

  // Set branch
  setSelectedBranchId(appointmentData.branch_id)
  updateTicketInfo({ branch_id: appointmentData.branch_id })

  // Add services from appointment
  addItemsFromAppointment({
    appointment_id: appointmentData.id,
    customer_id: appointmentData.customer_id,
    customer_name: appointmentData.customer_name,
    services: appointmentData.service_ids.map((id, index) => ({
      id,
      name: appointmentData.service_names[index],
      price: appointmentData.service_prices[index],
      stylist_id: appointmentData.stylist_id,
      stylist_name: appointmentData.stylist_name
    }))
  })

  // Clear sessionStorage to prevent stale data
  sessionStorage.removeItem('pos_appointment')
}
```

### 2. CatalogPane Component
**File**: `/src/components/salon/pos/CatalogPane.tsx`

**Purpose**: Display searchable catalog of services and products with branch filter

**Features**:
- Branch selector dropdown (required before adding items)
- Search bar with live filtering
- Category tabs: Services, Products, All
- Grid layout with service/product cards
- Stylist selection modal for services
- Quick-add functionality

**Usage**:
```tsx
<CatalogPane
  organizationId={organizationId}
  onAddItem={(item, staffId, staffName) => {
    // Add to cart
  }}
  currentCustomerId={ticket.customer_id}
  currentAppointmentId={ticket.appointment_id}
  defaultStylistId={defaultStylistId}
  defaultStylistName={defaultStylistName}
  onBranchChange={handleBranchChange}
  contextBranchId={selectedBranchId}
/>
```

**Item Card Display**:
```tsx
<div className="p-4 rounded-xl hover:scale-105 transition-transform cursor-pointer">
  <h3 className="font-semibold text-champagne">{item.entity_name}</h3>
  <p className="text-sm text-bronze">{item.category || 'Uncategorized'}</p>
  <div className="text-xl font-bold text-gold">
    {formatCurrency(item.price || item.unit_price)}
  </div>
  {item.duration && (
    <div className="text-xs text-bronze">
      {item.duration} minutes
    </div>
  )}
</div>
```

### 3. CartSidebar Component
**File**: `/src/components/salon/pos/CartSidebar.tsx`

**Purpose**: Display current ticket with line items, discounts, tips, and payment controls

**Features**:
- Customer search/selection
- Line item list with quantity controls
- Stylist assignment per service
- Discount management (percentage or fixed amount)
- Tip management (general or per-stylist)
- Transaction date selector (for old bill entry)
- Totals calculation display
- Clear cart button
- Proceed to Payment button

**Line Item Display**:
```tsx
{ticket.lineItems.map(item => (
  <div key={item.id} className="p-3 rounded-lg bg-charcoal-light">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h4 className="font-medium text-champagne">{item.entity_name}</h4>
        {item.stylist_name && (
          <p className="text-xs text-bronze">
            <Users className="w-3 h-3 inline mr-1" />
            {item.stylist_name}
          </p>
        )}
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-2">
        <button onClick={() => updateLineItem(item.id, { quantity: item.quantity - 1 })}>
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center">{item.quantity}</span>
        <button onClick={() => updateLineItem(item.id, { quantity: item.quantity + 1 })}>
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Price */}
      <div className="text-right ml-4">
        <div className="font-semibold text-champagne">
          {formatCurrency(item.line_amount)}
        </div>
        <div className="text-xs text-bronze">
          {formatCurrency(item.unit_price)} each
        </div>
      </div>

      {/* Remove button */}
      <button onClick={() => removeLineItem(item.id)}>
        <X className="w-4 h-4 text-rose" />
      </button>
    </div>
  </div>
))}
```

**Totals Display**:
```tsx
<div className="space-y-2 p-4 rounded-lg bg-charcoal-light">
  <div className="flex justify-between text-sm">
    <span className="text-bronze">Subtotal</span>
    <span className="text-champagne">{formatCurrency(totals.subtotal)}</span>
  </div>

  {totals.discountAmount > 0 && (
    <div className="flex justify-between text-sm">
      <span className="text-bronze">Discount</span>
      <span className="text-emerald">-{formatCurrency(totals.discountAmount)}</span>
    </div>
  )}

  <div className="flex justify-between text-sm">
    <span className="text-bronze">Tax (5%)</span>
    <span className="text-champagne">{formatCurrency(totals.taxAmount)}</span>
  </div>

  {totals.tipAmount > 0 && (
    <div className="flex justify-between text-sm">
      <span className="text-bronze">Tip</span>
      <span className="text-gold">{formatCurrency(totals.tipAmount)}</span>
    </div>
  )}

  <div className="border-t border-gold/20 pt-2 mt-2">
    <div className="flex justify-between text-lg font-bold">
      <span className="text-champagne">Total</span>
      <span className="text-gold">{formatCurrency(totals.total)}</span>
    </div>
  </div>
</div>
```

### 4. BillSetupModal Component
**File**: `/src/components/salon/pos/BillSetupModal.tsx`

**Purpose**: Unified modal for branch, customer, and stylist selection before first item

**When Shown**:
- First item added to cart (empty cart → first item)
- Payment clicked but missing required data
- Branch not selected
- Customer not selected
- Service added but stylist not assigned

**Fields**:
```typescript
interface BillSetupData {
  branchId: string          // Required
  branchName: string
  customerId: string        // Required
  customerName: string
  stylistId?: string        // Optional (only required if cart has services)
  stylistName?: string
}
```

**Usage**:
```tsx
<BillSetupModal
  open={isBillSetupOpen}
  onClose={() => setIsBillSetupOpen(false)}
  onComplete={(data) => {
    setSelectedBranchId(data.branchId)
    addCustomerToTicket({
      customer_id: data.customerId,
      customer_name: data.customerName
    })
    if (data.stylistId) {
      setDefaultStylistId(data.stylistId)
      setDefaultStylistName(data.stylistName)
    }
  }}
  organizationId={organizationId}
  currentBranchId={selectedBranchId}
  currentCustomerId={ticket.customer_id}
  currentStylistId={defaultStylistId}
  lineItems={ticket.lineItems}        // Check if services exist
  pendingItem={pendingItem}           // Check if pending item is service
  title="Bill Setup"
  description="All three fields are required for every sale"
/>
```

**Validation Logic**:
```typescript
// Check if stylist is required
const hasServices = lineItems.some(item => item.entity_type === 'service')
const pendingIsService = pendingItem?.__kind === 'SERVICE'
const stylistRequired = hasServices || pendingIsService

// Form validation
const isValid = !!(
  selectedBranch &&
  selectedCustomer &&
  (!stylistRequired || selectedStylist)
)
```

### 5. PaymentDialog Component
**File**: `/src/components/salon/pos/PaymentDialog.tsx`

**Purpose**: Process payment with multiple payment methods and amount entry

**Features**:
- Payment method selection (cash, card, bank_transfer, voucher)
- Amount input with currency formatting
- Change calculation for cash payments
- GL Journal posting (Finance DNA v2)
- Split payment support (future enhancement)
- Receipt generation

**Payment Flow**:
```typescript
const handlePayment = async () => {
  // 1. Validate ticket
  const validation = validateTicket()
  if (!validation.isValid) {
    toast({ title: 'Validation Failed', description: validation.errors.join(', ') })
    return
  }

  // 2. Create SALE transaction
  const saleTransaction = await createSaleTransaction({
    organizationId,
    customer_id: ticket.customer_id,
    branch_id: selectedBranchId,
    lineItems: ticket.lineItems,
    discounts: ticket.discounts,
    tips: ticket.tips,
    totals: calculateTotals(),
    transaction_date: ticket.transaction_date || new Date().toISOString()
  })

  // 3. Post GL Journal entries (Finance DNA v2)
  const glJournal = await postGLJournal({
    origin_transaction_id: saleTransaction.id,
    organization_id: organizationId,
    branch_id: selectedBranchId,
    payment_method: selectedPaymentMethod,
    payment_amount: paymentAmount,
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmount,
    tip_amount: totals.tipAmount,
    tax_amount: totals.taxAmount,
    total: totals.total,
    lineItems: ticket.lineItems,
    customer_id: ticket.customer_id,
    customer_name: ticket.customer_name
  })

  // 4. Update appointment status if linked
  if (ticket.appointment_id) {
    await updateAppointmentStatus({
      id: ticket.appointment_id,
      status: 'completed'
    })

    // Set localStorage flag for calendar refresh
    localStorage.setItem('appointment_status_updated', JSON.stringify({
      appointment_id: ticket.appointment_id,
      status: 'completed',
      timestamp: new Date().toISOString()
    }))
  }

  // 5. Clear ticket and show receipt
  clearTicket()
  onComplete({
    sale: saleTransaction,
    glJournal,
    receiptData: {
      sale_id: saleTransaction.id,
      transaction_date: saleTransaction.transaction_date,
      customer_name: ticket.customer_name,
      branch_name: branchName,
      lineItems: ticket.lineItems,
      totals: calculateTotals(),
      payment_method: selectedPaymentMethod,
      payment_amount: paymentAmount
    }
  })
}
```

### 6. Receipt Component
**File**: `/src/components/salon/pos/Receipt.tsx`

**Purpose**: Display printable receipt with thermal printer optimization

**Features**:
- 80mm thermal printer format (304px width)
- Organization logo/header
- Transaction details
- Line items with quantity and prices
- Totals breakdown
- Payment method
- QR code for digital receipt (future)
- Print button with CSS print media query

**Receipt Structure**:
```typescript
interface ReceiptData {
  sale_id: string
  transaction_date: string
  customer_name: string
  customer_phone?: string
  branch_name: string
  lineItems: LineItem[]
  totals: Totals
  payment_method: string
  payment_amount: number
  change_amount?: number
  cashier_name?: string
}
```

**Print Styles**:
```css
@media print {
  @page {
    size: 80mm auto;
    margin: 0;
  }

  body {
    width: 80mm;
    font-size: 12px;
  }

  .no-print {
    display: none !important;
  }

  .receipt-content {
    padding: 8mm;
  }
}
```

---

## 🔌 Hooks & Utilities

### usePosTicket Hook
**File**: `/src/hooks/usePosTicket.ts` (649 lines)

**Purpose**: Comprehensive POS ticket state management with optional persistence

**Configuration**:
```typescript
interface UsePosTicketConfig {
  organizationId: string
  enablePersistence?: boolean    // Enable cart persistence to entities
  autoSave?: boolean            // Auto-save on changes
}

// Backward compatible: supports string organizationId
const posTicket = usePosTicket(organizationId)

// Or with persistence
const posTicket = usePosTicket({
  organizationId,
  enablePersistence: true,
  autoSave: true
})
```

**Returns**:
```typescript
interface UsePosTicketReturn {
  // State
  ticket: PosTicket

  // Line Item Actions
  addLineItem: (item: NewLineItem) => void
  updateLineItem: (id: string, updates: Partial<LineItem>) => void
  removeLineItem: (id: string) => void

  // Discount Actions
  addDiscount: (discount: Omit<Discount, 'id'>) => void
  removeDiscount: (id: string) => void

  // Tip Actions
  addTip: (tip: Omit<Tip, 'id'>) => void
  removeTip: (id: string) => void

  // Ticket Actions
  updateTicketInfo: (updates: Partial<PosTicket>) => void
  clearTicket: () => Promise<void>

  // Convenience Methods
  quickAddItem: (entityId: string, entityName: string, price: number) => void
  addItemsFromAppointment: (appointmentData: AppointmentData) => void
  addCustomerToTicket: (customerData: CustomerData) => void

  // Calculations
  calculateTotals: () => Totals
  validateTicket: () => { isValid: boolean; errors: string[] }
  getTicketSummary: () => TicketSummary

  // State Checks
  isEmpty: boolean
  hasItems: boolean
  isValid: boolean

  // Persistence Features (if enablePersistence)
  saveCart: () => Promise<void>
  savedCarts: Entity[]
  isLoadingCarts: boolean

  // Checkout
  checkout: (paymentData: PaymentData) => Promise<Transaction>
  isCheckingOut: boolean

  // Transaction History
  transactions: Transaction[]
  isLoadingTransactions: boolean
}
```

**Key Methods**:

**1. Calculate Totals**:
```typescript
const calculateTotals = (): Totals => {
  // Subtotal from line items
  const subtotal = ticket.lineItems.reduce((sum, item) => sum + item.line_amount, 0)

  // Calculate discount amount
  let discountAmount = 0
  ticket.discounts.forEach(discount => {
    if (discount.applied_to === 'subtotal') {
      if (discount.type === 'percentage') {
        discountAmount += (subtotal * discount.value) / 100
      } else {
        discountAmount += discount.value
      }
    }
  })

  // Tip amount
  const tipAmount = ticket.tips.reduce((sum, tip) => sum + tip.amount, 0)

  // Tax (5% rate - configurable in production)
  const taxableAmount = subtotal - discountAmount
  const taxRate = 0.05
  const taxAmount = taxableAmount * taxRate

  // Total
  const total = subtotal - discountAmount + tipAmount + taxAmount

  return {
    subtotal,
    discountAmount,
    tipAmount,
    taxAmount,
    total: Math.max(0, total) // Ensure non-negative
  }
}
```

**2. Validate Ticket**:
```typescript
const validateTicket = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Check for empty cart
  if (ticket.lineItems.length === 0) {
    errors.push('No items in ticket')
  }

  // Check for services without stylists
  const servicesWithoutStylist = ticket.lineItems.filter(
    item => item.entity_type === 'service' && !item.stylist_id
  )
  if (servicesWithoutStylist.length > 0) {
    errors.push('All services must have an assigned stylist')
  }

  // Check for invalid amounts
  const invalidItems = ticket.lineItems.filter(
    item => item.quantity <= 0 || item.unit_price < 0
  )
  if (invalidItems.length > 0) {
    errors.push('Invalid quantity or price on some items')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
```

**3. Checkout (Create Transaction)**:
```typescript
const checkout = async (paymentData: {
  payment_method: string
  payment_amount: number
  branch_id?: string
}) => {
  // Validate ticket
  const validation = validateTicket()
  if (!validation.isValid) {
    throw new Error(`Ticket validation failed: ${validation.errors.join(', ')}`)
  }

  const totals = calculateTotals()

  // Build transaction lines
  const lines = ticket.lineItems.map((item, index) => ({
    line_number: index + 1,
    line_type: item.entity_type,
    entity_id: item.entity_id,
    description: item.entity_name,
    quantity: item.quantity,
    unit_amount: item.unit_price,
    line_amount: item.line_amount,
    smart_code: item.entity_type === 'service'
      ? 'HERA.SALON.POS.SALE.LINE.SERVICE.v1'
      : 'HERA.SALON.POS.SALE.LINE.PRODUCT.v1',
    line_data: {
      stylist_id: item.stylist_id,
      stylist_name: item.stylist_name,
      appointment_id: item.appointment_id
    }
  }))

  // Add discount lines
  ticket.discounts.forEach(discount => {
    lines.push({
      line_number: lines.length + 1,
      line_type: 'discount',
      description: discount.description,
      quantity: 1,
      unit_amount: -discount.value,
      line_amount: -discount.value,
      smart_code: 'HERA.SALON.POS.SALE.LINE.DISCOUNT.v1',
      line_data: {
        discount_type: discount.type,
        applied_to: discount.applied_to
      }
    })
  })

  // Add tip lines
  ticket.tips.forEach(tip => {
    lines.push({
      line_number: lines.length + 1,
      line_type: 'tip',
      description: `Tip for ${tip.stylist_name || 'staff'}`,
      quantity: 1,
      unit_amount: tip.amount,
      line_amount: tip.amount,
      smart_code: 'HERA.SALON.POS.SALE.LINE.TIP.v1',
      line_data: {
        stylist_id: tip.stylist_id,
        stylist_name: tip.stylist_name,
        method: tip.method
      }
    })
  })

  // Create SALE transaction
  const transaction = await transactionHook.create({
    transaction_type: 'SALE',
    transaction_code: `SALE-${Date.now()}`,
    smart_code: 'HERA.SALON.POS.TXN.SALE.v1',
    transaction_date: ticket.transaction_date || new Date().toISOString(),
    source_entity_id: ticket.customer_id,
    target_entity_id: paymentData.branch_id || ticket.branch_id,
    total_amount: totals.total,
    transaction_status: 'completed',
    metadata: {
      payment_method: paymentData.payment_method,
      payment_amount: paymentData.payment_amount,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tip_amount: totals.tipAmount,
      tax_amount: totals.taxAmount,
      appointment_id: ticket.appointment_id
    },
    lines
  })

  // Clear ticket after successful checkout
  clearTicket()

  return transaction
}
```

### useAppointmentLookup Hook
**File**: `/src/hooks/useAppointmentLookup.ts`

**Purpose**: Load appointment details by ID for POS integration

**Returns**:
```typescript
interface UseAppointmentLookupReturn {
  loadAppointment: (appointmentId: string) => Promise<AppointmentDetails | null>
  isLoading: boolean
  error: string | null
}

interface AppointmentDetails {
  id: string
  customer_id: string
  customer_name: string
  stylist_id: string
  stylist_name: string
  service_ids: string[]
  service_names: string[]
  service_prices: number[]
  appointment_date: string
  appointment_time: string
  status: string
}
```

### useCustomerLookup Hook
**File**: `/src/hooks/useCustomerLookup.ts`

**Purpose**: Search and select customers for POS tickets

**Returns**:
```typescript
interface UseCustomerLookupReturn {
  customers: Entity[]
  searchCustomers: (query: string) => Entity[]
  isLoading: boolean
  refetch: () => Promise<void>
}
```

---

## 🎨 Patterns & Conventions

### Bill Setup Workflow

**Why**: Ensures all required data is collected before allowing items in cart

**Three Required Fields**:
1. **Branch** - Where is the sale happening? (for multi-location businesses)
2. **Customer** - Who is the customer? (required for GL posting)
3. **Stylist** - Who performed the service? (only if cart has services)

**Flow**:
```
1. User clicks item OR clicks Payment
   ↓
2. Check required fields
   - Branch selected? NO → Show BillSetupModal
   - Customer selected? NO → Show BillSetupModal
   - Cart has services? YES → Stylist selected? NO → Show BillSetupModal
   ↓
3. BillSetupModal collects missing data
   ↓
4. On complete:
   - Set branch → setSelectedBranchId(branchId)
   - Set customer → addCustomerToTicket(customer)
   - Set stylist → setDefaultStylistId(stylistId)
   ↓
5. If pending item exists, add it now with collected data
   ↓
6. If payment triggered, proceed to PaymentDialog
```

**Implementation**:
```typescript
const handleAddItem = (item: any, staffId?: string, staffName?: string) => {
  const isFirstItem = ticket.lineItems.length === 0
  const needsBranch = !selectedBranchId
  const isService = item.__kind === 'SERVICE'
  const needsStylist = isService && !staffId && !defaultStylistId

  // Show setup modal if missing required data
  if (isFirstItem || needsBranch || needsStylist) {
    setPendingItem({ item, staffId, staffName })
    setIsBillSetupOpen(true)
    return
  }

  // Add item directly
  addLineItem({
    entity_id: item.id,
    entity_type: isService ? 'service' : 'product',
    entity_name: item.title,
    quantity: 1,
    unit_price: item.price,
    stylist_id: staffId || defaultStylistId,
    stylist_name: staffName || defaultStylistName
  })
}
```

### Appointment-to-POS Integration

**Why**: Seamless flow from appointment booking to payment

**Kanban Board Integration** (Primary method):
```typescript
// In appointments kanban board (CompleteAppointmentDialog.tsx)
const handleNavigateToPOS = () => {
  // Store appointment data in sessionStorage
  sessionStorage.setItem('pos_appointment', JSON.stringify({
    id: appointment.id,
    customer_id: appointment.customer_id,
    customer_name: appointment.customer_name,
    stylist_id: appointment.stylist_id,
    stylist_name: appointment.stylist_name,
    branch_id: appointment.branch_id,
    service_ids: appointment.service_ids,
    service_names: appointment.service_names,
    service_prices: appointment.service_prices
  }))

  // Navigate to POS
  router.push('/salon/pos')
}
```

**POS Auto-Load** (in useEffect):
```typescript
useEffect(() => {
  // Check sessionStorage FIRST
  const storedAppointment = sessionStorage.getItem('pos_appointment')
  if (storedAppointment) {
    const appointmentData = JSON.parse(storedAppointment)

    // Auto-populate ticket
    addCustomerToTicket({
      customer_id: appointmentData.customer_id,
      customer_name: appointmentData.customer_name
    })

    setDefaultStylistId(appointmentData.stylist_id)
    setDefaultStylistName(appointmentData.stylist_name)
    setSelectedBranchId(appointmentData.branch_id)

    addItemsFromAppointment({
      appointment_id: appointmentData.id,
      customer_id: appointmentData.customer_id,
      customer_name: appointmentData.customer_name,
      services: appointmentData.service_ids.map((id, index) => ({
        id,
        name: appointmentData.service_names[index],
        price: appointmentData.service_prices[index],
        stylist_id: appointmentData.stylist_id,
        stylist_name: appointmentData.stylist_name
      }))
    })

    // Clear sessionStorage to prevent stale data
    sessionStorage.removeItem('pos_appointment')

    toast({
      title: '✅ Appointment Loaded',
      description: `Ready to process payment for ${appointmentData.customer_name}`
    })
  }
}, [])
```

**URL Parameter Integration** (Fallback):
```typescript
// Also support ?appointment=<id> URL parameter
const urlParams = new URLSearchParams(window.location.search)
const appointmentId = urlParams.get('appointment')

if (appointmentId) {
  const fullAppointment = await loadAppointment(appointmentId)
  if (fullAppointment) {
    addItemsFromAppointment(fullAppointment)
  }
}
```

### Old Bill Entry Pattern

**Why**: Allow receptionists to enter historical bills (missed payments, late entries)

**Transaction Date Selector**:
```tsx
// In CartSidebar component
<div className="p-4 rounded-lg bg-charcoal-light">
  <label className="text-sm text-bronze mb-2 block">
    Transaction Date (Optional)
  </label>
  <p className="text-xs text-bronze mb-2">
    Leave blank for today's date. Set a past date for historical bills.
  </p>
  <input
    type="date"
    value={ticket.transaction_date ? new Date(ticket.transaction_date).toISOString().split('T')[0] : ''}
    onChange={(e) => {
      if (e.target.value) {
        updateTicketInfo({
          transaction_date: new Date(e.target.value).toISOString()
        })
      } else {
        updateTicketInfo({
          transaction_date: undefined
        })
      }
    }}
    className="w-full rounded-lg p-2"
  />
</div>
```

**GL Journal Posting with Custom Date**:
```typescript
// When creating GL_JOURNAL, use custom date if provided
const glJournal = await postGLJournal({
  origin_transaction_id: saleTransaction.id,
  transaction_date: ticket.transaction_date || new Date().toISOString(),
  // ... other fields
})
```

### Responsive Mobile/Desktop Layouts

**Desktop Layout** (Side-by-side panes):
```tsx
<div className="flex flex-row h-[calc(100vh-62px)]">
  {/* Catalog - 60% width */}
  <div className="flex-1 min-w-0">
    <CatalogPane />
  </div>

  {/* Cart - 420px fixed width */}
  <div className="w-[420px] shrink-0">
    <CartSidebar />
  </div>
</div>
```

**Mobile Layout** (Stacked vertically):
```tsx
<div className="flex flex-col">
  {/* iOS status bar spacer */}
  <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

  {/* Mobile header */}
  <PremiumMobileHeader
    title="Point of Sale"
    subtitle={`${ticket.lineItems.length} items in cart`}
  />

  {/* Catalog - full width, above cart */}
  <div className="w-full">
    <CatalogPane />
  </div>

  {/* Cart - full width, below catalog */}
  <div className="w-full">
    <CartSidebar />
  </div>

  {/* Bottom spacing */}
  <div className="h-24 md:h-0" />
</div>
```

---

## 🔍 Common Tasks

### Task 1: Add a New Payment Method

**Goal**: Add "Loyalty Points" as a payment method

**Steps**:

**1. Update Payment Method Type**:
```typescript
// PaymentDialog.tsx
type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'voucher' | 'loyalty_points'
```

**2. Add Payment Method Option**:
```tsx
<button
  onClick={() => setSelectedMethod('loyalty_points')}
  className={`p-4 rounded-xl ${selectedMethod === 'loyalty_points' ? 'active' : ''}`}
>
  <Gift className="w-6 h-6 mb-2" />
  <span>Loyalty Points</span>
</button>
```

**3. Update GL Posting Logic**:
```typescript
// Finance integration - map payment method to GL account
const paymentMethodAccounts = {
  cash: '110100',           // Cash on Hand
  card: '110200',           // Card Receivable
  bank_transfer: '110300',  // Bank Account
  voucher: '120400',        // Voucher Receivable
  loyalty_points: '120500'  // Loyalty Points Liability
}
```

**4. Update Receipt Display**:
```tsx
{saleData.payment_method === 'loyalty_points' && (
  <div className="text-center py-4">
    <Gift className="w-8 h-8 mx-auto mb-2 text-gold" />
    <p className="text-sm text-bronze">
      Paid with {saleData.payment_amount} loyalty points
    </p>
  </div>
)}
```

### Task 2: Implement Split Payments

**Goal**: Allow customers to pay with multiple methods (e.g., 50% cash + 50% card)

**Steps**:

**1. Update Ticket State**:
```typescript
interface PosTicket {
  // ... existing fields
  split_payments?: SplitPayment[]
}

interface SplitPayment {
  id: string
  payment_method: PaymentMethod
  amount: number
  percentage: number  // % of total
}
```

**2. Update PaymentDialog UI**:
```tsx
const [isSplitPayment, setIsSplitPayment] = useState(false)
const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([])

// Toggle split payment mode
<button onClick={() => setIsSplitPayment(!isSplitPayment)}>
  <SplitSquare className="w-5 h-5 mr-2" />
  Split Payment
</button>

{isSplitPayment && (
  <div className="space-y-3">
    {splitPayments.map((payment, index) => (
      <div key={payment.id} className="flex items-center gap-3">
        {/* Payment method selector */}
        <select
          value={payment.payment_method}
          onChange={(e) => {
            const updated = [...splitPayments]
            updated[index].payment_method = e.target.value
            setSplitPayments(updated)
          }}
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          {/* ... other methods */}
        </select>

        {/* Amount input */}
        <input
          type="number"
          value={payment.amount}
          onChange={(e) => {
            const updated = [...splitPayments]
            updated[index].amount = parseFloat(e.target.value)
            updated[index].percentage = (parseFloat(e.target.value) / totals.total) * 100
            setSplitPayments(updated)
          }}
        />

        {/* Percentage display */}
        <span className="text-bronze">{payment.percentage.toFixed(1)}%</span>

        {/* Remove button */}
        <button onClick={() => {
          setSplitPayments(splitPayments.filter((_, i) => i !== index))
        }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}

    {/* Add payment button */}
    <button onClick={() => {
      setSplitPayments([
        ...splitPayments,
        {
          id: uuidv4(),
          payment_method: 'cash',
          amount: totals.total - splitPayments.reduce((sum, p) => sum + p.amount, 0),
          percentage: 0
        }
      ])
    }}>
      <Plus className="w-4 h-4 mr-2" />
      Add Payment Method
    </button>

    {/* Validation: total must match */}
    {(() => {
      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0)
      const difference = totals.total - totalPaid
      return Math.abs(difference) > 0.01 ? (
        <div className="text-rose text-sm">
          {difference > 0
            ? `Remaining: ${formatCurrency(difference)}`
            : `Overpaid by: ${formatCurrency(Math.abs(difference))}`}
        </div>
      ) : (
        <div className="text-emerald text-sm">✓ Payment balanced</div>
      )
    })()}
  </div>
)}
```

**3. Update GL Posting**:
```typescript
// Post multiple GL entries for split payments
splitPayments.forEach(payment => {
  glLines.push({
    account: paymentMethodAccounts[payment.payment_method],
    side: 'DR',
    amount: payment.amount,
    description: `${payment.payment_method.toUpperCase()} Payment`,
    payment_method: payment.payment_method
  })
})
```

### Task 3: Add Discount Presets

**Goal**: Add quick discount buttons (10% off, 20% off, AED 50 off)

**Steps**:

**1. Create Discount Presets**:
```typescript
const DISCOUNT_PRESETS = [
  { type: 'percentage', value: 5, label: '5% Off', description: 'Small discount' },
  { type: 'percentage', value: 10, label: '10% Off', description: 'Standard discount' },
  { type: 'percentage', value: 20, label: '20% Off', description: 'VIP discount' },
  { type: 'fixed', value: 50, label: 'AED 50 Off', description: 'Fixed AED 50' },
  { type: 'fixed', value: 100, label: 'AED 100 Off', description: 'Fixed AED 100' }
]
```

**2. Add Quick Discount Buttons** (in CartSidebar):
```tsx
<div className="p-4 rounded-lg bg-charcoal-light">
  <h3 className="text-sm font-semibold text-champagne mb-3">Quick Discounts</h3>
  <div className="grid grid-cols-2 gap-2">
    {DISCOUNT_PRESETS.map((preset) => (
      <button
        key={preset.label}
        onClick={() => {
          addDiscount({
            type: preset.type,
            value: preset.value,
            description: preset.description,
            applied_to: 'subtotal'
          })
        }}
        className="p-3 rounded-lg bg-charcoal hover:bg-charcoal-light transition-colors"
      >
        <div className="text-gold font-semibold">{preset.label}</div>
        <div className="text-xs text-bronze">{preset.description}</div>
      </button>
    ))}
  </div>
</div>
```

**3. Add Custom Discount Input**:
```tsx
<div className="mt-4">
  <label className="text-sm text-bronze">Custom Discount</label>
  <div className="flex gap-2 mt-2">
    <select
      value={customDiscountType}
      onChange={(e) => setCustomDiscountType(e.target.value)}
      className="rounded-lg p-2 bg-charcoal"
    >
      <option value="percentage">Percentage</option>
      <option value="fixed">Fixed Amount</option>
    </select>

    <input
      type="number"
      placeholder="Amount"
      value={customDiscountValue}
      onChange={(e) => setCustomDiscountValue(e.target.value)}
      className="flex-1 rounded-lg p-2 bg-charcoal"
    />

    <button
      onClick={() => {
        addDiscount({
          type: customDiscountType,
          value: parseFloat(customDiscountValue),
          description: `Custom ${customDiscountType} discount`,
          applied_to: 'subtotal'
        })
        setCustomDiscountValue('')
      }}
      className="px-4 rounded-lg bg-gold text-black"
    >
      Apply
    </button>
  </div>
</div>
```

### Task 4: Implement Commission Tracking

**Goal**: Calculate and display stylist commissions for each service

**Steps**:

**1. Add Commission Rates** (in dynamic_fields):
```typescript
// For each service entity
dynamic_fields: {
  commission_rate: {
    value: 40,  // 40% commission
    type: 'number',
    smart_code: 'HERA.SALON.SERVICE.FIELD.COMMISSION_RATE.v1'
  }
}

// For each staff entity
dynamic_fields: {
  default_commission_rate: {
    value: 35,  // 35% default commission
    type: 'number',
    smart_code: 'HERA.SALON.STAFF.FIELD.DEFAULT_COMMISSION_RATE.v1'
  }
}
```

**2. Calculate Commissions** (in CartSidebar):
```tsx
const calculateCommissions = () => {
  const commissionsByStylist = new Map<string, { name: string; total: number }>()

  ticket.lineItems.forEach(item => {
    if (item.entity_type === 'service' && item.stylist_id) {
      // Get commission rate (service-specific or default)
      const service = services.find(s => s.id === item.entity_id)
      const staff = staffMembers.find(s => s.id === item.stylist_id)

      const commissionRate = service?.dynamic_fields?.commission_rate?.value
        || staff?.dynamic_fields?.default_commission_rate?.value
        || 35  // 35% fallback

      const commission = (item.line_amount * commissionRate) / 100

      const existing = commissionsByStylist.get(item.stylist_id)
      if (existing) {
        existing.total += commission
      } else {
        commissionsByStylist.set(item.stylist_id, {
          name: item.stylist_name || 'Unknown',
          total: commission
        })
      }
    }
  })

  return Array.from(commissionsByStylist.values())
}

const commissions = calculateCommissions()
```

**3. Display Commission Summary**:
```tsx
{commissions.length > 0 && (
  <div className="p-4 rounded-lg bg-charcoal-light mt-4">
    <h3 className="text-sm font-semibold text-champagne mb-3">
      Stylist Commissions
    </h3>
    <div className="space-y-2">
      {commissions.map((comm) => (
        <div key={comm.name} className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            <span className="text-sm text-champagne">{comm.name}</span>
          </div>
          <span className="text-sm font-semibold text-gold">
            {formatCurrency(comm.total)}
          </span>
        </div>
      ))}

      <div className="border-t border-gold/20 pt-2 mt-2">
        <div className="flex justify-between font-semibold">
          <span className="text-champagne">Total Commissions</span>
          <span className="text-gold">
            {formatCurrency(commissions.reduce((sum, c) => sum + c.total, 0))}
          </span>
        </div>
      </div>
    </div>
  </div>
)}
```

**4. Include in GL Journal Metadata**:
```typescript
// Store commissions in GL_JOURNAL metadata for reporting
const glJournal = await postGLJournal({
  // ... other fields
  metadata: {
    // ... other metadata
    commissions: commissions.map(c => ({
      stylist_id: c.stylist_id,
      stylist_name: c.name,
      commission_amount: c.total,
      commission_rate: c.rate
    }))
  }
})
```

---

## 🧪 API Reference

### PosTicket Interface
```typescript
interface PosTicket {
  lineItems: LineItem[]
  discounts: Discount[]
  tips: Tip[]
  notes?: string
  customer_id?: string
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  appointment_id?: string
  branch_id?: string
  branch_name?: string
  cart_entity_id?: string
  transaction_date?: string
}

interface LineItem {
  id: string
  entity_id: string
  entity_type: 'service' | 'product'
  entity_name: string
  quantity: number
  unit_price: number
  line_amount: number
  stylist_id?: string
  stylist_name?: string
  appointment_id?: string
  notes?: string
  discount_percent?: number
  discount_amount?: number
}

interface Discount {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  description: string
  applied_to: 'subtotal' | 'item'
  item_id?: string
}

interface Tip {
  id: string
  amount: number
  method: 'cash' | 'card'
  stylist_id?: string
  stylist_name?: string
}

interface Totals {
  subtotal: number
  discountAmount: number
  tipAmount: number
  taxAmount: number
  total: number
}
```

---

## 🧪 Testing

### E2E Tests
**File**: `/tests/e2e/salon/pos.spec.ts`

**Test Scenarios**:
```typescript
test('POS loads and displays empty cart', async ({ page }) => {
  await page.goto('/salon/pos')

  await expect(page.getByText('Point of Sale')).toBeVisible()
  await expect(page.getByText('0 items in cart')).toBeVisible()
})

test('Bill Setup modal appears on first item add', async ({ page }) => {
  await page.goto('/salon/pos')

  // Click first service
  await page.getByTestId('service-item').first().click()

  // Bill Setup modal should appear
  await expect(page.getByText('Bill Setup')).toBeVisible()
  await expect(page.getByLabel('Branch')).toBeVisible()
  await expect(page.getByLabel('Customer')).toBeVisible()
  await expect(page.getByLabel('Stylist')).toBeVisible()
})

test('Appointment loads from sessionStorage', async ({ page }) => {
  // Set appointment data in sessionStorage
  await page.evaluate(() => {
    sessionStorage.setItem('pos_appointment', JSON.stringify({
      id: 'apt-123',
      customer_id: 'cust-456',
      customer_name: 'John Doe',
      stylist_id: 'staff-789',
      stylist_name: 'Jane Smith',
      service_ids: ['svc-1'],
      service_names: ['Haircut'],
      service_prices: [100]
    }))
  })

  await page.goto('/salon/pos')

  // Verify appointment loaded
  await expect(page.getByText('John Doe')).toBeVisible()
  await expect(page.getByText('Haircut')).toBeVisible()
  await expect(page.getByText('Jane Smith')).toBeVisible()
})

test('Complete sale workflow', async ({ page }) => {
  await page.goto('/salon/pos')

  // Add item
  await page.getByTestId('service-item').first().click()

  // Complete bill setup
  await page.getByLabel('Branch').selectOption({ index: 0 })
  await page.getByLabel('Customer').type('Test Customer')
  await page.getByTestId('customer-result').first().click()
  await page.getByLabel('Stylist').selectOption({ index: 0 })
  await page.getByRole('button', { name: 'Continue' }).click()

  // Proceed to payment
  await page.getByRole('button', { name: 'Proceed to Payment' }).click()

  // Select payment method
  await page.getByRole('button', { name: 'Cash' }).click()

  // Enter amount
  await page.getByLabel('Amount').fill('100')

  // Complete payment
  await page.getByRole('button', { name: 'Complete Payment' }).click()

  // Receipt should appear
  await expect(page.getByText('Receipt')).toBeVisible()
  await expect(page.getByText('Payment Successful')).toBeVisible()
})
```

---

## 📁 Related Files

### Core Files
- `/src/app/salon/pos/page.tsx` (1132 lines) - Main POS page
- `/src/hooks/usePosTicket.ts` (649 lines) - Ticket state management
- `/src/hooks/useAppointmentLookup.ts` - Appointment loading
- `/src/hooks/useCustomerLookup.ts` - Customer search

### Component Files
- `/src/components/salon/pos/CatalogPane.tsx` - Service/product catalog
- `/src/components/salon/pos/CartSidebar.tsx` - Shopping cart
- `/src/components/salon/pos/BillSetupModal.tsx` - Branch/customer/stylist setup
- `/src/components/salon/pos/PaymentDialog.tsx` - Payment processing
- `/src/components/salon/pos/Receipt.tsx` - Printable receipt
- `/src/components/salon/pos/TicketDetailsModal.tsx` - Full ticket editor
- `/src/components/salon/pos/StylistSelectionModal.tsx` - Stylist picker
- `/src/components/salon/pos/CustomerSearchModal.tsx` - Customer search
- `/src/components/salon/pos/ValidationWarningModal.tsx` - Validation errors

### Integration Files
- `/src/services/inventory-finance-integration.ts` - Finance DNA v2 integration
- `/src/services/inventory-posting-processor.ts` - GL Journal posting
- `/src/lib/finance/smart-codes-finance-dna-v2.ts` - Smart code mappings

---

## ⚠️ Known Issues

### Issue 1: sessionStorage Persistence Across Tabs
**Problem**: sessionStorage data doesn't persist across browser tabs

**Solution**: Use localStorage for persistent cart, sessionStorage only for appointment handoff

**Status**: Working as designed - sessionStorage isolation prevents cross-tab conflicts

### Issue 2: Tip Calculation for Split Tips
**Problem**: Splitting tip across multiple stylists requires manual calculation

**Future Enhancement**: Add "Split Tip Evenly" button that divides tip by number of stylists

**Status**: Planned for v2.1

### Issue 3: Receipt Printing on Mobile
**Problem**: Print dialog on mobile devices doesn't respect thermal printer sizing

**Solution**: Add "Share Receipt" button that generates PDF and uses native share API

**Status**: Planned for v2.1

---

## 💡 Examples

### Example 1: Complete POS Flow
```typescript
// 1. Load appointment from kanban
sessionStorage.setItem('pos_appointment', JSON.stringify({
  id: 'apt-123',
  customer_id: 'cust-456',
  customer_name: 'Sarah Johnson',
  stylist_id: 'staff-789',
  stylist_name: 'Maria Garcia',
  branch_id: 'branch-001',
  service_ids: ['svc-haircut', 'svc-color'],
  service_names: ['Premium Haircut', 'Full Color'],
  service_prices: [150, 450]
}))

// 2. Navigate to POS
router.push('/salon/pos')

// 3. POS auto-loads appointment
// - Customer: Sarah Johnson
// - Stylist: Maria Garcia
// - Branch: Downtown Salon
// - Services: Premium Haircut (AED 150), Full Color (AED 450)

// 4. Receptionist adds product
addLineItem({
  entity_id: 'prod-shampoo',
  entity_type: 'product',
  entity_name: 'Premium Shampoo',
  quantity: 2,
  unit_price: 75
})

// 5. Add tip
addTip({
  amount: 60,
  method: 'cash',
  stylist_id: 'staff-789',
  stylist_name: 'Maria Garcia'
})

// 6. Calculate totals
const totals = calculateTotals()
// subtotal: 750 (600 services + 150 products)
// discountAmount: 0
// tipAmount: 60
// taxAmount: 37.50 (5% of 750)
// total: 847.50

// 7. Process payment
checkout({
  payment_method: 'card',
  payment_amount: 847.50,
  branch_id: 'branch-001'
})

// 8. SALE transaction created
// 9. GL_JOURNAL posted (Finance DNA v2)
// 10. Appointment status updated to 'completed'
// 11. Receipt printed
```

### Example 2: Walk-in Customer (No Appointment)
```typescript
// 1. Receptionist opens POS (empty cart)

// 2. Bill Setup modal appears on first item
// - Select Branch: "Downtown Salon"
// - Search Customer: "John Smith" (or create new)
// - Select Stylist: "Lisa Chen"

// 3. Add services
addLineItem({
  entity_id: 'svc-haircut',
  entity_type: 'service',
  entity_name: 'Standard Haircut',
  quantity: 1,
  unit_price: 100,
  stylist_id: 'staff-456',
  stylist_name: 'Lisa Chen'
})

// 4. Apply discount
addDiscount({
  type: 'percentage',
  value: 10,
  description: 'First-time customer discount',
  applied_to: 'subtotal'
})

// 5. Process payment
// subtotal: 100
// discountAmount: 10
// taxAmount: 4.50
// total: 94.50
```

---

## 📊 Success Metrics

A POS feature is considered production-ready when:
- ✅ Bill setup modal appears correctly on first item
- ✅ Appointment loading works from sessionStorage and URL parameter
- ✅ All payment methods process correctly
- ✅ GL Journal posting succeeds with Finance DNA v2
- ✅ Receipts print correctly on 80mm thermal printers
- ✅ Commission calculations accurate
- ✅ Mobile responsive on 375px+ screens
- ✅ E2E tests cover complete sale workflow
- ✅ Zero cart loss during navigation
- ✅ Appointment status updates after payment

---

## 🔗 See Also

- [Appointments Feature](/docs/salon/features/APPOINTMENTS.md) - Load appointments for payment
- [Dashboard Feature](/docs/salon/features/DASHBOARD.md) - Revenue analytics
- [Finance Integration](/docs/salon/features/FINANCE.md) - GL Journal posting
- [Reports Feature](/docs/salon/features/REPORTS.md) - Sales reports
- [Mobile-First Layout](/docs/salon/features/MOBILE-LAYOUT.md) - Responsive design patterns

---

<div align="center">

**Point of Sale Feature Guide** | **HERA Salon Module v2.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Next: Appointments →](./APPOINTMENTS.md)

</div>
