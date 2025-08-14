# HERA Universal AI System Documentation

**🤖 The World's First Universal AI Orchestration System**  
*Intelligently routes AI requests to optimal providers with automatic fallback*

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Endpoints](#api-endpoints)
4. [Smart Codes](#smart-codes)
5. [Provider Intelligence](#provider-intelligence)
6. [Usage Examples](#usage-examples)
7. [Integration Patterns](#integration-patterns)
8. [Best Practices](#best-practices)
9. [Error Handling](#error-handling)
10. [Performance & Costs](#performance--costs)

---

## Overview

HERA Universal AI System eliminates vendor lock-in by intelligently orchestrating multiple AI providers (OpenAI, Claude, Gemini, Local LLM) to deliver optimal results for any task.

### 🎯 Key Benefits
- **Never Fails**: Automatic fallback ensures AI always works
- **Always Optimal**: Routes to best AI provider for each specific task
- **Cost Efficient**: Intelligent cost-based provider selection
- **Infinitely Scalable**: Handles any volume of AI requests seamlessly

### 🏗️ Architecture
```
Your Request → HERA AI Router → Best Provider Selection → Response + Metadata
     ↓              ↓                    ↓                      ↓
Task Analysis → Provider Scoring → Primary/Fallback → Confidence + Cost
```

---

## Quick Start

### 1. Basic AI Request
```typescript
// Simple AI chat completion
const response = await fetch('/api/v1/ai/universal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'custom_request',
    smart_code: 'HERA.AI.CHAT.COMPLETION.v1',
    task_type: 'chat',
    prompt: 'Explain quantum computing in simple terms',
    max_tokens: 500,
    temperature: 0.7
  })
})

const result = await response.json()
if (result.success) {
  console.log('AI Response:', result.data.content)
  console.log('Provider Used:', result.data.provider_used)
  console.log('Confidence:', result.data.confidence_score)
  console.log('Cost:', result.data.cost_estimate)
}
```

### 2. Learning-Specific AI (CA Final Example)
```typescript
// Generate CA practice questions
const questions = await fetch('/api/v1/ai/universal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate_ca_questions',
    topic: 'GST Input Tax Credit',
    difficulty: 'medium',
    count: 5
  })
})
```

### 3. Business Intelligence
```typescript
// Analyze business data
const insights = await fetch('/api/v1/ai/universal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate_business_insights',
    business_data: {
      revenue: 150000,
      expenses: 120000,
      growth_rate: 0.15,
      industry: 'restaurant'
    }
  })
})
```

---

## API Endpoints

### `/api/v1/ai/universal` (POST)
**Main AI processing endpoint with intelligent provider routing**

#### Available Actions:

| Action | Description | Use Case |
|--------|-------------|----------|
| `generate_ca_questions` | Generate CA learning questions | Education, Training |
| `analyze_student_performance` | Analyze learning progress | Performance Analytics |
| `generate_quiz_feedback` | Create personalized feedback | Learning Systems |
| `generate_business_insights` | Business data analysis | Analytics, Reporting |
| `custom_request` | Custom AI request with full control | Any AI Task |
| `batch_request` | Process multiple requests | Bulk Operations |

#### Request Structure:
```typescript
{
  action: string,              // Required: Action type
  smart_code?: string,         // Smart Code classification
  task_type?: string,          // 'chat' | 'generation' | 'analysis' | 'code' | 'learning'
  prompt?: string,             // AI prompt (for custom requests)
  max_tokens?: number,         // Response length limit
  temperature?: number,        // Creativity level (0-1)
  preferred_provider?: string, // Force specific provider
  fallback_enabled?: boolean,  // Enable automatic fallback (default: true)
  organization_id?: string,    // Multi-tenant isolation
  user_id?: string            // User tracking
}
```

#### Response Structure:
```typescript
{
  success: boolean,
  data?: {
    content: string,           // AI-generated content
    provider_used: string,     // Which AI provider was used
    tokens_used: number,       // Token consumption
    cost_estimate: number,     // Estimated cost in USD
    confidence_score: number,  // AI confidence (0-1)
    processing_time_ms: number // Response time
  },
  error?: string,             // Error message if failed
  smart_code: string,         // Smart Code used
  timestamp: string,          // ISO timestamp
  metadata?: {
    request_id: string,       // Unique request identifier
    fallback_attempts: number,// Number of provider fallbacks
    provider_selection_reason: string // Why this provider was chosen
  }
}
```

### `/api/v1/ai/stream` (POST)
**Real-time streaming AI responses via Server-Sent Events**

```typescript
// Stream AI responses in real-time
const eventSource = new EventSource('/api/v1/ai/stream', {
  method: 'POST',
  body: JSON.stringify({
    smart_code: 'HERA.AI.STREAM.CHAT.v1',
    task_type: 'chat',
    prompt: 'Write a detailed explanation of blockchain technology'
  })
})

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  
  switch (data.type) {
    case 'metadata':
      console.log('Stream started:', data)
      break
    case 'content':
      console.log('Chunk received:', data.chunk)
      break
    case 'complete':
      console.log('Stream completed')
      eventSource.close()
      break
    case 'error':
      console.error('Stream error:', data.error)
      break
  }
}
```

### `/api/v1/ai/docs` (POST)
**AI-powered documentation generation**

```typescript
// Generate API documentation
const docs = await fetch('/api/v1/ai/docs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate_api_docs',
    content: `// Your code here`,
    type: 'typescript',
    context: 'HERA Universal API'
  })
})
```

---

## Smart Codes

HERA uses Smart Codes to classify and route AI operations intelligently:

### Core AI Operations
```typescript
'HERA.AI.CHAT.COMPLETION.v1'     // General chat/conversation
'HERA.AI.QUEST.GENERATE.v1'      // Question generation
'HERA.AI.CONTENT.ANALYZE.v1'     // Content analysis
'HERA.AI.CODE.GENERATE.v1'       // Code generation
'HERA.AI.EXPLAIN.CONCEPT.v1'     // Concept explanations
```

### Learning-Specific AI
```typescript
'HERA.CA.AI.ASSESS.STUDENT.v1'   // Student assessment
'HERA.CA.AI.FEEDBACK.QUIZ.v1'    // Quiz feedback
'HERA.CA.AI.DIFFICULTY.ADAPT.v1' // Difficulty adjustment
```

### Business AI Operations
```typescript
'HERA.BIZ.AI.DOC.SUMMARIZE.v1'   // Document summarization
'HERA.BIZ.AI.REPORT.GENERATE.v1' // Report generation
'HERA.BIZ.AI.DATA.INSIGHTS.v1'   // Data insights
```

### Documentation AI
```typescript
'HERA.AI.DOCS.API.GENERATE.v1'       // API documentation
'HERA.AI.DOCS.COMPONENT.GENERATE.v1' // Component docs
'HERA.AI.DOCS.USER_GUIDE.GENERATE.v1' // User guides
```

---

## Provider Intelligence

HERA automatically selects the optimal AI provider based on task type:

### Provider Selection Matrix

| Task Type | Primary | Secondary | Tertiary | Reasoning |
|-----------|---------|-----------|----------|-----------|
| **Learning** | Claude | OpenAI | Gemini | Claude excels at educational content |
| **Code Generation** | OpenAI | Claude | Gemini | GPT-4 strong for code |
| **Data Analysis** | Claude | Gemini | OpenAI | Claude excellent for analysis |
| **Creative Writing** | OpenAI | Gemini | Claude | GPT-4 for creativity |
| **General Chat** | OpenAI | Claude | Gemini | Balanced conversation |

### Provider Capabilities
```typescript
{
  openai: {
    name: 'OpenAI GPT-4',
    capabilities: ['chat', 'code', 'analysis', 'creative'],
    cost_per_token: 0.00003,
    max_tokens: 128000
  },
  claude: {
    name: 'Anthropic Claude',
    capabilities: ['chat', 'analysis', 'code', 'reasoning'],
    cost_per_token: 0.000025,
    max_tokens: 200000
  },
  gemini: {
    name: 'Google Gemini',
    capabilities: ['chat', 'multimodal', 'analysis'],
    cost_per_token: 0.00002,
    max_tokens: 1000000
  }
}
```

---

## Usage Examples

### 1. CA Learning Platform Integration
```typescript
// In React component
const [aiResponse, setAiResponse] = useState('')
const [loading, setLoading] = useState(false)

const handleAIExplanation = async (concept: string) => {
  setLoading(true)
  try {
    const response = await fetch('/api/v1/ai/universal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'custom_request',
        smart_code: 'HERA.CA.AI.EXPLAIN.CONCEPT.v1',
        task_type: 'learning',
        prompt: `Explain ${concept} in CA Final Indirect Tax with practical examples and legal section references`,
        max_tokens: 1000,
        temperature: 0.3
      })
    })
    
    const result = await response.json()
    if (result.success) {
      setAiResponse(result.data.content)
    }
  } catch (error) {
    console.error('AI Error:', error)
  } finally {
    setLoading(false)
  }
}
```

### 2. Business Intelligence Dashboard
```typescript
// Analyze restaurant performance
const analyzeRestaurantData = async () => {
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_business_insights',
      business_data: {
        monthly_revenue: 85000,
        monthly_expenses: 65000,
        customer_count: 1250,
        avg_order_value: 68,
        food_cost_percentage: 0.28,
        labor_cost_percentage: 0.32,
        industry: 'restaurant',
        location: 'urban'
      }
    })
  })
  
  const insights = await response.json()
  return insights.data.content // AI-generated business recommendations
}
```

### 3. Code Documentation Generation
```typescript
// Auto-generate documentation
const generateDocs = async (codeContent: string) => {
  const response = await fetch('/api/v1/ai/docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_api_docs',
      content: codeContent,
      type: 'typescript',
      context: 'HERA Universal API'
    })
  })
  
  const docs = await response.json()
  return docs.data.content // Comprehensive API documentation
}
```

### 4. Batch AI Processing
```typescript
// Process multiple AI requests simultaneously
const batchRequests = [
  {
    smart_code: 'HERA.AI.EXPLAIN.CONCEPT.v1',
    task_type: 'learning',
    prompt: 'Explain GST registration process'
  },
  {
    smart_code: 'HERA.AI.QUEST.GENERATE.v1', 
    task_type: 'learning',
    prompt: 'Generate 3 questions on Input Tax Credit'
  },
  {
    smart_code: 'HERA.AI.DATA.INSIGHTS.v1',
    task_type: 'analysis',
    prompt: 'Analyze student performance trends'
  }
]

