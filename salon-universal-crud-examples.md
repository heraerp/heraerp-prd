# Salon Universal CRUD Examples

## How to Reuse Appointment CRUD for Other Salon Functions

Since HERA uses the universal 6-table architecture, we can reuse the same patterns for multiple salon features.

### 1. Staff Schedule Management

```typescript
// Create staff schedule (reusing appointment pattern)
const { data: schedule } = await supabase
  .from('universal_transactions')
  .insert({
    organization_id: orgId,
    transaction_type: 'staff_schedule',
    transaction_code: `SHIFT-${Date.now()}`,
    transaction_date: date,
    transaction_status: 'scheduled',
    smart_code: 'HERA.SALON.STAFF.SCHEDULE.v1',
    metadata: {
      staff_id: staffId,
      staff_name: staffName,
      shift_start: '09:00',
      shift_end: '18:00',
      break_time: '13:00-14:00',
      role: 'Senior Stylist'
    }
  })
```

### 2. Class/Workshop Bookings

```typescript
// Create workshop booking
const { data: workshop } = await supabase
  .from('universal_transactions')
  .insert({
    organization_id: orgId,
    transaction_type: 'class_booking',
    transaction_code: `CLASS-${Date.now()}`,
    transaction_date: date,
    total_amount: 500, // Workshop fee
    transaction_status: 'confirmed',
    smart_code: 'HERA.SALON.CLASS.BOOKING.v1',
    metadata: {
      class_name: 'Bridal Makeup Masterclass',
      instructor: 'Emma Johnson',
      duration: '3 hours',
      max_participants: 10,
      current_participants: 5,
      location: 'Training Room A'
    }
  })
```

### 3. Payment Transactions

```typescript
// Record payment (same CRUD pattern)
const { data: payment } = await supabase
  .from('universal_transactions')
  .insert({
    organization_id: orgId,
    transaction_type: 'payment',
    transaction_code: `PAY-${Date.now()}`,
    transaction_date: new Date(),
    total_amount: 450,
    transaction_status: 'completed',
    transaction_currency_code: 'AED',
    smart_code: 'HERA.SALON.PAYMENT.CASH.v1',
    from_entity_id: customerId, // Customer paying
    to_entity_id: salonId,      // Salon receiving
    metadata: {
      payment_method: 'cash',
      invoice_number: 'INV-001',
      services_paid: ['Hair Color & Cut'],
      cashier: 'Sarah'
    }
  })
```

### 4. Inventory Tracking

```typescript
// Track product usage
const { data: usage } = await supabase
  .from('universal_transactions')
  .insert({
    organization_id: orgId,
    transaction_type: 'inventory_usage',
    transaction_code: `USE-${Date.now()}`,
    transaction_date: new Date(),
    total_amount: 0, // Cost tracking optional
    smart_code: 'HERA.SALON.INV.USAGE.v1',
    metadata: {
      product_id: productId,
      product_name: 'L\'Oreal Hair Color',
      quantity_used: 60, // ml
      used_for: 'Hair Color Service',
      appointment_id: appointmentId,
      stylist: 'Emma Johnson'
    }
  })
```

### 5. Loyalty Points

```typescript
// Award loyalty points
const { data: points } = await supabase
  .from('universal_transactions')
  .insert({
    organization_id: orgId,
    transaction_type: 'loyalty_points',
    transaction_code: `PTS-${Date.now()}`,
    transaction_date: new Date(),
    total_amount: 45, // Points earned
    smart_code: 'HERA.SALON.LOYALTY.EARNED.v1',
    from_entity_id: salonId,
    to_entity_id: customerId,
    metadata: {
      reason: 'Service completion',
      service: 'Hair Color & Cut',
      points_balance: 245, // New balance
      tier: 'Gold'
    }
  })
```

## Reusable API Pattern

Create a generic API that works for all transaction types:

```typescript
// /api/v1/salon/transactions/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { transactionType, ...data } = body
  
  // Map transaction types to smart codes
  const smartCodeMap = {
    'appointment': 'HERA.SALON.APT.BOOKING.v1',
    'staff_schedule': 'HERA.SALON.STAFF.SCHEDULE.v1',
    'payment': 'HERA.SALON.PAYMENT.v1',
    'inventory_usage': 'HERA.SALON.INV.USAGE.v1',
    'loyalty_points': 'HERA.SALON.LOYALTY.v1',
    'class_booking': 'HERA.SALON.CLASS.BOOKING.v1'
  }
  
  const { data: transaction } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: data.organizationId,
      transaction_type: transactionType,
      transaction_code: `${transactionType.toUpperCase()}-${Date.now()}`,
      smart_code: smartCodeMap[transactionType],
      ...data
    })
    .select()
    .single()
    
  return NextResponse.json({ success: true, transaction })
}
```

## Reusable UI Components

```typescript
// Generic transaction list component
export function TransactionList({ 
  transactionType, 
  title,
  columns,
  actions 
}) {
  const [transactions, setTransactions] = useState([])
  
  useEffect(() => {
    fetchTransactions(transactionType)
  }, [transactionType])
  
  return (
    <Table>
      <TableHeader>
        {columns.map(col => (
          <TableCell key={col.key}>{col.label}</TableCell>
        ))}
      </TableHeader>
      <TableBody>
        {transactions.map(txn => (
          <TableRow key={txn.id}>
            {/* Render based on columns config */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Use for different features
<TransactionList 
  transactionType="appointment"
  title="Appointments"
  columns={[
    { key: 'clientName', label: 'Client' },
    { key: 'service', label: 'Service' },
    { key: 'time', label: 'Time' }
  ]}
/>

<TransactionList 
  transactionType="payment"
  title="Payments"
  columns={[
    { key: 'customerName', label: 'Customer' },
    { key: 'amount', label: 'Amount' },
    { key: 'method', label: 'Payment Method' }
  ]}
/>
```

## Benefits of This Approach

1. **No New Tables**: Everything uses the same 6 universal tables
2. **Consistent APIs**: Same CRUD patterns for all features
3. **Unified Reporting**: All data in same structure for analytics
4. **Faster Development**: Copy and modify existing code
5. **Maintain Audit Trail**: All transactions tracked uniformly
6. **Cross-Feature Intelligence**: AI can learn patterns across all transaction types

## Quick Implementation Guide

1. **Copy** the appointments API route
2. **Change** the transaction_type and smart_code
3. **Adjust** the metadata fields for your use case
4. **Reuse** the same UI components with different props
5. **Done!** New feature ready in minutes

This is the power of HERA's universal architecture - one pattern, infinite possibilities!