/**
 * HERA v3.0 Template Storage System
 * Manages loading, caching, and storing template packs in Supabase Storage
 */

import { createClient } from '@/lib/supabase/client'
import { 
  type TemplatePack, 
  type EntityTemplate,
  templateRegistry 
} from './template-registry'
import { type IndustryType } from './constants'

export interface TemplateStorageOptions {
  cacheTimeout: number // in milliseconds
  enableLocalStorage: boolean
  enableCompression: boolean
}

export interface TemplateUploadOptions {
  overwrite: boolean
  validate: boolean
  generateThumbnail: boolean
}

export interface StorageMetadata {
  size: number
  lastModified: string
  version: string
  checksum: string
  author: string
}

/**
 * Template Storage Manager
 */
export class TemplateStorageManager {
  private supabase = createClient()
  private cache = new Map<string, { data: any; timestamp: number; metadata: StorageMetadata }>()
  private options: TemplateStorageOptions

  constructor(options: Partial<TemplateStorageOptions> = {}) {
    this.options = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes default
      enableLocalStorage: true,
      enableCompression: false,
      ...options
    }
  }

  /**
   * Load template pack from Supabase Storage with caching
   */
  async loadTemplatePack(industry: IndustryType): Promise<TemplatePack | null> {
    const packPath = `industries/${industry}/pack.json`
    
    try {
      // Check cache first
      const cached = this.getCachedData(packPath)
      if (cached) {
        console.log(`✅ Template pack loaded from cache: ${industry}`)
        return cached.data as TemplatePack
      }

      // Download from Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('template-packs')
        .download(packPath)

      if (error) {
        console.warn(`Template pack not found in storage: ${industry}, falling back to local`)
        return await this.loadTemplatePackFromLocal(industry)
      }

      // Parse JSON data
      const text = await data.text()
      const pack: TemplatePack = JSON.parse(text)

      // Get file metadata
      const metadata = await this.getFileMetadata('template-packs', packPath)

      // Cache the result
      this.setCachedData(packPath, pack, metadata)

      // Store in localStorage if enabled
      if (this.options.enableLocalStorage) {
        this.setLocalStorageData(packPath, pack, metadata)
      }

      console.log(`✅ Template pack loaded from storage: ${industry}`)
      return pack

    } catch (error) {
      console.error(`❌ Failed to load template pack ${industry}:`, error)
      
      // Try fallback to localStorage
      if (this.options.enableLocalStorage) {
        const localData = this.getLocalStorageData(packPath)
        if (localData) {
          console.log(`✅ Template pack loaded from localStorage: ${industry}`)
          return localData.data as TemplatePack
        }
      }

      // Final fallback to local files
      return await this.loadTemplatePackFromLocal(industry)
    }
  }

  /**
   * Load entity template from Supabase Storage
   */
  async loadEntityTemplate(industry: IndustryType, templateId: string): Promise<EntityTemplate | null> {
    const templatePath = `industries/${industry}/entities/${templateId}.json`
    
    try {
      // Check cache first
      const cached = this.getCachedData(templatePath)
      if (cached) {
        console.log(`✅ Entity template loaded from cache: ${templateId}`)
        return cached.data as EntityTemplate
      }

      // Download from Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('template-packs')
        .download(templatePath)

      if (error) {
        console.warn(`Entity template not found in storage: ${templateId}, falling back to local`)
        return await this.loadEntityTemplateFromLocal(industry, templateId)
      }

      // Parse JSON data
      const text = await data.text()
      const template: EntityTemplate = JSON.parse(text)

      // Get file metadata
      const metadata = await this.getFileMetadata('template-packs', templatePath)

      // Cache the result
      this.setCachedData(templatePath, template, metadata)

      console.log(`✅ Entity template loaded from storage: ${templateId}`)
      return template

    } catch (error) {
      console.error(`❌ Failed to load entity template ${templateId}:`, error)
      return await this.loadEntityTemplateFromLocal(industry, templateId)
    }
  }

  /**
   * Upload template pack to Supabase Storage
   */
  async uploadTemplatePack(
    pack: TemplatePack, 
    options: Partial<TemplateUploadOptions> = {}
  ): Promise<{ success: boolean; path: string; error?: string }> {
    const uploadOptions: TemplateUploadOptions = {
      overwrite: false,
      validate: true,
      generateThumbnail: false,
      ...options
    }

    try {
      // Validate template pack if requested
      if (uploadOptions.validate) {
        const validation = templateRegistry.validateTemplatePack(pack)
        if (!validation.isValid) {
          return {
            success: false,
            path: '',
            error: `Validation failed: ${validation.errors.join(', ')}`
          }
        }
      }

      const packPath = `industries/${pack.industry}/pack.json`
      const packData = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' })

      // Check if file exists and overwrite is disabled
      if (!uploadOptions.overwrite) {
        const { data: existingFile } = await this.supabase.storage
          .from('template-packs')
          .list(`industries/${pack.industry}`, { search: 'pack.json' })

        if (existingFile && existingFile.length > 0) {
          return {
            success: false,
            path: packPath,
            error: 'Template pack already exists. Use overwrite option to replace.'
          }
        }
      }

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('template-packs')
        .upload(packPath, packData, {
          upsert: uploadOptions.overwrite,
          contentType: 'application/json'
        })

      if (error) {
        return {
          success: false,
          path: packPath,
          error: error.message
        }
      }

      // Clear cache for this template pack
      this.clearCachedData(packPath)

      console.log(`✅ Template pack uploaded: ${pack.pack_id}`)
      return {
        success: true,
        path: data.path
      }

    } catch (error) {
      return {
        success: false,
        path: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Upload entity template to Supabase Storage
   */
  async uploadEntityTemplate(
    template: EntityTemplate,
    industry: IndustryType,
    options: Partial<TemplateUploadOptions> = {}
  ): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const templatePath = `industries/${industry}/entities/${template.template_id}.json`
      const templateData = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('template-packs')
        .upload(templatePath, templateData, {
          upsert: options.overwrite || false,
          contentType: 'application/json'
        })

      if (error) {
        return {
          success: false,
          path: templatePath,
          error: error.message
        }
      }

      // Clear cache for this template
      this.clearCachedData(templatePath)

      console.log(`✅ Entity template uploaded: ${template.template_id}`)
      return {
        success: true,
        path: data.path
      }

    } catch (error) {
      return {
        success: false,
        path: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * List available template packs in storage
   */
  async listAvailableTemplatePacks(): Promise<{ industry: IndustryType; metadata: StorageMetadata }[]> {
    try {
      const { data, error } = await this.supabase.storage
        .from('template-packs')
        .list('industries', { limit: 100 })

      if (error) throw error

      const packs: { industry: IndustryType; metadata: StorageMetadata }[] = []

      // Check each industry folder for pack.json
      for (const folder of data || []) {
        if (folder.name) {
          const packPath = `industries/${folder.name}/pack.json`
          const metadata = await this.getFileMetadata('template-packs', packPath)
          
          if (metadata) {
            packs.push({
              industry: folder.name as IndustryType,
              metadata
            })
          }
        }
      }

      return packs

    } catch (error) {
      console.error('Failed to list template packs:', error)
      return []
    }
  }

  /**
   * Delete template pack from storage
   */
  async deleteTemplatePack(industry: IndustryType): Promise<{ success: boolean; error?: string }> {
    try {
      // List all files in the industry folder
      const { data: files, error: listError } = await this.supabase.storage
        .from('template-packs')
        .list(`industries/${industry}`, { limit: 1000 })

      if (listError) throw listError

      // Delete all files in the folder
      const filePaths = files?.map(file => `industries/${industry}/${file.name}`) || []
      
      if (filePaths.length > 0) {
        const { error: deleteError } = await this.supabase.storage
          .from('template-packs')
          .remove(filePaths)

        if (deleteError) throw deleteError
      }

      // Clear all cached data for this industry
      this.clearIndustryCache(industry)

      console.log(`✅ Template pack deleted: ${industry}`)
      return { success: true }

    } catch (error) {
      console.error(`❌ Failed to delete template pack ${industry}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Sync local template packs to storage (development helper)
   */
  async syncLocalTemplatesToStorage(): Promise<{ success: boolean; synced: string[]; errors: string[] }> {
    const synced: string[] = []
    const errors: string[] = []

    const industries: IndustryType[] = ['waste_management', 'salon_beauty', 'restaurant', 'healthcare', 'retail', 'construction']

    for (const industry of industries) {
      try {
        // Load from local files
        const pack = await this.loadTemplatePackFromLocal(industry)
        
        if (pack) {
          // Upload to storage
          const result = await this.uploadTemplatePack(pack, { overwrite: true })
          
          if (result.success) {
            synced.push(industry)
          } else {
            errors.push(`${industry}: ${result.error}`)
          }
        }
      } catch (error) {
        errors.push(`${industry}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return {
      success: errors.length === 0,
      synced,
      errors
    }
  }

  /**
   * Get file metadata from Supabase Storage
   */
  private async getFileMetadata(bucket: string, path: string): Promise<StorageMetadata | null> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(path.substring(0, path.lastIndexOf('/')), {
          search: path.substring(path.lastIndexOf('/') + 1)
        })

      if (error || !data || data.length === 0) return null

      const file = data[0]
      return {
        size: file.metadata?.size || 0,
        lastModified: file.updated_at || file.created_at || '',
        version: file.metadata?.version || '1.0.0',
        checksum: file.metadata?.eTag || '',
        author: file.metadata?.author || 'Unknown'
      }

    } catch (error) {
      console.error('Failed to get file metadata:', error)
      return null
    }
  }

  /**
   * Cache management methods
   */
  private getCachedData(key: string): { data: any; timestamp: number; metadata: StorageMetadata } | null {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.options.cacheTimeout) {
      return cached
    }
    
    // Remove expired cache
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  private setCachedData(key: string, data: any, metadata: StorageMetadata): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      metadata
    })
  }

  private clearCachedData(key: string): void {
    this.cache.delete(key)
  }

  private clearIndustryCache(industry: IndustryType): void {
    const industryPrefix = `industries/${industry}/`
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(industryPrefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * localStorage management (fallback cache)
   */
  private setLocalStorageData(key: string, data: any, metadata: StorageMetadata): void {
    if (!this.options.enableLocalStorage || typeof window === 'undefined') return
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        metadata
      }
      
      localStorage.setItem(`hera_template_${key}`, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to store in localStorage:', error)
    }
  }

  private getLocalStorageData(key: string): { data: any; timestamp: number; metadata: StorageMetadata } | null {
    if (!this.options.enableLocalStorage || typeof window === 'undefined') return null
    
    try {
      const cached = localStorage.getItem(`hera_template_${key}`)
      if (!cached) return null
      
      const parsedCache = JSON.parse(cached)
      
      // Check if cache is still valid
      if (Date.now() - parsedCache.timestamp < this.options.cacheTimeout) {
        return parsedCache
      }
      
      // Remove expired cache
      localStorage.removeItem(`hera_template_${key}`)
      return null
      
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
      return null
    }
  }

  /**
   * Fallback to local files (Phase 1 compatibility)
   */
  private async loadTemplatePackFromLocal(industry: IndustryType): Promise<TemplatePack | null> {
    try {
      const response = await fetch(`/templates/industries/${industry}/pack.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to load template pack from local:', error)
      return null
    }
  }

  private async loadEntityTemplateFromLocal(industry: IndustryType, templateId: string): Promise<EntityTemplate | null> {
    try {
      const response = await fetch(`/templates/industries/${industry}/entities/${templateId}.json`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to load entity template from local:', error)
      return null
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear()
    
    if (this.options.enableLocalStorage && typeof window !== 'undefined') {
      // Clear all template-related localStorage
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith('hera_template_')) {
          localStorage.removeItem(key)
        }
      }
    }
    
    console.log('✅ All template caches cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryCache: { size: number; keys: string[] }
    localStorageCache: { size: number; keys: string[] }
  } {
    const localStorageKeys: string[] = []
    
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('hera_template_')) {
          localStorageKeys.push(key)
        }
      }
    }
    
    return {
      memoryCache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      localStorageCache: {
        size: localStorageKeys.length,
        keys: localStorageKeys
      }
    }
  }
}

/**
 * Singleton instance
 */
export const templateStorage = new TemplateStorageManager()