const batchResponse = await fetch('/api/v1/ai/universal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'batch_request',
    requests: batchRequests
  })
})

const results = await batchResponse.json()
// Process all AI responses simultaneously
```

---

## Integration Patterns

### 1. React Hook Pattern
```typescript
// Custom hook for HERA AI
import { useState, useCallback } from 'react'

export const useHeraAI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callAI = useCallback(async (request: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI request failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { callAI, loading, error }
}

// Usage
const { callAI, loading, error } = useHeraAI()

const generateContent = async () => {
  const result = await callAI({
    action: 'custom_request',
    smart_code: 'HERA.AI.CONTENT.GENERATE.v1',
    task_type: 'generation',
    prompt: 'Create marketing copy for restaurant'
  })
  
  console.log('Generated content:', result.content)
}
```

### 2. Server-Side Integration
```typescript
// Next.js API route using HERA AI
import { universalAI } from '@/lib/ai/universal-ai'

export async function POST(request: Request) {
  const { userQuery } = await request.json()
  
  const aiResponse = await universalAI.processRequest({
    smart_code: 'HERA.BIZ.AI.CUSTOMER.SUPPORT.v1',
    task_type: 'chat',
    prompt: `Customer inquiry: ${userQuery}`,
    temperature: 0.3,
    fallback_enabled: true
  })
  
  return Response.json(aiResponse)
}
```

### 3. Real-time Chat Integration
```typescript
// Streaming chat with HERA AI
const ChatComponent = () => {
  const [messages, setMessages] = useState<string[]>([])
  const [streaming, setStreaming] = useState(false)

  const sendMessage = async (message: string) => {
    setStreaming(true)
    
    const response = await fetch('/api/v1/ai/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smart_code: 'HERA.AI.CHAT.STREAM.v1',
        task_type: 'chat',
        prompt: message
      })
    })

    const reader = response.body?.getReader()
    let aiResponse = ''
    
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = new TextDecoder().decode(value)
      aiResponse += chunk
      setMessages(prev => [...prev.slice(0, -1), aiResponse])
    }
    
    setStreaming(false)
  }

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
      {streaming && <div>AI is typing...</div>}
    </div>
  )
}
```

---

## Best Practices

### 1. Smart Code Usage
```typescript
// ✅ Good: Use specific Smart Codes
const response = await callAI({
  smart_code: 'HERA.CA.AI.EXPLAIN.GST.ITC.v1', // Specific
  task_type: 'learning',
  prompt: 'Explain Input Tax Credit rules'
})

