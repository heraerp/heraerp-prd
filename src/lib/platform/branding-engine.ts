/**
 * HERA v3.0 Dynamic Branding Engine
 * Real-time CSS theming with brand color injection and white-label support
 */

import { createClient } from '@/lib/supabase/client'
import { type IndustryType } from './constants'

export interface BrandingTheme {
  // Core Colors
  primary_color: string
  secondary_color: string
  accent_color: string
  success_color: string
  warning_color: string
  error_color: string
  
  // Neutral Colors
  background_color: string
  surface_color: string
  text_primary: string
  text_secondary: string
  border_color: string
  
  // Typography
  font_family_heading: string
  font_family_body: string
  font_size_base: string
  line_height_base: string
  
  // Layout
  border_radius: string
  shadow_intensity: 'none' | 'soft' | 'medium' | 'strong'
  
  // Brand Assets
  logo_url?: string
  logo_dark_url?: string
  favicon_url?: string
  watermark_url?: string
  
  // Advanced Options
  theme_mode: 'light' | 'dark' | 'auto'
  animations_enabled: boolean
  reduced_motion: boolean
  high_contrast: boolean
}

export interface OrganizationBranding {
  organization_id: string
  organization_name: string
  domain_name?: string
  custom_domain?: string
  is_white_label: boolean
  
  theme: BrandingTheme
  
  // SEO & Meta
  meta_title?: string
  meta_description?: string
  meta_keywords?: string[]
  
  // Legal
  privacy_policy_url?: string
  terms_of_service_url?: string
  copyright_text?: string
  
  // Contact
  support_email?: string
  support_phone?: string
  support_url?: string
  
  // Social
  social_links?: {
    website?: string
    linkedin?: string
    facebook?: string
    twitter?: string
    instagram?: string
  }
  
  // Features
  feature_flags?: Record<string, boolean>
  
  // Analytics
  google_analytics_id?: string
  facebook_pixel_id?: string
  
  created_at: string
  updated_at: string
}

export interface BrandingPreset {
  preset_id: string
  preset_name: string
  description: string
  industry: IndustryType
  theme: BrandingTheme
  preview_image?: string
  is_premium: boolean
}

/**
 * Dynamic Branding Engine Class
 */
export class DynamicBrandingEngine {
  private supabase = createClient()
  private currentBranding: OrganizationBranding | null = null
  private themeObservers: Set<(branding: OrganizationBranding) => void> = new Set()
  private cssVariablesInjected = false

  /**
   * Initialize branding for organization
   */
  async initializeBranding(organizationId: string): Promise<OrganizationBranding | null> {
    try {
      // Load organization branding from database
      const branding = await this.loadOrganizationBranding(organizationId)
      
      if (branding) {
        this.currentBranding = branding
        await this.applyBranding(branding)
        this.notifyObservers(branding)
        console.log(`✅ Branding initialized for organization: ${organizationId}`)
      } else {
        console.warn(`⚠️ No branding found for organization: ${organizationId}`)
      }
      
      return branding
      
    } catch (error) {
      console.error('❌ Failed to initialize branding:', error)
      return null
    }
  }

  /**
   * Apply branding theme to the document
   */
  async applyBranding(branding: OrganizationBranding): Promise<void> {
    const { theme } = branding
    
    // Inject CSS variables
    this.injectCSSVariables(theme)
    
    // Update document metadata
    this.updateDocumentMetadata(branding)
    
    // Load brand assets
    await this.loadBrandAssets(theme)
    
    // Apply accessibility settings
    this.applyAccessibilitySettings(theme)
    
    console.log(`✅ Branding applied: ${branding.organization_name}`)
  }

