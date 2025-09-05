/**
 * HERA Universal Configuration - Pricing Rules Family
 * Smart Code: HERA.UNIV.CONFIG.PRICING.*
 * 
 * Manages dynamic pricing, discounts, promotions, and service bundling
 */

import type { UniversalRule, Context } from '../universal-config-service'

// Pricing-specific context extensions
export interface PricingContext extends Context {
  service_ids?: string[]
  product_ids?: string[]
  total_amount?: number
  quantity?: number
  customer_data?: {
    loyalty_tier?: string
    total_spent?: number
    visit_count?: number
    member_since?: string
    birthday_month?: number
  }
  booking_data?: {
    is_peak_time?: boolean
    is_last_minute?: boolean
    advance_booking_days?: number
  }
  cart_items?: CartItem[]
  promo_code?: string
}

export interface CartItem {
  type: 'service' | 'product'
  id: string
  quantity: number
  base_price: number
  category?: string
}

// Pricing rule payload types
export interface PricingPayload {
  adjustment_type: 'discount' | 'surcharge' | 'override' | 'bundle'
  
  // Discount/surcharge configuration
  discount?: DiscountConfig
  surcharge?: SurchargeConfig
  
  // Price override
  override_price?: number
  override_prices?: { [item_id: string]: number }
  
  // Bundle pricing
  bundle?: BundleConfig
  
  // Conditions for application
  min_purchase_amount?: number
  min_quantity?: number
  max_discount_amount?: number
  
  // Stacking rules
  stackable: boolean
  stack_with?: string[] // Smart codes of compatible rules
  exclude_with?: string[] // Smart codes of incompatible rules
  
  // Applicable items
  applies_to?: {
    services?: string[]
    service_categories?: string[]
    products?: string[]
    product_categories?: string[]
    exclude_items?: string[]
  }
  
  // Time-based pricing
  dynamic_pricing?: {
    peak_multiplier?: number
    off_peak_multiplier?: number
    last_minute_discount?: number
    advance_booking_discount?: number
  }
  
  // Loyalty adjustments
  loyalty_multipliers?: {
    [tier: string]: number
  }
  
  // Promo code configuration
  promo_codes?: string[]
  promo_code_required?: boolean
  
  // Usage limits
  usage_limits?: {
    per_customer?: number
    total_uses?: number
    per_day?: number
  }
  
  // Display configuration
  display?: {
    label: string
    description?: string
    badge?: string
    badge_color?: string
    show_savings?: boolean
  }
}

export interface DiscountConfig {
  type: 'percentage' | 'fixed' | 'bogo' | 'volume'
  
  // Basic discount
  percentage?: number
  fixed_amount?: number
  
  // BOGO (Buy One Get One)
  bogo?: {
    buy_quantity: number
    get_quantity: number
    get_percentage?: number // Default 100 (free)
    applies_to_cheaper?: boolean
  }
  
  // Volume/tiered discount
  volume_tiers?: {
    min_quantity: number
    discount_percentage?: number
    discount_amount?: number
  }[]
}

export interface SurchargeConfig {
  type: 'percentage' | 'fixed'
  percentage?: number
  fixed_amount?: number
  reason?: string
}

export interface BundleConfig {
  bundle_id: string
  bundle_name: string
  required_items: BundleItem[]
  bundle_price?: number
  bundle_discount_percentage?: number
  allow_substitutions?: boolean
  valid_substitutions?: { [item_id: string]: string[] }
}

export interface BundleItem {
  type: 'service' | 'product'
  id: string
  quantity: number
  is_optional?: boolean
}

/**
 * Pricing rule family definition
 */
