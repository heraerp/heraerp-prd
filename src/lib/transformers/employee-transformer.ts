import { formatDate } from '@/src/lib/date-utils'

export interface UIEmployee {
  id: string
  name: string
  email: string
  phone: string
  role: string
  specialties: string
  hourly_rate: string
  commission_rate: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUIEmployee(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UIEmployee {
  const { entity, dynamicFields, relationships } = data

  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }

  return {
    id: entity.id,
    name: entity.entity_name,
    email: getField('email'),
    phone: getField('phone'),
    role: getField('role'),
    specialties: getField('specialties'),
    hourly_rate: getField('hourly_rate'),
    commission_rate: getField('commission_rate'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterEmployee(items: UIEmployee[], searchTerm: string): UIEmployee[] {
  if (!searchTerm) return items

  const term = searchTerm.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.phone?.toLowerCase().includes(term) ||
      item.role?.toLowerCase().includes(term) ||
      item.specialties?.toLowerCase().includes(term) ||
      item.hourly_rate?.toLowerCase().includes(term) ||
      item.commission_rate?.toLowerCase().includes(term)
  )
}
