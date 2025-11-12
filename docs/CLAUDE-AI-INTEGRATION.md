# Claude AI Integration for Universal Entity Generator

## Overview

The Universal Entity Generator now includes Claude AI integration to automatically generate entity templates based on natural language descriptions. This allows users to describe what they want to track in plain English, and Claude will generate appropriate entity types, fields, Smart Codes, and metadata.

## Features

### 🤖 AI-Powered Entity Generation
- **Natural Language Input**: Describe what you want to track in plain English
- **Intelligent Field Generation**: Claude analyzes the description and generates relevant fields
- **Smart Code Generation**: Automatic HERA DNA Smart Code creation
- **Field Type Detection**: Appropriate field types (text, number, select, boolean, etc.)
- **Business Context Awareness**: Fields relevant to business operations

### 🔧 AI Enhancement Capabilities
- **Field Enhancement**: Add missing fields to existing templates
- **Business Logic**: Understands common business entities and their requirements
- **Industry Context**: Adapts to different industry contexts (software, retail, healthcare, etc.)
- **Validation Rules**: Suggests required fields and validation constraints

## Setup

### 1. Environment Configuration

Add your Claude API key to your environment file:

```bash
# .env.local
CLAUDE_API_KEY=sk-ant-api03-your-api-key-here
NEXT_PUBLIC_CLAUDE_API_KEY=sk-ant-api03-your-api-key-here
```

### 2. API Key Requirements

