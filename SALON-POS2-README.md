# Salon POS 2.0 - Modern Point of Sale System

A modern, production-ready point of sale system for salons built with HERA's universal architecture principles.

## 🚀 Features

- **Three-pane layout** with catalog, ticket editor, and always-visible cart
- **Unified search** for customers and appointments with intelligent autocomplete
- **Real-time pricing** with dynamic service/product catalog
- **Split payments** supporting cash, card, and voucher methods
- **Commission tracking** with automatic stylist commission calculations
- **Printable receipts** with professional formatting
- **Touch-friendly UI** optimized for desktop and tablet use
- **Keyboard shortcuts** for power users
- **HERA Guardrails** ensuring data integrity and business rules

## 🏗️ Architecture

### Sacred Six Tables
- Uses only HERA's universal 6-table schema
- No custom tables or schema changes required
- Complete multi-tenant isolation via organization_id

### Smart Codes
All transactions include proper smart codes:
```typescript
HERA.SALON.POS.TXN.SALE.V1                    // POS sale transaction
HERA.SALON.SVC.LINE.STANDARD.V1               // Service line items
HERA.SALON.PROD.LINE.RETAIL.V1                // Product line items
HERA.ACCOUNTING.GL.LINE.CASH.V1               // Cash payment lines
HERA.SALON.GL.LINE.COMMISSION_EXPENSE.V1      // Commission expense
HERA.SALON.GL.LINE.COMMISSION_PAYABLE.V1      // Commission payable
```

### Playbook API Integration
- Tight integration with HERA Playbook APIs
- Customer and appointment search via `PlaybookEntities`
- Financial posting via `postPosSaleWithCommission`
- Automatic branch enforcement and commission calculation

## 🛠️ Setup Instructions

### Prerequisites
1. HERA ERP platform with Universal API v2
2. Node.js 18+ and npm
3. Valid organization ID in environment

### Installation
```bash
# Install dependencies (if not already done)
npm install

# Add required dependencies for POS 2
npm install uuid date-fns

# Set organization ID in environment
echo "DEFAULT_ORGANIZATION_ID=your-org-uuid-here" >> .env.local
```

### Development
```bash
# Start development server
npm run dev

# Navigate to POS 2
# Open http://localhost:3000/salon/pos2
```

### Environment Variables
```env
DEFAULT_ORGANIZATION_ID=your-organization-uuid
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## 🧪 Testing

### Unit Tests
```bash
# Run POS posting wrapper tests
npm test -- --testPathPattern=finance-commissions.test.ts

