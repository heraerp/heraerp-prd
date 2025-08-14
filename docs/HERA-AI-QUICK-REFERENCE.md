# HERA Universal AI - Quick Reference Guide

**🤖 Copy-paste examples for instant AI integration**

## 🚀 Quick Start Examples

### 1. Basic AI Chat
```typescript
const aiChat = async (message: string) => {
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'custom_request',
      smart_code: 'HERA.AI.CHAT.COMPLETION.v1',
      task_type: 'chat',
      prompt: message,
      fallback_enabled: true
    })
  })
  
  const result = await response.json()
  return result.success ? result.data.content : 'AI unavailable'
}

// Usage
const answer = await aiChat('Explain blockchain technology')
```

### 2. CA Learning Questions
```typescript
const generateCAQuestions = async (topic: string, difficulty = 'medium') => {
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_ca_questions',
      topic,
      difficulty,
      count: 5
    })
  })
  
  return response.json()
}

// Usage
const questions = await generateCAQuestions('GST Registration')
```

### 3. Business Intelligence
```typescript
const analyzeBusinessData = async (data: any) => {
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'generate_business_insights',
      business_data: data
    })
  })
  
  const result = await response.json()
  return result.data.content
}

// Usage
const insights = await analyzeBusinessData({
  revenue: 150000,
  expenses: 120000,
  industry: 'restaurant'
})
```

### 4. Real-time Streaming
```typescript
const streamAI = async (prompt: string, onChunk: (chunk: string) => void) => {
  const response = await fetch('/api/v1/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      smart_code: 'HERA.AI.STREAM.CHAT.v1',
      task_type: 'chat',
      prompt
    })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (reader) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        if (data.type === 'content') {
          onChunk(data.chunk)
        }
      }
    }
  }
}

// Usage
await streamAI('Explain quantum computing', (chunk) => {
  console.log('Received:', chunk)
})
```

## 🎯 Smart Codes Reference

### Learning & Education
```typescript
'HERA.CA.AI.EXPLAIN.CONCEPT.v1'      // Explain CA concepts
'HERA.CA.AI.GENERATE.QUESTIONS.v1'   // Generate practice questions
'HERA.CA.AI.ASSESS.STUDENT.v1'       // Assess student performance
'HERA.CA.AI.FEEDBACK.QUIZ.v1'        // Provide quiz feedback
'HERA.EDU.AI.TUTOR.ADAPTIVE.v1'      // Adaptive tutoring

// Universal Education Dashboard Smart Codes
'HERA.EDU.DASHBOARD.v1'              // Main dashboard functionality
'HERA.EDU.AI.TUTOR.v1'              // AI tutoring system
'HERA.EDU.PROGRESS.TRACK.v1'        // Progress tracking
'HERA.EDU.GAMIFICATION.v1'          // Points and achievements
'HERA.CA.EDU.TOPIC.GST.v1'          // CA-specific GST topics
'HERA.MED.EDU.TOPIC.PATH.v1'        // Medical pathology topics
'HERA.LAW.EDU.TOPIC.CONST.v1'       // Legal constitutional law
'HERA.ENG.EDU.TOPIC.MATH.v1'        // Engineering mathematics
```

### Business Intelligence
```typescript
'HERA.BIZ.AI.DATA.INSIGHTS.v1'       // Analyze business data
'HERA.BIZ.AI.REPORT.GENERATE.v1'     // Generate reports
'HERA.BIZ.AI.TREND.ANALYZE.v1'       // Trend analysis
'HERA.BIZ.AI.FORECAST.REVENUE.v1'    // Revenue forecasting
'HERA.BIZ.AI.OPTIMIZE.PROCESS.v1'    // Process optimization
```

