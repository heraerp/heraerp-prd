import { format } from 'date-fns'

export interface UIProduct {
  id: string
  name: string
  sku: string
  price: string
  cost: string
  stock_level: string
  reorder_point: string
  category: string
  location: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUIProduct(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UIProduct {
  const { entity, dynamicFields, relationships } = data
  
  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }
  
  return {
    id: entity.id,
    name: entity.entity_name,
    sku: getField('sku'),
    price: getField('price'),
    cost: getField('cost'),
    stock_level: getField('stock_level'),
    reorder_point: getField('reorder_point'),
    category: getField('category'),
    location: getField('location'),
    status: entity.status,
    createdAt: format(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterProduct(items: UIProduct[], searchTerm: string): UIProduct[] {
  if (!searchTerm) return items
  
  const term = searchTerm.toLowerCase()
  return items.filter(item => 
    item.name.toLowerCase().includes(term) ||
    item.sku?.toLowerCase().includes(term) ||
    item.price?.toLowerCase().includes(term) ||
    item.cost?.toLowerCase().includes(term) ||
    item.stock_level?.toLowerCase().includes(term) ||
    item.reorder_point?.toLowerCase().includes(term) ||
    item.category?.toLowerCase().includes(term) ||
    item.location?.toLowerCase().includes(term)
  )
}