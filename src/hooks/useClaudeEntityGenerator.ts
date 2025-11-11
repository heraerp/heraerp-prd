/**
 * useClaudeEntityGenerator Hook
 * React hook for integrating Claude API entity generation
 */

import { useState, useCallback } from 'react'
import { claudeEntityGenerator } from '@/lib/claude-entity-generator'

interface ClaudeEntityField {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'select' | 'boolean'
  required?: boolean
  options?: string[]
  description?: string
  placeholder?: string
}

interface ClaudeEntityTemplate {
  entityType: string
  smartCode: string
  description: string
  category: string
  industry: string
  fields: ClaudeEntityField[]
  suggestedName?: string
  suggestedCode?: string
}

interface UseClaudeEntityGeneratorResult {
  isGenerating: boolean
  generatedTemplate: ClaudeEntityTemplate | null
  error: string | null
  generateTemplate: (prompt: string, organizationContext?: string) => Promise<void>
  enhanceFields: (existingFields: ClaudeEntityField[], entityType: string, context: string) => Promise<ClaudeEntityField[]>
  clearTemplate: () => void
}

export function useClaudeEntityGenerator(): UseClaudeEntityGeneratorResult {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTemplate, setGeneratedTemplate] = useState<ClaudeEntityTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateTemplate = useCallback(async (prompt: string, organizationContext?: string) => {
    setIsGenerating(true)
    setError(null)
    setGeneratedTemplate(null)

    try {
      console.log('🤖 Generating entity template with Claude for prompt:', prompt)
      
      const result = await claudeEntityGenerator.generateEntityTemplate(prompt, organizationContext)
      
      if (result.success && result.template) {
        console.log('✅ Successfully generated template:', result.template)
        setGeneratedTemplate(result.template)
      } else {
        console.error('❌ Failed to generate template:', result.error)
        setError(result.error || 'Unknown error occurred')
      }
    } catch (err) {
      console.error('💥 Exception in generateTemplate:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const enhanceFields = useCallback(async (
    existingFields: ClaudeEntityField[], 
    entityType: string, 
    context: string
  ): Promise<ClaudeEntityField[]> => {
    try {
      console.log('🔧 Enhancing fields with Claude for entity type:', entityType)
      
      const enhancedFields = await claudeEntityGenerator.enhanceEntityTemplate(
        existingFields, 
        entityType, 
        context
      )
      
      console.log('✅ Successfully enhanced fields:', enhancedFields)
      return enhancedFields
    } catch (err) {
      console.error('💥 Exception in enhanceFields:', err)
      return []
    }
  }, [])

  const clearTemplate = useCallback(() => {
    setGeneratedTemplate(null)
    setError(null)
  }, [])

  return {
    isGenerating,
    generatedTemplate,
    error,
    generateTemplate,
    enhanceFields,
    clearTemplate
  }
}