### Development & Documentation
```typescript
'HERA.DEV.AI.CODE.GENERATE.v1'       // Generate code
'HERA.DEV.AI.CODE.REVIEW.v1'         // Review code quality
'HERA.DEV.AI.DOCS.API.v1'            // API documentation
'HERA.DEV.AI.DOCS.COMPONENT.v1'      // Component docs
'HERA.DEV.AI.TEST.GENERATE.v1'       // Generate tests
```

### Customer Support
```typescript
'HERA.CRM.AI.SUPPORT.RESPONSE.v1'    // Support responses
'HERA.CRM.AI.SENTIMENT.ANALYZE.v1'   // Sentiment analysis
'HERA.CRM.AI.LEAD.SCORE.v1'          // Lead scoring
'HERA.CRM.AI.EMAIL.GENERATE.v1'      // Email generation
```

## 🛠️ React Hook Pattern

```typescript
// useHeraAI.ts
import { useState, useCallback } from 'react'

interface AIRequest {
  action: string
  smart_code?: string
  task_type?: string
  prompt?: string
  [key: string]: any
}

export const useHeraAI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callAI = useCallback(async (request: AIRequest) => {
    setLoading(true)
    setError(null)
    
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

// Usage in component
const MyComponent = () => {
  const { callAI, loading, error } = useHeraAI()
  const [response, setResponse] = useState('')

  const handleAIRequest = async () => {
    try {
      const result = await callAI({
        action: 'custom_request',
        smart_code: 'HERA.AI.EXPLAIN.CONCEPT.v1',
        task_type: 'learning',
        prompt: 'Explain GST Input Tax Credit'
      })
      
      setResponse(result.content)
    } catch (error) {
      console.error('AI failed:', error)
    }
  }

  return (
    <div>
      <button onClick={handleAIRequest} disabled={loading}>
        {loading ? 'AI Thinking...' : 'Ask AI'}
      </button>
      {error && <div className="error">{error}</div>}
      {response && <div className="response">{response}</div>}
    </div>
  )
}
```

## 📊 Provider Status Check

```typescript
// Check AI system health
const checkAIStatus = async () => {
  const response = await fetch('/api/v1/ai/universal?action=status')
  const status = await response.json()
  
  console.log('Available Providers:', status.data.providers)
  console.log('System Health:', status.data.system_health)
  
  return status.data
}

// Get AI capabilities
const getAICapabilities = async () => {
  const response = await fetch('/api/v1/ai/universal?action=capabilities')
  const caps = await response.json()
  
  console.log('Supported Tasks:', caps.data.supported_tasks)
  console.log('Available Actions:', caps.data.available_actions)
  
  return caps.data
}
```

## 🔄 Batch Processing

```typescript
// Process multiple AI requests
const batchAIRequests = async (requests: any[]) => {
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batch_request',
      requests
    })
  })
  
  const results = await response.json()
  return results.data // Array of all responses
}

// Usage
const requests = [
  {
    smart_code: 'HERA.CA.AI.EXPLAIN.v1',
    task_type: 'learning',
    prompt: 'Explain GST registration'
  },
  {
    smart_code: 'HERA.CA.AI.GENERATE.v1',
    task_type: 'learning',
    prompt: 'Generate questions on Input Tax Credit'
  }
]

const results = await batchAIRequests(requests)
```

## 🔧 Error Handling Best Practices

```typescript
// Robust AI call with retries
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
      
      if (attempt === maxRetries) {
        throw new Error(result.error)
      }
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
    }
  }
}
```

## 📈 Performance Optimization

```typescript
// Cache expensive AI requests
const aiCache = new Map<string, any>()

const cachedAICall = async (request: any, cacheKey: string) => {
  // Check cache first
  if (aiCache.has(cacheKey)) {
    const cached = aiCache.get(cacheKey)
    const isExpired = Date.now() - cached.timestamp > 3600000 // 1 hour
    
    if (!isExpired) {
      return cached.data
    }
  }
  
  // Make AI request
  const response = await fetch('/api/v1/ai/universal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  
  const result = await response.json()
  
  if (result.success) {
    // Cache the response
    aiCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    })
    
    return result.data
  }
  
  throw new Error(result.error)
}
```

