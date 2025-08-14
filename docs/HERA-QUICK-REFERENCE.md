# 🚀 HERA Restaurant Module - Quick Reference Card

## 30-Second Module Generation

```bash
# 1. Generate complete module
npm run generate-module --name=[MODULE] --type=restaurant

# 2. Generate Smart Codes
npm run generate-smart-codes --module=[MODULE]

# 3. Generate APIs
npm run generate-api --module=[MODULE]

# 4. Generate UI
npm run generate-ui --module=[MODULE]
```

## Universal 6-Table Pattern

| Table | Purpose | Example Data |
|-------|---------|--------------|
| `core_entities` | Main objects | menu_item, inventory_item, employee |
| `core_dynamic_data` | Custom fields | price, quantity, hourly_rate |
| `core_relationships` | Connections | category→item, supplier→product |
| `universal_transactions` | Business events | sales, purchases, payments |
| `universal_transaction_lines` | Transaction details | order lines, payment splits |
| `core_organizations` | Multi-tenancy | restaurant_id isolation |

## API Pattern Template

```typescript
// /api/v1/[module]/entities/route.ts
export async function GET(request: NextRequest) {
  const organizationId = searchParams.get('organization_id')
  
  const { data } = await supabaseAdmin
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', '[ENTITY_TYPE]')
    
  return NextResponse.json({ success: true, data })
}
```

## UI Component Stack

```typescript
// Standard imports for all modules
import { MetricCard, GlowButton, StatusIndicator } from 
  '@/components/restaurant/JobsStyleMicroInteractions'

// Standard layout
<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <div className="container mx-auto p-6 max-w-7xl">
    {/* Module content */}
  </div>
</div>
```

## File Structure Template

```
/restaurant/[module]/
├── page.tsx              # Redirect to dashboard
├── dashboard/page.tsx    # Main management interface  
├── form/page.tsx         # Create/edit items
├── list/page.tsx         # Listing with search
├── reports/page.tsx      # Analytics and insights
├── README.md             # Module documentation
└── module.config.json    # Configuration
```

## Smart Code Format

```
HERA.[MODULE].[TYPE].[CODE].v1

Examples:
HERA.MENU.ITEM.PIZZA-001.v1
HERA.INVENTORY.ITEM.TOMATOES-001.v1  
HERA.STAFF.EMPLOYEE.JOHN-DOE-001.v1
```

## Common Entity Types by Module

| Module | Entity Types |
|--------|-------------|
| **Menu** | menu_item, menu_category, kitchen_station |
| **Inventory** | inventory_item, supplier, stock_location |
| **Staff** | employee, shift, position |
| **Customers** | customer, loyalty_program, reservation |
| **Delivery** | delivery_platform, driver, delivery_zone |

## Dynamic Fields Examples

```json
{
  "menu": {
    "price": { "type": "number" },
    "allergens": { "type": "json" },
    "prep_time": { "type": "number" }
  },
  "inventory": {
    "quantity": { "type": "number" },
    "reorder_point": { "type": "number" },
    "expiry_date": { "type": "text" }
  },
  "staff": {
    "hourly_rate": { "type": "number" },
    "schedule": { "type": "json" },
    "permissions": { "type": "json" }
  }
}
```

## HERA Design Colors

```typescript
// Restaurant theme gradients
'from-orange-500 to-red-600'     // Primary buttons
'from-green-500 to-emerald-600'  // Success states
'from-blue-500 to-indigo-600'    // Info/metrics
'from-purple-500 to-violet-600'  // Premium features
```

## Route Testing URLs

```
http://localhost:3000/restaurant/[module]/dashboard
http://localhost:3000/restaurant/[module]/form
http://localhost:3000/restaurant/[module]/list
http://localhost:3000/restaurant/[module]/reports
```

## Build & Deploy Commands

```bash
# Test build
npm run build

# Deploy to Railway
railway up

# Deploy to Vercel  
vercel --prod

# Commit changes
git add . && git commit -m "Add [MODULE] management system"
```

## Common Debugging

| Issue | Solution |
|-------|----------|
| 404 on module routes | Check file structure matches `/restaurant/[module]/` |
| Build errors | Ensure all imports use absolute paths `@/` |
| API 500 errors | Verify organization_id parameter |
| UI not loading | Check all Lucide icons are imported |
| Dynamic fields empty | Confirm `include_dynamic_data=true` |

## Performance Checklist

- [ ] Organization ID filtering on all queries
- [ ] Dynamic data only loaded when needed
- [ ] Pagination for large datasets
- [ ] Client-side hydration checks
- [ ] Loading states for all API calls

---

**🎯 Success Formula**: Generate → Configure → Customize → Deploy  
**⏱️ Time**: 30 seconds generation + 4-8 hours customization = Production ready  
**📊 Results**: 200x faster than traditional development