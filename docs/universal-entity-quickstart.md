# Universal Entity Quick Start Guide

## 🚀 Rollout Checklist

### 1. **Import the enhanced hook and presets**
```typescript
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { PRODUCT_PRESET, CUSTOMER_PRESET, SERVICE_PRESET } from '@/hooks/entityPresets'
```

### 2. **Initialize entities with presets**
```typescript
// Products with all dynamic fields and relationships
const products = useUniversalEntity({
  ...PRODUCT_PRESET,
  filters: { include_dynamic: true, limit: 100 }
})

// Services
const services = useUniversalEntity({
  ...SERVICE_PRESET,
  filters: { include_dynamic: true }
})

// Customers
const customers = useUniversalEntity({
  ...CUSTOMER_PRESET,
  filters: { include_dynamic: true }
})
```

### 3. **Create entities with dynamic fields**
```typescript
await products.create({
  entity_type: 'PRODUCT',
  entity_name: 'Professional Hair Mask',
  smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.v1',
  dynamic_fields: {
    price_market: { value: 45, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1' },
    price_cost: { value: 22, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1' },
    sku: { value: 'MASK-001', type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1' },
    stock_quantity: { value: 25, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1' }
  },
  metadata: {
    relationships: {
      HAS_CATEGORY: ['<HAIR_CARE_CATEGORY_ID>'],
      HAS_BRAND: ['<LOREAL_BRAND_ID>']
    }
  }
})
```

### 4. **Update specific fields only**
```typescript
// Update just the cost price
await products.update({
  entity_id: productId,
  dynamic_patch: { price_cost: 24.50 }
})

// Update relationships
await products.update({
  entity_id: productId,
  relationships_patch: {
    HAS_CATEGORY: ['<NEW_CATEGORY_ID>']
  }
})
```

### 5. **Read full entity with merged data**
```typescript
const product = await products.getById(productId)
// Returns:
// {
//   entity: { id, entity_name, entity_type, ... },
//   dynamic: {
//     price_market: 45,
//     price_cost: 24.50,
//     sku: 'MASK-001',
//     stock_quantity: 25
//   },
//   relationships: [
//     { type: 'HAS_CATEGORY', to_entity: {...} },
//     { type: 'HAS_BRAND', to_entity: {...} }
//   ]
// }
```

## 🎨 Form Integration

### Basic Product Form
```tsx
function ProductForm({ onSave, initialData }) {
  const [formData, setFormData] = useState({
    entity_name: initialData?.entity.entity_name || '',
    price_market: initialData?.dynamic.price_market || 0,
    price_cost: initialData?.dynamic.price_cost || 0,
    sku: initialData?.dynamic.sku || '',
    category_id: initialData?.relationships?.find(r => r.type === 'HAS_CATEGORY')?.to_entity_id || ''
  })

  const handleSubmit = async () => {
    await onSave({
      entity_type: 'PRODUCT',
      entity_name: formData.entity_name,
      smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.v1',
      dynamic_fields: {
        price_market: { value: formData.price_market, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1' },
        price_cost: { value: formData.price_cost, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1' },
        sku: { value: formData.sku, type: 'text', smart_code: 'HERA.SALON.PRODUCT.DYN.SKU.v1' }
      },
      metadata: {
        relationships: {
          HAS_CATEGORY: formData.category_id ? [formData.category_id] : []
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.entity_name}
        onChange={e => setFormData(prev => ({ ...prev, entity_name: e.target.value }))}
        placeholder="Product Name"
      />
      
      <input
        type="number"
        value={formData.price_market}
        onChange={e => setFormData(prev => ({ ...prev, price_market: Number(e.target.value) }))}
        placeholder="Selling Price (AED)"
      />
      
      <input
        type="number"
        value={formData.price_cost}
        onChange={e => setFormData(prev => ({ ...prev, price_cost: Number(e.target.value) }))}
        placeholder="Cost Price (AED)"
      />
      
      <select
        value={formData.category_id}
        onChange={e => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
      >
        <option value="">Select Category</option>
        {/* Load categories here */}
      </select>
      
      <button type="submit">Save Product</button>
    </form>
  )
}
```

