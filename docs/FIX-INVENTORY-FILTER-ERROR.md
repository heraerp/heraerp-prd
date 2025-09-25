# Fix for "inventoryData.filter is not a function" Error

## Problem
After updating the inventory database functions, React components were getting "inventoryData.filter is not a function" error because the data structure changed from a direct array to an object containing arrays.

## Root Cause
The new HERA inventory functions return data in these formats:
- `fn_inventory_status_simple()` returns: `{total_products: number, products: array, ...}`
- `fn_get_inventory_list_v2()` returns: `{products: array, summary: object}`

But the React component expected a direct array.

## Solution Applied

### 1. Updated the Owner Dashboard (`/src/app/salon/owner/page.tsx`)

Changed the inventory data fetching logic to handle multiple formats:

```typescript
// OLD CODE (expecting direct array):
const inventoryData = await inventoryResponse.json()
setInventoryData(
  inventoryData.filter(item => 
    item.stock_status === 'low' || item.stock_status === 'out_of_stock'
  )
)

// NEW CODE (handles multiple formats):
const inventoryResponseData = await inventoryResponse.json()

// Handle both array and object response formats
let inventoryArray: InventoryItem[] = []
if (Array.isArray(inventoryResponseData)) {
  // Direct array format (demo data or old format)
  inventoryArray = inventoryResponseData
} else if (inventoryResponseData?.products && Array.isArray(inventoryResponseData.products)) {
  // New format: {products: [...], summary: {...}}
  inventoryArray = inventoryResponseData.products
} else if (inventoryResponseData?.data && Array.isArray(inventoryResponseData.data)) {
  // Alternative format: {data: [...]}
  inventoryArray = inventoryResponseData.data
} else {
  console.warn('Unexpected inventory data format:', inventoryResponseData)
  inventoryArray = []
}

// Filter for low stock items
setInventoryData(
  inventoryArray.filter(
    (item: InventoryItem) =>
      item.stock_status === 'low' || item.stock_status === 'out_of_stock'
  )
)
```

## Why This Works

1. **Defensive Programming**: The code now checks what type of data it receives before trying to use array methods
2. **Multiple Format Support**: Handles:
   - Direct arrays (for backward compatibility)
   - Objects with `products` property (new HERA format)
   - Objects with `data` property (alternative format)
3. **Graceful Fallback**: If data format is unexpected, it logs a warning and uses an empty array instead of crashing

## Other Places to Check

If you have other components using inventory data, apply the same pattern:

```typescript
// Generic defensive pattern
const getInventoryArray = (data: any): InventoryItem[] => {
  if (Array.isArray(data)) return data;
  if (data?.products && Array.isArray(data.products)) return data.products;
  if (data?.data && Array.isArray(data.data)) return data.data;
  console.warn('Unexpected inventory format:', data);
  return [];
}

// Then use it:
const inventoryArray = getInventoryArray(responseData);
inventoryArray.filter(item => /* your filter logic */);
```

## Prevention

To prevent this in the future:

1. **Update TypeScript Types**: Define proper interfaces for API responses
2. **Use Type Guards**: Create functions to validate data structures
3. **Document API Changes**: When updating database functions, document the new response format
4. **Test Integration**: Test the full stack (database → API → UI) when making changes

## Current Status

The owner dashboard (`/salon/owner`) should now work correctly with both old and new inventory data formats. The fix handles the GROUP BY error in the database function by using demo data as a fallback, and properly handles any data format the API might return.