export const PricingRuleFamily = {
  // Family identifier
  family: 'HERA.UNIV.CONFIG.PRICING',
  
  // Sub-families
  subFamilies: {
    DISCOUNT: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT.v1',
    SURCHARGE: 'HERA.UNIV.CONFIG.PRICING.SURCHARGE.v1',
    DYNAMIC: 'HERA.UNIV.CONFIG.PRICING.DYNAMIC.v1',
    BUNDLE: 'HERA.UNIV.CONFIG.PRICING.BUNDLE.v1',
    LOYALTY: 'HERA.UNIV.CONFIG.PRICING.LOYALTY.v1',
    SEASONAL: 'HERA.UNIV.CONFIG.PRICING.SEASONAL.v1',
    PROMOTIONAL: 'HERA.UNIV.CONFIG.PRICING.PROMOTIONAL.v1',
    VOLUME: 'HERA.UNIV.CONFIG.PRICING.VOLUME.v1',
    FLASH_SALE: 'HERA.UNIV.CONFIG.PRICING.FLASH_SALE.v1',
    MEMBER: 'HERA.UNIV.CONFIG.PRICING.MEMBER.v1'
  },
  
  // Default conditions
  defaultConditions: {
    effective_from: new Date().toISOString()
  },
  
  // Default payload
  defaultPayload: {
    adjustment_type: 'discount' as const,
    stackable: false,
    display: {
      label: 'Special Offer',
      show_savings: true
    }
  },
  
  // Validation
  validate: (rule: UniversalRule): string[] => {
    const errors: string[] = []
    const payload = rule.payload as PricingPayload
    
    // Validate adjustment type
    if (!['discount', 'surcharge', 'override', 'bundle'].includes(payload.adjustment_type)) {
      errors.push('Invalid adjustment_type')
    }
    
    // Validate discount configuration
    if (payload.discount) {
      if (!['percentage', 'fixed', 'bogo', 'volume'].includes(payload.discount.type)) {
        errors.push('Invalid discount type')
      }
      
      if (payload.discount.percentage !== undefined && 
          (payload.discount.percentage < 0 || payload.discount.percentage > 100)) {
        errors.push('Discount percentage must be between 0 and 100')
      }
      
      if (payload.discount.fixed_amount !== undefined && payload.discount.fixed_amount < 0) {
        errors.push('Fixed discount amount must be positive')
      }
    }
    
    // Validate surcharge
    if (payload.surcharge) {
      if (payload.surcharge.percentage !== undefined && payload.surcharge.percentage < 0) {
        errors.push('Surcharge percentage must be positive')
      }
      
      if (payload.surcharge.fixed_amount !== undefined && payload.surcharge.fixed_amount < 0) {
        errors.push('Fixed surcharge amount must be positive')
      }
    }
    
    // Validate bundle
    if (payload.bundle) {
      if (!payload.bundle.required_items || payload.bundle.required_items.length === 0) {
        errors.push('Bundle must have at least one required item')
      }
      
      if (payload.bundle.bundle_discount_percentage !== undefined &&
          (payload.bundle.bundle_discount_percentage < 0 || payload.bundle.bundle_discount_percentage > 100)) {
        errors.push('Bundle discount percentage must be between 0 and 100')
      }
    }
    
    return errors
  },
  
  // Merge strategy
  mergeStrategy: 'stack', // Stack compatible discounts
  
  // Context requirements
  requiredContext: [],
  
  // Sample templates
  templates: {
    percentageDiscount: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.DISCOUNT.v1',
      status: 'active',
      priority: 100,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        adjustment_type: 'discount',
        discount: {
          type: 'percentage',
          percentage: 15
        },
        stackable: true,
        display: {
          label: '15% Off',
          description: 'Save 15% on selected services',
          show_savings: true
        }
      }
    },
    
    happyHour: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.DYNAMIC.v1',
      status: 'active',
      priority: 200,
      conditions: {
        effective_from: new Date().toISOString(),
        time_windows: [
          { start_time: '14:00', end_time: '16:00' }
        ],
        days_of_week: [1, 2, 3, 4, 5] // Weekdays
      },
      payload: {
        adjustment_type: 'discount',
        discount: {
          type: 'percentage',
          percentage: 20
        },
        stackable: false,
        display: {
          label: 'Happy Hour Special',
          description: '20% off all services 2-4 PM weekdays',
          badge: 'LIMITED TIME',
          badge_color: '#FF6B6B',
          show_savings: true
        }
      }
    },
    
    loyaltyTiers: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.LOYALTY.v1',
      status: 'active',
      priority: 300,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        adjustment_type: 'discount',
        discount: {
          type: 'percentage',
          percentage: 5 // Base discount
        },
        loyalty_multipliers: {
          silver: 1.5,    // 7.5% discount
          gold: 2.0,      // 10% discount
          platinum: 3.0   // 15% discount
        },
        stackable: true,
        display: {
          label: 'Loyalty Discount',
          show_savings: true
        }
      }
    },
    
    serviceBundle: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.BUNDLE.v1',
      status: 'active',
      priority: 150,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        adjustment_type: 'bundle',
        bundle: {
          bundle_id: 'pamper_package',
          bundle_name: 'Pamper Package',
          required_items: [
            { type: 'service', id: 'haircut_style', quantity: 1 },
            { type: 'service', id: 'hair_treatment', quantity: 1 },
            { type: 'service', id: 'manicure', quantity: 1 }
          ],
          bundle_discount_percentage: 25,
          allow_substitutions: true,
          valid_substitutions: {
            'manicure': ['pedicure', 'gel_manicure'],
            'hair_treatment': ['deep_conditioning', 'scalp_treatment']
          }
        },
        stackable: false,
        display: {
          label: 'Pamper Package - Save 25%',
          description: 'Haircut + Treatment + Manicure',
          badge: 'BEST VALUE',
          badge_color: '#51CF66',
          show_savings: true
        }
      }
    },
    
    volumeDiscount: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.VOLUME.v1',
      status: 'active',
      priority: 120,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        adjustment_type: 'discount',
        discount: {
          type: 'volume',
          volume_tiers: [
            { min_quantity: 3, discount_percentage: 10 },
            { min_quantity: 5, discount_percentage: 15 },
            { min_quantity: 10, discount_percentage: 20 }
          ]
        },
        applies_to: {
          product_categories: ['retail_products']
        },
        stackable: true,
        display: {
          label: 'Buy More, Save More',
          description: 'Up to 20% off on bulk purchases',
          show_savings: true
        }
      }
    },
    
    birthdaySpecial: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.PROMOTIONAL.v1',
      status: 'active',
      priority: 400,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        adjustment_type: 'discount',
        discount: {
          type: 'percentage',
          percentage: 30
        },
        stackable: true,
        usage_limits: {
          per_customer: 1,
          per_day: 1
        },
        display: {
          label: 'Birthday Special - 30% Off',
          description: 'Celebrate your special day with us!',
          badge: 'BIRTHDAY',
          badge_color: '#FF6B9D',
          show_savings: true
        }
      }
    },
    
    peakSurcharge: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.SURCHARGE.v1',
      status: 'active',
      priority: 50,
      conditions: {
        effective_from: new Date().toISOString(),
        time_windows: [
          { start_time: '17:00', end_time: '19:00' }
        ],
        days_of_week: [5, 6] // Friday & Saturday
      },
      payload: {
        adjustment_type: 'surcharge',
        surcharge: {
          type: 'percentage',
          percentage: 15,
          reason: 'Peak time surcharge'
        },
        stackable: true,
        display: {
          label: 'Peak Time',
          description: '15% surcharge applies during peak hours'
        }
      }
    },
    
    flashSale: {
      smart_code: 'HERA.UNIV.CONFIG.PRICING.FLASH_SALE.v1',
      status: 'active',
      priority: 500,
      conditions: {
        effective_from: new Date().toISOString(),
        effective_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      payload: {
        adjustment_type: 'discount',
        discount: {
          type: 'percentage',
          percentage: 40
        },
        stackable: false,
        usage_limits: {
          total_uses: 100,
          per_customer: 1
        },
        display: {
          label: '⚡ FLASH SALE - 40% OFF',
          description: 'Limited time offer - Today only!',
          badge: 'FLASH',
          badge_color: '#FFA502',
          show_savings: true
        }
      }
    }
  }
}

