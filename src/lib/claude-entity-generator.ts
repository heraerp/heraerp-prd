/**
 * Claude API Entity Generator
 * Smart Code: HERA.PLATFORM.AI.CLAUDE.ENTITY.GENERATOR.v1
 * 
 * Uses Claude API to generate entity fields, Smart Codes, and metadata
 * based on natural language context prompts
 */

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

interface ClaudeResponse {
  success: boolean
  template?: ClaudeEntityTemplate
  error?: string
}

export class ClaudeEntityGenerator {
  private apiKey: string
  private apiUrl: string

  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || process.env.NEXT_PUBLIC_CLAUDE_API_KEY || ''
    this.apiUrl = 'https://api.anthropic.com/v1/messages'
  }

  /**
   * Generate entity template based on natural language prompt
   */
  async generateEntityTemplate(prompt: string, organizationContext?: string): Promise<ClaudeResponse> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Claude API key not configured. Please set CLAUDE_API_KEY environment variable.'
      }
    }

    try {
      console.log('🤖 Generating entity template with Claude API for prompt:', prompt)

      const systemPrompt = this.buildSystemPrompt(organizationContext)
      const userPrompt = this.buildUserPrompt(prompt)

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ]
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Claude API error:', response.status, errorText)
        return {
          success: false,
          error: `Claude API error: ${response.status} - ${errorText}`
        }
      }

      const claudeResponse = await response.json()
      console.log('📥 Claude API response:', claudeResponse)

      if (!claudeResponse.content || !claudeResponse.content[0]?.text) {
        return {
          success: false,
          error: 'Invalid response format from Claude API'
        }
      }

      // Parse Claude's JSON response
      const responseText = claudeResponse.content[0].text
      
      try {
        // Extract JSON from Claude's response (it might be wrapped in markdown)
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error('No JSON found in Claude response')
        }

        const template = JSON.parse(jsonMatch[0].replace(/```json\s*/, '').replace(/\s*```$/, '')) as ClaudeEntityTemplate

        // Validate the template structure
        if (!this.validateTemplate(template)) {
          return {
            success: false,
            error: 'Invalid template structure returned by Claude'
          }
        }

        console.log('✅ Successfully generated entity template:', template)

        return {
          success: true,
          template
        }

      } catch (parseError) {
        console.error('❌ Error parsing Claude response:', parseError)
        return {
          success: false,
          error: `Failed to parse Claude response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
        }
      }

    } catch (error) {
      console.error('💥 Exception calling Claude API:', error)
      return {
        success: false,
        error: `Exception calling Claude API: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(organizationContext?: string): string {
    return `You are an expert at generating entity schemas for the HERA ERP system. Your task is to analyze a user's description of what they want to track and generate a comprehensive entity template.

HERA CONTEXT:
- HERA is an enterprise ERP system with a universal entity model
- All business data is stored as entities with dynamic fields
- Smart Codes follow the pattern: HERA.{INDUSTRY}.{ENTITY_TYPE}.{CATEGORY}.{SUBCATEGORY}.v1
- Field types available: text, number, email, date, textarea, select, boolean
- All entities must have a name, and most business entities need category classification

${organizationContext ? `ORGANIZATION CONTEXT: ${organizationContext}` : ''}

RESPONSE FORMAT:
You must respond with ONLY a valid JSON object in this exact format:

{
  "entityType": "UPPERCASE_ENTITY_TYPE",
  "smartCode": "HERA.INDUSTRY.TYPE.CATEGORY.SUBCATEGORY.v1",
  "description": "Clear description of what this entity represents",
  "category": "business_category",
  "industry": "industry_context", 
  "fields": [
    {
      "name": "field_name",
      "label": "Display Label",
      "type": "text|number|email|date|textarea|select|boolean",
      "required": true|false,
      "options": ["option1", "option2"] // only for select type
      "description": "What this field captures",
      "placeholder": "Example input"
    }
  ],
  "suggestedName": "Default entity name",
  "suggestedCode": "SUGGESTED-CODE"
}

FIELD GUIDELINES:
- Always include: name, category/type, description, status
- For business entities: price/value, dates, contact info
- For people: contact details, roles, preferences  
- For products: specifications, vendor, pricing
- For services: duration, requirements, pricing
- Use select fields for standardized values (status, category, etc.)
- Use textarea for longer descriptions
- Use boolean for yes/no flags
- Make business-critical fields required

SMART CODE RULES:
- HERA.{INDUSTRY}.{ENTITY_TYPE}.{CATEGORY}.{SUBCATEGORY}.v1
- Use UPPERCASE, no spaces, underscores for multi-word segments
- Industry examples: SOFTWARE, RETAIL, HEALTHCARE, FINANCE, MANUFACTURING
- Entity types: PRODUCT, CUSTOMER, SERVICE, VENDOR, ASSET, PROJECT, TASK, USER
- Categories: General business categories for the entity type
- Subcategory: Specific classification or variant

Remember: Return ONLY the JSON object, no other text or markdown formatting.`
  }

  /**
   * Build user prompt with examples
   */
  private buildUserPrompt(userInput: string): string {
    return `USER REQUEST: "${userInput}"

Please analyze this request and generate a comprehensive entity template. Consider:
1. What type of entity is being described?
2. What industry context is implied?
3. What fields would be essential for tracking this entity?
4. What categories or classifications make sense?
5. What business processes would use this entity?

Generate a complete entity template with all relevant fields that would be needed in a business context.`
  }

  /**
   * Validate Claude's template response
   */
  private validateTemplate(template: any): template is ClaudeEntityTemplate {
    if (typeof template !== 'object' || !template) return false
    
    const required = ['entityType', 'smartCode', 'description', 'fields']
    if (!required.every(field => field in template)) return false

    if (!Array.isArray(template.fields)) return false

    // Validate each field
    for (const field of template.fields) {
      if (!field.name || !field.label || !field.type) return false
      
      const validTypes = ['text', 'number', 'email', 'date', 'textarea', 'select', 'boolean']
      if (!validTypes.includes(field.type)) return false

      // If select type, must have options
      if (field.type === 'select' && (!field.options || !Array.isArray(field.options))) {
        return false
      }
    }

    return true
  }

  /**
   * Generate Smart Code suggestion based on context
   */
  async generateSmartCode(entityType: string, industry: string, category: string): Promise<string> {
    const cleanPart = (part: string) => 
      part.toUpperCase().replace(/[^A-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

    return `HERA.${cleanPart(industry)}.${cleanPart(entityType)}.${cleanPart(category)}.STANDARD.v1`
  }

  /**
   * Enhance existing entity template with AI suggestions
   */
  async enhanceEntityTemplate(
    existingFields: ClaudeEntityField[], 
    entityType: string, 
    context: string
  ): Promise<ClaudeEntityField[]> {
    const prompt = `I have an existing ${entityType} entity template with these fields: ${existingFields.map(f => f.name).join(', ')}. 

Context: ${context}

Please suggest 3-5 additional fields that would be valuable for this entity type in this context. Focus on fields that would be commonly needed in business operations.`

    const result = await this.generateEntityTemplate(prompt)
    
    if (result.success && result.template) {
      // Return additional fields not already present
      const existingNames = new Set(existingFields.map(f => f.name))
      return result.template.fields.filter(f => !existingNames.has(f.name))
    }

    return []
  }
}

// Export singleton instance
export const claudeEntityGenerator = new ClaudeEntityGenerator()