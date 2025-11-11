/**
 * HERA POS Hooks - Barrel Export
 * Smart Code: HERA.RETAIL.POS.HOOKS.INDEX.v1
 * 
 * Central export point for all POS entity hooks
 */

export { useSuppliers } from './useSuppliers'
export { useInventory } from './useInventory'
export { useStaff } from './useStaff'

export type { 
  Supplier, 
  SupplierFilters 
} from './useSuppliers'

export type { 
  InventoryItem, 
  InventoryFilters, 
  StockMovement 
} from './useInventory'

export type { 
  StaffMember, 
  StaffFilters 
} from './useStaff'