  /**
   * Inject CSS variables for real-time theming (matching MatrixIT World page expectations)
   */
  private injectCSSVariables(theme: BrandingTheme): void {
    const root = document.documentElement
    
    // Primary brand colors that MatrixIT World page expects
    root.style.setProperty('--brand-primary-color', theme.primary_color)
    root.style.setProperty('--brand-secondary-color', theme.secondary_color)
    root.style.setProperty('--brand-accent-color', theme.accent_color)
    root.style.setProperty('--brand-success-color', theme.success_color)
    root.style.setProperty('--brand-warning-color', theme.warning_color)
    root.style.setProperty('--brand-error-color', theme.error_color)
    
    // Background & Surface variables that page expects
    root.style.setProperty('--brand-background-color', theme.background_color)
    root.style.setProperty('--brand-surface-color', theme.surface_color)
    root.style.setProperty('--brand-text-primary', theme.text_primary)
    root.style.setProperty('--brand-text-secondary', theme.text_secondary)
    root.style.setProperty('--brand-border-color', theme.border_color)
    
    // Generate color variations with brand prefix that page expects
    this.generateColorVariations(root, theme.primary_color, 'primary')
    this.generateColorVariations(root, theme.secondary_color, 'secondary')
    this.generateColorVariations(root, theme.accent_color, 'accent')
    this.generateColorVariations(root, theme.success_color, 'success')
    this.generateColorVariations(root, theme.warning_color, 'warning')
    this.generateColorVariations(root, theme.error_color, 'error')
    
    // Also set base colors for Tailwind compatibility
    root.style.setProperty('--primary', theme.primary_color)
    root.style.setProperty('--secondary', theme.secondary_color)
    root.style.setProperty('--accent', theme.accent_color)
    
    // Typography
    root.style.setProperty('--brand-font-heading', theme.font_family_heading)
    root.style.setProperty('--brand-font-body', theme.font_family_body)
    root.style.setProperty('--brand-font-size-base', theme.font_size_base)
    root.style.setProperty('--brand-line-height-base', theme.line_height_base)
    
    // Layout
    root.style.setProperty('--brand-border-radius', theme.border_radius)
    root.style.setProperty('--brand-shadow', this.getShadowValue(theme.shadow_intensity))
    
    this.cssVariablesInjected = true
    console.log('✅ CSS variables injected for MatrixIT World page')
  }

  /**
   * Generate color variations (light, dark, alpha versions)
   */
  private generateColorVariations(root: HTMLElement, baseColor: string, colorName: string): void {
    try {
      // Convert hex to RGB
      const rgb = this.hexToRgb(baseColor)
      if (!rgb) return
      
      // Generate variations
      const variations = {
        50: this.lightenColor(rgb, 0.9),
        100: this.lightenColor(rgb, 0.8),
        200: this.lightenColor(rgb, 0.6),
        300: this.lightenColor(rgb, 0.4),
        400: this.lightenColor(rgb, 0.2),
        500: rgb, // Base color
        600: this.darkenColor(rgb, 0.1),
        700: this.darkenColor(rgb, 0.2),
        800: this.darkenColor(rgb, 0.3),
        900: this.darkenColor(rgb, 0.4),
      }
      
      // Set CSS variables for each variation
      Object.entries(variations).forEach(([shade, color]) => {
        root.style.setProperty(`--brand-${colorName}-${shade}`, `rgb(${color.r}, ${color.g}, ${color.b})`)
        root.style.setProperty(`--brand-${colorName}-${shade}-alpha`, `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`)
        
        // Also set Tailwind CSS compatible variables
        root.style.setProperty(`--${colorName}-${shade}`, `${color.r} ${color.g} ${color.b}`)
      })
      
    } catch (error) {
      console.warn(`Failed to generate variations for ${colorName}:`, error)
    }
  }

  /**
   * Update document metadata
   */
  private updateDocumentMetadata(branding: OrganizationBranding): void {
    // Update title
    if (branding.meta_title) {
      document.title = branding.meta_title
    }
    
    // Update meta tags
    this.updateMetaTag('description', branding.meta_description)
    this.updateMetaTag('keywords', branding.meta_keywords?.join(', '))
    
    // Update favicon
    if (branding.theme.favicon_url) {
      this.updateFavicon(branding.theme.favicon_url)
    }
    
    // Update theme color for mobile browsers
    this.updateMetaTag('theme-color', branding.theme.primary_color)
    
    console.log('✅ Document metadata updated')
  }

