# HERA Currency System Documentation

## Overview

HERA ERP supports dynamic multi-currency capabilities, allowing each organization to configure their preferred currency. The system automatically handles currency formatting, symbols, and display based on the organization's settings.

## Currency Storage

Currency information is stored in the database:

1. **Organization Level** (`core_organizations` table):
   - `currency_code` field (default: 'USD')
   - Sets the default currency for all organization operations

2. **Transaction Level** (`universal_transactions` table):
   - `currency_code` - Transaction currency
   - `base_currency_code` - Base currency for multi-currency support
   - `exchange_rate` - Conversion rate between currencies

## Supported Currencies

HERA supports 17 major world currencies:

- **USD** - US Dollar ($)
- **EUR** - Euro (€)
- **GBP** - British Pound (£)
- **AED** - UAE Dirham (د.إ)
- **INR** - Indian Rupee (₹)
- **JPY** - Japanese Yen (¥)
- **CNY** - Chinese Yuan (¥)
- **AUD** - Australian Dollar (A$)
- **CAD** - Canadian Dollar (C$)
- **CHF** - Swiss Franc (CHF)
- **SGD** - Singapore Dollar (S$)
- **MYR** - Malaysian Ringgit (RM)
- **SAR** - Saudi Riyal (ر.س)
- **KWD** - Kuwaiti Dinar (د.ك)
- **BHD** - Bahraini Dinar (د.ب)
- **OMR** - Omani Rial (ر.ع.)
- **QAR** - Qatari Riyal (ر.ق)

## Currency Utilities

### 1. Currency Formatting (`/src/lib/currency.ts`)

```typescript
import { formatCurrency } from '@/lib/currency'

// Basic formatting
formatCurrency(1234.56, 'USD') // $1,234.56
formatCurrency(1234.56, 'EUR') // €1.234,56
formatCurrency(1234.56, 'AED') // 1,234.56 د.إ

// With options
formatCurrency(1234.56, 'USD', { showCode: true }) // 1,234.56 USD
formatCurrency(1234.56, 'USD', { hideSymbol: true }) // 1,234.56
```

### 2. Organization Currency Hook (`/src/hooks/use-organization-currency.ts`)

```typescript
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'

function MyComponent() {
  const { 
    currencyCode,      // e.g., 'USD'
    currencySymbol,    // e.g., '$'
    currencyConfig,    // Full configuration object
    format            // Format function with org currency
  } = useOrganizationCurrency()
  
  return <div>{format(100)}</div> // $100.00
}
```

## UI Components

### 1. Currency Input (`/src/components/ui/currency-input.tsx`)

Provides a formatted input field with automatic currency symbol display:

```tsx
import { CurrencyInput } from '@/components/ui/currency-input'

<CurrencyInput
  value={price}
  onChange={(e) => setPrice(e.target.value)}
  placeholder="0.00"
/>
```

### 2. Currency Display (`/src/components/ui/currency-input.tsx`)

Displays formatted currency values:

```tsx
import { CurrencyDisplay } from '@/components/ui/currency-input'

<CurrencyDisplay value={1234.56} />
// Shows: $1,234.56 (or appropriate format for org currency)
```

### 3. Currency Settings (`/src/components/settings/CurrencySettings.tsx`)

Complete settings component for organizations to change their currency:

```tsx
import { CurrencySettings } from '@/components/settings/CurrencySettings'

// Add to your settings page
<CurrencySettings />
```

## Migration Guide

### Updating Hardcoded Currency

Replace hardcoded currency symbols with dynamic components:

**Before:**
```tsx
<span>${price.toFixed(2)}</span>
<Input label="Price ($)" />
```

**After:**
```tsx
<CurrencyDisplay value={price} />
<CurrencyInput label="Price" />
```

### Using in Tables

**Before:**
```tsx
<TableCell>${item.price.toFixed(2)}</TableCell>
```

**After:**
```tsx
<TableCell>
  <CurrencyDisplay value={item.price} />
</TableCell>
```

### Using in Forms

**Before:**
```tsx
<Label>Price ($)</Label>
<Input type="number" value={price} onChange={...} />
```

**After:**
```tsx
<Label>Price</Label>
<CurrencyInput value={price} onChange={...} />
```

## API Integration

When creating transactions via the Universal API:

```typescript
import { universalApi } from '@/lib/universal-api'
import { getOrganizationCurrency } from '@/lib/currency'

// Transaction will use organization's default currency
const transaction = await universalApi.createTransaction({
  transaction_type: 'sale',
  total_amount: 1000,
  currency_code: getOrganizationCurrency(currentOrganization),
  // ... other fields
})
```

## Best Practices

1. **Never hardcode currency symbols** - Always use the dynamic components
2. **Use organization currency by default** - Don't assume USD
3. **Show currency code when ambiguous** - Multiple currencies might use same symbol
4. **Consider right-to-left languages** - Some currencies display after the amount
5. **Respect decimal places** - JPY has 0, KWD has 3, most have 2

## Currency Symbol Positions

Different currencies have different symbol positions:

- **Before amount**: USD ($100), EUR (€100), GBP (£100), INR (₹100)
- **After amount**: AED (100 د.إ), SAR (100 ر.س), KWD (100 د.ك)

The system automatically handles this based on currency configuration.

## Multi-Currency Support (Future)

The database already supports multi-currency transactions:
- Transaction currency vs base currency
- Exchange rates
- Automatic conversion for reporting

This enables future features like:
- Accepting payments in multiple currencies
- Currency conversion at transaction time
- Multi-currency financial reporting