## 📊 Display Components

### Product Card with Margin
```tsx
function ProductCard({ productId }) {
  const products = useUniversalEntity({ ...PRODUCT_PRESET })
  const [product, setProduct] = useState(null)
  
  useEffect(() => {
    products.getById(productId).then(setProduct)
  }, [productId])
  
  if (!product) return null
  
  const margin = product.dynamic.price_market - product.dynamic.price_cost
  const marginPercent = (margin / product.dynamic.price_market) * 100
  
  return (
    <div className="product-card">
      <h3>{product.entity.entity_name}</h3>
      <p>SKU: {product.dynamic.sku}</p>
      <p>Price: AED {product.dynamic.price_market}</p>
      {/* Only show cost/margin to managers */}
      {userRole === 'manager' && (
        <>
          <p>Cost: AED {product.dynamic.price_cost}</p>
          <p>Margin: AED {margin.toFixed(2)} ({marginPercent.toFixed(1)}%)</p>
        </>
      )}
      <p>Stock: {product.dynamic.stock_quantity || 0}</p>
    </div>
  )
}
```

## 🔧 Helper Functions

### Batch Operations
```typescript
// Link multiple products to a category
const productIds = ['id1', 'id2', 'id3']
for (const productId of productIds) {
  await products.link(productId, 'HAS_CATEGORY', ['<NEW_CATEGORY_ID>'])
}

// Update multiple dynamic fields
await products.setDynamicFields(productId, {
  stock_quantity: 100,
  reorder_level: 20
})
```

### Validation
```typescript
import { validateDynamicFields, applyDefaults } from '@/hooks/entityPresets'

// Before create
const values = { price_market: 50, price_cost: 25 }
const withDefaults = applyDefaults(PRODUCT_PRESET, values)
const { valid, errors } = validateDynamicFields(PRODUCT_PRESET, withDefaults)

if (!valid) {
  console.error('Validation errors:', errors)
  return
}
```

## 🔐 Authentication

Replace the demo token when ready:

```typescript
// In useUniversalEntity.ts
async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await supabase.auth.getSession()
  
  if (!session.data.session) {
    throw new Error('Not authenticated')
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.data.session.access_token}`
  }
}
```

## 🚀 Next Steps

1. **Role-based UI**: Hide cost prices based on user role
2. **Optimistic updates**: Add to mutations for instant UI feedback
3. **Bulk operations**: Create UI for batch updates
4. **Export/Import**: Add CSV export with dynamic fields
5. **Audit trail**: Track who changed what fields when

## 💡 Common Patterns

### Search with Dynamic Fields
```typescript
// Client-side filtering (until server search is ready)
const searchProducts = (term: string) => {
  return products.entities.filter(p => 
    p.entity_name.toLowerCase().includes(term.toLowerCase()) ||
    p.dynamic?.sku?.toLowerCase().includes(term.toLowerCase())
  )
}
```

### Category Tree
```typescript
const categories = useUniversalEntity({
  ...CATEGORY_PRESET,
  filters: { include_dynamic: true }
})

// Build tree from flat list
const buildCategoryTree = (cats) => {
  const tree = []
  const map = new Map()
  
  cats.forEach(cat => map.set(cat.id, { ...cat, children: [] }))
  
  cats.forEach(cat => {
    const parent = cat.relationships?.find(r => r.type === 'PARENT_CATEGORY')
    if (parent) {
      map.get(parent.to_entity_id)?.children.push(map.get(cat.id))
    } else {
      tree.push(map.get(cat.id))
    }
  })
  
  return tree
}
```

## 🎯 Quick Wins

1. **Add loading states**: Show skeletons while data loads
2. **Error boundaries**: Catch and display errors gracefully  
3. **Empty states**: Show helpful messages when no data
4. **Inline editing**: Edit prices directly in the list
5. **Keyboard shortcuts**: Ctrl+N for new product, etc.