// ❌ Bad: Generic Smart Codes
const response = await callAI({
  smart_code: 'HERA.AI.GENERIC.v1', // Too generic
  task_type: 'chat',
  prompt: 'Explain Input Tax Credit rules'
})
```

### 2. Temperature Settings
```typescript
// Factual content (low temperature)
const explanation = await callAI({
  temperature: 0.2, // More factual, less creative
  prompt: 'Explain GST registration requirements'
})

// Creative content (high temperature)
const story = await callAI({
  temperature: 0.8, // More creative, less factual
  prompt: 'Create an engaging story about tax compliance'
})
```

### 3. Error Handling
```typescript
// ✅ Comprehensive error handling
const callAIWithFallback = async (request: any) => {
  try {
    const response = await fetch('/api/v1/ai/universal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        fallback_enabled: true // Always enable fallback
      })
    })
    
    const result = await response.json()
    
    if (!result.success) {
      // Log the error but provide fallback
      console.error('AI Error:', result.error)
      return { content: 'AI service temporarily unavailable. Please try again.' }
    }
    
    return result.data
  } catch (error) {
    console.error('Network error:', error)
    return { content: 'Network error. Please check your connection.' }
  }
}
```

### 4. Cost Optimization
```typescript
// Use caching for expensive requests
const getCachedAIResponse = async (cacheKey: string, request: any) => {
  // Check cache first
  const cached = localStorage.getItem(`ai_cache_${cacheKey}`)
  if (cached) {
    const { timestamp, data } = JSON.parse(cached)
    const isExpired = Date.now() - timestamp > 3600000 // 1 hour
    
    if (!isExpired) {
      return data
    }
  }
  
  // Make AI request
  const response = await callAI(request)
  
  // Cache the response
  localStorage.setItem(`ai_cache_${cacheKey}`, JSON.stringify({
    timestamp: Date.now(),
    data: response
  }))
  
  return response
}
```

---

## Error Handling

### Common Error Types
```typescript
// Provider Errors
{
  success: false,
  error: "OpenAI API Error: Rate limit exceeded",
  smart_code: "HERA.AI.ERROR.PROVIDER.RATE_LIMIT.v1"
}

