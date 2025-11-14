# 🤖 PHASE 1A: Core AI Route - Day 1 Implementation Plan

## 📋 Prerequisites (Must Complete First)
- ✅ Enhanced API v2 Gateway deployed successfully
- ✅ Health check endpoint returning 200 OK
- ✅ Authentication working (retail@heraerp.com)
- ✅ Quick test suite passing (5/5 tests)

**⚠️ Do not start Phase 1A until Enhanced Gateway is fully operational**

---

## 🎯 Day 1 Objectives (4-6 hours)

### **Morning Session (2-3 hours): Basic Claude Integration**

**Goal**: Get Claude API responding through HERA gateway

**Tasks**:
1. **Add Anthropic SDK Import** (30 minutes)
2. **Implement Basic AI Assistant Handler** (60 minutes)  
3. **Add Environment Variables** (15 minutes)
4. **Test Basic Q&A** (45 minutes)

### **Afternoon Session (2-3 hours): Enhanced AI Features**

**Goal**: Add cost tracking and improved responses

**Tasks**:
1. **Implement Cost Tracking** (60 minutes)
2. **Add Context Management** (60 minutes)
3. **Create AI Usage Logging** (45 minutes)
4. **Test Complete Flow** (15 minutes)

---

## 🔧 Implementation Details

### **File: `/supabase/functions/api-v2/routes/ai-assistant.ts`**

```typescript
// HERA AI Digital Accountant v2.5 - Core AI Route
// Smart Code: HERA.AI.DIGITAL_ACCOUNTANT.ROUTE.v1

import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.24.0"
import { RequestContext } from '../types/middleware.ts'
import { createSuccessResponse, createErrorResponse } from '../lib/utils.ts'
import { trackAIUsage } from '../lib/ai-usage-tracker.ts'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
})

/**
 * HERA AI Digital Accountant - Core Query Handler
 */
export async function handleAIAssistantQuery(
  req: Request,
  context: RequestContext
): Promise<Response> {
  const startTime = performance.now()
  
  try {
    const { query, context: userContext } = await req.json()
    
    // Validate input
    if (!query || typeof query !== 'string') {
      return createErrorResponse(
        new Error('Query is required and must be a string'),
        context.requestId
      )
    }

    // Prepare context for Claude
    const systemPrompt = buildHERASystemPrompt(context.orgId, userContext)
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ 
        role: 'user', 
        content: query 
      }]
    })

    const duration = performance.now() - startTime
    const usage = {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      total_cost: calculateCost(response.usage)
    }

    // Track usage for billing
    await trackAIUsage({
      actor_user_id: context.actorUserEntityId,
      organization_id: context.orgId,
      model: 'claude-3-sonnet',
      query,
      response: response.content[0].text,
      usage,
      duration,
      request_id: context.requestId
    })

    return createSuccessResponse({
      message: response.content[0].text,
      usage,
      duration,
      model: 'claude-3-sonnet',
      request_id: context.requestId
    }, context.requestId)

  } catch (error) {
    return createErrorResponse(error, context.requestId)
  }
}

/**
 * Build HERA-specific system prompt for Claude
 */
function buildHERASystemPrompt(orgId: string, userContext?: any): string {
  return `You are the HERA AI Digital Accountant, an intelligent assistant for enterprise accounting and finance.

Key Capabilities:
- Financial analysis and reporting
- Chart of accounts management  
- Transaction analysis and insights
- Compliance and audit support
- Business intelligence and KPIs

Context:
- Organization ID: ${orgId}
- System: HERA ERP Platform
- Version: v2.5 Enhanced AI

Guidelines:
- Provide accurate, professional financial guidance
- Reference HERA's Sacred Six architecture when relevant
- Suggest specific actions and next steps
- Maintain confidentiality and data security
- Format responses clearly with sections and bullet points

${userContext ? `Additional Context: ${JSON.stringify(userContext)}` : ''}

Respond helpfully and professionally to the user's query.`
}

/**
 * Calculate cost based on Claude usage
 */
function calculateCost(usage: any): number {
  // Claude 3 Sonnet pricing (approximate)
  const INPUT_COST_PER_1K = 0.003  // $0.003 per 1K input tokens
  const OUTPUT_COST_PER_1K = 0.015 // $0.015 per 1K output tokens
  
  const inputCost = (usage.input_tokens / 1000) * INPUT_COST_PER_1K
  const outputCost = (usage.output_tokens / 1000) * OUTPUT_COST_PER_1K
  
  return inputCost + outputCost
}
```

### **File: `/supabase/functions/api-v2/lib/ai-usage-tracker.ts`**

```typescript
// AI Usage Tracking for HERA Digital Accountant
// Smart Code: HERA.AI.USAGE.TRACKER.v1

import { createServiceRoleClient } from './supabase-client.ts'

export interface AIUsageData {
  actor_user_id: string
  organization_id: string
  model: string
  query: string
  response: string
  usage: {
    input_tokens: number
    output_tokens: number
    total_cost: number
  }
  duration: number
  request_id: string
}

/**
 * Track AI usage for billing and analytics
 */