// Helper functions
export function calculatePriceAdjustment(
  basePrice: number,
  payload: PricingPayload,
  context: PricingContext
): {
  adjustedPrice: number
  discount: number
  surcharge: number
  appliedRules: string[]
} {
  let adjustedPrice = basePrice
  let totalDiscount = 0
  let totalSurcharge = 0
  const appliedRules: string[] = []
  
  // Apply discounts
  if (payload.adjustment_type === 'discount' && payload.discount) {
    const discount = calculateDiscount(basePrice, payload.discount, context)
    totalDiscount += discount
    adjustedPrice -= discount
    appliedRules.push('discount')
  }
  
  // Apply surcharges
  if (payload.adjustment_type === 'surcharge' && payload.surcharge) {
    const surcharge = calculateSurcharge(basePrice, payload.surcharge)
    totalSurcharge += surcharge
    adjustedPrice += surcharge
    appliedRules.push('surcharge')
  }
  
  // Apply price override
  if (payload.adjustment_type === 'override' && payload.override_price !== undefined) {
    adjustedPrice = payload.override_price
    totalDiscount = basePrice - adjustedPrice
    appliedRules.push('override')
  }
  
  return {
    adjustedPrice: Math.max(0, adjustedPrice),
    discount: totalDiscount,
    surcharge: totalSurcharge,
    appliedRules
  }
}

function calculateDiscount(
  basePrice: number,
  discount: DiscountConfig,
  context: PricingContext
): number {
  switch (discount.type) {
    case 'percentage':
      return basePrice * (discount.percentage || 0) / 100
      
    case 'fixed':
      return Math.min(basePrice, discount.fixed_amount || 0)
      
    case 'volume':
      if (!discount.volume_tiers || !context.quantity) return 0
      
      // Find applicable tier
      const applicableTier = discount.volume_tiers
        .filter(tier => context.quantity >= tier.min_quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0]
        
      if (!applicableTier) return 0
      
      if (applicableTier.discount_percentage) {
        return basePrice * applicableTier.discount_percentage / 100
      }
      return applicableTier.discount_amount || 0
      
    default:
      return 0
  }
}

function calculateSurcharge(
  basePrice: number,
  surcharge: SurchargeConfig
): number {
  if (surcharge.type === 'percentage') {
    return basePrice * (surcharge.percentage || 0) / 100
  }
  return surcharge.fixed_amount || 0
}

// Type guard
export function isPricingPayload(payload: any): payload is PricingPayload {
  return payload && 
    typeof payload.adjustment_type === 'string' &&
    ['discount', 'surcharge', 'override', 'bundle'].includes(payload.adjustment_type)
}

// Export types
export type PricingRule = UniversalRule & {
  payload: PricingPayload
}