# Run all tests
npm test
```

### Integration Tests
The system includes comprehensive validation:
- Branch consistency enforcement
- Commission calculation validation
- Balanced GL posting verification
- Multi-currency support

## 🎯 Smoke Test Checklist

### Basic Functionality
- [ ] **Load POS 2** - Navigate to `/salon/pos2` and verify three-pane layout loads
- [ ] **Cart Always Visible** - Confirm cart sidebar (data-pos="cart-sidebar") is visible on desktop
- [ ] **Catalog Search** - Search for services/products in left pane
- [ ] **Add Items** - Add services and products to cart from catalog

### Search & Load Data
- [ ] **Customer Search** - Search for existing customer by name, phone, or email
- [ ] **Appointment Search** - Search for appointment by ID (e.g., "APPT-123" or "#123")
- [ ] **Load Appointment** - Select appointment and verify services prefill ticket
- [ ] **Customer Info** - Verify customer information displays in ticket header

### Ticket Management
- [ ] **Quantity Changes** - Use +/- buttons to adjust item quantities
- [ ] **Price Editing** - Edit unit prices for line items
- [ ] **Stylist Assignment** - Assign stylists to service items
- [ ] **Add Notes** - Add notes to individual line items
- [ ] **Add Discount** - Add percentage and fixed amount discounts
- [ ] **Add Tips** - Add tips for stylists (cash/card)

### Payment Processing
- [ ] **Split Payment** - Use multiple payment methods (cash + card)
- [ ] **Card Payment** - Process card payment with reference number
- [ ] **Cash Payment** - Process cash payment with change calculation
- [ ] **Voucher Payment** - Process voucher payment with code
- [ ] **Payment Validation** - Verify total must be fully paid before completion

### Receipt & Completion
- [ ] **Generate Receipt** - Complete sale and verify receipt generates
- [ ] **Print Receipt** - Test print functionality
- [ ] **Receipt Details** - Verify receipt contains all transaction details
- [ ] **Clear Ticket** - Confirm ticket clears after successful payment

### Advanced Features
- [ ] **Commission Calculation** - Verify stylist commissions auto-calculate
- [ ] **Branch Enforcement** - Confirm branch_id consistent across all data
- [ ] **GL Posting** - Verify balanced journal entries created
- [ ] **Audit Trail** - Confirm audit transactions logged
- [ ] **Multi-Tenant** - Test with different organization contexts

### Keyboard Shortcuts
- [ ] **Search Focus** - Press `/` to focus search input
- [ ] **Add Item** - Press `Ctrl/Cmd + +` to focus catalog
- [ ] **Command Palette** - Press `Ctrl/Cmd + K` for quick actions
- [ ] **Navigation** - Arrow keys in search results
- [ ] **Escape** - Close dialogs and clear focus

### Error Handling
- [ ] **Invalid Payment** - Test insufficient payment amount
- [ ] **Missing Stylist** - Test service without assigned stylist
- [ ] **Network Error** - Test behavior with API failures
- [ ] **Validation Errors** - Test various validation scenarios

### Performance
- [ ] **Large Catalog** - Test with 100+ services/products
- [ ] **Multiple Items** - Test with 20+ line items in ticket
- [ ] **Search Speed** - Verify search responds quickly (<300ms)
- [ ] **Payment Speed** - Verify payment processing is responsive

## 🔧 Configuration

### Commission Rates
Commission rules are configurable per stylist:
```typescript
// Default commission structure
{
  stylist_id: 'stylist-1',
  commission_rate: 40, // 40%
  commission_type: 'percentage',
  min_amount: 10,
  max_amount: undefined
}
```

### Payment Methods
Supported payment methods:
- **Cash** - Immediate settlement with change calculation
- **Card** - Visa, Mastercard, Amex, Discover with reference tracking
- **Voucher** - Gift cards and promotional vouchers with validation

### Branch Configuration
All transactions enforce branch context:
- Branch ID must be present in business_context
- Branch ID automatically copied to all line_data
- Multi-branch organizations supported

## 📊 Reporting & Analytics

### Transaction Data
All POS transactions create structured data:
- Universal transaction headers with business context
- Detailed line items with pricing and stylist assignments
- Commission calculations with audit trails
- Payment method tracking and reconciliation

### Financial Integration
- Automatic GL posting with proper account mapping
- Real-time P&L impact from POS operations
- Commission expense accrual for accurate reporting
- Tax calculation and remittance tracking

## 🐛 Troubleshooting

### Common Issues

**Cart not visible on desktop:**
- Check that `data-pos="cart-sidebar"` element exists
- Verify CSS classes: `w-96 shrink-0 sticky top-4 z-40 hidden lg:block`

**Search not finding results:**
- Verify organization_id is set correctly
- Check that entities exist in database with proper entity_type
- Confirm dynamic data fields are populated

**Payment processing fails:**
- Check that all required services have assigned stylists
- Verify branch_id is consistent across transaction
- Confirm commission calculation logic

**Commission not calculating:**
- Verify service lines have stylist_id in line_data
- Check commission rules for stylist exist
- Confirm service amounts meet minimum thresholds

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('pos-debug', 'true')
```

### Support
For technical support:
1. Check browser console for errors
2. Verify network requests in DevTools
3. Review transaction logs in database
4. Contact HERA development team with specific error details

## 🚀 Deployment

### Production Checklist
- [ ] Run full test suite: `npm test`
- [ ] Verify environment variables configured
- [ ] Test with production data
- [ ] Validate commission calculations
- [ ] Confirm receipt printing works
- [ ] Test multi-user concurrent access
- [ ] Verify audit trail compliance

### Monitoring
- Monitor API response times
- Track transaction volume and errors
- Review commission accuracy
- Validate GL posting consistency
- Monitor user experience metrics

---

## 📝 Architecture Notes

This implementation demonstrates HERA's universal architecture principles:

1. **Sacred Six Tables** - No custom schema required
2. **Smart Codes** - Every operation has business intelligence
3. **Multi-Tenant** - Perfect organization isolation
4. **Playbook Integration** - Domain-specific APIs with universal foundation
5. **Enterprise-Grade** - Commission tracking, audit trails, validation
6. **Modern UX** - Touch-friendly, keyboard-accessible, responsive design

The system provides a production-ready POS solution that can be deployed immediately while maintaining full compatibility with HERA's enterprise features.