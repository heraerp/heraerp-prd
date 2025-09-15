import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ValidationResult {
  isValid: boolean
  supplierExists: boolean
  supplierId?: string
  isFurnitureRelated: boolean
  suggestedCategory: string
  message: string
}

/**
 * Check if a supplier exists in the system
 */
export async function checkSupplierExists(
  vendorName: string,
  organizationId: string
): Promise<{ exists: boolean; supplierId?: string }> {
  try {
    const { data, error } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'vendor')
      .ilike('entity_name', `%${vendorName}%`)
      .limit(1)
      .single()

    if (error || !data) {
      return { exists: false }
    }

    return { exists: true, supplierId: data.id }
  } catch (error) {
    console.error('Error checking supplier:', error)
    return { exists: false }
  }
}

/**
 * Validate if an invoice is appropriate for the furniture business
 */
export async function validateFurnitureInvoice(
  vendorName: string,
  items: any[],
  organizationId: string
): Promise<ValidationResult> {
  // Check if supplier exists
  const supplierCheck = await checkSupplierExists(vendorName, organizationId)

  // Keywords for furniture business
  const furnitureKeywords = [
    'wood',
    'timber',
    'plywood',
    'veneer',
    'lumber',
    'mdf',
    'particle board',
    'hardware',
    'hinge',
    'drawer',
    'handle',
    'screw',
    'nail',
    'bracket',
    'fabric',
    'upholstery',
    'foam',
    'cushion',
    'textile',
    'leather',
    'furniture',
    'carpenter',
    'woodwork',
    'joinery',
    'cabinet',
    'polish',
    'varnish',
    'paint',
    'coating',
    'finish',
    'stain',
    'adhesive',
    'glue',
    'sandpaper',
    'tools',
    'saw',
    'drill'
  ]

  // Non-furniture indicators
  const nonFurnitureKeywords = [
    'restaurant',
    'food',
    'beverage',
    'grocery',
    'meal',
    'medical',
    'pharma',
    'hospital',
    'clinic',
    'doctor',
    'software',
    'technology',
    'consulting',
    'service',
    'travel',
    'hotel',
    'flight',
    'accommodation',
    'telecom',
    'mobile',
    'internet',
    'broadband',
    'insurance',
    'premium',
    'policy',
    'claim',
    'bank',
    'interest',
    'loan',
    'mortgage'
  ]

  const lowerVendor = vendorName.toLowerCase()
  const itemDescriptions = items.map(item => (item.description || '').toLowerCase()).join(' ')
  const allText = `${lowerVendor} ${itemDescriptions}`.toLowerCase()

  // Check for non-furniture indicators first
  for (const keyword of nonFurnitureKeywords) {
    if (allText.includes(keyword)) {
      return {
        isValid: false,
        supplierExists: supplierCheck.exists,
        supplierId: supplierCheck.supplierId,
        isFurnitureRelated: false,
        suggestedCategory: 'general_expense',
        message: `This invoice appears to be for ${keyword} services/products, not furniture-related.`
      }
    }
  }

  // Check for furniture indicators
  let furnitureScore = 0
  for (const keyword of furnitureKeywords) {
    if (allText.includes(keyword)) {
      furnitureScore++
    }
  }

  // Determine if it's furniture-related
  const isFurnitureRelated = furnitureScore > 0

  if (!isFurnitureRelated) {
    return {
      isValid: false,
      supplierExists: supplierCheck.exists,
      supplierId: supplierCheck.supplierId,
      isFurnitureRelated: false,
      suggestedCategory: 'general_expense',
      message:
        'This invoice does not contain furniture-related items. Consider recording as a general expense.'
    }
  }

  // If supplier doesn't exist, suggest creating them
  if (!supplierCheck.exists) {
    return {
      isValid: true,
      supplierExists: false,
      isFurnitureRelated: true,
      suggestedCategory: determineFurnitureCategory(allText),
      message: `New furniture supplier detected: ${vendorName}. They will be created in the system.`
    }
  }

  return {
    isValid: true,
    supplierExists: true,
    supplierId: supplierCheck.supplierId,
    isFurnitureRelated: true,
    suggestedCategory: determineFurnitureCategory(allText),
    message: 'Valid furniture invoice from existing supplier.'
  }
}

/**
 * Determine the specific furniture category from text
 */
function determineFurnitureCategory(text: string): string {
  const categories = {
    raw_materials: ['wood', 'timber', 'plywood', 'veneer', 'lumber', 'mdf'],
    hardware: ['hinge', 'drawer', 'handle', 'screw', 'nail', 'bracket'],
    fabric: ['fabric', 'upholstery', 'foam', 'cushion', 'textile', 'leather'],
    finishing: ['polish', 'varnish', 'paint', 'coating', 'finish', 'stain'],
    tools: ['saw', 'drill', 'sandpaper', 'tool'],
    transport: ['transport', 'delivery', 'freight', 'shipping']
  }

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category
      }
    }
  }

  return 'general_furniture'
}

/**
 * Create a new supplier if they don't exist
 */
export async function createSupplierIfNotExists(
  vendorName: string,
  organizationId: string,
  category: string = 'general'
): Promise<{ success: boolean; supplierId?: string; error?: string }> {
  try {
    // Check if already exists
    const existing = await checkSupplierExists(vendorName, organizationId)
    if (existing.exists) {
      return { success: true, supplierId: existing.supplierId }
    }

    // Create new supplier
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'vendor',
        entity_name: vendorName,
        entity_code: `VENDOR-${Date.now()}`,
        smart_code: `HERA.FURNITURE.VENDOR.${category.toUpperCase()}.v1`,
        metadata: {
          category: category,
          auto_created: true,
          created_from: 'invoice_upload'
        }
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, supplierId: data.id }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
