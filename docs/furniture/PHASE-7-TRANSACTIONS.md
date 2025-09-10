# HERA Furniture Module - Phase 7: Universal Transactions

## Overview

Phase 7 implements comprehensive transaction processing for the furniture industry, fully integrated with the Universal Configuration Rules (UCR) system. This phase demonstrates HERA's revolutionary approach to business transactions where rules are data, not code.

## Transaction Types Implemented

### 1. Sales Order Processing (`HERA.IND.FURN.TXN.SALESORDER.V1`)
- **Features**:
  - Customer order creation with multiple line items
  - UCR validation (minimum order value, quantity limits)
  - Dynamic pricing with volume discounts
  - Approval workflow for high-value orders
  - Automatic delivery date calculation
  - Integration with customer credit terms

- **GL Impact**: 
  ```
  DR: Accounts Receivable
  CR: Sales Revenue
  CR: Sales Tax Payable
  ```

### 2. Purchase Order Management (`HERA.IND.FURN.TXN.PURCHASEORDER.V1`)
- **Features**:
  - Supplier order creation
  - Material requirement planning
  - Lead time tracking
  - Approval workflows based on value thresholds
  - Integration with supplier terms
  - Expected delivery date calculation

- **GL Impact**:
  ```
  DR: Inventory (or Raw Materials)
  CR: Accounts Payable
  ```

### 3. Manufacturing Orders (`HERA.IND.FURN.TXN.MANUFACTUREORDER.V1`)
- **Features**:
  - Production order creation
  - BOM (Bill of Materials) integration
  - Material requirement calculation
  - Cost rollup from components
  - Production status tracking
  - Link to sales orders

- **GL Impact**:
  ```
  DR: Work in Progress (WIP)
  CR: Raw Materials Inventory
  CR: Direct Labor
  CR: Manufacturing Overhead
  ```

### 4. Inventory Movements (`HERA.IND.FURN.TXN.INVENTORYMOVE.V1`)
- **Features**:
  - Real-time inventory tracking
  - Multiple movement types (receipt, issue, transfer, adjustment)
  - Location-based inventory levels
  - Batch/lot tracking
  - Stock level indicators
  - Movement history audit trail

- **GL Impact**:
  ```
  DR: Destination Location Inventory
  CR: Source Location Inventory
  ```

## UCR Integration Features

### Validation Rules
- **Minimum Order Value**: Orders must exceed AED 5,000
- **Maximum Quantity**: 50 units per line item
- **Customer Credit Check**: Validates against credit limits
- **Material Compatibility**: Ensures valid component combinations
- **Stock Availability**: Checks inventory levels

### Pricing Rules
- **Volume Discounts**:
  - 10+ units: 5% discount
  - 25+ units: 10% discount
  - 50+ units: 15% discount
- **Customer-Specific Pricing**: Based on customer segment
- **Seasonal Promotions**: Time-based pricing adjustments

### Approval Rules
- **Sales Orders**:
  - Orders > AED 50,000: Sales Manager + Finance Manager
  - Credit limit override: Finance Director
- **Purchase Orders**:
  - PO > AED 50,000: Purchase Manager + Finance Director
  - PO > AED 25,000: Purchase Manager

### SLA Rules
- **Standard Lead Time**: 7 days
- **Custom Products**: +7 days
- **Large Orders (>20 units)**: +3 days
- **Express Delivery**: -2 days (with premium)

## Implementation Files

### Backend (MCP Server)
- `/mcp-server/furniture-phase7-transactions.js` - Core transaction services
  - `SalesOrderService` - Sales order processing
  - `PurchaseOrderService` - Purchase order management
  - `ManufacturingOrderService` - Production orders
  - `InventoryMovementService` - Stock movements
  - `UCRIntegrationService` - Rules engine integration

### Frontend Components
- `/src/components/furniture/transactions/SalesOrderForm.tsx` - Sales order creation UI
- `/src/components/furniture/transactions/PurchaseOrderForm.tsx` - Purchase order UI
- `/src/components/furniture/transactions/ManufacturingOrderDashboard.tsx` - Production tracking
- `/src/components/furniture/transactions/InventoryMovementTracker.tsx` - Inventory management
- `/src/components/furniture/TransactionsDashboard.tsx` - Combined dashboard

### Testing
- `/mcp-server/test-furniture-transactions.js` - Comprehensive test suite

## Usage Examples

### Creating a Sales Order
```javascript
const salesOrder = await SalesOrderService.createSalesOrder({
  customerId: 'cust-123',
  customerPO: 'CUST-PO-2025-001',
  lineItems: [{
    entity_id: 'prod-456',
    product_name: 'Executive Desk',
    quantity: 5,
    unit_amount: 5500,
    specifications: {
      finish: 'Oak Natural',
      dimensions: '2400x1200x750mm'
    }
  }],
  deliveryAddress: {
    line1: '123 Business Bay',
    city: 'Dubai',
    country: 'UAE'
  },
  specialInstructions: 'Deliver to loading dock'
});

// Result includes:
// - Validated order with UCR rules applied
// - Calculated pricing with discounts
// - Approval requirements if applicable
// - Promised delivery date
```

