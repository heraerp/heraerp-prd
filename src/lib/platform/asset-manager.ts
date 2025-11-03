/**
 * HERA v3.0 Brand Asset Management System
 * Handles logos, favicons, fonts, and other brand assets with CDN integration
 */

import { createClient } from '@/lib/supabase/client'

export interface BrandAsset {
  asset_id: string
  organization_id: string
  asset_type: 'logo' | 'logo_dark' | 'favicon' | 'watermark' | 'background' | 'font' | 'image'
  asset_name: string
  file_name: string
  file_size: number
  file_type: string
  dimensions?: { width: number; height: number }
  public_url: string
  cdn_url?: string
  storage_path: string
  is_active: boolean
  usage_context: string[] // ['header', 'footer', 'email', 'mobile', 'print']
  alt_text?: string
  metadata: AssetMetadata
  created_at: string
  updated_at: string
}

export interface AssetMetadata {
  // Image metadata
  format?: string
  color_profile?: string
  dpi?: number
  has_transparency?: boolean
  
  // Font metadata
  font_family?: string
  font_weights?: number[]
  font_styles?: string[]
  google_fonts_url?: string
  
  // Usage tracking
  usage_count?: number
  last_used_at?: string
  
  // Optimization
  is_optimized?: boolean
  original_size?: number
  compression_ratio?: number
  
  // SEO
  seo_title?: string
  seo_description?: string
}

export interface AssetUploadOptions {
  auto_optimize: boolean
  generate_variants: boolean
  update_existing: boolean
  usage_context: string[]
}

export interface AssetVariant {
  variant_id: string
  parent_asset_id: string
  variant_type: 'thumbnail' | 'small' | 'medium' | 'large' | 'retina' | 'webp' | 'avif'
  dimensions: { width: number; height: number }
  file_size: number
  public_url: string
  cdn_url?: string
}

export interface AssetOptimizationResult {
  success: boolean
  original_size: number
  optimized_size: number
  compression_ratio: number
  variants_created: AssetVariant[]
  cdn_urls: Record<string, string>
}

export interface FontPackage {
  package_id: string
  font_family: string
  provider: 'google_fonts' | 'adobe_fonts' | 'custom'
  variants: FontVariant[]
  css_url?: string
  is_premium: boolean
  license: string
}

export interface FontVariant {
  weight: number
  style: 'normal' | 'italic'
  display_name: string
  woff2_url?: string
  woff_url?: string
  ttf_url?: string
}

/**
 * Brand Asset Manager Class
 */
export class BrandAssetManager {
  private supabase = createClient()
  private assetCache = new Map<string, BrandAsset>()
  private readonly STORAGE_BUCKET = 'brand-assets'
  private readonly CDN_BASE_URL = 'https://cdn.heraerp.com'
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
  private readonly SUPPORTED_FONT_TYPES = ['font/woff2', 'font/woff', 'font/ttf', 'font/otf']

