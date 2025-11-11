/**
 * HERA v3.0 Industry-Specific Brand Themes
 * Pre-built brand configurations for different industry verticals
 */

import { type BrandingTheme } from './branding-engine'
import { type IndustryType, INDUSTRY_TYPES } from './constants'

export interface IndustryTheme {
  industry: IndustryType
  name: string
  description: string
  theme: BrandingTheme
  preview_url?: string
  tags: string[]
}

/**
 * Complete industry theme definitions
 */
export const INDUSTRY_THEMES: Record<IndustryType, IndustryTheme[]> = {
  [INDUSTRY_TYPES.SALON_BEAUTY]: [
    {
      industry: INDUSTRY_TYPES.SALON_BEAUTY,
      name: 'Luxury Salon',
      description: 'Elegant purple and gold theme for high-end salons',
      theme: {
        primary_color: '#8B5CF6',
        secondary_color: '#EC4899',
        accent_color: '#F59E0B',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FFFFFF',
        surface_color: '#FDF2F8',
        text_primary: '#111827',
        text_secondary: '#6B7280',
        border_color: '#E5E7EB',
        font_family_heading: 'Playfair Display',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.6',
        border_radius: '12px',
        shadow_intensity: 'soft',
        theme_mode: 'light',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      tags: ['luxury', 'elegant', 'purple', 'premium']
    },
    {
      industry: INDUSTRY_TYPES.SALON_BEAUTY,
      name: 'Modern Spa',
      description: 'Clean, minimalist theme with calming greens',
      theme: {
        primary_color: '#059669',
        secondary_color: '#0D9488',
        accent_color: '#F59E0B',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#F8FAFC',
        surface_color: '#FFFFFF',
        text_primary: '#0F172A',
        text_secondary: '#475569',
        border_color: '#E2E8F0',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '8px',
        shadow_intensity: 'soft',
        theme_mode: 'light',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      tags: ['modern', 'spa', 'green', 'calming', 'minimal']
    },
    {
      industry: INDUSTRY_TYPES.SALON_BEAUTY,
      name: 'Vibrant Studio',
      description: 'Bold and energetic theme for creative studios',
      theme: {
        primary_color: '#DC2626',
        secondary_color: '#EA580C',
        accent_color: '#7C3AED',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FFFBEB',
        surface_color: '#FFFFFF',
        text_primary: '#7C2D12',
        text_secondary: '#A16207',
        border_color: '#FED7AA',
        font_family_heading: 'Montserrat',
        font_family_body: 'Open Sans',
        font_size_base: '16px',
        line_height_base: '1.6',
        border_radius: '16px',
        shadow_intensity: 'medium',
        theme_mode: 'light',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      tags: ['vibrant', 'creative', 'bold', 'energetic']
    }
  ],

  [INDUSTRY_TYPES.RESTAURANT]: [
    {
      industry: INDUSTRY_TYPES.RESTAURANT,
      name: 'Rustic Kitchen',
      description: 'Warm, earthy tones for casual dining',
      theme: {
        primary_color: '#DC2626',
        secondary_color: '#F59E0B',
        accent_color: '#059669',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FEF7F0',
        surface_color: '#FFFFFF',
        text_primary: '#7C2D12',
        text_secondary: '#A16207',
        border_color: '#FED7AA',
        font_family_heading: 'Montserrat',
        font_family_body: 'Open Sans',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '12px',
        shadow_intensity: 'strong',
        theme_mode: 'light',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      tags: ['rustic', 'warm', 'casual', 'earthy']
    },
    {
      industry: INDUSTRY_TYPES.RESTAURANT,
      name: 'Fine Dining',
      description: 'Sophisticated black and gold for upscale restaurants',
      theme: {
        primary_color: '#1F2937',
        secondary_color: '#F59E0B',
        accent_color: '#EF4444',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#111827',
        surface_color: '#1F2937',
        text_primary: '#F9FAFB',
        text_secondary: '#D1D5DB',
        border_color: '#374151',
        font_family_heading: 'Playfair Display',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.6',
        border_radius: '4px',
        shadow_intensity: 'strong',
        theme_mode: 'dark',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      tags: ['fine-dining', 'sophisticated', 'dark', 'gold', 'upscale']
    }
  ],

  [INDUSTRY_TYPES.RETAIL]: [
    {
      industry: INDUSTRY_TYPES.RETAIL,
      name: 'Modern Retail',
      description: 'Clean, professional theme for retail stores',
      theme: {
        primary_color: '#1E40AF',
        secondary_color: '#64748B',
        accent_color: '#059669',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FFFFFF',
        surface_color: '#F8FAFC',
        text_primary: '#0F172A',
        text_secondary: '#475569',
        border_color: '#E2E8F0',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '4px',
        shadow_intensity: 'soft',
        theme_mode: 'light',
        animations_enabled: false,
        reduced_motion: true,
        high_contrast: false
      },
      tags: ['modern', 'professional', 'clean', 'blue']
    },
    {
      industry: INDUSTRY_TYPES.RETAIL,
      name: 'MatrixIT World - Matrix Gold',
      description: 'Professional Matrix Gold theme for PC/Mobile distribution featuring gold, charcoal, and premium colors',
      theme: {
        primary_color: '#F5C400',        // Matrix Gold - Primary brand color
        secondary_color: '#4A4A4A',      // Charcoal Gray - Professional backgrounds
        accent_color: '#F5C400',         // Matrix Gold - Key accent elements
        success_color: '#10B981',        // Keep standard success green
        warning_color: '#F5C400',        // Use Matrix Gold for warnings
        error_color: '#EF4444',          // Keep standard error red
        background_color: '#FFFFFF',     // Pure White - Clean backgrounds
        surface_color: '#FFF8E1',        // Cream Yellow - Light accent backgrounds
        text_primary: '#2C2C2C',         // Matrix Black - Primary text
        text_secondary: '#757575',       // Neutral Gray - Secondary text
        border_color: '#E0E0E0',         // Light gray borders
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '8px',
        shadow_intensity: 'medium',
        theme_mode: 'light',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      tags: ['matrixitworld', 'gold', 'tech', 'distribution', 'kerala', 'professional', 'premium']
    }
  ],

  [INDUSTRY_TYPES.CONSTRUCTION]: [
    {
      industry: INDUSTRY_TYPES.CONSTRUCTION,
      name: 'Industrial Pro',
      description: 'Strong, reliable theme for manufacturing',
      theme: {
        primary_color: '#475569',
        secondary_color: '#64748B',
        accent_color: '#F59E0B',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#F8FAFC',
        surface_color: '#FFFFFF',
        text_primary: '#0F172A',
        text_secondary: '#475569',
        border_color: '#E2E8F0',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '4px',
        shadow_intensity: 'medium',
        theme_mode: 'light',
        animations_enabled: false,
        reduced_motion: true,
        high_contrast: false
      },
      tags: ['industrial', 'professional', 'reliable', 'gray']
    }
  ],

  [INDUSTRY_TYPES.HEALTHCARE]: [
    {
      industry: INDUSTRY_TYPES.HEALTHCARE,
      name: 'Medical Clean',
      description: 'Clean, trustworthy theme for healthcare',
      theme: {
        primary_color: '#0ea5e9',
        secondary_color: '#059669',
        accent_color: '#F59E0B',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FFFFFF',
        surface_color: '#F0F9FF',
        text_primary: '#0C4A6E',
        text_secondary: '#075985',
        border_color: '#E0F2FE',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '6px',
        shadow_intensity: 'soft',
        theme_mode: 'light',
        animations_enabled: false,
        reduced_motion: true,
        high_contrast: true
      },
      tags: ['medical', 'clean', 'trustworthy', 'blue', 'accessible']
    }
  ],

  [INDUSTRY_TYPES.WASTE_MANAGEMENT]: [
    {
      industry: INDUSTRY_TYPES.WASTE_MANAGEMENT,
      name: 'EcoGreen Pro',
      description: 'Environmental green theme for waste management',
      theme: {
        primary_color: '#10b981',
        secondary_color: '#059669',
        accent_color: '#f59e0b',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FFFFFF',
        surface_color: '#F8FAFC',
        text_primary: '#1E3A8A',
        text_secondary: '#475569',
        border_color: '#E2E8F0',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '4px',
        shadow_intensity: 'soft',
        theme_mode: 'light',
        animations_enabled: false,
        reduced_motion: true,
        high_contrast: false
      },
      tags: ['environmental', 'professional', 'sustainable', 'green']
    }
  ],

  [INDUSTRY_TYPES.GENERIC_BUSINESS]: [
    {
      industry: INDUSTRY_TYPES.GENERIC_BUSINESS,
      name: 'Professional Standard',
      description: 'Versatile theme suitable for any business',
      theme: {
        primary_color: '#374151',
        secondary_color: '#6B7280',
        accent_color: '#059669',
        success_color: '#10B981',
        warning_color: '#F59E0B',
        error_color: '#EF4444',
        background_color: '#FFFFFF',
        surface_color: '#FAF5FF',
        text_primary: '#581C87',
        text_secondary: '#7C2D92',
        border_color: '#E9D5FF',
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '18px',
        line_height_base: '1.6',
        border_radius: '8px',
        shadow_intensity: 'soft',
        theme_mode: 'light',
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: true
      },
      tags: ['professional', 'versatile', 'standard', 'neutral']
    }
  ]
}

/**
 * Get themes for a specific industry
 */
export function getIndustryThemes(industry: IndustryType): IndustryTheme[] {
  return INDUSTRY_THEMES[industry] || INDUSTRY_THEMES[INDUSTRY_TYPES.GENERIC_BUSINESS]
}

/**
 * Get all available themes
 */
export function getAllThemes(): IndustryTheme[] {
  return Object.values(INDUSTRY_THEMES).flat()
}

/**
 * Find a theme by name
 */
export function findThemeByName(name: string): IndustryTheme | null {
  const allThemes = getAllThemes()
  return allThemes.find(theme => theme.name === name) || null
}

/**
 * Get themes by tags
 */
export function getThemesByTags(tags: string[]): IndustryTheme[] {
  const allThemes = getAllThemes()
  return allThemes.filter(theme => 
    tags.some(tag => theme.tags.includes(tag.toLowerCase()))
  )
}

/**
 * Get default theme for an industry
 */
export function getDefaultTheme(industry: IndustryType): IndustryTheme {
  const themes = getIndustryThemes(industry)
  return themes[0] || INDUSTRY_THEMES[INDUSTRY_TYPES.GENERIC_BUSINESS][0]
}

/**
 * Create a custom theme based on an existing one
 */
export function createCustomTheme(
  baseTheme: IndustryTheme, 
  customizations: Partial<BrandingTheme>,
  name: string,
  description: string
): IndustryTheme {
  return {
    ...baseTheme,
    name,
    description,
    theme: {
      ...baseTheme.theme,
      ...customizations
    },
    tags: [...baseTheme.tags, 'custom']
  }
}