## 🎯 Common Patterns

### 1. Learning Assistant
```typescript
const createLearningAssistant = (topic: string) => ({
  explain: (concept: string) => callAI({
    action: 'custom_request',
    smart_code: 'HERA.CA.AI.EXPLAIN.CONCEPT.v1',
    task_type: 'learning',
    prompt: `Explain ${concept} in ${topic} with examples`
  }),
  
  generateQuestions: (difficulty: string) => callAI({
    action: 'generate_ca_questions',
    topic,
    difficulty,
    count: 5
  }),
  
  assessPerformance: (studentData: any) => callAI({
    action: 'analyze_student_performance',
    student_data: studentData
  })
})

// Usage
const gstAssistant = createLearningAssistant('GST')
const explanation = await gstAssistant.explain('Input Tax Credit')
```

### 1.1. Education Dashboard Assistant
```typescript
// Ready-to-use education platform AI integration
const createEducationDashboard = (domain: string) => ({
  explainConcept: (topic: string) => callAI({
    action: 'custom_request',
    smart_code: `HERA.${domain.toUpperCase()}.EDU.AI.EXPLAIN.v1`,
    task_type: 'learning',
    prompt: `Explain ${topic} for ${domain} students with practical examples`
  }),
  
  generateQuestions: (topic: string, difficulty: string) => callAI({
    action: 'custom_request',
    smart_code: `HERA.${domain.toUpperCase()}.EDU.AI.QUESTIONS.v1`,
    task_type: 'learning',
    prompt: `Generate ${difficulty} level questions on ${topic}`
  }),
  
  trackProgress: (studentId: string, topicId: string, score: number) => callAI({
    action: 'custom_request',
    smart_code: 'HERA.EDU.PROGRESS.TRACK.v1',
    task_type: 'analytics',
    prompt: `Update progress for student ${studentId} on ${topicId} with score ${score}`
  })
})

// Usage for different domains
const caAssistant = createEducationDashboard('CA')
const medicalAssistant = createEducationDashboard('MED')
const legalAssistant = createEducationDashboard('LAW')

// Generate complete learning platform
const generateEducationPlatform = async (config: any) => {
  return callAI({
    action: 'custom_request',
    smart_code: 'HERA.EDU.DASHBOARD.v1',
    task_type: 'learning',
    prompt: `Create education dashboard for ${config.domain} with ${config.subject}`
  })
}
```

### 2. Business Intelligence Helper
```typescript
const createBIHelper = () => ({
  analyzeRevenue: (data: any) => callAI({
    action: 'generate_business_insights',
    business_data: { ...data, focus: 'revenue' }
  }),
  
  predictTrends: (historicalData: any) => callAI({
    action: 'custom_request',
    smart_code: 'HERA.BIZ.AI.TREND.PREDICT.v1',
    task_type: 'analysis',
    prompt: `Analyze trends and predict future performance: ${JSON.stringify(historicalData)}`
  }),
  
  optimizeOperations: (processData: any) => callAI({
    action: 'custom_request',
    smart_code: 'HERA.BIZ.AI.OPTIMIZE.PROCESS.v1',
    task_type: 'analysis',
    prompt: `Suggest process optimizations: ${JSON.stringify(processData)}`
  })
})
```

## 🚨 Important Notes

- **Always enable fallback**: `fallback_enabled: true`
- **Use specific Smart Codes** for better routing
- **Handle errors gracefully** with user-friendly messages
- **Cache expensive requests** to reduce costs
- **Monitor usage** through response metadata
- **Set appropriate token limits** to control costs

---

**📖 Full Documentation**: `/docs/HERA-UNIVERSAL-AI-SYSTEM.md`  
**🔧 API Status**: `/api/v1/ai/universal?action=status`  
**⚡ Get Started**: Copy any example above and start using AI immediately!