# HERA POS & Payments Module

## 🚀 Overview

The POS module is a complete point-of-sale system with cart management, payment processing, and invoice generation. Built on HERA's universal transaction architecture with support for services, products, discounts, and tips. Features commission preview, inventory tracking, and seamless appointment integration.

## ✨ Features

- **Cart Management**: Add services/products with quantity control and line removal
- **Price List**: Categorized services and products with search functionality
- **Quick Actions**: One-click discounts (10%, custom) and tip presets (10%, 15%, 20%)
- **Payment Processing**: Cash and card payment methods with change calculation
- **Invoice Generation**: Professional invoices with print/email/download support
- **Appointment Integration**: Load services from appointments with "Open POS" flow
- **Commission Preview**: Real-time 35% commission calculation on services
- **Inventory Tracking**: Stock levels and low stock warnings on products
- **VAT Compliance**: 5% UAE VAT automatically calculated
- **Smart Codes**: Complete audit trail with HERA business intelligence

## 🏗️ Architecture

### State Management

```typescript
// Zustand store with persistence
useCartStore
├── lines: CartLine[]
├── totals: Totals (auto-calculated)
├── appointment_id?: string
├── customer_id?: string
├── addService()
├── addProduct()
├── addDiscount()
├── addTip()
├── updateQuantity()
├── removeLine()
└── clearCart()
```

### Transaction Flow

```
1. Build Cart → 2. Checkout → 3. Payment → 4. Invoice
     (sale)      (creates      (process     (display &
                 invoice)       payment)      print)
```

### File Structure

```
/app/(app)/pos/
├── sale/page.tsx              # Main POS page
├── payment/page.tsx           # Payment processing
└── invoice/[id]/page.tsx      # Invoice display

/components/pos/
├── CartDisplay.tsx            # Shopping cart UI
├── ServiceSelector.tsx        # Service catalog
├── ProductSelector.tsx        # Product catalog
├── QuickActions.tsx          # Discounts & tips
├── PaymentMethodSelector.tsx  # Cash/card selection
└── InvoiceDisplay.tsx        # Invoice with print

/components/analytics/
└── CommissionSummary.tsx     # Commission preview

/lib/
├── api/pos.ts                # POS API client
├── schemas/pos.ts            # Zod schemas
└── hooks/usePos.ts           # React Query hooks
```

## 🎯 Routes & Navigation

### POS Sale (`/pos/sale`)
- Main point-of-sale interface
- Service/product selection tabs
- Cart display with totals
- Quick actions panel
- Optional: `?apptId=xxx` to load appointment

### Payment Processing (`/pos/payment?invoice=xxx`)
- Invoice summary display
- Payment method selection (cash/card)
- Change calculation for cash
- Card reference fields
- Process payment button

### Invoice Display (`/pos/invoice/[id]`)
- Professional invoice layout
- Print/email/download actions
- Payment confirmation
- Transaction details
- Back to POS navigation

## 💡 Smart Codes

```
HERA.SALON.POS.SALE.WALKIN.v1      # Walk-in sale
HERA.SALON.POS.SALE.FROM_APPT.v1   # Appointment-based sale
HERA.SALON.POS.INVOICE.v1          # Invoice generation
HERA.SALON.POS.PAYMENT.PROCESS.v1  # Payment processing
HERA.SALON.POS.LINE.SERVICE.v1     # Service line item
HERA.SALON.POS.LINE.PRODUCT.v1     # Product line item
HERA.SALON.POS.LINE.DISCOUNT.v1    # Discount line
HERA.SALON.POS.LINE.TIP.v1         # Tip line
HERA.SALON.POS.LINE.TAX.v1         # Tax line
```

## 🔌 API Integration

### Mock API
Default behavior with pre-seeded price lists:

```typescript
// 10 services (Hair Cut, Color, Keratin, etc.)
// 10 products (Shampoo, Conditioner, etc.)
// Realistic inventory levels
// Simulated processing delays
```

### Real API Endpoints
```typescript
GET    /api/pos/price-list           # Services & products
POST   /api/pos/checkout             # Create invoice from cart
POST   /api/pos/pay                  # Process payment
GET    /api/pos/invoice/:id          # Retrieve invoice
GET    /api/pos/appointment/:id      # Load appointment services
```

## 📋 Universal Transaction Mapping

```typescript
// POS transactions map to universal schema:
{
  organization_id: "org-hairtalkz-001",
  txn: {
    txn_id: "TXN-1234567890-abc123",
    txn_type: "pos_order",
    smart_code: "HERA.SALON.POS.SALE.v1",
    status: "posted"
  },
  lines: [
    {
      line_type: "service_line",
      service_code: "SRV-001",
      qty: 1,
      unit_price: 150,
      amount: 150,
      smart_code: "HERA.SALON.POS.LINE.SERVICE.v1"
    }
  ]
}
```

## 💰 Business Rules

### Pricing & Tax
- **Currency**: AED (United Arab Emirates Dirham)
- **VAT Rate**: 5% (standard UAE VAT)
- **Tax Calculation**: Applied to (subtotal - discount)
- **Rounding**: 2 decimal places