export async function trackAIUsage(data: AIUsageData): Promise<void> {
  const supabase = createServiceRoleClient()
  
  try {
    // Create transaction for AI usage tracking
    const { error } = await supabase.rpc('hera_txn_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: data.actor_user_id,
      p_organization_id: data.organization_id,
      p_transaction: {
        transaction_type: 'ai_usage',
        smart_code: 'HERA.AI.USAGE.TXN.CLAUDE.v1',
        total_amount: data.usage.total_cost,
        transaction_currency_code: 'USD',
        transaction_date: new Date().toISOString().split('T')[0]
      },
      p_lines: [{
        line_number: 1,
        line_type: 'AI_USAGE',
        description: `Claude ${data.model} - ${data.usage.input_tokens + data.usage.output_tokens} tokens`,
        quantity: 1,
        unit_amount: data.usage.total_cost,
        line_amount: data.usage.total_cost,
        smart_code: 'HERA.AI.USAGE.LINE.TOKENS.v1',
        line_data: {
          model: data.model,
          input_tokens: data.usage.input_tokens,
          output_tokens: data.usage.output_tokens,
          duration_ms: data.duration,
          request_id: data.request_id,
          query_hash: btoa(data.query).slice(0, 32) // Hash for privacy
        }
      }],
      p_options: {
        auto_post: true,
        category: 'ai_usage'
      }
    })

    if (error) {
      console.error('Failed to track AI usage:', error)
      // Don't throw - usage tracking failure shouldn't break AI response
    }
  } catch (error) {
    console.error('AI usage tracking error:', error)
    // Continue silently - tracking is nice-to-have, not critical
  }
}

/**
 * Get AI usage summary for organization
 */
export async function getAIUsageSummary(
  organizationId: string,
  timeframe: string = '7d'
): Promise<any> {
  const supabase = createServiceRoleClient()
  
  // Calculate date range
  const days = parseInt(timeframe.replace('d', ''))
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('universal_transactions')
    .select(`
      total_amount,
      transaction_date,
      universal_transaction_lines (
        line_data
      )
    `)
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'ai_usage')
    .gte('transaction_date', fromDate.toISOString().split('T')[0])
    .order('transaction_date', { ascending: false })

  if (error) {
    throw new Error(`Failed to get AI usage: ${error.message}`)
  }

  // Aggregate usage statistics
  let totalCost = 0
  let totalTokens = 0
  let requestCount = 0

  for (const transaction of data) {
    totalCost += transaction.total_amount || 0
    requestCount += 1
    
    for (const line of transaction.universal_transaction_lines) {
      const lineData = line.line_data
      if (lineData?.input_tokens && lineData?.output_tokens) {
        totalTokens += lineData.input_tokens + lineData.output_tokens
      }
    }
  }

  return {
    timeframe,
    total_cost: totalCost,
    total_tokens: totalTokens,
    request_count: requestCount,
    average_cost_per_request: requestCount > 0 ? totalCost / requestCount : 0,
    organization_id: organizationId
  }
}
```

---

## 🧪 Day 1 Testing Plan

### **Test 1: Basic Claude Integration**
```bash
curl -X POST \
  "https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2/ai/assistant" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: 378f24fb-d496-4ff7-8afa-ea34895a0eb8" \
  -d '{
    "query": "Hello, what can you help me with?"
  }'
```

**Expected Response**:
```json
{
  "data": {
    "message": "Hello! I'm the HERA AI Digital Accountant...",
    "usage": {
      "input_tokens": 45,
      "output_tokens": 120,
      "total_cost": 0.0021
    },
    "model": "claude-3-sonnet",
    "request_id": "uuid"
  }
}
```

### **Test 2: Cost Tracking Verification**
```bash
curl -X GET \
  "https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2/ai/usage?timeframe=1d" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "X-Organization-Id: 378f24fb-d496-4ff7-8afa-ea34895a0eb8"
```

**Expected Response**:
```json
{
  "data": {
    "timeframe": "1d",
    "total_cost": 0.0021,
    "total_tokens": 165,
    "request_count": 1,
    "average_cost_per_request": 0.0021
  }
}
```

---

## 🎯 Success Criteria for Day 1

**Morning Session Complete When**:
- ✅ Claude API responding through HERA gateway
- ✅ Basic Q&A working with system prompt
- ✅ No authentication or routing errors
- ✅ Response times < 2 seconds

**Day 1 Complete When**:
- ✅ AI cost tracking working
- ✅ Usage analytics available
- ✅ Professional AI responses with HERA context
- ✅ All endpoints tested and working

---

## 🔗 Day 2 Preparation

**Tomorrow's Focus**: AI Tools Registry & Executor Framework
- Implement tool calling capabilities
- Add KPI generation tools
- Create report generation framework
- Build email drafting tools

---

## 📞 Day 1 Support

**Environment Variables Needed**:
```bash
# Required for Day 1:
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional for enhanced features:
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

**Add these in Supabase Dashboard → Settings → Edge Functions → Secrets**

---

**🚀 Ready to begin Day 1 after Enhanced Gateway deployment is complete!**