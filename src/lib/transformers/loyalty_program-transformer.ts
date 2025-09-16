import { formatDate } from '@/src/lib/date-utils'

export interface UILoyalty_program {
  id: string
  name: string
  points_ratio: string
  tier_benefits: string
  expiry_days: string
  tier_name: string
  minimum_spend: string
  status: string
  createdAt: string
  relationships: any[]
}

export function transformToUILoyalty_program(data: {
  entity: any
  dynamicFields: any[]
  relationships: any[]
}): UILoyalty_program {
  const { entity, dynamicFields, relationships } = data

  // Helper to get field value
  const getField = (fieldName: string) => {
    const field = dynamicFields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || field?.field_value_date || ''
  }

  return {
    id: entity.id,
    name: entity.entity_name,
    points_ratio: getField('points_ratio'),
    tier_benefits: getField('tier_benefits'),
    expiry_days: getField('expiry_days'),
    tier_name: getField('tier_name'),
    minimum_spend: getField('minimum_spend'),
    status: entity.status,
    createdAt: formatDate(new Date(entity.created_at), 'MMM d, yyyy'),
    relationships
  }
}

export function filterLoyalty_program(
  items: UILoyalty_program[],
  searchTerm: string
): UILoyalty_program[] {
  if (!searchTerm) return items

  const term = searchTerm.toLowerCase()
  return items.filter(
    item =>
      item.name.toLowerCase().includes(term) ||
      item.points_ratio?.toLowerCase().includes(term) ||
      item.tier_benefits?.toLowerCase().includes(term) ||
      item.expiry_days?.toLowerCase().includes(term) ||
      item.tier_name?.toLowerCase().includes(term) ||
      item.minimum_spend?.toLowerCase().includes(term)
  )
}