  /**
   * Upload brand asset
   */
  async uploadAsset(
    organizationId: string,
    file: File,
    assetType: BrandAsset['asset_type'],
    options: Partial<AssetUploadOptions> = {}
  ): Promise<{ success: boolean; asset?: BrandAsset; error?: string }> {
    try {
      // Validate file
      const validation = this.validateFile(file, assetType)
      if (!validation.isValid) {
        return { success: false, error: validation.error }
      }

      // Generate unique file name
      const fileName = this.generateFileName(file.name, organizationId, assetType)
      const storagePath = `${organizationId}/${assetType}/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: options.update_existing || false
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(storagePath)

      // Get file dimensions for images
      let dimensions: { width: number; height: number } | undefined
      if (this.isImageType(file.type)) {
        dimensions = await this.getImageDimensions(file)
      }

      // Create asset record
      const asset: BrandAsset = {
        asset_id: crypto.randomUUID(),
        organization_id: organizationId,
        asset_type: assetType,
        asset_name: file.name,
        file_name: fileName,
        file_size: file.size,
        file_type: file.type,
        dimensions,
        public_url: urlData.publicUrl,
        storage_path: storagePath,
        is_active: true,
        usage_context: options.usage_context || ['header'],
        metadata: {
          format: file.type.split('/')[1],
          is_optimized: false,
          original_size: file.size,
          usage_count: 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Optimize asset if requested
      if (options.auto_optimize) {
        const optimizationResult = await this.optimizeAsset(asset)
        if (optimizationResult.success) {
          asset.metadata.is_optimized = true
          asset.metadata.compression_ratio = optimizationResult.compression_ratio
          asset.cdn_url = optimizationResult.cdn_urls.original
        }
      }

      // Generate variants if requested
      if (options.generate_variants && this.isImageType(file.type)) {
        await this.generateAssetVariants(asset)
      }

      // Save to database
      await this.saveAssetToDatabase(asset)

      // Cache the asset
      this.assetCache.set(asset.asset_id, asset)

      // Deactivate old assets of the same type if updating
      if (options.update_existing) {
        await this.deactivateOldAssets(organizationId, assetType, asset.asset_id)
      }

      console.log(`✅ Asset uploaded: ${asset.asset_name}`)
      return { success: true, asset }

    } catch (error) {
      console.error('❌ Asset upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get assets for organization
   */
  async getOrganizationAssets(
    organizationId: string,
    assetType?: BrandAsset['asset_type']
  ): Promise<BrandAsset[]> {
    try {
      // Check cache first
      const cachedAssets = Array.from(this.assetCache.values())
        .filter(asset => asset.organization_id === organizationId)
        .filter(asset => !assetType || asset.asset_type === assetType)
        .filter(asset => asset.is_active)

      if (cachedAssets.length > 0) {
        return cachedAssets
      }

      // Load from database (simulated)
      const assets = await this.loadAssetsFromDatabase(organizationId, assetType)
      
      // Cache loaded assets
      assets.forEach(asset => {
        this.assetCache.set(asset.asset_id, asset)
      })

      return assets

    } catch (error) {
      console.error('❌ Failed to get organization assets:', error)
      return []
    }
  }

  /**
   * Get active asset by type
   */
  async getActiveAsset(organizationId: string, assetType: BrandAsset['asset_type']): Promise<BrandAsset | null> {
    try {
      const assets = await this.getOrganizationAssets(organizationId, assetType)
      return assets.find(asset => asset.is_active) || null
    } catch (error) {
      console.error('❌ Failed to get active asset:', error)
      return null
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const asset = this.assetCache.get(assetId) || await this.getAssetById(assetId)
      if (!asset) {
        return { success: false, error: 'Asset not found' }
      }

      // Delete from storage
      const { error: deleteError } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([asset.storage_path])

      if (deleteError) {
        console.warn('Failed to delete from storage:', deleteError)
      }

      // Delete variants
      await this.deleteAssetVariants(assetId)

      // Remove from database
      await this.deleteAssetFromDatabase(assetId)

      // Remove from cache
      this.assetCache.delete(assetId)

      console.log(`✅ Asset deleted: ${asset.asset_name}`)
      return { success: true }

    } catch (error) {
      console.error('❌ Asset deletion failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Optimize asset (compress, convert formats)
   */
  async optimizeAsset(asset: BrandAsset): Promise<AssetOptimizationResult> {
    try {
      console.log(`🔧 Optimizing asset: ${asset.asset_name}`)

      // In real implementation, this would use image optimization services
      // For demo, we'll simulate optimization
      const optimizationRatio = 0.7 // 30% size reduction
      const optimizedSize = Math.round(asset.file_size * optimizationRatio)

      const result: AssetOptimizationResult = {
        success: true,
        original_size: asset.file_size,
        optimized_size: optimizedSize,
        compression_ratio: optimizationRatio,
        variants_created: [],
        cdn_urls: {
          original: `${this.CDN_BASE_URL}/${asset.storage_path}`,
          optimized: `${this.CDN_BASE_URL}/optimized/${asset.storage_path}`,
          webp: `${this.CDN_BASE_URL}/webp/${asset.storage_path}`,
          avif: `${this.CDN_BASE_URL}/avif/${asset.storage_path}`
        }
      }

      console.log(`✅ Asset optimized: ${asset.asset_name} (${Math.round((1 - optimizationRatio) * 100)}% reduction)`)
      return result

    } catch (error) {
      console.error('❌ Asset optimization failed:', error)
      return {
        success: false,
        original_size: asset.file_size,
        optimized_size: asset.file_size,
        compression_ratio: 1,
        variants_created: [],
        cdn_urls: {}
      }
    }
  }

  /**
   * Generate responsive image variants
   */
  async generateAssetVariants(asset: BrandAsset): Promise<AssetVariant[]> {
    if (!this.isImageType(asset.file_type) || !asset.dimensions) {
      return []
    }

    try {
      console.log(`📐 Generating variants for: ${asset.asset_name}`)

      const variants: AssetVariant[] = []
      const { width, height } = asset.dimensions

      // Define standard variants
      const variantSizes = [
        { type: 'thumbnail', width: 150, height: Math.round(height * 150 / width) },
        { type: 'small', width: 300, height: Math.round(height * 300 / width) },
        { type: 'medium', width: 600, height: Math.round(height * 600 / width) },
        { type: 'large', width: 1200, height: Math.round(height * 1200 / width) },
        { type: 'retina', width: width * 2, height: height * 2 }
      ]

      for (const variantSize of variantSizes) {
        // Skip if variant would be larger than original
        if (variantSize.width > width && variantSize.type !== 'retina') {
          continue
        }

        const variant: AssetVariant = {
          variant_id: crypto.randomUUID(),
          parent_asset_id: asset.asset_id,
          variant_type: variantSize.type as AssetVariant['variant_type'],
          dimensions: { width: variantSize.width, height: variantSize.height },
          file_size: Math.round(asset.file_size * (variantSize.width * variantSize.height) / (width * height)),
          public_url: `${asset.public_url}?w=${variantSize.width}&h=${variantSize.height}`,
          cdn_url: `${this.CDN_BASE_URL}/${asset.storage_path}?w=${variantSize.width}&h=${variantSize.height}`
        }

        variants.push(variant)
      }

      // Save variants to database
      await Promise.all(variants.map(variant => this.saveVariantToDatabase(variant)))

      console.log(`✅ Generated ${variants.length} variants for: ${asset.asset_name}`)
      return variants

    } catch (error) {
      console.error('❌ Variant generation failed:', error)
      return []
    }
  }

  /**
   * Font management methods
   */
  async getAvailableFonts(): Promise<FontPackage[]> {
    // Return popular Google Fonts for demo
    return [
      {
        package_id: 'inter',
        font_family: 'Inter',
        provider: 'google_fonts',
        variants: [
          { weight: 300, style: 'normal', display_name: 'Inter Light' },
          { weight: 400, style: 'normal', display_name: 'Inter Regular' },
          { weight: 500, style: 'normal', display_name: 'Inter Medium' },
          { weight: 600, style: 'normal', display_name: 'Inter SemiBold' },
          { weight: 700, style: 'normal', display_name: 'Inter Bold' }
        ],
        css_url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        is_premium: false,
        license: 'Open Font License'
      },
      {
        package_id: 'playfair_display',
        font_family: 'Playfair Display',
        provider: 'google_fonts',
        variants: [
          { weight: 400, style: 'normal', display_name: 'Playfair Display Regular' },
          { weight: 700, style: 'normal', display_name: 'Playfair Display Bold' },
          { weight: 400, style: 'italic', display_name: 'Playfair Display Italic' }
        ],
        css_url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap',
        is_premium: false,
        license: 'Open Font License'
      },
      {
        package_id: 'roboto',
        font_family: 'Roboto',
        provider: 'google_fonts',
        variants: [
          { weight: 300, style: 'normal', display_name: 'Roboto Light' },
          { weight: 400, style: 'normal', display_name: 'Roboto Regular' },
          { weight: 500, style: 'normal', display_name: 'Roboto Medium' },
          { weight: 700, style: 'normal', display_name: 'Roboto Bold' }
        ],
        css_url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
        is_premium: false,
        license: 'Apache License'
      }
    ]
  }

  async loadFont(fontPackage: FontPackage): Promise<boolean> {
    try {
      if (fontPackage.css_url) {
        // Load Google Font
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = fontPackage.css_url
        document.head.appendChild(link)

        console.log(`✅ Font loaded: ${fontPackage.font_family}`)
        return true
      }

      return false
    } catch (error) {
      console.error('❌ Font loading failed:', error)
      return false
    }
  }

  /**
   * Utility methods
   */
  private validateFile(file: File, assetType: BrandAsset['asset_type']): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024}MB` }
    }

