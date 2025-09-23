/**
 * Salon Category Types
 * Defines the structure for service categories
 */

export interface Category {
  id: string
  entity_name: string
  entity_code: string
  status: 'active' | 'archived'
  smart_code: string
  created_at: string
  updated_at: string
  service_count: number
  color: string
  icon: string
  sort_order: number
  description?: string | null
}

export interface CreateCategoryData {
  name: string
  code?: string
  description?: string
  color?: string
  icon?: string
  sort_order?: number
}

export interface UpdateCategoryData {
  name?: string
  code?: string
  description?: string | null
  color?: string
  icon?: string
  sort_order?: number
  status?: 'active' | 'archived'
}