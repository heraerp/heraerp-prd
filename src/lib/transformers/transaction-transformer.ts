import { formatDate } from '@/src/lib/date-utils'

export interface UITransaction {
  id: string
  name: string
  payment_method: string
  amount: string
  reference_number: string
  status: string
  notes: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUITransaction(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UITransaction {
  const { entity, dynamicFields, relationships } = data

  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }

  return {
    id: entity.id,
    name: entity.entity_name,
    payment_method: getField('payment_method'),
    amount: getField('amount'),
    reference_number: getField('reference_number'),
    status: getField('status'),
    notes: getField('notes'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterTransaction(items: UITransaction[], searchTerm: string): UITransaction[] {
  if (!searchTerm) return items

  const term = searchTerm.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(term) ||
      item.payment_method?.toLowerCase().includes(term) ||
      item.amount?.toLowerCase().includes(term) ||
      item.reference_number?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term) ||
      item.notes?.toLowerCase().includes(term)
  )
}
