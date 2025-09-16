import { formatDate } from '@/src/lib/date-utils'

export interface UIService {
  id: string
  name: string
  name: string
  category: string
  price: string
  duration: string
  description: string
  requires_license: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUIService(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UIService {
  const { entity, dynamicFields, relationships } = data

  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }

  return {
    id: entity.id,
    name: entity.entity_name,
    name: getField('name'),
    category: getField('category'),
    price: getField('price'),
    duration: getField('duration'),
    description: getField('description'),
    requires_license: getField('requires_license'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterService(items: UIService[], searchTerm: string): UIService[] {
  if (!searchTerm) return items

  const term = searchTerm.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(term) ||
      item.name?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term) ||
      item.price?.toLowerCase().includes(term) ||
      item.duration?.toLowerCase().includes(term) ||
      item.description?.toLowerCase().includes(term) ||
      item.requires_license?.toLowerCase().includes(term)
  )
}