// Input Validation Errors  
{
  success: false,
  error: "Prompt is required for custom AI requests",
  smart_code: "HERA.AI.ERROR.MISSING_PROMPT.v1"
}

// Fallback Exhausted
{
  success: false,
  error: "All AI providers failed. Last error: Network timeout",
  smart_code: "HERA.AI.ERROR.ALL_PROVIDERS_FAILED.v1"
}
```

### Error Recovery Patterns
```typescript
const robustAICall = async (request: any, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          fallback_enabled: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        return result.data
      }
      
      // If this was the last attempt, throw error
      if (attempt === maxRetries) {
        throw new Error(result.error)
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
}
```

---

## Performance & Costs

### Performance Optimization
```typescript
// 1. Batch similar requests
const batchSimilarRequests = async (prompts: string[]) => {
  const requests = prompts.map(prompt => ({
    smart_code: 'HERA.AI.BATCH.PROCESS.v1',
    task_type: 'analysis',
    prompt,
    max_tokens: 500
  }))
  
  return await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batch_request',
      requests
    })
  })
}

// 2. Use appropriate token limits
const efficientRequest = {
  smart_code: 'HERA.AI.SUMMARY.SHORT.v1',
  task_type: 'analysis',
  prompt: 'Summarize this report in 3 bullet points',
  max_tokens: 150 // Precise limit for short responses
}

// 3. Cache expensive operations
const expensiveAnalysis = {
  smart_code: 'HERA.AI.ANALYSIS.DEEP.v1',
  task_type: 'analysis',
  prompt: 'Analyze 1000 customer reviews for sentiment and themes',
  max_tokens: 2000,
  cache_enabled: true // Enable caching for expensive requests
}
```

### Cost Monitoring
```typescript
// Track AI costs across your application
const trackAICosts = async (request: any) => {
  const response = await callAI(request)
  
  // Log cost for monitoring
  console.log(`AI Cost: $${response.cost_estimate.toFixed(4)}`)
  console.log(`Provider: ${response.provider_used}`)
  console.log(`Tokens: ${response.tokens_used}`)
  
  // Send to analytics
  analytics.track('ai_request', {
    provider: response.provider_used,
    cost: response.cost_estimate,
    tokens: response.tokens_used,
    confidence: response.confidence_score
  })
  
  return response
}
```

---

## System Status & Health

### Check Provider Status
```typescript
// Get real-time provider status
const status = await fetch('/api/v1/ai/universal?action=status')
const statusData = await status.json()

console.log('Available Providers:', statusData.data.providers)
console.log('System Health:', statusData.data.system_health)
```

### Clear AI Cache
```typescript
// Clear system cache when needed
await fetch('/api/v1/ai/universal?action=clear_cache')
```

### Get System Capabilities
```typescript
// Discover all AI capabilities
const capabilities = await fetch('/api/v1/ai/universal?action=capabilities')
const capData = await capabilities.json()

console.log('Supported Tasks:', capData.data.supported_tasks)
console.log('Available Actions:', capData.data.available_actions)
console.log('Smart Codes:', capData.data.smart_codes)
```

---

## 🚀 Next Steps

1. **Start Simple**: Use basic `custom_request` calls for general AI tasks
2. **Add Specificity**: Implement task-specific Smart Codes for better results
3. **Enable Fallbacks**: Always set `fallback_enabled: true` for reliability
4. **Monitor Performance**: Track costs and response times in production
5. **Scale Gradually**: Use batch processing for high-volume operations

**The HERA Universal AI System makes AI integration effortless and reliable!** 🤖✨

---

*For technical support or questions, refer to the HERA development team or check the API status at `/api/v1/ai/universal?action=status`*