### Creating a Manufacturing Order
```javascript
const manufacturingOrder = await ManufacturingOrderService.createManufacturingOrder({
  productId: 'prod-456',
  quantity: 5,
  salesOrderId: 'so-789',
  targetCompletionDate: '2025-02-01'
});

// Automatically:
// - Retrieves product BOM
// - Calculates material requirements
// - Computes total cost
// - Creates production tracking
```

### Tracking Inventory
```javascript
const movement = await InventoryMovementService.createInventoryMovement({
  movementType: 'transfer',
  sourceLocation: 'warehouse-1',
  destinationLocation: 'showroom',
  lineItems: [{
    entity_id: 'prod-456',
    quantity: 2,
    reason: 'Display stock'
  }],
  reason: 'Showroom replenishment'
});

// Updates:
// - Source location inventory (decrease)
// - Destination inventory (increase)
// - Movement history audit trail
```

## React Component Usage

### Sales Order Form
```tsx
import { SalesOrderForm } from '@/components/furniture/transactions';

// In your page/component:
<SalesOrderForm />

// Features:
// - Customer selection
// - Product line items with pricing
// - UCR validation in real-time
// - Automatic discount calculation
// - Approval status display
// - Delivery date calculation
```

### Transaction Dashboard
```tsx
import { TransactionsDashboard } from '@/components/furniture';

// Complete transaction management:
<TransactionsDashboard />

// Includes:
// - Summary statistics cards
// - Tabbed interface for all transaction types
// - UCR integration status
// - Real-time updates
```

## Testing the Implementation

### Run All Tests
```bash
cd mcp-server
node test-furniture-transactions.js all
```

### Test Individual Components
```bash
# Test sales order processing
node test-furniture-transactions.js sales

# Test purchase orders
node test-furniture-transactions.js purchase

# Test manufacturing orders
node test-furniture-transactions.js manufacturing

# Test inventory movements
node test-furniture-transactions.js inventory
```

### Manual Testing via UI
1. Navigate to the furniture module
2. Access the Transactions tab
3. Create test transactions:
   - Sales Order: Test validation rules and pricing
   - Purchase Order: Test approval thresholds
   - Manufacturing Order: Test BOM integration
   - Inventory Movement: Test stock tracking

## Key Benefits Demonstrated

### 1. **Configuration-Driven Behavior**
- All business rules stored as data in UCR entities
- No hardcoded business logic
- Rules can be modified without code changes

### 2. **Real-Time Integration**
- UCR rules applied instantly during transaction creation
- Automatic pricing calculations
- Dynamic approval routing
- Immediate inventory updates

### 3. **Complete Audit Trail**
- Every transaction tracked in universal tables
- Full history with metadata
- User actions logged
- Status transitions recorded

### 4. **Scalability**
- Same transaction engine handles all business types
- Rules scale independently of code
- Performance optimized for large volumes

### 5. **User Experience**
- Intuitive forms with real-time feedback
- Clear validation messages
- Visual status indicators
- Comprehensive dashboards

## Next Steps

### Phase 8: Analytics & Reporting
- Transaction analytics dashboard
- UCR rule performance metrics
- Business intelligence integration
- Custom report builder

### Phase 9: Integration APIs
- External system connectors
- EDI support
- Third-party logistics integration
- Payment gateway connections

### Phase 10: Mobile Experience
- Progressive web app
- Offline transaction support
- Mobile-optimized UI
- Push notifications

## Troubleshooting

### Common Issues

1. **Validation Errors**
   - Check UCR validation rules are properly configured
   - Verify minimum/maximum thresholds
   - Ensure customer credit limits are set

2. **Pricing Calculations**
   - Verify pricing rules in UCR
   - Check product base prices in dynamic data
   - Validate discount tier configurations

3. **Inventory Levels**
   - Ensure initial stock levels are set
   - Check warehouse locations exist
   - Verify movement transactions are completing

### Debug Mode
Enable debug logging in transaction services:
```javascript
// In furniture-phase7-transactions.js
const DEBUG = true; // Set to true for detailed logging
```

## Conclusion

Phase 7 successfully demonstrates HERA's revolutionary approach to business transactions:
- **Universal architecture** handles all transaction types
- **UCR integration** provides configuration-driven behavior
- **Zero code changes** needed for business rule modifications
- **Complete visibility** through comprehensive UI components
- **Enterprise-ready** with approval workflows and audit trails

This implementation proves that complex business logic can be managed entirely through data, eliminating the traditional barriers between business requirements and technical implementation.