# Universal Patterns Usage Example

## Refactoring a Component with Universal Patterns

Here's how to refactor the Restaurant Dashboard using our new universal patterns:

### Before (Original Implementation)

```typescript
// Lots of manual data handling, error prone
const loadDashboardData = async () => {
  try {
    setLoading(true)
    universalApi.setOrganizationId(organizationId)
    
    const today = new Date().toISOString().split('T')[0]
    const transactions = await universalApi.getTransactions()
    
    // This caused errors!
    const revenue = transactions.reduce((sum, t) => sum + t.total_amount, 0)
    
    // Manual filtering
    const todaySales = transactions.filter(t => 
      t.transaction_type === 'sale' && 
      t.transaction_date.startsWith(today)
    )
    
    // Lots of manual calculation
    setStats({
      revenue: todaySales.reduce(...),
      orders: todaySales.length,
      // etc...
    })
  } catch (err) {
    setError('Failed to load')
  } finally {
    setLoading(false)
  }
}
```

### After (Using Universal Patterns)

```typescript
import { useEntities, useTodayStats } from '@/hooks/useUniversalData'
import { StatCardGrid, StatCardData } from '@/components/universal/StatCardGrid'
import { TransactionList } from '@/components/universal/TransactionList'
import { 
  DollarSign, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  TableProperties,
  Clock
} from 'lucide-react'

export function RestaurantDashboard({ organizationId }: Props) {
  // Use universal hooks - handles loading, error, data extraction
  const { stats, loading, error } = useTodayStats(organizationId)
  const { data: tables } = useEntities('table', { organizationId })
  
  // Define stats for the grid
  const statCards: StatCardData[] = [
    {
      key: 'revenue',
      title: "Today's Revenue",
      value: stats.revenue,
      subtitle: 'Total sales',
      icon: DollarSign,
      format: 'currency',
      trend: { value: 12.5, direction: 'up' }
    },
    {
      key: 'orders',
      title: 'Orders',
      value: stats.orders,
      subtitle: 'Completed today',
      icon: ShoppingCart,
      format: 'number'
    },
    {
      key: 'avgOrder',
      title: 'Average Order',
      value: stats.avgOrder,
      subtitle: 'Per transaction',
      icon: Clock,
      format: 'currency'
    },
    {
      key: 'payments',
      title: 'Payments',
      value: stats.payments,
      subtitle: 'Processed',
      icon: CreditCard,
      format: 'currency',
      variant: stats.payments > 1000 ? 'success' : 'default'
    },
    {
      key: 'tips',
      title: 'Tips',
      value: stats.tips,
      subtitle: 'Collected',
      icon: TrendingUp,
      format: 'currency'
    },
    {
      key: 'tables',
      title: 'Tables',
      value: tables.length,
      subtitle: 'In system',
      icon: TableProperties,
      format: 'number'
    }
  ]
  
  if (error) {
    return <Alert variant="destructive">{error}</Alert>
  }
  
  return (
    <div className="space-y-6">
      {/* Universal stat card grid */}
      <StatCardGrid 
        stats={statCards} 
        loading={loading}
        columns={{ default: 1, md: 2, lg: 3, xl: 6 }}
      />
      
      {/* Additional dashboard content */}
    </div>
  )
}
```

## Using Transaction List

```typescript
import { useTransactions } from '@/hooks/useUniversalData'
import { TransactionList } from '@/components/universal/TransactionList'

export function RecentPayments({ organizationId }: Props) {
  const { data: payments, loading, reload } = useTransactions('payment', {
    organizationId
  })
  
  const handleRefund = async (transaction: TransactionListItem) => {
    await processRefund(transaction.id, transaction.total_amount)
    reload() // Refresh the list
  }
  
  return (
    <TransactionList
      transactions={payments}
      loading={loading}
      title="Recent Payments"
      showType={false} // All are payments
      actions={[
        {
          icon: RefreshCw,
          onClick: handleRefund,
          variant: 'ghost',
          condition: (t) => t.status === 'completed'
        }
      ]}
      maxItems={10}
    />
  )
}
```

## Using Universal Helpers

```typescript
import { 
  ensureDefaultEntities,
  createTransactionWithLines,
  generateSmartCode
} from '@/lib/universal-helpers'

// Ensure payment methods exist
const paymentMethods = await ensureDefaultEntities(
  'payment_method',
  [
    { entity_name: 'Cash', entity_code: 'CASH', metadata: { fees: 0 } },
    { entity_name: 'Card', entity_code: 'CARD', metadata: { fees: 2.5 } }
  ],
  generateSmartCode('RESTAURANT', 'FOH', 'PAYMENT', 'METHOD')
)

// Create payment with lines in one call
const result = await createTransactionWithLines(
  {
    transaction_type: 'payment',
    smart_code: generateSmartCode('RESTAURANT', 'FOH', 'PAYMENT', 'RECEIVED'),
    total_amount: 125.50,
    metadata: { payment_method: 'card' }
  },
  [
    {
      line_amount: 110.50,
      smart_code: generateSmartCode('RESTAURANT', 'FOH', 'PAYMENT', 'LINE'),
      metadata: { description: 'Payment amount' }
    },
    {
      line_amount: 15.00,
      smart_code: generateSmartCode('RESTAURANT', 'FOH', 'PAYMENT', 'TIP'),
      metadata: { description: 'Tip' }
    }
  ]
)
```

## Benefits

1. **Less Code**: 50-70% reduction in component code
2. **Consistent Error Handling**: Built into hooks and helpers
3. **Type Safety**: Full TypeScript support
4. **Reusability**: Same patterns work for all modules
5. **Performance**: Built-in optimizations and memoization
6. **Maintainability**: Changes in one place affect all modules

## Quick Conversion Checklist

When refactoring existing components:

- [ ] Replace manual API calls with `useEntities()` or `useTransactions()`
- [ ] Use `extractData()` helper for any remaining manual API calls
- [ ] Replace stat cards with `<StatCardGrid />`
- [ ] Replace transaction displays with `<TransactionList />`
- [ ] Use `generateSmartCode()` for consistent naming
- [ ] Use `ensureDefaultEntities()` for initial data setup
- [ ] Use `createTransactionWithLines()` for multi-line transactions
- [ ] Remove redundant error handling (hooks handle it)
- [ ] Remove manual loading states (hooks provide them)