  /**
   * Load brand assets (fonts, images)
   */
  private async loadBrandAssets(theme: BrandingTheme): Promise<void> {
    const promises: Promise<void>[] = []
    
    // Load custom fonts
    if (theme.font_family_heading !== 'inherit' && !this.isFontLoaded(theme.font_family_heading)) {
      promises.push(this.loadGoogleFont(theme.font_family_heading))
    }
    
    if (theme.font_family_body !== 'inherit' && !this.isFontLoaded(theme.font_family_body)) {
      promises.push(this.loadGoogleFont(theme.font_family_body))
    }
    
    // Preload brand images
    if (theme.logo_url) {
      promises.push(this.preloadImage(theme.logo_url))
    }
    
    if (theme.logo_dark_url) {
      promises.push(this.preloadImage(theme.logo_dark_url))
    }
    
    await Promise.allSettled(promises)
    console.log('✅ Brand assets loaded')
  }

  /**
   * Apply accessibility settings
   */
  private applyAccessibilitySettings(theme: BrandingTheme): void {
    const root = document.documentElement
    
    // Reduced motion
    if (theme.reduced_motion) {
      root.style.setProperty('--motion-duration', '0s')
      root.classList.add('reduce-motion')
    } else {
      root.style.removeProperty('--motion-duration')
      root.classList.remove('reduce-motion')
    }
    
    // High contrast
    if (theme.high_contrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Animation preferences
    if (!theme.animations_enabled) {
      root.classList.add('no-animations')
    } else {
      root.classList.remove('no-animations')
    }
    
    console.log('✅ Accessibility settings applied')
  }

  /**
   * Load organization branding from HERA Sacred Six core_organizations table
   */
  private async loadOrganizationBranding(organizationId: string): Promise<OrganizationBranding | null> {
    try {
      // Try to load from localStorage cache first
      const cached = localStorage.getItem(`hera_branding_${organizationId}`)
      if (cached) {
        const branding = JSON.parse(cached)
        if (Date.now() - branding.cached_at < 5 * 60 * 1000) { // 5 minute cache
          console.log(`📂 Loading cached branding for ${organizationId}`)
          return branding.data
        }
      }

      // Load from HERA Sacred Six: core_organizations table (actual schema)
      const { data, error } = await this.supabase
        .from('core_organizations')
        .select('id, organization_name, settings, created_at, updated_at')
        .eq('id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database error loading organization:', error)
      }

      let branding: OrganizationBranding

      if (data && data.settings?.theme) {
        console.log(`📖 Loading theme from core_organizations.settings for ${data.organization_name}`)
        // Convert from Sacred Six format to branding format
        branding = {
          organization_id: data.id,
          organization_name: data.organization_name,
          is_white_label: false,
          theme: data.settings.theme,
          meta_title: `${data.organization_name} - Business Management`,
          meta_description: `${data.organization_name} business management platform`,
          created_at: data.created_at,
          updated_at: data.updated_at
        }
      } else {
        console.log(`🎨 Creating default branding for organization: ${organizationId}`)
        // Create minimal default branding following Sacred Six schema
        branding = this.createDefaultBranding(organizationId, data?.organization_name || 'Organization')
        
        // Save default theme to core_organizations.settings table
        await this.saveBrandingToDatabase(branding)
      }
      
      // Cache the result
      localStorage.setItem(`hera_branding_${organizationId}`, JSON.stringify({
        data: branding,
        cached_at: Date.now()
      }))
      
      return branding
      
    } catch (error) {
      console.error('Failed to load organization branding:', error)
      return this.createDefaultBranding(organizationId)
    }
  }