    // Check file type based on asset type
    const isImage = ['logo', 'logo_dark', 'favicon', 'watermark', 'background', 'image'].includes(assetType)
    const isFont = assetType === 'font'

    if (isImage && !this.SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Unsupported image format. Please use JPEG, PNG, SVG, or WebP.' }
    }

    if (isFont && !this.SUPPORTED_FONT_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Unsupported font format. Please use WOFF2, WOFF, TTF, or OTF.' }
    }

    return { isValid: true }
  }

  private generateFileName(originalName: string, organizationId: string, assetType: string): string {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const extension = originalName.split('.').pop()
    return `${assetType}_${timestamp}_${randomId}.${extension}`
  }

  private isImageType(fileType: string): boolean {
    return this.SUPPORTED_IMAGE_TYPES.includes(fileType)
  }

  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ width: 0, height: 0 })
      }
      
      img.src = url
    })
  }

  /**
   * Database operations (simulated for Phase 3)
   */
  private async saveAssetToDatabase(asset: BrandAsset): Promise<void> {
    console.log('💾 Saving asset to database:', asset.asset_id)
  }

  private async loadAssetsFromDatabase(organizationId: string, assetType?: string): Promise<BrandAsset[]> {
    console.log('💾 Loading assets from database:', organizationId)
    return []
  }

  private async deleteAssetFromDatabase(assetId: string): Promise<void> {
    console.log('💾 Deleting asset from database:', assetId)
  }

  private async getAssetById(assetId: string): Promise<BrandAsset | null> {
    console.log('💾 Getting asset by ID:', assetId)
    return null
  }

  private async deactivateOldAssets(organizationId: string, assetType: string, excludeAssetId: string): Promise<void> {
    console.log('💾 Deactivating old assets:', organizationId, assetType)
  }

  private async saveVariantToDatabase(variant: AssetVariant): Promise<void> {
    console.log('💾 Saving variant to database:', variant.variant_id)
  }

  private async deleteAssetVariants(assetId: string): Promise<void> {
    console.log('💾 Deleting asset variants:', assetId)
  }
}

/**
 * Singleton instance
 */
export const assetManager = new BrandAssetManager()