- **Claude API Key**: Get from [Anthropic Console](https://console.anthropic.com/)
- **Model**: Uses `claude-3-sonnet-20240229` for optimal performance
- **Rate Limits**: Respects Anthropic's API rate limits

## Usage

### Basic AI Generation

1. **Navigate to Universal Entity Generator**: `http://localhost:3000/universal-entity-generator`
2. **Click "Generate with AI"** in the blue AI section
3. **Describe what you want to track**:

```
Example prompts:
- "I want to track software licenses for our company with renewal dates, vendor info, and cost tracking"
- "Customer project requirements with timelines, budget, and team assignments"
- "Equipment maintenance records with service history and warranty information"
- "Employee training certifications with expiration dates and renewal requirements"
```

4. **Review Generated Template**: Claude will generate:
   - Entity type and description
   - HERA Smart Code
   - Complete field list with appropriate types
   - Required field designations
   - Select field options

5. **Apply Template**: Use the generated template or refine it

### AI Field Enhancement

When configuring fields for any entity:

1. **Click "AI Enhance Fields"** in the Dynamic Fields section
2. **Claude analyzes current fields** and suggests additional relevant fields
3. **Review suggestions** and add valuable fields to your entity

## Example AI Generations

### Software License Tracking

**Prompt**: "Software licenses with renewal tracking and vendor management"

**Generated**:
- Entity Type: `SOFTWARE_LICENSE`
- Smart Code: `HERA.SOFTWARE.SOFTWARE_LICENSE.LICENSE.SUBSCRIPTION.v1`
- Fields: license_name, vendor, license_type, user_count, renewal_date, cost_annual, license_key, status, etc.

### Project Management

**Prompt**: "Client project tracking with timelines, budgets, and team assignments"

**Generated**:
- Entity Type: `PROJECT`
- Smart Code: `HERA.SOFTWARE.PROJECT.CLIENT.MANAGEMENT.v1`
- Fields: project_name, client_id, start_date, end_date, budget, team_lead, status, priority, etc.

### Equipment Maintenance

**Prompt**: "Equipment maintenance tracking with service history"

**Generated**:
- Entity Type: `EQUIPMENT_MAINTENANCE`
- Smart Code: `HERA.SOFTWARE.EQUIPMENT_MAINTENANCE.SERVICE.TRACKING.v1`
- Fields: equipment_id, maintenance_type, service_date, technician, cost, next_service, warranty_status, etc.

## API Integration

### Programmatic Usage

```typescript
import { claudeEntityGenerator } from '@/lib/claude-entity-generator'

// Generate entity template
const result = await claudeEntityGenerator.generateEntityTemplate(
  "Employee training records with certifications",
  "Software company with remote workforce"
)

if (result.success) {
  console.log('Generated template:', result.template)
  // Use template in your application
}
```

### React Hook Usage

```tsx
import { useClaudeEntityGenerator } from '@/hooks/useClaudeEntityGenerator'

function MyComponent() {
  const { generateTemplate, isGenerating, generatedTemplate } = useClaudeEntityGenerator()

  const handleGenerate = async () => {
    await generateTemplate("Describe what you want to track")
  }

  return (
    <div>
      {isGenerating ? <LoadingSpinner /> : null}
      {generatedTemplate ? <TemplatePreview template={generatedTemplate} /> : null}
    </div>
  )
}
```

## Smart Code Generation

Claude generates HERA-compliant Smart Codes following the pattern:

```
HERA.{INDUSTRY}.{ENTITY_TYPE}.{CATEGORY}.{SUBCATEGORY}.v1
```

### Examples:
- `HERA.SOFTWARE.PRODUCT.SAAS.SUBSCRIPTION.v1`
- `HERA.SOFTWARE.CUSTOMER.ENTERPRISE.B2B.v1`
- `HERA.SOFTWARE.PROJECT.CLIENT.CONSULTING.v1`
- `HERA.SOFTWARE.ASSET.EQUIPMENT.HARDWARE.v1`

## Field Type Intelligence

Claude automatically selects appropriate field types:

| Business Context | Field Type | Example |
|------------------|------------|---------|
| Dates, deadlines | `date` | renewal_date, due_date |
| Money, costs | `number` | price, budget, cost |
| Status, categories | `select` | status, priority, type |
| Yes/No flags | `boolean` | active, featured, expired |
| Long descriptions | `textarea` | notes, description |
| Email addresses | `email` | contact_email, billing_email |
| Short text | `text` | name, code, reference |

## Error Handling

The system gracefully handles various error scenarios:

### API Key Issues
```typescript
// Missing API key
{
  success: false,
  error: "Claude API key not configured. Please set CLAUDE_API_KEY environment variable."
}
```

### API Errors
```typescript
// API request failed
{
  success: false,
  error: "Claude API error: 429 - Rate limit exceeded"
}
```

### Parse Errors
```typescript
// Invalid response format
{
  success: false,
  error: "Failed to parse Claude response: Invalid JSON structure"
}
```

## Best Practices

### 1. Effective Prompts
- **Be specific about the business context**
- **Mention the industry or use case**
- **Include important business requirements**
- **Specify any compliance or regulatory needs**

### 2. Template Review
- **Always review generated fields**
- **Customize field labels and descriptions**
- **Add organization-specific requirements**
- **Validate Smart Code format**

### 3. Performance Optimization
- **Use AI generation for complex or new entity types**
- **Cache generated templates for reuse**
- **Combine AI generation with manual refinement**
- **Use field enhancement for existing templates**

## Security Considerations

- **API keys are never logged or exposed**
- **User prompts are sent to Anthropic's API**
- **No business data is stored by Claude**
- **Generated templates are processed locally**
- **Follow your organization's AI usage policies**

## Limitations

- **Requires active internet connection**
- **Subject to Anthropic API rate limits**
- **Generated templates may need manual refinement**
- **Industry-specific terminology may need adjustment**
- **Smart Codes follow HERA patterns but may need validation**

## Troubleshooting

### Common Issues

1. **"API key not configured"**
   - Solution: Add `CLAUDE_API_KEY` to your `.env.local` file

2. **"Rate limit exceeded"**
   - Solution: Wait and retry, or upgrade your Anthropic API plan

3. **"Invalid response format"**
   - Solution: Check your prompt for special characters or try a simpler description

4. **"Failed to parse response"**
   - Solution: Claude's response may be malformed, try generating again

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In your environment
DEBUG_CLAUDE_API=true
```

This will log:
- API requests and responses
- Template parsing steps
- Error details and context

## Future Enhancements

- **Multi-language support** for international businesses
- **Industry-specific templates** with pre-trained contexts
- **Relationship suggestions** between entities
- **Validation rule generation** for business logic
- **Integration with existing entity libraries**
- **Batch entity generation** for related entity types

## Support

For issues with Claude AI integration:

1. **Check API key configuration**
2. **Verify internet connectivity**
3. **Review Anthropic API status**
4. **Check console for detailed error messages**
5. **Try with simpler prompts first**

The Claude AI integration makes entity creation accessible to business users while maintaining HERA's technical standards and compliance requirements.