  /**
   * Create minimal default branding (no hardcoded themes)
   */
  private createDefaultBranding(organizationId: string, organizationName?: string): OrganizationBranding {
    return {
      organization_id: organizationId,
      organization_name: organizationName || 'Your Organization',
      is_white_label: false,
      theme: {
        // Neutral default colors - can be customized by user
        primary_color: '#3b82f6',      // Standard blue
        secondary_color: '#64748b',     // Neutral gray
        accent_color: '#10b981',        // Standard green
        success_color: '#10b981',       // Green
        warning_color: '#f59e0b',       // Orange
        error_color: '#ef4444',         // Red
        background_color: '#ffffff',    // White
        surface_color: '#f9fafb',       // Light gray
        text_primary: '#111827',        // Dark gray
        text_secondary: '#6b7280',      // Medium gray
        border_color: '#e5e7eb',        // Light border
        font_family_heading: 'Inter',
        font_family_body: 'Inter',
        font_size_base: '16px',
        line_height_base: '1.5',
        border_radius: '8px',
        shadow_intensity: 'medium' as const,
        theme_mode: 'light' as const,
        animations_enabled: true,
        reduced_motion: false,
        high_contrast: false
      },
      meta_title: 'HERA - Business Management System',
      meta_description: 'Complete business management solution',
      copyright_text: '© 2025 HERA Platform. All rights reserved.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Save branding to HERA Sacred Six core_organizations.settings JSONB field
   */
  private async saveBrandingToDatabase(branding: OrganizationBranding): Promise<void> {
    try {
      // First, get current settings to preserve other data
      const { data: currentData } = await this.supabase
        .from('core_organizations')
        .select('settings')
        .eq('id', branding.organization_id)
        .single()

      const currentSettings = currentData?.settings || {}
      
      // Update theme in settings JSONB field (Sacred Six compliance)
      const updatedSettings = {
        ...currentSettings,
        theme: branding.theme
      }

      const { error } = await this.supabase
        .from('core_organizations')
        .update({ 
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', branding.organization_id)

      if (error) {
        console.error('Failed to save branding to core_organizations.settings:', error)
      } else {
        console.log(`✅ Theme saved to core_organizations.settings for ${branding.organization_id}`)
      }
    } catch (error) {
      console.error('Error saving branding to core_organizations.settings:', error)
    }
  }

  /**
   * Utility methods
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private lightenColor(rgb: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
    return {
      r: Math.round(rgb.r + (255 - rgb.r) * factor),
      g: Math.round(rgb.g + (255 - rgb.g) * factor),
      b: Math.round(rgb.b + (255 - rgb.b) * factor)
    }
  }

  private darkenColor(rgb: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
    return {
      r: Math.round(rgb.r * (1 - factor)),
      g: Math.round(rgb.g * (1 - factor)),
      b: Math.round(rgb.b * (1 - factor))
    }
  }

  private getShadowValue(intensity: 'none' | 'soft' | 'medium' | 'strong'): string {
    const shadows = {
      none: 'none',
      soft: '0 1px 3px rgba(0, 0, 0, 0.1)',
      medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
      strong: '0 10px 15px rgba(0, 0, 0, 0.1)'
    }
    return shadows[intensity]
  }

  private updateMetaTag(name: string, content?: string): void {
    if (!content) return
    
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = name
      document.head.appendChild(meta)
    }
    meta.content = content
  }

  private updateFavicon(url: string): void {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      document.head.appendChild(favicon)
    }
    favicon.href = url
  }

  private isFontLoaded(fontFamily: string): boolean {
    return document.fonts.check(`16px ${fontFamily}`)
  }

  private async loadGoogleFont(fontFamily: string): Promise<void> {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`
    document.head.appendChild(link)
    
    return new Promise((resolve) => {
      link.onload = () => resolve()
      link.onerror = () => resolve() // Don't fail on font load errors
    })
  }

  private async preloadImage(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = () => resolve() // Don't fail on image load errors
      img.src = url
    })
  }

  /**
   * Observer pattern for theme changes
   */
  subscribe(observer: (branding: OrganizationBranding) => void): () => void {
    this.themeObservers.add(observer)
    return () => this.themeObservers.delete(observer)
  }

  private notifyObservers(branding: OrganizationBranding): void {
    this.themeObservers.forEach(observer => observer(branding))
  }

  /**
   * Public API methods
   */
  getCurrentBranding(): OrganizationBranding | null {
    return this.currentBranding
  }

  async updateBranding(organizationId: string, updates: Partial<BrandingTheme>): Promise<boolean> {
    try {
      if (!this.currentBranding) return false
      
      // Update theme
      this.currentBranding.theme = {
        ...this.currentBranding.theme,
        ...updates
      }
      
      // Update timestamp
      this.currentBranding.updated_at = new Date().toISOString()
      
      // Apply changes immediately
      await this.applyBranding(this.currentBranding)
      this.notifyObservers(this.currentBranding)
      
      // Save to database
      await this.saveBrandingToDatabase(this.currentBranding)
      
      // Update cache
      localStorage.setItem(`hera_branding_${organizationId}`, JSON.stringify({
        data: this.currentBranding,
        cached_at: Date.now()
      }))
      
      console.log('✅ Branding updated and saved successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to update branding:', error)
      return false
    }
  }

  async resetToDefaults(organizationId: string): Promise<boolean> {
    try {
      const defaultBranding = this.createDefaultBranding(organizationId)
      await this.applyBranding(defaultBranding)
      this.currentBranding = defaultBranding
      this.notifyObservers(defaultBranding)
      
      // Save to database
      await this.saveBrandingToDatabase(defaultBranding)
      
      // Update cache
      localStorage.setItem(`hera_branding_${organizationId}`, JSON.stringify({
        data: defaultBranding,
        cached_at: Date.now()
      }))
      
      return true
    } catch (error) {
      console.error('❌ Failed to reset branding:', error)
      return false
    }
  }

  /**
   * Export/Import branding configurations
   */
  exportBranding(): string | null {
    if (!this.currentBranding) return null
    return JSON.stringify(this.currentBranding, null, 2)
  }

  async importBranding(brandingJson: string): Promise<boolean> {
    try {
      const branding = JSON.parse(brandingJson) as OrganizationBranding
      await this.applyBranding(branding)
      this.currentBranding = branding
      this.notifyObservers(branding)
      return true
    } catch (error) {
      console.error('❌ Failed to import branding:', error)
      return false
    }
  }

  /**
   * Validate branding theme configuration
   */
  validateBrandingTheme(theme: Partial<BrandingTheme>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Color validation
    const colorFields = ['primary_color', 'secondary_color', 'accent_color', 'background_color', 'text_primary']
    for (const field of colorFields) {
      if (theme[field as keyof BrandingTheme] && !this.isValidColor(theme[field as keyof BrandingTheme] as string)) {
        errors.push(`Invalid color format for ${field}: ${theme[field as keyof BrandingTheme]}`)
      }
    }

    // Font validation
    if (theme.font_size_base && !this.isValidFontSize(theme.font_size_base)) {
      errors.push(`Invalid font size: ${theme.font_size_base}`)
    }

    // Contrast validation
    if (theme.primary_color && theme.background_color) {
      const contrast = this.calculateContrast(theme.primary_color, theme.background_color)
      if (contrast < 3) {
        errors.push(`Poor contrast ratio between primary color and background: ${contrast.toFixed(2)}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Check if a color string is valid
   */
  private isValidColor(color: string): boolean {
    if (!color) return false
    
    // Check hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true
    }
    
    // Check rgb/rgba colors
    if (/^rgba?\([^)]+\)$/.test(color)) {
      return true
    }
    
    // Check named colors (basic check)
    const namedColors = ['red', 'blue', 'green', 'white', 'black', 'transparent']
    if (namedColors.includes(color.toLowerCase())) {
      return true
    }
    
    return false
  }

  /**
   * Check if a font size is valid
   */
  private isValidFontSize(size: string): boolean {
    return /^\d+(\.\d+)?(px|em|rem|%)$/.test(size)
  }

  /**
   * Calculate contrast ratio between two colors
   */
  private calculateContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    const l1 = this.getLuminance(color1)
    const l2 = this.getLuminance(color2)
    
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Get relative luminance of a color
   */
  private getLuminance(color: string): number {
    // Simplified luminance calculation for hex colors
    const hex = color.replace('#', '')
    if (hex.length !== 6) return 0.5 // Default for invalid colors
    
    const r = parseInt(hex.substr(0, 2), 16) / 255
    const g = parseInt(hex.substr(2, 2), 16) / 255
    const b = parseInt(hex.substr(4, 2), 16) / 255
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  /**
   * Test branding system functionality
   */
  async testBrandingSystem(): Promise<{ success: boolean; results: any[] }> {
    const results = []
    let allSuccess = true

    try {
      // Test 1: CSS Variable Injection
      const testTheme: Partial<BrandingTheme> = {
        primary_color: '#3b82f6',
        secondary_color: '#64748b',
        font_family_body: 'Inter'
      }

      const updateSuccess = await this.updateBranding('test-org', testTheme)
      results.push({
        test: 'CSS Variable Injection',
        success: updateSuccess,
        details: updateSuccess ? 'Variables applied successfully' : 'Failed to apply variables'
      })
      allSuccess = allSuccess && updateSuccess

      // Test 2: Color Generation
      const root = document.documentElement
      const primaryVar = getComputedStyle(root).getPropertyValue('--primary-500')
      const colorGenSuccess = !!primaryVar.trim()
      results.push({
        test: 'Color Generation',
        success: colorGenSuccess,
        details: colorGenSuccess ? `Generated: ${primaryVar}` : 'No color variables found'
      })
      allSuccess = allSuccess && colorGenSuccess

      // Test 3: Font Loading
      const fontVar = getComputedStyle(root).getPropertyValue('--font-body')
      const fontSuccess = !!fontVar.trim()
      results.push({
        test: 'Font Loading',
        success: fontSuccess,
        details: fontSuccess ? `Font applied: ${fontVar}` : 'No font variables found'
      })
      allSuccess = allSuccess && fontSuccess

      // Test 4: Real-time Updates
      const startTime = Date.now()
      await this.updateBranding('test-org', { primary_color: '#ef4444' })
      await new Promise(resolve => setTimeout(resolve, 100)) // Allow DOM update
      await this.updateBranding('test-org', testTheme)
      const updateTime = Date.now() - startTime
      
      const realtimeSuccess = updateTime < 1000 // Should update within 1 second
      results.push({
        test: 'Real-time Updates',
        success: realtimeSuccess,
        details: `Update time: ${updateTime}ms`
      })
      allSuccess = allSuccess && realtimeSuccess

    } catch (error) {
      results.push({
        test: 'System Test',
        success: false,
        details: `Error: ${(error as Error).message}`
      })
      allSuccess = false
    }

    return { success: allSuccess, results }
  }

  /**
   * Get branding performance metrics
   */
  getPerformanceMetrics(): { renderTime: number; cssVariableCount: number; fontLoadTime: number } {
    const root = document.documentElement
    const styles = getComputedStyle(root)
    
    // Count CSS variables with HERA prefix
    let cssVariableCount = 0
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i]
        if (sheet.cssRules) {
          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j]
            if (rule.cssText && rule.cssText.includes('--primary-')) {
              cssVariableCount++
            }
          }
        }
      } catch (e) {
        // Skip if can't access stylesheet (CORS)
      }
    }

    return {
      renderTime: performance.now(), // Simplified - in real implementation track actual render time
      cssVariableCount,
      fontLoadTime: 0 // Would track font load time in real implementation
    }
  }
}

/**
 * Singleton instance
 */
export const brandingEngine = new DynamicBrandingEngine()