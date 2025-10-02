/**
 * HERA Entity Framework
 *
 * A comprehensive framework for managing universal entities with:
 * - Dynamic field definitions with UI metadata
 * - Relationship management
 * - Role-based field visibility
 * - Type-safe form components
 * - Universal entity operations
 */

// Core types and presets
export type {
  UIFieldMetadata,
  UIRelationshipMetadata,
  EnhancedDynamicFieldDef,
  EnhancedRelationshipDef,
  EntityPresetWithUI,
  EntityPresetWithUIType
} from './entityPresets'

export {
  PRODUCT_PRESET,
  SERVICE_PRESET,
  CUSTOMER_PRESET,
  ENTITY_PRESETS_WITH_UI,
  getEntityPresetWithUI,
  isFieldVisible,
  isFieldReadonly,
  isRelationshipVisible,
  validateDynamicFieldsWithUI,
  applyDefaultsWithUI
} from './entityPresets'

// Entity options hooks
export type { SelectOption, EntitySelectOptions } from './useEntityOptions'

export {
  useEntityOptions,
  useCategoryOptions,
  useBrandOptions,
  useVendorOptions,
  useEmployeeOptions,
  useCustomerOptions,
  useRoleOptions,
  useProductOptions,
  useServiceOptions,
  useMultiEntityOptions,
  useEntitySearch,
  getOptionByValue,
  getOptionsByValues,
  optionToRelationship,
  optionsToRelationships
} from './useEntityOptions'

// Form components
export type { EntityFormData, EntityFormProps } from './EntityForm'

export { EntityForm, DynamicField, RelationshipField } from './EntityForm'

// Example modal implementation
export type { ProductModalProps, ProductData } from './ProductModal'

export { ProductModal, useProductModal, ProductModalExample } from './ProductModal'

// Re-export universal form components for convenience
export {
  UniversalForm,
  UniversalInput,
  UniversalTextarea,
  UniversalSelect,
  UniversalButton,
  UniversalFieldGroup,
  UniversalModal,
  FormValidation,
  useFormState
} from '@/components/universal/forms/UniversalForm'