### Commission
- **Rate**: 35% of service subtotal (display only)
- **Scope**: Services only (not products)
- **Timing**: Preview during sale, actual calculation in payroll

### Discounts
- **Types**: Percentage or fixed amount
- **Application**: Before tax calculation
- **Stacking**: Only one discount per transaction

### Tips
- **Presets**: 10%, 15%, 20% of service subtotal
- **Custom**: Any amount allowed
- **Application**: After tax (not taxed)

## 🎨 UI Components

### CartDisplay
- Line-by-line breakdown with controls
- Quantity adjustment (+ / -)
- Remove line button
- Subtotals, tax, and grand total
- Empty state messaging

### ServiceSelector
- Tabbed categories (Hair Services, Spa, etc.)
- Search functionality
- Duration display
- Price badges
- Click to add

### ProductSelector
- Inventory levels with color coding
- Out of stock prevention
- Category tabs
- SKU display
- Stock warnings (<10 units)

### QuickActions
- 2x3 grid layout
- Discount dialog with type selection
- Quick 10% discount button
- Tip presets (10%, 15%, 20%)
- Custom tip dialog

### PaymentMethodSelector
- Cash/card toggle cards
- Cash quick amounts (50, 100, 200, 500, 1000)
- Change calculation
- Card reference fields
- Processing state

### InvoiceDisplay
- Professional layout
- Business header info
- Line item details
- Tax breakdown
- Payment confirmation
- Print-optimized CSS

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit tests/unit/pos.schemas.spec.ts
```

Tests cover:
- Total calculations with all line types
- Tax computation
- Discount application
- Commission calculation
- Payment validation

### E2E Tests
```bash
npm run test:e2e tests/e2e/pos-flow.spec.ts
```

Tests cover:
- Complete sale flow
- Cart management
- Payment processing
- Invoice generation
- Appointment integration

## 🚀 Quick Start

### 1. Basic Sale
```
1. Navigate to /pos/sale
2. Click services/products to add
3. Apply discounts/tips as needed
4. Click "Checkout"
5. Select payment method
6. Process payment
7. View/print invoice
```

### 2. From Appointment
```
1. In appointment detail, click "Open POS"
2. Services pre-loaded in cart
3. Add products if needed
4. Complete checkout flow
```

### 3. Quick Discount
```
1. Add items to cart
2. Click "10% Off" for quick discount
3. Or click "Apply Discount" for custom
4. Select percentage/fixed amount
5. Enter value and reason
```

## 🔧 Configuration

### Environment Variables
```bash
# Use mock API
NEXT_PUBLIC_USE_MOCK=true

# Organization context
DEFAULT_ORGANIZATION_ID=org-hairtalkz-001

# VAT configuration
VAT_RATE=0.05
DEFAULT_CURRENCY=AED

# Commission settings
DEFAULT_COMMISSION_RATE=0.35
```

### Mock Data
- Located in `/lib/api/pos.ts`
- 10 services with realistic salon pricing
- 10 products with inventory levels
- Appointment-specific service loading

## 🎯 State Persistence

Cart state persists across page refreshes:
- Lines and quantities
- Appointment/customer context
- Cleared after successful payment
- 24-hour expiration

## 📊 Performance

- **Cart Updates**: Instant with optimistic calculations
- **Search**: Client-side filtering (no debounce needed)
- **Price List Cache**: 5-minute stale time
- **Payment Processing**: 800ms mock delay
- **Invoice Generation**: <300ms

## 🛠️ Extending the Module

### Add Payment Method
1. Update Payment schema with new method
2. Add UI in PaymentMethodSelector
3. Handle in pay() API method
4. Add icon and styling

### Custom Discount Types
1. Add to discount dialog options
2. Update calculation logic
3. Add reason templates
4. Track in analytics

### New Line Types
1. Add to CartLine union
2. Update calculateTotals()
3. Add rendering in CartDisplay
4. Map to universal schema

### Integration Points
- **Inventory**: Deduct stock on checkout
- **Accounting**: Post to GL on payment
- **CRM**: Update customer purchase history
- **Analytics**: Track sales metrics

## 🎯 Production Checklist

- [ ] Replace mock API with real endpoints
- [ ] Configure payment gateway integration
- [ ] Set up receipt printer support
- [ ] Implement barcode scanner
- [ ] Add cash drawer integration
- [ ] Configure tax rates by location
- [ ] Set up email templates
- [ ] Enable offline mode
- [ ] Add refund/void support
- [ ] Implement shift management
- [ ] Configure commission structures
- [ ] Set up inventory sync
- [ ] Add loyalty points
- [ ] Enable gift cards
- [ ] Performance test with 1000+ products

---

**Built with ❤️ for HERA Universal Architecture**

The POS module demonstrates HERA's power with a complete point-of-sale system that seamlessly integrates with appointments, maintains perfect audit trails through smart codes, and maps all transactions to the universal 6-table schema while providing a delightful user experience for salon staff.